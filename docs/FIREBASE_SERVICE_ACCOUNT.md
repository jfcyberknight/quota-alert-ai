# Configurer FIREBASE_SERVICE_ACCOUNT

La variable `FIREBASE_SERVICE_ACCOUNT` permet au backend (API locale et Vercel) d'accéder à Firestore et de vérifier les tokens Firebase (auth). Sans elle, les quotas ne peuvent pas être chargés.

Le script utilise le **Firebase CLI** pour détecter le projet (`.firebaserc` ou `npx firebase-tools use`), puis soit **gcloud** pour créer la clé, soit la **console Firebase** en secours.

## Méthode 1 — Automatique (Firebase CLI + gcloud)

1. Choisis le projet Firebase (si besoin) :
   ```bash
   npx firebase-tools use
   ```
   Sélectionne le projet `quota-alert-ai-jv` (ou celui utilisé par l'app).

2. Lance le script sans argument (il tente gcloud, sinon ouvre la console) :
   ```bash
   npm run setup:service-account
   ```
   ou :
   ```bash
   node scripts/setup-service-account.js
   ```

3. Si **gcloud** est installé et configuré (`gcloud auth login` + projet), le script crée la clé, l'ajoute à `.env.local` et supprime le fichier temporaire.

4. Sinon, le script ouvre la page des comptes de service dans le navigateur. Télécharge le JSON puis :
   ```bash
   node scripts/setup-service-account.js chemin/vers/ton-fichier.json
   ```

## Méthode 2 — Fichier JSON déjà téléchargé

1. Ouvre la [console Firebase – comptes de service](https://console.firebase.google.com/project/quota-alert-ai-jv/settings/serviceaccounts/adminsdk), génère une nouvelle clé privée et enregistre le fichier JSON.

2. À la racine du repo :
   ```bash
   npm run setup:service-account -- chemin/vers/ton-fichier.json
   ```
   ou :
   ```bash
   node scripts/setup-service-account.js "%USERPROFILE%\Desktop\quota-alert-ai-jv-firebase-adminsdk-xxxxx.json"
   ```

3. Redémarre `npm run dev:full` pour que l'API utilise la nouvelle config.

**Sécurité :** ne commite jamais le fichier JSON du compte de service. Les patterns `*firebase*adminsdk*.json` et `service-account*.json` sont dans `.gitignore`.
