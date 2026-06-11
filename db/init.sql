-- ─────────────────────────────────────────────────────────────
-- Schéma de la base de centralisation des logs
--
-- rsyslog reçoit les événements de l'application Resa (JSON sur une
-- ligne) et les insère ici via le module ommysql. On stocke le JSON
-- brut dans `raw_json` et on expose les champs utiles en colonnes
-- générées (STORED) pour pouvoir filtrer/indexer sans re-parser.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    received_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_json     TEXT        NOT NULL,

    -- Champs promus depuis le JSON pour le filtrage/affichage.
    -- NULLIF(..., 'null') : un champ JSON explicitement à null (ex. user_id
    -- pour un échec de connexion) devient un vrai NULL SQL et non la chaîne
    -- "null" — indispensable pour la colonne entière user_id.
    event        VARCHAR(64)  GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.event')),     'null')) STORED,
    level        VARCHAR(16)  GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.level')),     'null')) STORED,
    channel      VARCHAR(32)  GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.channel')),   'null')) STORED,
    user_id      INT          GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.user_id')),   'null')) STORED,
    ip           VARCHAR(45)  GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.ip')),        'null')) STORED,
    method       VARCHAR(8)   GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.method')),    'null')) STORED,
    path         VARCHAR(255) GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.path')),      'null')) STORED,
    user_agent   VARCHAR(255) GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.user_agent')),'null')) STORED,
    event_time   VARCHAR(40)  GENERATED ALWAYS AS (NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.timestamp')), 'null')) STORED,

    -- Classification automatique « bot/scan » : un scanner_probe (sonde
    -- bloquée par nginx) est toujours un bot ; sinon on s'appuie sur le
    -- user_agent (outils, crawlers, bibliothèques HTTP). Colonne STORED :
    -- calculée une fois à l'insertion, indexée pour les KPIs trafic.
    is_bot       TINYINT(1)   GENERATED ALWAYS AS (
        CASE
            WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.event')), 'null') = 'scanner_probe' THEN 1
            WHEN LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.user_agent')), '')) REGEXP
                 'bot|crawl|spider|slurp|curl|wget|python|http.?client|scan|nikto|sqlmap|nmap|masscan|zgrab|go-http|java/|libwww|okhttp|headless|phantomjs|semrush|ahrefs|mj12|dotbot|bingpreview|facebookexternalhit' THEN 1
            ELSE 0
        END
    ) STORED,

    KEY idx_event       (event),
    KEY idx_level       (level),
    KEY idx_user        (user_id),
    KEY idx_received_at (received_at),
    KEY idx_is_bot      (is_bot),

    -- Index composite (channel, is_bot) : couvre le calcul des KPIs trafic
    -- (COUNT humain/bot WHERE channel='nginx'). Mesuré sur 1 000 000 de lignes,
    -- il fait passer cette requête de ~4 200 ms à ~80 ms (covering index,
    -- « Using index »). Cf. docs/08-performances.md.
    KEY idx_channel_isbot (channel, is_bot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
