# Spécifications : quota-alert-ai

## 🚀 Vision
Une application de surveillance des quotas multi-sources (OpenAI, Anthropic, Google Gemini) avec des alertes intelligentes et un suivi granulaire.

> **ATTENTION: APPROCHE ITÉRATIVE**
> La toute première itération du projet doit UNIQUEMENT générer un socle contenant le Nom de l'app, l'authentification avec Google, et un backend Vercel servant d'intermédiaire.
> Limitez explicitement les spécifications du MVP ci-dessous à ce strict minimum. Les autres fonctionnalités seront ajoutées itérativement via `/add-feature`.

## 🛠️ Stack Technique
- Frontend: Vite + React (Déployé sur Vercel)
- **Backend**: Vercel Serverless Functions (Node.js)
- Base de données: Firebase Firestore (Accédée via le Backend)
- Auth: Firebase Auth (Client-side initial, puis token transmis au Backend)

> [!IMPORTANT]
> **Configuration Firebase requise** :
> Pour faire fonctionner l'authentification réelle, vous devez :
> 1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/).
> 2. Activer l'authentification Google.
> 3. Copier vos clés dans `src/firebase.js`.

## 📄 Pages & Routes (MVP)
- `/` : Page d'accueil avec le bouton de connexion Google, et un tableau de bord vide indiquant le Nom de l'App après authentification.

## 🧩 Composants UI à créer (MVP)
- `Layout` (structure principale de l'app)
- `Navbar` (incluant le bouton Login/Logout Google)

## 🗓️ Roadmap & Todo List (Itérations Futures)

### 1. Surveillance et Collecte
- [ ] **Interrogation multi-sources**: Connecter périodiquement aux interfaces de gestion (OpenAI, Anthropic, Google Gemini).
- [ ] **Suivi granulaire**: RPM, TPM et coûts financiers cumulés.
- [ ] **Historisation locale**: Enregistrer les relevés pour calculer des tendances.

### 2. Analyse et Logique d'Alerte
- [ ] **Calcul de seuils critiques**: Comparaison temps réel limites vs usage.
- [ ] **Détection de réinitialisation**: Identifier les cycles de facturation/journée.
- [ ] **Projection de consommation**: Prédire l'épuisement des quotas (ex: "épuisé dans 2 heures").

### 3. Système de Communication
- [ ] **Alertes de proximité**: Notifications à 80% ou 90%.
- [ ] **Notifications de rétablissement**: Message quand service à 100% dispo.
- [ ] **Rapport de statut**: Résumé rapide santé API.

### 4. Sécurité et Gestion
- [ ] **Isolation des accès**: Gestion sécurisée des identifiants.
- [ ] **Gestion des erreurs**: Signaler indisponibilité des API de surveillance.
