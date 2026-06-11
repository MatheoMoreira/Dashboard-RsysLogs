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

if (!function_exists('fmt_bytes')) {
    /**
     * Met en forme une taille en octets de façon lisible (Ko, Mo, Go…).
     * Base 1024, séparateur français. Renvoie "—" pour null.
     */
    function fmt_bytes(?int $bytes): string
    {
        if ($bytes === null) {
            return '—';
        }
        $units = ['o', 'Ko', 'Mo', 'Go', 'To'];
        $value = (float) $bytes;
        $i = 0;
        while ($value >= 1024 && $i < count($units) - 1) {
            $value /= 1024;
            $i++;
        }
        $decimals = $i === 0 ? 0 : 1;
        return number_format($value, $decimals, ',', ' ') . ' ' . $units[$i];
    }
}

if (!function_exists('fmt_duration')) {
    /**
     * Met en forme une durée (en secondes) en "Jj Hh Mmin". Renvoie "—" pour
     * null. Utilisé pour l'uptime serveur et la fraîcheur du flux.
     */
    function fmt_duration(?int $seconds): string
    {
        if ($seconds === null) {
            return '—';
        }
        if ($seconds < 60) {
            return $seconds . ' s';
        }
        $days  = intdiv($seconds, 86400);
        $hours = intdiv($seconds % 86400, 3600);
        $mins  = intdiv($seconds % 3600, 60);

        $parts = [];
        if ($days > 0) {
            $parts[] = $days . ' j';
        }
        if ($hours > 0) {
            $parts[] = $hours . ' h';
        }
        if ($mins > 0 && $days === 0) {
            $parts[] = $mins . ' min';
        }
        return implode(' ', $parts);
    }
}
