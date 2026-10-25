# MATRICE DE PORTAGE — Neo-Vanguard (commit `ccd7e82`) → Godot 4.3

États : **CONFORME** (porté + testé + vérifié visuellement) · **PARTIEL** (porté, écarts listés) · **N/A** (hors périmètre de jeu) · **À PORTER**.
Les preuves « TESTn » sont les harnais `NV_TEST=n` (voir RAPPORT-TESTS.md) ; captures dans `apercu-godot/`.

## A. Modules du dépôt (`originaux/js/`, chargés par `index.html`)

| # | Module source | Équivalent Godot | État | Preuve / Écart |
|---|---|---|---|---|
| 01 | nv-warnings.js (avis hôte) | — | N/A | texte d'hébergement, pas du jeu |
| 02 | moteur-jeu.js (cœur : boucle, ennemis, boss, économie, HUD, story deck, briefings, save, i18n, narration procédurale) | `game.gd`, `data.gd`, `save.gd`, `main.gd`, `sheets.gd` | PARTIEL | CONFORME pour gameplay/vagues/boss/HUD/économie/save v3/deck FR ; **écart** : i18n (FR seul), narration procédurale temps réel (`srand`/`spMotes`) remplacée par les images officielles prévues par le jeu (STORY_IMG), TTS FR système |
| 03/04/05/50 | cloudflare-1..4 (anti-bot) | — | N/A | infrastructure d'hébergement |
| 06 | cinematic-game-pass | `ui/story_deck.gd` | CONFORME | cadrage cover, travelling 1,04→1,10, vignette, scanlines, cadre à coins ; TEST8 |
| 07 | ultimate-render-pass | `game.gd` `_draw` (calques ordonnés) | CONFORME | comparaisons ères 0/2/5 |
| 08 | generation16-boss-art | `sprites/boss_atlas.gd` | CONFORME | atlas officiels 1-24 |
| 09 | performance-rewards | `game.gd` (bonus fin de vague, `HARVEST`) | CONFORME | TEST1/TEST3 |
| 10 | painted-generation-backdrops | `game.gd` `_build_decor` | CONFORME | captures 10/11 |
| 11 | profils-machines | qualitatif dans `main.gd` (smooth/scanlines) | PARTIEL | profils qualité par appareil non reproduits (pas d'UA natif) ; options manuelles conservées |
| 12 | lumiere-auto | `game.gd` (glows par ère) | CONFORME | captures |
| 13 | tier-lancement | `data.gd` (diffs, tiers) | CONFORME | TEST2 options |
| 14/16/17 | silo-guardian art/deluxe/v3 | `sprites/guardian_sprite.gd`, `game.gd` mini-boss mGuardian | CONFORME | TEST7 (mini-boss ère 0) |
| 15 | level1-hazard-cleanup | `game.gd` (garde `era_idx==0 and level==1`) | CONFORME | port du garde tel quel |
| 18 | bastion4-deluxe | `game.gd` + atlas 2 | CONFORME | mForeman TEST7 |
| 19 | sentin2-transformation | `game.gd` (split/transformation) | CONFORME | TEST7 |
| 20 | vorax-eyebeams-and-shattered-alert | `game.gd` (beams, alerte rouge, TH.e_main→e_boss era≥1) | CONFORME | TEST7 dédié + capture test7 |
| 21 | alert-redesign | `game.gd` `Phase.BOSS_WARN` | CONFORME | capture sas (variante 24) |
| 22 | sector-phone-profiles | `shell_layer.gd` (coque mobile, tactile) | PARTIEL | coque FanBoy conforme (T11/T13) ; profils par modèle de téléphone non reproduits |
| 23 | no-horizontal-drift | `game.gd` (mouvement) | CONFORME | TEST1 |
| 24 | fanboy-authentic | `ui/shell_layer.gd` + `assets/fanboy*` | CONFORME | capture 9-comparaison |
| 25/26/27 | options/title/shop reorg | `options_screen.gd`, `title_screen.gd`, `shop_screen.gd` | CONFORME | ordre des menus conforme, TEST2 |
| 28 | insert-coin-and-bonus | `game.gd` (crédits, bonus) + `main.gd` | CONFORME | TEST1/2 |
| 29 | **nv24-final-rework (secteur 24)** | `game.gd` (sas, couloir, radio), `nv24_audio.gd` | **PARTIEL** | porté : sas (60 PV×diff, ×1,5 en 2J, 9 fissures `makeDoor`), couloir `corridor-tile` ×0,6, art sas `airlock`, 16/16 échantillons `packSnd`, repli synthé, radio VESTA+voix, enchaînement boom→boss. **À porter** : états `hands/tear/reveal/vorax` (mains atlas, barre partagée), 3 formes + patterns (yeux→rayons, paumes croisées, singularité), multijoueur ×1,4 des FOE |
| 30 + 31 + 37 + 38 + 41 | FM (boutique, relook, étiquettes, meuble, deck/walkman) | `ui/fm_screen.gd` + `assets/music-shop/` | CONFORME | catalogue JSON exact (31 titres, prix 80–335), familles/ères, cases→open, filtres, achat CR, lecture mp3, sfx dédicacés ; TEST8 |
| 32 | lcd-calm | `shell_layer.gd` (LCD sobre) | CONFORME | coque T11 |
| 33 | ship-sheets | `sheets.gd` | CONFORME | sprites vaisseaux |
| 34 | ship-native | `sheets.gd` (r0-*.png natifs) | CONFORME | sélection boutique |
| 35/36 | pause-btn / title-mute | `main.gd` (pause), `audio2.gd` (`set_muted`, M) | CONFORME | TEST2 |
| 39 | homing-sprite | `game.gd` (missiles tête chercheuse) | CONFORME | TEST7 |
| 40 | voice-gender | `audio2.gd` `speak()` (voix système) | PARTIEL | genre de voix VESTA non sélectif (TTS système FR) |
| 42 | help-js | `ui/help_screen.gd` | CONFORME | TEST2 |
| 43 | fluid-js (rendu web) | — | N/A | technique de rendu navigateur, natif sans objet |
| 44 | progress-map | `help_screen.gd` (carte de progression) | CONFORME | capture 3-help |
| 45 | brief-art | `brief_screen.gd` + `assets/ui-art/briefings` | CONFORME | capture 5-brief |
| 46/48 | boss-sprites / big-sprites | `boss_atlas.gd` (cuisson taille réelle) | CONFORME | TEST7 |
| 47 | tickets | `tickets.gd`, `ui/ticket_view.gd` | CONFORME | TEST5 (séries NV-001/NV-002, 65 %, codes) |
| 49 | nv-mix | `audio2.gd` (duck, gains) | CONFORME | valeurs .40/.70/.63/1.00 appliquées |
| 51 | fanboy-reference | `ui/shell_layer.gd` | PARTIEL | coque conforme ; contrôles FX ajoutés par le commit figé non reproduits |

## B. Contenu & ressources

| Élément | Emplacement source | Équivalent Godot | État | Preuve / Écart |
|---|---|---|---|---|
| 24 secteurs, 6 ères, phases (intro/vagues/warning/boss/récolte) | 02 | `game.gd`, `data.gd` | CONFORME | TEST1/3 |
| 8 ennemis mod. 20 + 6 mini-boss + roster de base | 02 (l.12851+) | `game.gd` + `sil_data.gd` + `pocket_baker.gd` | CONFORME | TEST7 |
| 24 boss + atlas officiels | 46/48 + `assets/bosses` | `boss_atlas.gd` | CONFORME | captures boss |
| Musiques de jeu (mp3 ères/boss/fin) | `assets/music` (40) | `audio2.gd` | CONFORME | fichiers, boucles, transitions |
| FM : 31 mp3 + jaquettes + sfx + walkman | `assets/music-shop` (156) | `fm_screen.gd` | CONFORME | TEST8, contrôle par cassette (lecture, durée, pas de 0:00 bloqué) |
| Flipper : table, 19 wav, musique 32 s | `assets/pinball` (26) | `pinball/`, `pinball_screen.gd` | CONFORME | TEST8, capture |
| Cinématique : 14 images story + 6 boîtes + intro VORAX | `assets/media` | `assets/story/` (20 f) | CONFORME | capture prologue/brief |
| Secteur 24 : 26 wav + 26 ogg + airlock + corridor | `assets/sector24`, `level24-v2` | idem (sous-dossiers wav/ogg conservés) | CONFORME | TEST8 16/16 |
| Prologue/épilogue textes (72+40 clés FR) | 02 l.14278+ | constants `story_deck.gd` | CONFORME | textes extraits du commit |
| Briefings 24 secteurs (br.x) | 02 | `brief_screen.gd` (art officiel) | CONFORME | capture |
| Codes secrets | 02 l.1719+ (`KAMIKAZE`…), 47 (`CAFAITFLIPPER`, `NEOMELODIES`) | `data.gd` CHEATS, `tickets.gd`, `save.gd.enter_code` | CONFORME | TEST2/5 ; **COMEBACK absent du commit** |
| Save v3 (crédits, achats, sel, opts, cheats, tickets, unlocks, musicTracks, records, daily, pinball) | 02 (localStorage) | `save.gd` (user://neovanguard.save.v3.json) | CONFORME | TEST2/5 ; **transfert web→native : procédure manuelle** (voir rapport) |
| Langues fr/en/es/pt/ja | 02 `tx()` | textes FR intégrés | PARTIEL | FR exact ; autres langues À PORTER |
| Touches PC (flèches, ZQSD/WASD P2, Ctrl/F/L/G/K, Échap, M) | 02 l.158xx + 22 | `main.gd`/`game.gd` input | CONFORME | TEST2 (P2 ZQSD) |
| Tactile (zones, coque, lance-bille) | 22/24/51 | shell + `_gui_input` flipper | PARTIEL | souris-tactile validé ; multitouch réel sur appareil non testé |
| Manette | — (non liée dans le commit) | actions Godot par défaut | À PORTER | mapping dédié à ajouter |
| Effets procéduraux (Canvas : explosions, greebles, dégradés, particules) | 02/07 | `game.gd`/`pocket_baker.gd` (ports des formules) | CONFORME | TEST7 (det/greeble hash `h2s`) |
| Scanlines/halos/modes fusion | 07/10 | `ui/scanlines.gd`, blend `add` sur parts | CONFORME | captures |
