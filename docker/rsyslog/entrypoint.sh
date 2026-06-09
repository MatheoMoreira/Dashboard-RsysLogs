#!/bin/sh
set -e

# Injecte les identifiants de la base (passés en variables d'environnement
# par docker-compose) dans la configuration rsyslog, puis démarre le démon
# au premier plan.
envsubst '${DB_NAME} ${DB_USER} ${DB_PASSWORD}' \
    < /etc/rsyslog.conf.template \
    > /etc/rsyslog.conf

exec rsyslogd -n -f /etc/rsyslog.conf
