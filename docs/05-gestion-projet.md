# Gestion de projet

## Composition de l'équipe et répartition de la charge

Projet réalisé **individuellement** par **Mathéo Moreira**.

| Étudiant | Charge déclarée | Périmètre |
|----------|:--------------:|-----------|
| Mathéo Moreira | **100 %** | Conception, développement, conteneurisation, documentation, tests |

> Projet solo : la charge se répartit à 100 % sur l'unique contributeur. La
> traçabilité Git le confirme (cf. ci-dessous et critère 20).

## Liste des livrables

| Livrable | Statut |
|----------|:------:|
| L1 — Application Resa (backend Laravel + frontend React) | ✅ |
| L2 — Service rsyslog + schéma de base `events` | ✅ |
| L3 — Dashboard PHP MVC | ✅ |
| L4 — Orchestration Docker (5 services) | ✅ |
| L5 — Documentation (ANSSI, conception, utilisateur, tests) | ✅ |
| L6 — Diagrammes UML & schémas | ✅ |
| L7 — Qualité logicielle (PHPStan niveau 6, tests unitaires PHPUnit) | ✅ |

## Tâches détaillées par livrable

### L1 — Application Resa
- [x] Modèle de données (users, rooms, equipment, reservations) + migrations
- [x] API REST (auth Sanctum, salles, réservations, admin)
- [x] Règles métier (double booking, capacité, période) via services/exceptions
- [x] **Service de journalisation** `EventLogger` (JSON structuré)
- [x] SPA React (pages user + admin)

### L2 — Centralisation rsyslog
- [x] Image rsyslog avec module `ommysql`
- [x] Réception TCP/UDP 514, extraction regex du JSON (app + nginx)
- [x] Schéma `events` : JSON brut + colonnes générées indexées

### L3 — Dashboard PHP
- [x] MVC maison (Router, Controller, View, Database PDO)
- [x] Vue d'ensemble (compteurs, répartition type/niveau, sécurité)
- [x] Liste paginée + fiche détail (JSON brut)
- [x] Page d'attente si base non prête

### L4 — Docker
- [x] `docker-compose.yml` (5 services), volumes persistants
- [x] Comptes MariaDB séparés (intégrité ANSSI)
- [x] Forward des accès nginx + slow query log MariaDB

### L5/L6 — Documentation & diagrammes
- [x] Analyse ANSSI, dossier de conception, doc utilisateur, tests de validation
- [x] UML use case, déploiement, synoptique, sitemap, mockups

### L7 — Qualité logicielle
- [x] Configuration **PHPStan** niveau 6 (`dashboard/phpstan.neon`) — `composer analyse`, **0 erreur**
- [x] Extraction des helpers (`src/helpers.php`) pour la modularité et l'analyse statique
- [x] Tests unitaires **PHPUnit** des fonctions utilitaires (`tests/Unit/HelpersTest.php`) — `composer test`

## Échéancier (jalons)

| Jalon | Contenu | Tag |
|-------|---------|-----|
| J1 | Application Resa + journalisation | — |
| J2 | Chaîne rsyslog → MariaDB + dashboard | `v1.0.0` |
| J3 | Journalisation étendue (accès nginx, slow query log) + refonte visuelle | `v1.1.0` |
| J4 | Dossier documentaire complet + qualité logicielle | en cours |

## Traçabilité Git (critère 20)

- **Workflow** : `main` (stable, tags) ← `develop` (intégration) ← `feature/*`
  (une branche par fonctionnalité, merges `--no-ff`).
- **Branches** : `feature/resa-app`, `feature/php-dashboard`, `feature/docker-stack`, …
- **Volume** : 47 commits, 100 % attribuables à Mathéo Moreira (projet solo).

> Vérification par l'évaluateur : `python3 eval/eval.py commits --repo <dépôt>`.
