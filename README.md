# Dashboard PHP · rsyslog — Centralisation et visualisation des logs

Projet : centraliser les journaux d'une application web via **rsyslog** et les
visualiser dans un **dashboard PHP** (architecture **MVC**, programmation modulaire,
**POO**). L'ensemble est **conteneurisé avec Docker**.

> Dépôt monorepo : l'application émettrice de logs (**Resa**) et le **dashboard** de
> supervision cohabitent, orchestrés par un unique `docker-compose.yml`.

## Architecture

```
┌────────────────┐   /api    ┌────────────────┐  logs JSON   ┌──────────┐  INSERT   ┌──────────┐
│ resa-frontend  │ ────────▶ │  resa-backend  │ ───UDP:514─▶ │ rsyslog  │ ────────▶ │ mariadb  │
│ (React/nginx)  │           │ (Laravel 8.4)  │              │ (ommysql)│           │  events  │
└────────────────┘           └────────────────┘              └──────────┘           └────┬─────┘
                                                                                          │ SELECT
                                                                                    ┌─────▼──────┐
                                                                                    │ dashboard  │
                                                                                    │ (PHP MVC)  │
                                                                                    └────────────┘
```

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
├── docker-compose.yml Orchestration des 5 services
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
cp .env.example .env          # configuration (identifiants DB, ports)
docker compose up --build -d  # build + lancement des 5 services
docker compose ps             # mariadb healthy, autres services up
```

- **Application Resa** : <http://localhost:5173> — login `admin@resa.test` / `password`
- **Dashboard logs**   : <http://localhost:8080>

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
| `resa-frontend`| SPA React servie par nginx (proxy `/api`)                  | 5173  |
| `resa-backend` | API Laravel ; forward des événements JSON vers rsyslog     | 8000  |
| `rsyslog`      | Réception UDP/TCP 514 → insertion MariaDB (`ommysql`)      | —     |
| `mariadb`      | Base `rsyslog_dashboard`, table `events`                   | 3306  |
| `dashboard`    | Dashboard PHP MVC (lecture des logs)                       | 8080  |

## Workflow git

- `main` : versions stables (taguées).
- `develop` : branche d'intégration.
- `feature/*` : une branche par fonctionnalité, fusionnée dans `develop` (`--no-ff`).

## Licence

Projet pédagogique — usage académique.
