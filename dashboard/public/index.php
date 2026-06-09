<?php

declare(strict_types=1);

use App\Controllers\DashboardController;
use App\Controllers\EventsController;
use App\Core\Router;

require dirname(__DIR__) . '/vendor/autoload.php';

/** Échappement HTML court, utilisé dans les vues. */
function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

$router = new Router();
$router->get('/',             DashboardController::class, 'index');
$router->get('/events',       EventsController::class,    'index');
$router->get('/events/show',  EventsController::class,    'show');

$router->dispatch($_SERVER['REQUEST_URI'] ?? '/');
