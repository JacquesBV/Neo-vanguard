extends Node2D
## =========================================================================
## COQUE FANBOY NV-01 — (C10) matériau complet des 4 secteurs FanBoy (ère 0).
## Réplique fidèle du rendu officiel « nv01-shell » (module 51 du web) :
## boîtier gunmetal noir biseauté, vis étrier aux quatre coins, bandeau
## « /// FANBOY — NV-01 » sérigraphié argent, LED POWER rouge pulsante,
## chevron NEO-VANGUARD gravé, panneaux d'instruments LCD, gâchettes
## SELECT/START à liseré cyan, artwork étoiles + planète à l'horizon,
## ouïes haut-parleur. LE VERRE RESTE EXACTEMENT Data.GLASS (32,196,416,312)
## — la coque se dessine autour, la taille d'écran ne bouge pas.
## Instruments intégrés (à la place du bas du verre) : jauge COQUE, pips
## BOUCLIER, BOMBES, PUISSANCE + arme. Cadre LED de progression autour de la
## visière : vert → jaune → orange → rouge selon l'avancement du secteur.
## =========================================================================

var main: Node = null
var PixelUi := preload("res://scripts/ui/pixel_ui.gd")

# artwork : champ d'étoiles déterministe (construit une fois)
var _stars: Array = []

func _ready() -> void:
	z_index = -1
	var rng := RandomNumberGenerator.new()
	rng.seed = 24011987
	for i in 46:
		_stars.append({
			"x": rng.randf_range(14.0, 466.0), "y": rng.randf_range(690.0, 745.0),
			"s": 1 if rng.randf() < 0.7 else 2, "a": rng.randf_range(0.25, 0.9),
			"tw": rng.randf() * TAU,
		})

func _process(_d: float) -> void:
	if game() and game().state == "play":
		queue_redraw()   # LED, jauges, twinkle : la coque vit

func game() -> Node:
	return main.game if main else null

func _draw() -> void:
	var g: Node = game()
	if g == null or g.state != "play":
		return
	if g.era_idx != 0:
		return   # ères 1+ : vue plein écran, la barre tactile vit dans hud_overlay
	var glass: Rect2 = Data.GLASS
	var ms := Time.get_ticks_msec()
	# ================= le boîtier ========================================
	_body()
	_screws()
	_brand_band()
	_power_led(ms)
	_bezel(g, g.sector_progress(), ms)
	_wordmark()
	_instruments(g, ms)
	_pills(ms)
	_artwork(ms)
	_touch_bar(g)

# ---------------------------------------------------------------- le corps
func _body() -> void:
	# boîtier gunmetal : dégradé vertical modelé (les bandes, du haut sombre
	# au liseré du bas), comme le rendu officiel
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#10141a")
	sb.set_corner_radius_all(26)
	sb.border_color = Color("#4e5a66")
	sb.set_border_width_all(2)
	draw_style_box(sb, Rect2(0, 0, 480, 860))
	var stops := [Color("#333b45"), Color("#171c23"), Color("#0b0e13"), Color("#0a0c11"), Color("#1b212a")]
	for i in range(12, 848, 4):
		var t: float = float(i) / 860.0
		var k: float = t * float(stops.size() - 1)
		var j := mini(int(k), stops.size() - 2)
		var c: Color = stops[j].lerp(stops[j + 1], k - float(j))
		var x0: float = 36.0 if i < 40 else 12.0
		var x1: float = 444.0 if i > 820 else 468.0
		draw_rect(Rect2(x0, i, x1 - x0, 4), c)
	# arêtes : lumière en haut, resserrement bas
	draw_rect(Rect2(14, 8, 452, 2), Color(0.62, 0.70, 0.78, 0.42))
	draw_rect(Rect2(14, 850, 452, 2), Color(0, 0, 0, 0.55))
	draw_rect(Rect2(12, 12, 3, 836), Color(0, 0, 0, 0.30))
	draw_rect(Rect2(465, 12, 3, 836), Color(0, 0, 0, 0.30))
	# balayage spéculaire discret (le reflet du métal brossé)
	draw_polygon(PackedVector2Array([Vector2(40, 130), Vector2(150, 12), Vector2(70, 12), Vector2(14, 96)]),
		PackedColorArray([Color(1, 1, 1, 0.035), Color(1, 1, 1, 0.05), Color(1, 1, 1, 0.02), Color(1, 1, 1, 0.0)]))

func _screw(p: Vector2) -> void:
	draw_circle(p, 8.0, Color(0.04, 0.05, 0.07))                      # logement
	draw_circle(p, 6.2, Color("#252c35"))                             # tête
	draw_arc(p, 6.2, 0, TAU, 20, Color("#4b5763"), 1.2)               # chant
	draw_circle(p + Vector2(-1.8, -1.8), 1.7, Color(0.85, 0.9, 0.95, 0.5))  # reflet
	draw_line(p + Vector2(-3.4, 0), p + Vector2(3.4, 0), Color("#0d1116"), 1.6)  # fente
	draw_line(p + Vector2(0, -3.4), p + Vector2(0, 3.4), Color("#0d1116"), 1.6)

func _screws() -> void:
	_screw(Vector2(34, 34))
	_screw(Vector2(446, 34))
	_screw(Vector2(34, 826))
	_screw(Vector2(446, 826))

# ------------------------------------------------------- bandeau de marque
func _brand_band() -> void:
	# « /// FANBOY » italique argent + microbiographie NV-01, comme le rendu
	_draw_italic(Vector2(150, 56), "FANBOY", 22, Color("#c9d2da"))
	for i in 3:   # les trois chevrons de vitesse devant le nom
		draw_line(Vector2(108 + i * 13, 52), Vector2(98 + i * 13, 30), Color(0.55, 0.62, 0.70, 0.85), 4.0)
	_txtp(Vector2(452, 40), "NV-01", 10, Color("#8a95a1"), HORIZONTAL_ALIGNMENT_RIGHT)
	_txtp(Vector2(452, 56), "NEO VANGUARD", 7, Color(0.5, 0.57, 0.65, 0.8), HORIZONTAL_ALIGNMENT_RIGHT)
	draw_rect(Rect2(28, 74, 424, 1), Color(0.42, 0.49, 0.57, 0.35))
	draw_rect(Rect2(28, 76, 424, 1), Color(0, 0, 0, 0.5))

# ------------------------------------------------------------ LED POWER
func _power_led(ms: int) -> void:
	var on: float = 0.72 + 0.28 * sin(ms / 650.0)
	var p := Vector2(17, 250)
	draw_circle(p, 9.5, Color(1.0, 0.11, 0.12, on * 0.14))            # halo
	draw_circle(p, 4.6, Color(0.89, 0.10, 0.11, on))                  # corps
	draw_circle(p + Vector2(-1.4, -1.4), 1.5, Color(1.0, 0.78, 0.75, on * 0.95))
	_txtp(Vector2(8, 272), "PWR", 7, Color("#727e8a"))
	# gravure de bandeau sous la LED
	_txtp(Vector2(8, 132), "TACTICAL", 7, Color(0.42, 0.48, 0.55, 0.7))
	_txtp(Vector2(8, 143), "FLIGHT", 7, Color(0.42, 0.48, 0.55, 0.7))
	_txtp(Vector2(8, 154), "SYSTEM", 7, Color(0.42, 0.48, 0.55, 0.7))

# ------------------------------------------- visière + cadre de progression
func _bezel(g: Node, progress: float, ms: int) -> void:
	var glass: Rect2 = Data.GLASS
	# visière noire autour du verre (l'écran ne bouge pas : 32,196,416,312)
	var vis := Rect2(glass.position.x - 10, glass.position.y - 10, glass.size.x + 20, glass.size.y + 20)
	var vb := StyleBoxFlat.new()
	vb.bg_color = Color("#07090d")
	vb.set_corner_radius_all(12)
	vb.border_color = Color("#39424d")
	vb.set_border_width_all(2)
	draw_style_box(vb, vis)
	draw_rect(Rect2(vis.position.x + 2, vis.position.y + 2, vis.size.x - 4, 2), Color(1, 1, 1, 0.07))
	draw_rect(Rect2(vis.position.x + 2, vis.end.y - 4, vis.size.x - 4, 2), Color(0, 0, 0, 0.6))
	# --- CADRE LED DE PROGRESSION (C10) : vert → jaune → orange → rouge -----
	var col: Color = Data.progress_color(progress)
	var pulse: float = 1.0
	if progress > 0.75:   # tension maximale : le cadre se met à battre
		pulse = 0.72 + 0.28 * sin(ms / 110.0)
	draw_rect(Rect2(16, 180, 448, 344), Color(col.r, col.g, col.b, 0.16 * pulse), false, 7.0)  # halo
	draw_rect(Rect2(19, 183, 442, 338), Color(col.r, col.g, col.b, 0.55 + 0.45 * pulse), false, 2.5)
	# gravure « SECTEUR » sous le cadre, à gauche de la visière
	_txtp(Vector2(452, 530), "%d %%" % int(round(progress * 100.0)), 8,
		Color(col.r, col.g, col.b, 0.85), HORIZONTAL_ALIGNMENT_RIGHT)

# ------------------------------------------------- chevron + NEO-VANGUARD
func _wordmark() -> void:
	var cx := 240.0
	var cy := 540.0
	var c := Color(0.72, 0.78, 0.85, 0.9)
	# chevron ailé du rendu officiel : deux ailes + la pointe
	draw_polyline(PackedVector2Array([Vector2(cx - 26, cy - 8), Vector2(cx, cy + 4), Vector2(cx + 26, cy - 8)]), c, 3.0)
	draw_line(Vector2(cx - 12, cy - 9), Vector2(cx, cy - 3), c, 2.0)
	draw_line(Vector2(cx + 12, cy - 9), Vector2(cx, cy - 3), c, 2.0)
	_txtp(Vector2(cx, 560), "N E O - V A N G U A R D", 8, Color(0.55, 0.61, 0.68, 0.9), HORIZONTAL_ALIGNMENT_CENTER)

# --------------------------------------------------- instruments (LCD coque)
func _instruments(g: Node, ms: int) -> void:
	# (C10) le bas du verre est LIBÉRÉ : les jauges de survie descendent sur
	# le panneau de la coque — encres LCD de la console, comme l'original.
	var ink := Color(Data.INKS[3])
	var mid := Color(Data.INKS[2])
	var P: Dictionary = g.first_player()
	# le petit écran système
	var strip := Rect2(28, 572, 424, 58)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#0b0f09")
	sb.set_corner_radius_all(8)
	sb.border_color = Color("#242c1f")
	sb.set_border_width_all(2)
	draw_style_box(sb, strip)
	draw_rect(Rect2(strip.position.x + 2, strip.position.y + 2, strip.size.x - 4, 2), Color(0.62, 0.64, 0.55, 0.10))
	var sx: float = strip.position.x + 14
	var rx: float = strip.end.x - 14
	# ---- ligne 1 : COQUE (jauge segmentée) + BOUCLIER (pips) --------------
	var frac: float = 1.0
	var hp: int = 3
	var max_hp: int = 3
	var sh: int = 0
	var sh_max: int = 0
	if not P.is_empty():
		frac = clampf(float(P.hp) / float(P.max_hp), 0, 1)
		hp = int(P.hp); max_hp = int(P.max_hp); sh = int(P.shield); sh_max = int(P.sh_max)
	_txtp(Vector2(sx, 590), "COQUE %d/%d" % [hp, max_hp], 8, ink)
	var gx := sx + 92.0
	var gw := 128.0
	draw_rect(Rect2(gx, 582, gw, 9), Color(mid.r, mid.g, mid.b, 0.22))
	var gc: Color = ink if frac > 0.35 else Color(Data.INKS[3])
	draw_rect(Rect2(gx, 582, gw * frac, 9), gc)
	draw_rect(Rect2(gx, 582, gw, 9), ink, false, 1.0)
	var seg := gx + 6.4
	while seg < gx + gw - 2.0:
		draw_line(Vector2(seg, 583), Vector2(seg, 590), Color(0.09, 0.11, 0.07, 0.8), 1.0)
		seg += 12.8
	_txtp(Vector2(sx + 238, 590), "BOUCLIER", 8, ink)
	for i in sh_max:
		var pc: Color = ink if i < sh else Color(mid.r, mid.g, mid.b, 0.18)
		draw_rect(Rect2(sx + 306 + i * 13, 582, 10, 9), pc)
	# ---- ligne 2 : BOMBES + PUISSANCE + ARME ------------------------------
	if not P.is_empty():
		_txtp(Vector2(sx, 616), "BOMBES ×%d" % int(P.bombs), 8, ink)
		_txtp(Vector2(sx + 118, 616), "PWR %d/5" % int(P.power), 8, ink)
		var wname: String = String(g.stats.weapon.name).to_upper()
		if wname.length() > 16:
			wname = wname.substr(0, 15) + "·"
		_txtp(Vector2(rx, 616), wname, 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)
	# ---- indicateur PAUSE (SELECT) : inversion LCD clignotante ------------
	if g.paused and (main == null or main.pause_screen == null):
		if fmod(ms / 400.0, 2.0) < 1.2:
			var inv := StyleBoxFlat.new()
			inv.bg_color = ink
			inv.set_corner_radius_all(6)
			draw_style_box(inv, strip)
			_txtp(Vector2(240, 600), "❚❚ PAUSE", 11, Color("#0b0f09"), HORIZONTAL_ALIGNMENT_CENTER)
			_txtp(Vector2(240, 618), "SELECT · REPRENDRE", 7, Color("#0b0f09"), HORIZONTAL_ALIGNMENT_CENTER)

# ------------------------------------------- gâchettes SELECT et START (C10)
func _pills(ms: int) -> void:
	var flash: Dictionary = main.shell_press if main != null else {}
	_pill(Rect2(120, 638, 104, 40), "SELECT", "select", flash, ms)
	_pill(Rect2(256, 638, 104, 40), "START", "start", flash, ms)

func _pill(r: Rect2, label: String, id: String, flash: Dictionary, ms: int) -> void:
	var pressed: bool = flash.has(id) and ms - int(flash[id]) < 170
	var y: float = r.position.y + (2.0 if pressed else 0.0)
	# ombre portée du capot
	draw_rect(Rect2(r.position.x + 3, r.position.y + r.size.y - 2, r.size.x, 6), Color(0, 0, 0, 0.45))
	var pb := StyleBoxFlat.new()
	pb.bg_color = Color("#5d6873") if pressed else Color("#8f9aa5")
	pb.set_corner_radius_all(r.size.y / 2.0)
	pb.border_color = Color("#38e0ff") if not pressed else Color("#bff4ff")
	pb.set_border_width_all(2)
	draw_style_box(pb, Rect2(r.position.x, y, r.size.x, r.size.y))
	# dôme : reflet haut + ventre bas
	draw_rect(Rect2(r.position.x + 8, y + 4, r.size.x - 16, 7), Color(1, 1, 1, 0.5 if not pressed else 0.2))
	draw_rect(Rect2(r.position.x + 8, y + r.size.y - 9, r.size.x - 16, 5), Color(0.1, 0.13, 0.17, 0.35))
	_txtp(Vector2(r.position.x + r.size.x / 2.0, y + r.size.y / 2.0 + 5), label, 10,
		Color("#12161c") if not pressed else Color("#0a0d12"), HORIZONTAL_ALIGNMENT_CENTER)

# ------------------------------------------------- artwork bas de coque
func _artwork(ms: int) -> void:
	# le ciel du rendu officiel : étoiles + horizon de planète bleue
	for st in _stars:
		var tw: float = 0.6 + 0.4 * sin(ms / 700.0 + float(st.tw))
		draw_rect(Rect2(float(st.x), float(st.y), float(st.s), float(st.s)),
			Color(0.85, 0.92, 1.0, float(st.a) * tw))
	# planète : chapeau bien visible entre les gâchettes et la barre (top ≤ 742)
	var c := Vector2(240, 836)
	draw_circle(c, 96.0, Color("#0d1c3a"))
	draw_circle(c, 96.0, Color(0.10, 0.22, 0.45, 0.55))
	draw_arc(c, 96.0, -PI / 2.0 - 0.62, -PI / 2.0 + 0.62, 40, Color("#4a90d9"), 2.5)
	draw_arc(c, 100.0, -PI / 2.0 - 0.5, -PI / 2.0 + 0.5, 30, Color(0.24, 0.56, 0.85, 0.25), 5.0)
	draw_arc(c, 84.0, -PI / 2.0 - 0.4, -PI / 2.0 + 0.4, 24, Color(0.55, 0.63, 0.72, 0.30), 1.5)
	# accents rouges à gauche (le modèle en porte deux)
	for i in 2:
		draw_polygon(PackedVector2Array([Vector2(38 + i * 12, 726), Vector2(46 + i * 12, 706),
			Vector2(42 + i * 12, 706), Vector2(34 + i * 12, 726)]),
			PackedColorArray([Color("#e03131"), Color("#e03131"), Color("#a01717"), Color("#a01717")]))
	# ouïes haut-parleur à droite
	for i in 4:
		draw_rect(Rect2(398 + i * 13, 706 + i * 2, 8, 30), Color(0.02, 0.03, 0.05, 0.9))
		draw_rect(Rect2(399 + i * 13, 707 + i * 2, 2, 28), Color(0.30, 0.36, 0.43, 0.5))
	# gravure de série
	_txtp(Vector2(94, 736), "S/N 24-1987 · NEO VANGUARD", 7, Color(0.34, 0.39, 0.45, 0.8))

# ------------------------------------------- barre de commandes tactile
func _touch_bar(g: Node) -> void:
	var bar := Rect2(0, 742, 480, 118)
	draw_rect(bar, Color("#0a0d12"))
	draw_rect(Rect2(0, 742, 480, 2), Color(0.28, 0.33, 0.39, 0.8))
	_btn(Rect2(14, 756, 74, 90), "BOMBE", _bomb_txt(g), Color("#cfe6ff"), "")
	_btn(Rect2(98, 756, 56, 90), "", "−", Color("#cfe6ff"), "PRÉC")
	_btn(Rect2(164, 756, 152, 90), "ARMEMENT", _weapon_txt(), Color("#ffd166"), "%d DISPONIBLES" % _weapon_count())
	_btn(Rect2(326, 756, 56, 90), "", "+", Color("#cfe6ff"), "SUIV")
	_btn(Rect2(392, 756, 74, 90), "", "II", Color("#cfe6ff"), "PAUSE")

func _draw_italic(pos: Vector2, text: String, size: int, col: Color) -> void:
	# italique réel : glyphes cisailés, ligne de base horizontale (comme
	# « italic 900 » du moteur d'origine), avec un chasse espacé.
	var f: Font = _font()
	var adv: float = 0.0
	for ch in text:
		var w: float = f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
		draw_set_transform_matrix(Transform2D(Vector2(1.0, -0.22), Vector2(0, 1), pos + Vector2(adv, 0)))
		draw_string(f, Vector2.ZERO, ch, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)
		adv += w + size * 0.06
	draw_set_transform_matrix(Transform2D())

func _btn(r: Rect2, title: String, value: String, vcol: Color, sub: String) -> void:
	var b := StyleBoxFlat.new()
	b.bg_color = Color("#05070c")
	b.set_corner_radius_all(9)
	b.border_color = Color("#4a5663")
	b.set_border_width_all(2)
	draw_style_box(b, r)
	var cx: float = r.position.x + r.size.x / 2.0
	if title != "":
		_txtp(Vector2(cx, r.position.y + 16), title, 8, Color("#8fa0b6"), HORIZONTAL_ALIGNMENT_CENTER)
		var vs := 16 if value.length() <= 4 else 12
		_txtp(Vector2(cx, r.position.y + (52 if sub != "" else 56)), value, vs, vcol, HORIZONTAL_ALIGNMENT_CENTER)
		if sub != "":
			_txtp(Vector2(cx, r.position.y + 76), sub, 8, Color("#7f8ea3") if vcol != Color("#ffd166") else Color("#e8edda"), HORIZONTAL_ALIGNMENT_CENTER)
	else:
		_txtp(Vector2(cx, r.position.y + (48 if sub != "" else 54)), value, 16, vcol, HORIZONTAL_ALIGNMENT_CENTER)
		if sub != "":
			_txtp(Vector2(cx, r.position.y + 76), sub, 8, Color("#7f8ea3"), HORIZONTAL_ALIGNMENT_CENTER)

func _txt(pos: Vector2, text: String, size: int, col: Color, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	if align == HORIZONTAL_ALIGNMENT_RIGHT:
		draw_string(_font(), Vector2(0, pos.y), text, align, pos.x, size, col)
	elif align == HORIZONTAL_ALIGNMENT_CENTER:
		draw_string(_font(), Vector2(pos.x - 140.0, pos.y), text, align, 280.0, size, col)
	else:
		draw_string(_font(), pos, text, align, -1, size, col)

func _fontp() -> Font:
	return PixelUi.font()

func _txtp(pos: Vector2, text: String, size: int, col: Color, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	var f: Font = _fontp()
	if f == null:
		f = _font()
	if align == HORIZONTAL_ALIGNMENT_RIGHT:
		draw_string(f, Vector2(0, pos.y), text, align, pos.x, size, col)
	elif align == HORIZONTAL_ALIGNMENT_CENTER:
		draw_string(f, Vector2(pos.x - 200.0, pos.y), text, align, 400.0, size, col)
	else:
		draw_string(f, pos, text, align, -1, size, col)

func _font() -> Font:
	return ThemeDB.fallback_font

func _bomb_txt(g: Node) -> String:
	if g.players.is_empty():
		return "0"
	return str(int(g.players[0].bombs))

func _weapon_txt() -> String:
	return String(Save.S.sel.weapon).to_upper()

func _weapon_count() -> int:
	var n := 0
	for w in Data.WEAPONS:
		if w.price == 0 or (Save.S.owned.weapons as Array).has(w.id):
			n += 1
	return n
