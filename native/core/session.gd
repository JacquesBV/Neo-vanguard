extends Node
## One simulation clock. Menus and cinematics never advance gameplay.
signal state_changed(previous: StringName, current: StringName)
signal simulation_step(delta: float)
const TRANSITIONS := {
	&"title": [&"prologue", &"briefing", &"shop", &"options", &"codes", &"music", &"lobby", &"pinball"],
	&"prologue": [&"title", &"briefing"],
	&"briefing": [&"title", &"play"],
	&"play": [&"pause", &"clear", &"game_over", &"ending", &"title"],
	&"pause": [&"play", &"title"],
	&"clear": [&"briefing", &"shop", &"ending", &"title"],
	&"game_over": [&"briefing", &"title"],
	&"ending": [&"title"],
	&"shop": [&"title", &"briefing"],
	&"options": [&"title"], &"codes": [&"title"], &"music": [&"title"],
	&"lobby": [&"title", &"briefing"], &"pinball": [&"title"]
}
var state: StringName = &"title"
var elapsed := 0.0
var epoch := 0
var resume_required := false
var pending: Array[Dictionary] = []

func transition(next: StringName) -> bool:
	if next not in TRANSITIONS.get(state, []):
		return false
	var previous := state
	state = next
	# Pausing freezes scheduled simulation events. Leaving play cancels them.
	if previous == &"play" and next != &"pause":
		epoch += 1
		pending.clear()
	elif previous == &"pause" and next != &"play":
		epoch += 1
		pending.clear()
	state_changed.emit(previous, state)
	return true

func schedule(delay: float, callback: Callable) -> void:
	assert(state == &"play")
	pending.append({"time": elapsed + maxf(delay, 0.0), "epoch": epoch, "callback": callback})

func _physics_process(delta: float) -> void:
	if state != &"play":
		return
	elapsed += delta
	var ready: Array[Dictionary] = []
	for i in range(pending.size() - 1, -1, -1):
		if pending[i].time <= elapsed:
			ready.push_front(pending[i])
			pending.remove_at(i)
	ready.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a.time < b.time)
	for event in ready:
		if event.epoch == epoch and state == &"play" and event.callback.is_valid():
			event.callback.call()
	if state == &"play":
		simulation_step.emit(delta)

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and state == &"play":
		resume_required = true
		transition(&"pause")

