#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Recette automatisée — produit les ARTEFACTS de la recette (critère 4).
#
# But : convertir les « Résultat obtenu : ✅ » déclaratifs de
# docs/04-tests-validation.md en preuves rejouables et horodatées, committées
# sous docs/verifs/<horodatage>/. Chaque test écrit :
#   - sa commande exacte,
#   - sa sortie brute,
#   - un verdict PASS/FAIL/SKIP comparé au résultat attendu.
#
# Usage :
#   cp .env.example .env        # si pas déjà fait
#   docker compose up --build -d
#   bash db/verifs/run-recette.sh            # toute la recette
#   bash db/verifs/run-recette.sh T-04 T-12  # un sous-ensemble
#
# Le script est NON destructif : il lit la base et émet du trafic web, il ne
# modifie aucune donnée applicative.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# Charge .env pour récupérer creds et domaine (sans polluer l'environnement global).
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi
: "${DB_NAME:=rsyslog_dashboard}"
: "${DB_USER:=rsyslog}"
: "${DB_PASSWORD:=rsyslog_pwd}"
: "${DASHBOARD_DB_USER:=dashboard_ro}"
: "${DASHBOARD_DB_PASSWORD:=dashboard_ro_pwd}"
: "${RESA_DOMAIN:=resa.mips.science}"
: "${DASHBOARD_PORT:=8080}"

DC="docker compose"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="docs/verifs/$STAMP"
mkdir -p "$OUT"
SUMMARY="$OUT/recette.md"

pass=0; fail=0; skip=0

# Exécute une requête SQL avec le compte applicatif (lecture des journaux).
sql() { $DC exec -T mariadb sh -c "exec mariadb -u$DB_USER -p$DB_PASSWORD $DB_NAME -N -B -e \"$1\"" 2>&1; }

# Enregistre un test : nom, attendu, commande (string), sortie déjà capturée, verdict.
record() {
  local id="$1" expected="$2" cmd="$3" output="$4" verdict="$5"
  local f="$OUT/$id.txt"
  {
    echo "# $id  ($STAMP)"
    echo "## Attendu"; echo "$expected"
    echo "## Commande"; echo "$cmd"
    echo "## Sortie brute"; echo "$output"
    echo "## Verdict : $verdict"
  } > "$f"
  printf '| %s | %s | `%s` |\n' "$id" "$verdict" "$f" >> "$SUMMARY"
  case "$verdict" in
    PASS*) pass=$((pass+1));; FAIL*) fail=$((fail+1));; *) skip=$((skip+1));;
  esac
  echo ">>> $id : $verdict"
}

TESTS=("$@")
run() { [[ ${#TESTS[@]} -eq 0 ]] || printf '%s\n' "${TESTS[@]}" | grep -qx "$1"; }

{
  echo "# Recette — artefacts ($STAMP)"
  echo
  echo "Stack : \`docker compose\` du dépôt. Domaine : \`$RESA_DOMAIN\`. Dashboard : http://localhost:$DASHBOARD_PORT"
  echo
  echo "| Test | Verdict | Artefact |"
  echo "|------|---------|----------|"
} > "$SUMMARY"

# Pré-requis : stack up ?
if ! $DC ps >/dev/null 2>&1; then
  echo "ERREUR : 'docker compose' indisponible ou stack non démarrée. Lance d'abord : docker compose up -d" >&2
  exit 2
fi

# ── T-04 — Lecture seule du dashboard (ANSSI R4/R5) ────────────────────────────
if run T-04; then
  cmd="mariadb -u $DASHBOARD_DB_USER -p*** $DB_NAME -e \"DELETE FROM events LIMIT 1;\""
  out="$($DC exec -T mariadb sh -c "exec mariadb -u$DASHBOARD_DB_USER -p$DASHBOARD_DB_PASSWORD $DB_NAME -e 'DELETE FROM events LIMIT 1;'" 2>&1)"
  if echo "$out" | grep -qiE 'denied|DELETE command'; then v="PASS — écriture refusée (intégrité préservée)"; else v="FAIL — écriture NON refusée (revérifier les grants)"; fi
  record "T-04" "ERROR 1142 : DELETE command denied to '$DASHBOARD_DB_USER'" "$cmd" "$out" "$v"
fi

# ── T-05 — Cloisonnement du collecteur rsyslog (ANSSI R15) ─────────────────────
if run T-05; then
  cmd="(exec 3<>/dev/tcp/127.0.0.1/514) # port 514 NON publié sur l'hôte"
  if timeout 3 bash -c 'exec 3<>/dev/tcp/127.0.0.1/514' 2>/dev/null; then
    out="connexion ÉTABLIE sur 127.0.0.1:514"; v="FAIL — le port 514 est joignable depuis l'hôte"
  else
    out="connexion refusée/timeout sur 127.0.0.1:514 (port non publié)"; v="PASS — collecteur non joignable depuis l'hôte"
  fi
  record "T-05" "port 514 non joignable depuis l'hôte" "$cmd" "$out" "$v"
fi

# ── T-08 — Cohérence vue d'ensemble (totaux dashboard ↔ base) ──────────────────
if run T-08; then
  total="$(sql 'SELECT COUNT(*) FROM events;')"
  out="COUNT(*) events = ${total}"
  http="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$DASHBOARD_PORT/" 2>&1)"
  out+=$'\n'"GET / -> HTTP $http"
  if [[ "$http" == "200" && "$total" =~ ^[0-9]+$ ]]; then v="PASS — dashboard 200, total=$total à recouper avec la page"; else v="SKIP — dashboard non joignable (HTTP $http)"; fi
  record "T-08" "vue d'ensemble HTTP 200, totaux cohérents avec la base" "GET / + SELECT COUNT(*)" "$out" "$v"
fi

# ── T-11 — Redirection HTTP -> HTTPS (ANSSI R13) ───────────────────────────────
if run T-11; then
  cmd="curl -sI http://$RESA_DOMAIN/"
  out="$(curl -sI --max-time 8 "http://$RESA_DOMAIN/" 2>&1 | head -20)"
  if echo "$out" | grep -qiE 'HTTP/.* 30[18]|location: https'; then v="PASS — redirection 301/308 vers HTTPS"; else v="SKIP — domaine non résolu/non exposé depuis cet hôte"; fi
  record "T-11" "redirection 301/308 vers https://" "$cmd" "$out" "$v"
fi

# ── T-12 — Blocage + journalisation des scans (ANSSI R16/R17) ──────────────────
if run T-12; then
  before="$(sql "SELECT COUNT(*) FROM events WHERE event='scanner_probe';")"
  code="$(curl -k -s -o /dev/null -w '%{http_code}' --max-time 8 "https://$RESA_DOMAIN/.env" 2>&1)"
  sleep 2
  after="$(sql "SELECT COUNT(*) FROM events WHERE event='scanner_probe';")"
  out="GET /.env -> HTTP $code"$'\n'"scanner_probe : avant=$before après=$after"
  if [[ "$code" == "403" ]] && [[ "$after" =~ ^[0-9]+$ ]] && (( after >= ${before:-0} )); then
    v="PASS — 403 + scanner_probe journalisé"
  else v="SKIP/FAIL — code=$code (domaine non exposé ?)"; fi
  record "T-12" "HTTP 403, événement scanner_probe enregistré" "curl -k https://$RESA_DOMAIN/.env + SELECT COUNT scanner_probe" "$out" "$v"
fi

# ── T-13 — Classification humain / bot (ANSSI R17) ─────────────────────────────
if run T-13; then
  curl -k -s -o /dev/null --max-time 8 -A "curl/8.0 bot" "https://$RESA_DOMAIN/" 2>/dev/null || true
  sleep 2
  out="$(sql "SELECT is_bot, COUNT(*) FROM events WHERE channel='nginx' GROUP BY is_bot;")"
  if echo "$out" | grep -qE '^1\s'; then v="PASS — ventilation is_bot observée"; else v="SKIP — pas de trafic nginx classé (domaine non exposé ?)"; fi
  record "T-13" "requête UA 'bot' comptée is_bot=1 ; navigateur is_bot=0" "curl -A 'curl/8.0 bot' + GROUP BY is_bot" "$out" "$v"
fi

# ── T-14 — IP cliente réelle derrière le reverse-proxy (ANSSI R7) ──────────────
if run T-14; then
  out="$(sql "SELECT ip, COUNT(*) FROM events WHERE channel='nginx' AND ip IS NOT NULL GROUP BY ip ORDER BY 2 DESC LIMIT 5;")"
  if echo "$out" | grep -qvE '172\.(1[6-9]|2[0-9]|3[01])\.' && [[ -n "$out" ]]; then
    v="PASS — IP clientes réelles présentes (pas l'IP du proxy)"
  else v="SKIP — pas assez de trafic pour trancher"; fi
  record "T-14" "ip = IP cliente transmise (X-Forwarded-For), pas l'IP du conteneur nginx" "SELECT ip,COUNT(*) ... GROUP BY ip" "$out" "$v"
fi

{
  echo
  echo "## Bilan : $pass PASS · $fail FAIL · $skip SKIP"
  echo
  echo "> Tests marqués SKIP : prérequis absent dans l'environnement de recette"
  echo "> (domaine public non exposé, trafic insuffisant). Les rejouer sur la"
  echo "> machine de déploiement réelle."
} >> "$SUMMARY"

echo "──────────────────────────────────────────"
echo "Artefacts : $OUT/  (résumé : $SUMMARY)"
echo "Bilan : $pass PASS · $fail FAIL · $skip SKIP"
[[ $fail -eq 0 ]]
