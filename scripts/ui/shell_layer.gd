extends Node2D
## COQUE FANBOY KFM-01 — le boîtier de la console autour du verre 4:3,
## la page claire qui le porte et la barre de commandes tactile.
## Réplique du drawMachineFrame + nvFanboyMarks du moteur d'origine :
## coque gris chaud #cdc9c1→#b6b2a9, visière ardoise #545869, LED rouge
## pulsante, logo « FANBOY » italique bleu marine #272c74.

var main: Node = null
var PixelUi := preload("res://scripts/ui/pixel_ui.gd")

func _ready() -> void:
	z_index = -1

func _process(_d: float) -> void:
	if game() and game().state == "play":
		queue_redraw()   # toutes les ères : la barre tactile affiche compteurs/arme

func game() -> Node:
	return main.game if main else null

func _draw() -> void:
	var g: Node = game()
	if g == null or g.state != "play":
		return
	if g.era_idx != 0:
		return   # ères 1+ : la barre tactile est dessinée par hud_overlay
		         # (AU-DESSUS de la vue plein écran, comme #touchui du web)
	var glass: Rect2 = Data.GLASS
	# --- la page claire qui porte la console ---------------------------------
	draw_rect(Rect2(0, 0, 480, 860), Color("#efece4"))
	# --- ombre portée douce sous l'appareil ----------------------------------
	for i in 6:
		draw_rect(Rect2(26 + i * 3, 634 + i * 2, 428 - i * 6, 8), Color(0.15, 0.14, 0.12, 0.045))
	# --- la coque : olive foncé, modelé vertical -----------------------------
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#535a53")
	sb.set_corner_radius_all(18)
	sb.border_color = Color("#2c322b")
	sb.set_border_width_all(3)
	draw_style_box(sb, Rect2(16, 128, 448, 500))
	draw_rect(Rect2(20, 129, 440, 2), Color(1, 1, 1, 0.30))
	draw_rect(Rect2(12, 126, 456, 2), Color(1, 1, 1, 0.50))
	draw_rect(Rect2(12, 626, 456, 2), Color(1, 1, 1, 0.40))
	draw_rect(Rect2(22, 132, 436, 120), Color("#5d645c", 0.6))
	draw_rect(Rect2(20, 600, 440, 24), Color("#2e362a", 0.5))
	draw_rect(Rect2(18, 130, 444, 2), Color(1, 1, 1, 0.22))
	# --- bandeau sérigraphié : étiquette + LED -------------------------------
	_txtp(Vector2(glass.position.x - 8, 158), "KFM-01 / DOT DISPLAY", 8, Color("#cfd4c8"))
	var on: float = 0.72 + 0.28 * sin(Time.get_ticks_msec() / 650.0)
	var led: Vector2 = Vector2(452, 153)
	draw_circle(led, 10.0, Color(1.0, 0.11, 0.12, on * 0.16))          # halo
	draw_circle(led, 5.5, Color(0.89, 0.10, 0.11, on))                 # corps
	draw_circle(led + Vector2(-1.6, -1.6), 1.8, Color(1.0, 0.78, 0.75, on * 0.95))  # reflet
	# --- la visière noire autour du verre ------------------------------------
	var vis := Rect2(glass.position.x - 10, glass.position.y - 12, glass.size.x + 20, glass.size.y + 24)
	var vb := StyleBoxFlat.new()
	vb.bg_color = Color("#23262b")
	vb.set_corner_radius_all(10)
	vb.border_color = Color("#14161a")
	vb.set_border_width_all(2)
	draw_style_box(vb, vis)
	draw_rect(Rect2(vis.position.x - 2, vis.position.y - 2, vis.size.x + 4, vis.size.y + 4), Color(1, 1, 1, 0.35), false, 1.5)
	draw_rect(Rect2(vis.position.x + 1, vis.position.y + 1, vis.size.x - 2, 2), Color(1, 1, 1, 0.10))
	# --- voyant rouge sur le côté gauche de la vitre -------------------------
	var led_y: float = glass.position.y + glass.size.y * 0.28
	var led2: Vector2 = Vector2(glass.position.x - 5.0, led_y)
	draw_circle(led2, 6.0, Color(1.0, 0.11, 0.12, on * 0.16))
	draw_circle(led2, 3.6, Color(0.89, 0.10, 0.11, on))
	draw_circle(led2 + Vector2(-1.0, -1.0), 1.2, Color(1.0, 0.78, 0.75, on * 0.95))
	# --- le menton clair : logo FANBOY italique + haut-parleur ---------------
	var chin := Rect2(16, 528, 448, 100)
	var cb := StyleBoxFlat.new()
	cb.bg_color = Color("#bdc1b8")
	cb.corner_radius_bottom_left = 18
	cb.corner_radius_bottom_right = 18
	draw_style_box(cb, chin)
	draw_rect(Rect2(20, 530, 440, 2), Color(1, 1, 1, 0.5))
	# logo « FANBOY » : dot-matrix sombre, centré entre chevrons et ouïes
	_txtp(Vector2(240, 596), "FANBOY", 24, Color("#27302c"), HORIZONTAL_ALIGNMENT_CENTER)
	_txtp(Vector2(52, 594), "<>", 16, Color("#4a5450"))
	for i in 3:
		draw_rect(Rect2(400 + i * 14, 568, 5, 26), Color("#6a746e"))
	# --- la barre de commandes tactile ---------------------------------------
	var bar := Rect2(0, 742, 480, 118)
	draw_rect(bar, Color("#0d1526"))
	draw_rect(Rect2(0, 742, 480, 2), Color(1, 1, 1, 0.06))
	_btn(Rect2(14, 756, 74, 90), "BOMBE", _bomb_txt(g), Color.WHITE, "")
	_btn(Rect2(98, 756, 56, 90), "", "−", Color.WHITE, "PRÉC")
	_btn(Rect2(164, 756, 152, 90), "ARMEMENT", _weapon_txt(), Color("#ffd166"), "%d DISPONIBLES" % _weapon_count())
	_btn(Rect2(326, 756, 56, 90), "", "+", Color.WHITE, "SUIV")
	_btn(Rect2(392, 756, 74, 90), "", "II", Color.WHITE, "PAUSE")


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
	b.bg_color = Color("#050611")
	b.set_corner_radius_all(9)
	b.border_color = Color("#a2ab49")
	b.set_border_width_all(2)
	draw_style_box(b, r)
	var cx: float = r.position.x + r.size.x / 2.0
	if title != "":
		_txtp(Vector2(cx, r.position.y + 16), title, 8, Color("#9fb0cc"), HORIZONTAL_ALIGNMENT_CENTER)
		var vs := 16 if value.length() <= 4 else 12
		_txtp(Vector2(cx, r.position.y + (52 if sub != "" else 56)), value, vs, vcol, HORIZONTAL_ALIGNMENT_CENTER)
		if sub != "":
			_txtp(Vector2(cx, r.position.y + 76), sub, 8, Color("#e8edda") if vcol == Color("#ffd166") else Color("#8ea0c0"), HORIZONTAL_ALIGNMENT_CENTER)
	else:
		_txtp(Vector2(cx, r.position.y + (48 if sub != "" else 54)), value, 16, vcol, HORIZONTAL_ALIGNMENT_CENTER)
		if sub != "":
			_txtp(Vector2(cx, r.position.y + 76), sub, 8, Color("#9fb0cc"), HORIZONTAL_ALIGNMENT_CENTER)

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
