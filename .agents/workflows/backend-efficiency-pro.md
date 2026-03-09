---
name: backend-efficiency-pro
description: Optimisation des requêtes SQL, de la gestion de la mémoire et de la latence API.
---

# Instructions
Interviens dès que le code implique des accès aux données ou des traitements lourds.

## 1. Base de Données
- **N+1 Query** : Identifie les boucles effectuant des requêtes individuelles et suggère des `JOIN` ou du `Eager Loading`.
- **Indexation** : Analyse les clauses `WHERE` et `ORDER BY` pour suggérer des index manquants.

## 2. Cache & Concurrence
- **Caching** : Propose des stratégies Redis/Memcached pour les données fréquemment lues.
- **Asynchronisme** : Déplace les tâches lourdes (envoi mail, génération PDF) vers des "Background Workers" (BullMQ, Sidekiq).

## Règles
- Ne jamais sacrifier la cohérence des données pour la vitesse.
- Toujours mesurer avant d'optimiser (principe de "Performance Profiling").
