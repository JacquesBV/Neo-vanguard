extends SceneTree
var count := 0
var failed := 0
func check(value: bool, message: String) -> void:
	count += 1
	if not value:
		failed += 1
		printerr("FAIL: "+message)

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var m: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://native/sector1/artpack_s01/assets/manifest.json"))
	for path in m.files:
		var texture := load("res://native/sector1/artpack_s01/"+path) as Texture2D
		check(texture != null, "texture "+path)
		if texture:
			check(texture.get_width()==m.files[path].size[0] and texture.get_height()==m.files[path].size[1], "dimensions "+path)
	for key in m.animations:
		var frames := load("res://native/sector1/artpack_s01/godot/"+key.replace("/","_")+"_frames.tres") as SpriteFrames
		check(frames != null, "SpriteFrames "+key)
		if frames: check(frames.get_frame_count(&"default")==m.animations[key].frames,"frame count "+key)
	var tiles := load("res://native/sector1/artpack_s01/godot/industrial_tileset.tres") as TileSet
	check(tiles != null,"TileSet loads")
	if tiles: check((tiles.get_source(0) as TileSetAtlasSource).get_tiles_count()==1600,"1600 tiles registered")
	var boss = load("res://native/sector1/artpack_s01/godot/guardian.tscn").instantiate()
	root.add_child(boss)
	check(boss.pieces.size()==8,"eight independent mechanical pieces")
	check(boss.sockets.size()==6,"six named sockets")
	check(boss.charge.get_parent() == boss.socket("eye"),"charge attached to eye socket")
	check(boss.socket("muzzle_l").get_parent() == boss.pieces.forearm_l,"left muzzle follows forearm")
	check(boss.socket("muzzle_r").get_parent() == boss.pieces.forearm_r,"right muzzle follows forearm")
	for mode in [&"idle", &"open", &"charge", &"fire", &"recoil", &"damaged", &"defeat"]:
		boss.play_action(mode)
		for i in range(90): boss._process(1.0/60.0)
		check(boss.socket("muzzle_l").global_position.is_finite(),"finite muzzle "+mode)
		check(boss.charge.visible == (mode == &"charge"),"charge isolated "+mode)
	var dialogue := Control.new()
	dialogue.set_script(load("res://native/sector1/artpack_s01/godot/dialogue_panel.gd"))
	root.add_child(dialogue)
	check(dialogue.text_slot.text.is_empty(),"dialogue text blank")
	dialogue.set_speaker("guardian")
	check(dialogue.panel.texture != null,"guardian blank frame")
	var showcase = load("res://native/sector1/artpack_s01/godot/showcase.tscn").instantiate()
	root.add_child(showcase)
	await process_frame
	check(showcase.foes.size()==4,"showcase loads all four new families")
	print("GODOT_ASSET_TESTS: %d checks, %d failures" % [count,failed])
	quit(1 if failed else 0)
