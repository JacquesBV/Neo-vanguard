extends RefCounted
## Authored game data, shared by the three native presentations.
const REFERENCE_PATH := "res://native/reference/catalog.json"
var data: Dictionary

func _init() -> void:
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(REFERENCE_PATH))
	assert(parsed is Dictionary, "Invalid reference catalog")
	data = parsed
	assert(data.levels.size() == 24)

func level_definition(level: int) -> Dictionary:
	assert(level >= 1 and level <= 24, "Sector outside campaign")
	return data.levels[level - 1].duplicate(true)

func find_item(family: String, id: String) -> Dictionary:
	for item: Dictionary in data.get(family, []):
		if item.get("id", "") == id:
			return item.duplicate(true)
	return {}

func initial_save() -> Dictionary:
	return data.default_save.duplicate(true)

