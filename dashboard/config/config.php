<?php

/**
 * Configuration du dashboard.
 *
 * Les identifiants de la base proviennent de l'environnement (injecté par
 * docker-compose depuis le fichier .env), avec des valeurs de repli pour un
 * lancement hors conteneur.
 */

return [
    'db' => [
        'host'     => getenv('DB_HOST') ?: 'mariadb',
        'port'     => getenv('DB_PORT') ?: '3306',
        'name'     => getenv('DB_NAME') ?: 'rsyslog_dashboard',
        'user'     => getenv('DB_USER') ?: 'rsyslog',
        'password' => getenv('DB_PASSWORD') ?: 'rsyslog_pwd',
    ],

    // Fuseau d'AFFICHAGE. Les journaux sont stockés en UTC (horodatage
    // canonique, non ambigu) ; le dashboard les convertit vers ce fuseau
    // pour les présenter en heure locale.
    'timezone' => getenv('DASHBOARD_TZ') ?: 'Europe/Paris',

    // Regroupement des types d'événements par catégorie métier (cf. README Resa)
    'categories' => [
        'Authentification' => ['user_registered', 'user_login', 'user_logout', 'failed_login'],
        'Consultation'     => ['rooms_list_viewed', 'room_viewed'],
        'Réservations'     => ['reservation_created', 'reservation_updated', 'reservation_cancelled'],
        'Sécurité'         => ['unauthorized_access', 'invalid_token', 'forbidden_action', 'scanner_probe'],
        'Métier'           => ['double_booking_attempt', 'room_capacity_exceeded', 'invalid_reservation_period'],
        'Système'          => ['database_error', 'unhandled_exception'],
        'HTTP'             => ['http_request', 'http_access'],
    ],

    // Événements considérés comme sensibles (mis en avant dans le dashboard)
    'security_events' => [
        'failed_login', 'unauthorized_access', 'invalid_token',
        'forbidden_action', 'database_error', 'unhandled_exception',
        // Sondes de scanners/bots bloquées par nginx (403) au niveau du frontend.
        'scanner_probe',
    ],
];
