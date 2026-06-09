<?php
/**
 * Layout principal. Variables attendues : $title, $content.
 * @var string $title
 * @var string $content
 */
$current = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$isOverview = $current === '/' || $current === '';
$isEvents   = str_starts_with((string) $current, '/events');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title) ?> · Supervision Resa</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400..700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<div class="app">
    <aside class="sidebar">
        <div class="brand">
            <div class="brand-mark">R</div>
            <div class="brand-text">
                <p class="brand-name">Resa</p>
                <p class="brand-sub">Supervision</p>
            </div>
        </div>

        <nav class="nav">
            <p class="label-mono nav-title">Journaux</p>
            <a href="/" class="nav-link <?= $isOverview ? 'active' : '' ?>">
                <span class="nav-rail"></span>Vue d'ensemble
            </a>
            <a href="/events" class="nav-link <?= $isEvents ? 'active' : '' ?>">
                <span class="nav-rail"></span>Événements
            </a>
        </nav>

        <div class="sidebar-foot">
            <div class="help-card">
                <p class="help-title">rsyslog → MariaDB</p>
                <p class="help-sub">Journaux centralisés, consultés en lecture seule.</p>
            </div>
        </div>
    </aside>

    <div class="main">
        <header class="topbar">
            <p class="label-mono">Centralisation des journaux</p>
            <span class="live"><span class="live-dot"></span>En direct</span>
        </header>

        <main class="container reveal">
            <?= $content ?>
        </main>

        <footer class="footer">
            Logs centralisés via rsyslog → MariaDB · <?= date('d/m/Y H:i:s') ?>
        </footer>
    </div>
</div>
</body>
</html>
