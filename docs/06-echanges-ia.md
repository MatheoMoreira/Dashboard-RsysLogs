# Échanges avec les IA (prompts / résultats)

L'énoncé demande de documenter les échanges avec les IA et de les exploiter de
façon **critique**. Cette section retrace les principaux usages, le résultat obtenu
et la décision prise (acceptée / adaptée / rejetée).

> Format : **Prompt** → **Réponse (synthèse)** → **Décision & justification**.

## É-01 — Architecture MVC du dashboard PHP sans framework

- **Prompt** : « Propose une structure MVC minimale en PHP 8 avec autoload PSR-4
  (front controller, routeur, contrôleurs, vues, accès PDO) pour un dashboard de
  consultation. »
- **Réponse (synthèse)** : squelette `public/index.php` + `Core/{Router,Controller,View,Database}`
  + `Controllers/` + `Models/` + `Views/`.
- **Décision** : ✅ **Adopté et adapté**. Ajout d'un `Database` en **singleton** avec
  `isReady()` pour gérer le démarrage avant MariaDB, et `declare(strict_types=1)`
  généralisé. *Critique* : la proposition initiale ouvrait une connexion par requête
  → remplacé par une connexion partagée.

## É-02 — Sécurité de la journalisation (moindre privilège)

- **Prompt** : « Comment garantir l'intégrité des journaux d'une base MariaDB
  consultée par un dashboard web, selon les recommandations ANSSI ? »
- **Réponse (synthèse)** : séparer les comptes, donner `INSERT` au collecteur et
  `SELECT` seul au consommateur ; ne pas exposer le port du collecteur.
- **Décision** : ✅ **Adopté**. Deux comptes (`rsyslog`, `dashboard_ro`), grant
  automatisé (`db/20-dashboard-grant.sh`), port 514 non publié. *Critique* : vérifié
  par un test de recette (T-04) plutôt qu'accepté tel quel.

## É-03 — Schéma de table pour des logs JSON hétérogènes

- **Prompt** : « Stocker des logs JSON variables en MariaDB tout en pouvant filtrer
  efficacement par champ. »
- **Réponse (synthèse)** : colonne `raw_json` + **colonnes générées** `STORED`
  extraites par `JSON_EXTRACT`, indexées.
- **Décision** : ✅ **Adopté et corrigé**. *Critique* : la suggestion ne gérait pas le
  cas d'un champ JSON explicitement `null` (chaîne `"null"` côté SQL) → ajout de
  `NULLIF(..., 'null')` pour obtenir de vrais `NULL` (indispensable pour `user_id INT`).

## É-04 — Extraction du JSON dans des messages syslog encadrés

- **Prompt** : « rsyslog reçoit soit un JSON brut (app), soit un message syslog qui
  contient un JSON (nginx). Comment n'insérer que la portion JSON ? »
- **Réponse (synthèse)** : template + extraction par expression régulière de la
  sous-chaîne JSON avant `ommysql`.
- **Décision** : ✅ **Adopté**. Intégré dans `docker/rsyslog/rsyslog.conf`. *Critique* :
  testé sur les deux sources (T-01, T-03).

## É-05 — Génération assistée de la documentation

- **Prompt** : « À partir du code et de l'énoncé, structure les livrables (analyse
  ANSSI, conception, doc utilisateur, tests de validation, UML). »
- **Réponse (synthèse)** : plan de dossier `docs/` + gabarits.
- **Décision** : 🟡 **Adapté**. Les contenus ont été **réécrits à partir du code réel**
  (routes, `EventLogger`, `init.sql`) pour éviter toute information inventée ; les
  diagrammes sont alignés sur les routes effectives.

## Bilan critique de l'usage des IA

- **Apport** : accélération sur le squelette MVC, les patterns de sécurité et la
  syntaxe SQL des colonnes générées.
- **Limites constatées** : suggestions parfois non robustes (connexion par requête,
  `null` JSON non géré) → **toujours vérifiées par des tests** avant adoption.
- **Règle suivie** : aucune sortie d'IA n'est intégrée sans relecture et sans test de
  recette correspondant.
