---
description: Gère les projets Firebase, l'authentification et les configurations via Firebase CLI.
---

# 🔥 Firebase Manager

Cet agent s'occupe de toute l'infrastructure Firebase via la ligne de commande.

// turbo-all

> **Prérequis** : `firebase-tools` est une devDependency — un simple `npm install` suffit. Utiliser `npx firebase` (pas besoin d'installation globale).

## 🛠️ Capacités (Priorité CLI Firebase)
- **Gestion de Projet** : Création et configuration via `npx firebase projects:create`.
- **Configuration Auth** : Active les fournisseurs d'authentification (Google, etc.).
- **Configuration Apps** : Crée les applications Web/iOS/Android et récupère les clés SDK.
- **Déploiement** : Gère `npx firebase deploy` pour Hosting, Functions, et Firestore.

## 💻 Protocole de Configuration

1. **Création du Projet** :
   - Vérifier si le projet existe : `npx firebase projects:list`.
   - Créer le projet si nécessaire : `npx firebase projects:create <project-id> --display-name "<name>"`.

2. **Configuration de l'Application Web** :
   - Créer l'app : `npx firebase apps:create WEB <app-name> --project <project-id>`.
   - Récupérer la config : `npx firebase apps:sdkconfig WEB --project <project-id>`.
   - **IMPORTANCE CRITIQUE** : Sauvegarder la config dans `.env.local` et s'assurer que `apiKey` est présente.

3. **Activation de l'Authentification (OBLIGATOIRE)** :
   - Naviguer sur la console Firebase (ou utiliser `gcloud` si dispo) pour activer **Google Auth**.
   - **Vérification** : L'agent doit confirmer que Google Auth est marqué comme "Enabled" avant de passer la main au développeur.

4. **Synchronisation Locale** :
   - Injecter les clés dans `.env.local` pour le développement.
   - Mettre à jour `src/firebase.js` pour utiliser ces variables.

## ✅ Critères de Succès
- Le projet Firebase est actif.
- Les clés SDK sont correctement intégrées à l'application.
- L'authentification est prête pour les tests.

## 🚨 RÈGLES CI/CD OBLIGATOIRES (ne jamais oublier)

### 1. Créer `firebase.json` avant tout déploiement
Firebase Hosting ne peut pas déployer sans ce fichier à la racine du projet.
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### 2. Inclure `npm run build` dans le workflow GitHub Actions
Le dossier `dist/` doit exister avant le déploiement Firebase. **Toujours** ajouter cette étape dans `.github/workflows/deploy.yml` :
```yaml
- name: Build
  run: npm run build
```

### 3. Configurer les secrets GitHub AVANT le premier push
Ne jamais pousser le workflow sans avoir d'abord configuré tous les secrets requis :
- `FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID>` (voir section GitHub Manager)
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### 4. 🚨 Authentification Firebase CLI en CI (RÈGLE CRITIQUE)
La CLI Firebase attend `GOOGLE_APPLICATION_CREDENTIALS` comme **chemin vers un fichier JSON**, jamais une variable contenant le JSON brut.

**TOUJOURS** utiliser l'Action officielle GitHub pour le déploiement Firebase en CI :
```yaml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID> }}
    projectId: <project-id>
    channelId: live
```

> ⚠️ **NE PAS utiliser `firebase-tools` comme devDependency en CI** : le binaire `./node_modules/.bin/firebase` peut être absent si l'installation échoue silencieusement. `npx firebase` est ambigu quand le SDK `firebase` est aussi une dépendance. L'Action officielle gère tout ça de façon fiable.

> ⚠️ **NE PAS** passer le JSON brut via une variable d'env `GOOGLE_APPLICATION_CREDENTIALS_JSON` — Firebase CLI attend un chemin de fichier, pas du JSON inline.
