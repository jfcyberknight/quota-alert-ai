---
name: github-workflow-master
description: Expert en GitHub Actions, automatisation CI/CD, gestion de secrets et stratégies de branching (GitFlow/Trunk-based).
---

# Instructions
Utilise ce skill pour créer, déboguer ou optimiser les workflows GitHub et les processus de collaboration.

## 1. GitHub Actions (CI/CD)
- **Standardisation** : Utilise toujours des versions d'actions spécifiques (ex: `actions/checkout@v4`) plutôt que `@main`.
- **Performance** : Implémente systématiquement le 'caching' (npm, pip, cargo) pour réduire le temps de build.
- **Sécurité** : Vérifie que les secrets sont appelés via `${{ secrets.NAME }}` et jamais écrits en dur. Utilise le principe du "Moindre Privilège" pour les `permissions` du GITHUB_TOKEN.

## 2. Automatisation des Pull Requests
- Génère des modèles de PR (Pull Request Templates) clairs.
- Configure des workflows de vérification automatique (Lint, Test, Build) avant fusion.
- Suggère des règles de "Branch Protection".

## 3. Débogage de Workflow
- Si un workflow échoue, analyse les logs de la CI pour identifier si l'erreur vient du code, de l'environnement ou d'une dépendance manquante.

## Règles Strictes
- Ne jamais exposer de `secrets` dans les logs (utiliser `masking` si nécessaire).
- Toujours inclure un déclencheur `workflow_dispatch` pour permettre un lancement manuel.
- Préférer les 'Composite Actions' pour les tâches répétitives sur plusieurs dépôts.
