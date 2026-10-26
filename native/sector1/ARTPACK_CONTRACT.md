# Contrat « pack visuel secteur 1 » — interface remplaçable

Le rendu du secteur 1 est découplé de la simulation (`mission.gd` reste la
seule source des attaques, dégâts, trajectoires, récompenses et timings).
Un pack visuel est un **répertoire interchangeable** qui honore le contrat
ci-dessous. Le pack actif est choisi par `PACK_ID` dans `field.gd` et
`app.gd` (`artpack_s01` aujourd'hui, provisoire).

## 1. Emplacement et commutation

```
native/sector1/<PACK_ID>/
```
- `PACK_ID` : deux constantes à aligner (`field.gd`, `app.gd`).
- Si le répertoire ou `godot/guardian.tscn` manque → repli automatique sur
  la présentation atlas cuite (`baked/atlas.png`) : le jeu tourne toujours.

## 2. Contenu obligatoire

| Chemin (relatif au pack) | Format / taille | Rôle |
|---|---|---|
| `assets/boss/guardian_neutral.png` | 96×128, 4 tons + alpha binaire | master du boss au repos (référence pixel) |
| `assets/boss/rig.json` | schema v1 (canvas 96×128, anchor 48,64, 8 pièces, 6 sockets) | description du rig articulé |
| `assets/boss/parts/*.png` | canvas 96×128 par pièce | torso, crown, jaw, iris(+4 stades), shoulder_l/r, forearm_l/r, damage_0..2 |
| `assets/boss/{idle,open,charge,fire,recoil,damaged,defeat}_sheet.png` | 60 frames, 7 séquences | secours AnimatedSprite2D (rig préféré) |
| `assets/enemies/<famille>_00..03.png` | 48×48 ×4 frames, ancrage (24,24), orientés vers le bas | familles : radar_drone, patrol_interceptor, mine_layer, armored_transport + stinger_original_sheet.png (192×48) |
| `assets/environment/route.json` | modules (17 slots), arena_modules | ordre de progression maintenance→archives→sécurité→antichambre→arène(12,13)→aftermath(14) |
| `assets/environment/layers/NN_{far,structure,walls}.png` | 160×160 ×3 couches ×15 | modules de fond (OU backgrounds fusionnés — jamais les deux) |
| `assets/fx/<effet>_00..03.png` + `godot/fx_<effet>_frames.tres` | charge/beam/muzzle/flame/impact/bullet/aimed_bullet/telegraph | effets SÉPARÉS des corps |
| `assets/ui/{vesta,guardian}_ninepatch.png`, `*_portrait.png`, `portrait_frame.png` | 152×48 / 40×40 | cadres VIDES (aucun texte gravé) |
| `godot/guardian.tscn` + `guardian.gd` | 8 pièces, 6 sockets, `showcase_cycle=false` en jeu | composant visuel seul |
| `godot/dialogue_panel.gd` | slot `LocalizedTextSlot` | panneau de dialogue |

## 3. Règles impératives (rappel du prompt d'intégration)

1. Palette : `#9ea483 #7d8267 #595c4c #2f3329` + alpha binaire ; contours
   sombres, surfaces claires, sol clair (polarité positive, JAMAIS réinversée).
2. Aucun effet (rayon, flamme, charge, impact) fondu dans un sprite de corps ;
   les rayons partent des sockets `muzzle_l/r`, la charge de `eye`, les flammes
   de `exhaust_l/r` — gauche/droite À L'ÉCRAN.
3. Reconstruction des pièces au repos **identique au pixel près** au master
   (contrôlé par `native/tests/artpack_s01.gd`).
4. Import nearest, sans mipmaps, compression sans perte ; pas de filtre
   bilinéaire, pas de texture floue ou picturale.
5. `weapon_fired` est un signal VISUEL : aucun projectile de gameplay créé
   côté présentation. La simulation décide seule des tirs.
6. Dialogues : cadres vides, texte Godot localisable, une seule fenêtre
   active, gel complet (simulation, ennemis, tirs, bombes, horloges) tant
   qu'elle est ouverte, touche de fermeture consommée.
7. Proportions/silhouettes/identité comparées au jeu GitHub original avant
   tout remplacement (Falcon, mini-gardien, ennemis originaux conservés).

## 4. Procédure de remplacement (pack suivant)

1. Livrer le pack dans `native/sector1/<nouveau_id>/` au contrat ci-dessus.
2. Basculer `PACK_ID` (field.gd + app.gd).
3. Relancer : `native/tests/artpack_s01.gd` (adapté au nouveau id), puis les
   4 suites du projet (`core`, `sector1`, `presentation`, `rewards`).
4. Comparer boss vs master, raccords de route, ennemis en vol, dialogue.
5. L'ancien pack reste en place jusqu'à validation complète du nouveau.
