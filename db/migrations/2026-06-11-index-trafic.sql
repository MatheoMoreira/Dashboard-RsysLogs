-- ─────────────────────────────────────────────────────────────
-- Migration : index composite (channel, is_bot) — performance KPIs trafic
--
-- Motivée par une MESURE (cf. docs/08-performances.md) : sur un banc d'essai
-- de 1 000 000 d'événements, le calcul de la répartition humain/bot
--   SELECT is_bot, COUNT(*) FROM events WHERE channel='nginx' GROUP BY is_bot
-- prenait ~4 200 ms (parcours via idx_is_bot, filtre `channel` non couvert).
-- L'index composite (channel, is_bot) devient un « covering index » :
-- EXPLAIN → type=ref, Extra="Using index" → ~80 ms (≈ 50× plus rapide).
--
-- À appliquer une seule fois, avec le compte root :
--   sudo docker compose exec -T mariadb sh -c \
--     'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' \
--     < db/migrations/2026-06-11-index-trafic.sql
--
-- Ré-exécuter échouera sur « duplicate key name » sans casser les données.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE events
    ADD KEY idx_channel_isbot (channel, is_bot);

ANALYZE TABLE events;
