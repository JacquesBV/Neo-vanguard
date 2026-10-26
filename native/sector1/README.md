# Secteur 1 natif — première tranche jouable

Ouvrir le `project.godot` à la racine dans **Godot 4.6**, puis F6/F5.
Le projet lance une scène Godot ; aucun navigateur, WebView, interpréteur JavaScript
ou moteur du jeu web n'est embarqué.

La campagne complète n'est pas livrée. Cette scène permet de jouer le secteur 1
jusqu'au boss et à l'écran de victoire. La parité intégrale avec le jeu web reste
ouverte : consulter `native/STATUS.md` et `native/tests/SECTOR1_VALIDATION.md`.
Les écrans d'accueil et de briefing présents ici servent à lancer cette tranche ;
ils ne sont pas les menus finaux de Neo-Vanguard.

## Commandes

- Déplacement : flèches, ZQSD ou WASD ; Shift : déplacement précis.
- Tir maintenu : Espace, Entrée, Ctrl ; souris gauche pour piloter et tirer.
- Bombe : G (touche de la source), B ou X ; souris droite.
- Manette : stick gauche, A / gâchette droite / bouton d'épaule droit pour tirer,
  B / X pour la bombe, Start pour démarrer ou suspendre.
- Tactile : glissement relatif dans l'écran, stick et boutons de la coque.
- Pause : Échap, P, Start ou bouton PAUSE ; perte de focus : pause automatique.

Le tir automatique reste désactivé au repos. Comme dans la source, maintenir le
stick tactile ou déplacer le vaisseau avec le doigt ouvre le feu.
La touche ARME indique l'arme de départ : le joueur ne possède que l'impulsion.
Les boutiques et le changement d'équipement ne sont pas encore raccordés.

## Présentations

Le champ est exprimé dans les unités originales **480 × 860** et dessiné dans
un `SubViewport` **160 × 287**. Le raster est agrandi par un facteur entier dès
que la place le permet. La coque utilise l'atlas matériel FanBoy FX original,
avec HUD au-dessus et en dessous, hors du champ. Les acteurs mobiles reprennent
le facteur visuel **1,22** de la source. Le collider conserve les unités source.

En développement : `godot --path . -- --mobile` simule la présentation tactile.
Ceci n'est ni un APK ni un test sur téléphone. Quest/OpenXR n'est pas implémenté.

## Source des ressources

`baked/atlas.png` regroupe sans rééchantillonnage 726 poses issues des images et
dessins procéduraux de la source : Falcon, ennemis, mini-gardien, objets, décor et
22 poses du boss. `sector.json` conserve leurs régions et ancrages explicites.
Le décor utilise 96 variantes de taille/graine avec quatre images d’animation chacune.
Ces échantillons viennent des fonctions source, mais ne couvrent pas toutes les tailles
continues et animations procédurales. Les tirs sont échantillonnés sur 16 directions.

Les deux boucles musicales ont les notes et la composition de la puce FanBoy du
module 24. Les WAV sont calculés hors ligne à partir de ces événements. Le filtrage,
les enveloppes et le bruit sont une approximation native à comparer à l'écoute.
Le son du secteur 1 ne se résume pas aux MP3 importés : la source utilise une puce.

Les sauvegardes utilisent le magasin natif du socle, séparé de localStorage.
Les COINS sont crédités une fois à la victoire ou à la fin de partie. Les matériaux
sont sauvegardés dès la collecte, comme dans la source, sans double comptage final.
La récolte commence à la mort du boss et récupère les objets restants après 6,4 s.
Les frôlements chargent une surcharge automatique après 90 tirs frôlés. L'accueil
interrompt une partie sans créditer les gains non terminés ; cet écran provisoire
n'est pas une validation de la politique d'abandon finale du jeu source.

## Reproduire les ressources et les contrôles

Les fichiers cuits sont versionnés : aucune dépendance Python/Node n'est nécessaire
pour ouvrir le projet dans Godot. Pour les recalculer :

```sh
npm install --prefix native/tools
node native/tools/extract_sector1.cjs
python -m pip install -r native/tools/requirements.txt
python native/tools/render_chip.py
godot --headless --editor --path . --import
godot --headless --path . --script native/tests/core.gd
godot --headless --path . --script native/tests/sector1.gd
godot --headless --path . --script native/tests/presentation.gd
godot --headless --path . --script native/tests/rewards.gd
```

L'extracteur vérifie les empreintes SHA-256 des modules utilisés avant de cuire
les ressources ; il doit échouer si leur source a changé.
