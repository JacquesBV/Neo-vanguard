extends SceneTree
const Mission = preload("res://native/sector1/mission.gd")
const Session = preload("res://native/core/session.gd")
var checks := 0
var failures: Array[String] = []
func check(value: bool, message: String) -> void:
	checks+=1
	if not value:failures.append(message);push_error(message)
func _initialize() -> void:
	var m=Mission.new()
	check(m.player.pos==Vector2(240,710),"Source initial position")
	check(m.player.hp==3 and m.player.lives==2 and m.player.bombs==2,"Source Falcon initial inventory")
	for i in 120:m.step(1.0/60)
	check(m.bullets.is_empty(),"Default autofire stays off")
	check(m.wave==0 and m.enemies.is_empty(),"First formation does not spawn before 2.2 seconds")
	for i in 14:m.step(1.0/60)
	check(m.wave==1 and m.enemies.size()==4,"First V formation at 2.2 seconds")
	var locked=Mission.new()
	var session=Session.new();session.simulation_step.connect(locked.step)
	session._physics_process(10)
	check(locked.time==0,"Title does not simulate")
	session.transition(&"briefing");session.transition(&"play");session._physics_process(1)
	session.transition(&"pause");session._physics_process(60)
	check(locked.time==1,"Pause does not advance mission")
	session.transition(&"play");session._physics_process(.5)
	check(locked.time==1.5,"Resume simulation exactly once")
	session.free()
	var edge=Mission.new()
	for i in 600:edge.step(1.0/60,Vector2(1,1))
	check(edge.player.pos==Vector2(448,818),"Source playfield clamps keyboard movement")
	var off=edge.spawn("stinger",Vector2(240,-50))
	check(not edge.damage(off,100) and off.hp==4,"Offscreen enemies immune to shots and bombs")
	off.pos=Vector2(240,200)
	check(edge.damage(off,1) and off.hp==3,"Visible enemies take authored damage")
	edge._hostile(off.pos,PI/2,100,12,off.id)
	edge.damage(off,99);edge._update_bullets(.01)
	check(edge.hostile.all(func(shot):return shot.source!=off.id),"First-sector projectiles disappear with their shooter")
	var health=Mission.new();health.player.inv=0
	health.hit_player();health.hit_player()
	check(health.player.hp==2,"Invulnerability prevents stacked contact damage")
	health.player.inv=0;health.hit_player();health.player.inv=0;health.hit_player()
	check(not health.player.alive and health.player.lives==1,"Death consumes one extra life")
	for i in 100:health.step(1.0/60)
	check(health.player.alive and health.player.hp==3 and health.player.inv>3,"Respawn restores hull with 3.2 seconds immunity")
	var b=Mission.new();b.start_boss();b.boss.pos=Vector2(240,265);b.boss.enter=false
	check(b.boss.hp==1271,"Source pilot difficulty boss HP: 820 x 1.55")
	var hp:float=b.boss.hp
	b.bullets.append({"pos":Vector2(240,265),"vel":Vector2.ZERO,"r":9.0,"damage":1.0});b._update_bullets(0)
	check(is_equal_approx(b.boss.hp,hp-3.2),"Source player-shot boss multiplier 3.2")
	check(b.bomb() and b.player.bombs==1,"Bomb consumes exactly one charge")
	check(b.hostile.is_empty() and is_equal_approx(b.boss.hp,hp-3.2-286),"Bomb clears bullets and deals source 286 boss damage")
	b.player.bombs=0
	check(not b.bomb(),"No bomb without inventory")
	b.boss.hp=400;b._update_boss(1.0/60)
	check(b.boss.phase==2 and b.boss.morph_t>=0,"Final third triggers source transformation")
	b.damage(b.boss,9999)
	check(b.boss.dead,"Boss defeat enters destruction")
	for i in 700:b.step(1.0/60)
	check(b.phase=="clear" and b.finished,"Destruction, harvest, then sector clear")
	var final_time:float=b.time;b.step(10)
	check(b.time==final_time and not b.bomb(),"Completed mission cannot simulate or bomb")
	# Entire wave timeline, checked with normal hostile activity and an invulnerable test pilot.
	var run1=Mission.new(1234);var run2=Mission.new(1234)
	for i in 3600:
		for run in [run1,run2]:
			run.player.inv=999
			# Test pilot tracks nearest ship to exercise actual projectiles/collisions.
			var target:Vector2=run.enemies[0].pos if not run.enemies.is_empty() else Vector2(240,200)
			run.step(1.0/60,Vector2(clampf((target.x-run.player.pos.x)/40,-1,1),0),true)
	check(run1.wave==12,"All twelve authored wave times execute")
	check(run1.score==run2.score and run1.kills==run2.kills and run1.player.pos==run2.player.pos,"Seeded replay is deterministic")
	check(run1.particles.size()<=70,"Source Pocket particle budget")
	check(run1.decor.size()<=11,"Source floor decor budget")
	var victory=Mission.new(431)
	for i in 24000:
		victory.player.inv=999
		var tx:=240.0
		if not victory.boss.is_empty():tx=victory.boss.pos.x
		elif not victory.enemies.is_empty():
			var nearest=victory.enemies[0]
			for enemy in victory.enemies:
				if enemy.pos.y>nearest.pos.y:nearest=enemy
			tx=nearest.pos.x
		victory.step(1.0/60,Vector2(clampf((tx-victory.player.pos.x)/30,-1,1),0),true)
		if victory.finished:break
	check(victory.phase=="clear","Full playable sector reaches victory using actual default shots (test pilot invulnerable)")
	# Actual resource loads/dimensions, including every banked Falcon pose and boss pose.
	var missing: Array[String]=[]
	for key in m.reference.sprites:
		var meta:Dictionary=m.reference.sprites[key];var texture=load(meta.path)
		if not texture is Texture2D or meta.region[2]!=meta.size[0] or meta.region[3]!=meta.size[1] or meta.region[0]+meta.size[0]>texture.get_width() or meta.region[1]+meta.size[1]>texture.get_height():missing.append(key)
	check(missing.is_empty(),"Every baked source sprite loads at authored raster dimensions")
	for name in ["sector","boss","shoot","explode","enemy","coin","alert","hurt","bomb"]:
		var stream=load("res://native/sector1/audio/"+name+".wav")
		check(stream is AudioStream and stream.get_length()>0,"Native chip audio loads: "+name)
	print(JSON.stringify({"checks":checks,"failures":failures,"scope":"sector-one simulation and media; visual/audio parity pending"}))
	quit(0 if failures.is_empty() else 1)
