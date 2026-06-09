<?php
/**
 * @var int                $total
 * @var int                $last24h
 * @var int                $securityHits
 * @var array<string,int>  $byCategory
 * @var array<string,int>  $byEvent
 * @var array<string,int>  $byLevel
 * @var array<string,int>  $hourly
 * @var array<string,int>  $secBreakdown
 * @var array<string,int>  $secTopIps
 * @var list<array<string,mixed>> $secRecent
 */
$maxHourly = $hourly ? max($hourly) : 0;
?>
<h1>Vue d'ensemble</h1>

<section class="cards">
    <div class="card">
        <div class="card-value" data-stat="total"><?= number_format($total, 0, ',', ' ') ?></div>
        <div class="card-label">Événements au total</div>
    </div>
    <div class="card">
        <div class="card-value" data-stat="last24h"><?= number_format($last24h, 0, ',', ' ') ?></div>
        <div class="card-label">Dernières 24 h</div>
    </div>
    <div class="card <?= $securityHits > 0 ? 'card-alert' : '' ?>" data-card="security">
        <div class="card-value" data-stat="securityHits"><?= number_format($securityHits, 0, ',', ' ') ?></div>
        <div class="card-label">Événements de sécurité</div>
    </div>
</section>

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
                <h3>Derniers événements sensibles</h3>
                <ul class="sec-feed">
                    <?php foreach ($secRecent as $row): ?>
                        <li>
                            <span class="level level-<?= e($row['level']) ?>"><?= e($row['level']) ?></span>
                            <a href="/events/show?id=<?= (int) $row['id'] ?>"><?= e($row['event']) ?></a>
                            <span class="muted nowrap"><?= e($row['ip'] ?? '—') ?> · <?= e(substr((string) $row['received_at'], 11, 5)) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
    <?php endif; ?>
</section>

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

<section class="panel">
    <h2>Activité des dernières 24 h</h2>
    <?php if ($hourly === []): ?>
        <p class="muted">Aucun événement sur la période.</p>
    <?php else: ?>
        <div class="timeline">
            <?php foreach ($hourly as $slot => $count): ?>
                <div class="tl-col" title="<?= e($slot) ?> — <?= $count ?> évén.">
                    <span class="tl-bar" style="height: <?= $maxHourly ? round($count / $maxHourly * 100) : 0 ?>%"></span>
                    <span class="tl-label"><?= e(substr((string) $slot, 11, 2)) ?>h</span>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>

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

<p class="muted center" id="refresh-status">Rafraîchissement automatique toutes les 15 s.</p>

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
</script>
