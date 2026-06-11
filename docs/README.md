# Dossier de projet — Dashboard PHP · rsyslog

Ce dossier regroupe l'ensemble des livrables documentaires exigés par l'énoncé,
en complément du code source et du `README.md` racine (procédure d'installation).

| # | Livrable | Fichier |
|---|----------|---------|
| 1 | Analyse du livret ANSSI — Journalisation | [01-analyse-anssi.md](01-analyse-anssi.md) |
| 2 | Dossier de conception (contexte, besoin, objectifs, fonctions, performances, contraintes, moyens) | [02-conception.md](02-conception.md) |
| 3 | Documentation utilisateur (cas d'utilisation) | [03-documentation-utilisateur.md](03-documentation-utilisateur.md) |
| 4 | Tests de validation (état initial / action / résultat) | [04-tests-validation.md](04-tests-validation.md) |
| 5 | Gestion de projet (tâches par livrable, répartition de la charge) | [05-gestion-projet.md](05-gestion-projet.md) |
| 6 | Échanges avec les IA (prompts / résultats) — synthèse + [annexe brute](annexes/echanges-ia-bruts.md) | [06-echanges-ia.md](06-echanges-ia.md) |
| 7 | Maquettes (mockups) | [07-mockup.md](07-mockup.md) |
| 8 | **Critères de performance — protocole, mesures @ 1 M lignes, optimisation** | [08-performances.md](08-performances.md) |
| 9 | Diagrammes UML & schémas | [uml/](uml/) |

> Gestion de projet : [05-gestion-projet.md](05-gestion-projet.md) inclut aussi le
> **registre des risques** (critère 25) et les **indicateurs de suivi prévu/réalisé**
> (critère 26).

## Qualité logicielle (critères 22-24)

Le dashboard est analysé et testé (commandes depuis `dashboard/`) :

```bash
composer install        # installe phpstan + phpunit (require-dev)
composer analyse        # PHPStan niveau 6 — 0 erreur
composer test           # PHPUnit — 28 tests, 48 assertions
```

- **POO** : MVC maison (`Router`, `Controller` abstrait, `View`, `Database` en
  singleton, modèle `EventModel`), classes `final`, `declare(strict_types=1)`.
- **PHPStan** : niveau 6, configuré dans `dashboard/phpstan.neon`.
- **Tests unitaires** : **28 tests** sur les couches *helpers* (`HelpersTest` —
  `e()`, `fmt_dt()`, `fmt_bytes()`, `fmt_duration()`), *Model*
  (`EventModelTest` — `EventModel::buildWhere`) et *Core* (`RouterTest` —
  `Router::normalizePath`). PHPUnit s'exécute dans le conteneur PHP (extensions
  `dom/xml` fournies par l'image).

## Diagrammes (`uml/`)

Les diagrammes sont écrits en **PlantUML** (`.puml`) — versionnables et rendus
par n'importe quel outil PlantUML (extension VS Code, <https://www.plantuml.com/plantuml>).

| Diagramme | Fichier | Critère |
|-----------|---------|:--:|
| Cas d'utilisation (UML use case) | [uml/use-case.puml](uml/use-case.puml) | 10 |
| Déploiement (UML) | [uml/deploiement.puml](uml/deploiement.puml) | 11 |
| Synoptique / flux de centralisation | [uml/synoptique.puml](uml/synoptique.puml) | 12 |
| Sitemap (plan de site) | [uml/sitemap.puml](uml/sitemap.puml) | 13 |

> **Rendu des diagrammes**
> ```bash
> # avec le jar PlantUML
> plantuml docs/uml/*.puml          # génère les .png à côté des .puml
> ```
