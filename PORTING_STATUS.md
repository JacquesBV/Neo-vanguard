# PORTING STATUS — Neo-Vanguard → Godot

## Commit source de référence
- **Dépôt** : https://github.com/JacquesBV/Neo-vanguard (branche `main`)
- **Commit figé** : `ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057`
- **Date** : 2026-10-25T19:54:50Z — « Restore responsive touch and add useful FanBoy FX controls » (auteur JacquesBV)
- **Vérification** : les 1 087 blobs (454,3 Mo) ont été récupérés par `raw.githubusercontent.com` à ce commit ; **0 échec** (log « TELECHARGE=1087 ECHEC=0 »).
- **Site publié vs commit** : `https://jacquesbv.github.io/Neo-vanguard/` renvoie un `index.html` **identique** à celui du commit (33 035 octets, comparaison octet à octet). Le commit figé fait donc autorité et correspond au site en ligne.
- Intégrité : fichiers réels (tailles de l'arbre Git respectées), aucun pointeur LFS détecté dans l'arbre (aucun `oid sha256` dans les blobs).

## Version Godot
- **Godot 4.3 stable** (`Godot_v4.3-stable_linux.x86_64`, 4.3.stable.official.77dcf97d8) — moteur utilisé pour l'import, les tests et les captures. Compatible Windows/Android (GDScript pur, aucune extension native, aucun shader custom requis).
- Rendu : `gl_compatibility` (classe `mobile`) — adapté au contenu 2D, aux GPU mobiles et aux sandbox logiciel (llvmpipe) ; `project.godot` : 480×860 portrait, `canvas_items/stretch`.

## Branche de portage
- `port/godot-native` (créée depuis `main`, le portage vit dans `godot/`). `main` et le site publié ne sont pas modifiés.

## État global : **PORTAGE INCOMPLET** (progression vérifiable, écarts listés plus bas)
Le jeu complet est jouable dans Godot : titre, boutique, options, codes, tickets, 24 secteurs (8 ennemis module 20 + 6 mini-boss + 24 atlas de boss officiels), prologue/épilogue illustrés, briefings, FM (31 cassettes), flipper Néon Orbit, secteur 24 (sas + couloir + son officiel), mix audio 49. Les écarts restants sont listés dans « Écarts connus » et détaillés dans `MATRICE-PORTAGE.md` / `RAPPORT-TESTS.md`.

## Travail terminé (vérifié)
| Domaine | Équivalent Godot | Preuve |
|---|---|---|
| Moteur de jeu (02 : boucle, vagues, collisions, boss ATK24, économie, HUD, HD 480/360/860, save v3) | `scripts/game.gd`, `data.gd`, `save.gd`, `main.gd` | NV_TEST=1 vert (0 erreur) |
| 8 ennemis + 6 mini-boss du module 20, formations/pools, SIL + greebles | `game.gd` (match eid), `sprites/sil_data.gd`, `pocket_baker.gd` | NV_TEST=7 : 28 vivants, kinds complets, « sprites cuits=true » |
| 24 atlas de boss officiels (module 46/48) | `sprites/boss_atlas.gd` + `assets/sprites/bosses/` | captures 8-boss/9-boss-tir |
| Puce son exacte (21 recettes × 6 ères, WebAudio retranscrit) | `scripts/audio_chip.gd` + `audio2.gd` (chip-first) | NV_TEST=7 « recettes manquantes=0, stéréo=true » |
| Économie/boutique/options/codes/tickets 47 (grattage, révélation 65 %, codes ticket) | `shop_screen.gd`, `options_screen.gd`, `save.gd` (enter_code), `tickets.gd`, `ticket_view.gd` | NV_TEST=2/5 verts ; captures tickets |
| Prologue 9 pages / épilogue 5 pages (textes FR exacts + images officielles) | `ui/story_deck.gd` + `assets/story/` | capture 5-prologue ; TEST8 « art=true » |
| Briefings + boîte produit officielle (78_box_art) | `ui/brief_screen.gd` + `assets/story/box-*.jpg` | capture 5-brief |
| Neo-Vanguard FM module 30 (31 cassettes, prix, familles, achat, walkman, mp3) | `ui/fm_screen.gd` + `assets/music-shop/` | TEST8 : 31 cartes, achat, « PLAYING · STEREO » ; captures 1/2 |
| Flipper Néon Orbit (engine 668 l. + rendu/son 992 l.) | `scripts/pinball/pinball_engine.gd`, `ui/pinball_screen.gd`, `assets/pinball/` | TEST8 : table active ; capture 4 (plateau officiel, rails, score) |
| Secteur 24 — sas, couloir, pack son (module 29, partiel — voir écarts) | `game.gd` (sas/nv24_*), `nv24_audio.gd` + `assets/sector24/` | TEST8 : 16/16 échantillons, sas fissuré ; capture 6 |
| Mix 49 (duck voix −8 dB/−3 dB, tirs −4 dB, M coupe la voix) | `audio2.gd` | revu + importé, TEST1 sans erreur |
| Coque FanBoy (PC/mobile), scanlines, tickets graphiques T13 | `ui/shell_layer.gd`, `ui_kit.gd` (thème CSS exact) | capture 9-comparaison-fanboy |
| Miroir intégral du dépôt | `originaux/` (856 fichiers, 369 Mo, `.gdignore`) | inventaire zip |

## Tests exécutés et résultats
- `NV_TEST=1` (smoke : titre→jeu→boss→fin) : **VERT**, sortie sans erreur script ; le résidu « ObjectDB instances leaked » est l'artefact du **driver audio dummy du sandbox** (playback jamais mixé), documenté — ne pas traquer.
- `NV_TEST=2` (tous les écrans, codes, fin de campagne, 2 joueurs) : **VERT** (0 erreur).
- `NV_TEST=3` (11 captures visuelles 480×860) : **VERT** (0 erreur), captures dans `apercu-godot/`.
- `NV_TEST=5` (tickets : séries, grattage, codes NEOMELODIES/CAFAITFLIPPER) : **VERT**.
- `NV_TEST=7` (module 20 + puce son) : **VERT** (« recettes manquantes=0 », 28 ennemis, sprites cuits).
- `NV_TEST=8` (ajouts v6 : FM, flipper, deck, sas) : **VERT** (16/16 échantillons, 31 cassettes, lecture, table, art chargé).
- Import `godot --headless --import` : **0 Parse Error / 0 Failed to load**.
- Archive v6 vérifiée : 1 821 fichiers, extraction + lancement depuis dossier extrait (voir RAPPORT-TESTS pour v7).
- Validation visuelle : captures Godot comparées au rendu attendu de la source (situations reproduites : titre, boutique, jeu ères 0/2/5, boss, briefing, prologue, flipper, FM, sas).
- Validation audio : écoute impossible dans le sandbox (driver dummy) — validation **programmatique** (recettes rendues, fichiers présents, durées, boucle configurée). Écoute effective restante (écart D).

## Problèmes rencontrés
- ImageTexture créée chaque frame (rails du flipper) → blanc sous GL compat : corrigé (texture construite une fois).
- `unlocks[key]` stocke `{code, at}` : tests d'état par **présence de clé**, pas par valeur booléenne.
- Noms d'assets préfixés (`02_plateau_statique.png`…) : chemins corrigés.
- `.gdignore` sur `originaux/` pour éviter un import Godot de 900 fichiers hétérogènes (mp3/webm/js).

## Écarts connus (aucun dissimulé)
1. **Module 29 — secteur 24 partiel** : sas destructible (60 PV, 9 fissures), couloir défilant, 16 échantillons, radio VESTA portés ; **non portés** : les mains de VORAX (barre de vie partagée), les 3 formes (cuirassé/nécro-réacteur/singularité) et leurs patterns dédiés, les rayons croisés des paumes. Le boss final reste le boss du moteur (atlas 24 officiel + ATK24) précédé du sas jouable.
2. **Langues** : le site original est multilingue (fr/en/es/pt/ja, `tx()`). Le port affiche les **textes français** (contenu FR exact extrait du commit) ; l'option de langue n'est pas fonctionnelle.
3. **Code COMEBACK** : **absent du commit de référence** (aucune occurrence) — rien à reproduire ; KAMIKAZE/CAFAITFLIPPER/NEOMELODIES portés avec leurs comportements (toggle, ticket, messages de re-saisie).
4. **Engagements du dernier commit** (« FanBoy FX controls ») : les contrôles FX ajoutés au commit figé ne sont pas reproduits (la coque FanBoy l'est, pas ces réglages ajoutés).
5. **Exports** : `export_presets.cfg` fourni (Windows + Android, sans secrets) ; **aucun export exécuté** (pas d'export templates ni SDK Android dans l'environnement). « Preset fourni ≠ export réalisé ».
6. **Manette & multitouch** : clavier/souris/tactile-souris validés ; mapping manette dédié et multitouch réel sur appareil **non testés** (pas d'appareil).
7. **Sauvegarde web→native** : accès direct au localStorage impossible depuis une app native ; procédure manuelle documentée dans RAPPORT-TESTS (copie du JSON vers `user://`).
8. **Audio « à l'oreille »** : correspondances validées programmatiquement (fichiers, durées, boucles) ; écoute humaine restante.

## Fichiers concernés
`godot/` (projet) : `project.godot`, `export_presets.cfg`, `scripts/**` (33), `assets/**` (192 Mo), `originaux/**` (miroir), `README-GODOT.md`, `MATRICE-PORTAGE.md`, `RAPPORT-TESTS.md`, ce fichier.

## Prochaine action concrète
Porter la suite du module 29 : machine à états `nv24` (arrive→talk→sas→boom→hall→alarm→hands→tear→reveal→vorax), mains de VORAX (atlas `vorax-hands-atlas`, barre partagée), les 3 formes et leurs patterns, puis langues (tables `tx()` × 5) et essai d'export Windows réel sur machine avec templates.
