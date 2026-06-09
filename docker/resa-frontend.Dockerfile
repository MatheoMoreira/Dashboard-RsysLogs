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
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

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
