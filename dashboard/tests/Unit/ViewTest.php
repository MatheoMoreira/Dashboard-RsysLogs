<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\View;
use PHPUnit\Framework\TestCase;

/**
 * Tests du moteur de rendu (App\Core\View) et de son intégration au layout.
 *
 * Couche « Vue » : on rend réellement une vue dans le layout principal et on
 * inspecte le HTML produit (capturé via la mémoire tampon de sortie). Ces tests
 * vérifient l'assemblage vue+layout, l'injection du titre et — point sensible —
 * l'échappement HTML des données exposées (protection XSS).
 */
final class ViewTest extends TestCase
{
    protected function setUp(): void
    {
        // Le layout lit l'URI courante pour marquer l'onglet actif ; valeur par défaut.
        $_SERVER['REQUEST_URI'] = '/';
    }

    /**
     * Rend une vue et renvoie le HTML produit, sans le laisser fuir vers la
     * sortie de test (View::render écrit directement via require).
     *
     * @param array<string, mixed> $data
     */
    private function capture(string $view, array $data = [], string $title = 'Dashboard'): string
    {
        ob_start();
        View::render($view, $data, $title);
        return (string) ob_get_clean();
    }

    public function testEchappeLesCaracteresHtml(): void
    {
        self::assertSame('&lt;script&gt;', View::e('<script>'));
        self::assertSame('&quot;a&quot; &amp; &#039;b&#039;', View::e('"a" & \'b\''));
    }

    public function testRenduProduitUnDocumentHtmlComplet(): void
    {
        $html = $this->capture('error', ['message' => 'Bonjour'], 'Accueil');

        self::assertStringContainsString('<!DOCTYPE html>', $html);
        self::assertStringContainsString('</html>', $html);
        // Le contenu de la vue est injecté dans le layout.
        self::assertStringContainsString('Bonjour', $html);
    }

    public function testRenduInjecteLeTitreDansLaBaliseTitle(): void
    {
        $html = $this->capture('error', ['message' => 'x'], 'Tableau de bord');

        self::assertStringContainsString('<title>Tableau de bord · Supervision Resa</title>', $html);
    }

    public function testRenduEchappeLeTitre(): void
    {
        // Un titre hostile ne doit pas pouvoir injecter de balise dans <title>.
        $html = $this->capture('error', ['message' => 'x'], '<b>pwn</b>');

        self::assertStringNotContainsString('<b>pwn</b>', $html);
        self::assertStringContainsString('&lt;b&gt;pwn&lt;/b&gt;', $html);
    }

    public function testRenduEchappeLesDonneesDeLaVue(): void
    {
        // Le message d'erreur (souvent un chemin issu de l'URL) est échappé.
        $html = $this->capture('error', ['message' => '<img src=x onerror=alert(1)>'], 'Erreur');

        self::assertStringNotContainsString('<img src=x', $html);
        self::assertStringContainsString('&lt;img src=x onerror=alert(1)&gt;', $html);
    }

    public function testLayoutMarqueLOngletActifSelonLUri(): void
    {
        $_SERVER['REQUEST_URI'] = '/events?page=2';
        $html = $this->capture('error', ['message' => 'x'], 'Événements');

        // Le lien « Événements » porte la classe active quand l'URI commence par /events.
        self::assertMatchesRegularExpression('#href="/events"[^>]*\bactive\b#', $html);
        // …et pas le lien « Vue d'ensemble ».
        self::assertDoesNotMatchRegularExpression('#href="/"[^>]*\bactive\b#', $html);
    }

    public function testRenduSansDonneesNeLevePasDErreur(): void
    {
        // La vue « waiting » n'attend aucune variable : le rendu doit aboutir.
        $html = $this->capture('waiting', [], 'Initialisation');

        self::assertStringContainsString('Initialisation…', $html);
        self::assertStringContainsString('<!DOCTYPE html>', $html);
    }
}
