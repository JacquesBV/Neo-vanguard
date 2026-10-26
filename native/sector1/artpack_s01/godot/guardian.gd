extends Node2D
## Visual component only. Damage, cooldowns and collisions belong to the mission.
signal weapon_fired(socket: Marker2D, kind: StringName)

@export var showcase_cycle := false
@export_range(0.0, 1.0) var damage_ratio := 0.0
var action: StringName = &"idle"
var elapsed := 0.0
var action_time := 0.0
var pieces := {}
var sockets := {}
var data: Dictionary
var aperture: Sprite2D
var damage_sprite: Sprite2D
var charge: AnimatedSprite2D
var exhaust_left: AnimatedSprite2D
var exhaust_right: AnimatedSprite2D
var target := Vector2(0, 180)
var _has_fired := false
var _cycle_index := -1
var _damage_level := -1
const CENTER := Vector2(48, 64)
const IRIS_TEXTURES := [preload("res://native/sector1/artpack_s01/assets/boss/parts/iris_stage_0.png"),preload("res://native/sector1/artpack_s01/assets/boss/parts/iris_stage_1.png"),preload("res://native/sector1/artpack_s01/assets/boss/parts/iris_stage_2.png"),preload("res://native/sector1/artpack_s01/assets/boss/parts/iris_stage_3.png")]
const ORDER := ["torso", "crown", "jaw", "iris", "shoulder_l", "shoulder_r", "forearm_l", "forearm_r"]

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	data = JSON.parse_string(FileAccess.get_file_as_string("res://native/sector1/artpack_s01/assets/boss/rig.json"))
	for key in ORDER:
		var part: Dictionary = data.parts[key]
		var pivot := Vector2(part.pivot[0], part.pivot[1])
		var joint := Node2D.new()
		joint.name = key.to_pascal_case()
		var parent_joint: Node2D = pieces[part.parent] if pieces.has(part.parent) else self
		parent_joint.add_child(joint)
		var parent_pivot := CENTER
		if pieces.has(part.parent):
			var pp: Array = data.parts[part.parent].pivot
			parent_pivot = Vector2(pp[0], pp[1])
		joint.position = pivot - parent_pivot
		var sprite := Sprite2D.new()
		sprite.name = "MechanicalTexture"
		sprite.texture = load("res://native/sector1/artpack_s01/" + part.texture)
		sprite.position = CENTER - pivot
		joint.add_child(sprite)
		pieces[key] = joint
		if key == "iris": aperture = sprite
	for key in data.sockets:
		var p: Array = data.sockets[key]
		var owner_key := "forearm_l" if key == "muzzle_l" else "forearm_r" if key == "muzzle_r" else "iris" if key == "eye" else "torso"
		var marker := Marker2D.new()
		marker.name = key.to_pascal_case()
		pieces[owner_key].add_child(marker)
		var pp: Array = data.parts[owner_key].pivot
		marker.position = Vector2(p[0] - pp[0], p[1] - pp[1])
		sockets[key] = marker
	damage_sprite = Sprite2D.new()
	damage_sprite.name = "MechanicalCracks"
	add_child(damage_sprite)
	charge = make_effect("fx_charge", sockets.eye)
	charge.visible = false
	exhaust_left = make_effect("fx_flame", sockets.exhaust_l)
	exhaust_right = make_effect("fx_flame", sockets.exhaust_r)
	for flame in [exhaust_left, exhaust_right]:
		flame.position.y = 16 # Flame root at (24,8), frame center at (24,24).
		flame.visible = false
	set_damage(damage_ratio)

func make_effect(resource_name: String, parent: Node2D) -> AnimatedSprite2D:
	var effect := AnimatedSprite2D.new()
	effect.name = resource_name.to_pascal_case()
	effect.sprite_frames = load("res://native/sector1/artpack_s01/godot/" + resource_name + "_frames.tres")
	parent.add_child(effect)
	effect.play()
	return effect

func play_action(value: StringName) -> void:
	if value == action: return
	action = value
	action_time = 0.0
	_has_fired = false
	if is_instance_valid(charge): charge.frame = 0

func set_damage(value: float) -> void:
	damage_ratio = clampf(value, 0.0, 1.0)
	if is_instance_valid(damage_sprite):
		var level := 2 if damage_ratio > 0.65 else 1 if damage_ratio > 0.3 else 0
		if level != _damage_level:
			_damage_level = level
			damage_sprite.texture = load("res://native/sector1/artpack_s01/assets/boss/parts/damage_%d.png" % level)

func set_target(value: Vector2) -> void:
	target = value

func _process(delta: float) -> void:
	elapsed += delta
	action_time += delta
	if showcase_cycle:
		var index := int(elapsed / 2.0) % 6
		if index != _cycle_index:
			_cycle_index = index
			play_action([&"idle", &"open", &"charge", &"fire", &"recoil", &"damaged"][index])
	var sway := sin(elapsed * TAU / 2.8)
	pieces.crown.position.x = roundf(sway * 0.5)
	pieces.shoulder_l.rotation = sway * 0.018
	pieces.shoulder_r.rotation = -sway * 0.018
	var aim := clampf((target.x - global_position.x) / 400.0, -0.07, 0.07)
	pieces.forearm_l.rotation = -aim + sway * 0.025
	pieces.forearm_r.rotation = -aim - sway * 0.025
	var recoil := -roundf(2.0 * exp(-action_time * 9.0)) if action == &"fire" else 0.0
	pieces.forearm_l.position.y = 29.0 + recoil
	pieces.forearm_r.position.y = 29.0 + recoil
	var iris_stage := mini(3, int(action_time * 8.0)) if action == &"open" else maxi(0, 3 - int(action_time * 8.0)) if action == &"recoil" else 3 if action in [&"charge", &"fire"] else 0
	aperture.texture = IRIS_TEXTURES[iris_stage]
	charge.visible = action == &"charge"
	charge.scale = Vector2.ONE * (0.35 + 0.1 * minf(action_time, 1.0))
	if charge.visible and not charge.is_playing(): charge.play()
	exhaust_left.visible = action == &"open"
	exhaust_right.visible = action == &"open"
	if action == &"fire" and not _has_fired:
		_has_fired = true
		weapon_fired.emit(sockets.muzzle_l, &"beam")
		weapon_fired.emit(sockets.muzzle_r, &"beam")
	# (bridge) damage cracks are driven by the mission state, not forced here.
	elif showcase_cycle: set_damage(0.0)
	if action == &"defeat":
		var fall := minf(action_time, 1.5)
		pieces.shoulder_l.rotation = -fall * 0.18
		pieces.shoulder_r.rotation = fall * 0.18
		pieces.forearm_l.rotation = -fall * 0.22
		pieces.forearm_r.rotation = fall * 0.22
		pieces.forearm_l.position.y += roundf(fall * fall * 5.0)
		pieces.forearm_r.position.y += roundf(fall * fall * 5.0)
		pieces.crown.position.y = -28.0 - roundf(fall * 3.0)
		set_damage(0.9)
	else:
		pieces.crown.position.y = -28.0

func socket(name_key: String) -> Marker2D:
	return sockets.get(name_key)
