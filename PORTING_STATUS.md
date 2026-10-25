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
1. **Module 29 — défenseurs** : les 8 types FOE dédiés (lance, orbe, griffe, tourelle,
   manta, tambour, dard, gatling) ne sont pas portés ; les renforts des états
   sas/hands réutilisent les vagues génériques (lancer, runner). TOUT le reste du
   module est porté et testé (dérogation consignée, pas une équivalence).
2. **Binaires du flipper retirés du dépôt amont par l'auteur** : au commit ccd7e82,
   `assets/pinball/` ne contient plus que `.gitkeep` (pas de LFS ; les 3 fichiers
   testés sur le site publié renvoient 404). Conséquence : le port conserve les
   **chemins officiels** (`res://assets/pinball/...`) — si les PNG/WAV sont remis,
   tout fonctionne — et ajoute un **repli dessiné** conforme aux colliders du moteur.
   Testé en repli ; **non testé avec les PNG officiels (introuvables)**.
3. **Code COMEBACK** : inexistant dans la source (grep complet) → N/A, non inventé.
4. **FX controls du commit 51** (boîtes de réglage FanBoy) : non reproduits.
5. **Langues** : VORAX et textes du module 29 en 5 langues ; le reste de l'UI est FR.
6. **Exports** : `export_presets.cfg` fourni (Windows + Android, sans secrets) ;
   **aucun export binaire réalisé** (pas de Windows/macOS dans la sandbox).
7. **Manette / multitouch** : non testés (pas de matériel).
8. **Sauvegardes web → native** : migration manuelle documentée (RAPPORT-TESTS §D) ;
   aucun import automatique.
9. **Écoute audio humaine** : validations techniques (rendu, stéréo, boucle) sans
   écoute critique des 40 morceaux / 16 échantillons.

## Prochaine action
pousser `port/godot-native` si l'utilisateur le souhaite, puis ports restants
(FX controls, défenseurs FOE) et exports réels sur machine cible.
