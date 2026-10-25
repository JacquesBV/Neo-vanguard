extends RefCounted
class_name NVPinballEngine
## =========================================================================
## PINBALL ENGINE — retranscription fidèle de pinball/engine.js d'origine
## (668 l.) : table 1024×1536, pas fixe 1/240 s, gravité 620, billes,
## batteurs, bumpers, bankes de cibles, slingshots, rampes Catmull-Rom,
## missions (24 secteurs), multibille, défi Vorax. Zéro accès DOM :
## les événements sortent dans `events` (drain_events).
## =========================================================================

const WIDTH := 1024.0
const HEIGHT := 1536.0
const BALL_RADIUS := 19.0
const FIXED_DT := 1.0 / 240.0
const MAX_SPEED := 2400.0
const GRAVITY := 620.0
const MULTIPLIERS := [1, 2, 3, 5]

static func _hyp(x: float, y: float) -> float:
	return sqrt(x * x + y * y)

static func _seg(x1: float, y1: float, x2: float, y2: float, e := 0.82) -> Dictionary:
	return { "x1": x1, "y1": y1, "x2": x2, "y2": y2, "e": e }

static func _polyline(pts: Array, e: float) -> Array:
	var out := []
	for i in range(1, pts.size()):
		out.append(_seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], e))
	return out

## Colliders explicites (les illustrations ne sont pas des obstacles)
static var WALLS: Array = []
static var BUMPERS: Array = [
	{ "x": 512.0, "y": 451.0, "r": 62.0 },
	{ "x": 399.0, "y": 533.0, "r": 62.0 },
	{ "x": 625.0, "y": 533.0, "r": 62.0 },
]
static var POSTS: Array = [
	{ "x": 186.0, "y": 935.0, "r": 18.0 },
	{ "x": 838.0, "y": 935.0, "r": 18.0 },
]
static var SLINGSHOTS: Array = [
	{ "side": "left", "seg": _seg(150, 1120, 274, 1204, 0.94) },
	{ "side": "right", "seg": _seg(874, 1120, 750, 1204, 0.94) },
]
static var TARGETS_DEF: Array = [
	{ "x": 279.0, "y": 739.0, "bank": "left", "index": 0 },
	{ "x": 316.0, "y": 735.0, "bank": "left", "index": 1 },
	{ "x": 352.0, "y": 730.0, "bank": "left", "index": 2 },
	{ "x": 679.0, "y": 730.0, "bank": "right", "index": 0 },
	{ "x": 716.0, "y": 735.0, "bank": "right", "index": 1 },
	{ "x": 753.0, "y": 739.0, "bank": "right", "index": 2 },
]
const REACTOR := { "x": 513.0, "y": 349.0, "r": 41.0 }

## rampes Catmull-Rom (buildRamp)
static func catmull_rom(points: Array, samples: int) -> Array:
	var out := []
	var n: int = points.size()
	for i in n - 1:
		var p0: Array = points[maxi(0, i - 1)]
		var p1: Array = points[i]
		var p2: Array = points[i + 1]
		var p3: Array = points[mini(n - 1, i + 2)]
		for j in samples:
			var t := j / float(samples)
			var t2 := t * t
			var t3 := t2 * t
			out.append([
				0.5 * (2.0 * p1[0] + (-p0[0] + p2[0]) * t + (2.0 * p0[0] - 5.0 * p1[0] + 4.0 * p2[0] - p3[0]) * t2 + (-p0[0] + 3.0 * p1[0] - 3.0 * p2[0] + p3[0]) * t3),
				0.5 * (2.0 * p1[1] + (-p0[1] + p2[1]) * t + (2.0 * p0[1] - 5.0 * p1[1] + 4.0 * p2[1] - p3[1]) * t2 + (-p0[1] + 3.0 * p1[1] - 3.0 * p2[1] + p3[1]) * t3),
			])
	out.append([points[n - 1][0], points[n - 1][1]])
	return out

static func build_ramp(side: String, ctrl: Array) -> Dictionary:
	var points := catmull_rom(ctrl, 28)
	var cumulative := [0.0]
	for i in range(1, points.size()):
		cumulative.append(cumulative[i - 1] + _hyp(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
	return {
		"side": side, "control": ctrl, "points": points, "cumulative": cumulative,
		"length": cumulative[cumulative.size() - 1],
		"entry": { "x": ctrl[0][0], "y": ctrl[0][1], "r": 48.0 },
	}

static var RAMPS: Dictionary = {}

static func _static_init() -> void:
	if not WALLS.is_empty():
		return
	WALLS.append_array(_polyline([
		[46, 318], [46, 230], [62, 165], [105, 115], [170, 82], [260, 65],
		[764, 65], [854, 82], [919, 115], [962, 165], [994, 230], [994, 1505],
	], 0.84))
	WALLS.append_array(_polyline([[46, 318], [46, 1110], [70, 1240], [210, 1380], [400, 1492], [450, 1518]], 0.8))
	WALLS.append_array(_polyline([[934, 560], [934, 1110], [910, 1240], [814, 1380], [624, 1492], [574, 1518]], 0.8))
	WALLS.append(_seg(92, 1040, 152, 1130, 0.86))
	WALLS.append(_seg(932, 1040, 872, 1130, 0.86))
	RAMPS["left"] = build_ramp("left", [[205, 710], [132, 610], [112, 420], [142, 220], [224, 142], [304, 184], [326, 302]])
	RAMPS["right"] = build_ramp("right", [[819, 710], [892, 610], [912, 420], [882, 220], [800, 142], [720, 184], [698, 302]])

static func sample_ramp(ramp: Dictionary, distance: float) -> Dictionary:
	var d := clampf(distance, 0.0, ramp.length)
	var lo := 0
	var hi: int = ramp.cumulative.size() - 1
	while lo + 1 < hi:
		var mid := (lo + hi) >> 1
		if ramp.cumulative[mid] <= d: lo = mid
		else: hi = mid
	var a: Array = ramp.points[lo]
	var b: Array = ramp.points[mini(lo + 1, ramp.points.size() - 1)]
	var span: float = maxf(0.0001, ramp.cumulative[mini(lo + 1, ramp.cumulative.size() - 1)] - ramp.cumulative[lo])
	var t := clampf((d - ramp.cumulative[lo]) / span, 0.0, 1.0)
	var dx: float = b[0] - a[0]
	var dy: float = b[1] - a[1]
	var l := maxf(0.0001, _hyp(dx, dy))
	return { "x": a[0] + dx * t, "y": a[1] + dy * t, "tx": dx / l, "ty": dy / l }

static func _closest(px: float, py: float, s: Dictionary) -> Dictionary:
	var dx: float = s.x2 - s.x1
	var dy: float = s.y2 - s.y1
	var denom: float = dx * dx + dy * dy
	var t := 0.0
	if denom != 0.0:
		t = clampf(((px - s.x1) * dx + (py - s.y1) * dy) / denom, 0.0, 1.0)
	return { "x": s.x1 + dx * t, "y": s.y1 + dy * t, "t": t }

## collision cercle/capsule avec correction de position + vitesse de surface
static func collide_capsule(ball: Dictionary, s: Dictionary, radius: float, restitution: float, owner_node: Object, surface_vel: StringName = &"") -> Dictionary:
	var q := _closest(ball.x, ball.y, s)
	var dx: float = ball.x - q.x
	var dy: float = ball.y - q.y
	var d := _hyp(dx, dy)
	var min_d: float = ball.r + radius
	if d >= min_d:
		return {}
	if d < 0.0001:
		var sx: float = s.x2 - s.x1
		var sy: float = s.y2 - s.y1
		var sl := maxf(0.0001, _hyp(sx, sy))
		dx = -sy / sl
		dy = sx / sl
		if dx * ball.vx + dy * ball.vy > 0.0:
			dx = -dx
			dy = -dy
		d = 1.0
	var nx := dx / d
	var ny := dy / d
	ball.x = q.x + nx * (min_d + 0.03)
	ball.y = q.y + ny * (min_d + 0.03)
	var svx := 0.0
	var svy := 0.0
	if surface_vel != &"":
		var sv: Dictionary = owner_node.call(surface_vel, q, s)
		svx = sv.x
		svy = sv.y
	var rvx: float = ball.vx - svx
	var rvy: float = ball.vy - svy
	var vn := rvx * nx + rvy * ny
	var impact := -vn
	if vn < 0.0:
		ball.vx -= (1.0 + restitution) * vn * nx
		ball.vy -= (1.0 + restitution) * vn * ny
	return { "nx": nx, "ny": ny, "impact": impact, "q": q }

static func collide_circle(ball: Dictionary, circle: Dictionary, restitution: float) -> Dictionary:
	var dx: float = ball.x - circle.x
	var dy: float = ball.y - circle.y
	var d := _hyp(dx, dy)
	var min_d: float = ball.r + circle.r
	if d >= min_d:
		return {}
	if d < 0.0001:
		dx = 0.0
		dy = -1.0
		d = 1.0
	var nx := dx / d
	var ny := dy / d
	ball.x = circle.x + nx * (min_d + 0.03)
	ball.y = circle.y + ny * (min_d + 0.03)
	var vn: float = ball.vx * nx + ball.vy * ny
	var impact: float = -vn
	if vn < 0.0:
		ball.vx -= (1.0 + restitution) * vn * nx
		ball.vy -= (1.0 + restitution) * vn * ny
	return { "nx": nx, "ny": ny, "impact": impact }

## =========================================================================
## LA PARTIE — port de la classe Game
## =========================================================================
var running := false
var paused := false
var state := "playing"
var time := 0.0
var score := 0
var stock := 3
var multiplier_index := 0
var balls: Array = []
var pending_launches: Array = []
var flippers: Array = []
var targets: Array = []
var bank_timers := { "left": 0.0, "right": 0.0 }
var bank_toward_multiplier := 0
var bank_series := 0
var sector := 1
var mission_progress := 0
var mission_banks := { "left": false, "right": false }
var campaign_complete := false
var challenge = null            # { time, hits } pendant le défi Vorax
var multiball := false
var vorax_victories := 0
var plunger_held := false
var accumulator := 0.0
var events: Array = []
var _next_ball_id := 0

func _init() -> void:
	NVPinballEngine._static_init()
	start()

static func make_flippers() -> Array:
	var deg := PI / 180.0
	return [
		{ "side": "left", "x": 305.0, "y": 1278.0, "length": 170.0, "radius": 18.0,
			"rest": 25.0 * deg, "active": -25.0 * deg, "angle": 25.0 * deg, "held": false, "omega": 0.0 },
		{ "side": "right", "x": 717.0, "y": 1278.0, "length": 170.0, "radius": 18.0,
			"rest": 155.0 * deg, "active": 205.0 * deg, "angle": 155.0 * deg, "held": false, "omega": 0.0 },
	]

static func flipper_segment(f: Dictionary) -> Dictionary:
	return { "x1": f.x, "y1": f.y, "x2": f.x + cos(f.angle) * f.length, "y2": f.y + sin(f.angle) * f.length }

func start() -> void:
	running = true
	paused = false
	state = "playing"
	time = 0.0
	score = 0
	stock = 3
	multiplier_index = 0
	balls = []
	pending_launches = []
	flippers = make_flippers()
	targets = []
	for t in TARGETS_DEF:
		var tt: Dictionary = t.duplicate()
		tt["down"] = false
		targets.append(tt)
	bank_timers = { "left": 0.0, "right": 0.0 }
	bank_toward_multiplier = 0
	bank_series = 0
	sector = 1
	mission_progress = 0
	mission_banks.left = false
	mission_banks.right = false
	campaign_complete = false
	challenge = null
	multiball = false
	vorax_victories = 0
	plunger_held = false
	accumulator = 0.0
	events.clear()
	spawn_ball(false, 8.0)
	_emit("newGame", { "stock": stock })

func _emit(type: String, data: Dictionary) -> void:
	var ev := { "type": type, "time": time }
	ev.merge(data, true)
	events.append(ev)

func drain_events() -> Array:
	var out := events.duplicate()
	events.clear()
	return out

func set_paused(value: bool) -> void:
	paused = value
	accumulator = 0.0
	if paused:
		plunger_held = false
		for f in flippers:
			f.held = false

func set_flipper(side: String, held: bool) -> void:
	for f in flippers:
		if f.side == side:
			if f.held == held:
				return
			f.held = held
			if held:
				_emit("flipper", { "side": side })
			return

func release_controls() -> void:
	plunger_held = false
	for f in flippers:
		f.held = false

func set_plunger(held: bool) -> void:
	if held == plunger_held:
		return
	plunger_held = held
	if not held:
		for b in balls:
			if b.ready:
				launch(b, b.charge)
				break

func spawn_ball(auto: bool, saver: float) -> Dictionary:
	_next_ball_id += 1
	var ball := {
		"id": _next_ball_id, "x": 970.0, "y": 1400.0, "vx": 0.0, "vy": 0.0, "r": BALL_RADIUS,
		"ready": true, "charge": 0.0, "saver": 0.0, "saver_on_launch": maxf(0.0, saver),
		"ramp": null, "ramp_distance": 0.0, "ramp_speed": 0.0, "ramp_cooldown": 0.0,
		"cooldowns": {}, "rotation": 0.0,
	}
	balls.append(ball)
	if auto:
		launch(ball, 0.82)
	return ball

func launch(ball: Dictionary, power: float) -> void:
	if ball == null or not ball.ready:
		return
	power = clampf(power, 0.0, 1.0)
	ball.ready = false
	ball.charge = 0.0
	ball.saver = ball.saver_on_launch
	ball.saver_on_launch = 0.0
	ball.vx = -24.0
	ball.vy = -(1350.0 + 950.0 * power)
	plunger_held = false
	_emit("launch", { "x": ball.x, "y": ball.y, "power": power, "saver": ball.saver })

func award(base: float, kind: String, x := 512.0, y := 700.0) -> int:
	var points := int(round(base * MULTIPLIERS[multiplier_index]))
	score += points
	_emit("score", { "base": base, "points": points, "kind": kind, "x": x, "y": y })
	return points

func mission_type() -> int:
	return (sector - 1) % 4

func mission_info() -> Dictionary:
	if challenge != null:
		return { "type": "vorax", "progress": challenge.hits, "target": 5, "time": challenge.time }
	if campaign_complete:
		return { "type": "rearm", "progress": mini(2, bank_series), "target": 2, "time": 0.0 }
	var type := mission_type()
	if type == 3:
		return { "type": type, "progress": (1 if mission_banks.left else 0) + (1 if mission_banks.right else 0), "target": 2, "time": 0.0 }
	return { "type": type, "progress": mission_progress, "target": 10 if type == 0 else 2, "time": 0.0 }

func progress_mission(amount: int) -> void:
	if campaign_complete or sector > 24:
		return
	var type := mission_type()
	if type == 3:
		return
	mission_progress += amount
	var target := 10 if type == 0 else 2
	if mission_progress >= target:
		complete_mission()

func complete_mission() -> void:
	if campaign_complete:
		return
	var completed := sector
	award(10000, "sector", 512.0, 250.0)
	_emit("sector", { "sector": completed })
	if completed >= 24:
		campaign_complete = true
		mission_progress = 0
		start_vorax()
		return
	sector += 1
	mission_progress = 0
	mission_banks.left = false
	mission_banks.right = false

func complete_bank(side: String) -> void:
	award(5000, "bank", 315.0 if side == "left" else 715.0, 690.0)
	_emit("bank", { "side": side })
	if not multiball:
		bank_series += 1
	bank_toward_multiplier += 1
	if bank_toward_multiplier >= 2:
		bank_toward_multiplier = 0
		multiplier_index = mini(MULTIPLIERS.size() - 1, multiplier_index + 1)
		_emit("multiplier", { "value": MULTIPLIERS[multiplier_index] })
	if not campaign_complete and mission_type() == 3:
		mission_banks[side] = true
		if mission_banks.left and mission_banks.right:
			complete_mission()
	if campaign_complete and challenge == null and not multiball and bank_series >= 2:
		start_vorax()

func start_vorax() -> void:
	if not campaign_complete or challenge != null or multiball or not running:
		return
	bank_series = 0
	challenge = { "time": 45.0, "hits": 0 }
	_emit("voraxStart", { "duration": 45.0 })

func hit_reactor(ball: Dictionary) -> void:
	if challenge == null or ball.cooldowns.get("reactor", 0.0) > 0.0:
		return
	ball.cooldowns["reactor"] = 0.35
	challenge.hits += 1
	award(5000, "reactor", REACTOR.x, REACTOR.y)
	_emit("reactor", { "hits": challenge.hits, "x": REACTOR.x, "y": REACTOR.y })
	if challenge.hits >= 5:
		defeat_vorax()

func defeat_vorax() -> void:
	if challenge == null:
		return
	challenge = null
	bank_series = 0
	vorax_victories += 1
	award(100000, "vorax", REACTOR.x, REACTOR.y)
	multiball = true
	var count := balls.size() + pending_launches.size()
	var needed := maxi(0, 3 - count)
	for i in needed:
		pending_launches.append({ "delay": 0.8 * (i + 1) })
	_emit("voraxWin", {})
	_emit("multiball", { "total": mini(3, count + needed) })

func enter_ramp(ball: Dictionary, ramp: Dictionary) -> void:
	ball.ramp = ramp
	ball.ramp_distance = 0.0
	ball.ramp_speed = clampf(_hyp(ball.vx, ball.vy) * 0.9, 780.0, 1250.0)
	ball.vx = 0.0
	ball.vy = 0.0
	ball.x = ramp.control[0][0]
	ball.y = ramp.control[0][1]
	_emit("rampEnter", { "side": ramp.side, "x": ball.x, "y": ball.y })

func complete_ramp(ball: Dictionary) -> void:
	var ramp: Dictionary = ball.ramp
	if ramp == null:
		return
	var p := sample_ramp(ramp, ramp.length)
	ball.x = p.x
	ball.y = p.y
	ball.vx = p.tx * 640.0
	ball.vy = absf(p.ty * 640.0) + 220.0
	ball.ramp = null
	ball.ramp_cooldown = 1.0
	var jackpot := multiball and balls.size() >= 2
	if jackpot:
		award(25000, "jackpot", ball.x, ball.y)
		_emit("jackpot", { "side": ramp.side, "x": ball.x, "y": ball.y })
	else:
		award(2500, "ramp", ball.x, ball.y)
		_emit("ramp", { "side": ramp.side, "x": ball.x, "y": ball.y })
	var type := mission_type()
	if not campaign_complete and ((type == 1 and ramp.side == "left") or (type == 2 and ramp.side == "right")):
		progress_mission(1)

func update_flipper(f: Dictionary, dt: float) -> void:
	var old: float = f.angle
	var target: float = f.active if f.held else f.rest
	var duration := 0.055 if f.held else 0.08
	var speed: float = absf(f.active - f.rest) / duration
	f.angle = move_toward(f.angle, target, speed * dt)
	f.omega = (f.angle - old) / dt

func _flipper_surface_vel(q: Dictionary, f: Dictionary) -> Dictionary:
	var rx: float = q.x - f.x
	var ry: float = q.y - f.y
	return { "x": -f.omega * ry, "y": f.omega * rx }

func collide_world(ball: Dictionary) -> void:
	for wall in WALLS:
		var hit := collide_capsule(ball, wall, 0.0, wall.e, self)
		if not hit.is_empty() and hit.impact > 210.0 and ball.cooldowns.get("metal", 0.0) <= 0.0:
			ball.cooldowns["metal"] = 0.09
			_emit("metal", { "x": ball.x, "y": ball.y, "speed": hit.impact })
	for i in BUMPERS.size():
		var b: Dictionary = BUMPERS[i]
		var hit2 := collide_circle(ball, b, 0.96)
		if hit2.is_empty():
			continue
		if ball.cooldowns.get("bumper" + str(i), 0.0) <= 0.0:
			ball.cooldowns["bumper" + str(i)] = 0.13
			ball.vx += hit2.nx * 540.0
			ball.vy += hit2.ny * 540.0
			award(500, "bumper", b.x, b.y)
			_emit("bumper", { "index": i, "x": b.x, "y": b.y })
			if not campaign_complete and mission_type() == 0:
				progress_mission(1)
	for i in POSTS.size():
		var p: Dictionary = POSTS[i]
		var hit3 := collide_circle(ball, p, 0.9)
		if not hit3.is_empty() and ball.cooldowns.get("post" + str(i), 0.0) <= 0.0:
			ball.cooldowns["post" + str(i)] = 0.16
			ball.vx += hit3.nx * 120.0
			ball.vy += hit3.ny * 120.0
			award(100, "post", p.x, p.y)
			_emit("post", { "index": i, "x": p.x, "y": p.y })
	for sling in SLINGSHOTS:
		var hit4 := collide_capsule(ball, sling.seg, 9.0, sling.seg.e, self)
		if not hit4.is_empty() and ball.cooldowns.get("sling" + sling.side, 0.0) <= 0.0:
			ball.cooldowns["sling" + sling.side] = 0.18
			ball.vx += hit4.nx * 390.0
			ball.vy += hit4.ny * 390.0 - 90.0
			award(100, "sling", ball.x, ball.y)
			_emit("sling", { "side": sling.side, "x": ball.x, "y": ball.y })
	for t in targets:
		if t.down:
			continue
		var s := _seg(t.x, t.y - 24.0, t.x, t.y + 24.0, 0.72)
		var hit5 := collide_capsule(ball, s, 12.0, 0.72, self)
		if not hit5.is_empty():
			t.down = true
			award(1000, "target", t.x, t.y)
			_emit("target", { "bank": t.bank, "index": t.index, "x": t.x, "y": t.y })
			var bank_done := true
			for t2 in targets:
				if t2.bank == t.bank and not t2.down:
					bank_done = false
			if bank_done:
				bank_timers[t.bank] = 1.0
				complete_bank(t.bank)
	if challenge != null:
		var hit6 := collide_circle(ball, REACTOR, 0.9)
		if not hit6.is_empty():
			ball.vx += hit6.nx * 180.0
			ball.vy += hit6.ny * 180.0
			hit_reactor(ball)
	for f in flippers:
		var s2: Dictionary = flipper_segment(f)
		var hit7 := collide_capsule(ball, s2, f.radius, 0.84, self, &"_flipper_surface_vel")
		if not hit7.is_empty() and absf(f.omega) > 2.0 and hit7.impact > 0.0:
			ball.vx += hit7.nx * minf(170.0, absf(f.omega) * 7.0)
			ball.vy += hit7.ny * minf(170.0, absf(f.omega) * 7.0)

func update_ball(ball: Dictionary, dt: float) -> void:
	for key in ball.cooldowns.keys():
		ball.cooldowns[key] = maxf(0.0, ball.cooldowns[key] - dt)
	ball.ramp_cooldown = maxf(0.0, ball.ramp_cooldown - dt)
	ball.saver = maxf(0.0, ball.saver - dt)
	ball.rotation += (ball.vx / maxf(1.0, ball.r)) * dt
	if ball.ready:
		ball.x = 970.0
		ball.y = 1400.0
		ball.vx = 0.0
		ball.vy = 0.0
		if plunger_held:
			ball.charge = minf(1.0, ball.charge + dt / 1.35)
		return
	if ball.ramp != null:
		ball.ramp_distance += ball.ramp_speed * dt
		var p := sample_ramp(ball.ramp, ball.ramp_distance)
		ball.x = p.x
		ball.y = p.y
		if ball.ramp_distance >= ball.ramp.length:
			complete_ramp(ball)
		return
	ball.vy += GRAVITY * dt
	var damping := maxf(0.0, 1.0 - 0.025 * dt)
	ball.vx *= damping
	ball.vy *= damping
	var speed := _hyp(ball.vx, ball.vy)
	if speed > MAX_SPEED:
		ball.vx *= MAX_SPEED / speed
		ball.vy *= MAX_SPEED / speed
	ball.x += ball.vx * dt
	ball.y += ball.vy * dt
	collide_world(ball)
	collide_world(ball)
	if ball.ramp_cooldown <= 0.0 and ball.vy < -300.0:
		for side in ["left", "right"]:
			var ramp: Dictionary = RAMPS[side]
			if _hyp(ball.x - ramp.entry.x, ball.y - ramp.entry.y) < ramp.entry.r:
				enter_ramp(ball, ramp)
				break

func check_drains() -> void:
	var drained := []
	var kept := []
	for ball in balls:
		if ball.y > HEIGHT + 28.0 or ball.x < -70.0 or ball.x > WIDTH + 70.0:
			drained.append(ball)
		else:
			kept.append(ball)
	if drained.is_empty():
		return
	balls = kept
	for ball in drained:
		_emit("drain", { "x": ball.x, "y": minf(ball.y, HEIGHT), "saver": ball.saver })
	if multiball and balls.size() < 2 and pending_launches.is_empty():
		multiball = false
		_emit("multiballEnd", {})
	if not balls.is_empty() or not pending_launches.is_empty() or not running:
		return
	var saved: Dictionary = {}
	for ball in drained:
		if ball.saver > 0.0:
			saved = ball
			break
	if not saved.is_empty():
		_emit("ballSave", {})
		spawn_ball(false, 0.0)
		return
	stock -= 1
	_emit("ballLost", { "remaining": stock })
	if stock > 0:
		multiplier_index = 0
		bank_toward_multiplier = 0
		spawn_ball(false, 8.0)
	else:
		running = false
		state = "over"
		release_controls()
		_emit("gameOver", { "score": score })

func step(dt := FIXED_DT) -> void:
	if not running or paused:
		return
	time += dt
	for f in flippers:
		update_flipper(f, dt)
	for side in ["left", "right"]:
		if bank_timers[side] > 0.0:
			bank_timers[side] -= dt
			if bank_timers[side] <= 0.0:
				for t in targets:
					if t.bank == side:
						t.down = false
				_emit("bankReset", { "side": side })
	if challenge != null:
		challenge.time -= dt
		if challenge.time <= 0.0:
			challenge = null
			bank_series = 0
			_emit("voraxFailed", {})
	for i in range(pending_launches.size() - 1, -1, -1):
		pending_launches[i].delay -= dt
		if pending_launches[i].delay <= 0.0:
			pending_launches.remove_at(i)
			spawn_ball(true, 0.0)
	for ball in balls.duplicate():
		update_ball(ball, dt)
	check_drains()

func advance(frame_dt: float) -> float:
	if not running or paused:
		accumulator = 0.0
		return 0.0
	accumulator += clampf(frame_dt, 0.0, 0.05)
	var steps := 0
	while accumulator >= FIXED_DT and steps < 16:
		step(FIXED_DT)
		accumulator -= FIXED_DT
		steps += 1
	if steps == 16:
		accumulator = 0.0
	return accumulator / FIXED_DT
