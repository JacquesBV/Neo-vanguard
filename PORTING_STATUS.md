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
8. **Écran Game Boy authentique** : rémanence (ghosting 1,5 px @ 0,16),
   grille de la matrice 48×32, ombre intérieure du verre, micro-flicker
   rétroéclairage — teintes INKS inchangées.
9. **Titre** : ancrage de l'affiche (cadre -140 px + couverture centrée).

## Reste (après corrections)
- écoute audio humaine (pilote dummy en sandbox) ;
- confirmation du multitouch sur appareil physique (pipeline validé TEST12) et exécution du .exe sur Windows réels ;
- couverture i18n étendue aux écrans à contenu formaté.
## Prochaine action
ouvrir la PR `port/godot-native` → `main` (branche poussée à l'instant).
