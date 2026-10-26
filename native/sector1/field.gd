extends Node2D
## Pixel surface: all actors keep the source world/pixel ratio, never stretched independently.
var mission
var textures: Dictionary = {}
var mobile := false
var inks := [Color("9ea483"),Color("7d8267"),Color("595c4c"),Color("2f3329")]

func _ready() -> void:
	texture_filter=CanvasItem.TEXTURE_FILTER_NEAREST

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

func _draw() -> void:
	if mission==null:return
	var m = mission
	draw_rect(Rect2(0,0,160,287),inks[0])
	var s: float=m.scroll*0.18
	var start := floori(-s/64)-1
	var offset: float=start*64+s
	for row in range(17):
		var y := roundf((offset+row*64)/3)
		draw_rect(Rect2(0,y,160,1),inks[1])
		for x in range(((row+start)&1)*64,480,128):draw_rect(Rect2(roundf(x/3.0),y,1,roundf(64/3.0)),inks[1])
	for d in m.decor:sprite(d.sprite,d.pos)
	for p in m.pickups:
		var x: float=p.pos.x/3
		var y: float=p.pos.y/3
		var turn: float=maxf(0.15,absf(cos(p.t*5)))
		draw_rect(Rect2(Vector2(x-4*turn,y-4),Vector2(8*turn,9)),inks[3])
		draw_rect(Rect2(Vector2(x-3*turn,y-3),Vector2(6*turn,7)),inks[0])
		draw_rect(Rect2(x-1,y-2,2,5),inks[2])
	var actors: Array = []
	for p in m.props:actors.append({"pos":p.pos,"sprite":p.kind+"_"+str(int(p.t*8)%8),"alpha":1.0})
	for e in m.enemies:actors.append({"pos":e.pos,"sprite":e.kind+"_"+str(int(e.t*8)%8),"alpha":1.0})
	var p: Dictionary=m.player
	if p.alive and not (p.inv>0 and int(p.inv*16)%2):
		var bank := -2 if p.bank< -0.6 else -1 if p.bank< -0.22 else 2 if p.bank>0.6 else 1 if p.bank>0.22 else 0
		actors.append({"pos":p.pos,"sprite":("mobile_" if mobile else "")+"falcon_"+str(bank)+"_"+str(int(p.anim*11)%4),"alpha":1.0})
	if not m.boss.is_empty():
		var b: Dictionary=m.boss
		var alpha := 1.0
		if b.dead:alpha=1-clampf((b.death_t-1.5)/0.9,0,1)
		elif b.enter and int(b.t*14)%2 and b.pos.y<180:alpha=0.25
		actors.append({"pos":b.pos+Vector2(0,sin(floor(b.t*8)/8*1.6+b.seed)*3),"sprite":"boss_"+str(b.frame),"alpha":alpha})
	actors.sort_custom(func(a,b):return a.pos.y<b.pos.y)
	for a in actors:sprite(a.sprite,a.pos,a.alpha)
	for shot in m.hostile:
		var at: Vector2=(shot.pos/3).round()
		draw_rect(Rect2(at-Vector2(2,2),Vector2(5,5)),inks[3])
		draw_rect(Rect2(at-Vector2(1,1),Vector2(3,3)),inks[0])
	for shot in m.bullets:
		var at: Vector2=(shot.pos/3).round()
		draw_rect(Rect2(at-Vector2(1,2),Vector2(2,5)),inks[0])
		draw_rect(Rect2(at-Vector2(0,2),Vector2(1,5)),inks[1])
	for part in m.particles:draw_rect(Rect2((part.pos/3).round(),Vector2(1,1)),inks[part.tone])
	if m.bomb_time>0:
		var t: float=1-m.bomb_time/0.9
		draw_arc(m.bomb_center/3,8+t*173,0,TAU,64,Color(0.94,0.96,0.85,1-t),maxf(1,3*(1-t)),false)
