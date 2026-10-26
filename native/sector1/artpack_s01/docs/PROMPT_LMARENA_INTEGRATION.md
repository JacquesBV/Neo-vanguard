# Prompt à transmettre intégralement à l’agent LMArena

Tu es responsable de l’intégration professionnelle du pack `NeoVanguard_S01_FanBoy_AssetPack` dans la recréation NATIVE GODOT de Neo-Vanguard. Exécute le travail jusqu’à une scène jouable contrôlée, puis rapporte honnêtement ce qui est validé et ce qui reste à faire. Ne te contente pas d’expliquer comment intégrer.

## 1. Projet et périmètre

Le dépôt est `https://github.com/JacquesBV/Neo-vanguard`, branche `godot/native-recreation`. Commence par lire `native/STATUS.md`, les instructions locales du dépôt, `native/sector1/README.md`, `assets/manifest.json` du pack et tout ce document. Inspecte l’état courant : ne reviens pas à un ancien commit. Le pack a été préparé après consultation de la branche au commit `b598537056bfe3df1870843084cd0497f2fb6f71`. La référence historique de la recréation est `ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057` ; il ne faut pas écraser les progrès faits depuis.

Travaille uniquement sur le secteur 1 FanBoy et ses ressources. Les anciennes archives Godot V6/V7 ne sont pas la base. Le jeu doit rester natif Godot : aucune WebView, aucun navigateur, aucun moteur JavaScript embarqué. Ne modifie ni le jeu web ni les 23 autres secteurs pour appliquer ce pack.

Le `project.godot` du pack sert UNIQUEMENT à sa démonstration autonome. Ne remplace jamais celui du vrai projet par ce fichier. Installe les ressources dans un espace de noms dédié avec `tools/install_into_project.py`, puis raccorde réellement la mission et l’affichage existants. Le script installe les composants et réécrit leurs chemins, mais ne réalise pas le raccordement du combat à ta place.

## 2. Direction artistique contractuelle

Palette opaque exacte : `#9ea483`, `#7d8267`, `#595c4c`, `#2f3329`, plus transparence binaire. Pas de jaune vif, violet, dégradés lissés, textures peintes ou filtre bilinéaire. Les fichiers dans `assets/` sont les ressources de production. Les planches dans `art_sources/` sont des sources de création/référence : ne les découpe pas à nouveau et ne les affiche pas dans le jeu.

**Correction finale demandée par le créateur : contours sombres, surfaces et blindages plus clairs, creux sombres, sol clair.** Les PNG de production sont déjà corrigés en polarité LCD positive. N’inverse JAMAIS à nouveau leur palette dans un shader, dans `applyGameBoyPalette` ou dans une conversion d’import. Les effets restent lumineux et indépendants. Les planches sources montrent parfois la polarité antérieure : elles ne priment pas sur les PNG livrés dans `assets/`. Contrôle les captures natives fournies dans `previews/`.

La planche `art_sources/guardian_design_reference.png` est une étude de décomposition. Elle n’est PAS le boss à remplacer dans le moteur. Le master à respecter est `assets/boss/guardian_neutral.png` : c’est le mécha original approuvé, tiré d’une pose neutre sans tirs. Le rig doit en préserver la silhouette et les proportions.

Champ logique existant : 480 × 860 ; raster FanBoy : 160 × 287. Les pixels de ce pack sont exprimés dans le raster, sauf indication contraire. Ne mélange pas positions logiques et pixels natifs. Transforme les unités une seule fois à la frontière simulation/présentation. La coque et le HUD restent hors de la surface de combat selon le projet courant.

Import des PNG en compression sans perte, filtrage nearest, mipmaps désactivées ; agrandissement entier lorsque possible. Vérifie les réglages après import, pas seulement ceux de l’éditeur. Préserve la présentation PC/mobile et le facteur mobile existant seulement là où il est prévu ; ne double pas ce facteur par erreur.

## 3. Gardien du Silo : préserver le mécha, refaire l’animation

Le boss du secteur 1 s’appelle **GARDIEN DU SILO**. Ce n’est ni Goliath-Prime, ni un nouveau robot. Son problème précédent était l’animation et les tirs/flammes fusionnés au sprite. Conserve son identité.

Utilise `godot/guardian.tscn`, `guardian.gd`, `assets/boss/rig.json` et les huit pièces de `assets/boss/parts/`. Canvas fixe 96 × 128 ; ancrage fixe (48,64). La reconstitution des pièces au repos doit être identique pixel par pixel à `guardian_neutral.png`. Les avant-bras sont enfants des épaules ; les pivots et sockets restent fixes dans leurs repères locaux. N’utilise jamais une recoupe automatique différente à chaque frame.

Le rig possède six sockets : `eye`, `muzzle_l`, `muzzle_r`, `core`, `exhaust_l`, `exhaust_r`. Les rayons et flashes de bouche partent des sockets des avant-bras et suivent leurs transformations. La charge centrale doit être à l’œil ; les flammes doivent être aux échappements. Aucun décalage arbitraire vers le torse ou sous les yeux. Ici gauche/droite signifie gauche/droite À L’ÉCRAN ; ne permute pas les bras.

Tous les effets sont des nœuds distincts avec leurs propres textures, animations, durées et, lorsqu’ils infligent des dégâts, collisions. Les corps de lasers sont répétables. Ne réutilise pas les anciennes frames de boss avec rayons/flammes intégrés. Ne lance pas en même temps le rig ET la vieille animation complète derrière lui. Ne dessine pas de contour, de halo ou de particules sur le corps pour simuler des tirs.

Raccorde `play_action()` aux vrais états du combat : repos, ouverture, charge, tir, recul, dégâts et défaite. `showcase_cycle` doit rester **false dans le jeu**. Le signal `weapon_fired` est un signal VISUEL fourni pour la démonstration : ne crée pas un second tir de gameplay s’il existe déjà dans la simulation. La simulation reste la source unique des décisions d’attaque, des trajectoires, des dégâts et des cooldowns. L’affichage reçoit les événements ; il ne doit pas générer des projectiles parce que l’animation de repos a tourné.

Les spritesheets de secours contiennent 60 frames mécaniques en sept séquences et aucun VFX. Elles servent si l’architecture exige AnimatedSprite2D. Préfère le rig pour l’articulation continue ; ne cumule pas les deux affichages. Les séquences charge/tir décrivent le CORPS : les effets correspondants se superposent séparément.

`defeat_sheet.png` et l’action `defeat` du rig contiennent une désarticulation mécanique, pas une explosion finale complète. Raccorde la désarticulation à la mort réelle et ajoute les impacts séparés ; ne prétends pas qu’une simple oscillation est une défaite terminée. Éteins les attaques et collisions offensives dès la mort du boss et conserve les règles de récolte du jeu.

Pour le mini-gardien de mi-parcours, conserve son identité et ses statistiques. Réutilise un rig visuellement réduit uniquement si sa taille et sa hitbox restent lisibles ; ne remplace pas silencieusement le mini-gardien par le boss complet.

## 4. Ennemis et rythme

Le pack ajoute quatre familles animées : `radar_drone`, `patrol_interceptor`, `mine_layer`, `armored_transport`. Les familles originales `drone` et `stinger` sont également fournies comme références adaptées au même raster. Un Falcon original est inclus pour contrôle d’échelle ; ne remplace pas les vaisseaux de la boutique par un autre design.

Introduis la variété progressivement : reconnaissance dans la maintenance, patrouilleurs dans les archives, unités de sécurité plus lourdes à l’approche du sas. Garde les trajectoires, PV et timings existants comme base avant tout rééquilibrage. Les quatre nouvelles familles sont des ressources visuelles, pas quatre comportements déjà implémentés : raccorde explicitement chaque famille à un type existant ou implémente et teste son comportement. N’ajoute pas de mines invisibles parce qu’un sprite est nommé `mine_layer`.

Les ennemis sont orientés vers le bas. Garde leurs quatre frames dans le même canvas 48 × 48 et le même ancrage (24,24). Les effets de propulsion et de tir sont séparés. Les collisions doivent suivre les silhouettes utiles sans rendre les drones inutilement punitifs ; ne transforme pas tout le rectangle transparent en hitbox.

## 5. Décor : progression et couches

16 modules de fond de 160 × 160, chacun avec trois couches : `far`, `structure`, `walls`. Utilise le fond fusionné OU les trois couches, jamais les deux à la fois. Les couches reconstituent exactement leur fond fusionné. Les 1 600 tuiles de 16 × 16 sont fournies avec un TileSet et les coordonnées de reconstruction ; elles ne sont pas 1 600 dessins indépendants, mais le découpage des 16 modules.

La route proposée dans `assets/environment/route.json` suit : maintenance → archives de cartouches → installations sabotées → contrôle de sécurité → refroidissement et sas → antichambre → chambre du Gardien. Respecte cet ordre visuel. Le rythme de défilement du showcase est une prévisualisation, pas une nouvelle durée de mission imposée. Adapte la longueur des sections aux vrais événements de la mission ; le boss ne doit pas apparaître sur des casiers de maintenance.

Les bords nord/sud ont une bande de raccord commune et ont été comparés pour les 256 paires de modules. Recontrôle le mouvement réel, le snap, le cadrage et l’absence de couture à la vitesse de jeu. Maintiens les couches structurelles au même facteur de scroll : ce sont les pièces d’un même lieu. Une éventuelle parallaxe doit être réservée à un ajout indépendant et ne doit jamais faire glisser des murs sur leur sol.

Toutes les décorations et tuiles sont NON COLLIDANTES par défaut. Les extraits de mobilier incluent leur plaque de montage : ne les pose pas arbitrairement au milieu de la piste. Définis explicitement les obstacles destructibles et leur collider séparé. Aucun obstacle invisible, aucune collision sur l’ombre d’un élément ni sur un effet lumineux. Les tirs ennemis doivent rester plus lisibles que les détails du sol dans cette palette monochrome.

## 6. Dialogue et récit à respecter

Les cadres et les champs de texte sont livrés **VIDES** pour une future localisation. Utilise le panneau de dialogue, les deux variantes visuelles et les portraits séparés ; ne rasterise aucun texte dans les PNG. Une seule fenêtre active à la fois, lisible sans cacher la totalité du champ.

Le pilote n’a pas d’identité révélée : il a perdu la mémoire, mais conservé ses aptitudes de pilote d’élite. Vesta s’adresse à CE pilote. Vesta protège le pilote et lutte pour préserver les consoles et leurs cartouches. Vorax et son armée veulent leur anéantissement, un monde sans couleur dominé par Vorax, le chaos et la destruction. Le Gardien du Silo fait partie des forces adverses. Ne révèle pas l’identité du pilote, ne fais pas de Vesta le pilote amnésique, ne confonds pas le Gardien avec Vorax. Ne présente pas la palette FanBoy comme une victoire de Vorax : c’est le rendu de cette génération.

Le portrait de Vesta fourni la représente comme une présence d’archive/communication, sans imposer un nouveau visage humain à un personnage existant. Si le vrai projet possède déjà son portrait canonique validé, préserve-le et emploie simplement les nouveaux cadres. Le portrait de pilote anonyme est optionnel : il ne doit rien révéler.

Prévois les déclencheurs : contact de Vesta à l’entrée, avertissement avant la zone de sécurité, échange Vesta/Gardien avant l’activation, éventuel échange après la victoire. Les emplacements sont fournis, pas un script de dialogue imposé. Quand une fenêtre bloque le jeu, arrête simulation, ennemis, tirs, bombes et horloges de mission ; reprends une seule fois après fermeture. Les touches utilisées pour fermer ne doivent pas lancer une bombe ou un tir au même instant.

## 7. Intégration propre

Conserve sauvegardes, économie, récolte, frôlement, musique et sons du secteur, options, entrées clavier/souris/manette/tactile et gestion de pause. Ce pack ne contient pas de nouvelle bande sonore et n’autorise pas la suppression des musiques originales. Conserve la coque FanBoy FX et le HUD existants.

Ne remplace pas les scènes de gameplay par le showcase. N’importe pas de projet dans un autre projet comme une arborescence imbriquée sans vérifier les chemins `res://`. Précharge les ressources utiles et évite les créations/destructions permanentes dans la boucle de dessin. Désactive les anciens renderers qui doublonneraient nouveaux fonds et boss. Ne lance pas de mission derrière l’intro, le briefing, un menu ou un dialogue bloquant.

Documente chaque correspondance entre l’état de la simulation et le composant visuel. Les sockets visuels ne deviennent pas automatiquement les origines de collisions : vérifie leur conversion vers le repère de simulation. Fais suivre exactement le collider du rayon à sa géométrie visible, sans rectangle d’attaque persistant après disparition.

## 8. Vérifications obligatoires avant de conclure

1. Import Godot sans erreur ; chargement de toutes les textures et ressources ; lance `tests/validate.gd` et le contrôle Python si disponible.
2. Compare le boss au master au repos et en attaque. Aucun bras inversé, aucune flamme collée, aucun changement de taille entre poses, aucun saut du centre. Teste les deux bras séparément et ensemble, l’œil et les échappements.
3. Vérifie les raccords en défilement, toutes les transitions de zones, l’arrivée du boss, l’après-combat et les fonds sans objets invisibles.
4. Rejoue le secteur 1 jusqu’à sa vraie victoire avec les contrôles normaux. Un replay invulnérable ne valide pas la difficulté humaine. Vérifie bombes, mort, pause, perte de focus, retour au menu et relance.
5. Fais des captures et de courtes vidéos comparables PC/mobile ; vérifie native 160 × 287 puis fenêtres agrandies, et test tactile sur appareil si accessible. N’annonce pas un test appareil ou commercial qui n’a pas eu lieu.
6. Vérifie que chaque famille d’ennemis apparaît réellement, reste visible et ne recouvre pas les projectiles. Contrôle les collisions, récompenses et le budget de rendu sur mobile.
7. Ouvre/ferme chaque dialogue : aucun texte gravé, aucun tir derrière, aucune perte du focus et aucune fenêtre empilée.
8. Inspecte le diff, conserve les changements utiles et mets à jour `native/STATUS.md` avec preuves et limites. Si la publication est autorisée dans la session, commit/push sur la branche dédiée ; ne fusionne pas sur main par défaut.

## 9. Résultat à livrer

Une scène native de secteur 1 jouable avec le pack, des références de fichiers claires, des captures/vidéos du résultat dans le moteur, les commandes de validation et leurs résultats réels, puis un état honnête des écarts restants. Le seul fait que les PNG s’importent ne signifie pas que le jeu est terminé ou commercialisable. Ne promets pas qu’un style plaira à tous ; assure lisibilité, cohérence, fidélité et qualité contrôlée.
