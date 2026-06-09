# ─────────────────────────────────────────────────────────────
# Application Resa — backend Laravel (API REST + journalisation)
# Build context = ../Resa/backend (le code source n'est pas modifié)
# ─────────────────────────────────────────────────────────────
FROM php:8.4-cli

# Dépendances système + extensions PHP requises par Laravel/Resa
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        git unzip libzip-dev libsqlite3-dev libicu-dev \
    && docker-php-ext-install -j"$(nproc)" pdo pdo_sqlite zip bcmath intl sockets \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Installe d'abord les dépendances (cache de couche tant que composer.* ne bouge pas)
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --prefer-dist --no-progress

# Puis le code applicatif
COPY . .
RUN composer dump-autoload --optimize

# Entrypoint inline (le script ne peut pas vivre dans le contexte ../Resa/backend)
COPY <<'EOF' /usr/local/bin/entrypoint.sh
#!/bin/sh
set -e
cd /app

# 1. Fichier .env : créé au premier lancement à partir de l'exemple
if [ ! -f .env ]; then
    cp .env.example .env
fi

# 2. Active le forwarding des événements vers le conteneur rsyslog
#    (le canal "rsyslog" existe déjà dans config/logging.php)
#    Transport TCP : livraison fiable (accusé de réception, pas de perte
#    silencieuse comme en UDP) — recommandation ANSSI sur la journalisation.
#    Le canal "events_file" conserve en plus une copie locale durable, donc
#    un incident réseau ne fait jamais perdre d'événement.
sed -i 's#^LOG_EVENT_STACK=.*#LOG_EVENT_STACK=events_file,rsyslog#'      .env
sed -i 's#^RSYSLOG_CONNECTION=.*#RSYSLOG_CONNECTION=tcp://rsyslog:514#'  .env

# 3. Clé applicative (générée une seule fois, persistée via le volume .env)
if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

# 4. Base SQLite + migrations + données de démonstration
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite
php artisan migrate:fresh --seed --force

# 5. Vide les caches puis démarre le serveur Laravel
php artisan config:clear
exec php artisan serve --host=0.0.0.0 --port=8000
EOF
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["entrypoint.sh"]
