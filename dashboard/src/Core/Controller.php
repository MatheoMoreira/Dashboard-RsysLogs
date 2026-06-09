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
}
