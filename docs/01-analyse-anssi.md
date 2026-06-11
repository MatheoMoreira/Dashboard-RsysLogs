# Analyse du guide ANSSI — Recommandations de sécurité pour l'architecture d'un système de journalisation

> Référence : ANSSI, *Recommandations de sécurité pour l'architecture d'un système
> de journalisation*, **ANSSI-PA-012/ANSSI/SDE**, version du **28/01/2022**. Le guide
> est joint au dépôt :
> [`supports/anssi-guide-recommandations_securite_architecture_systeme_journalisation.pdf`](../supports/anssi-guide-recommandations_securite_architecture_systeme_journalisation.pdf)
> ([source officielle cyber.gouv.fr](https://cyber.gouv.fr/sites/default/files/2022/01/anssi-guide-recommandations_securite_architecture_systeme_journalisation.pdf)).
>
> ⚠️ La numérotation `R1…R17` ci-dessous est **interne au projet** (regroupement
> thématique des mesures), et non celle de l'annexe « Liste des recommandations » du
> guide. Le mapping vers les numéros verbatim du guide reste à finaliser à partir du
> PDF joint — cf. [verifs/anssi-pointeurs.md](verifs/anssi-pointeurs.md).

Ce document recense les recommandations du guide et indique, pour chacune, son
statut dans le projet : **✅ prise en compte**, **🟡 planifiée** (version future) ou
**⬜ non applicable** (avec justification).

## Synthèse

| # | Recommandation ANSSI | Statut | Mise en œuvre dans le projet |
|---|----------------------|:------:|------------------------------|
| R1 | **Centraliser** les journaux sur un serveur dédié | ✅ | Tous les événements (backend Resa, accès nginx) sont émis vers un service **rsyslog** dédié, qui les insère dans une base MariaDB centrale (`events`). |
| R2 | **Horodatage fiable** des événements | ✅ | Chaque événement porte un `timestamp` ISO 8601 (UTC) côté application + `received_at` côté collecteur. Affichage reconverti dans le fuseau local par le dashboard. |
| R3 | **Format structuré** et normalisé des journaux | ✅ | Journaux émis en **JSON sur une ligne** (`EventJsonFormatter`), schéma stable (`event`, `level`, `channel`, `user_id`, `ip`, `method`, `path`, `timestamp`). |
| R4 | **Intégrité** des journaux : empêcher la modification/suppression | ✅ | Séparation des privilèges : le compte applicatif `rsyslog` n'a que `INSERT`, le dashboard utilise `dashboard_ro` en `SELECT` seul. Aucun chemin applicatif ne permet `UPDATE`/`DELETE`. |
| R5 | **Moindre privilège** sur l'accès aux journaux | ✅ | Deux comptes MariaDB distincts (écriture vs lecture seule), créés à l'initialisation (`db/20-dashboard-grant.sh`). |
| R6 | **Journaliser les événements de sécurité** (authentification, accès refusés) | ✅ | Événements dédiés : `failed_login`, `unauthorized_access`, `invalid_token`, `forbidden_action` (voir `EventLogger`). |
| R7 | **Journaliser les accès** (traçabilité réseau / IP source) | ✅ | nginx émet un `http_access` pour **tous** les accès ; le middleware `LogHttpRequests` trace les requêtes API (4xx → warning, 5xx → error). L'**IP cliente réelle** est reconstituée sur toute la chaîne reverse-proxy : Caddy renseigne `X-Forwarded-For`, nginx la restaure via `real_ip`, et Laravel via `TrustProxies` — les journaux ne portent jamais l'IP du proxy. |
| R8 | **Exhaustivité** : couvrir authentification, métier, erreurs système | ✅ | Catalogue d'événements couvrant authentification, consultation, réservations, règles métier, sécurité et système (`database_error`, `unhandled_exception`). |
| R9 | **Catégorisation par niveau de gravité** | ✅ | Chaque événement porte un `level` (`info` / `warning` / `error`), indexé et filtrable dans le dashboard. |
| R10 | **Protection des données à caractère personnel** (RGPD) dans les journaux | 🟡 | Les journaux contiennent `user_id` et IP (données à caractère personnel). Politique de **pseudonymisation / durée de conservation** à formaliser en version future. |
| R11 | **Politique de rétention / rotation** des journaux | 🟡 | La table `events` croît sans purge automatique. Prévu : tâche planifiée de purge au-delà de N jours + archivage. |
| R12 | **Sauvegarde** des journaux | 🟡 | Les données persistent dans un volume Docker ; une stratégie de sauvegarde externalisée (dump périodique hors hôte) reste à mettre en place. |
| R13 | **Chiffrement du transport** (TLS) | ✅ (partiel) | **Frontend en HTTPS** : reverse-proxy **Caddy** avec certificat **Let's Encrypt** (renouvellement automatique) devant l'application — les flux client↔site (dont les identifiants) sont chiffrés. Le transport interne des journaux (rsyslog → MariaDB) reste en clair sur le réseau Docker isolé ; **rsyslog over TLS (RELP/TLS)** sera ajouté à l'ouverture d'un collecteur distant. |
| R14 | **Synchronisation de temps (NTP)** entre les sources | ⬜ | Non applicable au périmètre conteneurisé actuel : tous les services partagent l'horloge de l'hôte Docker. Deviendrait applicable en déploiement multi-hôtes. |
| R15 | **Cloisonnement réseau** du collecteur | ✅ (partiel) | Le port 514 de rsyslog n'est pas publié sur l'hôte ; il n'est joignable que depuis le réseau Docker interne. |
| R16 | **Surveillance / réaction** sur événements critiques | ✅ (partiel) | Le dashboard met en évidence les événements de sécurité et permet de les **acquitter** (« lu »). **Réaction active** au périmètre : les sondes de scanners sont **bloquées (403)** par nginx et journalisées (`scanner_probe`). Une **alerte proactive** (seuil de `failed_login`, notification push) reste une évolution identifiée. |
| R17 | **Détection des accès automatisés** (bots / scans) | ✅ | Classification **humain / bot** de tout le trafic web (colonne générée `is_bot` : `scanner_probe` + signatures de `user_agent`), exposée en KPIs et filtre dans le dashboard. Hors guide strict mais renforce la traçabilité (R7) et la surveillance (R16). |

## Mesures phares implémentées (détail)

### Protection de l'intégrité par moindre privilège (R4, R5)

C'est la mesure ANSSI la plus structurante du projet. Deux comptes MariaDB :

| Compte | Droits | Utilisé par |
|--------|--------|-------------|
| `rsyslog` | `INSERT` | service rsyslog (écriture des logs) |
| `dashboard_ro` | `SELECT` | dashboard PHP (consultation seule) |

Conséquence : une éventuelle faille de l'interface de consultation (dashboard)
**ne permet pas** d'altérer ou d'effacer un journal — l'intégrité de la preuve est
préservée.

### Journalisation des événements de sécurité (R6, R7)

Les accès nginx rendent visibles les tentatives de scan (`/.env`, `/wp-admin`,
`/.git/config`…) avec l'IP source réelle, et le backend trace explicitement les
échecs d'authentification et les accès non autorisés.

### Durcissement du frontend : HTTPS + blocage des scans (R13, R16, R17)

Le site Resa est placé derrière un reverse-proxy **Caddy** qui :

- termine le **TLS** (certificat Let's Encrypt, renouvellement automatique) et
  redirige tout le HTTP vers HTTPS → confidentialité des identifiants en transit ;
- transmet l'IP cliente réelle (`X-Forwarded-For`), restaurée par nginx (`real_ip`)
  puis par Laravel (`TrustProxies`) — l'IP source des journaux est fiable.

Côté nginx, les **sondes de scanners connues** (`/.env`, `/wp-admin`, `/vendor/`,
`*.sql`…) sont **bloquées (403)** et journalisées sous l'événement dédié
`scanner_probe`, lui-même classé en événement de sécurité dans le dashboard. Tout
le trafic est en outre **classé humain / bot** (`is_bot`) pour distinguer l'activité
légitime des accès automatisés.

## Recommandations non retenues à ce stade — justification

- **R14 (NTP)** : périmètre mono-hôte conteneurisé → horloge unique partagée.
- Le **chiffrement TLS du *transport des journaux* (R13)** reste différé : sur le
  réseau Docker interne isolé, le rapport coût/bénéfice est faible ; il devient
  prioritaire dès l'ouverture à un collecteur distant. (Le transport *web* est, lui,
  déjà chiffré via Caddy.)

## Feuille de route sécurité (évolutions planifiées)

1. Politique de rétention + purge automatique (R11).
2. Pseudonymisation des données personnelles dans les journaux (R10, RGPD).
3. Sauvegarde externalisée chiffrée (R12).
4. Transport TLS des journaux si collecteur distant (R13).
5. Alerte proactive sur seuils d'événements de sécurité (R16) — le blocage des
   scans est déjà en place, reste la notification.
