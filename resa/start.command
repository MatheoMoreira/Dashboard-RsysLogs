#!/bin/bash
#
# Resa — lance le backend (Laravel :8000) et le frontend (Vite :5173)
# chacun dans sa propre fenêtre Terminal. Double-cliquez ce fichier.
#

# Dossier où se trouve ce script (racine du projet), peu importe d'où on l'appelle.
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Première utilisation : installe les dépendances si nécessaire.
if [ ! -d "$BACKEND_DIR/vendor" ]; then
  ( cd "$BACKEND_DIR" && composer install )
fi
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  ( cd "$FRONTEND_DIR" && npm install )
fi

# Ouvre deux fenêtres Terminal distinctes via AppleScript.
osascript <<END
tell application "Terminal"
    activate
    do script "cd '$BACKEND_DIR' && php artisan serve"
    do script "cd '$FRONTEND_DIR' && npm run dev"
end tell
END
