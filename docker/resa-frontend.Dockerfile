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

# 2) Service nginx : sert le build + proxifie /api vers le backend Laravel
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

server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Tous les accès au site public sont forwardés vers rsyslog -> MariaDB ->
    # dashboard (visibilité sur les scanners : /.env, /wp-admin, /.git…).
    # On conserve aussi la sortie standard pour `docker compose logs`.
    access_log syslog:server=rsyslog:514,facility=local7,tag=nginx,nohostname json_events;
    access_log /var/log/nginx/access.log;

    # Proxy des appels API vers le backend Laravel (réseau docker interne)
    location /api/ {
        proxy_pass http://resa-backend:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA : toute autre route renvoie index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80
