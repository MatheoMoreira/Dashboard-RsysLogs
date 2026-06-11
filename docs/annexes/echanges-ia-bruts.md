# Annexe — Échanges IA bruts (prompts / résultats verbatim)

> Cette annexe fournit les échanges **bruts** avec l'assistant IA (Claude, via Claude
> Code), exigés par l'énoncé. Les prompts sont retranscrits **mot pour mot** ; les
> résultats sont des **extraits fidèles** des réponses produites (tronqués `[…]` pour
> la longueur). La synthèse critique (ce qui a été retenu / rejeté / corrigé) est dans
> [../06-echanges-ia.md](../06-echanges-ia.md).
>
> Outil : Claude Code (modèle Claude Opus). Période : 2026-06-08 → 2026-06-11.

---

## B-01 — Démarrage et amélioration du dashboard

**Prompt (verbatim)** :
> « Comment améliorer mon dashboard (mettre + informations sur la bdd... et autre) »

**Résultat (extrait)** : proposition d'un modèle dédié `DbStatsModel` exposant l'état
de l'infrastructure (taille de table, version serveur, uptime, threads, requêtes
lentes, débit d'ingestion, fraîcheur du flux), chaque requête encapsulée dans un
`try/catch` pour rester compatible avec le compte **lecture seule**.

**Décision / exploitation critique** : ✅ adopté. *Critique* : j'ai imposé que toutes
les requêtes de stats tolèrent l'absence de droits (`SHOW` partiellement refusé au
compte `dashboard_ro`) → encapsulation systématique, sinon une page blanche au lieu
d'une dégradation gracieuse.

---

## B-02 — Adresses réseau au lieu des IP clientes

**Prompt (verbatim)** :
> « Je crois que ce qui s'affiche, c'est les adresses réseau et non les adresses ip
> dans le dashboard, d'ailleurs il me faudrait un bouton pour les alertes critiques
> pour 'lire' et la garder mais pas l'afficher, l'afficher que à la demande »

**Résultat (extrait)** : diagnostic « le `docker-proxy` (userland-proxy) réécrit l'IP
source en passerelle `172.18.0.1` avant d'atteindre le conteneur ; `real_ip` /
`TrustProxies` ne peuvent rien y faire tant que le proxy NATe la source ». Deux pistes :
(A) Caddy en `network_mode: host`, (B) désactiver `userland-proxy` dans `daemon.json`.

**Décision / exploitation critique** : 🟡 adapté. La piste (B) a été **testée puis
rejetée** : `{"userland-proxy": false}` a **cassé l'accès externe** (site injoignable)
bien que `ip_forward=1`. Retour à (A) Caddy host-network, qui fonctionne sans toucher
au démon Docker. *Leçon* : ne pas appliquer une suggestion IA touchant l'infra hôte
sans test de réversibilité — documenté dans la mémoire projet.

---

## B-03 — Filtrage des scanners par Caddy/nginx

**Prompt (verbatim)** :
> « est-ce que caddy peut faire du filtrage pour flagger les bad requests des scan des
> bots, pose moi des questions si je suis pas clair »

**Résultat (extrait)** : proposition de bloquer (403) et journaliser les sondes connues
(`/.env`, `/wp-admin`, `/.git`, `/vendor/`, `*.sql`…) au niveau **nginx** (et non Caddy)
via une `location` à regex, avec un `log_format json_scanner` dédié émettant un événement
`scanner_probe` classé en sécurité par le dashboard.

**Décision / exploitation critique** : ✅ adopté, mais **déplacé de Caddy vers nginx** :
Caddy est en host-network et ne voit pas le détail applicatif ; nginx sert déjà la SPA
et connaît les chemins inexistants. *Critique* : la liste de regex a été restreinte aux
chemins **réellement absents** d'une SPA statique pour éviter les faux positifs.

---

## B-04 — Classification humain/bot et refonte

**Prompt (verbatim)** :
> « Ok maintenant j'aimerais bien améliorer les évènement et marquer quand c'est un bot
> ou non, dans les kpi mettre le nom total de requete et nb total sans les bots... J'ai
> aussi un peu tout en vrac sur la vue d'ensemble, on peut faire un vrai truc? »

**Résultat (extrait)** : colonne générée `is_bot` (STORED) combinant `scanner_probe` +
signatures `user_agent` (`bot|crawl|curl|python|sqlmap|…`), indexée ; KPIs « total » vs
« hors bots » ; refonte de la vue d'ensemble en sections (Trafic / Sécurité / Santé base).

**Décision / exploitation critique** : ✅ adopté et corrigé. *Critique* : la première
version calculait `is_bot` à la volée en PHP (lent, non filtrable). Remplacé par une
**colonne générée indexée** côté SGBD — c'est précisément cette requête qui a fait
l'objet de l'optimisation perf (index composite, cf.
[../08-performances.md](../08-performances.md)).

---

## B-05 — Réévaluation sur la nouvelle grille CPI

**Prompt (verbatim)** :
> « Des nouveaux critères d'évaluation ont été ajoutés, il faut la refaire :
> https://github.com/fabrice1618/dashboard_PHP_rsyslog »

**Résultat (extrait)** : récupération de `eval/bareme.json` (version `CPI-2026-06`) ;
constat d'un changement de paradigme (règle de preuve R-P1…R-P6, critères 25/26 ajoutés)
et réévaluation honnête à **≈ 11,5/20** (vs ~18,5 sur l'ancienne grille BTS), avec les
leviers de remontée chiffrés.

**Décision / exploitation critique** : ✅ adopté **sans complaisance**. *Critique* :
l'IA a explicitement abaissé sa propre estimation antérieure (de 18,5 à 11,5) plutôt que
de défendre un chiffre flatteur, en appliquant la règle « le déclaratif plafonne à 0,5 ».
Cette annexe, le registre des risques et les mesures de perf sont la réponse directe à
ce diagnostic.

---

## Règles d'usage de l'IA suivies sur le projet

1. **Aucune sortie IA intégrée sans relecture** ni test de recette correspondant.
2. **Vérification avant adoption** : les suggestions touchant l'infra (userland-proxy)
   ou la sécurité (comptes SQL) ont été éprouvées, parfois **rejetées** (B-02).
3. **Refactor des propositions naïves** : connexion PDO par requête → singleton ;
   `is_bot` en PHP → colonne générée indexée (B-04).
4. **Traçabilité** : chaque évolution assistée correspond à un commit identifiable
   (`git log`), ce qui permet de relier prompt → code livré.
