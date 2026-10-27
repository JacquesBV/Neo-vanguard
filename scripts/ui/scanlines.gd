extends Node2D
## RENDU ÉCRAN — scanlines CRT pour les secteurs 4–24, et trame LCD monochrome
## FanBoy (secteurs 1–3) directement dans le GameViewport de la FanBoy (ou en
## plein écran si le cadre PC est désactivé).

var game: Node = null
var main_node: Node = null
var in_fanboy_viewport := false
var frame_t := 0.0

func refresh() -> void:
	queue_redraw()

func _is_fanboy_console_active() -> bool:
	return game != null and Data.is_fanboy_level(int(game.level)) and bool(Save.S.opts.get("frame", true))

func _process(delta: float) -> void:
	if game and game.era_idx == 0:
		frame_t += delta
		queue_redraw()

func _draw() -> void:
	if not Save.S.opts.get("scanlines", true):
		return
	if game == null or game.state != "play":
		return
	if in_fanboy_viewport:
		if _is_fanboy_console_active():
			_draw_lcd_effect(Rect2(0.0, 0.0, Data.FW, Data.FH))
		return
	if _is_fanboy_console_active():
		return
	if game.era_idx == 0:
		_draw_lcd_effect(Rect2(0.0, 0.0, Data.L_W, Data.L_H))
		return
	var yy := 2.0
	while yy < 860.0:
		draw_line(Vector2(0, yy), Vector2(480, yy), Color(0, 0, 0, 0.13), 1.0)
		yy += 3.0

func _draw_lcd_effect(glass: Rect2) -> void:
	var ink := Color(Data.INKS[0])
	# 1) Grille fine de la matrice LCD (48 × 68 cellules portrait)
	var cols := 48
	var rows := 68
	var cw: float = glass.size.x / float(cols)
	var ch: float = glass.size.y / float(rows)
	var gx := 0.0
	while gx < glass.size.x:
		draw_line(Vector2(glass.position.x + gx, glass.position.y),
			Vector2(glass.position.x + gx, glass.position.y + glass.size.y),
			Color(ink.r, ink.g, ink.b, 0.05), 1.0)
		gx += cw
	var gy := 0.0
	while gy < glass.size.y:
		draw_line(Vector2(glass.position.x, glass.position.y + gy),
			Vector2(glass.position.x + glass.size.x, glass.position.y + gy),
			Color(ink.r, ink.g, ink.b, 0.042), 1.0)
		gy += ch
	# 2) Ombre intérieure douce vers les bords de la dalle
	for i in 5:
		var a: float = 0.032 - i * 0.005
		draw_rect(Rect2(glass.position.x + i * 2.0, glass.position.y + i * 2.0,
			glass.size.x - i * 4.0, 2.0), Color(ink.r, ink.g, ink.b, a))
		draw_rect(Rect2(glass.position.x + i * 2.0, glass.position.y + glass.size.y - (i + 1) * 2.0,
			glass.size.x - i * 4.0, 2.0), Color(ink.r, ink.g, ink.b, a))
		draw_rect(Rect2(glass.position.x + i * 2.0, glass.position.y + i * 2.0,
			2.0, glass.size.y - i * 4.0), Color(ink.r, ink.g, ink.b, a))
		draw_rect(Rect2(glass.position.x + glass.size.x - (i + 1) * 2.0, glass.position.y + i * 2.0,
			2.0, glass.size.y - i * 4.0), Color(ink.r, ink.g, ink.b, a))
	# 3) Léger scintillement de rétroéclairage (60 Hz)
	var flicker: float = 0.016 + 0.007 * sin(frame_t * 113.0)
	draw_rect(glass, Color(1.0, 1.0, 0.96, flicker * 0.32))
