<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Router;
use PHPUnit\Framework\TestCase;

/**
 * Tests de la normalisation de chemin du routeur (Router::normalizePath).
 *
 * Logique pure (aucun effet de bord) : on vérifie l'isolement du composant
 * chemin, la suppression du slash final et la ramification de la racine.
 */
final class RouterTest extends TestCase
{
    public function testRacineSimple(): void
    {
        self::assertSame('/', Router::normalizePath('/'));
    }

    public function testChaineVideDevientRacine(): void
    {
        self::assertSame('/', Router::normalizePath(''));
    }

    public function testSlashFinalRetire(): void
    {
        self::assertSame('/events', Router::normalizePath('/events/'));
    }

    public function testCheminSansSlashFinalInchange(): void
    {
        self::assertSame('/events', Router::normalizePath('/events'));
    }

    public function testQueryStringIgnoree(): void
    {
        self::assertSame('/events', Router::normalizePath('/events?page=2&level=error'));
    }

    public function testFragmentEtQueryIgnores(): void
    {
        self::assertSame('/api/stats', Router::normalizePath('/api/stats/?x=1#top'));
    }

    public function testCheminProfondConserve(): void
    {
        self::assertSame('/events/42', Router::normalizePath('/events/42'));
    }

    public function testSlashsFinauxMultiplesRamenesARacine(): void
    {
        // rtrim retire tous les slashes finaux ; « /// » → racine.
        self::assertSame('/', Router::normalizePath('///'));
    }
}
