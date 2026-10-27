# Cinématique d'Introduction Animée — NEO VANGUARD (Godot 4.7)

Pack complet de la cinématique d'ouverture **style Manga / Anime commercial Steam** pour **Neo Vanguard**, conçu en format portrait natif **`480×860`** (filtrage linéaire HD) et synchronisé au centième de seconde sur **`assets/music/title.mp3` (`134 BPM` — 40 mesures = `71,64 s`)**, **sans aucune voix IA**.

---

## 1. Respect du Scénario Officiel & Architecture « 8 Mondes — 24 Secteurs »

- **Prémisse d'ouverture (zéro spoiler de la fin)** :
  - Huit vestiges de consoles sacrées insufflaient autrefois la couleur, la musique et la vie à l'univers.
  - **Vorax** et son armée mécanique cherchent à plonger les mondes dans le chaos, la destruction et un silence monochrome sans couleurs.
  - Éveillé en orbite à bord du cockpit du chasseur bimoteur **Vanguard**, **le Pilote** a perdu toute mémoire de son nom et de son passé, mais conserve ses réflexes intacts.
  - Il entend et suit **Vesta** — représentée sous les traits d'une femme mystique, une conscience lumineuse connectée à la sienne — et accepte la mission sacrée de vaincre Vorax à travers les **24 secteurs**.
- **Révélation finale préservée pour l'épilogue uniquement (`scripts/ui/story_deck.gd` → `EPILOGUE`)** :
  - Ce n'est qu'après la défaite finale de Vorax au Secteur 24 que le joueur découvre que le pilote se nomme **Nolan Vey (surnommé « Vesta »)**, pilote militaire plongé dans le coma après avoir sauvé un peuple d'un génocide au péril de sa vie, qui quitte l'hôpital pour retrouver sa salle de rétro-gaming, son épouse et ses deux enfants (sa fille et son fils).
- **8 Mondes — 24 Secteurs · 5 Familles Technologiques** *(aucun nom ni design de console réelle)* :
  1. **Monde 1 (Secteurs 01–03)** : **FanBoy** — *Portable 8 bits* (coque verticale beige, blason ailé violet, direction circulaire bleue, A rouge & B ambre, écran 4 verts olive)
  2. **Monde 2 (Secteurs 04–06)** : **FanBoy Adventure** — *Portable 32 bits* (portable horizontale violet indigo à poignées sombres, 2 actions rondes anthracite)
  3. **Monde 3 (Secteurs 07–09)** : **NEXUS 8** — *Console de salon 8 bits* (console cubique gris clair/noir/rouge, 2 carrés imbriqués, pad sans fil capsule à 3 actions rouges)
  4. **Monde 4 (Secteurs 10–12)** : **Masterion 8** — *Console de salon 8 bits* (arche facettée noire et rouge, 3 barres en gradins, pad rectangulaire noir/rouge à 3 actions)
  5. **Monde 5 (Secteurs 13–15)** : **NEXUS 16** — *Consoles 16 bits* (châssis gris longitudinal, cartouche large, petit stick arcade 6 boutons multicolores)
  6. **Monde 6 (Secteurs 16–18)** : **MegaStorm 16** — *Consoles 16 bits* (console noire large à traits rouges et coins dorés, cartouche bombée, pad ergonomique 5 actions rondes)
  7. **Monde 7 (Secteurs 19–21)** : **Arcadion HCS** — *Consoles 16 bits · Holographic Control Station* (unité centrale noire/dorée à grosse cartouche étoilée opaque + 2 stations joueurs séparées avec chacune son LCD, son joystick et 6 actions noires)
  8. **Monde 8 (Secteurs 22–24)** : **Polytron 32** — *Console 32 bits* (monocoque fine gris clair à disque optique, 2 gros boutons supérieurs Marche/Éjection, écran verre transparent sur charnières, manette fluide à 4 actions colorées)

---

## 2. Arborescence du Pack Intro

```text
scenes/
└── IntroCinematic.tscn                         # Scène Godot 4.7 prête à l'emploi

scripts/intro/
├── intro_assets.gd      (NVIntroAssets)        # Chargeur mis en cache (Textures, Shaders, WAV 44.1 kHz)
├── intro_data.gd        (NVIntroData)          # Canon 8 Mondes / 5 Familles, 9 scènes 134 BPM & cues SFX
└── intro_cinematic.gd   (NVIntroCinematic)     # Réalisateur manga animé, découpes diagonales, HUD & contrôles

assets/intro/
├── characters/
│   ├── pilot/pilot_01.png .. pilot_08.png      # 8 poses 480×480 RGBA alignées par corrélation de phase + atlas
│   ├── vesta/vesta_01.png .. vesta_08.png      # 8 poses 480×480 RGBA alignées par corrélation de phase + atlas
│   └── vorax/vorax_mecha.png                   # Mecha géant Vorax détouré RGBA haute définition
├── ships/
│   └── vanguard_mk1.png                        # Chasseur spatial bimoteur Vanguard détouré RGBA
├── consoles/
│   ├── consoles_canon.json                      # Fiche technique canonique des 8 consoles validées
│   └── holo_01_fanboy.png .. holo_08_polytron32.png # 8 ensembles RGBA 768×768 adaptés du pack canonique validé (incl. holo_07_arcadion_hcs.png)
├── bg/
│   ├── cockpit_orbital_portrait.png            # Cockpit orbital vertical 9:16
│   └── cockpit_orbital_wide.png                # Cockpit orbital panoramique 16:9 (inserts manga diagonaux)
├── panels/
│   └── panel_01_terre_eclipse.png .. panel_10_clash_energie.png   # 10 planches anime verticales 9:16
├── shaders/
│   ├── manga_fx.gdshader                       # Speedlines radiales, trame manga, flash d'impact & aberration
│   ├── hologram_vesta.gdshader                 # Hologramme cristallin éthéré & balayage lumineux pour Vesta
│   ├── vorax_glitch.gdshader                   # Distorsion cybernétique écarlate & séparation RGB pour Vorax
│   └── world_era_card.gdshader                 # Filtre évolutif temps réel des 5 familles technologiques (modes 0..4)
└── audio/
    ├── sfx_manifest.json                       # Manifeste technique des 12 effets sonores
    └── sfx/
        ├── sfx_manga_slash.wav                 # Découpe diagonale de case manga
        ├── sfx_vorax_dread_horn.wav            # Cor mécanique grave de Vorax
        ├── sfx_hologram_materialize.wav        # Matérialisation cristalline de Vesta
        ├── sfx_neural_awaken.wav               # Réveil neuronal dans le cockpit orbital
        ├── sfx_world_card_tick.wav             # Verrouillage rythmique des 8 Mondes (1 mesure / monde)
        ├── sfx_glitch_burst.wav                # Décharge d'interférence cybernétique
        ├── sfx_reactor_charge.wav              # Montée en puissance des bimoteurs plasma du Vanguard
        ├── sfx_catapult_launch.wav             # Catapultage orbital sur le drop musical à 56,42 s
        ├── sfx_logo_impact.wav                 # Impact monumental du titre NEO VANGUARD à 63,58 s
        └── sfx_cue_{vesta,pilote,vorax}.wav    # Signatures sonores instrumentales subtiles (sans voix IA)

tools/
├── extract_intro_sprites.py                    # Découpe sans perte et alignement sub-pixel des planches modèles
├── build_console_holograms.py                  # Génération CAO 3D filaire 100 % originale des 8 hologrammes de consoles
├── build_constellation_panel.py                # Composition de la spirale des 8 Mondes — 24 Secteurs (panel_09)
└── build_intro_sfx.py                          # Synthèse procédurale stéréo 44.1 kHz des 12 effets sonores
```

---

## 3. Contrôles & Intégration dans le Jeu

- **Au lancement du jeu (`scripts/main.gd` → `_boot_flow()`)** :
  `Écran d'avertissement` → **`Cinématique d'Intro Animée`** → `Splash Screen` → `Écran Titre`.
- **Depuis l'Écran Titre (`scripts/ui/title_screen.gd`)** :
  - Bouton direct **« 🎬 Revoir la cinématique d'intro »** dans la section principale **JOUER** (ainsi que la tuile **« 🎬 Cinématique »** dans **ESCALES & MULTIJOUEUR**).
- **Contrôles pendant la cinématique** :
  - `Entrée` / `Espace` / `Clic gauche` / `Bouton SUIVANT ▶` : passe proprement à la scène suivante tout en recalant `title.mp3` sur la mesure correspondante.
  - `Échap` / `Pause` / `Bouton PASSER ⏭` (en haut à droite) : passe immédiatement toute l'intro sans couper `title.mp3`.

---

## 4. Règles de Cadrage, d'Ancrage & de Mise en Scène (9 Scènes)

- **Fenêtre scénique dédiée (`y = 48..640`, `480×592`)** au-dessus d'un pupitre manga opaque (`y = 640..860`) : permet d'afficher toute la largeur des planches `768×1376` avec un travelling vertical fluide sans rogner les visages ni les cornes de Vorax.
- **Zéro superposition redondante** :
  - Le sprite en biais `vanguard_mk1.png` n'est jamais superposé par-dessus les planches qui contiennent déjà le Vanguard (`panel_05`, `panel_06`, `panel_07`, `panel_08`).
  - Aucun personnage détouré n'est superposé par-dessus une planche le représentant déjà en pied ou en gros plan (`panel_02`, `panel_03`, `panel_04`).
- **Zéro corps coupé flottant dans le vide (`clip_contents = true`)** :
  - Les modèles mi-corps (`vorax_mecha.png` coupé à `92,9 %` et `vesta_01..08.png` coupé à `96,4 %`) sont systématiquement ancrés de sorte que leur coupe horizontale reste **verrouillée sous `DIALOGUE_TOP_Y = 640`** ou **sous la bordure inférieure d'une case manga clippée**.
- **Mouvements continus & fondus de poses à sens unique** :
  - Aucune boucle ping-pong répétitive ni oscillation verticale (`sin(t)`) sur les personnages ; progression dramatique à sens unique (`pilot_01 → 02 → 04 → 05`, `vesta_02 → 06 → 05`, `pilot_08 → 07`, `vesta_07 → 08`) et travellings distincts pour chacun des **8 Mondes** à travers `panel_05`, `panel_06` et `panel_09`.

