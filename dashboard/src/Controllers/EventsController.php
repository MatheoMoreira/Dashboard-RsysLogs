<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Models\EventModel;

/**
 * Liste filtrable/paginée des événements et détail d'un événement.
 */
final class EventsController extends Controller
{
    private const PER_PAGE = 25;

    public function index(): void
    {
        if (!Database::isReady()) {
            $this->view('waiting', [], 'Initialisation…');
            return;
        }

        $model = new EventModel();

        $filters = [
            'event'     => trim((string) ($_GET['event'] ?? '')),
            'level'     => trim((string) ($_GET['level'] ?? '')),
            'traffic'   => trim((string) ($_GET['traffic'] ?? '')),
            'user_id'   => trim((string) ($_GET['user_id'] ?? '')),
            'date_from' => trim((string) ($_GET['date_from'] ?? '')),
            'date_to'   => trim((string) ($_GET['date_to'] ?? '')),
        ];

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $result = $model->paginate($filters, $page, self::PER_PAGE);

        $this->view('events', [
            'rows'       => $result['rows'],
            'total'      => $result['total'],
            'page'       => $page,
            'perPage'    => self::PER_PAGE,
            'pages'      => (int) max(1, ceil($result['total'] / self::PER_PAGE)),
            'filters'    => $filters,
            'eventTypes' => $model->distinctEvents(),
        ], 'Événements');
    }

    public function show(): void
    {
        if (!Database::isReady()) {
            $this->view('waiting', [], 'Initialisation…');
            return;
        }

        $id = (int) ($_GET['id'] ?? 0);
        $event = (new EventModel())->find($id);

        if ($event === null) {
            http_response_code(404);
            $this->view('error', ['message' => "Événement #{$id} introuvable."], 'Erreur 404');
            return;
        }

        $this->view('show', ['event' => $event], "Événement #{$id}");
    }
}
