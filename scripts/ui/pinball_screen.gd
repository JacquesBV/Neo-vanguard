extends Control
## =========================================================================
## PINBALL — NÉON ORBIT. Retranscription de pinball/pinball.js (992 l.) :
## table officielle (02_plateau_statique), rails des rampes masqués dans la
## table, insertions clignotantes, mécanismes en atlas 4×4 (bumpers, bankes,
## batteurs, lance-bille, ombre/bille), effets 4×4 (cyan/magenta/étincelles),
## afficheur score, sons du pack + musique 32 s en boucle, aide/pause/game
## over, cadeau de fin de campagne (05_menu_deblocage).
## =========================================================================

const PB := preload("res://scripts/pinball/pinball_engine.gd")
const DIR := "res://assets/pinball/"
const GRID := [0.0, 314.0, 627.0, 940.0, 1254.0]

const SOUND_SOURCES := {
	"drain": "bille_perdue.wav", "bonus": "bonus_debloque.wav", "bumperCyan": "bumper_cyan.wav",
	"bumperMagenta": "bumper_magenta.wav", "targetDown": "cible_abaissee.wav", "target": "cible_touchee.wav",
	"over": "fin_partie.wav", "right": "flipper_droit.wav", "left": "flipper_gauche.wav",
	"jackpot": "jackpot.wav", "launch": "lance_bille.wav", "navigate": "menu_navigation.wav",
	"validate": "menu_validation.wav", "multiball": "multibille.wav", "ramp": "rampe_validee.wav",
	"metal": "rebond_metal.wav", "sector": "secteur_valide.wav",
}

var main: Node = null
var game: NVPinballEngine = null
var tex_table: Texture2D
var tex_mech: Texture2D
var tex_fx: Texture2D
var tex_menu: Texture2D
var rail_image: Image
var rail_tex: Texture2D   # créée UNE fois (une ImageTexture par frame = blanc sous GL)
var effects: Array = []        # { kind, x, y, size, t, duration }
var popups: Array = []         # { text, x, y, color, t, duration }
var bumper_flash := [0.0, 0.0, 0.0]
var message := ""
var message_until := 0.0
var running := false
var view := "menu"             # menu | gift | game | help | pause | over
var help_return := "game"
var music: AudioStreamPlayer
var _pool: Array = []
var _t := 0.0
var _font: Font

static func is_unlocked() -> bool:
	# le code de triche stocke { "code", "at" } dans S.unlocks : la présence suffit
	return (Save.S.unlocks as Dictionary).has("pinball") or Save.S.pinball.get("completed", false) == true

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_font = load("res://assets/fonts/pixel.ttf")
	tex_table = _load_png(DIR + "02_plateau_statique.png")
	tex_mech = _load_png(DIR + "03_mecanismes_4x4.png")
	tex_fx = _load_png(DIR + "04_effets_4x4.png")
	tex_menu = _load_png(DIR + "05_menu_deblocage.png")
	_build_rails()
	music = AudioStreamPlayer.new()
	music.stream = _load_wav(DIR + "audio/musique_neon_orbit_120bpm_boucle_32s.wav")
	if music.stream is AudioStreamWAV:
		music.stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
		music.stream.loop_end = music.stream.data.size() / 4
	music.volume_db = -6.0
	music.bus = "Master"
	add_child(music)
	for i in 8:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)
	_show_menu()

## ------------------------------------------------------------------ assets
func _load_png(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		return null
	var img := Image.new()
	img.load_png_from_buffer(FileAccess.get_file_as_bytes(path))
	return ImageTexture.create_from_image(img)

func _load_wav(path: String) -> AudioStream:
	if not FileAccess.file_exists(path):
		return null
	return load(path)

func _play(name: String, gain := 0.72, vary := false) -> void:
	var file: String = SOUND_SOURCES.get(name, "")
	if file == "":
		return
	var stream := _load_wav(DIR + "audio/" + file)
	if stream == null:
		return
	for p in _pool:
		if not p.playing:
			p.stream = stream
			p.volume_db = linear_to_db(clampf(gain, 0.0, 1.0))
			p.pitch_scale = 0.96 + randf() * 0.08 if vary else 1.0
			p.play()
			return

## rails : la table masquée par le trait des rampes (destination-in, largeur 88)
func _build_rails() -> void:
	if tex_table == null:
		return
	var img := tex_table.get_image()
	var stroke := Image.create(PB.WIDTH, PB.HEIGHT, false, Image.FORMAT_RGBA8)
	for side in ["left", "right"]:
		var ramp: Dictionary = PB.RAMPS[side]
		var pts: Array = ramp.points
		for i in range(1, pts.size()):
			_stroke_line(stroke, pts[i - 1], pts[i], 44.0)
	img.convert(Image.FORMAT_RGBA8)
	stroke.convert(Image.FORMAT_RGBA8)
	# destination-in : ne garder la table que là où le trait passe
	for y in int(PB.HEIGHT):
		for x in int(PB.WIDTH):
			if stroke.get_pixel(x, y).a < 0.5:
				img.set_pixel(x, y, Color(0, 0, 0, 0))
	rail_image = img
	rail_tex = ImageTexture.create_from_image(rail_image)

func _stroke_line(img: Image, a: Array, b: Array, radius: float) -> void:
	var steps := int(ceil(sqrt(pow(b[0] - a[0], 2) + pow(b[1] - a[1], 2))))
	for i in steps + 1:
		var t := i / float(maxi(1, steps))
		var cx := lerpf(a[0], b[0], t)
		var cy := lerpf(a[1], b[1], t)
		var r := int(ceil(radius))
		for dy in range(-r, r + 1):
			for dx in range(-r, r + 1):
				if dx * dx + dy * dy <= radius * radius:
					var x := int(cx) + dx
					var y := int(cy) + dy
					if x >= 0 and y >= 0 and x < PB.WIDTH and y < PB.HEIGHT:
						img.set_pixel(x, y, Color(1, 1, 1, 1))

## ------------------------------------------------------------------- vues
func _clear_ui() -> void:
	for c in get_children():
		if c is Control and c.has_meta("ui"):
			c.queue_free()

func _ui_tag(c: Control) -> Control:
	c.set_meta("ui", true)
	return c

func _show_menu() -> void:
	view = "menu"
	running = false
	_stop_game_audio()
	_clear_ui()
	var scr := _ui_tag(Control.new())
	scr.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(scr)
	var ui := UIKit
	ui.dark_bg(scr, 0.88)
	var v := ui.vbox(scr, 12)
	ui.title_label(v, "NÉON ORBIT")
	if tex_menu != null:
		var art := TextureRect.new()
		art.texture = tex_menu
		art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		art.custom_minimum_size = Vector2(0, 300)
		v.add_child(art)
	var locked := not is_unlocked()
	ui.label(v, "Bonus de fin de campagne" if locked else "Table bonus · 3 billes", 13, ui.ACC)
	ui.label(v, "Termine Neo-Vanguard pour débloquer ce cadeau." if locked
		else "La table Néon Orbit est disponible. Score, missions et record sont indépendants de la campagne.", 11, ui.DIM)
	ui.label(v, "RECORD LOCAL : %d" % int(Save.S.pinball.get("best", 0)), 12, ui.GOLD)
	if not locked:
		ui.button(v, "▶ Jouer", _begin_session)
	ui.button(v, "◀ Retour au menu", _back)

func show_gift() -> void:
	view = "gift"
	_clear_ui()
	var scr := _ui_tag(Control.new())
	scr.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(scr)
	var ui := UIKit
	ui.dark_bg(scr, 0.9)
	var v := ui.vbox(scr, 12)
	ui.title_label(v, "BONUS DÉBLOQUÉ")
	if tex_menu != null:
		var art := TextureRect.new()
		art.texture = tex_menu
		art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		art.custom_minimum_size = Vector2(0, 330)
		v.add_child(art)
	ui.label(v, "Néon Orbit rejoint définitivement ton menu principal.", 12, ui.INK)
	Audio2.sfx("reward")
	ui.button(v, "▶ Jouer", _begin_session)
	ui.button(v, "⌂ Menu titre", _back)

func _show_help(mode: String) -> void:
	help_return = mode
	view = "help"
	if game != null:
		game.set_paused(true)
	_clear_ui()
	var scr := _ui_tag(Control.new())
	scr.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(scr)
	var ui := UIKit
	ui.dark_bg(scr, 0.85)
	var v := ui.vbox(scr, 14)
	ui.title_label(v, "COMMANDES")
	ui.label(v, "← / → ou A / D : batteurs", 13, ui.INK)
	ui.label(v, "Espace maintenu puis relâché : lance-bille", 13, ui.INK)
	ui.label(v, "Échap : pause", 13, ui.INK)
	ui.label(v, "Tactile : zones GAUCHE / DROITE / LANCER", 11, ui.DIM)
	ui.button(v, "✔ Compris", func() -> void:
		Save.S.pinball["help_seen"] = true
		Save.save_game()
		if help_return == "first":
			_hide_overlay()
			if game != null:
				game.set_paused(false)
			view = "game"
		else:
			_show_pause())
	ui.button(v, "◀ Reprendre", func() -> void:
		_hide_overlay()
		if game != null:
			game.set_paused(false)
		view = "game")

func _show_pause() -> void:
	view = "pause"
	if game != null:
		game.set_paused(true)
	_clear_ui()
	var scr := _ui_tag(Control.new())
	scr.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(scr)
	var ui := UIKit
	ui.dark_bg(scr, 0.8)
	var v := ui.vbox(scr, 14)
	ui.title_label(v, "PAUSE")
	ui.button(v, "Reprendre", func() -> void:
		_hide_overlay()
		game.set_paused(false)
		view = "game")
	ui.button(v, "Nouvelle partie", _restart)
	ui.button(v, "? Commandes", func() -> void: _show_help("pause"))
	ui.button(v, "Quitter le flipper", _back)

func _show_game_over(score: int) -> void:
	view = "over"
	_clear_ui()
	var best: int = int(Save.S.pinball.get("best", 0))
	var record := score > best
	if record:
		Save.S.pinball["best"] = score
	Save.save_game()
	var scr := _ui_tag(Control.new())
	scr.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(scr)
	var ui := UIKit
	ui.dark_bg(scr, 0.85)
	var v := ui.vbox(scr, 14)
	ui.title_label(v, "PARTIE TERMINÉE")
	ui.label(v, "SCORE  %d" % score, 22, ui.GOLD)
	ui.label(v, "NOUVEAU RECORD !" if record else "Record local : %d" % maxi(best, score), 13, ui.ACC if record else ui.DIM)
	ui.button(v, "↻ Rejouer", _restart)
	ui.button(v, "Quitter le flipper", _back)

func _hide_overlay() -> void:
	_clear_ui()

func _back() -> void:
	_stop_game_audio()
	if main != null:
		main.show_title()

func _stop_game_audio() -> void:
	if music != null:
		music.stop()
	for p in _pool:
		p.stop()

## -------------------------------------------------------------- session
func _begin_session() -> void:
	_hide_overlay()
	PB._static_init()
	game = PB.new()
	game.start()
	running = true
	effects = []
	popups = []
	bumper_flash = [0.0, 0.0, 0.0]
	message_until = 0.0
	view = "game"
	_hide_overlay()
	if Save.S.pinball.get("help_seen", false) != true:
		_show_help("first")
		_message("MAINTIENS PUIS RELÂCHE LE LANCE-BILLE", 4.0)
	if music != null and not music.playing:
		music.play()
	queue_redraw()

func _restart() -> void:
	if game == null:
		_begin_session()
		return
	game.start()
	running = true
	effects = []
	popups = []
	bumper_flash = [0.0, 0.0, 0.0]
	_hide_overlay()
	view = "game"
	if music != null and not music.playing:
		music.play()

## ------------------------------------------------------------------ input
func _unhandled_input(event: InputEvent) -> void:
	if view != "game" and view != "help" and view != "pause":
		return
	if event.is_action_pressed("pause") or event is InputEventKey and event.pressed and event.physical_keycode == KEY_ESCAPE:
		if view == "game":
			_show_pause()
		elif view == "pause":
			_hide_overlay()
			game.set_paused(false)
			view = "game"
		get_viewport().set_input_as_handled()
		return
	if view != "game" or game == null:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.physical_keycode:
			KEY_LEFT, KEY_A, KEY_Q:
				game.set_flipper("left", true)
			KEY_RIGHT, KEY_D:
				game.set_flipper("right", true)
			KEY_SPACE:
				game.set_plunger(true)
	elif event is InputEventKey and event.pressed == false:
		match event.physical_keycode:
			KEY_LEFT, KEY_A, KEY_Q:
				game.set_flipper("left", false)
			KEY_RIGHT, KEY_D:
				game.set_flipper("right", false)
			KEY_SPACE:
				game.set_plunger(false)

func _gui_input(event: InputEvent) -> void:
	if view != "game" or game == null:
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		var left_zone: bool = mb.position.x < size.x / 3.0
		var right_zone: bool = mb.position.x > size.x * 2.0 / 3.0
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if left_zone:
				game.set_flipper("left", mb.pressed)
			elif right_zone:
				game.set_flipper("right", mb.pressed)
			else:
				game.set_plunger(mb.pressed)

## -------------------------------------------------------------- événements
func _handle_events() -> void:
	for ev in game.drain_events():
		match ev.type:
			"flipper":
				_play(ev.side, 0.48)
			"metal":
				_play("metal", 0.3, true)
			"post", "sling":
				_play("metal", 0.52, true)
				_add_effect("spark", ev.x, ev.y, 105)
			"bumper":
				bumper_flash[ev.index] = 0.17
				_play("bumperMagenta" if ev.index == 1 else "bumperCyan", 0.62, true)
				_add_effect("magenta" if ev.index == 1 else "cyan", ev.x, ev.y, 180)
				if not game.campaign_complete and game.mission_type() == 0:
					game.progress_mission(1)
			"target":
				_play("target", 0.62)
				_add_effect("spark", ev.x, ev.y, 110)
			"bank":
				_play("targetDown", 0.7)
				_play("bonus", 0.5)
				_message("BANQUE CYAN · 5 000" if ev.side == "left" else "BANQUE MAGENTA · 5 000", 1.6)
			"multiplier":
				_play("bonus", 0.65)
				_message("MULTIPLICATEUR ×%d" % ev.value, 1.8)
			"ramp":
				_play("ramp", 0.72)
				_add_effect("cyan" if ev.side == "left" else "magenta", ev.x, ev.y, 200)
			"jackpot":
				_play("jackpot", 0.82)
				_message("JACKPOT DE RAMPE !", 2.0)
				_add_effect("spark", ev.x, ev.y, 260)
			"sector":
				_play("sector", 0.75)
				_message("SECTEUR %d VALIDÉ" % ev.sector, 2.3)
			"voraxStart":
				_play("bonus", 0.75)
				_message("DÉFI VORAX · 5 IMPACTS · 45 S", 2.8)
			"reactor":
				_play("bumperMagenta", 0.8)
				_add_effect("magenta", ev.x, ev.y, 240)
			"voraxWin":
				_play("jackpot", 0.9)
				_message("VORAX VAINCU · 100 000", 2.8)
			"multiball":
				_play("multiball", 0.85)
				_message("MULTIBILLE · JACKPOT ACTIF", 2.5)
			"voraxFailed":
				_play("drain", 0.55)
				_message("VORAX ÉCHAPPÉ · DEUX BANQUES POUR RÉARMER", 2.8)
			"ballSave":
				_play("bonus", 0.68)
				_message("BILLE SAUVÉE", 1.8)
			"drain":
				_play("drain", 0.58)
			"launch":
				_play("launch", 0.7)
			"gameOver":
				_play("over", 0.78)
				_show_game_over(ev.score)
			"score":
				if ev.base >= 500:
					_add_popup("+%d" % ev.points, ev.x, ev.y - 35.0,
						"#ff5bd8" if ev.kind == "jackpot" else "#ffd166")

func _add_effect(kind: String, x: float, y: float, size: float) -> void:
	effects.append({ "kind": kind, "x": x, "y": y, "size": size, "t": 0.0, "duration": 0.4 })

func _add_popup(text: String, x: float, y: float, color: String) -> void:
	popups.append({ "text": text, "x": x, "y": y, "color": color, "t": 0.0, "duration": 0.9 })

func _message(text: String, dur := 1.6) -> void:
	message = text
	message_until = _t + dur

## ------------------------------------------------------------------ boucle
func _process(delta: float) -> void:
	_t += delta
	if running and game != null and view == "game" and not game.paused:
		game.advance(delta)
		_handle_events()
	for i in bumper_flash.size():
		bumper_flash[i] = maxf(0.0, bumper_flash[i] - delta)
	queue_redraw()

## ------------------------------------------------------------------ rendu
func _scale() -> float:
	return minf(480.0 / PB.WIDTH, 720.0 / PB.HEIGHT)

func _origin() -> Vector2:
	return Vector2((480.0 - PB.WIDTH * _scale()) / 2.0, (860.0 - PB.HEIGHT * _scale()) / 2.0)

func _to_screen(x: float, y: float) -> Vector2:
	return _origin() + Vector2(x, y) * _scale()

func _source_rect(index: int) -> Rect2:
	var col := index % 4
	var row := index / 4
	return Rect2(GRID[col], GRID[row], GRID[col + 1] - GRID[col], GRID[row + 1] - GRID[row])

func _draw_frame(image: Texture2D, index: int, x: float, y: float, w: float, h: float, alpha := 1.0) -> void:
	if image == null:
		return
	var r := _source_rect(index)
	var p := _to_screen(x, y)
	var s := _scale()
	var col := Color(1, 1, 1, alpha)
	draw_texture_rect_region(image, Rect2(p.x - w * s / 2.0, p.y - h * s / 2.0, w * s, h * s), r, col)

func _draw() -> void:
	if view == "menu" or view == "gift":
		return
	var s := _scale()
	var o := _origin()
	if tex_table != null:
		draw_texture_rect(tex_table, Rect2(o, Vector2(PB.WIDTH, PB.HEIGHT) * s), false)
	else:
		_draw_table_fallback()
	if view != "game" or game == null:
		return
	# rails (table masquée par les rampes)
	if rail_tex != null:
		draw_texture_rect(rail_tex, Rect2(o, Vector2(PB.WIDTH, PB.HEIGHT) * s), false)
	_draw_inserts()
	_draw_mechanisms()
	_draw_plunger()
	for ball in game.balls:
		if tex_mech != null:
			_draw_frame(tex_mech, 15, ball.x + 5.0, ball.y + 10.0, 50.0, 50.0, 0.18 if ball.ramp != null else 0.42)
		else:
			draw_circle(_to_screen(ball.x + 5.0, ball.y + 10.0), PB.BALL_RADIUS * _scale(), Color(0, 0, 0, 0.30 if ball.ramp == null else 0.12))
	for ball in game.balls:
		var index := 13 if ball.x < 400.0 else (14 if ball.x > 630.0 else 12)
		if tex_mech != null:
			_draw_frame(tex_mech, index, ball.x, ball.y, 55.0, 55.0)
		else:
			var p := _to_screen(ball.x, ball.y)
			draw_circle(p, PB.BALL_RADIUS * _scale(), Color("#2f3f4f"))
			draw_circle(p - Vector2(5.0, 6.0) * _scale(), PB.BALL_RADIUS * 0.45 * _scale(), Color("#eef7ff"))
	_draw_effects()
	_draw_display()

func _draw_inserts() -> void:
	var t: float = game.time
	for i in 5:
		var on := int(t * 8.0) % 5 == i
		var a := 0.95 if on else 0.28
		var col := Color("#ffe58a") if on else Color("#d89b32")
		col.a = a
		var p1 := _to_screen(512.0, 592.0 + i * 49.0)
		var p2 := _to_screen(498.0, 615.0 + i * 49.0)
		var p3 := _to_screen(526.0, 615.0 + i * 49.0)
		draw_colored_polygon(PackedVector2Array([p1, p2, p3]), col)
	for side in ["left", "right"]:
		var ramp: Dictionary = PB.RAMPS[side]
		for i in 8:
			var phase := fposmod(t * 0.75 + i / 8.0, 1.0)
			var p: Dictionary = PB.sample_ramp(ramp, phase * ramp.length)
			var col := Color("#61e8ff") if side == "left" else Color("#ff64d8")
			col.a = 0.18 + 0.5 * pow(sin((phase + t) * PI), 2.0)
			draw_circle(_to_screen(p.x, p.y), 4.0 * _scale(), col)

func _draw_mechanisms() -> void:
	for target in game.targets:
		var index := 10 if target.down else (9 if game.mission_type() == 3 and not game.campaign_complete else 8)
		_draw_frame(tex_mech, index, target.x, target.y + (13.0 if target.down else 0.0), 59.0, 59.0)
	for i in PB.BUMPERS.size():
		var b: Dictionary = PB.BUMPERS[i]
		var flash: float = bumper_flash[i]
		if tex_mech == null:
			var col: Color = [Color("#38e0ff"), Color("#ff64d8"), Color("#ffd36c")][i]
			var sc: float = 0.94 if flash > 0.1 else 1.0
			draw_circle(_to_screen(b.x, b.y), b.r * sc * _scale(), col.darkened(0.55))
			draw_arc(_to_screen(b.x, b.y), b.r * sc * _scale(), 0, TAU, 48, col.lightened(0.2 if flash > 0.0 else 0.0), 4.0 * _scale())
			draw_arc(_to_screen(b.x, b.y), b.r * 0.55 * _scale(), 0, TAU, 40, col, 2.0 * _scale())
		else:
			var index := 6 if flash > 0.1 else (5 if flash > 0.0 else 4)
			var sc := 0.94 if flash > 0.1 else 1.0
			_draw_frame(tex_mech, index, b.x, b.y, 142.0 * sc, 142.0 * sc)
	for p in PB.POSTS:
		if tex_mech == null:
			draw_circle(_to_screen(p.x, p.y), p.r * _scale(), Color("#9fb8c8"))
			draw_arc(_to_screen(p.x, p.y), p.r * _scale(), 0, TAU, 24, Color("#e6f6ff"), 2.0 * _scale())
		else:
			_draw_frame(tex_mech, 7, p.x, p.y, 51.0, 51.0)
	for t in game.targets:
		if tex_mech == null:
			var tcol: Color = Color("#ffd36c") if not t.down else Color("#5d4a1f")
			var tp := _to_screen(t.x, t.y + (13.0 if t.down else 0.0))
			draw_rect(Rect2(tp - Vector2(26.0, 16.0) * _scale(), Vector2(52.0, 32.0) * _scale()), tcol.darkened(0.4))
			draw_rect(Rect2(tp - Vector2(26.0, 16.0) * _scale(), Vector2(52.0, 32.0) * _scale()), tcol, false, 2.0 * _scale())
	for f in game.flippers:
		_draw_flipper(f)
	if game.challenge != null:
		var pulse := 0.5 + 0.5 * sin(game.time * 8.0)
		var col := Color("#ff334f", 0.35 + pulse * 0.45)
		draw_arc(_to_screen(PB.REACTOR.x, PB.REACTOR.y),
			(PB.REACTOR.r + 7.0 + pulse * 5.0) * _scale(), 0, TAU, 40, col, (5.0 + pulse * 4.0) * _scale())

func _draw_flipper(f: Dictionary) -> void:
	var left: bool = f.side == "left"
	var seg: Dictionary = PB.flipper_segment(f)
	if tex_mech == null:
		var piv := _to_screen(f.x, f.y)
		var tip := _to_screen(seg.x2, seg.y2)
		draw_line(piv, tip, Color("#c9d8e4"), 22.0 * _scale())
		draw_line(piv, tip, Color("#eef7ff"), 9.0 * _scale())
		draw_circle(piv, 14.0 * _scale(), Color("#38e0ff").darkened(0.4))
		return
	var r := _source_rect(0 if left else 1)
	var sc: float = f.length / (218.0 if left else 227.0)
	var piv := _to_screen(f.x, f.y)
	var ang: float = f.angle if left else f.angle - PI
	var s := _scale()
	var off := Vector2(-75.0 if left else -250.0, -164.0) * sc * s
	var size := Vector2(r.size.x, r.size.y) * sc * s
	draw_set_transform(piv, ang, Vector2.ONE)
	draw_texture_rect_region(tex_mech, Rect2(off, size), r)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _draw_plunger() -> void:
	var charge := 0.0
	for b in game.balls:
		if b.ready:
			charge = b.charge
	if tex_mech != null:
		_draw_frame(tex_mech, 11, 970.0, 1452.0 + charge * 27.0, 74.0, 74.0)
	else:
		draw_rect(Rect2(_to_screen(948.0, 1430.0 + charge * 27.0), Vector2(44.0, 64.0) * _scale()), Color("#5f7386"))
	var s := _scale()
	var a := _to_screen(916.0, 1270.0)
	draw_rect(Rect2(a, Vector2(14.0, 164.0) * s), Color(0, 0, 0, 0.55))
	var y0 := _to_screen(918.0, 1432.0 - charge * 160.0).y
	draw_rect(Rect2(a.x + 2.0 * s, y0, 10.0 * s, charge * 160.0 * s), Color("#fff1a6").lerp(Color("#ff9f43"), 0.5))

func _draw_effects() -> void:
	var dt := get_process_delta_time()
	for i in range(effects.size() - 1, -1, -1):
		var fx: Dictionary = effects[i]
		fx.t += dt
		var p: float = fx.t / fx.duration
		if p >= 1.0:
			effects.remove_at(i)
			continue
		var start := 0 if fx.kind == "cyan" else (4 if fx.kind == "magenta" else 8)
		var frame := start + mini(3, int(p * 4.0))
		if tex_fx != null:
			_draw_frame(tex_fx, frame, fx.x, fx.y, fx.size * (0.75 + p * 0.5), fx.size * (0.75 + p * 0.5), (1.0 - p) * 0.85)
		else:
			var col: Color = Color("#61e8ff") if fx.kind == "cyan" else (Color("#ff64d8") if fx.kind == "magenta" else Color("#ffe58a"))
			col.a = (1.0 - p) * 0.85
			draw_circle(_to_screen(fx.x, fx.y), fx.size * (0.75 + p * 0.5) * 0.5 * _scale(), col)
	var fnt: Font = _font if _font != null else ThemeDB.fallback_font
	for i in range(popups.size() - 1, -1, -1):
		var pp: Dictionary = popups[i]
		pp.t += dt
		var p2: float = pp.t / pp.duration
		if p2 >= 1.0:
			popups.remove_at(i)
			continue
		var pos := _to_screen(pp.x, pp.y - p2 * 42.0)
		var col := Color(pp.color, minf(1.0, (1.0 - p2) * 1.8))
		draw_string(fnt, pos + Vector2(1, 1), pp.text, HORIZONTAL_ALIGNMENT_CENTER, -1, 13, Color(0, 0, 0, col.a))
		draw_string(fnt, pos, pp.text, HORIZONTAL_ALIGNMENT_CENTER, -1, 13, col)

func _draw_display() -> void:
	var o := _origin()
	var s := _scale()
	var box := Rect2(o + Vector2(304.0, 10.0) * s, Vector2(414.0, 68.0) * s)
	draw_rect(box, Color(0, 0, 0, 0.28))
	var fnt: Font = _font if _font != null else ThemeDB.fallback_font
	var col := Color("#ff665f") if game.challenge != null else Color("#ffd166")
	var c := box.position + Vector2(box.size.x / 2.0, 30.0 * s)
	draw_string(fnt, c, "%08d" % game.score, HORIZONTAL_ALIGNMENT_CENTER, -1, int(24.0 * s * 2.2), col)
	var mission: Dictionary = game.mission_info()
	var right := "%.1f S" % maxf(0.0, mission.time) if game.challenge != null else "×%d" % PB.MULTIPLIERS[game.multiplier_index]
	var line := "S%02d · B%d · %s · %d/%d" % [game.sector, game.stock, right, mission.progress, mission.target]
	draw_string(fnt, c + Vector2(0, 22.0 * s * 1.2), line, HORIZONTAL_ALIGNMENT_CENTER, -1, int(10.0 * s * 2.2), Color("#d9efff"))
	if _t < message_until and message != "":
		var mp := Vector2(240.0, box.position.y + box.size.y + 26.0)
		draw_string(fnt, mp, message, HORIZONTAL_ALIGNMENT_CENTER, -1, 13, Color("#ffe58a"))

## ------------------------------------------------------- rendu de secours
## Les 26 fichiers officiels du flipper ont été retirés du dépôt par l'auteur
## (404 site + .gitkeep au commit ccd7e82). Ce dessin vectoriel reproduit les
## géométries exactes du moteur (mêmes colliders) ; si les PNG officiels sont
## remis dans assets/pinball/, ce code reste inactif (tex_table non nulle).
func _draw_table_fallback() -> void:
	var s := _scale()
	var o := _origin()
	draw_rect(Rect2(o, Vector2(PB.WIDTH, PB.HEIGHT) * s), Color("#07131f"))
	draw_rect(Rect2(o, Vector2(PB.WIDTH, PB.HEIGHT) * s), Color("#0c2236"), false, 2.0 * s)
	# parois : les colliders exacts du moteur
	for w in PB.WALLS:
		draw_line(_to_screen(w.x1, w.y1), _to_screen(w.x2, w.y2), Color("#9fd8ff"), 7.0 * s)
		draw_line(_to_screen(w.x1, w.y1), _to_screen(w.x2, w.y2), Color("#38e0ff"), 3.0 * s)
	# slingshots
	for sl in PB.SLINGSHOTS:
		var seg: Dictionary = sl.seg
		draw_line(_to_screen(seg.x1, seg.y1), _to_screen(seg.x2, seg.y2), Color("#ff64d8"), 9.0 * s)
	# rampes : couloirs en trait large translucide + pulsations gérées par _draw_inserts
	for side in ["left", "right"]:
		var ramp: Dictionary = PB.RAMPS[side]
		var pts: Array = ramp.points
		var rail: Color = Color("#61e8ff") if side == "left" else Color("#ff64d8")
		for i in range(1, pts.size()):
			var a: Array = pts[i - 1]
			var b: Array = pts[i]
			draw_line(_to_screen(a[0], a[1]), _to_screen(b[0], b[1]), Color(rail, 0.22), 44.0 * s)
	# réacteur (anneau central)
	draw_arc(_to_screen(PB.REACTOR.x, PB.REACTOR.y), PB.REACTOR.r * s, 0, TAU, 40, Color("#ff334f"), 4.0 * s)
	draw_arc(_to_screen(PB.REACTOR.x, PB.REACTOR.y), (PB.REACTOR.r - 12.0) * s, 0, TAU, 32, Color("#ff8a5c"), 2.0 * s)
	# insertions du haut (filet des rampes) et coulisse du lance-bille
	draw_rect(Rect2(_to_screen(908.0, 1266.0), Vector2(60.0, 232.0) * s), Color(0, 0, 0, 0.35))
	draw_line(_to_screen(938.0, 1266.0), _to_screen(938.0, 1498.0), Color("#ffd36c"), 2.0 * s)
