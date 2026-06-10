<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Models\DbStatsModel;
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

        $security = $config['security_events'];

        $this->view('dashboard', [
            'total'        => $model->total(),
            'last24h'      => $model->totalSince('24 HOUR'),
            'prev24h'      => $model->previous24h(),
            'securityHits' => $model->securityCount($security),
            'web'          => $model->webTraffic(),
            'hourlySplit'  => $model->hourlyTrafficSplit(),
            'botUas'       => $model->topBotUserAgents(),
            'byCategory'   => $byCategory,
            'byChannel'    => $model->countByChannel(),
            'byEvent'      => $countByEvent,
            'byLevel'      => $model->countByLevel(),
            'secBreakdown' => $model->securityBreakdown($security),
            'secTopIps'    => $model->topSecurityIps($security),
            'secRecent'    => $model->recentSecurity($security),
            'dbStats'      => (new DbStatsModel())->overview(),
        ], 'Vue d\'ensemble');
    }

    /**
     * Endpoint JSON consommé en AJAX par la page d'accueil pour rafraîchir
     * les compteurs sans recharger toute la page (progressive enhancement).
     */
    public function stats(): void
    {
        if (!Database::isReady()) {
            http_response_code(503);
            $this->json(['ready' => false]);
            return;
        }

        $config = require dirname(__DIR__, 2) . '/config/config.php';
        $model = new EventModel();
        $web = $model->webTraffic();

        $this->json([
            'ready'        => true,
            'total'        => $model->total(),
            'last24h'      => $model->totalSince('24 HOUR'),
            'securityHits' => $model->securityCount($config['security_events']),
            'webTotal'     => $web['total'],
            'webHuman'     => $web['human'],
            'webBot'       => $web['bot'],
        ]);
    }
}
