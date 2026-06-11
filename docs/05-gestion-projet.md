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
| L4 — Orchestration Docker (6 services) | ✅ |
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
- [x] `docker-compose.yml` (6 services), volumes persistants
- [x] Comptes MariaDB séparés (intégrité ANSSI)
- [x] Forward des accès nginx + slow query log MariaDB

### L5/L6 — Documentation & diagrammes
- [x] Analyse ANSSI, dossier de conception, doc utilisateur, tests de validation
- [x] UML use case, déploiement, synoptique, sitemap, mockups

### L7 — Qualité logicielle
- [x] Configuration **PHPStan** niveau 6 (`dashboard/phpstan.neon`) — `composer analyse`, **0 erreur**
- [x] Extraction des helpers (`src/helpers.php`) pour la modularité et l'analyse statique
- [x] Tests unitaires **PHPUnit** (28 tests) sur 3 couches — helpers, Model (`EventModel::buildWhere`), Core (`Router::normalizePath`) — `composer test`
- [x] **Performances mesurées** sur banc d'essai à 1 M de lignes + optimisation index ([../docs/08-performances.md](08-performances.md))

## Échéancier (jalons)

| Jalon | Contenu | Tag |
|-------|---------|-----|
| J1 | Application Resa + journalisation | — |
| J2 | Chaîne rsyslog → MariaDB + dashboard | `v1.0.0` |
| J3 | Journalisation étendue (accès nginx, slow query log) + refonte visuelle | `v1.1.0` |
| J4 | HTTPS (Caddy) + anti-scan + classification bot | `v1.2.0` |
| J5 | Dossier documentaire complet + renforcement preuve + qualité logicielle | `v1.2.0` |

## Gestion des risques

Registre des risques du projet (probabilité P et impact I sur 3 ; criticité = P × I).
Les **risques survenus** sont marqués 🔴 et reliés à l'action réellement déclenchée —
ce qui rend ce registre vérifiable dans l'historique Git plutôt que purement théorique.

| # | Risque | P | I | Crit. | Mitigation prévue | Statut / action réelle |
|---|--------|:-:|:-:|:----:|-------------------|------------------------|
| R-01 | Altération/suppression des journaux via l'interface de consultation | 2 | 3 | 6 | Moindre privilège : `dashboard_ro` en `SELECT` seul | ✅ Maîtrisé (cf. ANSSI R4/R5, test T-04) |
| R-02 | **IP source masquée** par le NAT Docker (journaux inexploitables) | 3 | 2 | 6 | Reverse-proxy transmettant `X-Forwarded-For` | 🔴 **Survenu** (2026-06-10) : `userland-proxy` réécrivait l'IP en `172.18.0.1`. Action : Caddy en `network_mode: host` (commit `2d7706a`) après échec d'une 1re piste (`daemon.json`) |
| R-03 | Identifiants en clair sur le réseau (frontend HTTP) | 2 | 3 | 6 | TLS | ✅ Traité : Caddy + Let's Encrypt (commit `f06440c`) |
| R-04 | Dashboard indisponible si MariaDB pas encore prête au boot | 3 | 1 | 3 | `healthcheck` + page d'attente `isReady()` | ✅ Maîtrisé |
| R-05 | **Dégradation des perfs** à forte volumétrie (≥ 10⁶ lignes) | 2 | 2 | 4 | Index sur colonnes générées | 🔴 **Survenu en test** : KPI trafic à ~4,2 s à 1 M. Action : index composite `(channel, is_bot)` → ~80 ms (cf. [08-performances.md](08-performances.md)) |
| R-06 | Saturation disque par croissance illimitée de la table `events` | 2 | 2 | 4 | Politique de rétention / purge | 🟡 Identifié, planifié (ANSSI R11) |
| R-07 | Scans automatisés polluant les journaux / sondant des failles | 3 | 1 | 3 | Blocage 403 + classification bot | ✅ Traité (commit `f06440c`, `1fe9589`) |
| R-08 | Perte de la base (volume Docker corrompu/supprimé) | 1 | 3 | 3 | Sauvegarde externalisée | 🟡 Identifié, planifié (ANSSI R12) |
| R-09 | Périmètre solo : facteur de bus = 1, surcharge ponctuelle | 2 | 2 | 4 | Découpage en `feature/*`, doc à jour | 🟢 Accepté (contrainte projet) |

> Deux risques se sont **effectivement matérialisés** (R-02, R-05) et ont déclenché une
> action tracée dans Git — la colonne « action réelle » est donc opposable.

## Indicateurs de suivi (prévu / réalisé)

Suivi par jalon, **reconstruit depuis l'historique Git** (dates et volumes de commits
vérifiables) — c'est la source de vérité du projet, à défaut d'un outil de gestion tiers.

| Jalon | Contenu | Fin prévue | Fin réelle | Écart | Commits |
|-------|---------|:----------:|:----------:|:-----:|:------:|
| J1 | App Resa + journalisation `EventLogger` | 08/06 | 08/06 | 0 | 5 |
| J2 | Chaîne rsyslog → MariaDB + dashboard MVC | 09/06 | 09/06 | 0 | ~20 |
| J3 | Journalisation étendue (nginx, slow log) + refonte visuelle | 09/06 | 09–10/06 | +0,5 j | ~15 |
| J4 | HTTPS + anti-scan + classif. bot + dossier doc + qualité | 10/06 | 11/06 | +1 j | ~12 |
| J5 | **Renforcement preuve** (perf mesurée, risques, IA brute) + intégration `main` | 11/06 | 11/06 | 0 | 18 |

**Indicateurs synthétiques** (au 2026-06-11) :

| Indicateur | Valeur |
|-----------|--------|
| Livrables terminés | 7 / 7 (L1–L7) |
| Jalons tenus | 5 / 5 clôturés (écart cumulé +1,5 j) |
| Commits (total / sur `main`) | 71, intégralité sur `main` après merge `v1.2.0` (solo) |
| Couverture tests | 28 tests / 48 assertions, couches Model + Core + helpers |
| PHPStan | niveau 6, 0 erreur |
| Exigences perf vérifiées | 3 / 3 mesurées (cf. P-1…P-3) |

**Analyse des écarts** : l'étalement réel (08→11/06) est plus dense que prévu côté J3/J4,
absorbé sans re-planification du périmètre. Le seul aléa non anticipé (R-02, IP réelle) a
coûté ~½ journée mais a abouti à une solution durable (host-network documentée en mémoire
projet).

## Traçabilité Git (critère 20)

- **Workflow** : `main` (stable, tags) ← `develop` (intégration) ← `feature/*`
  (une branche par fonctionnalité, merges `--no-ff`).
- **Branches** : `feature/resa-app`, `feature/php-dashboard`, `feature/docker-stack`, …
- **Volume** : 71 commits, 100 % attribuables à Mathéo Moreira (projet solo).

> Vérification par l'évaluateur : `python3 eval/eval.py commits --repo <dépôt>`.
