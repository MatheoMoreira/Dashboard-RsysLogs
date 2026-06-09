<?php

namespace App\Core;

use PDO;
use PDOException;

/**
 * Accès à la base de données (PDO) sous forme de singleton.
 *
 * Une seule connexion est partagée par toute la requête HTTP. La connexion
 * peut être réessayée car le conteneur dashboard peut démarrer avant que
 * MariaDB ne soit prête.
 */
final class Database
{
    private static ?PDO $instance = null;

    private function __construct()
    {
    }

    public static function connection(): PDO
    {
        if (self::$instance instanceof PDO) {
            return self::$instance;
        }

        $config = require dirname(__DIR__, 2) . '/config/config.php';
        $db = $config['db'];

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $db['host'],
            $db['port'],
            $db['name']
        );

        self::$instance = new PDO($dsn, $db['user'], $db['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        return self::$instance;
    }

    /**
     * Indique si la base est joignable (utilisé pour afficher un message
     * d'attente plutôt qu'une erreur fatale au tout premier démarrage).
     */
    public static function isReady(): bool
    {
        try {
            self::connection()->query('SELECT 1');
            return true;
        } catch (PDOException) {
            self::$instance = null;
            return false;
        }
    }
}
