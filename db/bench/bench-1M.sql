-- ─────────────────────────────────────────────────────────────
-- Banc d'essai volumétrie (P-3) : 1 000 000 d'événements réalistes dans une
-- table JETABLE `events_bench` (même schéma que `events`, colonnes générées
-- comprises). N'altère jamais la table `events` de démonstration.
--   Cf. docs/08-performances.md
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS events_bench;
CREATE TABLE events_bench LIKE events;

-- Génération via le moteur de séquences MariaDB (seq_1_to_N). raw_json varié
-- pour que agrégations (GROUP BY), filtres (event/level/channel/is_bot) et tris
-- soient réalistes.
INSERT INTO events_bench (received_at, raw_json)
SELECT
  NOW() - INTERVAL (seq % 1209600) SECOND,                       -- réparti sur ~14 jours
  CONCAT('{',
    '"event":"',   ELT(1+ (seq % 7), 'http_access','scanner_probe','failed_login','reservation_created','unauthorized_access','http_access','http_access'), '",',
    '"level":"',   ELT(1+ (seq % 3), 'info','warning','error'), '",',
    '"channel":"', ELT(1+ (seq % 2), 'nginx','app'), '",',
    '"ip":"', CONCAT(1+(seq%223),'.',(seq%256),'.',((seq*7)%256),'.',((seq*13)%256)), '",',
    '"method":"',  ELT(1+ (seq % 3), 'GET','POST','PUT'), '",',
    '"path":"/',   ELT(1+ (seq % 4), 'api/rooms','api/reservations','.env','login'), '",',
    '"status":',   ELT(1+ (seq % 4), '200','403','401','500'), ',',
    '"user_agent":"', ELT(1+ (seq % 4), 'Mozilla/5.0','curl/8.0','python-requests/2.31','Chrome/120'), '",',
    '"timestamp":"2026-06-10T12:00:00Z"',
  '}')
FROM seq_1_to_1000000;

ANALYZE TABLE events_bench;
SELECT COUNT(*) AS lignes FROM events_bench;
