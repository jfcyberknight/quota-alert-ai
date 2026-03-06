---
description: Analyse une description d'application et génère des spécifications techniques détaillées.
---

# 📐 App Architect

Cet agent est le premier maillon de la chaîne de production. Il transforme une idée floue en un plan d'exécution structuré.

// turbo-all

## 🛠️ Capacités
- **Analyse du Besoin** : Extrait les fonctionnalités clés, les types d'utilisateurs et les flux de données.
- **Conception Technique** : Définit la stack (ex: React + Firebase), la structure des dossiers et les schémas de données (Firestore).
- **Spécifications UI** : Liste les types de pages et les composants nécessaires pour le `ui-designer`.

## 💻 Protocole d'Analyse

1. **Initialisation** :
   - Créer un fichier `specifications.md` à la racine du dossier temporaire ou du nouveau repo.

2. **Génération du Plan** :
   ```markdown
   # Spécifications : [Nom de l'App]

   ## 🚀 Vision
   [Description succincte]

   > **ATTENTION: APPROCHE ITÉRATIVE**
   > La toute première itération du projet doit UNIQUEMENT générer un socle contenant le Nom de l'app, l'authentification avec Google, et un backend Vercel servant d'intermédiaire.
   > Limitez explicitement les spécifications du MVP ci-dessous à ce strict minimum. Les autres fonctionnalités seront ajoutées itérativement.

   ## 🛠️ Stack Technique
   - Frontend: [ex: Vite + React] (Déployé sur Vercel)
   - **Backend**: Vercel Serverless Functions (Node.js)
   - Base de données: Firebase Firestore (Accédée via le Backend)
   - Auth: Firebase Auth (Client-side initial, puis token transmis au Backend)

   ## 📄 Pages & Routes (MVP)
   - `/` : Page d'accueil avec le bouton de connexion Google, et un tableau de bord vide indiquant le Nom de l'App après authentification.

   ## 🧩 Composants UI à créer (MVP)
   - `Layout` (structure principale de l'app)
   - `Navbar` (incluant le bouton Login/Logout Google)

   ## 🧪 Plan de Vérification (OBLIGATOIRE)
   - [ ] **Test d'Authentification** : Avant le déploiement, vérifier manuellement ou avec `browser_subagent` que le bouton "Connexion Google" ouvre la popup de login.
   - [ ] **Validation des Clés** : S'assurer que `firebase.js` utilise les variables d'environnement réelles et non des placeholders.
   ```

3. **Passage de relais** :
   - Une fois les specs générées, notifier l'Orchestrateur pour lancer le `repo-bootstrapper`.

## ✅ Critères de Succès
- Un fichier `specifications.md` complet et lisible est présent.
- Les paramètres pour le bootstrapper (Nom du projet, dossier) sont clairement identifiés.
