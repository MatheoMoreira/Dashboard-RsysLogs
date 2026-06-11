-- ─────────────────────────────────────────────────────────────
-- Migration : classification bot/scan des événements
--
-- Ajoute les colonnes générées `user_agent` et `is_bot` à une base DÉJÀ
-- initialisée (le init.sql ne s'exécute qu'au premier démarrage). Les
-- colonnes STORED sont recalculées par MariaDB pour toutes les lignes
-- existantes au moment du ALTER : l'historique est donc classifié aussi.
--
-- À appliquer une seule fois, avec le compte root, par ex. :
--   sudo docker compose exec -T mariadb sh -c \
--     'exec mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' \
--     < db/migrations/2026-06-10-bot-classification.sql
--
-- Idempotent : ré-exécuter échouera juste sur « colonne déjà existante »,
-- sans casser les données.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE events
    ADD COLUMN user_agent VARCHAR(255) GENERATED ALWAYS AS (
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.user_agent')), 'null')
    ) STORED AFTER path,
    ADD COLUMN is_bot TINYINT(1) GENERATED ALWAYS AS (
        CASE
            WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.event')), 'null') = 'scanner_probe' THEN 1
            WHEN LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.user_agent')), '')) REGEXP
                 'bot|crawl|spider|slurp|curl|wget|python|http.?client|scan|nikto|sqlmap|nmap|masscan|zgrab|go-http|java/|libwww|okhttp|headless|phantomjs|semrush|ahrefs|mj12|dotbot|bingpreview|facebookexternalhit' THEN 1
            ELSE 0
        END
    ) STORED AFTER event_time,
    ADD KEY idx_is_bot (is_bot);
