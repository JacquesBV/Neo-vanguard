extends Object
class_name UIKit
## KIT D'INTERFACE — le thème des menus et options du jeu d'origine
## (css/neo-vanguard.css, bloc html.nvui) : panneaux bleu nuit en dégradé,
## liserés rgba(164,205,255,.2), rayons 18/14/11, accent cyan #38e0ff,
## halo radial + voile violet sur le titre, encre #d9efff.

const ACC := Color("#38e0ff")
const INK := Color("#d9efff")
const DIM := Color(0.66, 0.78, 0.93, 0.75)
const GOLD := Color("#ffd36c")
const NAVY := Color("#040a14")
const PANEL_A := Color(0.039, 0.067, 0.129, 0.97)   # rgba(10,17,33,.97)
const PANEL_B := Color(0.020, 0.035, 0.078, 0.96)   # rgba(5,9,20,.96)
const LINE := Color(0.643, 0.804, 1.0, 0.20)        # rgba(164,205,255,.2)
const LINE_SOFT := Color(0.710, 0.827, 1.0, 0.10)   # rgba(181,211,255,.1)

static var _glow: GradientTexture2D = null

static func fmt(n: int) -> String:
	var s := str(n)
	var out := ""
	var c := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		c += 1
		if c % 3 == 0 and i > 0: out = " " + out
	return out

## halo radial cyan du titre (radial-gradient 72% 48% du CSS)
static func glow_tex() -> GradientTexture2D:
	if _glow == null:
		var g := Gradient.new()
		g.set_color(0, Color(0.196, 0.804, 1.0, 0.16))
		g.set_color(1, Color(0, 0, 0, 0.0))
		_glow = GradientTexture2D.new()
		_glow.gradient = g
		_glow.fill = GradientTexture2D.FILL_RADIAL
		_glow.fill_from = Vector2(0.72, 0.48)
		_glow.fill_to = Vector2(0.72, 1.15)
		_glow.width = 480
		_glow.height = 500
	return _glow

## fond du titre : marine profond + halo cyan + voile violet
static func title_backdrop(scr: Control) -> void:
	var rect := ColorRect.new()
	rect.color = NAVY
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	scr.add_child(rect)
	var t := TextureRect.new()
	t.texture = glow_tex()
	t.set_anchors_preset(Control.PRESET_FULL_RECT)
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = TextureRect.STRETCH_SCALE
	scr.add_child(t)
	var vio := ColorRect.new()
	vio.color = Color(0.412, 0.286, 1.0, 0.05)
	vio.set_anchors_preset(Control.PRESET_FULL_RECT)
	vio.offset_left = 240.0
	scr.add_child(vio)

## fond standard des écrans (panneau plein, comme .panel du CSS)
static func dark_bg(scr: Control, alpha := 0.96) -> void:
	var rect := ColorRect.new()
	rect.color = Color(PANEL_B.r, PANEL_B.g, PANEL_B.b, alpha)
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	scr.add_child(rect)

## la boîte « .panel » : dégradé 145°, liseré, rayon 18, ombre portée
static func panel_box() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = PANEL_A
	sb.border_color = LINE
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(14)
	sb.shadow_color = Color(0, 0, 0, 0.45)
	sb.shadow_size = 22
	sb.shadow_offset = Vector2(0, 10)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb

## un panneau prêt à l'emploi dans une vbox
static func panel(v: VBoxContainer, inner: Control) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_box())
	p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	p.add_child(inner)
	v.add_child(p)
	return p

## l'art du jeu (briefings, intros, carte, tickets) dans une vbox
static func art_rect(v: VBoxContainer, path: String, height := 250.0) -> bool:
	if not ResourceLoader.exists(path):
		return false
	var t: TextureRect = TextureRect.new()
	t.texture = load(path)
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	t.custom_minimum_size = Vector2(0, height)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_child(t)
	return true

static func vbox(scr: Control, spacing := 10, margin := 28.0) -> VBoxContainer:
	var sc := ScrollContainer.new()
	sc.position = Vector2.ZERO
	sc.size = Vector2(480, 860)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scr.add_child(sc)
	var mc := MarginContainer.new()
	mc.add_theme_constant_override("margin_left", 16)
	mc.add_theme_constant_override("margin_right", 16)
	mc.add_theme_constant_override("margin_top", 24)
	mc.add_theme_constant_override("margin_bottom", 16)
	mc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(mc)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", spacing)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	mc.add_child(v)
	for m in [margin, 10.0, margin, 10.0]:
		var sp := Control.new()
		sp.custom_minimum_size = Vector2(0, m)
		v.add_child(sp)
	return v

static func spacer(v: VBoxContainer, h := 10.0) -> void:
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, h)
	v.add_child(sp)

static func label(v: VBoxContainer, text: String, size := 13, col := DIM) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_child(l)
	return l

static func title_label(v: VBoxContainer, text: String) -> Label:
	var l := label(v, text, 26, INK)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l

## les « .btn » du CSS : blancs translucides, rayon 14, bord fin ;
## primaire : bordure accent 60 %, fond teinté accent 19 %.
static func button(v: VBoxContainer, text: String, cb: Callable, primary := false) -> Button:
	var b := Button.new()
	b.text = text
	b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	b.add_theme_font_size_override("font_size", 14)
	b.add_theme_color_override("font_color", INK if not primary else Color("#bfeeff"))
	b.add_theme_color_override("font_hover_color", Color("#ffffff"))
	b.add_theme_color_override("font_pressed_color", ACC)
	b.add_theme_color_override("font_focus_color", INK)
	var n := StyleBoxFlat.new()
	n.bg_color = Color(1, 1, 1, 0.045) if not primary else Color(ACC.r, ACC.g, ACC.b, 0.14)
	n.set_corner_radius_all(11)
	n.border_color = LINE_SOFT if not primary else Color(ACC.r, ACC.g, ACC.b, 0.55)
	n.set_border_width_all(1)
	n.content_margin_left = 12
	n.content_margin_right = 12
	n.content_margin_top = 8
	n.content_margin_bottom = 8
	var h := n.duplicate()
	h.bg_color = Color(1, 1, 1, 0.085) if not primary else Color(ACC.r, ACC.g, ACC.b, 0.22)
	h.border_color = LINE if not primary else ACC
	var pr := n.duplicate()
	pr.bg_color = Color(ACC.r, ACC.g, ACC.b, 0.30)
	b.add_theme_stylebox_override("normal", n)
	b.add_theme_stylebox_override("hover", h)
	b.add_theme_stylebox_override("pressed", pr)
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	# (C10) acquittement sonore : on sait que le clic est parti
	b.pressed.connect(func(): Audio2.sfx("uiclick"))
	b.pressed.connect(cb)
	v.add_child(b)
	return b

## pastille « .chip » : bord fin, fond translucide
static func chip_row(v: VBoxContainer, chips: Array) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 8)
	v.add_child(h)
	for c in chips:
		var l := Label.new()
		l.text = c[0]
		l.add_theme_font_size_override("font_size", 12)
		l.add_theme_color_override("font_color", c[1] if c.size() > 1 else ACC)
		h.add_child(l)
	return h

static func make_slider(v: VBoxContainer, text: String, value: float, cb: Callable) -> HSlider:
	var l := label(v, "%s : %d %%" % [text, int(value * 100)], 13, INK)
	var s := HSlider.new()
	s.min_value = 0
	s.max_value = 100
	s.value = value * 100
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.value_changed.connect(func(val):
		l.text = "%s : %d %%" % [text, int(val)]
		cb.call(float(val) / 100.0))
	v.add_child(s)
	return s
