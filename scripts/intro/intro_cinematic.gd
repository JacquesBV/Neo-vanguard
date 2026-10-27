extends Control
class_name NVIntroCinematic
## =========================================================================
## NVIntroCinematic — Réalisateur de la cinématique d'ouverture animée
## style Manga / Anime commercial Steam pour NEO VANGUARD (Godot 4.7).
##
## Utilise exclusivement les 10 planches originales de la séquence et les
## modèles de personnages officiels, cadrés dans la fenêtre scénique dédiée
## (y = 48..640, 480×592) au-dessus d'un pupitre manga compact (y = 640..860) :
## - Aucune superposition redondante (jamais de vaisseau en biais collé sur
##   une planche contenant déjà le Vanguard, jamais de double Vorax/Vesta/Pilote).
## - Ancrage et clipping stricts (clip_contents = true) : aucun corps coupé
##   de Vesta ou Vorax ne flotte jamais dans le vide.
## - Mouvements de caméra continus et fondus de poses à sens unique (zéro
##   boucle répétitive, zéro rebond sinusoïdal).
## =========================================================================

var on_done: Callable = Callable()

## Propriétés de compatibilité avec le banc de test automatisé (main.gd NV_TEST)
var pages: Array = []
var page_i: int = 0
var art: TextureRect = null

## Horloge cinématique & synchronisation musicale 134 BPM
var _t: float = 0.0
var _cue_idx: int = 0
var _finished: bool = false
var _music_synced: bool = false
var _slash_flash: float = 0.0
var _shake_amp: float = 0.0
var _last_world_idx: int = -1
var _seek_lock_timer: float = 0.35
var _input_guard: float = 0.22

## Calques & conteneurs strictement clippés
var _stage_canvas: Control

var _vorax_stage_clip: Control
var _vorax_stage_rect: TextureRect
var _vorax_mat: ShaderMaterial

var _vesta_stage_clip: Control
var _vesta_stage_canvas: Control
var _vesta_mat: ShaderMaterial

var _world_holder: Control
var _world_canvas: Control
var _world_console_canvas: Control
var _world_mat: ShaderMaterial

var _cutin_top_clip: Control
var _cutin_top_canvas: Control
var _cutin_top_vorax: TextureRect

var _cutin_mid_clip: Control
var _cutin_mid_canvas: Control

var _cutin_bot_left_clip: Control
var _cutin_bot_left_canvas: Control
var _cutin_bot_right_clip: Control
var _cutin_bot_right_canvas: Control

var _corner_clip: Control
var _corner_canvas: Control

var _fx_rect: ColorRect
var _fx_mat: ShaderMaterial
var _hud_canvas: Control

## Pool de lecteurs SFX stéréo 44.1 kHz dédiés (sans voix IA)
var _sfx_pool: Array[AudioStreamPlayer] = []
var _sfx_cursor: int = 0

const SKIP_RECT := Rect2(364.0, 11.0, 102.0, 28.0)
const NEXT_RECT := Rect2(336.0, 820.0, 130.0, 28.0)
const TOP_BAR_H := 48.0
const DIALOGUE_TOP_Y := 640.0
const STAGE_H := DIALOGUE_TOP_Y - TOP_BAR_H   # 592.0 px

var _particles: Array[Dictionary] = []

func _init() -> void:
	_rebuild_compat_pages()

func setup(done_cb: Callable) -> void:
	on_done = done_cb
	_rebuild_compat_pages()

func _is_en() -> bool:
	if Save != null and "S" in Save and Save.S.has("opts"):
		return str(Save.S.opts.get("lang", "fr")) == "en"
	return false

func _rebuild_compat_pages() -> void:
	pages.clear()
	var en := _is_en()
	for sc in NVIntroData.SCENES:
		var lines: Array = sc.lines_en if en else sc.lines_fr
		pages.append({
			"kicker": sc.kicker_en if en else sc.kicker_fr,
			"title": sc.speaker_en if en else sc.speaker_fr,
			"body": "\n".join(lines),
			"img": sc.img,
		})

func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	size = Vector2(Data.W, Data.H)
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR

	_rebuild_compat_pages()
	_init_particles()
	_build_layers()
	_build_sfx_pool()
	_start_soundtrack()
	_sync_scene_index()
	_trigger_due_cues()
	_update_visual_state()

func _init_particles() -> void:
	_particles.clear()
	var rng := RandomNumberGenerator.new()
	rng.seed = 20260824
	for i in range(32):
		_particles.append({
			"x": rng.randf_range(0.0, float(Data.W)),
			"y": rng.randf_range(TOP_BAR_H, DIALOGUE_TOP_Y),
			"spd": rng.randf_range(16.0, 42.0),
			"sz": rng.randf_range(1.1, 2.4),
			"ph": rng.randf_range(0.0, TAU),
		})

func _make_clipped_box(rect: Rect2) -> Control:
	var c := Control.new()
	c.position = rect.position
	c.size = rect.size
	c.clip_contents = true
	c.visible = false
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(c)
	return c

func _build_layers() -> void:
	var bg := ColorRect.new()
	bg.color = Color("#04060e")
	bg.set_anchors_preset(PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	art = TextureRect.new()
	art.visible = false
	art.mouse_filter = Control.MOUSE_FILTER_IGNORE
	art.texture = NVIntroAssets.tex(NVIntroData.SCENES[0].img)
	add_child(art)

	# 1. Scène principale cadrée dans la fenêtre scénique (y = 48..640)
	_stage_canvas = Control.new()
	_stage_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_stage_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_stage_canvas.draw.connect(_draw_stage)
	add_child(_stage_canvas)

	# 2. Gros plan Vorax ancré sous DIALOGUE_TOP_Y (Scène 2B : zéro coupe bassin visible)
	var sh_vorax := NVIntroAssets.shader("res://assets/intro/shaders/vorax_glitch.gdshader")
	if sh_vorax != null:
		_vorax_mat = ShaderMaterial.new()
		_vorax_mat.shader = sh_vorax

	_vorax_stage_clip = _make_clipped_box(Rect2(0.0, TOP_BAR_H, float(Data.W), STAGE_H))
	_vorax_stage_rect = TextureRect.new()
	_vorax_stage_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_vorax_stage_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_vorax_stage_rect.texture = NVIntroAssets.tex("res://assets/intro/characters/vorax/vorax_mecha.png")
	_vorax_stage_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if _vorax_mat != null:
		_vorax_stage_rect.material = _vorax_mat
	_vorax_stage_clip.add_child(_vorax_stage_rect)

	# 3. Gros plan Vesta ancré sous DIALOGUE_TOP_Y (Scène 4B : fondus doux 02 -> 06 -> 05)
	var sh_vesta := NVIntroAssets.shader("res://assets/intro/shaders/hologram_vesta.gdshader")
	if sh_vesta != null:
		_vesta_mat = ShaderMaterial.new()
		_vesta_mat.shader = sh_vesta

	_vesta_stage_clip = _make_clipped_box(Rect2(0.0, TOP_BAR_H, float(Data.W), STAGE_H))
	_vesta_stage_canvas = Control.new()
	_vesta_stage_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_vesta_stage_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if _vesta_mat != null:
		_vesta_stage_canvas.material = _vesta_mat
	_vesta_stage_canvas.draw.connect(_draw_vesta_closeup)
	_vesta_stage_clip.add_child(_vesta_stage_canvas)

	# 4. Acte III : Viewport animé des 8 Mondes / 5 Familles Technologiques
	#    _world_canvas porte le shader d'ambiance technologique sur le fond spatial,
	#    tandis que _world_console_canvas affiche au-dessus les 8 consoles canoniques
	#    dans leurs vraies couleurs exactes validées (zéro recoloration de coque).
	_world_holder = _make_clipped_box(Rect2(22.0, 118.0, 436.0, 340.0))
	_world_canvas = Control.new()
	_world_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_world_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh_world := NVIntroAssets.shader("res://assets/intro/shaders/world_era_card.gdshader")
	if sh_world != null:
		_world_mat = ShaderMaterial.new()
		_world_mat.shader = sh_world
		_world_canvas.material = _world_mat
	_world_canvas.draw.connect(_draw_world_viewport)
	_world_holder.add_child(_world_canvas)

	_world_console_canvas = Control.new()
	_world_console_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_world_console_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_world_console_canvas.draw.connect(_draw_world_console)
	_world_holder.add_child(_world_console_canvas)

	# 5. Cases Manga strictement clippées (Scènes 6 & 7)
	_cutin_top_clip = _make_clipped_box(Rect2(18.0, 56.0, 444.0, 188.0))
	_cutin_top_canvas = Control.new()
	_cutin_top_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_cutin_top_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cutin_top_canvas.draw.connect(_draw_cutin_top)
	_cutin_top_clip.add_child(_cutin_top_canvas)

	_cutin_top_vorax = TextureRect.new()
	_cutin_top_vorax.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_cutin_top_vorax.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_cutin_top_vorax.texture = NVIntroAssets.tex("res://assets/intro/characters/vorax/vorax_mecha.png")
	_cutin_top_vorax.visible = false
	_cutin_top_vorax.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if _vorax_mat != null:
		_cutin_top_vorax.material = _vorax_mat
	_cutin_top_clip.add_child(_cutin_top_vorax)

	_cutin_mid_clip = _make_clipped_box(Rect2(18.0, 254.0, 444.0, 174.0))
	_cutin_mid_canvas = Control.new()
	_cutin_mid_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_cutin_mid_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cutin_mid_canvas.draw.connect(_draw_cutin_mid)
	_cutin_mid_clip.add_child(_cutin_mid_canvas)

	_cutin_bot_left_clip = _make_clipped_box(Rect2(18.0, 438.0, 217.0, 190.0))
	_cutin_bot_left_canvas = Control.new()
	_cutin_bot_left_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_cutin_bot_left_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cutin_bot_left_canvas.draw.connect(_draw_cutin_bot_left)
	_cutin_bot_left_clip.add_child(_cutin_bot_left_canvas)

	_cutin_bot_right_clip = _make_clipped_box(Rect2(245.0, 438.0, 217.0, 190.0))
	_cutin_bot_right_canvas = Control.new()
	_cutin_bot_right_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_cutin_bot_right_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cutin_bot_right_canvas.draw.connect(_draw_cutin_bot_right)
	_cutin_bot_right_clip.add_child(_cutin_bot_right_canvas)

	# 6. Encart Manga clippé en haut à gauche pour Vesta (Scène 8 : dégage 100 % du vaisseau et de Vorax)
	_corner_clip = _make_clipped_box(Rect2(18.0, 58.0, 174.0, 128.0))
	_corner_canvas = Control.new()
	_corner_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_corner_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_corner_canvas.draw.connect(_draw_corner_cutin)
	_corner_clip.add_child(_corner_canvas)

	# 7. Post-traitement Manga FX plein écran
	_fx_rect = ColorRect.new()
	_fx_rect.set_anchors_preset(PRESET_FULL_RECT)
	_fx_rect.color = Color(1, 1, 1, 0)
	_fx_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh_fx := NVIntroAssets.shader("res://assets/intro/shaders/manga_fx.gdshader")
	if sh_fx != null:
		_fx_mat = ShaderMaterial.new()
		_fx_mat.shader = sh_fx
		_fx_rect.material = _fx_mat
	add_child(_fx_rect)

	# 8. Bordures d'encrage Manga, HUD 8 Mondes, Dialogues & Emblème Final
	_hud_canvas = Control.new()
	_hud_canvas.set_anchors_preset(PRESET_FULL_RECT)
	_hud_canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud_canvas.draw.connect(_draw_hud)
	add_child(_hud_canvas)

func _build_sfx_pool() -> void:
	for i in range(6):
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_sfx_pool.append(p)

func _play_intro_sfx(sfx_name: String, rel_db: float = 0.0) -> void:
	if Save != null and "S" in Save and Save.S.has("opts"):
		if not bool(Save.S.opts.get("sfx_on", true)):
			return
	var stream := NVIntroAssets.sfx(sfx_name)
	if stream == null or _sfx_pool.is_empty():
		return
	var vol_lin := 0.85
	if Save != null and "S" in Save and Save.S.has("opts"):
		vol_lin = clampf(float(Save.S.opts.get("sfx_vol", 0.8)), 0.0, 1.0)
	if vol_lin <= 0.001:
		return
	var p := _sfx_pool[_sfx_cursor % _sfx_pool.size()]
	_sfx_cursor += 1
	p.stop()
	p.stream = stream
	p.volume_db = linear_to_db(vol_lin) + rel_db
	p.play()

func _start_soundtrack() -> void:
	_seek_lock_timer = 0.35
	if Audio2 == null:
		return
	if Audio2.has_method("restart_track"):
		Audio2.restart_track("title", true)
		_music_synced = true
	else:
		if Audio2.music_player != null:
			Audio2.music_player.stop()
		if Audio2.has_method("play_track"):
			Audio2.play_track("title", true)
		if Audio2.music_player != null and Audio2.music_player.playing:
			Audio2.music_player.seek(0.0)
			_music_synced = true

func _process(delta: float) -> void:
	if _finished:
		return
	var dt := clampf(delta, 0.0, 0.05)
	_seek_lock_timer = maxf(0.0, _seek_lock_timer - dt)
	_input_guard = maxf(0.0, _input_guard - dt)

	if _seek_lock_timer <= 0.0 and Audio2 != null and Audio2.music_player != null and Audio2.music_player.playing and Audio2.current_track == "title":
		var mp_pos := Audio2.music_player.get_playback_position() + AudioServer.get_time_since_last_mix()
		if mp_pos >= 0.0 and mp_pos < NVIntroData.TOTAL_DURATION + 1.0 and absf(mp_pos - _t) <= 0.70:
			if absf(mp_pos - _t) > 0.22 and _music_synced:
				_t = lerpf(_t + dt, mp_pos, 0.35)
			else:
				_t = maxf(_t, mp_pos) if mp_pos > _t - 0.08 else (_t + dt)
			_music_synced = true
		else:
			_t += dt
	else:
		_t += dt

	_slash_flash = maxf(0.0, _slash_flash - dt * 3.8)
	_shake_amp = maxf(0.0, _shake_amp - dt * 18.0)
	_update_particles(dt)
	_sync_scene_index()
	_trigger_due_cues()
	_update_visual_state()

	if _t >= NVIntroData.TOTAL_DURATION:
		_finish()
		return

	_stage_canvas.queue_redraw()
	if _vesta_stage_clip.visible:
		_vesta_stage_canvas.queue_redraw()
	if _world_holder.visible:
		_world_canvas.queue_redraw()
		_world_console_canvas.queue_redraw()
	if _cutin_top_clip.visible:
		_cutin_top_canvas.queue_redraw()
	if _cutin_mid_clip.visible:
		_cutin_mid_canvas.queue_redraw()
	if _cutin_bot_left_clip.visible:
		_cutin_bot_left_canvas.queue_redraw()
		_cutin_bot_right_canvas.queue_redraw()
	if _corner_clip.visible:
		_corner_canvas.queue_redraw()
	_hud_canvas.queue_redraw()

func _update_particles(dt: float) -> void:
	var spd_mul := 3.2 if page_i >= 7 else 0.7
	for p in _particles:
		p.y -= float(p.spd) * spd_mul * dt
		if float(p.y) < TOP_BAR_H:
			p.y = DIALOGUE_TOP_Y - 2.0
			p.x = fposmod(float(p.x) + 173.0, float(Data.W))

func _sync_scene_index() -> void:
	var new_idx := 0
	for i in range(NVIntroData.SCENES.size()):
		if _t >= float(NVIntroData.SCENES[i].t0):
			new_idx = i
	if new_idx != page_i:
		page_i = new_idx
		_slash_flash = 0.65
		_shake_amp = 4.0 if page_i in [1, 5, 7, 8] else 0.0
		if art != null:
			art.texture = NVIntroAssets.tex(NVIntroData.SCENES[page_i].img)

func _trigger_due_cues() -> void:
	while _cue_idx < NVIntroData.SFX_CUES.size():
		var cue: Dictionary = NVIntroData.SFX_CUES[_cue_idx]
		if _t + 0.015 < float(cue.t):
			break
		_play_intro_sfx(str(cue.sfx), float(cue.get("vol_db", 0.0)))
		if str(cue.sfx) in ["sfx_catapult_launch", "sfx_logo_impact"]:
			_slash_flash = 1.0
			_shake_amp = 7.0
		elif str(cue.sfx) == "sfx_vorax_dread_horn":
			_shake_amp = 4.5
		_cue_idx += 1

func _beat_pulse() -> float:
	var beat_pos := fposmod(_t / NVIntroData.BEAT, 1.0)
	return pow(1.0 - beat_pos, 2.4)

func _scene_u() -> float:
	var sc: Dictionary = NVIntroData.SCENES[page_i]
	return clampf((_t - float(sc.t0)) / maxf(0.01, float(sc.t1) - float(sc.t0)), 0.0, 1.0)

func _current_world_index() -> int:
	var sc: Dictionary = NVIntroData.SCENES[4]
	var u := clampf((_t - float(sc.t0)) / maxf(0.01, float(sc.t1) - float(sc.t0)), 0.0, 0.9999)
	return clampi(int(floor(u * 8.0)), 0, 7)

func _current_world_local_u() -> float:
	var sc: Dictionary = NVIntroData.SCENES[4]
	var u := clampf((_t - float(sc.t0)) / maxf(0.01, float(sc.t1) - float(sc.t0)), 0.0, 0.9999)
	return fposmod(u * 8.0, 1.0)

func _shake_offset() -> Vector2:
	if _shake_amp <= 0.05:
		return Vector2.ZERO
	return Vector2(sin(_t * 61.0) * _shake_amp, cos(_t * 47.0) * _shake_amp * 0.7)

## =========================================================================
## PILOTAGE DES CONTENEURS CLIPPÉS & UNIFORMS SHADERS
## =========================================================================
func _update_visual_state() -> void:
	var pulse := _beat_pulse()
	var sc_u := _scene_u()

	_vorax_stage_clip.visible = false
	_vesta_stage_clip.visible = false
	_world_holder.visible = false
	_cutin_top_clip.visible = false
	_cutin_top_vorax.visible = false
	_cutin_mid_clip.visible = false
	_cutin_bot_left_clip.visible = false
	_cutin_bot_right_clip.visible = false
	_corner_clip.visible = false

	# Scène 2 (index 1) Plan B (52%..100%) : Gros plan massif de Vorax, bas verrouillé SOUS DIALOGUE_TOP_Y !
	if page_i == 1 and sc_u >= 0.52:
		_vorax_stage_clip.visible = true
		var sub_u := (sc_u - 0.52) / 0.48
		var vw := lerpf(656.0, 694.0, ease(sub_u, 0.65))
		var vh := vw * (927.0 / 1200.0)
		var vy := (STAGE_H + 22.0) - vh * 0.929
		_vorax_stage_rect.size = Vector2(vw, vh)
		_vorax_stage_rect.position = Vector2((float(Data.W) - vw) * 0.5, vy)
		if _vorax_mat != null:
			_vorax_mat.set_shader_parameter("time_sec", _t)
			_vorax_mat.set_shader_parameter("glitch_amount", 0.24 + 0.22 * pulse)
			_vorax_mat.set_shader_parameter("voice_amp", 0.35 * pulse)
			_vorax_mat.set_shader_parameter("crimson_pulse", 0.55)

	# Scène 4 (index 3) Plan B (46%..100%) : Gros plan Vesta ancré SOUS DIALOGUE_TOP_Y !
	if page_i == 3 and sc_u >= 0.46:
		_vesta_stage_clip.visible = true
		var sub_u3 := (sc_u - 0.46) / 0.54
		if _vesta_mat != null:
			_vesta_mat.set_shader_parameter("time_sec", _t)
			_vesta_mat.set_shader_parameter("materialize", clampf(sub_u3 * 3.5, 0.0, 1.0))
			_vesta_mat.set_shader_parameter("holo_strength", 0.22 + 0.10 * pulse)
			_vesta_mat.set_shader_parameter("voice_amp", 0.25 * pulse)
			_vesta_mat.set_shader_parameter("tint_glow", Color(0.56, 0.78, 1.0, 1.0))

	# Scène 5 (index 4) : Les 8 Mondes / 5 Familles Technologiques
	if page_i == 4:
		var w_idx := _current_world_index()
		if w_idx != _last_world_idx:
			_last_world_idx = w_idx
			_slash_flash = maxf(_slash_flash, 0.30)
		var w_info: Dictionary = NVIntroData.WORLDS[w_idx]
		var fam: Dictionary = NVIntroData.TECH_FAMILIES[int(w_info.family_idx)]
		_world_holder.visible = true
		if _world_mat != null:
			_world_mat.set_shader_parameter("family_mode", int(fam.shader_mode))
			_world_mat.set_shader_parameter("time_sec", _t)
			_world_mat.set_shader_parameter("effect_mix", 0.30)
			_world_mat.set_shader_parameter("world_accent", Color(str(w_info.color)))
	else:
		_last_world_idx = -1

	# Scène 6 (index 5) : Confrontation Manga en 3 cases strictement clippées
	if page_i == 5:
		_cutin_top_clip.position = Vector2(18.0, 56.0)
		_cutin_top_clip.size = Vector2(444.0, 188.0)
		_cutin_top_clip.visible = true
		_cutin_top_vorax.visible = true
		var vw5 := lerpf(404.0, 428.0, sc_u)
		var vh5 := vw5 * (927.0 / 1200.0)
		_cutin_top_vorax.size = Vector2(vw5, vh5)
		_cutin_top_vorax.position = Vector2((444.0 - vw5) * 0.5, -8.0)
		if _vorax_mat != null:
			_vorax_mat.set_shader_parameter("time_sec", _t)
			_vorax_mat.set_shader_parameter("glitch_amount", 0.30 + 0.22 * pulse)
			_vorax_mat.set_shader_parameter("voice_amp", 0.40 * pulse)
			_vorax_mat.set_shader_parameter("crimson_pulse", 0.60)

		_cutin_mid_clip.position = Vector2(18.0, 254.0)
		_cutin_mid_clip.size = Vector2(444.0, 174.0)
		_cutin_mid_clip.visible = true

		_cutin_bot_left_clip.visible = true
		_cutin_bot_right_clip.visible = true

	# Scène 7 (index 6) : Serment du Pilote + Mise à feu sur rampe (2 cases clippées)
	if page_i == 6:
		_cutin_top_clip.position = Vector2(18.0, 56.0)
		_cutin_top_clip.size = Vector2(444.0, 184.0)
		_cutin_top_clip.visible = true
		_cutin_top_vorax.visible = false

		_cutin_mid_clip.position = Vector2(18.0, 250.0)
		_cutin_mid_clip.size = Vector2(444.0, 378.0)
		_cutin_mid_clip.visible = true

	# Scène 8 (index 7) : Encart manga clippé en haut à gauche de Vesta pendant la percée orbitale
	if page_i == 7:
		_corner_clip.visible = true

	# Post-FX Manga plein écran
	if _fx_mat != null:
		var speed_int := 0.0
		var speed_col := Color(0.35, 0.85, 1.0, 1.0)
		var diag_mode := 0.0
		var impact := _slash_flash * 0.16
		var imp_col := Color(0.88, 0.96, 1.0, 1.0)

		match page_i:
			0:
				speed_int = 0.04
			1:
				speed_int = 0.26 + 0.14 * pulse
				speed_col = Color(1.0, 0.22, 0.32, 1.0)
			2:
				speed_int = 0.08
			3:
				speed_int = 0.12 + 0.08 * pulse
				speed_col = Color(0.68, 0.55, 1.0, 1.0)
			4:
				speed_int = 0.14 + 0.10 * pulse
				speed_col = Color(str(NVIntroData.WORLDS[_current_world_index()].color))
			5:
				speed_int = 0.38 + 0.16 * pulse
				speed_col = Color(1.0, 0.34, 0.48, 1.0)
				diag_mode = 0.65
			6:
				speed_int = lerpf(0.18, 0.52, sc_u)
				speed_col = Color(0.28, 0.82, 1.0, 1.0)
			7:
				speed_int = 0.60 + 0.16 * pulse
				speed_col = Color(0.45, 0.94, 1.0, 1.0)
				diag_mode = 0.78
				if _t >= 56.42 and _t < 56.60:
					impact = maxf(impact, 1.0 - (_t - 56.42) / 0.18)
					imp_col = Color(1.0, 1.0, 1.0, 1.0)
			8:
				speed_int = 0.28 + 0.12 * pulse
				speed_col = Color(1.0, 0.84, 0.42, 1.0)
				if _t >= 63.58 and _t < 63.74:
					impact = maxf(impact, (1.0 - (_t - 63.58) / 0.16) * 0.80)
					imp_col = Color(1.0, 0.92, 0.58, 1.0)

		_fx_mat.set_shader_parameter("time_sec", _t)
		_fx_mat.set_shader_parameter("speed_intensity", speed_int)
		_fx_mat.set_shader_parameter("diagonal_mode", diag_mode)
		_fx_mat.set_shader_parameter("diagonal_angle", -0.58)
		_fx_mat.set_shader_parameter("speed_color", speed_col)
		_fx_mat.set_shader_parameter("halftone_amount", 0.16)
		_fx_mat.set_shader_parameter("vignette_strength", 0.40)
		_fx_mat.set_shader_parameter("impact_flash", impact)
		_fx_mat.set_shader_parameter("impact_color", imp_col)

## =========================================================================
## CAMÉRA COVER & SÉQUENCES DE POSES À SENS UNIQUE (ZÉRO BOUCLE RÉPÉTITIVE)
## =========================================================================
func _draw_cover_tex(canvas: Control, box: Rect2, tex: Texture2D, zoom: float, pan: Vector2, mod_col := Color.WHITE) -> void:
	if tex == null:
		return
	var tsz := tex.get_size()
	if tsz.x <= 1.0 or tsz.y <= 1.0:
		return
	var box_aspect := box.size.x / maxf(1.0, box.size.y)
	var tex_aspect := tsz.x / tsz.y
	var uv_span := Vector2.ONE
	if box_aspect > tex_aspect:
		uv_span.y = tex_aspect / box_aspect
	else:
		uv_span.x = box_aspect / tex_aspect
	uv_span /= maxf(1.0, zoom)
	var center := Vector2(0.5, 0.5) + pan
	var uv0 := Vector2(
		clampf(center.x - uv_span.x * 0.5, 0.002, 0.998 - uv_span.x),
		clampf(center.y - uv_span.y * 0.5, 0.002, 0.998 - uv_span.y)
	)
	canvas.draw_texture_rect_region(tex, box, Rect2(uv0 * tsz, uv_span * tsz), mod_col)

func _draw_pose_sequence(canvas: Control, rect: Rect2, prefix: String, keyframes: Array, u: float, fade_span: float = 0.10) -> void:
	var idx_a := int(keyframes[0][1])
	var idx_b := idx_a
	var blend := 0.0
	for i in range(1, keyframes.size()):
		var trig := float(keyframes[i][0])
		if u >= trig:
			idx_a = int(keyframes[i][1])
			idx_b = idx_a
			if u < trig + fade_span:
				idx_a = int(keyframes[i - 1][1])
				idx_b = int(keyframes[i][1])
				blend = clampf((u - trig) / fade_span, 0.0, 1.0)
	var tex_a := NVIntroAssets.tex("%s%d.png" % [prefix, idx_a])
	if idx_a == idx_b or blend <= 0.001:
		if tex_a != null:
			canvas.draw_texture_rect(tex_a, rect, false)
	else:
		var tex_b := NVIntroAssets.tex("%s%d.png" % [prefix, idx_b])
		if tex_a != null:
			canvas.draw_texture_rect(tex_a, rect, false, Color(1, 1, 1, 1.0 - blend))
		if tex_b != null:
			canvas.draw_texture_rect(tex_b, rect, false, Color(1, 1, 1, blend))

## =========================================================================
## CALQUE SCÈNE PRINCIPALE (_stage_canvas) — CADRAGE DANS STAGE_BOX (48..640)
## =========================================================================
func _draw_stage() -> void:
	var sc_u := _scene_u()
	var shk := _shake_offset()
	var stage_box := Rect2(Vector2(0.0, TOP_BAR_H) + shk, Vector2(Data.W, STAGE_H))

	match page_i:
		0:
			# Scène 1 : Terre sous l'éclipse de Vorax (descente caméra de l'anneau rouge vers la Terre)
			var tex0 := NVIntroAssets.tex("res://assets/intro/panels/panel_01_terre_eclipse.png")
			_draw_cover_tex(_stage_canvas, stage_box, tex0, lerpf(1.02, 1.10, sc_u), Vector2(lerpf(-0.015, 0.015, sc_u), lerpf(-0.10, 0.08, sc_u)))
		1:
			# Scène 2 : Plan A Vorax en pied (couronne -> orbe broyé), puis Plan B gros plan Vorax ancré
			if sc_u < 0.52:
				var u_a := sc_u / 0.52
				var tex1 := NVIntroAssets.tex("res://assets/intro/panels/panel_02_vorax_citadelle.png")
				_draw_cover_tex(_stage_canvas, stage_box, tex1, lerpf(1.00, 1.08, u_a), Vector2(0.0, lerpf(-0.14, 0.08, u_a)))
			else:
				_stage_canvas.draw_rect(Rect2(0, 0, Data.W, Data.H), Color("#110308"), true)
				var p10 := NVIntroAssets.tex("res://assets/intro/panels/panel_10_clash_energie.png")
				_draw_cover_tex(_stage_canvas, stage_box, p10, 1.30, Vector2(-0.14, -0.16), Color(0.52, 0.14, 0.20))
		2:
			# Scène 3 : Plan A réveil progressif dans le siège (01->02->04->05), puis Plan B gros plan frontal panel_04
			if sc_u < 0.56:
				var u_p := sc_u / 0.56
				var ck := NVIntroAssets.tex("res://assets/intro/bg/cockpit_orbital_wide.png")
				_draw_cover_tex(_stage_canvas, stage_box, ck, 1.08, Vector2(lerpf(-0.025, 0.02, u_p), 0.0), Color(0.48, 0.56, 0.78))
				var p_sz := lerpf(548.0, 568.0, u_p)
				var py := TOP_BAR_H + (STAGE_H + 92.0) - p_sz * (463.0 / 480.0)
				_draw_pose_sequence(_stage_canvas, Rect2(Vector2((float(Data.W) - p_sz) * 0.5, py) + shk, Vector2(p_sz, p_sz)),
					"res://assets/intro/characters/pilot/pilot_0", [[0.00, 1], [0.26, 2], [0.54, 4], [0.78, 5]], u_p, 0.12)
			else:
				var u_b := (sc_u - 0.56) / 0.44
				var tex2b := NVIntroAssets.tex("res://assets/intro/panels/panel_04_pilote_eveil.png")
				_draw_cover_tex(_stage_canvas, stage_box, tex2b, lerpf(1.01, 1.10, u_b), Vector2(0.0, lerpf(-0.06, -0.10, u_b)))
		3:
			# Scène 4 : Plan A Vesta en pied + 8 orbes (panel_03), puis Plan B gros plan Vesta ancré
			if sc_u < 0.46:
				var u_a3 := sc_u / 0.46
				var tex3 := NVIntroAssets.tex("res://assets/intro/panels/panel_03_vesta_archive.png")
				_draw_cover_tex(_stage_canvas, stage_box, tex3, lerpf(1.00, 1.06, u_a3), Vector2(0.0, lerpf(-0.08, 0.04, u_a3)))
			else:
				var ck_p := NVIntroAssets.tex("res://assets/intro/bg/cockpit_orbital_portrait.png")
				_draw_cover_tex(_stage_canvas, stage_box, ck_p, 1.10, Vector2(0.0, -0.08), Color(0.32, 0.38, 0.62))
		4:
			# Scène 5 : Fond constellation assombri derrière le viewport animé des 8 Mondes
			var tex4 := NVIntroAssets.tex("res://assets/intro/panels/panel_09_huit_mondes_constellation.png")
			_draw_cover_tex(_stage_canvas, stage_box, tex4, 1.04, Vector2(0.0, lerpf(0.10, -0.10, sc_u)), Color(0.24, 0.30, 0.48))
		5, 6:
			_stage_canvas.draw_rect(Rect2(0, 0, Data.W, Data.H), Color("#050813"), true)
		7:
			# Scène 8 (DROP 56.42s) : Percée à haute vitesse dans panel_05 puis panel_06 SANS vaisseau collé par-dessus !
			if sc_u < 0.50:
				var u7a := sc_u / 0.50
				var p5 := NVIntroAssets.tex("res://assets/intro/panels/panel_05_mondes_retro_evolution.png")
				_draw_cover_tex(_stage_canvas, stage_box, p5, lerpf(1.01, 1.13, u7a), Vector2(lerpf(0.015, -0.015, u7a), lerpf(-0.08, 0.06, u7a)))
			else:
				var u7b := (sc_u - 0.50) / 0.50
				var p6 := NVIntroAssets.tex("res://assets/intro/panels/panel_06_mondes_16_32_bits.png")
				_draw_cover_tex(_stage_canvas, stage_box, p6, lerpf(1.01, 1.10, u7b), Vector2(lerpf(0.01, -0.01, u7b), lerpf(0.08, -0.05, u7b)))
		8:
			# Scène 9 (CLIMAX 63.58s) : Plan plein écran portrait 480×860 intégral (panel_08, 941×1672)
			# dévoilant Vorax, les tirs lasers vers l'avant, le Vanguard entier et l'horizon terrestre !
			var tex8 := NVIntroAssets.tex("res://assets/intro/panels/panel_08_envol_final.png")
			_draw_cover_tex(_stage_canvas, Rect2(shk, Vector2(Data.W, Data.H)), tex8, lerpf(1.00, 1.018, sc_u), Vector2(0.0, lerpf(0.004, -0.004, sc_u)))

	# Particules subtiles dans l'espace scénique
	if page_i in [0, 1, 3, 7, 8]:
		var p_col := Color("#ff4055") if page_i == 1 else (Color("#ffd166") if page_i == 8 else Color("#7fe6ff"))
		var max_py := 804.0 if page_i == 8 else DIALOGUE_TOP_Y
		for p in _particles:
			var pos := Vector2(float(p.x), float(p.y))
			if pos.y < TOP_BAR_H or pos.y >= max_py:
				continue
			var tw := 0.28 + 0.50 * absf(sin(_t * 2.4 + float(p.ph)))
			if page_i == 7:
				_stage_canvas.draw_line(pos, pos + Vector2(0, float(p.sz) * 11.0), Color(0.65, 0.95, 1.0, tw * 0.65), 1.5, true)
			else:
				_stage_canvas.draw_circle(pos, float(p.sz), Color(p_col.r, p_col.g, p_col.b, tw * 0.42))

	# Bandeau supérieur + socle inférieur (plein écran dégagé sur l'image finale en page_i == 8)
	_stage_canvas.draw_rect(Rect2(0, 0, Data.W, TOP_BAR_H), Color(0.02, 0.03, 0.08, 0.72 if page_i == 8 else 0.80), true)
	if page_i == 8:
		_stage_canvas.draw_rect(Rect2(0, 804.0, Data.W, float(Data.H) - 804.0), Color(0.015, 0.027, 0.066, 0.90), true)
	else:
		_stage_canvas.draw_rect(Rect2(0, DIALOGUE_TOP_Y, Data.W, float(Data.H) - DIALOGUE_TOP_Y), Color("#040711"), true)

func _draw_vesta_closeup() -> void:
	var sc_u := _scene_u()
	var sub_u := clampf((sc_u - 0.46) / 0.54, 0.0, 1.0)
	var vsz := lerpf(556.0, 580.0, sub_u)
	var vy := (STAGE_H + 24.0) - vsz * (463.0 / 480.0)
	_draw_pose_sequence(_vesta_stage_canvas, Rect2(Vector2((float(Data.W) - vsz) * 0.5, vy), Vector2(vsz, vsz)),
		"res://assets/intro/characters/vesta/vesta_0", [[0.00, 2], [0.34, 6], [0.72, 5]], sub_u, 0.14)

func _draw_world_viewport() -> void:
	var w_idx := _current_world_index()
	var loc_u := _current_world_local_u()
	var w_info: Dictionary = NVIntroData.WORLDS[w_idx]
	var bg_p := str(w_info.bg_panel)
	var tex := NVIntroAssets.tex(bg_p)
	var z_arr: Array = w_info.cam_zoom
	var p0: Array = w_info.cam_pan0
	var p1: Array = w_info.cam_pan1
	var zoom := lerpf(float(z_arr[0]), float(z_arr[1]), loc_u)
	var pan := Vector2(lerpf(float(p0[0]), float(p1[0]), loc_u), lerpf(float(p0[1]), float(p1[1]), loc_u))
	var bg_tint := Color(0.18, 0.22, 0.34) if bg_p.ends_with("panel_09_huit_mondes_constellation.png") else Color(0.28, 0.34, 0.48)
	_draw_cover_tex(_world_canvas, Rect2(Vector2.ZERO, _world_holder.size), tex, zoom, pan, bg_tint)

func _draw_ellipse_outline(canvas: Control, center: Vector2, rx: float, ry: float, col: Color, width: float = 1.6) -> void:
	var pts := PackedVector2Array()
	for i in range(41):
		var a := float(i) * TAU / 40.0
		pts.append(center + Vector2(cos(a) * rx, sin(a) * ry))
	canvas.draw_polyline(pts, col, width, true)

func _draw_world_console() -> void:
	var w_idx := _current_world_index()
	var loc_u := _current_world_local_u()
	var w_info: Dictionary = NVIntroData.WORLDS[w_idx]
	var en := _is_en()
	var font := ThemeDB.fallback_font
	var w_col := Color(str(w_info.color))
	var w_acc := Color(str(w_info.accent))
	var pulse := _beat_pulse()
	var box_sz := _world_holder.size

	# Voile sombre radial léger pour détacher à 100 % les détails du matériel canonique
	_world_console_canvas.draw_rect(Rect2(Vector2.ZERO, box_sz), Color(0.02, 0.04, 0.10, 0.34), true)
	var cx := box_sz.x * 0.5
	var ped_c := Vector2(cx, 310.0)
	_world_console_canvas.draw_circle(Vector2(cx, 182.0), 120.0, Color(w_col.r, w_col.g, w_col.b, 0.12 + 0.05 * pulse))
	_draw_ellipse_outline(_world_console_canvas, ped_c, 144.0, 19.0, Color(w_col.r, w_col.g, w_col.b, 0.62), 1.8)
	_draw_ellipse_outline(_world_console_canvas, ped_c, 98.0, 12.5, Color(w_acc.r, w_acc.g, w_acc.b, 0.38), 1.2)

	# Console canonique officielle en vraies couleurs (avancée continue sans rebond + balayage laser initial)
	var holo_tex := NVIntroAssets.tex(str(w_info.get("holo", "")))
	if holo_tex != null:
		var tsz := holo_tex.get_size()
		var h_sz := lerpf(270.0, 286.0, ease(loc_u, 0.65))
		var hx := (box_sz.x - h_sz) * 0.5
		var hy := 180.0 - h_sz * 0.5
		if loc_u < 0.24 and tsz.y > 1.0:
			var scan_u := clampf(loc_u / 0.24, 0.02, 1.0)
			_world_console_canvas.draw_texture_rect(holo_tex, Rect2(Vector2(hx, hy), Vector2(h_sz, h_sz)), false, Color(w_acc.r, w_acc.g, w_acc.b, 0.20))
			_world_console_canvas.draw_texture_rect_region(
				holo_tex,
				Rect2(Vector2(hx, hy), Vector2(h_sz, h_sz * scan_u)),
				Rect2(Vector2.ZERO, Vector2(tsz.x, tsz.y * scan_u)),
				Color.WHITE
			)
			var y_scan := hy + h_sz * scan_u
			_world_console_canvas.draw_line(Vector2(hx + 14.0, y_scan), Vector2(hx + h_sz - 14.0, y_scan), Color(w_col.r, w_col.g, w_col.b, 0.85), 4.0)
			_world_console_canvas.draw_line(Vector2(hx + 22.0, y_scan), Vector2(hx + h_sz - 22.0, y_scan), Color(1.0, 1.0, 1.0, 0.95), 1.6)
		else:
			_world_console_canvas.draw_texture_rect(holo_tex, Rect2(Vector2(hx, hy), Vector2(h_sz, h_sz)), false, Color.WHITE)

	# Bandeaux techniques supérieurs d'authentification Vesta
	var rel_lbl := ("RELIC %02d/08" if en else "RELIQUE %02d/08") % (w_idx + 1)
	_world_console_canvas.draw_rect(Rect2(8.0, 8.0, 98.0, 19.0), Color(0.03, 0.06, 0.14, 0.86), true)
	_world_console_canvas.draw_rect(Rect2(8.0, 8.0, 98.0, 19.0), Color(w_col.r, w_col.g, w_col.b, 0.72), false, 1.1)
	_world_console_canvas.draw_string(font, Vector2(8.0, 21.0), rel_lbl, HORIZONTAL_ALIGNMENT_CENTER, 98.0, 9, w_acc)

	var hw_txt := str(w_info.get("hw_badge_en" if en else "hw_badge_fr", ""))
	if not hw_txt.is_empty():
		var hw_w := 232.0
		var hw_x := box_sz.x - hw_w - 8.0
		_world_console_canvas.draw_rect(Rect2(hw_x, 8.0, hw_w, 19.0), Color(0.03, 0.06, 0.14, 0.86), true)
		_world_console_canvas.draw_rect(Rect2(hw_x, 8.0, hw_w, 19.0), Color(w_col.r, w_col.g, w_col.b, 0.62), false, 1.1)
		_world_console_canvas.draw_string(font, Vector2(hw_x, 21.0), hw_txt, HORIZONTAL_ALIGNMENT_CENTER, hw_w, 9, Color(0.90, 0.96, 1.0, 0.94))

## =========================================================================
## DESSIN DES CASES MANGA STRICTEMENT CLIPPÉES (SCÈNES 6, 7 & 8)
## =========================================================================
func _draw_cutin_top() -> void:
	var box := Rect2(Vector2.ZERO, _cutin_top_clip.size)
	var sc_u := _scene_u()
	if page_i == 5:
		_cutin_top_canvas.draw_rect(box, Color("#14040a"), true)
		var p10 := NVIntroAssets.tex("res://assets/intro/panels/panel_10_clash_energie.png")
		_draw_cover_tex(_cutin_top_canvas, box, p10, 1.35, Vector2(-0.15, -0.22), Color(0.55, 0.16, 0.22))
	elif page_i == 6:
		var ck := NVIntroAssets.tex("res://assets/intro/bg/cockpit_orbital_wide.png")
		_draw_cover_tex(_cutin_top_canvas, box, ck, 1.15, Vector2(lerpf(-0.02, 0.02, sc_u), -0.05), Color(0.45, 0.56, 0.78))
		var p_sz := lerpf(350.0, 364.0, sc_u)
		var py := (box.size.y + 110.0) - p_sz * (463.0 / 480.0)
		_draw_pose_sequence(_cutin_top_canvas, Rect2(Vector2((box.size.x - p_sz) * 0.5, py), Vector2(p_sz, p_sz)),
			"res://assets/intro/characters/pilot/pilot_0", [[0.00, 8], [0.38, 7]], sc_u, 0.12)

func _draw_cutin_mid() -> void:
	var box := Rect2(Vector2.ZERO, _cutin_mid_clip.size)
	var sc_u := _scene_u()
	if page_i == 5:
		var p10 := NVIntroAssets.tex("res://assets/intro/panels/panel_10_clash_energie.png")
		_draw_cover_tex(_cutin_mid_canvas, box, p10, lerpf(1.04, 1.18, sc_u), Vector2.ZERO)
	elif page_i == 6:
		var p7 := NVIntroAssets.tex("res://assets/intro/panels/panel_07_vanguard_ignition.png")
		var vib := Vector2(sin(_t * 52.0), cos(_t * 43.0)) * clampf((_t - 53.2) * 0.75, 0.0, 2.0)
		_draw_cover_tex(_cutin_mid_canvas, Rect2(vib, box.size), p7, lerpf(1.02, 1.14, ease(sc_u, 0.65)), Vector2(0.0, lerpf(0.03, -0.03, sc_u)))

func _draw_cutin_bot_left() -> void:
	var box := Rect2(Vector2.ZERO, _cutin_bot_left_clip.size)
	var sc_u := _scene_u()
	var ck := NVIntroAssets.tex("res://assets/intro/bg/cockpit_orbital_portrait.png")
	_draw_cover_tex(_cutin_bot_left_canvas, box, ck, 1.2, Vector2(0.0, -0.15), Color(0.36, 0.42, 0.68))
	var vsz := 268.0
	var vy := (box.size.y + 64.0) - vsz * (463.0 / 480.0)
	_draw_pose_sequence(_cutin_bot_left_canvas, Rect2(Vector2((box.size.x - vsz) * 0.5, vy), Vector2(vsz, vsz)),
		"res://assets/intro/characters/vesta/vesta_0", [[0.00, 3], [0.42, 4]], sc_u, 0.14)

func _draw_cutin_bot_right() -> void:
	var box := Rect2(Vector2.ZERO, _cutin_bot_right_clip.size)
	var sc_u := _scene_u()
	var ck := NVIntroAssets.tex("res://assets/intro/bg/cockpit_orbital_wide.png")
	_draw_cover_tex(_cutin_bot_right_canvas, box, ck, 1.2, Vector2(0.0, -0.08), Color(0.40, 0.50, 0.74))
	var psz := 290.0
	var py := (box.size.y + 64.0) - psz * (463.0 / 480.0)
	_draw_pose_sequence(_cutin_bot_right_canvas, Rect2(Vector2((box.size.x - psz) * 0.5, py), Vector2(psz, psz)),
		"res://assets/intro/characters/pilot/pilot_0", [[0.00, 6], [0.45, 8]], sc_u, 0.14)

func _draw_corner_cutin() -> void:
	var box := Rect2(Vector2.ZERO, _corner_clip.size)
	var sc_u := _scene_u()
	_corner_canvas.draw_rect(box, Color("#071024"), true)
	var ck := NVIntroAssets.tex("res://assets/intro/bg/cockpit_orbital_portrait.png")
	_draw_cover_tex(_corner_canvas, box, ck, 1.25, Vector2(0.0, -0.16), Color(0.38, 0.48, 0.76))
	var vsz := 216.0
	var vy := (box.size.y + 68.0) - vsz * (463.0 / 480.0)
	_draw_pose_sequence(_corner_canvas, Rect2(Vector2((box.size.x - vsz) * 0.5, vy), Vector2(vsz, vsz)),
		"res://assets/intro/characters/vesta/vesta_0", [[0.00, 7], [0.40, 8]], sc_u, 0.14)

## =========================================================================
## CALQUE HUD, BORDURES DE CASES MANGA, 8 MONDES & PANNEAU FINAL
## =========================================================================
func _draw_hud() -> void:
	var font := ThemeDB.fallback_font
	var en := _is_en()
	var sc: Dictionary = NVIntroData.SCENES[page_i]
	var sc_u := _scene_u()
	var pulse := _beat_pulse()
	var accent := Color(str(sc.speaker_col))

	if page_i == 5:
		_draw_manga_frame(_cutin_top_clip.get_rect(), Color("#ff4055"), 2.4)
		_draw_manga_frame(_cutin_mid_clip.get_rect(), Color("#eef6ff"), 2.0)
		_draw_manga_frame(_cutin_bot_left_clip.get_rect(), Color("#c8a8ff"), 2.0)
		_draw_manga_frame(_cutin_bot_right_clip.get_rect(), Color("#5cc8ff"), 2.0)
	elif page_i == 6:
		_draw_manga_frame(_cutin_top_clip.get_rect(), Color("#ffd166"), 2.2)
		_draw_manga_frame(_cutin_mid_clip.get_rect(), Color("#4cf4ff"), 2.4)
	elif page_i == 7:
		_draw_manga_frame(_corner_clip.get_rect(), Color("#4cf4ff"), 2.2)

	# Bandeau supérieur : Kicker narratif + Bouton PASSER ⏭
	var kicker := str(sc.kicker_en if en else sc.kicker_fr)
	_hud_canvas.draw_rect(Rect2(14, 13, 4, 22), accent, true)
	_hud_canvas.draw_string(font, Vector2(25, 29), kicker, HORIZONTAL_ALIGNMENT_LEFT, 332, 11, Color(0.90, 0.96, 1.0, 0.96))

	_hud_canvas.draw_rect(SKIP_RECT, Color(0.05, 0.08, 0.16, 0.88), true)
	_hud_canvas.draw_rect(SKIP_RECT, Color(0.45, 0.78, 1.0, 0.70), false, 1.4)
	var skip_lbl := "SKIP ⏭" if en else "PASSER ⏭"
	_hud_canvas.draw_string(font, Vector2(SKIP_RECT.position.x, SKIP_RECT.position.y + 19), skip_lbl, HORIZONTAL_ALIGNMENT_CENTER, SKIP_RECT.size.x, 12, Color("#d8f3ff"))

	if page_i == 4:
		_draw_worlds_hud(font, en, pulse)

	if page_i == 8:
		_draw_title_climax_deck(font, en, sc_u, pulse)
	else:
		_draw_dialogue_box(font, en, sc, sc_u, accent, pulse)

	_draw_bottom_timeline(font, en)

	if _t < 0.26:
		var open_fade := 1.0 - clampf(_t / 0.26, 0.0, 1.0)
		_hud_canvas.draw_rect(Rect2(0.0, 0.0, float(Data.W), float(Data.H)), Color(0.0157, 0.0235, 0.0549, open_fade), true)

func _draw_manga_frame(r: Rect2, col: Color, w: float) -> void:
	_hud_canvas.draw_rect(r.grow(2.0), Color("#02040a"), false, 3.0)
	_hud_canvas.draw_rect(r, col, false, w)

func _draw_worlds_hud(font: Font, en: bool, pulse: float) -> void:
	var w_idx := _current_world_index()
	var w_info: Dictionary = NVIntroData.WORLDS[w_idx]
	var fam: Dictionary = NVIntroData.TECH_FAMILIES[int(w_info.family_idx)]
	var w_col := Color(str(w_info.color))
	var w_acc := Color(str(w_info.accent))

	var rail_y := 56.0
	var x0 := 22.0
	var total_w := 436.0
	var world_w := (total_w - 7.0 * 6.0) / 8.0
	for m in range(8):
		var mx := x0 + float(m) * (world_w + 6.0)
		var is_cur := (m == w_idx)
		var is_done := (m < w_idx)
		var mc := Color(str(NVIntroData.WORLDS[m].color))
		var bg_a := 0.36 if is_cur else (0.18 if is_done else 0.08)
		_hud_canvas.draw_rect(Rect2(mx, rail_y, world_w, 24.0), Color(mc.r, mc.g, mc.b, bg_a), true)
		_hud_canvas.draw_rect(Rect2(mx, rail_y, world_w, 24.0), mc if is_cur else Color(mc.r, mc.g, mc.b, 0.45), false, 2.0 if is_cur else 1.0)
		_hud_canvas.draw_string(font, Vector2(mx, rail_y + 13), "M%d" % (m + 1), HORIZONTAL_ALIGNMENT_CENTER, world_w, 10, Color.WHITE if is_cur else Color(0.82, 0.90, 0.98, 0.80))
		for s in range(3):
			var sx := mx + 5.0 + float(s) * ((world_w - 10.0) / 3.0)
			var sw := ((world_w - 10.0) / 3.0) - 2.0
			var lit := is_done or is_cur
			_hud_canvas.draw_rect(Rect2(sx, rail_y + 17.0, sw, 4.0), mc if lit else Color(0.25, 0.30, 0.40, 0.45), true)

	var fam_name := str(fam.name_en if en else fam.name_fr)
	var fam_hdr := "%s  ·  %s" % [str(fam.code), fam_name]
	_hud_canvas.draw_rect(Rect2(22, 88, 436, 26), Color(0.04, 0.07, 0.15, 0.94), true)
	_hud_canvas.draw_rect(Rect2(22, 88, 436, 26), w_col, false, 1.5)
	_hud_canvas.draw_string(font, Vector2(22, 106), fam_hdr, HORIZONTAL_ALIGNMENT_CENTER, 436, 12, w_acc)

	_hud_canvas.draw_rect(_world_holder.get_rect(), w_col, false, 2.2 + 0.6 * pulse)

	_hud_canvas.draw_rect(Rect2(24, 464, 432, 66), Color(0.03, 0.05, 0.12, 0.90), true)
	_draw_mini_relic_badge(_hud_canvas, Vector2(52, 497), w_idx, w_col, w_acc)

	var world_prefix := "WORLD %d / 8" if en else "MONDE %d / 8"
	var console_title := "%s — %s" % [world_prefix, str(w_info.console).to_upper()]
	var title_fsz := 13 if console_title.length() > 25 else 15
	_hud_canvas.draw_string(font, Vector2(80, 488), console_title, HORIZONTAL_ALIGNMENT_LEFT, 242, title_fsz, Color.WHITE)

	_hud_canvas.draw_rect(Rect2(326, 472, 120, 22), Color(w_col.r, w_col.g, w_col.b, 0.24), true)
	_hud_canvas.draw_rect(Rect2(326, 472, 120, 22), w_col, false, 1.3)
	_hud_canvas.draw_string(font, Vector2(326, 488), str(w_info.sectors_label), HORIZONTAL_ALIGNMENT_CENTER, 120, 10, w_acc)

	var sig_txt := str(w_info.sig_en if en else w_info.sig_fr)
	var spec_txt := str(fam.spec_en if en else fam.spec_fr)
	_hud_canvas.draw_string(font, Vector2(80, 508), sig_txt, HORIZONTAL_ALIGNMENT_LEFT, 366, 10, w_acc)
	_hud_canvas.draw_string(font, Vector2(80, 523), spec_txt, HORIZONTAL_ALIGNMENT_LEFT, 366, 10, Color(0.75, 0.85, 0.96, 0.85))

	for m in range(8):
		var col_i := m % 4
		var row_i := m / 4
		var gx := 22.0 + float(col_i) * 110.5
		var gy := 544.0 + float(row_i) * 28.0
		var active := (m == w_idx)
		var mc2 := Color(str(NVIntroData.WORLDS[m].color))
		_hud_canvas.draw_rect(Rect2(gx, gy, 105.0, 23.0), Color(mc2.r, mc2.g, mc2.b, 0.28 if active else 0.08), true)
		_hud_canvas.draw_rect(Rect2(gx, gy, 105.0, 23.0), mc2 if active else Color(mc2.r, mc2.g, mc2.b, 0.35), false, 1.7 if active else 1.0)
		var m_holo := NVIntroAssets.tex(str(NVIntroData.WORLDS[m].get("holo", "")))
		if m_holo != null:
			_hud_canvas.draw_texture_rect(m_holo, Rect2(gx + 2.0, gy + 1.5, 20.0, 20.0), false, Color(1, 1, 1, 1.0 if active else 0.82))
		var cname := str(NVIntroData.WORLDS[m].console)
		var cfsz := 8 if cname.length() > 12 else 9
		_hud_canvas.draw_string(font, Vector2(gx + 22.0, gy + 15.5), cname, HORIZONTAL_ALIGNMENT_CENTER, 81.0, cfsz, Color.WHITE if active else Color(0.80, 0.88, 0.96, 0.88))

func _draw_mini_relic_badge(canvas: Control, c: Vector2, w_idx: int, col: Color, _acc: Color) -> void:
	canvas.draw_circle(c, 22.0, Color(col.r, col.g, col.b, 0.16))
	canvas.draw_arc(c, 22.0, 0.0, TAU, 32, Color(col.r, col.g, col.b, 0.75), 1.4, true)
	var holo_path := str(NVIntroData.WORLDS[w_idx].get("holo", ""))
	var holo_tex := NVIntroAssets.tex(holo_path)
	if holo_tex != null:
		canvas.draw_texture_rect(holo_tex, Rect2(c - Vector2(26.0, 26.0), Vector2(52.0, 52.0)), false)

func _draw_title_climax_deck(font: Font, en: bool, sc_u: float, pulse: float) -> void:
	# Laisse l'illustration finale plein écran 100 % libre jusqu'au bout des 3 jets plasma (y = 730),
	# puis fait apparaître en douceur le cartouche titre compact sur la planète en fusion (y = 732..802).
	var slam := ease(clampf((sc_u - 0.16) / 0.24, 0.0, 1.0), 0.45)
	if slam <= 0.005:
		return
	var plate := Rect2(20.0, 732.0, 440.0, 70.0)
	_hud_canvas.draw_rect(plate, Color(0.025, 0.05, 0.13, 0.86 * slam), true)
	_hud_canvas.draw_rect(plate, Color(1.0, 0.82, 0.38, (0.78 + 0.22 * pulse) * slam), false, 2.2)
	_hud_canvas.draw_rect(plate.grow(-4.0), Color(0.30, 0.86, 1.0, 0.40 * slam), false, 1.0)

	_hud_canvas.draw_string(font, Vector2(22, 759), "NEO VANGUARD", HORIZONTAL_ALIGNMENT_CENTER, 440, 24, Color(0.10, 0.55, 1.0, 0.65 * slam))
	_hud_canvas.draw_string(font, Vector2(20, 757), "NEO VANGUARD", HORIZONTAL_ALIGNMENT_CENTER, 440, 24, Color(1.0, 1.0, 1.0, slam))

	var sub_main := "8 WORLDS — 24 SECTORS" if en else "8 MONDES — 24 SECTEURS"
	_hud_canvas.draw_rect(Rect2(78, 764, 324, 19), Color(0.07, 0.12, 0.24, 0.94 * slam), true)
	_hud_canvas.draw_rect(Rect2(78, 764, 324, 19), Color(1.0, 0.82, 0.38, 0.88 * slam), false, 1.3)
	_hud_canvas.draw_string(font, Vector2(78, 778), sub_main, HORIZONTAL_ALIGNMENT_CENTER, 324, 12, Color(1.0, 0.88, 0.48, slam))

	var motto := "Preserve the sacred relics. Relight the universe." if en else "Préservez les vestiges sacrés. Rallumez les couleurs de l'univers."
	_hud_canvas.draw_string(font, Vector2(24, 796), motto, HORIZONTAL_ALIGNMENT_CENTER, 432, 9, Color(0.92, 0.96, 1.0, 0.94 * slam))

func _draw_dialogue_box(font: Font, en: bool, sc: Dictionary, sc_u: float, accent: Color, pulse: float) -> void:
	_hud_canvas.draw_line(Vector2(0, DIALOGUE_TOP_Y), Vector2(Data.W, DIALOGUE_TOP_Y), Color(accent.r, accent.g, accent.b, 0.88), 2.4)

	var box := Rect2(16.0, 652.0, 448.0, 150.0)
	var poly := PackedVector2Array([
		Vector2(box.position.x + 10.0, box.position.y),
		Vector2(box.end.x, box.position.y),
		Vector2(box.end.x - 10.0, box.end.y),
		Vector2(box.position.x, box.end.y),
	])
	_hud_canvas.draw_colored_polygon(poly, Color(0.04, 0.07, 0.15, 0.98))
	var border := PackedVector2Array(poly)
	border.append(poly[0])
	_hud_canvas.draw_polyline(border, Color(accent.r, accent.g, accent.b, 0.80 + 0.20 * pulse), 2.0, true)

	var spk := str(sc.speaker_en if en else sc.speaker_fr)
	var tag_rect := Rect2(box.position.x + 14.0, box.position.y - 11.0, 286.0, 22.0)
	_hud_canvas.draw_rect(tag_rect, Color(0.05, 0.10, 0.22, 1.0), true)
	_hud_canvas.draw_rect(tag_rect, accent, false, 1.6)
	_hud_canvas.draw_string(font, Vector2(tag_rect.position.x + 10.0, tag_rect.position.y + 15.5), spk, HORIZONTAL_ALIGNMENT_LEFT, 266.0, 11, accent)

	_hud_canvas.draw_string(font, Vector2(box.end.x - 134.0, box.position.y + 17.0), str(sc.manga_stamp), HORIZONTAL_ALIGNMENT_RIGHT, 118.0, 10, Color(accent.r, accent.g, accent.b, 0.72))

	var lines: Array = sc.lines_en if en else sc.lines_fr
	var full_text := "\n\n".join(lines)
	var total_chars := full_text.length()
	var reveal_ratio := clampf(sc_u / 0.65, 0.0, 1.0)
	var shown_chars := clampi(int(ceil(float(total_chars) * reveal_ratio)), 1, max(1, total_chars))
	var visible_text := full_text.substr(0, shown_chars)
	if shown_chars < total_chars and fmod(_t * 5.0, 1.0) < 0.65:
		visible_text += " ▍"

	_draw_wrapped_text(_hud_canvas, font, visible_text, Vector2(box.position.x + 20.0, box.position.y + 34.0), box.size.x - 40.0, 13, 18.5, Color("#eef6ff"))

func _draw_wrapped_text(canvas: Control, font: Font, text: String, origin: Vector2, max_w: float, fsize: int, line_h: float, col: Color) -> void:
	var y := origin.y
	for para in text.split("\n"):
		if para.strip_edges().is_empty():
			y += line_h * 0.35
			continue
		var words := para.split(" ")
		var cur := ""
		for w in words:
			var cand := w if cur.is_empty() else (cur + " " + w)
			var cw := font.get_string_size(cand, HORIZONTAL_ALIGNMENT_LEFT, -1, fsize).x
			if cw > max_w and not cur.is_empty():
				canvas.draw_string(font, Vector2(origin.x, y), cur, HORIZONTAL_ALIGNMENT_LEFT, max_w + 12.0, fsize, col)
				y += line_h
				cur = w
			else:
				cur = cand
		if not cur.is_empty():
			canvas.draw_string(font, Vector2(origin.x, y), cur, HORIZONTAL_ALIGNMENT_LEFT, max_w + 12.0, fsize, col)
			y += line_h

func _draw_bottom_timeline(font: Font, en: bool) -> void:
	var bar_x := 18.0
	var bar_y := 810.0
	var bar_w := 444.0
	var prog := clampf(_t / NVIntroData.TOTAL_DURATION, 0.0, 1.0)
	_hud_canvas.draw_rect(Rect2(bar_x, bar_y, bar_w, 4.0), Color(0.14, 0.20, 0.34, 0.85), true)
	_hud_canvas.draw_rect(Rect2(bar_x, bar_y, bar_w * prog, 4.0), Color("#4cf4ff"), true)

	for sc in NVIntroData.SCENES:
		var sx := bar_x + bar_w * (float(sc.t0) / NVIntroData.TOTAL_DURATION)
		_hud_canvas.draw_rect(Rect2(sx, bar_y - 2.0, 2.0, 8.0), Color(0.85, 0.94, 1.0, 0.70), true)

	var mm := int(_t) / 60
	var ss := int(_t) % 60
	var tot_m := int(NVIntroData.TOTAL_DURATION) / 60
	var tot_s := int(NVIntroData.TOTAL_DURATION) % 60
	var time_str := "%02d:%02d / %02d:%02d  ·  ACTE %d/5  ·  SCÈNE %d/%d" % [mm, ss, tot_m, tot_s, int(NVIntroData.SCENES[page_i].act), page_i + 1, NVIntroData.SCENES.size()]
	if en:
		time_str = "%02d:%02d / %02d:%02d  ·  ACT %d/5  ·  SCENE %d/%d" % [mm, ss, tot_m, tot_s, int(NVIntroData.SCENES[page_i].act), page_i + 1, NVIntroData.SCENES.size()]
	_hud_canvas.draw_string(font, Vector2(18, 838), time_str, HORIZONTAL_ALIGNMENT_LEFT, 310, 10, Color(0.66, 0.80, 0.96, 0.88))

	_hud_canvas.draw_rect(NEXT_RECT, Color(0.06, 0.11, 0.22, 0.88), true)
	_hud_canvas.draw_rect(NEXT_RECT, Color(0.35, 0.80, 1.0, 0.68), false, 1.2)
	var next_lbl := ("START ▶" if page_i >= NVIntroData.SCENES.size() - 1 else "NEXT ▶") if en else ("JOUER ▶" if page_i >= NVIntroData.SCENES.size() - 1 else "SUIVANT ▶")
	_hud_canvas.draw_string(font, Vector2(NEXT_RECT.position.x, NEXT_RECT.position.y + 18), next_lbl, HORIZONTAL_ALIGNMENT_CENTER, NEXT_RECT.size.x, 11, Color("#9be8ff"))

func _input(event: InputEvent) -> void:
	if _finished or _input_guard > 0.0:
		return
	if event.is_action_pressed("pause") or event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_finish()
		return
	if event.is_action_pressed("fire") or event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		_next()
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var mp: Vector2 = event.position
		get_viewport().set_input_as_handled()
		if SKIP_RECT.grow(8.0).has_point(mp):
			_finish()
		else:
			_next()
	elif event is InputEventScreenTouch and event.pressed:
		var tp: Vector2 = event.position
		get_viewport().set_input_as_handled()
		if SKIP_RECT.grow(10.0).has_point(tp):
			_finish()
		else:
			_next()

func _next() -> void:
	if _finished:
		return
	if page_i + 1 < NVIntroData.SCENES.size():
		page_i += 1
		var target_t := float(NVIntroData.SCENES[page_i].t0)
		_t = target_t
		_seek_lock_timer = 0.25
		if Audio2 != null and Audio2.music_player != null and Audio2.music_player.playing and Audio2.current_track == "title":
			Audio2.music_player.seek(target_t)
		while _cue_idx < NVIntroData.SFX_CUES.size() and float(NVIntroData.SFX_CUES[_cue_idx].t) < target_t - 0.02:
			_cue_idx += 1
		_slash_flash = 0.60
		_shake_amp = 3.0
		if art != null:
			art.texture = NVIntroAssets.tex(NVIntroData.SCENES[page_i].img)
		_play_intro_sfx("sfx_manga_slash", -3.0)
		_update_visual_state()
		_stage_canvas.queue_redraw()
		_vesta_stage_canvas.queue_redraw()
		_world_canvas.queue_redraw()
		_world_console_canvas.queue_redraw()
		_cutin_top_canvas.queue_redraw()
		_cutin_mid_canvas.queue_redraw()
		_cutin_bot_left_canvas.queue_redraw()
		_cutin_bot_right_canvas.queue_redraw()
		_corner_canvas.queue_redraw()
		_hud_canvas.queue_redraw()
	else:
		_finish()

func _finish() -> void:
	if _finished:
		return
	_finished = true
	for p in _sfx_pool:
		if p != null and is_instance_valid(p):
			p.stop()
	if on_done.is_valid():
		on_done.call()
