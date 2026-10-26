extends RefCounted
## Sector one simulation, in source units (480 x 860), independent of presentation.
signal cue(name: String)
signal completed
signal game_over
const Catalog = preload("res://native/core/catalog.gd")
const WAVE_TIMES := [2.2, 6.2, 10.7, 15.2, 19.7, 24.7, 33.7, 37.7, 41.7, 45.7, 49.7, 54.2]
const FIELD := Rect2(32, 76, 416, 742)
const SPEED := 464.0
const SCROLL_SPEED := 95.0
var reference: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://native/sector1/sector.json"))
var rng := RandomNumberGenerator.new()
var player: Dictionary
var enemies: Array[Dictionary] = []
var bullets: Array[Dictionary] = []
var hostile: Array[Dictionary] = []
var pickups: Array[Dictionary] = []
var props: Array[Dictionary] = []
var particles: Array[Dictionary] = []
var decor: Array[Dictionary] = []
var boss: Dictionary = {}
var phase := "waves"
var time := 0.0
var scroll := 0.0
var phase_time := 0.0
var wave := 0
var next_id := 0
var score := 0
var coins := 0
var kills := 0
var combo := 0
var combo_time := 0.0
var no_death := true
var prop_timer := 6.0
var decor_timer := 0.0
var bomb_time := 0.0
var bomb_center := Vector2.ZERO
var difficulty := 1
var diff: Dictionary
var finished := false

func _init(seed_value: int = 20261026, difficulty_value: int = 1) -> void:
	rng.seed = seed_value
	difficulty = clampi(difficulty_value, 0, 2)
	diff = Catalog.new().data.diffs[difficulty]
	player = {"pos":Vector2(240,710), "vel":Vector2.ZERO, "hp":3, "max_hp":3, "lives":int(diff.lives)-1,
		"bombs":2, "power":1, "shield":0, "inv":2.6, "fire_cd":0.0, "bank":0.0, "anim":0.0,
		"hit":0.0, "alive":true, "dead_time":0.0, "bomb_cd":0.0}
	for i in 10:
		_spawn_decor(rng.randf_range(-300,860))

func _spawn_decor(y: float) -> void:
	if decor.size() >= 11:
		return
	var total := 0.0
	for d: Dictionary in reference.decor:
		total += float(d.weight)
	var choice := rng.randf() * total
	var selected: Dictionary = reference.decor[0]
	for d: Dictionary in reference.decor:
		choice -= float(d.weight)
		if choice <= 0:
			selected = d
			break
	decor.append({"sprite":selected.sprite, "pos":Vector2(rng.randf_range(-40,520),y)})

func spawn(kind: String, pos: Vector2, opt: Dictionary = {}) -> Dictionary:
	next_id += 1
	var t: Dictionary = reference.enemy_types[kind]
	var hp := maxf(1, floor(float(t.hp) * float(diff.hp) * float(opt.get("hp_mul",1)) + 0.5))
	var e := {"id":next_id, "kind":kind, "pos":pos, "x0":pos.x, "t":0.0, "hp":hp, "max_hp":hp,
		"r":float(t.r), "dir":opt.get("dir", -1 if rng.randf()<0.5 else 1), "ty":opt.get("ty",rng.randf_range(90,200)),
		"amp":opt.get("amp",rng.randf_range(30,70)), "phase":rng.randf()*TAU, "fire_t":rng.randf_range(0.4,1.6),
		"aim_t":0.98, "ang":0.0, "flash":0.0}
	enemies.append(e)
	return e

func formation(kind: String, count: int, form: int = -1, dy: float = 0.0) -> void:
	if form < 0:
		form = rng.randi_range(0,4) # V, stream, line, sides, arc: source formFor.
	var x := rng.randf_range(80,400) if form == 1 else 240.0
	for i in count:
		var p := Vector2.ZERO
		var opt := {}
		match form:
			0: p = Vector2(240+(1 if i%2 else -1)*ceil(float(i)/2)*44, -30-ceil(float(i)/2)*34-dy)
			1:
				p = Vector2(x+sin(float(i))*22,-30-i*64-dy)
				opt.amp = 60.0
			2: p = Vector2(480.0/(count+1)*(i+1),-30-dy)
			3:
				p = Vector2(500 if i%2 else -20,40+i*26-dy)
				opt.dir = -1 if i%2 else 1
			4:
				var a := -PI/2+(i-(count-1)/2.0)*0.42
				p = Vector2(240+cos(a)*190,-30+sin(a)*190-dy)
		spawn(kind,p,opt)

func _wave(index: int) -> void:
	var kind := "drone" if rng.randf()<0.5 else "stinger"
	match index:
		0: formation("drone",4,0)
		1: formation(kind,3,1)
		5: spawn("mGuardian",Vector2(240,-110),{"ty":190.0})
		11:
			formation(kind,2,2)
			formation("stinger",2,2,90)
		_: formation(kind,5 if index in [7,10] else 4)

func step(dt: float, axis: Vector2 = Vector2.ZERO, firing: bool = false, precision: bool = false) -> void:
	if finished:
		return
	time += dt
	phase_time += dt
	scroll += SCROLL_SPEED * dt
	bomb_time = maxf(0,bomb_time-dt)
	combo_time -= dt
	if combo_time<=0: combo=0
	_update_player(dt, axis, firing, precision)
	if finished: return
	decor_timer -= dt*40
	if decor_timer<=0:
		decor_timer = rng.randf_range(1.6,3.4)
		_spawn_decor(-300)
	for d in decor: d.pos.y += SCROLL_SPEED*0.7*dt
	decor = decor.filter(func(d): return d.pos.y<=1200)
	prop_timer -= dt
	if prop_timer<=0:
		prop_timer = rng.randf_range(6.5,11)-0.4
		for i in rng.randi_range(1,2):
			var kind := "pod" if rng.randf()<0.3 else "barrel" if rng.randf()<0.45 else "crate"
			props.append({"kind":kind,"pos":Vector2(rng.randf_range(80,400),-50-i*100),"vel":Vector2(rng.randf_range(-24,24),rng.randf_range(52,86)),"hp":5 if kind=="pod" else 2 if kind=="barrel" else 3,"r":28.0,"t":0.0})
	if phase == "waves":
		while wave<WAVE_TIMES.size() and time>=WAVE_TIMES[wave]:
			_wave(wave)
			wave += 1
		if wave==WAVE_TIMES.size() and enemies.is_empty() and time>WAVE_TIMES[-1]+3:
			phase="warning";phase_time=0;cue.emit("alert")
	elif phase=="warning" and phase_time>3.6:
		start_boss()
	elif phase=="harvest" and phase_time>8:
		coins += int(round(190*float(diff.credit)))+(40 if no_death else 0)
		phase="clear";finished=true;completed.emit();return
	_update_enemies(dt)
	_update_boss(dt)
	_update_bullets(dt)
	_update_props(dt)
	_update_pickups(dt)
	for p in particles:
		p.pos += p.vel*dt;p.life -= dt
	particles=particles.filter(func(p):return p.life>0)

func _update_player(dt: float, axis: Vector2, firing: bool, precision: bool) -> void:
	player.inv=maxf(0,player.inv-dt);player.hit=maxf(0,player.hit-dt)
	if not player.alive:
		player.dead_time += dt
		if player.dead_time>1.6 and player.lives>=0:
			player.alive=true;player.hp=3;player.pos=Vector2(240,740);player.vel=Vector2.ZERO
			player.inv=3.2;player.power=maxi(1,player.power-1);hostile.clear()
		return
	player.anim += dt
	player.vel = player.vel.lerp(axis.limit_length(1)*SPEED*(0.55 if precision else 1.0),minf(1,dt*12))
	player.pos=(player.pos+player.vel*dt).clamp(FIELD.position,FIELD.end)
	player.bank=lerpf(player.bank,clampf(player.vel.x/SPEED,-1,1),minf(1,dt*8))
	player.fire_cd -= dt
	if firing and player.fire_cd<=0:
		player.fire_cd=0.115
		var n := 3 if player.power>=4 else 2 if player.power>=2 else 1
		for i in n:
			var off := (i-(n-1)/2.0)*11
			bullets.append({"pos":player.pos+Vector2(off+(signf(off)*2 if n>1 else 0),-20),"vel":Vector2(0,-720),"r":9.0,"damage":1.0})
		if player.power>=5: bullets.append({"pos":player.pos+Vector2(0,-24),"vel":Vector2(0,-780),"r":9.0,"damage":1.2})
		cue.emit("shoot")

func _on_field(e: Dictionary) -> bool:
	var m := minf(60,float(e.get("r",12))*0.35)
	return e.pos.y-m>=0 and e.pos.y+m<=860 and e.pos.x+m>=0 and e.pos.x-m<=480

func _update_enemies(dt: float) -> void:
	for e in enemies.duplicate():
		var t: Dictionary=reference.enemy_types[e.kind]
		e.t+=dt;e.flash=maxf(0,e.flash-dt)
		var sp := SCROLL_SPEED*float(t.mvx)*(float(diff.bs)*0.5+0.5)
		match t.mv:
			"dive": e.pos.y+=sp*dt*1.15;e.pos.x=e.x0+sin(e.t*1.3+e.phase)*12
			"zig": e.pos.y+=sp*0.85*dt;e.pos.x=e.x0+sin(e.t*2.2+e.phase)*e.amp
			"patrol":
				if e.pos.y<e.ty: e.pos.y+=sp*1.1*dt
				else:
					e.pos.x+=e.dir*sp*0.55*dt
					if e.pos.x<40 or e.pos.x>440:e.dir *= -1
		e.pos.x=clampf(e.pos.x,14,466)
		if e.pos.y>20 and e.pos.y<800 and player.alive:
			if t.fire!=null:
				e.fire_t-=dt
				if e.fire_t<=0:
					e.fire_t=float(t.fire.cd)*rng.randf_range(0.85,1.15)
					if t.fire.kind=="ring":
						for k in int(t.fire.n): _hostile(e.pos,e.ang+k/float(t.fire.n)*TAU+e.phase,118*float(t.fire.sp)*float(diff.bs),11,e.id)
					else: _aim(e.pos+Vector2(0,10),1,0,138*float(diff.bs),e.id)
			if e.kind=="mGuardian":
				e.aim_t-=dt
				if e.aim_t<=0:e.aim_t=1.4;_aim(e.pos+Vector2(0,10),3,0.5,138*float(diff.bs),e.id)
		if e.pos.y>930:enemies.erase(e);combo=0;continue
		if player.alive and player.pos.distance_squared_to(e.pos)<pow(e.r*0.62+6*0.78,2):
			hit_player();damage(e,3)

func _hostile(pos: Vector2, angle: float, speed: float, radius: float, source: int = -1) -> void:
	hostile.append({"pos":pos,"vel":Vector2.from_angle(angle)*speed,"r":radius,"source":source})

func _aim(pos: Vector2, count: int, arc: float, speed: float, source: int = -1) -> void:
	var angle: float=(player.pos-pos).angle()
	for i in count:_hostile(pos,angle+(i-(count-1)/2.0)*arc/maxi(1,count-1),speed,12,source)

func start_boss() -> void:
	phase="boss";phase_time=0;hostile.clear()
	boss={"pos":Vector2(240,-300),"r":96.0,"hp":floor(820*float(diff.hp)*[1.25,1.55,1.9][difficulty]+0.5),"max_hp":floor(820*float(diff.hp)*[1.25,1.55,1.9][difficulty]+0.5),
		"t":0.0,"phase":0,"attack":0,"attack_t":1.2,"seed":rng.randf()*TAU,"enter":true,"dead":false,"death_t":0.0,
		"flash":0.0,"fire_t":0.0,"hurt_t":0.0,"morph_t":-1.0,"form":0,"frame":0}
	cue.emit("boss")

func _update_boss(dt: float) -> void:
	if boss.is_empty():return
	var b := boss
	b.t+=dt;b.flash=maxf(0,b.flash-dt);b.fire_t=maxf(0,b.fire_t-dt);b.hurt_t=maxf(0,b.hurt_t-dt)
	if b.enter:
		b.pos.y=lerpf(b.pos.y,265,minf(1,dt*1.15))
		if b.pos.y>256:b.enter=false;cue.emit("alert")
		return
	if b.dead:
		b.death_t+=dt;b.frame=4 if b.death_t<0.55 else 21
		if rng.randf()<dt*14:_explode(b.pos+Vector2(rng.randf_range(-96,96),rng.randf_range(-67,67)),12)
		if b.death_t>2.6:boss={};phase="harvest";phase_time=0
		return
	b.pos=Vector2(240+sin(b.t*0.5+b.seed)*96,265+sin(b.t*0.9)*34)
	var fraction: float=b.hp/b.max_hp
	var ph := 0 if fraction>0.66 else 1 if fraction>0.33 else 2
	if ph!=b.phase:
		b.phase=ph;b.attack=0;b.attack_t=0.55;b.hurt_t=0.6
		if ph==2:b.morph_t=0.0
		cue.emit("alert")
	if b.morph_t>=0:
		b.morph_t+=dt
		if b.morph_t>1.25:b.form=1
		if b.morph_t>1.7:b.morph_t=-1
	b.attack_t-=dt
	if b.attack_t<=0:
		var attack: int=(b.attack+b.phase)%3
		match attack:
			0:
				for i in 10:_hostile(b.pos+Vector2(0,10),i/10.0*TAU+b.seed,134*0.8*float(diff.bs),15)
			1:_aim(b.pos+Vector2(0,40),3,0.5,138*0.9*float(diff.bs))
			2:
				for i in 3:spawn("drone",b.pos+Vector2((i-1)*46,90),{"ty":350.0})
		b.attack+=1;b.fire_t=0.34
		b.attack_t=[2.2,2.0,2.8][attack]*([1.0,0.86,0.72][b.phase]);cue.emit("enemy")
	if b.form:b.frame=19 if b.fire_t>0 else 18
	elif b.morph_t>=0:b.frame=14 if b.morph_t<0.18 else 15 if b.morph_t<0.5 else 16 if b.morph_t<0.85 else 17
	elif b.hurt_t>0:b.frame=4 if int(b.hurt_t*10)%2 else 14
	elif b.fire_t>0:b.frame=[2,11,12,13][b.attack%4]
	elif b.attack_t<0.45:b.frame=10 if b.attack%2 else 1
	else:b.frame=0
	if player.alive and player.pos.distance_squared_to(b.pos)<pow(b.r*0.48+6*0.78,2):hit_player()

func damage(e: Dictionary, amount: float) -> bool:
	if not _on_field(e) or e.get("dead",false):return false
	e.hp-=amount;e.flash=0.09
	if e==boss:
		if e.hp<=0:
			e.dead=true;score+=3200;coins+=int(round(650*float(diff.credit)));hostile.clear();_explode(e.pos,55);cue.emit("explode")
		return true
	if e.hp<=0:
		enemies.erase(e);kills+=1;combo+=1;combo_time=1.6
		var t: Dictionary=reference.enemy_types[e.kind]
		score+=int(round((float(t.sc)+(300 if e.kind=="mGuardian" else 0))*(1+mini(combo,60)*0.05)))
		var value := rng.randi_range(int(t.cr[0]),int(t.cr[1]))
		if value>0:_drop(e.pos,"credit",value)
		if rng.randf()<0.16:_drop(e.pos,["power","hull","bomb","scrap"][rng.randi_range(0,3)])
		_explode(e.pos,20);cue.emit("explode")
	return true

func _update_bullets(dt: float) -> void:
	for shot in bullets.duplicate():
		shot.pos+=shot.vel*dt
		if shot.pos.y < -50:bullets.erase(shot);continue
		var hit := false
		for e in enemies.duplicate():
			if shot.pos.distance_squared_to(e.pos)<pow(shot.r+e.r,2) and damage(e,shot.damage):hit=true;break
		if not hit and not boss.is_empty() and shot.pos.distance_squared_to(boss.pos)<pow(shot.r+boss.r*0.7,2):hit=damage(boss,shot.damage*3.2)
		if not hit:
			for p in props.duplicate():
				if shot.pos.distance_squared_to(p.pos)<pow(shot.r+p.r,2):_damage_prop(p,shot.damage);hit=true;break
		if hit:bullets.erase(shot)
	var ids := {}
	for e in enemies:ids[e.id]=true
	for shot in hostile.duplicate():
		if shot.source>=0 and not ids.has(shot.source):hostile.erase(shot);continue
		shot.pos+=shot.vel*dt
		if shot.pos.x < -50 or shot.pos.x>530 or shot.pos.y < -50 or shot.pos.y>910:hostile.erase(shot);continue
		if player.alive and shot.pos.distance_squared_to(player.pos)<pow(shot.r*0.7+6*0.8,2):hit_player();hostile.erase(shot)

func hit_player() -> void:
	if not player.alive or player.inv>0:return
	if player.shield>0:player.shield-=1;player.inv=1.1;return
	player.hp-=1;player.inv=1.7;player.hit=0.3;combo=0;cue.emit("hurt")
	if player.hp<=0:
		player.alive=false;player.dead_time=0.0;player.lives-=1;no_death=false;_explode(player.pos,40)
		if player.lives<0:finished=true;phase="over";game_over.emit()

func bomb() -> bool:
	if finished or not player.alive or player.bombs<=0:return false
	player.bombs-=1;bomb_time=0.9;bomb_center=player.pos;hostile.clear();cue.emit("bomb")
	for e in enemies.duplicate():damage(e,130)
	if not boss.is_empty():damage(boss,286)
	_explode(player.pos,60)
	return true

func _damage_prop(p: Dictionary, amount: float) -> void:
	p.hp-=amount
	if p.hp>0:return
	props.erase(p);score+=130 if p.kind=="barrel" else 220 if p.kind=="pod" else 90;_explode(p.pos,16)
	if p.kind=="barrel":
		for e in enemies.duplicate():
			if p.pos.distance_to(e.pos)<135:damage(e,30)
	else:_drop(p.pos,"power" if p.kind=="pod" else "credit",25)

func _update_props(dt: float) -> void:
	for p in props:p.pos+=p.vel*dt;p.t+=dt
	props=props.filter(func(p):return p.pos.y<950)

func _drop(pos: Vector2, kind: String, value: int = 1) -> void:
	pickups.append({"pos":pos,"kind":kind,"value":value,"t":0.0})

func _update_pickups(dt: float) -> void:
	for p in pickups.duplicate():
		p.t+=dt;p.pos.y+=60*dt
		if player.alive and p.pos.distance_to(player.pos)<92:p.pos=p.pos.move_toward(player.pos,370*dt)
		if player.alive and p.pos.distance_to(player.pos)<26:
			match p.kind:
				"credit":coins+=int(round(p.value*float(diff.credit)))
				"power":player.power=mini(5,player.power+1)
				"hull":player.hp=mini(3,player.hp+1)
				"bomb":player.bombs=mini(5,player.bombs+1)
			cue.emit("coin");pickups.erase(p)
		elif p.pos.y>920:pickups.erase(p)

func _explode(pos: Vector2, count: int) -> void:
	for i in mini(count,70-particles.size()):
		particles.append({"pos":pos,"vel":Vector2.from_angle(rng.randf()*TAU)*rng.randf_range(40,220),"life":rng.randf_range(0.25,0.7),"tone":rng.randi_range(0,3)})
