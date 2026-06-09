<?php

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Accès en lecture à la table `events` alimentée par rsyslog.
 *
 * Toutes les requêtes filtrantes utilisent des requêtes préparées ; les
 * colonnes interrogées (event, level, user_id, received_at) sont des colonnes
 * générées indexées issues du JSON brut.
 */
final class EventModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function total(): int
    {
        return (int) $this->db->query('SELECT COUNT(*) FROM events')->fetchColumn();
    }

    public function totalSince(string $interval = '24 HOUR'): int
    {
        $sql = "SELECT COUNT(*) FROM events WHERE received_at >= (NOW() - INTERVAL {$interval})";
        return (int) $this->db->query($sql)->fetchColumn();
    }

    /**
     * Nombre d'événements par type d'événement.
     *
     * @return array<string, int>
     */
    public function countByEvent(): array
    {
        $rows = $this->db->query(
            'SELECT event, COUNT(*) AS n FROM events GROUP BY event ORDER BY n DESC'
        )->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['event'] ?? 'inconnu'] = (int) $row['n'];
        }
        return $result;
    }

    /**
     * Nombre d'événements par niveau de gravité (info, warning, error…).
     *
     * @return array<string, int>
     */
    public function countByLevel(): array
    {
        $rows = $this->db->query(
            'SELECT level, COUNT(*) AS n FROM events GROUP BY level ORDER BY n DESC'
        )->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['level'] ?? 'inconnu'] = (int) $row['n'];
        }
        return $result;
    }

    /**
     * Compte les événements de sécurité (liste fournie par la config).
     *
     * @param string[] $securityEvents
     */
    public function securityCount(array $securityEvents): int
    {
        if ($securityEvents === []) {
            return 0;
        }
        $placeholders = implode(',', array_fill(0, count($securityEvents), '?'));
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM events WHERE event IN ({$placeholders})");
        $stmt->execute($securityEvents);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Répartition horaire des dernières 24h (pour le graphique timeline).
     *
     * @return array<string, int> clé = "HH:00", valeur = nombre d'événements
     */
    public function hourlyLast24h(): array
    {
        $rows = $this->db->query(
            "SELECT DATE_FORMAT(received_at, '%Y-%m-%d %H:00') AS slot, COUNT(*) AS n
             FROM events
             WHERE received_at >= (NOW() - INTERVAL 24 HOUR)
             GROUP BY slot ORDER BY slot"
        )->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['slot']] = (int) $row['n'];
        }
        return $result;
    }

    /**
     * Répartition détaillée des événements de sécurité (par type).
     *
     * @param string[] $securityEvents
     * @return array<string, int> type d'événement => nombre
     */
    public function securityBreakdown(array $securityEvents): array
    {
        if ($securityEvents === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($securityEvents), '?'));
        $stmt = $this->db->prepare(
            "SELECT event, COUNT(*) AS n FROM events
             WHERE event IN ({$placeholders})
             GROUP BY event ORDER BY n DESC"
        );
        $stmt->execute($securityEvents);

        $result = [];
        foreach ($stmt->fetchAll() as $row) {
            $result[$row['event']] = (int) $row['n'];
        }
        return $result;
    }

    /**
     * Adresses IP les plus actives parmi les événements de sécurité.
     *
     * @param string[] $securityEvents
     * @return array<string, int> ip => nombre d'événements sensibles
     */
    public function topSecurityIps(array $securityEvents, int $limit = 5): array
    {
        if ($securityEvents === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($securityEvents), '?'));
        $stmt = $this->db->prepare(
            "SELECT ip, COUNT(*) AS n FROM events
             WHERE event IN ({$placeholders}) AND ip IS NOT NULL
             GROUP BY ip ORDER BY n DESC LIMIT {$limit}"
        );
        $stmt->execute($securityEvents);

        $result = [];
        foreach ($stmt->fetchAll() as $row) {
            $result[$row['ip']] = (int) $row['n'];
        }
        return $result;
    }

    /**
     * Derniers événements de sécurité (pour le journal du panneau dédié).
     *
     * @param string[] $securityEvents
     * @return list<array<string,mixed>>
     */
    public function recentSecurity(array $securityEvents, int $limit = 8): array
    {
        if ($securityEvents === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($securityEvents), '?'));
        $stmt = $this->db->prepare(
            "SELECT id, received_at, event, level, user_id, ip, path
             FROM events
             WHERE event IN ({$placeholders})
             ORDER BY id DESC LIMIT {$limit}"
        );
        $stmt->execute($securityEvents);
        return $stmt->fetchAll();
    }

    /**
     * Liste paginée et filtrée des événements.
     *
     * @param array{event?:string,level?:string,user_id?:string,date_from?:string,date_to?:string} $filters
     * @return array{rows: list<array<string,mixed>>, total: int}
     */
    public function paginate(array $filters, int $page, int $perPage): array
    {
        [$where, $params] = $this->buildWhere($filters);

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM events {$where}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $offset = max(0, ($page - 1) * $perPage);
        $sql = "SELECT id, received_at, event, level, user_id, ip, method, path, raw_json
                FROM events {$where}
                ORDER BY id DESC
                LIMIT {$perPage} OFFSET {$offset}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return ['rows' => $stmt->fetchAll(), 'total' => $total];
    }

    /**
     * Retourne un événement par son identifiant, ou null s'il n'existe pas.
     *
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Liste des types d'événements distincts (pour le menu déroulant de filtre).
     *
     * @return string[]
     */
    public function distinctEvents(): array
    {
        $rows = $this->db->query(
            'SELECT DISTINCT event FROM events WHERE event IS NOT NULL ORDER BY event'
        )->fetchAll(PDO::FETCH_COLUMN);
        return $rows ?: [];
    }

    /**
     * Construit la clause WHERE à partir des filtres fournis.
     *
     * @param array<string,string> $filters
     * @return array{0: string, 1: array<int, mixed>}
     */
    private function buildWhere(array $filters): array
    {
        $conditions = [];
        $params = [];

        if (!empty($filters['event'])) {
            $conditions[] = 'event = ?';
            $params[] = $filters['event'];
        }
        if (!empty($filters['level'])) {
            $conditions[] = 'level = ?';
            $params[] = $filters['level'];
        }
        if (isset($filters['user_id']) && $filters['user_id'] !== '') {
            $conditions[] = 'user_id = ?';
            $params[] = (int) $filters['user_id'];
        }
        if (!empty($filters['date_from'])) {
            $conditions[] = 'received_at >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }
        if (!empty($filters['date_to'])) {
            $conditions[] = 'received_at <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $where = $conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions);
        return [$where, $params];
    }
}
