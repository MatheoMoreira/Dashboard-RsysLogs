<?php

namespace App\Core;

/**
 * Routeur minimaliste : associe un chemin (méthode GET) à un couple
 * [Contrôleur, action]. Le front controller (public/index.php) appelle
 * dispatch() avec l'URI courante.
 */
final class Router
{
    /** @var array<string, array{0: class-string, 1: string}> */
    private array $routes = [];

    /**
     * @param class-string $controller
     */
    public function get(string $path, string $controller, string $action): void
    {
        $this->routes[$path] = [$controller, $action];
    }

    public function dispatch(string $uri): void
    {
        $path = rtrim(parse_url($uri, PHP_URL_PATH) ?? '/', '/');
        if ($path === '') {
            $path = '/';
        }

        if (!isset($this->routes[$path])) {
            http_response_code(404);
            View::render('error', ['message' => "Page introuvable : {$path}"], 'Erreur 404');
            return;
        }

        [$controllerClass, $action] = $this->routes[$path];
        $controller = new $controllerClass();
        $controller->$action();
    }
}
