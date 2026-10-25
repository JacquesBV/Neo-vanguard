extends Node2D
class_name NVGame
## =========================================================================
## GAME — le moteur de jeu complet, porté de js/02-moteur-jeu.js.
## Toutes les valeurs (vitesses, cadences, vagues, attaques de boss,
## butin, économie) sont celles du jeu original.
## Rendu : dessin vectoriel par ère, comme le canvas d'origine.
## =========================================================================

signal sector_won(level: int, stats: Dictionary)
signal run_over(stats: Dictionary)
signal request_pause

enum Phase { INTRO, WAVES, BOSS_WARN, BOSS, HARVEST, CLEAR, OVER }

# --- état global de la partie ----------------------------------------------
var state := "menu"            # menu | play | over
var paused := false
var level := 1
var era_idx := 0
var daily := false
var daily_mods: Array = []
var two_p := false

var phase: int = Phase.INTRO
var phase_t := 0.0
var wave_t := 0.0
var wave_idx := 0
var plan: Array = []
var level_t := 0.0

# entités (tableaux de dictionnaires, comme le JS)
var players: Array = []
var enemies: Array = []
var bullets: Array = []       # tirs du joueur
var ebullets: Array = []      # tirs ennemis
var pickups: Array = []
var parts: Array = []         # particules
var shocks: Array = []        # anneaux de choc
var beams: Array = []         # rayons de boss
var props: Array = []         # caisses destructibles
var pops: Array = []          # textes flottants
var scheduled: Array = []     # actions différées (rafales de boss)

var boss: Dictionary = {}
# module 29 (secteur 24) : le sas de la base, destructible pendant l'alerte
var sas: Dictionary = {}
var nv24_tex: Dictionary = {}   # couloir / sas (ImageTexture sandbox-safe)
var nv24_said: Dictionary = {}  # répliques radio déjà dites
var combo := 0
var combo_t := 0.0
var combo_max := 0
var score := 0
var sec_score := 0
var credits_run := 0
var kills := 0
var sec_kills := 0
var sec_graze := 0
var graze_total := 0
var no_death := true
var prop_t := 6.0
var mid_boss_done := false
var spiral_a := 0.0
var harvest: Dictionary = {}
var last_bonus := 0
var clear_wait := 0.0
var shake := 0.0
var flash := 0.0
var flash_col := Color.WHITE
var slow_f := 1.0             # ralenti (bombe, matrix)
var slow_t := 0.0

var stats: Dictionary = {}
var TH: Dictionary = {}       # thème de couleurs de l'ère courante
const PocketBaker := preload("res://scripts/sprites/pocket_baker.gd")
const Guardian := preload("res://scripts/sprites/guardian_sprite.gd")
const BossAtlas := preload("res://scripts/sprites/boss_atlas.gd")
const PixelUi := preload("res://scripts/ui/pixel_ui.gd")
var scroll_y := 0.0
var star_seed := 0
var intro_t := 0.0
var boss_warn_t := 0.0
var time_accum := 0.0
var stars: Array = []         # 6 couches d'étoiles défilantes
var decor: Dictionary = {}    # décor peint de l'ère (construit par secteur)

const GLOW := Color(1, 1, 1)

# =========================================================================
#  CYCLE DE VIE
# =========================================================================
func _ready() -> void:
	set_era(0)
	star_seed = randi() % 100000
	for l in 6:
		var layer: Array = []
		for i in 42:
			layer.append({ "x": randf() * Data.FW, "y": randf() * Data.FH, "s": 1.0 + float(i % 3) })
		stars.append(layer)

func begin_level(lv: int, is_daily := false, mods: Array = []) -> void:
	level = clampi(lv, 1, Data.MAX_LEVEL)
	Audio2.game_era = Data.era_of_level(level)
	daily = is_daily
	daily_mods = mods
	era_idx = Data.era_of_level(level)
	set_era(era_idx)
	stats = Save.compute_stats(level)
	# le code SAUT DE SECTEUR démarre plus loin
	if Save.cheat_on("jump") and Save.S.cheats.start_level > 1 and lv == 1:
		level = clampi(Save.S.cheats.start_level, 1, Data.MAX_LEVEL)
		era_idx = Data.era_of_level(level)
		set_era(era_idx)
	players.clear()
	var n := 2 if two_p else 1
	for i in n:
		var P := make_player(i + 1)
		players.append(P)
	place_players()
	enemies.clear(); bullets.clear(); ebullets.clear(); pickups.clear()
	parts.clear(); shocks.clear(); beams.clear(); props.clear(); pops.clear(); scheduled.clear()
	boss = {}
	combo = 0; combo_t = 0.0; combo_max = 0
	sec_kills = 0; sec_graze = 0; level_t = 0.0; no_death = true
	prop_t = 6.0; harvest = {}; last_bonus = 0; clear_wait = 0.0
	spiral_a = 0.0
	plan = build_plan(level)
	wave_idx = 0; wave_t = 0.0
	# module 29 : au secteur 24, l'alerte amirale devient le sas de la base
	sas = {}
	nv24_said = {}
	if level == Data.MAX_LEVEL:
		var shp: float = Save.e_scale(level).hp
		var dhp := maxi(1, int(round(60.0 * shp * (1.5 if two_p else 1.0))))
		sas = { "hp": float(dhp), "max": float(dhp), "flash": 0.0, "w": 216.0, "h": 74.0, "x": Data.FW / 2.0, "y": 118.0, "boom": false }
		nv24_load_art()
	phase = Phase.INTRO
	phase_t = 0.0
	scroll_y = 0.0
	state = "play"
	paused = false
	_build_decor()
	Audio2.start_music(era_idx, level)
	Audio2.speak("Secteur %d. %s." % [level, Data.ERAS[era_idx].name])
	queue_redraw()

func make_player(id: int) -> Dictionary:
	var d: Dictionary = Data.DIFFS[int(Save.S.opts.diff)]
	return {
		"id": id, "x": Data.FW / 2.0, "y": Data.FH - 150.0, "vx": 0.0, "vy": 0.0,
		"r": 6.0, "hp": stats.max_hp, "max_hp": stats.max_hp,
		"shield": (0 if (daily and daily_mods.has("noshield")) else stats.shields),
		"sh_max": stats.shields, "sh_cd": 8.0,
		"inv": 2.6, "fire_cd": 0.0, "power": (5 if Save.cheat_on("power") else 1),
		"drone_a": 0.0, "drone_cd": 0.0, "drones": [], "hit_t": 0.0, "alive": true,
		"trail_t": 0.0, "aura_t": 0.0, "bank": 0.0, "dead": 0.0, "shield_fx": 0.0,
		"lives": int(d.lives) - 1, "score": 0, "bombs": clampi(2 + Save.upg_level("bomb"), 0, 5),
		"out": false, "bomb_cd": 0.0, "rail_side": 0, "fly_away": null,
	}

func place_players() -> void:
	var n := players.size()
	for i in n:
		var P: Dictionary = players[i]
		P.x = (Data.FW / 2.0) if n == 1 else Data.FW * (0.62 if i == 1 else 0.38)
		P.y = Data.FH - ((150.0) if n == 1 else (132.0 - i * 26.0))

func first_player() -> Dictionary:
	return players[0] if players.size() > 0 else {}

func nearest_player(x: float, y: float) -> Dictionary:
	var best := {}
	var bd := INF
	for p in players:
		if not p.alive or p.out: continue
		var d: float = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y)
		if d < bd: bd = d; best = p
	return best

# =========================================================================
#  THÈME DE COULEURS PAR ÈRE
# =========================================================================
func set_era(e: int) -> void:
	era_idx = clampi(e, 0, 5)
	var gb: Array = Data.livery_by_id(Save.S.sel.livery).gb
	var t := {}
	match era_idx:
		0: # POCKET — encres LCD de la console (sauge pâle / olive sombre)
			gb = Data.INKS
			t = { "bg": gb[3], "bg2": gb[2], "bg3": gb[1], "star": gb[1],
				"p_main": gb[0], "p_lite": gb[2], "p_dark": gb[0], "p_glow": gb[1],
				"e_main": gb[0], "e_lite": gb[1], "e_boss": gb[2], "e_boss_lite": gb[3],
				"acc": gb[0], "livery": gb }
		1:
			t = { "bg": "#0c1034", "bg2": "#111a44", "bg3": "#1b2a6e", "star": "#8fd3ff",
				"p_main": "#4a90d9", "p_lite": "#d9f2ff", "p_dark": "#0a1030", "p_glow": "#8fd3ff",
				"e_boss": "#f24fd9", "e_boss_lite": "#ffd9f9", "acc": "#f24fd9", "livery": gb }
		2:
			t = { "bg": "#05060f", "bg2": "#0c1230", "bg3": "#16205c", "star": "#38e0ff",
				"p_main": "#3f6fe0", "p_lite": "#aef2ff", "p_dark": "#0c1230", "p_glow": "#38e0ff",
				"e_boss": "#ff4d6d", "e_boss_lite": "#ffd1dc", "acc": "#f24fd9", "livery": gb }
		3:
			t = { "bg": "#04030e", "bg2": "#0a0722", "bg3": "#241a66", "star": "#8a6bff",
				"p_main": "#5a3fd9", "p_lite": "#c9b8ff", "p_dark": "#140f3c", "p_glow": "#ff9a3d",
				"e_boss": "#ff4fb0", "e_boss_lite": "#ffd9f2", "acc": "#ff9a3d", "livery": gb }
		4:
			t = { "bg": "#05060a", "bg2": "#0b0e18", "bg3": "#232c45", "star": "#8d9ec7",
				"p_main": "#8d9ec7", "p_lite": "#d6e2ff", "p_dark": "#141a2b", "p_glow": "#ffbe6b",
				"e_boss": "#ff9a3d", "e_boss_lite": "#ffe2b8", "acc": "#ffbe6b", "livery": gb }
		5:
			t = { "bg": "#03060f", "bg2": "#0a142c", "bg3": "#241a5c", "star": "#4be7ff",
				"p_main": "#4be7ff", "p_lite": "#eaf6ff", "p_dark": "#0a142c", "p_glow": "#4be7ff",
				"e_boss": "#ff5fa2", "e_boss_lite": "#ffd9ec", "acc": "#ff5fa2", "livery": gb }
	t["danger"] = Color("#ff405f")
	t["gold"] = Color("#ffd166")
	t["shield"] = Color("#4be7ff")
	t["hull"] = Color("#4dff9e")
	t["white"] = Color.WHITE
	t["livery"] = [Color(gb[0]), Color(gb[1]), Color(gb[2]), Color(gb[3])]
	for k in t:
		if t[k] is String: t[k] = Color(t[k])
	TH = t

# =========================================================================
#  BOUCLE PRINCIPALE
# =========================================================================
func _process(delta: float) -> void:
	if state != "play" or paused:
		queue_redraw()
		return
	# ralenti (bombe / code MATRIX)
	if slow_t > 0.0:
		slow_t -= delta
		if slow_t <= 0.0: slow_f = 1.0
	var dt := delta * slow_f * (0.6 if Save.cheat_on("slow") else 1.0)
	level_t += dt
	scroll_y += Data.SCROLL_SPEED * dt
	time_accum += dt
	if shake > 0.0: shake = maxf(0.0, shake - delta * 60.0)
	if flash > 0.0: flash = maxf(0.0, flash - delta * 2.4)

	match phase:
		Phase.INTRO:
			intro_t += dt
			phase_t += dt
			if phase_t > Data.INTRO_DUR:
				phase = Phase.WAVES
				phase_t = 0.0
		Phase.WAVES:
			wave_t += dt
			while wave_idx < plan.size() and plan[wave_idx].t <= wave_t:
				_run_wave(plan[wave_idx])
				wave_idx += 1
			_update_props(dt)
			if wave_idx >= plan.size() and enemies.is_empty() and wave_t > plan[plan.size() - 1].t + 3.0:
				phase = Phase.BOSS_WARN
				boss_warn_t = 0.0
				Audio2.sfx("bossalarm")
				add_flash(0.22, Color("#ff405f") if era_idx > 0 else TH.livery[2])
				add_shake(10)
				Audio2.speak("Alerte. Signature amirale détectée.")
		Phase.BOSS_WARN:
			boss_warn_t += dt
			_update_props(dt)
			if not sas.is_empty() and not sas.boom:
				sas.flash = maxf(0.0, sas.flash - dt)
				if sas.hp <= 0.0:
					# le sas a cédé : battants arrachés (module 29, état boom)
					sas.boom = true
					Nv24Audio.sound("25_base_effondrement")
					Nv24Audio.sound("24_debris_retombee")
					add_flash(0.3, Color("#ffd166"))
					add_shake(16)
					for i in 46:
						var an := randf() * TAU
						var vv := randf_range(80.0, 420.0)
						spawn_part(sas.x + randf_range(-90.0, 90.0), sas.y + randf_range(-30.0, 30.0),
							cos(an) * vv, sin(an) * vv, randf_range(0.4, 1.0),
							[Color("#c0c8d8"), Color("#ffd166"), Color("#ff7657")].pick_random(), randf_range(2.0, 6.0), era_idx >= 1)
					nv24_radio("v3", "Le sas a cédé. Le couloir est truffé de tourelles, reste mobile !")
					boss_warn_t = Data.BOSS_WARN_DUR
			if boss_warn_t > Data.BOSS_WARN_DUR:
				phase = Phase.BOSS
				if level == Data.MAX_LEVEL:
					Nv24Audio.sound("11_doigts_percement")
					nv24_radio("v6", "Vise la tête, Vanguard. C'est là qu'il est fragile.")
				spawn_boss()
		Phase.BOSS:
			update_boss(dt)
			_update_props(dt)
		Phase.HARVEST:
			update_harvest(dt)
		Phase.CLEAR:
			clear_wait += dt
			if clear_wait > 2.6:
				state = "menu"
				var st := { "level": level, "score": score, "credits": credits_run,
					"kills": kills, "bonus": last_bonus, "no_death": no_death,
					"combo_max": combo_max, "graze": graze_total }
				sector_won.emit(level, st)
				return

	# updates permanents
	if phase != Phase.HARVEST and phase != Phase.CLEAR:
		apply_scheduled(dt)
	update_players(dt)
	update_enemies(dt)
	update_bullets(dt)
	update_ebullets(dt)
	update_pickups(dt)
	update_beams(dt)
	update_parts(dt)
	update_stars(dt)
	if combo_t > 0.0:
		combo_t -= dt
		if combo_t <= 0.0: combo = 0
	queue_redraw()

func update_stars(dt: float) -> void:
	var n_layers: int = Data.ERAS[era_idx].star_layers
	for l in mini(n_layers, stars.size()):
		var spd := 18.0 + l * 26.0
		for st in stars[l]:
			st.y += spd * dt
			if st.y > Data.FH + 4:
				st.y = -4.0
				st.x = randf() * Data.FW

# =========================================================================
#  ENTRÉES
# =========================================================================
func _axis(id: int) -> Vector2:
	var v := Vector2.ZERO
	if id == 1:
		if players.size() > 1:
			# à deux : le P1 ne lit que les flèches — ZQSD/WASD appartiennent au P2
			v.x = (1.0 if Input.is_physical_key_pressed(KEY_RIGHT) else 0.0) - (1.0 if Input.is_physical_key_pressed(KEY_LEFT) else 0.0)
			v.y = (1.0 if Input.is_physical_key_pressed(KEY_DOWN) else 0.0) - (1.0 if Input.is_physical_key_pressed(KEY_UP) else 0.0)
		else:
			v.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
			v.y = Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
		if Input.is_action_pressed("slow"): v *= 0.55
	else:
		v.x = Input.get_action_strength("move2_right") - Input.get_action_strength("move2_left")
		v.y = Input.get_action_strength("move2_down") - Input.get_action_strength("move2_up")
	# manettes
	var jx := Input.get_joy_axis(0, JOY_AXIS_LEFT_X)
	var jy := Input.get_joy_axis(0, JOY_AXIS_LEFT_Y)
	if id == 1 and (absf(jx) > 0.24 or absf(jy) > 0.24):
		v.x = clampf(v.x + jx, -1, 1); v.y = clampf(v.y + jy, -1, 1)
	if id == 1 and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		# pilotage à la souris : le vaisseau suit le curseur (comme l'original)
		var mp := get_tree().root.get_mouse_position()
		var ddx: float = mp.x - players[0].x
		var ddy: float = mp.y - players[0].y
		var dl := sqrt(ddx * ddx + ddy * ddy)
		if dl > 2.0:
			v.x = ddx / maxf(dl, 40.0); v.y = ddy / maxf(dl, 40.0)
	return v.clamp(Vector2(-1, -1), Vector2(1, 1))

func _firing(P: Dictionary) -> bool:
	if Save.S.opts.autofire: return true
	if P.id == 1:
		return Input.is_action_pressed("fire")
	return Input.is_action_pressed("fire2")

func _bomb_pressed(P: Dictionary) -> bool:
	if P.id == 1: return Input.is_action_just_pressed("bomb")
	return Input.is_action_just_pressed("bomb2")

# =========================================================================
#  JOUEUR
# =========================================================================
func update_players(dt: float) -> void:
	for P in players:
		if P.fly_away != null:
			P.fly_away += dt
			P.vy = lerpf(P.vy, -1050.0, minf(1.0, dt * 1.7))
			P.y += P.vy * dt
			continue
		if not P.alive:
			if P.out: continue
			P.dead += dt
			if P.dead > 1.6: respawn(P)
			continue
		var ax := _axis(P.id)
		var sp: float = stats.speed
		P.vx = lerpf(P.vx, ax.x * sp, clampf(dt * 12.0, 0.0, 1.0))
		P.vy = lerpf(P.vy, ax.y * sp, clampf(dt * 12.0, 0.0, 1.0))
		P.x = clampf(P.x + P.vx * dt, 32.0, Data.FW - 32.0)
		P.y = clampf(P.y + P.vy * dt, 76.0, Data.FH - 42.0)
		P.bank = lerpf(P.bank, clampf(P.vx / (stats.speed if stats.speed > 0 else 1.0), -1, 1), clampf(dt * 8.0, 0.0, 1.0))
		# bouclier régénérant (toutes les 22 s)
		P.sh_cd -= dt
		if P.shield < P.sh_max and P.sh_cd <= 0.0:
			P.shield += 1; P.sh_cd = 22.0
			Audio2.sfx("pick")
			pop_text(P.x, P.y - 30, "BOUCLIER", TH.shield, 9)
		if P.inv > 0.0: P.inv -= dt
		if P.hit_t > 0.0: P.hit_t -= dt
		if P.shield_fx > 0.0: P.shield_fx -= dt
		# tir
		P.fire_cd -= dt
		if _firing(P) and P.fire_cd <= 0.0:
			fire_weapon(P)
			P.fire_cd = stats.fire_cd
		# bombe
		P.bomb_cd = maxf(0.0, P.bomb_cd - dt)
		if _bomb_pressed(P) and P.bomb_cd <= 0.0:
			P.bomb_cd = 0.4
			use_bomb(P)
		# drones
		P.drone_a += dt * 2.2
		if P.drones.size() != int(stats.drones):
			P.drones.resize(int(stats.drones))
		P.drone_cd -= dt
		if stats.drones > 0 and P.drone_cd <= 0.0:
			P.drone_cd = 0.22 / stats.fire_mul
			drone_fire(P)
		# traînée
		P.trail_t -= dt
		if P.trail_t <= 0.0:
			P.trail_t = 0.03
			emit_trail(P)
		# arme suivante
		if P.id == 1 and Input.is_action_just_pressed("weapon_next"):
			cycle_weapon()

func respawn(P: Dictionary) -> void:
	if P.out or P.lives < 0:
		P.out = true
		check_game_over()
		return
	var n := players.size()
	var i := players.find(P)
	P.alive = true
	P.x = (Data.FW / 2.0) if n == 1 else Data.FW * (0.62 if i == 1 else 0.38)
	P.y = Data.FH - 120.0
	P.vx = 0.0; P.vy = 0.0
	P.hp = P.max_hp
	P.shield = mini(int(stats.shields), 1)
	P.inv = 3.2
	P.power = maxi(1, P.power - 1)
	ebullets.clear()

func check_game_over() -> void:
	var alive := false
	for p in players:
		if not p.out and (p.alive or p.lives >= 0): alive = true
	if not alive:
		game_over()

func game_over() -> void:
	if state == "over": return
	state = "over"
	Audio2.boss_mode = false
	Audio2.game_over_music()
	# versement des crédits de la mission (bankRun)
	var st := {
		"level": level, "score": score, "credits": credits_run, "kills": kills,
		"no_death": no_death, "combo_max": combo_max, "graze": graze_total,
		"max_combo": maxi(combo_max, combo), "sector_bonus": 0,
	}
	run_over.emit(st)

func hit_player(P: Dictionary, dmg: float, contact: bool) -> void:
	if harvest: return
	if not P.alive or P.out or P.inv > 0.0: return
	if Save.cheat_on("god"): return
	if randf() < stats.dodge and not contact:
		pop_text(P.x, P.y - 24, "ESQUIVE", TH.p_lite, 8)
		return
	if P.shield > 0:
		P.shield -= 1; P.sh_cd = 14.0; P.shield_fx = 0.35; P.inv = 1.1
		Audio2.sfx("shieldbreak")
		add_shake(5); add_flash(0.18, TH.shield)
		pop_text(P.x, P.y - 26, "BOUCLIER -1", TH.shield, 9)
		for i in 18:
			var a := randf() * TAU
			spawn_part(P.x, P.y, cos(a) * 200, sin(a) * 200, 0.4, TH.shield, 4, true)
		return
	var d: float = dmg * (stats.contact_mul if contact else 1.0)
	P.hp -= maxi(1, int(round(d)))
	P.inv = 1.7; P.hit_t = 0.3
	Audio2.sfx("hurt")
	add_shake(11); add_flash(0.3, TH.danger)
	combo = 0
	explode(P.x, P.y, 1.4, TH.p_main, TH.p_lite)
	if P.hp <= 0:
		player_die(P)
	else:
		pop_text(P.x, P.y - 26, "COQUE %d/%d" % [P.hp, P.max_hp], Color("#ff7a86"), 9)

func player_die(P: Dictionary) -> void:
	P.alive = false; P.dead = 0.0
	no_death = false
	explode(P.x, P.y, 3.0, TH.p_main, TH.p_lite)
	Audio2.sfx("explode")
	Audio2.sfx("gameover")
	add_shake(22); add_flash(0.65, Color.WHITE)
	slow_f = 0.3; slow_t = 0.8
	if not Save.cheat_on("lives"):
		P.lives -= 1
	if P.lives < 0:
		P.out = true
	check_game_over()

func use_bomb(P: Dictionary) -> void:
	if daily and daily_mods.has("nobomb"):
		return
	var infinite := Save.cheat_on("bombs")
	if not infinite and P.bombs <= 0: return
	if not P.alive: return
	if not infinite: P.bombs -= 1
	Audio2.sfx("bomb")
	shocks.append({ "x": P.x, "y": P.y, "t": 0.0, "life": 0.7, "max": 320.0, "col": TH.p_lite })
	add_shake(20)
	slow_f = 0.35; slow_t = 0.55
	for b in ebullets:
		spawn_part(b.x, b.y, randf_range(-120, 120), randf_range(-120, 120), 0.3, TH.p_lite, 4, era_idx >= 2)
	ebullets.clear()
	var dmg := 90.0 + Data.lv_eq(level) * 40.0
	for i in range(enemies.size() - 1, -1, -1):
		damage_enemy(enemies[i], dmg, true)
	if not boss.is_empty() and not boss.dead:
		boss_damage(dmg * 2.2)
	for i in 90:
		var a := randf() * TAU
		var v := randf_range(120, 560)
		spawn_part(P.x, P.y, cos(a) * v, sin(a) * v, randf_range(0.4, 0.9),
			[TH.p_lite, TH.acc, TH.gold].pick_random(), randf_range(3, 7), true)

func cycle_weapon() -> void:
	var list: Array = []
	for w in Data.WEAPONS:
		if w.price == 0 or (Save.S.owned.weapons as Array).has(w.id):
			list.append(w)
	if list.size() < 2: return
	var i := 0
	for j in list.size():
		if list[j].id == Save.S.sel.weapon: i = j
	i = (i + 1) % list.size()
	Save.S.sel.weapon = list[i].id
	stats = Save.compute_stats(level)
	Audio2.sfx("power")
	Save.save_game()

# =========================================================================
#  ARMES DU JOUEUR (fireWeapon exact)
# =========================================================================
func fire_weapon(P: Dictionary) -> void:
	var w: String = stats.weapon.id
	var p: int = P.power
	var dmg: float = 1.0 * stats.dmg_mul
	var y: float = P.y - 20.0
	var pierce: int = stats.pierce
	match w:
		"pulse":
			var n := 3 if p >= 4 else (2 if p >= 2 else 1)
			for i in n:
				var off := (i - (n - 1) / 2.0) * 11.0
				var sgn := signf(off) * 2.0 if n > 1 else 0.0
				pb(P.x + off + sgn, y, 0, -720, dmg, "pulse", pierce > 0, false, 0)
			if p >= 5:
				pb(P.x, y - 4, 0, -780, dmg * 1.2, "pulse", pierce > 0, true, 0)
		"spread":
			var n2 := 2 + mini(p, 4)
			for i in n2:
				var a := -PI / 2.0 + (i - (n2 - 1) / 2.0) * (0.16 + 0.03 * p)
				pb(P.x, y, cos(a) * 560, sin(a) * 560, dmg * 0.85, "spread", pierce > 0, false, 0)
			if p >= 5:
				pb(P.x - 8, y + 6, -70, -640, dmg, "spread", pierce > 0, false, 0)
				pb(P.x + 8, y + 6, 70, -640, dmg, "spread", pierce > 0, false, 0)
		"laser":
			var n3 := mini(p, 3) + (1 if p >= 5 else 0)
			for i in n3:
				var off3 := (i - (n3 - 1) / 2.0) * 10.0
				pb(P.x + off3, y, 0, -1150, dmg * (0.75 if p >= 4 else 0.6), "laser", false, false, 0)
			Audio2.sfx("laser")
		"plasma":
			var n4 := 2 if p >= 3 else 1
			for i in n4:
				pb(P.x + (i - (n4 - 1) / 2.0) * 14.0, y, (i - (n4 - 1) / 2.0) * 40.0, -420,
					dmg * 2.2, "plasma", pierce > 0, false, 40 + p * 6)
			if p >= 5:
				pb(P.x, y, 0, -470, dmg * 3.0, "plasma", pierce > 0, false, 74)
		"rail":
			if p >= 2:
				P.rail_side = 1 - P.rail_side
				pb(P.x + (13.0 if P.rail_side == 1 else -13.0), y + 4, 0, -920, dmg * 2.0, "rail", true, false, 0)
			else:
				pb(P.x, y, 0, -980, dmg * 2.4, "rail", true, false, 0)
		"homing":
			var n5 := 3 if p >= 5 else (2 if p >= 3 else 1)
			for i in n5:
				var off5 := (i - (n5 - 1) / 2.0) * 13.0
				pb(P.x + off5, y + 2, off5 * 1.8, -405, dmg * 2.35, "homing", false, false, 0)
	Audio2.sfx("cannon" if w == "plasma" else "shoot")
	if era_idx >= 1:
		spawn_part(P.x, y - 2, 0, -60, 0.08, TH.p_lite, 7, era_idx >= 2)

func drone_fire(P: Dictionary) -> void:
	var cnt: int = P.drones.size()
	for i in cnt:
		var a: float = P.drone_a + i * TAU / maxf(1, cnt)
		var dx: float = P.x + cos(a) * 34.0
		var dy: float = P.y + sin(a) * 30.0
		pb(dx, dy, randf_range(-60, 60), -600, 0.55 * stats.dmg_mul, "drone", false, false, 0)

func pb(x: float, y: float, vx: float, vy: float, dmg: float, type: String,
		pierce := false, big := false, aoe := 0.0) -> void:
	bullets.append({
		"x": x, "y": y, "vx": vx, "vy": vy, "dmg": dmg, "type": type,
		"pierce": pierce, "aoe": aoe, "r": 16.0 if type == "plasma" else (13.0 if type == "rail" else (8.0 if type == "homing" else 9.0)),
		"homing": type == "homing", "turn_rate": 4.8, "speed": sqrt(vx * vx + vy * vy),
		"target": null, "t": 0.0, "big": big,
	})

func update_bullets(dt: float) -> void:
	for i in range(bullets.size() - 1, -1, -1):
		var b: Dictionary = bullets[i]
		b.t += dt
		if b.homing:
			# cible valide ?
			var tgt = b.target
			var alive: bool = false
			if tgt is Dictionary and not tgt.is_empty() and not tgt.get("dead", true):
				if tgt == boss:
					alive = not boss.dead and boss.hp > 0 and enemies_or_boss_on_field()
				else:
					alive = enemies.has(tgt) and tgt.hp > 0
			if not alive:
				var best := INF
				b.target = {}
				for e in enemies:
					if e.hp <= 0: continue
					var d: float = (b.x - e.x) * (b.x - e.x) + (b.y - e.y) * (b.y - e.y)
					if d < best: best = d; b.target = e
				if not boss.is_empty() and not boss.dead and boss.hp > 0:
					var d2: float = (b.x - boss.x) * (b.x - boss.x) + (b.y - boss.y) * (b.y - boss.y)
					if d2 < best: b.target = boss
			if b.target is Dictionary and not b.target.is_empty():
				var desired := atan2(b.target.y - b.y, b.target.x - b.x)
				var current := atan2(b.vy, b.vx)
				var delta_a := atan2(sin(desired - current), cos(desired - current))
				var ang := current + clampf(delta_a, -b.turn_rate * dt, b.turn_rate * dt)
				b.vx = cos(ang) * b.speed
				b.vy = sin(ang) * b.speed
		b.x += b.vx * dt
		b.y += b.vy * dt
		# module 29 : pendant l'alerte du secteur 24, le sas encaisse les tirs
		if not sas.is_empty() and not sas.boom and sas.hp > 0.0:
			if absf(b.x - sas.x) < sas.w / 2.0 + b.r and absf(b.y - sas.y) < sas.h / 2.0 + b.r:
				sas.hp -= b.dmg
				sas.flash = 0.09
				if randf() < 0.34:
					Nv24Audio.sound("09_sas_impact")
				spawn_part(b.x, b.y, randf_range(-70.0, 70.0), randf_range(-110.0, -20.0), 0.22, Color("#cfd8ea"), 3.0, era_idx >= 1)
				if not bool(b.get("pierce", false)):
					bullets.remove_at(i)
					continue
		if b.y < -40 or b.y > Data.FH + 40 or b.x < -30 or b.x > Data.FW + 30:
			bullets.remove_at(i)

func enemies_or_boss_on_field() -> bool:
	return true

# =========================================================================
#  ENNEMIS
# =========================================================================
func spawn_enemy(kind: String, x: float, y: float, opt := {}) -> Dictionary:
	if not Data.ETYPES.has(kind): kind = "drone"
	var T: Dictionary = Data.ETYPES[kind]
	var s := Save.e_scale(level)
	var hp := maxi(1, int(round(T.hp * s.hp * opt.get("hp_mul", 1.0) * (1.45 if two_p else 1.0) * (1.5 if (daily and daily_mods.has("hp")) else 1.0))))
	var is_elite: bool = T.get("elite", false) or opt.get("elite", false)
	var e := {
		"kind": kind, "x": x, "y": y, "x0": x, "y0": y, "t": 0.0, "r": T.r,
		"hp": hp, "max_hp": hp, "sc": T.sc,
		"cr": T.cr, "mv": T.mv, "mvx": T.mvx * (s.bs * 0.5 + 0.5),
		"fire": T.fire, "fire_t": randf_range(0.4, 1.6),
		"dir": opt.get("dir", -1 if randf() < 0.5 else 1),
		"ty": opt.get("ty", randf_range(90, 200)), "amp": opt.get("amp", randf_range(30, 70)),
		"flash": 0.0, "phase": randf() * TAU, "split": T.get("split", 0),
		"spawner": T.get("spawner", ""), "spr": 0.0, "elite": is_elite,
		"guard": T.get("guard", false), "guard_on": false, "ring": T.get("ring", 0),
		"dead": false, "hit_fx_t": 0.0, "spawn_t": 0.0,
	}
	if is_elite:
		e.sc = 900 + Data.lv_eq(level) * 120
	# --- module 20 : champs supplémentaires ---------------------------------
	var eid: String = T.get("eid", kind)
	e["eid"] = eid
	if T.get("mini", false):
		e["mini"] = true
		e.ty = opt.get("ty", 170.0)
		e.sc = T.sc + Data.lv_eq(level) * 300
		e["dscale"] = T.get("scale", 1.0)
	if T.has("layer"):
		e["layer_cd"] = T.layer
		e["layer_t"] = 1.2
		e["laid"] = 0
	if T.has("aim"):
		e["aim"] = T.aim
		e["aim_t"] = T.aim.cd * 0.7
	if kind == "bomber":
		e.y = opt.get("y2", randf_range(70.0, 150.0))
		e.dir = 1 if x < Data.FW / 2.0 else -1
	if kind == "kamikaze":
		e.ty = opt.get("ty", randf_range(120.0, 220.0))
		e["lock"] = 0.0
		e["lock_t"] = 0.0
	if kind == "phalanx":
		e.ty = opt.get("ty", randf_range(120.0, 200.0))
		e.dir = opt.get("dir", 1 if randf() < 0.5 else -1)
	if T.mv == "blink":
		e["blink_t"] = 2.6
		e["spawn_t"] = 0.0
	enemies.append(e)
	return e

## mini-boss de mi-secteur (spawnMini) : bannière + radio
func spawn_mini(kind: String, x: float) -> Dictionary:
	var e := spawn_enemy(kind, x, -110.0, { "ty": 190.0 })
	Audio2.sfx("alert")
	mid_boss_done = true
	pop_text(Data.FW / 2.0, 120.0, "SIGNATURE LOURDE : %s" % Data.ENAMES.get(kind, kind), TH.danger, 12)
	return e

func update_enemies(dt: float) -> void:
	var s := Save.e_scale(level)
	for i in range(enemies.size() - 1, -1, -1):
		var e: Dictionary = enemies[i]
		e.t += dt
		if e.flash > 0.0: e.flash -= dt
		if e.hit_fx_t > 0.0: e.hit_fx_t -= dt
		if e.spawn_t > 0.0: e.spawn_t -= dt
		var sp: float = Data.SCROLL_SPEED * e.mvx
		match e.mv:
			"dive":
				e.y += sp * dt * 1.15
				e.x = e.x0 + sin(e.t * 1.3 + e.phase) * 12.0
			"zig":
				e.y += sp * 0.85 * dt
				e.x = e.x0 + sin(e.t * 2.2 + e.phase) * e.amp
			"hover":
				if e.y < e.ty:
					e.y += sp * 1.2 * dt
				else:
					e.y += 26.0 * 0.3 * dt
				e.x = e.x0 + sin(e.t * 0.7 + e.phase) * 46.0
			"diag":
				e.x += e.dir * sp * 0.9 * dt
				e.y += sp * 1.0 * dt
			"patrol":
				if e.y < e.ty:
					e.y += sp * 1.1 * dt
				else:
					e.x += e.dir * sp * 0.55 * dt
					if e.x < 40 or e.x > Data.FW - 40: e.dir *= -1
			"charge":
				e.y += sp * 1.5 * dt
				e.x += sin(e.t * 4 + e.phase) * 40.0 * dt
			# --- module 20 : traversée, kamikaze, rang, tissage, téléport ------
			"cross":
				e.x += e.dir * sp * 1.1 * dt
				e.y += sin(e.t * 1.6 + e.phase) * 14.0 * dt
				if (e.dir > 0 and e.x > Data.FW + 60) or (e.dir < 0 and e.x < -60):
					enemies.remove_at(i)
					continue
			"home":
				if e.lock == 0.0:
					e.y += sp * 1.1 * dt
					e.x = e.x0 + sin(e.t * 2.0 + e.phase) * 20.0
					if e.y >= e.ty:
						e.lock = 0.001
						e.lock_t = 0.5
				elif e.lock_t > 0.0:
					e.lock_t -= dt
					if e.lock_t <= 0.0:
						var tgt := nearest_player(e.x, e.y)
						if not tgt.is_empty():
							var a := atan2(tgt.y - e.y, tgt.x - e.x)
							e.vx = cos(a)
							e.vy = sin(a)
						else:
							e.vx = 0.0
							e.vy = 1.0
						e["v"] = 0.0
				else:
					e.v = minf(560.0, e.v + 900.0 * dt)
					e.x += e.vx * e.v * dt
					e.y += e.vy * e.v * dt
					if era_idx >= 1 and randf() < dt * 40.0:
						spawn_part(e.x, e.y, randf_range(-30, 30), randf_range(-30, 30), 0.3, TH.e_boss_lite, 3, era_idx >= 2)
			"rank":
				if e.y < e.ty:
					e.y += sp * 1.3 * dt
				else:
					e.x += e.dir * sp * 0.32 * dt
					if e.x < 60 or e.x > Data.FW - 60:
						e.dir *= -1
					e.y += 9.0 * dt
			"weave":
				e.y += sp * 0.62 * dt
				e.x = e.x0 + sin(e.t * 1.9 + e.phase) * (e.amp + 50.0)
				e.y += sin(e.t * 3.8 + e.phase) * 36.0 * dt
			"blink":
				if e.y < e.ty:
					e.y += sp * 1.2 * dt
				e.blink_t -= dt
				if e.blink_t <= 0.0:
					e.blink_t = randf_range(2.2, 3.4)
					explode(e.x, e.y, 1.1, TH.e_boss, TH.e_boss_lite)
					e.x = randf_range(90.0, Data.FW - 90.0)
					e.x0 = e.x
					e.y = randf_range(110.0, 240.0)
					e.ty = e.y
					e.spawn_t = 0.7
					explode(e.x, e.y, 1.1, TH.e_boss, TH.e_boss_lite)
					Audio2.sfx("power")
				e.x = e.x0 + sin(e.t * 0.9) * 30.0
		e.x = clampf(e.x, 14.0, Data.FW - 14.0)
		if e.guard:
			e.guard_on = sin(e.t * 1.9 + e.phase) > 0.15
		# tirs
		if e.fire != null and not players.is_empty() and e.y > 20 and e.y < Data.FH - 60:
			var any_alive := false
			for p in players:
				if p.alive: any_alive = true
			if any_alive:
				e.fire_t -= dt
				if e.fire_t <= 0.0:
					e.fire_t = e.fire.cd * randf_range(0.85, 1.15)
					enemy_fire(e, e.fire, s)
		# tir « aim » des mini-boss (visée périodique propre)
		if e.has("aim") and not players.is_empty() and e.y > 20:
			var tgt_alive := false
			for p in players:
				if p.alive: tgt_alive = true
			if tgt_alive:
				e.aim_t -= dt
				if e.aim_t <= 0.0:
					e.aim_t = e.aim.cd
					var f2: Dictionary = { "kind": "fan", "n": e.aim.n, "arc": e.aim.get("arc", 0.0), "sp": e.aim.get("sp", 1.0) }
					if e.aim.get("kind", "fan") == "wall":
						f2 = { "kind": "wall", "n": e.aim.n, "sp": 1.0 }
					enemy_fire(e, f2, s)
		# mineur : pose une mine derrière lui, quatre au plus
		if e.get("layer_cd", 0.0) > 0.0 and e.y > 40:
			e.layer_t -= dt
			if e.layer_t <= 0.0 and e.laid < 4:
				e.layer_t = e.layer_cd
				e.laid += 1
				var m := spawn_enemy("mine", e.x, e.y + 26.0, { "ty": e.y + 40.0 })
				m.mvx = 0.2
				Audio2.sfx("ui")
		# fuite de pression du char blessé
		if e.kind == "tanker" and e.hp < e.max_hp * 0.5 and randf() < 0.3:
			spawn_part(e.x + randf_range(-14, 14), e.y, randf_range(-20, 20), -40.0, 0.5, TH.e_boss_lite, 2.5, false)
		# porteur : libère des essaims
		if e.spawner != "" and e.y > 60 and e.y < Data.FH * 0.5:
			e.spr -= dt
			if e.spr <= 0.0:
				e.spr = 2.6
				for k in 3:
					spawn_enemy(e.spawner, e.x + randf_range(-26, 26), e.y + 18, { "ty": e.y + 60 })
		if e.mv != "cross":
			e.x = clampf(e.x, 14.0, Data.FW - 14.0)
		# hors écran
		if e.y > Data.FH + 70 or e.x < -70 or e.x > Data.FW + 70:
			enemies.remove_at(i)
			combo = 0
			continue
		# collision corps à corps
		for P in players:
			if P.alive and not P.out:
				var dd: float = (P.x - e.x) * (P.x - e.x) + (P.y - e.y) * (P.y - e.y)
				var rr: float = (e.r * 0.8 + P.r)
				if dd < rr * rr:
					hit_player(P, 1, true)
					damage_enemy(e, 9999.0 if e.kind == "kamikaze" else 3.0, true)

## un tir d'ennemi, selon son genre (enemyFire du module 20)
func enemy_fire(e: Dictionary, f: Dictionary, s: Dictionary) -> void:
	var kind: String = f.kind
	match kind:
		"aimed":
			aimed_shot(e.x, e.y + 10, 1, 0.0, f.get("sp", 1.0), s)
		"fan":
			aimed_shot(e.x, e.y + 10, f.n, f.get("arc", 0.5), f.get("sp", 1.0), s)
		"drop":
			eb(e.x, e.y + 14.0, PI / 2.0, 92.0 * s.bs, "orb", 9.0)
			Audio2.sfx("ehit")
		"missile":
			for k in f.n:
				eb(e.x + (12.0 if k % 2 == 1 else -12.0), e.y + 8.0,
					PI / 2.0 + (0.7 if k % 2 == 1 else -0.7), 112.0 * s.bs, "missile", 8.0, 1.7)
			Audio2.sfx("cannon")
		"wall":
			var span: float = 26.0 * (float(f.n) - 1.0)
			for k in f.n:
				eb(e.x - span / 2.0 + k * 26.0, e.y + 18.0, PI / 2.0, 108.0 * s.bs, "ball", 11.0)
			Audio2.sfx("ehit")
		"spiral":
			e["ang"] = e.get("ang", 0.0) + 0.78
			for k in f.n:
				eb(e.x, e.y, e.ang + k / float(f.n) * TAU, 128.0 * f.get("sp", 1.0) * s.bs, "ball", 10.0)
		"ring":
			for k in f.n:
				eb(e.x, e.y, k / float(f.n) * TAU + e.phase, 118.0 * f.get("sp", 1.0) * s.bs, "ball", 11.0)
			Audio2.sfx("ehit")
		"beam":
			beams.append({ "x": e.x, "w": 30.0, "warn": 0.9, "dur": 2.4, "t": 0.0, "hit_cd": 0.0, "vx": 0.0, "follow": e })
			Audio2.sfx("laser")

func aimed_shot(x: float, y: float, n: int, arc: float, spd_mul: float, s: Dictionary) -> void:
	var P := nearest_player(x, y)
	if P.is_empty(): return
	var base := atan2(P.y - y, P.x - x)
	for i in n:
		var a := base + ((i - (n - 1) / 2.0) * (arc / maxf(1, n - 1)) if n > 1 else 0.0)
		eb(x, y, a, (122.0 + Data.lv_eq(level) * 16.0) * spd_mul * s.bs, "ball", 0)
	Audio2.sfx("ehit")

func eb(x: float, y: float, ang: float, speed: float, kind: String, r := 0.0, steer := 0.0, col = null) -> void:
	# niveau 12 : plafond et ralentissement des tirs du boss pour la lisibilité
	if level == 12 and not boss.is_empty() and not boss.dead:
		if ebullets.size() >= 26: return
		speed *= 0.78
	if daily and daily_mods.has("fast"):
		speed *= 1.25
	var s := Save.e_scale(level)
	ebullets.append({
		"x": x, "y": y, "vx": cos(ang) * speed, "vy": sin(ang) * speed,
		"r": r if r > 0 else (13.0 if kind == "laser" else 12.0),
		"kind": kind, "t": 0.0, "dmg": s.dmg, "steer": steer,
		"col": col, "seed": randf() * TAU, "grazed": false, "dead": false,
	})

func update_ebullets(dt: float) -> void:
	var s := Save.e_scale(level)
	for i in range(ebullets.size() - 1, -1, -1):
		var b: Dictionary = ebullets[i]
		b.t += dt
		if b.steer > 0.0:
			var P := nearest_player(b.x, b.y)
			if not P.is_empty():
				var want := atan2(P.y - b.y, P.x - b.x)
				var d := want - atan2(b.vy, b.vx)
				while d > PI: d -= TAU
				while d < -PI: d += TAU
				var ang := atan2(b.vy, b.vx) + clampf(d, -b.steer * dt, b.steer * dt)
				var spd := sqrt(b.vx * b.vx + b.vy * b.vy)
				b.vx = cos(ang) * spd
				b.vy = sin(ang) * spd
		b.x += b.vx * dt
		b.y += b.vy * dt
		if b.kind == "wave":
			b.x += sin(b.t * 6 + b.seed) * 115.0 * dt
		if b.kind == "bounce":
			if b.x < 10 and b.vx < 0: b.vx = -b.vx
			if b.x > Data.FW - 10 and b.vx > 0: b.vx = -b.vx
			if b.y < 10 and b.vy < 0: b.vy = -b.vy
		if b.kind == "missile" and era_idx >= 1 and randf() < dt * 30:
			spawn_part(b.x, b.y, randf_range(-20, 20), randf_range(-20, 20), 0.25, TH.e_boss_lite, 2.6, era_idx >= 2)
		if b.x < -60 or b.x > Data.FW + 60 or b.y < -60 or b.y > Data.FH + 60:
			ebullets.remove_at(i)
			continue
		# collision + graze
		for P in players:
			if not P.alive or P.out: continue
			var dd: float = (P.x - b.x) * (P.x - b.x) + (P.y - b.y) * (P.y - b.y)
			if dd < (b.r * 0.8 + P.r) * (b.r * 0.8 + P.r):
				hit_player(P, b.dmg, false)
				ebullets.remove_at(i)
				break
			elif not b.grazed and dd < (P.r + 20.0) * (P.r + 20.0):
				b.grazed = true
				sec_graze += 1
				graze_total += 1
				add_score(P, Data.GRAZE_PTS)

func damage_enemy(e: Dictionary, dmg: float, silent := false) -> void:
	if e.dead: return
	if e.guard_on and not silent and randf() < 0.9:
		spawn_part(e.x, e.y + e.r / 2, randf_range(-120, 120), randf_range(-140, -40), 0.25, TH.p_lite, 3, era_idx >= 2)
		return
	e.hp -= dmg
	e.flash = 0.09
	if not silent and era_idx >= 1:
		spawn_part(e.x + randf_range(-6, 6), e.y + randf_range(-6, 6), randf_range(-60, 60), randf_range(-60, 60), 0.2, TH.p_lite, 4, era_idx >= 1)
	if e.hp <= 0:
		kill_enemy(e)

func kill_enemy(e: Dictionary) -> void:
	e.dead = true
	var i := enemies.find(e)
	if i >= 0: enemies.remove_at(i)
	kills += 1
	sec_kills += 1
	combo += 1
	combo_t = Data.COMBO_WINDOW
	combo_max = maxi(combo_max, combo)
	var owner_p := nearest_player(e.x, e.y)
	add_score(owner_p if not owner_p.is_empty() else first_player(), e.sc * score_mult())
	var big: bool = e.elite or e.kind == "carrier" or e.kind == "splitter"
	var ec: Color = TH.e_main if era_idx == 0 else TH.e_boss
	var el: Color = TH.e_lite if era_idx == 0 else TH.e_boss_lite
	explode(e.x, e.y, 1.9 if big else e.r / 12.0, ec, el)
	# couronne de tirs à la mort (mines etc.)
	if e.ring > 0 and not (era_idx == 0 and level == 1):
		var s := Save.e_scale(level)
		for k in e.ring:
			eb(e.x, e.y, k / float(e.ring) * TAU + randf_range(-0.2, 0.2), 118.0 * s.bs, "orb", 6)
		Audio2.sfx("ehit")
	Audio2.sfx("explode")
	add_shake(7 if big else 2.4)
	# division
	if e.split > 0:
		for k in e.split:
			spawn_enemy("swarmlet", e.x + (16 if k == 1 else -16), e.y + 8, { "hp_mul": 2 })
	# butin (formule exacte)
	var drop_chance: float = clampf(0.16 + stats.luck * 0.075 + (0.55 if big else 0.0), 0.0, 0.95)
	if randf() < drop_chance:
		var pool: Array
		if not first_player().is_empty() and first_player().power < 5:
			pool = ["power", "power", "shield", "credit", "credit", "hull", "bomb"]
		else:
			pool = ["credit", "credit", "credit", "shield", "hull", "bomb"]
		pool.append_array(["scrap", "scrap", "crystal"])
		if big or e.elite: pool.append("circuit")
		add_pickup(e.x, e.y, pool.pick_random(), 0)
	var d: Dictionary = Data.DIFFS[int(Save.S.opts.diff)]
	var cr := int(round(randf_range(e.cr[0], e.cr[1]) * (1.0 + (Data.lv_eq(level) - 1.0) * 0.15) * 3.0))
	if cr > 0 and (big or e.elite or randf() < 0.3):
		add_pickup(e.x, e.y + 8, "credit", int(round(cr * (1.0 if (big or e.elite) else 3.2))))

func score_mult() -> float:
	return 1.0 + mini(combo, Data.COMBO_CAP) * Data.COMBO_STEP

func add_score(P: Dictionary, n: float) -> void:
	n = round(n)
	if not P.is_empty(): P.score += int(n)
	score += int(n)
	sec_score += int(n)

# =========================================================================
#  VAGUES (buildPlan exact)
# =========================================================================
## module 29 : art du secteur 24 — couloir (corridor-tile) et sas (airlock)
func nv24_load_art() -> void:
	for key in [["corridor", "res://assets/sector24/environment/corridor-tile.webp"],
			["door", "res://assets/sector24/doors/airlock.webp"]]:
		var path: String = key[1]
		if nv24_tex.has(key[0]) or not ResourceLoader.exists(path):
			continue
		var t: Texture2D = load(path)
		if t != null and t is CompressedTexture2D:
			var im: Image = t.get_image()
			if im != null:
				if im.is_compressed():
					im.decompress()
				nv24_tex[key[0]] = ImageTexture.create_from_image(im)
		elif t != null:
			nv24_tex[key[0]] = t

## les 9 fissures du sas (makeDoor du module 29), révélées par les dégâts
func nv24_cracks(k: int) -> Array:
	var rng := RandomNumberGenerator.new()
	rng.seed = 2409
	var out: Array = []
	for i in mini(k, 9):
		var x := rng.randf_range(-150.0, 150.0) * 0.5
		var y := rng.randf_range(-90.0, 90.0) * 0.5
		var a := rng.randf() * TAU
		var pts := PackedVector2Array([Vector2(x, y)])
		for j in 6:
			a += rng.randf_range(-0.9, 0.9)
			x += cos(a) * rng.randf_range(12.0, 26.0) * 0.5
			y += sin(a) * rng.randf_range(12.0, 26.0) * 0.5
			pts.append(Vector2(clampf(x, -100.0, 100.0), clampf(y, -64.0, 64.0)))
		out.append(pts)
	return out

## réplique radio VESTA (une seule fois par clef) + voix
func nv24_radio(key: String, text: String) -> void:
	if nv24_said.has(key):
		return
	nv24_said[key] = true
	pop_text(Data.FW / 2.0, Data.FH * 0.46, "VESTA : " + text, TH.acc, 11.0)
	Audio2.speak(text)

func build_plan(lv: int) -> Array:
	# buildPlan final du module 20 : ère × zone, mini-boss de génération,
	# formations adaptées à chaque engin, respiration du secteur 12.
	var era := Data.era_of_level(lv)
	var st := Data.stage_of_level(lv)
	var mini: String = Data.MINI_OF_ERA[era]
	var plan: Array = []
	var t := 2.2
	var dens: float = 1.0 + st * 0.18 + era * 0.06
	dens = minf(dens, 1.18) if lv == 12 else dens
	var n := func(k: float) -> int:
		return int(round(k * dens))
	var W := func(dt: float, tag: String, kind: String, cnt: int, cnt2: int) -> void:
		t += dt
		plan.append({ "t": t, "wave": tag, "kind": kind, "n": cnt, "n2": cnt2 })
	# 1. ouverture : quatre drones en V, puis le vocabulaire local
	W.call(0.0, "V", "drone", 4, 0)
	W.call(4.0, "stream", "pool", n.call(3), 0)
	W.call(4.5, "for", "pool", n.call(4), 0)
	W.call(4.5, "for", "pool", n.call(4), 0)
	W.call(4.5, "for", "pool", n.call(4), 0)
	if st >= 1: W.call(3.5, "double_for", "pool", n.call(3), 0)
	# 2. le gardien de mi-parcours : mini-boss (zones 1 et 3), élite (zone 2),
	#    deux gardiens escortés (zone 4)
	if st == 0: W.call(5.0, "mini", mini, 0, 0)
	elif st == 1: W.call(5.0, "elite_mid", "", 0, 0)
	elif st == 2: W.call(5.0, "mini_sides", mini, 2, 0)
	else: W.call(5.0, "mini_elite", mini, 0, 0)
	# 3. seconde moitié : les formations se combinent
	W.call(9.0, "for", "pool", n.call(4), 0)
	W.call(4.0, "for", "pool", n.call(5), 0)
	W.call(4.0, "for_corners", "pool", n.call(4), 2 if st >= 1 else 0)
	W.call(4.0, "for", "pool", n.call(4), 0)
	W.call(4.0, "for_double", "pool", n.call(5), 0)
	W.call(4.5, "line_mix", "pool", 2, 0)
	# 4. zones 2 à 4 : le rythme se resserre
	if st >= 1:
		W.call(4.0, "for", "pool", n.call(5), 0)
		W.call(3.5, "double_for", "pool", n.call(4), n.call(3))
		W.call(4.0, "for", "pool", n.call(5), 0)
	if st >= 2:
		W.call(4.0, "elite_for", "pool", n.call(4), 0)
		W.call(5.0, "for", "pool", n.call(5), 0)
		W.call(4.0, "for", "pool", n.call(6), 0)
	if st == 3:
		W.call(4.0, "for_cross_bomber", "pool", n.call(5), 0)
		W.call(4.0, "mini_sides", mini, 3 if lv != 12 else 2, 0)
		W.call(8.0, "double_for", "pool", n.call(6), n.call(4))
		W.call(4.0, "for", "pool", n.call(6), 0)
	if lv == 12:
		for ev in plan:
			ev.t *= 1.16
	return plan

func _pick_kind(kind: String) -> String:
	if kind != "pool": return kind
	var pool: Array = Data.LEVEL_POOLS[Data.era_of_level(level)][Data.stage_of_level(level)]
	return pool[randi() % pool.size()]
func _run_wave(w: Dictionary) -> void:
	match w.wave:
		"V": form_v(_pick_kind(w.kind), w.n, {})
		"stream": form_stream(_pick_kind(w.kind), w.n, {})
		"line": form_line(_pick_kind(w.kind), w.n, {})
		"sides": form_sides(_pick_kind(w.kind), w.n, {})
		"arc": form_arc(_pick_kind(w.kind), w.n, {})
		"double_line":
			form_line(_pick_kind(w.kind), 2, {})
			form_line("carrier" if era_idx >= 2 else ("tanker" if level >= 3 else "stinger"), 2, { "dy": 90 })
		"line_sides":
			form_line(_pick_kind(w.kind), w.n, {})
			form_sides(_pick_kind(w.kind), 3, {})
		"for": form_for(_pick_kind(w.kind), w.n, {})
		"double_for":
			form_for(_pick_kind(w.kind), w.n, {})
			form_for(_pick_kind(w.kind), w.n2, {})
		"for_double":
			form_for(_pick_kind(w.kind), w.n, {})
			form_for(_pick_kind(w.kind), w.n2, {})
		"for_corners":
			form_for(_pick_kind(w.kind), w.n, {})
			if w.n2 > 0:
				form_corners("kamikaze", w.n2, {})
		"for_cross_bomber":
			form_for(_pick_kind(w.kind), w.n, {})
			form_cross("bomber", 1 if level == 12 else 2, {})
		"elite_for":
			spawn_enemy("elite", Data.FW * 0.3, -90, { "ty": 240 })
			form_for(_pick_kind(w.kind), w.n, {})
		"elite_mid":
			spawn_enemy("elite", Data.FW / 2.0, -90, { "ty": 250, "hp_mul": 0.9 + Data.lv_eq(level) * 0.1 })
			mid_boss_done = true
			Audio2.sfx("alert")
		"mini": spawn_mini(w.kind, Data.FW / 2.0)
		"mini_sides":
			spawn_mini(w.kind, Data.FW / 2.0)
			form_sides(_pick_kind(w.kind), w.n, {})
		"mini_elite":
			spawn_mini(w.kind, Data.FW * 0.3)
			spawn_enemy("elite", Data.FW * 0.72, -140, { "ty": 280 })
		"elite":
			spawn_enemy("elite", Data.FW / 2.0, -90, { "ty": 250, "hp_mul": 0.8 + level * 0.1 })
			Audio2.sfx("alert")
		"elite2":
			spawn_enemy("elite", Data.FW * 0.3, -90, { "ty": 240 })
			spawn_enemy("elite", Data.FW * 0.7, -150, { "ty": 300 })
		"line_mix":
			form_line(_pick_kind("pool"), 2, {})
			form_line("carrier" if era_idx >= 2 else ("tanker" if level >= 3 else "stinger"), 2, { "dy": 90 })

## « comment chaque engin se présente le mieux » (formFor du module 20)
func form_for(kind: String, n: int, opt: Dictionary) -> void:
	match kind:
		"bomber":
			form_cross(kind, mini(n, 3), opt)
		"phalanx":
			form_rank(kind, mini(n, 4), opt)
		"kamikaze":
			form_corners(kind, n, opt)
		"runner":
			form_pincer(kind, int(ceil(n / 2.0)), opt)
		"layer", "tanker", "lancer", "carrier":
			form_line(kind, mini(n, 2), opt)
		"turret", "shielder", "sniper":
			form_sides(kind, mini(n, 4), opt)
		"mine":
			form_arc(kind, n, opt)
		_:
			var pick_form: Array = ["V", "stream", "line", "sides", "arc"]
			var tag: String = pick_form[randi() % pick_form.size()]
			var w := { "wave": tag, "kind": kind, "n": n }
			_run_wave(w)

## bombardiers : traversées alternées (formCross)
func form_cross(kind: String, n: int, opt: Dictionary) -> void:
	for i in n:
		var o := opt.duplicate()
		o["y2"] = 70.0 + i * 48.0
		spawn_enemy(kind, (Data.FW + 40.0) if i % 2 == 1 else -40.0, 0.0, o)

## phalange : un rang serré (formRank)
func form_rank(kind: String, n: int, opt: Dictionary) -> void:
	var span := 92.0 * (n - 1)
	for i in n:
		var o := opt.duplicate()
		o["ty"] = 150.0 + (i % 2) * 30.0
		o["dir"] = 1
		spawn_enemy(kind, Data.FW / 2.0 - span / 2.0 + i * 92.0, -40.0 - (i % 2) * 20.0, o)

## deux courants qui se croisent en diagonale (formPincer)
func form_pincer(kind: String, n: int, opt: Dictionary) -> void:
	for i in n:
		var o1 := opt.duplicate()
		o1["dir"] = 1
		spawn_enemy(kind, 40.0, -30.0 - i * 60.0, o1)
		var o2 := opt.duplicate()
		o2["dir"] = -1
		spawn_enemy(kind, Data.FW - 40.0, -60.0 - i * 60.0, o2)

## kamikazes : par les coins (formCorners)
func form_corners(kind: String, n: int, opt: Dictionary) -> void:
	for i in n:
		var o := opt.duplicate()
		o["ty"] = 120.0 + (i >> 1) * 40.0
		spawn_enemy(kind, (Data.FW - 60.0 - (i >> 1) * 40.0) if i % 2 == 1 else (60.0 + (i >> 1) * 40.0), -30.0 - i * 24.0, o)

func form_line(kind: String, n: int, opt: Dictionary) -> void:
	var gap := Data.FW / (n + 1)
	for i in n:
		spawn_enemy(kind, gap * (i + 1), -30 - i * opt.get("stag", 0) - opt.get("dy", 0), opt)

func form_v(kind: String, n: int, opt: Dictionary) -> void:
	for i in n:
		var s := 1 if i % 2 == 1 else -1
		var k := int(ceil(i / 2.0))
		spawn_enemy(kind, Data.FW / 2.0 + s * k * 44.0, -30 - k * 34.0, opt)

func form_stream(kind: String, n: int, opt: Dictionary) -> void:
	var x := randf_range(80, Data.FW - 80)
	var o := opt.duplicate()
	o["amp"] = 60
	for i in n:
		spawn_enemy(kind, x + sin(i) * 22.0, -30 - i * 64.0, o)

func form_sides(kind: String, n: int, opt: Dictionary) -> void:
	var o := opt.duplicate()
	for i in n:
		o["dir"] = -1 if i % 2 == 1 else 1
		spawn_enemy(kind, (Data.FW + 20.0) if i % 2 == 1 else -20.0, 40 + i * 26.0, o)

func form_arc(kind: String, n: int, opt: Dictionary) -> void:
	for i in n:
		var a := -PI / 2.0 + (i - (n - 1) / 2.0) * 0.42
		spawn_enemy(kind, Data.FW / 2.0 + cos(a) * 190.0, -30 + sin(a) * 190.0, opt)

# caisses destructibles (props)
func _update_props(dt: float) -> void:
	prop_t -= dt
	if prop_t <= 0.0:
		prop_t = randf_range(6.5, 11.0) - Data.lv_eq(level) * 0.4
		props.append({ "x": randf_range(70, Data.FW - 70), "y": -40, "hp": 6, "r": 30, "t": 0.0 })
	for i in range(props.size() - 1, -1, -1):
		var p: Dictionary = props[i]
		p.t += dt
		p.y += 60.0 * dt
		if p.y > Data.FH + 40:
			props.remove_at(i)
			continue
		for j in range(bullets.size() - 1, -1, -1):
			var b: Dictionary = bullets[j]
			var dd: float = (b.x - p.x) * (b.x - p.x) + (b.y - p.y) * (b.y - p.y)
			if dd < (p.r + b.r) * (p.r + b.r):
				p.hp -= b.dmg
				if not b.pierce: bullets.remove_at(j)
				if p.hp <= 0:
					explode(p.x, p.y, 1.0, TH.gold, TH.p_lite)
					add_pickup(p.x, p.y, ["credit", "scrap", "credit"].pick_random(), randi_range(10, 30))
					props.remove_at(i)
					break

# =========================================================================
#  BOSS
# =========================================================================
func spawn_boss() -> Dictionary:
	var idx := Data.boss_music_idx(level)
	var b24: Dictionary = Data.BOSS24[idx]
	var base: Dictionary = Data.BOSSES_BASE[b24.get("base", 0)]
	var s := Save.e_scale(level)
	var hp := int(round(base.hp * s.hp * Data.BOSS_TOUGH * (1.6 if two_p else 1.0)))
	var b := {
		"name": b24.name, "base": base, "atk_set": idx,
		"x": Data.FW / 2.0, "y": -300.0, "r": base.r,
		"hp": hp, "max_hp": hp, "t": 0.0, "ph": 0, "atk_idx": 0, "atk_t": 1.2,
		"flash": 0.0, "dead": false, "dead_t": 0.0, "enter": true,
		"sc": base.sc, "cr": int(round(base.cr * s.credit * stats.credit_mul)),
		"tele": 0.0, "tx": Data.FW / 2.0, "ty": 140.0, "seed": randf() * TAU,
		"parts": [], "by": 1, "hue": [350, 22, 278, 190][base.color],
	}
	if b24.get("parts", 0) > 0:
		for i in int(b24.parts):
			b.parts.append({ "oa": -PI * 0.75 + i * PI * 0.75, "or": 175.0, "r": 52.0,
				"hp": int(round(hp * 0.22)), "max_hp": int(round(hp * 0.22)),
				"dead": false, "flash": 0.0, "t": i * 1.3, "x": b.x, "y": b.y })
	boss = b
	Audio2.sfx("alert")
	Audio2.speak("Alerte. Vaisseau amiral détecté.")
	Audio2.start_boss_music(idx)
	return b

func boss_parts_alive(b: Dictionary) -> int:
	var n := 0
	for p in b.parts:
		if not p.dead: n += 1
	return n

func boss_damage(dmg: float, part: Dictionary = {}) -> void:
	if boss.is_empty() or boss.dead: return
	if boss.y < 0: return  # le boss n'est pas encore entré dans le champ
	if not part.is_empty():
		part.hp -= dmg
		part.flash = 0.1
		if part.hp <= 0 and not part.dead:
			part.dead = true
			explode(part.x, part.y, 2.0, TH.e_boss, TH.e_boss_lite)
			Audio2.sfx("explode")
			add_shake(9)
	else:
		if boss.parts.size() > 0 and boss_parts_alive(boss) > 0:
			boss_damage(dmg * 0.25, _nearest_part())
			return
		boss.hp -= dmg
		boss.flash = 0.08
		if era_idx >= 1 and randf() < 0.6:
			spawn_part(boss.x + randf_range(-18, 18), boss.y + randf_range(-15, 15),
				randf_range(-95, 95), randf_range(-120, 75), 0.22, TH.e_boss_lite, 2.5, era_idx >= 2)
	if boss.hp <= 0:
		boss_die()

func _nearest_part() -> Dictionary:
	var best := {}
	var bd := INF
	for p in boss.parts:
		if p.dead: continue
		var d: float = (p.x - boss.x) * (p.x - boss.x) + (p.y - boss.y) * (p.y - boss.y)
		if d < bd: bd = d; best = p
	return best

func boss_die() -> void:
	if boss.dead: return
	boss.dead = true
	boss.dead_t = 0.0
	var owner_p := nearest_player(boss.x, boss.y)
	add_score(owner_p if not owner_p.is_empty() else first_player(), boss.sc * score_mult())
	credits_run += boss.cr
	pop_text(boss.x, boss.y, "+%d COINS" % boss.cr, TH.gold, 12)
	Audio2.sfx("explode")
	add_flash(0.8, Color.WHITE)
	add_shake(26)
	slow_f = 0.28; slow_t = 1.6
	for i in 40:
		var a := randf() * TAU
		var v := randf_range(90, 420)
		spawn_part(boss.x, boss.y, cos(a) * v, sin(a) * v, randf_range(0.5, 1.4),
			[TH.e_boss, TH.e_boss_lite, TH.gold, Color.WHITE].pick_random(), randf_range(3, 9), true)
	# >>> LA RÉCOLTE : les tirs restants se changent en bonus <<<
	harvest = { "t": 0.0, "dur": Data.HARVEST_DUR }
	for sh in ebullets:
		spawn_part(sh.x, sh.y, randf_range(-120, 120), randf_range(-120, 120), 0.35, TH.p_lite, 3.4, era_idx >= 2)
	ebullets.clear()
	for i in 6:
		add_pickup(randf_range(60, Data.FW - 60), -20 - i * 70, "credit", 55 + level * 20)
	Audio2.boss_mode = false
	Audio2.stop_music()

func update_boss(dt: float) -> void:
	if boss.is_empty(): return
	var b := boss
	b.t += dt
	if b.flash > 0.0: b.flash -= dt
	for p in b.parts:
		p.t += dt
		if p.flash > 0.0: p.flash -= dt
		if not p.dead: p.oa += dt * 0.5
	# entrée du boss
	if b.enter:
		b.y = lerpf(b.y, 265.0, clampf(dt * 1.15, 0.0, 1.0))
		if b.y > 256.0:
			b.enter = false
			add_shake(16)
			add_flash(0.22, Color("#ff405f") if era_idx > 0 else TH.livery[2])
			Audio2.sfx("bossalarm")
		return
	if b.dead:
		b.dead_t += dt
		if randf() < dt * (30.0 if era_idx >= 3 else 14.0):
			explode(b.x + randf_range(-b.r, b.r), b.y + randf_range(-b.r * 0.7, b.r * 0.7), 2.6, TH.e_boss, TH.e_boss_lite)
			Audio2.sfx("explode")
			add_shake(4)
		if b.dead_t > 2.6:
			boss = {}
			phase = Phase.HARVEST
			phase_t = 0.0
		return
	# fumée quand la coque cède
	var dmg_f := 1.0 - float(b.hp) / float(b.max_hp)
	if dmg_f > 0.4 and randf() < dt * 9:
		spawn_part(b.x + randf_range(-b.r * 0.8, b.r * 0.8), b.y + randf_range(-b.r * 0.3, b.r * 0.4),
			randf_range(-16, 16), randf_range(-52, -14), randf_range(0.6, 1.2), TH.bg3, randf_range(5, 11), false)
	# déplacement
	if b.base.get("teleport", false) or b.name == "NÉON-PRÊTRE":
		b.tele -= dt
		if b.tele <= 0.0:
			b.tele = randf_range(2.6, 4.6)
			b.tx = randf_range(230, Data.FW - 230)
			b.ty = randf_range(190, 330)
		b.x = lerpf(b.x, b.tx, clampf(dt * 1.6, 0.0, 1.0))
		b.y = lerpf(b.y, b.ty, clampf(dt * 1.2, 0.0, 1.0))
	else:
		b.x = Data.FW / 2.0 + sin(b.t * 0.5 + b.seed) * (Data.FW * 0.2)
		b.y = 265.0 + sin(b.t * 0.9) * 34.0
	for p in b.parts:
		p.x = b.x + cos(p.oa) * p.or
		p.y = b.y + sin(p.oa) * p.or * 0.7
	# phases
	var frac := float(b.hp) / float(b.max_hp)
	var ph := 0 if frac > 0.66 else (1 if frac > 0.33 else 2)
	if ph != b.ph:
		b.ph = ph
		b.atk_idx = 0
		b.atk_t = 0.55
		add_flash(0.22, TH.e_boss)
		Audio2.sfx("alert")
		if ph == 2: Audio2.speak("Phase finale.")
	# attaques
	var list: Array = Data.ATK24[b.atk_set % Data.ATK24.size()]
	b.atk_t -= dt
	if b.atk_t <= 0.0:
		var atk: Dictionary = list[(b.atk_idx + b.ph) % list.size()]
		_boss_attack(atk)
		if era_idx == 0:
			b["_fire_t"] = 0.22
		b.atk_idx += 1
		b.atk_t = atk.cd * (0.72 if b.ph == 2 else (0.86 if b.ph == 1 else 1.0))
	# collision corps
	for Q in players:
		if Q.alive and not Q.out:
			var rr: float = b.r * 0.6 + Q.r
			if (Q.x - b.x) * (Q.x - b.x) + (Q.y - b.y) * (Q.y - b.y) < rr * rr:
				hit_player(Q, 1, true)
	# collisions tirs joueur → boss / parties
	if b.y > 0:
		var parts_alive := boss_parts_alive(b)
		for i in range(bullets.size() - 1, -1, -1):
			var bu: Dictionary = bullets[i]
			var hit := false
			for p in b.parts:
				if p.dead: continue
				var rr2: float = p.r * 0.8 + bu.r
				if (bu.x - p.x) * (bu.x - p.x) + (bu.y - p.y) * (bu.y - p.y) < rr2 * rr2:
					boss_damage(bu.dmg * 3.2, p)
					hit = true
					break
			if not hit:
				var rr3: float = b.r * 0.7 + bu.r
				if (bu.x - b.x) * (bu.x - b.x) + (bu.y - b.y) * (bu.y - b.y) < rr3 * rr3:
					if b.parts.is_empty() or parts_alive == 0:
						boss_damage(bu.dmg * 3.2)
					else:
						boss_damage(bu.dmg * 3.2 * 0.25)
					hit = true
			if hit and not bu.pierce:
				bullets.remove_at(i)

func _boss_attack(atk: Dictionary) -> void:
	var s := Save.e_scale(level)
	var b := boss
	var args: Array = atk.args
	match atk.kind:
		"aimed": aimed_shot(b.x, b.y + 40, int(args[0]), args[1], args[2], s)
		"ring":
			var off: float = b.seed if int(args[2]) == 0 else b.seed + b.t
			boss_ring(int(args[0]), args[1], off)
		"wall": boss_wall(int(args[0]), args[1])
		"wall_aimed":
			boss_wall(int(args[0]), args[1])
			aimed_shot(b.x, b.y + 40, int(args[2]), args[3], args[4], s)
		"aimed_spiral":
			aimed_shot(b.x, b.y + 40, int(args[0]), args[1], args[2], s)
			boss_spiral(int(args[3]), args[4])
		"spiral": boss_spiral(int(args[0]), args[1])
		"double_spiral":
			boss_spiral(int(args[0]), args[1])
			spiral_a -= args[2]
			boss_spiral(int(args[3]), args[4])
		"parts_aimed":
			for p in b.parts:
				if not p.dead:
					aimed_shot(p.x, p.y + 14, int(args[0]), args[1], args[2], s)
		"burst":
			for i in int(args[0]):
				_schedule(i * 0.13, func():
					if not boss.is_empty() and not boss.dead:
						aimed_shot(boss.x, boss.y + 40, int(args[1]), args[2], args[3], s))
		"double_aimed":
			aimed_shot(b.x - args[0], b.y + 40, int(args[1]), args[2], args[3], s)
			_schedule(args[4], func():
				if not boss.is_empty() and not boss.dead:
					aimed_shot(boss.x + args[0], boss.y + 40, int(args[1]), args[2], args[3], s))
		"rain": boss_rain(int(args[0]), args[1])
		"cross": boss_cross(int(args[0]), args[1])
		"missiles": boss_missiles(int(args[0]), 1.8)
		"missiles_ring":
			boss_missiles(int(args[0]), 1.8)
			boss_ring(int(args[1]), args[2], b.t)
		"missiles_bounce":
			boss_missiles(int(args[0]), 1.8)
			boss_bounce(int(args[1]), args[2])
		"missiles_free":
			for i in int(args[0]):
				eb(b.x + randf_range(-60, 60), b.y + 30, PI / 2.0 + randf_range(-0.5, 0.5), 120.0 * s.bs, "missile", 8, 1.7)
		"mines": boss_mines(int(args[0]))
		"mines_sweep":
			boss_mines(int(args[0]))
			boss_beam_sweep(int(args[1]), args[2], args[3])
		"coins": boss_coins(int(args[0]))
		"coins_bounce":
			boss_coins(int(args[0]))
			boss_bounce(int(args[1]), args[2])
		"bounce": boss_bounce(int(args[0]), args[1])
		"grid": boss_grid(args[0])
		"launch": boss_launch(args[0], int(args[1]))
		"launch_rain":
			boss_launch(args[0], int(args[1]))
			boss_rain(int(args[2]), args[3])
		"beams2":
			beams.append({ "x": b.x - args[0], "w": args[1], "warn": args[2], "dur": args[3], "t": 0.0, "hit_cd": 0.0, "vx": 0.0 })
			beams.append({ "x": b.x + args[0], "w": args[1], "warn": args[2], "dur": args[3], "t": 0.0, "hit_cd": 0.0, "vx": 0.0 })
		"beamsweep": boss_beam_sweep(int(args[0]), args[1], args[2])

func _schedule(delay: float, fn: Callable) -> void:
	scheduled.append({ "t": delay, "fn": fn })

func apply_scheduled(dt: float) -> void:
	for i in range(scheduled.size() - 1, -1, -1):
		var sc: Dictionary = scheduled[i]
		sc.t -= dt
		if sc.t <= 0.0:
			scheduled.remove_at(i)
			sc.fn.call()

func boss_ring(n: int, sp_mul: float, off: float) -> void:
	var s := Save.e_scale(level)
	for i in n:
		eb(boss.x, boss.y + 10, i / float(n) * TAU + off, 134.0 * sp_mul * s.bs, "ball", 15)
	Audio2.sfx("ehit")

func boss_spiral(arms: int, sp_mul: float) -> void:
	var s := Save.e_scale(level)
	spiral_a += 0.42
	for i in arms:
		eb(boss.x, boss.y + 10, spiral_a + i / float(arms) * TAU, 146.0 * sp_mul * s.bs, "ball", 14)

func boss_wall(n_gap: int, gap_w: float) -> void:
	var s := Save.e_scale(level)
	gap_w = maxf(gap_w, 350.0 if level == 12 else 200.0)
	var gap: float
	if level == 12 and not first_player().is_empty() and first_player().alive:
		gap = clampf(first_player().x - gap_w / 2.0, 0.0, Data.FW - gap_w)
	else:
		gap = randf_range(60.0, Data.FW - gap_w - 60.0)
	var x := 30.0
	while x < Data.FW - 26.0:
		if not (x > gap and x < gap + gap_w):
			eb(x, boss.y + 100, PI / 2.0, 106.0 * s.bs, "ball", 14)
		x += 54.0
	Audio2.sfx("ehit")

func boss_rain(n: int, sp: float) -> void:
	var s := Save.e_scale(level)
	for i in n:
		eb(randf_range(20, Data.FW - 20), -10 - randf_range(0, 80),
			PI / 2.0 + randf_range(-0.18, 0.18), (100.0 + randf_range(0, 50)) * sp * s.bs, "orb", 9)
	Audio2.sfx("ehit")

func boss_cross(n: int, sp: float) -> void:
	var s := Save.e_scale(level)
	for i in n:
		var a := 0.4 + i / maxf(1, n - 1) * 0.6
		eb(boss.x - 110, boss.y + 40, PI / 2.0 + a, 128.0 * sp * s.bs, "ball", 12)
		eb(boss.x + 110, boss.y + 40, PI / 2.0 - a, 128.0 * sp * s.bs, "ball", 12)
	Audio2.sfx("ehit")

func boss_missiles(n: int, steer := 1.8) -> void:
	var s := Save.e_scale(level)
	for i in n:
		eb(boss.x + randf_range(-90, 90), boss.y + 30, PI / 2.0 + randf_range(-0.8, 0.8), 118.0 * s.bs, "missile", 8, steer)
	Audio2.sfx("cannon")

func boss_mines(n: int) -> void:
	for i in n:
		var m := spawn_enemy("mine", boss.x + randf_range(-150, 150), boss.y + 60 + i * 20, { "ty": randf_range(280, 420) })
		m.mvx = 0.35
	Audio2.sfx("ui")

func boss_coins(n: int) -> void:
	var s := Save.e_scale(level)
	for i in n:
		eb(boss.x + randf_range(-120, 120), boss.y + 40, PI / 2.0 + randf_range(-0.3, 0.3),
			(70.0 + randf_range(0, 40)) * s.bs, "orb", 15, 0, TH.gold)
	Audio2.sfx("coin")

func boss_bounce(n: int, sp: float) -> void:
	var s := Save.e_scale(level)
	for i in n:
		eb(boss.x, boss.y + 30, PI / 2.0 + (i - (n - 1) / 2.0) * 0.5, 150.0 * sp * s.bs, "bounce", 13)
	Audio2.sfx("ehit")

func boss_grid(step: float) -> void:
	var s := Save.e_scale(level)
	var off := randf_range(0, step)
	var x := off
	while x < Data.FW:
		eb(x, boss.y + 90, PI / 2.0, 96.0 * s.bs, "ball", 10)
		x += step
	for side in 2:
		var sx := -10.0 if side == 0 else Data.FW + 10.0
		var a := 0.0 if side == 0 else PI
		var y := 160.0
		while y < Data.FH - 120:
			eb(sx, y, a, 96.0 * s.bs, "ball", 10)
			y += step
	Audio2.sfx("ehit")

func boss_launch(kind: String, n: int) -> void:
	# tous les engins du module 20 existent : plus de remplacement
	for i in n:
		spawn_enemy(kind, boss.x + randf_range(-80, 80), boss.y + 40, { "ty": randf_range(240, 380) })
	Audio2.sfx("alert")

func boss_beam_sweep(n: int, vx: float, dur: float) -> void:
	for i in n:
		var x: float = boss.x if n == 1 else 80.0 + (Data.FW - 160.0) * i / (n - 1)
		beams.append({ "x": x, "w": 54.0, "warn": 1.0, "dur": dur, "t": 0.0, "hit_cd": 0.0,
			"vx": vx * (1 if i % 2 == 1 else -1) })
	Audio2.sfx("laser")

func update_beams(dt: float) -> void:
	for i in range(beams.size() - 1, -1, -1):
		var bm: Dictionary = beams[i]
		bm.t += dt
		# le rayon du lanceur suit son tireur tant qu'il vit (module 20)
		if bm.has("follow"):
			var f: Dictionary = bm.follow
			if f.dead or not enemies.has(f):
				bm.dur = minf(bm.dur, bm.t + 0.2)
			else:
				bm.x = f.x
		bm.x += bm.vx * dt
		if bm.vx != 0.0 and (bm.x < 40.0 or bm.x > Data.FW - 40.0):
			bm.vx *= -1.0
		if bm.t > bm.warn + bm.dur:
			beams.remove_at(i)
			continue
		if bm.t > bm.warn:
			bm.hit_cd -= dt
			for P in players:
				if P.alive and not P.out and absf(P.x - bm.x) < bm.w / 2.0 and bm.hit_cd <= 0.0:
					bm.hit_cd = 0.35
					hit_player(P, 1, false)

# =========================================================================
#  RÉCOLTE (après le boss)
# =========================================================================
func update_harvest(dt: float) -> void:
	if harvest.is_empty():
		level_complete()
		return
	harvest.t += dt
	var fort: bool = harvest.t > 1.6
	for k in pickups:
		var P := nearest_player(k.x, k.y)
		if P.is_empty(): continue
		var dx: float = P.x - k.x
		var dy: float = P.y - k.y
		var d: float = sqrt(dx * dx + dy * dy)
		k.mag = true
		var spd := 620.0 if fort else 380.0
		if d > 0:
			k.vx = lerpf(k.vx, dx / d * spd, clampf(dt * 7, 0, 1))
			k.vy = lerpf(k.vy, dy / d * spd, clampf(dt * 7, 0, 1))
		k.x = clampf(k.x, 12.0, Data.FW - 12.0)
		k.y = clampf(k.y, 12.0, Data.FH - 12.0)
	var fini: bool = (harvest.t > 2.4 and pickups.is_empty()) or harvest.t > harvest.dur
	if not fini: return
	var n := 0
	for k in pickups:
		var P := nearest_player(k.x, k.y)
		collect(k, P if not P.is_empty() else first_player())
		n += 1
	pickups.clear()
	if n > 0:
		pop_text(Data.FW / 2.0, Data.FH * 0.62, "+%d RAMASSÉ" % n, TH.gold, 12)
		Audio2.sfx("pick")
	harvest = {}
	level_complete()

func level_complete() -> void:
	if phase == Phase.CLEAR: return
	phase = Phase.CLEAR
	clear_wait = 0.0
	var d: Dictionary = Data.DIFFS[int(Save.S.opts.diff)]
	last_bonus = int(round((150 + level * 40) * d.credit * stats.credit_mul + (40 if no_death else 0)))
	credits_run += last_bonus
	Audio2.sfx("levelup")
	Audio2.speak("Secteur neutralisé.")
	add_flash(0.5, TH.p_lite)
	for i in 3:
		add_pickup(randf_range(60, Data.FW - 60), -20 - i * 70, "credit", 55 + level * 20)

# =========================================================================
#  BUTIN
# =========================================================================
func add_pickup(x: float, y: float, kind: String, value: float) -> void:
	pickups.append({ "x": x, "y": y, "vx": randf_range(-50, 50), "vy": randf_range(30, 70),
		"kind": kind, "value": value, "t": 0.0, "mag": false })

func update_pickups(dt: float) -> void:
	var mag: float = stats.magnet
	for i in range(pickups.size() - 1, -1, -1):
		var k: Dictionary = pickups[i]
		k.t += dt
		var P := nearest_player(k.x, k.y)
		var dx: float = P.x - k.x if not P.is_empty() else 0.0
		var dy: float = P.y - k.y if not P.is_empty() else 0.0
		var d: float = sqrt(dx * dx + dy * dy)
		if not P.is_empty() and d < mag:
			k.mag = true
			k.vx = lerpf(k.vx, dx / d * 420.0, clampf(dt * 6, 0, 1))
			k.vy = lerpf(k.vy, dy / d * 420.0, clampf(dt * 6, 0, 1))
		else:
			k.vx *= pow(0.4, dt)
			k.vy = lerpf(k.vy, 52.0, clampf(dt * 2, 0, 1))
		k.x += k.vx * dt
		k.y += k.vy * dt
		if k.y > Data.FH + 30 or ((k.x < -30 or k.x > Data.FW + 30) and not k.mag):
			pickups.remove_at(i)
			continue
		if not P.is_empty() and d < 34.0:
			collect(k, P)
			pickups.remove_at(i)

func collect(k: Dictionary, P: Dictionary) -> void:
	match k.kind:
		"power":
			if P.power < 5:
				P.power += 1
				pop_text(P.x, P.y - 26, "PWR %d" % P.power, TH.gold, 9)
			else:
				add_score(P, 250)
				pop_text(P.x, P.y - 26, "+250", TH.gold, 9)
			Audio2.sfx("power")
		"shield":
			if P.shield < P.sh_max + 1: P.shield += 1
			else: add_score(P, 200)
			pop_text(P.x, P.y - 26, "BOUCLIER", TH.shield, 9)
			Audio2.sfx("pick")
		"hull":
			if P.hp < P.max_hp: P.hp += 1
			else: add_score(P, 150)
			pop_text(P.x, P.y - 26, "COQUE", TH.hull, 9)
			Audio2.sfx("pick")
		"credit":
			var d: Dictionary = Data.DIFFS[int(Save.S.opts.diff)]
			var v := int(round(maxf(k.value, 25) * stats.credit_mul * d.credit))
			credits_run += v
			pop_text(P.x, P.y - 26, "+%d" % v, TH.gold, 9)
			Audio2.sfx("coin")
		"bomb":
			if P.bombs < 5: P.bombs += 1
			else: add_score(P, 300)
			pop_text(P.x, P.y - 26, "BOMBE", Color("#ff7ad9"), 9)
			Audio2.sfx("pick")
		"scrap", "crystal", "circuit":
			Save.S.materials[k.kind] = int(Save.S.materials.get(k.kind, 0)) + maxi(1, int(k.value))
			pop_text(P.x, P.y - 26, "+%d %s" % [maxi(1, int(k.value)), Data.PKIND[k.kind].name], Color(Data.PKIND[k.kind].col), 9)
			Audio2.sfx("coin")

# =========================================================================
#  PARTICULES & EFFETS
# =========================================================================
func spawn_part(x: float, y: float, vx: float, vy: float, life: float, col: Color, size: float, glow: bool) -> void:
	if parts.size() > Data.ERAS[era_idx].max_parts: return
	parts.append({ "x": x, "y": y, "vx": vx, "vy": vy, "life": life, "max_life": life,
		"col": col, "size": size, "glow": glow })

func explode(x: float, y: float, size: float, c1: Color, c2: Color) -> void:
	var n := 6 if era_idx == 0 else int(round(14 * size * (2.2 if era_idx >= 3 else 1.0)))
	for i in n:
		var a := randf() * TAU
		var v := randf_range(40, 160) * size
		spawn_part(x, y, cos(a) * v, sin(a) * v,
			randf_range(0.25, 0.7) * (1.4 if era_idx >= 3 else 1.0),
			c1 if randf() < 0.5 else c2, randf_range(4, 9) * minf(2, size), era_idx >= 2)
	shocks.append({ "x": x, "y": y, "t": 0.0, "life": 0.5 if era_idx >= 3 else 0.32,
		"max": size * 26.0 * (1.8 if era_idx >= 3 else 1.0), "col": c2 })

func update_parts(dt: float) -> void:
	var drag := pow(0.88, 60.0 * dt)
	for i in range(parts.size() - 1, -1, -1):
		var p: Dictionary = parts[i]
		p.life -= dt
		if p.life <= 0:
			parts.remove_at(i)
			continue
		p.x += p.vx * dt
		p.y += p.vy * dt
		p.vx *= drag
		p.vy *= drag
	for i in range(shocks.size() - 1, -1, -1):
		var s: Dictionary = shocks[i]
		s.t += dt
		if s.t > s.life: shocks.remove_at(i)
	for i in range(pops.size() - 1, -1, -1):
		var p2: Dictionary = pops[i]
		p2.t += dt
		p2.y -= 26.0 * dt
		if p2.t > p2.life: pops.remove_at(i)

func pop_text(x: float, y: float, text: String, col: Color, size: float) -> void:
	pops.append({ "x": x, "y": y, "text": text, "col": col, "size": size, "t": 0.0, "life": 0.9 })

func add_shake(v: float) -> void:
	shake = minf(30.0, shake + v * float(Save.S.opts.shake) / 100.0)

func add_flash(v: float, col: Color) -> void:
	flash = maxf(flash, v)
	flash_col = col

func emit_trail(P: Dictionary) -> void:
	var x: float = P.x + randf_range(-3, 3)
	var y: float = P.y + 20.0
	match Save.S.sel.trail:
		"pixel":
			spawn_part(x, y, randf_range(-20, 20), randf_range(60, 150), 0.25 if era_idx == 0 else 0.4,
				TH.p_main if era_idx == 0 else TH.p_lite, 2.0 if era_idx == 0 else 3.0, era_idx >= 2)
		"plasma":
			spawn_part(x + randf_range(-4, 4), y, randf_range(-30, 30), randf_range(90, 210),
				randf_range(0.3, 0.6), TH.p_glow if randf() < 0.5 else TH.p_lite, randf_range(3, 6), true)
		"ion":
			spawn_part(x, y, randf_range(-14, 14), randf_range(160, 320), randf_range(0.25, 0.5),
				TH.p_lite, 2.4, true)
		"quantum":
			spawn_part(x + randf_range(-8, 8), y, randf_range(-50, 50), randf_range(120, 260),
				randf_range(0.4, 0.9), Color("#c9a8ff") if randf() < 0.5 else TH.p_glow, randf_range(2, 5), true)
	if Save.S.sel.aura != "none":
		P.aura_t -= 0.03
		if P.aura_t <= 0.0:
			P.aura_t = 0.05
			var aura_def := {}
			for ad in Data.AURAS:
				if ad.id == Save.S.sel.aura: aura_def = ad
			if not aura_def.is_empty():
				var ang := randf() * TAU
				var rad := randf_range(16, 30)
				spawn_part(P.x + cos(ang) * rad, P.y + sin(ang) * rad,
					cos(ang) * 26, sin(ang) * 26 - 20, randf_range(0.3, 0.6), Color(aura_def.col), 3.2, era_idx >= 1)

# =========================================================================
#  RENDU — tout est dessiné comme sur le canvas d'origine
# =========================================================================
func _font() -> Font:
	return ThemeDB.fallback_font

func _txt(pos: Vector2, text: String, size: int, col: Color, align := HORIZONTAL_ALIGNMENT_LEFT) -> void:
	if align == HORIZONTAL_ALIGNMENT_RIGHT:
		draw_string(_font(), Vector2(0, pos.y), text, align, pos.x, size, col)
	elif align == HORIZONTAL_ALIGNMENT_CENTER:
		draw_string(_font(), Vector2(pos.x - 140.0, pos.y), text, align, 280.0, size, col)
	else:
		draw_string(_font(), pos, text, align, -1, size, col)

func _draw() -> void:
	# fond de l'ère
	draw_rect(Rect2(0, 0, Data.FW, Data.FH), TH.bg)
	# module 29 : au secteur 24, le fond est le couloir de la base (tuile qui défile)
	if level == Data.MAX_LEVEL and nv24_tex.has("corridor"):
		var ct: Texture2D = nv24_tex["corridor"]
		var cw := float(ct.get_width())
		var sc := Data.FW / cw
		var th := float(ct.get_height()) * sc
		var off := fposmod(scroll_y * 0.6, th)
		var yy := -off
		while yy < Data.FH:
			draw_texture_rect(ct, Rect2(0, yy, Data.FW, th), false)
			yy += th
	# secousse d'écran
	var ox := 0.0
	var oy := 0.0
	if shake > 0.0:
		ox = randf_range(-shake, shake) * 0.5
		oy = randf_range(-shake, shake) * 0.5
	draw_set_transform(Vector2(ox, oy), 0.0, Vector2.ONE)

	_draw_backdrop()
	_draw_stars()
	_draw_props()
	_draw_pickups()
	_draw_ebullets()
	_draw_enemies()
	_draw_beams()
	if not boss.is_empty():
		_draw_boss()
	_draw_players()
	_draw_bullets()
	_draw_parts()
	_draw_shocks()
	_draw_pops()
	_draw_banners()

	# voile de flash
	if flash > 0.0:
		var fc: Color = flash_col
		fc.a = clampf(flash * 0.55, 0.0, 0.85)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		draw_rect(Rect2(0, 0, Data.FW, Data.FH), fc)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

## le sas de confinement (module 29) : battants, fissures révélées par les
## dégâts, flash d'impact, barre de vie, consigne « DÉTRUIS LE SAS »
func _draw_sas() -> void:
	if sas.boom and sas.hp <= 0.0:
		return
	var r := Rect2(sas.x - sas.w / 2.0, sas.y - sas.h / 2.0, sas.w, sas.h)
	if nv24_tex.has("door"):
		draw_texture_rect(nv24_tex["door"], r, false)
	else:
		draw_rect(r, Color(0.16, 0.2, 0.3))
		draw_rect(r, Color(0.5, 0.62, 0.8), false, 2.0)
		draw_line(Vector2(sas.x, r.position.y), Vector2(sas.x, r.end.y), Color(0.35, 0.44, 0.6), 3.0)
	# fissures : 9 polylines, générées comme makeDoor, k = dégâts subis
	var frac: float = clampf(sas.hp / sas.max, 0.0, 1.0)
	var k := int(round((1.0 - frac) * 9.0))
	if k > 0:
		var base := Vector2(sas.x, sas.y)
		for pts in nv24_cracks(k):
			var abs_pts := PackedVector2Array()
			for p in pts:
				abs_pts.append(base + p)
			draw_polyline(abs_pts, Color(1, 1, 1, 0.85), 1.2)
	if sas.flash > 0.0:
		draw_rect(r, Color(1, 1, 1, minf(1.0, sas.flash * 6.0)))
	# barre de vie + consigne
	var bw: float = sas.w * 0.9
	draw_rect(Rect2(sas.x - bw / 2.0, r.end.y + 8.0, bw, 6.0), Color(0, 0, 0, 0.5))
	draw_rect(Rect2(sas.x - bw / 2.0, r.end.y + 8.0, bw * frac, 6.0), Color("#ffd166"))
	_txt(Vector2(Data.FW / 2.0, sas.y - sas.h / 2.0 - 26.0), "DÉTRUIS LE SAS", 14, TH.acc, HORIZONTAL_ALIGNMENT_CENTER)
	_txt(Vector2(Data.FW / 2.0, sas.y - sas.h / 2.0 - 10.0), "SAS DE CONFINEMENT", 9, Color(0.65, 0.75, 0.9), HORIZONTAL_ALIGNMENT_CENTER)

func _draw_stars() -> void:
	if era_idx == 0:
		return
	var n_layers: int = Data.ERAS[era_idx].star_layers
	var cols: Array = [TH.bg2, TH.bg3, TH.star, TH.star, TH.p_lite]
	for l in mini(n_layers, stars.size()):
		var c: Color = cols[mini(l, cols.size() - 1)]
		var sz := 1.0 + l * 0.4
		for st in stars[l]:
			if era_idx == 0 and l > 1: continue
			draw_rect(Rect2(st.x, st.y, sz, sz + l * 0.6), c)

func _draw_props() -> void:
	for p in props:
		if era_idx == 0:
			draw_rect(Rect2(p.x - 26, p.y - 20, 52, 40), TH.livery[2])
			draw_rect(Rect2(p.x - 26, p.y - 20, 52, 40), TH.livery[1], false, 2.0)
			draw_rect(Rect2(p.x - 14, p.y - 8, 28, 16), TH.livery[1])
			draw_circle(Vector2(p.x, p.y), 5.0, TH.livery[0])
		else:
			var w := 120.0
			var base: Color = TH.bg3.lerp(Color.WHITE, 0.06)
			draw_rect(Rect2(p.x - w / 2, p.y - 7, w, 14), base)
			draw_rect(Rect2(p.x - w / 2, p.y - 7, w, 14), Color(TH.star.r, TH.star.g, TH.star.b, 0.5), false, 1.2)
			var n := 5
			for i in n:
				var x0: float = p.x - w / 2 + i * (w / n)
				draw_line(Vector2(x0, p.y - 7), Vector2(x0 + w / n, p.y + 7),
					Color(TH.star.r, TH.star.g, TH.star.b, 0.3), 1.0)
				draw_line(Vector2(x0 + w / n, p.y - 7), Vector2(x0, p.y + 7),
					Color(TH.star.r, TH.star.g, TH.star.b, 0.3), 1.0)
			for i in 3:
				var lx: float = p.x - w / 3 + i * (w / 3)
				var on: bool = fmod(p.t * 3.0 + i, 1.0) < 0.6
				draw_circle(Vector2(lx, p.y), 2.6, TH.acc if on else TH.bg2)

## détails animés par-dessus les nouveaux sprites (drawEnemyExtra du module 20)
func _draw_enemy_extra(en: Dictionary) -> void:
	if en.get("mini", false):
		var pu: float = 0.8 + 0.2 * sin(en.t * 5.0)
		var col: Color = TH.livery[3] if era_idx == 0 else TH.e_boss_lite
		draw_arc(Vector2(en.x, en.y), en.r * 1.05 * pu, 0, TAU, 24, Color(col.r, col.g, col.b, 0.55), 3.0 if era_idx > 0 else 2.0)
		if era_idx >= 2:
			draw_circle(Vector2(en.x, en.y), en.r * 1.3 * pu, Color(TH.e_boss.r, TH.e_boss.g, TH.e_boss.b, 0.18))
	if en.kind == "lancer":
		var ch: float = clampf(1.0 - en.fire_t / 0.9, 0.0, 1.0) if en.fire != null else 0.0
		if ch > 0.0:
			draw_circle(Vector2(en.x, en.y + 24.0), 4.0 + ch * 7.0, TH.livery[3] if era_idx == 0 else TH.e_boss_lite)
	elif en.kind == "layer":
		if en.get("layer_t", 9.0) < 0.5 and en.get("laid", 0) < 4:
			draw_rect(Rect2(en.x - 5.0, en.y + 2.0, 10.0, 10.0), TH.livery[3] if era_idx == 0 else TH.danger)
	elif en.kind == "kamikaze" and en.get("lock", 0.0) > 0.0 and en.get("lock_t", 0.0) > 0.0:
		if int(en.t * 12.0) % 2 == 1:
			draw_arc(Vector2(en.x, en.y), 18.0, 0, TAU, 20, TH.livery[3] if era_idx == 0 else TH.danger, 2.0)
	elif en.kind == "phalanx":
		var lc: Color = TH.livery[2] if era_idx == 0 else TH.e_boss_lite
		draw_rect(Rect2(en.x - 40.0, en.y - 22.0, 80.0, 2.0), Color(lc.r, lc.g, lc.b, 0.35))

func _draw_pickups() -> void:
	for k in pickups:
		var def: Dictionary = Data.PKIND[k.kind]
		var col: Color = def.col
		var bob := sin(k.t * 6.0) * 2.0
		var r := Rect2(k.x - 8, k.y - 8 + bob, 16, 16)
		if era_idx == 0:
			draw_rect(r, TH.p_main)
			_txt(Vector2(k.x - 4, k.y + 4 + bob), def.ch, 11, TH.bg)
		else:
			if era_idx >= 2:
				draw_circle(Vector2(k.x, k.y + bob), 13, Color(col.r, col.g, col.b, 0.25 + 0.12 * sin(k.t * 8)))
			draw_rect(r, Color(0.016, 0.03, 0.06, 0.85))
			draw_rect(r, col, false, 1.6)
			if era_idx >= 2:
				_txt(Vector2(k.x - 4, k.y + 4 + bob), def.ch, 11, col)

func _draw_ebullets() -> void:
	for b in ebullets:
		var pos := Vector2(b.x, b.y)
		match b.kind:
			"missile":
				var ang := atan2(b.vy, b.vx)
				draw_set_transform(pos, ang, Vector2.ONE)
				draw_colored_polygon(PackedVector2Array([Vector2(7, 0), Vector2(-5, 4), Vector2(-5, -4)]), TH.e_boss_lite if era_idx > 0 else TH.livery[2])
				draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
			"bounce":
				draw_set_transform(pos, PI / 4.0, Vector2.ONE)
				draw_rect(Rect2(-b.r * 0.7, -b.r * 0.7, b.r * 1.4, b.r * 1.4), TH.e_boss if era_idx > 0 else TH.livery[0])
				draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
			"orb":
				var c2: Color = b.col if b.col != null else (TH.e_boss if era_idx > 0 else TH.livery[2])
				draw_arc(pos, b.r, 0, TAU, 16, c2, 2.5)
				draw_circle(pos, b.r * 0.4, c2)
			_:
				var c3: Color = TH.e_boss_lite if era_idx > 0 else TH.livery[2]
				draw_circle(pos, b.r, TH.e_boss if era_idx > 0 else TH.livery[0])
				draw_circle(pos, b.r * 0.55, c3)

func ox_shake() -> float:
	return 0.0  # la secousse est appliquée par le transform global du _draw

func _draw_enemies() -> void:
	for e in enemies:
		var th: Dictionary = Data.ETHEME.get(e.kind, Data.ETHEME.drone)
		var body: Color = Color.from_hsv(th.h / 360.0, th.s, clampf(th.l * 1.9, 0, 1))
		if era_idx == 0:
			body = TH.livery[0]
		var lite: Color = Color.from_hsv(th.h / 360.0, th.s * 0.6, 1.0)
		if era_idx == 0:
			lite = TH.livery[1]
		if e.flash > 0.0:
			body = Color(1, 1, 1)
			lite = Color(1, 1, 1)
		var r: float = e.r
		# ère 0 : sprite cuit par le baker POCKET (silhouettes SIL du moteur)
		var eid: String = e.get("eid", e.kind)
		if era_idx == 0:
			var bt: Texture2D = PocketBaker.bake_flash(eid) if e.flash > 0.0 else PocketBaker.bake(eid, int(e.t * 6.0) % 4)
			if bt != null:
				# TOUCH_ACTOR_SCALE = 1.22 : tous les acteurs du tactile
				var ds: float = e.get("dscale", 1.0)
				var bh2: float = maxi(6, int(round(float(PocketBaker.SPRITE_H.get(eid, 60)) * 0.305))) * ds
				var bw4: float = maxi(5, int(round(float(bh2) * PocketBaker.SIL[eid].w)))
				draw_texture_rect(bt, Rect2(e.x - bw4 / 2.0, e.y - bh2 / 2.0, bw4, bh2), false)
				_draw_enemy_extra(e)
				continue
			_draw_enemy_extra(e)
		# >>> tout est dessiné en coordonnées LOCALES, transformé à la position
		# de l'ennemi (c'était le bug d'écran vert : polygones à l'origine) <<<
		draw_set_transform(Vector2(e.x, e.y), 0.0, Vector2.ONE)
		if era_idx == 0 and e.flash <= 0.0:
			# gravures Pocket (addPocketEnemyDetail) : verrière, arête, plaques
			var g1: Color = TH.livery[2]
			var g2: Color = TH.livery[1]
			draw_rect(Rect2(-r * 0.14, -r * 0.27, r * 0.28, r * 0.09), g2)
			draw_rect(Rect2(-r * 0.08, -r * 0.25, r * 0.16, r * 0.035), g1)
			draw_rect(Rect2(-r * 0.035, -r * 0.16, r * 0.07, r * 0.37), g2)
			draw_rect(Rect2(-r * 0.31, r * 0.06, r * 0.20, r * 0.045), g2)
			draw_rect(Rect2(r * 0.11, r * 0.06, r * 0.20, r * 0.045), g2)
			draw_rect(Rect2(-r * 0.20, r * 0.11, r * 0.15, r * 0.035), g1)
			draw_rect(Rect2(r * 0.11, r * 0.11, r * 0.15, r * 0.035), g1)
		# les mini-boss reprennent la silhouette de leur engin de base (EID)
		match e.get("eid", e.kind):
			"drone":
				_poly([Vector2(0, r * 0.8), Vector2(-r * 0.7, -r * 0.4), Vector2(0, -r * 0.1), Vector2(r * 0.7, -r * 0.4)], body)
				draw_circle(Vector2.ZERO, r * 0.22, lite)
			"stinger":
				_poly([Vector2(0, r), Vector2(-r * 0.6, -r * 0.6), Vector2(0, -r * 0.2), Vector2(r * 0.6, -r * 0.6)], body)
				draw_rect(Rect2(-2, -r * 0.9, 4, r * 0.6), lite)
			"turret":
				draw_colored_polygon(_ngon(Vector2.ZERO, r, 6, e.t * 0.7), body)
				draw_circle(Vector2.ZERO, r * 0.4, lite)
			"runner":
				_poly([Vector2(0, r), Vector2(-r * 0.8, -r * 0.7), Vector2(r * 0.8, -r * 0.7)], body)
			"swarmlet":
				draw_set_transform(Vector2(e.x, e.y), e.t * 3.0, Vector2.ONE)
				draw_rect(Rect2(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2), body)
			"shielder":
				draw_colored_polygon(_ngon(Vector2.ZERO, r, 6, 0), body)
				draw_circle(Vector2.ZERO, r * 0.35, lite)
				if e.guard_on:
					draw_arc(Vector2.ZERO, r + 7.0, -PI * 0.25, PI * 1.25, 20, lite, 3.0)
			"splitter":
				draw_circle(Vector2(-r * 0.3, 0), r * 0.55, body)
				draw_circle(Vector2(r * 0.3, 0), r * 0.55, body)
				draw_circle(Vector2.ZERO, r * 0.3, lite)
			"carrier":
				draw_rect(Rect2(-r, -r * 0.45, r * 2, r * 0.9), body)
				draw_rect(Rect2(-r * 0.4, -r * 0.7, r * 0.8, r * 1.4), lite)
				_hp_bar_local(r, e)
			"elite":
				draw_colored_polygon(_ngon(Vector2.ZERO, r, 8, e.t * 0.5), body)
				draw_colored_polygon(_ngon(Vector2.ZERO, r * 0.55, 8, -e.t * 0.8), lite)
				_hp_bar_local(r, e)
			"mine":
				draw_circle(Vector2.ZERO, r * 0.62, body)
				for k in 8:
					var a: float = k / 8.0 * TAU + e.t * 0.9
					draw_line(Vector2(cos(a), sin(a)) * r * 0.6, Vector2(cos(a), sin(a)) * r, lite, 2.0)
				draw_circle(Vector2.ZERO, r * 0.25, lite)
			"sniper":
				_poly([Vector2(0, r * 1.1), Vector2(-r * 0.5, 0), Vector2(0, -r * 1.1), Vector2(r * 0.5, 0)], body)
				draw_circle(Vector2.ZERO, r * 0.2, lite)
			# ---- module 20 : les huit engins, silhouettes de leurs SIL ----
			"bomber":
				_poly([Vector2(-r * 0.96, r * 0.14), Vector2(-r * 0.34, -r * 0.42), Vector2(r * 0.34, -r * 0.42),
					Vector2(r * 0.96, r * 0.14), Vector2(r * 0.62, r * 0.42), Vector2(-r * 0.62, r * 0.42)], body)
				draw_rect(Rect2(-r * 0.32, r * 0.1, r * 0.64, r * 0.22), body.darkened(0.45))
				draw_rect(Rect2(-r * 0.24, r * 0.14, r * 0.48, r * 0.12), lite)
				draw_rect(Rect2(-r * 0.54, r * 0.46, r * 0.14, r * 0.18), lite)
				draw_rect(Rect2(r * 0.40, r * 0.46, r * 0.14, r * 0.18), lite)
			"kamikaze":
				_poly([Vector2(0, r * 0.96), Vector2(r * 0.2, -r * 0.46), Vector2(0, -r * 0.7), Vector2(-r * 0.2, -r * 0.46)], body)
				_poly([Vector2(r * 0.18, r * 0.1), Vector2(r * 0.62, -r * 0.56), Vector2(r * 0.56, -r * 0.66), Vector2(r * 0.16, -r * 0.46)], body.darkened(0.3))
				_poly([Vector2(-r * 0.18, r * 0.1), Vector2(-r * 0.62, -r * 0.56), Vector2(-r * 0.56, -r * 0.66), Vector2(-r * 0.16, -r * 0.46)], body.darkened(0.3))
				draw_rect(Rect2(-r * 0.09, -r * 0.2, r * 0.18, r * 0.46), lite)
			"layer":
				_poly([Vector2(-r * 0.7, -r * 0.52), Vector2(r * 0.7, -r * 0.52), Vector2(r * 0.84, r * 0.5), Vector2(-r * 0.84, r * 0.5)], body)
				for lx in [-0.4, 0.0, 0.4]:
					draw_rect(Rect2(r * lx - r * 0.13, r * 0.04, r * 0.26, r * 0.42), body.darkened(0.45))
					draw_circle(Vector2(r * lx, r * -0.4), r * 0.09, lite)
			"lancer":
				_poly([Vector2(-r * 0.44, r * 0.5), Vector2(r * 0.44, r * 0.5), Vector2(r * 0.56, r * 0.1),
					Vector2(r * 0.44, -r * 0.3), Vector2(-r * 0.44, -r * 0.3), Vector2(-r * 0.56, r * 0.1)], body)
				draw_rect(Rect2(-r * 0.09, r * 0.5, r * 0.18, r * 0.84), body.darkened(0.45))
				draw_rect(Rect2(-r * 0.04, r * 0.5, r * 0.08, r * 0.84), lite.darkened(0.2))
				draw_circle(Vector2(0, r * 1.34), r * 0.16, lite)
			"missileer":
				_poly([Vector2(-r * 0.42, r * 0.6), Vector2(r * 0.42, r * 0.6), Vector2(r * 0.52, -r * 0.5), Vector2(-r * 0.52, -r * 0.5)], body)
				_poly([Vector2(-r * 0.52, -r * 0.5), Vector2(-r * 0.78, -r * 0.7), Vector2(-r * 0.74, -r * 0.78), Vector2(-r * 0.4, -r * 0.6)], body.darkened(0.3))
				_poly([Vector2(r * 0.52, -r * 0.5), Vector2(r * 0.78, -r * 0.7), Vector2(r * 0.74, -r * 0.78), Vector2(r * 0.4, -r * 0.6)], body.darkened(0.3))
				for tx in [-0.3, -0.1, 0.1, 0.3]:
					draw_rect(Rect2(r * tx - r * 0.07, r * 0.1, r * 0.14, r * 0.4), body.darkened(0.45))
				draw_rect(Rect2(-r * 0.25, -r * 0.28, r * 0.5, r * 0.18), lite)
			"phalanx":
				_poly([Vector2(-r * 0.96, r * 0.3), Vector2(r * 0.96, r * 0.3), Vector2(r * 0.96, -r * 0.2), Vector2(0, -r * 0.66), Vector2(-r * 0.96, -r * 0.2)], body)
				draw_rect(Rect2(-r * 0.95, -r * 0.4, r * 1.9, r * 0.12), lite.darkened(0.1))
				for px in [-0.46, 0.0, 0.46]:
					draw_rect(Rect2(r * px - r * 0.08, r * 0.0, r * 0.16, r * 0.2), body.darkened(0.45))
				draw_circle(Vector2(0, r * 0.26), r * 0.11, lite)
			"weaver":
				_poly([Vector2(0, r * 0.9), Vector2(r * 0.12, r * 0.3), Vector2(r * 0.12, -r * 0.5), Vector2(0, -r * 0.66), Vector2(-r * 0.12, -r * 0.5), Vector2(-r * 0.12, r * 0.3)], body)
				_poly([Vector2(r * 0.1, -r * 0.4), Vector2(r * 0.9, -r * 0.72), Vector2(r * 0.96, -r * 0.5), Vector2(r * 0.66, r * 0.1), Vector2(r * 0.14, r * 0.14)], body.darkened(0.3))
				_poly([Vector2(-r * 0.1, -r * 0.4), Vector2(-r * 0.9, -r * 0.72), Vector2(-r * 0.96, -r * 0.5), Vector2(-r * 0.66, r * 0.1), Vector2(-r * 0.14, r * 0.14)], body.darkened(0.3))
				draw_circle(Vector2(-r * 0.06, r * 0.56), r * 0.08, lite)
				draw_circle(Vector2(r * 0.06, r * 0.56), r * 0.08, lite)
			"tanker":
				var pts := PackedVector2Array()
				for k2 in 16:
					var a2 := k2 / 16.0 * TAU
					pts.append(Vector2(cos(a2) * r * 0.58, sin(a2) * r * 0.84))
				draw_colored_polygon(pts, body)
				draw_rect(Rect2(-r * 0.55, -r * 0.3, r * 1.1, r * 0.08), lite.darkened(0.1))
				draw_rect(Rect2(-r * 0.57, r * 0.1, r * 1.14, r * 0.08), lite.darkened(0.1))
				draw_rect(Rect2(-r * 0.5, r * 0.5, r * 1.0, r * 0.08), lite.darkened(0.1))
				draw_rect(Rect2(-r * 0.2, -r * 0.1, r * 0.16, r * 0.28), body.darkened(0.45))
				draw_rect(Rect2(r * 0.04, -r * 0.1, r * 0.16, r * 0.28), body.darkened(0.45))
				draw_rect(Rect2(-r * 0.2, -r * 0.1, r * 0.08, r * 0.18), lite)
				draw_rect(Rect2(r * 0.04, -r * 0.1, r * 0.08, r * 0.18), lite)
				draw_circle(Vector2(0, r * 0.62), r * 0.1, lite)
			_:
				draw_circle(Vector2.ZERO, r * 0.9, body)
				draw_circle(Vector2.ZERO, r * 0.35, lite)
		# détails animés par-dessus (aura mini-boss, charge du lance, etc.)
		_draw_enemy_extra(e)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

func _hp_bar_local(r: float, e: Dictionary) -> void:
	var w := r * 1.6
	var f: float = clampf(float(e.hp) / float(e.max_hp), 0, 1)
	draw_rect(Rect2(-w / 2, -r - 10, w, 4), Color(0, 0, 0, 0.5))
	draw_rect(Rect2(-w / 2, -r - 10, w * f, 4), TH.danger)

func _ngon(c: Vector2, r: float, n: int, rot: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in n:
		var a := rot + i / float(n) * TAU
		pts.append(c + Vector2(cos(a), sin(a)) * r)
	return pts

func _poly(pts: Array, col: Color) -> void:
	var arr := PackedVector2Array()
	for p in pts:
		arr.append(p)
	draw_colored_polygon(arr, col)

func _draw_boss() -> void:
	var b := boss
	# les 24 atlas officiels du pack (module 46) : l'atlas du secteur d'abord,
	# le sprite procédural du module 17 en repli (secteur 1).
	if era_idx == 0:
		if BossAtlas.draw(self, b, level):
			return
		if String(b.name) == "GARDIEN DU SILO":
			var tg: Dictionary = first_player()
			var dgx: float = (float(tg.x) - b.x) if not tg.is_empty() else 0.0
			var dgy: float = (float(tg.y) - b.y) if not tg.is_empty() else 1.0
			var dd: float = maxf(sqrt(dgx * dgx + dgy * dgy), 1.0)
			if b.has("_pt_a") and b.atk_t > float(b["_pt_a"]) + 0.15:
				b["_fire_t"] = 0.22
			b["_pt_a"] = b.atk_t
			b["_fire_t"] = maxf(0.0, float(b.get("_fire_t", 0.0)) - 1.0 / 60.0)
			var want: float = clampf(1.0 - b.atk_t / 0.7, 0.0, 1.0) * 0.75 \
				+ 0.25 * (1.0 if b.ph > 0 else 0.4) \
				+ (0.25 if float(b.get("_fire_t", 0.0)) > 0.0 else 0.0)
			b["_open"] = clampf(float(b.get("_open", 0.0)) + (want - float(b.get("_open", 0.0))) * 0.12, 0.0, 1.0)
			var res: Dictionary = Guardian.render({
				"f": 3.4, "t": b.t, "phase": float(b.ph), "open": float(b["_open"]),
				"fire": clampf(float(b.get("_fire_t", 0.0)) / 0.22, 0.0, 1.0),
				"lx": dgx / dd, "ly": clampf(dgy / dd, -0.3, 1.0),
				"dmg": 1.0 - float(b.hp) / maxf(1.0, float(b.max_hp)), "flash": b.flash })
			draw_texture(res.tex, Vector2(b.x - float(res.ox), b.y + sin(b.t * 1.6) * 3.0 - float(res.oy)))
			return

	var pos := Vector2(b.x, b.y)
	var r: float = b.r
	var body: Color = TH.e_boss if era_idx > 0 else TH.livery[0]
	var lite: Color = TH.e_boss_lite if era_idx > 0 else TH.livery[2]
	if b.flash > 0.0:
		body = Color(1, 1, 1)
		lite = Color(1, 1, 1)
	# coque : gros polygone blindé
	draw_colored_polygon(_ngon(pos, r, 8, b.t * 0.15), body)
	draw_colored_polygon(_ngon(pos, r * 0.72, 8, -b.t * 0.22), body.darkened(0.3))
	# l'œil
	var open_t := 1.0 if b.parts.is_empty() else float(boss_parts_alive(b)) / float(b.parts.size())
	var eye_r := r * 0.30 * (0.4 + 0.6 * open_t)
	draw_circle(pos, eye_r + 4, Color(0, 0, 0, 0.6))
	draw_circle(pos, eye_r, lite)
	draw_circle(pos + Vector2(eye_r * 0.25, eye_r * 0.2), eye_r * 0.45, Color(0.02, 0.02, 0.06))
	# anneau blindé rotatif + feux de navigation
	var seg := 6
	for i in seg:
		var a0: float = b.t * 0.5 + i * TAU / seg
		draw_arc(pos, r + 16.0, a0, a0 + TAU / seg * 0.62, 12, lite.darkened(0.2), 5.0)
	for i in 8:
		var la: float = b.t * 0.8 + i * TAU / 8.0
		var lp := pos + Vector2(cos(la), sin(la)) * (r * 0.86)
		var on := fmod(b.t * 2.0 + i * 0.25, 1.0) < 0.5
		draw_circle(lp, 3.0, lite if on else body.darkened(0.4))
	# parties orbitales (HYDRA / VORAX)
	for p in b.parts:
		if p.dead: continue
		var pcol: Color = lite if p.flash > 0.0 else body
		draw_colored_polygon(_ngon(Vector2(p.x, p.y), p.r, 6, p.t * 0.8), pcol)
		var pf: float = clampf(float(p.hp) / float(p.max_hp), 0, 1)
		draw_rect(Rect2(p.x - 20, p.y - p.r - 8, 40, 4), Color(0, 0, 0, 0.5))
		draw_rect(Rect2(p.x - 20, p.y - p.r - 8, 40 * pf, 4), TH.danger)

func _draw_beams() -> void:
	for bm in beams:
		var rect := Rect2(bm.x - bm.w / 2.0, 0, bm.w, Data.FH)
		if bm.t < bm.warn:
			if fmod(bm.t, 0.2) < 0.1:
				draw_rect(rect, Color(TH.danger.r, TH.danger.g, TH.danger.b, 0.25))
				draw_rect(rect, TH.danger, false, 2.0)
		else:
			var a := clampf((bm.warn + bm.dur - bm.t) / 0.4, 0.0, 1.0)
			draw_rect(rect, Color(TH.e_boss.r, TH.e_boss.g, TH.e_boss.b, 0.45 * a))
			draw_rect(Rect2(bm.x - bm.w / 6.0, 0, bm.w / 3.0, Data.FH), Color(1, 1, 1, 0.85 * a))

func _draw_players() -> void:
	for P in players:
		if not P.alive or P.out: continue
		var pos := Vector2(P.x, P.y)
		var ship_id: String = Save.S.sel.ship
		var tex := Sheets.sheet_for(ship_id, era_idx)
		var blink: bool = P.inv > 0.0 and fmod(P.inv, 0.2) > 0.1 and P.inv > 0.3
		if era_idx == 0 and not blink:
			# module 34 : coque native r0 quantifiée, squash d'inclinaison,
			# flamme LCD qui vacille aux tuyères (boost ×1,55)
			var nt: Texture2D = Sheets.native_player(ship_id)
			if nt != null:
				var nh := 44.0
				var nw := nh * nt.get_width() / nt.get_height()
				var boost: bool = P.vy < -60.0
				var flick: float = [1.0, 1.18, 0.9, 1.1][int(time_accum * 12.0) % 4] * (1.55 if boost else 1.0)
				draw_set_transform(pos, 0.0, Vector2(1.0 - absf(P.bank) * 0.13, 1.0))
				for nz in Sheets.NOZZLES.get(ship_id, [0.5]):
					var fx2: float = (float(nz) - 0.5) * nw
					var flen := nh * 0.13 * flick
					draw_rect(Rect2(fx2 - 2.2, nh * 0.5 - 4, 4.4, flen), TH.livery[1])
					draw_rect(Rect2(fx2 - 1.0, nh * 0.5 - 4, 2.0, flen * 0.8), TH.livery[3])
				if P.hit_t > 0.0:
					draw_texture_rect(nt, Rect2(-nw / 2.0, -nh / 2.0, nw, nh), false, Color(1.35, 1.35, 1.35))
				else:
					draw_texture_rect(nt, Rect2(-nw / 2.0, -nh / 2.0, nw, nh), false)
				draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
				continue
		if tex != null and not blink:
			# >>> la planche officielle de l'ère, comme le jeu d'origine <<<
			var fs := Sheets.frame_size(era_idx)
			var bh := Sheets.box_h(era_idx)
			var bw := bh * fs.x / fs.y
			var pose := Sheets.pose(P, time_accum)
			if era_idx >= 2:
				draw_circle(pos + Vector2(3, 6), bh * 0.4, Color(0, 0, 0, 0.14))
			draw_texture_rect_region(tex, Rect2(pos.x - bw / 2.0, pos.y - bh / 2.0, bw, bh),
				Rect2(pose.x * fs.x, pose.y * fs.y, fs.x, fs.y))
		elif not blink:
			# repli vectoriel (si la planche manque)
			var hull_c := Color("#d8dfe8")
			var wing_c := Color("#9fb0c2")
			var acc_c := Color("#e23b3b")
			var canopy := Color("#38e0ff")
			var energy: Color = TH.p_glow
			if era_idx == 0:
				hull_c = TH.livery[3]; wing_c = TH.livery[2]; acc_c = TH.livery[2]; canopy = TH.livery[3]
			if P.hit_t > 0.0:
				hull_c = Color(1, 0.6, 0.6)
			draw_set_transform(pos, P.bank * 0.18, Vector2(1.0 - absf(P.bank) * 0.12, 1.0))
			_poly([Vector2(0, -8), Vector2(-22, 14), Vector2(-14, 18), Vector2(0, 8)], wing_c)
			_poly([Vector2(0, -8), Vector2(22, 14), Vector2(14, 18), Vector2(0, 8)], wing_c)
			_poly([Vector2(0, -26), Vector2(-8, 10), Vector2(0, 16), Vector2(8, 10)], hull_c)
			draw_rect(Rect2(-2, -10, 4, 20), acc_c)
			_poly([Vector2(0, -16), Vector2(-3.5, -4), Vector2(3.5, -4)], canopy)
			var fl := 8.0 + sin(time_accum * 40.0) * 3.0
			draw_rect(Rect2(-6, 16, 3.2, fl * 0.6), energy)
			draw_rect(Rect2(2.8, 16, 3.2, fl * 0.6), energy)
			draw_rect(Rect2(-1.4, 16, 2.8, fl), Color(1, 1, 1, 0.85))
			draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		# drones
		var nd: int = P.drones.size()
		for i in nd:
			var a: float = P.drone_a + i * TAU / maxf(1, nd)
			var dp := pos + Vector2(cos(a) * 34.0, sin(a) * 30.0)
			draw_circle(dp, 4.5, TH.p_glow)
			draw_circle(dp, 2.0, Color(1, 1, 1, 0.9))
		# bouclier
		if P.shield > 0 or P.shield_fx > 0.0:
			var sa := 0.25 + 0.1 * sin(time_accum * 6.0) + (0.5 if P.shield_fx > 0.0 else 0.0)
			draw_arc(pos, 20.0, 0, TAU, 24, Color(TH.shield.r, TH.shield.g, TH.shield.b, clampf(sa, 0, 1)), 2.0)

func _draw_bullets() -> void:
	var main_c: Color = TH.p_main
	var lite_c: Color = TH.p_lite
	var skin: String = Save.S.sel.get("bullet_skin", "stock")
	for bs in Data.BULLET_SKINS:
		if bs.id == skin and bs.main != "":
			main_c = Color(bs.main)
			lite_c = Color(bs.lite)
	for b in bullets:
		var pos := Vector2(b.x, b.y)
		match b.type:
			"laser":
				draw_line(pos + Vector2(0, 14), pos + Vector2(0, -14), lite_c, 3.0)
			"plasma":
				draw_circle(pos, b.r, Color(main_c.r, main_c.g, main_c.b, 0.55))
				draw_circle(pos, b.r * 0.55, lite_c)
			"rail":
				draw_line(pos + Vector2(0, 22), pos + Vector2(0, -22), Color(1, 1, 1, 0.95), 4.0)
				draw_line(pos + Vector2(0, 22), pos + Vector2(0, -22), main_c, 1.5)
			"homing", "drone":
				var ang := atan2(b.vy, b.vx) + PI / 2.0
				draw_set_transform(pos, ang, Vector2.ONE)
				draw_rect(Rect2(-2.5, -6, 5, 12), main_c)
				draw_rect(Rect2(-1.2, -8, 2.4, 5), Color(1, 1, 1))
				draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
			_:
				var h := 14.0 if b.big else 10.0
				var w := 5.0 if b.big else 3.6
				draw_rect(Rect2(pos.x - w / 2, pos.y - h / 2, w, h), main_c)
				draw_rect(Rect2(pos.x - w / 4, pos.y - h / 2, w / 2, h * 0.7), lite_c)

func _draw_parts() -> void:
	for p in parts:
		var a: float = clampf(p.life / p.max_life, 0.0, 1.0)
		var c: Color = p.col
		c.a = a
		var sz: float = p.size * (0.5 + 0.5 * a)
		if p.glow and era_idx >= 2:
			c = Color(minf(1.0, c.r * 1.4 + 0.1), minf(1.0, c.g * 1.4 + 0.1), minf(1.0, c.b * 1.4 + 0.1), a)
		draw_rect(Rect2(p.x - sz / 2, p.y - sz / 2, sz, sz), c)

func _draw_shocks() -> void:
	for s in shocks:
		var t: float = s.t / s.life
		var r: float = s.max * (0.3 + t * 1.1)
		var c: Color = s.col
		c.a = (1.0 - t) * 0.7
		draw_arc(Vector2(s.x, s.y), r, 0, TAU, 28, c, 2.0 + 2.0 * (1.0 - t))

func _draw_pops() -> void:
	for p in pops:
		var a: float = clampf(1.0 - p.t / p.life, 0, 1)
		var c: Color = p.col
		c.a = a
		_txt(Vector2(p.x - 40, p.y), p.text, int(p.size) + 4, c, HORIZONTAL_ALIGNMENT_CENTER)

# ------------------------------------------------------------- bannières
func _draw_banners() -> void:
	var ink: Color = TH.p_lite if era_idx > 0 else TH.livery[0]
	match phase:
		Phase.INTRO:
			if era_idx == 0:
				# séquence de démarrage de la console : le logo descend, puis le baseline
				var yy4: float = Data.FH * 0.44 * minf(phase_t / 1.2, 1.0)
				_txt(Vector2(Data.FW / 2, yy4), "NEO VANGUARD", 16, TH.livery[0], HORIZONTAL_ALIGNMENT_CENTER)
				if phase_t > 1.2:
					_txt(Vector2(Data.FW / 2, yy4 + 22), "24 SECTEURS · 6 GÉNÉRATIONS", 10, TH.livery[1], HORIZONTAL_ALIGNMENT_CENTER)
				_txt(Vector2(Data.FW / 2, Data.FH - 60), "SECTEUR %d — PRÊT À DÉCOLLER" % level, 11, TH.livery[1], HORIZONTAL_ALIGNMENT_CENTER)
			else:
				var a := clampf(minf(phase_t / 0.4, (Data.INTRO_DUR - phase_t) / 0.5), 0, 1)
				var c := Color(ink.r, ink.g, ink.b, a)
				_txt(Vector2(Data.FW / 2, Data.FH * 0.35), "SECTEUR %d" % level, 40, c, HORIZONTAL_ALIGNMENT_CENTER)
				_txt(Vector2(Data.FW / 2, Data.FH * 0.35 + 34), Data.ERAS[era_idx].name, 18, Color(TH.acc.r, TH.acc.g, TH.acc.b, a), HORIZONTAL_ALIGNMENT_CENTER)
				_txt(Vector2(Data.FW / 2, Data.FH * 0.35 + 56), Data.ERAS[era_idx].tag, 11, Color(ink.r, ink.g, ink.b, a * 0.7), HORIZONTAL_ALIGNMENT_CENTER)
		Phase.BOSS_WARN:
			if level == Data.MAX_LEVEL and not sas.is_empty():
				_draw_sas()
			elif fmod(boss_warn_t, 0.5) < 0.3:
				draw_rect(Rect2(0, Data.FH * 0.3, Data.FW, 90), Color(0.6, 0.02, 0.12, 0.55))
			var idx := Data.boss_music_idx(level)
			var bname: String = Data.BOSS24[idx].name
			_txt(Vector2(Data.FW / 2, Data.FH * 0.3 + 36), "!! ALERTE VAISSEAU AMIRAL !!", 20, Color(1, 0.9, 0.9), HORIZONTAL_ALIGNMENT_CENTER)
			_txt(Vector2(Data.FW / 2, Data.FH * 0.3 + 64), bname, 26, TH.e_boss if era_idx > 0 else TH.livery[3], HORIZONTAL_ALIGNMENT_CENTER)
		Phase.HARVEST:
			var a := 1.0
			draw_rect(Rect2(0, 0, Data.FW, Data.FH), Color(TH.gold.r, TH.gold.g, TH.gold.b, 0.06 * a), false, 20.0)
			_txt(Vector2(Data.FW / 2, Data.FH * 0.2), "RÉCOLTE", 26, TH.gold, HORIZONTAL_ALIGNMENT_CENTER)
			_txt(Vector2(Data.FW / 2, Data.FH * 0.2 + 24), "%d" % int(ceil(harvest.dur - harvest.t)), 16, Color(TH.gold.r, TH.gold.g, TH.gold.b, 0.7), HORIZONTAL_ALIGNMENT_CENTER)
		Phase.CLEAR:
			_txt(Vector2(Data.FW / 2, Data.FH * 0.4), "SECTEUR NEUTRALISÉ", 26, ink, HORIZONTAL_ALIGNMENT_CENTER)
			_txt(Vector2(Data.FW / 2, Data.FH * 0.4 + 30), "BONUS +$%d" % last_bonus, 16, TH.gold, HORIZONTAL_ALIGNMENT_CENTER)

# =========================================================================
#  DÉCOR PEINT PAR ÈRE — le fond change de génération comme l'original :
#  collines Pocket, grille wireframe, ville néon, grille d'arcade,
#  monolithes CD, nébuleuse HD. Construit une fois par secteur (déterministe).
# =========================================================================
func _build_decor() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = level * 7919 + era_idx * 131
	var d := { "hills": [], "build_far": [], "build_near": [], "monos": [], "neb": [], "wires": [] }
	match era_idx:
		0:
			# mobilier du silo puis du dehors, gabarits du moteur d'origine
			var menu: Array = [["galerie", 3], ["sas", 2], ["cuve", 2], ["megatour", 1], ["rouage", 1], ["panneau", 1], ["char", 1]] if level == 1 \
				else [["megatour", 3], ["anneau", 2], ["plateforme", 2], ["paroi", 1], ["rouage", 1], ["panneau", 1]]
			var ycur := 240.0
			for i in 6:
				var tot := 0
				for m in menu: tot += m[1]
				var rr := rng.randi_range(0, tot - 1)
				var kind: String = menu[0][0]
				for m in menu:
					rr -= m[1]
					if rr < 0:
						kind = m[0]
						break
				var cw: float = 100.0
				var ch2: float = 200.0
				match kind:
					"galerie": cw = rng.randf_range(70, 120); ch2 = rng.randf_range(140, 260)
					"sas": cw = rng.randf_range(150, 230); ch2 = rng.randf_range(90, 150)
					"cuve": cw = rng.randf_range(70, 110); ch2 = rng.randf_range(120, 200)
					"megatour": cw = rng.randf_range(86, 140); ch2 = rng.randf_range(250, 430)
					"anneau": cw = 200.0; ch2 = 200.0
					"plateforme": cw = rng.randf_range(140, 240); ch2 = rng.randf_range(100, 170)
					"paroi": cw = rng.randf_range(44, 74); ch2 = rng.randf_range(160, 280)
					"rouage": cw = rng.randf_range(120, 200); ch2 = cw
					"panneau": cw = rng.randf_range(110, 160); ch2 = rng.randf_range(48, 66)
					"char": cw = rng.randf_range(90, 130); ch2 = rng.randf_range(56, 76)
				d.hills.append({ "kind": kind, "x": rng.randf_range(30, Data.FW - cw - 30),
					"w": cw, "h": ch2, "y0": ycur, "seed": rng.randi_range(0, 96), "c": rng.randi_range(0, 2) })
				ycur += rng.randf_range(340, 560)
		1:
			for i in 5:
				d.wires.append({ "x": rng.randf_range(50, Data.FW - 50), "y": rng.randf_range(40, Data.FH - 120), "s": rng.randf_range(16, 44) })
		2:
			for i in 9:
				d.build_far.append({ "x": rng.randf_range(0, Data.FW), "w": rng.randf_range(26, 56), "h": rng.randf_range(60, 170), "y0": rng.randf_range(0, 700), "win": rng.randi_range(2, 4) })
			for i in 6:
				d.build_near.append({ "x": rng.randf_range(0, Data.FW), "w": rng.randf_range(44, 86), "h": rng.randf_range(110, 260), "y0": rng.randf_range(0, 900), "win": rng.randi_range(3, 6) })
		4:
			for i in 6:
				d.monos.append({ "x": rng.randf_range(24, Data.FW - 24), "w": rng.randf_range(24, 54), "h": rng.randf_range(140, 300), "y0": rng.randf_range(0, 800) })
		5:
			d["planet"] = true
			for i in 6:
				d.neb.append({ "x": rng.randf_range(0, Data.FW), "y": rng.randf_range(0, Data.FH), "r": rng.randf_range(110, 250), "c": rng.randi_range(0, 2), "spd": rng.randf_range(0.05, 0.14) })
	decor = d

func _draw_backdrop() -> void:
	if decor.is_empty():
		return
	var sy := scroll_y
	match era_idx:
		0:
			# sol en briques du Pocket : 128×64, mortier 1 px, joints alternés
			var mortar: Color = Color(TH.livery[1].r, TH.livery[1].g, TH.livery[1].b, 0.62)
			var tile := 64.0
			var scroll: float = sy * 0.45
			var start: int = int(floor(-scroll / tile)) - 1
			var offset: float = start * tile + scroll
			var row := start
			while offset + (row - start) * tile < Data.FH + tile:
				var yline: float = offset + (row - start) * tile
				if yline > -tile and yline < Data.FH:
					draw_line(Vector2(0, yline), Vector2(Data.FW, yline), mortar, 1.0)
					var xoff: float = float((row & 1) * 64)
					var xv := xoff
					while xv < Data.FW:
						if xv > -1.0:
							draw_line(Vector2(xv, yline), Vector2(xv, minf(yline + tile, Data.FH)), mortar, 1.0)
						xv += 128.0
				row += 1
			# le mobilier : ombre portée sombre (+9,+15) puis le gabarit
			for h2 in decor.hills:
				var ty: float = fposmod(h2.y0 + sy * 0.70, Data.FH + h2.h + 900.0) - h2.h - 450.0
				draw_rect(Rect2(h2.x + 9, ty + 15, h2.w, h2.h), Color(TH.livery[0].r, TH.livery[0].g, TH.livery[0].b, 0.7))
				_draw_chunk(h2, ty)
		1:
			# grille wireframe 8 bits+ : fuyantes + horizontales défilantes
			var vp := Vector2(Data.FW / 2.0, -70.0)
			var lc := Color(TH.bg3.r, TH.bg3.g, TH.bg3.b, 0.4)
			for i in 9:
				var t2 := i / 8.0
				draw_line(vp, Vector2(-90.0 + t2 * (Data.FW + 180.0), Data.FH + 40.0), lc, 1.0)
			var gap := 92.0
			var yy2 := Data.FH - fposmod(sy * 0.55, gap)
			while yy2 > -24.0:
				var a := 0.42 * clampf(1.25 - yy2 / Data.FH, 0.25, 1.0)
				draw_line(Vector2(0, yy2), Vector2(Data.FW, yy2), Color(TH.bg3.r, TH.bg3.g, TH.bg3.b, a), 1.0)
				yy2 -= gap
			for w2 in decor.wires:
				var wy: float = fposmod(w2.y + sy * 0.4, Data.FH + 140.0) - 70.0
				_poly([Vector2(w2.x, wy), Vector2(w2.x - w2.s, wy + w2.s * 0.8), Vector2(w2.x, wy + w2.s * 1.6), Vector2(w2.x + w2.s, wy + w2.s * 0.8)],
					Color(TH.bg3.r, TH.bg3.g, TH.bg3.b, 0.22))
		2:
			# ville néon 16 bits : deux plans d'immeubles fenêtrés
			for b3 in decor.build_far:
				var y3: float = fposmod(b3.y0 + sy * 0.28, Data.FH + 1080.0) - 520.0
				draw_rect(Rect2(b3.x, y3, b3.w, b3.h), TH.bg2)
				for i in b3.win:
					draw_rect(Rect2(b3.x + 6 + (i % 3) * (b3.w / 3.2), y3 + 10 + i * 22.0, 4, 6),
						Color(TH.star.r, TH.star.g, TH.star.b, 0.4))
			for b4 in decor.build_near:
				var y4: float = fposmod(b4.y0 + sy * 0.55, Data.FH + 960.0) - 460.0
				draw_rect(Rect2(b4.x, y4, b4.w, b4.h), TH.bg3.darkened(0.25))
				draw_rect(Rect2(b4.x, y4, b4.w, b4.h), TH.acc, false, 1.0)
				for i in b4.win:
					draw_rect(Rect2(b4.x + 8 + (i % 3) * (b4.w / 3.1), y4 + 14 + i * 30.0, 5, 8),
						Color(TH.star.r, TH.star.g, TH.star.b, 0.65))
		3:
			# salle d'arcade : grille néon perspective + balayage
			var vp := Vector2(Data.FW / 2.0, -60.0)
			var gc := Color(TH.acc.r, TH.acc.g, TH.acc.b, 0.30)
			for i in 11:
				var t2 := i / 10.0
				draw_line(vp, Vector2(-120.0 + t2 * (Data.FW + 240.0), Data.FH + 40.0), gc, 1.5)
			var gap := 84.0
			var yy2 := Data.FH - fposmod(sy * 1.1, gap)
			while yy2 > -24.0:
				var a := 0.5 * clampf(1.3 - yy2 / Data.FH, 0.2, 1.0)
				draw_line(Vector2(0, yy2), Vector2(Data.FW, yy2), Color(TH.p_glow.r, TH.p_glow.g, TH.p_glow.b, a * 0.6), 2.0)
				yy2 -= gap
			var byy := fposmod(sy * 1.75, Data.FH + 420.0) - 200.0
			draw_rect(Rect2(0, byy, Data.FW, 90), Color(TH.acc.r, TH.acc.g, TH.acc.b, 0.05))
		4:
			# génération CD : monolithes de données + bandes tramées
			for m in decor.monos:
				var ym: float = fposmod(m.y0 + sy * 0.5, Data.FH + m.h + 360.0) - m.h - 180.0
				draw_rect(Rect2(m.x, ym, m.w, m.h), TH.bg3)
				draw_rect(Rect2(m.x, ym, m.w, m.h), Color(TH.acc.r, TH.acc.g, TH.acc.b, 0.5), false, 1.2)
				for i in int(m.h / 26.0):
					draw_rect(Rect2(m.x + 4, ym + 8 + i * 26.0, m.w - 8, 2), Color(TH.acc.r, TH.acc.g, TH.acc.b, 0.25))
			for i in 5:
				var yb := fposmod(i * 170.0 + sy * 0.8, Data.FH + 170.0) - 85.0
				draw_rect(Rect2(0, yb, Data.FW, 3), Color(1, 1, 1, 0.035))
		5:
			# HD : planète géante + nébuleuses douces
			if decor.get("planet", false):
				var pcy := fposmod(sy * 0.06, Data.FH + 700.0) - 250.0
				var pc := Vector2(Data.FW * 0.74, pcy)
				draw_circle(pc, 232.0, Color(0.047, 0.11, 0.235, 0.85))
				draw_circle(pc, 210.0, Color("#274f9e"))
				draw_circle(pc + Vector2(-40, -50), 150.0, Color("#3868bd"))
				for band in 4:
					var by2 := pcy - 140.0 + band * 76.0
					draw_line(Vector2(pc.x - 205.0, by2), Vector2(pc.x + 205.0, by2 + 12.0),
						Color("#1c3f80", 0.7), 10.0)
				draw_set_transform(pc, -0.35, Vector2(1.0, 0.32))
				draw_arc(Vector2.ZERO, 292.0, 0, TAU, 48, Color("#7fb0e8", 0.7), 16.0)
				draw_arc(Vector2.ZERO, 318.0, 0, TAU, 48, Color("#5a8fd0", 0.4), 7.0)
				draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
			var ncols: Array = [TH.acc, TH.p_glow, Color("#8a6bff")]
			for n in decor.neb:
				var yn: float = fposmod(n.y + sy * n.spd, Data.FH + n.r * 2.0) - n.r
				var c: Color = ncols[n.c]
				draw_circle(Vector2(n.x, yn), n.r, Color(c.r, c.g, c.b, 0.05))
				draw_circle(Vector2(n.x, yn), n.r * 0.6, Color(c.r, c.g, c.b, 0.05))



# ---------------------------------------------------------------------------
# Les gabarits de mobilier du silo (CHUNKS du moteur) : bevel, rivets,
# briquettes 14 px, hublots 5×4, cuve à niveau flottant, anneau à rayons.
func _bevel_rect(r: Rect2, face: Color, lite: Color, dark: Color) -> void:
	draw_rect(r, face)
	draw_rect(Rect2(r.position.x, r.position.y, r.size.x, 2), lite)
	draw_rect(Rect2(r.position.x + r.size.x - 2, r.position.y + 2, 2, r.size.y - 2), lite)
	draw_rect(Rect2(r.position.x, r.position.y + 2, 2, r.size.y - 2), dark)
	draw_rect(Rect2(r.position.x + 2, r.position.y + r.size.y - 2, r.size.x - 2, 2), dark)

func _draw_chunk(h2: Dictionary, ty: float) -> void:
	var ink: Array = TH.livery
	var lite: Color = ink[3]
	var face: Color = ink[2]
	var dark: Color = ink[1]
	var deep: Color = ink[0]
	var x: float = h2.x
	var y: float = ty
	var w: float = h2.w
	var h: float = h2.h
	var sd: int = int(h2.seed)
	match h2.kind:
		"galerie":
			# galerie du silo : mur encre profonde, briquettes 12×12 plus claires
			draw_rect(Rect2(x, y, w, h), deep)
			var j := 0.0
			while j < h:
				var o: float = fmod(j / 14.0 + float(sd), 2.0) * 7.0
				var i2 := -7.0
				while i2 < w:
					if int((i2 + j + sd) / 14.0) % 3 != 0:
						draw_rect(Rect2(x + i2 + o + 1, y + j + 1, 12, 12), face)
					i2 += 14.0
				j += 14.0
			draw_rect(Rect2(x, y, 2, h), dark)
			draw_rect(Rect2(x + w - 2, y, 2, h), deep)
			var dj := 20.0
			while dj < h - 10:
				draw_rect(Rect2(x + 4, y + dj, 5, 5), Color(0.96, 0.97, 0.92))
				dj += 56.0
		"sas":
			_bevel_rect(Rect2(x, y, w, h), face, lite, dark)
			draw_rect(Rect2(x + w / 2.0 - 3, y + 6, 6, h - 12), lite)
			for k in 2:
				var hx: float = x + 6 + k * (w / 2.0)
				var n := 0
				while n * 14.0 < w / 2.0 - 18.0:
					draw_rect(Rect2(hx + n * 14.0, y + h / 2.0 - 5, 8, 10), dark)
					n += 1
			var rvx := 9.0
			while rvx < w - 9.0:
				draw_rect(Rect2(x + rvx, y + 6, 2, 2), dark)
				draw_rect(Rect2(x + rvx, y + h - 8, 2, 2), dark)
				rvx += 18.0
		"cuve":
			_bevel_rect(Rect2(x, y, w, h), face, lite, dark)
			var bj := 10.0
			while bj < h - 10:
				draw_rect(Rect2(x + 4, y + bj, w - 8, 3), lite)
				bj += 22.0
			draw_rect(Rect2(x + w * 0.3, y + 6, w * 0.4, h - 12), lite)
			draw_rect(Rect2(x + w * 0.36, y + h * 0.4, w * 0.28, h * 0.5), dark)
			var lv: float = h * (0.4 + 0.1 * sin(time_accum * 0.8 + sd))
			draw_rect(Rect2(x + w * 0.36, y + lv, w * 0.28, 3), Color(0.96, 0.97, 0.92))
		"megatour":
			_bevel_rect(Rect2(x, y, w, h), dark, lite, deep)
			var j2 := 18.0
			while j2 < h - 20:
				var n2 := 0
				while (n2 + 1) * 9.0 < w - 12.0:
					if (n2 * 5 + int(j2) + sd) % 6 < 3:
						draw_rect(Rect2(x + 6 + n2 * 9.0, y + j2, 5, 4), face)
					n2 += 1
				j2 += 26.0
			draw_rect(Rect2(x + w * 0.42, y - 16, w * 0.16, 16), dark)
			draw_rect(Rect2(x + w / 2.0 - 1, y - 38, 2, 22), lite)
			draw_circle(Vector2(x + w / 2.0, y - 40), 3.0, Color(0.96, 0.97, 0.92, 0.6 + 0.4 * sin(time_accum * 3.0)))
		"anneau":
			var cx: Vector2 = Vector2(x + w / 2.0, y + h / 2.0)
			var r: float = w * 0.42
			draw_arc(cx, r, 0, TAU, 40, dark, maxf(2.0, r * 0.22))
			draw_arc(cx, r * 0.55, 0, TAU, 32, face, maxf(2.0, r * 0.12))
			draw_circle(cx, r * 0.22, dark)
			draw_circle(cx, r * 0.14, deep)
			for k in 5:
				var a2: float = time_accum * 0.2 + k * TAU / 5.0
				draw_line(cx + Vector2(cos(a2), sin(a2)) * r * 0.5, cx + Vector2(cos(a2), sin(a2)) * r, dark, 3.0)
			for k in 6:
				var a3: float = time_accum * 0.25 + k * TAU / 6.0
				draw_circle(cx + Vector2(cos(a3), sin(a3)) * r, 2.0, lite)
		"plateforme":
			_bevel_rect(Rect2(x, y, w, h), face, lite, dark)
			var rvx2 := 8.0
			while rvx2 < w - 8.0:
				draw_rect(Rect2(x + rvx2, y + 6, 2, 2), dark)
				draw_rect(Rect2(x + rvx2, y + h - 8, 2, 2), dark)
				rvx2 += 16.0
			var li := 1
			while li < 3:
				draw_rect(Rect2(x, y + h * li / 3.0, w, 1.4), deep)
				li += 1
			var led := 0
			while led * 9.0 < w - 16.0:
				var on: bool = (led * 7 + sd) % 5 < 3
				draw_rect(Rect2(x + 8 + led * 9.0, y + h * 0.32, 5, 4), lite if on else deep)
				led += 1
			var off: float = fmod(time_accum * 34.0 + sd * 7.0, 14.0)
			var k2 := -1
			while k2 * 14.0 < w / 14.0 + 1.0:
				var bx: float = x + k2 * 14.0 + off
				if bx > x + 2 and bx < x + w - 11:
					draw_rect(Rect2(bx, y + h - 8, 7, 4), dark)
					draw_rect(Rect2(bx, y + h - 8, 7, 1), lite)
				k2 += 1
		"rouage":
			# le grand rouage denté du silo, qui tourne lentement
			var cx2: Vector2 = Vector2(x + w / 2.0, y + h / 2.0)
			var rr2: float = minf(w, h) * 0.5
			var rot: float = time_accum * 0.35
			for k in 10:
				var aa: float = rot + k * TAU / 10.0
				draw_line(cx2 + Vector2(cos(aa), sin(aa)) * rr2 * 0.55, cx2 + Vector2(cos(aa), sin(aa)) * rr2, dark, 5.0)
			draw_arc(cx2, rr2 * 0.92, 0, TAU, 36, dark, 4.0)
			draw_circle(cx2, rr2 * 0.55, dark)
			draw_circle(cx2, rr2 * 0.32, face)
			draw_circle(cx2, rr2 * 0.12, deep)
		"panneau":
			# la plaque stencil posée sur le mur
			_bevel_rect(Rect2(x, y, w, h), face, lite, dark)
			draw_rect(Rect2(x + 4, y + 4, w - 8, h - 8), deep)
			var mots: Array = ["FROLE LES", "KODAMA", "SECTEUR 1", "VANGUARD"]
			draw_string(PixelUi.font(), Vector2(x + 8, y + h / 2.0 + 4), mots[sd % mots.size()],
				HORIZONTAL_ALIGNMENT_LEFT, w - 16, 8, lite)
		"char":
			# le blindé de service, garé au bas du silo
			draw_rect(Rect2(x + 4, y + h * 0.62, w - 8, h * 0.22), deep)
			var tk := 0.0
			while tk < w - 14:
				draw_rect(Rect2(x + 6 + tk, y + h * 0.62, 4, h * 0.22), dark if int(tk / 6.0) % 2 == 0 else deep)
				tk += 6.0
			_bevel_rect(Rect2(x + w * 0.12, y + h * 0.3, w * 0.76, h * 0.34), face, lite, dark)
			draw_rect(Rect2(x + w * 0.42, y + h * 0.12, w * 0.16, h * 0.2), dark)
			draw_circle(Vector2(x + w * 0.5, y + h * 0.14), 4.0, face)
		"paroi":
			_bevel_rect(Rect2(x, y, w, h), face, lite, dark)
			var pj := 0.0
			while pj < h:
				draw_rect(Rect2(x, y + pj, w, 2), lite)
				var rx := 7.0
				while rx < w - 7.0:
					draw_rect(Rect2(x + rx, y + pj + 4, 2, 2), dark)
					rx += 14.0
				pj += 36.0
			var hn := 0
			while hn * 12.0 < h * 0.25:
				draw_rect(Rect2(x + 2 + (hn % 2) * 6.0, y + 4 + hn * 12.0, 6, 8), dark)
				hn += 1

func warm_col() -> Color:
	return Color("#ff9a3d") if era_idx >= 3 else TH.p_glow