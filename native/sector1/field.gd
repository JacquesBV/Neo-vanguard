extends Node2D
## Pixel surface: all actors keep the source world/pixel ratio, never stretched independently.
## (artpack S01) When `artpack` is on, backgrounds use the 16 route modules of the
## asset pack (three stacked layers, one scroll factor), the four new enemy families
## replace enemy visuals on an explicit, time-phased mapping, and the boss is the
## articulated GARDIEN DU SILO rig. The simulation (mission.gd) stays untouched:
## it remains the only source of attacks, damage and timing. Set `artpack=false`
## to get the baked-atlas presentation back (legacy fallback, used by tests).
## (C2-arch) Le pack visuel est COMMUTABLE : changer PACK_ID (ou livrer le
## prochain pack au même contrat) suffit — aucun code de rendu à toucher.
## Contrat complet : native/sector1/ARTPACK_CONTRACT.md
const PACK_ID := "artpack_s01"
var artpack_root: String = "res://native/sector1/%s/" % PACK_ID
var mission
var textures: Dictionary = {}
var mobile := false
var inks := [Color("9ea483"),Color("7d8267"),Color("595c4c"),Color("2f3329")]
var artpack := true
var rig: Node2D = null                # GARDIEN DU SILO — composant visuel seul
var rig_recoil := 0.0                 # recoil body window after fire_t ends
var rig_was_firing := false
var pack_textures: Dictionary = {}
var route: Dictionary = {}
var boss_enter_time := -1.0

func _ready() -> void:
	texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST
	if artpack and ResourceLoader.exists(artpack_root+"godot/guardian.tscn"):
		rig=load(artpack_root+"godot/guardian.tscn").instantiate()
		rig.showcase_cycle=false            # (prompt) jamais de cycle vitrine en jeu
		rig.visible=false
		add_child(rig)
		rig.weapon_fired.connect(_socket_effect)
	if route.is_empty() and FileAccess.file_exists(artpack_root+"assets/environment/route.json"):
		route=JSON.parse_string(FileAccess.get_file_as_string(artpack_root+"assets/environment/route.json"))

func _pack(path: String) -> Texture2D:
	if not pack_textures.has(path):
		pack_textures[path]=load(artpack_root+path)
	return pack_textures[path]

func _frames(name: String) -> SpriteFrames:
	return load(artpack_root+"godot/"+name+"_frames.tres")

func _texture(key: String) -> Texture2D:
	if not textures.has(key):
		textures[key]=load(mission.reference.sprites[key].path)
	return textures[key]

func sprite(key: String, point: Vector2, alpha: float = 1.0) -> void:
	if mobile and mission.reference.sprites.has("mobile_"+key):key="mobile_"+key
	if not mission.reference.sprites.has(key):return
	var meta: Dictionary=mission.reference.sprites[key]
	var origin := Vector2(meta.anchor[0],meta.anchor[1])
	var r: Array=meta.region
	draw_texture_rect_region(_texture(key),Rect2((point/3).round()-origin,Vector2(meta.size[0],meta.size[1])),Rect2(r[0],r[1],r[2],r[3]),Color(1,1,1,alpha))

## (artpack) route progression: pre-boss slots follow the mission scroll until
## the computed boss-arrival distance, then the arena modules (silo/sockets),
## then the aftermath module during harvest. One scroll factor, no parallax.
func _route_position() -> float:
	var scroll_r: float = mission.scroll/3.0
	var arrival: float = (mission.WAVE_TIMES[-1]+3.0+3.6)*mission.SCROLL_SPEED/3.0
	if mission.phase=="harvest" or mission.phase=="clear":
		return float(route.modules.size()+1)      # aftermath module
	if mission.phase in ["warning","boss"] and not mission.boss.is_empty():
		var extra: float=clampf((scroll_r-arrival)/520.0,0.0,1.0)
		return (route.modules.size()-2)+extra     # silo -> sockets during the fight
	return clampf(scroll_r/arrival,0.0,1.0)*(route.modules.size()-2)

func _module_id(slot: int) -> int:
	var last:int=route.modules.size()-1          # last pre-arena slot (antechamber)
	if slot<0:return 0
	if slot<=last:return int(route.modules[slot])
	if slot==last+1:return 12                    # boss silo
	if slot==last+2:return 13                    # boss sockets
	return 14                                    # aftermath

func _draw_module_background(p: float) -> void:
	var base_y := -fposmod(p,1.0)*160.0
	var slot := int(floor(p))
	for row in range(-1,3):
		var id := _module_id(slot+row)
		var y := base_y+row*160.0
		if y>287 or y<-160:continue
		for layer in ["far","structure","walls"]:
			var tex := _pack("assets/environment/layers/%02d_%s.png"%[id,layer])
			draw_texture(tex,Vector2(0,roundf(y)))

## (artpack) explicit mapping family -> existing simulation kind, phased so the
## variety grows along the mission (recon, then patrols, then heavy security).
## Only visuals change: trajectories, HP, drops and timings stay the simulation's.
func _family(e: Dictionary) -> String:
	if e.kind=="mGuardian":return ""             # identity kept from the baked atlas
	var t: float=mission.time
	if e.kind=="drone":
		return "radar_drone" if t<20.0 else "armored_transport"
	if t<20.0:return "stinger_original"
	return "patrol_interceptor" if t<40.0 else "mine_layer"

func _pack_enemy(e: Dictionary) -> void:
	var family := _family(e)
	var frame := int(e.t*8)%4
	if family=="stinger_original":
		var tex := _pack("assets/enemies/stinger_original_sheet.png")
		draw_texture_rect_region(tex,Rect2((e.pos/3).round()-Vector2(24,24),Vector2(48,48)),
			Rect2(frame*48,0,48,48))
		return
	_pack_enemy_frame(family,frame,(e.pos/3).round())

func _pack_enemy_frame(family: String, frame: int, at: Vector2) -> void:
	var tex := _pack("assets/enemies/%s_%02d.png"%[family,frame])
	draw_texture(tex,at-Vector2(24,24))

func _draw() -> void:
	if mission==null:return
	var m = mission
	if artpack and not route.is_empty():
		_draw_module_background(_route_position())
	else:
		draw_rect(Rect2(0,0,160,287),inks[0])
		var s: float=m.scroll*0.18
		var start := floori(-s/64)-1
		var offset: float=start*64+s
		for row in range(17):
			var y := roundf((offset+row*64)/3)
			draw_rect(Rect2(0,y,160,1),inks[1])
			for x in range(((row+start)&1)*64,480,128):draw_rect(Rect2(roundf(x/3.0),y,1,roundf(64/3.0)),inks[1])
		for d in m.decor:
			sprite(d.frames[int(m.time*4)%d.frames.size()],d.pos)
	for p in m.pickups:
		var f:=int(fposmod(p.t*3.2,TAU)/TAU*12)%12
		sprite("pickup_"+p.kind+"_"+str(f),p.pos+Vector2(0,sin(p.t*6+p.pos.x*.04)*3))
	var actors: Array = []
	for p in m.props:actors.append({"pos":p.pos,"sprite":p.kind+"_"+str(int(p.t*8)%8),"alpha":1.0})
	for e in m.enemies:
		if e.kind=="mGuardian":
			actors.append({"pos":e.pos,"sprite":e.kind+"_"+str(int(e.t*8)%8),"alpha":1.0})
		elif artpack:
			pass # pack families draw below, after the y-sort (drawn directly)
		else:
			actors.append({"pos":e.pos,"sprite":e.kind+"_"+str(int(e.t*8)%8),"alpha":1.0})
	var p: Dictionary=m.player
	if p.alive and not (p.inv>0 and int(p.inv*16)%2):
		var bank := -2 if p.bank< -0.6 else -1 if p.bank< -0.22 else 2 if p.bank>0.6 else 1 if p.bank>0.22 else 0
		actors.append({"pos":p.pos,"sprite":("mobile_" if mobile else "")+"falcon_"+str(bank)+"_"+str(int(p.anim*11)%4),"alpha":1.0})
	if not artpack and not m.boss.is_empty():
		var b: Dictionary=m.boss
		var alpha := 1.0
		if b.dead:alpha=1-clampf((b.death_t-1.5)/0.9,0,1)
		elif b.enter and int(b.t*14)%2 and b.pos.y<180:alpha=0.25
		actors.append({"pos":b.pos+Vector2(0,sin(floor(b.t*8)/8*1.6+b.seed)*3),"sprite":"boss_"+str(b.frame),"alpha":alpha})
	actors.sort_custom(func(a,b):return a.pos.y<b.pos.y)
	for a in actors:sprite(a.sprite,a.pos,a.alpha)
	if artpack:
		var drawn: Array = []
		for e in m.enemies:
			if e.kind!="mGuardian":drawn.append(e)
		drawn.sort_custom(func(a,b):return a.pos.y<b.pos.y)
		for e in drawn:_pack_enemy(e)
	if artpack and not m.boss.is_empty():
		var b: Dictionary=m.boss
		var alpha := 1.0
		if b.dead:alpha=1-clampf((b.death_t-1.5)/0.9,0,1)
		elif b.enter and int(b.t*14)%2 and b.pos.y<180:alpha=0.25
		if rig!=null:
			rig.modulate=Color(1,1,1,alpha)
	for shot in m.hostile:
		var angle:=int(round(fposmod(shot.vel.angle(),TAU)/TAU*16))%16
		var pulse: int=int(shot.get("t",0)*12+shot.get("seed",0))%2
		sprite("hostile_"+str(int(shot.r))+"_"+str(angle)+"_"+str(pulse),shot.pos)
	for shot in m.bullets:
		var at: Vector2=(shot.pos/3).round()
		draw_rect(Rect2(at-Vector2(1,2),Vector2(2,5)),inks[0])
		draw_rect(Rect2(at-Vector2(0,2),Vector2(1,5)),inks[1])
	for part in m.particles:draw_rect(Rect2((part.pos/3).round(),Vector2(1,1)),inks[part.tone])
	if m.bomb_time>0:
		var t: float=1-m.bomb_time/0.9
		draw_arc(m.bomb_center/3,8+t*173,0,TAU,64,Color(0.94,0.96,0.85,1-t),maxf(1,3*(1-t)),false)

## (artpack) boss presentation sync — the rig only ever mirrors the simulation.
func _process(dt: float) -> void:
	if mission==null or rig==null:return
	var b: Dictionary=mission.boss
	if b.is_empty():
		rig.visible=false
		return
	rig.visible=true
	rig.position=(Vector2(b.pos.x,b.pos.y)/3).round()
	rig.set_target(mission.player.pos/3)
	rig.set_damage(1.0-clampf(float(b.hp)/float(b.max_hp),0.0,1.0))
	rig_recoil=maxf(0.0,rig_recoil-dt)
	var firing: bool=bool(b.fire_t>0.0)
	if rig_was_firing and not firing:rig_recoil=0.35
	rig_was_firing=firing
	if b.dead:rig.play_action(&"defeat")
	elif b.enter:rig.play_action(&"open")
	elif b.get("morph_t",-1.0)>=0.0:rig.play_action(&"open")
	elif b.hurt_t>0.0:rig.play_action(&"damaged")
	elif firing:rig.play_action(&"fire")
	elif rig_recoil>0.0:rig.play_action(&"recoil")
	elif b.attack_t<0.45:rig.play_action(&"charge")
	else:rig.play_action(&"idle")

## visual-only socket effects (beam/muzzle); they never create gameplay shots
func _socket_effect(socket: Marker2D, kind: StringName) -> void:
	if rig==null:return
	var fx := AnimatedSprite2D.new()
	fx.sprite_frames=_frames("fx_beam" if kind==&"beam" else "fx_muzzle")
	socket.add_child(fx)
	fx.play(&"default")
	fx.animation_finished.connect(fx.queue_free)
