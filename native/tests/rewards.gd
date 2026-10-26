extends SceneTree
const Mission=preload("res://native/sector1/mission.gd")
var checks:=0
var failures:Array[String]=[]
func check(value:bool,message:String)->void:
	checks+=1
	if not value:failures.append(message);push_error(message)
func _initialize()->void:
	var reference:Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://native/sector1/sector.json"))
	for fixture:Dictionary in reference.collect_fixtures:
		var input:Dictionary=fixture.input
		var m=Mission.new(123,int(input.get("diff",1)))
		for key in ["power","shield","hp","bombs"]:
			if input.has(key):m.player[key]=input[key]
		m.collect({"kind":input.kind,"value":int(input.get("value",0))})
		var actual:Dictionary={"power":m.player.power,"shield":m.player.shield,"hp":m.player.hp,"bombs":m.player.bombs,"coins":m.coins,"score":m.score,"materials":m.materials}
		check(JSON.parse_string(JSON.stringify(actual))==fixture.expected,"Source JavaScript collect oracle: "+JSON.stringify(input))
	var magnet=Mission.new();magnet._drop(magnet.player.pos,"credit",0)
	magnet._update_pickups(1.0/60)
	check(magnet.coins==25 and magnet.pickups.is_empty(),"Pickup at pilot center is finite and collected once")
	var far=Mission.new();far._drop(Vector2(240,500),"credit",10)
	far.pickups[0].vel=Vector2(20,60);far._update_pickups(.1)
	check(not far.pickups[0].mag and far.pickups[0].vel.x<20,"Outside magnet: drift decays")
	far.pickups[0].pos=far.player.pos-Vector2(0,70);far._update_pickups(.1)
	check(far.pickups[0].mag and far.pickups[0].vel.y>60,"Source 92-unit magnet attracts nearby pickup")
	var burst=Mission.new();burst.player.inv=0
	burst._hostile(burst.player.pos+Vector2(22,0),0,0,12)
	burst._graze_check();burst._graze_check()
	check(burst.graze==1 and burst.score==3,"Each bullet scores one source graze, not every frame")
	burst.player.inv=2;burst._hostile(burst.player.pos+Vector2(-22,0),0,0,12);burst._graze_check()
	check(burst.graze==1,"Invulnerability blocks graze farming")
	burst.player.inv=0;burst.gauge=89.0/90
	burst._graze_check()
	check(burst.supers==1 and burst.gauge==0 and burst.hostile.is_empty(),"90th graze triggers automatic supercharge")
	check(burst.player.inv>=2.2 and burst.player.bombs==2,"Supercharge grants source immunity without consuming a bomb")
	var harvest=Mission.new();harvest.start_boss();harvest.boss.pos=Vector2(240,265);harvest.boss.enter=false
	harvest.spawn("stinger",Vector2(100,150));harvest._hostile(Vector2(100,600),0,0,12)
	harvest.damage(harvest.boss,99999)
	check(harvest.harvest.duration==6.4 and harvest.enemies.is_empty() and harvest.hostile.is_empty(),"Boss death starts source harvest and converts remaining threats")
	check(harvest.pickups.size()==10,"Harvest: shot conversion, survivor, sector rain and boss treasure")
	# No live pilot: timeout must bank every remaining item rather than dropping it.
	harvest.player.alive=false;harvest.player.dead_time=-100
	harvest._drop(Vector2(20,20),"circuit",3)
	for i in 390:harvest.step(1.0/60)
	check(harvest.finished and harvest.phase=="clear" and harvest.pickups.is_empty(),"Source harvest timeout clears and banks all loot")
	check(harvest.materials.circuit==3 and harvest.coins>650,"Timeout preserves materials and boss/sector rewards")
	var props=Mission.new();var left={"kind":"barrel","pos":Vector2(200,300),"vel":Vector2.ZERO,"hp":2,"r":24.0,"t":0.0};var right=left.duplicate();right.pos.x+=100
	props.props.append(left);props.props.append(right);props._damage_prop(left,2)
	check(props.props.is_empty() and props.kills==2,"Source barrel chain reaction destroys nearby barrel once")
	check(props.score==260 and props.pickups.size()>=2,"Destroyed props grant authored score and currency")
	check(reference.decor.any(func(d):return d.id=="plateforme" and d.w==140) and reference.decor.any(func(d):return d.id=="plateforme" and d.w==240),"Decor includes source dimension limits, no sprite stretching")
	check(reference.decor.all(func(d):return d.frames.size()==4),"Every decor variant has four source animation samples")
	check(reference.sprites.has("pickup_circuit_0") and reference.sprites.has("hostile_15_15_1"),"Original material silhouettes and directional projectile poses are present")
	print(JSON.stringify({"checks":checks,"failures":failures,"oracle":"13 fixtures executed from original JavaScript collect(); gameplay/native rendering checks"}))
	quit(0 if failures.is_empty() else 1)
