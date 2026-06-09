<?php

declare(strict_types=1);

use App\Controllers\DashboardController;
use App\Controllers\EventsController;
use App\Core\Router;

require dirname(__DIR__) . '/vendor/autoload.php';

// Fuseau d'affichage (les journaux sont stockés en UTC, convertis ici).
$appConfig = require dirname(__DIR__) . '/config/config.php';
date_default_timezone_set($appConfig['timezone']);

/** Échappement HTML court, utilisé dans les vues. */
function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Met en forme un horodatage stocké en UTC dans le fuseau d'affichage.
 *
 * Gère les deux formats présents en base : le DATETIME MariaDB
 * "2026-06-09 08:52:50" (sans suffixe, interprété en UTC) et le timestamp
 * applicatif ISO 8601 "2026-06-09T08:52:50Z" (suffixe Z = UTC).
 */
function fmt_dt(mixed $value, string $format = 'd/m/Y H:i:s'): string
{
    $s = (string) $value;
    if ($s === '') {
        return '—';
    }
    try {
        $dt = new DateTimeImmutable($s, new DateTimeZone('UTC'));
        return $dt->setTimezone(new DateTimeZone(date_default_timezone_get()))->format($format);
    } catch (Exception) {
        return e($s);
    }
}

$router = new Router();
$router->get('/',             DashboardController::class, 'index');
$router->get('/api/stats',    DashboardController::class, 'stats');
$router->get('/events',       EventsController::class,    'index');
$router->get('/events/show',  EventsController::class,    'show');

$router->dispatch($_SERVER['REQUEST_URI'] ?? '/');
