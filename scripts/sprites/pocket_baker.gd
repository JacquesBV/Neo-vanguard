extends RefCounted
## BAKER POCKET — retranscription fidèle de bakeSprite/rasterize/poseParts/
## smoothTone du moteur d'origine pour l'ère 0 (KFM-01) : silhouettes à
## pièces (SIL), trame ordonnée Bayer, 4 encres LCD, gravures de détail.

const SilData := preload("res://scripts/sprites/sil_data.gd")
const SIL: Dictionary = SilData.SIL
const BAYER := [
	[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5],
]
const SPRITE_H := {
	"drone": 78, "stinger": 84, "runner": 72, "swarmlet": 40, "turret": 92,
	"shielder": 118, "splitter": 98, "carrier": 158, "elite": 150,
	"pickupBox": 58, "crate": 74, "barrel": 78, "pod": 82,
	"mine": 58, "sniper": 64,
}
const POSE_AMP := {
	"drone": 0.085, "stinger": 0.07, "swarmlet": 0.10, "runner": 0.055,
	"splitter": 0.055, "shielder": 0.05, "turret": 0.035, "carrier": 0.04,
	"elite": 0.045, "crate": 0.035, "barrel": 0.035, "pod": 0.03,
	"pickupBox": 0.05,
}
const KERA := 0.25
const ANIM_N := 4
const AERIAL := ["drone", "stinger", "runner", "swarmlet", "kamikaze", "weaver"]
const GUNSHIP := ["turret", "sniper", "lancer", "missileer"]

static var _cache: Dictionary = {}

static func inks() -> Array:
	var out: Array = []
	for h in Data.INKS:
		out.append(Color(h))
	return out

static func bake(id: String, frame: int) -> Texture2D:
	var key := "%s|%d" % [id, frame]
	if _cache.has(key):
		return _cache[key]
	var def: Dictionary = SIL.get(id, {})
	if def.is_empty():
		return null
	var inks: Array = inks()
	var h0: float = SPRITE_H.get(id, 60)
	var H: int = maxi(6, int(round(h0 * KERA)))
	var W: int = maxi(5, int(round(H * def.w)))
	var parts: Array = pose_parts(def.parts, frame, ANIM_N, POSE_AMP.get(id, 0.0))
	# --- rasterize -----------------------------------------------------------
	var boxes: Array = []
	var n: int = W * H
	var mat := PackedByteArray()
	mat.resize(n)
	for pi in parts.size():
		var p: Dictionary = parts[pi]
		if p.e > 0:
			continue
		var pts: Array = p.p
		var minx := 1e9; var maxx := -1e9; var miny := 1e9; var maxy := -1e9
		for pt in pts:
			minx = minf(minx, pt[0]); maxx = maxf(maxx, pt[0])
			miny = minf(miny, pt[1]); maxy = maxf(maxy, pt[1])
		var x0: int = maxi(0, int(floor((minx + 1.0) / 2.0 * W)))
		var x1: int = mini(W - 1, int(ceil((maxx + 1.0) / 2.0 * W)))
		var y0: int = maxi(0, int(floor((miny + 1.0) / 2.0 * H)))
		var y1: int = mini(H - 1, int(ceil((maxy + 1.0) / 2.0 * H)))
		boxes.append({ "x0": x0, "x1": x1, "y0": y0, "y1": y1,
			"s": pi * 977 + p.m * 131, "det": p.get("d", "") })
		for y in range(y0, y1 + 1):
			for x in range(x0, x1 + 1):
				if point_in_poly(pts, (x + 0.5) / W * 2.0 - 1.0, (y + 0.5) / H * 2.0 - 1.0):
					mat[y * W + x] = p.m
	# dilatation d'un pixel (traits fins de la 8 bits)
	var grow := PackedByteArray(mat)
	for y in H:
		for x in W:
			var i: int = y * W + x
			if mat[i] != 0:
				continue
			var a: int = mat[i - 1] if x > 0 else 0
			var b: int = mat[i + 1] if x < W - 1 else 0
			var c: int = mat[i - W] if y > 0 else 0
			var d: int = mat[i + W] if y < H - 1 else 0
			grow[i] = a if a != 0 else (b if b != 0 else (c if c != 0 else d))
	mat = grow
	# distance au vide (3 passes) → arrondi des volumes
	var dist := PackedFloat32Array()
	dist.resize(n)
	for i in n:
		dist[i] = 9.0 if mat[i] != 0 else 0.0
	for _pass in 3:
		for y in H:
			for x in W:
				var i: int = y * W + x
				if mat[i] == 0:
					continue
				var d := 9.0
				if x > 0 and mat[i - 1] != 0: d = minf(d, dist[i - 1] + 1.0)
				if y > 0 and mat[i - W] != 0: d = minf(d, dist[i - W] + 1.0)
				if x < W - 1 and mat[i + 1] != 0: d = minf(d, dist[i + 1] + 1.0)
				if y < H - 1 and mat[i + W] != 0: d = minf(d, dist[i + W] + 1.0)
				dist[i] = minf(dist[i], d)
	# ton (1..3) et éclairage
	var light := PackedFloat32Array()
	light.resize(n)
	var tone := PackedByteArray()
	tone.resize(n)
	for y in H:
		for x in W:
			var i: int = y * W + x
			if mat[i] == 0:
				continue
			var is_edge: bool = not solid(mat, W, H, x - 1, y) or not solid(mat, W, H, x + 1, y) \
				or not solid(mat, W, H, x, y - 1) or not solid(mat, W, H, x, y + 1)
			var t: float
			if is_edge:
				t = 0.0
			else:
				var dd: float = minf(dist[i] - 1.0, 3.0)
				var lit: float = 1.0 if not solid(mat, W, H, x, y - 1) else (0.55 if not solid(mat, W, H, x, y - 2) else 0.0)
				var base: float = (dd + 0.6) / 4.2
				t = base * 0.8 + lit * 0.35
				if not solid(mat, W, H, x, y + 1):
					t *= 0.72
			if mat[i] == 6: t *= 0.55          # DARK
			if mat[i] == 9: t = minf(1.0, t * 1.15)  # TRIM
			t *= 1.10 - 0.30 * (float(y) / H)
			if era0_crush():
				t = t * 0.60 if t < 0.5 else 1.0 - (1.0 - t) * 0.60
			light[i] = clampf(t, 0, 1)
	greeble_pass(mat, light, boxes, W, H)
	# quantification franche + trame ordonnée sur les frontières de tons
	for y in H:
		for x in W:
			var i: int = y * W + x
			if mat[i] == 0:
				continue
			var tv: float = light[i] * 2.0
			var k := int(floor(tv))
			var f: float = tv - k
			var dw: float = BAYER[y & 3][x & 3] / 16.0
			if f > 0.44 and f < 0.56 and dw < 0.5:
				k += 1
			elif f > 0.5:
				k += 1
			tone[i] = clampi(k, 0, 2) + 1
	smooth_tone(tone, mat, W, H, 2)
	# --- image + hiérarchie des matières -------------------------------------
	var img := Image.create(W, H, false, Image.FORMAT_RGBA8)
	for y in H:
		for x in W:
			var i: int = y * W + x
			if mat[i] == 0:
				continue
			var t: int = tone[i]
			var col: Color
			var m: int = mat[i]
			if m == 6 or m == 11:
				col = inks[0]
			elif m == 8 or m == 3 or m == 10 or m == 7:
				col = inks[3]
			elif m == 5 or m == 9:
				col = inks[2]
			elif m == 2:
				col = inks[0] if t <= 1 else (inks[1] if t == 2 else (inks[2] if t == 3 else inks[3]))
			elif m == 4:
				col = inks[1] if t <= 1 else (inks[2] if t == 2 else inks[3])
			else:
				col = inks[0] if t <= 1 else (inks[1] if t == 2 else (inks[2] if t == 3 else inks[3]))
			img.set_pixel(x, y, col)
	add_pocket_detail(img, mat, W, H, id, inks)
	var tex := ImageTexture.create_from_image(img)
	_cache[key] = tex
	return tex

## variante « touché » : tout le sprite passe au ton le plus clair (pas de blanc en 8 bits)
static func bake_flash(id: String) -> Texture2D:
	var key := id + "|flash"
	if _cache.has(key):
		return _cache[key]
	var base: Texture2D = bake(id, 0)
	if base == null:
		return null
	var img: Image = base.get_image()
	img.convert(Image.FORMAT_RGBA8)
	var inks: Array = inks()
	for y in img.get_height():
		for x in img.get_width():
			if img.get_pixel(x, y).a > 0.1:
				img.set_pixel(x, y, inks[3])
	var tex := ImageTexture.create_from_image(img)
	_cache[key] = tex
	return tex

static func era0_crush() -> bool:
	return true

static func solid(mat: PackedByteArray, W: int, H: int, x: int, y: int) -> bool:
	return x >= 0 and y >= 0 and x < W and y < H and mat[y * W + x] != 0

static func point_in_poly(pts: Array, px: float, py: float) -> bool:
	var inside := false
	var j: int = pts.size() - 1
	for i in pts.size():
		var xi: float = pts[i][0]; var yi: float = pts[i][1]
		var xj: float = pts[j][0]; var yj: float = pts[j][1]
		if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
			inside = not inside
		j = i
	return inside

## poseParts : l'onde qui parcourt la silhouette, 4 poses cuites
static func pose_parts(parts: Array, frame: int, n: int, amp: float) -> Array:
	if frame == 0 or amp == 0.0:
		return parts
	var ph: float = float(frame) / n * TAU
	var out: Array = []
	for p in parts:
		var q: Array = []
		for pt in p.p:
			var x: float = pt[0]; var y: float = pt[1]
			var tail: float = 1.0 + 0.5 * (y - 0.2) if y > 0.2 else 1.0
			q.append([x * (1.0 + sin(y * 2.2 + ph) * amp * tail), y + cos(y * 1.6 + ph) * amp * 0.35])
		out.append({ "p": q, "m": p.m, "e": p.e })
	return out

## filtre médian 3×3 des tons, 2 passes en 8 bits
static func smooth_tone(tone: PackedByteArray, mat: PackedByteArray, W: int, H: int, passes: int) -> void:
	var src := PackedByteArray(tone)
	for _p in passes:
		for y in range(1, H - 1):
			for x in range(1, W - 1):
				var i: int = y * W + x
				if mat[i] == 0:
					continue
				var vals: Array = []
				for dy in range(-1, 2):
					for dx in range(-1, 2):
						var j: int = (y + dy) * W + (x + dx)
						if mat[j] != 0:
							vals.append(src[j])
				vals.sort()
				tone[i] = vals[vals.size() >> 1]
		src = PackedByteArray(tone)


## greeblePass : panneaux, grilles, rivets, chevrons — posés là où l'auteur
## les demande (drapeau det de chaque pièce), à l'échelle du pixel d'art.
static func h2s(a: int, b: int) -> float:
	var x: int = imul32((a | 0) ^ 0x9e3779b9, 0x85ebca6b)
	x = imul32(x ^ (b | 0), 0xc2b2ae35)
	x = x ^ (x >> 15)
	x = x & 0xFFFFFFFF
	return float(x) / 4294967296.0

static func imul32(a: int, b: int) -> int:
	var al: int = a & 0xFFFF
	var ah: int = (a >> 16) & 0xFFFF
	var bl: int = b & 0xFFFF
	var bh: int = (b >> 16) & 0xFFFF
	var r: int = al * bl + (((ah * bl + al * bh) & 0xFFFF) << 16)
	return r & 0xFFFFFFFF

static func greeble_pass(mat: PackedByteArray, light: PackedFloat32Array, boxes: Array, W: int, H: int) -> void:
	var seam := 12
	var rv := 8
	var on := func(x: int, y: int) -> bool:
		return x >= 0 and y >= 0 and x < W and y < H and mat[y * W + x] != 0
	for b: Dictionary in boxes:
		var d: String = b.det
		if d == "":
			continue
		var w: int = b.x1 - b.x0 + 1
		var h: int = b.y1 - b.y0 + 1
		if w < 4 or h < 3:
			continue
		var r0: float = h2s(b.s, 3)
		var r1: float = h2s(b.s, 11)
		if d == "panel":
			var n := clampi(int(round(float(w) / seam)) - 1, 1, 3)
			for k in range(1, n + 1):
				var x: int = b.x0 + int(round(w * k / float(n + 1)))
				var run := 0
				for y in range(b.y0, b.y1 + 1):
					var i: int = y * W + x
					if mat[i] == 0 or not on.call(x - 1, y) or not on.call(x + 1, y):
						run = 0
						continue
					run += 1
					if run > 1 and y < b.y1:
						light[i] *= 0.74
			if h > seam * 2:
				var yline: int = b.y0 + int(round(h * (0.34 if r0 > 0.5 else 0.62)))
				for x in range(b.x0, b.x1 + 1):
					var i2: int = yline * W + x
					if mat[i2] != 0 and on.call(x, yline - 1) and on.call(x, yline + 1):
						light[i2] *= 0.82
		elif d == "vent":
			var vw: int = clampi(int(w * 0.7), 3, w)
			var vh: int = clampi(int(h * 0.6), 2, h)
			var vx0: int = b.x0 + maxi(0, int((w - vw) / 2.0))
			var vy0: int = b.y0 + maxi(0, int((h - vh) / 2.0))
			for i in vh:
				for j in vw:
					var x2: int = vx0 + j
					var y2: int = vy0 + i
					if not on.call(x2, y2):
						continue
					var ii: int = y2 * W + x2
					if i % 2 == 0:
						light[ii] *= 0.40
					else:
						light[ii] = minf(1.0, light[ii] * 1.30)
		elif d == "rivet":
			var x3: int = b.x0 + 1
			while x3 < b.x1 - 1:
				for yy in [b.y0, b.y1]:
					if on.call(x3, yy) and on.call(x3, yy + (1 if yy == b.y0 else -1)):
						var i3: int = yy * W + x3
						light[i3] = minf(1.0, light[i3] * 1.6)
				x3 += rv
			if h > rv * 2:
				var y3: int = b.y0 + 2
				while y3 < b.y1 - 1:
					for xx in [b.x0, b.x1]:
						if on.call(xx, y3) and on.call(xx + (1 if xx == b.x0 else -1), y3):
							var i4: int = y3 * W + xx
							light[i4] = minf(1.0, light[i4] * 1.6)
					y3 += rv
		elif d == "bar":
			for y4 in range(b.y0, b.y1 + 1):
				for x4 in range(b.x0, b.x1 + 1):
					if not on.call(x4, y4):
						continue
					var band := int(floor(float(x4 + y4) / 3.0)) % 3
					var i5: int = y4 * W + x4
					if band == 0:
						light[i5] = minf(1.0, light[i5] * 1.45)
					elif band == 1:
						light[i5] *= 0.5
		elif d == "win":
			var cols := maxi(2, int(w / 5.0))
			var rows := maxi(1, int(h / 8.0))
			for r in rows:
				for c in cols:
					var x6: int = b.x0 + 2 + int(round(c * (w - 4) / float(cols)))
					var y6: int = b.y0 + 3 + int(round(r * (h - 5) / float(rows)))
					if not on.call(x6, y6):
						continue
					for dy in 2:
						for dx in 2:
							if on.call(x6 + dx, y6 + dy):
								light[(y6 + dy) * W + x6 + dx] = 1.0

## addPocketEnemyDetail : verrière, arête, plaques — gravées DANS la silhouette
static func add_pocket_detail(img: Image, mat: PackedByteArray, W: int, H: int, id: String, inks: Array) -> void:
	if W < 7 or H < 8:
		return
	var dark: Color = inks[0]
	var mid: Color = inks[1]
	var light: Color = inks[3]
	var marks: Array = [
		[0.36, 0.23, 0.28, 0.09, dark], [0.42, 0.25, 0.16, 0.035, light],
		[0.48, 0.34, 0.07, 0.37, dark], [0.43, 0.38, 0.035, 0.27, mid],
		[0.19, 0.46, 0.20, 0.045, dark], [0.61, 0.46, 0.20, 0.045, dark],
		[0.24, 0.51, 0.15, 0.035, light], [0.61, 0.51, 0.15, 0.035, light],
		[0.30, 0.66, 0.40, 0.045, dark], [0.36, 0.70, 0.28, 0.035, mid],
	]
	if id in AERIAL:
		marks += [
			[0.27, 0.34, 0.14, 0.07, dark], [0.59, 0.34, 0.14, 0.07, dark],
			[0.30, 0.35, 0.07, 0.035, light], [0.63, 0.35, 0.07, 0.035, light],
			[0.38, 0.77, 0.24, 0.04, dark], [0.41, 0.84, 0.18, 0.04, light],
		]
	elif id in GUNSHIP:
		marks += [
			[0.46, 0.08, 0.08, 0.19, dark], [0.48, 0.10, 0.04, 0.15, light],
			[0.23, 0.57, 0.13, 0.08, dark], [0.64, 0.57, 0.13, 0.08, dark],
			[0.27, 0.59, 0.05, 0.035, light], [0.68, 0.59, 0.05, 0.035, light],
		]
	else:
		marks += [
			[0.30, 0.55, 0.16, 0.12, dark], [0.54, 0.55, 0.16, 0.12, dark],
			[0.33, 0.58, 0.10, 0.035, light], [0.57, 0.58, 0.10, 0.035, light],
			[0.36, 0.82, 0.10, 0.07, mid], [0.54, 0.82, 0.10, 0.07, mid],
		]
	for mk in marks:
		var x0: int = clampi(int(round(mk[0] * W)), 0, W - 1)
		var y0: int = clampi(int(round(mk[1] * H)), 0, H - 1)
		var rw: int = maxi(1, int(round(mk[2] * W)))
		var rh: int = maxi(1, int(round(mk[3] * H)))
		for y in range(y0, mini(y0 + rh, H)):
			for x in range(x0, mini(x0 + rw, W)):
				if mat[y * W + x] != 0:
					img.set_pixel(x, y, mk[4])
