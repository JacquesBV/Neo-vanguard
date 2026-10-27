# PORTING_STATUS — portage Godot natif de Neo-Vanguard

**État global : PORTAGE INCOMPLET** (conformité totale au cahier des charges non atteinte —
voir « Écarts ». Le jeu est jouable de bout en bout, séquence finale comprise.)

## Références
- **Commit source de référence** : `ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057`
  (« Restore responsive touch and add useful FanBoy FX controls », 2026-10-25T19:54:50Z,
  1087 blobs / 454,3 Mo). Le site publié jacquesbv.github.io est identique octet pour octet.
- **Version Godot** : **4.3-stable** (`4.3.stable.official.77dcf97d8`) — dernier stable 4.x
  avant la série 4.4, API GDScript stable utilisée par le projet, rendu GL Compatibility
  compatible sandbox/sous-ensemble mobile.
- **Branche** : `port/godot-native` (commits **locaux**, push non effectué) :
  - `030923d` Portage Godot 4.3 natif de Neo-Vanguard (parent : ccd7e82)
  - `52f584a` Module 29 complet (VORAX) + repli dessiné du flipper
- main et la version web ne sont jamais modifiés.

## Ce qui est porté, lancé et testé
- 24 secteurs / 5 ères, 8 boss génériques (atlas module 46), **séquence finale VORAX
  complète** (module 29) : sas → couloir → alarme → mains → tear → reveal → 3 formes
  (réserve unique, seuils 2/3 et 1/3) → mort ; 7 attaques, zones tête/torse/bras,
  radios et textes en 5 langues — **NV_TEST=9 vert de bout en bout** (6 captures).
- Menus (titre, options, codes, records, commandes, histoire), boutique, tickets à
  gratter, Neo-Vanguard FM (31 cassettes, achat + lecture), deck narratif prologue
  (9 pages) / épilogue (5 pages), briefings illustrés, flipper Néon Orbit (moteur
  complet + rendu de secours dessiné), sauvegarde `user://neovanguard.save.v3.json`.
- Tests harnais (NV_TEST) **1 / 2 / 5 / 7 / 8 / 9 verts** sur l'arbre courant
  (ré-exécutés ce tour). Détails : `RAPPORT-TESTS.md`.

## Écarts (implémenté / testé / conforme)
1. ~~Module 29 — défenseurs~~ **CORRIGÉ** : les 8 types FOE sont portés (IA exacte
   du module : lance/orbe/griffe/tourelle/manta/tambour/dard/gatling, PV ×e_scale
   ×1,4 en 2J, tir à chaque cadence, renforts des états sas/hands) + rendu par la
   planche officielle `defense-atlas.webp`. Vérifié par NV_TEST=10 (parcours
   approach→…→hands de la machine complète) et NV_TEST=9 (sequence boss).
2. **Binaires du flipper : introuvables définitivement** — retirés du dépôt amont
   (`.gitkeep` à ccd7e82, 404 site, pas de LFS, aucun commit public ne les contient,
   **aucun snapshot Wayback** — vérifié ce tour). Le port garde les chemins
   officiels + un **repli dessiné** conforme aux colliders. Écart irréductible :
   rien ne peut être comparé aux PNG d'origine puisqu'ils n'existent plus nulle part.
3. **Code COMEBACK** : inexistant dans la source (grep complet) → N/A, non inventé.
4. ~~FX controls du commit 51~~ **CORRIGÉ** : options « CONTRASTE LCD » (low/normal/high,
   molette de console) et « CADRE DE CONSOLE (PC) » (coque NV-01 masquable) ajoutées
   à l'écran OPTIONS, cadre appliqué au démarrage (`shell.visible`).
5. **Langues** : **LDATA intégral extrait de la source** (442 entrées FR→EN/ES/PT/JA,
   `assets/data/lang.json`) + sélecteur de langue dans OPTIONS + `NVLang.t()` (mêmes
   règles que L() : recherche par texte, insensible à la casse, capitales propagées,
   nombres réinjectés dans les #). Vérifié TEST10 (en/ja/capitales). Couverture :
   menus principaux + module 29 en 5 langues ; les textes à contenu formaté
   (briefings, deck) restent FR — la couverture s'étend progressivement aux écrans.
6. ~~Exports~~ **RÉALISÉS** : templates officiels 4.3-stable installés, exports
   release **effectués et vérifiés** : `NeoVanguard-Linux.x86_64` (352 441 232 o,
   PCK embarqué, **lancé sous Xvfb : TEST1 vert depuis le binaire exporté**) et
   `NeoVanguard-Windows.exe` (370 581 408 o, PE32+ x86-64 ; même pipeline, non
   exécutable sous Linux — consigné). Preset Android fourni, non compilé (SDK/
   keystore absents — consigné).
7. ~~Manette~~ **TESTÉE** : mapping JoypadMotion présent (axes 0/1) + **injection
   d'événements** (Input.parse_input_event) : le vaisseau se déplace (dx = −208 px,
   TEST10). ~~Tactile~~ **CORRIGÉ + TESTÉ (TEST12, 7/7 VERT)** : le tactile était
   inopérant (le SubViewport du jeu ne reçoit pas les événements de la fenêtre
   racine ; actions mappées clavier/manette uniquement). Réplique de wirePointer()
   du jeu original dans main.gd (capte racine) + game.gd : doigt pilote RELATIF
   1:1 (le doigt prend le vaisseau là où il est, rebase aux bords), tir au doigt,
   deuxième doigt OU double tap <400 ms = bombe, barre KFM-01 câblée (BOMBE,
   PRÉC/SUIV armes, PAUSE — boutons sans effet auparavant). **Multitouch
   physique sur appareil réel** : à confirmer par l'utilisateur (pipeline
   d'entrée validé par événements synthétiques).
8. ~~Sauvegardes web → native~~ **CORRIGÉ** : import intégré à l'écran OPTIONS
   (collage du JSON localStorage → fusion des clés credits/max_level/records/
   unlocks/musicTracks/pinball/sel + opts) ; vérifié TEST10 (4 clés, valeurs exactes).
9. **Écoute audio humaine** : validations techniques (rendu, stéréo, boucle) sans
   écoute critique des 40 morceaux / 16 échantillons.

## Écrans de parcours manquants → AJOUTÉS (C6)
Le comparatif Godot↔web avait relevé 4 écrans web absents du port + un titre
redessiné : **corrigés** (répliques, réutilisation des assets d'origine) :
- **avertissements santé/fiction** (01-nv-warnings.js) : écran pleine page
  5 langues affiché à CHAQUE lancement, fermé d'un geste (fire/pause/Échap/clic) ;
- **écran d'entrée « APPUYEZ POUR ENTRER »** : affiche media-033 + logo
  hexagonal SVG redessiné (géométrie exacte), SYSTÈME EN LIGNE, crédit musical ;
- **titre refait** : fond = affiche officielle media-033 (asset d'origine
  réutilisé), kicker ÉDITION COLLECTOR, logo géant, sections JOUER /
  MULTIJOUEUR / HANGAR & PROGRESSION / RÉGLAGES, tuiles 2 colonnes, chips
  RECORD/COINS/SECTEUR MAX/KILLS + sélecteur de langue + étiquette d'ère ;
  nouvelles entrées **Coop en ligne** (panneau hors ligne, comme le web sans
  signalisation), **Crédits**, **Plein écran** (opérationnel), FM/Flipper avec
  état 🔒 réel, bouton Continuer conditionnel ;
- **écran de chargement de secteur** (43-nv-fluid-js.js) : logo, « SECTEUR ##
  · machine », barre dégradée, séquence Analyse→Mesure du rendu·Balanced→Prêt
  + astuce de tir ; purement visuel (ne bloque pas les entrées), se libère seul.
Clés i18n ajoutées : 35 entrées (titre/splash/chargement/coop/crédits).

## Lot fidélité gameplay/rendu (C8) — demandes utilisateur corrigées
1. **Collisions tirs↔ennemis** : BUG MAJEUR corrigé — les tirs du joueur ne
   touchaient JAMAIS les ennemis standards (seuls boss/sas/décor/mains
   encaissaient) ; `update_bullet_hits()` ajoute la boucle manquante
   (rayon e.r×0.9+b.r, un tir = un impact/frame, respect des perfo).
2. **Taille des ennemis** : sprites POCKET ×1,31 (0,305→0,40 du gabarit du
   moteur) ; cargaisons de décor 30→24 (vérifié par recadrage comparé).
3. **Position des boss** : entrée/errance en PIXELS (y=265/190-330) →
   FRACTIONNELS (0,31/0,24-0,36 de FH) : en secteurs 1-4 le boss rôdait à
   73-83 % de l'écran, il joue désormais à 31 % (TEST14 : 32 %).
4. **Alerte amirale** : bandeau rouge plein écran → réplique du redesign web
   (module 21) : hachures de danger défilantes en sens inverse, WARNING
   clignotant + triangles, nom tapé lettre à lettre, consigne, jauge
   d'approche, coins ; encres console en secteurs 1-4.
5. **Secteurs 1-4 = encres LCD uniquement** : danger/gold/shield/hull
   génériques (#ff405f/#ffd166/…) remplacés par INKS[2]/INKS[3] en ère 0
   (pop-ups, jauges, bannières, HUD BOMBES, hexagone/barre de chargement).
6. **Vagues à partir du secteur 5** : densité 0,18/0,06→0,10/0,04 par
   stade/ère + écarts entre vagues élargis (+15 à +25 %) : le boss n'arrive
   plus « trop vite ».
7. **Bombe tactile** : le saut du vaisseau après une bombe (écart doigt
   mémorisé périmé) est corrigé — recalage grab/base après `use_bomb`
   (TEST14 : +6,0 px exact, aucun saut).
8. **Écran LCD monochrome FanBoy** : rémanence (ghosting 1,5 px @ 0,16),
   grille de la matrice 48×68, ombre intérieure du verre, micro-flicker
   rétroéclairage — teintes INKS inchangées.
9. **Titre** : ancrage de l'affiche (cadre -140 px + couverture centrée).

## Bombes toutes ères + accès aux secteurs 1-3 (C9) — demandes utilisateur
1. **Bombes inutilisables (ères 2+) corrigé** : la barre tactile (BOMBE/PRÉC/ARMEMENT/SUIV/PAUSE, avec
   compteurs réels : bombes restantes, arme courante, nb d'armes possédées)
   est désormais dessinée par hud_overlay AU-DESSUS de la vue plein écran
   dans les secteurs 4–24.
   TEST15 : bombe déclenchée via le bouton en ère 1 (9→8), hit-test OK.
2. **Sélecteur de secteur** : les secteurs 1, 2 et 3 constituent le Monde 1
   sur la console **FanBoy** (`era_of_level(1..3)=0`), et le secteur 4 bascule
   sur la **FanBoy Adventure** (`era_of_level(4)=1`). Ajout d'un **sélecteur de
   secteur** (bouton « Choisir un secteur » au titre : grille 1-24 verrouillée
   au record, éclairci position courante) : rejouer les secteurs 1–3 sur la FanBoy
   ou n'importe quel secteur atteint. TEST15 : 24 boutons, verrou au-delà de max_level.

## Coque NV-01 FANBOY + menus pro (C10) — demandes utilisateur
1. **Image de fond du titre recentrée** : l'affiche media-033 était cadrée sur
   le bord gauche du poster (le vaisseau partait hors écran à droite —
   impression « déportée à droite »). Cadre corrigé (offsets −227/+253/−20) :
   le vaisseau est amené au centre, fuselage et cockpit visibles derrière le
   logo. TEST16 capture 4/5.
2. **Menus interactifs** : acquittement sonore « uiclick » (recette puce
   sonore ajoutée à audio_chip) branché sur TOUS les boutons (ui.button,
   tuiles de grille, sélecteur de secteur, entêtes de sections, langue,
   quitter). On sait désormais que le clic est parti.
3. **Titre à sections dépliantes** : 15 entrées visibles d'un coup → 3
   sections (JOUER / ESCALES & MULTIJOUEUR / SYSTÈME) qui se déplient au
   toucher (construction à la demande, fondu 0,22 s, une seule ouverte) ;
   JOUER ouverte par défaut. Design pro, pièces détachées, compatible tous
   téléphones (mise en page fluide 480×860, cibles tactiles ≥ 40 px).
4. **Écritures rouges persistantes corrigé** : les textes flottants
   (pops, dont « COQUE x/y » rouge) ne se dissipaient que dans la boucle
   active — un dégât juste avant une pause ou une fin de secteur restait
   figé à l'écran pour toujours. La dissipation (et le flash) tourne
   désormais même quand le jeu est gelé. TEST16 : pop présent puis 0 après
   1,5 s GELÉ.
5. **Coque NV-01 FANBOY (ère 0, secteurs 1-4)** : réécriture complète de
   shell_layer d'après l'art officiel du dépôt (assets/fanboy/nv01-shell,
   module 51 « coque FX en panneaux, commandes réactives, cadrage épinglé ») :
   boîtier gunmetal modelé, vis étrier ×4, bandeau « /// FANBOY — NV-01 »,
   LED POWER pulsante, chevron NEO-VANGUARD, gâchettes SELECT/START à liseré
   cyan, artwork étoiles + planète, ouïes, gravure de série. **Le verre reste
   EXACTEMENT GLASS (32,196,416,312)** : la taille d'écran ne bouge pas.
6. **HUD intégré à la coque** : jauge COQUE segmentée, pips BOUCLIER, BOMBES,
   PUISSANCE + arme descendent sur le panneau LCD de la coque (le verre ne
   garde que score/vies/boss) ; inversion LCD clignotante « PAUSE » sur le
   bandeau quand le jeu est gelé sans menu.
7. **SELECT = pause, START = menu** : nouvelles gâchettes matérielles
   tactiles (ères FanBoy uniquement). SELECT gèle/reprend la partie (voile
   givré + rappel sur l'écran) ; START ouvre le menu pause (jeu en pause) ;
   SELECT depuis le menu = Reprendre. Fond du menu rendu traversant hors
   boutons pour que les gâchettes restent cliquables. TEST16 : 6/6.
8. **Cadre LED de progression** : le bord d'écran passe vert → jaune →
   orange → rouge selon l'avancement du secteur (Data.progress_color piloté
   par NVGame.sector_progress : vagues 0→75 %, alerte 78 %, boss 80→100 %),
   pulsant au-delà de 75 %. Ère 0 : autour de la visière (coque) ; ères 1+ :
   lisière plein écran (hud_overlay), sans grignoter une pixel de jeu.
9. **HUD ères 1+ compacté** : vies/coque/boucliers/bombes remontés sous
   l'étête (la bande 742-860 appartient à la barre tactile), chaîne remontée.

## Reste (après corrections)
- écoute audio humaine (pilote dummy en sandbox) ;
- confirmation du multitouch sur appareil physique (pipeline validé TEST12) et exécution du .exe sur Windows réels ;
- couverture i18n étendue aux écrans à contenu formaté.
## Coque photo V13 + console NV-01 complète (C11) — demandes utilisateur
- **Coque = PHOTO** : `assets/coque/nv01-shell.png` (960×1720, pliée en 480×860) posée comme
  texture statique (`shell_layer.gd`, ImageTexture décompressée au chargement — les
  CompressedTexture2D lossless se rendent blanches sur certains drivers). Plaque deck carbone
  étendue (16,910,944,1480 en 960×1720) couvrant les organes photo, sticker hexagonal FAN BOY
  conservé au centre du cul de console, vignette photo bas-droite neutralisée (clone-stamp carbone).
- **Verre 4:3 max** : `Data.GLASS = Rect2(24, 126, 432, 324)` — l'ère 0 rend 480×360 dedans ;
  le néon du cadre entoure exactement la vitre et sa couleur = progression du secteur
  (vert→jaune→orange→rouge, pulse >75 %), `Data.progress_color` partagée avec la LED coque.
- **HUD 100 % hors écran** : bandeau LED `STRIP Rect2(16, 473, 448, 28)` (vies, COQUE segmentée
  vert→rouge = %, BOMBES, arme or) ; le verre ne garde que score/vies/pieces, barre de l'amiral
  et chaîne (`_draw_glass_lcd`).
- **Contrôles matériels FanBoy** : stick analogique 360° (`stick.png`, course 17 px, ressort 0,12 s),
  boutons **A** rouge (tir) et **B** doré (bombe), touches **SELECT** (pause) et **START** (menu),
  interrupteur vertical **ON/OFF** (`power.png` + `led.png`), jauges **COQUE** (8 cellules) et **BOSS**
  (30 cellules), rails lumineux `threat_lights.png` (`led.gdshader`).
  Stick = mouvement SEUL (`touch_press(pos, true)` → `touch_stick`, tir = bouton A maintenu
  `game.touch_fire_btn`).
- **Libellés symbole + nom** dessinés moteur (fr/en/es/pt/ja via `lang.json`, +11 clés = 490
  entrées), aucun texte gravé sur la photo ; sous-libellés PAUSE/MENU dans les pills.
- **Curseur POWER à glisser** (piste gauche du cul, bouton saisi sur I ou O seulement) :
  éteint → verre noir + « GLISSER POUR ALLUMER » (glyphe ⏻ vectoriel) ; ON → boot 1,15 s
  (lignes LCD + logo + flash) puis dégel ; en jeu → « GLISSER POUR ÉTEINDRE », OFF → extinction
  0,55 s (lignes retombent + son « powerdown ») + RETOUR AU TITRE. L'overlay de chargement est
  clippé au verre en ère 0 et masqué hors état « on ».
- Tests : **TEST16 7/7** (coque, gel, menu, reprise, pop figé, progression, sections),
  **TEST17 12/12 (nouveau)** : éteint/paused → glisser → boot → on/dégel → stick dx=105 →
  TIR maintenu → croix pulse→spread → bombe −1 → SELECT/START → glisser O → shutdown → off
  + retour titre. Non-rég : **TEST12 7/7** (déplacé secteur 5, ère 1), **TEST14 3/3**,
  **TEST15 3/3**. Captures : `apercu-godot/c11/` (11 fichiers).

## Reste (après corrections)
- écoute audio humaine (pilote dummy en sandbox) ;
- confirmation du multitouch sur appareil physique (pipeline validé TEST12) et exécution du .exe sur Windows réels ;
- couverture i18n étendue aux écrans à contenu formaté ;
- fidélité web restante : P4 (chaînes EN natives), P5 (sprites pixel), P6 (re-mesure) — portage incomplet tant que non atteint.
## LED progressistes façon console portable (C12) — demande utilisateur
- **OFF = AUCUNE LED allumée** : néon du cadre éteint, bandeau HUD réduit à la légende
  imprimée (segments invisibles), stick sans anneau, TIR/BOMBE/croix en plastique sombre
  (`_mix_led` plastique→couleur vive), bouton I/O noir. Seul le hint gravé « GLISSER POUR
  ALLUMER » + glyphe ⏻ vectoriel restent visibles dans le verre noir.
- **ON = montée PROGRESSIVE** (`_led_levels` : fenêtres lissées hermite sur `boot_t`) :
  néon du cadre (0,05→0,55 s) → bandeau HUD LED (0,25→0,80 s) → anneau stick + boutons
  TIR/BOMBE/croix (0,45→1,05 s) → rétroéclairage du bouton I/O (0,85→1,15 s, cyan) ;
  extinction : tout retombe ensemble en 0,55 s (décharge).
- Tests : **TEST17 12/12** (+ captures de la montée à 35 % et 75 % dans `apercu-godot/c11/`,
  planche `planche-montee-led.png`) ; non-rég **TEST16 7/7, TEST12 7/7, TEST14 3/3, TEST15 3/3**.

## Retours joueur V13 (C13) — 7 corrections
1. **Curseur I/O « galère »** : les DRAGS étaient filtrés par la pause (console éteinte =
   pause) — le curseur se glisse désormais MÊME éteint, se saisit PARTOUT sur la piste
   (plus besoin de viser le bouton) et se relâche n'importe où.
2. **Cadre néon mal aligné** : fenêtre de la photo mesurée au pixel = 440×330 @(20,122)
   (4:3 pile) — `Data.GLASS` corrigé, le néon épouse exactement la vitre (prouvé pixel).
3. **Stick non réactif** : pilotage ABSOLU 1:1 remplacé par un vrai STICK ANALOGIQUE —
   incliner = vitesse proportionnelle immédiate (dérive continue doigt immobile, testée
   38→208 px en 0,9 s, arrêt net au relâchement) ; le cap s'incline visuellement (±12 px).
4. **Boutons moches/mal placés/demi-cercles** : TIR et BOMBE redessinés en boutons
   « vrais » (ombre portée, cuvette, dôme bombé, spéculaire) en paire diagonale manette
   (TIR 402,588 · BOMBE 354,672), demi-cercles parasites supprimés, zone croix resserrée.
5. **Réalisme appui** : TIR reste ENFONCÉ tant que maintenu, BOMBE s'enfonce pendant la
   bouffée, croix et pills s'enfoncent (2–4 px) — flashs d'appui partout.
6. **Vaisseau qui bouge sur TIR/BOMBE** : cause racine = pilotage SOURIS (chaque appui
   émule la souris sur mobile, le vaisseau « courait » vers le bouton) — désactivé sur la
   console NV-01 (mesuré : dérive 0,0 px sur TIR) + secousses d'écran réduites ×0,3 en ère 0.
7. **Écriture rouge aux dégâts** : `pop_text(..., Color("#ff7a86"))` codé en dur hors remap
   ère 0 → `TH.danger` (encre console) ; rémanence LCD masquée console éteinte.
- Tests : **TEST17 12/12** (nouvelles assertions dérive), **TEST16 7/7**, non-rég
  **TEST12 7/7 · TEST14 3/3 · TEST15 3/3**. Captures à jour dans `apercu-godot/c11/`.

## Prochaine action
ouvrir la PR `port/godot-native` → `main` (branche poussée à l'instant).
