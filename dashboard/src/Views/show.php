<?php
/**
 * @var array<string,mixed> $event
 */
$decoded = json_decode((string) $event['raw_json'], true);
$pretty = is_array($decoded)
    ? json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
    : $event['raw_json'];
?>
<p><a class="link" href="/events">‹ Retour à la liste</a></p>

<h1>Événement #<?= (int) $event['id'] ?> — <code><?= e($event['event']) ?></code></h1>

<table class="detail">
    <tr><th>Reçu le</th><td><?= e($event['received_at']) ?></td></tr>
    <tr><th>Niveau</th><td><span class="level level-<?= e($event['level']) ?>"><?= e($event['level']) ?></span></td></tr>
    <tr><th>Canal</th><td><?= e($event['channel']) ?></td></tr>
    <tr><th>User ID</th><td><?= e($event['user_id']) ?></td></tr>
    <tr><th>IP</th><td><?= e($event['ip']) ?></td></tr>
    <tr><th>Méthode</th><td><?= e($event['method']) ?></td></tr>
    <tr><th>Chemin</th><td><?= e($event['path']) ?></td></tr>
    <tr><th>Horodatage applicatif</th><td><?= e($event['event_time']) ?></td></tr>
</table>

<h2>JSON brut</h2>
<pre class="json"><?= e($pretty) ?></pre>
