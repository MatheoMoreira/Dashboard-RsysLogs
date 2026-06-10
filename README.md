# Dashboard PHP · rsyslog — Centralisation et visualisation des logs

Projet : centraliser les journaux d'une application web via **rsyslog** et les
visualiser dans un **dashboard PHP** (architecture **MVC**, programmation modulaire,
**POO**). L'ensemble est **conteneurisé avec Docker**.

> Dépôt monorepo : l'application émettrice de logs (**Resa**) et le **dashboard** de
> supervision cohabitent, orchestrés par un unique `docker-compose.yml`.

## Architecture

```
              HTTPS                /api    ┌────────────────┐  logs JSON   ┌──────────┐  INSERT   ┌──────────┐
 client ──▶ ┌───────┐  ┌────────────────┐ ────────▶ │  resa-backend  │ ───TCP:514─▶ │ rsyslog  │ ────────▶ │ mariadb  │
            │ Caddy │─▶│ resa-frontend  │           │ (Laravel 8.4)  │              │ (ommysql)│           │  events  │
            │ (TLS) │  │ (React/nginx)  │           └────────────────┘              └──────────┘           └────┬─────┘
            └───────┘  └────────────────┘                                                                      │ SELECT
                                                                                                         ┌─────▼──────┐
                                                                                                         │ dashboard  │
                                                                                                         │ (PHP MVC)  │
                                                                                                         └────────────┘
```

> Caddy (reverse-proxy) est le point d'entrée public : il termine le **TLS**
> (Let's Encrypt) et relaie en HTTP interne vers nginx. nginx restaure l'IP cliente
> réelle (`real_ip`), bloque les sondes de scanners (403 → `scanner_probe`) et
> journalise tous les accès.

## Structure du dépôt

```
.
├── resa/              Application Resa (Laravel + React) — émet les logs
│   ├── backend/       API REST Laravel (journalisation JSON)
│   └── frontend/      SPA React (Vite + Tailwind)
├── dashboard/         Dashboard PHP — architecture MVC maison (POO)
│   ├── public/        Front controller (point d'entrée unique)
│   ├── src/Core/      Router · Controller · View · Database (PDO)
│   ├── src/Controllers/  DashboardController · EventsController
│   ├── src/Models/    EventModel (requêtes sur la table events)
│   └── src/Views/     Vues (vue d'ensemble, liste, détail)
├── docker/            Dockerfiles (resa-backend, resa-frontend, rsyslog)
├── db/                init.sql (schéma de la table events)
├── docker/caddy/      Caddyfile (reverse-proxy + TLS automatique)
├── db/migrations/     Migrations SQL à appliquer aux bases déjà initialisées
├── docker-compose.yml Orchestration des 6 services
└── .env.example       Modèle de configuration (copier en .env)
```

## Prérequis

- Docker Engine + plugin `docker compose`
  ```bash
  curl -fsSL https://get.docker.com | sudo sh
  sudo apt-get install -y docker-compose-plugin
  ```

## Démarrage

```bash
cp .env.example .env          # configuration (identifiants DB, ports, domaine HTTPS)
docker compose up --build -d  # build + lancement des 6 services
docker compose ps             # mariadb healthy, autres services up
```

> **HTTPS (production).** Le frontend est servi derrière **Caddy**, qui obtient et
> renouvelle automatiquement un certificat **Let's Encrypt**. Renseigne dans `.env` :
> `RESA_DOMAIN` (domaine public pointant vers le serveur) et `ACME_EMAIL` (facultatif).
> Les ports 80 et 443 doivent être joignables depuis Internet. En local, on accède via
> le domaine configuré (certificat auto valable pour ce nom).

> **Chargement initial des données (une seule fois).** Le backend applique
> uniquement les migrations au démarrage (comportement prod : pas de
> réinitialisation ni de seed automatique, la base SQLite est persistée dans
> un volume). Pour créer le compte administrateur et le catalogue de salles
> lors de la première mise en route :
>
> ```bash
> docker compose exec resa-backend php artisan db:seed --force
> ```

> **Migration de classification bot (base déjà initialisée).** Le schéma `init.sql`
> n'est appliqué qu'à la création de la base. Sur une base existante, ajoute les
> colonnes `user_agent`/`is_bot` (le trafic humain/bot du dashboard) avec :
>
> ```bash
> docker compose exec -T mariadb sh -c \
>   'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' \
>   < db/migrations/2026-06-10-bot-classification.sql
> ```

- **Application Resa** : `https://<RESA_DOMAIN>` (HTTP redirige vers HTTPS) — administrateur `admin@resa.test` / `password`
- **Dashboard logs**   : <http://localhost:8080>

> Aucun compte de démonstration n'est exposé : les utilisateurs s'inscrivent
> via l'application. Seul l'administrateur est créé par le seed initial.

## Vérifier la chaîne de centralisation

```bash
# Messages reçus par rsyslog (copie brute de debug)
docker compose exec rsyslog tail -f /var/log/resa/events.log

# Événements insérés en base
docker compose exec mariadb \
  mariadb -u rsyslog -prsyslog_pwd rsyslog_dashboard \
  -e "SELECT id, received_at, event, level, user_id FROM events ORDER BY id DESC LIMIT 10;"
```

## Services

| Service        | Rôle                                                       | Port  |
|----------------|------------------------------------------------------------|-------|
| `caddy`        | Reverse-proxy public + TLS automatique (Let's Encrypt)     | 80, 443 |
| `resa-frontend`| SPA React servie par nginx (proxy `/api`, blocage des scans) — interne | — |
| `resa-backend` | API Laravel ; forward des événements JSON vers rsyslog     | 8000  |
| `rsyslog`      | Réception UDP/TCP 514 → insertion MariaDB (`ommysql`)      | —     |
| `mariadb`      | Base `rsyslog_dashboard`, table `events`                   | 3306  |
| `dashboard`    | Dashboard PHP MVC (lecture des logs)                       | 8080  |

## Sécurité — moindre privilège sur les journaux

Deux comptes MariaDB distincts sont utilisés (séparation des rôles, recommandation
ANSSI sur la protection de l'intégrité des journaux) :

| Compte         | Droits                       | Utilisé par |
|----------------|------------------------------|-------------|
| `rsyslog`      | `INSERT` (écriture des logs) | `rsyslog`   |
| `dashboard_ro` | `SELECT` (lecture seule)     | `dashboard` |

Le dashboard ne peut **jamais** modifier ni supprimer un événement : une éventuelle
faille de l'interface de consultation ne permet pas d'altérer les journaux. Le compte
en lecture seule est créé automatiquement au premier démarrage par
`db/20-dashboard-grant.sh`.

## Sources de journaux

Le système centralise plusieurs sources, toutes consultables dans le dashboard
(sauf le slow query log, propre à MariaDB) :

| Source             | Contenu                                                            | Destination                |
|--------------------|-------------------------------------------------------------------|----------------------------|
| Backend Resa       | Événements métier + `http_request` (4xx → warning, 5xx → error), sécurité (`failed_login`, `invalid_token`, `unauthorized_access`…) | rsyslog → `events` (dashboard) |
| nginx (site public)| `http_access` (tous les accès, IP cliente réelle) et `scanner_probe` (sondes bloquées en 403 : `/.env`, `/wp-admin`, `/.git/config`…). Trafic classé **humain/bot** (`is_bot`). | rsyslog → `events` (dashboard) |
| MariaDB            | Slow query log (requêtes ≥ 1 s ou sans index)                     | `/var/lib/mysql/slow.log`  |

- Les accès nginx sont émis au **format JSON** compatible avec la table `events`
  (`docker/resa-frontend.Dockerfile`). rsyslog extrait par regex la portion JSON,
  que le message soit brut (app) ou encadré syslog (nginx).
- Consulter le slow query log :
  ```bash
  docker compose exec mariadb tail -f /var/lib/mysql/slow.log
  ```

## Workflow git

- `main` : versions stables (taguées).
- `develop` : branche d'intégration.
- `feature/*` : une branche par fonctionnalité, fusionnée dans `develop` (`--no-ff`).

## Licence

Projet pédagogique — usage académique.
