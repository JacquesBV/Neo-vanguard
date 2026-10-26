extends Control
const Mission = preload("res://native/sector1/mission.gd")
const Session = preload("res://native/core/session.gd")
const Pilot = preload("res://native/core/pilot_input.gd")
const Field = preload("res://native/sector1/field.gd")
const Catalog = preload("res://native/core/catalog.gd")
const Store = preload("res://native/core/save_store.gd")
var mission
var session = Session.new()
var pilot = Pilot.new()
var store = Store.new(Catalog.new().initial_save())
var field_view := SubViewport.new()
var field = Field.new()
var screen := TextureRect.new()
var overlay := VBoxContainer.new()
var heading := Label.new()
var detail := Label.new()
var primary := Button.new()
var home := Button.new()
var buttons: Dictionary = {}
var shell: Texture2D = preload("res://assets/fanboy/fx-material-reference.png")
var game_mark: Texture2D = preload("res://bandeau-readme.png")
var game_ship: Texture2D = preload("res://assets/media/ships-shop/falcon.webp")
var key_press := 0.0
var font := ThemeDB.fallback_font
var aperture := Rect2()
var device := Rect2()
var deck := Rect2()
var touch_mode := OS.has_feature("mobile") or "--mobile" in OS.get_cmdline_user_args()
var fire := false
var mouse_down := false
var mouse_point := Vector2.ZERO
var stick_id := -1
var stick := Vector2.ZERO
var sound := AudioStreamPlayer.new()
var effects: Array[AudioStreamPlayer] = []
var wave_music: AudioStream
var boss_music: AudioStream
var banked := false
var capture_frames := -1

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	store.load_save()
	add_child(session)
	session.simulation_step.connect(_step)
	session.state_changed.connect(_state_changed)
	field_view.size=Vector2i(160,287)
	field_view.disable_3d=true
	field_view.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	field_view.add_child(field);add_child(field_view)
	screen.texture=field_view.get_texture();screen.mouse_filter=Control.MOUSE_FILTER_IGNORE
	screen.texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
	var glass := ShaderMaterial.new();glass.shader=preload("res://native/sector1/glass.gdshader")
	screen.material=glass;add_child(screen)
	add_child(sound)
	if ResourceLoader.exists("res://native/sector1/audio/sector.wav"):
		wave_music=load("res://native/sector1/audio/sector.wav");boss_music=load("res://native/sector1/audio/boss.wav")
		for stream in [wave_music,boss_music]:
			stream.loop_mode=AudioStreamWAV.LOOP_FORWARD;stream.loop_begin=0;stream.loop_end=stream.data.size()/2
	for i in 8:
		var channel := AudioStreamPlayer.new();add_child(channel);effects.append(channel)
	for action in ["TIR","BOMBE","ARME","PAUSE"]:
		var button := Button.new();button.text="";button.tooltip_text=action;button.mouse_filter=Control.MOUSE_FILTER_STOP
		button.focus_mode=Control.FOCUS_NONE
		var style := StyleBoxFlat.new();style.bg_color=Color(0,0,0,0);style.border_color=Color(0,0,0,0)
		style.set_border_width_all(2);style.set_corner_radius_all(24);button.add_theme_stylebox_override("normal",style)
		var down := style.duplicate();down.bg_color=Color(0,0,0,0);button.add_theme_stylebox_override("pressed",down)
		add_child(button);buttons[action]=button
		if action=="TIR":button.button_down.connect(func():fire=true);button.button_up.connect(func():fire=false)
		elif action=="BOMBE":button.pressed.connect(_bomb)
		elif action=="PAUSE":button.pressed.connect(_pause)
		else:button.pressed.connect(func():detail.text="CANON À IMPULSION · seule arme possédée au départ")
	add_child(overlay)
	overlay.alignment=BoxContainer.ALIGNMENT_CENTER;overlay.add_theme_constant_override("separation",20)
	for label in [heading,detail]:
		label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
		label.add_theme_color_override("font_color",Color("c4f3ff"));overlay.add_child(label)
	heading.add_theme_font_size_override("font_size",24);detail.add_theme_font_size_override("font_size",14)
	primary.custom_minimum_size=Vector2(0,52);home.custom_minimum_size=Vector2(0,44)
	overlay.add_child(primary);overlay.add_child(home)
	primary.pressed.connect(_primary);home.pressed.connect(func():session.transition(&"title"))
	resized.connect(_layout)
	_reset();_layout();_show_menu()
	if "--smoke" in OS.get_cmdline_user_args():session.transition(&"briefing");_primary()
	if "--capture" in OS.get_cmdline_user_args():capture_frames=120;mission.player.inv=0
	if "--capture-boss" in OS.get_cmdline_user_args():
		mission.start_boss();mission.boss.pos=Vector2(240,265);mission.boss.enter=false;mission.player.inv=999

func _reset() -> void:
	mission=Mission.new(20261026,int(store.data.opts.diff));banked=false
	field.mission=mission;field.mobile=touch_mode
	mission.completed.connect(func():_bank();session.transition(&"clear"))
	mission.game_over.connect(func():_bank();session.transition(&"game_over"))
	mission.cue.connect(_cue)

func _bank() -> void:
	if banked:return
	banked=true;store.data.credits+=mission.coins;store.data.kills+=mission.kills
	store.data.best=maxi(store.data.best,mission.score)
	if mission.phase=="clear":store.data.maxLevel=maxi(2,store.data.maxLevel)
	store.persist()

func _primary() -> void:
	match session.state:
		&"title":_reset();session.transition(&"briefing")
		&"briefing":session.elapsed=0;session.transition(&"play");_music(wave_music)
		&"pause":session.transition(&"play")
		&"clear",&"game_over":_reset();session.transition(&"briefing")

func _pause() -> void:
	if session.state==&"play":session.transition(&"pause")
	elif session.state==&"pause":session.transition(&"play")

func _bomb() -> void:
	if session.state==&"play":mission.bomb()

func _state_changed(_previous: StringName, current: StringName) -> void:
	pilot.cancel_all();stick=Vector2.ZERO;stick_id=-1;fire=false;mouse_down=false
	sound.stream_paused=current!=&"play"
	if current in [&"title",&"clear",&"game_over"]:sound.stop()
	for e in effects:e.stop()
	_show_menu();queue_redraw()

func _show_menu() -> void:
	overlay.visible=session.state!=&"play"
	home.visible=session.state!=&"title"
	match session.state:
		&"title":heading.text="NEO-VANGUARD";detail.text="RECRÉATION NATIVE · SECTEUR 01\n\nFalcon · FanBoy FX\nFlèches / ZQSD · Espace : tir · B/X : bombe\nManette : stick / A / B · Échap : pause";primary.text="JOUER · SECTEUR 1"
		&"briefing":heading.text="SECTEUR 01 · CORE MEMORY";detail.text="GARDIEN DU SILO\n\nTraverse le silo et neutralise sa défense.\nMaintiens TIR pour ouvrir le feu.\nAu doigt : glisse sur l’écran ou utilise le stick.";primary.text="LANCER LA MISSION"
		&"pause":heading.text="PAUSE";detail.text="Mission suspendue";primary.text="REPRENDRE"
		&"clear":heading.text="SECTEUR NEUTRALISÉ";detail.text="SCORE %d · COINS %d\n\nSecteur 2 : recréation native à poursuivre."%[mission.score,mission.coins];primary.text="REJOUER LE SECTEUR 1"
		&"game_over":heading.text="MISSION TERMINÉE";detail.text="SCORE %d · COINS %d"%[mission.score,mission.coins];primary.text="RECOMMENCER"
	home.text="RETOUR À L’ACCUEIL"

func _layout() -> void:
	var w := size.x;var h := size.y
	var top := 42.0
	var bottom := (w*346/1024 if touch_mode else 148.0)+26
	var fit := minf(maxf(1,w-24)/160,maxf(1,h-top-bottom)/287)
	var pixel_scale := floorf(fit) if fit>=1 else fit
	aperture=Rect2(Vector2(round((w-160*pixel_scale)/2),top),Vector2(160,287)*pixel_scale)
	var dw := w if touch_mode else minf(w,aperture.size.x+48)
	var dh := h if touch_mode else top+aperture.size.y+26+dw*346/1024
	device=Rect2((w-dw)/2,0 if touch_mode else maxf(0,(h-dh)/2),dw,dh)
	if not touch_mode:aperture.position.y=device.position.y+top
	deck=Rect2(device.position.x,device.end.y-minf(device.end.y-aperture.end.y-26,dw*346/1024),dw,minf(device.end.y-aperture.end.y-26,dw*346/1024))
	screen.position=aperture.position;screen.size=aperture.size
	overlay.position=Vector2(maxf(12,w/2-180),maxf(70,h/2-170));overlay.size=Vector2(minf(w-24,360),340)
	var positions := [Vector2(.7,.28),Vector2(.88,.28),Vector2(.7,.73),Vector2(.88,.73)]
	var i := 0
	for key in buttons:
		var b: Button=buttons[key];var radius := minf(23,dw*.059)
		b.position=deck.position+positions[i]*deck.size-Vector2.ONE*radius
		b.size=Vector2.ONE*radius*2;b.add_theme_font_size_override("font_size",maxi(8,int(dw*.021)))
		i+=1
	queue_redraw()

func _step(dt: float) -> void:
	var ax := Vector2(float(Input.is_physical_key_pressed(KEY_RIGHT) or Input.is_physical_key_pressed(KEY_D))-float(Input.is_physical_key_pressed(KEY_LEFT) or Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_Q)),float(Input.is_physical_key_pressed(KEY_DOWN) or Input.is_physical_key_pressed(KEY_S))-float(Input.is_physical_key_pressed(KEY_UP) or Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_Z)))
	var pads := Input.get_connected_joypads();var shoot: bool = fire or mouse_down or pilot.pilot_id>=0 or stick_id>=0 or Input.is_physical_key_pressed(KEY_SPACE) or Input.is_physical_key_pressed(KEY_ENTER) or Input.is_physical_key_pressed(KEY_CTRL)
	if not pads.is_empty():
		var id := pads[0];var px := Input.get_joy_axis(id,JOY_AXIS_LEFT_X);var py := Input.get_joy_axis(id,JOY_AXIS_LEFT_Y)
		ax+=Vector2(px if absf(px)>.24 else 0.0,py if absf(py)>.24 else 0.0)
		shoot=shoot or Input.is_joy_button_pressed(id,JOY_BUTTON_A) or Input.is_joy_button_pressed(id,JOY_BUTTON_RIGHT_SHOULDER) or Input.get_joy_axis(id,JOY_AXIS_TRIGGER_RIGHT)>.5
	ax+=stick
	if mouse_down:
		var target := (mouse_point-aperture.position)/(aperture.size.x/480)
		var delta: Vector2=target-mission.player.pos
		ax=delta/maxf(delta.length(),40) if delta.length()>2 else Vector2.ZERO
	mission.step(dt,ax,shoot,Input.is_physical_key_pressed(KEY_SHIFT))
	field.queue_redraw();queue_redraw()

func _process(_dt: float) -> void:
	if capture_frames>=0:
		capture_frames-=1
		if capture_frames==0:
			sound.stop()
			for channel in effects:channel.stop()
			get_viewport().get_texture().get_image().save_png("/tmp/nv-native-sector1.png")
			await get_tree().create_timer(0.15).timeout
			get_tree().quit()
	for key in buttons:buttons[key].visible=session.state==&"play"

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode==KEY_ESCAPE or event.keycode==KEY_P:_pause();get_viewport().set_input_as_handled()
		elif event.keycode==KEY_ENTER and session.state!=&"play":_primary()
		elif event.keycode in [KEY_B,KEY_X,KEY_G]:_bomb()
	if event is InputEventJoypadButton and event.pressed:
		if event.button_index==JOY_BUTTON_START:
			if session.state==&"play" or session.state==&"pause":_pause()
			else:_primary()
		elif event.button_index in [JOY_BUTTON_B,JOY_BUTTON_X]:_bomb()
	if session.state!=&"play":return
	if event is InputEventScreenTouch:
		if event.pressed and aperture.has_point(event.position):pilot.begin_pilot(event.index,event.position,mission.player.pos)
		elif event.pressed and Rect2(deck.position,deck.size*Vector2(.35,1)).has_point(event.position) and stick_id<0:stick_id=event.index;_stick(event.position)
		elif not event.pressed:
			pilot.release(event.index)
			if event.index==stick_id:stick_id=-1;stick=Vector2.ZERO
	elif event is InputEventScreenDrag:
		if event.index==pilot.pilot_id:
			mission.player.pos=pilot.drag(event.index,event.position,aperture.size.x/480);mission.player.vel=Vector2.ZERO
		elif event.index==stick_id:_stick(event.position)
	elif event is InputEventMouseButton and not touch_mode:
		if event.button_index==MOUSE_BUTTON_LEFT:
			mouse_down=event.pressed and aperture.has_point(event.position);mouse_point=event.position
		elif event.button_index==MOUSE_BUTTON_RIGHT and event.pressed:_bomb()
	elif event is InputEventMouseMotion:mouse_point=event.position

func _stick(point: Vector2) -> void:
	stick=((point-(deck.position+deck.size*Vector2(.2,.43)))/maxf(12,deck.size.x*.105)).limit_length(1)

func _notification(what: int) -> void:
	if what==NOTIFICATION_APPLICATION_FOCUS_OUT:
		pilot.cancel_all();fire=false;mouse_down=false;stick=Vector2.ZERO;stick_id=-1

func _music(stream: AudioStream) -> void:
	if stream==null:return
	sound.stream=stream;sound.volume_db=linear_to_db(float(store.data.opts.music)/100*0.7);sound.play()

func _cue(name: String) -> void:
	if name=="boss":_music(boss_music);return
	var path := "res://native/sector1/audio/"+name+".wav"
	if not ResourceLoader.exists(path):return
	for channel in effects:
		if not channel.playing:
			channel.stream=load(path);channel.volume_db=linear_to_db(float(store.data.opts.sfx)/100*0.6);channel.play();break

func _label(text: String, at: Vector2, color: Color = Color("c4f3ff"), fs: int = 11) -> void:
	draw_string(font,at,text,HORIZONTAL_ALIGNMENT_LEFT,-1,fs,color)

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO,size),Color("03060b"))
	if mission==null or aperture.size.x<=0:return
	var q := device;var pf := aperture
	draw_texture_rect_region(shell,Rect2(q.position,Vector2(q.size.x,q.size.x*83/1024)),Rect2(0,0,1024,83))
	draw_texture_rect_region(shell,Rect2(q.position.x,pf.position.y-27,maxf(1,pf.position.x-q.position.x),pf.size.y+57),Rect2(0,83,94,1072))
	draw_texture_rect_region(shell,Rect2(pf.end.x,pf.position.y-27,maxf(1,q.end.x-pf.end.x),pf.size.y+57),Rect2(931,83,93,1072))
	_armor(Rect2(q.position.x,pf.end.y+26,q.size.x,maxf(0,deck.position.y-pf.end.y-26)))
	draw_texture_rect_region(shell,deck,Rect2(0,1190,1024,346))
	_armor(Rect2(deck.position+deck.size*Vector2(.055,.04),deck.size*Vector2(.89,.86)))
	var center := deck.position+deck.size*Vector2(.2,.43)
	var radius := minf(deck.size.x*.105,deck.size.y*.34)
	draw_texture_rect_region(shell,Rect2(center-Vector2.ONE*radius+stick*4,Vector2.ONE*radius*2),Rect2(92,1220,216,216))
	_label("PILOTAGE",center+Vector2(-24,radius+17),Color("77e6ff"),9)
	draw_texture_rect_region(game_mark,Rect2(deck.position+deck.size*Vector2(.36,.12),Vector2(q.size.x*.24,q.size.x*.024)),Rect2(56,110,710,72))
	draw_texture_rect_region(game_ship,Rect2(deck.position+deck.size*Vector2(.36,.27),Vector2(q.size.x*.24,q.size.x*.137)),Rect2(0,170,720,410))
	var colors := [Color("63ff8c"),Color("ff5870"),Color("51cfff"),Color("ffd36c")]
	var ki := 0
	for key in buttons:
		var button:Button=buttons[key]
		var pressed:float=1.5 if button.button_pressed or (key=="TIR" and (fire or Input.is_physical_key_pressed(KEY_SPACE))) or (key=="BOMBE" and mission.bomb_time>.76) else 0.0
		var r:Rect2=button.get_rect();r.position+=Vector2(pressed*.2,pressed);r.size-=Vector2.ONE*pressed*.4
		draw_texture_rect_region(shell,r,Rect2(850,1262,96,96))
		draw_arc(r.get_center(),r.size.x*.47,0,TAU,48,colors[ki],1.5,true)
		draw_circle(r.get_center(),r.size.x*.31,Color("05090f"))
		_label(key,r.get_center()-Vector2(font.get_string_size(key,HORIZONTAL_ALIGNMENT_LEFT,-1,maxi(8,int(q.size.x*.021))).x/2,-3),colors[ki],maxi(8,int(q.size.x*.021)))
		ki+=1
	var progress := clampf(mission.time/57.2,0,1)
	var color := Color("ff233e") if mission.phase in ["warning","boss","harvest","clear"] or progress>=.9 else Color("ff9a20") if progress>=.5 else Color("55ff77")
	for i in [9,6,4]:draw_rect(pf.grow(i),Color(color,0.04 if i>4 else 0.7),false,2)
	draw_rect(pf.grow(4),Color("e0fff3"),false,1)
	var fs := clampi(int(pf.size.x/28),9,12)
	var p: Dictionary=mission.player
	for y in [pf.position.y-26,pf.end.y+1]:draw_rect(Rect2(pf.position.x,y,pf.size.x,20),Color("061322"))
	_label("1P %06d"%mission.score,Vector2(pf.position.x+7,pf.position.y-12),Color("c4f3ff"),fs)
	_label("S01",Vector2(pf.get_center().x-10,pf.position.y-12),Color("46dfff"),fs)
	_label("V %d  B %d"%[p.lives,p.bombs],Vector2(pf.end.x-70,pf.position.y-12),Color("c4f3ff"),fs)
	_label("PWR %d"%p.power,Vector2(pf.position.x+7,pf.end.y+15),Color("40dbff"),fs)
	_label("IMPULSION",Vector2(pf.get_center().x-30,pf.end.y+15),Color("def7ff"),fs)
	_label("$ %d"%(store.data.credits+(0 if banked else mission.coins)),Vector2(pf.end.x-65,pf.end.y+15),Color("ffd675"),fs)
	_label("COQUE %d / 3  •  SH %d"%[p.hp,p.shield],Vector2(pf.position.x+5,pf.end.y+31),Color("b1c6d8"),maxi(8,fs-1))
	if not mission.boss.is_empty() and not mission.boss.dead:
		var bar := Rect2(pf.end.x-pf.size.x*.38,pf.end.y+22,pf.size.x*.38,10)
		draw_rect(bar,Color("260a15"));bar.size.x*=clampf(mission.boss.hp/mission.boss.max_hp,0,1);draw_rect(bar,Color("ff3856"))
	if mission.phase=="warning" and session.state==&"play":
		var banner := Rect2(pf.position.x,pf.get_center().y-25,pf.size.x,50)
		draw_rect(banner,Color("071322"));draw_rect(banner,Color("ff3856"),false,2)
		_label("ALERTE · SIGNATURE AMIRALE",banner.position+Vector2(8,29),Color("ff667a"),maxi(9,int(pf.size.x/24)))
	if overlay.visible:draw_rect(Rect2(Vector2.ZERO,size),Color(0.01,0.02,0.04,.9))

func _exit_tree() -> void:
	sound.stop();sound.stream=null
	for channel in effects:channel.stop();channel.stream=null
	wave_music=null;boss_music=null

func _armor(rect: Rect2) -> void:
	for row in ceili(rect.size.y/96):
		for col in ceili(rect.size.x/96):
			var pos:=Vector2(col*96,row*96)
			var dim:=Vector2(minf(96,rect.size.x-pos.x),minf(96,rect.size.y-pos.y))
			draw_texture_rect_region(shell,Rect2(rect.position+pos,dim),Rect2(Vector2(390,1260),dim))
