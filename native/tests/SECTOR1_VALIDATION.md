# Validation de la première tranche native du secteur 1

Date : 26 octobre 2026. Base native : `b202d02`. Source web figée :
`ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057`. Godot **4.6 stable officiel Linux**.

Validation mise à jour après a70ff92 : **145 contrôles réussis**.
Aucune archive V6/V7 n'a été utilisée.

## Contrôles exécutés

| Suite | Résultat | Ce que cela établit |
|---|---:|---|
| `native/tests/core.gd` | 40/40 | Régression du socle : sauvegarde, transitions, temps et doigts |
| `native/tests/sector1.gd` | 39/39 | Vagues, tirs, bombes, collisions, vies, boss, victoire et chargement des médias |
| `native/tests/presentation.gd` | 37/37 | Scène native, passage accueil/briefing/jeu/pause, cadrage, gestes raccordés |
| `native/tests/rewards.gd` | 29/29 | 13 cas de collecte calculés par la fonction JS source, récolte, frôlements, surcharge et réactions en chaîne |
| Import éditeur | Réussi | Atlas PNG, WAV et scripts/scène importables |
| Rendu OpenGL | Réussi | Scène réellement rendue par Godot, Mesa llvmpipe, captures PC et mobile simulé |

Les tests couvrent la première vague à 2,2 s, l'absence de tir automatique au
repos, la suppression des projectiles avec leur tireur, l'immunité hors champ,
les dégâts au boss à multiplicateur 3,2, la bombe à 286 dégâts au boss, les vies,
la réapparition et la transformation. Un pilote automatisé **invulnérable pour
le test** termine tout le secteur en utilisant les vrais tirs d'impulsion.
Aucun mode d'invulnérabilité n'est activé en partie normale.

Les dimensions d'affichage testées sont 320×568, 390×844, 412×915 et 1440×1000,
avec les deux présentations. Les tests injectent les événements de doigt dans
la scène ; ils ne constituent pas des essais matériels Android/manette/Quest.
Les captures de boss emploient un placement de test direct pour inspecter
l'atlas et la jauge, et ne prouvent pas que la mission a été jouée à la main.

## Fidélité vérifiée et limites

| Élément | État réel |
|---|---|
| Champ et raster | 480×860 unités, 160×287 pixels ; facteur entier quand possible |
| Coque / images | Atlas original partagé ; mise en page native inspirée directement du module 51 |
| Falcon | 5 inclinaisons × 4 images, poses PC/mobile distinctes ; boost et flash spécifiques restant à compléter |
| Boss | 22 régions originales, ancrages et échelle extraits ; sélection de poses native partielle |
| Décor | 96 variantes taille/graine × 4 images ; dimensions continues et fréquence d’animation encore partielles |
| Simulation | Parcours complet jouable ; formations choisies par RNG Godot, donc pas un replay identique du RNG web |
| Son | Notes source extraites ; synthèse PCM approchée, pas d'écoute comparative validée |
| Menus / dialogues | Accueil/briefing/pause/victoire provisoires ; menus et dialogues finaux non recréés |
| Récompenses | Collecte de départ vérifiée sur 13 résultats source ; matériaux persistés, récolte, graze, surcharge et barils raccordés ; équipements améliorés et statistiques avancées restent ouverts |
| LCD | Palette et raster conservés ; verre approximatif, rémanence/ghost et flashes à fermer |

L'extraction de sprites utilise `@napi-rs/canvas` hors ligne, **pas Chromium**.
Une différence de rasterisation Canvas/Skia face au navigateur peut subsister.
L'image finale doit être comparée au jeu web à temps/entrées équivalents avant
d'annoncer une identité visuelle. Les captures jointes sont celles du rendu
Godot seulement, pas un comparatif A/B validé.

## À faire avant validation de parité du secteur 1

1. Comparer référence web/native à états synchronisés (PC et mobile), corriger
   les différences de couches, tailles, ancrages, contours et palette.
2. Porter toutes les dimensions et animations des décors, projectiles, objets,
   effets, boosts/impacts du Falcon et morphismes du boss.
3. Aligner formations et RNG ; compléter améliorations/équipements et statistiques ;
   comparer timings/dégâts/drops sur les deux versions.
4. Recréer le briefing, les dialogues et les transitions source ; comparer
   les musiques, effets et voix à l'écoute.
5. Tester sur clavier/souris, manette réelle et Android. Exporter et tester
   séparément PC/Android ; intégrer et tester OpenXR/Quest ensuite.

Aucun export de distribution, certificat, résultat Meta Store ou niveau de
qualité commercial n'est établi par cette validation.

## Capture ajoutée

`captures/mobile-rewards-projectiles.png` est une capture OpenGL Godot à 390×844,
avec boss et ramassables placés par des arguments de test pour inspecter les
silhouettes, les tirs, la rotation et le cadrage. Elle n'est pas un parcours manuel
complet ni une capture du jeu web.

Les attentes des 13 cas de collecte sont recalculées par l'extracteur à partir
**du corps original de la fonction JavaScript**. Les tests Godot ne fabriquent
pas leurs résultats attendus en recopiant l'implémentation GDScript.
