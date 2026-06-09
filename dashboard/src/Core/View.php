<?php

namespace App\Core;

/**
 * Moteur de rendu minimal : injecte une vue dans un layout commun.
 */
final class View
{
    private const VIEW_PATH = __DIR__ . '/../Views/';

    /**
     * Rend une vue dans le layout principal.
     *
     * @param string               $view   Nom du fichier de vue (sans extension)
     * @param array<string, mixed> $data   Variables exposées à la vue
     * @param string               $title  Titre de la page
     */
    public static function render(string $view, array $data = [], string $title = 'Dashboard'): void
    {
        extract($data, EXTR_SKIP);

        ob_start();
        require self::VIEW_PATH . $view . '.php';
        $content = ob_get_clean();

        require self::VIEW_PATH . 'layout.php';
    }

    /**
     * Échappement HTML pratique pour les vues.
     */
    public static function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
