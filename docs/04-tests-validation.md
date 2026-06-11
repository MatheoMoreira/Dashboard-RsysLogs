# Tests de validation (recette)

Chaque test suit le format exigé : **état initial → action → résultat attendu →
résultat obtenu**. Les tests sont rattachés aux cas d'utilisation (`UC-xx`,
voir [03-documentation-utilisateur.md](03-documentation-utilisateur.md)).

> Environnement de test : stack lancée via `docker compose up --build -d`, seed
> initial appliqué. **Recette exécutée le 2026-06-10** sur la stack en
> fonctionnement ; les preuves (codes HTTP, messages d'erreur, comptes en base)
> sont reportées dans la colonne « Résultat obtenu » (✅ = conforme).

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

### T-03 — Accès nginx journalisé avec IP réelle (UC, R7)
- **État initial** : stack démarrée.
- **Action** : `curl -k https://resa.mips.science/` (accès légitime).
- **Résultat attendu** : un événement `http_access` (`channel = nginx`) avec l'IP
  cliente réelle (et non celle du proxy), visible dans le dashboard.
- **Résultat obtenu** : ✅ — `http_access` enregistré, IP restituée via `real_ip`.

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
- **Résultat obtenu** : ✅ — `ERROR 1142 (42000): DELETE command denied to user
  'dashboard_ro'@'localhost'` (idem pour `INSERT`).

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

## Sécurité périmétrique & trafic (HTTPS / anti-scan / bot)

### T-11 — Redirection HTTP → HTTPS (R13)
- **État initial** : reverse-proxy Caddy démarré.
- **Action** : `curl -I http://resa.mips.science/`.
- **Résultat attendu** : redirection `301/308` vers `https://`.
- **Résultat obtenu** : ✅ — `HTTP 308` vers HTTPS (Caddy).

### T-12 — Blocage et journalisation des scans (R16, R17)
- **État initial** : stack démarrée.
- **Action** : `curl -k https://resa.mips.science/.env`.
- **Résultat attendu** : réponse `403`, **aucune** fuite de contenu, et un événement
  `scanner_probe` (`level = warning`) enregistré.
- **Résultat obtenu** : ✅ — `HTTP 403` ; `scanner_probe` présents en base (10 au moment du test).

### T-13 — Classification humain / bot du trafic (R17)
- **État initial** : trafic web présent (`channel = nginx`).
- **Action** :
  ```bash
  curl -k -A "curl/8.0 bot" https://resa.mips.science/      # attendu : is_bot = 1
  # vérification : SELECT is_bot, COUNT(*) FROM events WHERE channel='nginx' GROUP BY is_bot;
  ```
- **Résultat attendu** : la requête à user-agent « bot » est comptée `is_bot = 1` ; un
  navigateur normal reste `is_bot = 0`. KPIs « Trafic humain » / « Bots & scans » cohérents.
- **Résultat obtenu** : ✅ — ventilation observée (ex. 361 humain / 20 bot).

### T-14 — IP cliente réelle derrière le reverse-proxy (R7)
- **État initial** : chaîne Caddy → nginx → Laravel.
- **Action** : générer un événement backend via une requête API et lire son `ip`.
- **Résultat attendu** : l'`ip` enregistrée est l'IP transmise par `X-Forwarded-For`,
  **pas** l'IP du conteneur nginx.
- **Résultat obtenu** : ✅ — IP passée de `172.18.0.6` (proxy) à l'IP cliente transmise
  après activation de `TrustProxies`.

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
| T-11 | — | R13 | HTTPS / transport |
| T-12 | UC-08 | R16/R17 | Anti-scan |
| T-13 | UC-08 | R17 | Classification bot |
| T-14 | — | R7 | IP réelle (proxy) |

## Artefacts de preuve (recette rejouable)

Pour ne pas en rester au déclaratif, les tests **automatisables** sont rejoués par
[`db/verifs/run-recette.sh`](../db/verifs/run-recette.sh), qui écrit pour chacun un
artefact **horodaté** (commande exacte + sortie brute + verdict `PASS/FAIL/SKIP`)
sous `docs/verifs/<AAAA-MM-JJ_HHMMSS>/<T-xx>.txt`, avec un résumé `recette.md`.

```bash
cp .env.example .env            # si nécessaire
docker compose up --build -d
bash db/verifs/run-recette.sh   # ou : bash db/verifs/run-recette.sh T-04 T-12
# → artefacts sous docs/verifs/<horodatage>/
```

| Test | Source de preuve | Type |
|------|------------------|------|
| T-01, T-02 | événement en base après login/échec (SELECT sur `events`) | manuel (UI Resa) |
| T-04 | `run-recette.sh T-04` → `ERROR 1142 … denied` | **automatisé** |
| T-05 | `run-recette.sh T-05` → port 514 injoignable depuis l'hôte | **automatisé** |
| T-06, T-07 | refus UI + événement `double_booking_attempt` / `forbidden_action` | manuel (API) |
| T-08 | `run-recette.sh T-08` → `GET / → 200` + `COUNT(*)` recoupé | **automatisé** |
| T-09, T-10 | détail + JSON brut / page d'attente au boot | manuel (UI) |
| T-11 | `run-recette.sh T-11` → en-tête `HTTP 308` + `Location: https` | **automatisé** |
| T-12 | `run-recette.sh T-12` → `403` + delta `scanner_probe` | **automatisé** |
| T-13 | `run-recette.sh T-13` → `GROUP BY is_bot` | **automatisé** |
| T-14 | `run-recette.sh T-14` → IP clientes ≠ `172.x` du conteneur | **automatisé** |

> Les tests rejoués hors de la machine de déploiement (domaine public non exposé,
> trafic insuffisant) sont marqués `SKIP` dans l'artefact plutôt que faussement
> `PASS` — la traçabilité reste honnête. Les sept tests automatisés couvrent les
> mesures ANSSI les plus structurantes (intégrité, cloisonnement, HTTPS, anti-scan,
> IP réelle).
