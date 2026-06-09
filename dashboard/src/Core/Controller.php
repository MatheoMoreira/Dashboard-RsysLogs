<?php

namespace App\Core;

/**
 * Contrôleur de base : factorise le rendu des vues pour les contrôleurs
 * concrets (Dashboard, Events).
 */
abstract class Controller
{
    /**
     * @param array<string, mixed> $data
     */
    protected function view(string $view, array $data = [], string $title = 'Dashboard'): void
    {
        View::render($view, $data, $title);
    }

    /**
     * Renvoie une réponse JSON (utilisée par les endpoints de données
     * consommés en AJAX par le dashboard).
     *
     * @param array<string, mixed> $data
     */
    protected function json(array $data): void
    {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
