# ANSSI — table de preuve (pointeurs vérifiables)

> Complément à [../01-analyse-anssi.md](../01-analyse-anssi.md). Pour chaque mesure
> annoncée « ✅ implémentée », ce tableau donne **le fichier:ligne qui l'implémente**
> et **la commande de contrôle** que le correcteur peut rejouer. C'est l'élément
> attendu par la grille (crit. 1) : « pointeur vers l'élément du projet qui implémente
> la mesure, contrôlé par le correcteur ».

> ⚠️ **À FAIRE avant le rendu — numérotation source (lève le plafond R-P3).**
> La numérotation `R1…R17` de `01-analyse-anssi.md` est **interne au projet**, pas
> celle du guide. Ouvrir le PDF
> `supports/anssi-guide-recommandations_securite_architecture_systeme_journalisation.pdf`
> (ANSSI-PA-012, 28/01/2022), **annexe « Liste des recommandations »**, et remplacer
> chaque ligne par le **numéro et l'intitulé verbatim** de la recommandation
> correspondante du guide. Tant que ce mapping n'est pas fait, le critère 1 est
> plafonné à 0,5 (R-P3) malgré des implémentations réelles.

## Mesures implémentées — pointeurs et contrôles

| Mesure projet | Implémentation (chemin:ligne) | Commande de contrôle (correcteur) |
|---|---|---|
| **Moindre privilège — dashboard en lecture seule** | [`db/20-dashboard-grant.sh:20`](../../db/20-dashboard-grant.sh) — `GRANT SELECT ... TO dashboard_ro` | `docker compose exec mariadb mariadb -udashboard_ro -p*** -e "DELETE FROM events LIMIT 1;"` → `ERROR 1142 ... denied` (cf. recette **T-04**) |
| **Cloisonnement du collecteur** | `docker-compose.yml` — service `rsyslog` **sans** `ports:` (514 non publié) | `bash db/verifs/run-recette.sh T-05` (port 514 injoignable depuis l'hôte) |
| **Format structuré JSON** | [`resa/backend/app/Logging/EventJsonFormatter.php`](../../resa/backend/app/Logging/EventJsonFormatter.php) ; schéma stocké [`db/init.sql:20-26`](../../db/init.sql) | `docker compose exec mariadb mariadb -urumysql... -e "SELECT raw_json FROM events LIMIT 1;"` |
| **Catégorisation par niveau** | [`resa/backend/app/Services/EventLogger.php:53`](../../resa/backend/app/Services/EventLogger.php) (`level`) ; colonne `db/init.sql` | `SELECT level, COUNT(*) FROM events GROUP BY level;` |
| **Journalisation des événements de sécurité** | `EventLogger.php:22,34` (`failed_login`, `unauthorized_access`) | recette **T-02**, **T-07** |
| **HTTPS / TLS frontend** | [`docker/caddy/Caddyfile`](../../docker/caddy/Caddyfile) (TLS auto Let's Encrypt) | recette **T-11** (`curl -I http://… → 308`) |
| **IP cliente réelle derrière le proxy** | nginx `real_ip` [`docker/resa-frontend.Dockerfile:66-72`](../../docker/resa-frontend.Dockerfile) + Laravel `trustProxies` [`resa/backend/bootstrap/app.php:30`](../../resa/backend/bootstrap/app.php) | recette **T-14** (IP ≠ 172.x du conteneur) |
| **Blocage + journalisation des scans** | nginx `return 403` + log `scanner_probe` [`docker/resa-frontend.Dockerfile:44-87`](../../docker/resa-frontend.Dockerfile) | recette **T-12** (`curl /.env → 403` + `scanner_probe` en base) |
| **Détection des accès automatisés (bot/scan)** | colonne générée `is_bot` [`db/init.sql:33-37`](../../db/init.sql) | recette **T-13** (`GROUP BY is_bot`) |

## Recommandations non retenues — à argumenter par n° de guide

Reporter ici, **avec le numéro de recommandation du guide**, les mesures classées
🟡 planifiée / ⬜ non applicable (rétention, NTP, sauvegarde, TLS transport interne)
et la justification de contexte. La grille valorise les arbitrages « non applicable »
**argumentés** (niveau 4, crit. 1).
