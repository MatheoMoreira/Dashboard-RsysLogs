<?php
/**
 * Layout principal. Variables attendues : $title, $content.
 * @var string $title
 * @var string $content
 */
$current = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title) ?> · Dashboard rsyslog</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
    <header class="topbar">
        <div class="brand">📊 Resa · Dashboard rsyslog</div>
        <nav>
            <a href="/"        class="<?= $current === '/' ? 'active' : '' ?>">Vue d'ensemble</a>
            <a href="/events"  class="<?= str_starts_with((string) $current, '/events') ? 'active' : '' ?>">Événements</a>
        </nav>
    </header>

    <main class="container">
        <?= $content ?>
    </main>

    <footer class="footer">
        Logs centralisés via rsyslog → MariaDB · <?= date('d/m/Y H:i:s') ?>
    </footer>
</body>
</html>
