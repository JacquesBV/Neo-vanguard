extends Control
## =========================================================================
## FANBOY INTERACTIVE CONSOLE • Neo-Vanguard, Secteurs 1–3 (Monde 1)
## Coordonnées maîtresses 937×1679 faisant foi ; toutes les entrées passent
## par la transformation inverse du canevas (`to_master`).
## =========================================================================

signal button_changed(action: String, pressed: bool)
signal stick_changed(value: Vector2)
signal power_changed(enabled: bool)
signal screen_touch(index: int, position: Vector2, pressed: bool)
signal screen_drag(index: int, position: Vector2, relative: Vector2)

@export_range(0.0, 0.5) var deadzone := 0.12
@export var sound_enabled := true
@export var haptics_enabled := false
@export var respect_safe_area := true

const MASTER := Vector2(937, 1679)
const SCREEN := Rect2(158, 287, 620, 890)
const CENTERS := {
	"a": Vector2(635.5, 1386.5),
	"b": Vector2(757.0, 1297.5),
	"start": Vector2(522.5, 1324.5),
	"select": Vector2(522.5, 1261.5),
	"stick": Vector2(296.5, 1344.0),
	"power": Vector2(106.5, 212.0),
}

## Zones gravées additionnelles sur la plaque inférieure (coordonnées source 937×1679)
const BOX_LIVES := Rect2(414, 1521, 37, 19)
const BOX_BOMBS := Rect2(564, 1521, 36, 19)
const BOX_BOSS_NAME := Rect2(691, 1521, 128, 19)

static var _tex_cache: Dictionary = {}
static var _wav_cache: Dictionary = {}
static var _shader_cache: Shader = null

var powered := true
var console_active := true
var stick_value := Vector2.ZERO
var captures: Dictionary = {}
var held: Dictionary = {}
var sprites: Dictionary = {}
var tweens: Dictionary = {}
var canvas: Node2D
var game_viewport: SubViewport
var screen_sprite: Sprite2D
var layout: Dictionary
var sounds: Dictionary = {}
var players: Array[AudioStreamPlayer] = []
var voice := 0
var power_y := 0.0
var led_energy := 1.0
var hull_ratio := 0.0
var boss_ratio := 0.0
var lives_val := -1
var bombs_val := -1
var boss_label := ""
var hud: Node2D
var threat := 0.0
var threat_lights: Sprite2D
var light_materials: Array[ShaderMaterial] = []
var light_color := Color("48e4a1")

static func clear_static_cache() -> void:
	_tex_cache.clear()
	_wav_cache.clear()
	_shader_cache = null

static func _load_layer_tex(res_path: String) -> Texture2D:
	if _tex_cache.has(res_path):
		return _tex_cache[res_path]
	var out: Texture2D = null
	if ResourceLoader.exists(res_path):
		var raw := load(res_path)
		if raw is Texture2D:
			var img_r: Image = (raw as Texture2D).get_image()
			if img_r != null and not img_r.is_empty():
				out = ImageTexture.create_from_image(img_r)
			else:
				out = raw
	if out == null:
		var abs_p := ProjectSettings.globalize_path(res_path)
		if FileAccess.file_exists(abs_p):
			var img := Image.load_from_file(abs_p)
			if img != null and not img.is_empty():
				out = ImageTexture.create_from_image(img)
	_tex_cache[res_path] = out
	return out

static func _load_led_shader() -> Shader:
	if _shader_cache != null:
		return _shader_cache
	var res_path := "res://scripts/led.gdshader"
	if ResourceLoader.exists(res_path):
		var loaded := load(res_path)
		if loaded is Shader:
			_shader_cache = loaded
			return _shader_cache
	var abs_p := ProjectSettings.globalize_path(res_path)
	if FileAccess.file_exists(abs_p):
		var code := FileAccess.get_file_as_string(abs_p)
		if not code.is_empty():
			var sh := Shader.new()
			sh.code = code
			_shader_cache = sh
	return _shader_cache

static func _load_sfx_wav(res_path: String) -> AudioStream:
	if _wav_cache.has(res_path):
		return _wav_cache[res_path]
	var stream: AudioStream = null
	if ResourceLoader.exists(res_path):
		var loaded := load(res_path)
		if loaded is AudioStream:
			stream = loaded
	if stream == null:
		var abs_p := ProjectSettings.globalize_path(res_path)
		if FileAccess.file_exists(abs_p):
			stream = _parse_pcm_wav(abs_p)
	_wav_cache[res_path] = stream
	return stream

static func _parse_pcm_wav(abs_path: String) -> AudioStreamWAV:
	var bytes := FileAccess.get_file_as_bytes(abs_path)
	if bytes.size() < 44:
		return null
	if bytes.slice(0, 4).get_string_from_ascii() != "RIFF":
		return null
	var pos := 12
	var channels := 1
	var mix_rate := 44100
	var bits := 16
	var pcm_data := PackedByteArray()
	while pos + 8 <= bytes.size():
		var chunk_id := bytes.slice(pos, pos + 4).get_string_from_ascii()
		var chunk_sz := bytes.decode_u32(pos + 4)
		pos += 8
		if pos + chunk_sz > bytes.size():
			break
		if chunk_id == "fmt " and chunk_sz >= 16:
			channels = bytes.decode_u16(pos + 2)
			mix_rate = bytes.decode_u32(pos + 4)
			bits = bytes.decode_u16(pos + 14)
		elif chunk_id == "data":
			pcm_data = bytes.slice(pos, pos + chunk_sz)
			break
		pos += chunk_sz + (chunk_sz % 2)
	if pcm_data.is_empty():
		return null
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS if bits == 16 else AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = mix_rate
	wav.stereo = (channels >= 2)
	wav.data = pcm_data
	return wav

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var layout_txt := FileAccess.get_file_as_string("res://assets/layout.json")
	if layout_txt.is_empty():
		layout_txt = FileAccess.get_file_as_string(ProjectSettings.globalize_path("res://assets/layout.json"))
	layout = JSON.parse_string(layout_txt)
	canvas = Node2D.new()
	# Filtrage linéaire sur les couches haute définition 937×1679 (métal brossé,
	# capuchons, rails lumineux), même si project.godot force NEAREST par défaut.
	canvas.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_child(canvas)
	_sprite("hidden_sockets", Vector2.ZERO, false)
	game_viewport = SubViewport.new()
	game_viewport.name = "GameViewport"
	game_viewport.size = Vector2i(620, 890)
	game_viewport.disable_3d = true
	game_viewport.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	game_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(game_viewport)
	screen_sprite = Sprite2D.new()
	screen_sprite.centered = false
	screen_sprite.texture = game_viewport.get_texture()
	screen_sprite.position = SCREEN.position
	screen_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	canvas.add_child(screen_sprite)
	_sprite("shell", Vector2.ZERO, false)
	_sprite("threat_lights", Vector2.ZERO, false)
	threat_lights = sprites.threat_lights
	hud = Node2D.new()
	canvas.add_child(hud)
	hud.draw.connect(_draw_hud)
	for key in ["a", "b", "select", "start", "stick", "power", "led"]:
		var c: Dictionary = layout.controls[key]
		_sprite(key, Vector2(c.center[0], c.center[1]), true)
	var shader := _load_led_shader()
	for s in [sprites.led, threat_lights]:
		var material := ShaderMaterial.new()
		material.shader = shader
		s.material = material
		light_materials.append(material)
	for key in ["press", "release", "switch_on", "switch_off", "stick_return"]:
		sounds[key] = _load_sfx_wav("res://assets/audio/%s.wav" % key)
	for i in range(12):
		var p := AudioStreamPlayer.new()
		p.volume_db = -12.0
		add_child(p)
		players.append(p)
	resized.connect(_fit)
	_fit()

func _exit_tree() -> void:
	for p in players:
		if is_instance_valid(p):
			p.stop()

func _sprite(key: String, pos: Vector2, centered: bool) -> void:
	var s := Sprite2D.new()
	s.texture = _load_layer_tex("res://assets/layers/%s.png" % key)
	s.centered = centered
	s.position = pos
	canvas.add_child(s)
	sprites[key] = s

func set_screen_smooth(smooth: bool) -> void:
	if is_instance_valid(screen_sprite):
		screen_sprite.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR if smooth else CanvasItem.TEXTURE_FILTER_NEAREST

func set_console_active(enabled: bool) -> void:
	if console_active == enabled and visible == enabled:
		return
	console_active = enabled
	if not enabled:
		cancel_all()
	visible = enabled
	set_process_input(enabled)
	set_process(enabled)
	if is_instance_valid(game_viewport):
		game_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS if (enabled and powered) else SubViewport.UPDATE_DISABLED

func trigger_boot_glow(play_switch_sfx := false) -> void:
	if not powered:
		set_power(true)
	led_energy = 0.08
	if play_switch_sfx:
		_sound("switch_on")

func _fit() -> void:
	if not is_instance_valid(canvas):
		return
	var viewport_sz := size
	if viewport_sz.x <= 0.0 or viewport_sz.y <= 0.0:
		viewport_sz = Vector2(480.0, 860.0)
	var available := Rect2(Vector2.ZERO, viewport_sz)
	if respect_safe_area and OS.has_feature("mobile"):
		var safe := DisplayServer.get_display_safe_area()
		var win := Vector2(DisplayServer.window_get_size())
		if win.x > 0.0 and win.y > 0.0:
			available = Rect2(Vector2(safe.position) / win * viewport_sz, Vector2(safe.size) / win * viewport_sz)
	var factor := minf(available.size.x / MASTER.x, available.size.y / MASTER.y)
	canvas.scale = Vector2.ONE * factor
	canvas.position = available.position + (available.size - MASTER * factor) * 0.5

func get_screen_rect_in_control() -> Rect2:
	if not is_instance_valid(canvas):
		return Rect2(81.0, 147.0, 318.0, 456.0)
	var top_left: Vector2 = canvas.position + SCREEN.position * canvas.scale
	var sz: Vector2 = SCREEN.size * canvas.scale
	return Rect2(top_left, sz)

func to_master(point: Vector2) -> Vector2:
	return canvas.get_global_transform_with_canvas().affine_inverse() * point

func _has_active_touch() -> bool:
	for k in captures.keys():
		if int(k) >= 0:
			return true
	return false

func _input(event: InputEvent) -> void:
	if not console_active:
		return
	if event is InputEventScreenTouch:
		if event.canceled:
			pointer_up(event.index, to_master(event.position), true)
		elif event.pressed:
			pointer_down(event.index, to_master(event.position))
		else:
			pointer_up(event.index, to_master(event.position))
	elif event is InputEventScreenDrag:
		pointer_move(event.index, to_master(event.position))
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		# Ignore les clics souris synthétisés par l'émulation tactile mobile Godot
		if event.device == InputEvent.DEVICE_ID_EMULATION or _has_active_touch():
			return
		if event.pressed:
			pointer_down(-1, to_master(event.position))
		else:
			pointer_up(-1, to_master(event.position))
	elif event is InputEventMouseMotion and captures.has(-1):
		if event.device == InputEvent.DEVICE_ID_EMULATION:
			return
		pointer_move(-1, to_master(event.position))

func hit(key: String, point: Vector2) -> bool:
	var delta: Vector2 = point - CENTERS[key]
	match key:
		"a": return delta.length() <= 58.0
		"b": return delta.length() <= 51.0
		"stick": return delta.length() <= 103.0
		"start", "select": return absf(delta.x) <= 44.0 and absf(delta.y) <= 22.0
		"power": return absf(delta.x) <= 28.0 and absf(delta.y) <= 57.0
	return false

func pointer_down(id: int, point: Vector2) -> void:
	if captures.has(id):
		return
	var key := ""
	for candidate in ["power", "a", "b", "start", "select", "stick"]:
		if hit(candidate, point):
			key = candidate
			break
	if key == "" and SCREEN.has_point(point):
		key = "screen"
	if key == "" or (not powered and key != "power"):
		return
	# Chaque pièce mécanique appartient à un seul doigt jusqu'au relâchement. L'écran en accepte plusieurs.
	if key != "screen":
		for c in captures.values():
			if c.key == key:
				return
	captures[id] = { "key": key, "last": point, "start": point }
	if key == "screen":
		_screen_event(id, point, true)
	elif key == "stick":
		_stick(point)
	elif key != "power":
		_button(key, true)

func pointer_move(id: int, point: Vector2) -> void:
	if not captures.has(id):
		return
	var c: Dictionary = captures[id]
	match c.key:
		"stick":
			_stick(point)
		"screen":
			var previous: Vector2 = _screen_point(c.last)
			var mapped := _screen_point(point)
			var e := InputEventScreenDrag.new()
			e.index = id
			e.position = mapped
			e.relative = mapped - previous
			game_viewport.push_input(e, true)
			screen_drag.emit(id, mapped, e.relative)
		"power":
			power_y = clampf((0.0 if powered else 18.0) + point.y - c.start.y, 0.0, 18.0)
		_:
			_button(c.key, hit(c.key, point))
	c.last = point

func pointer_up(id: int, point: Vector2, canceled := false) -> void:
	if not captures.has(id):
		return
	var c: Dictionary = captures[id]
	captures.erase(id)
	match c.key:
		"screen":
			_screen_event(id, point, false, canceled)
		"stick":
			stick_value = Vector2.ZERO
			stick_changed.emit(stick_value)
			_animate("stick", CENTERS.stick, Vector2.ONE, 0.12)
			if not canceled:
				_sound("stick_return")
		"power":
			if not canceled:
				var dy: float = point.y - c.start.y
				set_power(dy < 0.0 if absf(dy) > 7.0 else not powered)
			power_y = 0.0 if powered else 18.0
		_:
			_button(c.key, false)

func _button(key: String, down: bool) -> void:
	if held.get(key, false) == down:
		return
	held[key] = down
	_animate(key, CENTERS[key] + Vector2(0.0, 3.0 if down else 0.0), Vector2.ONE * (0.965 if down else 1.0), 0.045 if down else 0.085)
	sprites[key].modulate = Color(0.85, 0.89, 0.95) if down else Color.WHITE
	_sound("press" if down else "release")
	if down and haptics_enabled:
		Input.vibrate_handheld(8)
	button_changed.emit(key, down)

func _animate(key: String, pos: Vector2, target_scale: Vector2, seconds: float) -> void:
	if tweens.has(key) and tweens[key].is_valid():
		tweens[key].kill()
	var t := create_tween().set_parallel(true)
	t.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	t.tween_property(sprites[key], "position", pos, seconds)
	t.tween_property(sprites[key], "scale", target_scale, seconds)
	tweens[key] = t

func _stick(point: Vector2) -> void:
	var raw: Vector2 = ((point - CENTERS.stick) / 72.0).limit_length()
	var length := raw.length()
	stick_value = Vector2.ZERO if length <= deadzone else raw.normalized() * ((length - deadzone) / (1.0 - deadzone))
	if tweens.has("stick") and tweens.stick.is_valid():
		tweens.stick.kill()
	sprites.stick.position = CENTERS.stick + raw * 17.0
	sprites.stick.scale = Vector2(1.0 - absf(raw.x) * 0.025, 1.0 - absf(raw.y) * 0.025)
	stick_changed.emit(stick_value)

func _screen_point(point: Vector2) -> Vector2:
	return (point - SCREEN.position).clamp(Vector2.ZERO, SCREEN.size - Vector2.ONE) / SCREEN.size * Vector2(game_viewport.size)

func _screen_event(id: int, point: Vector2, down: bool, canceled := false) -> void:
	var e := InputEventScreenTouch.new()
	e.index = id
	e.position = _screen_point(point)
	e.pressed = down
	e.canceled = canceled
	game_viewport.push_input(e, true)
	screen_touch.emit(id, e.position, down)

func set_power(enabled: bool) -> void:
	if enabled == powered:
		return
	powered = enabled
	if not powered:
		cancel_all()
	power_y = 0.0 if powered else 18.0
	screen_sprite.visible = powered
	hud.visible = powered
	game_viewport.set_disable_input(not powered)
	game_viewport.process_mode = Node.PROCESS_MODE_INHERIT if powered else Node.PROCESS_MODE_DISABLED
	if console_active:
		game_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS if powered else SubViewport.UPDATE_DISABLED
	_sound("switch_on" if powered else "switch_off")
	power_changed.emit(powered)

func cancel_all() -> void:
	for id in captures.keys():
		pointer_up(id, captures[id].last, true)

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT or what == NOTIFICATION_APPLICATION_PAUSED:
		cancel_all()

func _process(delta: float) -> void:
	if not is_instance_valid(canvas):
		return
	sprites.power.position = CENTERS.power + Vector2(0.0, power_y)
	var c: Dictionary = layout.controls.led
	sprites.led.position = Vector2(c.center[0], c.center[1] + power_y)
	led_energy = move_toward(led_energy, 1.0 if powered else 0.08, delta * 9.0)
	var target := Color("48e4a1") if threat < 0.33 else (Color("ffae32") if threat < 0.67 else Color("ff343a"))
	light_color = light_color.lerp(target, 1.0 - exp(-delta * 12.0))
	for material in light_materials:
		material.set_shader_parameter("light_color", light_color)
		material.set_shader_parameter("energy", led_energy if powered else 0.0)

func _effective_volume_db() -> float:
	var save_singleton := get_node_or_null("/root/Save")
	var audio_singleton := get_node_or_null("/root/Audio2")
	if audio_singleton != null and bool(audio_singleton.get("muted")):
		return -80.0
	if save_singleton != null and save_singleton.get("S") is Dictionary:
		var opts: Variant = save_singleton.S.get("opts", {})
		if opts is Dictionary:
			var sfx_pct := clampf(float(opts.get("sfx", 80)) / 100.0, 0.0, 1.0)
			if sfx_pct <= 0.001:
				return -80.0
			return -12.0 + linear_to_db(sfx_pct)
	return -12.0

func _sound(key: String) -> void:
	if not sound_enabled:
		return
	var stream: AudioStream = sounds.get(key)
	if stream == null:
		return
	var vol_db := _effective_volume_db()
	if vol_db <= -79.0:
		return
	var p := players[voice % players.size()]
	voice += 1
	p.volume_db = vol_db
	p.stream = stream
	p.play()

## Pass health and maximum independently; zero/invalid maximum produces an empty bar.
func set_hull_health(current: float, maximum: float) -> void:
	var next_r := clampf(current / maximum, 0.0, 1.0) if maximum > 0.0 else 0.0
	if not is_equal_approx(hull_ratio, next_r):
		hull_ratio = next_r
		if is_instance_valid(hud):
			hud.queue_redraw()
	else:
		hull_ratio = next_r

## 0..0.329 calm / 0.33..0.669 danger / 0.67..1 critical. Power always wins.
func set_threat(value: float) -> void:
	threat = clampf(value, 0.0, 1.0)

func set_boss_health(current: float, maximum: float) -> void:
	var next_r := clampf(current / maximum, 0.0, 1.0) if maximum > 0.0 else 0.0
	if not is_equal_approx(boss_ratio, next_r):
		boss_ratio = next_r
		if is_instance_valid(hud):
			hud.queue_redraw()
	else:
		boss_ratio = next_r

func set_telemetry(lives: int, bombs: int, boss_name_txt: String) -> void:
	var trimmed := boss_name_txt.strip_edges()
	if trimmed.length() > 13:
		trimmed = trimmed.substr(0, 12) + "·"
	if lives_val != lives or bombs_val != bombs or boss_label != trimmed:
		lives_val = lives
		bombs_val = bombs
		boss_label = trimmed
		if is_instance_valid(hud):
			hud.queue_redraw()

func _draw_hud() -> void:
	var gauge_col := Color("72b9e8")
	for entry in [[hull_ratio, layout.gauges.hull], [boss_ratio, layout.gauges.boss]]:
		var cells: Array = entry[1]
		var count: int = int(ceil(entry[0] * cells.size()))
		for i in range(count):
			var cell: Array = cells[i]
			hud.draw_rect(Rect2(cell[0], cell[1], cell[2], cell[3]), gauge_col)
	var font := ThemeDB.fallback_font
	if font != null:
		if lives_val >= 0:
			hud.draw_string(font, Vector2(BOX_LIVES.position.x, BOX_LIVES.position.y + 15.0),
				str(lives_val), HORIZONTAL_ALIGNMENT_CENTER, BOX_LIVES.size.x, 14, gauge_col)
		if bombs_val >= 0:
			hud.draw_string(font, Vector2(BOX_BOMBS.position.x, BOX_BOMBS.position.y + 15.0),
				str(bombs_val), HORIZONTAL_ALIGNMENT_CENTER, BOX_BOMBS.size.x, 14, gauge_col)
		if not boss_label.is_empty():
			hud.draw_string(font, Vector2(BOX_BOSS_NAME.position.x + 4.0, BOX_BOSS_NAME.position.y + 14.5),
				boss_label, HORIZONTAL_ALIGNMENT_CENTER, BOX_BOSS_NAME.size.x - 8.0, 12, gauge_col)
