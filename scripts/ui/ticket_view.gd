extends Control
## TICKET À GRATTER — réplique du module 47 (pack « Réaliste V3 »).
## Carte inclinée −4°, base officielle, récompense sous la zone argentée,
## grattage au doigt/souris (pinceau ~63 px source), révélation auto à 65 %,
## son de frottement en boucle pendant le geste, carillon à la révélation,
## numéro de série NV-XXX-XXXXXX imprimé sur le ticket.
## Affiché en surcouche (l'écran du dessous reste en place), comme
## #nvtOverlay dans l'original ; Échap / « Retour au menu » referme.
## La carte = trois TextureRect empilés (base / récompense / surface à
## gratter) + Label de série, dans un Control pivoté — aucun dessin custom.

var main: Node
var model_id := "finale"
var on_close := Callable()

var item: Dictionary
var rar: Dictionary
var code := ""

const SC := 440.0 / 1536.0            ## source (1536×1024) → carte 440×293
const BRUSH_R := 63.0                 ## pinceau, en pixels de la zone 440×245
const CARD_SIZE := Vector2(440.0, 440.0 * 1024.0 / 1536.0)
const CARD_CENTER := Vector2(240.0, 305.0)

var surface_img: Image
var scratch_tex: ImageTexture
var surface_rect: TextureRect
var surface_alpha := 1.0
var revealed := false
var scratching := false
var last_pos := Vector2.INF
var sample_t := 0.0
var rub: AudioStreamPlayer
var chime: AudioStreamPlayer
var row_scratch: VBoxContainer
var row_code: VBoxContainer
var code_val: Label

func _ready() -> void:
	item = Tickets.get_item(model_id)
	if item.is_empty():
		item = Tickets.award(model_id)
	rar = Tickets.RARITIES[item.rarity]
	code = Tickets.MODELS[model_id].code
	revealed = bool(item.revealed)

	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var ui := UIKit
	ui.dark_bg(self, 0.93)
	var v := ui.vbox(self, 6)
	ui.label(v, Tickets.TX.kicker[item.rarity] if Tickets.TX.kicker.has(item.rarity) else "RÉCOMPENSE", 11, Color("#ffd783"))
	var tl := ui.label(v, Tickets.TX.title, 25, Color("#f7fbff"))
	tl.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 1))
	ui.label(v, Tickets.TX.sub, 11, Color("#b8cbe4"))
	ui.spacer(v, 300)                     ## la zone visuelle de la carte

	# ---- boutons : état « à gratter » puis « révélé » --------------------
	row_scratch = VBoxContainer.new()
	row_scratch.add_theme_constant_override("separation", 4)
	v.add_child(row_scratch)
	ui.button(row_scratch, "🎟 " + Tickets.TX.revealA, func(): _finish_reveal(true))
	var lh := ui.label(row_scratch, Tickets.TX.revealH, 10, ui.DIM)
	lh.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.button(row_scratch, "⌂ " + Tickets.TX.menu, _close)

	row_code = VBoxContainer.new()
	row_code.add_theme_constant_override("separation", 4)
	v.add_child(row_code)
	ui.label(row_code, Tickets.TX.codeL, 12, Color("#ffd783"))
	code_val = ui.label(row_code, code, 22, Color("#f7fbff"))
	ui.label(row_code, Tickets.TX.codeH, 10, ui.DIM)
	ui.button(row_code, "⧉ " + Tickets.TX.copy, func():
		DisplayServer.clipboard_set(code)
		code_val.text = code + "  ·  " + Tickets.TX.copied)
	ui.button(row_code, "☠ " + Tickets.TX.codes, func():
		_close()
		if main: main.show_cheats())
	ui.button(row_code, "⌂ " + Tickets.TX.menu, _close)
	row_code.visible = false

	# ---- sons -------------------------------------------------------------
	rub = AudioStreamPlayer.new()
	var rs: AudioStream = load("res://assets/tickets/frottement.wav")
	if rs is AudioStreamWAV:
		rs.loop_mode = AudioStreamWAV.LOOP_FORWARD
		rs.loop_end = rs.data.size() / 4          ## 16 bits stéréo → frames
	rub.stream = rs
	rub.volume_db = -60.0
	add_child(rub)
	chime = AudioStreamPlayer.new()
	chime.stream = load("res://assets/tickets/revelation.wav")
	chime.volume_db = -5.0
	add_child(chime)

	# ---- la carte : Control pivoté, AU-DESSUS du voile et du scroll ------
	# (le _draw() d'un écran passe SOUS ses enfants : la carte est donc un
	#  enfant dédié ajouté après le voile, en TextureRect empilés)
	var card := Control.new()
	card.position = CARD_CENTER - CARD_SIZE / 2.0
	card.size = CARD_SIZE
	card.pivot_offset = CARD_SIZE / 2.0
	card.rotation_degrees = Tickets.ROT
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	card.gui_input.connect(_card_input)
	add_child(card)
	var base_t := TextureRect.new()
	base_t.texture = load(Tickets.base_of(model_id))
	base_t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	base_t.stretch_mode = TextureRect.STRETCH_SCALE
	base_t.size = CARD_SIZE
	base_t.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(base_t)
	var rw_t := TextureRect.new()
	rw_t.texture = load(Tickets.MODELS[model_id].reward)
	rw_t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rw_t.stretch_mode = TextureRect.STRETCH_SCALE
	rw_t.position = Tickets.ZONE.position * SC
	rw_t.size = Tickets.ZONE.size * SC
	rw_t.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(rw_t)
	var surf: Texture2D = load("res://assets/tickets/surface_argentee.png")
	surface_img = surf.get_image()
	if surface_img.is_compressed():
		surface_img.decompress()
	surface_img.convert(Image.FORMAT_RGBA8)
	scratch_tex = ImageTexture.create_from_image(surface_img)
	surface_rect = TextureRect.new()
	surface_rect.texture = scratch_tex
	surface_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	surface_rect.stretch_mode = TextureRect.STRETCH_SCALE
	surface_rect.position = Tickets.ZONE.position * SC
	surface_rect.size = Tickets.ZONE.size * SC
	surface_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(surface_rect)
	# numéro de série imprimé (NV-XXX-XXXXXX, encre #242421)
	var serial := Label.new()
	serial.text = item.serial
	serial.add_theme_font_size_override("font_size", 10)
	serial.add_theme_color_override("font_color", Color("#242421"))
	serial.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	serial.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	serial.position = Tickets.SERIAL_RECT.position * SC
	serial.size = Tickets.SERIAL_RECT.size * SC
	serial.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(serial)

	if revealed:
		surface_alpha = 0.0
		surface_rect.visible = false
		_show_code_state()

func _card_input(ev: InputEvent) -> void:
	if revealed:
		return
	if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT:
		scratching = ev.pressed
		last_pos = Vector2.INF
		_rub(scratching)
		if scratching:
			_scratch_at(ev.position)
	elif ev is InputEventScreenTouch:
		scratching = ev.pressed
		last_pos = Vector2.INF
		_rub(scratching)
	elif ev is InputEventMouseMotion or ev is InputEventScreenDrag:
		if scratching:
			_scratch_at(ev.position)

## convertit un point carte → pixels de la surface 440×245
func _to_surface(p: Vector2) -> Vector2:
	return (p / SC) - Tickets.ZONE.position

func _scratch_at(p: Vector2) -> void:
	var q := _to_surface(p)
	var from := Vector2.INF if last_pos == Vector2.INF else _to_surface(last_pos)
	last_pos = p
	var pts: Array = []
	if from == Vector2.INF:
		pts.append(q)
	else:
		var d := (q - from).length()
		var n := maxi(1, int(d / (BRUSH_R * 0.5)))
		for i in n + 1:
			pts.append(from.lerp(q, i / float(n)))
	var changed := false
	for pt in pts:
		if _brush(pt):
			changed = true
	if changed:
		scratch_tex.update(surface_img)
	sample_t += get_process_delta_time()
	if sample_t > 0.18:
		sample_t = 0.0
		_sample()

func _brush(c: Vector2) -> bool:
	var r := int(BRUSH_R)
	var cx := int(c.x)
	var cy := int(c.y)
	var w := surface_img.get_width()
	var h := surface_img.get_height()
	var touched := false
	for dy in range(-r, r + 1):
		var y := cy + dy
		if y < 0 or y >= h:
			continue
		var dx := int(sqrt(float(r * r - dy * dy)))
		var x0 := maxi(0, cx - dx)
		var x1 := mini(w, cx + dx + 1)
		if x1 > x0:
			surface_img.fill_rect(Rect2i(x0, y, x1 - x0, 1), Color(0, 0, 0, 0))
			touched = true
	return touched

## progression : pixels transparens / aire de la zone (fréquence limitée)
func _sample() -> void:
	if revealed:
		return
	var w := surface_img.get_width()
	var h := surface_img.get_height()
	var off := 0
	var tot := 0
	for y in range(0, h, 4):
		for x in range(0, w, 4):
			tot += 1
			if surface_img.get_pixel(x, y).a < 0.5:
				off += 1
	var prog := float(off) / float(maxi(1, tot))
	item.progress = prog
	if prog >= Tickets.REVEAL_AT:
		_finish_reveal(false)

func _finish_reveal(instant: bool) -> void:
	if revealed:
		return
	revealed = true
	item.revealed = true
	item.progress = 1.0
	item.revealed_at = int(Time.get_unix_time_from_system())
	Tickets.persist()
	_rub(false)
	chime.play()
	var tw := create_tween()
	if instant:
		tw.tween_callback(_fade_step.bind(0.0))
	else:
		tw.tween_method(_fade_step, 1.0, 0.0, 0.45)
	_show_code_state()

func _fade_step(a: float) -> void:
	surface_alpha = a
	surface_rect.modulate.a = a

func _show_code_state() -> void:
	row_scratch.visible = false
	row_code.visible = true

func _rub(on: bool) -> void:
	if rub == null or rub.stream == null:
		return
	if on:
		rub.volume_db = -60.0
		rub.play()
		var tw := create_tween()
		tw.tween_property(rub, "volume_db", -10.0, 0.06)
	else:
		var tw := create_tween()
		tw.tween_property(rub, "volume_db", -60.0, 0.08)
		tw.tween_callback(rub.stop)

func _close() -> void:
	_rub(false)
	if on_close.is_valid():
		on_close.call()
	queue_free()

func _unhandled_input(ev: InputEvent) -> void:
	if ev.is_action_pressed("ui_cancel"):
		_close()
		get_viewport().set_input_as_handled()
