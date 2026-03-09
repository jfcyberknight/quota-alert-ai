---
name: doc-triage-master
description: Génère une documentation technique claire et organise les issues/bugs en analysant le contexte du code.
---

# Instructions
Ce skill s'active pour documenter le code existant ou structurer les retours utilisateurs.

## 1. Documentation Technique
- **README** : Génère des fichiers Markdown structurés (Installation, Usage, API, Exemples).
- **Architecture** : Explique le flux de données entre les modules.
- **JSDoc/Docstrings** : Ajoute des commentaires normalisés sur les fonctions complexes (paramètres, retours, exceptions).

## 2. Triage d'Issues & Bugs
- **Analyse de Cause** : Si un bug est soumis, remonte jusqu'à la ligne de code source probable.
- **Priorisation** : Classe selon la matrice (Bloquant, Majeur, Mineur).
- **Étiquetage** : Suggère des labels (ex: `bug`, `feature`, `refactor`).

## Règles de Rédaction
- Utilise un ton professionnel, clair et concis.
- Inclus systématiquement des blocs de code d'exemple pour la doc.
- Pour les bugs, demande toujours les étapes de reproduction si elles manquent.

## Format de Sortie (Doc)
- Titre clair.
- Table des matières (pour les longs documents).
- Section "Exemple rapide".
