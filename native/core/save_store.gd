extends RefCounted
## Isolated native persistence; source localStorage is never overwritten.
signal changed
var data: Dictionary
var save_path: String
var last_error: Error = OK
var defaults: Dictionary

func _init(initial: Dictionary, path: String = "user://neovanguard-native-v1.json") -> void:
	defaults = initial.duplicate(true)
	data = defaults.duplicate(true)
	save_path = path

func load_save() -> Error:
	if not FileAccess.file_exists(save_path):
		return ERR_FILE_NOT_FOUND
	var parser := JSON.new()
	if parser.parse(FileAccess.get_file_as_string(save_path)) != OK:
		return ERR_PARSE_ERROR
	var parsed = parser.data
	if not parsed is Dictionary:
		return ERR_PARSE_ERROR
	if not _valid(parsed):
		return ERR_INVALID_DATA
	data = _merge(defaults, parsed)
	changed.emit()
	return OK

func persist() -> Error:
	if not _valid(data):
		last_error = ERR_INVALID_DATA
		return last_error
	var temporary := save_path + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		last_error = FileAccess.get_open_error()
		return last_error
	file.store_string(JSON.stringify(data, "\t"))
	file.flush()
	last_error = file.get_error()
	file.close()
	if last_error != OK:
		return last_error
	last_error = DirAccess.rename_absolute(temporary, save_path)
	if last_error == OK:
		changed.emit()
	return last_error

func _merge(base: Dictionary, incoming: Dictionary) -> Dictionary:
	var merged := base.duplicate(true)
	for key in incoming:
		if merged.get(key) is Dictionary and incoming[key] is Dictionary:
			merged[key] = _merge(merged[key], incoming[key])
		else:
			merged[key] = incoming[key]
	return merged

func _valid(value: Dictionary) -> bool:
	if value.has("credits"):
		if not (value.credits is int or value.credits is float):
			return false
		if not is_finite(float(value.credits)) or value.credits < 0:
			return false
	for key in ["owned", "sel", "opts", "cheats", "materials", "unlocks"]:
		if value.has(key) and not value[key] is Dictionary:
			return false
	for key in ["musicTracks", "board"]:
		if value.has(key) and not value[key] is Array:
			return false
	return true

