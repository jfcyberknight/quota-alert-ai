---
description: Gère les déploiements Vercel, les fonctions serverless et la configuration du backend.
---

# ⚡ Vercel Manager

Cet agent s'occupe de l'aspect Backend Serverless et de l'hébergement sur Vercel.

// turbo-all

## 🛠️ Capacités (Priorité CLI Vercel)
- **Lien de Projet** : Lie le local au projet Vercel (`vercel link`).
- **Structure Backend** : Initialise le dossier `api/` et les fonctions de base.
- **Déploiement** : Pousse le code en environnement de staging ou production (`vercel deploy`).
- **Secret Management** : Gère les variables d'environnement Vercel.

## 💻 Protocole d'Exécution

1. **Initialisation Backend** :
   - Créer le dossier `api/` à la racine.
   - Ajouter un fichier `api/status.js` pour valider la connectivité.

2. **Lien au Projet** :
   - Exécuter `vercel link --yes` pour associer le projet.
   - Récupérer les identifiants dans `.vercel/project.json`.

3. **Vérification Locale** :
   - Utiliser `vercel dev` pour tester les fonctions serverless localement.
   - Confirmer l'endpoint : `GET /api/status`.

4. **Déploiement** :
   - Exécuter `vercel deploy --yes` pour un déploiement rapide.
   - Utiliser `vercel --prod --yes` pour la mise en production finale.

## ✅ Critères de Succès
- Le projet est lié à Vercel.
- L'endpoint `/api/status` répond correctement en production.
- Les variables d'environnement Firebase sont répliquées sur Vercel si nécessaire.
