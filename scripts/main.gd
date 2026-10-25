extends Node
## =========================================================================
## MAIN — chef d'orchestre : affichage (SubViewport façon console rétro),
## écrans (titre, boîte de secteur, boutique, options, codes, records,
## pause, game over, fin de campagne) et économie persistante (bankRun).
## =========================================================================

const BriefScreen := preload("res://scripts/ui/brief_screen.gd")
const PocketBaker := preload("res://scripts/sprites/pocket_baker.gd")
const GuardianSprite := preload("res://scripts/sprites/guardian_sprite.gd")

var game: NVGame
var viewport: SubViewport
var screen_layer: CanvasLayer
var tr: TextureRect
var crt: Node2D
var shell: CanvasItem = null
var current_screen: Control
var banked := 0                 # crédits déjà versés pour la mission en cours
var campaign_level := 1
var daily_mode := false
var daily_mods: Array = []

# ---------------------------------------------------------------------------
func _exit_tree() -> void:
	## vider les caches statiques (textures) : sans quoi Godot signale des
	## ressources « encore utilisées » à la fermeture (ObjectDB leaks)
	BriefScreen._art_cache.clear()
	PocketBaker._cache.clear()
	GuardianSprite._cache.clear()
	## stopper toute lecture audio : les playbacks actifs au quit fuient sinon
	Audio2.music_player.stop()
	for p in Audio2._sfx_pool:
		p.stop()
	Audio2._music_cache.clear()
	Audio2._chip_cache.clear()
	Audio2._sfx_cache.clear()

func _ready() -> void:
	_build_display()
	_build_game()
	_attach_hud()
	screen_layer = CanvasLayer.new()
	add_child(screen_layer)
	Audio2.start_title_music()
	show_title()
	if OS.get_environment("NV_TEST") == "1":
		_run_smoke_test()
	if OS.get_environment("NV_TEST") == "2":
		_run_screen_test()
	if OS.get_environment("NV_TEST") == "3":
		_run_visual_test()
	if OS.get_environment("NV_TEST") == "4":
		_run_layout_dump()
	if OS.get_environment("NV_TEST") == "5":
		_run_ticket_test()
	if OS.get_environment("NV_TEST") == "7":
		_run_module20_test()
	if OS.get_environment("NV_TEST") == "8":
		_run_bonus_test()


# test 8 : les ajouts v6 — flipper Néon Orbit (menu + table), Neo-Vanguard FM
# (boutique + achat), deck narratif (prologue illustré) et sas du secteur 24
func _run_bonus_test() -> void:
	await get_tree().process_frame
	var dir := "/tmp/shots8"
	DirAccess.make_dir_recursive_absolute(dir)
	print("TEST8: échantillons sector24 audio disponibles = ", Nv24Audio.samples_disponibles(), "/16")
	# ---------- FM : boutique débloquée, achat, lecture ----------
	Save.S.unlocks["cassettes"] = true
	Save.S.credits = int(Save.S.credits) + 1000
	print("TEST8: FM…")
	show_fm()
	await get_tree().create_timer(0.4).timeout
	await _snap(dir + "/1-fm-boutique.png")
	var fm := current_screen
	if fm != null and fm.get("grid") != null:
		print("TEST8: cartes cassettes affichées = ", fm.grid.get_child_count(), " (attendu 31)")
		fm._buy({"id": "boss-24", "kind": "boss", "title": "VORAX", "levels": "Secteur 24",
			"file": "boss-24-vorax.mp3", "price": 0, "era": 5})
		await get_tree().create_timer(0.2).timeout
		print("TEST8: achat boss-24 → musicTracks=", Save.S.musicTracks)
		fm._play_track("boss-24")
		await get_tree().create_timer(0.3).timeout
		print("TEST8: lecture → playing_id=", fm.playing_id, " statut=", fm.deck_status_label.text)
		await _snap(dir + "/2-fm-walkman.png")
		fm._eject()
	# ---------- flipper : menu puis table ----------
	print("TEST8: flipper menu…")
	show_pinball_menu()
	await get_tree().create_timer(0.4).timeout
	await _snap(dir + "/3-pinball-menu.png")
	var pb := current_screen
	if pb != null and pb.get("game") == null:
		Save.S.pinball["help_seen"] = true   # la table, pas l'aide, sur la capture
		pb._begin_session()
		await get_tree().create_timer(0.5).timeout
		# un coup de batteur + lance-bille relâché pour animer la table
		pb.game.set_flipper("left", true)
		pb.game.set_plunger(true)
		await get_tree().create_timer(1.2).timeout
		pb.game.set_plunger(false)
		pb.game.set_flipper("left", false)
		await get_tree().create_timer(1.3).timeout
		print("TEST8: table → billes=", pb.game.balls.size(), " score=", pb.game.score, " état=", pb.game.state)
		await _snap(dir + "/4-pinball-table.png")
	# ---------- deck narratif : prologue page 1 ----------
	print("TEST8: prologue…")
	_show_story_deck("prologue")
	await get_tree().create_timer(0.4).timeout
	var dk := current_screen
	if dk != null:
		var img0: String = dk.pages[0].img
		print("TEST8: deck img=", img0, " exists=", ResourceLoader.exists(img0), " art=", dk.art != null)
	await _snap(dir + "/5-prologue.png")
	# ---------- sas du secteur 24 ----------
	print("TEST8: secteur 24 (sas)…")
	begin_campaign(24)
	await get_tree().create_timer(0.2).timeout
	launch_level()
	await get_tree().create_timer(0.6).timeout
	game.phase = 2   # Phase.BOSS_WARN (enum INTRO, WAVES, BOSS_WARN, …)
	game.boss_warn_t = 0.0
	game.sas["hp"] = game.sas["max"] * 0.45   # fissures visibles
	await get_tree().create_timer(0.4).timeout
	await _snap(dir + "/6-sas-secteur24.png")
	print("TEST8: sas → hp=", game.sas.get("hp"), "/", game.sas.get("max"), " art=", game.nv24_tex.keys())
	print("=== BONUS TEST TERMINÉ ===")
	get_tree().quit(0)

# test 7 : les 8 ennemis + 6 mini-boss du module 20, leurs formations et la
# synthèse audio exacte (chaque recette est rendue puis jouée)
func _run_module20_test() -> void:
	await get_tree().process_frame
	# 1. rendu audio : toutes les recettes, toutes les ères
	var Chip := load("res://scripts/audio_chip.gd")
	var names := ["shoot", "cannon", "laser", "ehit", "explode", "hurt", "shieldbreak",
		"pick", "coin", "power", "buy", "ui", "back", "bomb", "warp", "warpSwap",
		"alert", "bossAlarm", "levelup", "reward", "gameover"]
	var bad := 0
	for nm in names:
		for era in 6:
			var st: AudioStream = Chip.render(nm, era, nm == "explode" and era == 3)
			if st == null:
				print("TEST7: AUDIO MANQUANT ", nm, " era", era)
				bad += 1
			elif era == 0 and bad == 0 and nm == "alert":
				print("TEST7: alert era0 → ", st.get_length(), " s, stéréo=", st.stereo)
	print("TEST7: audio rendu, recettes manquantes=", bad)
	# 2. les ennemis, en jeu, ère 1 (8-bit+)
	begin_campaign(5)
	var waited := 0
	while game.state != "play" and waited < 8000:
		await get_tree().create_timer(0.2).timeout
		waited += 200
	var g := game
	g.enemies.clear()
	var kinds := ["bomber", "kamikaze", "layer", "lancer", "missileer", "phalanx", "weaver", "tanker"]
	var x := 60.0
	for k in kinds:
		g.spawn_enemy(k, x, 120.0 + randf() * 60.0, {})
		x += 52.0
	for i in 4:
		g.spawn_mini(Data.MINI_OF_ERA[i], 80.0 + i * 110.0)
	g.form_cross("bomber", 3, {})
	g.form_rank("phalanx", 4, {})
	g.form_pincer("runner", 2, {})
	g.form_corners("kamikaze", 4, {})
	await get_tree().create_timer(1.2).timeout
	print("TEST7: ennemis vivants=", g.enemies.size(), " (attendu ≥ 21)")
	var kset := {}
	for e in g.enemies:
		kset[e.kind] = true
	print("TEST7: kinds=", ",".join(kset.keys()))
	var sprites_ok := true
	for k in kinds:
		if PocketBaker.bake(k, 0) == null:
			sprites_ok = false
			print("TEST7: SPRITE MANQUANT ", k)
	print("TEST7: sprites cuits=", sprites_ok)
	await get_tree().create_timer(0.8).timeout
	var img := get_viewport().get_texture().get_image()
	img.save_png("/tmp/shots/test7-module20.png")
	print("SHOT: /tmp/shots/test7-module20.png")
	print("=== MODULE20 TEST TERMINÉ ===")
	get_tree().quit()

# test 5 : tickets à gratter (module 47) — attribution, codes, vue, révélations
func _run_ticket_test() -> void:
	await get_tree().process_frame
	var dir := OS.get_environment("NV_SHOT")
	if dir == "": dir = "/tmp/shots"
	DirAccess.make_dir_recursive_absolute(dir)
	print("TEST5: award secteur 12 → ", Tickets.award("neo_melodies_002").serial)
	print("TEST5: award finale → ", Tickets.award("finale").serial)
	print("TEST5: re-award finale (même série) → ", Tickets.award("finale").serial)
	print("TEST5: list = ", Tickets.list().size(), " tickets")
	# codes : inconnu, ticket ok, ticket déjà validé, classique
	var r := Tickets.try_code("neomelodies")
	print("TEST5: code NEOMELODIES → ok=", r.ok, " | ", r.msg)
	r = Tickets.try_code("NEOMELODIES")
	print("TEST5: re-NEOMELODIES → ok=", r.ok, " | ", r.msg)
	print("TEST5: unlocks.cassettes = ", Tickets.is_unlocked("cassettes"))
	print("TEST5: code classique BANQUE! → ", Save.enter_code("BANQUE!").get("name", "?"))
	print("TEST5: code CAFAITFLIPPER → ok=", Tickets.try_code("CAFAITFLIPPER").ok,
		" | unlocks.pinball = ", Tickets.is_unlocked("pinball"))
	# vue : ticket épique intact → capture, puis révélé → capture
	show_title()
	await get_tree().create_timer(0.3).timeout
	show_cheats()
	await get_tree().create_timer(0.3).timeout
	await _snap(dir + "/1-codes-tickets.png")
	open_ticket("neo_melodies_002")
	await get_tree().create_timer(0.6).timeout
	await _snap(dir + "/2-ticket-intact.png")
	# grattage simulé : on perce la zone au pinceau jusqu'à la révélation
	var tv: Control = null
	for c in find_children("*", "Control", true, false):
		if c.get_script() != null and String(c.get_script().resource_path).ends_with("ticket_view.gd"):
			tv = c
			break
	for x in [31, 110, 220, 330, 409]:
		for y in [31, 122, 213]:
			tv._brush(Vector2(x, y))
	tv._sample()
	await get_tree().create_timer(0.8).timeout
	print("TEST5: révélé = ", tv.revealed, " (attendu true à ≥65 %)")
	await _snap(dir + "/3-ticket-revele.png")
	tv._close()
	await get_tree().create_timer(0.2).timeout
	# ticket légendaire (fin) révélé d'emblée → réouverture depuis CODES
	Tickets.get_item("finale").revealed = true
	open_ticket("finale")
	await get_tree().create_timer(0.6).timeout
	await _snap(dir + "/4-ticket-finale.png")
	print("=== TICKET TEST TERMINÉ ===")
	get_tree().quit(0)

# test automatisé : campagne → vagues → boss → récolte → secteur suivant
func _run_smoke_test() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	print("TEST: titre affiché, écran = ", current_screen)
	var save_node := Save
	begin_campaign(1)
	var waited := 0
	while game.state != "play" and waited < 12000:
		await get_tree().create_timer(0.2).timeout
		waited += 200
	print("TEST: state=", game.state, " level=", game.level, " era=", game.era_idx)
	await get_tree().create_timer(8.0).timeout
	var g := game
	print("TEST: après 8s → phase=", g.phase, " ennemis=", g.enemies.size(),
		" tirs=", g.bullets.size(), " ebullets=", g.ebullets.size(), " score=", g.score)
	Save.S.opts.autofire = true
	g.phase = 2
	g.boss_warn_t = 99.0
	await get_tree().create_timer(4.5).timeout
	print("TEST: boss présent=", not g.boss.is_empty(), " phase=", g.phase,
		" boss_hp=", (g.boss.hp if not g.boss.is_empty() else -1))
	await get_tree().create_timer(6.0).timeout
	print("TEST: boss t=", (g.boss.t if not g.boss.is_empty() else -1),
		" ebullets=", g.ebullets.size(), " score=", g.score, " combo=", g.combo)
	if not g.boss.is_empty():
		g.boss.hp = 0
		g.boss_damage(1.0)
	await get_tree().create_timer(9.0).timeout
	print("TEST: après mort du boss → level=", g.level, " phase=", g.phase, " state=", g.state)
	print("TEST: crédits boutique=", Save.S.credits, " max_level=", Save.S.max_level)
	g.state = "play"
	if g.phase == 0 or g.phase == 1:
		g.use_bomb(g.first_player())
	print("TEST: bombe OK, ebullets=", g.ebullets.size())
	print("=== SMOKE TEST TERMINÉ ===")
	get_tree().quit(0)

# test 3 : parcours visuel — capture l'écran réel à chaque étape
func _run_visual_test() -> void:
	var dir := OS.get_environment("NV_SHOT")
	if dir == "": dir = "/tmp/shots"
	DirAccess.make_dir_recursive_absolute(dir)
	await get_tree().create_timer(1.0).timeout
	await _snap(dir + "/1-titre.png")
	show_story()
	await get_tree().create_timer(0.5).timeout
	await _snap(dir + "/2-story.png")
	show_help()
	await get_tree().create_timer(0.8).timeout
	await _snap(dir + "/3-help.png")
	show_shop()
	await get_tree().create_timer(0.5).timeout
	await _snap(dir + "/4-shop.png")
	begin_campaign(1)
	await get_tree().create_timer(0.8).timeout
	await _snap(dir + "/5-brief.png")
	launch_level()
	await get_tree().create_timer(1.0).timeout
	await _snap(dir + "/6-jeu-1s.png")
	await get_tree().create_timer(5.0).timeout
	await _snap(dir + "/7-jeu-6s.png")
	game.phase = 2
	game.boss_warn_t = 99.0
	await get_tree().create_timer(4.5).timeout
	await _snap(dir + "/8-boss.png")
	Save.S.opts.autofire = true
	await get_tree().create_timer(4.0).timeout
	await _snap(dir + "/9-boss-tir.png")
	# autres générations : ville néon (S9) et HD (S21)
	for essai in [[9, "10-era2-ville.png"], [21, "11-era5-hd.png"]]:
		campaign_level = essai[0]
		_clear_screen()
		_apply_era_viewport(essai[0])
		game.begin_level(essai[0])
		await get_tree().create_timer(2.5).timeout
		await _snap(dir + "/" + essai[1])
	print("=== VISUAL TEST TERMINÉ ===")
	get_tree().quit(0)

func _snap(path: String) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png(path)
	print("SHOT: ", path)

# la pause est interceptée ici : le jeu vit dans un SubViewport qui ne
# reçoit pas les événements d'entrée de la fenêtre racine
func _unhandled_input(event: InputEvent) -> void:
	if game.state == "play" and current_screen == null and event.is_action_pressed("pause"):
		_on_pause()
		get_viewport().set_input_as_handled()

# test 2 : tous les écrans + fin de campagne (secteur 24 → ending)
func _run_screen_test() -> void:
	await get_tree().process_frame
	var save_node := Save
	print("TEST2: boutique…"); show_shop(); await get_tree().create_timer(0.3).timeout
	for i in 7:
		current_screen.select_tab(i)
		await get_tree().process_frame
	print("TEST2: options…"); show_options(); await get_tree().create_timer(0.2).timeout
	print("TEST2: codes…"); show_cheats(); await get_tree().create_timer(0.2).timeout
	var res: Dictionary = Save.enter_code("kabrak77")
	print("TEST2: code kabrak77 → ", res.get("name", "INCONNU"), " / trouvé=", Save.cheat_found("lives"))
	res = Save.enter_code("BANQUE!")
	print("TEST2: code BANQUE! → ", res.get("name", "INCONNU"), " / crédits=", Save.S.credits)
	res = Save.enter_code("xxx")
	print("TEST2: code inconnu → vide=", res.is_empty())
	print("TEST2: records…"); show_records(); await get_tree().create_timer(0.2).timeout
	print("TEST2: commandes…"); show_help(); await get_tree().create_timer(0.2).timeout
	print("TEST2: histoire…"); show_story(); await get_tree().create_timer(0.2).timeout
	# mission niveau 24 → victoire → écran de fin
	print("TEST2: secteur 24…")
	begin_campaign(24)
	await get_tree().create_timer(0.2).timeout
	launch_level()
	await get_tree().create_timer(1.0).timeout
	print("TEST2: level=", game.level, " era=", game.era_idx, " (attendu 5 = HD)")
	_on_sector_won(24, { "score": 999999, "credits": 42000, "kills": 10, "level": 24,
		"combo_max": 40, "graze": 5 })
	await get_tree().create_timer(0.5).timeout
	print("TEST2: max_level=", Save.S.max_level, " écran final affiché")
	# jeu 2 joueurs
	begin_two_players()
	await get_tree().create_timer(0.2).timeout
	launch_level()
	await get_tree().create_timer(1.0).timeout
	print("TEST2: 2 joueurs → joueurs=", game.players.size())
	print("=== SCREEN TEST TERMINÉ ===")
	get_tree().quit(0)

func _build_display() -> void:
	viewport = SubViewport.new()
	viewport.disable_3d = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	viewport.size = Vector2i(480, 860)
	add_child(viewport)
	tr = TextureRect.new()
	tr.texture = viewport.get_texture()
	# taille logique FIXE : tout l'habillage vit dans le repère 480×860
	tr.position = Vector2.ZERO
	tr.size = Vector2(Data.L_W, Data.L_H)
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_SCALE
	tr.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(tr)

func _build_game() -> void:
	game = NVGame.new()
	viewport.add_child(game)
	game.sector_won.connect(_on_sector_won)
	game.run_over.connect(_on_run_over)
	game.request_pause.connect(_on_pause)

func _attach_hud() -> void:
	# la coque de la console, SOUS le champ de jeu
	shell = preload("res://scripts/ui/shell_layer.gd").new()
	shell.main = self
	add_child(shell)
	move_child(shell, tr.get_index())
	# HUD pleine résolution par-dessus le champ rétro (comme le HUD HTML d'origine)
	var hud := preload("res://scripts/ui/hud_overlay.gd").new()
	hud.game = game
	add_child(hud)
	# scanlines CRT (option)
	crt = preload("res://scripts/ui/scanlines.gd").new()
	crt.game = game
	add_child(crt)
	_apply_smooth()

func _apply_smooth() -> void:
	# option « lissage » : filtre linéaire au lieu de pixels nets
	if tr:
		tr.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR if Save.S.opts.get("smooth", false) else CanvasItem.TEXTURE_FILTER_NEAREST

func _apply_era_viewport(lv: int = -1) -> void:
	var ei: int = Data.era_of_level(lv if lv > 0 else game.level)
	Data.FW = 480.0
	if ei == 0:
		# monde 4:3 de la Pocket, encastré dans le verre de la coque
		Data.FH = 360.0
		viewport.size = Vector2i(480, 360)
		game.scale = Vector2.ONE
		tr.position = Data.GLASS.position
		tr.size = Data.GLASS.size
	else:
		Data.FH = 860.0
		var K: float = Data.ERAS[ei].K
		viewport.size = Vector2i(int(Data.FW * K), int(Data.FH * K))
		game.scale = Vector2(K, K)
		tr.position = Vector2.ZERO
		tr.size = Vector2(Data.FW, Data.FH)
	if shell:
		shell.queue_redraw()

# =========================================================================
#  ÉCONOMIE PERSISTANTE (bankRun du JS)
# =========================================================================
func bank_run(st: Dictionary) -> void:
	var earned: int = int(st.get("credits", 0))
	var delta: int = earned - banked
	if delta > 0:
		Save.S.credits = int(Save.S.credits) + delta
	banked = earned
	Save.S.kills = int(Save.S.kills) + int(st.get("kills_new", 0))
	Save.save_game()

func _archive_run(st: Dictionary) -> void:
	# runArchive : record, combo max, classement
	if int(st.score) > int(Save.S.best):
		Save.S.best = int(st.score)
	Save.S.combo_best = maxi(int(Save.S.combo_best), int(st.get("combo_max", 0)))
	Save.S.graze_total = int(Save.S.graze_total) + int(st.get("graze", 0))
	Save.S.runs = int(Save.S.runs) + 1
	var board: Array = Save.S.board
	board.append({ "score": int(st.score), "level": int(st.level),
		"date": Time.get_date_string_from_system() })
	board.sort_custom(func(a, b): return int(a.score) > int(b.score))
	if board.size() > 5:
		board.resize(5)
	Save.save_game()

# =========================================================================
#  DÉFI DU JOUR
# =========================================================================
func _today() -> String:
	return Time.get_date_string_from_system()

func try_daily() -> bool:
	var d: Dictionary = Save.S.daily
	if d.d != _today():
		d.d = _today()
		d.tries = 0
		d.score = 0
	if int(d.tries) >= 1:
		return false
	d.tries = 1
	Save.save_game()
	# mods déterministes tirés de la date
	var pool := ["fast", "hp", "noshield", "nobomb", "combos"]
	var seed_val: int = hash(_today())
	daily_mods.clear()
	for i in 3:
		seed_val = hash(str(seed_val) + str(i))
		daily_mods.append(pool[abs(seed_val) % pool.size()])
	return true

# =========================================================================
#  NAVIGATION
# =========================================================================
func _clear_screen() -> void:
	if current_screen:
		current_screen.queue_free()
		current_screen = null

func _set_screen(c: Control) -> void:
	_clear_screen()
	current_screen = c
	# taille logique FIXE 480×860 : jamais la taille physique du viewport
	c.position = Vector2.ZERO
	c.size = Vector2(Data.L_W, Data.L_H)
	screen_layer.add_child(c)

# ----------------------------------------------------------------- titre
func show_title() -> void:
	game.state = "menu"
	banked = 0
	daily_mode = false
	Audio2.start_title_music()
	var scr := preload("res://scripts/ui/title_screen.gd").new()
	scr.main = self
	_set_screen(scr)

func show_shop() -> void:
	Audio2.start_shop_music()
	var scr := preload("res://scripts/ui/shop_screen.gd").new()
	scr.main = self
	_set_screen(scr)

func show_options() -> void:
	var scr := preload("res://scripts/ui/options_screen.gd").new()
	scr.main = self
	_set_screen(scr)

func show_cheats() -> void:
	var scr := preload("res://scripts/ui/cheats_screen.gd").new()
	scr.main = self
	_set_screen(scr)

func show_records() -> void:
	var scr := preload("res://scripts/ui/records_screen.gd").new()
	scr.main = self
	_set_screen(scr)

func show_help() -> void:
	var scr := preload("res://scripts/ui/help_screen.gd").new()
	scr.main = self
	_set_screen(scr)

func show_story() -> void:
	# l'entrée « Histoire » rejoue le deck narratif illustré (prologue)
	_show_story_deck("prologue")

## module 30 : la boutique Neo-Vanguard FM (cassettes + walkman)
func show_fm() -> void:
	_clear_screen()
	var scr: Control = preload("res://scripts/ui/fm_screen.gd").new()
	scr.main = self
	_set_screen(scr)

## pinball.js : le menu de la table bonus (05_menu_deblocage)
func show_pinball_menu() -> void:
	_clear_screen()
	var scr: Control = preload("res://scripts/ui/pinball_screen.gd").new()
	scr.main = self
	_set_screen(scr)

## le cadeau d'après-campagne : « BONUS DÉBLOQUÉ » (une seule fois)
func show_pinball_gift() -> void:
	_clear_screen()
	var scr: Control = preload("res://scripts/ui/pinball_screen.gd").new()
	scr.main = self
	scr.show_gift()

func _show_story_deck(deck_mode: String, on_end := Callable()) -> void:
	_clear_screen()
	Audio2.start_story_music()
	var scr: Control = preload("res://scripts/ui/story_deck.gd").new()
	scr.main = self
	scr.mode = deck_mode
	scr.on_end = on_end
	_set_screen(scr)

# ------------------------------------------------------- boîte de secteur
func begin_campaign(start_level: int, is_daily := false) -> void:
	campaign_level = start_level
	daily_mode = is_daily
	game.two_p = false
	# module 02 : le prologue (9 pages illustrées) ouvre la campagne —
	# sauf reprise au-delà du secteur 1 et en défi du jour
	if start_level <= 1 and not is_daily:
		_show_story_deck("prologue", func(): _show_brief())
	else:
		_show_brief()

func begin_two_players() -> void:
	campaign_level = 1
	daily_mode = false
	game.two_p = true
	_show_story_deck("prologue", func(): _show_brief())

func _show_brief() -> void:
	_clear_screen()
	var scr := preload("res://scripts/ui/brief_screen.gd").new()
	scr.main = self
	scr.level = campaign_level
	_set_screen(scr)

func launch_level() -> void:
	_clear_screen()
	_apply_era_viewport(campaign_level)
	game.begin_level(campaign_level, daily_mode, daily_mods)

func _on_sector_won(level: int, st: Dictionary) -> void:
	bank_run(st)
	_archive_stats_silent(st)
	# module 47 : ticket ÉPIQUE offert en battant le boss du secteur 12 ;
	# s'il n'a pas encore été révélé, il se rouvre au bilan du secteur
	if level == 12:
		var it := Tickets.award("neo_melodies_002")
		if not it.is_empty() and not it.revealed:
			get_tree().create_timer(1.7).timeout.connect(func():
				if is_instance_valid(self) and current_screen != null:
					open_ticket("neo_melodies_002"))
	if level >= Data.MAX_LEVEL:
		_show_ending(st)
	else:
		Save.S.max_level = maxi(int(Save.S.max_level), level + 1)
		Save.save_game()
		campaign_level = level + 1
		_show_brief()

## surcouche ticket (comme #nvtOverlay) : l'écran du dessous reste en place ;
## attachée à screen_layer APRÈS l'écran courant → dessinée au-dessus
func open_ticket(model: String, on_close := Callable()) -> void:
	var scr: Control = preload("res://scripts/ui/ticket_view.gd").new()
	scr.main = self
	scr.model_id = model
	scr.on_close = on_close
	# la vue se met elle-même en FULL_RECT à _ready (size imposée ici = warning d'ancres)
	screen_layer.add_child(scr)

func _archive_stats_silent(st: Dictionary) -> void:
	Save.S.kills = int(Save.S.kills)
	if int(st.score) > int(Save.S.best):
		Save.S.best = int(st.score)

func _show_ending(st: Dictionary) -> void:
	Save.S.max_level = Data.MAX_LEVEL
	# pinball.js : la victoire débloque définitivement la table Néon Orbit
	# (hook showVictoryScreen) ; l'écran-cadeau ne s'affiche qu'à la première
	if Save.S.pinball.get("completed", false) != true:
		Save.S.pinball["completed"] = true
		Save.S.pinball["gift_seen"] = false
	Save.save_game()
	# module 02 : l'épilogue (5 pages illustrées) précède l'écran de victoire
	_show_story_deck("epilogue", func(): _after_epilogue(st))

func _after_epilogue(st: Dictionary) -> void:
	Audio2.play_ending()
	# module 47 : après le générique, le ticket LÉGENDAIRE remplace l'ancien
	# cadeau de fin (code CAFAITFLIPPER) ; le cadeau flipper suit sa fermeture
	Tickets.award("finale")
	get_tree().create_timer(1.2).timeout.connect(func():
		if is_instance_valid(self):
			open_ticket("finale", func():
				if is_instance_valid(self) and Save.S.pinball.get("gift_seen", true) != true:
					Save.S.pinball["gift_seen"] = true
				Save.save_game()
				if is_instance_valid(self) and (Save.S.pinball.get("completed", false) == true):
					show_pinball_gift()))
	_clear_screen()
	var scr := Control.new()
	var ui := preload("res://scripts/ui/ui_kit.gd")
	ui.dark_bg(scr)
	var v := ui.vbox(scr, 16)
	ui.title_label(v, "CAMPAIGNE TERMINÉE")
	ui.label(v, "VORAX est tombé. Les cartouches sont rendues\naux mondes qui les avaient oubliées.", 15, Color("#eaf6ff"))
	ui.label(v, "Score final : %s" % ui.fmt(int(st.score)), 16, Color("#ffd166"))
	ui.label(v, "Crédits récoltés : %s" % ui.fmt(int(st.credits)), 14, Color("#ffd166"))
	ui.spacer(v, 20)
	ui.button(v, "⌂ Menu titre", func(): show_title())
	_set_screen(scr)

# ------------------------------------------------------------------ pause
func _on_pause() -> void:
	if game.state != "play" or current_screen != null:
		return
	game.paused = true
	var scr := Control.new()
	var ui := preload("res://scripts/ui/ui_kit.gd")
	ui.dark_bg(scr, 0.75)
	var v := ui.vbox(scr, 14)
	ui.title_label(v, "PAUSE")
	ui.label(v, "Secteur %d · %s" % [game.level, Data.ERAS[Data.era_of_level(game.level)].name], 13, Color("#9fb0c2"))
	ui.spacer(v, 12)
	ui.button(v, "▶ Reprendre", func():
		game.paused = false
		_clear_screen())
	ui.button(v, "⌁ Musique : %s" % ("OUI" if not Audio2.muted else "NON"), func():
		Audio2.set_muted(not Audio2.muted)
		_on_pause()
		_clear_screen()
		_on_pause())
	ui.button(v, "✖ Abandonner la mission", func():
		game.paused = false
		var st := { "level": game.level, "score": game.score, "credits": game.credits_run,
			"kills": game.kills, "combo_max": game.combo_max, "graze": game.graze_total }
		bank_run(st)
		show_title())
	_set_screen(scr)

# --------------------------------------------------------------- game over
func _on_run_over(st: Dictionary) -> void:
	bank_run(st)
	_archive_run(st)
	if daily_mode:
		var d: Dictionary = Save.S.daily
		d.score = int(st.score)
		if int(st.score) > int(d.best):
			d.best = int(st.score)
		Save.save_game()
	var scr := preload("res://scripts/ui/over_screen.gd").new()
	scr.main = self
	scr.st = st
	scr.daily_mode = daily_mode
	_set_screen(scr)


func _run_layout_dump() -> void:
	await get_tree().create_timer(1.0).timeout
	print("WINDOW: ", get_window().size, " visible_rect: ", get_viewport().get_visible_rect())
	_dump(current_screen, 0)
	get_tree().quit(0)

func _dump(n: Node, depth: int) -> void:
	if n is Control:
		var c: Control = n
		print("%s%s pos=%s size=%s min=%s" % ["  ".repeat(depth), c.get_class(),
			c.global_position, c.size, c.get_combined_minimum_size()])
	for ch in n.get_children():
		_dump(ch, depth + 1)
