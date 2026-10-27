extends Node
## =========================================================================
## DATA — toutes les tables de jeu, valeurs EXACTES du moteur JavaScript
## (js/02-moteur-jeu.js du dépôt Neo-vanguard). Chaque constante porte le
## même nom et la même valeur que dans le code d'origine.
## =========================================================================

# --- référentiel de jeu (identique au JS) --------------------------------
const L_W := 480.0
const W := 480.0
const H := 860.0
# Terrain de jeu (FanBoy secteurs 1–3 : sous-écran portrait 620×890 → 480×689 ; sinon 480×860)
var FW := 480.0
var FH := 860.0
const FANBOY_FH := 689.0
# Rect fenêtre du sous-écran FanBoy (937×1679 → 480×860 : Rect2(158, 287, 620, 890) × 0.51221)
const GLASS := Rect2(81, 147, 318, 456)

## (C10) rampe d'alerte du cadre lumineux : vert → jaune → orange → rouge.
## p = progression du secteur (0..1, NVGame.sector_progress).
static func progress_color(p: float) -> Color:
	var stops: Array[Color] = [Color("#3adf6c"), Color("#ffd166"), Color("#ff9a3c"), Color("#ff4040")]
	var t: float = clampf(p, 0.0, 1.0) * 3.0
	var i: int = mini(int(t), 2)
	return stops[i].lerp(stops[i + 1], t - float(i))
# Encres LCD de la console (fond sauge, structures olive — module 51)
const INKS := ["#2f3329", "#595c4c", "#7d8267", "#9ea483"]
const L_H := 860.0
const SCROLL_SPEED := 95.0

const STAGES_PER_ERA := 4            # quatre zones par ère moteur interne
const MAX_LEVEL := 24                # 8 mondes × 3 secteurs = 24 secteurs

## Canon officiel des 8 consoles inventées (3 secteurs par monde, zéro marque tierce)
const CONSOLES := [
	{ "world": 1, "name": "FanBoy",           "tag": "PORTABLE 8 BITS",      "sectors": "1-3",   "color": "#b4d642", "holo": "res://assets/intro/consoles/holo_01_fanboy.png" },
	{ "world": 2, "name": "FanBoy Adventure", "tag": "PORTABLE 32 BITS",     "sectors": "4-6",   "color": "#7b5cff", "holo": "res://assets/intro/consoles/holo_02_fanboy_adv.png" },
	{ "world": 3, "name": "NEXUS 8",          "tag": "SALON 8 BITS",         "sectors": "7-9",   "color": "#f0485a", "holo": "res://assets/intro/consoles/holo_03_nexus8.png" },
	{ "world": 4, "name": "Masterion 8",      "tag": "SALON 8 BITS",         "sectors": "10-12", "color": "#ff5c38", "holo": "res://assets/intro/consoles/holo_04_masterion8.png" },
	{ "world": 5, "name": "NEXUS 16",         "tag": "SALON 16 BITS",        "sectors": "13-15", "color": "#6ea8ff", "holo": "res://assets/intro/consoles/holo_05_nexus16.png" },
	{ "world": 6, "name": "MegaStorm 16",     "tag": "SALON 16 BITS",        "sectors": "16-18", "color": "#ff8c38", "holo": "res://assets/intro/consoles/holo_06_megastorm16.png" },
	{ "world": 7, "name": "Arcadion HCS",     "tag": "16 BITS ARCADE · HCS", "sectors": "19-21", "color": "#ebc363", "holo": "res://assets/intro/consoles/holo_07_arcadion_hcs.png" },
	{ "world": 8, "name": "Polytron 32",      "tag": "CONSOLE 32 BITS",      "sectors": "22-24", "color": "#38c8ff", "holo": "res://assets/intro/consoles/holo_08_polytron32.png" },
]

func console_of_level(l: int) -> Dictionary:
	var idx := clampi((clampi(l, 1, MAX_LEVEL) - 1) / 3, 0, 7)
	return CONSOLES[idx]

# --- combo & graze --------------------------------------------------------
const COMBO_STEP := 0.05             # chaque ennemi enchaîné vaut +0,05 ×
const COMBO_CAP := 60                # plafond : ×4
const COMBO_WINDOW := 1.6            # secondes pour enchaîner
const GRAZE_PTS := 6                 # points par frôlement

# --- boss ----------------------------------------------------------------
const BOSS_TOUGH := 2.6              # multiplicateur de vie des boss
const BOSS_WARN_DUR := 3.6           # durée de l'alerte amirale
const HARVEST_DUR := 6.4             # fenêtre de récolte après le boss
const INTRO_DUR := 2.2               # bannière de début de secteur

# six générations de consoles (id, style, échelle interne, nom, tag...)
# S = pixels de buffer par unité logique (l'effet « vieille console »)
const ERAS := [
	{ "id": 0, "sty": 0, "K": 0.25,  "sys": "KFM-01",   "tag": "8-BIT · POCKET",
		"name": "CORE MEMORY", "ramp": 3,   "max_parts": 70,   "star_layers": 2 },
	{ "id": 1, "sty": 1, "K": 1.0/3.0, "sys": "8-BIT+",  "tag": "8-BIT ÉTENDU · HOME SYSTEM",
		"name": "WIREFRAME",   "ramp": 7,   "max_parts": 420,  "star_layers": 3 },
	{ "id": 2, "sty": 2, "K": 0.5,   "sys": "16-BIT",   "tag": "16-BIT · GÉNÉRATION DOMESTIQUE",
		"name": "16-BIT RIVALRY", "ramp": 15, "max_parts": 1500, "star_layers": 4 },
	{ "id": 3, "sty": 2, "K": 0.62,  "sys": "ARCADE",   "tag": "16-BIT · ARCADE",
		"name": "ARCADE POWER", "ramp": 31,  "max_parts": 2600, "star_layers": 5 },
	{ "id": 4, "sty": 3, "K": 0.74,  "sys": "32-BIT CD", "tag": "32-BIT · CD-ROM · NOVA CD",
		"name": "CD-ROM · POLYGON DAWN", "ramp": 63, "max_parts": 2200, "star_layers": 4 },
	{ "id": 5, "sty": 3, "K": 1.0,   "sys": "HD",       "tag": "HD · RENDU VECTORIEL TEMPS RÉEL",
		"name": "SINGULARITY", "ramp": 255, "max_parts": 3600, "star_layers": 6 },
]

# palettes officielles des ères (PAL1..PAL4 du JS)
const PAL1 := ["#000000","#080a1c","#0a1030","#16245c","#4a90d9","#8fd3ff","#ffffff","#d9f2ff"]
const PAL2 := ["#05060f","#0c1230","#16205c","#2a3f9e","#3f6fe0","#38e0ff","#aef2ff","#ffffff"]
const PAL3 := ["#04030e","#0a0722","#140f3c","#241a66","#3b2a9e","#5a3fd9","#8a6bff","#c9b8ff"]
const PAL4 := ["#05060a","#0b0e18","#141a2b","#232c45","#3a4666","#5a6a92","#8d9ec7","#d6e2ff"]

# accents d'interface par ère (UIACC)
const UIACC := [
	["#a3ad35", "#c2c95c"], ["#4a90d9", "#f24fd9"], ["#38e0ff", "#ff4d6d"],
	["#ff9a3d", "#ff4fb0"], ["#8d9ec7", "#ffbe6b"], ["#4be7ff", "#ff5fa2"],
]

# --- cosmétiques ----------------------------------------------------------
const LIVERIES := [
	{ "id": "squadron", "name": "ESCADRILLE", "price": 0, "gb": ["#0F2E1C","#2f5c27","#6f8a1f","#a3ad35"] },
	{ "id": "green",    "name": "FORÊT KODAMA", "price": 0, "gb": ["#0F2E1C","#2f5c27","#6f8a1f","#a3ad35"] },
	{ "id": "pocket",   "name": "POCKET", "price": 250, "gb": ["#101010","#3c3c3c","#8c8c8c","#d8d8d8"] },
	{ "id": "amber",    "name": "AMBRE CRT", "price": 400, "gb": ["#180d00","#5a3200","#c07a00","#ffc35a"] },
	{ "id": "azure",    "name": "AZUR", "price": 650, "gb": ["#000913","#123a6b","#3f8fd9","#a9dcff"] },
	{ "id": "plasma",   "name": "PLASMA", "price": 900, "gb": ["#150015","#5c0850","#c01c96","#ff7ad9"] },
	{ "id": "quantum",  "name": "QUANTUM", "price": 1500, "gb": ["#02000e","#241b6b","#6a4dff","#c9b8ff"] },
]
const TRAILS := [
	{ "id": "pixel",  "name": "PIXEL",   "price": 0 },
	{ "id": "plasma", "name": "PLASMA",  "price": 350 },
	{ "id": "ion",    "name": "ION",     "price": 750 },
	{ "id": "quantum","name": "QUANTUM", "price": 1400 },
]
const AURAS := [
	{ "id": "none",  "name": "AUCUNE",     "price": 0,    "col": "" },
	{ "id": "flame", "name": "FLAMME",     "price": 500,  "col": "#ff7a2a" },
	{ "id": "cryo",  "name": "CRYO",       "price": 500,  "col": "#7ae8ff" },
	{ "id": "volt",  "name": "ÉLECTRIQUE", "price": 1000, "col": "#c9a8ff" },
	{ "id": "gold",  "name": "AURUM",      "price": 1800, "col": "#ffd45a" },
]
const BULLET_SKINS := [
	{ "id": "stock",   "name": "STANDARD", "price": 0,   "main": "",        "lite": "" },
	{ "id": "ion",     "name": "ION CYAN", "price": 450, "main": "#31c9ef", "lite": "#e4fdff" },
	{ "id": "solar",   "name": "SOLAIRE",  "price": 650, "main": "#ff8a35", "lite": "#fff0b0" },
	{ "id": "nova",    "name": "NOVA",     "price": 850, "main": "#e342bc", "lite": "#ffe3fb" },
	{ "id": "verdant", "name": "VERDANT",  "price": 950, "main": "#2fe08a", "lite": "#e2ffbd" },
]

# --- vaisseaux (valeurs exactes) ------------------------------------------
const SHIPS := [
	{ "id": "falcon",     "name": "VANGUARD MK-I",     "price": 0,    "speed": 1.00, "hp": 0,  "fire": 1.00, "perk": "—" },
	{ "id": "falconA",    "name": "FALCON-A « MARTEAU »", "price": 1250, "speed": 0.90, "hp": 2,  "fire": 0.98, "perk": "Blindage lourd : +1 bouclier · collisions -25 %" },
	{ "id": "falconB",    "name": "FALCON-B « LAME »", "price": 1050, "speed": 1.30, "hp": -1, "fire": 1.18, "perk": "Vif : cadence +18 % · esquive 8 %" },
	{ "id": "viper",      "name": "VIPÈRE",            "price": 450,  "speed": 1.38, "hp": -1, "fire": 1.12, "perk": "Esquive : 15 % d'annuler un tir reçu" },
	{ "id": "titan",      "name": "TITAN",             "price": 950,  "speed": 0.84, "hp": 3,  "fire": 0.92, "perk": "Dégâts de collision divisés par 2" },
	{ "id": "spectre",    "name": "SPECTRE",           "price": 1700, "speed": 1.12, "hp": 1,  "fire": 1.06, "perk": "Tirs perforants · démarre avec 1 drone" },
	{ "id": "singularis", "name": "SINGULARIS",        "price": 3200, "speed": 1.22, "hp": 2,  "fire": 1.22, "perk": "+1 drone · bouclier régénérant · aimant ×1.5" },
]

# --- armes (valeurs exactes) ----------------------------------------------
const WEAPONS := [
	{ "id": "pulse",  "name": "PULSE",          "price": 0 },
	{ "id": "spread", "name": "SPREAD",         "price": 600 },
	{ "id": "laser",  "name": "LASER",          "price": 1000 },
	{ "id": "plasma", "name": "PLASMA",         "price": 1600 },
	{ "id": "rail",   "name": "RAILGUN",        "price": 2600 },
	{ "id": "homing", "name": "MISSILES GUIDÉS","price": 3400 },
]
const FIRE_CD := { "pulse": 0.115, "spread": 0.20, "laser": 0.155, "plasma": 0.34, "rail": 0.44, "homing": 0.42 }

# --- équipements (prix et effets exacts) -----------------------------------
const UPGRADES := [
	{ "id": "hull",   "name": "BLINDAGE",   "price": 300, "max": 5, "step": "+1 coque max" },
	{ "id": "engine", "name": "RÉACTEUR",   "price": 270, "max": 5, "step": "+6 % de vitesse" },
	{ "id": "rate",   "name": "CADENCE",    "price": 340, "max": 5, "step": "+7 % de cadence" },
	{ "id": "drone",  "name": "SATELLITES", "price": 600, "max": 3, "step": "+1 drone d'escorte" },
	{ "id": "shield", "name": "BOUCLIER",   "price": 700, "max": 3, "step": "+1 charge · régénération" },
	{ "id": "magnet", "name": "AIMANT",     "price": 320, "max": 4, "step": "+45 % de rayon de collecte" },
	{ "id": "credit", "name": "NÉGOCE",     "price": 420, "max": 4, "step": "+15 % de coins gagnés" },
	{ "id": "dmg",    "name": "SURCHARGE",  "price": 520, "max": 5, "step": "+8 % de dégâts" },
	{ "id": "luck",   "name": "TÉLÉMÉTRIE", "price": 380, "max": 3, "step": "Meilleures chances de bonus" },
	{ "id": "bomb",   "name": "BOMBES",     "price": 200, "max": 9, "step": "+1 bombe (consommable)", "consumable": true },
]

# --- difficultés (valeurs exactes) -----------------------------------------
const DIFFS := [
	{ "name": "CADET",  "hp": 0.8,  "bs": 0.88, "dmg": 0.75, "credit": 0.85, "lives": 4 },
	{ "name": "PILOTE", "hp": 1.0,  "bs": 1.0,  "dmg": 1.0,  "credit": 1.0,  "lives": 3 },
	{ "name": "AS",     "hp": 1.35, "bs": 1.16, "dmg": 1.35, "credit": 1.3,  "lives": 2 },
]

# --- codes de triche (identiques) ------------------------------------------
const CHEATS := [
	{ "id": "lives",   "code": "kabrak77",   "name": "VIES INFINIES",        "type": "toggle", "hint": "un pseudo… suivi de 77" },
	{ "id": "god",     "code": "invincible", "name": "COQUE INDESTRUCTIBLE", "type": "toggle", "hint": "adjectif anglais, 10 lettres" },
	{ "id": "power",   "code": "maxpower",   "name": "ARMEMENT MAXIMAL",     "type": "toggle", "hint": "« puissance max » en anglais, collé" },
	{ "id": "rage",    "code": "overdrive",  "name": "OVERDRIVE",            "type": "toggle", "hint": "surrégime, en anglais" },
	{ "id": "slow",    "code": "matrix",     "name": "TEMPS RALENTI",        "type": "toggle", "hint": "le film de 1999" },
	{ "id": "rich",    "code": "banque",     "name": "JACKPOT",              "type": "action", "hint": "l'endroit où l'on garde son argent" },
	{ "id": "unlock",  "code": "sesame",     "name": "OUVRE-TOI",            "type": "action", "hint": "la formule magique d'Ali Baba" },
	{ "id": "jump",    "code": "saut",       "name": "SAUT DE SECTEUR",      "type": "select", "hint": "ce que fait un kangourou" },
	{ "id": "flipper", "code": "CAFAITFLIPPER", "name": "MODE FLIPPER",      "type": "action", "hint": "le nom du jeu, tout en majuscules" },
	{ "id": "bombs",   "code": "KAMIKAZE",   "name": "BOMBES INFINIES",      "type": "toggle", "hint": "le pilote qui fonce sur sa cible, en majuscules" },
]

# --- ennemis (hp, rayon, score, coins, mouvement, tir — valeurs exactes) ----
const ETYPES := {
	"drone":     { "hp": 3,  "r": 20, "sc": 60,  "cr": [0, 3],   "mv": "dive",   "mvx": 1.0,  "fire": null, "tiers": 1 },
	"stinger":   { "hp": 4,  "r": 21, "sc": 95,  "cr": [1, 4],   "mv": "zig",    "mvx": 1.0,  "fire": { "n": 1, "cd": 2.3, "sp": 1.0,  "kind": "aimed" }, "tiers": 1 },
	"turret":    { "hp": 9,  "r": 24, "sc": 150, "cr": [2, 6],   "mv": "hover",  "mvx": 0.4,  "fire": { "n": 3, "cd": 1.9, "sp": 0.95, "kind": "fan", "arc": 0.42 }, "tiers": 2 },
	"runner":    { "hp": 3,  "r": 18, "sc": 85,  "cr": [1, 3],   "mv": "diag",   "mvx": 1.0,  "fire": null, "tiers": 2 },
	"shielder":  { "hp": 14, "r": 32, "sc": 240, "cr": [3, 9],   "mv": "patrol", "mvx": 0.7,  "fire": { "n": 5, "cd": 2.4, "sp": 0.9,  "kind": "fan", "arc": 0.95 }, "tiers": 3, "guard": true },
	"splitter":  { "hp": 11, "r": 27, "sc": 170, "cr": [2, 6],   "mv": "dive",   "mvx": 0.8,  "fire": null, "tiers": 3, "split": 2 },
	"swarmlet":  { "hp": 1,  "r": 11, "sc": 30,  "cr": [0, 2],   "mv": "charge", "mvx": 1.0,  "fire": null, "tiers": 1 },
	"carrier":   { "hp": 26, "r": 45, "sc": 420, "cr": [8, 16],  "mv": "patrol", "mvx": 0.45, "fire": { "n": 4, "cd": 2.7, "sp": 0.85, "kind": "fan", "arc": 0.6 }, "tiers": 4, "spawner": "swarmlet" },
	"elite":     { "hp": 70, "r": 40, "sc": 900, "cr": [18, 30], "mv": "patrol", "mvx": 0.5,  "fire": { "n": 5, "cd": 1.5, "sp": 1.05, "kind": "fan", "arc": 0.55 }, "tiers": 2, "elite": true },
	"mine":      { "hp": 6,  "r": 26, "sc": 120, "cr": [2, 5],   "mv": "hover",  "mvx": 0.35, "fire": null, "tiers": 3, "ring": 12 },
	"sniper":    { "hp": 8,  "r": 22, "sc": 190, "cr": [3, 7],   "mv": "hover",  "mvx": 0.5,  "fire": { "n": 1, "cd": 1.5, "sp": 1.75, "kind": "aimed" }, "tiers": 4 },
	# ---- module 20 : huit engins réguliers --------------------------------
	"bomber":    { "hp": 10, "r": 26, "sc": 160,  "cr": [2, 6],   "mv": "cross",  "mvx": 0.62, "fire": { "n": 1, "cd": 0.85, "sp": 1.0, "kind": "drop" }, "tiers": 2 },
	"kamikaze":  { "hp": 5,  "r": 18, "sc": 110,  "cr": [1, 4],   "mv": "home",   "mvx": 1.25, "fire": null, "tiers": 1, "ring": 6 },
	"layer":     { "hp": 16, "r": 30, "sc": 220,  "cr": [4, 8],   "mv": "patrol", "mvx": 0.5,  "fire": null, "tiers": 3, "layer": 2.3 },
	"lancer":    { "hp": 14, "r": 26, "sc": 240,  "cr": [4, 9],   "mv": "hover",  "mvx": 0.45, "fire": { "n": 1, "cd": 3.6, "sp": 1.0, "kind": "beam" }, "tiers": 3 },
	"missileer": { "hp": 12, "r": 24, "sc": 200,  "cr": [3, 8],   "mv": "zig",    "mvx": 0.7,  "fire": { "n": 2, "cd": 2.7, "sp": 1.0, "kind": "missile" }, "tiers": 3 },
	"phalanx":   { "hp": 18, "r": 28, "sc": 210,  "cr": [3, 8],   "mv": "rank",   "mvx": 0.5,  "fire": { "n": 6, "cd": 2.9, "sp": 1.0, "kind": "wall" }, "tiers": 3 },
	"weaver":    { "hp": 7,  "r": 20, "sc": 130,  "cr": [2, 5],   "mv": "weave",  "mvx": 0.9,  "fire": { "n": 3, "cd": 1.7, "sp": 1.0, "kind": "spiral" }, "tiers": 2 },
	"tanker":    { "hp": 40, "r": 38, "sc": 380,  "cr": [8, 14],  "mv": "dive",   "mvx": 0.33, "fire": { "n": 8, "cd": 3.2, "sp": 0.9, "kind": "ring" }, "tiers": 4, "split": 4 },
	# ---- mini-boss : un par génération, rencontré à mi-secteur ------------
	"mGuardian":  { "hp": 150, "r": 48, "sc": 2400, "cr": [40, 60],  "mv": "patrol", "mvx": 0.4, "fire": { "n": 10, "cd": 2.0, "sp": 0.9,  "kind": "ring" }, "tiers": 9, "mini": true, "scale": 2.0, "aim": { "n": 3, "cd": 1.4, "arc": 0.5 }, "eid": "turret" },
	"mForeman":   { "hp": 190, "r": 50, "sc": 2800, "cr": [50, 70],  "mv": "patrol", "mvx": 0.5, "fire": { "n": 7, "cd": 2.2, "sp": 0.95, "kind": "fan", "arc": 1.1 }, "tiers": 9, "mini": true, "scale": 1.9, "guard": true, "eid": "shielder" },
	"mMatriarch": { "hp": 230, "r": 54, "sc": 3200, "cr": [60, 80],  "mv": "patrol", "mvx": 0.4, "fire": { "n": 5, "cd": 2.4, "sp": 0.9,  "kind": "fan", "arc": 0.7 }, "tiers": 9, "mini": true, "scale": 1.7, "spawner": "stinger", "eid": "carrier" },
	"mCroupier":  { "hp": 220, "r": 50, "sc": 3400, "cr": [60, 90],  "mv": "weave",  "mvx": 0.6, "fire": { "n": 4, "cd": 1.5, "sp": 1.0,  "kind": "spiral" }, "tiers": 9, "mini": true, "scale": 1.8, "split": 4, "ring": 16, "eid": "splitter" },
	"mArchivist": { "hp": 210, "r": 46, "sc": 3600, "cr": [60, 90],  "mv": "hover",  "mvx": 0.5, "fire": { "n": 3, "cd": 2.4, "sp": 1.0,  "kind": "missile" }, "tiers": 9, "mini": true, "scale": 2.0, "aim": { "n": 1, "cd": 1.1, "arc": 0.0, "sp": 1.7 }, "eid": "sniper" },
	"mHerald":    { "hp": 300, "r": 48, "sc": 4200, "cr": [80, 120], "mv": "blink",  "mvx": 0.5, "fire": { "n": 5, "cd": 1.6, "sp": 1.05, "kind": "spiral" }, "tiers": 9, "mini": true, "scale": 1.5, "aim": { "n": 6, "cd": 2.6, "kind": "wall" }, "eid": "elite" },
}

# noms affichés (ENAMES) + le mini-boss de chaque génération (MINI_OF_ERA)
const ENAMES := {
	"drone": "DRONE", "stinger": "PIQUEUR", "runner": "COUREUR", "turret": "TOURELLE",
	"shielder": "BOUCLIER", "splitter": "DIVISEUR", "swarmlet": "ESSAIM", "carrier": "PORTEUSE",
	"elite": "ÉLITE", "mine": "MINE", "sniper": "TIREUR",
	"bomber": "BOMBARDIER", "kamikaze": "KAMIKAZE", "layer": "MINEUR", "lancer": "LANCE",
	"missileer": "LANCEUR", "phalanx": "PHALANGE", "weaver": "TISSEUR", "tanker": "CHAR",
	"mGuardian": "GARDIEN DU SILO", "mForeman": "CONTREMAÎTRE", "mMatriarch": "MATRIARCHE",
	"mCroupier": "CROUPIER", "mArchivist": "ARCHIVISTE", "mHerald": "HÉRAUT",
}
const MINI_OF_ERA := ["mGuardian", "mForeman", "mMatriarch", "mCroupier", "mArchivist", "mHerald"]

# couleurs d'identité des ennemis (teinte, saturation, luminosité)
const ETHEME := {
	"drone":    { "h": 350, "s": 0.72, "l": 0.5 },
	"stinger":  { "h": 22,  "s": 0.82, "l": 0.52 },
	"runner":   { "h": 45,  "s": 0.78, "l": 0.5 },
	"swarmlet": { "h": 14,  "s": 0.8,  "l": 0.55 },
	"turret":   { "h": 278, "s": 0.5,  "l": 0.45 },
	"shielder": { "h": 305, "s": 0.58, "l": 0.44 },
	"splitter": { "h": 325, "s": 0.66, "l": 0.5 },
	"carrier":  { "h": 358, "s": 0.44, "l": 0.44 },
	"elite":    { "h": 190, "s": 0.7,  "l": 0.5 },
	"mine":     { "h": 36,  "s": 0.6,  "l": 0.5 },
	"sniper":   { "h": 210, "s": 0.6,  "l": 0.5 },	# ---- module 20 : teintes des huit engins + six mini-boss --------------
	"bomber":    { "h": 200, "s": 0.55, "l": 0.46 },
	"kamikaze":  { "h": 8,   "s": 0.9,  "l": 0.52 },
	"layer":     { "h": 110, "s": 0.5,  "l": 0.42 },
	"lancer":    { "h": 262, "s": 0.6,  "l": 0.48 },
	"missileer": { "h": 32,  "s": 0.7,  "l": 0.46 },
	"phalanx":   { "h": 215, "s": 0.6,  "l": 0.44 },
	"weaver":    { "h": 150, "s": 0.6,  "l": 0.46 },
	"tanker":    { "h": 345, "s": 0.5,  "l": 0.42 },
	"mGuardian": { "h": 120, "s": 0.6,  "l": 0.46 },
	"mForeman":  { "h": 36,  "s": 0.7,  "l": 0.5 },
	"mMatriarch":{ "h": 330, "s": 0.6,  "l": 0.48 },
	"mCroupier": { "h": 52,  "s": 0.85, "l": 0.5 },
	"mArchivist":{ "h": 212, "s": 0.6,  "l": 0.5 },
	"mHerald":   { "h": 318, "s": 0.7,  "l": 0.52 },
}

# --- butin ------------------------------------------------------------------
const PKIND := {
	"power":   { "ch": "P", "col": "#ffd166", "name": "PUISSANCE" },
	"shield":  { "ch": "B", "col": "#4be7ff", "name": "BOUCLIER" },
	"hull":    { "ch": "V", "col": "#4dff9e", "name": "COQUE" },
	"credit":  { "ch": "$", "col": "#ffe066", "name": "COINS" },
	"bomb":    { "ch": "O", "col": "#ff7ad9", "name": "BOMBE" },
	"scrap":   { "ch": "F", "col": "#c7a779", "name": "FERRAILLE" },
	"crystal": { "ch": "C", "col": "#68e8ff", "name": "CRISTAL" },
	"circuit": { "ch": "D", "col": "#95ffaf", "name": "CIRCUIT" },
}
const MATERIALS := [
	{ "id": "scrap",   "name": "Ferraille d'armure", "short": "FERRAILLE", "price": 25 },
	{ "id": "crystal", "name": "Cristal d'étoile",   "short": "CRISTAL",   "price": 75 },
	{ "id": "circuit", "name": "Circuit ancien",     "short": "CIRCUIT",   "price": 150 },
]

# --- boss : les 4 coques de base du JS --------------------------------------
const BOSSES_BASE := [
	{ "name": "GOLIATH-PRIME", "hp": 1500, "r": 132, "sc": 5000,  "cr": 900,  "color": 0 },
	{ "name": "WARDEN-7",      "hp": 2200, "r": 138, "sc": 7500,  "cr": 1400, "color": 1 },
	{ "name": "HYDRA-NEXUS",   "hp": 3000, "r": 144, "sc": 10000, "cr": 2000, "color": 2, "parts": 3 },
	{ "name": "OMEGA-VECTOR",  "hp": 4000, "r": 150, "sc": 14000, "cr": 2800, "color": 3, "teleport": true },
]
# répartition des 24 secteurs (BOSS_OF_LEVEL du JS) : index coque + index musique
const BOSS_OF_LEVEL := [4, 5, 6, 0, 7, 8, 9, 1, 10, 11, 12, 2, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 3, 23]

# --- LA BOÎTE DE JEU (annonce de secteur) — couleurs de jaquette coverCol ---
const BOX_DUR := 6.0
const BOXLABEL := ["POCKET · KFM-01", "HOME SYSTEM · 8 BITS", "SUPER 16 · PAL",
	"ARCADIA · SHOCKBOX", "NOVA CD · CD-ROM", "HD · HD DISC"]
const BOX_COVER := [
	{ "sky": "", "sky2": "", "sky3": "", "hull": "", "ink": "", "acc": "", "glow": "", "warm": "" },
	{ "sky": "#0a1030", "sky2": "#16245c", "sky3": "#4a90d9", "hull": "#d9f2ff", "ink": "#000000", "acc": "#f24fd9", "glow": "#ffb03a", "warm": "#4fd97a" },
	{ "sky": "#16205c", "sky2": "#2a3f9e", "sky3": "#38e0ff", "hull": "#ffffff", "ink": "#05060f", "acc": "#e05cff", "glow": "#aef2ff", "warm": "#3ff08b" },
	{ "sky": "#140f3c", "sky2": "#8c0f5c", "sky3": "#ff4fb0", "hull": "#ffffff", "ink": "#04030e", "acc": "#ffb03a", "glow": "#8ff0ff", "warm": "#ffd6f2" },
	{ "sky": "#04070f", "sky2": "#0c1830", "sky3": "#1c2f56", "hull": "#cfd9e8", "ink": "#03050c", "acc": "#8d9ec7", "glow": "#ffbe6b", "warm": "#ff9a3d" },
	{ "sky": "#03060f", "sky2": "#0a142c", "sky3": "#241a5c", "hull": "#eaf6ff", "ink": "#020409", "acc": "#4be7ff", "glow": "#4be7ff", "warm": "#ff5fa2" },
]

# les 24 visages du boss, avec leur jeu d'attaques (BOSS_ATK du JS)
const BOSS24 := [
	{ "name": "GOLIATH-PRIME",  "base": 0 },
	{ "name": "WARDEN-7",       "base": 1, "arms": 2 },
	{ "name": "HYDRA-NEXUS",    "base": 2, "parts": 3 },
	{ "name": "OMEGA-VECTOR",   "base": 3, "teleport": true },
	{ "name": "GARDIEN DU SILO","base": 0 },
	{ "name": "BASTION-4",      "base": 0 },
	{ "name": "SENTINELLE-2",   "base": 0 },
	{ "name": "CONTREMAÎTRE",   "base": 0 },
	{ "name": "LOCOMOTIVE-9",   "base": 0 },
	{ "name": "RÉGISSEUR",      "base": 0 },
	{ "name": "MATRIARCHE",     "base": 1 },
	{ "name": "ROI DES DOCKS",  "base": 1 },
	{ "name": "NÉON-PRÊTRE",    "base": 1 },
	{ "name": "CROUPIER",       "base": 1 },
	{ "name": "FLIPPER",        "base": 1 },
	{ "name": "BANQUIER",       "base": 1 },
	{ "name": "ROI-MONNAYEUR",  "base": 2 },
	{ "name": "ARCHIVISTE",     "base": 2 },
	{ "name": "COMPILATEUR",    "base": 2 },
	{ "name": "TESSELLATEUR",   "base": 2 },
	{ "name": "ARCHIVE-ZÉRO",   "base": 2 },
	{ "name": "HÉRAUT",         "base": 3 },
	{ "name": "RAYTRACEUR",     "base": 3 },
	{ "name": "VORAX",          "base": 3, "parts": 3 },
]

# jeux d'attaques : chaque entrée = { "cd":…, "kind":…, "args":[…] }
# encodage EXACT des 24 listes BOSS_ATK du JS.
const ATK24 := [
	# 0 GOLIATH
	[ { "cd": 1.5, "kind": "aimed", "args": [3, 0.5, 1.0] },
	  { "cd": 1.9, "kind": "ring",   "args": [14, 1.0, 0] },
	  { "cd": 2.4, "kind": "burst",  "args": [3, 5, 0.8, 1.1] } ],
	# 1 WARDEN
	[ { "cd": 1.3, "kind": "spiral", "args": [3, 1.05] },
	  { "cd": 2.2, "kind": "aimed_spiral", "args": [7, 1.1, 1.05, 2, 0.9] },
	  { "cd": 2.8, "kind": "wall",   "args": [4, 126] } ],
	# 2 HYDRA
	[ { "cd": 2.2, "kind": "parts_aimed", "args": [1, 0.38, 0.88] },
	  { "cd": 2.8, "kind": "spiral",  "args": [2, 0.78] },
	  { "cd": 3.3, "kind": "wall",    "args": [4, 260] } ],
	# 3 OMEGA
	[ { "cd": 1.4, "kind": "spiral", "args": [5, 1.1] },
	  { "cd": 2.3, "kind": "wall_aimed", "args": [3, 150, 5, 0.9, 1.1] },
	  { "cd": 2.0, "kind": "missiles_free", "args": [4] },
	  { "cd": 3.4, "kind": "beams2",  "args": [180, 62, 1.0, 2.2] } ],
	# 4 GARDIEN DU SILO
	[ { "cd": 2.2, "kind": "ring",   "args": [10, 0.8, 0] },
	  { "cd": 2.0, "kind": "aimed",  "args": [3, 0.5, 0.9] },
	  { "cd": 2.8, "kind": "launch", "args": ["drone", 3] } ],
	# 5 BASTION-4
	[ { "cd": 2.6, "kind": "wall",  "args": [4, 150] },
	  { "cd": 1.8, "kind": "burst", "args": [3, 1, 0, 1.3] },
	  { "cd": 2.4, "kind": "ring",  "args": [12, 0.9, 1] } ],
	# 6 SENTINELLE-2
	[ { "cd": 2.6, "kind": "mines", "args": [2] },
	  { "cd": 1.9, "kind": "aimed", "args": [5, 0.7, 1.0] },
	  { "cd": 2.4, "kind": "cross", "args": [3, 0.95] } ],
	# 7 CONTREMAÎTRE
	[ { "cd": 1.5, "kind": "spiral",      "args": [2, 0.9] },
	  { "cd": 2.2, "kind": "parts_aimed", "args": [3, 0.5, 1.0] },
	  { "cd": 3.0, "kind": "launch",      "args": ["kamikaze", 2] } ],
	# 8 LOCOMOTIVE-9
	[ { "cd": 1.6, "kind": "rain",  "args": [8, 1.0] },
	  { "cd": 2.4, "kind": "wall",  "args": [3, 170] },
	  { "cd": 2.0, "kind": "aimed", "args": [7, 1.2, 1.05] } ],
	# 9 RÉGISSEUR
	[ { "cd": 3.6, "kind": "beamsweep", "args": [2, 70, 3.2] },
	  { "cd": 1.8, "kind": "spiral",    "args": [3, 1.0] },
	  { "cd": 2.4, "kind": "aimed",     "args": [5, 0.8, 1.05] } ],
	# 10 MATRIARCHE
	[ { "cd": 3.0, "kind": "launch",      "args": ["stinger", 3] },
	  { "cd": 1.7, "kind": "parts_aimed", "args": [3, 0.6, 1.0] },
	  { "cd": 2.3, "kind": "ring",        "args": [14, 0.95, 1] } ],
	# 11 ROI DES DOCKS
	[ { "cd": 2.0, "kind": "cross", "args": [4, 1.0] },
	  { "cd": 2.8, "kind": "wall",  "args": [4, 140] },
	  { "cd": 2.6, "kind": "launch","args": ["layer", 1] } ],
	# 12 NÉON-PRÊTRE
	[ { "cd": 1.3, "kind": "double_spiral", "args": [4, 1.05, 0.84, 4, 0.85] },
	  { "cd": 2.2, "kind": "aimed",         "args": [9, 1.4, 1.0] },
	  { "cd": 2.6, "kind": "missiles",      "args": [3] } ],
	# 13 CROUPIER
	[ { "cd": 1.4, "kind": "double_aimed", "args": [60, 4, 0.7, 1.05, 0.35] },
	  { "cd": 2.4, "kind": "coins",        "args": [6] },
	  { "cd": 2.6, "kind": "bounce",       "args": [3, 0.9] } ],
	# 14 FLIPPER
	[ { "cd": 2.0, "kind": "bounce",      "args": [4, 1.0] },
	  { "cd": 1.8, "kind": "parts_aimed", "args": [3, 0.5, 1.05] },
	  { "cd": 3.0, "kind": "wall",        "args": [3, 160] } ],
	# 15 BANQUIER
	[ { "cd": 1.6, "kind": "coins", "args": [8] },
	  { "cd": 2.0, "kind": "burst", "args": [4, 1, 0, 1.3] },
	  { "cd": 2.8, "kind": "grid",  "args": [92] } ],
	# 16 ROI-MONNAYEUR
	[ { "cd": 1.5, "kind": "coins_bounce", "args": [7, 2, 1.0] },
	  { "cd": 2.4, "kind": "grid",         "args": [84] },
	  { "cd": 1.8, "kind": "aimed",        "args": [7, 1.0, 1.1] },
	  { "cd": 3.2, "kind": "mines_sweep",  "args": [3, 1, 0, 2.0] } ],
	# 17 ARCHIVISTE
	[ { "cd": 2.2, "kind": "missiles", "args": [4] },
	  { "cd": 1.6, "kind": "burst",    "args": [3, 1, 0, 1.3] },
	  { "cd": 2.6, "kind": "spiral",   "args": [3, 1.0] } ],
	# 18 COMPILATEUR
	[ { "cd": 2.6, "kind": "grid",     "args": [80] },
	  { "cd": 1.8, "kind": "aimed",    "args": [5, 0.6, 1.1] },
	  { "cd": 3.0, "kind": "beamsweep","args": [2, 40, 2.6] } ],
	# 19 TESSELLATEUR
	[ { "cd": 1.8, "kind": "cross",       "args": [5, 1.05] },
	  { "cd": 1.9, "kind": "parts_aimed", "args": [4, 0.7, 1.05] },
	  { "cd": 2.8, "kind": "launch",      "args": ["weaver", 3] } ],
	# 20 ARCHIVE-ZÉRO
	[ { "cd": 1.4, "kind": "spiral",     "args": [5, 1.0] },
	  { "cd": 3.4, "kind": "beamsweep",  "args": [3, 60, 3.0] },
	  { "cd": 2.4, "kind": "missiles_ring", "args": [3, 12, 1.0] },
	  { "cd": 2.8, "kind": "grid",       "args": [76] } ],
	# 21 HÉRAUT
	[ { "cd": 1.3, "kind": "spiral", "args": [4, 1.1] },
	  { "cd": 2.2, "kind": "wall",   "args": [4, 140] },
	  { "cd": 2.6, "kind": "launch", "args": ["kamikaze", 3] } ],
	# 22 RAYTRACEUR
	[ { "cd": 3.2, "kind": "beamsweep", "args": [3, 90, 3.0] },
	  { "cd": 1.5, "kind": "cross",     "args": [4, 1.1] },
	  { "cd": 2.0, "kind": "bounce",    "args": [4, 1.1] },
	  { "cd": 2.4, "kind": "aimed",     "args": [9, 1.3, 1.1] } ],
	# 23 VORAX
	[ { "cd": 1.3, "kind": "spiral",      "args": [5, 1.1] },
	  { "cd": 2.0, "kind": "parts_aimed", "args": [3, 0.5, 1.1] },
	  { "cd": 2.8, "kind": "beamsweep",   "args": [2, 110, 2.8] },
	  { "cd": 2.2, "kind": "grid",        "args": [80] },
	  { "cd": 2.4, "kind": "missiles_bounce", "args": [4, 3, 1.0] },
	  { "cd": 3.0, "kind": "launch_rain", "args": ["kamikaze", 2, 10, 1.1] } ],
]

# pools d'ennemis par ère × zone (POOLS du module 20 — la version finale)
const LEVEL_POOLS := [
	# KFM-01
	[
		["drone", "stinger"],
		["drone", "stinger", "kamikaze"],
		["drone", "stinger", "kamikaze", "runner", "bomber"],
		["drone", "stinger", "kamikaze", "runner", "bomber", "turret"],
	],
	# 8-BIT+
	[
		["drone", "stinger", "runner", "turret"],
		["drone", "stinger", "runner", "bomber", "kamikaze", "weaver"],
		["stinger", "runner", "turret", "weaver", "phalanx", "bomber"],
		["drone", "turret", "weaver", "phalanx", "layer", "kamikaze", "bomber"],
	],
	# 16-BIT
	[
		["drone", "stinger", "runner", "turret", "shielder", "splitter"],
		["stinger", "shielder", "splitter", "missileer", "weaver", "runner"],
		["shielder", "splitter", "missileer", "phalanx", "tanker", "weaver"],
		["stinger", "shielder", "splitter", "missileer", "phalanx", "tanker", "lancer", "bomber"],
	],
	# ARCADIA
	[
		["drone", "stinger", "mine", "runner", "shielder", "turret"],
		["stinger", "mine", "layer", "bomber", "lancer", "runner"],
		["mine", "layer", "tanker", "kamikaze", "shielder", "lancer"],
		["stinger", "mine", "layer", "tanker", "kamikaze", "lancer", "bomber", "turret"],
	],
	# 32-BIT CD
	[
		["drone", "sniper", "stinger", "mine", "splitter", "shielder"],
		["sniper", "missileer", "phalanx", "splitter", "lancer", "mine"],
		["sniper", "weaver", "tanker", "lancer", "phalanx", "missileer"],
		["sniper", "missileer", "phalanx", "tanker", "lancer", "weaver", "splitter", "layer"],
	],
	# HD
	[
		["drone", "stinger", "runner", "turret", "shielder", "splitter", "carrier", "sniper", "weaver", "kamikaze"],
		["lancer", "weaver", "tanker", "missileer", "phalanx", "bomber", "sniper", "shielder"],
		["carrier", "tanker", "lancer", "phalanx", "missileer", "layer", "kamikaze", "splitter", "sniper"],
		["carrier", "tanker", "lancer", "phalanx", "missileer", "layer", "kamikaze", "splitter", "sniper", "weaver", "bomber", "shielder", "turret"],
	],
]

# -------------------------------------------------------------------------
func is_fanboy_level(l: int) -> bool:
	return clampi(l, 1, MAX_LEVEL) <= 3

func era_of_level(l: int) -> int:
	var cl := clampi(l, 1, MAX_LEVEL)
	if cl <= 3:
		return 0
	return clampi(int(floor((cl - 1) / float(STAGES_PER_ERA))), 1, 5)

func stage_of_level(l: int) -> int:
	return (clampi(l, 1, MAX_LEVEL) - 1) % STAGES_PER_ERA

# « niveau équivalent » 1..6 : courbe d'équilibrage d'origine étirée sur 24
func lv_eq(level: int) -> float:
	return 1.0 + (clampi(level, 1, MAX_LEVEL) - 1) * 5.0 / (MAX_LEVEL - 1)

func upg_cost(def: Dictionary, lv_: int) -> int:
	if def.get("consumable", false):
		return int(def.price)
	return int(round(def.price * (1.0 + lv_ * 0.75)))

func ship_by_id(id: String) -> Dictionary:
	for s in SHIPS:
		if s.id == id: return s
	return SHIPS[0]

func weapon_by_id(id: String) -> Dictionary:
	for w in WEAPONS:
		if w.id == id: return w
	return WEAPONS[0]

func livery_by_id(id: String) -> Dictionary:
	for l in LIVERIES:
		if l.id == id: return l
	return LIVERIES[0]

func _c(hex: String) -> Color:
	return Color(hex)

func boss_music_idx(level: int) -> int:
	return BOSS_OF_LEVEL[clampi(level, 1, MAX_LEVEL) - 1]

