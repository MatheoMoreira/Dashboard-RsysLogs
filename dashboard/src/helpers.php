<?php

declare(strict_types=1);

/*
 * Fonctions utilitaires globales utilisées par les vues.
 * Chargées via l'autoload Composer ("files") — voir composer.json.
 */

if (!function_exists('e')) {
    /** Échappement HTML court, utilisé dans les vues. */
    function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('fmt_dt')) {
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
}
