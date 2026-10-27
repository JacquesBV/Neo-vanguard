# FanBoy interactive • Neo-Vanguard, secteurs 1–3

Ouvrir `project.godot` dans Godot 4 et lancer la scène principale. Projet exécuté et testé avec Godot 4.7.2, renderer Compatibility. La scène de démonstration est un exemple d'intégration, pas les niveaux complets de Neo-Vanguard.

## Contenu

- Image originale intacte en 937 × 1679 pixels, PNG sans perte.
- Coque, écran, A rouge, B doré, START, SELECT, stick, curseur ON/OFF, LED et rails lumineux isolés en couches PNG avec origines dans `assets/layout.json`.
- Scène réutilisable `scenes/FanBoy.tscn`, construction des composants au démarrage par `scripts/fanboy.gd`.
- Animation 2D avec effet de relief : course des boutons, assombrissement, retour animé, stick continu à 360°, course de l'interrupteur. Ce sont des transformations continues des pixels source, pas des images redessinées à chaque pose ni un modèle 3D.
- Cinq sons mécaniques originaux synthétisés, mono PCM 16 bits, 44,1 kHz : pression, relâchement, ON, OFF, retour stick. Douze voix permettent les interactions simultanées. Volume initial −12 dB ; aucun échantillon tiers.
- Jauges COQUE et BOSS vides au départ, remplissage indépendant par les valeurs de santé.
- Rails et témoin LED pilotés par alimentation et menace.

## Intégration du jeu

Instancier FanBoy dans une interface plein écran. Attendre son signal `ready`, puis ajouter la scène de jeu sous `fanboy.game_viewport`. Le sous-écran mesure 620 × 890 pixels et se place à (158,287) dans l'image maîtresse. Conserver cette définition pour un affichage 1:1, ou adapter le contenu à la taille du viewport. Le sous-écran de la source a des reflets et un arrondi : le rectangle de jeu est volontairement inscrit à l'intérieur de ces bords.

```gdscript
var fanboy = preload("res://scenes/FanBoy.tscn").instantiate()
add_child(fanboy)
# Si l'instanciation n'a pas encore exécuté _ready : await fanboy.ready
fanboy.game_viewport.add_child(preload("res://mon_jeu.tscn").instantiate())
fanboy.button_changed.connect(_on_button)
fanboy.stick_changed.connect(_on_stick)
fanboy.power_changed.connect(_on_power)

func _on_button(action: String, pressed: bool) -> void:
    # a : tir ; b : bombe ; start/select : choix du jeu
    # Appliquer les deux états, y compris false, sans déclencher deux fois.
    pass

func _on_stick(value: Vector2) -> void:
    # Vecteur normalisé, Y positif vers le bas, deadzone 0.12.
    pass

func _on_power(enabled: bool) -> void:
    # Suspendre aussi les systèmes du jeu placés hors du GameViewport.
    pass
```

Le jeu reçoit déjà les événements `InputEventScreenTouch` et `InputEventScreenDrag` dans son propre `_input`. Leur position est locale au sous-écran et leur index conserve l'identité du doigt. Les signaux `screen_touch` et `screen_drag` sont une autre méthode d'intégration : choisir une seule voie pour les actions du jeu afin d'éviter les doublons. Les déplacements hors écran restent capturés jusqu'au relâchement et leurs coordonnées sont limitées au rectangle du jeu. Le stick et chaque pièce mécanique réservent un seul doigt ; plusieurs doigts écran sont admis. L'émulation tactile/souris Godot est désactivée ; une souris de démonstration utilise l'index −1.

## Vie et menace : les valeurs viennent du jeu

```gdscript
fanboy.set_hull_health(vie_vaisseau, vie_max_vaisseau)
fanboy.set_boss_health(vie_boss, vie_max_boss)
fanboy.set_threat(menace_normalisee) # 0..1
```

COQUE et BOSS démarrent à zéro et ne sont jamais remplis automatiquement par le secteur. Maximum nul ou négatif : jauge vide. Les valeurs sont limitées entre zéro et le maximum ; une fraction de cran compte comme un cran visible. Les contours d'origine restent sur la coque. `VIES`, `BOMBES`, le petit champ `BOSS` et `DATA FIELD` restent des inscriptions/champs de l'image : connecter vos propres valeurs si nécessaire.

Menace < 0,33 : vert ; de 0,33 à 0,67 : orange ; à partir de 0,67 : rouge. Transition colorée amortie. Le niveau doit appeler `set_threat` selon ses ennemis, projectiles ou événements. La démo associe seulement les secteurs 1/2/3 à ces trois couleurs pour les montrer. OFF éteint les LED même si la menace est critique ; ON rétablit la couleur correspondant à la dernière menace, avec montée lumineuse. Les pixels bleus des zones de rails ont été isolés par masque de couleur ; les autres inscriptions ne changent pas de couleur.

## Animation et synchronisation

Le signal de commande, la pression visuelle et le son partent du même changement d'état. Enfoncement : 45 ms, déplacement de 3 pixels source, échelle 0,965. Relâchement : 85 ms. Le bouton reste enfoncé tant que le doigt reste dans sa zone ; sortir libère la commande, rentrer la réactive. L'appartenance au doigt reste réservée jusqu'au relâchement.

Stick : rayon de commande 72 pixels, déplacement visuel maximal 17 pixels, retour 120 ms. Le déplacement suit les coordonnées absolues du doigt autour du centre fixe ; ajuster ces paramètres après essai ergonomique sur téléphone. Interrupteur : glissement vertical, seuil 7 pixels, course 18 pixels ; un tap inverse l'état. Annulation système ou perte de focus : libération de toutes les commandes, retour du stick, pas de changement d'alimentation involontaire.

L'alimentation coupe les entrées du sous-écran, ses processus et son affichage. Les systèmes globaux/autoloads ne sont pas suspendus automatiquement. Les sons sont lancés dans la même trame que l'état logique ; la latence audio réelle dépend du téléphone. Haptique optionnelle, désactivée par défaut.

## Fidélité et limites des couches

La décomposition initiale utilise des masques complémentaires sans rééchantillonnage : sa recomposition est vérifiée identique pixel par pixel à l'original. `docs/rest_reconstruction.png` archive cette preuve avant les modifications demandées des jauges et LED. L'image d'origine contient une incohérence : A gravé sur le bouton rouge mais B imprimé près de lui, B gravé sur le doré mais A près de lui. Les commandes suivent les gravures ; la typographie source est conservée.

Les fonds cachés ne sont pas observables depuis une seule image. `hidden_sockets.png` est une reconstruction cohérente via imagegen, recalée à la définition source, utilisée seulement derrière les ouvertures. Elle ne remplace jamais la coque visible. La segmentation des capuchons suit des ellipses et rectangles arrondis, et comprend donc certains reflets de bord ; elle ne constitue pas une séparation physique parfaite. Le mouvement est limité pour réduire les artefacts de jonction. Le détourage extérieur noir de l'image est conservé.

Les crans initialement remplis ont été vidés en copiant l'intérieur de crans vides de la même image. Le calque de rails lumineux et la LED sont teintés par shader. Ces modifications intentionnelles sont les exceptions à la fidélité stricte des pixels de coque. Les surfaces générées et ces transformations ne créent pas de vrais détails 3D ni de reflets physiques.

## Mobile et validation

Mise à l'échelle uniforme en portrait, centrage et bandes noires si nécessaire ; prise en compte de la zone sûre disponible sur mobile. Pas d'étirement de la coque. Import PNG sans perte, filtrage linéaire pour les tailles fractionnaires. L'affichage exact pixel pour pixel vaut à l'échelle 1 ; tout écran d'une autre définition implique un filtrage. Le projet utilise le renderer Compatibility et n'emploie aucun calcul 3D.

Voir `docs/test_report.json` pour le nombre et le résultat des assertions réellement exécutées. Relancer :

```text
godot --headless --path . --editor --import --quit
godot --headless --path . --script res://tests/test_fanboy.gd
```

Les tests simulent les entrées et vérifient l'alignement des pivots, les états press/release, les animations, les 360 directions, quatre doigts simultanés, l'indépendance écran/commandes, la perte de focus, l'alimentation, les jauges et LED, ainsi que quatre formats portrait. Ils ne remplacent pas une mesure physique sur Android/iOS. Avant publication : essayer au moins trois doigts simultanés sur appareil réel, les interruptions système, les encoches/barres système, le son et le confort des touches à la taille cible. La petite taille physique de START/SELECT peut nécessiter une zone tactile plus généreuse selon le téléphone.

Le pack est un projet source à intégrer, pas un APK/IPA signé. Configurer les modèles d'export et SDK de votre version de Godot pour Android/iOS. Aucun export mobile ni test sur téléphone physique n'est revendiqué.

## Provenance

Image Fanboy fournie par l'utilisateur ; ses droits restent ceux de sa source. Scripts et sons créés pour cette livraison. La reconstruction des fonds cachés a été produite avec l'outil imagegen intégré. Le prompt de restauration est archivé dans `docs/asset_provenance.txt`.
