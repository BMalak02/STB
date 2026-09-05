# -*- coding: utf-8 -*-
"""
STB - Microservice OCR Bilingue Arabe / Français Haute Performance (FastAPI)
Architecture Asynchrone, Schémas Pydantic Typés, Prétraitement OpenCV et Détection EasyOCR.
"""

import os
import sys
import time
import shutil
import logging
import tempfile
import asyncio
from typing import Dict, Any, List, Optional

MAX_UPLOAD_BYTES = int(os.environ.get("OCR_MAX_UPLOAD_BYTES", str(12 * 1024 * 1024)))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".pdf"}
from pydantic import BaseModel, Field

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps

# Assurer l'accès au module ocr_arabe
current_dir = os.path.dirname(os.path.abspath(__file__))
utils_dir = os.path.abspath(os.path.join(current_dir, "..", "utils"))
if utils_dir not in sys.path:
    sys.path.append(utils_dir)

from ocr_arabe import OCRArabe
from llama_vision_ocr import (
    ocr_hybride,
    ocr_llama,
    ocr_llama_only,
    is_ollama_ready,
    DEFAULT_OLLAMA_HOST,
    DEFAULT_OLLAMA_MODEL,
    LLAMA_ONLY
)

# Configuration Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("OCRService")

# Initialisation FastAPI
app = FastAPI(
    title="STB Document Intelligence — OCR Arabe & Bilingue",
    description=(
        "Microservice d'analyse et d'extraction de données pour documents tunisiens et arabes :\n"
        "- Cartes d'Identité Nationales (CIN Recto/Verso)\n"
        "- Bulletins de Paie et Fiches de Salaire (Dinars et millimes tunisiens)\n"
        "- Relevés Bancaires et Attestations de RIB (20 chiffres)\n"
        "- Prétraitement morphologique adaptatif OpenCV, inférence EasyOCR et Llama 3.2 Vision."
    ),
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS pour intégration Web (React/Next) et Mobile (React Native)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instance partagée OCR
ocr_engine: Optional[OCRArabe] = None


@app.on_event("startup")
async def startup_event():
    global ocr_engine
    logger.info("Démarrage du service OCR STB...")
    # Initialisation dans un thread séparé pour ne pas bloquer le démarrage
    def init_engine():
        global ocr_engine
        ocr_engine = OCRArabe(gpu=False)
    await asyncio.to_thread(init_engine)
    logger.info("Moteur OCR initialisé et prêt à recevoir des requêtes.")


# ── Modèles Pydantic pour Validation & Documentation Swagger ────────

class TextItem(BaseModel):
    texte: str = Field(..., description="Texte extrait")
    confiance: float = Field(..., description="Indice de confiance de 0.0 à 1.0")
    bbox: Optional[List[List[int]]] = Field(None, description="Coordonnées de la boîte englobante [ [x1,y1], [x2,y2], ... ]")


class CINExtractionData(BaseModel):
    numero_cin: Optional[str] = Field(None, description="Numéro CIN tunisien à 8 chiffres")
    date_naissance: Optional[str] = Field(None, description="Date de naissance au format JJ/MM/AAAA")
    nom_arabe: Optional[str] = Field(None, description="Nom et prénom en langue arabe")
    nom_francais: Optional[str] = Field(None, description="Nom et prénom en caractères latins")
    gouvernorat: Optional[str] = Field(None, description="Gouvernorat tunisien (lieu de naissance/délivrance)")
    profession: Optional[str] = Field(None, description="Profession ou الصفة mentionnée sur la CIN")


class CINResponse(BaseModel):
    statut: str = Field(..., example="succes")
    type_document: str = Field("CIN_TUNISIENNE")
    score_global: float = Field(..., description="Score de fiabilité global du document (%)", example=95.5)
    valide: bool = Field(..., description="True si le numéro CIN obligatoire a été trouvé")
    champs_extraits: CINExtractionData
    confiances: Dict[str, float]
    textes_bruts: List[TextItem]
    temps_traitement_ms: int


class PayslipExtractionData(BaseModel):
    salaire_net: Optional[float] = Field(None, description="Montant Net à payer en TND (Dinars tunisiens)", example=1850.500)
    salaire_brut: Optional[float] = Field(None, description="Montant Brut en TND", example=2400.000)
    employeur: Optional[str] = Field(None, description="Nom de l'employeur / Société")
    matricule_cnss: Optional[str] = Field(None, description="Numéro d'affiliation CNSS")
    mois: Optional[str] = Field(None, description="Mois ou période de rémunération")


class PayslipResponse(BaseModel):
    statut: str = Field(..., example="succes")
    type_document: str = Field("FICHE_DE_PAIE")
    score_global: float = Field(..., example=92.0)
    valide: bool = Field(..., description="True si le salaire net a été identifié")
    champs_extraits: PayslipExtractionData
    confiances: Dict[str, float]
    textes_bruts: List[TextItem]
    temps_traitement_ms: int


class BankStatementData(BaseModel):
    rib: Optional[str] = Field(None, description="RIB Tunisien normalisé (20 chiffres)")
    banque: Optional[str] = Field(None, description="Code ou sigle de l'institution bancaire", example="STB")
    solde: Optional[float] = Field(None, description="Dernier solde détecté")


class BankStatementResponse(BaseModel):
    statut: str = Field(..., example="succes")
    type_document: str = Field("RELEVE_BANCAIRE")
    score_global: float = Field(..., example=96.0)
    valide: bool = Field(...)
    champs_extraits: BankStatementData
    confiances: Dict[str, float]
    textes_bruts: List[TextItem]
    temps_traitement_ms: int


class GenericDocResponse(BaseModel):
    statut: str
    type_document: str
    score_global: float
    valide: bool
    champs_extraits: Dict[str, Any]
    confiances: Dict[str, float]
    textes_bruts: List[TextItem]
    temps_traitement_ms: int


class HybridDocResponse(BaseModel):
    statut: str = Field("succes", example="succes")
    source: str = Field(..., description="Moteur utilisé : 'llama_vision' ou 'easyocr_fallback'", example="llama_vision")
    modele: Optional[str] = Field(None, example="llama3.2-vision")
    valide: bool = Field(..., description="True si au moins un champ essentiel est extrait")
    score_global: float = Field(..., example=96.0)
    type_document: str = Field(..., example="CIN")
    champs: Dict[str, Any] = Field(..., description="Dictionnaire normalisé des données extraites")
    confiances: Dict[str, float] = Field(default_factory=dict)
    texte_brut: Optional[str] = Field("", description="Réponse textuelle brute du LLM de vision")
    details: Optional[str] = Field("", description="Explications et métadonnées d'exécution")
    temps_traitement_ms: int


# ── Utilitaire de gestion sécurisée des fichiers temporaires ────────

def redresser_image_automatiquement(temp_path: str):
    """
    Corrige l'orientation EXIF de la caméra mobile et détecte si une carte CIN (format paysage)
    a été photographiée en mode portrait vertical (hauteur > largeur), pour la pivoter à l'horizontale.
    """
    ext = os.path.splitext(temp_path)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
        return

    try:
        pil_img = Image.open(temp_path)
        # 1. Transposer selon les métadonnées EXIF du smartphone
        pil_img = ImageOps.exif_transpose(pil_img)
        w, h = pil_img.size

        # 2. Si l'image est verticale (hauteur > largeur)
        # Les cartes d'identité (CIN tunisienne) sont au format paysage (w/h ~ 1.58).
        # Photographiées en mode portrait sur smartphone, la carte est pivotée de 90°.
        if h > w * 1.05:
            logger.info(f"📐 Image verticale détectée ({w}x{h}). Rotation automatique 90° anti-horaire vers paysage.")
            pil_img = pil_img.rotate(90, expand=True)

        pil_img.save(temp_path)
    except Exception as e:
        logger.warning(f"Avertissement redressement image: {e}")


async def enregistrer_fichier_temporaire(file: UploadFile) -> str:
    """Sauvegarde et valide un upload avant de le remettre au moteur OCR."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Format de fichier non pris en charge")

    temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
    os.close(temp_fd)
    total_bytes = 0
    try:
        with open(temp_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Fichier trop volumineux")
                buffer.write(chunk)
        if total_bytes == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fichier vide")
        redresser_image_automatiquement(temp_path)
        return temp_path
    except Exception:
        supprimer_fichier_securise(temp_path)
        raise


def supprimer_fichier_securise(temp_path: str):
    """Supprime un fichier temporaire avec gestion des verrous éventuels."""
    try:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception as e:
        logger.warning(f"Impossible de supprimer le fichier temporaire {temp_path}: {e}")


# ── Routes API ──────────────────────────────────────────────────────

@app.get("/health", tags=["Système"])
async def health_check():
    """Vérification de l'état opérationnel du service, du moteur OCR et de la connectivité Ollama."""
    global ocr_engine
    ollama_ok = is_ollama_ready()
    return {
        "status": "healthy" if ocr_engine is not None else "degraded",
        "service": "STB Document Intelligence — OCR Hybride (Llama 3.2 Vision + EasyOCR)",
        "version": "2.1.0",
        "ocr_initialise": ocr_engine is not None,
        "mode": "CPU (Optimisé EasyOCR + OpenCV + Llama 3.2 Vision)",
        "llama_only": LLAMA_ONLY,
        "ollama": {
            "disponible": ollama_ok,
            "host": DEFAULT_OLLAMA_HOST,
            "modele_vision": DEFAULT_OLLAMA_MODEL,
            "statut": "En ligne (Prêt pour inférence Llama Vision)" if ollama_ok else "Hors ligne (Fallback EasyOCR automatique actif)"
        }
    }


@app.get("/ocr/llama-status", tags=["Système"])
async def llama_status():
    """
    Statut détaillé du serveur Ollama :
    - Disponibilité du service
    - Liste des modèles téléchargés localement
    - Présence confirmée de llama3.2-vision
    - Configuration active (host, model, mode)
    """
    import urllib.request
    import json as _json

    ollama_ok = is_ollama_ready(DEFAULT_OLLAMA_HOST)
    modeles_disponibles: list = []
    modele_vision_pret = False
    vram_info: Optional[str] = None

    if ollama_ok:
        try:
            req = urllib.request.Request(f"{DEFAULT_OLLAMA_HOST.rstrip('/')}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = _json.loads(resp.read().decode())
                modeles_disponibles = [
                    {
                        "nom": m.get("name", ""),
                        "taille": f"{round(m.get('size', 0) / 1e9, 1)} Go" if m.get('size') else "—",
                        "modifie": m.get("modified_at", "")[:10] if m.get("modified_at") else "—"
                    }
                    for m in data.get("models", [])
                ]
                modele_vision_pret = any(
                    DEFAULT_OLLAMA_MODEL in m.get("name", "") for m in data.get("models", [])
                )
        except Exception as e:
            logger.warning(f"Impossible de récupérer les modèles Ollama : {e}")

    instructions_pull = (
        f"ollama pull {DEFAULT_OLLAMA_MODEL}" if not modele_vision_pret else None
    )

    return {
        "ollama_disponible": ollama_ok,
        "host": DEFAULT_OLLAMA_HOST,
        "modele_configure": DEFAULT_OLLAMA_MODEL,
        "modele_vision_pret": modele_vision_pret,
        "llama_only_mode": LLAMA_ONLY,
        "modeles_installes": modeles_disponibles,
        "nombre_modeles": len(modeles_disponibles),
        "instructions_installation": instructions_pull,
        "endpoints_actifs": [
            "/ocr/hybride/{type_doc} — Moteur hybride Llama + EasyOCR (recommandé)",
            "/ocr/llama-only/{type_doc} — Llama Vision exclusif (nécessite Ollama actif)",
            "/ocr/llama/{type_doc} — Llama Vision direct avec réponse brute",
            "/ocr/cin — Extraction CIN Tunisienne (EasyOCR)",
            "/ocr/fiche-paie — Extraction bulletin de salaire (EasyOCR)",
            "/ocr/releve-bancaire — Extraction relevé bancaire (EasyOCR)",
            "/ocr/residence — Extraction justificatif de domicile (EasyOCR)",
            "/ocr/analyser — Classification + extraction automatique",
            "/ocr/read — Lecture de texte brut"
        ],
        "statut_global": (
            "✅ Système complet opérationnel (Llama Vision + EasyOCR)" if (ollama_ok and modele_vision_pret)
            else "⚠️ Mode EasyOCR uniquement (Ollama hors ligne ou modèle absent)"
        )
    }


@app.post("/ocr/hybride/{type_doc}", response_model=HybridDocResponse, tags=["Moteur Hybride Llama + EasyOCR"])
async def analyser_document_hybride(
    type_doc: str,
    file: UploadFile = File(...),
    host: Optional[str] = Query(None, description="Hôte Ollama personnalisé (optionnel)"),
    model: Optional[str] = Query(None, description="Modèle Ollama (défaut: llama3.2-vision)")
):
    """
    Analyse intelligente hybride d'un document tunisien :
    1. Essaie Llama 3.2 Vision en priorité si Ollama est actif (90-95% de précision).
    2. Bascule instantanément et de façon transparente sur EasyOCR en cas d'indisponibilité d'Ollama.
    Supporte : 'cin', 'fiche_paie', 'releve', 'residence'.
    """
    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)
    try:
        kwargs = {}
        if host:
            kwargs["host"] = host
        if model:
            kwargs["model"] = model

        resultat = await asyncio.to_thread(ocr_hybride, temp_path, type_doc, **kwargs)
        elapsed = int((time.time() - start_time) * 1000)

        return HybridDocResponse(
            statut="succes" if resultat.get("valide") else "partiel",
            source=resultat.get("source", "inconnu"),
            modele=resultat.get("modele"),
            valide=resultat.get("valide", False),
            score_global=float(resultat.get("score_global", 0.0)),
            type_document=str(resultat.get("type_document", type_doc.upper())),
            champs=resultat.get("champs", {}),
            confiances=resultat.get("confiances", {}),
            texte_brut=resultat.get("texte_brut", ""),
            details=resultat.get("details", ""),
            temps_traitement_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse hybride [{type_doc}]: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur d'analyse hybride OCR : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/llama-only/{type_doc}", response_model=HybridDocResponse, tags=["Moteur Llama 3.2 Vision Direct"])
async def analyser_document_llama_only(
    type_doc: str,
    file: UploadFile = File(...),
    host: Optional[str] = Query(None, description="Hôte Ollama personnalisé (optionnel)"),
    model: Optional[str] = Query(None, description="Modèle Ollama (défaut: llama3.2-vision)")
):
    """
    Analyse un document avec **Llama 3.2 Vision uniquement** — sans fallback EasyOCR.
    Retourne une erreur 503 si Ollama est hors ligne.
    Supporte : 'cin', 'fiche_paie', 'releve', 'residence'.
    """
    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)
    try:
        kwargs = {}
        if host:
            kwargs["host"] = host
        if model:
            kwargs["model"] = model

        resultat = await asyncio.to_thread(ocr_llama_only, temp_path, type_doc, **kwargs)
        elapsed = int((time.time() - start_time) * 1000)

        return HybridDocResponse(
            statut="succes" if resultat.get("valide") else "partiel",
            source=resultat.get("source", "llama_vision"),
            modele=resultat.get("modele"),
            valide=resultat.get("valide", False),
            score_global=float(resultat.get("score_global", 0.0)),
            type_document=str(resultat.get("type_document", type_doc.upper())),
            champs=resultat.get("champs", {}),
            confiances=resultat.get("confiances", {}),
            texte_brut=resultat.get("texte_brut", ""),
            details=resultat.get("details", ""),
            temps_traitement_ms=elapsed
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erreur Llama Only [{type_doc}]: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur Llama Vision : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/llama/{type_doc}", tags=["Moteur Llama 3.2 Vision Direct"])
async def analyser_document_llama_direct(
    type_doc: str,
    file: UploadFile = File(...),
    host: Optional[str] = Query(None, description="Hôte Ollama personnalisé"),
    model: Optional[str] = Query(None, description="Modèle Ollama")
):
    """
    Appelle directement le modèle Llama 3.2 Vision sans fallback.
    Retourne les champs extraits et le texte brut du LLM multimodal.
    """
    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)
    try:
        kwargs = {}
        if host:
            kwargs["host"] = host
        if model:
            kwargs["model"] = model

        resultat = await asyncio.to_thread(ocr_llama, temp_path, type_doc, **kwargs)
        elapsed = int((time.time() - start_time) * 1000)
        resultat["temps_traitement_ms"] = elapsed
        return resultat
    except Exception as e:
        logger.error(f"Erreur Llama Vision direct [{type_doc}]: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur Llama Vision : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/cin", response_model=CINResponse, tags=["Extraction Spécialisée"])
async def analyser_cin(file: UploadFile = File(...)):
    """
    Analyse une Carte d'Identité Nationale (CIN Tunisienne Recto ou Verso).
    Extrait le numéro CIN (8 chiffres), nom/prénom en arabe et français, date de naissance,
    gouvernorat, profession et calcule un score de confiance global.
    """
    global ocr_engine
    if not ocr_engine:
        ocr_engine = OCRArabe(gpu=False)

    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)

    try:
        # Exécution non-bloquante dans un worker pool
        analyse = await asyncio.to_thread(ocr_engine.extraire_cin, temp_path)
        boites = await asyncio.to_thread(ocr_engine.lire_avec_boites, temp_path)
        elapsed = int((time.time() - start_time) * 1000)

        return CINResponse(
            statut="succes" if analyse.get("valide") else "partiel",
            type_document=analyse.get("type_document", "CIN_TUNISIENNE"),
            score_global=analyse.get("score_global", 0.0),
            valide=analyse.get("valide", False),
            champs_extraits=CINExtractionData(**analyse.get("champs", {})),
            confiances=analyse.get("confiances", {}),
            textes_bruts=[TextItem(**b) for b in boites],
            temps_traitement_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse CIN: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur d'extraction OCR CIN : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/fiche-paie", response_model=PayslipResponse, tags=["Extraction Spécialisée"])
async def analyser_fiche_paie(file: UploadFile = File(...)):
    """
    Analyse un bulletin de salaire / fiche de paie tunisienne.
    Extrait le Salaire Net à payer (en Dinars Tunisiens TND avec 3 décimales de millimes),
    le Brut, l'employeur, le matricule CNSS et le mois concerné.
    """
    global ocr_engine
    if not ocr_engine:
        ocr_engine = OCRArabe(gpu=False)

    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)

    try:
        analyse = await asyncio.to_thread(ocr_engine.extraire_fiche_paie, temp_path)
        boites = await asyncio.to_thread(ocr_engine.lire_avec_boites, temp_path)
        elapsed = int((time.time() - start_time) * 1000)

        return PayslipResponse(
            statut="succes" if analyse.get("valide") else "partiel",
            type_document=analyse.get("type_document", "FICHE_DE_PAIE"),
            score_global=analyse.get("score_global", 0.0),
            valide=analyse.get("valide", False),
            champs_extraits=PayslipExtractionData(**analyse.get("champs", {})),
            confiances=analyse.get("confiances", {}),
            textes_bruts=[TextItem(**b) for b in boites],
            temps_traitement_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse Fiche de Paie: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur d'extraction OCR Fiche de Paie : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/releve-bancaire", response_model=BankStatementResponse, tags=["Extraction Spécialisée"])
async def analyser_releve_bancaire(file: UploadFile = File(...)):
    """
    Analyse un relevé de compte bancaire ou une attestation de RIB tunisien.
    Extrait le RIB (20 chiffres), l'institution bancaire (ex: STB) et le solde.
    """
    global ocr_engine
    if not ocr_engine:
        ocr_engine = OCRArabe(gpu=False)

    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)

    try:
        analyse = await asyncio.to_thread(ocr_engine.extraire_releve_bancaire, temp_path)
        boites = await asyncio.to_thread(ocr_engine.lire_avec_boites, temp_path)
        elapsed = int((time.time() - start_time) * 1000)

        return BankStatementResponse(
            statut="succes" if analyse.get("valide") else "partiel",
            type_document=analyse.get("type_document", "RELEVE_BANCAIRE"),
            score_global=analyse.get("score_global", 0.0),
            valide=analyse.get("valide", False),
            champs_extraits=BankStatementData(**analyse.get("champs", {})),
            confiances=analyse.get("confiances", {}),
            textes_bruts=[TextItem(**b) for b in boites],
            temps_traitement_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse Relevé Bancaire: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur d'extraction OCR Relevé Bancaire : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


class ResidenceExtractionData(BaseModel):
    organisme: Optional[str] = Field(None, description="Organisme émetteur (STEG, SONEDE, Tunisie Telecom...)", example="STEG")
    adresse: Optional[str] = Field(None, description="Adresse complète du domicile")
    date_facture: Optional[str] = Field(None, description="Date de la facture au format JJ/MM/AAAA")
    titulaire: Optional[str] = Field(None, description="Nom du titulaire / abonné")


class ResidenceResponse(BaseModel):
    statut: str = Field(..., example="succes")
    type_document: str = Field("JUSTIFICATIF_DOMICILE")
    score_global: float = Field(..., example=91.0)
    valide: bool = Field(...)
    champs_extraits: ResidenceExtractionData
    confiances: Dict[str, float]
    textes_bruts: List[TextItem]
    temps_traitement_ms: int


@app.post("/ocr/residence", response_model=ResidenceResponse, tags=["Extraction Spécialisée"])
async def analyser_justificatif_domicile(file: UploadFile = File(...)):
    """
    Analyse un justificatif de domicile tunisien (facture STEG, SONEDE, Tunisie Telecom, Ooredoo, Orange, Topnet).
    Extrait l'organisme, l'adresse, la date de la facture et le nom du titulaire.
    """
    global ocr_engine
    if not ocr_engine:
        ocr_engine = OCRArabe(gpu=False)

    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)

    try:
        # Utiliser analyser_document avec hint 'residence'
        analyse = await asyncio.to_thread(ocr_engine.analyser_document, temp_path, "residence")
        boites = await asyncio.to_thread(ocr_engine.lire_avec_boites, temp_path)
        elapsed = int((time.time() - start_time) * 1000)

        champs_raw = analyse.get("champs", {})
        return ResidenceResponse(
            statut="succes" if analyse.get("valide") else "partiel",
            type_document=analyse.get("type_document", "JUSTIFICATIF_DOMICILE"),
            score_global=analyse.get("score_global", 0.0),
            valide=analyse.get("valide", False),
            champs_extraits=ResidenceExtractionData(
                organisme=champs_raw.get("organisme") or champs_raw.get("provider"),
                adresse=champs_raw.get("adresse") or champs_raw.get("address"),
                date_facture=champs_raw.get("date_facture") or champs_raw.get("billDate"),
                titulaire=champs_raw.get("titulaire") or champs_raw.get("holder_name"),
            ),
            confiances=analyse.get("confiances", {}),
            textes_bruts=[TextItem(**b) for b in boites],
            temps_traitement_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse Justificatif Domicile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur d'extraction OCR Justificatif Domicile : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/analyser", response_model=GenericDocResponse, tags=["Classification & Extraction Automatique"])
async def analyser_document_automatique(
    file: UploadFile = File(...),
    type_attendu: Optional[str] = Query(None, description="Indication optionnelle : 'cin', 'paie', 'rib'")
):
    """
    Classifie automatiquement le type de document uploadé et extrait les données associées.
    Idéal pour les guichets de téléversement client où l'utilisateur dépose un justificatif.
    """
    global ocr_engine
    if not ocr_engine:
        ocr_engine = OCRArabe(gpu=False)

    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)

    try:
        analyse = await asyncio.to_thread(ocr_engine.analyser_document, temp_path, type_attendu)
        boites = await asyncio.to_thread(ocr_engine.lire_avec_boites, temp_path)
        elapsed = int((time.time() - start_time) * 1000)

        return GenericDocResponse(
            statut="succes" if analyse.get("valide") else "non_reconnu",
            type_document=analyse.get("type_document", "DOCUMENT_GENERIQUE"),
            score_global=analyse.get("score_global", 0.0),
            valide=analyse.get("valide", False),
            champs_extraits=analyse.get("champs", {}),
            confiances=analyse.get("confiances", {}),
            textes_bruts=[TextItem(**b) for b in boites],
            temps_traitement_ms=elapsed
        )
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse générique: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur d'analyse automatique : {str(e)}"
        )
    finally:
        supprimer_fichier_securise(temp_path)


@app.post("/ocr/read", tags=["Lecture Brute"])
async def lire_texte_brut(file: UploadFile = File(...)):
    """
    Lit n'importe quel document ou image sans extraction structurée.
    Retourne l'intégralité du texte détecté, le texte complet concaténé et les boîtes géométriques.
    """
    global ocr_engine
    if not ocr_engine:
        ocr_engine = OCRArabe(gpu=False)

    start_time = time.time()
    temp_path = await enregistrer_fichier_temporaire(file)

    try:
        boites = await asyncio.to_thread(ocr_engine.lire_avec_boites, temp_path)
        full_text = "\n".join([b["texte"] for b in boites])
        elapsed = int((time.time() - start_time) * 1000)

        return {
            "statut": "succes",
            "full_text": full_text,
            "elements_detectes": len(boites),
            "textes_bruts": boites,
            "temps_traitement_ms": elapsed
        }
    except Exception as e:
        logger.error(f"Erreur lors de la lecture brute: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        supprimer_fichier_securise(temp_path)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("OCR_PORT", 8000))
    logger.info(f"Démarrage du serveur Uvicorn sur le port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
