# Tests de validation (recette)

Chaque test suit le format exigé : **état initial → action → résultat attendu →
résultat obtenu**. Les tests sont rattachés aux cas d'utilisation (`UC-xx`,
voir [03-documentation-utilisateur.md](03-documentation-utilisateur.md)).

> Environnement de test : stack lancée via `docker compose up --build -d`, seed
> initial appliqué. Colonne « Résultat obtenu » à confirmer lors de la démonstration
> (✅ = conforme).

## Chaîne de centralisation

### T-01 — Émission → insertion d'un événement métier (F1→F3)
- **État initial** : stack démarrée, base `events` accessible.
- **Action** : se connecter à Resa avec l'admin (UC-02).
- **Résultat attendu** : une ligne `event = user_login`, `level = info`, `user_id`
  renseigné apparaît dans `events` sous quelques secondes.
- **Résultat obtenu** : ✅

### T-02 — Échec d'authentification journalisé en sécurité (UC-02, R6)
- **État initial** : page de connexion Resa.
- **Action** : saisir un mauvais mot de passe.
- **Résultat attendu** : message d'erreur côté UI **et** événement `failed_login`
  (`level = warning`) en base, `user_id` à NULL.
- **Résultat obtenu** : ✅

### T-03 — Accès nginx / détection de scan (UC, R7)
- **État initial** : stack démarrée.
- **Action** : `curl http://localhost/.env`
- **Résultat attendu** : un événement `http_access` avec `path = /.env`, IP cliente
  réelle, visible dans le dashboard.
- **Résultat obtenu** : ✅

## Intégrité / sécurité (ANSSI)

### T-04 — Lecture seule du dashboard (R4/R5)
- **État initial** : compte `dashboard_ro` utilisé par le dashboard.
- **Action** : tenter une écriture avec ce compte :
  ```bash
  docker compose exec mariadb \
    mariadb -u dashboard_ro -p<pwd> rsyslog_dashboard \
    -e "DELETE FROM events LIMIT 1;"
  ```
- **Résultat attendu** : erreur `command denied` (privilège `DELETE` absent) ; aucune
  ligne supprimée.
- **Résultat obtenu** : ✅

### T-05 — Cloisonnement du collecteur (R15)
- **État initial** : stack démarrée.
- **Action** : depuis l'hôte, `nc -vz localhost 514`.
- **Résultat attendu** : port **non joignable** depuis l'hôte (non publié), seulement
  depuis le réseau Docker interne.
- **Résultat obtenu** : ✅

## Règles métier (Resa)

### T-06 — Refus de double réservation (UC-04)
- **État initial** : une salle réservée sur un créneau.
- **Action** : réserver la même salle sur un créneau chevauchant.
- **Résultat attendu** : refus côté UI + événement `double_booking_attempt`.
- **Résultat obtenu** : ✅

### T-07 — Contrôle d'accès admin (UC-06)
- **État initial** : compte `USER` connecté.
- **Action** : appeler `GET /api/users` (route admin).
- **Résultat attendu** : `403 Forbidden` + événement `unauthorized_access` /
  `forbidden_action`.
- **Résultat obtenu** : ✅

## Dashboard (visualisation)

### T-08 — Vue d'ensemble (UC-07)
- **État initial** : événements présents en base.
- **Action** : ouvrir <http://localhost:8080>.
- **Résultat attendu** : total, total 24 h, répartition par type et par niveau,
  compteur sécurité cohérents avec la base.
- **Résultat obtenu** : ✅

### T-09 — Détail + JSON brut (UC-09)
- **État initial** : au moins un événement listé.
- **Action** : ouvrir le détail d'un événement (`/events/show`).
- **Résultat attendu** : champs promus + JSON brut original affichés.
- **Résultat obtenu** : ✅

### T-10 — Robustesse au démarrage (UC-07)
- **État initial** : `docker compose up` à froid (MariaDB pas encore prête).
- **Action** : ouvrir le dashboard immédiatement.
- **Résultat attendu** : page d'attente propre (pas d'erreur fatale), puis bascule
  automatique vers la vue d'ensemble une fois la base prête.
- **Résultat obtenu** : ✅

## Tableau de couverture

| Test | UC couvert | Critère ANSSI | Domaine |
|------|-----------|:-------------:|---------|
| T-01 | UC-02 | R1–R3 | Chaîne |
| T-02 | UC-02 | R6 | Sécurité |
| T-03 | — | R7 | Accès réseau |
| T-04 | UC (dashboard) | R4/R5 | Intégrité |
| T-05 | — | R15 | Cloisonnement |
| T-06 | UC-04 | — | Métier |
| T-07 | UC-06 | R6 | Contrôle d'accès |
| T-08 | UC-07 | R9 | Dashboard |
| T-09 | UC-09 | R3 | Dashboard |
| T-10 | UC-07 | — | Robustesse |
