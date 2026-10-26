# Validation de la première tranche native du secteur 1

Date : 26 octobre 2026. Base native : `b202d02`. Source web figée :
`ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057`. Godot **4.6 stable officiel Linux**.
Aucune archive V6/V7 n'a été utilisée.

## Contrôles exécutés

| Suite | Résultat | Ce que cela établit |
|---|---:|---|
| `native/tests/core.gd` | 40/40 | Régression du socle : sauvegarde, transitions, temps et doigts |
| `native/tests/sector1.gd` | 39/39 | Vagues, tirs, bombes, collisions, vies, boss, victoire et chargement des médias |
| `native/tests/presentation.gd` | 34/34 | Scène native, passage accueil/briefing/jeu/pause, cadrage, gestes raccordés |
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
| Décor | Dessins originaux cuits, 4 graines par élément ; dimensions et animations procédurales encore partielles |
| Simulation | Parcours complet jouable ; formations choisies par RNG Godot, donc pas un replay identique du RNG web |
| Son | Notes source extraites ; synthèse PCM approchée, pas d'écoute comparative validée |
| Menus / dialogues | Accueil/briefing/pause/victoire provisoires ; menus et dialogues finaux non recréés |
| Récompenses | Gains simples persistés une fois ; drops, matériaux, graze, surcharge et statistiques incomplets |
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
3. Aligner formations et RNG, drops, matériaux, récolte finale, statistiques,
   graze et surcharge ; mesurer timings/dégâts sur les deux versions.
4. Recréer le briefing, les dialogues et les transitions source ; comparer
   les musiques, effets et voix à l'écoute.
5. Tester sur clavier/souris, manette réelle et Android. Exporter et tester
   séparément PC/Android ; intégrer et tester OpenXR/Quest ensuite.

Aucun export de distribution, certificat, résultat Meta Store ou niveau de
qualité commercial n'est établi par cette validation.
