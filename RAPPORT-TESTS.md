# RAPPORT DE TESTS — portage Godot (commit source `ccd7e82`)

## Environnement de test réel
- **Matériel/exécution** : sandbox Linux x86_64 (conteneur), CPU partagé, **GPU : llvmpipe (Mesa 25.0.7, LLVM 19) — rendu logiciel OpenGL 4.5** via `xvfb-run` (X virtuel 480×860).
- **Aucune mesure de FPS transférable** : rendu logiciel sans VSync réel. Aucune garantie de fréquence d'images n'est donnée (le jeu est 2D léger ; le port n'introduit pas d'allocation par frame dans les boucles chaudes — pools audio, caches textures/puces sonores).
- Audio : **driver dummy** (pas de matériel) → validation audio programmatique uniquement.

## A. Validation technique
| Test | Résultat |
|---|---|
| `godot --headless --import` (4.3 stable) | ✅ 0 Parse Error, 0 « Failed to load script » |
| Analyse scripts (import = analyse GDScript complète) | ✅ 33 scripts, 0 erreur après corrections (`:=` sur Variant, masquage `Engine`, casts bool) |
| Lancement `NV_TEST=1..8` (jeu réel sous X virtuel) | ✅ tous verts (détail B) |
| Chemins/casse | ✅ chemins `res://` vérifiés par `ResourceLoader.exists` + import (0 ressource manquante signalée) ; noms préfixés du dépôt (`02_plateau_statique.png`) confirmés |
| Sortie propre | ✅ TEST1 quit sans erreur script ; résidu « ObjectDB leaked » = driver audio dummy du sandbox (playback jamais mixé), non reproductible sur machine audio réelle |
| Miroir `originaux/` | ✅ 856 fichiers (369 Mo) + assets utilisés importés ; total dépôt 1087/1087, 0 échec |

## B. Validation fonctionnelle (harnais NV_TEST, codes de triche de dev sans effet sur la progression joueur)
| Harnais | Périmètre | Résultat |
|---|---|---|
| 1 | titre→campagne→boss→fin→boutique→bombe | ✅ |
| 2 | 7 onglets boutique, options, codes (kabrak77/BANQUE!/inconnu), records, commandes, histoire, secteur 24→fin, 2 joueurs | ✅ |
| 3 | 11 captures visuelles | ✅ 0 erreur |
| 5 | tickets (attribution, série unique, grattage, révélation, NEOMELODIES/CAFAITFLIPPER avec messages de re-saisie, Mes Tickets) | ✅ |
| 7 | module 20 : 8 ennemis + mini-boss, formations, puce son (21×6 recettes, stéréo) | ✅ « recettes manquantes=0 », 28 vivants, « sprites cuits=true » |
| 8 | v6 : FM (31 cartes, achat, lecture, walkman), flipper (menu, table, batteurs, lance-bille), prologue (art chargé), sas 24 (art couloir+porte, 16/16 échantillons) | ✅ |
- Menus/options/boutiques/cassette/code/déblocage : couverts par 2/5/8. Chaque niveau et chaque boss **individuellement** : couverts par le même code de chemin (data-driven du moteur) + atlas 24 ; non exécutés en 24 sessions séparées (outils : cheat SAUT DE SECTEUR + NV_TEST=3 permettent les visites rapides).

## C. Validation visuelle
- **Méthode** : captures Godot 480×860 (`NV_TEST=3/8`, `get_viewport().get_texture()`) comparées aux rendus attendus de la source (mêmes situations, ère et temps reproduits) ; les fichiers source (`02_plateau_statique`, atlas, media) étant les mêmes octets, le contrôle porte sur cadrages/calques/échelles.
- Captures de preuve (dossier `apercu-godot/`) : `1-titre`, `2-story`, `3-help`, `4-shop`, `5-brief`, `6-jeu-1s`, `7-jeu-6s`, `8-boss`, `9-boss-tir`, `10-era2-ville`, `11-era5-hd`, `9-comparaison-fanboy`, `test7-module20`, `1-fm-boutique`, `2-fm-walkman`, `3-pinball-menu`, `4-pinball-table`, `5-prologue`, `6-sas-secteur24`.
- Résultat : cadrages/HUD/coque conformes ; images de différence pixel non générées (l'anti-aliasing logiciel et la TTS excluent une égalité bit-à-bit utile) — comparaison côte à côte humaine documentée.
- **Écart visuel connu** : illustrations procédurales du deck remplacées par les images officielles du jeu (comportement `STORY_IMG` de la source), dégâts visuels secteurs 24 profonds non portés (cf. MATRICE §A-29).

## D. Validation audio
- ✅ Programmatique : 21 recettes × 6 ères rendues (stéréo, « recettes manquantes=0 ») ; 16/16 échantillons sector24 ; FM : lecture par cassette testée (fichier, statut, éjection) ; flipper : 19 wav + boucle 32 s (loop WAV forward).
- ✅ Boucles/volumes/transitions portés (points de boucle WAV, duck mix 49, musiques par ère/boss/écran).
- ❌ **Écoute humaine effective restante** (driver dummy) — à faire sur machine audio réelle.

## Sauvegarde web → native
- Le localStorage du navigateur n'est **pas** accessible depuis l'app native (isolément volontaire du navigateur).
- **Procédure manuelle** : dans le jeu web, exporter la sauvegarde (console : `copy(JSON.stringify(JSON.parse(localStorage['neovanguard.save.v3.json'])))`), coller dans un fichier `neovanguard.save.v3.json`, le déposer dans le dossier utilisateur Godot : Windows `%APPDATA%\Godot\app_userdata\Neo Vanguard\`, Android `/storage/emulated/0/Android/data/<pkg>/files/` (ou « Importer » via un explorateur). Le chargeur v3 fusionne et assainit (garde-fous existants).
- Pas d'UI d'import/export intégrée dans cette version (écart listé).

## Commandes et export
- Ouvrir : Godot **4.3 stable** → Importer → `project.godot` (dossier `godot/`) → F5 (scène principale `scenes/main.tscn`).
- Tests dev : `NV_TEST=n` (1,2,3,5,7,8) en variable d'environnement — n'affectent pas la progression du joueur.
- Export : presets fournis (`export_presets.cfg`, **sans clés ni keystores**) : « Windows Desktop » et « Android ». Installer d'abord les **export templates 4.3** (Editor → Manage Export Templates) ; Android : SDK + keystore personnel (champ à remplir). **Aucun export n'a été exécuté dans l'environnement de travail** (pas de templates ni SDK) — « preset fourni ≠ export réalisé ».

## Vérification de l'archive livrée
- Archive : `neo-vanguard-godot-v7.zip` (contenu identique au dossier `godot/` poussé sur la branche).
- Contrôles exécutés : création → **extraction complète** → présence de `project.godot` → `godot --headless --import` depuis le dossier extrait → `NV_TEST=1` et `NV_TEST=8` relancés **depuis l'extraction**. Résultats en fin de session (voir réponse d'accompagnement — l'archive n'est déclarée vérifiée que si ces deux tests passent).
- MD5 publié avec le lien Drive.

## Mise à jour du 25/10 (2e session) — ré-exécution et extension
Environnement réinstallé : Godot 4.3-stable (`4.3.stable.official.77dcf97d8`) + xvfb,
import `--headless --import` : **0 erreur**.

| Test | Résultat | Points clés |
|---|---|---|
| NV_TEST=1 (fumée) | VERT | titre, menu, 8 s de jeu, crédits 93500, max_level 24, bombe |
| NV_TEST=2 (écrans) | VERT | boutique/options/codes (kabrak77, BANQUE!) /records/commandes/histoire, S24→era5 |
| NV_TEST=5 (tickets) | VERT | NV-002/NV-001, anti-doublon NEOMELODIES, CAFAITFLIPPER→unlocks.pinball |
| NV_TEST=7 (module 20) | VERT | alert 0,85 s stéréo, 0 recette manquante, 28 ennemis ≥ 21, 14 kinds, sprites cuits |
| NV_TEST=8 (v6) | VERT | FM 31/31, achat+lecture boss-24 (PLAYING·STEREO), flipper playing, prologue art, sas hp 81,7/186 |
| **NV_TEST=9 (VORAX, nouveau)** | VERT | séquence complète : hands(2 mains, poings atlas)→tear→reveal(VORAX·CUIRASSÉ, réserve 23 213 PV)→morph 2/3→NÉCRO-RÉACTEUR→SINGULARITÉ→dead ; 6 captures `/tmp/shots9` |

### C. Comparatifs visuels (captures dans `apercu-godot/`)
- `4-pinball-table.png` : table de secours dessinée (parois = colliders exacts,
  rampes translucides, 3 bumpers, réacteur, batteurs, cibles, bille + ombre,
  lance-bille, afficheur) — comparaison avec le site impossible (binaires retirés
  par l'auteur, 404) : **comparaison source↔port non réalisable pour les PNG du
  flipper**, le repli est validé géométriquement contre le moteur.
- `1-hands.png` (poings dans le grand sas), `3-reveal.png` (révélation),
  `4-vorax.png` (combat échelle 1), `5-morph.png`, `6-fin.png` : séquence 24.
- Limites : les captures source du site web n'ont pas été rejouées côte à côte
  dans un navigateur pour cette session (pilote logiciel, pas d'audio réel).

### D. Sauvegardes web → native (rappel de la procédure)
localStorage `neovanguard.save.v3` (JSON) → copier le contenu dans
`user://neovanguard.save.v3.json` (Linux : `~/.local/share/godot/app_userdata/…`).
Aucune conversion nécessaire (mêmes clés), vérifiée par TEST2 (records/codes).

## Mise à jour — corrections des écarts (3e session)
| Test | Résultat | Contenu |
|---|---|---|
| NV_TEST=9 (machine) | VERT | séquence VORAX complète via la machine d'états (voraxTalk→hands→tear→reveal→vorax→dead) |
| **NV_TEST=10 (nouveau)** | VERT | i18n LDATA (en/ja/capitales), import sauvegarde web (4 clés), **manette injectée (dx=−208)**, machine nv24 : approach→arrive(y=300)→talk→sas→boom(battants t=1,3)→hall(porte2 −400→205)→alarm→voraxTalk→**hands(2 mains)** ; 3 captures |
| NV_TEST=1/2/5/7/8 | VERTS | non-régression après le grand patch |
| **Export Linux** | **RÉUSSI + LANCÉ** | `NeoVanguard-Linux.x86_64` 352 441 232 o, PCK embarqué, **TEST1 vert depuis le binaire exporté** |
| **Export Windows** | RÉUSSI | `NeoVanguard-Windows.exe` 370 581 408 o, PE32+ x86-64 (non exécutable sous Linux, consigné) |

Sauvegarde de test réinitialisée avant preuves (l'import TEST10 écrivait user://).
