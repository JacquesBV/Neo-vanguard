extends Node2D
## =========================================================================
## HUD OVERLAY — le tableau de bord est dessiné PLEINE RÉSOLUTION au-dessus
## du champ de jeu basse résolution, exactement comme le HUD HTML du jeu
## d'origine (le canvas rétro reste chunky, le HUD reste lisible).
## =========================================================================

var game: NVGame
var main: Node = null   # (C10) pour savoir si un écran (menu pause) est ouvert
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
		_draw_era0()
	else:
		_draw_hud_std()
		# barre tactile des ères 1+ (#touchui du web : AU-DESSUS du canvas)
		if bool(Save.S.opts.get("frame", true)):
			_draw_touch_bar(game)
		# (C10) cadre de progression : bord d'écran vert → jaune → orange → rouge
		_draw_progress_frame()
	# (C10/C11) voile PAUSE givré uniquement quand le jeu est gelé SANS menu
	# (gel SELECT) et console allumée — le menu pause a déjà ses informations
	if game.paused and (main == null or main.current_screen == null) \
			and (main == null or str(main.get("power_state")) == "on"):
		_draw_pause_veil()

## (C10) cadre lumineux de progression du secteur (ères 1+ ; en ère 0 c'est
## le cadre LED de la visière, dessiné par la coque). Fin lisière 3 px +
## halo : ne grignote aucune pixel de jeu.
func _draw_progress_frame() -> void:
	var p: float = game.sector_progress()
	var col: Color = Data.progress_color(p)
	var pulse: float = 1.0
	if p > 0.75:
		pulse = 0.72 + 0.28 * sin(Time.get_ticks_msec() / 110.0)
	draw_rect(Rect2(1, 1, Data.L_W - 2, Data.L_H - 2), Color(col.r, col.g, col.b, 0.14 * pulse), false, 7.0)
	draw_rect(Rect2(3, 3, Data.L_W - 6, Data.L_H - 6), Color(col.r, col.g, col.b, 0.5 + 0.5 * pulse), false, 2.5)

## (C10) quand SELECT gèle le jeu sans ouvrir le menu : voile + rappel.
func _draw_pause_veil() -> void:
	draw_rect(Rect2(0, 0, Data.L_W, Data.L_H), Color(0.01, 0.02, 0.05, 0.30))
	var c := Vector2(Data.L_W / 2.0, Data.L_H / 2.0)
	_txt(Vector2(c.x, c.y - 8), "❚❚", 30, Color(1, 1, 1, 0.85), HORIZONTAL_ALIGNMENT_CENTER)
	_txt(Vector2(c.x, c.y + 22), "PAUSE", 14, Color(1, 1, 1, 0.85), HORIZONTAL_ALIGNMENT_CENTER)
	_txt(Vector2(c.x, c.y + 44), NVLang.t("SELECT · reprendre"), 10, Color(1, 1, 1, 0.55), HORIZONTAL_ALIGNMENT_CENTER)

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
	# --- bandeau bas — (C10) COMPACTÉ SOUS L'ÉTÊTE : la bande 742-860 est
	# occupée par la barre de commandes tactile ; vies, coque, boucliers,
	# bombes, puissance et chaîne vivent désormais en haut (lisibles sur tous
	# les téléphones, même les 16:10)
	var P: Dictionary = game.first_player()
	if not P.is_empty():
		# vies (petits vaisseaux) + coque + boucliers, sur une seule ligne
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
		# bombes, à droite de la même ligne
		_txt(Vector2(Data.L_W - 10, iy + 8), "BOMBES ×%d" % int(P.bombs), 11,
			(game.TH.livery[3] if game.era_idx == 0 else Color("#ff7ad9")), HORIZONTAL_ALIGNMENT_RIGHT)
		# puissance + arme, ligne suivante
		_txt(Vector2(10, iy + 26), "PWR %d/5 · %s" % [int(P.power), game.stats.weapon.name], 10, ink)
	# compteur de performances (option FPS)
	if Save.S.opts.get("fps", false):
		_txt(Vector2(10, 62), "FPS %d" % Engine.get_frames_per_second(), 10, TH.gold)
	# --- combo — (C10) remonté : la bande basse appartient à la barre tactile
	if game.combo > 1:
		_txt(Vector2(Data.L_W - 10, 120), "CHAÎNE ×%.2f" % game.score_mult(), 12, TH.gold, HORIZONTAL_ALIGNMENT_RIGHT)
		var bw := 90.0
		draw_rect(Rect2(Data.L_W - 10 - bw, 124, bw * clampf(game.combo_t / Data.COMBO_WINDOW, 0, 1), 3), TH.gold)

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
	# rangée 2 : coque + jauge — (C10) DESCENDUE SUR LA COQUE quand le cadre
	# console est actif : le verre ne garde que le score, les vies, le boss.
	var frame_on: bool = bool(Save.S.opts.get("frame", true))
	var P: Dictionary = game.first_player()
	if not frame_on:
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
	# pied du verre : puissance, arme, bombes — (C10) sur la coque si le
	# cadre console est actif (le verre reste dégagé pour le jeu)
	if not frame_on and not P.is_empty():
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

## =========================================================================
##  (C11) ÈRE 0 — LA CONSOLE NÉON. Photo de coque (shell_layer, sous la vue)
##  + couche dynamique ici : allumage/extinction (curseur POWER), cadre néon
##  de progression, bandeau HUD LED hors écran, contrôles taille DualShock 4
##  (stick Ø134 · croix 169 · TIR Ø74 · BOMBE Ø64 · SELECT/START 85×35).
## =========================================================================

const STICK_C := Vector2(95, 660)
const STICK_R := 80.0            # zone doigt (cap dessiné Ø134, anneau Ø160)
const DPAD_C := Vector2(270, 658)
const DPAD_R := 88.0
const FIRE_C := Vector2(406, 600)
const FIRE_R := 42.0
const BOMB_C := Vector2(404, 716)
const BOMB_R := 40.0
const STRIP := Rect2(16, 473, 448, 28)   # bandeau HUD LED (sur la photo verte)

func _draw_era0() -> void:
	var ms := Time.get_ticks_msec()
	var ps: String = "on"
	if main != null:
		ps = str(main.get("power_state"))
	_draw_neon_frame(ms, ps)
	_draw_hud_strip()
	if ps == "on":
		_draw_glass_lcd()
	_draw_controls(ms)
	if ps == "off":
		_draw_screen_off()
		_draw_power_slider(ms)
	elif ps == "boot":
		_draw_boot(ms)
	elif ps == "shutdown":
		_draw_shutdown(ms)
		_draw_power_slider(ms)
	else:
		_draw_power_slider(ms)

## le néon EST le cadre de l'écran : couleur = progression du secteur
func _draw_neon_frame(ms: int, ps: String) -> void:
	var col: Color
	match ps:
		"off":
			col = Color(0.25, 0.30, 0.36)
		"boot":
			col = Color(0.3, 0.9, 1.0)
		_:
			col = Data.progress_color(game.sector_progress())
	var pulse: float = 1.0
	if ps == "on" and game.sector_progress() > 0.75:
		pulse = 0.72 + 0.28 * sin(ms / 110.0)
	var g: Rect2 = Data.GLASS
	draw_rect(Rect2(g.position.x - 12, g.position.y - 12, g.size.x + 24, g.size.y + 24),
		Color(col.r, col.g, col.b, 0.16 * pulse), false, 26.0)   # bloom
	draw_rect(Rect2(g.position.x - 5, g.position.y - 5, g.size.x + 10, g.size.y + 10),
		Color(col.r, col.g, col.b, 0.55 + 0.45 * pulse), false, 7.0)
	draw_rect(Rect2(g.position.x - 2, g.position.y - 2, g.size.x + 4, g.size.y + 4),
		Color(minf(1.0, col.r + 0.25), minf(1.0, col.g + 0.25), minf(1.0, col.b + 0.25), 0.95), false, 2.0)
	if ps == "on":
		var p: int = int(round(game.sector_progress() * 100.0))
		_txtp(Vector2(STRIP.end.x - 2, STRIP.position.y + 19), "%d %%" % p, 8,
			Color(col.r, col.g, col.b, 0.9), HORIZONTAL_ALIGNMENT_RIGHT)

## écran éteint : verre noir + reflet + matrice LCD fantôme + consigne
func _draw_screen_off() -> void:
	var g: Rect2 = Data.GLASS
	draw_rect(g, Color(0.012, 0.016, 0.022))
	draw_polygon(PackedVector2Array([g.position, Vector2(g.position.x + 190, g.position.y),
		g.position, Vector2(g.position.x, g.position.y + 140)]),
		PackedColorArray([Color(0.5, 0.7, 0.9, 0.05), Color(0.5, 0.7, 0.9, 0.02),
		Color(0.5, 0.7, 0.9, 0.0), Color(0.5, 0.7, 0.9, 0.0)]))
	var c := 0.014
	var y := g.position.y + 4.0
	while y < g.end.y:
		var x := g.position.x + 4.0
		while x < g.end.x:
			draw_rect(Rect2(x, y, 1, 1), Color(c, c + 0.002, c + 0.004))
			x += 3.0
		y += 3.0
	# glyphe vectoriel au-dessus du texte (le ⏻ peut manquer dans la fonte)
	_power_glyph(Vector2(g.get_center().x, g.get_center().y - 26), Color(0.55, 0.75, 0.85, 0.9), 2.0, 6.5)
	_txtp(Vector2(g.get_center().x, g.get_center().y - 6),
		NVLang.t("⏻ GLISSER POUR ALLUMER").substr(2), 9, Color(0.55, 0.75, 0.85, 0.85), HORIZONTAL_ALIGNMENT_CENTER)

## séquence d'allumage : lignes LCD qui montent, logo, flash
func _draw_boot(ms: int) -> void:
	var g: Rect2 = Data.GLASS
	var t: float = float(main.get("boot_t")) / 1.15
	draw_rect(g, Color(0.012, 0.016, 0.022))
	var ink: Color = Color(Data.INKS[3])
	var rows := 16
	var shown := int(ceil(clampf(t, 0, 1) * rows))
	for i in shown:
		var yy: float = g.position.y + 8 + i * (g.size.y - 16) / float(rows)
		draw_rect(Rect2(g.position.x + 8, yy, (g.size.x - 16) * clampf(t * 2.2, 0.25, 1.0), 3),
			Color(ink.r, ink.g, ink.b, 0.14 + 0.10 * (i % 2)))
	if t > 0.55:
		var a: float = clampf((t - 0.55) / 0.3, 0, 1)
		_txtp(Vector2(g.get_center().x, g.get_center().y), "FAN BOY", 22,
			Color(ink.r, ink.g, ink.b, a * 0.9), HORIZONTAL_ALIGNMENT_CENTER)
		_txtp(Vector2(g.get_center().x, g.get_center().y + 26), "NEO VANGUARD", 9,
			Color(ink.r, ink.g, ink.b, a * 0.6), HORIZONTAL_ALIGNMENT_CENTER)
	if t >= 1.0:
		draw_rect(g, Color(0.62, 0.98, 1.0, clampf(1.0 - (t - 1.0) * 8.0, 0, 1) * 0.8))

## extinction : lignes qui retombent puis noir
func _draw_shutdown(ms: int) -> void:
	var g: Rect2 = Data.GLASS
	var t: float = float(main.get("boot_t")) / 0.55
	draw_rect(g, Color(0.012, 0.016, 0.022))
	var ink: Color = Color(Data.INKS[3])
	var rows := 16
	var shown := maxi(0, int((1.0 - clampf(t, 0, 1)) * rows))
	for i in shown:
		var yy: float = g.position.y + 8 + i * (g.size.y - 16) / float(rows)
		draw_rect(Rect2(g.position.x + 8, yy, g.size.x - 16, 3), Color(ink.r, ink.g, ink.b, 0.16))
	_txtp(Vector2(g.get_center().x, g.get_center().y),
		NVLang.t("⏻ GLISSER POUR ALLUMER"), 9, Color(0.4, 0.55, 0.62, 0.7), HORIZONTAL_ALIGNMENT_CENTER)

## le curseur POWER (bas de coque) : I/O magnétique
func _draw_power_slider(ms: int) -> void:
	# (C11) la piste vit à GAUCHE du cul de console : le centre accueille le
	# sticker logo (photo, intouchable). Symbole ⏻ vectoriel (jamais en tofu).
	var track := Rect2(28, 792, 130, 32)
	var ps: String = "on"
	if main != null:
		ps = str(main.get("power_state"))
	var knob: float = 1.0 if (ps == "on" or ps == "boot") else 0.0
	if main != null and int(main.get("power_drag_id")) != -1:
		knob = float(main.get("power_knob"))
	var tb := StyleBoxFlat.new()
	tb.bg_color = Color(0.05, 0.07, 0.10)
	tb.set_corner_radius_all(17)
	tb.border_color = Color(0.30, 0.38, 0.46)
	tb.set_border_width_all(2)
	draw_style_box(tb, track)
	var cy: float = track.get_center().y
	_txtp(Vector2(track.position.x + 18, cy + 5), "I", 11, Color(0.45, 0.55, 0.65), HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(track.end.x - 18, cy + 5), "O", 11, Color(0.45, 0.55, 0.65), HORIZONTAL_ALIGNMENT_CENTER)
	var kx: float = lerp(track.position.x + 20, track.end.x - 20, knob)
	var on: bool = ps != "off" and ps != "shutdown"
	var kc: Color = Color(0.3, 0.9, 1.0) if on else Color(0.85, 0.3, 0.32)
	draw_circle(Vector2(kx, cy), 15, Color(kc.r, kc.g, kc.b, 0.20))
	draw_circle(Vector2(kx, cy), 12, kc.darkened(0.25))
	draw_circle(Vector2(kx, cy), 11, kc)
	draw_circle(Vector2(kx - 3, cy - 3), 3.4, Color(1, 1, 1, 0.5))
	# ⏻ vectoriel sur le bouton : cercle ouvert + trait vertical
	draw_arc(Vector2(kx, cy + 1.5), 5.0, -PI * 0.28, PI * 1.28, 14, Color(0.05, 0.08, 0.12), 1.7)
	draw_line(Vector2(kx, cy - 6.5), Vector2(kx, cy + 1.0), Color(0.05, 0.08, 0.12), 1.7)
	# rappel permanent : ALLUMER (éteint) / ÉTEINDRE (allumé)
	if ps == "on":
		_txtp(Vector2(112, 780), NVLang.t("⏻ GLISSER POUR ÉTEINDRE").substr(2), 6,
			Color(0.5, 0.58, 0.66, 0.55 + 0.2 * sin(ms / 400.0)), HORIZONTAL_ALIGNMENT_CENTER)
		_power_glyph(Vector2(24, 778), Color(0.5, 0.58, 0.66, 0.7))

## symbole puissance universel dessiné (sûr avec toutes les polices)
func _power_glyph(c: Vector2, col: Color, w := 1.5, r := 4.5) -> void:
	draw_arc(c, r, -PI * 0.28, PI * 1.28, 12, col, w)
	draw_line(Vector2(c.x, c.y - r - 1.5), Vector2(c.x, c.y + 0.5), col, w)

## bandeau HUD LED hors écran (la « LED HUD STRIP » de la coque)
func _draw_hud_strip() -> void:
	var ink: Color = Color(Data.INKS[3])
	var mid: Color = Color(Data.INKS[2])
	draw_rect(STRIP, Color(0.045, 0.06, 0.04))
	draw_rect(Rect2(STRIP.position.x, STRIP.position.y, STRIP.size.x, 2), Color(0.62, 0.64, 0.55, 0.12))
	var P: Dictionary = game.first_player()
	if P.is_empty():
		return
	var y: float = STRIP.position.y + 19
	# vies
	var n_lives: int = maxi(int(P.lives) + 1, 0)
	for i in n_lives:
		var vx: float = STRIP.position.x + 12 + i * 13
		draw_colored_polygon(PackedVector2Array([Vector2(vx, y - 9), Vector2(vx - 5, y), Vector2(vx + 5, y)]), ink)
	_txtp(Vector2(STRIP.position.x + 12 + n_lives * 13 + 6, y + 3), NVLang.t("VIES"), 8, Color(ink.r, ink.g, ink.b, 0.75))
	# coque (jauge segmentée)
	_txtp(Vector2(STRIP.position.x + 108, y + 3), NVLang.t("COQUE"), 8, Color(ink.r, ink.g, ink.b, 0.75))
	var frac: float = clampf(float(P.hp) / float(P.max_hp), 0, 1)
	var bx: float = STRIP.position.x + 152
	var bw: float = 100.0
	draw_rect(Rect2(bx, y - 6, bw, 11), Color(mid.r, mid.g, mid.b, 0.20))
	draw_rect(Rect2(bx, y - 6, bw * frac, 11), ink if frac > 0.35 else Color(Data.INKS[3]))
	draw_rect(Rect2(bx, y - 6, bw, 11), ink, false, 1.0)
	var seg := bx + 6.0
	while seg < bx + bw - 2.0:
		draw_line(Vector2(seg, y - 5), Vector2(seg, y + 4), Color(0.09, 0.11, 0.07, 0.8), 1.0)
		seg += 12.0
	# bombes
	_txtp(Vector2(STRIP.position.x + 272, y + 3), "%s ×%d" % [NVLang.t("BOMBES"), int(P.bombs)], 8, ink)
	# nom d'arme en LED (or), section droite
	var wname: String = String(game.stats.weapon.name).to_upper()
	if wname.length() > 12:
		wname = wname.substr(0, 11) + "·"
	var glow: float = 0.75 + 0.25 * sin(Time.get_ticks_msec() / 400.0)
	_txtp(Vector2(STRIP.end.x - 36, y + 3), wname, 9, Color(1.0, 0.82, 0.42, glow), HORIZONTAL_ALIGNMENT_RIGHT)

## contrôles dessinés — tailles DualShock 4 réelles
func _draw_controls(ms: int) -> void:
	var ps: String = "on"
	if main != null:
		ps = str(main.get("power_state"))
	var flash: Dictionary = main.shell_press if main != null else {}
	var ink: Color = Color(Data.INKS[3])
	# ---- stick (Ø134 cap, anneau Ø160) ------------------------------------
	var s: Vector2 = STICK_C
	var ring: Color = Data.progress_color(game.sector_progress()) if ps == "on" else Color(0.3, 0.35, 0.4)
	draw_circle(s, STICK_R, Color(ring.r, ring.g, ring.b, 0.08))
	draw_arc(s, 74, 0, TAU, 40, Color(ring.r, ring.g, ring.b, 0.5), 4.0)
	var pressed_s: bool = flash.has("stick") and ms - int(flash["stick"]) < 150
	var cap_y: float = s.y + (2.0 if pressed_s else 0.0)
	draw_circle(Vector2(s.x, cap_y), 67, Color(0.05, 0.06, 0.08))
	draw_circle(Vector2(s.x, cap_y), 61, Color(0.14, 0.16, 0.20))
	draw_arc(Vector2(s.x, cap_y), 61, 0, TAU, 40, Color(0.45, 0.52, 0.60), 2.0)
	draw_circle(Vector2(s.x, cap_y), 50, Color(0.08, 0.09, 0.12))
	draw_arc(Vector2(s.x, cap_y), 50, 0, TAU, 40, Color(0.16, 0.18, 0.22), 2.0)
	draw_arc(Vector2(s.x, cap_y - 3), 38, PI, TAU, 30, Color(1, 1, 1, 0.10), 6.0)
	# ---- croix directionnelle (169, bras 57) — ARME haut/bas ---------------
	var dp: Vector2 = DPAD_C
	var arm: float = 28.5
	var ln: float = 84.0
	var dp_base := StyleBoxFlat.new()
	dp_base.bg_color = Color(0.10, 0.11, 0.14)
	dp_base.set_corner_radius_all(10)
	dp_base.border_color = Color(0.85, 0.45, 0.10)
	dp_base.set_border_width_all(3)
	draw_style_box(dp_base, Rect2(dp.x - arm, dp.y - ln, arm * 2, ln * 2))
	var up: bool = flash.has("wup") and ms - int(flash["wup"]) < 150
	var dn: bool = flash.has("wdn") and ms - int(flash["wdn"]) < 150
	for half in 2:
		var yy: float = dp.y - ln + (0 if half == 0 else ln)
		var hh2: float = ln
		var lit: bool = (half == 0 and up) or (half == 1 and dn)
		if lit:
			draw_rect(Rect2(dp.x - arm + 3, yy + 3, arm * 2 - 6, hh2 - 6), Color(1.0, 0.62, 0.2, 0.30))
		var cy2: float = yy + hh2 / 2.0
		var tri: Array[Vector2] = []
		if half == 0:
			tri = [Vector2(dp.x, cy2 - 8), Vector2(dp.x - 9, cy2 + 6), Vector2(dp.x + 9, cy2 + 6)]
		else:
			tri = [Vector2(dp.x, cy2 + 8), Vector2(dp.x - 9, cy2 - 6), Vector2(dp.x + 9, cy2 - 6)]
		draw_colored_polygon(PackedVector2Array(tri), Color(0.9, 0.55, 0.16) if lit else Color(0.32, 0.34, 0.38))
	_txtp(Vector2(dp.x, dp.y - ln - 8), NVLang.t("ARME") + " ⇕", 8, Color(ink.r, ink.g, ink.b, 0.7), HORIZONTAL_ALIGNMENT_CENTER)
	# ---- TIR (Ø74, rouge) ---------------------------------------------------
	var f: Vector2 = FIRE_C
	var pf: bool = flash.has("fire") and ms - int(flash["fire"]) < 150
	draw_circle(f, FIRE_R + 8, Color(1.0, 0.18, 0.22, 0.10 + (0.15 if pf else 0.0)))
	var fy: float = f.y + (2 if pf else 0)
	var fr := StyleBoxFlat.new()
	fr.bg_color = Color(0.86, 0.12, 0.16) if not pf else Color(1.0, 0.25, 0.28)
	fr.set_corner_radius_all(int(FIRE_R))
	fr.border_color = Color(1.0, 0.45, 0.45, 0.5)
	fr.set_border_width_all(2)
	draw_style_box(fr, Rect2(f.x - FIRE_R, fy - FIRE_R, FIRE_R * 2, FIRE_R * 2))
	draw_arc(Vector2(f.x, fy - FIRE_R + 10), 26, PI * 1.1, PI * 1.9, 20, Color(1, 1, 1, 0.25), 5.0)
	_txtp(Vector2(f.x, f.y + FIRE_R + 14), NVLang.t("TIR"), 9, Color(0.95, 0.5, 0.5, 0.9), HORIZONTAL_ALIGNMENT_CENTER)
	# ---- BOMBE (Ø64, orange) ------------------------------------------------
	var b: Vector2 = BOMB_C
	var pb: bool = flash.has("bomb") and ms - int(flash["bomb"]) < 150
	var by: float = b.y + (2 if pb else 0)
	var bb := StyleBoxFlat.new()
	bb.bg_color = Color(0.94, 0.52, 0.10) if not pb else Color(1.0, 0.68, 0.25)
	bb.set_corner_radius_all(int(BOMB_R))
	bb.border_color = Color(1.0, 0.75, 0.4, 0.45)
	bb.set_border_width_all(2)
	draw_style_box(bb, Rect2(b.x - BOMB_R, by - BOMB_R, BOMB_R * 2, BOMB_R * 2))
	draw_arc(Vector2(b.x, by - BOMB_R + 9), 20, PI * 1.1, PI * 1.9, 20, Color(1, 1, 1, 0.3), 4.0)
	_txtp(Vector2(b.x, by + 6), "✹", 16, Color(0.25, 0.12, 0.02), HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(b.x, b.y + BOMB_R + 14), NVLang.t("BOMBE"), 8, Color(0.95, 0.7, 0.35, 0.9), HORIZONTAL_ALIGNMENT_CENTER)
	# ---- SELECT / START (85×35, cul de la console) --------------------------
	var sub_sel: PackedStringArray = NVLang.t("SELECT · PAUSE").split(" · ", false)
	var sub_sta: PackedStringArray = NVLang.t("START · MENU").split(" · ", false)
	_pill(Rect2(60, 828, 85, 32), "SELECT",
		sub_sel[sub_sel.size() - 1] if sub_sel.size() > 1 else "PAUSE", "select", flash, ms)
	_pill(Rect2(320, 828, 85, 32), "START",
		sub_sta[sub_sta.size() - 1] if sub_sta.size() > 1 else "MENU", "start", flash, ms)

func _pill(r: Rect2, label: String, sub: String, id: String, flash: Dictionary, ms: int) -> void:
	var pressed: bool = flash.has(id) and ms - int(flash[id]) < 170
	var y: float = r.position.y + (2.0 if pressed else 0.0)
	draw_rect(Rect2(r.position.x + 2, r.end.y - 1, r.size.x, 4), Color(0, 0, 0, 0.5))
	var pb := StyleBoxFlat.new()
	pb.bg_color = Color(0.32, 0.38, 0.45) if pressed else Color(0.55, 0.64, 0.72)
	pb.set_corner_radius_all(r.size.y / 2.0)
	pb.border_color = Color(0.30, 0.88, 1.0)
	pb.set_border_width_all(2)
	draw_style_box(pb, Rect2(r.position.x, y, r.size.x, r.size.y))
	draw_rect(Rect2(r.position.x + 9, y + 4, r.size.x - 18, 4), Color(1, 1, 1, 0.45 if not pressed else 0.15))
	_txtp(Vector2(r.get_center().x, y + r.size.y / 2.0 - 1), label, 8, Color(0.08, 0.11, 0.14), HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(r.get_center().x, y + r.size.y / 2.0 + 10), sub, 6, Color(0.10, 0.16, 0.20, 0.8), HORIZONTAL_ALIGNMENT_CENTER)

## l'intérieur du verre (console allumée) : score, vies, boss, chaîne —
## les jauges de survie (coque/bombes/arme) vivent sur le bandeau LED coque
func _draw_glass_lcd() -> void:
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
	# rangée 1 — dot-matrix, chiffres groupés comme l'original
	_txtp(Vector2(sx, top + 15), "SC %s" % fmt_space(game.score), 8, ink)
	_txtp(Vector2(glass.position.x + W / 2.0, top + 15), "VIES ×%d" % (int(game.first_player().get("lives", 0)) + 1), 8, ink, HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(rx, top + 15), "COINS %s" % fmt_space(game.credits_run), 8, ink, HORIZONTAL_ALIGNMENT_RIGHT)
	# l'épais trait qui ferme le HUD, comme sur la console
	draw_rect(Rect2(sx - 2.0, top + 25, W - 16.0, 3.0), Color(ink.r, ink.g, ink.b, 0.8))
	# barre de l'amiral, encre LCD
	if not game.boss.is_empty() and not game.boss.enter:
		var b: Dictionary = game.boss
		var f: float = clampf(float(b.hp) / float(b.max_hp), 0, 1)
		var bw3 := W - 60.0
		draw_rect(Rect2(glass.position.x + 30, top + 36, bw3, 7), Color(mid.r, mid.g, mid.b, 0.30))
		draw_rect(Rect2(glass.position.x + 30, top + 36, bw3 * f, 7), ink)
		draw_rect(Rect2(glass.position.x + 30, top + 36, bw3, 7), ink, false, 1.0)
		_txtp(Vector2(glass.position.x + W / 2.0, top + 58), b.name, 8, ink, HORIZONTAL_ALIGNMENT_CENTER)
	if game.combo > 1:
		_txt(Vector2(glass.position.x + W / 2.0, glass.end.y - 12.0), "CHAÎNE ×%.2f" % game.score_mult(), 11, mid, HORIZONTAL_ALIGNMENT_CENTER)
