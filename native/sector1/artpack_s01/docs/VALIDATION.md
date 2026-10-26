# Vérifications du pack — 26 octobre 2026

## Résultats

- **1 791 contrôles Python, zéro échec** : dimensions, empreintes, palette opaque quatre tons et alpha binaire des PNG de production, reconstitution exacte des couches de décor, 256 paires de bords nord/sud, grilles d’animation, contours sombres du boss et marges transparentes de ses 60 frames.
- **562 contrôles Godot 4.6 stable Linux, zéro échec** : chargement des 247 PNG répertoriés, tailles, 22 ressources SpriteFrames, atlas TileSet de 1 600 tuiles, construction du rig, six sockets, attache des VFX, parcours des états d’animation, boîte de dialogue vide et scène de démonstration.
- **Installation dans un projet Godot de contrôle** : espace de noms `native/sector1/artpack_s01`, chemins réécrits, `project.godot` hôte conservé ; les mêmes 562 contrôles Godot passent après installation.
- **Rendu natif inspecté** : OpenGL Compatibility / Mesa llvmpipe, fenêtre 480 × 861 avec agrandissement entier du raster 160 × 287. Capture et GIF de 48 images rendues par Godot, montrant le corps, la charge, les rayons indépendants, le recul et les fissures.

La polarité finale utilise des contours sombres et des surfaces claires. Les PNG sont déjà corrigés : aucune inversion globale supplémentaire ne doit être appliquée. Les sources de création peuvent montrer la version antérieure.

## Portée réelle

Ces vérifications concernent les fichiers et les composants de présentation du pack, pas l’intégration finale dans la campagne. Le showcase ne valide pas les PV, l’équilibrage, les collisions offensives des rayons ni une partie complète du secteur. Les tests automatiques de sockets vérifient le parentage et des coordonnées finies ; la position visible des charges et départs de rayons a aussi été inspectée dans les captures.

Le GIF est une prévisualisation visuelle à pas contrôlé, pas une mesure du framerate d’un téléphone. Pas de test Android/Quest, d’export commercial ou de session de gameplay complète annoncé. Les trois couches structurelles doivent défiler ensemble ; elles ne constituent pas une parallaxe à vitesses arbitraires.

Les 1 600 tuiles sont le découpage des 16 modules, avec répétitions possibles. Les 60 frames du boss sont dérivées de son assemblage mécanique ; ce ne sont pas 60 nouveaux dessins indépendants. Les comportements des quatre familles d’ennemis sont à raccorder à la simulation.

Les sept séquences mécaniques sont repos, ouverture, charge, tir, recul, dégâts, désarticulation. Les effets visuels sont dans un répertoire séparé. Les cadres de dialogue restent vides ; les textes et traductions doivent être injectés par le jeu.

## Reproduire

```sh
godot --headless --editor --path . --import
godot --headless --path . --script tests/validate.gd
python3 tests/validate_assets.py
```

Les résultats détaillés des vérifications d’images sont dans `asset_validation.json`. La provenance des éléments originaux et nouveaux est dans `PROVENANCE.json`.
