extends SceneTree
## Integration check: load original image/audio imports through Godot's resource pipeline.
func _initialize() -> void:
	var manifest: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://native/reference/source_manifest.json"))
	var failures: Array[String] = []
	var images := 0
	var audio := 0
	for entry: Dictionary in manifest.files:
		var path: String = "res://" + entry.path
		var ext := path.get_extension().to_lower()
		if ext not in ["png", "jpg", "webp", "svg", "mp3", "wav", "ogg"]:
			continue
		var resource := ResourceLoader.load(path, "", ResourceLoader.CACHE_MODE_IGNORE)
		if ext in ["png", "jpg", "webp", "svg"]:
			images += 1
			if not resource is Texture2D or resource.get_width() <= 0 or resource.get_height() <= 0:
				failures.append(entry.path)
		else:
			audio += 1
			if not resource is AudioStream or resource.get_length() <= 0:
				failures.append(entry.path)
	var result := {"source_commit":manifest.source_commit,"images":images,"audio":audio,"failed":failures,"scope":"resource decoding only, no visual or auditory parity claim"}
	DirAccess.make_dir_recursive_absolute("res://native/test-results")
	var output := FileAccess.open("res://native/test-results/assets.json", FileAccess.WRITE)
	output.store_string(JSON.stringify(result, "\t"))
	output.close()
	print(JSON.stringify(result))
	quit(0 if failures.is_empty() else 1)
