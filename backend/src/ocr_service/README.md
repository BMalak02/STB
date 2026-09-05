# 🔧 Pipeline OCR Avancé — Documents Arabes & Bilingues (Tunisie)

Ce microservice et module Python fournissent un pipeline d'intelligence documentaire de haute précision pour les documents tunisiens et arabes, combinant **OpenCV**, **EasyOCR**, **arabic-reshaper**, **python-bidi** et **FastAPI**.

---

## 📌 1. Points Clés & Résolution des Contraintes EasyOCR

> **⚠️ Règle Fondamentale EasyOCR :**
> EasyOCR n'autorise pas le mélange direct `['ar', 'fr', 'en']` dans un même objet `Reader` car les poids de reconnaissance arabes appartiennent à une famille de modèles distincte des alphabets latins étendus.
> Passer `['ar', 'fr', 'en']` provoque :  
> `ValueError: Arabic is only compatible with English, try lang_list=["ar","fa","ur","ug","en"]`
> 
> **Solution Adoptée :**  
> Initialisation avec `['ar', 'en']`. L'alphabet anglais/latin de base reconnaît **100%** des chiffres, majuscules et termes administratifs en français (`NOM`, `PRENOM`, `SALAIRE NET`, `CNSS`, `RIB`, `STB`, `BANQUE`).

---

## 🛠️ 2. Prétraitement d'Image Avancé (OpenCV)

1. **Chargement Sécurisé Windows** : Décodage via buffer mémoire binaire (`cv2.imdecode`) pour supporter les chemins de fichiers avec accents et espaces sans plantage d'OpenCV.
2. **Sur-échantillonnage Dynamique** : Redimensionnement cubique automatique si la largeur de l'image est inférieure à 1400px pour netteté des petits caractères.
3. **Amélioration de Contraste CLAHE** : Égalisation adaptative de l'histogramme sur le canal de luminance L (espace LAB) pour faire ressortir les tampons et impressions thermiques estompées.
4. **Débruitage Bilatéral** : Réduit le bruit de fond du papier tout en préservant le tranchant des contours de lettres arabes.
5. **Redressement Automatique (Deskew)** : Détection de l'angle d'inclinaison par boîte englobante minimale et rotation affine corrective.
6. **Binarisation Adaptative Gaussienne** : Élimine les ombres causées par les photos prises au smartphone.
7. **Fermeture Morphologique Structurée** : Noyau rectangulaire horizontal `(2, 1)` pour relier les ligatures arabes disjointes sans épaissir le texte.

---

## 📄 3. Documents Supportés & Extraction Métier

### A. Carte d'Identité Tunisienne (CIN Recto & Verso)
- **Numéro CIN** : 8 chiffres (avec tolérance des espaces OCR).
- **Nom & Prénom** : Détection bilingue en Arabe (`الاسم`, `اللقب`) et en Français (`NOM`, `PRENOM`).
- **Date de Naissance** : Support des formats numériques (`JJ/MM/AAAA`) et des mois textuels arabes (`جانفي`, `فيفري`, `مارس`, `أفريل`, etc.).
- **Gouvernorat / Lieu** : Reconnaissance des 24 gouvernorats tunisiens (`تونس`, `صفاقس`, `سوسة`, `أريانة`, `بنزرت`, `نابل`, `مدنين`...).
- **Profession / الصفة** : Reconnaissance du statut professionnel.

### B. Bulletin de Paie / Fiche de Salaire
- **Salaire Net à Payer** : Format monétaire tunisien avec 3 décimales de millimes (ex: `1 850,500 TND`).
- **Salaire Brut** : Détection des montants bruts.
- **Employeur / Société** : Extraction de la raison sociale (`المؤسسة`, `الشركة`, `Employeur`).
- **Matricule CNSS** : Identifiant d'affiliation à la sécurité sociale.
- **Période / Mois** : Mois de paie en arabe ou format `MM/AAAA`.

### C. Relevé Bancaire / Attestation de RIB
- **RIB Tunisien** : 20 chiffres stricts (`Banque(2) + Guichet(3) + Compte(13) + Clé(2)`).
- **Banque Partenaire** : Identification des banques de la place (STB, BIAT, BNA, Attijari, BH, UIB...).
- **Solde** : Détection du solde disponible ou créditeur.

---

## 🚀 4. Lancement du Microservice FastAPI

### Démarrage
```bash
# Se placer dans le dossier backend/src/ocr_service
cd backend/src/ocr_service

# Lancer le service (Port 8000 par défaut)
py start_service.py
```

- **Swagger UI** : `http://127.0.0.1:8000/docs`
- **ReDoc** : `http://127.0.0.1:8000/redoc`
- **Health Check** : `http://127.0.0.1:8000/health`

---

## 💻 5. Exemples d'Utilisation

### A. Appel cURL (Analyse CIN)
```bash
curl -X POST "http://127.0.0.1:8000/ocr/cin" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@chemin/vers/cin.jpg"
```

### B. Appel Python (`requests`)
```python
import requests

url = "http://127.0.0.1:8000/ocr/fiche-paie"
files = {"file": open("bulletin_paie.jpg", "rb")}

response = requests.post(url, files=files)
data = response.json()

print("Salaire Net :", data["champs_extraits"]["salaire_net"])
print("Employeur   :", data["champs_extraits"]["employeur"])
print("Score       :", data["score_global"], "%")
```

### C. Appel CLI direct
```bash
py backend/src/utils/ocr_arabe.py backend/uploads/test_cin.jpg cin
```

### D. Intégration Node.js / Express
```typescript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function analyserDocument(filePath: string, typeDoc: 'cin' | 'fiche-paie') {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const res = await axios.post(`http://127.0.0.1:8000/ocr/${typeDoc}`, form, {
    headers: form.getHeaders(),
    timeout: 15000,
  });

  return res.data;
}
```
