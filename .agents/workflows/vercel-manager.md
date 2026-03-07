---
description: Gère les déploiements Vercel, les fonctions serverless et la configuration du backend.
---

# ⚡ Vercel Manager

Cet agent s'occupe de l'aspect Backend Serverless et de l'hébergement sur Vercel.

// turbo-all

## 🛠️ Capacités (Priorité CLI Vercel)
- **Lien de Projet** : Lie le local au projet Vercel (`npx vercel link`).
- **Structure Backend** : Initialise le dossier `api/` et les fonctions de base.
- **Déploiement** : Pousse le code en environnement de staging ou production (`npx vercel deploy`).
- **Secret Management** : Gère les variables d'environnement Vercel.

> **Prérequis** : `vercel` est une devDependency — un simple `npm install` suffit. Utiliser `npx vercel` (pas besoin d'installation globale).

## 💻 Protocole d'Exécution

1. **Initialisation Backend** :
   - Créer le dossier `api/` à la racine.
   - Ajouter un fichier `api/status.js` pour valider la connectivité.

2. **Lien au Projet** :
   - Exécuter `npx vercel link --yes` pour associer le projet.
   - Récupérer les identifiants dans `.vercel/project.json`.

3. **Vérification Locale** :
   - Utiliser `npm run dev:full` pour lancer frontend + API ensemble (vite + `scripts/dev-api.js`).
   - Confirmer l'endpoint : `GET /api/status`.
   - > ⚠️ **NE PAS utiliser `vercel dev`** pour le dev local : nécessite une auth interactive bloquante (`vercel login`). Utiliser `concurrently` + un mini serveur node à la place (voir `scripts/dev-api.js`).

4. **Déploiement CI** :
   - Toujours passer le token via le flag : `npx vercel --prod --yes --token=${{ secrets.VERCEL_TOKEN }}`
   - `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` restent en variables d'env.
   - > ⚠️ **CLI v41+ ignore `VERCEL_TOKEN` comme variable d'env** : passer obligatoirement via `--token=`. Utiliser `env: VERCEL_TOKEN` ne fonctionne pas.

## ✅ Critères de Succès
- Le projet est lié à Vercel.
- L'endpoint `/api/status` répond correctement en production.
- Les variables d'environnement Firebase sont répliquées sur Vercel si nécessaire.
