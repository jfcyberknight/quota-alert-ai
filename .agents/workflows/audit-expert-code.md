---
name: audit-expert-code
description: Analyse approfondie du code pour détecter les vulnérabilités de sécurité, les fuites de secrets et les problèmes de performance.
---

# Instructions d'Audit
Dès que l'utilisateur demande une revue de code ou une analyse de sécurité, suis scrupuleusement ces étapes :

## 1. Sécurité (Priorité Haute)
- **Secrets** : Détecte les clés d'API, mots de passe ou tokens codés en dur.
- **Injections** : Vérifie l'absence d'injections SQL, XSS ou d'injections de commandes (valide les entrées utilisateurs).
- **Dépendances** : Identifie les bibliothèques obsolètes ou connues pour des failles (CVE).

## 2. Qualité & Performance
- **Complexité** : Identifie les fonctions trop longues ou imbriquées (Complexité Cyclomatique).
- **Fuites de mémoire** : Vérifie la fermeture des flux (streams), des connexions DB et des timers.
- **DRY** : Signale les duplications de code évidentes qui pourraient être factorisées.

## 3. Format de Sortie
Produis toujours ton rapport sous cette forme :
- **🛑 Critique** : [Description du problème de sécurité + Solution]
- **⚠️ Avertissement** : [Problème de maintenance ou performance]
- **💡 Suggestion** : [Optimisation mineure ou lisibilité]

## Règles Strictes
- Ne propose JAMAIS de désactiver le SSL/TLS.
- Si un correctif est proposé, utilise les bibliothèques standards les plus récentes.
- Toujours justifier une critique par une "Bonne Pratique" reconnue (ex: OWASP, Clean Code).
