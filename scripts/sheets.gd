extends Node
## =========================================================================
## SHEETS — les planches de sprites OFFICIELLES du jeu d'origine
## (assets/ships-anim/<génération>/<coque>-anim.png, copiées du dépôt).
## Chaque planche : 8 colonnes (frames d'animation) × 6 rangées
## (idle, inclinaison gauche, droite, boost, touché, explosion) —
## exactement la sémantique de js/33-nv-ship-sheets.js (ROWS).
## En ère Pocket, la coque est repeinte dans les 4 teintes de la livrée,
## avec le contour sombre d'un pixel — comme fait le JS.
## =========================================================================

const DIRS := ["era0-kfm01", "era1-8bit-plus", "era2-16bit-home",
	"era3-16bit-arcade", "era4-32bit-cd", "era5-hd"]
const FRAMES := [Vector2(64, 66), Vector2(88, 90), Vector2(106, 110),
	Vector2(118, 122), Vector2(136, 140), Vector2(250, 258)]
# taille du vaisseau dessiné dans le référentiel de jeu, par ère (SHEETS du JS)
const BOX_H := [42.0, 58.0, 70.0, 78.0, 90.0, 166.0]
const FILES := {
	"falcon": "vanguard-mk1-anim.png",
	"falconA": "falcon-a-marteau-anim.png",
	"falconB": "falcon-b-lame-anim.png",
	"viper": "vipere-anim.png",
	"titan": "titan-anim.png",
	"spectre": "spectre-anim.png",
	"singularis": "singularis-anim.png",
}
const ROWS := { "idle": 0, "bank_l": 1, "bank_r": 2, "boost": 3, "hit": 4, "explode": 5 }

var _tex: Dictionary = {}
var _remapped: Dictionary = {}

func sheet_for(ship: String, era: int) -> Texture2D:
	var key := "%s|%d" % [ship, era]
	if _tex.has(key):
		return _tex[key]
	var path := "res://assets/sprites/ships-anim/%s/%s" % [DIRS[clampi(era, 0, 5)], FILES.get(ship, FILES["falcon"])]
	var t: Texture2D = load(path) if ResourceLoader.exists(path) else null
	_tex[key] = t
	return t

func box_h(era: int) -> float:
	return BOX_H[clampi(era, 0, 5)]

func frame_size(era: int) -> Vector2:
	return FRAMES[clampi(era, 0, 5)]

## Rangée + colonne à afficher, mêmes seuils que poseOf() du JS.
func pose(P: Dictionary, t: float) -> Vector2i:
	if P.hit_t > 0.0:
		return Vector2i(int(ROWS.hit), 0 if P.hit_t > 0.2 else int(P.hit_t * 20.0) % 2)
	if P.bank < -0.22:
		return Vector2i(int(ROWS.bank_l), 1 if P.bank < -0.6 else 0)
	if P.bank > 0.22:
		return Vector2i(int(ROWS.bank_r), 1 if P.bank > 0.6 else 0)
	if P.vy < -60.0:
		return Vector2i(int(ROWS.boost), int(t * 14.0) % 2)
	return Vector2i(int(ROWS.idle), int(t * 11.0) % 4)

## Ère Pocket : repeint la planche dans les 4 teintes de la livrée + contour.
func prepare_era(era: int, ship: String, gb_hex: Array) -> Texture2D:
	var base := sheet_for(ship, era)
	if base == null or era != 0 or gb_hex.size() < 4:
		return base
	var key := ship + "|" + str(Data.INKS)
	if _remapped.has(key):
		return _remapped[key]
	var img: Image = base.get_image()
	if img == null:
		return base
	img.convert(Image.FORMAT_RGBA8)
	# Palette monochrome FanBoy du moteur : chaque pixel rejoint l'encre de
	# luminance la plus proche — coques claires, contours sombres.
	var tones: Array = []
	for h in Data.INKS:
		tones.append(Color(h))
	var lums: Array = []
	for tn in tones:
		lums.append(tn.r * 0.2126 + tn.g * 0.7152 + tn.b * 0.0722)
	var src: Image = img.duplicate()
	var w := img.get_width()
	var hh := img.get_height()
	for y in hh:
		for x in w:
			var c := src.get_pixel(x, y)
			if c.a < 0.43:
				img.set_pixel(x, y, Color(0, 0, 0, 0))
				continue
			var l := c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
			var idx := 0
			var best := 10.0
			for j in 4:
				var d: float = absf(l - lums[j])
				if d < best:
					best = d
					idx = j
			var tn2: Color = tones[idx]
			img.set_pixel(x, y, Color(tn2.r, tn2.g, tn2.b, 1.0))
	# contour sombre d'un pixel : détache la coque du décor
	var oc: Color = tones[0]
	for y in hh:
		for x in w:
			if src.get_pixel(x, y).a >= 0.43:
				continue
			var near := false
			for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
				var p: Vector2i = Vector2i(x, y) + d
				if p.x >= 0 and p.y >= 0 and p.x < w and p.y < hh and src.get_pixel(p.x, p.y).a >= 0.43:
					near = true
					break
			if near:
				img.set_pixel(x, y, Color(oc.r * 0.35, oc.g * 0.35, oc.b * 0.35, 1.0))
	var tex := ImageTexture.create_from_image(img)
	_remapped[key] = tex
	return tex


# ---------------------------------------------------------------------------
# Module 34 « rendu natif » : la coque HD r0-<id>.png réduite à la taille
# réelle du vaisseau (72 px de coque, SPRITE_H), puis quantifiée sur les
# 4 encres LCD (3 tons clairs + contour sombre, palette FanBoy).
const NOZZLES := { "falcon": [0.503], "falconA": [0.364, 0.5, 0.642], "falconB": [0.508],
	"viper": [0.399, 0.605], "titan": [0.381, 0.5, 0.619], "spectre": [0.407, 0.59],
	"singularis": [0.402, 0.592] }

func native_player(ship: String) -> Texture2D:
	var key := "np|" + ship + "|" + str(Data.INKS)
	if _tex.has(key):
		return _tex[key]
	var path := "res://assets/sprites/ships-native/r0-%s.png" % ship
	if not ResourceLoader.exists(path):
		return null
	var img: Image = (load(path) as Texture2D).get_image()
	img.convert(Image.FORMAT_RGBA8)
	var H2 := 72
	var W2 := maxi(8, int(round(72.0 * img.get_width() / img.get_height())))
	img.resize(W2, H2, Image.INTERPOLATE_LANCZOS)
	var tones: Array = []
	for h in Data.INKS:
		tones.append(Color(h))
	var lums: Array = []
	for tn in tones:
		lums.append(tn.r * 0.2126 + tn.g * 0.7152 + tn.b * 0.0722)
	for y in H2:
		for x in W2:
			var c := img.get_pixel(x, y)
			if c.a < 0.43:
				img.set_pixel(x, y, Color(0, 0, 0, 0))
				continue
			var l := c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
			var idx := 0
			var best := 10.0
			for j in 4:
				var d: float = absf(l - lums[j])
				if d < best:
					best = d
					idx = j
			var tn2: Color = tones[idx]
			img.set_pixel(x, y, Color(tn2.r, tn2.g, tn2.b, 1.0))
	var tex := ImageTexture.create_from_image(img)
	_tex[key] = tex
	return tex
