# Maquettes (mockups)

Maquettes basse-fidélité (wireframes ASCII) des écrans clés du **dashboard de
journalisation**. Elles décrivent la disposition cible ; l'implémentation réelle
(style) est dans `dashboard/public/assets/style.css`.

## M-01 — Vue d'ensemble (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard rsyslog            [ Vue d'ensemble ] [ Événements ]│
├──────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │  Total    │ │  24 h      │ │ Sécurité  │ │  Erreurs  │      │
│  │  12 480   │ │   312      │ │    47     │ │    9      │      │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘      │
│                                                                │
│  Répartition par type            Répartition par niveau        │
│  ┌──────────────────────────┐    ┌──────────────────────────┐ │
│  │ http_access     ▇▇▇▇▇ 60% │    │ info     ▇▇▇▇▇▇▇▇ 82 %    │ │
│  │ user_login      ▇▇    18% │    │ warning  ▇▇       13 %    │ │
│  │ failed_login    ▇      7% │    │ error    ▇         5 %    │ │
│  │ reservation_*   ▇      …  │    │                          │ │
│  └──────────────────────────┘    └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## M-02 — Liste des événements (`/events`)

```
┌──────────────────────────────────────────────────────────────┐
│  Événements                                   [ ‹ ] page 1 [ › ]│
├───────────────┬───────────────┬───────┬────────┬──────────────┤
│ Horodatage    │ Événement     │ Niveau│ User   │ IP           │
├───────────────┼───────────────┼───────┼────────┼──────────────┤
│ 09/06 08:52:50│ user_login    │ info  │ 1      │ 172.18.0.4   │ ▶
│ 09/06 08:52:31│ failed_login  │ warn  │ —      │ 172.18.0.4   │ ▶
│ 09/06 08:51:07│ http_access   │ warn  │ —      │ 203.0.113.7  │ ▶  (/.env)
│ …             │ …             │ …     │ …      │ …            │
└───────────────┴───────────────┴───────┴────────┴──────────────┘
        (clic sur une ligne → fiche détail)
```

## M-03 — Détail d'un événement (`/events/show`)

```
┌──────────────────────────────────────────────────────────────┐
│  ‹ Retour à la liste                                           │
│                                                                │
│  Événement : failed_login                      Niveau : warning│
│  Reçu le   : 09/06/2026 08:52:31                               │
│  Utilisateur : —          IP : 172.18.0.4     Méthode : POST   │
│  Chemin    : /api/auth/login                                   │
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
