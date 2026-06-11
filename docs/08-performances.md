# Critères de performance — protocole, mesures et analyse

Ce document **mesure** les exigences de performance annoncées dans le dossier de
conception ([02-conception.md](02-conception.md), §5). Conformément au référentiel
d'évaluation (preuve exigée pour tout résultat), chaque chiffre est accompagné de la
commande qui le produit et reproductible par le correcteur.

> **Environnement de mesure** : stack `docker compose` du dépôt (MariaDB 11), hôte
> Linux, le 2026-06-11. Toutes les durées sont mesurées **côté SGBD** via
> `TIMESTAMPDIFF(MICROSECOND, …)` autour de la requête (hors latence réseau/PHP),
> et les temps de réponse HTTP via `curl -w %{time_total}`.

## 1. Exigences (rappel) et verdict

| # | Exigence | Cible | Mesuré | Verdict |
|---|----------|-------|--------|:------:|
| P-1 | Temps de réponse « vue d'ensemble » | < 500 ms | 12 ms (1 k lignes) ; requêtes unitaires < 300 ms à 1 M | ✅ |
| P-2 | Latence d'ingestion app → base | < 1 s | insertion directe `ommysql`, pas de file | ✅ (qualitatif) |
| P-3 | Volumétrie supportée sans dégradation | ≥ 10⁶ lignes | banc d'essai à 1 000 000 lignes (430 Mio) | ✅ |

## 2. Protocole de charge (volumétrie 10⁶)

Pour éprouver l'exigence P-3 **sans polluer la base de démonstration**, on génère
1 000 000 d'événements réalistes dans une table jetable `events_bench` (même schéma
que `events`, colonnes générées comprises), via le moteur de séquences de MariaDB :

```sql
CREATE TABLE events_bench LIKE events;
INSERT INTO events_bench (received_at, raw_json)
SELECT NOW() - INTERVAL (seq % 1209600) SECOND,
       CONCAT('{"event":"', ELT(1+(seq%7), 'http_access','scanner_probe', …), '", …}')
FROM seq_1_to_1000000;            -- script complet : db/bench/bench-1M.sql
```

- **Insertion** : 1 000 000 lignes, table résultante **430 Mio** (données + index).
- Table supprimée après mesure (`DROP TABLE events_bench`) — la base de démo
  (`events`, 1015 lignes) reste intacte.

## 3. Résultats bruts @ 1 000 000 lignes

Chaque requête est exécutée 3 fois (cache chaud) ; on reporte l'ordre de grandeur stable.

| Requête (représentative du dashboard) | Index utilisé (EXPLAIN) | Durée |
|----------------------------------------|--------------------------|------:|
| **A** — Répartition par niveau `GROUP BY level` | `idx_level` | ~205 ms |
| **B** — Trafic humain/bot `WHERE channel='nginx' GROUP BY is_bot` | *(voir §4)* | **~4 210 ms** ⚠️ |
| **C** — Liste paginée `WHERE level='error' ORDER BY received_at DESC LIMIT 50` | `idx_received_at` | **~0,8 ms** |
| **D** — Top événements `GROUP BY event ORDER BY COUNT DESC` | `idx_event` | ~280 ms |
| **E** — Filtre indexé `WHERE event='scanner_probe'` | `idx_event` | ~19 ms |

Temps de réponse **HTTP de bout en bout** (base de démo, 1015 lignes) :

| Endpoint | Code | Taille | Temps |
|----------|:----:|-------:|------:|
| `/` (vue d'ensemble) | 200 | 32,9 Ko | ~12 ms |
| `/api/stats` (rafraîchissement AJAX) | 200 | 101 o | ~3 ms |
| `/events` (liste) | 200 | 18,4 Ko | ~3 ms |

## 4. Analyse d'écart et optimisation (B)

La requête **B** dépassait largement le budget : **~4,2 s à 1 M de lignes**. `EXPLAIN`
montre la cause — aucun index ne couvre le filtre `channel`, MariaDB parcourt
`idx_is_bot` puis filtre 952 286 lignes :

```
type: index   key: idx_is_bot   rows: 952286   Extra: Using where
```

**Correctif** : index composite `(channel, is_bot)`, qui couvre à la fois le filtre et
le regroupement. Après `ALTER TABLE … ADD INDEX idx_channel_isbot (channel, is_bot)`
puis `ANALYZE TABLE`, l'`EXPLAIN` devient un *covering index* :

```
type: ref   key: idx_channel_isbot   Extra: Using where; Using index
```

| Requête B | Avant | Après | Gain |
|-----------|------:|------:|-----:|
| Trafic humain/bot @ 1 M | ~4 210 ms | **~81 ms** | **≈ 50×** |

Le correctif est intégré au schéma du projet : [db/init.sql](../db/init.sql)
(nouveaux déploiements) et migration
[db/migrations/2026-06-11-index-trafic.sql](../db/migrations/2026-06-11-index-trafic.sql)
(bases existantes).

## 5. Reproduire les mesures

```bash
# 1) Générer la volumétrie (table jetable)
sudo docker compose exec -T mariadb sh -c \
  'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' < db/bench/bench-1M.sql

# 2) Mesurer (durées en ms, EXPLAIN)
sudo docker compose exec -T mariadb sh -c \
  'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' < db/bench/measure.sql

# 3) Nettoyer
sudo docker compose exec -T mariadb sh -c \
  'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" -e "DROP TABLE rsyslog_dashboard.events_bench"'
```

## 6. Limites et suite

- Les agrégations « plein tableau » (A, D) restent à ~200–300 ms à 1 M : acceptable
  pour l'usage (vue d'ensemble rafraîchie aux 15 s), optimisable par fenêtrage
  temporel (`WHERE received_at > NOW() - INTERVAL 24 HOUR`, déjà indexé) si la
  volumétrie réelle dépasse cet ordre de grandeur.
- P-2 (latence d'ingestion) est garantie par construction (insertion directe sans
  file) mais non chronométrée bout-à-bout ; une mesure horodatée source→base est une
  évolution identifiée.
