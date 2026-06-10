<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Tests des fonctions utilitaires globales (src/helpers.php), chargées via
 * l'autoload Composer. Fonctions pures : aucun accès base de données requis.
 */
final class HelpersTest extends TestCase
{
    protected function setUp(): void
    {
        // Fuseau fixe pour rendre la conversion d'horodatage déterministe.
        date_default_timezone_set('Europe/Paris');
    }

    public function testEchappeLesCaracteresHtml(): void
    {
        self::assertSame('&lt;script&gt;', e('<script>'));
        self::assertSame('&quot;a&quot; &amp; &#039;b&#039;', e('"a" & \'b\''));
    }

    public function testEconvertitLesValeursNonChaines(): void
    {
        self::assertSame('42', e(42));
        self::assertSame('', e(null));
    }

    public function testFmtDtRetourneTiretSurChaineVide(): void
    {
        self::assertSame('—', fmt_dt(''));
        self::assertSame('—', fmt_dt(null));
    }

    public function testFmtDtConvertitUtcIso8601VersFuseauLocal(): void
    {
        // 08:52:50 UTC en hiver = 09:52:50 Europe/Paris (CET, +1) ;
        // en été (CEST, +2) = 10:52:50. On teste une date d'été (juin).
        self::assertSame(
            '09/06/2026 10:52:50',
            fmt_dt('2026-06-09T08:52:50Z')
        );
    }

    public function testFmtDtInterpreteLeDatetimeMariadbCommeUtc(): void
    {
        // DATETIME MariaDB sans suffixe → interprété en UTC, converti en local.
        self::assertSame(
            '09/06/2026 10:52:50',
            fmt_dt('2026-06-09 08:52:50')
        );
    }

    public function testFmtDtAccepteUnFormatPersonnalise(): void
    {
        self::assertSame(
            '2026-06-09',
            fmt_dt('2026-06-09T08:52:50Z', 'Y-m-d')
        );
    }

    public function testFmtDtEchappeUneEntreeInvalide(): void
    {
        // Une valeur non parsable est renvoyée échappée, sans lever d'exception.
        self::assertSame('&lt;bad&gt;', fmt_dt('<bad>'));
    }

    public function testFmtBytesRetourneTiretSurNull(): void
    {
        self::assertSame('—', fmt_bytes(null));
    }

    public function testFmtBytesFormateLesEchellesBinaires(): void
    {
        self::assertSame('0 o', fmt_bytes(0));
        self::assertSame('512 o', fmt_bytes(512));
        self::assertSame('1,0 Ko', fmt_bytes(1024));
        self::assertSame('1,5 Ko', fmt_bytes(1536));
        self::assertSame('1,0 Mo', fmt_bytes(1024 * 1024));
        self::assertSame('2,0 Go', fmt_bytes(2 * 1024 * 1024 * 1024));
    }

    public function testFmtDurationRetourneTiretSurNull(): void
    {
        self::assertSame('—', fmt_duration(null));
    }

    public function testFmtDurationFormateLesDurees(): void
    {
        self::assertSame('45 s', fmt_duration(45));
        self::assertSame('2 min', fmt_duration(120));
        self::assertSame('1 h 30 min', fmt_duration(5400));
        // Au-delà du jour, on omet les minutes pour rester lisible (uptime).
        self::assertSame('1 j 1 h', fmt_duration(90000));
    }
}
