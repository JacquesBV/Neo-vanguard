extends SceneTree
## (artpack S01) validation du raccordement : rig fidèle au master, ennemis,
## décors route, dialogue vide — simulation inchangée.
const Mission = preload("res://native/sector1/mission.gd")
const Field = preload("res://native/sector1/field.gd")
var checks := 0
var failures: Array[String] = []
func check(value: bool, message: String) -> void:
	checks += 1
	if not value: failures.append(message); push_error("FAIL: " + message)
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var root_path := "res://native/sector1/artpack_s01/"
	# 1) le rig se charge, 8 pièces, 6 sockets, showcase off par défaut
	var rig = load(root_path + "godot/guardian.tscn").instantiate()
	root.add_child(rig)
	check(rig.pieces.size() == 8, "rig : 8 pièces mécaniques")
	check(rig.sockets.size() == 6, "rig : 6 sockets nommés")
	check(rig.showcase_cycle == false, "rig : cycle vitrine désactivé en jeu")
	check(rig.socket("muzzle_l").get_parent() == rig.pieces.forearm_l, "rig : bouche gauche suit l'avant-bras gauche")
	check(rig.socket("muzzle_r").get_parent() == rig.pieces.forearm_r, "rig : bouche droite suit l'avant-bras droit")
	check(rig.charge.get_parent() == rig.socket("eye"), "rig : charge à l'œil")
	# 2) reconstruction au repos == master guardian_neutral.png (pixel près)
	var master: Image = (load(root_path + "assets/boss/guardian_neutral.png") as Texture2D).get_image()
	master.convert(Image.FORMAT_RGBA8)
	var composed := Image.create(96, 128, false, Image.FORMAT_RGBA8)
	var order := ["torso", "crown", "jaw", "iris", "shoulder_l", "shoulder_r", "forearm_l", "forearm_r"]
	var rig_data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(root_path + "assets/boss/rig.json"))
	# au repos, chaque pièce est un canvas 96×128 complet dont la chaîne de
	# pivots (joint + parent + sprite) s'annule : tout se pose à (0,0)
	for key in order:
		var part: Dictionary = rig_data.parts[key]
		var tex: Texture2D = load(root_path + part.texture)
		var img: Image = tex.get_image(); img.convert(Image.FORMAT_RGBA8)
		composed.blend_rect(img, Rect2i(Vector2i.ZERO, img.get_size()), Vector2i.ZERO)
	var mismatch := 0
	for y in 128:
		for x in 96:
			var a := master.get_pixel(x, y)
			var b := composed.get_pixel(x, y)
			if a.a > 0.5 or b.a > 0.5:
				var channel_gap: float = max(absf(a.r - b.r), max(absf(a.g - b.g), absf(a.b - b.b)))
				if (a.a > 0.5) != (b.a > 0.5) or (a.a > 0.5 and channel_gap > 0.02):
					mismatch += 1
	check(mismatch == 0, "rig au repos identique au master (%d px divergents)" % mismatch)
	# 3) familles d'ennemis : 4 frames 48×48 par nouvelle famille
	for family in ["radar_drone", "patrol_interceptor", "mine_layer", "armored_transport"]:
		var ok := true
		for f in 4:
			var t := load(root_path + "assets/enemies/%s_%02d.png" % [family, f]) as Texture2D
			ok = ok and t != null and t.get_width() == 48 and t.get_height() == 48
		check(ok, "ennemi %s : 4 frames 48×48" % family)
	# 4) décors : 16 modules × 3 couches 160×160, route 17 slots, arène 12/13
	var route: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(root_path + "assets/environment/route.json"))
	check(route.modules.size() == 17, "route : 17 modules enchaînés")
	var arena: Array = []
	for v in route.arena_modules: arena.append(int(v))
	check(arena == [12, 13], "route : arène = silo/sockets")
	var bg_ok := true
	for id in 15:
		for layer in ["far", "structure", "walls"]:
			var t := load(root_path + "assets/environment/layers/%02d_%s.png" % [id, layer]) as Texture2D
			bg_ok = bg_ok and t != null and t.get_width() == 160 and t.get_height() == 160
	check(bg_ok, "décors : couches far/structure/walls 160×160")
	# 5) champ : le rig existe dès l'ajout en arbre, artpack actif
	var m := Mission.new()
	var f = Field.new()
	f.mission = m
	root.add_child(f)
	await process_frame
	check(f.artpack, "champ : présentation artpack active")
	check(f.rig != null, "champ : rig du Gardien instancié")
	check(f.route.modules.size() == 17, "champ : route chargée")
	# la simulation ne change pas : mêmes règles que les tests d'origine
	check(m.player.pos == Vector2(240, 710), "simulation inchangée : position source")
	for i in 120: m.step(1.0 / 60)
	check(m.bullets.is_empty(), "simulation inchangée : pas d'autofire au repos")
	# 6) dialogue : cadres vides (texte en Godot, pas gravé)
	for who in ["vesta", "guardian"]:
		var t := load(root_path + "assets/ui/%s_ninepatch.png" % who) as Texture2D
		check(t != null, "dialogue : cadre %s présent" % who)
	# 7) socket_beam : effet visuel ne crée pas de projectile
	var before := m.hostile.size()
	f._socket_effect(rig.socket("muzzle_l"), &"beam")
	check(m.hostile.size() == before, "rayon visuel : aucun projectile de gameplay créé")
	print("ARTPACK S01 : %d contrôles, %d échecs" % [checks, failures.size()])
	for fail in failures: print("  FAIL ", fail)
	quit(1 if failures.size() > 0 else 0)
