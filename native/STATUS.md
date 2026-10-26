# Recréation native Godot — état réel

La recréation complète n'est PAS terminée. La branche contient désormais une
**première tranche du secteur 1 jouable nativement**, lancée par la scène
`native/scenes/sector1.tscn`. Le combat va des vagues à la victoire après le boss.
Les 23 autres secteurs, les menus définitifs et les systèmes de campagne restent
à recréer. La parité visuelle, sonore et ludique intégrale n'est pas validée.
Ce n'est pas une version commercialisable, un APK ou un candidat Meta Store.

## Fidélité du secteur 1 — reprise après a70ff92

- Collecte : puissances, boucliers, soins, bombes, COINS et trois matériaux,
  y compris conversions en score lorsque l'inventaire est plein. **13 cas natifs
  correspondent aux résultats de la fonction `collect()` JavaScript d'origine**.
- Les matériaux collectés sont sauvegardés immédiatement et ne sont pas
  crédités une seconde fois à la fin de mission.
- Récolte : conversion des tirs et ennemis survivants dès la mort du boss,
  pluie de bonus, aimant global puis récupération automatique des restes à 6,4 s.
- Frôlement : score une fois par projectile, jauge et surcharge automatique
  après 90 frôlements, dégâts et invulnérabilité sans consommation de bombe.
- Objets : réactions en chaîne des barils, score avec multiplicateur de combo,
  butin des modules et des caisses alignés sur les règles de base source.
- Décors : 96 variantes de taille/graine, chacune avec quatre échantillons
  d'animation source. La pondération des types reste indépendante du nombre
  de variantes ; aucune mise à l'échelle des sprites cuits.
- Visuel : pièces avec rotation et symboles, silhouettes propres aux matériaux,
  projectiles ennemis fléchés avec direction et pulsation. Atlas : **726 poses**.
- Vérification actuelle : **145 contrôles réussis** (40 socle, 39 secteur,
  37 présentation/persistance, 29 récompenses/règles, dont les 13 comparaisons JS).
  Le secteur se termine toujours avec les vrais tirs dans le replay de test.

La comparaison navigateur/native reste à réaliser. Les angles des tirs sont
échantillonnés sur 16 directions ; les décors utilisent des tailles préréglées
et quatre images d'animation par seconde. L'apparition/scintillement des bonus,
les effets d'impact, les boosts/flashs du Falcon, le ghost LCD et la mise en
scène restent partiels. Les règles correspondent au vaisseau/équipement de
départ : progression, améliorations, achats et modes spéciaux ne sont pas
encore raccordés. Aucune parité intégrale ou validation commerciale annoncée.

## Reprise après b202d02 — 26 octobre 2026

- Simulation native : déplacement, tir, 12 vagues, mini-gardien, boss à trois
  phases, collisions, invulnérabilité, vies, bombes, objets et récolte.
- Affichage natif : champ logique 480 × 860, raster 160 × 287, coque FanBoy FX
  et HUD extérieur, poses Falcon et variantes mobiles à facteur 1,22.
- Atlas : 190 poses issues de la source ; ancrages explicites, interpolation nearest.
- Entrées raccordées : clavier, souris, stick manette, glissement relatif et
  boutons tactiles ; pause et annulation des entrées à la perte de focus.
- Audio : notes originales de la puce du secteur et du boss, rendues en PCM ;
  bruit/enveloppes/filtrage à comparer à l'écoute, pas de parité audio annoncée.
- Vérification : 40 contrôles du socle + 39 du secteur + 34 de présentation,
  soit **113 contrôles réussis** sous Godot 4.6 stable Linux.
- Un pilote de test invulnérable termine toutes les vagues et le boss en utilisant
  les vrais tirs de départ. Ce test prouve le parcours, pas la difficulté humaine.
- Captures OpenGL logiciel (Mesa) dans `native/tests/captures/` ; rendu natif
  inspecté visuellement. Aucune comparaison au pixel près avec le navigateur.

**Écarts relevés au commit a70ff92 (historique) :** décors de tailles fixes et animations partielles,
choix des formations dans un RNG natif, effets de tir/impact et pickups simplifiés,
rémanence LCD non reproduite, dialogues et mise en scène incomplets, menus provisoires,
économie et récompenses partielles. Le graze, la surcharge et certaines statistiques
ne sont pas encore raccordés. Le rendu du shader verre est une approximation du
module 51, pas une mesure d'équivalence de sortie.

L'étape suivante consiste à fermer ces écarts et comparer des captures/mesures
synchronisées PC et mobile à la référence web avant d'étendre au secteur 2.
Détails : `native/sector1/README.md`, `native/tests/SECTOR1_VALIDATION.md`.

## Source imposée

- Dépôt : https://github.com/JacquesBV/Neo-vanguard
- Commit de référence : `ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057`.
- Référence prise directement sur le dépôt courant le 26 octobre 2026.
- Les archives Godot V6, V6.1 et V7 ne constituent pas la base de cette recréation.
- Les fichiers du jeu web restent inchangés ; les ressources existantes sont partagées.
- Les fichiers JavaScript restent la référence et ne sont pas exécutés par Godot.
- L'outil Node est un outil de développement qui extrait des données, pas un moteur embarqué.

## Livré dans ce premier commit

| Élément | Résultat |
|---|---|
| Empreintes de la source | 1 087 fichiers, 454 331 789 octets, SHA-256 par fichier |
| Catalogue | 24 secteurs et affectations des 24 boss, 6 générations, 7 vaisseaux |
| Données conservées | Statistiques, catalogues boutique, palettes, intro, atlas, animations, options |
| Musique | Catalogue original des 31 cassettes conservé comme données |
| Sauvegarde native | Écriture temporaire puis remplacement, fusion profonde, rejet des données corrompues |
| États de session | Machine d'états, un seul temps de simulation, pause et abandon des événements de mission |
| Entrées tactiles | Attribution explicite des doigts, glissement relatif à l'échelle, rebond immédiat aux bords |
| Validation | 40 vérifications du socle réussies avec Godot 4.6 stable Linux, en mode headless |
| Import des médias | 817 images (PNG, JPEG, WebP, SVG) et 146 fichiers audio (MP3, WAV, OGG), chargés sans échec par Godot |

Les proportions, le cadrage, les dimensions relatives des acteurs et du HUD,
la netteté et les effets visuels font partie des critères de fidélité exigés.
L'import réussi ne prouve pas que la composition finale est identique.
Les 963 fichiers `.import` conservent les réglages d'import Godot ; les caches
binaires `.godot` ne sont pas versionnés. Les 3 fichiers WebM de la source
ne sont pas inclus dans ce contrôle image/audio.

## Matrice de fidélité

Les données extraites ne prouvent pas une fonctionnalité jouable. Aucun élément
de cette matrice n'a encore reçu une validation de parité visuelle et ludique.

| Système | Référence source | Implémentation native / validation restante |
|---|---|---|
| Campagne, progression, niveaux | `js/02-moteur-jeu.js` | Données extraites ; simulation des 24 secteurs à refaire |
| Ennemis, formations, collisions | Moteur, `js/15-*`, `js/48-*` | À recréer et tester secteur par secteur |
| Boss et transformations | Moteur, `js/14-*` à `js/20-*`, `js/46-*` | Atlas extrait ; logique, poses et collisions à recréer |
| Secteur 24 | `js/29-*`, `level24-v2/`, `assets/level24*` | Sas, corridor, mains, Vorax et finale à recréer |
| Joueurs et armements | Moteur, `js/33-*`, `js/34-*`, `js/39-*` | Données originales extraites ; comportement et dessin à recréer |
| Décors et parallaxes | Moteur, `js/10-*`, ressources par secteur | Reconstruction exacte de l'ordre des couches à faire |
| Rendus de consoles | Moteur, `js/07-*`, `js/11-*`, `js/24-*`, `js/51-*` | Palettes et résolutions extraites ; shaders et coque à refaire |
| HUD PC / mobile | Moteur, `js/22-*`, `js/35-*`, `js/51-*` | À recréer avec cadrage et animations identiques |
| Clavier, souris, manettes | Moteur et `js/51-*` | Routage natif et configuration à implémenter |
| Tactile | Moteur et `js/51-*` | Gestion des doigts testée isolément ; raccordement au gameplay restant |
| Titres, menus, aide, records | HTML/CSS, `js/25-*` à `js/28-*`, `js/42-*`, `js/44-*` | À recréer, y compris focus, navigation et langues |
| Options | `defaultSave.opts`, `js/25-*` | 41 valeurs initiales conservées ; widgets et effets à raccorder |
| Intro, transitions, fin | Moteur, `js/06-*`, `js/45-*`, médias | Texte et références extraits ; mise en scène à recréer |
| Boutiques, matériaux, négociation | Moteur, `js/27-*`, `js/28-*` | Catalogues extraits ; transactions et présentation à recréer |
| Neo-Vanguard FM | `js/30-*` à `js/41-*`, `js/49-*` | 31 entrées extraites ; lecteur et meuble à recréer |
| Musique, sons, voix | `Audio2`, fichiers audio, `js/40-*` | Lecteur, synthèse des sons et voix à recréer ; écoute comparative restante |
| Codes et tickets | Moteur, `js/47-*`, `pinball/pinball.js` | Table des codes de base extraite ; effets et surcharges finales à recréer |
| Flipper Néon Orbit | `pinball/engine.js`, `pinball/pinball.js` | Physique, économie et rendu à recréer nativement |
| Coopération locale | Moteur, commandes du deuxième joueur | Simulation et interface à recréer |
| Coopération en ligne | Moteur, MQTT/WebSocket, hôte autoritaire | Protocole, snapshots et interpolation à recréer ; test réel à deux requis |
| Sauvegarde | `defaultSave`, `loadSave`, scripts de déverrouillage | Noyau natif testé ; toutes les extensions source à auditer avant migration |
| PC | Jeu natif, présentation PC | Scènes, export Windows/Linux et contrôles à terminer |
| Mobile | Jeu natif, présentation mobile | Scènes, export Android, reprise et essais appareil à terminer |
| Meta Quest VR | Nouveau support demandé | Présentation 2D dans un espace VR retenue comme hypothèse ; OpenXR, contrôleurs et tests casque à implémenter |

## Validation effectuée

```
node native/tools/extract_reference.cjs
godot --headless --path . --script native/tests/core.gd
godot --headless --editor --path . --import
godot --headless --path . --script native/tests/assets.gd
```

Résultat : 40 vérifications, zéro échec. Les tests contrôlent les limites du
temps de simulation, la pause et la perte de focus, l'annulation d'attaques
après changement de mission, les sauvegardes altérées et anciennes, et les
gestes multitouch avec relâchement indépendant.
Le contrôle d'intégration des médias charge les 817 textures et 146 flux audio,
vérifie leurs dimensions ou leur durée et relève zéro échec. Il ne vérifie ni
leur composition à l'écran, ni leur lecture en situation de jeu.

Cette section décrit la validation du commit initial b202d02. Depuis, des tests
de combat et de scène ainsi que des captures natives ont été ajoutés (voir la
section de reprise ci-dessus). Toujours aucune comparaison navigateur/native
synchronisée, écoute comparative, session réseau à deux ou export PC/Android/Quest.

## Critères pour annoncer une version complète

1. Rejouer les 24 secteurs dans la référence et le jeu natif avec des entrées
   comparables ; comparer scènes, vitesses, dégâts, collisions et récompenses.
2. Comparer les menus, intro, fin, animations, tous les rendus de consoles et
   les deux présentations PC/mobile à résolutions fixes.
3. Contrôler les 31 cassettes, musique de chaque boss, sons et voix.
4. Valider tous les achats, reventes, codes, tickets, sauvegardes et bonus.
5. Tester réellement la coopération locale et distante, y compris perte de connexion.
6. Produire et lancer les exports sur les supports visés ; tester la VR dans
   le casque et terminer les exigences de distribution Meta applicables.

## Documentation XR consultée

- https://docs.godotengine.org/en/4.6/tutorials/xr/deploying_to_android.html
- https://docs.godotengine.org/en/stable/tutorials/xr/setting_up_xr.html

Ces documents décrivent OpenXR et l'export. Ils ne constituent pas une
validation de ce projet ou une acceptation par le Meta Store.
