# Maquettes (mockups)

Maquettes basse-fidélité (wireframes ASCII) des écrans clés du **dashboard de
journalisation**. Elles décrivent la disposition cible ; l'implémentation réelle
(style) est dans `dashboard/public/assets/style.css`.

## M-01 — Vue d'ensemble (`/`)

Disposition cible après refonte : bandeau de **KPIs** (dont le trafic humain/bot),
puis sections **Trafic**, **Sécurité**, **Santé de la base** et **répartitions**.

```
┌────────────────────────────────────────────────────────────────────┐
│  Resa · Supervision        [ Vue d'ensemble ] [ Événements ]  ● live │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Événem. │ │Requêtes │ │ Humain  │ │🤖 Bots & │ │ Sécurité │       │
│  │ 12 480  │ │  web    │ │  6 120  │ │  scans   │ │   47     │       │
│  │ 24h:312 │ │  6 380  │ │  96 %   │ │ 260 · 4% │ │          │       │
│  │  ▲ 8 %  │ │         │ │         │ │ 18 bloq. │ │          │       │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘ └──────────┘       │
│                                                                      │
│  Trafic web — humain vs bot                                          │
│  [██████████████████████████████████░░] 96 % humain · 4 % bot        │
│  ┌── Activité 24h (empilée) ──┐  ┌── Top user-agents bots ────────┐  │
│  │ ▁▂▃▅▇▅▃▂ (humain/bot)      │  │ curl/8.0        ▇▇▇▇▇  120       │  │
│  └────────────────────────────┘  │ python-requests ▇▇     48        │  │
│                                   └─────────────────────────────────┘ │
│                                                                      │
│  🔒 Sécurité   │ 🗄️ Santé base │  Par catégorie / niveau / canal      │
│  scanner_probe │ flux: Actif   │  http_access ▇▇▇▇▇ · info ▇▇▇▇▇      │
│  failed_login  │ 6,2 Mo · 24/h │  …                                   │
└────────────────────────────────────────────────────────────────────┘
```

## M-02 — Liste des événements (`/events`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Événements (646)                                   [ ‹ ] page 1 [ › ] │
│  Filtres : Type ▾  Niveau ▾  Trafic [tous|👤humain|🤖bot] ▾  Dates …    │
├───────────────┬──────────────────────┬───────┬──────┬───────────────┤
│ Horodatage    │ Événement            │ Niveau│ User │ IP            │
├───────────────┼──────────────────────┼───────┼──────┼───────────────┤
│ 10/06 11:09:57│ user_login           │ info  │ 1    │ 86.x.x.x      │ ▶
│ 10/06 11:08:31│ failed_login         │ warn  │ —    │ 86.x.x.x      │ ▶
│ 10/06 11:07:02│ scanner_probe 🤖 bot │ warn  │ —    │ 45.x.x.x      │ ▶ (/.env)
│ 10/06 11:06:50│ http_access  🤖 bot  │ info  │ —    │ 45.x.x.x      │ ▶
│ …             │ …                    │ …     │ …    │ …             │
└───────────────┴──────────────────────┴───────┴──────┴───────────────┘
        (badge 🤖 bot = trafic automatisé ; clic sur une ligne → détail)
```

## M-03 — Détail d'un événement (`/events/show`)

```
┌──────────────────────────────────────────────────────────────┐
│  ‹ Retour à la liste                                           │
│                                                                │
│  Événement : failed_login                      Niveau : warning│
│  Reçu le   : 09/06/2026 08:52:31                               │
│  Utilisateur : —          IP : 172.18.0.4     Méthode : POST   │
│  Chemin    : /api/auth/login              Trafic : 👤 humain   │
│                                                                │
│  JSON brut                                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ {                                                        │ │
│  │   "event": "failed_login",                               │ │
│  │   "level": "warning",                                    │ │
│  │   "user_id": null,                                       │ │
│  │   "ip": "172.18.0.4",                                    │ │
│  │   "timestamp": "2026-06-09T08:52:31Z"                    │ │
│  │ }                                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

> Maquettes des écrans Resa (login, salles, réservations, admin) : se référer aux
> pages React correspondantes dans `resa/frontend/src/pages/` ; la charte visuelle
> du dashboard a été alignée sur celle de Resa (commit *refonte visuelle*).
