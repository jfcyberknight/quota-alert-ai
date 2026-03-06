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

## 🚨 RÈGLES CRITIQUES

### Secrets multi-lignes (ex. Firebase Service Account)
**NE JAMAIS** passer un JSON multi-lignes directement dans `--body "..."` en PowerShell — les backslashes sont mal échappés et la clé privée sera corrompue.

**TOUJOURS** utiliser la méthode par fichier :
```powershell
# ✅ Correct
Get-Content "path/to/service-account.json" -Raw | gh secret set NOM_DU_SECRET --repo owner/repo

# ❌ Incorrect (corrompt le JSON)
gh secret set NOM_DU_SECRET --body '{ "private_key": "-----BEGIN ...\n..." }'
```

### Visibilité du dépôt
- Créer les dépôts en **privé** par défaut : `gh repo create <name> --private ...`
- Pour changer la visibilité : `gh repo edit <owner/repo> --visibility private`

### Avant le premier push
1. Créer tous les secrets GitHub requis via `gh secret set`.
2. Vérifier que `firebase.json` existe à la racine.
3. S'assurer que le workflow inclut `npm run build` avant les étapes de déploiement.

## Exemple de commande
`gh repo create agents-workspace --private --source=. --remote=origin --push`
