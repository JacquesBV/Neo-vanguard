extends Node2D
## =========================================================================
## HUD OVERLAY — le tableau de bord est dessiné PLEINE RÉSOLUTION au-dessus
## du champ de jeu basse résolution, exactement comme le HUD HTML du jeu
## d'origine (le canvas rétro reste chunky, le HUD reste lisible).
## =========================================================================

var game: NVGame
const PixelUi := preload("res://scripts/ui/pixel_ui.gd")

func _process(_delta: float) -> void:
	if game != null and game.state == "play":
		queue_redraw()

func _fontp() -> Font:
	return PixelUi.font()

func _font() -> Font:
	return ThemeDB.fallback_font

func _txt(pos: Vector2, text: String, size: int, col: Color, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	if align == HORIZONTAL_ALIGNMENT_RIGHT:
		draw_string(_font(), Vector2(0, pos.y), text, align, pos.x, size, col)
	elif align == HORIZONTAL_ALIGNMENT_CENTER:
		draw_string(_font(), Vector2(pos.x - 140.0, pos.y), text, align, 280.0, size, col)
	else:
		draw_string(_font(), pos, text, align, -1, size, col)

func _draw() -> void:
	if game == null or game.state != "play":
		return
	var TH: Dictionary = game.TH
	if game.era_idx == 0:
		_draw_hud_lcd()
	else:
		_draw_hud_std()
		# barre tactile des ères 1+ (#touchui du web : AU-DESSUS du canvas)
		if bool(Save.S.opts.get("frame", true)):
			_draw_touch_bar(game)

func _draw_hud_std() -> void:
	var TH: Dictionary = game.TH
	var ink: Color = TH.p_lite
	var dim := Color(0, 0, 0, 0.35)
	draw_rect(Rect2(0, 0, Data.L_W, 34), dim)
	_txt(Vector2(10, 22), "SCORE %s" % fmt(game.score), 14, ink)
	_txt(Vector2(Data.L_W - 10, 15), "RECORD %s" % fmt(maxi(int(Save.S.best), game.score)), 11,
		Color(ink.r, ink.g, ink.b, 0.7), HORIZONTAL_ALIGNMENT_RIGHT)
	_txt(Vector2(Data.L_W - 10, 29), "CR %s" % fmt(game.credits_run), 11, TH.gold, HORIZONTAL_ALIGNMENT_RIGHT)
	# étiquette du secteur / de l'ère
	var era: Dictionary = Data.ERAS[game.era_idx]
	_txt(Vector2(10, 48), "SECTEUR %d/24 · %s" % [game.level, era.name], 10, Color(ink.r, ink.g, ink.b, 0.85))
	_txt(Vector2(Data.L_W - 10, 48), era.tag, 10, Color(ink.r, ink.g, ink.b, 0.6), HORIZONTAL_ALIGNMENT_RIGHT)
	# --- barre de vie du boss ------------------------------------------------
	if not game.boss.is_empty() and not game.boss.enter:
		var b: Dictionary = game.boss
		var f: float = clampf(float(b.hp) / float(b.max_hp), 0, 1)
		draw_rect(Rect2(40, 56, Data.L_W - 80, 10), Color(0, 0, 0, 0.55))
		draw_rect(Rect2(40, 56, (Data.L_W - 80) * f, 10), TH.e_boss if f > 0.33 else TH.danger)
		draw_rect(Rect2(40, 56, Data.L_W - 80, 10), Color(1, 1, 1, 0.4), false, 1.0)
		_txt(Vector2(Data.L_W / 2.0, 80), b.name, 12, TH.e_boss_lite if game.era_idx > 0 else TH.livery[3], HORIZONTAL_ALIGNMENT_CENTER)
	# --- bandeau bas ----------------------------------------------------------
	draw_rect(Rect2(0, Data.L_H - 26, Data.L_W, 26), dim)
	var P: Dictionary = game.first_player()
	if not P.is_empty():
		# vies (petits vaisseaux)
		for i in maxi(int(P.lives) + 1, 0):
			var vx := 14.0 + i * 18.0
			draw_colored_polygon(PackedVector2Array([Vector2(vx, Data.L_H - 20), Vector2(vx - 6, Data.L_H - 8), Vector2(vx + 6, Data.L_H - 8)]), ink)
		# coque
		var hx := 110.0
		for i in int(P.max_hp):
			var c: Color = TH.hull if i < int(P.hp) else Color(1, 1, 1, 0.15)
			draw_rect(Rect2(hx + i * 12, Data.L_H - 18, 9, 9), c)
		# boucliers
		var sx: float = hx + P.max_hp * 12 + 10
		for i in int(P.sh_max):
			var c2: Color = TH.shield if i < int(P.shield) else Color(1, 1, 1, 0.15)
			draw_rect(Rect2(sx + i * 12, Data.L_H - 18, 9, 9), c2)
		# bombes
		_txt(Vector2(Data.L_W - 150, Data.L_H - 8), "BOMBES ×%d" % int(P.bombs), 11,
			(game.TH.livery[3] if game.era_idx == 0 else Color("#ff7ad9")))
		# puissance + arme
		_txt(Vector2(10, Data.L_H - 33), "PWR %d/5 · %s" % [int(P.power), game.stats.weapon.name], 10, ink)
	# compteur de performances (option FPS)
	if Save.S.opts.get("fps", false):
		_txt(Vector2(10, 62), "FPS %d" % Engine.get_frames_per_second(), 10, TH.gold)
	# --- combo ----------------------------------------------------------------
	if game.combo > 1:
		_txt(Vector2(Data.L_W - 10, Data.L_H - 33), "CHAÎNE ×%.2f" % game.score_mult(), 12, TH.gold, HORIZONTAL_ALIGNMENT_RIGHT)
		var bw := 90.0
		draw_rect(Rect2(Data.L_W - 10 - bw, Data.L_H - 29, bw * clampf(game.combo_t / Data.COMBO_WINDOW, 0, 1), 3), TH.gold)

# ---------------------------------------------------------------------
# HUD « LCD » du secteur Pocket : pixel-texte encre DANS le verre 4:3,
# sous la visière (rangée SC / VIES / COINS, puis COQUE et sa jauge).
func _draw_hud_lcd() -> void:
	var TH: Dictionary = game.TH
	var glass: Rect2 = Data.GLASS
	var ink: Color = TH.livery[0]
	var mid: Color = TH.livery[1]
	var top: float = glass.position.y + 6.0
	var sx: float = glass.position.x + 10.0
	var rx: float = glass.end.x - 10.0
	var W: float = glass.size.x
	# modelé de la vitre (drawScreenGlass) : ombre haute/basse + reflet diagonal
	var sh: Color = Color(0.098, 0.133, 0.071)
	var y_a: float = glass.position.y + glass.size.y * 0.12
	var y_b: float = glass.position.y + glass.size.y * 0.72
	_quad(glass.position, Vector2(glass.end.x, y_a), Color(sh.r, sh.g, sh.b, 0.12), Color(sh.r, sh.g, sh.b, 0.0))
	_quad(Vector2(glass.position.x, y_a), Vector2(glass.end.x, y_b), Color(sh.r, sh.g, sh.b, 0.0), Color(sh.r, sh.g, sh.b, 0.025))
	_quad(Vector2(glass.position.x, y_b), glass.end, Color(sh.r, sh.g, sh.b, 0.025), Color(sh.r, sh.g, sh.b, 0.10))
	var rf: Color = Color(0.957, 0.969, 0.875)
	_quad(glass.position, Vector2(glass.end.x, glass.end.y), Color(rf.r, rf.g, rf.b, 0.08), Color(rf.r, rf.g, rf.b, 0.17), true)
	# liseré lumineux : la lumière de l'écran qui bave sur la visière
	draw_rect(glass, Color(TH.livery[3].r, TH.livery[3].g, TH.livery[3].b, 0.9), false, 2.0)
	# rangée 1 — dot-matrix, chiffres groupés comme l'original
	_txtp(Vector2(sx, top + 15), "SC %s" % fmt_space(game.score), 8, ink)
	_txtp(Vector2(glass.position.x + W / 2.0, top + 15), "VIES ×%d" % (int(game.first_player().get("lives", 0)) + 1), 8, ink, HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(rx, top + 15), "COINS %s" % fmt_space(game.credits_run), 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)
	# rangée 2 : coque + jauge
	var P: Dictionary = game.first_player()
	var frac: float = 1.0 if P.is_empty() else clampf(float(P.hp) / float(P.max_hp), 0, 1)
	_txtp(Vector2(sx, top + 35), "COQUE", 8, ink)
	var bx := sx + 56.0
	var bw2 := rx - 44.0 - bx
	draw_rect(Rect2(bx, top + 27, bw2, 10), Color(mid.r, mid.g, mid.b, 0.25))
	draw_rect(Rect2(bx, top + 27, bw2 * frac, 10), mid)
	draw_rect(Rect2(bx, top + 27, bw2, 10), ink, false, 1.0)
	# échelle segmentée par-dessus la jauge (tirets de l'original)
	var seg := bx + 5.0
	while seg < bx + bw2 - 2.0:
		draw_line(Vector2(seg, top + 28), Vector2(seg, top + 36), Color(ink.r, ink.g, ink.b, 0.55), 1.0)
		seg += 10.0
	_txtp(Vector2(rx, top + 35), "%d %%" % int(round(frac * 100)), 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)
	# l'épais trait qui ferme le HUD, comme sur la console
	draw_rect(Rect2(sx - 2.0, top + 43, W - 16.0, 3.0), Color(ink.r, ink.g, ink.b, 0.8))
	# barre de l'amiral, encre LCD
	if not game.boss.is_empty() and not game.boss.enter:
		var b: Dictionary = game.boss
		var f: float = clampf(float(b.hp) / float(b.max_hp), 0, 1)
		var bw3 := W - 60.0
		draw_rect(Rect2(glass.position.x + 30, top + 54, bw3, 7), Color(mid.r, mid.g, mid.b, 0.30))
		draw_rect(Rect2(glass.position.x + 30, top + 54, bw3 * f, 7), ink)
		draw_rect(Rect2(glass.position.x + 30, top + 54, bw3, 7), ink, false, 1.0)
		_txtp(Vector2(glass.position.x + W / 2.0, top + 76), b.name, 8, ink, HORIZONTAL_ALIGNMENT_CENTER)
	# pied du verre : puissance, arme, bombes, chaîne
	if not P.is_empty():
		_txtp(Vector2(sx, glass.end.y - 10.0), "PWR %d/5 · %s" % [int(P.power), String(game.stats.weapon.name).to_upper()], 8, ink)
		_txtp(Vector2(rx, glass.end.y - 10.0), "BOMBES ×%d" % int(P.bombs), 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)
	if game.combo > 1:
		_txt(Vector2(glass.position.x + W / 2.0, glass.end.y - 28.0), "CHAÎNE ×%.2f" % game.score_mult(), 11, mid, HORIZONTAL_ALIGNMENT_CENTER)

func _quad(a: Vector2, b: Vector2, c_top: Color, c_bot: Color, diag := false) -> void:
	var pts := PackedVector2Array([a, Vector2(b.x, a.y), b, Vector2(a.x, b.y)])
	var cols: Array[Color]
	if diag:
		cols = [c_bot, c_bot.lerp(c_top, 0.6), c_top, Color(c_top.r, c_top.g, c_top.b, 0.0)]
	else:
		cols = [c_top, c_top, c_bot, c_bot]
	draw_polygon(pts, cols)

func _txtp(pos: Vector2, text: String, size: int, col: Color, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	# texte dot-matrix : dessiné dans la police pixel de la console
	var f: Font = _fontp()
	if f == null:
		f = _font()
	if align == HORIZONTAL_ALIGNMENT_RIGHT:
		draw_string(f, Vector2(0, pos.y), text, align, pos.x, size, col)
	elif align == HORIZONTAL_ALIGNMENT_CENTER:
		draw_string(f, Vector2(pos.x - 200.0, pos.y), text, align, 400.0, size, col)
	else:
		draw_string(f, pos, text, align, -1, size, col)

func fmt_space(n: int) -> String:
	# « 2 296 » : groupes de trois, séparés par une espace fine
	var s := str(n)
	var out := ""
	while s.length() > 3:
		out = " " + s.substr(s.length() - 3, 3) + out
		s = s.substr(0, s.length() - 3)
	return s + out

func fmt(n: int) -> String:
	var s := str(n)
	var out := ""
	var c := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		c += 1
		if c % 3 == 0 and i > 0: out = " " + out
	return out

# ---- barre tactile des ères 1+ (#touchui du web : bande fixe en bas,
# AU-DESSUS du canvas — dessinée ici car hud_overlay est au-dessus de la vue)
func _draw_touch_bar(g: Node) -> void:
	var acc: Color = g.TH.acc if g.TH.has("acc") else Color("#38e0ff")
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.043, 0.078, 0.16, 0.72)
	bg.border_color = Color(acc.r, acc.g, acc.b, 0.4)
	bg.border_width_top = 2
	draw_style_box(bg, Rect2(0, 742, 480, 118))
	var wob := Color(1, 1, 1, 0.85)
	_bar_btn(Rect2(14, 756, 74, 90), "BOMBE", _bomb_txt(g), wob, acc)
	_bar_btn(Rect2(98, 756, 56, 90), "", "−", wob, acc, "PRÉC")
	_bar_btn(Rect2(164, 756, 152, 90), "ARMEMENT", _weapon_txt(), Color("#ffd166"), acc, "%d DISPONIBLES" % _weapon_count())
	_bar_btn(Rect2(326, 756, 56, 90), "", "+", wob, acc, "SUIV")
	_bar_btn(Rect2(392, 756, 74, 90), "", "II", wob, acc, "PAUSE")

func _bar_btn(r: Rect2, title: String, value: String, vcol: Color, acc: Color, sub: String = "") -> void:
	var b := StyleBoxFlat.new()
	b.bg_color = Color(0.02, 0.045, 0.1, 0.9)
	b.set_corner_radius_all(9)
	b.border_color = Color(acc.r, acc.g, acc.b, 0.45)
	b.set_border_width_all(2)
	draw_style_box(b, r)
	var f: Font = PixelUi.font()
	if f == null:
		f = ThemeDB.fallback_font
	var cx: float = r.position.x + r.size.x / 2.0
	if title != "":
		draw_string(f, Vector2(cx - 200.0, r.position.y + 16), title, HORIZONTAL_ALIGNMENT_CENTER, 400.0, 8, Color("#9fb0cc"))
		var vs := 16 if value.length() <= 4 else 12
		draw_string(f, Vector2(cx - 200.0, r.position.y + (52 if sub != "" else 56)), value, HORIZONTAL_ALIGNMENT_CENTER, 400.0, vs, vcol)
		if sub != "":
			draw_string(f, Vector2(cx - 200.0, r.position.y + 76), sub, HORIZONTAL_ALIGNMENT_CENTER, 400.0, 8, Color("#8ea0c0"))
	else:
		draw_string(f, Vector2(cx - 200.0, r.position.y + (48 if sub != "" else 54)), value, HORIZONTAL_ALIGNMENT_CENTER, 400.0, 16, vcol)
		if sub != "":
			draw_string(f, Vector2(cx - 200.0, r.position.y + 76), sub, HORIZONTAL_ALIGNMENT_CENTER, 400.0, 8, Color("#9fb0cc"))

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
