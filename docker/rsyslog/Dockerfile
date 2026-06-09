# Serveur rsyslog avec le module de sortie MySQL/MariaDB
FROM debian:bookworm-slim

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        rsyslog \
        rsyslog-mysql \
        gettext-base \
    && rm -rf /var/lib/apt/lists/*

# La config est un template : les identifiants DB y sont injectés au démarrage
# (envsubst) à partir des variables d'environnement fournies par compose.
COPY rsyslog.conf /etc/rsyslog.conf.template
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh && mkdir -p /var/log/resa

EXPOSE 514/udp 514/tcp

ENTRYPOINT ["entrypoint.sh"]
