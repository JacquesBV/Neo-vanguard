#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# NEO VANGUARD — mise à jour du dépôt GitHub en une commande.
# Prérequis : git installé et authentifié sur ce poste (gh auth login, ou
# identifiants Git enregistrés). À lancer depuis CE dossier (celui du zip).
# Usage : bash pousser-vers-github.sh [nom-de-depot] [nom-de-branche]
# ---------------------------------------------------------------------------
set -e
DEPOT="${1:-Neo-vanguard}"
BRANCHE="${2:-main}"
COMPTE="${GITHUB_USER:-JacquesBV}"
ICI="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
echo "→ dépôt  : https://github.com/${COMPTE}/${DEPOT}"
echo "→ dossier : ${TMP}"
git clone --depth 1 "https://github.com/${COMPTE}/${DEPOT}.git" "$TMP/repo"
cp -f "$ICI/index.html" "$ICI/README.md" "$TMP/repo/"
[ -f "$ICI/neo-vanguard-codes-triches.pdf" ] && cp -f "$ICI/neo-vanguard-codes-triches.pdf" "$TMP/repo/"
[ -f "$ICI/pack-graphique-4-eres.png" ] && cp -f "$ICI/pack-graphique-4-eres.png" "$TMP/repo/"
[ -f "$ICI/secteur4-nouveau.png" ] && cp -f "$ICI/secteur4-nouveau.png" "$TMP/repo/"
touch "$TMP/repo/.nojekyll"
cd "$TMP/repo"
git checkout -B "$BRANCHE"
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-JacquesBV}" -c user.email="${GIT_AUTHOR_EMAIL:-jacquesbv@users.noreply.github.com}" \
    commit -m "NEO VANGUARD — build $(date +%Y-%m-%d) : flash d'impact par génération" || echo "(rien à committer)"
git push origin "$BRANCHE"
echo
echo "✓ poussé. GitHub Pages redéploie en ~1 minute :"
echo "  https://${COMPTE,,}.github.io/${DEPOT}/"
