# Dossier de conception

## 1. Contexte (analyse de l'existant)

Les applications web produisent des journaux dispersés (logs applicatifs, logs du
serveur web, logs de base de données), souvent stockés localement, hétérogènes et
difficiles à exploiter. En cas d'incident de sécurité ou de bug, cette dispersion
rend l'investigation lente et peu fiable, et n'offre **aucune garantie d'intégrité**
des traces.

Le projet part d'une application web réaliste — **Resa**, un système de réservation
de salles (Laravel + React) — qui génère des événements métier et de sécurité. Dans
la situation initiale, ces événements ne sont consultables que via les fichiers de
log bruts, sans vue d'ensemble ni protection contre l'altération.

## 2. Expression du besoin

| Besoin | Description |
|--------|-------------|
| B1 | **Centraliser** en un point unique tous les journaux d'une application web. |
| B2 | **Normaliser** le format des journaux pour pouvoir les filtrer et les agréger. |
| B3 | **Garantir l'intégrité** des journaux (lecture seule côté consultation). |
| B4 | **Visualiser** les journaux dans une interface web simple (vue d'ensemble + détail). |
| B5 | Mettre en évidence les **événements de sécurité** (échecs d'authentification, scans, accès refusés). |
| B6 | Déploiement **reproductible** (conteneurisation). |

### Besoins d'évolution identifiés (priorisés)

1. **P1** — Politique de rétention / purge automatique des journaux.
2. **P1** — Alerting sur seuils (ex. rafale de `failed_login`).
3. **P2** — Authentification d'accès au dashboard (rôles consultation/admin).
4. **P2** — Filtres et recherche avancée (par plage de dates, par IP).
5. **P3** — Export (CSV/JSON) et transport chiffré TLS vers collecteur distant.

## 3. Objectifs du projet (SMART)

| Objectif | S | M (mesurable) | A | R | T |
|----------|---|---------------|---|---|---|
| O1 — Centraliser 100 % des événements de Resa dans une base unique | ✔ | 0 perte sur la chaîne app → rsyslog → MariaDB | ✔ | ✔ | livré v1.0 |
| O2 — Garantir l'intégrité par moindre privilège | ✔ | dashboard incapable d'écrire (compte `SELECT` seul) | ✔ | ✔ | livré v1.0 |
| O3 — Fournir un dashboard de visualisation MVC | ✔ | vue d'ensemble + liste + détail opérationnelles | ✔ | ✔ | livré v1.0 |
| O4 — Déploiement en une commande | ✔ | `docker compose up` lève les 5 services | ✔ | ✔ | livré v1.0 |
| O5 — Tracer les accès réseau (IP source) | ✔ | `http_access` nginx visible dans le dashboard | ✔ | ✔ | livré v1.1 |

## 4. Fonctions principales

- **F1 — Émission de journaux structurés** : l'application Resa émet chaque événement
  en JSON sur une ligne (`EventLogger` / `EventJsonFormatter`).
- **F2 — Collecte / centralisation** : rsyslog reçoit (TCP/UDP 514) et insère en base
  via le module `ommysql`.
- **F3 — Persistance normalisée** : table `events` avec JSON brut + colonnes générées
  indexées (`event`, `level`, `user_id`, `ip`, …).
- **F4 — Visualisation** : dashboard PHP MVC — vue d'ensemble (compteurs, répartition
  par type/niveau), liste paginée, fiche détail d'un événement.
- **F5 — Mise en évidence sécurité** : événements de sécurité distingués (niveau,
  type), accès nginx incluant les scans.
- **F6 — Cloisonnement des privilèges** : écriture et lecture sur deux comptes distincts.

## 5. Critères de performance

| Critère | Cible | Vérification |
|---------|-------|--------------|
| Temps de réponse vue d'ensemble | < 500 ms pour ≤ 100 000 événements | colonnes générées **indexées** (`idx_event`, `idx_level`, `idx_received_at`) évitant le re-parsing JSON |
| Latence d'ingestion (app → base) | < 1 s | insertion directe `ommysql`, pas de file intermédiaire |
| Volumétrie supportée | ≥ 10⁶ lignes sans dégradation notable | `BIGINT` PK + index ; pagination côté liste |
| Détection des requêtes lentes | requêtes ≥ 1 s tracées | **slow query log** MariaDB activé (`docker/mariadb/logging.cnf`) |

> Les index sont posés sur les colonnes effectivement filtrées/triées par le
> dashboard, ce qui garantit des `SELECT` sur colonnes plutôt que sur `JSON_EXTRACT`.

## 6. Contraintes techniques

| Domaine | Contrainte |
|---------|-----------|
| OS / runtime | Docker Engine + plugin `docker compose` (Linux). |
| Services | 5 conteneurs : `resa-frontend` (nginx), `resa-backend` (Laravel), `rsyslog`, `mariadb`, `dashboard` (PHP). |
| Réseau | Port 514 (rsyslog) **non publié** sur l'hôte (réseau Docker interne uniquement). Ports exposés : 80 (Resa), 8080 (dashboard), 8000 (API), 3306 (MariaDB). |
| Sécurité | Moindre privilège DB (2 comptes), aucun compte de démo exposé hormis l'admin du seed. |
| Compatibilité | PHP ≥ 8.1 (dashboard) / PHP 8.4 (backend), MariaDB, MySQL `ommysql`. |
| Format d'échange | JSON sur une ligne, compatible insertion `ommysql` et colonnes générées. |

## 7. Matériels et logiciels mis en œuvre

| Composant | Rôle | Version |
|-----------|------|---------|
| Docker Engine / Compose | Orchestration | plugin `compose` v2 |
| nginx | Service frontend + émission `http_access` | image officielle |
| Laravel | API backend Resa + journalisation | 12 (PHP 8.4) |
| React + Vite + Tailwind | SPA frontend Resa | React 19 / Vite / Tailwind v4 |
| Laravel Sanctum | Authentification API (tokens) | — |
| rsyslog (`ommysql`) | Collecte et insertion en base | image dédiée (`docker/rsyslog`) |
| MariaDB | Base de centralisation `events` | InnoDB, utf8mb4 |
| PHP (dashboard) | Visualisation MVC maison (PDO) | ≥ 8.1 |
| Composer | Autoload PSR-4 (dashboard & backend) | ≥ 2 |

> Projet **logiciel** : aucun matériel spécifique requis hors poste de développement
> / serveur hôte Docker (Linux, ≥ 2 Go RAM recommandés pour la stack complète).
