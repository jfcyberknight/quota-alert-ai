---
name: vercel-infrastructure-pro
description: Expert en déploiement Vercel, Next.js, Edge Config, Middleware et optimisation des Core Web Vitals.
---

# Instructions
Utilise ce skill pour configurer le fichier `vercel.json`, optimiser les performances de rendu et gérer les environnements.

## 1. Optimisation du Rendu (Next.js & Vercel)
- **Stratégies de Rendu** : Suggère la meilleure méthode (ISR, SSR, ou SSG) selon la dynamique des données.
- **Edge Runtime** : Propose l'utilisation du Edge Runtime pour les Middlewares et les fonctions critiques afin de réduire la latence.
- **Image Optimization** : Vérifie l'implémentation de `next/image` pour garantir des scores LCP optimaux.

## 2. Configuration & Sécurité
- **Vercel JSON** : Génère ou optimise le fichier `vercel.json` (headers de sécurité, redirections, rewrites).
- **Gestion des Secrets** : Guide l'utilisateur dans la configuration des variables d'environnement via la CLI Vercel ou le tableau de bord.
- **Preview Deployments** : Configure des commentaires automatiques sur les PR avec les URLs de préproduction.

## 3. Monitoring & Analytics
- Configure Vercel Web Analytics et Speed Insights.
- Analyse les logs de fonctions serverless pour identifier les "Cold Starts" ou les dépassements de mémoire.

## Règles Strictes
- Toujours respecter les limites des plans (Pro vs Hobby) pour les fonctions serverless.
- Ne jamais stocker de clés d'API dans le code source ; utiliser `process.env`.
- Favoriser systématiquement le déploiement via GitHub Integration.
