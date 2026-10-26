extends RefCounted
## Explicit touch ownership: action fingers cannot cancel the pilot.
var pilot_id := -1
var actions: Dictionary = {}
var touches: Dictionary = {}
var movement := Vector2.ZERO
var finger := Vector2.ZERO
var controlled_position := Vector2.ZERO
var field := Rect2(32, 76, 416, 742)

func begin_pilot(id: int, point: Vector2, ship: Vector2) -> bool:
	if pilot_id != -1 or touches.has(id):
		return false
	pilot_id = id
	touches[id] = &"pilot"
	finger = point
	controlled_position = ship
	return true

func drag(id: int, point: Vector2, logical_scale: float) -> Vector2:
	if id != pilot_id or logical_scale <= 0:
		return controlled_position
	controlled_position += (point - finger) / logical_scale
	controlled_position = controlled_position.clamp(field.position, field.end)
	finger = point
	return controlled_position

func press_action(id: int, action: StringName) -> bool:
	if touches.has(id):
		return false
	touches[id] = action
	actions[action] = int(actions.get(action, 0)) + 1
	return true

func release(id: int) -> void:
	if not touches.has(id):
		return
	var role: StringName = touches[id]
	touches.erase(id)
	if role == &"pilot":
		pilot_id = -1
		movement = Vector2.ZERO
	else:
		actions[role] = maxi(0, int(actions.get(role, 0)) - 1)

func is_held(action: StringName) -> bool:
	return int(actions.get(action, 0)) > 0

func cancel_all() -> void:
	pilot_id = -1
	actions.clear()
	touches.clear()
	movement = Vector2.ZERO
