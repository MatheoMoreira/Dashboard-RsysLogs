# Documentation utilisateur

Cette documentation est organisée **par cas d'utilisation**. Deux applications
cohabitent : **Resa** (qui génère les journaux) et le **Dashboard** (qui les consulte).

## Rôles utilisateurs

| Rôle | Application | Droits |
|------|-------------|--------|
| **Visiteur** | Resa | s'inscrire, se connecter |
| **Utilisateur (USER)** | Resa | consulter les salles, créer/modifier/annuler **ses** réservations |
| **Administrateur (ADMIN)** | Resa | gérer salles, équipements, utilisateurs, voir toutes les réservations et les statistiques |
| **Exploitant / Analyste** | Dashboard | consulter les journaux centralisés (lecture seule) |

## Accès

| Application | URL | Identifiants |
|-------------|-----|--------------|
| Resa | <http://localhost> | admin : `admin@resa.test` / `password` (créé par le seed). Les autres comptes s'inscrivent. |
| Dashboard logs | <http://localhost:8080> | aucun (consultation, lecture seule) |

---

## Cas d'utilisation — Application Resa

### UC-01 — S'inscrire
1. Ouvrir <http://localhost> → **Créer un compte**.
2. Renseigner nom, email, mot de passe.
3. Validation → compte `USER` créé, connexion automatique.
> Journalise : `user_registered`.

### UC-02 — Se connecter / se déconnecter
1. Page de connexion → email + mot de passe.
2. En cas d'échec, message d'erreur. → Journalise `failed_login` (warning).
3. Connexion réussie → `user_login`. Déconnexion via le menu → `user_logout`.

### UC-03 — Consulter les salles
1. Menu **Salles** → liste des salles disponibles (capacité, équipements).
2. Cliquer une salle → fiche détail. → Journalise `rooms_list_viewed`, `room_viewed`.

### UC-04 — Créer une réservation
1. Menu **Nouvelle réservation** → choisir salle, date, créneau.
2. Valider. Contrôles métier : double réservation refusée (`double_booking_attempt`),
   capacité dépassée (`room_capacity_exceeded`), période invalide
   (`invalid_reservation_period`).
3. Succès → `reservation_created`.

### UC-05 — Gérer mes réservations
1. Menu **Mes réservations** → liste.
2. Modifier (`reservation_updated`) ou annuler (`reservation_cancelled`).

### UC-06 — Administrer (ADMIN)
1. Espace admin → **Salles**, **Équipements**, **Utilisateurs**, **Réservations**, **Tableau de bord**.
2. Créer/modifier/supprimer salles, équipements, utilisateurs ; consulter les statistiques.
> Tout accès admin par un non-admin journalise `unauthorized_access` / `forbidden_action`.

---

## Cas d'utilisation — Dashboard de journalisation

### UC-07 — Vue d'ensemble
1. Ouvrir <http://localhost:8080>.
2. La page d'accueil affiche : nombre total d'événements, événements des dernières
   24 h, **répartition par type** et **par niveau** (info/warning/error), et le
   décompte des événements de **sécurité**.
3. Si la base n'est pas encore prête (premier démarrage), une page d'attente s'affiche.

### UC-08 — Lister les événements
1. Menu **Événements** (`/events`) → liste paginée, du plus récent au plus ancien.
2. Chaque ligne : horodatage, type d'événement, niveau, utilisateur, IP.

### UC-09 — Consulter le détail d'un événement
1. Depuis la liste, cliquer un événement → `/events/show`.
2. Affiche tous les champs promus **et le JSON brut** d'origine.

### UC-10 — Vérifier la chaîne de centralisation (exploitant)
```bash
# Messages reçus par rsyslog
docker compose exec rsyslog tail -f /var/log/resa/events.log
# Événements insérés en base
docker compose exec mariadb \
  mariadb -u rsyslog -prsyslog_pwd rsyslog_dashboard \
  -e "SELECT id, received_at, event, level, user_id FROM events ORDER BY id DESC LIMIT 10;"
```

---

## Résolution de problèmes (FAQ)

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Dashboard affiche « base non prête » | MariaDB démarre après le dashboard | Attendre quelques secondes / `docker compose ps` (état `healthy`). |
| Aucun événement dans le dashboard | Pas encore d'activité sur Resa, ou seed non lancé | Naviguer dans Resa ; lancer `docker compose exec resa-backend php artisan db:seed --force`. |
| Impossible de se connecter à Resa | Compte non créé | S'inscrire (UC-01) ou utiliser l'admin du seed. |
| Le dashboard ne peut rien modifier | **Comportement attendu** | Le dashboard est en lecture seule (compte `dashboard_ro`, intégrité ANSSI). |
