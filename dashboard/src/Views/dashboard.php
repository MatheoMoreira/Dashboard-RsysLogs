<?php
/**
 * @var int                $total
 * @var int                $last24h
 * @var int                $securityHits
 * @var array<string,int>  $byCategory
 * @var array<string,int>  $byEvent
 * @var array<string,int>  $byLevel
 * @var array<string,int>  $hourly
 */
$maxHourly = $hourly ? max($hourly) : 0;
?>
<meta http-equiv="refresh" content="15">

<h1>Vue d'ensemble</h1>

<section class="cards">
    <div class="card">
        <div class="card-value"><?= number_format($total, 0, ',', ' ') ?></div>
        <div class="card-label">Événements au total</div>
    </div>
    <div class="card">
        <div class="card-value"><?= number_format($last24h, 0, ',', ' ') ?></div>
        <div class="card-label">Dernières 24 h</div>
    </div>
    <div class="card <?= $securityHits > 0 ? 'card-alert' : '' ?>">
        <div class="card-value"><?= number_format($securityHits, 0, ',', ' ') ?></div>
        <div class="card-label">Événements de sécurité</div>
    </div>
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
