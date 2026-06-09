<?php
/**
 * @var list<array<string,mixed>> $rows
 * @var int                       $total
 * @var int                       $page
 * @var int                       $pages
 * @var array<string,string>      $filters
 * @var string[]                  $eventTypes
 */
function qs(array $overrides): string
{
    return http_build_query(array_merge($_GET, $overrides));
}
?>
<h1>Événements <span class="muted">(<?= number_format($total, 0, ',', ' ') ?>)</span></h1>

<form class="filters" method="get" action="/events">
    <label>Type
        <select name="event">
            <option value="">— tous —</option>
            <?php foreach ($eventTypes as $type): ?>
                <option value="<?= e($type) ?>" <?= $filters['event'] === $type ? 'selected' : '' ?>><?= e($type) ?></option>
            <?php endforeach; ?>
        </select>
    </label>
    <label>Niveau
        <select name="level">
            <?php $levels = ['' => '— tous —', 'info' => 'info', 'warning' => 'warning', 'error' => 'error', 'critical' => 'critical', 'notice' => 'notice', 'debug' => 'debug']; ?>
            <?php foreach ($levels as $val => $lbl): ?>
                <option value="<?= e($val) ?>" <?= $filters['level'] === $val ? 'selected' : '' ?>><?= e($lbl) ?></option>
            <?php endforeach; ?>
        </select>
    </label>
    <label>User ID
        <input type="number" name="user_id" value="<?= e($filters['user_id']) ?>" min="0" placeholder="ex: 1">
    </label>
    <label>Du
        <input type="date" name="date_from" value="<?= e($filters['date_from']) ?>">
    </label>
    <label>Au
        <input type="date" name="date_to" value="<?= e($filters['date_to']) ?>">
    </label>
    <div class="filter-actions">
        <button type="submit">Filtrer</button>
        <a class="btn-reset" href="/events">Réinitialiser</a>
    </div>
</form>

<table class="events">
    <thead>
        <tr>
            <th>Reçu le</th>
            <th>Événement</th>
            <th>Niveau</th>
            <th>User</th>
            <th>IP</th>
            <th>Méthode</th>
            <th>Chemin</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <?php if ($rows === []): ?>
            <tr><td colspan="8" class="muted center">Aucun événement ne correspond aux filtres.</td></tr>
        <?php endif; ?>
        <?php foreach ($rows as $row): ?>
            <tr>
                <td class="nowrap"><?= fmt_dt($row['received_at'], 'd/m H:i:s') ?></td>
                <td><code><?= e($row['event']) ?></code></td>
                <td><span class="level level-<?= e($row['level']) ?>"><?= e($row['level']) ?></span></td>
                <td><?= e($row['user_id']) ?></td>
                <td><?= e($row['ip']) ?></td>
                <td><?= e($row['method']) ?></td>
                <td class="path"><?= e($row['path']) ?></td>
                <td><a class="link" href="/events/show?id=<?= (int) $row['id'] ?>">détail</a></td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<?php if ($pages > 1): ?>
<nav class="pager">
    <?php if ($page > 1): ?>
        <a href="/events?<?= e(qs(['page' => $page - 1])) ?>">‹ Précédent</a>
    <?php endif; ?>
    <span>Page <?= $page ?> / <?= $pages ?></span>
    <?php if ($page < $pages): ?>
        <a href="/events?<?= e(qs(['page' => $page + 1])) ?>">Suivant ›</a>
    <?php endif; ?>
</nav>
<?php endif; ?>
