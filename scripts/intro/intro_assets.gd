extends RefCounted
class_name NVIntroAssets
## =========================================================================
## NVIntroAssets — Chargeur centralisé et mis en cache de toutes les textures,
## shaders et effets sonores WAV 44.1 kHz stéréo de la cinématique d'intro.
## Compatible Godot 4.3 → 4.7+ (éditeur, export PCK Steam/Web, et CLI direct).
## =========================================================================

static var _tex_cache: Dictionary = {}
static var _sfx_cache: Dictionary = {}
static var _shader_cache: Dictionary = {}

static func clear_cache() -> void:
	_tex_cache.clear()
	_sfx_cache.clear()
	_shader_cache.clear()

static func tex(res_path: String) -> Texture2D:
	if _tex_cache.has(res_path):
		return _tex_cache[res_path]
	var out: Texture2D = null
	if ResourceLoader.exists(res_path):
		var loaded := load(res_path)
		if loaded is Texture2D:
			out = loaded
	if out == null:
		var abs_p := ProjectSettings.globalize_path(res_path)
		if FileAccess.file_exists(abs_p):
			var img := Image.load_from_file(abs_p)
			if img != null and not img.is_empty():
				out = ImageTexture.create_from_image(img)
	_tex_cache[res_path] = out
	return out

static func shader(res_path: String) -> Shader:
	if _shader_cache.has(res_path):
		return _shader_cache[res_path]
	var sh: Shader = null
	if ResourceLoader.exists(res_path):
		var loaded := load(res_path)
		if loaded is Shader:
			sh = loaded
	if sh == null:
		var abs_p := ProjectSettings.globalize_path(res_path)
		if FileAccess.file_exists(abs_p):
			var code := FileAccess.get_file_as_string(abs_p)
			if not code.is_empty():
				sh = Shader.new()
				sh.code = code
	_shader_cache[res_path] = sh
	return sh

static func sfx(sfx_name: String) -> AudioStream:
	if _sfx_cache.has(sfx_name):
		return _sfx_cache[sfx_name]
	var res_path := "res://assets/intro/audio/sfx/%s.wav" % sfx_name
	var stream: AudioStream = null
	if ResourceLoader.exists(res_path):
		var loaded := load(res_path)
		if loaded is AudioStream:
			stream = loaded
	if stream == null:
		var abs_p := ProjectSettings.globalize_path(res_path)
		if FileAccess.file_exists(abs_p):
			stream = _load_wav_raw(abs_p)
	_sfx_cache[sfx_name] = stream
	return stream

## Lecture directe d'un WAV PCM 16-bit RIFF si le projet est lancé hors éditeur
## avant la passe d'importation automatique de Godot 4.
static func _load_wav_raw(abs_path: String) -> AudioStreamWAV:
	var bytes := FileAccess.get_file_as_bytes(abs_path)
	if bytes.size() < 44:
		return null
	if bytes.slice(0, 4).get_string_from_ascii() != "RIFF":
		return null
	var pos := 12
	var channels := 2
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
