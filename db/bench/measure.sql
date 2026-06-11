-- ─────────────────────────────────────────────────────────────
-- Mesures de performance sur events_bench (cf. db/bench/bench-1M.sql).
-- Durées côté SGBD via TIMESTAMPDIFF(MICROSECOND, …). Cf. docs/08-performances.md
-- ─────────────────────────────────────────────────────────────

-- Plans d'exécution (preuve de l'usage des index)
SELECT '--- EXPLAIN B : trafic humain/bot ---' AS info;
EXPLAIN SELECT is_bot, COUNT(*) FROM events_bench WHERE channel='nginx' GROUP BY is_bot;

-- A) Répartition par niveau (idx_level)
SET @t=NOW(6); SELECT level, COUNT(*) FROM events_bench GROUP BY level;
SELECT CONCAT('A repartition_par_niveau   = ', ROUND(TIMESTAMPDIFF(MICROSECOND,@t,NOW(6))/1000,1),' ms') AS duree;

-- B) Trafic humain vs bot (avant index composite : ~4 200 ms)
SET @t=NOW(6); SELECT is_bot, COUNT(*) FROM events_bench WHERE channel='nginx' GROUP BY is_bot;
SELECT CONCAT('B trafic_humain_vs_bot     = ', ROUND(TIMESTAMPDIFF(MICROSECOND,@t,NOW(6))/1000,1),' ms') AS duree;

-- C) Pagination filtrée triée (idx_received_at)
SET @t=NOW(6); SELECT id, received_at, event FROM events_bench WHERE level='error' ORDER BY received_at DESC LIMIT 50;
SELECT CONCAT('C pagination_filtree_triee = ', ROUND(TIMESTAMPDIFF(MICROSECOND,@t,NOW(6))/1000,1),' ms') AS duree;

-- D) Top événements (idx_event)
SET @t=NOW(6); SELECT event, COUNT(*) c FROM events_bench GROUP BY event ORDER BY c DESC LIMIT 10;
SELECT CONCAT('D top_events               = ', ROUND(TIMESTAMPDIFF(MICROSECOND,@t,NOW(6))/1000,1),' ms') AS duree;

-- E) Filtre indexé (idx_event)
SET @t=NOW(6); SELECT COUNT(*) FROM events_bench WHERE event='scanner_probe';
SELECT CONCAT('E filtre_event_indexe      = ', ROUND(TIMESTAMPDIFF(MICROSECOND,@t,NOW(6))/1000,1),' ms') AS duree;

-- ── Optimisation B : index composite (channel, is_bot) ──
ALTER TABLE events_bench ADD INDEX idx_channel_isbot (channel, is_bot);
ANALYZE TABLE events_bench;
SELECT '--- EXPLAIN B après index composite (attendu : Using index) ---' AS info;
EXPLAIN SELECT is_bot, COUNT(*) FROM events_bench WHERE channel='nginx' GROUP BY is_bot;
SET @t=NOW(6); SELECT is_bot, COUNT(*) FROM events_bench WHERE channel='nginx' GROUP BY is_bot;
SELECT CONCAT('B APRES index composite    = ', ROUND(TIMESTAMPDIFF(MICROSECOND,@t,NOW(6))/1000,1),' ms') AS duree;
