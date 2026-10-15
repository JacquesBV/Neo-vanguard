# NEO VANGUARD — shoot them up vertical à moteur graphique évolutif

Jeu complet dans **un seul fichier `index.html`** — aucun asset externe, aucune requête réseau :
**tous les sprites, décors, palettes, musiques et bruitages sont générés par le code** au démarrage
(pixel-art procédural, séquenceur chiptune, synthèse WebAudio). Le moteur de présentation WebGL 2
(PixiJS v8 minifié, 394 Ko) est **inliné dans le fichier** : le jeu s'ouvre hors ligne, et depuis
GitHub Pages il ne charge rien d'autre que la page elle-même.

## Moteur graphique : WebGL 2 (PixiJS v8), repli 2D automatique

Le dessin reste **procédural en canvas 2D** — c'est lui qui fabrique les sprites, les décors et les
palettes de chaque génération. Sa sortie est envoyée au GPU comme texture, et **tout le
post-traitement est exécuté dans un shader unique** (une passe, un quad) :

- **bloom HDR additif** : seuil de luminance (`ColorMatrixFilter`) puis flou gaussien multi-passes,
  composé en `add` par-dessus l'image ;
- **aberration chromatique** radiale (les bords séparent les canaux) ;
- **onde de choc** : les gros impacts déclenchent un anneau de distorsion centré sur le vaisseau ;
- **courbure cathodique** (option CRT), **scanlines** à la période exacte de l'écran, **vignette** et
  **grain** de film ;
- tous ces effets sont **masqués au terrain de jeu** (uniform `uPF`) : le HUD et les panneaux
  latéraux restent nets, les effets ne bavent jamais dessus.

**Qualité automatique.** Si l'image dépasse 24 ms, le halo descend en résolution réduite, puis en
palier de secours ; si elle reste au-dessus de 33 ms même en secours, le mode **AUTO rend la main au
canevas 2D** (message à l'écran). Le choix explicite de l'utilisateur n'est jamais contredit :
Options ▸ **Moteur de rendu** = AUTO / GPU / 2D, avec l'état du moteur affiché en direct (palier et
images par seconde du GPU). Le canvas WebGL est retiré du DOM quand on repasse en 2D, et réattaché
au retour — la bascule est instantanée, en pleine partie.

Mesures sur le secteur 4 (489×876 px, Chrome headless, **rastériseur logiciel SwiftShader** : la
partie GPU y est donc très pessimiste) :

| Chemin de rendu | Temps par image |
|---|---|
| Canevas 2D sans post-traitement (ce qui reste au CPU en mode GPU) | **2,57 ms** |
| Chemin 2D historique complet (bloom + aberration + vignette CPU) | **13,11 ms** |
| Post-traitement GPU mesuré en SwiftShader | 207 ms (remplissage logiciel : ÷4 sur les pixels ⇒ ×3,5 de vitesse ; quelques ms sur un vrai GPU) |

Autrement dit : **10,15 ms par image ont quitté le CPU**, et ce qui reste côté GPU est du remplissage
d'écran, pas du JavaScript. La régression complète (7 vaisseaux × 4 secteurs, boss, fin de campagne)
passe par les deux chemins avec **0 exception de rendu et 0 erreur JS**, et le mode 2D reste
strictement identique à la version précédente.

## Le concept : 4 secteurs, 4 générations de consoles

Le moteur de rendu, les sprites, les décors **et la bande-son** changent complètement à chaque secteur.

| Secteur | Génération | Graphismes | Décors | Audio |
|---|---|---|---|---|
| **1** | **Game Boy / NES / Master System** | 160×144, **4 teintes strictes** de la DMG-01, gros pixels, silhouettes simplifiées, ombres portées pixel | Station en coupe vue de dessus : dalles, plaques rivetées, conduites, baies techniques, docks, grues, grilles de ventilation, bandes de danger, hublots, couloirs de descente à lèvre métallique | 124 BPM en **la mineur**, 2 canaux d'onde carrée + bruit blanc, zéro reverb |
| **2** | **8-bit étendu (NES / SMS)** | 256×224, 16 couleurs, sprites plus détaillés (ailes, verrières, réacteurs), premières transparences | Station dense : panneaux éclairés, poutrelles de premier plan, champs d'astéroïdes | 140 BPM en **ré mineur**, triangle NES pour la basse, arpèges, batterie bruit, écho léger |
| **3** | **16-bit (Super NES / Mega Drive)** | 320×240, palette large, ombrage lissé, lisérés néon, halos additifs | Espace profond : nébuleuses, mégatours éclairées, passerelles, anneaux orbitaux, hologrammes, cristaux, poutrelles floues au premier plan | 150 BPM en **fa# mineur**, basse FM, lead vibrato, nappes, arpèges 16es, delay |
| **4** | **HD — rendu vectoriel temps réel** | Vectoriel lissé (polygones + dégradés), bloom double passe, aberration chromatique, vignette, ombres, 2000 particules, ondes de choc | Mégastructures néon complexes, anneaux géants en rotation, cristaux lumineux, profondeur de champ (premier plan flouté) | 162 BPM en **mi mineur**, super-saw, sub-basse, nappes filtrées, **réverbe à convolution**, sidechain, stéréo |

Chaque secteur apporte aussi **de vrais nouveaux sprites pour tout le monde** : vaisseaux, 9 types
d'ennemis et les 4 boss sont re-dessinés d'un cran de détail à chaque ère (des plaques et des
pièces apparaissent même à partir du secteur 2 et 3 : un même vaisseau gagne des ailerons, des
canons, des halos en montant en génération).

## Transitions cinématiques entre générations

Le passage d'un secteur à l'autre est mis en scène : le vaisseau monte en vitesse (lignes
radiales, défilement accéléré), puis **le monde de l'ancienne génération est capturé et s'effeuille
en volets alternés qui partent du centre**, tandis que la nouvelle génération s'installe en direct
(bascule CRT, onde de choc, thème et musique du nouveau moteur). Le bandeau d'ère s'affiche
par-dessus. Une touche ou un clic passe la transition.

Elle est aussi utilisée **au lancement d'une partie** : depuis le menu titre en HD, appuyer sur
« Jouer » déclenche le saut vers la Game Boy — le concept du jeu se montre dès la première seconde.

## Contenu

- **4 secteurs + 4 boss multi-phases** : Goliath-Prime, Warden-7 (bras rotatifs), Hydra-Nexus
  (3 têtes destructibles), Omega-Vector (anneaux, téléportation, rayons). La campagne se termine
  par l'écran **Système neutralisé**.
- **Décor destructible** : caisses de fret, barils explosifs (réaction en chaîne qui endommage les
  ennemis proches) et modules de ravitaillement à butin garanti dérivent dans le couloir. Ils se
  détruisent au tir, rapportent score et crédits, et changent de sprite selon l'ère.
- **9 types d'ennemis** : drones, stingers, coureurs, tourelles, boucliers rotatifs, diviseurs,
  essaims, porteurs (qui libèrent des nuées), élites + un mini-boss à mi-secteur.
- **7 chasseurs d'arcade** dessinés à l'école UN Squadron / Axelay / Alpha Mission II :
  nez effilé, verrière en goutte, voilures delta, **pods d'arme en bout d'aile**, canards,
  dérives jumelles et tuyères cerclées. Chacun est **re-rastérisé pour les 4 générations**
  (voir `apercu-vaisseaux.png`) :

  | Vaisseau | Rôle | Prix | Signature |
  |---|---|---|---|
  | **VANGUARD MK-I** | polyvalent | — | le vaisseau du joueur (voir la section dédiée) |
  | **FALCON-A « MARTEAU »** | assaut lourd | 1 250 CR | nacelles jumelles, +1 bouclier, collisions −25 % |
  | **FALCON-B « LAME »** | interception | 1 050 CR | ailes en mouette, cadence +18 %, esquive 8 % |
  | **VIPÈRE** | intercepteur | 450 CR | aiguille rapide, esquive 15 % |
  | **TITAN** | forteresse | 950 CR | blindé, collisions ÷2 |
  | **SPECTRE** | furtif | 1 700 CR | aile volante, tirs perforants |
  | **SINGULARIS** | prototype | 3 200 CR | amiral : +1 drone, bouclier régénérant |
- **5 armes**, **10 équipements améliorables**, bombes, 6 livrées
  (elles changent aussi **toute la palette Game Boy**), 4 traînées, 5 auras.
- **Options** : volumes, secousses, difficulté (Cadet/Pilote/As), annonces vocales, visée souris,
  tir automatique, FPS, lissage HD, scanlines CRT, aperçu graphique, plein écran, reset.
- **Qualité adaptative** : si la machine faiblit, le jeu réduit les particules, les halos, le bloom,
  puis la résolution interne — sans jamais casser le gameplay. Écran FPS activable dans les options.
- **Sauvegarde automatique** (localStorage), avec migration depuis les versions précédentes.

## Secteur 4 : rendu « animé japonais »

Le dernier secteur ne se contente pas d'être de la HD : il emprunte **le langage visuel de
l'animation japonaise**, appliqué à un jeu entièrement procédural.

- **Cel-shading à 3 valeurs** : l'éclairement de chaque pixel est mesuré, puis quantifié en
  bandes franches — ombre, valeur moyenne, lumière. Fini les dégradés 3D.
- **Trait d'encre** : les contours ne sont plus une ombre plus sombre mais un véritable trait
  bleu-noir, comme un encrage de dessin animé.
- **Color script** : les ombres sont refroidies (teinte −16°, saturation +16 %) et les lumières
  réchauffées (+12°) — la recette de base de toute peinture animée.
- **Ciel peint** (toile de 480×1900 cuite une fois) : soleil pâle, **fantômes d'objectif**,
  planète géante avec anneaux, bandes nuageuses, terminateur et limbe lumineux, mégapole
  nocturne à trois plans, bancs de nuages interstellaires — défilé en parallaxe lente.
- **Pétales et braises** portés par le souffle du vol, tournoyant au premier plan.
- **Lignes de vitesse et cadre d'impact** : à chaque accélération ou gros choc, des lignes de
  vitesse radiales et un anneau d'impact net (sans dégradé) envahissent l'écran — le vocabulaire
  classique du « punch » animé.
- **Caméra vivante** : la caméra bascule légèrement sur les gros impacts.

Voir `comparaison-anime.png` : à gauche l'ancien rendu HD, au centre le nouveau, à droite un gros
plan de boss.

## Le vaisseau du joueur : VANGUARD MK-I

Le vaisseau du joueur n'est **pas dessiné à la main** : sa géométrie est **vectorisée directement
depuis la planche fournie** (`uploads/IMG_20261015_074024.jpg`). La planche est mesurée au pixel,
puis convertie en polygones par un vectoriseur (suivi de contour par arêtes orientées,
simplification de Douglas-Peucker, échelle métrique exacte). Résultat : 122 formes fermées,
2 260 sommets, **IoU 0,991** avec la silhouette de la planche.

Les masses de la planche deviennent des **matières** du moteur :

| Matière | Ce qu'elle porte dans la planche |
|---|---|
| `HULL` | la coque claire (l'ensemble de la silhouette) |
| `WING` | les volumes en demi-teinte |
| `DARK` | les panneaux sombres |
| `INK` | les nervures et l'encrage (trait quasi noir dans toutes les ères) |
| `MARK` | le marquage d'escadrille rouge (bande + chevron, reste rouge quelle que soit la livrée) |
| `GLASS` | les panneaux cyan de la verrière (cyan fixe) |

Détails relevés sur la planche : nez long et effilé, bande rouge à chevron sur l'épine,
**cockpit losangé** (veau rouge entre deux joues cyan), flancs nervurés, **moyeu circulaire central**,
ailes basses finissant en mâts d'antenne à disques, deux nacelles latérales et une queue centrale.
Les **trois tuyères** (queue + les deux nacelles) sont elles aussi relevées sur la planche
(`EXH.falcon`), tout comme la position de la verrière (`CKPT.falcon`).

La géométrie est régénérée par script, jamais retouchée à la main : le bloc `falcon:` de
`src/game.js` est la sortie brute du vectoriseur.

## Livrées : la coque change avec la génération

La livrée d'usine **ESCADRILLE** est la livrée par défaut : coque **gris-blanc**, **bande rouge**
d'insigne et **verrière cyan**, relevées sur la planche de référence. Elle ne s'applique qu'à partir
du **secteur 2** — au secteur 1, le vaisseau est peint avec les **4 tons Game Boy**, donc vert, comme
tout l'écran (c'est l'ère qui l'impose, pas la livrée). Passé la Game Boy, plus aucune trace du vert :
les obus, les réacteurs, le halo de verrière et le bouclier prennent eux aussi le **cyan** de la
planche, tandis que les ennemis gardent la palette de leur génération.

Les 5 autres livrées du magasin (FORÊT DMG, POCKET, AMBRE CRT, AZUR, PLASMA, QUANTUM) fonctionnent
comme avant : elles teintent la coque **et** les accents du joueur, dans toutes les ères, et leur
rampe de 4 tons définit la palette complète du secteur Game Boy. Une sauvegarde antérieure qui
portait encore le vert par défaut bascule toute seule sur ESCADRILLE (une seule fois, et seulement
si la livrée n'avait pas été changée à la main).

## Refonte artistique : boss, bonus, décors

Tout le jeu est redessiné par la même chaîne : une silhouette (polygones normalisés) est
**rasterisée** à la définition de la génération, ombrée, puis **tramée** — c'est ce tramage ordonné
qui donne le grain des machines 8 et 16 bits. Trois couches ont été reprises de fond en comble.

- **Le moteur d'ombrage.** L'éclairement est calculé en continu (contour, épaisseur du volume,
  lumière du haut, ombre portée du bas), puis quantifié avec **tramage uniquement dans les zones de
  transition** : aplats francs, dégradés en damier sur les volumes. En Game Boy, les demi-teintes
  sont écrasées pour ne garder qu'un liseré tramé — un damier étalé partout transformerait le sprite
  en bouillie. Une passe de **greebles** ajoute, à l'échelle du pixel d'art, lignes de panneaux,
  rivets, grilles de ventilation, bandes de danger et hublots allumés, là où le dessinateur les a
  demandés.
- **Les quatre boss.** Ils sont désormais bâtis comme des maquettes : 45 à 80 pièces chacun (coque,
  pont, proue de danger, sponsons d'armes, baie de lancement à hublots, cheminées, grilles
  d'admission, nervures, réacteurs, quincaillerie, marquage d'escadrille). Le boss ne bouge plus
  seul : **GOLIATH-PRIME** a deux tourelles qui suivent le joueur et reculent au tir, **WARDEN-7**
  balance deux bras articulés à masse et une tourelle de proue, **HYDRA-NEXUS** traîne trois cous à
  maillons ondulants et ouvre son iris sur le noyau quand les têtes tombent, **OMEGA-VECTOR** fait
  tourner trois couronnes de barres blindées et quatre pods. S'y ajoutent fumée de coque qui cède,
  étincelles de phase et flashes d'impact. La définition d'art des boss est passée de 85–187 px à
  **136–425 px** selon la génération.
- **Les écrins de bonus.** Fini le carré plat : collerette métallique, coque, verrière, cœur
  lumineux, quatre boulons, grilles latérales, bande de danger — chaque type a sa teinte (puissance
  or, bouclier cyan, coque verte, crédits jaune, bombe rose). Ils **tournent sur eux-mêmes**, le
  glyphe disparaît quand l'écrin présente son dos, ils projettent une **ombre au sol**, scintillent
  pour se faire repérer et laissent une **traînée fantôme** quand l'aimant les aspire.
- **Les niveaux.** La plaque de métal qui sert de brique à tout le décor est passée de 3 à **5 tons
  avec chanfreins tramés** ; le décor est **deux fois plus dense** (11 structures de sol au lieu de
  6, cadences de spawn presque doublées) ; les fonds 8/16 bits reçoivent un **damier de deux teintes
  voisines** et un clin d'œil de bandes horizontales façon HDMA ; une **plateforme à tapis roulant**
  animée ponctue le sol.
- **Le Game Boy.** Détails à l'échelle de la DMG : les dalles de la station passent à 64 unités
  (16 px d'art, soit deux tuiles) et reçoivent plaques rivetées, grilles, biseaux et tirants d'un
  pixel d'art, comme un plan de station en 4 teintes.

## Pack graphique : l'image, la lumière, le vaisseau

Trois chantiers, mesurés à l'image moteur (captures 1:1 dans les aperçus).

- **Le vaisseau du joueur perd encore 26 %** (98 → 72 px, soit 8,4 % de la hauteur
  d'écran ; deux passes au total : 136 → 98 → 72). La zone de tir gagnée revient au
  joueur : hitbox ramenée de 8 à 6 px, anneau de bouclier de 46 à 34, escorte de
  drones resserrée. Aucun autre changement de gameplay : c'est la même puissance de
  feu dans un chasseur plus nerveux à lire.
- **Étalonnage par génération.** Chaque ère a maintenant sa courbe, appliquée dans le
  shader GPU : saturation, contraste, gamma, ombres refroidies et blancs réchauffés.
  La Game Boy reste brute, le 16 bits gagne en piqué, la HD prend une couleur de
  cinéma d'animation. Le repli 2D reçoit une approximation par composition.
- **Éclairage dynamique.** Chaque particule lumineuse (explosion, impact, réacteur,
  tir de boss) dépose une source dans un anneau de 40 entrées ; ces sources sont
  cuites dans un calque au quart de la résolution puis **ajoutées** à l'image.
  Une explosion éclaire réellement le sol et la coque autour d'elle — et le halo
  « bokeh » plat a été remplacé par une décroissance douce.
- **Rayons de lumière et profondeur de champ.** Cinq nappes de lumière traversent l'ère HD.
  Elles partent du **soleil peint dans le ciel** — donc de sa position réelle à l'écran, qui
  défile — et s'éteignent quand il sort du champ : plantées au centre haut, elles lisaient
  comme un projecteur de studio. Les calques lointains sont agrandis en lissé, ce qui détache
  l'action du décor au lieu de la noyer.
- **Vie de la coque.** Un reflet solaire balaie le fuselage (masqué par la silhouette
  exacte du sprite, donc il ne déborde jamais), les feux de navigation clignotent
  rouge à bâbord et vert à tribord, et sous 34 % de coque le vaisseau fume et crache
  des étincelles.
- **Définition HD ×1,28** : les buffers de l'ère 4 passent de 1,25 à **1,6 px par unité
  logique** (768×1376), avec trois paliers automatiques (1,60 / 1,25 / 0,96) selon la
  cadence mesurée — le trait vectoriel devient net sans risquer la fluidité.
- **Sprites 8/16 bits.** Un **filtre médian des tons** (2 passes en Game Boy, 1 en 16
  bits, appliqué aussi aux boss) remplace le moucheté par des bandes franches : c'est
  la différence entre un sprite qui se lit et un sprite bruité.
- **Moteur d'ombrage revu** pour tout ce qui est cuit : liséré clair, biseau à 5 tons,
  tramage ordonné entre deux tons voisins, greebles choisis un par un au lieu d'être
  tirés au hasard. Les boss, les écrins et les décors en profitent automatiquement.

### Dernière passe : particules GPU, poses cuites, secteur 4 reconquis

- **Particules sur le GPU.** Les débris lumineux ne sont plus dessinés au canevas : ils
  deviennent des **sprites PixiJS en additif**, servis par un pool de 1 800 éléments.
  Le plafond passe de 1 200 à **4 000 particules** (70 / 420 / 1 500 / 3 600 selon la
  génération), et le coût par particule s'écroule : mesuré dans le même environnement,
  l'ère 4 rend en **31 ms** avec les particules GPU contre **38 ms** au canevas. Repli
  automatique sur le canevas si le GPU n'est pas là, avec réduction du plafond.
- **Poses cuites.** Chaque sprite est cuit en **quatre poses** (ailes qui battent,
  mâchoires qui s'ouvrent, tourelles qui reculent au tir) et l'animation se joue en
  échangeant la texture, sans une seule transformation par image. Contrôle chiffré du
  nombre de pixels qui changent entre la pose 0 et la pose 1 : porte-vaisseaux 204,
  élite 262, bouclier 80, drone 61, écrin 18, caisse 34.
- **Étalonnage par génération + flou de mouvement.** La courbe de chaque ère est cuite
  en **table de couleurs** appliquée par le shader (saturation, contraste, gamma, ombres
  refroidies, blancs réchauffés) ; en HD s'ajoute un flou de mouvement proportionnel à la
  vitesse de défilement. Le flou souffrait d'une erreur d'unité (l'offset d'échantillonnage
  était multiplié par la taille de la texture au lieu d'être divisé) : les quatre
  échantillons tombaient à des centaines d'écrans de distance et se bloquaient sur les
  bords, peignant un faux projecteur en éventail par-dessus le secteur. Corrigé.
- **Secteur 4 reconquis.** Le mobilier 8 et 16 bits (plateformes, baies, docks, anneaux,
  cristaux) est **retiré de l'ère HD** — c'était le patchwork d'hélices et de flaques
  bleues — et remplacé par des gabarits propres à la génération : **coque de
  vaisseau-capitale** et **échafaudage orbital**. Le bloom de l'ère HD redescend de
  0,42 à 0,26 : à 0,42 le secteur virait au pastel.
- **Flash d'impact par génération.** Un ennemi ou un boss touché ne clignote plus en
  blanc universel : il clignote dans **sa** palette. La Game Boy n'a que quatre teintes,
  dont aucun blanc — le sprite touché passe donc au **ton le plus clair de la livrée
  active** (vert clair en ESCADRILLE, gris clair en POCKET, ambre en CRT, bleu en AZUR…),
  soit exactement ce qu'un écran DMG peut produire. L'ère 8 bits+ flashe en blanc glacé
  de sa palette, le 16 bits en blanc franc, la HD en blanc pur (que le bloom transforme
  en éclat). Corrigé au passage : la HD **n'affichait aucun flash** sur les ennemis (le
  chemin vectoriel n'implementait pas l'option), et les cœurs d'obus, de laser, de
  rayon et les flashs plein écran étaient peints en blanc codé en dur partout.
- **Coins de l'écran de triche.** Les carrés à « ? » sont remplacés par quatre **coins**
  dessinés en dégradés CSS : plus aucune dépendance à une police exotique, les carrés
  manquants ne peuvent plus revenir.
- **Interface tactile.** La barre de commandes s'affiche vraiment en jeu (elle restait
  masquée : la classe `playing` était effacée au changement de génération) et les
  pastilles **ARME** et **BOMBE** se mettent à jour (arme courante, jeu d'armes, bombes).

## Tutoriel tactile (téléphone)

Le jeu détecte l'écran tactile et affiche une barre de commandes en bas de l'écran.

| Geste | Action |
|---|---|
| Glisser le doigt | Le vaisseau est **attiré** vers le doigt (il ne s'y téléporte pas) |
| Doigt posé | Tir automatique pendant tout le contact |
| **Deux doigts** n'importe où | **Bombe** (écran nettoyé autour de toi) |
| Bouton **Bombe · n** (en bas à gauche) | Bombe également — le compteur affiché se met à jour |
| Bouton **Arme · NOM (n)** (en bas à droite) | **Change de jeu de tir** et fait le tour des armes possédées |
| Bouton **◀** à côté | Jeu de tir précédent |

Les jeux de tir s'enchaînent dans l'ordre : **PULSE → SPREAD → LASER → PLASMA → RAILGUN**,
en ne montrant que les armes achetées en boutique (les deux premières sont acquises
d'office). Le numéro entre parenthèses indique la position dans le cycle. Garde le doigt
**sous** le vaisseau plutôt que dessus : il ne masquera pas l'action.

## Aperçus

- `apercu-webgl.png` — les 4 secteurs rendus par la voie WebGL 2 (halo, aberration, vignette).
- `couleur-vaisseau.png` — le vaisseau avant/après : vert Game Boy hors secteur 1 → coque de la planche.
- `cmp-gpu-2d.png` — la même image au même instant en WebGL 2 et en canevas 2D (écart moyen 4,7/255).
- `apercu-vaisseaux.png` — les **7 chasseurs** dans les 4 générations graphiques, en grand et à la taille de jeu.
- `fidelite-vanguard.png` — la planche, la géométrie vectorisée, et le rendu du moteur dans les 4 ères.
- `apercu-vanguard.png` — le VANGUARD seul, de la Game Boy à la HD animée (rendu de jeu + pixels cuits).
- `vanguard-en-jeu.png` — le VANGUARD dans les 4 secteurs, en jeu.
- `uploads/IMG_20261015_074024.jpg` — la planche de référence fournie.
- `progression-secteurs.png` — le même instant de jeu dans les 4 secteurs.
- `comparaison-anime.png` — le secteur 4 avant/après la refonte « animé ».
- `refonte-boss.png` — les 4 boss dans les 4 générations.
- `refonte-items.png` — les 5 écrins de bonus, posés puis aimantés, dans les 4 générations.
- `refonte-niveaux.png` — le rendu des niveaux après le passage artistique.
- `pack-graphique-4-eres.png` — les quatre ères après le pack graphique (étalonnage, lumière,
  rayons, reflet de coque), image moteur à l'échelle 1:1.
- `vaisseau-taille-avant-apres.png` — le vaisseau à 98 px puis à 72 px, même instant, zoom ×3.
- `refonte-boss-ombrage.png` — les quatre boss avec le nouvel ombrage.
- `refonte-vaisseau-secteurs.png` — le vaisseau secteur par secteur (coque de la planche, lumière
  propre à chaque génération).
- `secteur4-nouveau.png` — le fond du secteur 4 après reconquête : plus d'hélices ni de flaques.
- `couleur-vaisseau.png` — le vaisseau en jeu, ancienne livrée verte par défaut face à la coque de
  la planche (secteurs 2 et 4).
- `flash-impact-ennemis.png` et `flash-impact-boss.png` — le flash d'impact dans les 4 générations,
  sprite au repos / touché avant / touché après (sprite recadré ×2, même instant).

## Aperçu des vaisseaux

`apercu-vaisseaux.png` (à la racine) montre les 5 vaisseaux dans les 4 générations
graphiques, en grand et à la taille de jeu.

## ☠ Menu cheat

Accessible depuis le **menu titre** et la **pause**. Codes insensibles à la casse et à la ponctuation
(`Kab Rak-77` fonctionne), validation par **Entrée** ou bouton. Le code maître s'écrit **`kabrak77`**
(depuis cette version : l'ancienne graphie `kakrak77` n'ouvre plus rien).

| Code | Effet |
|---|---|
| **`kabrak77`** | **VIES INFINIES** (le HUD affiche ∞) |
| `invincible` | Coque indestructible |
| `maxpower` | Armement maximal (puissance 5) |
| `overdrive` | Vitesse ×2 et cadence +50 % |
| `matrix` | Temps ralenti à 60 % |
| `banque` | +50 000 crédits |
| `sesame` | Toute la boutique débloquée et maximisée |
| `saut` | Choix du secteur de départ (1 à 4) |

Chaque carte verrouillée affiche un indice. Une partie truquée est marquée **TRICHE ACTIVE** et
**ne bat pas les records** (score max, secteur max) ; les crédits gagnés restent acquis.

## Commandes

| Touche | Action |
|---|---|
| Flèches / ZQSD / WASD | Déplacer |
| Espace / clic (maintien) | Tirer |
| B / Maj / Ctrl (ou double tap) | Bombe intelligente |
| Échap / P | Pause · **M** : couper le son · **F** : plein écran |
| Souris / doigt | Pilotage (option « visée souris ») |

## Mettre en ligne sur GitHub Pages

```bash
git init
git add index.html README.md
git commit -m "NEO VANGUARD"
git branch -M main
git remote add origin https://github.com/<ton-compte>/neo-vanguard.git
git push -u origin main
```

Puis dans le dépôt : **Settings → Pages → Build and deployment → Source : Deploy from a branch**,
**Branch: main**, dossier **/ (root)**, *Save* → le jeu est en ligne à
`https://<ton-compte>.github.io/neo-vanguard/`.

## Pourquoi pas LÖVE / Lua ?

LÖVE est un excellent moteur — sur **desktop**. Dans un navigateur il passe par `love.js`
(une compilation WebAssembly de LÖVE) et il perd précisément ce qui fait sa force :

| Critère | LÖVE + love.js (web) | Ce jeu (Canvas 2D génératif) |
|---|---|---|
| Vitesse | pas de LuaJIT → plusieurs fois plus lent ; beaucoup de jeux ne tiennent pas 60 fps | ~60 fps en Game Boy/8-bit, fluide en HD |
| Poids | runtime WASM + archive `.love` : plusieurs Mo | **un seul fichier de ~270 Ko** |
| Stabilité | mémoire limitée, plantages possibles, shaders WebGL différents du desktop | aucune dépendance, aucune compilation |
| Hébergement | GitHub Pages ne peut pas poser d'en-têtes COOP/COEP → builds multithread à éviter | un simple fichier statique |
| Rendu | **vrai GLSL** (bloom, distorsion, CRT) mais bridé en web | passes équivalentes en Canvas 2D, sans shader |

Autrement dit : passer à LÖVE en navigateur **dégraderait** ce jeu. Et surtout, un rendu « animé »
n'est pas un problème de moteur mais de **direction artistique** — silhouettes détourées, valeurs
écrasées, color script, fonds peints, pétales, lignes de vitesse. Tout cela a été implémenté ici,
sans changer de moteur.

Si l'objectif était d'aller plus loin côté shaders **dans le navigateur**, la bonne voie n'est pas
LÖVE mais **WebGL en JavaScript** (rendu par shaders, toujours sur GitHub Pages). Si l'objectif était
une **version desktop** (Steam, itch.io), LÖVE devient au contraire un très bon choix : les moteurs
de sprites et de décors du jeu sont des générateurs purement mathématiques, donc transposables en Lua.

## Notes techniques

- **Moteur de sprites procédural** : chaque entité est décrite par des polygones normalisés
  (coque, ailes, verrière, réacteur, accents) + un seuil d'apparition par ère. Le sprite est
  rastérisé à la résolution de l'ère (4× moins de pixels en Game Boy), dilaté en 8 bits pour que
  les traits survivent, puis **ombré selon le nombre de tons disponible** (3 → 12) avec contour,
  lumière du haut et liséré. En HD, les mêmes silhouettes sont tracées en **vectoriel dégradé**
  avec halos, et le résultat est mis en cache par (entité, ère, livrée).
- **Moteur de décors** : 12 familles de structures (station, astéroïdes, cristaux, mégatours,
  anneaux, passerelles…) rendues en **canvas pré-cuits** à la résolution de l'ère, puis blittées —
  seuls les éléments animés (lampes, hologrammes, grues) sont redessinés en direct.
- **Terrain** : percé par composition `destination-out` pour créer de vraies fosses traversantes,
  avec lèvres métalliques, rivets, bandes de danger et lampes clignotantes.
- **Parallaxe cohérente** : tous les calques descendent de haut en bas, et plus un calque est proche,
  plus il va vite (facteurs × `SCROLL.speed`) — nébuleuses ×0,17-0,29, ciel peint ×0,11,
  étoiles ×0,06-1,16, **sol de station ×0,45** (le calque le plus profond du jeu), structures posées
  sur ce sol ×0,70, poutrelles et pétales ×1,50-1,75. Les fosses percées dans le sol défilent à la
  vitesse du sol, elles y restent donc solidaires.
- **Audio 100 % WebAudio** : 4 partitions distinctes (tempo, tonalité, formes d'onde, batterie,
  effets), basse « duckée » façon sidechain, réverbe à convolution générée par impulsion de bruit,
  delay, panoramique. Les effets sonores sont eux aussi redéfinis pour chaque ère.
- Un seul contexte **Canvas 2D** alimente des buffers hors écran de densités différentes ; ce sont
  eux qui produisent le saut visuel entre un écran Game Boy et un rendu HD.
- **Transition inter-ère** : capture du canvas (une seule lecture GPU au moment de la bascule),
  puis découpage en 32 volets dessinés avec un délai progressif depuis le centre et une dérive
  alternée — l'illusion d'un « rideau » par-dessus le monde suivant, rendu en temps réel.
- Le dossier `build/` contient les sources découpées par module et `build/build.sh`, qui réassemble
  `index.html` — pratique pour faire évoluer le jeu. Le jeu publié reste le seul `index.html`.

Bon vol, pilote.
