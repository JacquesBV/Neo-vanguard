extends Control
## ÉCRAN D'ENTRÉE — réplique du splash « APPUYEZ POUR ENTRER » du jeu original
## (g.innerHTML ligne 17768 du moteur) : affiche media-033, logo hexagonal SVG
## redessiné (géométrie exacte), NEO VANGUARD, « SYSTÈME EN LIGNE », bouton
## d'entrée + crédit musical. Un geste (Entrée/clic/fire) ouvre le titre.

var main: Node = null
var on_done: Callable = Callable()
var t := 0.0
var art: TextureRect

const CYAN := Color("4cf4ff")
const VIOLET := Color("a98bff")
const PINK := Color("ff5ea8")
const GOLD := Color("ffd36c")

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color("03060f")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	art = TextureRect.new()
	art.texture = load("res://assets/ui-art/media-033.webp")
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.set_anchors_preset(Control.PRESET_FULL_RECT)
	art.offset_bottom = -330.0
	art.modulate = Color(0.82, 0.85, 0.95)
	add_child(art)
	# fondu bas de l'affiche vers le fond sombre
	var grad := GradientTexture2D.new()
	var g := Gradient.new()
	g.colors = PackedColorArray([Color(0.012, 0.023, 0.06, 0.0), Color("03060f")])
	g.offsets = PackedFloat32Array([0.0, 1.0])
	grad.gradient = g
	grad.fill_from = Vector2(0, 0)
	grad.fill_to = Vector2(0, 1)
	var gv := TextureRect.new()
	gv.texture = grad
	gv.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	gv.set_anchors_preset(Control.PRESET_FULL_RECT)
	gv.offset_top = 300.0
	gv.offset_bottom = -300.0
	gv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(gv)
	var ui := UIKit
	var v := ui.vbox(self, 2, 20.0)
	v.alignment = BoxContainer.ALIGNMENT_END
	ui.spacer(v, 430)
	var lneo := ui.label(v, "N E O", 26, Color("eef6ff"))
	lneo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var lvan := ui.label(v, "V A N G U A R D", 40, Color("eef6ff"))
	lvan.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lvan.add_theme_color_override("font_shadow_color", Color(CYAN.r, CYAN.g, CYAN.b, 0.5))
	lvan.add_theme_constant_override("shadow_offset_y", 0)
	lvan.add_theme_constant_override("shadow_outline_size", 12)
	ui.spacer(v, 4)
	var rule := ui.label(v, "—  " + NVLang.t("SYSTÈME EN LIGNE") + "  —", 12, ui.ACC)
	rule.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 14)
	var b := ui.button(v, "▶   " + NVLang.t("APPUYEZ POUR ENTRER") + "        " + NVLang.t("ENTRÉE"), func(): _go(), true)
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ui.spacer(v, 10)
	var mus := ui.label(v, "♫  " + NVLang.t("« CYBER MARCH » · IAMONEABE — TOUCHEZ POUR ÉCOUTER"), 11, ui.DIM)
	mus.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

func _go() -> void:
	if on_done.is_valid():
		on_done.call()

func _process(delta: float) -> void:
	t += delta
	queue_redraw()

func _draw() -> void:
	# logo hexagonal : géométrie exacte du SVG du splash original (boîte 160)
	var s := 0.72
	var cx := 240.0
	var cy := 400.0
	var pts := [Vector2(80, 8), Vector2(142, 44), Vector2(142, 116), Vector2(80, 152), Vector2(18, 116), Vector2(18, 44)]
	var hex: Array[Vector2] = []
	for p in pts:
		hex.append(Vector2(cx, cy) + (Vector2(p.x, p.y) - Vector2(80, 80)) * s)
	# fond hexagonal
	draw_colored_polygon(PackedVector2Array(hex), Color(0.024, 0.047, 0.11, 0.85))
	# trait dégradé cyan → violet → rose (par segment)
	for i in 6:
		var a: Vector2 = hex[i]
		var b: Vector2 = hex[(i + 1) % 6]
		draw_line(a, b, _edge_col(float(i) / 6.0), 3.0)
	# cercles pointillés tournants
	var r1 := 58.0 * s
	var n1 := 10
	for i in n1:
		var a0 := t * 0.7 + TAU * float(i) / float(n1)
		draw_arc(Vector2(cx, cy), r1, a0, a0 + TAU * 0.028 * 1.8, 4, Color(CYAN.r, CYAN.g, CYAN.b, 0.7), 2.0)
	var r2 := 47.0 * s
	var n2 := 14
	for i in n2:
		var a0 := -t * 1.1 + TAU * float(i) / float(n2)
		draw_arc(Vector2(cx, cy), r2, a0, a0 + TAU * 0.022, 3, Color(PINK.r, PINK.g, PINK.b, 0.8), 1.6)
	# vaisseau : flèche dégradée + ailes + flamme
	var ship := [Vector2(80, 34), Vector2(98, 92), Vector2(80, 84), Vector2(62, 92)]
	var shipv: Array[Vector2] = []
	for p in ship:
		shipv.append(Vector2(cx, cy) + (p - Vector2(80, 80)) * s)
	draw_colored_polygon(PackedVector2Array(shipv), VIOLET.lerp(PINK, 0.45))
	var inner := [Vector2(80, 46), Vector2(88, 80), Vector2(80, 76), Vector2(72, 80)]
	var innv: Array[Vector2] = []
	for p in inner:
		innv.append(Vector2(cx, cy) + (p - Vector2(80, 80)) * s)
	draw_colored_polygon(PackedVector2Array(innv), Color("061020"))
	var w_l := [Vector2(62, 92), Vector2(46, 104), Vector2(58, 86)]
	var w_r := [Vector2(98, 92), Vector2(114, 104), Vector2(102, 86)]
	for w in [w_l, w_r]:
		for i in 2:
			var a: Vector2 = Vector2(cx, cy) + (w[i] - Vector2(80, 80)) * s
			var b: Vector2 = Vector2(cx, cy) + (w[i + 1] - Vector2(80, 80)) * s
			draw_line(a, b, CYAN, 3.0)
	var flame := [Vector2(74, 94), Vector2(80, 118), Vector2(86, 94)]
	var fl: Array[Vector2] = []
	for p in flame:
		fl.append(Vector2(cx, cy) + (p - Vector2(80, 80)) * s)
	draw_colored_polygon(PackedVector2Array(fl), Color(GOLD.r, GOLD.g, GOLD.b, 0.9))

func _edge_col(u: float) -> Color:
	if u < 0.5:
		return CYAN.lerp(VIOLET, u * 2.0)
	return VIOLET.lerp(PINK, (u - 0.5) * 2.0)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("fire") or event.is_action_pressed("pause") \
			or event.is_action_pressed("ui_cancel") or event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		_go()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_go()
	elif event is InputEventScreenTouch and event.pressed:
		_go()
