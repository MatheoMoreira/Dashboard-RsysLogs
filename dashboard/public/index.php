<?php

declare(strict_types=1);

use App\Controllers\DashboardController;
use App\Controllers\EventsController;
use App\Core\Router;

require dirname(__DIR__) . '/vendor/autoload.php';

// Fuseau d'affichage (les journaux sont stockés en UTC, convertis ici).
// Les fonctions utilitaires e() et fmt_dt() sont chargées via l'autoload
// Composer (src/helpers.php, section autoload.files).
$appConfig = require dirname(__DIR__) . '/config/config.php';
date_default_timezone_set($appConfig['timezone']);

$router = new Router();
$router->get('/',             DashboardController::class, 'index');
$router->get('/api/stats',    DashboardController::class, 'stats');
$router->get('/events',       EventsController::class,    'index');
$router->get('/events/show',  EventsController::class,    'show');

$router->dispatch($_SERVER['REQUEST_URI'] ?? '/');
