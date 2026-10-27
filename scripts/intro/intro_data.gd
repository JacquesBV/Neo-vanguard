extends RefCounted
class_name NVIntroData
## =========================================================================
## NVIntroData — Canon officiel « 8 Mondes — 24 Secteurs · 5 Familles
## Technologiques » et partition cinématique manga synchronisée à 134 BPM
## sur la musique d'intro (assets/music/title.mp3).
##
## Utilise exclusivement les 10 planches originales de la séquence d'intro
## (panel_01..panel_10) et les modèles officiels (Pilote, Vesta, Vorax,
## Vanguard, Cockpits), avec cadrages, découpes et mouvements de caméra propres
## à chaque monde et chaque scène (zéro doublon, zéro corps coupé dans le vide).
## =========================================================================

const BPM := 134.0
const BEAT := 60.0 / BPM              # 0.447761 s par temps
const BAR := BEAT * 4.0               # 1.791045 s par mesure 4/4
const TOTAL_DURATION := 71.64         # 40 mesures exactes à 134 BPM

## Les 5 familles technologiques officielles
const TECH_FAMILIES := [
	{
		"id": 0,
		"code": "FAMILLE I / V",
		"name_fr": "PORTABLE 8 BITS",
		"name_en": "8-BIT HANDHELD",
		"shader_mode": 0,
		"spec_fr": "Matrice monochrome 4 nuances · Synthèse 4 canaux",
		"spec_en": "4-shade dot-matrix · 4-channel pulse audio",
	},
	{
		"id": 1,
		"code": "FAMILLE II / V",
		"name_fr": "PORTABLE 32 BITS",
		"name_en": "32-BIT HANDHELD",
		"shader_mode": 1,
		"spec_fr": "Écran nomade couleur 32 bits · Perspective plane",
		"spec_en": "32-bit color handheld · Planar matrix scaling",
	},
	{
		"id": 2,
		"code": "FAMILLE III / V",
		"name_fr": "CONSOLES DE SALON 8 BITS",
		"name_en": "8-BIT HOME SYSTEMS",
		"shader_mode": 2,
		"spec_fr": "Palettes 8 bits contrastées · Balayage phosphore CRT",
		"spec_en": "High-contrast 8-bit palettes · CRT phosphor scan",
	},
	{
		"id": 3,
		"code": "FAMILLE IV / V",
		"name_fr": "CONSOLES 16 BITS",
		"name_en": "16-BIT SYSTEMS",
		"shader_mode": 3,
		"spec_fr": "Multi-parallaxe · Synthèse FM · Démesure Arcade",
		"spec_en": "Multi-parallax · FM synthesis · Arcade super-sprites",
	},
	{
		"id": 4,
		"code": "FAMILLE V / V",
		"name_fr": "CONSOLE 32 BITS",
		"name_en": "32-BIT CONSOLE",
		"shader_mode": 4,
		"spec_fr": "Polygones 3D temps réel · Faisceau optique laser",
		"spec_en": "Real-time 3D polygons · Optical laser beams",
	},
]

## Les 8 Mondes × 3 Secteurs = 24 Secteurs
## Chaque monde dispose d'un cadrage et d'un travelling dédiés dans les
## planches de la séquence (panel_05, panel_06, panel_09) sans répétition fixe.
const WORLDS := [
	{
		"world": 1,
		"console": "FanBoy",
		"family_idx": 0,
		"sectors": [1, 3],
		"sectors_label": "SECTEURS 01 — 03",
		"color": "#b4d642",
		"accent": "#f2dfb6",
		"holo": "res://assets/intro/consoles/holo_01_fanboy.png",
		"hw_badge_fr": "COQUE BEIGE · 4 VERTS OLIVE",
		"hw_badge_en": "BEIGE SHELL · 4 OLIVE SHADES",
		"sig_fr": "Portable verticale beige · Blason ailé, pad bleu & 4 verts olive",
		"sig_en": "Vertical beige handheld · Winged crest, blue pad & 4-olive LCD",
		"bg_panel": "res://assets/intro/panels/panel_09_huit_mondes_constellation.png",
		"cam_zoom": [1.14, 1.24],
		"cam_pan0": [0.00, 0.30],
		"cam_pan1": [0.00, 0.22],
	},
	{
		"world": 2,
		"console": "FanBoy Adventure",
		"family_idx": 1,
		"sectors": [4, 6],
		"sectors_label": "SECTEURS 04 — 06",
		"color": "#7b5cff",
		"accent": "#d8caff",
		"holo": "res://assets/intro/consoles/holo_02_fanboy_adv.png",
		"hw_badge_fr": "VIOLET INDIGO · 2 ACTIONS RONDES",
		"hw_badge_en": "INDIGO SHELL · 2 ROUND ACTIONS",
		"sig_fr": "Portable horizontale violet indigo · Poignées sombres & 2D couleur",
		"sig_en": "Horizontal violet-indigo handheld · Dark grips & 2D color",
		"bg_panel": "res://assets/intro/panels/panel_09_huit_mondes_constellation.png",
		"cam_zoom": [1.16, 1.26],
		"cam_pan0": [0.02, 0.20],
		"cam_pan1": [-0.02, 0.12],
	},
	{
		"world": 3,
		"console": "NEXUS 8",
		"family_idx": 2,
		"sectors": [7, 9],
		"sectors_label": "SECTEURS 07 — 09",
		"color": "#f0485a",
		"accent": "#e8edf5",
		"holo": "res://assets/intro/consoles/holo_03_nexus8.png",
		"hw_badge_fr": "CUBIQUE GRIS/ROUGE · PAD CAPSULE 3B",
		"hw_badge_en": "GREY/RED CUBE · 3B CAPSULE PAD",
		"sig_fr": "Console cubique gris & rouge · Cartouche haute & pad capsule 3 actions",
		"sig_en": "Compact grey & red cube · Top cartridge & 3-action capsule pad",
		"bg_panel": "res://assets/intro/panels/panel_05_mondes_retro_evolution.png",
		"cam_zoom": [1.05, 1.18],
		"cam_pan0": [0.02, -0.10],
		"cam_pan1": [-0.02, 0.06],
	},
	{
		"world": 4,
		"console": "Masterion 8",
		"family_idx": 2,
		"sectors": [10, 12],
		"sectors_label": "SECTEURS 10 — 12",
		"color": "#ff5c38",
		"accent": "#ffc8bc",
		"holo": "res://assets/intro/consoles/holo_04_masterion8.png",
		"hw_badge_fr": "ARCHE NOIRE/ROUGE · PAD RECTANGULAIRE",
		"hw_badge_en": "BLACK/RED ARCH · RECTANGULAR PAD",
		"sig_fr": "Arche facettée noire & rouge · Manette rectangulaire 3 actions",
		"sig_en": "Faceted black & red arch · Rectangular 3-action wireless pad",
		"bg_panel": "res://assets/intro/panels/panel_09_huit_mondes_constellation.png",
		"cam_zoom": [1.18, 1.28],
		"cam_pan0": [-0.02, 0.04],
		"cam_pan1": [0.02, -0.04],
	},
	{
		"world": 5,
		"console": "NEXUS 16",
		"family_idx": 3,
		"sectors": [13, 15],
		"sectors_label": "SECTEURS 13 — 15",
		"color": "#6ea8ff",
		"accent": "#e4f0ff",
		"holo": "res://assets/intro/consoles/holo_05_nexus16.png",
		"hw_badge_fr": "LONGITUDINALE · STICK ARCADE 6B",
		"hw_badge_en": "LONGITUDINAL · 6B ARCADE STICK",
		"sig_fr": "Châssis gris longitudinal · Cartouche large & stick arcade 6 couleurs",
		"sig_en": "Longitudinal grey deck · Wide cartridge & 6-button arcade stick",
		"bg_panel": "res://assets/intro/panels/panel_09_huit_mondes_constellation.png",
		"cam_zoom": [1.18, 1.30],
		"cam_pan0": [0.02, -0.06],
		"cam_pan1": [-0.02, -0.14],
	},
	{
		"world": 6,
		"console": "MegaStorm 16",
		"family_idx": 3,
		"sectors": [16, 18],
		"sectors_label": "SECTEURS 16 — 18",
		"color": "#ff8c38",
		"accent": "#ffe2b0",
		"holo": "res://assets/intro/consoles/holo_06_megastorm16.png",
		"hw_badge_fr": "NOIR/OR · PAD ERGONOMIQUE 5B",
		"hw_badge_en": "BLACK/GOLD · 5B ERGO PAD",
		"sig_fr": "Console noire à coins dorés · Cartouche bombée & pad 5 actions",
		"sig_en": "Wide black & gold deck · Domed cartridge & 5-action pad",
		"bg_panel": "res://assets/intro/panels/panel_06_mondes_16_32_bits.png",
		"cam_zoom": [1.04, 1.16],
		"cam_pan0": [0.00, 0.24],
		"cam_pan1": [0.00, 0.12],
	},
	{
		"world": 7,
		"console": "Arcadion HCS",
		"family_idx": 3,
		"sectors": [19, 21],
		"sectors_label": "SECTEURS 19 — 21",
		"color": "#ebc363",
		"accent": "#fff1be",
		"holo": "res://assets/intro/consoles/holo_07_arcadion_hcs.png",
		"hw_badge_fr": "CENTRALE OR · 2 STATIONS LCD HCS",
		"hw_badge_en": "GOLD CORE · DUAL HCS LCD STATIONS",
		"sig_fr": "Holographic Control Station · Centrale noire/or & 2 stations LCD",
		"sig_en": "Holographic Control Station · Gold core & 2 separate LCD stations",
		"bg_panel": "res://assets/intro/panels/panel_09_huit_mondes_constellation.png",
		"cam_zoom": [1.18, 1.30],
		"cam_pan0": [-0.02, -0.20],
		"cam_pan1": [0.02, -0.28],
	},
	{
		"world": 8,
		"console": "Polytron 32",
		"family_idx": 4,
		"sectors": [22, 24],
		"sectors_label": "SECTEURS 22 — 24",
		"color": "#38c8ff",
		"accent": "#dcf7ff",
		"holo": "res://assets/intro/consoles/holo_08_polytron32.png",
		"hw_badge_fr": "DISQUE OPTIQUE · ÉCRAN VERRE 3D",
		"hw_badge_en": "OPTICAL DISC · HINGED GLASS 3D",
		"sig_fr": "Monocoque blanche à écran transparent · Polygones 3D & pad 4 couleurs",
		"sig_en": "White monocoque with hinged glass screen · 3D polygons & 4-color pad",
		"bg_panel": "res://assets/intro/panels/panel_06_mondes_16_32_bits.png",
		"cam_zoom": [1.04, 1.16],
		"cam_pan0": [0.00, -0.18],
		"cam_pan1": [0.00, -0.28],
	},
]

static func world_of_sector(sector: int) -> Dictionary:
	var idx := clampi((clampi(sector, 1, 24) - 1) / 3, 0, 7)
	return WORLDS[idx]

## Découpage cinématique en 9 scènes (5 Actes) calées sur title.mp3 (134 BPM)
const SCENES := [
	{
		"id": "act1_eclipse",
		"act": 1,
		"t0": 0.00,
		"t1": 8.06,
		"img": "res://assets/intro/panels/panel_01_terre_eclipse.png",
		"kicker_fr": "PROLOGUE · L'ÉCLIPSE DES COULEURS",
		"kicker_en": "PROLOGUE · ECLIPSE OF COLORS",
		"speaker_fr": "VESTA · CONSCIENCE MYSTIQUE",
		"speaker_en": "VESTA · MYSTIC CONSCIOUSNESS",
		"speaker_col": "#7fe6ff",
		"lines_fr": [
			"Depuis l'aube de cet univers, huit vestiges de consoles sacrées insufflaient la couleur, le son et la vie aux étoiles.",
			"Mais l'ombre s'étend désormais d'orbite en orbite, drainant chaque monde vers un silence monochrome."
		],
		"lines_en": [
			"Since the dawn of this universe, eight sacred console relics breathed color, music, and life into the stars.",
			"Yet shadow now spreads from orbit to orbit, draining every world into monochrome silence."
		],
		"manga_stamp": "静寂 // SILENCE",
	},
	{
		"id": "act1_vorax",
		"act": 1,
		"t0": 8.06,
		"t1": 16.12,
		"img": "res://assets/intro/panels/panel_02_vorax_citadelle.png",
		"kicker_fr": "LA MENACE · SEIGNEUR DE LA DÉSOLATION",
		"kicker_en": "THE THREAT · LORD OF DESOLATION",
		"speaker_fr": "VORAX · FLÉAU MÉCANIQUE",
		"speaker_en": "VORAX · MECHANICAL SCOURGE",
		"speaker_col": "#ff4055",
		"lines_fr": [
			"« Je réduirai vos consoles sacrées en cendres ! Plus de couleurs, plus de vie : seuls régneront le chaos et la désolation ! »",
			"Son armée mécanique tient déjà les vingt-quatre secteurs sous sa loi d'acier."
		],
		"lines_en": [
			"\"I shall grind your sacred relics to ash! No color, no life—only chaos and desolation shall reign!\"",
			"His mechanical legions hold all twenty-four sectors beneath an iron decree."
		],
		"manga_stamp": "破壊 // VORAX",
	},
	{
		"id": "act2_awakening",
		"act": 2,
		"t0": 16.12,
		"t1": 23.28,
		"img": "res://assets/intro/panels/panel_04_pilote_eveil.png",
		"kicker_fr": "ORBITE HAUTE · LE PILOTE SANS MÉMOIRE",
		"kicker_en": "HIGH ORBIT · THE AMNESIAC PILOT",
		"speaker_fr": "LE PILOTE · MÉMOIRE EFFACÉE",
		"speaker_en": "THE PILOT · ERASED MEMORY",
		"speaker_col": "#5cc8ff",
		"lines_fr": [
			"« Où suis-je ? Je ne sais plus mon nom, ni rien de ma vie... Seuls mes réflexes de pilote répondent encore. »",
			"Au cœur du cockpit orbital, une lueur mystique traverse le brouillard de son oubli."
		],
		"lines_en": [
			"\"Where am I? I cannot recall my name, nor my life... Only my pilot's instincts still answer.\"",
			"Deep inside the orbital cockpit, a mystic light pierces the fog of his oblivion."
		],
		"manga_stamp": "覚醒 // ÉVEIL",
	},
	{
		"id": "act2_vesta_link",
		"act": 2,
		"t0": 23.28,
		"t1": 28.65,
		"img": "res://assets/intro/panels/panel_03_vesta_archive.png",
		"kicker_fr": "CONNEXION D'ÂME · VESTA SE MANIFESTE",
		"kicker_en": "SOUL LINK · VESTA MANIFESTS",
		"speaker_fr": "VESTA · CONSCIENCE CONNECTÉE",
		"speaker_en": "VESTA · CONNECTED CONSCIOUSNESS",
		"speaker_col": "#c8a8ff",
		"lines_fr": [
			"« N'aie aucune crainte. Je suis Vesta, une conscience liée à la tienne au-delà de l'oubli. »",
			"« Ensemble, préservons les vestiges sacrés que Vorax cherche à anéantir. »"
		],
		"lines_en": [
			"\"Fear not. I am Vesta—a consciousness bound to yours beyond oblivion.\"",
			"\"Together, let us preserve the sacred relics Vorax seeks to annihilate.\""
		],
		"manga_stamp": "共鳴 // LIEN",
	},
	{
		"id": "act3_worlds_cascade",
		"act": 3,
		"t0": 28.65,
		"t1": 43.00,
		"img": "res://assets/intro/panels/panel_09_huit_mondes_constellation.png",
		"kicker_fr": "8 MONDES — 24 SECTEURS · 5 FAMILLES TECHNOLOGIQUES",
		"kicker_en": "8 WORLDS — 24 SECTORS · 5 TECH FAMILIES",
		"speaker_fr": "VESTA · CARTOGRAPHIE SACRÉE",
		"speaker_en": "VESTA · SACRED CARTOGRAPHY",
		"speaker_col": "#7fe6ff",
		"lines_fr": [
			"Huit consoles sacrées unies en cinq familles technologiques : du portable 8 bits jusqu'aux polygones 32 bits.",
			"Trois secteurs par monde — vingt-quatre batailles pour rallumer les couleurs de l'univers !"
		],
		"lines_en": [
			"Eight sacred systems across five technological families: from 8-bit handhelds to 32-bit polygons.",
			"Three sectors per world—twenty-four battles to relight the colors of the universe!"
		],
		"manga_stamp": "進化 // 8 MONDES",
	},
	{
		"id": "act4_confrontation",
		"act": 4,
		"t0": 43.00,
		"t1": 49.25,
		"img": "res://assets/intro/panels/panel_10_clash_energie.png",
		"kicker_fr": "ONDE DE CHOC · L'ARMÉE DE VORAX ATTAQUE",
		"kicker_en": "SHOCKWAVE · VORAX'S ARMY STRIKES",
		"speaker_fr": "VORAX · COMMANDEMENT SUPRÊME",
		"speaker_en": "VORAX · SUPREME COMMAND",
		"speaker_col": "#ff4055",
		"lines_fr": [
			"« Aucun chasseur solitaire ne franchira mes vingt-quatre gardiens ! Sombrez dans le gris éternel ! »"
		],
		"lines_en": [
			"\"No lone fighter shall breach my twenty-four guardians! Sink into eternal grey!\""
		],
		"manga_stamp": "激突 // CHOC",
	},
	{
		"id": "act4_ignition",
		"act": 4,
		"t0": 49.25,
		"t1": 56.42,
		"img": "res://assets/intro/panels/panel_07_vanguard_ignition.png",
		"kicker_fr": "SERMENT DU PILOTE · MISE À FEU DU VANGUARD",
		"kicker_en": "PILOT'S OATH · VANGUARD IGNITION",
		"speaker_fr": "LE PILOTE · CHASSEUR VANGUARD",
		"speaker_en": "THE PILOT · VANGUARD FIGHTER",
		"speaker_col": "#ffd166",
		"lines_fr": [
			"« J'ignore tout de mon passé, Vesta... mais j'accepte ta mission ! »",
			"« Bimoteurs plasma à cent pour cent — nous rendrons la vie aux huit mondes ! »"
		],
		"lines_en": [
			"\"I know nothing of my past, Vesta... yet I accept your mission!\"",
			"\"Twin plasma engines at one hundred percent—we will restore life to all eight worlds!\""
		],
		"manga_stamp": "点火 // IGNITION",
	},
	{
		"id": "act5_launch",
		"act": 5,
		"t0": 56.42,
		"t1": 63.58,
		"img": "res://assets/intro/panels/panel_05_mondes_retro_evolution.png",
		"kicker_fr": "CATAPULTAGE ORBITAL · CONTRE-OFFENSIVE VANGUARD",
		"kicker_en": "ORBITAL CATAPULT · VANGUARD COUNTER-OFFENSIVE",
		"speaker_fr": "VESTA & LE PILOTE",
		"speaker_en": "VESTA & THE PILOT",
		"speaker_col": "#4cf4ff",
		"lines_fr": [
			"« Nos consciences ne font qu'une ! De FanBoy à Polytron 32, brise les chaînes de Vorax ! »"
		],
		"lines_en": [
			"\"Our minds beat as one! From FanBoy to Polytron 32, shatter Vorax's chains!\""
		],
		"manga_stamp": "出撃 // ENVOL !",
	},
	{
		"id": "act5_title_climax",
		"act": 5,
		"t0": 63.58,
		"t1": 71.64,
		"img": "res://assets/intro/panels/panel_08_envol_final.png",
		"kicker_fr": "8 MONDES — 24 SECTEURS · 5 FAMILLES TECHNOLOGIQUES",
		"kicker_en": "8 WORLDS — 24 SECTORS · 5 TECH FAMILIES",
		"speaker_fr": "NEO VANGUARD",
		"speaker_en": "NEO VANGUARD",
		"speaker_col": "#ffd166",
		"lines_fr": [
			"Préservez les vestiges sacrés. Rallumez les couleurs de l'univers."
		],
		"lines_en": [
			"Preserve the sacred relics. Relight the colors of the universe."
		],
		"manga_stamp": "開幕 // START",
	},
]

const SFX_CUES := [
	{ "t": 0.15,  "sfx": "sfx_cue_vesta",             "vol_db": -4.0 },
	{ "t": 8.06,  "sfx": "sfx_manga_slash",           "vol_db": -1.5 },
	{ "t": 8.10,  "sfx": "sfx_vorax_dread_horn",      "vol_db": -1.0 },
	{ "t": 8.35,  "sfx": "sfx_glitch_burst",          "vol_db": -2.5 },
	{ "t": 12.20, "sfx": "sfx_cue_vorax",             "vol_db": -2.5 },
	{ "t": 16.12, "sfx": "sfx_manga_slash",           "vol_db": -2.0 },
	{ "t": 16.20, "sfx": "sfx_neural_awaken",         "vol_db": -1.5 },
	{ "t": 20.15, "sfx": "sfx_cue_pilote",            "vol_db": -3.5 },
	{ "t": 23.28, "sfx": "sfx_hologram_materialize",  "vol_db": -1.5 },
	{ "t": 25.75, "sfx": "sfx_cue_vesta",             "vol_db": -4.0 },
	{ "t": 28.65, "sfx": "sfx_manga_slash",           "vol_db": -2.0 },
	{ "t": 28.68, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 30.44, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 32.23, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 34.02, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 35.82, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 37.61, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 39.40, "sfx": "sfx_world_card_tick",       "vol_db": -2.0 },
	{ "t": 41.19, "sfx": "sfx_world_card_tick",       "vol_db": -1.0 },
	{ "t": 43.00, "sfx": "sfx_manga_slash",           "vol_db": -1.0 },
	{ "t": 43.08, "sfx": "sfx_glitch_burst",          "vol_db": -1.5 },
	{ "t": 43.35, "sfx": "sfx_cue_vorax",             "vol_db": -2.0 },
	{ "t": 49.25, "sfx": "sfx_manga_slash",           "vol_db": -1.5 },
	{ "t": 49.45, "sfx": "sfx_cue_pilote",            "vol_db": -3.5 },
	{ "t": 53.20, "sfx": "sfx_reactor_charge",        "vol_db": -1.0 },
	{ "t": 56.42, "sfx": "sfx_catapult_launch",       "vol_db":  0.0 },
	{ "t": 57.10, "sfx": "sfx_cue_vesta",             "vol_db": -3.5 },
	{ "t": 63.58, "sfx": "sfx_logo_impact",           "vol_db":  0.0 },
]
