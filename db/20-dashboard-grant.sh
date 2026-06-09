#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Création d'un compte MariaDB en LECTURE SEULE pour le dashboard.
#
# Principe de moindre privilège (recommandation ANSSI sur la
# journalisation) : le dashboard ne fait que consulter les journaux.
# On lui interdit donc toute écriture/altération. Seul rsyslog dispose
# du droit INSERT sur la table `events` — les journaux sont ainsi
# protégés contre une modification via l'interface de consultation.
#
# Ce script est exécuté automatiquement par l'image MariaDB au premier
# démarrage (docker-entrypoint-initdb.d). Il s'exécute APRÈS 10-init.sql
# (ordre alphabétique) : la base et la table existent déjà.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

mariadb -u root -p"${MARIADB_ROOT_PASSWORD}" <<SQL
CREATE USER IF NOT EXISTS '${DASHBOARD_DB_USER}'@'%' IDENTIFIED BY '${DASHBOARD_DB_PASSWORD}';
-- Lecture seule, restreinte à la base de centralisation des logs.
GRANT SELECT ON \`${MARIADB_DATABASE}\`.* TO '${DASHBOARD_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "[init] compte lecture seule '${DASHBOARD_DB_USER}' créé (SELECT uniquement sur ${MARIADB_DATABASE})."
