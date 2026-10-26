extends Node2D
## Gardien du Silo — pack V2. Composant visuel seul : dégâts, cadences et
## collisions restent dans mission.gd (contrat native/sector1/ARTPACK_CONTRACT.md).
signal weapon_fired(socket: Marker2D, kind: StringName)

@export var showcase_cycle := false
@export_range(0.0, 1.0) var damage_ratio := 0.0
var action: StringName = &"idle"
var elapsed := 0.0
var action_time := 0.0
var pieces := {}
var sockets := {}
var data: Dictionary
var charge: AnimatedSprite2D
var target := Vector2(0, 180)
var _has_fired := false
var _cycle_index := -1
var _damage_level := -1
const ROOT := "res://native/sector1/artpack_s01_v2/"
const CENTER := Vector2(48, 64)
const STATES := ["idle", "charge", "attack", "recoil", "damage", "defeat"]

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	data = JSON.parse_string(FileAccess.get_file_as_string(ROOT + "assets/boss/rig.json"))
	for key in data.order:
		var part: Dictionary = data.parts[key]
		var spr := Sprite2D.new()
		spr.name = key.to_pascal_case()
		spr.texture = load(ROOT + "assets/boss/rig/" + part.sheet)
		spr.position = Vector2.ZERO
		spr.hframes = 6
		spr.frame = 0
		add_child(spr)
		pieces[key] = spr
	for key in data.sockets:
		var p: Array = data.sockets[key]
		var marker := Marker2D.new()
		marker.name = key.to_pascal_case()
		pieces[data.socket_owner[key]].add_child(marker)
		marker.position = Vector2(p[0], p[1]) - CENTER
		sockets[key] = marker
	charge = AnimatedSprite2D.new()
	charge.name = "FxCharge"
	charge.sprite_frames = load(ROOT + "godot/fx_charge_frames.tres")
	charge.visible = false
	charge.animation = &"default"
	sockets.eye.add_child(charge)
	set_damage(damage_ratio)

func play_action(value: StringName) -> void:
	if value == action: return
	action = value
	action_time = 0.0
	_has_fired = false
	# états mission -> colonnes V2 : open/charge -> charge, fire -> attack
	var column := 0
	match value:
		&"idle": column = 0
		&"open", &"charge": column = 1
		&"fire": column = 2
		&"recoil": column = 3
		&"damaged": column = 4
		&"defeat": column = 5
	for key in pieces:
		pieces[key].frame = column
	if is_instance_valid(charge): charge.frame = 0

func set_damage(value: float) -> void:
	damage_ratio = clampf(value, 0.0, 1.0)
	# La V2 n'a pas d'art de fissures : le niveau est exposé pour le test et
	# l'expression visuelle reste l'état 'damage' (hurt_t) + 'defeat'.
	var level := 2 if damage_ratio > 0.65 else 1 if damage_ratio > 0.3 else 0
	_damage_level = level

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
	pieces.left_shoulder.rotation = sway * 0.018
	pieces.right_shoulder.rotation = -sway * 0.018
	var aim := clampf((target.x - global_position.x) / 400.0, -0.07, 0.07)
	pieces.left_arm.rotation = -aim + sway * 0.025
	pieces.right_arm.rotation = -aim - sway * 0.025
	var recoil := -roundf(2.0 * exp(-action_time * 9.0)) if action == &"fire" else 0.0
	pieces.left_arm.position.y = recoil
	pieces.right_arm.position.y = recoil
	pieces.central_cannon.position.y = recoil
	charge.visible = action in [&"charge", &"open"]
	charge.scale = Vector2.ONE * (0.35 + 0.1 * minf(action_time, 1.0))
	if charge.visible and not charge.is_playing(): charge.play()
	if action == &"fire" and not _has_fired:
		_has_fired = true
		weapon_fired.emit(sockets.muzzle_l, &"beam")
		weapon_fired.emit(sockets.muzzle_r, &"beam")
	if action == &"defeat":
		var fall := minf(action_time, 1.5)
		pieces.left_shoulder.rotation = -fall * 0.18
		pieces.right_shoulder.rotation = fall * 0.18
		pieces.left_arm.rotation = -fall * 0.22
		pieces.right_arm.rotation = fall * 0.22
		pieces.left_arm.position.y += roundf(fall * fall * 5.0)
		pieces.right_arm.position.y += roundf(fall * fall * 5.0)
		pieces.body.position.y = roundf(fall * 2.0)
	else:
		pieces.body.position.y = 0.0

func socket(name_key: String) -> Marker2D:
	return sockets.get(name_key)
