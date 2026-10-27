extends SceneTree
class TouchSpy extends Node:
 var received: Array = []
 func _input(event: InputEvent) -> void:
  if event is InputEventScreenTouch or event is InputEventScreenDrag:
   received.append(event)
var fb
var count := 0
var failures: Array[String] = []
var events: Array = []

func check(condition: bool, label: String) -> void:
 count += 1
 if not condition: failures.append(label)

func _initialize() -> void:
 call_deferred("run")

func run() -> void:
 fb = load("res://scenes/FanBoy.tscn").instantiate()
 root.add_child(fb)
 await process_frame
 fb.sound_enabled = false
 fb.button_changed.connect(func(k,v): events.append([k,v]))
 for key in fb.CENTERS:
  var c: Dictionary = fb.layout.controls[key]
  check(fb.sprites[key].position.is_equal_approx(Vector2(c.center[0],c.center[1])),"rest alignment "+key)
 for key in ["a","b","start","select"]:
  fb.pointer_down(1,fb.CENTERS[key])
  check(fb.held[key],"press "+key)
  await fb.tweens[key].finished
  check(fb.sprites[key].scale.x < 1,"depression "+key)
  fb.pointer_move(1,Vector2.ZERO)
  check(not fb.held[key],"drag out "+key)
  fb.pointer_move(1,fb.CENTERS[key])
  check(fb.held[key],"reenter "+key)
  fb.pointer_up(1,Vector2.ZERO)
  await fb.tweens[key].finished
  check(not fb.held[key] and fb.sprites[key].scale.is_equal_approx(Vector2.ONE),"release "+key)
 fb.pointer_down(10,fb.CENTERS.stick)
 for degree in range(360):
  var direction := Vector2.RIGHT.rotated(deg_to_rad(float(degree)))
  fb.pointer_move(10,fb.CENTERS.stick+direction*120)
  check(fb.stick_value.is_equal_approx(direction),"360 degree %d" % degree)
 fb.pointer_down(11,fb.CENTERS.a)
 fb.pointer_down(12,Vector2(310,600))
 fb.pointer_down(13,Vector2(500,600))
 check(fb.captures.size()==4 and fb.held.a,"4 simultaneous pointers")
 fb.pointer_up(12,Vector2(310,600))
 check(fb.held.a and fb.stick_value.length()>0.9,"screen release independent")
 fb.pointer_up(11,fb.CENTERS.a)
 check(fb.captures.has(10),"button release independent")
 fb.cancel_all()
 check(fb.captures.is_empty() and fb.stick_value==Vector2.ZERO,"cancel reset")
 await create_timer(0.15).timeout
 check(fb.sprites.stick.position==fb.CENTERS.stick,"spring return")
 fb.pointer_down(14,fb.CENTERS.stick+Vector2(2,0))
 check(fb.stick_value==Vector2.ZERO,"deadzone")
 fb.pointer_down(15,fb.CENTERS.a)
 fb.set_power(false)
 check(fb.captures.is_empty() and not fb.held.a and not fb.screen_sprite.visible,"off releases everything")
 fb.pointer_down(16,fb.CENTERS.b)
 check(fb.captures.is_empty(),"off blocks buttons")
 fb.pointer_down(17,fb.CENTERS.power)
 fb.pointer_up(17,fb.CENTERS.power)
 check(fb.powered,"power tap on")
 fb.pointer_down(18,fb.CENTERS.power)
 fb.pointer_move(18,fb.CENTERS.power+Vector2(0,18))
 fb.pointer_up(18,fb.CENTERS.power+Vector2(0,18))
 check(not fb.powered,"switch down off")
 fb.set_power(true)
 fb.pointer_down(19,fb.CENTERS.a)
 fb._notification(Node.NOTIFICATION_APPLICATION_FOCUS_OUT)
 check(fb.captures.is_empty() and not fb.held.a,"focus loss")
 var touch := InputEventScreenTouch.new()
 touch.index = 31
 touch.position = fb.canvas.get_global_transform_with_canvas()*fb.CENTERS.a
 touch.pressed = true
 root.push_input(touch,true)
 await process_frame
 check(fb.held.a,"native input press routing")
 touch = touch.duplicate()
 touch.pressed = false
 root.push_input(touch,true)
 await process_frame
 check(not fb.held.a,"native input release routing")
 var screen_events: Array = []
 var spy := TouchSpy.new()
 fb.game_viewport.add_child(spy)
 fb.screen_touch.connect(func(id,p,down): screen_events.append([id,p,down]))
 fb.pointer_down(32,Vector2(168,307))
 fb.pointer_move(32,Vector2(180,330))
 fb.pointer_up(32,Vector2(180,330))
 check(screen_events.size()==2 and screen_events[0][1]==Vector2(10,20) and not screen_events[1][2],"screen local coordinates and release")
 check(spy.received.size()==3 and spy.received[0].position==Vector2(10,20) and spy.received[2].pressed==false,"game viewport input delivery")
 var initial_events := events.size()
 fb.pointer_down(33,fb.CENTERS.a)
 fb.pointer_down(33,fb.CENTERS.a)
 fb.pointer_move(33,fb.CENTERS.a)
 fb.pointer_up(33,fb.CENTERS.a)
 fb.pointer_up(33,fb.CENTERS.a)
 await fb.tweens.a.finished
 check(events.size()==initial_events+2 and not fb.held.a,"rapid edges no duplicate commands")
 for dimensions in [Vector2(390,844),Vector2(1080,1920),Vector2(1440,3200),Vector2(768,1024)]:
  fb.size = dimensions
  fb._fit()
  for point in [fb.CENTERS.a,fb.CENTERS.stick,Vector2(158,287),Vector2(777,1176)]:
   var projected: Vector2 = fb.canvas.get_global_transform_with_canvas()*point
   check(fb.to_master(projected).distance_to(point)<0.002,"portrait inverse transform")
  check((fb.canvas.position+fb.MASTER*fb.canvas.scale).x<=dimensions.x+0.01,"portrait fit")
 fb.set_hull_health(50,100)
 fb.set_boss_health(25,100)
 check(fb.hull_ratio==0.5 and fb.boss_ratio==0.25,"independent health")
 fb.set_hull_health(200,100)
 fb.set_boss_health(2,0)
 check(fb.hull_ratio==1 and fb.boss_ratio==0,"health clamps")
 fb.set_threat(0.9)
 fb._process(1.0)
 check(fb.light_color.r>0.9 and fb.light_color.g<0.3,"critical red")
 fb.set_power(false)
 fb._process(1.0)
 check(fb.light_materials[0].get_shader_parameter("energy")==0.0,"power overrides threat")
 fb.set_power(true)
 fb.set_threat(0)
 fb._process(1.0)
 check(fb.light_color.g>0.8 and fb.light_color.r<0.4,"calm green")
 fb.set_threat(0.5)
 fb._process(1.0)
 check(fb.light_color.r>0.9 and fb.light_color.g>0.5,"warning amber")
 var report := {"engine":Engine.get_version_info().string,"checks":count,"failures":failures,"physical_mobile_tested":false}
 var file := FileAccess.open("res://docs/test_report.json",FileAccess.WRITE)
 file.store_string(JSON.stringify(report,"  "))
 print(JSON.stringify(report))
 quit(0 if failures.is_empty() else 1)

