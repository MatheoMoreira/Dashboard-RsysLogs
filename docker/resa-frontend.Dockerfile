# ─────────────────────────────────────────────────────────────
# Application Resa — frontend React (build statique servi par nginx)
# Build context = ../Resa/frontend
# ─────────────────────────────────────────────────────────────

# 1) Build de la SPA
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2) Service nginx : sert le build + proxifie /api vers le backend Laravel.
# Le TLS est assuré en amont par Caddy (reverse-proxy) ; nginx ne parle qu'en
# HTTP sur le réseau Docker interne.
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html

COPY <<'EOF' /etc/nginx/conf.d/default.conf
# Niveau de gravité dérivé du code HTTP (relu ensuite par le dashboard).
map $status $loglevel {
    default "info";
    ~^4     "warning";
    ~^5     "error";
}

# Journal d'accès au format JSON, COMPATIBLE avec la table `events`
# (champs event/level/channel/ip/method/path…). escape=json échappe les
# valeurs (user-agent, chemins) pour garantir un JSON valide.
log_format json_events escape=json
    '{"timestamp":"$time_iso8601",'
    '"event":"http_access",'
    '"level":"$loglevel",'
    '"channel":"nginx",'
    '"ip":"$remote_addr",'
    '"method":"$request_method",'
    '"path":"$request_uri",'
    '"status":$status,'
    '"user_agent":"$http_user_agent",'
    '"referer":"$http_referer"}';

# Variante pour les sondes de scanners/bots : même schéma, mais event dédié
# « scanner_probe » et niveau « warning » → le dashboard le classe en
# événement de sécurité (cf. config.php) et l'affiche dans le panneau dédié.
log_format json_scanner escape=json
    '{"timestamp":"$time_iso8601",'
    '"event":"scanner_probe",'
    '"level":"warning",'
    '"channel":"nginx",'
    '"ip":"$remote_addr",'
    '"method":"$request_method",'
    '"path":"$request_uri",'
    '"status":$status,'
    '"user_agent":"$http_user_agent",'
    '"referer":"$http_referer"}';

server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Derrière le reverse-proxy Caddy : la connexion TCP vient de Caddy, donc
    # $remote_addr vaudrait son IP Docker. On restaure l'IP cliente réelle
    # depuis X-Forwarded-For (réseaux privés Docker, de confiance) pour que
    # les journaux remontent la bonne adresse au dashboard.
    set_real_ip_from 172.16.0.0/12;
    set_real_ip_from 10.0.0.0/8;
    real_ip_header   X-Forwarded-For;
    real_ip_recursive on;

    # Tous les accès au site public sont forwardés vers rsyslog -> MariaDB ->
    # dashboard (visibilité sur les scanners : /.env, /wp-admin, /.git…).
    # On conserve aussi la sortie standard pour `docker compose logs`.
    access_log syslog:server=rsyslog:514,facility=local7,tag=nginx,nohostname json_events;
    access_log /var/log/nginx/access.log;

    # Sondes de scanners/bots connues : on bloque (403) ET on journalise sous
    # l'événement « scanner_probe » (log_format dédié) pour les faire remonter
    # dans le dashboard. Les fichiers/chemins ci-dessous n'existent pas sur une
    # SPA statique : toute requête vers eux est quasi certainement malveillante.
    location ~* "^/(\.env|\.git|\.aws|\.ssh|\.vscode|\.idea|\.DS_Store|wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php|phpmyadmin|phpunit|pma|myadmin|administrator|admin\.php|vendor/|backup|dump\.sql|\.(sql|bak|old|swp)|actuator|server-status)" {
        access_log syslog:server=rsyslog:514,facility=local7,tag=nginx,nohostname json_scanner;
        access_log /var/log/nginx/access.log;
        return 403;
    }

    # Proxy des appels API vers le backend Laravel (réseau docker interne)
    location /api/ {
        proxy_pass http://resa-backend:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
    }

    # SPA : toute autre route renvoie index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80
