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

    /**
     * Normalise une URI en chemin de route : isole le composant chemin, retire
     * le slash final et ramène la racine vide à « / ».
     *
     * Méthode pure (sans effet de bord) : extraite de dispatch() pour être
     * testable unitairement.
     */
    public static function normalizePath(string $uri): string
    {
        $path = rtrim(parse_url($uri, PHP_URL_PATH) ?? '/', '/');
        return $path === '' ? '/' : $path;
    }

    public function dispatch(string $uri): void
    {
        $path = self::normalizePath($uri);

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
