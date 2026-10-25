extends RefCounted
## GARDIEN DU SILO — port intégral du sprite procédural v3 (module 17).
## Forme décrite en unités de dessin (grille 56×60), échantillonnée pixel par
## pixel : 0 vide · 1 contour · 2 ombre · 3 blindage · 4 clair · 5 énergie ·
## 6 bande de danger. Palette LCD : [—, encre0, encre1, encre2, encre3, encre3, encre2].

const DW := 56.0
const DH := 60.0
const CX := 27.5
const IRY := 27.0

static var _cache: Dictionary = {}

const HULL := [[16, 9], [39, 9], [46, 16], [46, 36], [40, 45], [15, 45], [9, 36], [9, 16]]
const CROWN := [[21, 3], [34, 3], [37, 10], [18, 10]]
const JAW := [[21, 43], [34, 43], [32, 51], [23, 51]]
const FIN := [[0.5, 15], [3, 6], [6, 9], [9.5, 15]]
const BRACE_L := [[6, 20], [12, 18], [12, 31], [6, 29]]

static func _in_poly(x: float, y: float, P: Array) -> bool:
	var c := false
	var j: int = P.size() - 1
	for i in P.size():
		var xi: float = P[i][0]; var yi: float = P[i][1]
		var xj: float = P[j][0]; var yj: float = P[j][1]
		if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
			c = not c
		j = i
	return c

static func _rr(x: float, y: float, x0: float, y0: float, x1: float, y1: float, r: float) -> bool:
	if x < x0 or x > x1 or y < y0 or y > y1:
		return false
	var qx: float = maxf(maxf(x0 + r - x, 0.0), x - (x1 - r))
	var qy: float = maxf(maxf(y0 + r - y, 0.0), y - (y1 - r))
	return qx * qx + qy * qy <= r * r

## matière de chaque point du dessin (avant contour et biseau) : [couleur, biseau] ou []
static func _sample(x: float, y: float, s: Dictionary) -> Array:
	var ax: float = x if x <= CX else 2.0 * CX - x
	var side := -1 if x <= CX else 1
	# --- œil et iris ---------------------------------------------------------
	var dx: float = x - CX
	var dy: float = y - IRY
	var d: float = sqrt(dx * dx + dy * dy)
	if d < 13.6:
		if d >= 12.4: return [4, 0]
		if d >= 11.2: return [1, 0]
		var rin: float = 3.2 + float(s.open) * 4.4
		if d < rin:
			var px: float = CX + float(s.lx) * (rin - 2.4)
			var py: float = IRY + float(s.ly) * (rin - 2.4) * 0.8
			var pd: float = sqrt((x - px) * (x - px) + (y - py) * (y - py))
			if pd < maxf(1.3, rin * 0.42): return [1, 0]
			if sqrt((x - (px - 1.2)) * (x - (px - 1.2)) + (y - (py - 1.4)) * (y - (py - 1.4))) < 0.9 and rin > 4:
				return [4, 0]
			return [5, 0]
		if d < rin + 1.0: return [1, 0]
		# pétales de l'iris, en rotation par crans
		var a: float = atan2(dy, dx) - float(s.spin)
		a = fposmod(a, TAU)
		var k: float = a / (TAU / 8.0)
		var fk: float = k - floorf(k)
		if bool(s.simple): return [2, 0]
		if fk < 0.11: return [1, 0]
		var lit := 3 if fk < 0.5 else 2
		return [2 if lit == 2 else 2, 0] if int(floorf(k)) % 2 == 1 else [lit, 0]
	# --- couronne radar au sommet -------------------------------------------
	if _in_poly(x, y, CROWN):
		if y >= 5.5 and y < 7.5:
			var slot := int(floorf((x - 21.0) / 3.0))
			if fposmod(x - 21.0, 3.0) < 2.0:
				return [5 if slot == int(s.scan) else 1, 0]
		return [3, 1]
	# antennes
	if absf(ax - 20.5) < 0.6 and y > 0.5 and y < 4.0:
		return [5 if bool(s.blink) else 4, 0] if y < 1.6 else [2, 0]
	# --- mâchoire-canon ------------------------------------------------------
	if _in_poly(x, y, JAW):
		if y > 47.0 and absf(x - CX) < 2.2:
			return [5 if float(s.fire) > 0.0 else 1, 0]
		return [4, 1] if y < 45.0 else [2, 1]
	if y >= 50.5 and y < 54.5 and absf(x - CX) < 2.6:
		if absf(x - CX) < 1.3:
			return [5 if float(s.fire) > 0.0 else 1, 0]
		return [3, 1]
	if float(s.fire) > 0.0 and y >= 54.5 and y < 54.5 + 4.0 * float(s.fire) and absf(x - CX) < 2.4 - (y - 54.5) * 0.5:
		return [5, 0]
	# --- coque ---------------------------------------------------------------
	if _in_poly(x, y, HULL):
		# sourcils blindés en V au-dessus de l'œil
		var by: float = 12.6 + (ax - 13.0) * 0.42
		if ax > 13.0 and ax < 25.5 and y > by and y < by + 2.6: return [1, 0]
		if ax > 13.0 and ax < 25.5 and y >= by + 2.6 and y < by + 3.6: return [4, 0]
		# bande de danger du silo, sous l'iris
		if y >= 40.0 and y < 44.0 and ax > 15.5:
			return [6 if int(floorf((x + y) / 3.0)) % 2 == 1 else 1, 0]
		# grilles d'aération latérales
		if not bool(s.simple) and ax >= 10.5 and ax < 14.0 and y > 18.0 and y < 35.0:
			return [1 if int(floorf(y)) % 3 == 0 else 2, 0]
		# rivets aux quatre coins de la plaque
		if (absf(ax - 17.5) < 0.6) and (absf(y - 12.0) < 0.6 or absf(y - 38.0) < 0.6):
			return [4, 0]
		if y < 13.5: return [4, 1]
		return [3, 1]
	# --- ailerons au sommet des épaulières -----------------------------------
	if _in_poly(ax, y, FIN): return [4, 1]
	# --- épaulières lance-missiles -------------------------------------------
	if _rr(ax, y, 0.5, 14.0, 11.5, 39.0, 2.5):
		for i in 3:
			var ty: float = 20.0 + i * 6.5
			var td: float = sqrt((ax - 6.0) * (ax - 6.0) + (y - ty) * (y - ty))
			if td < 2.6:
				if td < 1.5:
					return [5 if bool(s.tubes[(0 if side < 0 else 3) + i]) else 1, 0]
				return [2, 0]
		if y < 16.5: return [4, 1]
		if y > 36.0: return [2, 0]
		return [3, 1]
	if _in_poly(ax, y, BRACE_L): return [2, 1]
	return []

## rend : renvoie { tex, ox, oy } (origine = centre de l'œil)
static func render(o: Dictionary) -> Dictionary:
	var f: float = o.f
	var t: float = o.get("t", 0.0)
	var phase: float = o.get("phase", 0.0)
	var open: float = clampf(o.get("open", 0.0), 0.0, 1.0)
	var fire: float = clampf(o.get("fire", 0.0), 0.0, 1.0)
	var lx: float = o.get("lx", 0.0)
	var ly: float = o.get("ly", 0.0)
	var dmg: float = clampf(o.get("dmg", 0.0), 0.0, 1.0)
	var flashing: bool = float(o.get("flash", 0.0)) > 0.0
	# cache : quantifié (le sprite d'origine est de toute façon cadencé par crans)
	var key := "%s_%d_%d_%d_%d_%d_%d_%d" % [str(f), int(floorf(t * 12.0)), int(phase),
		int(round(open * 16.0)), int(round(fire * 6.0)), int(round(lx * 6.0)), int(round(ly * 6.0)), int(dmg * 5.0)]
	if flashing:
		key += "|fl"
	if _cache.has(key):
		return _cache[key]
	var W := int(ceil(DW * f)) + 2
	var H := int(ceil(DH * f)) + 2
	var s := {
		"simple": f < 0.7, "open": open, "fire": fire, "lx": lx, "ly": ly,
		"spin": floorf(t * (1.2 + phase * 0.8)) * (TAU / 16.0),
		"scan": int(floorf(t * 6.0)) % 4,
		"blink": int(floorf(t * 3.0)) % 2 == 0,
		"tubes": _tubes(t, fire),
	}
	var col := PackedByteArray()
	col.resize(W * H)
	var bev := PackedByteArray()
	bev.resize(W * H)
	for py in range(1, H - 1):
		for px in range(1, W - 1):
			var res := _sample((px - 1 + 0.5) / f, (py - 1 + 0.5) / f, s)
			if not res.is_empty():
				col[py * W + px] = res[0]
				bev[py * W + px] = res[1]
	# biseau : lumière en haut à gauche, ombre en bas à droite
	var out := PackedByteArray(col)
	for py in range(1, H - 1):
		for px in range(1, W - 1):
			var i: int = py * W + px
			if bev[i] == 0: continue
			var up: int = col[i - W]
			var lf: int = col[i - 1]
			var dn: int = col[i + W]
			var rt: int = col[i + 1]
			if up == 0 or lf == 0: out[i] = 4
			elif dn == 0 or rt == 0: out[i] = 2
	# fissures selon les dégâts
	if dmg > 0.3:
		_crack(out, W, H, [[12, 15], [16, 19], [14, 23], [17, 27]], f)
		_crack(out, W, H, [[41, 33], [38, 37], [40, 41]], f)
	if dmg > 0.55:
		_crack(out, W, H, [[42, 14], [39, 17], [41, 20]], f)
		_crack(out, W, H, [[3, 26], [7, 29], [5, 33]], f)
	if dmg > 0.8 and int(floorf(t * 10.0)) % 2 == 1:
		for k in 4:
			var a: float = t * 5.0 + k * 1.7
			var spx := int(round((CX + cos(a) * (18.0 + k * 3.0)) * f)) + 1
			var spy := int(round((IRY - 4.0 + sin(a * 1.3) * 14.0) * f)) + 1
			if spx > 0 and spy > 0 and spx < W and spy < H and out[spy * W + spx] != 0:
				out[spy * W + spx] = 5
	# contour sombre continu (4 voisins)
	for py in H:
		for px in W:
			var i: int = py * W + px
			if col[i] != 0: continue
			if (px > 0 and col[i - 1] != 0) or (px < W - 1 and col[i + 1] != 0) \
					or (py > 0 and col[i - W] != 0) or (py < H - 1 and col[i + W] != 0):
				out[i] = 1
	# palette LCD
	var inks: Array = []
	for h in Data.INKS:
		inks.append(Color(h))
	var pal: Array = [Color(0, 0, 0, 0), inks[0], inks[1], inks[2], inks[3], inks[3], inks[2]]
	var img := Image.create(W, H, false, Image.FORMAT_RGBA8)
	for i in W * H:
		var c: int = out[i]
		if c == 0: continue
		if flashing and c > 1 and c != 5:
			c = 3 if c == 2 else 4
		img.set_pixel(i % W, i / W, pal[c])
	var tex := ImageTexture.create_from_image(img)
	var res2 := { "tex": tex, "ox": (CX + 0.5) * f + 1.0, "oy": IRY * f + 1.0 }
	_cache[key] = res2
	return res2

static func _tubes(t: float, fire: float) -> Array:
	var out: Array = []
	for i in 6:
		out.append((int(floorf(t * 4.0)) + i * 2) % 6 == 0 or fire > 0.5)
	return out

static func _crack(out: PackedByteArray, W: int, H: int, pts: Array, f: float) -> void:
	for k in range(pts.size() - 1):
		var x0: float = pts[k][0]; var y0: float = pts[k][1]
		var x1: float = pts[k + 1][0]; var y1: float = pts[k + 1][1]
		var n := int(ceil(sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) * f * 1.5))
		for j in n + 1:
			var u := float(j) / float(n)
			var px := int(round((x0 + (x1 - x0) * u) * f)) + 1
			var py := int(round((y0 + (y1 - y0) * u) * f)) + 1
			if px > 0 and py > 0 and px < W and py < H and out[py * W + px] != 0:
				out[py * W + px] = 1
