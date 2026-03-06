---
description: Synchronise automatiquement tous les workflows agents vers le repo agent-manager centralisé.
---

// turbo-all
# 🔄 Agent Sync

Cet agent maintient la cohérence entre les workflows du projet courant et le dépôt central `agent-manager`.

## 📁 Chemins
- **Source** : `.agents/workflows/` (dans le repo du projet courant)
- **Destination** : `C:\Users\jf.vallee\.gemini\antigravity\scratch\agent-manager\`

## ⚡ Déclenchement
Cet agent est appelé **automatiquement par l'orchestrateur** après toute modification d'un fichier dans `.agents/workflows/`.
Il n'a jamais besoin d'être invoqué manuellement.

## 🛠️ Étapes

1. **Copier les fichiers modifiés** vers agent-manager :
   ```powershell
   Copy-Item ".agents\workflows\*.md" -Destination "C:\Users\jf.vallee\.gemini\antigravity\scratch\agent-manager\" -Force
   ```

2. **Commit et push** dans agent-manager :
   ```powershell
   cd "C:\Users\jf.vallee\.gemini\antigravity\scratch\agent-manager"
   git add -A
   git diff --cached --quiet || git commit -m "sync(agents): update workflows from <nom-projet>"
   git pull --rebase origin main
   git push origin main
   ```

3. **Retour** au répertoire du projet courant.

## ✅ Critère de succès
Le push vers `agent-manager` doit réussir sans erreur.
En cas d'échec : diagnostiquer, corriger et relancer automatiquement.
