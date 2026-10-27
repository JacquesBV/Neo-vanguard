extends Node2D
## =========================================================================
## HUD OVERLAY — tableau de bord dessiné au-dessus du champ de jeu :
##  • Secteurs 1–3 avec console FanBoy active (`in_fanboy_viewport = true`) :
##    HUD dot-matrix LCD directement dans le GameViewport de la FanBoy
##    (encadré par les bords arrondis de `shell.png`), tandis que les jauges
##    COQUE / BOSS, VIES, BOMBES et les rails lumineux de menace sont pilotés
##    par `scenes/FanBoy.tscn` (`scripts/fanboy.gd`).
##  • Secteurs 4–24 (ou option PC sans cadre) : HUD standard + barre tactile.
## =========================================================================

var game: NVGame
var main: Node = null
var in_fanboy_viewport := false
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

func _is_fanboy_console_active() -> bool:
	return game != null and Data.is_fanboy_level(game.level) and bool(Save.S.opts.get("frame", true))

func _draw() -> void:
	if game == null or game.state != "play":
		return
	if in_fanboy_viewport:
		if _is_fanboy_console_active():
			_draw_fanboy_screen_lcd(Rect2(0.0, 0.0, Data.FW, Data.FH), true)
			if game.paused and (main == null or main.current_screen == null) \
					and (main == null or str(main.get("power_state")) == "on"):
				_draw_pause_veil_rect(Rect2(0.0, 0.0, Data.FW, Data.FH), true)
		return

	# Couche racine 480×860 : silencieuse lorsque la console FanBoy gère l'affichage
	if _is_fanboy_console_active():
		return

	if game.era_idx == 0:
		_draw_fanboy_screen_lcd(Rect2(0.0, 0.0, Data.L_W, Data.L_H), false)
	else:
		_draw_hud_std()
		if bool(Save.S.opts.get("frame", true)):
			_draw_touch_bar(game)
		_draw_progress_frame()

	if game.paused and (main == null or main.current_screen == null) \
			and (main == null or str(main.get("power_state")) == "on"):
		_draw_pause_veil_rect(Rect2(0.0, 0.0, Data.L_W, Data.L_H), game.era_idx == 0)

## Cadre lumineux de progression du secteur (secteurs 4–24 plein écran)
func _draw_progress_frame() -> void:
	var p: float = game.sector_progress()
	var col: Color = Data.progress_color(p)
	var pulse: float = 1.0
	if p > 0.75:
		pulse = 0.72 + 0.28 * sin(Time.get_ticks_msec() / 110.0)
	draw_rect(Rect2(1, 1, Data.L_W - 2, Data.L_H - 2), Color(col.r, col.g, col.b, 0.14 * pulse), false, 7.0)
	draw_rect(Rect2(3, 3, Data.L_W - 6, Data.L_H - 6), Color(col.r, col.g, col.b, 0.5 + 0.5 * pulse), false, 2.5)

## Voile PAUSE (touche SELECT gelant la partie sans ouvrir le menu)
func _draw_pause_veil_rect(r: Rect2, lcd_style: bool) -> void:
	var veil_col: Color = Color(0.08, 0.11, 0.07, 0.42) if lcd_style else Color(0.01, 0.02, 0.05, 0.30)
	var txt_col: Color = Color(Data.INKS[0], 0.92) if lcd_style else Color(1, 1, 1, 0.85)
	var sub_col: Color = Color(Data.INKS[0], 0.72) if lcd_style else Color(1, 1, 1, 0.55)
	draw_rect(r, veil_col)
	var c := r.get_center()
	_txt(Vector2(c.x, c.y - 8.0), "❚❚", 30, txt_col, HORIZONTAL_ALIGNMENT_CENTER)
	_txt(Vector2(c.x, c.y + 22.0), "PAUSE", 14, txt_col, HORIZONTAL_ALIGNMENT_CENTER)
	_txt(Vector2(c.x, c.y + 44.0), NVLang.t("SELECT · reprendre"), 11, sub_col, HORIZONTAL_ALIGNMENT_CENTER)

func _draw_hud_std() -> void:
	var TH: Dictionary = game.TH
	var ink: Color = TH.p_lite
	var dim := Color(0, 0, 0, 0.35)
	draw_rect(Rect2(0, 0, Data.L_W, 34), dim)
	_txt(Vector2(10, 22), "SCORE %s" % fmt(game.score), 14, ink)
	_txt(Vector2(Data.L_W - 10, 15), "RECORD %s" % fmt(maxi(int(Save.S.best), game.score)), 11,
		Color(ink.r, ink.g, ink.b, 0.7), HORIZONTAL_ALIGNMENT_RIGHT)
	_txt(Vector2(Data.L_W - 10, 29), "CR %s" % fmt(game.credits_run), 11, TH.gold, HORIZONTAL_ALIGNMENT_RIGHT)
	var con: Dictionary = Data.console_of_level(game.level)
	_txt(Vector2(10, 48), "SECTEUR %d/24 · %s" % [game.level, str(con.name)], 10, Color(ink.r, ink.g, ink.b, 0.85))
	_txt(Vector2(Data.L_W - 10, 48), "M%d/8 · %s" % [int(con.world), str(con.tag)], 10, Color(ink.r, ink.g, ink.b, 0.6), HORIZONTAL_ALIGNMENT_RIGHT)
	if not game.boss.is_empty() and not game.boss.enter:
		var b: Dictionary = game.boss
		var f: float = clampf(float(b.hp) / float(b.max_hp), 0, 1)
		draw_rect(Rect2(40, 56, Data.L_W - 80, 10), Color(0, 0, 0, 0.55))
		draw_rect(Rect2(40, 56, (Data.L_W - 80) * f, 10), TH.e_boss if f > 0.33 else TH.danger)
		draw_rect(Rect2(40, 56, Data.L_W - 80, 10), Color(1, 1, 1, 0.4), false, 1.0)
		_txt(Vector2(Data.L_W / 2.0, 80), b.name, 12, TH.e_boss_lite if game.era_idx > 0 else TH.livery[3], HORIZONTAL_ALIGNMENT_CENTER)
	var P: Dictionary = game.first_player()
	if not P.is_empty():
		var iy := 94.0
		for i in maxi(int(P.lives) + 1, 0):
			var vx := 14.0 + i * 18.0
			draw_colored_polygon(PackedVector2Array([Vector2(vx, iy - 4), Vector2(vx - 6, iy + 8), Vector2(vx + 6, iy + 8)]), ink)
		var hx := 14.0 + (int(P.lives) + 1) * 18.0 + 12.0
		for i in int(P.max_hp):
			var c: Color = TH.hull if i < int(P.hp) else Color(1, 1, 1, 0.15)
			draw_rect(Rect2(hx + i * 12, iy - 2, 9, 9), c)
		var sx: float = hx + P.max_hp * 12 + 10
		for i in int(P.sh_max):
			var c2: Color = TH.shield if i < int(P.shield) else Color(1, 1, 1, 0.15)
			draw_rect(Rect2(sx + i * 12, iy - 2, 9, 9), c2)
		_txt(Vector2(Data.L_W - 10, iy + 8), "BOMBES ×%d" % int(P.bombs), 11,
			(game.TH.livery[3] if game.era_idx == 0 else Color("#ff7ad9")), HORIZONTAL_ALIGNMENT_RIGHT)
		_txt(Vector2(10, iy + 26), "PWR %d/5 · %s" % [int(P.power), game.stats.weapon.name], 10, ink)
	if Save.S.opts.get("fps", false):
		_txt(Vector2(10, 62), "FPS %d" % Engine.get_frames_per_second(), 10, TH.gold)
	if game.combo > 1:
		_txt(Vector2(Data.L_W - 10, 120), "CHAÎNE ×%.2f" % game.score_mult(), 12, TH.gold, HORIZONTAL_ALIGNMENT_RIGHT)
		var bw := 90.0
		draw_rect(Rect2(Data.L_W - 10 - bw, 124, bw * clampf(game.combo_t / Data.COMBO_WINDOW, 0, 1), 3), TH.gold)

## HUD dot-matrix LCD du sous-écran FanBoy (secteurs 1, 2 et 3)
func _draw_fanboy_screen_lcd(glass: Rect2, shell_has_gauges: bool) -> void:
	var TH: Dictionary = game.TH
	var ink: Color = TH.livery[0]
	var mid: Color = TH.livery[1]
	var top: float = glass.position.y + 8.0
	var sx: float = glass.position.x + 12.0
	var rx: float = glass.end.x - 12.0
	var W: float = glass.size.x

	# Modelé subtil de la dalle LCD (ombre douce + reflet diagonal)
	var sh := Color(0.098, 0.133, 0.071)
	var y_a: float = glass.position.y + glass.size.y * 0.10
	var y_b: float = glass.position.y + glass.size.y * 0.78
	_quad(glass.position, Vector2(glass.end.x, y_a), Color(sh.r, sh.g, sh.b, 0.11), Color(sh.r, sh.g, sh.b, 0.0))
	_quad(Vector2(glass.position.x, y_a), Vector2(glass.end.x, y_b), Color(sh.r, sh.g, sh.b, 0.0), Color(sh.r, sh.g, sh.b, 0.02))
	_quad(Vector2(glass.position.x, y_b), glass.end, Color(sh.r, sh.g, sh.b, 0.02), Color(sh.r, sh.g, sh.b, 0.09))
	var rf := Color(0.957, 0.969, 0.875)
	_quad(glass.position, glass.end, Color(rf.r, rf.g, rf.b, 0.06), Color(rf.r, rf.g, rf.b, 0.13), true)

	# Rangée 1 : SC · SECTEUR 01..03 · COINS
	_txtp(Vector2(sx, top + 15.0), "SC %s" % fmt_space(game.score), 9, ink)
	_txtp(Vector2(glass.position.x + W * 0.5, top + 15.0), "SEC %02d" % game.level, 9, ink, HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(rx, top + 15.0), "CR %s" % fmt_space(game.credits_run), 9, ink, HORIZONTAL_ALIGNMENT_RIGHT)

	var P: Dictionary = game.first_player()
	var line_y := top + 25.0
	if not shell_has_gauges and not P.is_empty():
		var frac: float = clampf(float(P.hp) / maxf(1.0, float(P.max_hp)), 0.0, 1.0)
		_txtp(Vector2(sx, top + 35.0), "COQUE", 8, ink)
		var bx := sx + 56.0
		var bw2 := rx - 44.0 - bx
		draw_rect(Rect2(bx, top + 27.0, bw2, 10.0), Color(mid.r, mid.g, mid.b, 0.25))
		draw_rect(Rect2(bx, top + 27.0, bw2 * frac, 10.0), mid)
		draw_rect(Rect2(bx, top + 27.0, bw2, 10.0), ink, false, 1.0)
		_txtp(Vector2(rx, top + 35.0), "×%d" % (int(P.get("lives", 0)) + 1), 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)
		line_y = top + 43.0

	draw_rect(Rect2(sx - 2.0, line_y, W - 20.0, 2.5), Color(ink.r, ink.g, ink.b, 0.8))

	# Nom du boss en encre LCD dans le haut du sous-écran (la jauge 30 crans vit sur la coque FanBoy)
	if not game.boss.is_empty() and not game.boss.enter:
		var b: Dictionary = game.boss
		if not shell_has_gauges:
			var f: float = clampf(float(b.hp) / maxf(1.0, float(b.max_hp)), 0.0, 1.0)
			var bw3 := W - 60.0
			draw_rect(Rect2(glass.position.x + 30.0, line_y + 10.0, bw3, 7.0), Color(mid.r, mid.g, mid.b, 0.30))
			draw_rect(Rect2(glass.position.x + 30.0, line_y + 10.0, bw3 * f, 7.0), ink)
			draw_rect(Rect2(glass.position.x + 30.0, line_y + 10.0, bw3, 7.0), ink, false, 1.0)
			_txtp(Vector2(glass.position.x + W * 0.5, line_y + 30.0), str(b.name), 8, ink, HORIZONTAL_ALIGNMENT_CENTER)
		else:
			_txtp(Vector2(glass.position.x + W * 0.5, line_y + 16.0), "⬥ %s ⬥" % str(b.name), 8, ink, HORIZONTAL_ALIGNMENT_CENTER)

	if not shell_has_gauges and not P.is_empty():
		_txtp(Vector2(sx, glass.end.y - 10.0), "PWR %d/5 · %s" % [int(P.power), String(game.stats.weapon.name).to_upper()], 8, ink)
		_txtp(Vector2(rx, glass.end.y - 10.0), "BOMBES ×%d" % int(P.bombs), 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)

	if Save.S.opts.get("fps", false):
		_txtp(Vector2(sx, line_y + 16.0), "%d FPS" % Engine.get_frames_per_second(), 7, ink)

	if game.combo > 1:
		_txt(Vector2(glass.position.x + W * 0.5, glass.end.y - 14.0), "CHAÎNE ×%.2f" % game.score_mult(), 11, ink, HORIZONTAL_ALIGNMENT_CENTER)

func _quad(a: Vector2, b: Vector2, c_top: Color, c_bot: Color, diag := false) -> void:
	var pts := PackedVector2Array([a, Vector2(b.x, a.y), b, Vector2(a.x, b.y)])
	var cols: Array[Color]
	if diag:
		cols = [c_bot, c_bot.lerp(c_top, 0.6), c_top, Color(c_top.r, c_top.g, c_top.b, 0.0)]
	else:
		cols = [c_top, c_top, c_bot, c_bot]
	draw_polygon(pts, cols)

func fmt_space(n: int) -> String:
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
		if c % 3 == 0 and i > 0:
			out = " " + out
	return out

## Barre tactile des secteurs 4–24 (#touchui)
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
