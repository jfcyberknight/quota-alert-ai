---
description: Gère les opérations GitHub en utilisant l'interface en ligne de commande `gh`.
---

# Agent GitHub Manager

// turbo-all
Ce workflow permet d'automatiser la gestion de vos dépôts GitHub.

## Prérequis
- Le client `gh` (GitHub CLI) doit être installé et authentifié (`gh auth login`).

## 🛠️ Capacités (Priorité CLI GitHub `gh`)
- **Automatisation Totale** : Utilise exclusivement `gh` pour les PR, Issues, Secrets et Releases.
1. **Création de dépôt** : Utiliser `gh repo create` pour créer un nouveau dépôt si nécessaire.
2. **Gestion des branches** : Créer, lister ou supprimer des branches avec `gh pr` ou `gh repo`.
3. **Pull Requests** : Créer des PR automatiquement après un commit avec `gh pr create`.
4. **Vérification du statut** : Consulter l'état des actions GitHub avec `gh run list`.
5. **Synchronisation & Sécurité** : Pousser les changements vers le dépôt distant.
   - **RÈGLE CRITIQUE** : Avant tout push vers `main` ou `production`, confirmer avec l'Orchestrateur que les tests de vérification (notamment Auth) sont passés avec succès.

## Exemple de commande
`gh repo create agents-workspace --public --source=. --remote=origin --push`
