# NEO VANGUARD — Portage Godot 4 · Guide complet

Portage du jeu original **Neo-vanguard** (JavaScript/Canvas, dépôt
`JacquesBV/Neo-vanguard`) vers **Godot 4.3+**, avec les valeurs de gameplay
**exactes** du moteur d'origine.

> ✅ **Déjà jouable de bout en bout** : titre → campagne 24 secteurs → vagues,
> alerte amirale, 24 boss (attaques d'origine), récolte, boutique persistante,
> codes de triche, records, défi du jour, 2 joueurs, fin de campagne.
> Les 37 musiques MP3 d'origine sont incluses, ainsi que des effets chiptune
> régénérés dans l'esprit WebAudio du jeu.

---

## État de la livraison (25 octobre 2026)
Portage complet + **présentation FanBoy KFM-01 fidèle au jeu mobile d'origine** :
monde 4:3 (480×360) dans le verre de la console, encres LCD sauge/olive officielles,
coque olive à menton clair (LED à halo, KFM-01/DOT DISPLAY, FANBOY dot-matrix),
barre de commandes tactile à liserés jaune-vert, HUD pixel segmenté, boot console,
chunks du silo (galerie, sas, cuve, rouage, char, panneaux FROLE LES), briques 128×64,
silhouettes SIL (27 acteurs, baker Bayer 4 tons), coques natives r0 quantifiées,
**atlas officiels des 24 boss** (`boss-01.webp`…`boss-24.webp`) avec META, poses,
kbOf et quantification « coupes sèches ». Détails dans les sections qui suivent.

---

## 1. Installation et lancement (5 minutes)

1. Installe **Godot 4.3** (ou plus récent) : https://godotengine.org/download
   — la version « standard » suffit (rendu GL Compatibility, léger).
2. Ouvre Godot → **Importer** → sélectionne le dossier de ce projet
   (celui qui contient `project.godot`).
3. Attends la fin de l'import (les 37 MP3 + WAV sont analysés une fois).
4. Appuie sur **▶ F5** (ou « Lancer le projet »).

Aucune dépendance externe. Aucun plugin. Tout est en GDScript.

### Exporter le jeu
- **Projet → Exporter…** → ajoute une préréglage :
  - `Windows Desktop`, `Linux`, `macOS`, `Android`, ou **`Web`** (HTML5).
- Pour le Web : active aussi « Extentions Threads » selon ton hébergeur,
  puis dépose le dossier d'export sur GitHub Pages **exactement comme
  l'original** (le jeu remplace `index.html` par `index.html` généré).

---

## 2. Structure du projet et correspondance avec le JS d'origine

| Fichier Godot | Équivalent dans le jeu original | Rôle |
|---|---|---|
| `project.godot` | `index.html` + CSS | fenêtre 480×860 portrait, entrées, rendu GL |
| `scripts/data.gd` | constantes de `02-moteur-jeu.js` | **toutes** les tables : ères, vaisseaux, armes, équipements, livrées, traînées, auras, habillages de tirs, difficultés, codes, ennemis, boss, 24 jeux d'attaques |
| `scripts/save.gd` | `defaultSave()` + `localStorage` | sauvegarde JSON `user://neovanguard.save.v3.json`, même structure, migration/fusion profonde, `computeStats()` et `eScale()` **identiques** |
| `scripts/audio2.gd` | `Audio2` du JS | musiques `era0..5`, `boss0..23`, `boss24-vorax`, `title`, `shop`, `story`, `ending` + SFX + voix TTS (`speak()`) |
| `scripts/game.gd` | le cœur de `02-moteur-jeu.js` | joueur, armes, drones, ennemis, tirs, boss + 24 jeux d'attaques, récolte, butin, bombes, combo, graze, particules, HUD, bannières |
| `scripts/main.gd` | machine à écrans du JS | SubViewport façon console, navigation, `bankRun()`, classement, défi du jour, pause, fin de campagne |
| `scripts/ui/*.gd` | écrans DOM du JS | titre, boîte de secteur (brief), boutique, options, codes, records, commandes, histoire, game over |
| `assets/music/` | `music/*.mp3` du dépôt | les 37 morceaux d'origine, copiés tels quels |
| `assets/sfx/` | synthé WebAudio du JS | 16 effets WAV chiptune régénérés (`tools/gen_sfx.py`) |
| `assets/sprites/ships-anim/` | `assets/ships-anim/` du dépôt | **les planches officielles** : 7 vaisseaux × 6 ères, 8 frames × 6 rangées (idle, inclinaisons, boost, touché, explosion) |
| `scripts/sheets.gd` | `33-nv-ship-sheets.js` | chargeur des planches : mêmes tailles par ère (42→166 px), mêmes seuils de pose (bank ±0.22/±0.6, boost vy<-60) |
| `scripts/ui/scanlines.gd` | options CRT du JS | l'écran à balayage, désactivable dans les Options |
| `tools/gen_sfx.py` | — | régénère les SFX (`python3 tools/gen_sfx.py`) |

### La direction artistique (calée sur les captures officielles du dépôt)
- **Secteurs 1 à 3 — FanBoy** : écran LCD monochrome **vert sauge**, plaques de circuits
  à pistes et pastilles défilantes, ennemis et vaisseau en **silhouettes vert
  foncé**, logés dans la console interactive animée `scenes/FanBoy.tscn` (`scripts/fanboy.gd`).
- **Ères 8/16 bits** : fond bleu profond, plateformes-charpentes à lumières.
- **HD** : planète géante annelée façon « HD ANIMÉ » + nébuleuses.
- Références utilisées : `pack-graphique-4-eres.png`, `comparatif-decor.png`,
  `boites-3d.png` (à la racine du dépôt GitHub du jeu).

### L'astuce « six consoles » (le cœur de l'identité du jeu)
L'original peint chaque ère dans un buffer basse résolution puis l'agrandit
en pixels carrés (`ERAS[i].S`). Le portage fait **la même chose** avec un
`SubViewport` :

```
Root (repère logique 480×860)
├── TextureRect (affichage, filtre NEAREST, taille logique 480×860)
│     └── texture du SubViewport (taille 480×K × 860×K)
│           └── Game (Node2D, échelle K, dessine en coordonnées logiques 480×860)
└── HudOverlay (Node2D pleine résolution : score, vies, boss, combo)
      → comme le HUD HTML du jeu d'origine, il reste NET même en ère Pocket
```

`K` par ère = valeurs exactes du JS : `0.25, 1/3, 0.5, 0.62, 0.74, 1.0`.
L'ère 0 (Pocket) impose en plus ses **4 teintes** (palette de la livrée),
comme l'original. Le changement d'ère se fait dans `main._apply_era_viewport()`.

---

## 3. Ce qui est reproduit à l'identique (valeurs exactes)

### Physique & armes du joueur
- Vitesse de base **464 px/s** × multiplicateur du vaisseau × (+6 %/niveau de Réacteur).
- Zone de jeu 480×860, joueur bloqué à `x ∈ [32, 448]`, `y ∈ [76, 818]`.
- Inertie : `v = lerp(v, direction×vitesse, dt×12)` ; inclinaison `bank`.
- 6 armes avec leurs patterns exacts (Pulse 1→3→4 obus, Spread 2+n, Laser,
  Plasma zone, Railgun perforant, Missiles guidés `turnRate 4.8`).
- Cadences exactes : `pulse 0.115, spread 0.20, laser 0.155, plasma 0.34, rail 0.44, homing 0.42` ÷ multiplicateur.
- Puissance 1→5, drones orbitaux, bouclier régénérant toutes les 22 s,
  aimant 92 px (+45 %/niveau), bombe intelligente `90 + lvEq×40` dégâts (×2.2 sur boss).

### Ennemis (11 types, hp/rayon/score/coins/mouvements/tirs identiques)
`drone, stinger, turret, runner, shielder (garde rotative), splitter (division),
swarmlet, carrier (libère des essaims), elite, mine (couronne à la mort), sniper`
— avec les 6 mouvements (`dive, zig, hover, diag, patrol, charge`) et la
formule d'équilibrage `eScale()` exacte (`hp × diff × (1+(lvEq−1)×0.42)`, etc.).

### Vagues & déroulé de secteur (plan exact)
- Mêmes instants de vagues (2.5 s → 53 s, + vagues arcade dès le secteur 4),
  mêmes formations (`formV`, `formStream`, `formLine`, `formSides`, `formArc`),
  même pool d'ennemis par ère, élites à 25 s et 64 s.
- Phases : `intro → waves → bossWarn (3.6 s) → boss → harvest (6.4 s) → clear`.
- Bonus de secteur : `(150 + niveau×40) × difficulté × négoce + 40 (sans mort)`.

### Les 24 boss
- Répartition exacte `BOSS_OF_LEVEL` : Gardien du Silo (S1), Bastion-4 (S2),
  Sentinelle-2 (S3), Warden-7 (S4)… **VORAX (S24)**.
- PV : `base × eScale × 2.6` ; phases à 66 %/33 % ; cadence accélérée ×0.86/×0.72.
- Les **24 jeux d'attaques** du JS sont encodés dans `Data.ATK24` :
  anneaux, spirales, murs (couloir sur le joueur au secteur 12 !), pluies,
  croix, missiles à tête chercheuse, pièces, billes rebondissantes, grilles,
  rayons balayants, lâchers d'ennemis, salves…
- OMEGA-VECTOR/NÉON-PRÊTRE : téléportation. HYDRA/VORAX : 3 parties orbitales
  à détruire (dégâts ×3.2, corps protégé à 25 % tant que des parties vivent).
- Plafond de 26 tirs + ralentissement ×0.78 au secteur 12 (lisible).
- Mort du boss : explosion lente 2.6 s, puis **la Récolte** : les tirs ennemis
  deviennent des bonus, aimant géant, rien n'est perdu, puis secteur suivant.

### Économie & méta
- 7 vaisseaux, 6 armes, 10 équipements (formule de prix `prix×(1+niv×0.75)`),
  7 livrées, 4 traînées, 5 auras, 5 habillages de tirs.
- Butin : chance exacte `0.16 + télémétrie×0.075 (+0.55 gros ennemi)`, pool
  identique, matériaux (ferraille/cristal/circuit).
- Sauvegarde JSON miroir du `localStorage` (500 crédits de départ, achats
  permanents, sélection vérifiée, records, top 5, défi du jour 1 essai/jour).
- **Les 10 codes de triche** fonctionnent : `kabrak77`, `invincible`,
  `maxpower`, `overdrive`, `matrix`, `banque`, `sesame`, `saut`, `CAFAITFLIPPER`,
  `KAMIKAZE` (menu Codes avec indices, activation/désactivation).

---

## 4. Comment ça marche en détail (pour modifier sereinement)

### Boucle de jeu (`game.gd`)
- `_process(delta)` : applique le ralenti (`slow_f` pour la bombe/code MATRIX),
  avance la machine à états `Phase.*`, puis met à jour les tableaux
  d'entités — **exactement comme les fonctions `update*()` du JS** (les
  entités sont des `Dictionary`, pas des nœuds : c'est le choix du JS
  d'origine, très performant).
- `_draw()` : peint tout dans l'ordre du canvas d'origine : fond → étoiles →
  caisses → butin → tirs ennemis → ennemis → rayons → boss → joueur → tirs →
  particules → anneaux de choc → textes flottants → HUD → bannières → flash.
- Les couleurs viennent de `TH` (thème d'ère) : mêmes palettes `PAL1..PAL4`,
  `UIACC`, et palette Pocket de la livrée en ère 0.

### Ajouter un contenu simple
- **Un ennemi** : une entrée dans `Data.ETYPES` + une couleur dans
  `Data.ETHEME` + un cas de silhouette dans `game._draw_enemies()`.
- **Une attaque de boss** : un dictionnaire `{ "cd":…, "kind":…, "args":[…] }`
  dans `Data.ATK24`, plus un cas dans `game._boss_attack()`.
- **Un vaisseau** : une entrée dans `Data.SHIPS` (+ perks dans
  `Save.compute_stats`). Rien d'autre.
- **Un code de triche** : une entrée dans `Data.CHEATS`, gestion dans
  `Save.enter_code()`/`apply_cheat_action()` et dans le jeu (`Save.cheat_on()`).

---

## 5. Ce qui reste à porter (et comment faire)

Le jeu original fait ~32 000 lignes ; ce portage couvre **tout le cœur**.
Les modules d'habillage restants, par ordre de valeur :

1. **Sprites peints par ère** (`33-nv-ship-sheets`, `46-nv-boss-sprites`,
   `48-nv-big-sprites`) : l'original peint les vaisseaux/boss au canvas.
   En Godot : rends chaque sprite en PNG une fois (ou capture-les du jeu
   web), dépose-les dans `assets/sprites/` et remplace `_draw_players()` /
   `_draw_boss()` par `draw_texture_rect_region()` — les animations de bank
   restent gérées par `P.bank`.
2. **Boîtes de jeu 3D du brief** (`29-nv24-final-rework`, section CATALOGUE) :
   le brief affiche la cartouche/Disc en 3D orthographique. En Godot : une
   petite scène 3D (`MeshInstance3D` + caméra orthogonale, yaw −0.44,
   pitch 0.24 — les valeurs sont dans le JS) affichée dans un `SubViewport`
   sur l'écran de brief.
3. **Flipper Néon Orbit** (`pinball/`) : module autonome — un moteur de
   billard à importer en GDScript (ou garde-le en page Web et lance-le via
   un bouton).
4. **Coop en ligne** : l'original passe par un relais public (WebSocket).
   En Godot : `WebSocketPeer` côté joueurs + un petit serveur relais
   (Node/Python hébergé), en répliquant à 20 Hz les positions
   (`netSend`/`netHook*` du JS donnent le protocole).
5. **Neo-Vanguard FM complet** (`30/31/37/38`) : jukebox à cassettes. La
   base est là (`Audio2.play_track`) ; ajoute l'écran d'achat de cassettes
   (crédits → tracks) et le visuel du deck.
6. **Médailles, fantômes, profils téléphone, records avancés** : ce sont des
   surcouches de la sauvegarde (`Save.S.medals`, `daily`, `board` existent
   déjà — il reste les écrans).

> Méthode générale : pour chaque module `NN-nv-*.js`, isole ses **données**
> (constantes) → `data.gd`, ses **effets de jeu** → `game.gd`, ses **écrans**
> → `scripts/ui/`. Le découpage du JS d'origine suit déjà ces frontières.

---

## 6. Différences assumées (et pourquoi)

- **Sprites** : le joueur vole avec les **planches officielles** du dépôt
  (7 coques × 6 générations, poses d'inclinaison/boost/explosion identiques).
  Ennemis et boss sont redessinés en vectoriel dans les palettes d'ère —
  enrichissables avec les assets du dépôt au fil de l'eau (§5.1).
- **Écran et confort** : HUD pleine résolution au-dessus du champ rétro
  (comme le HUD HTML d'origine), scanlines CRT, compteur FPS, lissage des
  pixels : tout se règle dans **Options**. Les boîtes de secteur sont peintes
  (jaquette aux couleurs de la console, cartouche/disque, code-barres).
- **Boîte de secteur** : version « jaquette texte » (3,4 s, passable au tir)
  au lieu de la boîte 3D — voir §5.2.
- **Langues** : interface française (l'original a FR/EN/ES/PT/JA) ; la table
  `LDATA` du JS peut être portée telle quelle si besoin.
- **Flipper & coop en ligne** : non inclus (modules entiers séparés, §5.3/5.4).

---

## 7. Commandes de jeu

| Action | Clavier | Souris | Manette |
|---|---|---|---|
| Piloter | Flèches / ZQSD / WASD | le vaisseau suit le curseur (clic gauche maintenu) | stick gauche |
| Tir | Espace / Entrée | clic gauche | A / RT |
| Précision | Maj | — | — |
| Bombe | G | clic droit | B / LT |
| Changer d'arme | X | — | RB |
| Pause | Échap / P | — | Start |

2 joueurs : P1 flèches+Espace+G · P2 I/J/K/L + F (tir) + G (bombe).
Défi du jour : une tentative par jour, mods tirés de la date.

---

## 8. Arborescence complète

```
neo-vanguard-godot/
├── project.godot            configuration (entrées, fenêtre, autoloads)
├── icon.svg
├── scenes/Main.tscn         scène racine
├── scripts/
│   ├── data.gd              autoload Data — toutes les tables du jeu
│   ├── save.gd              autoload Save — sauvegarde + stats
│   ├── audio2.gd            autoload Audio2 — musiques + SFX + voix
│   ├── main.gd              orchestrateur + tests intégrés (NV_TEST=1..4)
│   ├── game.gd              le moteur de jeu complet
│   └── ui/                  les 10 écrans (dont hud_overlay.gd)
├── assets/
│   ├── music/               37 MP3 d'origine
│   └── sfx/                 16 WAV chiptune
└── tools/gen_sfx.py         régénération des SFX
```

### Tests intégrés
```bash
# test de mission complète (vagues → boss → récolte → secteur suivant)
NV_TEST=1 godot --headless
# test des écrans + codes + fin de campagne + 2 joueurs
NV_TEST=2 godot --headless
# test visuel : capture le titre, le brief, le jeu et le boss en PNG
NV_TEST=3 NV_SHOT=/tmp/shots godot   # (dans une session graphique ou xvfb)
```
Les deux se terminent par « TERMINÉ » sans `SCRIPT ERROR`.

---

*Portage réalisé depuis le dépôt `JacquesBV/Neo-vanguard` (moteur JS original :
`js/02-moteur-jeu.js` et modules `01`–`51`). Toutes les valeurs numériques de
gameplay citées dans ce fichier sont celles du code d'origine.*

## Présentation FanBoy (secteur 1) — réplique de la console KFM-01
- **Coque dessinée** dans `hud_overlay.gd` (`_draw_bezel`) : plastique gris `#c9ccd2`, étiquette « KFM-01 / DOT DISPLAY », LED POWER rouge pulsante, logo « F A N B O Y », flèches et ouïes — autour d'un écran encadré d'une feuillure sombre.
- **LCD pâle** : trois voiles translucides désaturent toute la scène de l'ère 0 (le vert saturé d'origine est lavé, comme sur la vraie console).
- **HUD pixel DANS l'écran** (`_draw_hud_lcd`) : `SC / VIES ×n / COINS`, jauge `COQUE %`, barre de l'amiral, `PWR/ARME` et `BOMBES` — encre GB dans l'écran, sous la coque.
- **Décor** (`game.gd`, cas 0) : mur de briques plein écran (64×36, joints `[2]`), enseigne « SECTEUR n » en filigrane, colonnes sombres à fenêtres pointillées — comme la capture mobile d'origine.
- **Boot console** : à l'intro du secteur 1, « NEO VANGUARD » descend vers 44 % de hauteur puis « 24 SECTEURS · 6 GÉNÉRATIONS » apparaît.
- Palette par défaut **GB4 authentique** `#0F2E1C / #2f5c27 / #6f8a1f / #a3ad35` (js/02 l.5413).

## Console FanBoy animée — Monde 1 (secteurs 1, 2 et 3 inclus)
Architecture intégrée depuis le pack Godot officiel (`scenes/FanBoy.tscn`, `scripts/fanboy.gd`, `scripts/led.gdshader`, `assets/layers/*.png`, `assets/audio/*.wav`) :
- **Écran LCD portrait** (`620×890` sur le gabarit `937×1679`, champ logique `480×689`) encastré sous la découpe alpha de `shell.png` (`GameViewport`) pour les **secteurs 1, 2 et 3** ; dès le **secteur 4** (*FanBoy Adventure*), le jeu bascule en `480×860` plein écran.
- **Encres LCD officielles** (`Data.INKS`) : fond sauge `#9ea483`, structures olive `#2f3329/#595c4c/#7d8267`.
- **Commandes matérielles animées** : stick analogique 360° (`stick.png`, course 17 px, retour ressort 0,12 s), bouton **A** rouge (`a.png`, tir), bouton **B** doré (`b.png`, bombe), **SELECT** (`select.png`, pause gel), **START** (`start.png`, menu pause), interrupteur vertical **ON/OFF** (`power.png` + `led.png`), bruitages mécaniques 12 voix (`assets/audio/*.wav`).
- **Jauges & éclairage dynamique** : jauges **COQUE** (8 cellules) et **BOSS** (30 cellules) en cyan `#72b9e8`, compteurs **VIES** et **BOMBES** dans les fenêtres de façade, et rails lumineux `threat_lights.png` (`led.gdshader`) pilotés par la menace réelle (`#48e4a1` calme, `#ffae32` attention, `#ff343a` critique).

## Sprites & décor du silo (secteur 1) — calqués sur le moteur
- **Chunks du décor** (`_draw_chunk` dans `game.gd`) : `galerie` (mur encre profonde + briquettes 12×12 claires, points blancs au pas de 56), `sas` (bevel + bandes hazard + rivets), `cuve` (bevel + niveau flottant blanc), `megatour` (fenêtres 5×4 au pas 9/26 + mât + gyrophare), `anneau` (double anneau à rayons tournants), `plateforme` (LED + tapis roulant défilant), `paroi`, `rouage` (la grande roue dentée du silo), `panneau` (« FROLE LES » / « KODAMA »…), `char` (blindé à chenilles).
- Ombres portées sombres (+9,+15) sous chaque mobilier, comme `decorBlit` de l'original.
- **Sol en briques 128×64** (le double des naïves 64×32), joints `[1]` à 62 % d'alpha, défilement 0,45× ; mobilier à 0,70×.
- **Gravures Pocket** sur les ennemis (`addPocketEnemyDetail`) : verrière, arête longitudinale, plaques latérales — en encres `[1]`/`[2]`.
- **Quantification nearest-luminance** des sprites du vaisseau sur les 4 encres (reprise exacte d'`applyGameBoyPalette` du module 51) : coques claires, contours sombres.
- **Polarité positive** : boss et grosses machines en encres claires (`e_boss=[2]`, `e_boss_lite=[3]`), petits chasseurs sombres.

## Zéro écart sprites — port intégral des générateurs du moteur
- **`scripts/sprites/sil_data.gd`** : les **27 silhouettes SIL** du moteur (l.4370-5130) extraites telles quelles — 319 pièces à points normalisés, matières MAT (HULL/WING/CANOPY/ENGINE/ACCENT/DARK/GLOW…), ère minimale. Y compris `bTurret/bArm/bHead/bPod/bRingBar` (pièces de boss), `crate/barrel/pod/pickupBox` (objets) et les 7 vaisseaux.
- **`scripts/sprites/pocket_baker.gd`** : la transposition de `bakeSprite`+`rasterize` : rasterisation polygone→pixel, dilatation 8 bits, distance au vide (arrondi des volumes), ton=contour/ Volume/hauteur, écrasement Pocket, **trame ordonnée Bayer 4×4** aux frontières de tons, `smoothTone` (médiane 3×3 ×2), hiérarchie des matières sur les 4 encres, **`addPocketEnemyDetail`** complet (aériens/gunships/blindés), flash = ton le plus clair (pas de blanc en 8 bits), 4 poses cuites (`poseParts`, onde d'ailes).
- **`scripts/sheets.gd→native_player`** : la coque du joueur selon le **module 34** — `r0-<vaisseau>.png` (le dessin officiel) réduit à 72 px de coque (SPRITE_H), quantifié nearest-luminance sur les encres ; flammes LCD procédurales aux tuyères `lcdNoz` (vacillement [1,1.18,0.9,1.1], boost ×1,55), squash d'inclinaison ×(1−|bank|·0.13).
- **`scripts/sprites/guardian_sprite.gd`** : le **GARDIEN DU SILO v3** (module 17) porté intégralement — grille 56×60 échantillonnée, œil à pétales tournant par crans + pupille qui suit le joueur, couronne radar à rampe de voyants, mâchoire-canon qui s'ouvre et tire, épaulières 3 tubes, sourcils en V, grilles, bande de danger, biseau (lumière HG/ombre BD), fissures progressives selon les dégâts, contour continu, flash.
- Branchement : ennemis, objets et boss du secteur 1 passent par ces bakers ; le HUD, la coque, le décor (chunks) restent inchangés.

## Retouches de présentation (v3)
- **Tailles** : vaisseau 44 px de coque (≈9 % du LCD, proportion de la capture), ennemis à TOUCH_ACTOR_SCALE (facteur tactile 1,22 du moteur → ×0,305).
- **Polices** : « Press Start 2P » (OFL, équivalent libre de la dot-matrix KFM-01) — HUD (`_txtp`), étiquette KFM-01, logo FANBOY, panneau FROLE LES, tous les boutons ; boot 16 px.
- **Cadre** : liseré clair + trait sombre autour de la coque olive, double liseré autour de la visière noire (feuillure), trait sous le HUD.
- **Boutons** : bordure jaune-vert `#a2ab49` (échantillonnée sur la capture), fond marine `#050611`, libellés pixel 8 px, valeurs 12-16 px, PAUSE = « II ».
- **LED** : corps 5,5 px + halo α0,16 + reflet blanc décalé (bandeau), 3,6 px pour le voyant latéral — pulsation conservée.
- Jauge COQUE segmentée (tirets tous les 10 px), trait épais sous le HUD, score groupé « SC 2 296 ».

## Atlas officiels (module 46) — les PNG/webp du repo utilisés directement
- `assets/sprites/bosses/boss-01.webp` (atlas officiel du GARDIEN DU SILO, 2050×1397) + descripteur `META` (22 cases [crop, ancre, échelle] → `boss1_meta.gd`).
- `boss_atlas.gd` : découpe des cases, quantification 4 encres (« coupes sèches » 8 bits), poses attente/charge/attaque/dégât/défaite, `kbOf` du moteur (clamp(r×2,25)/bw, plaf 320/h·0,9) calé sur la capture mobile (×0,5), flottement sin(t·1,6)·3, arrondi 2 px, clignotement d'entrée era≤1.
- Branche : atlas d'abord, sprite procédural v3 en repli si le webp manque.

## Les 24 atlas de boss officiels (module 46) — intégration complète
- **24 webp** téléchargés du pack `assets/bosses/`, **réduits de moitié** (mémoire téléphone du module 46, rendu identique) → 9,4 Mo au lieu de 24.
- **`boss_meta_all.gd`** : le descripteur META des 24 atlas (22 cases chacun : crop, ancre, échelle), coordonnées divisées par 2 pour les atlas réduits.
- **`boss_atlas.gd`** : lecteur complet — case par pose (attente/charge/attaque/dégât/défaite), **quantification nearest-luminance sur les 4 encres** (« coupes sèches » 8 bits), silhouette d'ombre décalée (+12,+26, α .26) comme le kind 'black', flash éclairci, `kbOf` du moteur, flottement sin(t·1,6)·3, arrondi 2 px, clignotement d'entrée era≤1, échelle calée capture mobile (×0,5).
- **Branchement** : chaque secteur n (1-24) affiche `boss-nn.webp` automatiquement — le boss du secteur 1 est le vrai mech peint du pack.
- Note : `final-enemies-sheet.png` et `assets/bonus/*.webp` ne sont chargés par **aucun** module du moteur d'origine (planches sources) — les acteurs en jeu viennent des SIL, déjà portées.

## Images officielles + thème des menus (T13)
- **42 images du repo d'origine** intégrées (`assets/ui-art/` + `assets/tickets/`) : les **24 illustrations de briefing** (`briefings/secteur-01..24.webp`), les **images d'intro** (`intro-vorax`, `depart-fin`), la **carte de progression**, les **6 visuels du niveau 24** (silo final : espace, couloir, porte SAS, intérieur), les **bases de tickets** (×6, dont la base Neomélodies), **pastilles de rareté** (×5), **surface argentée**, **récompenses** et les **2 sons du module 47** (`frottement`, `revelation`).
- **Écran de briefing** : l'illustration officielle du secteur (`secteur-nn.webp`) remplace la jaquette procédurale — le cartouche/l'ère reste dessiné dessous.
- **Histoire** : pages 2 et 4 illustrées (`intro-vorax`, `depart-fin`) ; **Commandes** : carte de progression, les 5 bases de tickets et les 5 visuels du silo final.
- **Thème menus/options** : les valeurs exactes du `neo-vanguard.css` du site (`html.nvui`) sont dans `ui_kit.gd` — accent `#38e0ff`, encre `#d9efff`, panneaux dégradé 145° `rgba(10,17,33,.97)→rgba(5,9,20,.96)`, liseré `rgba(164,205,255,.2)`, rayons 18/14/11, halo radial `rgba(50,205,255,.15)` + voile violet, boutons blanc α.045→.09 et primaire à liseré accent. Fond titre = `title_backdrop()` (halo), autres écrans = `dark_bg()` ; boutons et panneaux stylés CSS.
- **TICKETS À GRATTER (module 47, intégral)** — `scripts/tickets.gd` + `scripts/ui/ticket_view.gd` :
  - ticket **LÉGENDAIRE** `NV-001-…` attribué après le générique de fin (remplace l'ancien cadeau), ticket **ÉPIQUE** `NV-002-…` offert en battant le boss du secteur 12 (bilan de secteur, réouverture auto s'il n'est pas révélé) ;
  - carte inclinée −4°, base officielle, récompense sous la **surface argentée**, grattage doigt/souris (pinceau 63 px, interpolation des mouvements), **révélation auto à 65 %**, **son de frottement** en boucle pendant le geste, **carillon** `revelation.wav` à la révélation, numéro de série imprimé ;
  - **codes de ticket** (`CAFAITFLIPPER` → flipper, `NEOMELODIES` → cassettes) : traités AVANT les codes classiques, validables à tout moment, **une seule fois** (`S.unlocks`) — exactement le wrapper `tryCheatCode` du module 47 ;
  - encadré **« MES TICKETS »** dans CODES : bordure à la couleur de rareté, série, état intact/révélé, réouverture en surcouche (`#nvtOverlay`) ;
  - sauvegarde : `S.tickets {items, next, counters}` (numérotation NV-XXX-XXXXXX par collection).
- Tests : `NV_TEST=5` (tickets : attribution, séries, codes, grattage, révélation, « Mes tickets ») ; `NV_TEST=1..3` inchangés — tous verts.

## Passe fidélité (T14) — le module 20 intégral + la puce son exacte
- **Les 8 ennemis du module 20** existent désormais tels quels : **bombardier** (traversée, tapis de bombes), **kamikaze** (verrouillage ½ s puis charge), **mineur** (4 mines max, écoutille clignotante), **lance** (rayon suiveur — le faisceau suit son tireur tant qu'il vit), **lanceur** (2 missiles à tête chercheuse), **phalange** (mur de 6 tirs, glissement en rang), **tisseur** (spirales, Lissajous), **char** (anneau de 8, se fend en 4 essaims). Stats exactes (hp/r/vitesse/cr/tir), silhouettes SIL d'origine (pré-tournées de π comme `ENEMY_FLIP` : kamikaze, lanceur, tisseur, char ont le nez vers le bas), **teintes ETHEME** exactes, détails animés (aura mini-boss, charge de lentille, verrouillage, ligne de rang).
- **Les 6 mini-boss de génération** (`MINI_OF_ERA`) : Gardien du silo, Contremaître (garde rotative), Matriarche (libère des piqueuses), Croupier (16 tirs + fente), Archiviste (missile rapide), Héraut (téléportations). Ils reprennent le sprite de leur engin de base **agrandi** (×1,5 à ×2,0 — module 48 : cuisson à taille réelle), bandeau radio « SIGNATURE LOURDE ».
- **buildPlan final (l.12851)** porté à l'identique : ouverture 4 drones en V → vocabulaire local (`formFor` : chaque engin se présente par sa formation attitrée — cross/rang/pince/coins/ligne/côtés/arc) → **mini-boss à mi-secteur** (élite en zone 2, gardiens escortés en zone 4) → vagues combinées n+n2 → resserrement zones 2-4 → finale zone 4 (bombardiers + double mini) ; **pools POOLS ère × zone exactes** (4 zones par génération, ex. zone 4 KFM-01 = kamikazes+bombardiers) ; densité `1 + zone·0,18 + ère·0,06` plafonnée à 1,18 au secteur 12, ×1,16 sur ses horaires. `boss_launch` ne remplace plus les espèces (le remap kamikaze→essaim etc. est supprimé).
- **Puce son exacte (`audio_chip.gd`)** : la synthèse WebAudio d'origine (`voice`/`noise`/`saw3`, l.2087-2317) retranscrite — oscillateurs (square/saw/triangle/sine), rampes f→f2 exponentielles, vibrato 6,2 Hz, biquad RBJ low/high/band avec rampes de coupure, bruit blanc filtré, **écho de fin d'ère (0,24 s ère 2, 0,30 s au-delà)**, et les **21 recettes × 6 ères** (shoot, cannon, laser, ehit, explode, hurt, shieldbreak, pick, coin, power, buy, ui, back, bomb, warp, warpSwap, alert, bossAlarm, levelup, reward, gameover). Rendu une fois en WAV 16 bits stéréo (cache nom×ère), sinon repli sur les WAV existants.
- **Entrées P2 conformes** : **ZQSD/WASD** (physiques A/D/W/S — A=Q et W=Z en AZERTY comme l'e.key d'origine), tir **F ou L**, bombe **G ou K** ; en **2 joueurs le P1 ne lit plus ZQSD/WASD** (flèches seules, comme l'axis() d'origine) ; tir P1 **+ Ctrl + Meta**.
- **Greebles `det`** : le drapeau `det` des pièces (panel/vent/rivet/bar/win) est extrait dans les silhouettes et appliqué dans le baker Pocket (port intégral de `greeblePass`, hash `h2s` identique : nervures assombries ×0,74/×0,82, grilles alternées ×0,40/×1,30, rivets ×1,6, chevrons ×1,45/×0,5, hublots GLOW). `pickupBox` reprend ses **10 pièces vraies** et la hauteur 58 (2e déclaration du moteur).
- **Ajustements de fidélité** : ombre portée des boss **uniquement ère ≥ 2** (×0,94, pas de fantôme sur le boss mort) ; décor : plan lointain ère ≥ 2 à **×0,28** (portée −520→+560), plan médian **×0,55** (−460→+500), avant-plan **×1,75 en ère 4+** (−200→+220) ; warning d'ancres du ticket éliminé ; caches audio/textures libérés à la fermeture (plus d'ObjectDB leaks au quit).
- **NV_TEST=7** (nouveau) : rend les 21 recettes audio × 6 ères, fait entrer les 8 engins + 4 mini-boss en ère 1 avec leurs formations, vérifie sprites et densité, capture `test7-module20.png`.

## Passe v6 — le dépôt complet : Neo-Vanguard FM, flipper Néon Orbit, cinématique, secteur 24

Cette passe répond à l'objection « il manque facile 300 mo » : **tout le dépôt officiel (1 087 fichiers, 454 Mo) est dans le projet** —
les éléments utilisés par le jeu sont importés sous `assets/`, **l'intégralité du reste** est recopiée à l'identique dans
`originaux/` (sources JS, CSS, index.html, tous les packs graphiques : embedded, final, fanboy, enemies, ships-anim,
level24, level24-v2, level24-anime, tickets, vorax, bosses, bonus, music, pinball, tests, docs, comparatifs…).

- **Neo-Vanguard FM (`scripts/ui/fm_screen.gd`)** — le module 30 complet : les **31 cassettes officielles** (catalogue JSON
  `nvMusicCatalog` de index.html : 6 thèmes de secteur, 24 thèmes de boss, CONTINUE · GAME OVER) avec leurs **prix exacts en CR**
  (80 → 335), les **étiquettes par famille** (secteurs bleus/cyan/violet/vert/or/rose, boss roses/rouges/violets, spéciales dorées),
  les mentions **MASTER era** (KFM-01, HOME SYSTEM, 16-BIT CONSOLE, ARCADIA ARCADE, NOVA CD-ROM, HD AUDIO), les jaquettes
  officielles (`music-shop/cases` → boîtiers fermés, `open` → ouverts une fois achetés), les filtres TOUTES/SECTEURS/BOSS/SPÉCIALES,
  l'**achat en crédits**, la **lecture mp3 réelle** et le **walkman** (statut deck `READY · TAPE LOADED` / `PLAYING · STEREO`,
  sfx cassette-insert/credit-chime/walkman-eject). Rayon déverrouillé par le code ticket **NEOMELODIES** (`S.unlocks.cassettes`).
  Tuile du menu titre : « ♫ Neo-Vanguard FM — jukebox · cassettes · MP3 ».
- **Flipper Néon Orbit (`scripts/pinball/pinball_engine.gd` + `scripts/ui/pinball_screen.gd`)** — le flipper officiel retranscrit :
  - **moteur** (`pinball/engine.js`) : table 1024×1536, pas fixe **1/240 s**, gravité 620, vitesse max 2400, bille r19 ;
    3 polylignes de murs + gouttières + 2 guides, 3 bumpers (kick +540, cd 0,13, 500 pts), 2 plots, 2 slingshots
    (390/−90), 6 cibles (2 bankes de 3, banque 5 000 + timer 1 s), réacteur du défi, **2 rampes Catmull-Rom** (28 échantillons/segment,
    entrée r48 si vy<−300, vitesse bornée 780–1250, sortie ×640/+220, cd 1 s) ;
    batteurs (305/717, 1278, longueur 170, ±25°, montée 0,055 s / descente 0,08 s, coup min(170, |ω|·7)) ;
    lance-bille (charge 1,35 s, vy −(1350+950·puissance)), bille de secours 8 s, missions 24 secteurs
    (type (secteur−1)%4 : bumpers / rampe gauche / rampe droite / 2 bankes), multiplicateur ×1/×2/×3/×5 (2 bankes),
    **défi VORAX** (5 impacts en 45 s, 5 000/impact + 100 000) puis **multibille 3 billes à jackpot de rampe 25 000** ;
    drain/advance identiques (≤0,05 s/frame, ≤16 pas, 2 résolutions).
  - **rendu & son** (`pinball/pinball.js`) : le plateau officiel **02_plateau_statique**, les **rails des rampes** obtenus comme à
    l'origine (table masquée destination-in par le trait de 88 le long des rampes, texture construite UNE fois), atlas mécanismes 4×4
    (bumpers 4/5/6 avec flash 0,17 s/échelle 0,94, plots 7, cibles 8/9/10 abaissée +13 px, batteurs 0/1 pivotés aux pivots exacts,
    lance-bille 11 + jauge, billes 12/13/14 selon x, ombre 15), atlas effets 4×4 (cyan/magenta/étincelles, blend écran),
    inserts triangulaires (séquence 8 Hz) + 8 points lumineux par rampe (cycle 0,75 s), **afficheur 8 chiffres**
    « Sxx · Bx · ×N · p/t », popups de points, messages (BANQUE · 5 000, MULTIPLICATEUR, SECTEUR VALIDÉ, DÉFI VORAX, JACKPOT…) ;
    **les 19 wav officiels + la musique 32 s en boucle** ; commandes ←→/AD, espace (lance-bille), zones tactiles, Échap = pause ;
    aide première partie, pause, game over + **record local** (`S.pinball.best`) ; menus fidèles avec l'art 05_menu_deblocage.
  - **déblocage** : fin de campagne (victoire → `S.pinball.completed`, comme le hook `showVictoryScreen` d'origine) **ou** code
    **CAFAITFLIPPER** ; à la première victoire, l'écran-cadeau « BONUS DÉBLOQUÉ » s'affiche après le ticket final (une seule fois) ;
    tuile du menu titre visible uniquement une fois débloquée.
- **Cinématique narrative (`scripts/ui/story_deck.gd`)** — le deck du moteur (prologue **9 pages**, épilogue **5 pages**) avec les
  **textes français exacts** (titres, 6 lignes et citation de chaque page) et les **illustrations officielles** (`assets/story/` :
  pro-N = media-00(N+6), **pro-3 = Neo-Vanguard_intro_VORAX.png**, epi-N = media-00(N+1)) ; rendu fidèle au canvas : cadrage « cover »,
  lent travelling (zoom 1,04 → 1,10), vignette, fines lignes de balayage, cadre cyan à coins, points de progression, compteur ;
  le titre de chaque page est **lu par la voix** (`Audio2.speak`, option voix). Le **prologue ouvre la campagne** (et le mode
  2 joueurs), l'**épilogue précède l'écran de victoire** ; l'entrée « L'histoire » du menu rejoue le prologue.
- **Secteur 24 (module 29) — première passe** : le fond du secteur est le **couloir officiel de la base** (tuile `corridor-tile`
  qui défile à ×0,6) ; pendant l'alerte amirale, le **sas de confinement** (`doors/airlock`) est **destructible** — 60 PV ×
  difficulté (×1,5 en 2 joueurs), **9 fissures** générées comme `makeDoor` et révélées par les dégâts, flash d'impact,
  impacts sonores du **pack sector24/audio**, barre de vie et consigne « DÉTRUIS LE SAS » ; à la rupture : explosion (base_effondrement
  + debris_retombee) puis la **radio VESTA** (sous-titres + voix) et l'amiral. `scripts/nv24_audio.gd` (autoload `Nv24Audio`) joue
  les **16 échantillons officiels** (`assets/sector24/audio`, wav) avec repli automatique sur la synthèse Audio2.
- **Briefing** : la **boîte et son support** (78_box_art) affichent la **photo produit officielle** de l'ère
  (`box-pk/hs/s16/arc/ncd/hd` = media-016…021) à la place du dessin procédural.
- **Mix 49 appliqué** : duck musique **−8 dB** et SFX **−3 dB** pendant la voix (callbacks TTS + garde-fou), **tirs −4 dB**,
  voix à 100 %, la touche **M** coupe aussi la voix.
- **Tests** : `NV_TEST=8` (nouveau) — échantillons sector24 (16/16), FM (31 cartes, achat, lecture, walkman), flipper (menu,
  table, batteurs, lance-bille), prologue, sas du secteur 24 ; captures dans `apercu-godot/` (1-fm-boutique, 2-fm-walkman,
  3-pinball-menu, 4-pinball-table, 5-prologue, 6-sas-secteur24). NV_TEST 1/2/3/5/7 restent verts.
