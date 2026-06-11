<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\EventModel;
use PHPUnit\Framework\TestCase;

/**
 * Tests de la construction de clause WHERE (EventModel::buildWhere).
 *
 * Logique pure (aucun accès base) : on vérifie que chaque filtre produit la
 * bonne condition SQL paramétrée et que les paramètres sont liés dans l'ordre.
 */
final class EventModelTest extends TestCase
{
    public function testAucunFiltreDonneUneClauseVide(): void
    {
        [$where, $params] = EventModel::buildWhere([]);
        self::assertSame('', $where);
        self::assertSame([], $params);
    }

    public function testFiltreEventEtNiveau(): void
    {
        [$where, $params] = EventModel::buildWhere(['event' => 'failed_login', 'level' => 'warning']);
        self::assertSame('WHERE event = ? AND level = ?', $where);
        self::assertSame(['failed_login', 'warning'], $params);
    }

    public function testFiltreUserIdEstConvertiEnEntier(): void
    {
        [$where, $params] = EventModel::buildWhere(['user_id' => '42']);
        self::assertSame('WHERE user_id = ?', $where);
        self::assertSame([42], $params);
    }

    public function testUserIdVideEstIgnore(): void
    {
        // Chaîne vide => pas de condition (distinct de user_id = 0).
        [$where, $params] = EventModel::buildWhere(['user_id' => '']);
        self::assertSame('', $where);
        self::assertSame([], $params);
    }

    public function testPlageDeDatesAjouteLesBornesHoraires(): void
    {
        [$where, $params] = EventModel::buildWhere([
            'date_from' => '2026-06-01',
            'date_to'   => '2026-06-10',
        ]);
        self::assertSame('WHERE received_at >= ? AND received_at <= ?', $where);
        self::assertSame(['2026-06-01 00:00:00', '2026-06-10 23:59:59'], $params);
    }

    public function testFiltreTraficHumain(): void
    {
        [$where, $params] = EventModel::buildWhere(['traffic' => 'human']);
        self::assertSame('WHERE is_bot = 0', $where);
        self::assertSame([], $params);
    }

    public function testFiltreTraficBot(): void
    {
        [$where, $params] = EventModel::buildWhere(['traffic' => 'bot']);
        self::assertSame('WHERE is_bot = 1', $where);
        self::assertSame([], $params);
    }

    public function testTraficInconnuEstIgnore(): void
    {
        [$where, $params] = EventModel::buildWhere(['traffic' => 'autre']);
        self::assertSame('', $where);
        self::assertSame([], $params);
    }

    public function testCombinaisonDeFiltresPreserveLOrdreDesParametres(): void
    {
        [$where, $params] = EventModel::buildWhere([
            'event'     => 'http_access',
            'level'     => 'info',
            'user_id'   => '7',
            'date_from' => '2026-01-01',
            'traffic'   => 'bot',
        ]);
        self::assertSame(
            'WHERE event = ? AND level = ? AND user_id = ? AND received_at >= ? AND is_bot = 1',
            $where
        );
        self::assertSame(['http_access', 'info', 7, '2026-01-01 00:00:00'], $params);
    }
}
