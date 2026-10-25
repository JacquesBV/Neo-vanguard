extends Node
## =========================================================================
## AUDIO2 — musiques et effets du jeu.
## Musiques : les MP3 d'origine du dépôt (era0..era5, boss0..boss23, title,
## shop, story, gate, ending). Effets : courts WAV chiptune générés dans
## l'esprit WebAudio du jeu original.
## =========================================================================

const MUSIC_DIR := "res://assets/music/"
const SFX_DIR := "res://assets/sfx/"
const Chip := preload("res://scripts/audio_chip.gd")

## ère de génération courante (0..5) — fixée par le jeu à chaque secteur :
## les timbres des effets suivent la machine d'origine (Audio2.era du JS)
var game_era := 0

var music_player: AudioStreamPlayer
var current_track := ""
var boss_mode := false
var muted := false

var _sfx_pool: Array[AudioStreamPlayer] = []
var _sfx_cache: Dictionary = {}
var _music_cache: Dictionary = {}
var _chip_cache: Dictionary = {}

func _ready() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.bus = "Master"
	add_child(music_player)
	music_player.finished.connect(_on_music_finished)
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_sfx_pool.append(p)
	apply_volumes()

func _map() -> Dictionary: return { "vol_music": float(Save.S.opts.music) / 100.0, "vol_sfx": float(Save.S.opts.sfx) / 100.0 }

# ---------------- mix 49 (module 49-nv-mix) --------------------------------
# duckMusic .40 (−8 dB) / duckSfx .70 (−3 dB) pendant la voix ;
# tirs du joueur .63 (−4 dB) ; bus voix 1.00 ; M coupe aussi la voix.
const DUCK_MUSIC := 0.40
const DUCK_SFX := 0.70
const SHOT_GAIN := 0.63
const VOICE_GAIN := 1.00
var voice_duck := false
var _voice_timer: SceneTreeTimer = null

func _duck() -> float:
	return DUCK_MUSIC if voice_duck else 1.0

func _duck_s() -> float:
	return DUCK_SFX if voice_duck else 1.0

func apply_volumes() -> void:
	var m := _map()
	if music_player:
		var vm: float = clampf(m.vol_music * _duck(), 0.0001, 1.0)
		music_player.volume_db = linear_to_db(vm) if (m.vol_music > 0.001 and vm > 0.001) else -60.0
	for p in _sfx_pool:
		p.volume_db = linear_to_db(clampf(m.vol_sfx * _duck_s(), 0.0001, 1.0)) if m.vol_sfx > 0.001 else -60.0

func set_muted(v: bool) -> void:
	muted = v
	music_player.volume_db = -60.0 if (v or _map().vol_music <= 0.001) else linear_to_db(clampf(_map().vol_music, 0.0001, 1.0))
	if v:
		_stop_voice()

func _stop_voice() -> void:
	voice_duck = false
	apply_volumes()
	if DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH):
		DisplayServer.tts_stop()

# ------------------------------------------------------------------ musiques
func _load_music(name: String) -> AudioStream:
	if _music_cache.has(name): return _music_cache[name]
	var path := MUSIC_DIR + name + ".mp3"
	var stream: AudioStream = null
	if ResourceLoader.exists(path):
		stream = load(path)
	_music_cache[name] = stream
	return stream

func play_track(name: String, loop := true) -> void:
	if current_track == name and music_player.playing: return
	var stream := _load_music(name)
	if stream == null:
		stop_music(); return
	current_track = name
	if stream is AudioStreamMP3:
		stream.loop = loop
	music_player.stream = stream
	music_player.play()
	apply_volumes()

func stop_music() -> void:
	current_track = ""
	music_player.stop()

func start_title_music() -> void:
	boss_mode = false
	play_track("title")

func start_shop_music() -> void:
	boss_mode = false
	play_track("shop")

func start_story_music() -> void:
	boss_mode = false
	play_track("story")

func start_music(era_idx: int, _level: int) -> void:
	boss_mode = false
	play_track("era%d" % clampi(era_idx, 0, 5))

func start_boss_music(boss_idx: int) -> void:
	boss_mode = true
	# VORAX (secteur 24) a sa propre musique dans le dépôt
	if boss_idx == 23:
		play_track("boss24-vorax")
	else:
		play_track("boss%d" % boss_idx)

func play_ending() -> void:
	boss_mode = false
	play_track("ending", false)

func game_over_music() -> void:
	boss_mode = false
	stop_music()

func _on_music_finished() -> void:
	# boucle : la musique repart tant que rien ne l'arrête
	if current_track != "":
		music_player.play()

# --------------------------------------------------------------------- sfx
func sfx(name: String, opt := {}) -> void:
	# d'abord la synthèse d'origine (recettes exactes du moteur), sinon le WAV
	var cname := "bossAlarm" if name == "bossalarm" else name
	var ckey := "%s|%d|%s" % [cname, game_era, str(opt.get("big", false))]
	var stream: AudioStream
	if _chip_cache.has(ckey):
		stream = _chip_cache[ckey]
	else:
		stream = Chip.render(cname, game_era, bool(opt.get("big", false)))
		_chip_cache[ckey] = stream
	if stream == null:
		stream = _load_sfx(name)
	if stream == null: return
	for p in _sfx_pool:
		if not p.playing:
			p.stream = stream
			p.pitch_scale = 1.0
			p.set_meta("shot", name.begins_with("shoot"))
			p.play()
			apply_volumes()
			# mix 49 : les tirs du joueur sortent 4 dB sous les autres SFX
			# (appliqué après apply_volumes, qui pose le niveau de base)
			if p.get_meta("shot", false) and p.volume_db > -59.0:
				p.volume_db -= 4.0
			return
	# tous occupés : on coupe le plus ancien
	_sfx_pool[0].stream = stream
	_sfx_pool[0].play()

func _load_sfx(name: String) -> AudioStream:
	if _sfx_cache.has(name): return _sfx_cache[name]
	var path := SFX_DIR + name + ".wav"
	var stream: AudioStream = null
	if ResourceLoader.exists(path):
		stream = load(path)
	_sfx_cache[name] = stream
	return stream

# ------------------------------------------------------------- voix (TTS)
func speak(text: String) -> void:
	if not Save.S.opts.speech: return
	if not DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH): return
	if DisplayServer.tts_get_voices_for_language("fr").is_empty(): return
	# mix 49 : duck de la musique et des SFX pendant la parole (M. DROID parle)
	_start_voice_duck(text.length() * 0.09 + 1.6)
	DisplayServer.tts_set_utterance_callback(DisplayServer.TTS_UTTERANCE_STARTED, func(_id): voice_duck = true; apply_volumes())
	DisplayServer.tts_set_utterance_callback(DisplayServer.TTS_UTTERANCE_ENDED, func(_id): voice_duck = false; apply_volumes())
	DisplayServer.tts_speak(text, DisplayServer.tts_get_voices_for_language("fr")[0], VOICE_GAIN)

func _start_voice_duck(fallback: float) -> void:
	voice_duck = true
	apply_volumes()
	if _voice_timer != null and _voice_timer.time_left > 0.0:
		return
	_voice_timer = get_tree().create_timer(maxf(1.0, fallback))
	_voice_timer.timeout.connect(func():
		voice_duck = false
		apply_volumes())
