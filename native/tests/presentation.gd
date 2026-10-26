extends SceneTree
var failures: Array[String]=[]
var checks:=0
func check(value: bool, message: String) -> void:
	checks+=1
	if not value:failures.append(message);push_error(message)
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var scene=load("res://native/scenes/sector1.tscn").instantiate()
	scene.store.save_path="user://native-ui-test.json"
	root.add_child(scene)
	await process_frame
	for mobile in [false,true]:
		scene.touch_mode=mobile
		for dim in [Vector2i(320,568),Vector2i(390,844),Vector2i(412,915),Vector2i(1440,1000)]:
			root.size=dim;await process_frame;scene._layout()
			var pf:Rect2=scene.aperture
			check(pf.position.x>=0 and pf.end.x<=dim.x and pf.position.y>=0 and pf.end.y<dim.y,"Aperture contained %s mobile=%s"%[dim,mobile])
			check(is_equal_approx(pf.size.x/pf.size.y,160.0/287),"Source raster aspect ratio preserved %s"%dim)
			check(scene.deck.position.y>=pf.end.y+25 and scene.deck.end.y<=dim.y+1,"Controls below aperture %s mobile=%s"%[dim,mobile])
	check(scene.session.state==&"title","Launch shows title")
	scene._bomb();check(scene.mission.player.bombs==2,"Title blocks bomb action")
	scene._primary();check(scene.session.state==&"briefing","Title enters briefing")
	scene._primary();check(scene.session.state==&"play","Briefing enters native play")
	scene.session.set_physics_process(false)
	var finger=InputEventScreenTouch.new();finger.index=1;finger.position=scene.aperture.get_center();finger.pressed=true
	scene._input(finger);check(scene.pilot.pilot_id==1,"Gameplay touch owns pilot finger")
	var drag=InputEventScreenDrag.new();drag.index=1;drag.position=finger.position+Vector2(20,-10)
	var before:Vector2=scene.mission.player.pos;scene._input(drag)
	check(scene.mission.player.pos.x>before.x and scene.mission.player.pos.y<before.y,"Screen drag moves in correct direction")
	scene._pause();var time:float=scene.mission.time;scene._bomb();scene.session._physics_process(20)
	check(scene.mission.player.bombs==2 and scene.mission.time==time,"Pause gates bombs and simulation")
	check(scene.pilot.pilot_id==-1 and scene.stick_id==-1 and not scene.fire,"Pause clears input ownership")
	scene._primary();scene._bomb();check(scene.mission.player.bombs==1,"Resume permits bomb exactly once")
	scene.session.transition(&"title");scene._primary();scene._primary()
	check(scene.mission.time==0 and scene.mission.player.bombs==2,"New mission starts with independent state")
	scene.queue_free();await process_frame
	await create_timer(0.15).timeout
	print(JSON.stringify({"checks":checks,"failures":failures,"scope":"native scene, layout and routed inputs; no physical device claims"}))
	quit(0 if failures.is_empty() else 1)
