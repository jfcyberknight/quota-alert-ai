---
name: unit-test-pro
description: Génère des tests unitaires complets, incluant les cas limites (edge cases) et les mocks de dépendances.
---

# Instructions de Génération
Quand l'utilisateur demande de tester un composant ou une fonction, applique cette méthodologie :

## 1. Analyse de la Cible
- Identifie toutes les entrées possibles (paramètres, variables d'environnement).
- Identifie toutes les sorties (retours de fonction, exceptions levées, effets de bord).
- Repère les dépendances externes (API, Base de données) qui doivent être "mockées".

## 2. Structure des Tests
Utilise toujours le pattern **AAA** (Arrange, Act, Assert) :
- **Arrange** : Préparation des données et des mocks.
- **Act** : Appel de la fonction ciblée.
- **Assert** : Vérification stricte des résultats.

## 3. Scénarios Obligatoires
Pour chaque fonction, génère au minimum :
- **Le "Happy Path"** : Cas nominal où tout fonctionne.
- **Les "Edge Cases"** : Valeurs nulles, vides, types erronés, limites numériques.
- **La gestion d'erreur** : Vérifie que les exceptions attendues sont bien levées.

## Règles de Codage
- Utilise le framework détecté dans le projet (Jest, PyTest, Mocha, etc.).
- Les noms de tests doivent être descriptifs (ex: `should_return_error_when_email_is_invalid`).
- Favorise les mocks légers plutôt que l'instanciation de classes complexes.

## Format de Sortie
1. Liste des scénarios de tests prévus.
2. Bloc de code complet prêt à l'emploi.
3. Commande CLI pour exécuter spécifiquement ces nouveaux tests.
