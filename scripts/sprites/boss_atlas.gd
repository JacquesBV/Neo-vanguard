extends RefCounted
## LECTEUR D'ATLAS BOSS — module 46 du moteur : les 24 atlas webp officiels
## (un par secteur), cases découpées par META, rendues dans les 4 encres LCD
## à l'ère 0 (« coupes sèches »).
## Poses : 0 attente · 1 charge · 2 attaque · 3 recul · 4 dégât · 5 défaite
##         (6-21 : planche avancée — morphismes, forme évoluée, signature).
## Échelle : kbOf du moteur (clamp(r×2,25)/bw, plafond 320/h×0,9), calée sur
## la capture mobile (×0,5). Rendu : flottement, arrondi 2 px, clignotement
## d'entrée era≤1, silhouette d'ombre, flash blanc-cyan.

const MetaAll := preload("res://scripts/sprites/boss_meta_all.gd")
static var _atlas: Dictionary = {}       # n -> Texture2D
static var _frames: Dictionary = {}      # "n|i" -> Texture2D quantifiée
static var _fail: Dictionary = {}        # n -> true (fichier absent)

static func _ink_tones() -> Array:
	var out: Array = []
	for h in Data.INKS:
		out.append(Color(h))
	return out

static func atlas(n: int) -> Texture2D:
	if _atlas.has(n):
		return _atlas[n]
	if _fail.has(n):
		return null
	var path := "res://assets/sprites/bosses/boss-%02d.webp" % n
	if not ResourceLoader.exists(path):
		_fail[n] = true
		return null
	var t: Texture2D = load(path)
	_atlas[n] = t
	return t

## case i du boss n, quantifiée sur les encres LCD (cuite une fois)
static func frame_tex(n: int, i: int) -> Texture2D:
	var a := atlas(n)
	if a == null:
		return null
	var key := "%d_%d_q" % [n, i]
	if _frames.has(key):
		return _frames[key]
	var m: Dictionary = MetaAll.META[n]
	var f: Array = m.f[i]
	var img: Image = a.get_image()
	img.convert(Image.FORMAT_RGBA8)
	var crop: Image = img.get_region(Rect2i(int(f[0]), int(f[1]), int(f[2]), int(f[3])))
	# quantification nearest-luminance sur les 4 encres (8 bits : coupes sèches)
	var tones := _ink_tones()
	var lums: Array = []
	for tn in tones:
		lums.append(tn.r * 0.2126 + tn.g * 0.7152 + tn.b * 0.0722)
	for y in crop.get_height():
		for x in crop.get_width():
			var c := crop.get_pixel(x, y)
			if c.a < 0.5:
				crop.set_pixel(x, y, Color(0, 0, 0, 0))
				continue
			var l := c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
			var idx := 0
			var best := 10.0
			for j in 4:
				var d: float = absf(l - lums[j])
				if d < best:
					best = d
					idx = j
			crop.set_pixel(x, y, tones[idx])
	var tex := ImageTexture.create_from_image(crop)
	_frames[key] = tex
	return tex

## silhouette d'ombre (kind 'black' du moteur, α .26) : case passée en encre 0
static func shadow_tex(n: int, i: int) -> Texture2D:
	var a := atlas(n)
	if a == null:
		return null
	var key := "%d_%d_sh" % [n, i]
	if _frames.has(key):
		return _frames[key]
	var m: Dictionary = MetaAll.META[n]
	var f: Array = m.f[i]
	var img: Image = a.get_image()
	img.convert(Image.FORMAT_RGBA8)
	var crop: Image = img.get_region(Rect2i(int(f[0]), int(f[1]), int(f[2]), int(f[3])))
	var ink0: Color = Color(Data.INKS[0])
	for y in crop.get_height():
		for x in crop.get_width():
			var c := crop.get_pixel(x, y)
			if c.a < 0.5:
				crop.set_pixel(x, y, Color(0, 0, 0, 0))
			else:
				crop.set_pixel(x, y, Color(ink0.r, ink0.g, ink0.b, c.a))
	var tex := ImageTexture.create_from_image(crop)
	_frames[key] = tex
	return tex

## dessin complet du boss du secteur `level`. Renvoie false si l'atlas manque.
static func draw(g: CanvasItem, b: Dictionary, level: int) -> bool:
	var n: int = clampi(level, 1, 24)
	var era_idx: int = 0 if n <= 3 else clampi((n - 1) / 4, 1, 5)
	if atlas(n) == null:
		return false
	var m: Dictionary = MetaAll.META[n]
	# --- pose (module 46) -----------------------------------------------------
	var i := 0
	if bool(b.get("dead", false)):
		i = 5
	elif float(b.get("flash", 0.0)) > 0.0:
		i = 4
	elif float(b.get("_fire_t", 0.0)) > 0.0:
		i = 2
	elif float(b.get("atk_t", 9.9)) < 0.4:
		i = 1
	var tex := frame_tex(n, i)
	if tex == null:
		return false
	var f: Array = m.f[i]
	# --- kbOf ------------------------------------------------------------------
	var r: float = float(b.get("r", 132.0))
	var kb: float = clampf(r * 2.25, 180.0, 360.0) / float(m.bw)
	kb = minf(kb, 320.0 / (float(m.h) * 0.9))
	var s: float = kb * float(f[6]) * 0.5
	# --- position --------------------------------------------------------------
	var t: float = float(b.get("t", 0.0))
	var x: float = floorf(b.x / 2.0) * 2.0
	var y: float = floorf((b.y + sin(t * 1.6) * 3.0) / 2.0) * 2.0
	var alpha := 1.0
	if bool(b.get("enter", false)):
		var k: float = clampf((b.y + 300.0) / 565.0, 0.0, 1.0)
		if int(t * 14.0) % 2 == 1 and k < 0.85:
			return true            # clignotement d'entrée : rien cette frame
	var dw: float = float(f[2]) * s
	var dh: float = float(f[3]) * s
	var ox: float = float(f[4]) * s
	var oy: float = float(f[5]) * s
	# ombre portée : à partir du 16-bit seulement, hors mort (module 46 : +12,+26, α .26, ×0.94)
	if era_idx >= 2 and not bool(b.get("dead", false)):
		var sh := shadow_tex(n, i)
		if sh != null:
			g.draw_texture_rect(sh, Rect2(x - ox + 12.0, y - oy + 26.0, dw * 0.94, dh * 0.94), false, Color(1, 1, 1, 0.26))
	# flash d'impact : silhouette éclaircie (couleur ×1.5 vers le haut)
	if float(b.get("flash", 0.0)) > 0.0:
		g.draw_texture_rect(tex, Rect2(x - ox, y - oy, dw, dh), false, Color(1.45, 1.45, 1.45, 0.85))
	else:
		g.draw_texture_rect(tex, Rect2(x - ox, y - oy, dw, dh), false)
	return true
