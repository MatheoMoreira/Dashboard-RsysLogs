# Analyse du guide ANSSI — Recommandations de sécurité pour l'architecture d'un système de journalisation

> Référence : ANSSI, *Recommandations de sécurité pour l'architecture d'un système
> de journalisation* (`supports/anssi-guide-recommandations_securite_architecture_systeme_journalisation.pdf`).

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
| R7 | **Journaliser les accès** (traçabilité réseau / IP source) | ✅ | nginx émet un `http_access` pour **tous** les accès avec l'IP cliente réelle ; le middleware `LogHttpRequests` trace les requêtes API (4xx → warning, 5xx → error). |
| R8 | **Exhaustivité** : couvrir authentification, métier, erreurs système | ✅ | Catalogue d'événements couvrant authentification, consultation, réservations, règles métier, sécurité et système (`database_error`, `unhandled_exception`). |
| R9 | **Catégorisation par niveau de gravité** | ✅ | Chaque événement porte un `level` (`info` / `warning` / `error`), indexé et filtrable dans le dashboard. |
| R10 | **Protection des données à caractère personnel** (RGPD) dans les journaux | 🟡 | Les journaux contiennent `user_id` et IP (données à caractère personnel). Politique de **pseudonymisation / durée de conservation** à formaliser en version future. |
| R11 | **Politique de rétention / rotation** des journaux | 🟡 | La table `events` croît sans purge automatique. Prévu : tâche planifiée de purge au-delà de N jours + archivage. |
| R12 | **Sauvegarde** des journaux | 🟡 | Les données persistent dans un volume Docker ; une stratégie de sauvegarde externalisée (dump périodique hors hôte) reste à mettre en place. |
| R13 | **Chiffrement du transport** des journaux (TLS) | 🟡 | Transport actuel en clair sur le réseau Docker interne (isolé). Le passage à **rsyslog over TLS (RELP/TLS)** est recommandé dès qu'un collecteur distant hors hôte est introduit. |
| R14 | **Synchronisation de temps (NTP)** entre les sources | ⬜ | Non applicable au périmètre conteneurisé actuel : tous les services partagent l'horloge de l'hôte Docker. Deviendrait applicable en déploiement multi-hôtes. |
| R15 | **Cloisonnement réseau** du collecteur | ✅ (partiel) | Le port 514 de rsyslog n'est pas publié sur l'hôte ; il n'est joignable que depuis le réseau Docker interne. |
| R16 | **Surveillance / alerte** sur événements critiques | 🟡 | Le dashboard met en évidence les événements de sécurité ; un mécanisme d'**alerte proactive** (seuil de `failed_login`, notification) est une évolution identifiée. |

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

## Recommandations non retenues à ce stade — justification

- **R14 (NTP)** : périmètre mono-hôte conteneurisé → horloge unique partagée.
- Le **chiffrement TLS du transport (R13)** est volontairement différé : sur le
  réseau Docker interne isolé, le rapport coût/bénéfice est faible ; il devient
  prioritaire dès l'ouverture à un collecteur distant.

## Feuille de route sécurité (évolutions planifiées)

1. Politique de rétention + purge automatique (R11).
2. Pseudonymisation des données personnelles dans les journaux (R10, RGPD).
3. Sauvegarde externalisée chiffrée (R12).
4. Transport TLS si collecteur distant (R13).
5. Alerting sur seuils d'événements de sécurité (R16).
