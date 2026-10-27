extends Node2D
## =========================================================================
## HUD OVERLAY — le tableau de bord est dessiné PLEINE RÉSOLUTION au-dessus
## du champ de jeu basse résolution, exactement comme le HUD HTML du jeu
## d'origine (le canvas rétro reste chunky, le HUD reste lisible).
## =========================================================================

var game: NVGame
var main: Node = null   # (C10) pour savoir si un écran (menu pause) est ouvert
const PixelUi := preload("res://scripts/ui/pixel_ui.gd")

func _process(delta: float) -> void:
	if game != null and game.state == "play":
		_ease_press(delta)
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

# (C14) géométrie mesurée sur la nouvelle coque de référence (480×860)
const STICK_C := Vector2(147, 682)
const STICK_R := 62.0            # zone doigt du stick photo
const DPAD_C := Vector2(-200, -200)   # (C14) plus de croix sur la v2 (compat)
const DPAD_R := 1.0
const FIRE_C := Vector2(304, 704)     # bouton A rouge (photo)
const FIRE_R := 31.0
const BOMB_C := Vector2(378, 662)     # bouton B ambré (photo)
const BOMB_R := 30.0
const SELECT_R := Rect2(242, 630, 48, 15)
const START_R := Rect2(242, 662, 48, 15)
const STRIP := Rect2(37, 753, 406, 67)   # panneau DATA FIELD imprimé (photo)

## (C14) profondeur d'enfoncement lissée par contrôle (0 relâché, 1 enfoncé)
var _press_k := { "stick": 0.0, "fire": 0.0, "bomb": 0.0, "select": 0.0, "start": 0.0, "power": 0.0 }

func _ease_press(delta: float) -> void:
	if game == null or main == null:
		return
	var ms := Time.get_ticks_msec()
	var flash: Dictionary = main.shell_press
	var targets := {
		"stick": 1.0 if int(main.get("shell_stick_id")) != -1 else (1.0 if flash.has("stick") and ms - int(flash["stick"]) < 150 else 0.0),
		"fire": 1.0 if bool(game.touch_fire_btn) else (1.0 if flash.has("fire") and ms - int(flash["fire"]) < 180 else 0.0),
		"bomb": 1.0 if flash.has("bomb") and ms - int(flash["bomb"]) < 220 else 0.0,
		"select": 1.0 if flash.has("select") and ms - int(flash["select"]) < 200 else 0.0,
		"start": 1.0 if flash.has("start") and ms - int(flash["start"]) < 200 else 0.0,
		"power": 1.0 if int(main.get("power_drag_id")) != -1 else 0.0,
	}
	var k: float = clampf(delta * 18.0, 0.0, 1.0)
	for id in targets:
		_press_k[id] = lerpf(float(_press_k[id]), float(targets[id]), k)

## (C14) couleur LED adaptative : progression du secteur (vert→rouge,
## Data.progress_color) + danger immédiat (coque joueur < 35 % ou boss
## en phase finale = rouge pulsant, quel que soit le niveau).
func _led_color(ms: int) -> Color:
	var col: Color = Data.progress_color(game.sector_progress())
	var P: Dictionary = game.first_player()
	var danger := 0.0
	if not P.is_empty() and int(P.max_hp) > 0:
		danger = clampf(1.0 - float(P.hp) / float(P.max_hp) / 0.35, 0.0, 1.0)
	if not game.boss.is_empty() and float(game.boss.get("max_hp", 0)) > 0.0:
		danger = maxf(danger, clampf(1.0 - float(game.boss.hp) / float(game.boss.max_hp) / 0.25, 0.0, 1.0))
	if danger > 0.0:
		var pulse: float = 0.75 + 0.25 * sin(ms / lerpf(220.0, 90.0, danger))
		col = col.lerp(Color(1, 0.12, 0.12), danger * pulse)
	return col

func _draw_era0() -> void:
	var ms := Time.get_ticks_msec()
	var ps: String = "on"
	if main != null:
		ps = str(main.get("power_state"))
	var led: Dictionary = _led_levels(ps)
	_draw_neon_frame(ms, ps, led.frame)
	_draw_hud_strip(led.strip)
	if ps == "on":
		_draw_glass_lcd()
	_draw_controls(ms, led)
	if ps == "off":
		_draw_screen_off()
		_draw_power_slider(ms, led.knob)
	elif ps == "boot":
		_draw_boot(ms)
	elif ps == "shutdown":
		_draw_shutdown(ms)
		_draw_power_slider(ms, led.knob)
	else:
		_draw_power_slider(ms, led.knob)

## (C12) montée PROGRESSIVE des LED, comme une vraie console portable :
## éteinte → tout est éteint (plastique nu) ; curseur sur ON → le néon du
## cadre s'attaque d'abord, puis le bandeau HUD, puis l'anneau du stick et
## les boutons, le bouton I/O s'illumine en fin de boot. Extinction : tout
## retombe ensemble, très vite (décharge).
func _led_levels(ps: String) -> Dictionary:
	var t: float = 0.0
	if main != null:
		t = float(main.get("boot_t"))
	var r := { "frame": 0.0, "strip": 0.0, "ring": 0.0, "btn": 0.0, "knob": 0.0 }
	match ps:
		"boot":
			r.frame = _sstep(clampf((t - 0.05) / 0.50, 0.0, 1.0))
			r.strip = _sstep(clampf((t - 0.25) / 0.55, 0.0, 1.0))
			r.ring = _sstep(clampf((t - 0.45) / 0.60, 0.0, 1.0))
			r.btn = _sstep(clampf((t - 0.45) / 0.60, 0.0, 1.0))
			r.knob = _sstep(clampf((t - 0.85) / 0.30, 0.0, 1.0))
		"on":
			r = { "frame": 1.0, "strip": 1.0, "ring": 1.0, "btn": 1.0, "knob": 1.0 }
		"shutdown":
			var k: float = 1.0 - _sstep(clampf(t / 0.55, 0.0, 1.0))
			r = { "frame": k, "strip": k, "ring": k, "btn": k, "knob": k }
	return r

## interpolateur lisse 0..1 (hermite)
func _sstep(x: float) -> float:
	return x * x * (3.0 - 2.0 * x)

func _mix_led(unlit: Color, lit: Color, k: float) -> Color:
	return Color(lerpf(unlit.r, lit.r, k), lerpf(unlit.g, lit.g, k),
		lerpf(unlit.b, lit.b, k), lerpf(unlit.a, lit.a, k))

## le néon EST le cadre de l'écran : couleur = progression du secteur
func _draw_neon_frame(ms: int, ps: String, led: float) -> void:
	if led <= 0.01:
		return   # (C12) console éteinte : AUCUNE LED allumée
	var col: Color
	match ps:
		"boot":
			col = Color(0.3, 0.9, 1.0)
		_:
			col = _led_color(ms)
	var pulse: float = 1.0
	if ps == "on" and game.sector_progress() > 0.75:
		pulse = 0.72 + 0.28 * sin(ms / 110.0)
	var g: Rect2 = Data.GLASS
	draw_rect(Rect2(g.position.x - 12, g.position.y - 12, g.size.x + 24, g.size.y + 24),
		Color(col.r, col.g, col.b, 0.16 * pulse * led), false, 26.0)   # bloom
	draw_rect(Rect2(g.position.x - 5, g.position.y - 5, g.size.x + 10, g.size.y + 10),
		Color(col.r, col.g, col.b, (0.55 + 0.45 * pulse) * led), false, 7.0)
	draw_rect(Rect2(g.position.x - 2, g.position.y - 2, g.size.x + 4, g.size.y + 4),
		Color(minf(1.0, col.r + 0.25), minf(1.0, col.g + 0.25), minf(1.0, col.b + 0.25), 0.95 * led), false, 2.0)
	if ps == "on":
		var p: int = int(round(game.sector_progress() * 100.0))
		_txtp(Vector2(Data.GLASS.end.x - 2, Data.GLASS.position.y - 8), "%d %%" % p, 8,
			Color(col.r, col.g, col.b, 0.9), HORIZONTAL_ALIGNMENT_RIGHT)

## écran éteint : verre noir + reflet + matrice LCD fantôme + consigne
func _draw_screen_off() -> void:
	var g: Rect2 = Data.GLASS
	# (C13) la console éteinte n'a AUCUNE led : le néon IMPRIMÉ sur la photo
	# est masqué par une bande de plastique éteint autour de la vitre
	var band := 16.0
	draw_rect(Rect2(g.position.x - band, g.position.y - band,
		g.size.x + 2.0 * band, g.size.y + 2.0 * band), Color(0.048, 0.052, 0.062))
	draw_rect(Rect2(g.position.x - band, g.position.y - band,
		g.size.x + 2.0 * band, 3.0), Color(0.10, 0.11, 0.13))
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

## (C14) curseur POWER vertical (haut de coque, photo) : ON en haut,
## OFF en bas — le pouce glisse, le bouton suit le doigt puis aimante.
func _draw_power_slider(ms: int, led_knob: float) -> void:
	var track := Rect2(44, 88, 20, 42)
	var ps: String = "on"
	if main != null:
		ps = str(main.get("power_state"))
	var knob: float = 1.0 if (ps == "on" or ps == "boot") else 0.0
	if main != null and int(main.get("power_drag_id")) != -1:
		knob = float(main.get("power_knob"))
	var on: bool = ps == "on" or ps == "boot"
	var kc: Color = _mix_led(Color(0.17, 0.18, 0.21),
		Color(0.3, 0.9, 1.0) if on else Color(0.85, 0.3, 0.32), led_knob)
	var kx: float = track.get_center().x
	var ky: float = lerpf(track.end.y - 10.0, track.position.y + 10.0, knob)
	var pk: float = float(_press_k.get("power", 0.0))
	draw_circle(Vector2(kx, ky), 11.0 - 1.5 * pk, Color(kc.r, kc.g, kc.b, 0.22 * led_knob))
	draw_circle(Vector2(kx, ky + 1.0), 8.5 - 1.0 * pk, kc.darkened(0.3))
	draw_circle(Vector2(kx, ky), 7.5 - 1.0 * pk, kc)
	draw_circle(Vector2(kx - 2, ky - 2), 2.2, Color(1, 1, 1, 0.45 * led_knob + 0.08))
	if ps == "on":
		_txtp(Vector2(54, 142), NVLang.t("GLISSER POUR ÉTEINDRE").replace("⏻ ", ""), 5,
			Color(0.5, 0.58, 0.66, 0.45 + 0.15 * sin(ms / 400.0)), HORIZONTAL_ALIGNMENT_CENTER)

## symbole puissance universel dessiné (sûr avec toutes les polices)
func _power_glyph(c: Vector2, col: Color, w := 1.5, r := 4.5) -> void:
	draw_arc(c, r, -PI * 0.28, PI * 1.28, 12, col, w)
	draw_line(Vector2(c.x, c.y - r - 1.5), Vector2(c.x, c.y + 0.5), col, w)

## (C14) panneau DATA FIELD imprimé en bas de coque : COQUE (segments),
## VIES, BOMBES, nom + vie du BOSS, COMBO — remplis par-dessus la photo.
func _draw_hud_strip(led: float) -> void:
	var ms := Time.get_ticks_msec()
	var col: Color = _led_color(ms)
	var ink := _mix_led(Color(0.30, 0.31, 0.27, 0.16), col, led)
	var dim := Color(0.05, 0.09, 0.13, 0.85)
	var P: Dictionary = game.first_player()
	if P.is_empty():
		return
	# COQUE : barre segmentée imprimée (x 112→177, rangée 1)
	var frac: float = clampf(float(P.hp) / float(P.max_hp), 0, 1)
	var seg_n := 8
	for i in seg_n:
		var r := Rect2(113 + i * 8.2, 773, 6.5, 9)
		draw_rect(r, ink if i < int(round(frac * seg_n)) else dim)
	# VIES (boîte imprimée x 213→238) et BOMBES (x 289→315) : compteurs LED
	_txtp(Vector2(226, 782), "%d" % maxi(int(P.lives) + 1, 0), 10, ink, HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(302, 782), "%d" % int(P.bombs), 10, ink, HORIZONTAL_ALIGNMENT_CENTER)
	# BOSS : nom dans la boîte rangée 1 (x 353→428), vie rangée 2 (x 112→341)
	var bname := "— — —"
	var bfrac := 0.0
	if not game.boss.is_empty() and not game.boss.enter:
		bname = String(game.boss.name).to_upper()
		bfrac = clampf(float(game.boss.hp) / float(game.boss.max_hp), 0, 1)
	if bname.length() > 13:
		bname = bname.substr(0, 12) + "·"
	_txtp(Vector2(390, 782), bname, 7, ink, HORIZONTAL_ALIGNMENT_CENTER)
	for i in 28:
		var r2 := Rect2(113 + i * 8.2, 795, 6.5, 9)
		draw_rect(r2, Color(1, 0.25, 0.2, led) if i < int(round(bfrac * 28.0)) else dim)
	# COMBO : à droite de DATA FIELD (rangée 2)
	if game.combo > 1:
		var glow: float = 0.7 + 0.3 * sin(ms / 160.0)
		_txtp(Vector2(438, 804), "COMBO ×%d ·×%.2f" % [game.combo, game.score_mult()], 7,
			Color(1.0, 0.82, 0.42, glow * led), HORIZONTAL_ALIGNMENT_RIGHT)
	elif led > 0.02:
		_txtp(Vector2(438, 804), String(game.stats.weapon.name).to_upper(), 7,
			Color(1.0, 0.82, 0.42, 0.65 * led), HORIZONTAL_ALIGNMENT_RIGHT)

## (C14) contrôles ANIMÉS par-dessus la photo : le cap du stick s'incline
## (et reste incliné tant que maintenu), A/B et SELECT/START s'enfoncent
## à l'appui et remontent au relâché (profondeur lissée _press_k).
func _draw_controls(ms: int, led: Dictionary) -> void:
	var ps: String = "on"
	if main != null:
		ps = str(main.get("power_state"))
	var bk: float = float(led.btn)
	var col: Color = _led_color(ms)
	# ---- stick : anneau LED adaptatif + cap incliné ----------------------
	var axis: Vector2 = game.touch_axis if "touch_axis" in game else Vector2.ZERO
	var rk: float = float(led.ring)
	if rk > 0.01:
		draw_arc(STICK_C, 55, 0, TAU, 40, Color(col.r, col.g, col.b, 0.55 * rk), 3.0)
	var sk: float = float(_press_k.get("stick", 0.0))
	var cap: Vector2 = STICK_C + axis * 11.0 + Vector2(0, 2.0 * sk)
	draw_circle(cap + Vector2(0, 2), 49, Color(0, 0, 0, 0.22))
	draw_circle(cap, 48, Color(0.10, 0.14, 0.22, 0.92))
	draw_arc(cap, 48, 0, TAU, 40, Color(0.55, 0.65, 0.80, 0.8), 2.0)
	draw_circle(cap, 36, Color(0.06, 0.09, 0.15, 0.95))
	draw_arc(cap + Vector2(-axis.x * 6.0, -6), 26, PI, TAU, 24, Color(1, 1, 1, 0.13), 5.0)
	# ---- A (TIR, maintenu = enfoncé) / B (BOMBE) ---------------------------
	_face_button(FIRE_C, FIRE_R, "fire", bk,
		Color(0.30, 0.15, 0.14), Color(0.80, 0.10, 0.14), Color(0.93, 0.17, 0.21), "A")
	_face_button(BOMB_C, BOMB_R, "bomb", bk,
		Color(0.33, 0.24, 0.13), Color(0.86, 0.44, 0.06), Color(0.98, 0.56, 0.13), "B")
	# ---- SELECT / START : pills photo qui s'enfoncent ----------------------
	_pill(SELECT_R, "select")
	_pill(START_R, "start")

## bouton de face : dôme qui s'enfonce selon _press_k (appui ET relâché
## animés), spéculaire qui se resserre quand il est au fond de sa cuvette.
func _face_button(c: Vector2, r: float, id: String, bk: float,
		unlit: Color, base: Color, dome: Color, letter: String) -> void:
	var pk: float = float(_press_k.get(id, 0.0))
	var dy: float = 3.5 * pk
	draw_circle(c + Vector2(0, 4), r + 1, Color(0, 0, 0, 0.28))
	var cc: Vector2 = c + Vector2(0, dy)
	var shrink: float = 1.0 - 0.10 * pk
	draw_circle(cc, r * shrink, _mix_led(unlit, base.darkened(0.35), bk))
	draw_circle(cc + Vector2(0, -1.5), (r - 2) * shrink, _mix_led(unlit, base, bk))
	draw_circle(cc + Vector2(0, -3), (r - 4) * shrink, _mix_led(unlit.lightened(0.05), dome, bk))
	draw_circle(cc + Vector2(-r * 0.30, -r * 0.34), r * lerpf(0.27, 0.20, pk),
		Color(1, 1, 1, lerpf(0.34, 0.20, pk) * (0.25 + 0.75 * bk)))
	_txtp(cc + Vector2(0, 5), letter, 13, Color(1, 1, 1, 0.55 * bk), HORIZONTAL_ALIGNMENT_CENTER)

func _pill(r: Rect2, id: String) -> void:
	var pk: float = float(_press_k.get(id, 0.0))
	var rr := Rect2(r.position + Vector2(0, 2.5 * pk), r.size)
	var pb := StyleBoxFlat.new()
	pb.bg_color = Color(0.10, 0.16, 0.24).lerp(Color(0.20, 0.45, 0.60), pk)
	pb.set_corner_radius_all(r.size.y / 2.0)
	pb.border_color = Color(0.35, 0.75, 0.95, 0.35 + 0.45 * pk)
	pb.set_border_width_all(1)
	draw_style_box(pb, rr)

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
