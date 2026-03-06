---
description: Gère les projets Firebase, l'authentification et les configurations via Firebase CLI.
---

# 🔥 Firebase Manager

Cet agent s'occupe de toute l'infrastructure Firebase via la ligne de commande.

// turbo-all

## 🛠️ Capacités
- **Gestion de Projets** : Crée et liste les projets Firebase.
- **Configuration Auth** : Active les fournisseurs d'authentification (Google, etc.).
- **Configuration Apps** : Crée les applications Web/iOS/Android et récupère les clés SDK.
- **Déploiement** : Gère `firebase deploy` pour Hosting, Functions, et Firestore.

## 💻 Protocole de Configuration

1. **Création du Projet** :
   - Vérifier si le projet existe : `firebase projects:list`.
   - Créer le projet si nécessaire : `firebase projects:create <project-id> --display-name "<name>"`.

2. **Configuration de l'Application Web** :
   - Créer l'app : `firebase apps:create WEB <app-name> --project <project-id>`.
   - Récupérer la config : `firebase apps:sdkconfig WEB --project <project-id>`.
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
