# ─────────────────────────────────────────────────────────────
# Dashboard PHP (MVC maison) — Apache + PHP 8.3
# ─────────────────────────────────────────────────────────────
FROM php:8.3-apache

# Extension MySQL/MariaDB + module de réécriture d'URL
RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite

# Le point d'entrée web est le dossier public/ (front controller)
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's#/var/www/html#/var/www/html/public#g' \
        /etc/apache2/sites-available/000-default.conf \
        /etc/apache2/apache2.conf \
    && sed -ri 's#AllowOverride None#AllowOverride All#g' /etc/apache2/apache2.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# Génère l'autoloader PSR-4 (pas de dépendance externe à télécharger)
RUN composer dump-autoload --no-interaction --optimize

EXPOSE 80
