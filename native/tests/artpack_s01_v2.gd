extends SceneTree
## (artpack_s01_v2) validation du raccordement : rig V2 fidèle au master,
## 28 séries d'ennemis natives au manifest, décors de route, fx, dialogue
## vide — simulation inchangée (mission.gd intouchée).
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
	var root_path := "res://native/sector1/artpack_s01_v2/"
	# 1) rig : 7 pièces, 4 sockets, vitrine désactivée en jeu
	var rig = load(root_path + "godot/guardian.tscn").instantiate()
	root.add_child(rig)
	check(rig.pieces.size() == 7, "rig : 7 pièces mécaniques (V2)")
	check(rig.sockets.size() == 4, "rig : 4 sockets nommés (eye/muzzle_l/muzzle_r/core)")
	check(rig.showcase_cycle == false, "rig : cycle vitrine désactivé en jeu")
	check(rig.socket("muzzle_l").get_parent() == rig.pieces.left_arm, "rig : bouche gauche suit le bras gauche")
	check(rig.socket("muzzle_r").get_parent() == rig.pieces.right_arm, "rig : bouche droite suit le bras droit")
	check(rig.socket("eye").get_parent() == rig.pieces.core, "rig : charge d'œil suit le noyau")
	# 2) reconstruction au repos == master guardian_neutral.png (pixel près)
	var master: Image = (load(root_path + "assets/boss/guardian_neutral.png") as Texture2D).get_image()
	master.convert(Image.FORMAT_RGBA8)
	var composed := Image.create(96, 128, false, Image.FORMAT_RGBA8)
	var rig_data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(root_path + "assets/boss/rig.json"))
	for key in rig_data.order:
		var tex: Texture2D = load(root_path + "assets/boss/rig/" + rig_data.parts[key].sheet)
		var img: Image = tex.get_image(); img.convert(Image.FORMAT_RGBA8)
		composed.blend_rect(img, Rect2i(0, 0, 96, 128), Vector2i.ZERO)
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
	# taille du boss : contenu du master ≈ boss cuit (70×90)
	var bb := master.get_used_rect()
	check(absi(bb.size.x - 70) <= 8 and absi(bb.size.y - 90) <= 8,
		"boss : contenu %dx%d ≈ boss cuit 70×90" % [bb.size.x, bb.size.y])
	# 3) états -> colonnes V2
	rig.play_action(&"fire")
	check(rig.pieces.body.frame == 2, "état fire -> colonne attack V2")
	rig.play_action(&"open")
	check(rig.pieces.body.frame == 1, "état open -> colonne charge V2 (réveil)")
	rig.play_action(&"defeat")
	check(rig.pieces.body.frame == 5, "état defeat -> colonne defeat V2")
	# 4) dégâts : niveaux exposés (art de fissures absent de la V2, documenté)
	rig.set_damage(0.4)
	check(rig._damage_level == 1, "set_damage : niveau 1 à 0,4")
	rig.set_damage(0.8)
	check(rig._damage_level == 2, "set_damage : niveau 2 à 0,8")
	# 5) weapon_fired : 2 émissions muzzle sur fire, aucun projectile gameplay
	var fired: Array = []
	rig.weapon_fired.connect(func(s, k): fired.append(k))
	rig.play_action(&"idle")
	rig._process(1.0 / 60)
	rig.play_action(&"fire")
	rig._process(1.0 / 60)
	check(fired.size() == 2, "weapon_fired : 2 émissions (muzzle_l/muzzle_r)")
	# 6) ennemis : 28 séries au manifest, cellules exactes, palette stricte
	var manifest: Array = JSON.parse_string(FileAccess.get_file_as_string(root_path + "assets/enemies/manifest.json"))
	check(manifest.size() == 28, "ennemis : 28 séries au manifest")
	var allowed := {0x2f3329: true, 0x595c4c: true, 0x7d8267: true, 0x9ea483: true}
	var enemies_ok := true
	var pal_bad := ""
	for e in manifest:
		var t: Texture2D = load(root_path + "assets/enemies/%s.png" % e.id)
		if t == null or t.get_width() != int(e.cell[0]) * int(e.frames) or t.get_height() != int(e.cell[1]):
			enemies_ok = false; pal_bad = e.id + " dims"; break
		var img: Image = t.get_image(); img.convert(Image.FORMAT_RGBA8)
		var found_bad := false
		for y in img.get_height():
			for x in img.get_width():
				var c := img.get_pixel(x, y)
				if c.a == 0: continue
				if c.a != 1.0 or not allowed.has(c.r8 * 65536 + c.g8 * 256 + c.b8):
					found_bad = true; break
			if found_bad: break
		if found_bad: enemies_ok = false; pal_bad = e.id + " palette"; break
	check(enemies_ok, "ennemis : cellules manifest + 4 encres + alpha binaire (%s)" % pal_bad)
	var sec: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://native/sector1/sector.json"))
	var kinds_ok := true
	for k in sec.enemy_types.keys():
		if k == "mGuardian": continue
		var found := false
		for e in manifest:
			if e.id == k: found = true; break
		if not found: kinds_ok = false; print("  kind manquant: ", k)
	check(kinds_ok, "ennemis : tous les kinds de la simulation couverts")
	# 7) route/décors : 17 slots, arène 12/13, aftermath 14, 45 couches 160×160
	var route: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(root_path + "assets/environment/route.json"))
	check(route.modules.size() == 17, "route : 17 modules enchaînés")
	var arena: Array = []
	for v in route.arena_modules: arena.append(int(v))
	check(arena == [12, 13], "route : arène = silo/sockets")
	check(int(route.aftermath_module) == 14, "route : après-combat = module 14")
	var bg_ok := true
	for id in 15:
		for layer in ["far", "structure", "walls"]:
			var t: Texture2D = load(root_path + "assets/environment/layers/%02d_%s.png" % [id, layer])
			if t == null or t.get_width() != 160 or t.get_height() != 160: bg_ok = false
	check(bg_ok, "décors : 15 modules × 3 couches 160×160")
	# 8) fx : 8 séries de 8 frames
	var fx_ok := true
	for n in ["charge", "beam", "muzzle", "flame", "impact", "bullet", "aimed_bullet", "telegraph"]:
		var sf: SpriteFrames = load(root_path + "godot/fx_%s_frames.tres" % n)
		if sf == null or sf.get_frame_count(&"default") != 8: fx_ok = false
	check(fx_ok, "fx : 8 SpriteFrames de 8 frames")
	# 9) champ : pack v2 actif, manifest chargé, rig instancié, simulation inchangée
	var m := Mission.new()
	var f = Field.new()
	f.mission = m
	root.add_child(f)
	await process_frame
	check(f.artpack, "champ : présentation artpack active")
	check(String(f.artpack_root).contains("artpack_s01_v2"), "champ : PACK_ID v2")
	check(f.enemy_kinds.size() == 28, "champ : manifest ennemis chargé")
	check(f.rig != null, "champ : rig du Gardien instancié")
	check(f.route.modules.size() == 17, "champ : route chargée")
	check(m.player.pos == Vector2(240, 710), "simulation inchangée : position source")
	for i in 120: m.step(1.0 / 60)
	check(m.bullets.is_empty(), "simulation inchangée : pas d'autofire au repos")
	# 10) dialogue : cadres vides (texte Godot, pas gravé)
	for who in ["vesta", "guardian"]:
		var t := load(root_path + "assets/ui/%s_ninepatch.png" % who) as Texture2D
		check(t != null, "dialogue : cadre %s présent" % who)
	# 11) rayon visuel : aucun projectile créé
	var before := m.hostile.size()
	f._socket_effect(rig.socket("muzzle_l"), &"beam")
	check(m.hostile.size() == before, "rayon visuel : aucun projectile de gameplay créé")
	print("ARTPACK S01 V2 : %d contrôles, %d échecs" % [checks, failures.size()])
	for fail in failures: print("  FAIL ", fail)
	quit(1 if failures.size() > 0 else 0)
