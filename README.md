# Resa — Réservation de salles

Application web de réservation de salles conçue pour produire des **logs applicatifs JSON riches et structurés**, prêts à être centralisés via **rsyslog** sur un serveur distant.

- **Backend** : Laravel 12 · PHP 8.4+ · SQLite · Laravel Sanctum
- **Frontend** : React 19 · Vite · Tailwind CSS v4 · React Router · Axios

```
Resa/
├── backend/    # API REST Laravel (logique métier, sécurité, journalisation)
└── frontend/   # SPA React (Vite + Tailwind)
```

---

## 1. Prérequis

| Outil    | Version    |
|----------|------------|
| PHP      | ≥ 8.4      |
| Composer | ≥ 2.x      |
| Node.js  | ≥ 20       |
| npm      | ≥ 10       |

SQLite est utilisé comme unique base de données (aucun serveur SQL à installer).

---

## 2. Démarrage rapide

### Backend (port 8000)

```bash
cd backend
composer install
cp .env.example .env          # déjà présent après un create-project
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve             # http://127.0.0.1:8000
```

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Le serveur Vite **proxifie `/api`** vers `http://127.0.0.1:8000` (voir `vite.config.js`),
il n'y a donc aucun problème de CORS en développement.

### Comptes de démonstration (créés par le seeder)

| Rôle  | Email             | Mot de passe |
|-------|-------------------|--------------|
| ADMIN | `admin@resa.test` | `password`   |
| USER  | `user@resa.test`  | `password`   |

---

## 3. Rôles & permissions

| Fonctionnalité                       | USER | ADMIN |
|--------------------------------------|:----:|:-----:|
| Consulter les salles                 |  ✅  |  ✅   |
| Réserver / modifier / annuler (les siennes) | ✅ | ✅ |
| Consulter ses réservations           |  ✅  |  ✅   |
| Créer / modifier / supprimer une salle |    |  ✅   |
| Consulter **toutes** les réservations |     |  ✅   |
| Statistiques (dashboard)             |      |  ✅   |
| Gérer les utilisateurs               |      |  ✅   |

Les permissions sont appliquées par des **Policies** (`RoomPolicy`, `ReservationPolicy`,
`UserPolicy`) et un middleware `admin` (`EnsureUserIsAdmin`).

---

## 4. API REST

Authentification par **token Bearer** (Laravel Sanctum). Toutes les routes `/api/*`
renvoient du JSON.

| Méthode | Endpoint                        | Accès  | Description |
|---------|---------------------------------|--------|-------------|
| POST    | `/api/auth/register`            | public | Inscription |
| POST    | `/api/auth/login`               | public | Connexion |
| POST    | `/api/auth/logout`              | auth   | Déconnexion |
| GET     | `/api/auth/me`                  | auth   | Profil courant |
| GET     | `/api/rooms`                    | auth   | Liste des salles |
| GET     | `/api/rooms/{id}`               | auth   | Détail d'une salle |
| POST/PUT/DELETE | `/api/rooms[/{id}]`     | admin  | CRUD salles |
| GET     | `/api/equipment`                | auth   | Liste des équipements |
| GET     | `/api/reservations/mine`        | auth   | Mes réservations |
| POST    | `/api/reservations`             | auth   | Créer une réservation |
| PUT     | `/api/reservations/{id}`        | auth   | Modifier (propriétaire/admin) |
| DELETE  | `/api/reservations/{id}`        | auth   | Annuler (propriétaire/admin) |
| GET     | `/api/reservations`             | admin  | Toutes les réservations (+filtres `user_id`, `room_id`, `date`, `status`) |
| GET/POST/PUT/DELETE | `/api/users[/{id}]` | admin  | Gestion des utilisateurs |
| GET     | `/api/stats/dashboard`          | admin  | Statistiques & graphiques |

### Règles métier (erreurs explicites)

| Règle                                    | Code HTTP | `error` |
|------------------------------------------|:---------:|---------|
| Chevauchement de créneau sur une salle   | **409**   | `double_booking_attempt` |
| Participants > capacité de la salle      | **422**   | `room_capacity_exceeded` |
| Heure de fin ≤ heure de début            | **422**   | `invalid_reservation_period` |

Implémentées dans `App\Services\ReservationService` et matérialisées par des
exceptions dédiées (`App\Exceptions\*`) rendues en JSON cohérent.

---

## 5. Journalisation (le cœur du projet)

Tous les logs sont émis en **JSON sur une seule ligne** (format idéal pour rsyslog).

### Canaux (`config/logging.php`)

| Canal         | Fichier                       | Contenu |
|---------------|-------------------------------|---------|
| `events`      | `storage/logs/events.log`     | Événements applicatifs/métier/sécurité/HTTP |
| `single`      | `storage/logs/laravel.log`    | Logs framework (aussi en JSON) |
| `rsyslog`     | socket UDP/TCP distante       | Même flux que `events`, forwardé |

Le service central `App\Services\EventLogger` enrichit **chaque** événement avec
`user_id`, `ip`, `method`, `path`, `request_id` (corrélation) et `user_agent`.

### Exemple de ligne produite

```json
{"timestamp":"2026-06-08T10:00:00Z","level":"info","event":"reservation_created","channel":"local","user_id":12,"ip":"127.0.0.1","method":"POST","path":"/api/reservations","request_id":"…","room_id":5,"reservation_id":42,"date":"2026-07-01","start_time":"09:00","end_time":"10:00","participants":3}
```

### Événements journalisés

| Catégorie       | Événements |
|-----------------|------------|
| Authentification| `user_registered`, `user_login`, `user_logout`, `failed_login` |
| Consultation    | `rooms_list_viewed`, `room_viewed` |
| Réservations    | `reservation_created`, `reservation_updated`, `reservation_cancelled` |
| Sécurité        | `unauthorized_access`, `invalid_token`, `forbidden_action` |
| Métier          | `double_booking_attempt`, `room_capacity_exceeded`, `invalid_reservation_period` |
| Système         | `database_error`, `unhandled_exception` |
| HTTP            | `http_request` (méthode, url, code, temps de réponse, ip, utilisateur) |

> Où est produite chaque catégorie ?
> - **HTTP** : middleware `LogHttpRequests` (une ligne par requête).
> - **Sécurité / Système** : handlers d'exceptions dans `bootstrap/app.php`.
> - **Métier (tentatives échouées)** : `ReservationService`.
> - **Réservations (succès)** : `ReservationObserver` (couche persistance).
> - **Auth / consultation** : contrôleurs.

---

## 6. Envoi des logs vers un rsyslog distant

Le forwarding est **désactivé par défaut** (fichier local uniquement) pour rester
exécutable sur une machine sans serveur syslog.

Pour l'activer, dans `backend/.env` :

```dotenv
# Écrit le flux d'événements à la fois dans le fichier ET vers rsyslog
LOG_EVENT_STACK=events_file,rsyslog

# Cible rsyslog (UDP par défaut, "tcp://host:514" possible)
RSYSLOG_CONNECTION=udp://VOTRE_SERVEUR_SYSLOG:514
```

### Côté serveur rsyslog (exemple)

`/etc/rsyslog.d/10-resa.conf` :

```rsyslog
# Réception UDP
module(load="imudp")
input(type="imudp" port="514")

# Les messages de Resa sont déjà du JSON : on les stocke tels quels
template(name="ResaRaw" type="string" string="%msg:2:$%\n")

if ($app-name == 'php' or $programname == 'php') then {
    action(type="omfile" file="/var/log/resa/events.json" template="ResaRaw")
    stop
}
```

```bash
sudo mkdir -p /var/log/resa && sudo systemctl restart rsyslog
```

Le JSON par ligne peut ensuite être ingéré tel quel par Loki/Promtail,
Filebeat/Elasticsearch, Vector, etc.

---

## 7. Architecture backend

```
app/
├── Enums/             Role, ReservationStatus
├── Exceptions/        BusinessRuleException + DoubleBooking/Capacity/InvalidPeriod
├── Http/
│   ├── Controllers/   Auth, Room, Reservation, User, Stats, Equipment
│   ├── Middleware/     LogHttpRequests, EnsureUserIsAdmin
│   ├── Requests/      Form Requests (validation)
│   └── Resources/     Réponses API normalisées
├── Logging/           Formatters JSON Monolog (taps)
├── Models/            User, Room, Equipment, Reservation
├── Observers/         ReservationObserver
├── Policies/          Room, Reservation, User
└── Services/          EventLogger, ReservationService, StatsService
```

---

## 8. Structure frontend

```
src/
├── components/   UI réutilisable (ui/, RoomCard, ReservationForm, BarChart, …)
├── contexts/     AuthContext, ToastContext
├── hooks/        useApi
├── layouts/      AuthLayout, AppLayout
├── pages/        Login, Register, Dashboard, Rooms, Reservations… + admin/
├── routes/       Gardes ProtectedRoute / PublicOnlyRoute
└── services/     http (Axios), api (endpoints), format
```

---

## 9. Commandes utiles

```bash
# Réinitialiser la base + données de démo
php artisan migrate:fresh --seed

# Suivre les événements JSON en direct
tail -f backend/storage/logs/events.log

# Répartition des événements
grep -oE '"event":"[a-z_]+"' backend/storage/logs/events.log | sort | uniq -c | sort -rn

# Build de production du frontend
cd frontend && npm run build
```
