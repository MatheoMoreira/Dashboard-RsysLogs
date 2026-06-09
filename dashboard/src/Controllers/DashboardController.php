<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Models\EventModel;

/**
 * Vue d'ensemble : compteurs globaux, répartition par catégorie/niveau,
 * activité des dernières 24h et derniers événements.
 */
final class DashboardController extends Controller
{
    public function index(): void
    {
        $config = require dirname(__DIR__, 2) . '/config/config.php';

        // Au tout premier démarrage MariaDB peut ne pas être prête.
        if (!Database::isReady()) {
            $this->view('waiting', [], 'Initialisation…');
            return;
        }

        $model = new EventModel();
        $countByEvent = $model->countByEvent();

        // Agrège les compteurs d'événements en catégories métier.
        $byCategory = [];
        foreach ($config['categories'] as $category => $events) {
            $sum = 0;
            foreach ($events as $event) {
                $sum += $countByEvent[$event] ?? 0;
            }
            $byCategory[$category] = $sum;
        }

        $this->view('dashboard', [
            'total'        => $model->total(),
            'last24h'      => $model->totalSince('24 HOUR'),
            'securityHits' => $model->securityCount($config['security_events']),
            'byCategory'   => $byCategory,
            'byEvent'      => $countByEvent,
            'byLevel'      => $model->countByLevel(),
            'hourly'       => $model->hourlyLast24h(),
        ], 'Vue d\'ensemble');
    }
}
