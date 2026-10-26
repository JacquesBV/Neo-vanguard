# MATRICE DE PORTAGE — Neo-Vanguard (commit `ccd7e82`) → Godot 4.3

États : **CONFORME** (porté + testé + vérifié visuellement) · **PARTIEL** (porté, écarts listés) · **N/A** (hors périmètre de jeu) · **À PORTER**.
Les preuves « TESTn » sont les harnais `NV_TEST=n` (voir RAPPORT-TESTS.md) ; captures dans `apercu-godot/`.

## A. Modules du dépôt (`originaux/js/`, chargés par `index.html`)

| # | Module source | Équivalent Godot | État | Preuve / Écart |
|---|---|---|---|---|
| 01 | nv-warnings.js (avertissements santé/fiction) | `warning_screen.gd` (C6) | PORTÉ | 5 langues, affiché à chaque lancement, fermeture d'un geste ; + splash « APPUYEZ POUR ENTRER » (`splash_screen.gd`) et écran de chargement de secteur (`load_sector_screen.gd`, module 43) |
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
| 24 | fanboy-authentic | `ui/shell_layer.gd` + `assets/fanboy*` + options (contraste LCD, cadre PC) | CONFORME — FX controls du commit 51 portés | capture 9-comparaison, options traduites |
| 25/26/27 | options/title/shop reorg | `options_screen.gd`, `title_screen.gd`, `shop_screen.gd` | CONFORME (titre refait C6) | titre : affiche media-033, logo géant, sections JOUER/MULTIJOUEUR/HANGAR/RÉGLAGES, tuiles, chips+langue+ère, Coop/Crédits/Plein écran ; TEST2/13 |
| 28 | insert-coin-and-bonus | `game.gd` (crédits, bonus) + `main.gd` | CONFORME | TEST1/2 |
| 29 | **nv24-final-rework (secteur 24)** | `game.gd` (sas, couloir, radio, **vorax_update + rendu**), `nv24_audio.gd` | **PORTÉ (TEST9 vert)** | séquence complète : sas (60 PV×diff, ×1,5 en 2J, 9 fissures), boom→hall→alarme→**hands** (poings atlas `vorax-hands-atlas`, PV séparés, renforts, contact) → **tear** (battants arrachés animés `doors/airlock`) → **reveal** (marionnette `vorax-intro`, zoom .45→1) → **vorax** 3 formes (réserve unique ×.72, seuils 2/3 et 1/3, 7 attaques laser/laser2/sweep/palms/orbs/spiral/rain, tête ×1.7 / bras ×.55, radios v5/palm/morph en 5 langues) → mort. 8 défenseurs **FOE portés** (IA exacte, planche `defense-atlas.webp`, vagues APPROACH 18/HALL 10 aux timings exacts) — TEST10 vert |es` | `boss_atlas.gd` | CONFORME | captures boss |
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
| Tactile (zones, coque, lance-bille) | 22/24/51 | main.gd (capte racine) + game.gd + shell | CORRIGÉ | TEST12 7/7 : pilotage relatif 1:1, tir au doigt, bombe double-tap/2e doigt, barre KFM-01 câblée ; multitouch physique à confirmer sur appareil |
| Manette | — (non liée dans le commit) | actions Godot par défaut | À PORTER | mapping dédié à ajouter |
| Effets procéduraux (Canvas : explosions, greebles, dégradés, particules) | 02/07 | `game.gd`/`pocket_baker.gd` (ports des formules) | CONFORME | TEST7 (det/greeble hash `h2s`) |
| Scanlines/halos/modes fusion | 07/10 | `ui/scanlines.gd`, blend `add` sur parts | CONFORME | captures |
