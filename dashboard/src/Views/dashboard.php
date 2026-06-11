<?php
/**
 * @var int                $total
 * @var int                $last24h
 * @var int                $prev24h
 * @var int                $securityHits
 * @var array{total:int,human:int,bot:int} $web
 * @var array<string,array{human:int,bot:int}> $hourlySplit
 * @var array<string,int>  $botUas
 * @var array<string,int>  $byCategory
 * @var array<string,int>  $byChannel
 * @var array<string,int>  $byEvent
 * @var array<string,int>  $byLevel
 * @var array<string,int>  $secBreakdown
 * @var array<string,int>  $secTopIps
 * @var list<array<string,mixed>> $secRecent
 * @var array<string,mixed> $dbStats
 */

// Tendance des dernières 24 h vs la période équivalente précédente.
$delta = $prev24h > 0 ? (int) round(($last24h - $prev24h) / $prev24h * 100) : null;

// Trafic web (nginx) : ventilation humain / bot.
$webTotal = $web['total'];
$webHuman = $web['human'];
$webBot   = $web['bot'];
$humanPct = $webTotal > 0 ? (int) round($webHuman / $webTotal * 100) : 0;
$botPct   = $webTotal > 0 ? (int) round($webBot / $webTotal * 100) : 0;
$scansBlocked = $secBreakdown['scanner_probe'] ?? 0;

// Total max d'une tranche horaire (humain+bot) pour mettre la timeline à l'échelle.
$maxSlot = 0;
foreach ($hourlySplit as $h) {
    $maxSlot = max($maxSlot, $h['human'] + $h['bot']);
}

// Seuil au-delà duquel on considère le flux rsyslog comme interrompu (15 min).
$stale = isset($dbStats['staleSeconds']) && $dbStats['staleSeconds'] !== null
    && $dbStats['staleSeconds'] > 900;
?>
<h1>Vue d'ensemble</h1>

<!-- ============================ KPIs ============================ -->
<section class="kpis">
    <div class="card">
        <div class="card-value" data-stat="total"><?= number_format($total, 0, ',', ' ') ?></div>
        <div class="card-label">Événements au total</div>
        <div class="card-foot">
            <span data-stat="last24h"><?= number_format($last24h, 0, ',', ' ') ?></span> sur 24 h
            <?php if ($delta !== null): ?>
                <span class="trend trend-<?= $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'flat') ?>"
                      title="vs 24 h précédentes (<?= number_format($prev24h, 0, ',', ' ') ?>)">
                    <?= $delta > 0 ? '▲' : ($delta < 0 ? '▼' : '=') ?> <?= abs($delta) ?> %
                </span>
            <?php endif; ?>
        </div>
    </div>
    <div class="card">
        <div class="card-value" data-stat="webTotal"><?= number_format($webTotal, 0, ',', ' ') ?></div>
        <div class="card-label">Requêtes web</div>
        <div class="card-foot">trafic vu par nginx</div>
    </div>
    <div class="card card-human">
        <div class="card-value" data-stat="webHuman"><?= number_format($webHuman, 0, ',', ' ') ?></div>
        <div class="card-label">Trafic humain</div>
        <div class="card-foot"><?= $humanPct ?> % des requêtes</div>
    </div>
    <div class="card <?= $webBot > 0 ? 'card-bot' : '' ?>">
        <div class="card-value" data-stat="webBot"><?= number_format($webBot, 0, ',', ' ') ?></div>
        <div class="card-label">🤖 Bots &amp; scans</div>
        <div class="card-foot">
            <?= $botPct ?> % des requêtes
            <?php if ($scansBlocked > 0): ?> · <?= number_format($scansBlocked, 0, ',', ' ') ?> scan(s) bloqué(s)<?php endif; ?>
        </div>
    </div>
    <div class="card <?= $securityHits > 0 ? 'card-alert' : '' ?>" data-card="security">
        <div class="card-value" data-stat="securityHits"><?= number_format($securityHits, 0, ',', ' ') ?></div>
        <div class="card-label">Événements de sécurité</div>
        <div class="card-foot">accès refusés, échecs, scans…</div>
    </div>
</section>

<!-- ========================== TRAFIC =========================== -->
<section class="panel">
    <h2>Trafic web — humain vs bot</h2>
    <?php if ($webTotal === 0): ?>
        <p class="muted">Aucune requête web enregistrée pour l'instant.</p>
    <?php else: ?>
        <div class="split-bar" title="<?= $humanPct ?> % humain · <?= $botPct ?> % bot">
            <span class="split-seg split-human" style="width: <?= $humanPct ?>%"></span>
            <span class="split-seg split-bot" style="width: <?= $botPct ?>%"></span>
        </div>
        <div class="split-legend">
            <span><span class="dot dot-human"></span> Humain — <?= number_format($webHuman, 0, ',', ' ') ?> (<?= $humanPct ?> %)</span>
            <span><span class="dot dot-bot"></span> Bot / scan — <?= number_format($webBot, 0, ',', ' ') ?> (<?= $botPct ?> %)</span>
        </div>

        <div class="grid-2 grid-2-wide">
            <div>
                <h3>Activité des dernières 24 h</h3>
                <?php if ($hourlySplit === []): ?>
                    <p class="muted">Aucune requête sur la période.</p>
                <?php else: ?>
                    <div class="timeline">
                        <?php foreach ($hourlySplit as $slot => $h): $tot = $h['human'] + $h['bot']; ?>
                            <div class="tl-col" title="<?= fmt_dt($slot, 'd/m H:i') ?> — <?= $h['human'] ?> humain · <?= $h['bot'] ?> bot">
                                <span class="tl-stack" style="height: <?= $maxSlot ? round($tot / $maxSlot * 100) : 0 ?>%">
                                    <span class="tl-seg tl-bot"   style="height: <?= $tot ? round($h['bot'] / $tot * 100) : 0 ?>%"></span>
                                    <span class="tl-seg tl-human" style="height: <?= $tot ? round($h['human'] / $tot * 100) : 0 ?>%"></span>
                                </span>
                                <span class="tl-label"><?= fmt_dt($slot, 'H') ?>h</span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
            <div>
                <h3>Top user-agents de bots</h3>
                <?php if ($botUas === []): ?>
                    <p class="muted">Aucun bot détecté. 👍</p>
                <?php else: ?>
                    <table class="bars">
                        <?php $maxUa = max($botUas); ?>
                        <?php foreach ($botUas as $ua => $count): ?>
                            <tr>
                                <th class="ua-cell" title="<?= e($ua) ?>"><?= e(mb_strimwidth($ua, 0, 38, '…')) ?></th>
                                <td class="bar-cell">
                                    <span class="bar bar-warn" style="width: <?= $maxUa ? round($count / $maxUa * 100) : 0 ?>%"></span>
                                </td>
                                <td class="bar-num"><?= $count ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </table>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
</section>

<!-- ========================= SÉCURITÉ ========================== -->
<section class="panel panel-security">
    <h2>🔒 Sécurité</h2>
    <?php if ($secBreakdown === []): ?>
        <p class="muted">Aucun événement de sécurité enregistré. 👍</p>
    <?php else: ?>
        <div class="grid-3">
            <div>
                <h3>Par type</h3>
                <table class="bars">
                    <?php $maxSec = max($secBreakdown); ?>
                    <?php foreach ($secBreakdown as $event => $count): ?>
                        <tr>
                            <th><a href="/events?event=<?= e(urlencode($event)) ?>"><?= e($event) ?></a></th>
                            <td class="bar-cell">
                                <span class="bar bar-danger" style="width: <?= round($count / $maxSec * 100) ?>%"></span>
                            </td>
                            <td class="bar-num"><?= $count ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            </div>
            <div>
                <h3>Top IP suspectes</h3>
                <?php if ($secTopIps === []): ?>
                    <p class="muted">—</p>
                <?php else: ?>
                    <table class="bars">
                        <?php $maxIp = max($secTopIps); ?>
                        <?php foreach ($secTopIps as $ip => $count): ?>
                            <tr>
                                <th><code><?= e($ip) ?></code></th>
                                <td class="bar-cell">
                                    <span class="bar bar-danger" style="width: <?= round($count / $maxIp * 100) ?>%"></span>
                                </td>
                                <td class="bar-num"><?= $count ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </table>
                <?php endif; ?>
            </div>
            <div>
                <div class="sec-feed-head">
                    <h3>Derniers événements sensibles</h3>
                    <button type="button" class="ack-toggle" data-ack-toggle hidden>
                        Voir les alertes lues (<span data-ack-count>0</span>)
                    </button>
                </div>
                <ul class="sec-feed" data-sec-feed>
                    <?php foreach ($secRecent as $row): ?>
                        <li data-alert-id="<?= (int) $row['id'] ?>">
                            <span class="level level-<?= e($row['level']) ?>"><?= e($row['level']) ?></span>
                            <a href="/events/show?id=<?= (int) $row['id'] ?>"><?= e($row['event']) ?></a>
                            <span class="muted nowrap"><?= e($row['ip'] ?? '—') ?> · <?= fmt_dt($row['received_at'], 'H:i') ?></span>
                            <button type="button" class="ack-btn" data-ack="<?= (int) $row['id'] ?>"
                                    title="Marquer comme lu (reste consultable, masqué de la liste)">✓</button>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <p class="muted sec-feed-empty" data-ack-empty hidden>Aucune alerte non lue. 👍</p>
            </div>
        </div>
    <?php endif; ?>
</section>

<!-- ======================= SANTÉ BASE ========================== -->
<section class="panel <?= $stale ? 'panel-security' : '' ?>">
    <h2>🗄️ Santé de la base</h2>
    <div class="db-grid">
        <div class="db-stat">
            <span class="db-label">Flux rsyslog</span>
            <span class="db-value <?= $stale ? 'db-value-alert' : 'db-value-ok' ?>">
                <?= $stale ? 'Interrompu' : 'Actif' ?>
            </span>
            <span class="db-sub">
                Dernier log : <?= fmt_dt($dbStats['lastReceived'] ?? null, 'd/m H:i:s') ?>
                <?php if (($dbStats['staleSeconds'] ?? null) !== null): ?>
                    (il y a <?= fmt_duration($dbStats['staleSeconds']) ?>)
                <?php endif; ?>
            </span>
        </div>
        <div class="db-stat">
            <span class="db-label">Débit d'ingestion</span>
            <span class="db-value"><?= $dbStats['ratePerHour'] !== null ? number_format($dbStats['ratePerHour'], 1, ',', ' ') : '—' ?></span>
            <span class="db-sub">événements / heure (24 h)</span>
        </div>
        <div class="db-stat">
            <span class="db-label">Taille des journaux</span>
            <span class="db-value"><?= fmt_bytes($dbStats['totalLength'] ?? null) ?></span>
            <span class="db-sub">
                données <?= fmt_bytes($dbStats['dataLength'] ?? null) ?>
                · index <?= fmt_bytes($dbStats['indexLength'] ?? null) ?>
            </span>
        </div>
        <div class="db-stat">
            <span class="db-label">Profondeur d'historique</span>
            <span class="db-value"><?= ($dbStats['spanHours'] ?? null) !== null ? fmt_duration((int) round($dbStats['spanHours'] * 3600)) : '—' ?></span>
            <span class="db-sub">depuis le <?= fmt_dt($dbStats['firstReceived'] ?? null, 'd/m/Y') ?></span>
        </div>
        <div class="db-stat">
            <span class="db-label">Serveur</span>
            <span class="db-value db-value-sm"><?= e($dbStats['version'] ?? '—') ?></span>
            <span class="db-sub">uptime <?= fmt_duration($dbStats['uptime'] ?? null) ?></span>
        </div>
        <div class="db-stat">
            <span class="db-label">Connexions actives</span>
            <span class="db-value"><?= ($dbStats['threads'] ?? null) !== null ? (int) $dbStats['threads'] : '—' ?></span>
            <span class="db-sub">requêtes lentes : <?= ($dbStats['slowQueries'] ?? null) !== null ? number_format($dbStats['slowQueries'], 0, ',', ' ') : '—' ?></span>
        </div>
    </div>
</section>

<!-- ====================== RÉPARTITIONS ========================= -->
<div class="grid-2">
    <section class="panel">
        <h2>Par catégorie</h2>
        <table class="bars">
            <?php $maxCat = $byCategory ? max($byCategory) : 0; ?>
            <?php foreach ($byCategory as $category => $count): ?>
                <tr>
                    <th><?= e($category) ?></th>
                    <td class="bar-cell">
                        <span class="bar" style="width: <?= $maxCat ? round($count / $maxCat * 100) : 0 ?>%"></span>
                    </td>
                    <td class="bar-num"><?= $count ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </section>

    <section class="panel">
        <h2>Par niveau</h2>
        <table class="bars">
            <?php $maxLvl = $byLevel ? max($byLevel) : 0; ?>
            <?php foreach ($byLevel as $level => $count): ?>
                <tr>
                    <th><span class="level level-<?= e($level) ?>"><?= e($level) ?></span></th>
                    <td class="bar-cell">
                        <span class="bar" style="width: <?= $maxLvl ? round($count / $maxLvl * 100) : 0 ?>%"></span>
                    </td>
                    <td class="bar-num"><?= $count ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </section>
</div>

<div class="grid-2">
    <?php if ($byChannel !== []): ?>
    <section class="panel">
        <h2>Par canal applicatif</h2>
        <table class="bars">
            <?php $maxChan = max($byChannel); ?>
            <?php foreach ($byChannel as $channel => $count): ?>
                <tr>
                    <th><?= e($channel) ?></th>
                    <td class="bar-cell">
                        <span class="bar" style="width: <?= $maxChan ? round($count / $maxChan * 100) : 0 ?>%"></span>
                    </td>
                    <td class="bar-num"><?= $count ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </section>
    <?php endif; ?>

    <section class="panel">
        <h2>Top des événements</h2>
        <table class="bars">
            <?php $maxEv = $byEvent ? max($byEvent) : 0; $i = 0; ?>
            <?php foreach ($byEvent as $event => $count): if ($i++ >= 12) break; ?>
                <tr>
                    <th><a href="/events?event=<?= e(urlencode($event)) ?>"><?= e($event) ?></a></th>
                    <td class="bar-cell">
                        <span class="bar" style="width: <?= $maxEv ? round($count / $maxEv * 100) : 0 ?>%"></span>
                    </td>
                    <td class="bar-num"><?= $count ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </section>
</div>

<p class="muted center" id="refresh-status">
    Heures affichées en <?= e(date_default_timezone_get()) ?> (journaux stockés en UTC).
    Rafraîchissement automatique toutes les 15 s.
</p>

<script>
// Rafraîchissement progressif des compteurs sans recharger la page.
// (Remplace l'ancien meta-refresh : pas de scintillement, pas de perte
//  de la position de défilement.) Repli silencieux si l'endpoint échoue.
(function () {
    'use strict';
    var fmt = new Intl.NumberFormat('fr-FR');
    function poll() {
        fetch('/api/stats', { headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
            .then(function (d) {
                if (!d.ready) { return; }
                document.querySelectorAll('[data-stat]').forEach(function (el) {
                    var k = el.getAttribute('data-stat');
                    if (d[k] !== undefined) { el.textContent = fmt.format(d[k]); }
                });
                var card = document.querySelector('[data-card="security"]');
                if (card) { card.classList.toggle('card-alert', d.securityHits > 0); }
            })
            .catch(function () { /* repli silencieux : on retentera au prochain tick */ });
    }
    setInterval(poll, 15000);
})();

// Acquittement des alertes sensibles (« lu »).
// Le compte BDD étant en lecture seule, l'état est conservé côté navigateur
// (localStorage) : l'alerte n'est jamais supprimée de la base, seulement
// masquée de cette liste. Un bouton permet de réafficher les alertes lues.
(function () {
    'use strict';
    var KEY = 'resa_ack_alerts';
    var feed = document.querySelector('[data-sec-feed]');
    if (!feed) { return; }

    var toggle = document.querySelector('[data-ack-toggle]');
    var countEl = document.querySelector('[data-ack-count]');
    var emptyEl = document.querySelector('[data-ack-empty]');
    var showRead = false;

    function load() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch (e) { return []; }
    }
    function save(ids) {
        try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) { /* quota/private */ }
    }

    function render() {
        var acked = load();
        var items = feed.querySelectorAll('li[data-alert-id]');
        var hidden = 0, visible = 0;
        items.forEach(function (li) {
            var id = li.getAttribute('data-alert-id');
            var isAck = acked.indexOf(id) !== -1;
            li.classList.toggle('is-ack', isAck);
            // Masquée si lue, sauf quand l'utilisateur demande à les revoir.
            var show = !isAck || showRead;
            li.hidden = !show;
            if (isAck) { hidden++; } else { visible++; }
        });
        if (countEl) { countEl.textContent = String(hidden); }
        if (toggle) {
            toggle.hidden = hidden === 0;
            toggle.firstChild.textContent = showRead ? 'Masquer les alertes lues (' : 'Voir les alertes lues (';
        }
        if (emptyEl) { emptyEl.hidden = !(visible === 0 && !showRead); }
    }

    feed.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-ack]');
        if (!btn) { return; }
        var id = btn.getAttribute('data-ack');
        var acked = load();
        var i = acked.indexOf(id);
        if (i === -1) { acked.push(id); } else { acked.splice(i, 1); } // re-clic = annuler
        save(acked);
        render();
    });

    if (toggle) {
        toggle.addEventListener('click', function () { showRead = !showRead; render(); });
    }

    render();
})();
</script>
