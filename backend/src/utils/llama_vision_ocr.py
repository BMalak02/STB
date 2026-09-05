# -*- coding: utf-8 -*-
"""
STB Document Intelligence — Moteur OCR Hybride Llama 3.2 Vision & EasyOCR
Spécialisé pour les documents tunisiens bilingues (Arabe / Français) :
- Cartes d'Identité Nationales (CIN)
- Bulletins de Paie et Fiches de Salaire
- Relevés Bancaires et Attestations de RIB
- Justificatifs de Domicile (STEG, SONEDE, Télécom)

Stratégie Hybride :
1. Llama 3.2 Vision (Vision-Language Model via Ollama) en priorité (90-95% de précision)
2. EasyOCR Arabe/Français en Fallback automatique si Ollama est indisponible ou hors-ligne
"""

import os
import sys
import re
import json
import base64
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

# Assurer l'encodage UTF-8 sur Windows
if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Import du module OCRArabe existant pour le fallback
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from ocr_arabe import OCRArabe
except ImportError:
    OCRArabe = None

logger = logging.getLogger("LlamaVisionOCR")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", stream=sys.stderr)

# Configuration par défaut
DEFAULT_OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2-vision")
# Mode Llama Only : désactive totalement le fallback EasyOCR
LLAMA_ONLY = os.environ.get("LLAMA_ONLY", "false").lower() in ("true", "1", "yes")

# Prompts spécialisés pour documents tunisiens
PROMPTS = {
    "cin": """
هذه صورة بطاقة التعريف الوطنية التونسية (Carte d'Identité Nationale Tunisienne).
استخرج المعلومات التالية بدقة متناهية:
- numero_cin: رقم البطاقة (8 أرقام بالتمام والكمال)
- nom_arabe: اللقب والاسم باللغة العربية
- nom_francais: Nom et Prénom en français / caractères latins
- date_naissance: تاريخ الميلاد بصيغة JJ/MM/AAAA
- lieu_naissance: مكان الميلاد أو الولاية (تونس، صفاقس، سوسة، أريانة، نابل، بنزرت، مدنين...)
- date_emission: تاريخ إصدار البطاقة إن وجد بصيغة JJ/MM/AAAA
- profession: المهنة أو الصفة المذكورة على البطاقة

أعطني النتيجة حصراً بصيغة JSON صالح فقط وبدون أي مقدمات أو شروحات إضافية.
مثال للنسق المطلوب:
{
  "numero_cin": "12345678",
  "nom_arabe": "محمد بن علي",
  "nom_francais": "MOHAMED BEN ALI",
  "date_naissance": "15/03/1990",
  "lieu_naissance": "تونس",
  "date_emission": "20/05/2020",
  "profession": "مهندس"
}
""",

    "fiche_paie": """
هذه صورة ورقة الأجر أو شهادة راتب شهرية تونسية (Bulletin de paie / Fiche de salaire).
استخرج المعلومات المحاسبية بدقة:
- salaire_net: الأجر الصافي الواجب دفعه بالدينار التونسي (Net à payer / Salaire net en TND avec millimes)
- salaire_brut: الأجر الخام (Salaire brut) إن وجد
- employeur: اسم صاحب العمل أو المؤسسة أو الشركة (Nom de l'employeur / Société)
- matricule_cnss: رقم الانخراط بالصندوق الوطني للضمان الاجتماعي (Numéro CNSS)
- mois: الشهر والسنة المعنية بالأجر (ex: جانفي 2026 أو 01/2026)
- deductions: إجمالي الاقتطاعات الشهرية إن وجدت

أعطني النتيجة حصراً بصيغة JSON صالح فقط وبدون أي نصوص إضافية.
مثال للنسق المطلوب:
{
  "salaire_net": 1850.500,
  "salaire_brut": 2400.000,
  "employeur": "الشركة التونسية للبنك STB",
  "matricule_cnss": "12345678-90",
  "mois": "جانفي 2026",
  "deductions": 549.500
}
""",

    "releve": """
هذه صورة كشف حساب بنكي أو شهادة في معرف الهوية البنكية تونسية (Relevé bancaire / Attestation RIB Tunisien).
استخرج البيانات التالية بدقة:
- rib: المعرف البنكي التونسي المتكون من 20 رقماً (RIB: Banque 2 + Guichet 3 + Compte 13 + Clé 2)
- banque: اسم أو رمز البنك (STB, BIAT, BNA, Attijari, BH, UIB...)
- solde: الرصيد الحالي أو النهائي المتوفر (Solde en TND)
- moyenne_solde: متوسط الرصيد إن وجد
- nombre_operations: عدد العمليات المسجلة في الفترة
- incidents_paiement: هل توجد حوادث دفع أو شيكات بدون رصيد (نعم/لا مع التوضيح إن وجد)

أعطني النتيجة حصراً بصيغة JSON صالح فقط وبدون أي نصوص إضافية.
مثال للنسق المطلوب:
{
  "rib": "10001000123456789012",
  "banque": "STB",
  "solde": 4250.750,
  "moyenne_solde": 3800.000,
  "nombre_operations": 15,
  "incidents_paiement": "لا توجد حوادث"
}
""",

    "residence": """
هذه صورة فاتورة استهلاك أو إثبات مقر سكنى في تونس (Facture STEG / SONEDE / Télécom / Justificatif de domicile).
استخرج البيانات التالية:
- organisme: اسم المؤسسة المصدرة (STEG, SONEDE, Tunisie Telecom, Ooredoo, Orange...)
- adresse: عنوان المقر أو السكن المذكور بالتفصيل
- date_facture: تاريخ إصدار الفاتورة بصيغة JJ/MM/AAAA
- titulaire: اسم الحريف أو صاحب الاشتراك

أعطني النتيجة حصراً بصيغة JSON صالح فقط.
مثال للنسق المطلوب:
{
  "organisme": "الشركة التونسية للكهرباء والغاز STEG",
  "adresse": "10 شارع الحبيب بورقيبة، تونس 1000",
  "date_facture": "10/01/2026",
  "titulaire": "محمد بن علي"
}
"""
}

# Alias pour compatibilité des types de documents
TYPE_ALIASES = {
    "cin": "cin",
    "cin_recto": "cin",
    "cin_verso": "cin",
    "paie": "fiche_paie",
    "fiche_paie": "fiche_paie",
    "bulletin_paie": "fiche_paie",
    "payslip": "fiche_paie",
    "releve": "releve",
    "rib": "releve",
    "releve_bancaire": "releve",
    "statement": "releve",
    "residence": "residence",
    "domicile": "residence",
    "facture": "residence"
}


def is_ollama_ready(host: str = DEFAULT_OLLAMA_HOST, timeout_sec: float = 1.5) -> bool:
    """Vérifie si le serveur Ollama est démarré et répond aux requêtes HTTP."""
    hosts_to_try = [host]
    if "localhost" in host:
        hosts_to_try.append(host.replace("localhost", "127.0.0.1"))
    elif "127.0.0.1" in host:
        hosts_to_try.append(host.replace("127.0.0.1", "localhost"))

    for h in hosts_to_try:
        try:
            url = f"{h.rstrip('/')}/api/tags"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            continue
    return False


def assurer_orientation_paysage(image_path: str):
    """
    Si l'image est verticale (hauteur > largeur * 1.05) comme une photo smartphone portrait de CIN,
    crée une version redressée en mode paysage dans un fichier temporaire.
    Retourne (chemin_image_redressee, est_temporaire).
    """
    try:
        from PIL import Image, ImageOps
        import tempfile
        ext = os.path.splitext(image_path)[1].lower()
        if ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
            with Image.open(image_path) as pil_img:
                pil_img = ImageOps.exif_transpose(pil_img)
                w, h = pil_img.size
                if h > w * 1.05:
                    logger.info(f"📐 Auto-rotation 90° anti-horaire appliquée sur l'image portrait ({w}x{h}).")
                    rotated = pil_img.rotate(90, expand=True)
                    temp_fd, temp_rotated_path = tempfile.mkstemp(suffix=ext)
                    os.close(temp_fd)
                    rotated.save(temp_rotated_path)
                    return temp_rotated_path, True
    except Exception as e:
        logger.warning(f"Erreur vérification orientation: {e}")
    return image_path, False


def encoder_image_base64(image_path: str) -> str:
    """Encode le fichier image en chaîne base64 pour transmission aux API de vision."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extraire_json_du_texte(texte: str) -> Optional[Dict[str, Any]]:
    """
    Extrait et parse un bloc JSON propre depuis la réponse textuelle du LLM,
    gérant les balises markdown ```json ... ``` et les accolades isolées.
    """
    if not texte:
        return None

    # 1. Recherche de bloc Markdown ```json ... ```
    md_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", texte, re.DOTALL)
    if md_match:
        try:
            return json.loads(md_match.group(1))
        except json.JSONDecodeError:
            pass

    # 2. Recherche d'accolades { ... }
    brace_match = re.search(r"(\{[\s\S]*\})", texte, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(1))
        except json.JSONDecodeError:
            pass

    # 3. Essai de parsing direct
    try:
        return json.loads(texte.strip())
    except Exception:
        return None


def normaliser_champs_llama(data: Dict[str, Any], doc_type: str) -> Dict[str, Any]:
    """
    Harmonise les noms de champs qu'ils soient renvoyés en Arabe, Français ou Anglais,
    vers le schéma canonique attendu par l'application STB.
    """
    normalized: Dict[str, Any] = {}

    # Mappages sémantiques universels
    field_mappings = {
        # CIN
        "numero_cin": ["numero_cin", "cin", "num_cin", "رقم_البطاقة", "رقم_بطاقة_التعريف", "رقم_ب_ت_و", "id_number"],
        "nom_arabe": ["nom_arabe", "nom_prenom_arabe", "الاسم_واللقب", "الاسم_الكامل", "الاسم", "اللقب"],
        "nom_francais": ["nom_francais", "nom_complet", "nom_prenom", "nom", "prenom", "full_name"],
        "date_naissance": ["date_naissance", "date_de_naissance", "تاريخ_الميلاد", "تاريخ_الولادة", "birth_date"],
        "lieu_naissance": ["lieu_naissance", "gouvernorat", "ville", "مكان_الميلاد", "مكان_الولادة", "الولاية", "place_of_birth"],
        "date_emission": ["date_emission", "date_delivrance", "تاريخ_الإصدار", "تاريخ_الاصدار", "تاريخ_التسليم", "issue_date"],
        "profession": ["profession", "statut", "المهنة", "الصفة", "job_title"],

        # Fiche de paie
        "salaire_net": ["salaire_net", "net_a_payer", "net", "الأجر_الصافي", "الصافي_للدفع", "الراتب_الصافي", "net_salary"],
        "salaire_brut": ["salaire_brut", "brut", "الأجر_الخام", "الراتب_الخام", "gross_salary"],
        "employeur": ["employeur", "societe", "entreprise", "المؤسسة", "الشركة", "المشغل", "صاحب_العمل", "employer"],
        "matricule_cnss": ["matricule_cnss", "cnss", "num_cnss", "رقم_الضمان_الاجتماعي", "رقم_cnss", "cnss_number"],
        "mois": ["mois", "periode", "الشهر", "الفترة", "الشهر_والسنة", "period"],
        "deductions": ["deductions", "retenues", "الاقتطاعات", "الخصومات", "total_deductions"],

        # Relevé bancaire
        "rib": ["rib", "numero_compte", "المعرف_البنكي", "رقم_الحساب", "rib_number"],
        "banque": ["banque", "nom_banque", "البنك", "المصرف", "bank_name"],
        "solde": ["solde", "solde_actuel", "الرصيد", "الرصيد_الحالي", "current_balance"],
        "moyenne_solde": ["moyenne_solde", "solde_moyen", "متوسط_الرصيد", "average_balance"],
        "nombre_operations": ["nombre_operations", "operations", "عدد_العمليات", "transaction_count"],
        "incidents_paiement": ["incidents_paiement", "incidents", "حوادث_الدفع", "incidents"],

        # Domicile
        "organisme": ["organisme", "fournisseur", "المؤسسة", "الجهة_المصدرة", "provider"],
        "adresse": ["adresse", "العنوان", "المقر", "address"],
        "date_facture": ["date_facture", "تاريخ_الفاتورة", "bill_date"],
        "titulaire": ["titulaire", "client", "صاحب_الاشتراك", "الحريف", "holder_name"]
    }

    # Extraction ciblée
    for target_key, candidate_keys in field_mappings.items():
        for cand in candidate_keys:
            if cand in data and data[cand] is not None:
                val = data[cand]
                # Nettoyage selon le type
                if target_key == "numero_cin" and isinstance(val, (str, int)):
                    clean_cin = re.sub(r"\D", "", str(val))
                    if len(clean_cin) == 8:
                        normalized[target_key] = clean_cin
                    else:
                        normalized[target_key] = str(val).strip()
                elif target_key == "rib" and isinstance(val, (str, int)):
                    clean_rib = re.sub(r"\s", "", str(val))
                    normalized[target_key] = clean_rib
                elif target_key in ["salaire_net", "salaire_brut", "solde", "moyenne_solde", "deductions"]:
                    if isinstance(val, (int, float)):
                        normalized[target_key] = float(val)
                    elif isinstance(val, str):
                        try:
                            clean_val = re.sub(r"[^\d,\.]", "", val).replace(",", ".")
                            normalized[target_key] = float(clean_val)
                        except Exception:
                            normalized[target_key] = val
                else:
                    normalized[target_key] = str(val).strip() if isinstance(val, str) else val
                break

    # Conserver les champs bruts non mappés
    for k, v in data.items():
        if k not in normalized:
            normalized[k] = v

    return normalized


def ocr_llama(
    image_path: str,
    type_doc: str = "cin",
    host: str = DEFAULT_OLLAMA_HOST,
    model: str = DEFAULT_OLLAMA_MODEL,
    timeout_sec: int = 30
) -> Dict[str, Any]:
    """
    Appelle le modèle de vision Llama 3.2 Vision via Ollama pour analyser et extraire
    les champs structurés d'un document tunisien.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"L'image introuvable : {image_path}")

    canonical_type = TYPE_ALIASES.get(type_doc.lower(), "cin")
    prompt = PROMPTS.get(canonical_type, PROMPTS["cin"])

    image_b64 = encoder_image_base64(image_path)

    # 1. Tentative d'utilisation de la bibliothèque officielle ollama si présente
    try:
        import ollama
        client = ollama.Client(host=host)
        response = client.chat(
            model=model,
            messages=[{
                "role": "user",
                "content": prompt,
                "images": [image_b64]
            }],
            options={"temperature": 0.1}
        )
        content = response["message"]["content"]
    except Exception as e_ollama_lib:
        logger.warning(f"Passage à la requête HTTP directe Ollama suite à : {e_ollama_lib}")
        # 2. Requête HTTP directe vers Ollama API /api/chat
        payload = {
            "model": model,
            "messages": [{
                "role": "user",
                "content": prompt,
                "images": [image_b64]
            }],
            "stream": False,
            "options": {"temperature": 0.1}
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{host.rstrip('/')}/api/chat",
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=timeout_sec) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            content = res_json.get("message", {}).get("content", "")

    # Parser le JSON retourné
    parsed_json = extraire_json_du_texte(content)
    if parsed_json and isinstance(parsed_json, dict):
        normalized = normaliser_champs_llama(parsed_json, canonical_type)
        return {
            "statut": "succes",
            "champs": normalized,
            "texte_brut": content
        }

    return {
        "statut": "partiel",
        "champs": {},
        "texte_brut": content
    }


def ocr_llama_only(
    image_path: str,
    type_doc: str = "cin",
    host: str = DEFAULT_OLLAMA_HOST,
    model: str = DEFAULT_OLLAMA_MODEL
) -> Dict[str, Any]:
    """
    Mode Llama Only — Aucun fallback EasyOCR.
    Lève une RuntimeError explicite si Ollama est hors ligne.
    Idéal en production lorsque Ollama est garanti actif.
    """
    canonical_type = TYPE_ALIASES.get(type_doc.lower(), "cin")
    target_path, is_temp = assurer_orientation_paysage(image_path)
    try:
        if not is_ollama_ready(host):
            raise RuntimeError(
                f"Ollama est hors ligne ({host}). Démarrez 'ollama serve' puis réessayez. "
                "Si vous voulez activer le fallback EasyOCR, mettez LLAMA_ONLY=false dans .env."
            )

        logger.info(f"🦙 [LLAMA_ONLY] Analyse Llama 3.2 Vision sur [{type_doc}]...")
        llama_res = ocr_llama(target_path, canonical_type, host, model)
        champs = llama_res.get("champs", {})

        if champs and len([v for v in champs.values() if v]) >= 1:
            score = 96.0
            if canonical_type == "cin" and not champs.get("numero_cin"):
                score = 80.0
            elif canonical_type == "fiche_paie" and not champs.get("salaire_net"):
                score = 80.0

            logger.info(f"✅ [LLAMA_ONLY] Extraction réussie avec {len(champs)} champs.")
            return {
                "source": "llama_vision",
                "modele": model,
                "valide": True,
                "score_global": score,
                "type_document": canonical_type.upper(),
                "champs": champs,
                "confiances": {k: 0.95 for k in champs.keys()},
                "texte_brut": llama_res.get("texte_brut", ""),
                "details": "Extraction Llama 3.2 Vision (Mode LLAMA_ONLY actif — pas de fallback)"
            }

        # Llama a répondu mais sans champs exploitables
        logger.warning("⚠️ [LLAMA_ONLY] Llama n'a retourné aucun champ exploitable.")
        return {
            "source": "llama_vision",
            "modele": model,
            "valide": False,
            "score_global": 30.0,
            "type_document": canonical_type.upper(),
            "champs": {},
            "confiances": {},
            "texte_brut": llama_res.get("texte_brut", ""),
            "details": "Llama Vision n'a extrait aucun champ structuré"
        }
    finally:
        if is_temp and os.path.exists(target_path):
            try:
                os.remove(target_path)
            except Exception:
                pass


def ocr_hybride(
    image_path: str,
    type_doc: str = "cin",
    host: str = DEFAULT_OLLAMA_HOST,
    model: str = DEFAULT_OLLAMA_MODEL
) -> Dict[str, Any]:
    """
    Stratégie Hybride Recommandée pour STB :
    1. Redresser automatiquement l'image si prise en portrait vertical.
    2. Si LLAMA_ONLY=true → appelle ocr_llama_only() (pas de fallback EasyOCR).
    3. Sinon → essaie Llama 3.2 Vision, fallback EasyOCR si Ollama hors ligne.
    """
    canonical_type = TYPE_ALIASES.get(type_doc.lower(), "cin")

    # Auto-redressement si photo mobile portrait
    target_path, is_temp = assurer_orientation_paysage(image_path)

    # Mode Llama Only : pas de fallback
    if LLAMA_ONLY:
        return ocr_llama_only(image_path, type_doc, host, model)

    try:
        # 1. Étape 1 : Essai Llama 3.2 Vision
        try:
            if is_ollama_ready(host):
                logger.info(f"🦙 Lancement analyse Llama 3.2 Vision sur [{type_doc}]...")
                llama_res = ocr_llama(target_path, canonical_type, host, model)
                champs = llama_res.get("champs", {})

                # Validation minimale : s'assurer qu'au moins 1 ou 2 champs clés sont extraits
                if champs and len([v for v in champs.values() if v]) >= 1:
                    valide = True
                    score = 96.0
                    if canonical_type == "cin" and not champs.get("numero_cin"):
                        score = 80.0
                    elif canonical_type == "fiche_paie" and not champs.get("salaire_net"):
                        score = 80.0

                    logger.info(f"✅ Analyse Llama Vision réussie avec {len(champs)} champs.")
                    return {
                        "source": "llama_vision",
                        "modele": model,
                        "valide": valide,
                        "score_global": score,
                        "type_document": canonical_type.upper(),
                        "champs": champs,
                        "confiances": {k: 0.95 for k in champs.keys()},
                        "texte_brut": llama_res.get("texte_brut", ""),
                        "details": "Extraction neuronale de vision multimodale (Llama 3.2 Vision)"
                    }
                else:
                    logger.warning("⚠️ Llama Vision n'a pas retourné de champs exploitables, bascule sur EasyOCR.")
            else:
                logger.info("ℹ️ Serveur Ollama non joignable, activation immédiate du fallback EasyOCR.")
        except Exception as e_llama:
            logger.warning(f"⚠️ Échec appel Llama Vision ({e_llama}), passage immédiat au fallback EasyOCR.")

        # 2. Étape 2 : Fallback automatique vers EasyOCR (OCRArabe)
        logger.info(f"🔄 Exécution du moteur de repli EasyOCR pour [{type_doc}]...")
        if OCRArabe is None:
            return {
                "source": "erreur",
                "valide": False,
                "score_global": 0.0,
                "type_document": canonical_type.upper(),
                "champs": {},
                "confiances": {},
                "texte_brut": "",
                "erreur": "Aucun moteur OCR disponible (Ollama hors-ligne et EasyOCR non chargé)"
            }

        try:
            ocr_engine = OCRArabe(gpu=False)
            if canonical_type == "cin":
                res = ocr_engine.extraire_cin(target_path)
            elif canonical_type == "fiche_paie":
                res = ocr_engine.extraire_fiche_paie(target_path)
            elif canonical_type == "releve":
                res = ocr_engine.extraire_releve_bancaire(target_path)
            else:
                res = ocr_engine.analyser_document(target_path, canonical_type)

            return {
                "source": "easyocr_fallback",
                "modele": "EasyOCR (ar+en) + OpenCV",
                "valide": res.get("valide", False),
                "score_global": res.get("score_global", 75.0),
                "type_document": res.get("type_document", canonical_type.upper()),
                "champs": res.get("champs", {}),
                "confiances": res.get("confiances", {}),
                "texte_brut": "",
                "details": "Extraction locale par OCR bilingue OpenCV/EasyOCR (Fallback)"
            }
        except Exception as e_easyocr:
            logger.error(f"❌ Erreur lors de l'exécution EasyOCR : {e_easyocr}", exc_info=True)
            return {
                "source": "erreur",
                "valide": False,
                "score_global": 0.0,
                "type_document": canonical_type.upper(),
                "champs": {},
                "confiances": {},
                "texte_brut": "",
                "erreur": str(e_easyocr)
            }
    finally:
        if is_temp and os.path.exists(target_path):
            try:
                os.remove(target_path)
            except Exception:
                pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"erreur": "Usage: py llama_vision_ocr.py <chemin_image> [type_doc: cin|fiche_paie|releve|residence]"}))
        sys.exit(1)

    img_arg = sys.argv[1]
    type_arg = sys.argv[2] if len(sys.argv) > 2 else "cin"

    resultat = ocr_hybride(img_arg, type_arg)
    print(json.dumps(resultat, ensure_ascii=False))
