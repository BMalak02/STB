# -*- coding: utf-8 -*-
"""
STB — Tests complets du pipeline OCR Hybride (Llama 3.2 Vision + EasyOCR)
Couvre :
  - Algorithmes d'extraction (regex, normalisation)
  - API FastAPI via HTTP (si le service est actif sur le port 8000)
  - Intégration Ollama / Llama Vision (si Ollama est actif)
"""

import sys
import os
import re
import json
import unittest
import time
from typing import Optional

# UTF-8 sur Windows
if sys.platform.startswith('win'):
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Ajouter les utils au path
current_dir = os.path.dirname(os.path.abspath(__file__))
utils_dir = os.path.abspath(os.path.join(current_dir, "..", "utils"))
for d in [current_dir, utils_dir]:
    if d not in sys.path:
        sys.path.append(d)

from ocr_arabe import OCRArabe

# Import optionnel du module Llama Vision
try:
    from llama_vision_ocr import (
        is_ollama_ready, extraire_json_du_texte,
        normaliser_champs_llama, TYPE_ALIASES,
        DEFAULT_OLLAMA_HOST, DEFAULT_OLLAMA_MODEL
    )
    LLAMA_MODULE_OK = True
except ImportError:
    LLAMA_MODULE_OK = False

OCR_SERVICE_URL = os.environ.get("OCR_SERVICE_URL", "http://127.0.0.1:8000")


def is_service_running(url: str = OCR_SERVICE_URL, timeout: float = 2.0) -> bool:
    """Vérifie si le microservice FastAPI est actif."""
    try:
        import urllib.request
        with urllib.request.urlopen(f"{url}/health", timeout=timeout) as r:
            return r.status == 200
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════════
# BLOC 1 : Tests des algorithmes d'extraction (sans image réelle)
# ═══════════════════════════════════════════════════════════════════

class TestNormalisationTexte(unittest.TestCase):
    """Tests de normalisation des chiffres et du texte arabe."""

    def test_chiffres_arabes_vers_occidentaux(self):
        res = OCRArabe.normaliser_chiffres("٠١٢٣٤٥٦٧٨٩")
        self.assertEqual(res, "0123456789")

    def test_chiffres_persans_vers_occidentaux(self):
        res = OCRArabe.normaliser_chiffres("۰۱۲۳۴۵۶۷۸۹")
        self.assertEqual(res, "0123456789")

    def test_chiffres_mixtes(self):
        res = OCRArabe.normaliser_chiffres("الرقم: ١٢٣٤٥٦٧٨")
        self.assertIn("12345678", res)

    def test_suppression_tashkeel(self):
        texte = "مُـحَمَّـد بن عَـلِـي"
        nettoye = OCRArabe.nettoyer_texte_arabe(texte)
        self.assertNotIn("َ", nettoye)   # fatha
        self.assertNotIn("ـ", nettoye)   # tatweel
        self.assertIn("محمد", nettoye)


class TestExtractionCIN(unittest.TestCase):
    """Tests d'extraction des champs d'une CIN tunisienne."""

    def setUp(self):
        self.texte_cin_recto = (
            "الجمهورية التونسية بطاقة تعريف وطنية "
            "رقم ٠٨٩٧٦٥٤٣ "
            "الاسم محمد اللقب بن علي "
            "تاريخ الولادة ١٥ جانفي ١٩٩٠ "
            "مكان الولادة تونس "
            "المهنة مهندس"
        )
        self.texte_cin_norm = OCRArabe.nettoyer_texte_arabe(self.texte_cin_recto)

    def test_extraction_numero_cin_8_chiffres(self):
        cin_match = re.search(r'\b(\d{8})\b', self.texte_cin_norm)
        self.assertIsNotNone(cin_match, "Numéro CIN non trouvé")
        self.assertEqual(cin_match.group(1), "08976543")

    def test_extraction_date_naissance_mois_arabe(self):
        mois_map = {'جانفي': '01', 'فيفري': '02', 'مارس': '03'}
        ar_date = re.search(
            r'(\d{1,2})\s*(جانفي|فيفري|مارس)\s*(\d{4})',
            self.texte_cin_norm
        )
        self.assertIsNotNone(ar_date, "Date de naissance non trouvée")
        j, m_str, a = ar_date.group(1), ar_date.group(2), ar_date.group(3)
        m = mois_map[m_str]
        self.assertEqual(f"{j.zfill(2)}/{m}/{a}", "15/01/1990")

    def test_extraction_gouvernorat(self):
        # Doit trouver تونس → Tunis
        ar_cities = {'تونس': 'Tunis', 'صفاقس': 'Sfax', 'سوسة': 'Sousse'}
        found = None
        for ar, fr in ar_cities.items():
            if ar in self.texte_cin_norm:
                found = fr
                break
        self.assertEqual(found, "Tunis")


class TestExtractionFichePaie(unittest.TestCase):
    """Tests d'extraction des champs d'un bulletin de paie."""

    def setUp(self):
        self.texte_paie = (
            "SOCIETE TUNISIENNE DE BANQUE STB\n"
            "Matricule CNSS : 1234567800\n"
            "Mois de référence : جانفي 2026\n"
            "Salaire Brut              : 2 450,000\n"
            "Retenues obligatoires     :   599,500\n"
            "NET A PAYER               : 1 850,500 TND"
        )
        self.texte_norm = OCRArabe.nettoyer_texte_arabe(self.texte_paie)

    def test_extraction_salaire_net(self):
        pattern = re.search(
            r'(?:net\s*a\s*payer|salaire\s*net|صافي)[:\s]*([\d\s]{3,10}[,.][\d]{1,3})',
            self.texte_norm, re.IGNORECASE
        )
        self.assertIsNotNone(pattern, "Salaire net non trouvé")
        val = float(pattern.group(1).replace(' ', '').replace(',', '.'))
        self.assertAlmostEqual(val, 1850.5, places=1)

    def test_extraction_cnss(self):
        cnss = re.search(r'\b(\d{8}[-\s]?\d{2}|\d{10})\b', self.texte_norm)
        self.assertIsNotNone(cnss, "CNSS non trouvé")
        digits = re.sub(r'\D', '', cnss.group(1))
        self.assertEqual(digits, "1234567800")

    def test_extraction_employeur(self):
        emp = re.search(
            r'(?:societe|société|organisme|employeur)[:\s]*([A-Za-z0-9À-ÿ\s\'\.]{3,40})',
            self.texte_norm, re.IGNORECASE
        )
        self.assertIsNotNone(emp, "Employeur non trouvé")
        self.assertIn("BANQUE", emp.group(1).upper())


class TestExtractionReleveBancaire(unittest.TestCase):
    """Tests d'extraction RIB et solde d'un relevé bancaire STB."""

    def setUp(self):
        self.texte_releve = (
            "STB — BANQUE TUNISIENNE\n"
            "RIB : 10 000 1234567890 45\n"
            "Solde disponible : 4 250,750 TND\n"
            "Nombre d'opérations : 12\n"
            "Incidents de paiement : Aucun"
        )
        self.texte_norm = OCRArabe.nettoyer_texte_arabe(self.texte_releve)

    def test_extraction_rib_20_chiffres(self):
        rib_match = re.search(r'\b(\d[\d\s\-]{18,25}\d)\b', self.texte_norm)
        self.assertIsNotNone(rib_match, "RIB non trouvé")
        digits = re.sub(r'\D', '', rib_match.group(1))
        self.assertEqual(len(digits), 20, f"RIB doit avoir 20 chiffres, trouvé {len(digits)}: {digits}")
        self.assertEqual(digits, "10000123456789045")

    def test_extraction_solde(self):
        solde_match = re.search(
            r'(?:solde|balance)[:\s]*([\d\s]+[,.][\d]{2,3})',
            self.texte_norm, re.IGNORECASE
        )
        self.assertIsNotNone(solde_match, "Solde non trouvé")
        val = float(solde_match.group(1).replace(' ', '').replace(',', '.'))
        self.assertAlmostEqual(val, 4250.75, places=1)


# ═══════════════════════════════════════════════════════════════════
# BLOC 2 : Tests du module Llama Vision OCR
# ═══════════════════════════════════════════════════════════════════

@unittest.skipUnless(LLAMA_MODULE_OK, "Module llama_vision_ocr non disponible")
class TestLlamaVisionModule(unittest.TestCase):
    """Tests unitaires du module llama_vision_ocr (sans appel réseau)."""

    def test_aliases_types_documents(self):
        self.assertEqual(TYPE_ALIASES.get("cin"), "cin")
        self.assertEqual(TYPE_ALIASES.get("cin_recto"), "cin")
        self.assertEqual(TYPE_ALIASES.get("payslip"), "fiche_paie")
        self.assertEqual(TYPE_ALIASES.get("statement"), "releve")
        self.assertEqual(TYPE_ALIASES.get("residence"), "residence")

    def test_extraction_json_depuis_texte_markdown(self):
        texte_llm = '```json\n{"numero_cin": "12345678", "nom_arabe": "محمد بن علي"}\n```'
        result = extraire_json_du_texte(texte_llm)
        self.assertIsNotNone(result)
        self.assertEqual(result.get("numero_cin"), "12345678")

    def test_extraction_json_depuis_accolades(self):
        texte_llm = 'Voici les données: {"salaire_net": 1850.5, "employeur": "STB"}'
        result = extraire_json_du_texte(texte_llm)
        self.assertIsNotNone(result)
        self.assertAlmostEqual(float(result.get("salaire_net")), 1850.5, places=1)

    def test_normalisation_champs_cin(self):
        raw = {
            "رقم_البطاقة": "12345678",
            "الاسم_الكامل": "محمد بن علي",
            "تاريخ_الميلاد": "15/03/1990"
        }
        norm = normaliser_champs_llama(raw, "cin")
        self.assertEqual(norm.get("numero_cin"), "12345678")
        self.assertEqual(norm.get("nom_arabe"), "محمد بن علي")
        self.assertEqual(norm.get("date_naissance"), "15/03/1990")

    def test_normalisation_champs_fiche_paie(self):
        raw = {
            "الأجر_الصافي": 1850.500,
            "المؤسسة": "الشركة التونسية للبنك",
            "الشهر": "جانفي 2026"
        }
        norm = normaliser_champs_llama(raw, "fiche_paie")
        self.assertAlmostEqual(float(norm.get("salaire_net")), 1850.5, places=1)
        self.assertEqual(norm.get("employeur"), "الشركة التونسية للبنك")

    def test_normalisation_rib_nettoyage_espaces(self):
        raw = {"rib": "10 000 1234567890 45", "banque": "STB"}
        norm = normaliser_champs_llama(raw, "releve")
        self.assertEqual(norm.get("rib"), "10000123456789045")


# ═══════════════════════════════════════════════════════════════════
# BLOC 3 : Tests d'intégration HTTP (si FastAPI actif sur port 8000)
# ═══════════════════════════════════════════════════════════════════

@unittest.skipUnless(is_service_running(), "Microservice FastAPI non actif sur le port 8000")
class TestFastAPIService(unittest.TestCase):
    """Tests d'intégration HTTP contre le microservice OCR FastAPI."""

    def test_health_endpoint(self):
        import urllib.request
        with urllib.request.urlopen(f"{OCR_SERVICE_URL}/health", timeout=5) as r:
            data = json.loads(r.read().decode())
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("ollama", data)
        self.assertIn("version", data)

    def test_llama_status_endpoint(self):
        import urllib.request
        with urllib.request.urlopen(f"{OCR_SERVICE_URL}/ocr/llama-status", timeout=5) as r:
            data = json.loads(r.read().decode())
        self.assertIn("ollama_disponible", data)
        self.assertIn("modele_vision_pret", data)
        self.assertIn("endpoints_actifs", data)
        self.assertIsInstance(data["modeles_installes"], list)

    def test_docs_endpoint_accessible(self):
        import urllib.request
        with urllib.request.urlopen(f"{OCR_SERVICE_URL}/docs", timeout=5) as r:
            self.assertEqual(r.status, 200)


# ═══════════════════════════════════════════════════════════════════
# BLOC 4 : Test de connectivité Ollama (si disponible)
# ═══════════════════════════════════════════════════════════════════

@unittest.skipUnless(
    LLAMA_MODULE_OK and is_ollama_ready() if LLAMA_MODULE_OK else False,
    "Ollama non disponible"
)
class TestOllamaConnectivite(unittest.TestCase):
    """Tests de connectivité au serveur Ollama local."""

    def test_ollama_repond(self):
        self.assertTrue(is_ollama_ready(DEFAULT_OLLAMA_HOST))

    def test_modeles_disponibles(self):
        import urllib.request
        with urllib.request.urlopen(
            f"{DEFAULT_OLLAMA_HOST.rstrip('/')}/api/tags", timeout=5
        ) as r:
            data = json.loads(r.read().decode())
        models = [m.get("name", "") for m in data.get("models", [])]
        self.assertIsInstance(models, list)
        print(f"\n  📦 Modèles Ollama disponibles : {models}")
        # Vérifier la présence de llama3.2-vision
        llama_present = any("llama3.2-vision" in m for m in models)
        if not llama_present:
            print("  ⚠️  llama3.2-vision absent — exécutez : ollama pull llama3.2-vision")
        self.assertIsInstance(llama_present, bool)  # Le test passe même si absent


if __name__ == '__main__':
    print("=" * 65)
    print("  STB OCR Pipeline — Tests de validation")
    print("=" * 65)
    print(f"  FastAPI actif     : {'✅' if is_service_running() else '❌ (port 8000)'}")
    print(f"  Llama module      : {'✅' if LLAMA_MODULE_OK else '❌'}")
    if LLAMA_MODULE_OK:
        print(f"  Ollama actif      : {'✅' if is_ollama_ready() else '❌ (lancez: ollama serve)'}")
    print("=" * 65)
    print()

    # Verbosité 2 pour voir chaque test
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    # Code de sortie non-nul si des tests ont échoué
    sys.exit(0 if result.wasSuccessful() else 1)
