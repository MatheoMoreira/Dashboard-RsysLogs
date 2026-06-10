<?php

namespace App\Models;

use App\Core\Database;
use PDO;
use PDOException;

/**
 * Statistiques d'infrastructure sur la base de centralisation des logs.
 *
 * Alimente le panneau « Santé de la base » : volumétrie de la table `events`,
 * version/uptime du serveur MariaDB, débit d'ingestion et fraîcheur du flux
 * rsyslog. Le compte du dashboard étant en lecture seule, chaque requête
 * système est encapsulée : si un droit manque, la valeur retombe à null et le
 * reste du panneau s'affiche quand même.
 */
final class DbStatsModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /**
     * Agrège toutes les métriques d'infrastructure en un seul tableau prêt à
     * être consommé par la vue.
     *
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $storage = $this->tableStorage('events');
        $span     = $this->timeSpan();
        $last     = $this->lastReceivedAt();

        return [
            'version'        => $this->serverVersion(),
            'uptime'         => $this->statusValue('Uptime'),
            'threads'        => $this->statusValue('Threads_connected'),
            'slowQueries'    => $this->statusValue('Slow_queries'),
            'dataLength'     => $storage['data'],
            'indexLength'    => $storage['index'],
            'totalLength'    => $storage['total'],
            'firstReceived'  => $span['min'],
            'lastReceived'   => $last,
            'spanHours'      => $span['hours'],
            'ratePerHour'    => $this->ingestionRatePerHour(),
            'staleSeconds'   => $this->secondsSinceLastInsert(),
        ];
    }

    /** Version du serveur MariaDB/MySQL (ex. "10.11.6-MariaDB"). */
    private function serverVersion(): ?string
    {
        try {
            $v = $this->db->query('SELECT VERSION()')->fetchColumn();
            return $v === false ? null : (string) $v;
        } catch (PDOException) {
            return null;
        }
    }

    /**
     * Valeur d'une variable d'état globale (SHOW GLOBAL STATUS).
     * Renvoie null si la variable est absente ou inaccessible.
     */
    private function statusValue(string $name): ?int
    {
        try {
            $stmt = $this->db->prepare('SHOW GLOBAL STATUS LIKE ?');
            $stmt->execute([$name]);
            $row = $stmt->fetch();
            return $row === false ? null : (int) $row['Value'];
        } catch (PDOException) {
            return null;
        }
    }

    /**
     * Taille de stockage d'une table (données + index) en octets, lue dans
     * information_schema.
     *
     * @return array{data: ?int, index: ?int, total: ?int}
     */
    private function tableStorage(string $table): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT data_length, index_length
                 FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = ?'
            );
            $stmt->execute([$table]);
            $row = $stmt->fetch();
            if ($row === false) {
                return ['data' => null, 'index' => null, 'total' => null];
            }
            $data  = (int) $row['data_length'];
            $index = (int) $row['index_length'];
            return ['data' => $data, 'index' => $index, 'total' => $data + $index];
        } catch (PDOException) {
            return ['data' => null, 'index' => null, 'total' => null];
        }
    }

    /**
     * Plage temporelle couverte par les journaux.
     *
     * @return array{min: ?string, max: ?string, hours: ?float}
     */
    private function timeSpan(): array
    {
        try {
            $row = $this->db->query(
                'SELECT MIN(received_at) AS mn, MAX(received_at) AS mx,
                        TIMESTAMPDIFF(SECOND, MIN(received_at), MAX(received_at)) AS secs
                 FROM events'
            )->fetch();
            if ($row === false || $row['mn'] === null) {
                return ['min' => null, 'max' => null, 'hours' => null];
            }
            return [
                'min'   => (string) $row['mn'],
                'max'   => (string) $row['mx'],
                'hours' => round(((int) $row['secs']) / 3600, 1),
            ];
        } catch (PDOException) {
            return ['min' => null, 'max' => null, 'hours' => null];
        }
    }

    /** Horodatage de la dernière insertion (fraîcheur du flux). */
    private function lastReceivedAt(): ?string
    {
        try {
            $v = $this->db->query('SELECT MAX(received_at) FROM events')->fetchColumn();
            return $v === false || $v === null ? null : (string) $v;
        } catch (PDOException) {
            return null;
        }
    }

    /**
     * Débit d'ingestion moyen sur les dernières 24 h (événements/heure).
     */
    private function ingestionRatePerHour(): ?float
    {
        try {
            $n = (int) $this->db->query(
                'SELECT COUNT(*) FROM events WHERE received_at >= (NOW() - INTERVAL 24 HOUR)'
            )->fetchColumn();
            return round($n / 24, 1);
        } catch (PDOException) {
            return null;
        }
    }

    /**
     * Secondes écoulées depuis la dernière insertion : permet de détecter une
     * interruption du flux rsyslog (le panneau passe en alerte au-delà d'un
     * seuil fixé côté vue).
     */
    private function secondsSinceLastInsert(): ?int
    {
        try {
            $v = $this->db->query(
                'SELECT TIMESTAMPDIFF(SECOND, MAX(received_at), NOW()) FROM events'
            )->fetchColumn();
            return $v === false || $v === null ? null : (int) $v;
        } catch (PDOException) {
            return null;
        }
    }
}
