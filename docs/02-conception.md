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

1. **P1** — Politique de rétention / purge automatique des journaux. *(à faire)*
2. **P1** — Alerting sur seuils (ex. rafale de `failed_login`). *(partiel : scans bloqués + acquittement des alertes en place ; notification à faire)*
3. **P2** — Authentification d'accès au dashboard (rôles consultation/admin). *(à faire)*
4. **P2** — ✅ **Réalisé** — Filtres et recherche avancée (plage de dates, type, niveau, **trafic humain/bot**).
5. **P3** — ✅ **Réalisé (web)** — Chiffrement TLS du frontend (Caddy/Let's Encrypt). Export CSV/JSON et TLS du transport des journaux : à faire.

## 3. Objectifs du projet (SMART)

La colonne **Atteint ?** reporte la **mesure réelle** observée (et non la cible),
avec le pointeur de preuve (test de recette `T-xx` ou mesure de performance `P-x`).
Les versions citées en colonne `T` correspondent aux tags Git du dépôt
(`v1.0.0`, `v1.1.0`, `v1.2.0`).

| Objectif | S | M (mesurable) | A | R | T | Atteint ? (mesure réelle) |
|----------|---|---------------|---|---|---|---------------------------|
| O1 — Centraliser 100 % des événements de Resa dans une base unique | ✔ | 0 perte sur la chaîne app → rsyslog → MariaDB | ✔ | ✔ | livré v1.0 | ✅ Oui — événements `user_login`/`failed_login` insérés en base (recette **T-01**, **T-02**) |
| O2 — Garantir l'intégrité par moindre privilège | ✔ | dashboard incapable d'écrire (compte `SELECT` seul) | ✔ | ✔ | livré v1.0 | ✅ Oui — `ERROR 1142 … DELETE command denied to 'dashboard_ro'` (recette **T-04**) |
| O3 — Fournir un dashboard de visualisation MVC | ✔ | vue d'ensemble + liste + détail opérationnelles | ✔ | ✔ | livré v1.0 | ✅ Oui — 3 vues opérationnelles (recette **T-08**, **T-09**) |
| O4 — Déploiement en une commande | ✔ | `docker compose up` lève les 6 services | ✔ | ✔ | livré v1.0 | ✅ Oui — 6 services `up` (mariadb, rsyslog, resa-backend, resa-frontend, caddy, dashboard) |
| O5 — Tracer les accès réseau (IP source réelle) | ✔ | `http_access` nginx visible dans le dashboard, IP cliente restituée derrière le proxy | ✔ | ✔ | livré v1.1 | ✅ Oui — IP réelle restituée (recette **T-03**, **T-14**), et non `172.x` du conteneur |
| O6 — Sécuriser les flux et le périmètre | ✔ | HTTPS (Caddy/Let's Encrypt) + blocage 403 des scans + classification humain/bot | ✔ | ✔ | livré v1.2 | ✅ Oui — HTTP→HTTPS `308` (**T-11**), `/.env` → `403` + `scanner_probe` (**T-12**), ventilation humain/bot (**T-13**) |

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
- **F7 — Classification du trafic humain / bot** : chaque accès web est marqué
  `is_bot` (scans bloqués + signatures de `user_agent`) ; KPIs et filtre dédiés.
- **F8 — Durcissement du frontend** : reverse-proxy Caddy (HTTPS/TLS automatique),
  blocage (403) et journalisation des sondes de scanners (`scanner_probe`),
  restitution de l'IP cliente réelle sur toute la chaîne (`real_ip` / `TrustProxies`).

## 5. Critères de performance

| Critère | Cible | Mesuré (cf. [08-performances.md](08-performances.md)) |
|---------|-------|--------------|
| Temps de réponse vue d'ensemble | < 500 ms pour ≤ 100 000 événements | **12 ms** (HTTP, base de démo) ; requêtes unitaires < 300 ms à **1 M** lignes ✅ |
| Latence d'ingestion (app → base) | < 1 s | insertion directe `ommysql`, pas de file intermédiaire (qualitatif) |
| Volumétrie supportée | ≥ 10⁶ lignes sans dégradation notable | **banc d'essai à 1 000 000 lignes** : pagination ~0,8 ms, agrégations ~200–300 ms ✅ |
| Détection des requêtes lentes | requêtes ≥ 1 s tracées | **slow query log** MariaDB activé (`docker/mariadb/logging.cnf`) |

> Ces cibles sont **mesurées et reproductibles** : protocole, résultats bruts et
> plans d'exécution dans [08-performances.md](08-performances.md). La campagne a révélé
> un goulot (calcul du trafic humain/bot, ~4,2 s à 1 M) **corrigé par un index composite
> `(channel, is_bot)`** → ~80 ms (≈ 50×), intégré au schéma.

## 6. Contraintes techniques

| Domaine | Contrainte |
|---------|-----------|
| OS / runtime | Docker Engine + plugin `docker compose` (Linux). |
| Services | 6 conteneurs : `caddy` (reverse-proxy TLS), `resa-frontend` (nginx), `resa-backend` (Laravel), `rsyslog`, `mariadb`, `dashboard` (PHP). |
| Réseau | Port 514 (rsyslog) et le frontend nginx **non publiés** sur l'hôte (réseau Docker interne). Entrée publique via Caddy : **80 → redirige vers 443 (HTTPS)**. Autres ports exposés : 8080 (dashboard), 8000 (API), 3306 (MariaDB). |
| TLS | Certificat **Let's Encrypt** automatique (Caddy) pour le domaine public ; nom de domaine + e-mail ACME paramétrés via `.env` (`RESA_DOMAIN`, `ACME_EMAIL`). |
| Sécurité | Moindre privilège DB (2 comptes), aucun compte de démo exposé hormis l'admin du seed. |
| Compatibilité | PHP ≥ 8.1 (dashboard) / PHP 8.4 (backend), MariaDB, MySQL `ommysql`. |
| Format d'échange | JSON sur une ligne, compatible insertion `ommysql` et colonnes générées. |

## 7. Matériels et logiciels mis en œuvre

| Composant | Rôle | Version |
|-----------|------|---------|
| Docker Engine / Compose | Orchestration | plugin `compose` v2 |
| Caddy | Reverse-proxy public + TLS automatique (Let's Encrypt) | `caddy:2-alpine` |
| nginx | Service frontend + émission `http_access` + blocage des scans | image officielle |
| Laravel | API backend Resa + journalisation | 12 (PHP 8.4) |
| React + Vite + Tailwind | SPA frontend Resa | React 19 / Vite / Tailwind v4 |
| Laravel Sanctum | Authentification API (tokens) | — |
| rsyslog (`ommysql`) | Collecte et insertion en base | image dédiée (`docker/rsyslog`) |
| MariaDB | Base de centralisation `events` | InnoDB, utf8mb4 |
| PHP (dashboard) | Visualisation MVC maison (PDO) | ≥ 8.1 |
| Composer | Autoload PSR-4 (dashboard & backend) | ≥ 2 |

> Projet **logiciel** : aucun matériel spécifique requis hors poste de développement
> / serveur hôte Docker (Linux, ≥ 2 Go RAM recommandés pour la stack complète).
