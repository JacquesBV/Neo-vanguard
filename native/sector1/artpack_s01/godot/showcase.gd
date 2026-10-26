extends Node2D
## Asset demonstration, not a replacement campaign or combat controller.
const GUARDIAN = preload("res://native/sector1/artpack_s01/godot/guardian.tscn")
const BEAM = preload("res://native/sector1/artpack_s01/godot/beam_preview.gd")
const DIALOGUE = preload("res://native/sector1/artpack_s01/godot/dialogue_panel.gd")
var manifest: Dictionary
var backgrounds: Array[Texture2D] = []
var boss: Node2D
var panel: Control
var scroll := 0.0
var paused := false
var fast := false
var foes: Array[AnimatedSprite2D] = []
var elapsed := 0.0
var preview_beams: Array[Node2D] = []

func _ready() -> void:
	manifest = JSON.parse_string(FileAccess.get_file_as_string("res://native/sector1/artpack_s01/assets/manifest.json"))
	for module in manifest.environment: backgrounds.append(load("res://native/sector1/artpack_s01/"+module.background))
	boss = GUARDIAN.instantiate()
	boss.position = Vector2(80,104)
	boss.showcase_cycle = true
	add_child(boss)
	boss.weapon_fired.connect(_fire)
	var families := ["radar_drone","patrol_interceptor","mine_layer","armored_transport"]
	for i in range(4):
		var foe := AnimatedSprite2D.new()
		foe.sprite_frames = load("res://native/sector1/artpack_s01/godot/enemy_"+families[i]+"_frames.tres")
		foe.position = Vector2(30+i%2*100, 181+i/2*40)
		foe.play()
		add_child(foe)
		foes.append(foe)
	panel = Control.new()
	panel.set_script(DIALOGUE)
	panel.position = Vector2(4,235)
	add_child(panel)
	panel.visible = false
	if "--capture" in OS.get_cmdline_user_args():
		await get_tree().create_timer(0.5).timeout
		get_viewport().get_texture().get_image().save_png("res://native/sector1/artpack_s01/previews/godot_showcase.png")
		get_tree().quit()
	if "--capture-motion" in OS.get_cmdline_user_args():
		set_process(false)
		boss.set_process(false)
		boss.process_mode = Node.PROCESS_MODE_DISABLED
		boss.showcase_cycle = false
		scroll = float((manifest.route.modules.size()-2)*160)
		queue_redraw()
		DirAccess.make_dir_recursive_absolute("res://native/sector1/artpack_s01/previews/motion_frames")
		var poses := [&"idle", &"open", &"charge", &"fire", &"recoil", &"damaged"]
		for n in range(48):
			if n % 8 == 0: boss.play_action(poses[int(n/8)])
			boss._process(1.0/8.0)
			boss.charge.frame = n % 4
			for flame in [boss.exhaust_left,boss.exhaust_right]: flame.frame = n % 4
			for foe in foes: foe.frame = int(n/2) % 4
			for beam in preview_beams:
				if is_instance_valid(beam): beam._process(1.0/8.0)
			await RenderingServer.frame_post_draw
			get_viewport().get_texture().get_image().save_png("res://native/sector1/artpack_s01/previews/motion_frames/%03d.png" % n)
		get_tree().quit()

func _fire(marker: Marker2D, _kind: StringName) -> void:
	var beam := Node2D.new()
	beam.set_script(BEAM)
	marker.add_child(beam)
	preview_beams.append(beam)

func _process(delta: float) -> void:
	if paused: return
	elapsed += delta
	scroll = minf(scroll+delta*(160.0 if fast else 22.0),float((manifest.route.modules.size()-2)*160))
	for i in range(foes.size()): foes[i].position.x = roundf(30+i%2*100+sin(elapsed+i)*4)
	queue_redraw()

func _draw() -> void:
	if manifest.is_empty(): return
	var route: Array = manifest.route.modules
	for i in range(route.size()):
		var yy := 127.0+floorf(scroll)-i*160
		if yy > -160 and yy < 287: draw_texture(backgrounds[route[i]],Vector2(0,yy))

func _unhandled_key_input(event: InputEvent) -> void:
	if not event.is_pressed() or event.is_echo(): return
	if event.keycode == KEY_D:
		panel.visible = not panel.visible
		paused = panel.visible
		boss.process_mode = Node.PROCESS_MODE_DISABLED if paused else Node.PROCESS_MODE_INHERIT
		for foe in foes:
			if paused: foe.pause()
			else: foe.play()
	if event.keycode == KEY_TAB: panel.set_speaker("guardian" if panel.speaker == "vesta" else "vesta")
	if event.keycode == KEY_F: fast = not fast
	if event.keycode == KEY_R: scroll = 0.0
	if event.keycode == KEY_SPACE: boss.play_action(&"fire")
