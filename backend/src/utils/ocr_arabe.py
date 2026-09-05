# -*- coding: utf-8 -*-
"""
Pipeline OCR Avancé pour Documents Tunisiens et Arabes (Bilingue Arabe / Français)
Support : Carte d'Identité Nationale (CIN Recto/Verso), Bulletin de Paie,
          Relevé Bancaire (RIB), Factures de Service (STEG/SONEDE).
Moteur  : EasyOCR + Prétraitement OpenCV Avancé + Normalisation BiDi/Reshaper.
"""

import sys
import os
import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple

# Forcer l'encodage UTF-8 sur Windows
if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import cv2
import numpy as np
from PIL import Image, ImageOps

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError:
    arabic_reshaper = None
    get_display = None

logger = logging.getLogger("OCRArabe")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class OCRArabe:
    _reader_instance = None

    def __init__(self, gpu: bool = False):
        """
        Initialise le lecteur EasyOCR en mode Singleton pour optimiser la mémoire
        et le temps de chargement des poids du réseau neuronal.
        """
        import easyocr
        if OCRArabe._reader_instance is None:
            logger.info("Chargement des modèles EasyOCR (ar, en)...")
            OCRArabe._reader_instance = easyocr.Reader(
                ['ar', 'en'],
                gpu=gpu,
                verbose=False
            )
            logger.info("Modèles EasyOCR initialisés avec succès.")
        self.reader = OCRArabe._reader_instance

    # ── Étape 1 : Prétraitement OpenCV ──────────────────────────────
    @staticmethod
    def corriger_orientation_auto(img: np.ndarray) -> np.ndarray:
        """
        Si l'image est en mode portrait (hauteur > largeur), alors qu'une carte CIN
        est au format paysage, l'image est tournée de 90° anti-horaire vers l'horizontale.
        """
        if img is None:
            return None
        h, w = img.shape[:2]
        if h > w * 1.05:
            logger.info(f"Auto-orientation OCR : rotation 90° anti-horaire ({w}x{h} -> {h}x{w})")
            return cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        return img

    @staticmethod
    def charger_image_securisee(image_path: str) -> np.ndarray:
        """
        Charge une image de manière sécurisée en supportant les chemins avec caractères
        Unicode et accents sur Windows (compatible avec cv2.imdecode et PIL ImageOps).
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Fichier image introuvable : {image_path}")

        try:
            pil_img = Image.open(image_path)
            pil_img = ImageOps.exif_transpose(pil_img)
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            if img is not None:
                return OCRArabe.corriger_orientation_auto(img)
        except Exception:
            pass

        try:
            with open(image_path, "rb") as f:
                bytes_data = bytearray(f.read())
                numpy_array = np.asarray(bytes_data, dtype=np.uint8)
                img = cv2.imdecode(numpy_array, cv2.IMREAD_COLOR)
                if img is not None:
                    return OCRArabe.corriger_orientation_auto(img)
        except Exception as e:
            logger.warning(f"Échec de lecture buffer pour {image_path}: {e}")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Format d'image non supporté ou fichier corrompu : {image_path}")
        return OCRArabe.corriger_orientation_auto(img)

    def pretraiter(self, image_path: str) -> np.ndarray:
        """
        Pipeline complet de prétraitement d'image pour optimiser la reconnaissance
        de caractères arabes et français :
        1. Redimensionnement adaptatif (Cubic Interpolation)
        2. Amélioration de contraste CLAHE
        3. Débruitage non-local means
        4. Redressement / Deskew automatique
        5. Binarisation adaptative
        6. Fermeture morphologique pour relier les ligatures arabes
        """
        img = self.charger_image_securisee(image_path)

        # 1. Agrandir si la résolution est basse (< 1400px de large)
        h, w = img.shape[:2]
        if w < 1400:
            scale = 1400 / float(w)
            img = cv2.resize(
                img, None,
                fx=scale, fy=scale,
                interpolation=cv2.INTER_CUBIC
            )

        # 2. Amélioration de contraste via l'espace LAB + CLAHE
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        limg = cv2.merge((cl, a_channel, b_channel))
        contrast_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # 3. Niveaux de gris
        gray = cv2.cvtColor(contrast_img, cv2.COLOR_BGR2GRAY)

        # 4. Débruitage bilatéral préservant les contours fins
        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

        # 5. Correction automatique d'inclinaison (Deskew)
        try:
            coords = np.column_stack(np.where(denoised < 130))
            if len(coords) > 50:
                rect = cv2.minAreaRect(coords)
                angle = rect[-1]
                if angle < -45:
                    angle = 90 + angle
                # Ne corriger que les inclinaisons légères à modérées (-35° à +35°)
                if 0.5 < abs(angle) < 35.0:
                    (dh, dw) = denoised.shape
                    center = (dw // 2, dh // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    denoised = cv2.warpAffine(
                        denoised, M, (dw, dh),
                        flags=cv2.INTER_CUBIC,
                        borderMode=cv2.BORDER_REPLICATE
                    )
        except Exception as e:
            logger.debug(f"Deskew omis: {e}")

        # 6. Binarisation adaptative Gaussienne
        binary = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 11
        )

        # 7. Morphologie : relier les ligatures arabes sans épaissir le bruit
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        return binary

    # ── Étape 2 : Inférence EasyOCR Multi-passes ────────────────────
    def lire(self, image_path: str) -> List[Tuple[str, float]]:
        """
        Exécute la lecture OCR sur l'image orientée et sur l'image prétraitée,
        puis fusionne les résultats pour maximiser le rappel et la précision.
        Retourne une liste de tuples (texte, score_confiance).
        """
        img_base = self.charger_image_securisee(image_path) if isinstance(image_path, str) else image_path

        # Passe 1 : Image orientée
        try:
            res_orig = self.reader.readtext(
                img_base,
                detail=1,
                paragraph=False,
                text_threshold=0.35,
                low_text=0.25,
                decoder='greedy'
            )
        except Exception as e:
            logger.warning(f"Erreur OCR image originale: {e}")
            res_orig = []

        # Passe 2 : Image prétraitée
        try:
            img_traitee = self.pretraiter(image_path)
            res_trait = self.reader.readtext(
                img_traitee,
                detail=1,
                paragraph=False,
                text_threshold=0.35,
                low_text=0.25
            )
        except Exception as e:
            logger.warning(f"Erreur OCR image prétraitée: {e}")
            res_trait = []

        # Fusion dédoublonnée et triée par confiance
        vus = set()
        meilleurs: List[Tuple[str, float]] = []

        for item in (res_orig + res_trait):
            if len(item) == 3:
                _, texte, conf = item
            else:
                texte, conf = item[0], 0.5

            cleaned = texte.strip()
            if not cleaned or float(conf) < 0.25:
                continue

            # Clé normalisée pour éviter les doublons textuels quasi-identiques
            norm_key = re.sub(r'[\s\-_.,:;]', '', cleaned)
            if norm_key not in vus:
                vus.add(norm_key)
                meilleurs.append((cleaned, float(conf)))

        return sorted(meilleurs, key=lambda x: x[1], reverse=True)

    def lire_avec_boites(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Retourne les textes détectés avec leurs coordonnées géométriques (bounding boxes)
        et scores de confiance pour la visualisation ou l'inspection UI.
        Gère automatiquement l'orientation et teste une rotation de secours à 180°.
        """
        img = self.charger_image_securisee(image_path) if isinstance(image_path, str) else image_path

        raw_results = self.reader.readtext(
            img,
            detail=1,
            paragraph=False,
            text_threshold=0.35,
            low_text=0.25
        )

        # Si le numéro CIN ou les mots-clés essentiels ne sont pas détectés, tester 180°
        concat_txt = " ".join([t for _, t, _ in raw_results]) if raw_results else ""
        if not re.search(r'\b\d{8}\b', concat_txt) and ('التعريف' not in concat_txt and 'الجمهورية' not in concat_txt):
            try:
                rot180 = cv2.rotate(img, cv2.ROTATE_180)
                res180 = self.reader.readtext(rot180, detail=1, paragraph=False, text_threshold=0.35, low_text=0.25)
                txt180 = " ".join([t for _, t, _ in res180])
                if re.search(r'\b\d{8}\b', txt180) or ('التعريف' in txt180 or 'الجمهورية' in txt180):
                    raw_results = res180
            except Exception:
                pass

        boites = []
        for bbox, text, conf in raw_results:
            clean_text = text.strip()
            if clean_text:
                boites.append({
                    "texte": clean_text,
                    "confiance": round(float(conf), 3),
                    "bbox": [[int(pt[0]), int(pt[1])] for pt in bbox]
                })
        return boites

    # ── Helpers : Normalisation Linguistique & Chiffres ─────────────
    @staticmethod
    def normaliser_chiffres(texte: str) -> str:
        """Convertit les chiffres arabes orientaux et persans en chiffres occidentaux."""
        if not texte:
            return ""
        table = str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789')
        return texte.translate(table)

    @staticmethod
    def nettoyer_texte_arabe(texte: str) -> str:
        """
        Supprime le Tashkeel (harakat), les tatweel (kashida),
        et standardise les variantes d'Alif et de Ta Marbuta pour faciliter le matching.
        """
        if not texte:
            return ""
        t = OCRArabe.normaliser_chiffres(texte)
        # Supprimer le Tashkeel
        t = re.sub(r'[\u064B-\u065F\u0670]', '', t)
        # Supprimer le Tatweel
        t = re.sub(r'ـ+', '', t)
        # Standardiser les Alifs (أ إ آ -> ا)
        t = re.sub(r'[إأآٱ]', 'ا', t)
        # Standardiser Taa Marbuta
        t = re.sub(r'ة', 'ه', t)
        return t

    @staticmethod
    def formater_arabe_visuel(texte: str) -> str:
        """Met en forme l'arabe avec reshaping et bidi pour l'affichage console/terminal."""
        if not texte:
            return ""
        if arabic_reshaper and get_display:
            try:
                reshaped = arabic_reshaper.reshape(texte)
                return get_display(reshaped)
            except Exception:
                pass
        return texte

    # ── Étape 3 : Extraction Dédiée — Carte d'Identité Tunisienne (CIN) ───
    def extraire_cin(self, image_path: str, resultats: Optional[List[Tuple[str, float]]] = None) -> Dict[str, Any]:
        """
        Extrait les données de la CIN tunisienne (Recto et Verso) :
        - Numéro CIN (8 chiffres)
        - Nom et prénom (Arabe et Français)
        - Date de naissance (format JJ/MM/AAAA)
        - Lieu de naissance ou d'émission (Gouvernorat / Ville)
        - Profession / الصفة
        - Date de délivrance / Validité
        """
        if resultats is None:
            resultats = self.lire(image_path)
        lignes = [t for t, _ in resultats]
        texte_brut = " ".join(lignes)
        texte_norm = self.nettoyer_texte_arabe(texte_brut)

        champs: Dict[str, Any] = {}
        confiances: Dict[str, float] = {}

        # 1. Numéro de CIN (8 chiffres consécutifs en Tunisie)
        # Gestion des cas avec espaces ou tirets insérés par l'OCR (ex: 08 123 456 ou 0|N: 08735432)
        cin_match = re.search(r'\b(\d{8})\b', texte_norm)
        if cin_match:
            champs['numero_cin'] = cin_match.group(1)
            confiances['numero_cin'] = 0.98
        else:
            cin_spaced = re.search(r'\b(\d[\d\s\-]{6,11}\d)\b', texte_norm)
            if cin_spaced:
                digits = re.sub(r'\D', '', cin_spaced.group(1))
                if len(digits) == 8:
                    champs['numero_cin'] = digits
                    confiances['numero_cin'] = 0.90

        # 2. Date de naissance
        mois_arabes = {
            'جانفي': '01', 'فيفري': '02', 'فيفرى': '02', 'مارس': '03',
            'افريل': '04', 'ماي': '05', 'جوان': '06', 'جويلية': '07',
            'اوت': '08', 'سبتمبر': '09', 'اكتوبر': '10', 'نوفمبر': '11', 'ديسمبر': '12'
        }

        ar_date = re.search(
            r'(\d{1,2})\s*(جانفي|فيفري|فيفرى|مارس|افريل|ماي|جوان|جويلية|اوت|سبتمبر|اكتوبر|نوفمبر|ديسمبر)\s*(\d{4})',
            texte_norm
        )
        if ar_date:
            j = ar_date.group(1).zfill(2)
            m = mois_arabes.get(ar_date.group(2), '01')
            a = ar_date.group(3)
            champs['date_naissance'] = f"{j}/{m}/{a}"
            confiances['date_naissance'] = 0.95
        else:
            # Supporte JJ/MM/AAAA, J/M/AAAA (ex: 15/4/1990)
            dates = re.findall(r'\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.]((?:19|20)\d{2})\b', texte_norm)
            if dates:
                # Filtrer les années de naissance plausibles (1930 à 2015)
                birth_cands = [d for d in dates if 1930 <= int(d[2]) <= 2015]
                if birth_cands:
                    cand = birth_cands[0]
                    champs['date_naissance'] = f"{cand[0].zfill(2)}/{cand[1].zfill(2)}/{cand[2]}"
                    confiances['date_naissance'] = 0.92

        # 3. Nom et Prénom en Arabe (Spécifique CIN Tunisienne : اللقب + الاسم + بنت/ابن)
        prenom_ar = ""
        nom_ar = ""
        pere_ar = ""

        # Mots-clés administratifs à exclure pour le prénom
        mots_exclus = {
            'الاسم', 'اللقب', 'مكانها', 'مكان', 'تاريخ', 'الولادة', 'الورادة', 'الجمهورية',
            'التونسية', 'بطاقة', 'التعريف', 'الوطنية', 'عربية', 'عربيه', 'بنت', 'ابن'
        }
        for g_ar, aliases in gouvernorats.items():
            mots_exclus.add(g_ar)
            for a in aliases:
                mots_exclus.add(a)

        # Recherche de l'entête الاسم
        prenom_match = re.search(r'(?:الاسم|اسم)\s*[:\s]*([\u0600-\u06FF]{2,20})', texte_norm)
        if prenom_match:
            cand = prenom_match.group(1).strip()
            if cand not in mots_exclus:
                prenom_ar = cand

        if not prenom_ar:
            # Recherche de mot isolé avec la plus haute confiance
            candidats_prenom = []
            for t, conf in resultats:
                t_clean = t.strip()
                if re.match(r'^[\u0600-\u06FF]{3,15}$', t_clean) and t_clean not in mots_exclus:
                    candidats_prenom.append((t_clean, conf))
            if candidats_prenom:
                candidats_prenom.sort(key=lambda x: x[1], reverse=True)
                prenom_ar = candidats_prenom[0][0]

        # Recherche du nom de famille / اللقب (ex: اللقب بن عربية)
        nom_match = re.search(r'(?:اللقب|لقب)\s*[:\s]*((?:بن\s+)?[\u0600-\u06FF]{2,20})', texte_norm)
        if nom_match:
            nom_ar = nom_match.group(1).strip()

        # Recherche du père / بنت ou ابن (ex: بنت خالد بن علي)
        pere_match = re.search(r'(?:بنت|ابن)\s*[:\s]*([\u0600-\u06FF\s]{3,30})', texte_norm)
        if pere_match:
            pere_ar = pere_match.group(1).strip()
            pere_ar = re.sub(r'\s+(تاريخ|مكان|ولادة|الورادة).*$', '', pere_ar).strip()

        if prenom_ar and nom_ar:
            champs['nom_arabe'] = f"{prenom_ar} {nom_ar}".strip()
            champs['prenom'] = prenom_ar
            champs['nom'] = nom_ar
            confiances['nom_arabe'] = 0.95
        elif nom_ar:
            champs['nom_arabe'] = nom_ar
            champs['nom'] = nom_ar
            confiances['nom_arabe'] = 0.88
        elif prenom_ar:
            champs['nom_arabe'] = prenom_ar
            champs['prenom'] = prenom_ar
            confiances['nom_arabe'] = 0.85

        if pere_ar:
            champs['filiation'] = pere_ar

        # 4. Nom en Français (sur CIN ou verso) - analyse ligne par ligne
        for ligne in lignes:
            nom_fr_match = re.search(r'\b(?:NOM|PRENOM)\s*[:\s]*([A-Za-zÀ-ÿ\s]{3,35})', ligne, re.IGNORECASE)
            if nom_fr_match:
                cand_fr = nom_fr_match.group(1).strip()
                cand_fr = re.sub(r'\b(DATE|NE|LIEU|TUNIS|SFAX|SOUSSE)\b.*$', '', cand_fr, flags=re.IGNORECASE).strip()
                if len(cand_fr) >= 3:
                    champs['nom_francais'] = cand_fr
                    confiances['nom_francais'] = 0.90
                    break

        # 5. Lieu / Gouvernorat tunisien (bilingue Arabe / Français)
        gouvernorats = {
            'تونس': ['تونس', 'tunis'],
            'صفاقس': ['صفاقس', 'sfax'],
            'سوسة': ['سوسة', 'sousse'],
            'أريانة': ['أريانة', 'اريانة', 'ariana'],
            'المنستير': ['المنستير', 'monastir'],
            'نابل': ['نابل', 'nabeul'],
            'بنزرت': ['بنزرت', 'bizerte'],
            'بن عروس': ['بن عروس', 'ben arous'],
            'قابس': ['قابس', 'gabes', 'gabès'],
            'القيروان': ['القيروان', 'kairouan'],
            'المهدية': ['المهدية', 'mahdia'],
            'مدنين': ['مدنين', 'mednine', 'medenine'],
            'باجة': ['باجة', 'beja', 'béja'],
            'جندوبة': ['جندوبة', 'jendouba'],
            'القصرين': ['القصرين', 'kasserine'],
            'سيدي بوزيد': ['سيدي بوزيد', 'sidi bouzid'],
            'سليانة': ['سليانة', 'siliana'],
            'الكاف': ['الكاف', 'le kef', 'kef'],
            'توزر': ['توزر', 'tozeur'],
            'قفصة': ['قفصة', 'gafsa'],
            'قبلي': ['قبلي', 'kebili'],
            'زغوان': ['زغوان', 'zaghouan'],
            'منوبة': ['منوبة', 'manouba'],
            'تطاوين': ['تطاوين', 'tataouine']
        }
        lower_raw = texte_brut.lower()
        for g_ar, aliases in gouvernorats.items():
            if any(alias in lower_raw or alias in texte_norm for alias in aliases):
                champs['gouvernorat'] = g_ar
                confiances['gouvernorat'] = 0.92
                break

        # 6. Profession / الصفة
        prof_match = re.search(r'(?:المهنه|الصفه|مهنه|صفه)\s*[:\s]*([^\d\n]{3,25})', texte_norm)
        if prof_match:
            champs['profession'] = prof_match.group(1).strip()
            confiances['profession'] = 0.80

        # Score global de fiabilité du document
        avg_conf = sum(confiances.values()) / max(1, len(confiances))

        return {
            "type_document": "CIN_TUNISIENNE",
            "champs": champs,
            "confiances": {k: round(v, 2) for k, v in confiances.items()},
            "score_global": round(avg_conf * 100, 1),
            "valide": "numero_cin" in champs
        }

    # ── Étape 4 : Extraction Dédiée — Fiche de Paie / Bulletin de Salaire ──
    def extraire_fiche_paie(self, image_path: str, resultats: Optional[List[Tuple[str, float]]] = None) -> Dict[str, Any]:
        """
        Extrait les données financières et administratives d'un bulletin de paie tunisien :
        - Salaire Net à payer (avec gestion des millimes tunisiens à 3 décimales ex: 1 850,500)
        - Salaire Brut
        - Employeur / Société
        - Matricule CNSS
        - Période / Mois
        """
        if resultats is None:
            resultats = self.lire(image_path)
        lignes = [t for t, _ in resultats]
        texte_brut = " ".join(lignes)
        texte_norm = self.nettoyer_texte_arabe(texte_brut)

        champs: Dict[str, Any] = {}
        confiances: Dict[str, float] = {}

        # 1. Salaire Net (Net à payer / الصافي للدفع)
        net_pattern = re.search(
            r'(?:net\s*a\s*payer|salaire\s*net|total\s*net|الصافي\s*للدفع|صافي\s*المرتب|الصافي)\s*[:\s]*([\d\s]{3,10}[,\.]\d{1,3})',
            texte_norm,
            re.IGNORECASE
        )
        if net_pattern:
            val = net_pattern.group(1).replace(' ', '').replace(',', '.')
            champs['salaire_net'] = float(val)
            confiances['salaire_net'] = 0.95
        else:
            salaires = re.findall(r'\b(\d{3,6}[,\.]\d{1,3})\b', texte_norm)
            if salaires:
                valeurs = [float(s.replace(',', '.')) for s in salaires if 300.0 <= float(s.replace(',', '.')) <= 25000.0]
                if valeurs:
                    champs['salaire_net'] = max(valeurs)
                    confiances['salaire_net'] = 0.75

        # 2. Salaire Brut
        brut_pattern = re.search(
            r'(?:salaire\s*brut|total\s*brut|brut|المرتب\s*الخام|الخام)\s*[:\s]*([\d\s]{3,10}[,\.]\d{1,3})',
            texte_norm,
            re.IGNORECASE
        )
        if brut_pattern:
            val_b = brut_pattern.group(1).replace(' ', '').replace(',', '.')
            champs['salaire_brut'] = float(val_b)
            confiances['salaire_brut'] = 0.90

        # 3. Nom de l'employeur / Société
        employeur_pattern = re.search(
            r'(?:المؤسسه|صاحب\s*العمل|الشركه|Employeur|Societe|Entreprise|Raison\s*Sociale)\s*[:\s]*([^\d\n\r]{3,45})',
            texte_norm,
            re.IGNORECASE
        )
        if employeur_pattern:
            champs['employeur'] = employeur_pattern.group(1).strip()
            confiances['employeur'] = 0.88

        # 4. Matricule CNSS (8 ou 10 chiffres)
        cnss_match = re.search(r'(?:CNSS|c\.n\.s\.s|ضمان\s*اجتماعي)\s*[:\s]*(\d{8,10})', texte_norm, re.IGNORECASE)
        if cnss_match:
            champs['matricule_cnss'] = cnss_match.group(1)
            confiances['matricule_cnss'] = 0.92

        # 5. Mois / Période
        mois_pattern = re.search(
            r'\b(جانفي|فيفري|فيفرى|مارس|افريل|ماي|جوان|جويلية|اوت|سبتمبر|اكتوبر|نوفمبر|ديسمبر)\b',
            texte_norm
        )
        if mois_pattern:
            champs['mois'] = mois_pattern.group(1)
            confiances['mois'] = 0.90
        else:
            periode_match = re.search(r'\b(0[1-9]|1[0-2])[/\-\.](20\d{2})\b', texte_norm)
            if periode_match:
                champs['mois'] = f"{periode_match.group(1)}/{periode_match.group(2)}"
                confiances['mois'] = 0.85

        avg_conf = sum(confiances.values()) / max(1, len(confiances))

        return {
            "type_document": "FICHE_DE_PAIE",
            "champs": champs,
            "confiances": {k: round(v, 2) for k, v in confiances.items()},
            "score_global": round(avg_conf * 100, 1),
            "valide": "salaire_net" in champs
        }

    # ── Étape 5 : Extraction Dédiée — Relevé Bancaire (RIB) ─────────
    def extraire_releve_bancaire(self, image_path: str, resultats: Optional[List[Tuple[str, float]]] = None) -> Dict[str, Any]:
        """
        Extrait les données clés d'un relevé bancaire ou attestation de RIB tunisien :
        - RIB Tunisien (20 chiffres : Code Banque (2) + Code Guichet (3) + N° Compte (13) + Clé (2))
        - Nom de la Banque (ex: STB, BIAT, BNA, Attijari, BH, etc.)
        - Solde / Titulaire
        """
        if resultats is None:
            resultats = self.lire(image_path)
        lignes = [t for t, _ in resultats]
        texte_brut = " ".join(lignes)
        texte_norm = self.nettoyer_texte_arabe(texte_brut)

        champs: Dict[str, Any] = {}
        confiances: Dict[str, float] = {}

        # 1. RIB Tunisien (20 chiffres)
        rib_match = re.search(r'\b(\d{20})\b', texte_norm)
        if rib_match:
            champs['rib'] = rib_match.group(1)
            confiances['rib'] = 0.98
        else:
            rib_spaced = re.search(r'\b(\d[\d\s\-]{18,25}\d)\b', texte_norm)
            if rib_spaced:
                digits = re.sub(r'\D', '', rib_spaced.group(1))
                if len(digits) == 20:
                    champs['rib'] = digits
                    confiances['rib'] = 0.92

        # 2. Identification de la Banque
        banques = {
            'STB': ['stb', 'societe tunisienne de banque', 'الشركه التونسيه للبنك', 'الشركة التونسية للبنك'],
            'BIAT': ['biat', 'banque internationale arabe de tunisie'],
            'BNA': ['bna', 'banque nationale agricole'],
            'ATTIJARI': ['attijari', 'attijari bank', 'التجاري بنك'],
            'BH': ['bh', 'banque de l habitat'],
            'AMEN': ['amen bank', 'بنك الامان'],
            'UIB': ['uib', 'union internationale de banques'],
            'BT': ['banque de tunisie']
        }
        upper_text = texte_brut.upper()
        for b_code, aliases in banques.items():
            for alias in aliases:
                if alias.upper() in upper_text or alias in texte_norm:
                    champs['banque'] = b_code
                    confiances['banque'] = 0.95
                    break
            if 'banque' in champs:
                break

        # 3. Solde (si présent)
        solde_match = re.search(
            r'(?:solde\s*(?:au|disponible|crediteur|nouveau)?|الرصيد)\s*[:\s]*([\d\s]{3,10}[,\.]\d{1,3})',
            texte_norm,
            re.IGNORECASE
        )
        if solde_match:
            val_s = solde_match.group(1).replace(' ', '').replace(',', '.')
            champs['solde'] = float(val_s)
            confiances['solde'] = 0.85

        avg_conf = sum(confiances.values()) / max(1, len(confiances))

        return {
            "type_document": "RELEVE_BANCAIRE",
            "champs": champs,
            "confiances": {k: round(v, 2) for k, v in confiances.items()},
            "score_global": round(avg_conf * 100, 1),
            "valide": "rib" in champs
        }

    # ── Étape 6 : Analyseur Automatique de Document ─────────────────
    def analyser_document(self, image_path: str, type_doc: Optional[str] = None, resultats: Optional[List[Tuple[str, float]]] = None) -> Dict[str, Any]:
        """
        Détecte automatiquement le type de document si non spécifié,
        et applique l'extracteur ciblé approprié.
        """
        if resultats is None:
            resultats = self.lire(image_path)

        if type_doc:
            doc_type_clean = type_doc.lower().strip()
            if doc_type_clean in ['cin', 'cin_recto', 'cin_verso', 'identite']:
                return self.extraire_cin(image_path, resultats)
            elif doc_type_clean in ['paie', 'fiche_paie', 'fiche-paie', 'payslip', 'bulletin']:
                return self.extraire_fiche_paie(image_path, resultats)
            elif doc_type_clean in ['rib', 'releve', 'releve_bancaire', 'banque']:
                return self.extraire_releve_bancaire(image_path, resultats)

        # Détection automatique basée sur les mots-clés OCR
        texte_concat = " ".join([t for t, _ in resultats]).lower()
        texte_concat_norm = self.nettoyer_texte_arabe(texte_concat)

        # Signatures CIN
        if any(w in texte_concat_norm or w in texte_concat for w in ['تعريف', 'بطاقه', 'جمهوريه', 'identite', 'carte nationale']):
            return self.extraire_cin(image_path, resultats)

        # Signatures Fiche de paie
        if any(w in texte_concat_norm or w in texte_concat for w in ['bulletin', 'paie', 'salaire', 'مرتب', 'اجر', 'cnss', 'net a payer']):
            return self.extraire_fiche_paie(image_path, resultats)

        # Signatures Relevé / RIB
        if any(w in texte_concat_norm or w in texte_concat for w in ['rib', 'releve', 'compte', 'bancaire', 'banque', 'رصيد', 'بنك']):
            return self.extraire_releve_bancaire(image_path, resultats)

        # Par défaut, tenter l'extraction CIN puis Fiche de paie
        cin_res = self.extraire_cin(image_path, resultats)
        if cin_res["valide"]:
            return cin_res

        paie_res = self.extraire_fiche_paie(image_path, resultats)
        if paie_res["valide"]:
            return paie_res

        return {
            "type_document": "DOCUMENT_GENERIQUE",
            "champs": {},
            "confiances": {},
            "score_global": 0.0,
            "valide": False,
            "message": "Aucun format connu de document tunisien détecté avec certitude."
        }

    # ── Console d'Affichage Interactif ──────────────────────────────
    def afficher(self, image_path: str, type_doc: Optional[str] = None):
        """Affiche les résultats d'extraction dans la console de façon lisible."""
        print(f"\n{'='*55}")
        print(f"📄 Analyse OCR : {os.path.basename(image_path)}")
        print(f"{'='*55}")

        resultats = self.lire(image_path)
        print(f"\n📝 Textes reconnus ({len(resultats)}) :")
        for texte, conf in resultats[:12]:  # Afficher les 12 premiers
            texte_visuel = self.formater_arabe_visuel(texte)
            barre = "#" * int(conf * 10)
            print(f"  [{barre:<10}] {conf:.0%}  ->  {texte_visuel}")

        analyse = self.analyser_document(image_path, type_doc)
        print(f"\n✅ Type détecté : {analyse.get('type_document')}")
        print(f"⭐ Score global  : {analyse.get('score_global')}%")
        print("📌 Champs extraits :")
        for k, v in analyse.get("champs", {}).items():
            conf = analyse.get("confiances", {}).get(k, 0.0)
            val_visuel = self.formater_arabe_visuel(str(v))
            print(f"  • {k:<18} : {val_visuel} (conf: {conf:.0%})")

        return analyse


# ── Point d'entrée CLI pour intégration Node.js / Terminal ─────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        res = {"success": False, "error": "Argument d'image manquant. Usage: py ocr_arabe.py <image_path> [doc_type]"}
        sys.stdout.buffer.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
        sys.exit(1)

    img_path = sys.argv[1]
    doc_type = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(img_path):
        res = {"success": False, "error": f"Fichier introuvable: {img_path}"}
        sys.stdout.buffer.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
        sys.exit(1)

    try:
        ocr_engine = OCRArabe(gpu=False)
        textes_bruts = ocr_engine.lire(img_path)
        analyse = ocr_engine.analyser_document(img_path, doc_type, resultats=textes_bruts)

        output = {
            "success": True,
            "engine": "EasyOCR Arabe Avancé (BiDi/OpenCV)",
            "type_document": analyse.get("type_document"),
            "score_global": analyse.get("score_global"),
            "valide": analyse.get("valide"),
            "champs_extraits": analyse.get("champs"),
            "confiances": analyse.get("confiances"),
            "textes_bruts": [
                {"texte": t, "confiance": round(c, 3)}
                for t, c in textes_bruts
            ],
            "full_text": "\n".join([t for t, _ in textes_bruts])
        }
        sys.stdout.buffer.write(json.dumps(output, ensure_ascii=False).encode('utf-8'))
    except Exception as e:
        err_out = {
            "success": False,
            "engine": "EasyOCR Arabe Avancé (Erreur)",
            "error": str(e)
        }
        sys.stdout.buffer.write(json.dumps(err_out, ensure_ascii=False).encode('utf-8'))
        sys.exit(1)
