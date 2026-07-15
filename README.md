# Full Stack Enterprise Monorepo

Ce projet est une architecture d'application Full Stack modulaire et scalable séparée en 3 packages :
- **web/** : Application React + Vite + TS + Tailwind.
- **mobile/** : Application React Native (Expo) + TS.
- **backend/** : API REST + WebSockets Node.js + Express + TypeScript + MongoDB.

## Architecture & Principes
1. **TypeScript End-to-End** : Typage fort et validation de schémas.
2. **Clean Architecture & SOLID** : Separation of Concerns. La logique métier (Services) est découplée des frameworks de diffusion (Controllers/Routes pour le web, UI pour React).
3. **Feature-driven Design (Web/Mobile)** : Les dossiers sont regroupés par fonctionnalités métiers (ex: `features/auth`) pour une scalabilité maximale.
4. **Clean Backend Layers** :
   - Controllers : Gestion des requêtes/réponses, validation.
   - Services : Logique métier.
   - Models : Couche de données Mongoose.
   - Middlewares : Filtres transversaux (Auth, Erreurs, Upload).

## Démarrage rapide

### Prérequis
- Node.js (v18+)
- Docker et Docker Compose (optionnel)

### Installation
Installez les dépendances pour tous les projets à la fois depuis la racine :
```bash
npm install
```

### Commandes utiles (Racine)
- `npm run dev:backend` : Démarre le serveur de dev backend.
- `npm run dev:web` : Démarre l'application web de dev.
- `npm run dev:mobile` : Démarre le serveur Expo pour mobile.
- `npm run docker:up` : Démarre le backend et la base de données via Docker Compose.
