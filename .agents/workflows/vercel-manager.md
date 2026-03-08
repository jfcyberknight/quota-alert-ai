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
- **Secret Management** : Gère les variables d'environnement Vercel **entièrement via CLI — zéro intervention manuelle**.

> **Prérequis** : `vercel` est une devDependency — un simple `npm install` suffit. Utiliser `npx vercel` (pas besoin d'installation globale).

## 🔑 Gestion des Variables d'Environnement (OBLIGATOIRE — TOUT AUTOMATISER)

> ⚠️ **NE JAMAIS demander à l'utilisateur d'ajouter des variables manuellement dans l'UI Vercel ou Firebase.**
> Tout peut être fait via `gh` (GitHub CLI) + le workflow CI. Voici le protocole :

### Étape 1 — Ajouter les secrets dans GitHub via `gh`
```bash
echo "valeur" | gh secret set NOM_DU_SECRET
```
Exemples :
```bash
echo "ma-valeur-vapid" | gh secret set VAPID_PUBLIC_KEY
echo "ma-clé-privée"  | gh secret set VAPID_PRIVATE_KEY
echo "mon-secret"     | gh secret set CRON_SECRET
```

### Étape 2 — Injecter dans Vercel via le workflow CI (deploy.yml)
Ajouter un step **avant** `npx vercel --prod` dans `.github/workflows/deploy.yml` :
```yaml
- name: Set Vercel env vars
  run: |
    printf "${{ secrets.MON_SECRET }}" | npx vercel env add MON_SECRET production --token=${{ secrets.VERCEL_TOKEN }} --force 2>/dev/null || true
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Étape 3 — Variables VITE_ (build-time)
Les variables `VITE_*` doivent être passées dans le step `Build` du workflow :
```yaml
- name: Build
  run: npm run build
  env:
    VITE_MA_VARIABLE: ${{ secrets.VITE_MA_VARIABLE }}
```

### Réutiliser un secret GitHub existant pour Vercel
Si le secret est déjà dans GitHub sous un autre nom (ex: `FIREBASE_SERVICE_ACCOUNT_QUOTA_ALERT_AI_JV`), le réutiliser directement sans recréer :
```yaml
printf "${{ secrets.FIREBASE_SERVICE_ACCOUNT_QUOTA_ALERT_AI_JV }}" | npx vercel env add FIREBASE_SERVICE_ACCOUNT production --token=${{ secrets.VERCEL_TOKEN }} --force 2>/dev/null || true
```

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

5. **Cron Jobs** :
   - Plan Hobby Vercel : **maximum 1 cron par jour**. Utiliser `"schedule": "0 9 * * *"` (quotidien 9h).
   - > ⚠️ **NE PAS utiliser `"0 * * * *"` (toutes les heures)** sur Hobby — le déploiement échoue avec "Hobby accounts are limited to daily cron jobs".

## ✅ Critères de Succès
- Le projet est lié à Vercel.
- L'endpoint `/api/status` répond correctement en production.
- Toutes les variables d'environnement sont injectées automatiquement via CI — aucune action manuelle requise.
