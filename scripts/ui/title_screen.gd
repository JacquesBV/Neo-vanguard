extends Control
## ÉCRAN TITRE — réplique du titre « live » du jeu original (réorg nvUi) :
## affiche media-033 en fond, kicker ÉDITION COLLECTOR, logo géant, sections
## PLAY / MULTIPLAYER / HANGAR & PROGRESS / SETTINGS, tuiles 2 colonnes,
## chips (record/coins/secteur max/kills + langue + ère).

var main: Node

const ART := "res://assets/ui-art/media-033.webp"

func _ready() -> void:
	var ui := UIKit
	# ---- fond : l'affiche officielle + dégradé vers le bas ------------------
	var art := TextureRect.new()
	art.texture = load(ART)
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.set_anchors_preset(Control.PRESET_FULL_RECT)
	# (correctif) ancrage : un cadre 140 px plus haut que l'écran + couverture
	# centrée — l'affiche (1600x893) recadre SANS zone morte ni étirement, le
	# vaisseau reste visible à droite comme sur l'écran d'origine
	art.offset_top = -140.0
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.modulate = Color(0.55, 0.58, 0.68)
	art.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(art)
	var grad := GradientTexture2D.new()
	var g := Gradient.new()
	g.colors = PackedColorArray([Color(0.008, 0.016, 0.04, 0.25), Color(0.008, 0.016, 0.04, 0.97)])
	g.offsets = PackedFloat32Array([0.0, 1.0])
	grad.gradient = g
	grad.fill_from = Vector2(0, 0)
	grad.fill_to = Vector2(0, 1)
	var gv := TextureRect.new()
	gv.texture = grad
	gv.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	gv.set_anchors_preset(Control.PRESET_FULL_RECT)
	gv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(gv)

	# ---- colonne du menu -----------------------------------------------------
	var v := ui.vbox(self, 3, 12.0)
	var kick := ui.label(v, NVLang.t("ÉDITION COLLECTOR · 24 SECTEURS · 6 GÉNÉRATIONS"), 10, ui.ACC)
	ui.spacer(v, 2)
	var lneo := ui.label(v, "N E O", 20, Color("eef6ff"))
	var lvan := ui.label(v, "V A N G U A R D", 34, Color("eef6ff"))
	lvan.add_theme_color_override("font_shadow_color", Color(ui.ACC.r, ui.ACC.g, ui.ACC.b, 0.45))
	lvan.add_theme_constant_override("shadow_offset_y", 0)
	lvan.add_theme_constant_override("shadow_outline_size", 10)
	var sub := ui.label(v, NVLang.t("un shoot them up vertical à moteur graphique évolutif"), 11, ui.DIM)
	ui.spacer(v, 6)

	# PLAY
	_head(v, NVLang.t("JOUER"))
	if int(Save.S.max_level) > 1:
		ui.button(v, "▶ " + NVLang.t("Continuer la campagne") + "\n     " + NVLang.t("Reprendre là où tu t'es arrêté"),
			func(): main.begin_campaign(int(Save.S.max_level)), true)
	ui.button(v, "▶  " + NVLang.t("Commencer la campagne") + "\n     " + NVLang.t("24 secteurs, six générations de consoles · l'histoire d'abord"),
		func(): main.begin_campaign(1), true)
	ui.button(v, "◈  " + NVLang.t("Défi du jour") + "\n     " + NVLang.t("Une seule tentative comptée par jour"), func():
		if main.try_daily():
			main.begin_campaign(1 + int(Save.S.max_level) / 2, true)
		else:
			ui2_toast(NVLang.t("Défi du jour déjà tenté — reviens demain !")))

	# MULTIPLAYER
	_head(v, NVLang.t("MULTIJOUEUR"))
	var gm := GridContainer.new()
	gm.columns = 2
	gm.add_theme_constant_override("h_separation", 8)
	gm.add_theme_constant_override("v_separation", 8)
	v.add_child(gm)
	_tile(gm, "⧉ " + NVLang.t("2 joueurs"), NVLang.t("Deux vaisseaux, un seul écran"), func(): main.begin_two_players())
	_tile(gm, "⌁ " + NVLang.t("Coop en ligne"), NVLang.t("Deux téléphones, un code"), func(): main.show_online())

	# HANGAR & PROGRESS
	_head(v, NVLang.t("HANGAR & PROGRESSION"))
	var gh := GridContainer.new()
	gh.columns = 2
	gh.add_theme_constant_override("h_separation", 8)
	gh.add_theme_constant_override("v_separation", 8)
	v.add_child(gh)
	var flip_ok: bool = bool(Save.S.pinball.get("completed", false))
	_tile(gh, "◈ " + NVLang.t("Flipper") + (" · 🔒" if not flip_ok else ""), NVLang.t("Bonus de fin de campagne"), func():
		if flip_ok:
			main.show_pinball_menu()
		else:
			ui2_toast(NVLang.t("Bonus de fin de campagne")))
	_tile(gh, "⬢ " + NVLang.t("Boutique"), NVLang.t("Vaisseaux, armes, livrées"), func(): main.show_shop())
	var fm_ok: bool = typeof(Save.S.musicTracks) in [TYPE_ARRAY, TYPE_DICTIONARY] and Save.S.musicTracks.size() > 0
	_tile(gh, "♫ " + NVLang.t("Neo-Vanguard FM") + (" · 🔒" if not fm_ok else ""), NVLang.t("Jukebox · cassettes · MP3"), func():
		if fm_ok:
			main.show_fm()
		else:
			ui2_toast(NVLang.t("Débloqué dans la boutique musicale")))
	_tile(gh, "▦ " + NVLang.t("Records"), NVLang.t("Classement, médailles, série"), func(): main.show_records())
	_tile(gh, "▤ " + NVLang.t("L'histoire"), NVLang.t("Le récit complet, page par page"), func(): main.show_story())
	_tile(gh, "☠ " + NVLang.t("Codes"), NVLang.t("8 codes secrets à trouver"), func(): main.show_cheats())
	_tile(gh, "★ " + NVLang.t("Crédits"), NVLang.t("Comment tout est fabriqué"), func(): main.show_credits())

	# SETTINGS
	_head(v, NVLang.t("RÉGLAGES"))
	var gs := GridContainer.new()
	gs.columns = 2
	gs.add_theme_constant_override("h_separation", 8)
	gs.add_theme_constant_override("v_separation", 8)
	v.add_child(gs)
	_tile(gs, "⚙ " + NVLang.t("Options"), NVLang.t("Graphismes, son, aperçu d'ère"), func(): main.show_options())
	var fs_on: bool = DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN
	_tile(gs, "▣ " + NVLang.t("Plein écran"), ("ON" if fs_on else "OFF"), func():
		main.toggle_fullscreen()
		main.show_title())

	# ---- chips ---------------------------------------------------------------
	ui.spacer(v, 4)
	ui.chip_row(v, [
		["RECORD %s" % ui.fmt(int(Save.S.best)), ui.GOLD],
		["COINS %s" % ui.fmt(int(Save.S.credits)), ui.GOLD],
		["SECTEUR MAX %d/24" % int(Save.S.max_level), ui.ACC],
		["KILLS %s" % ui.fmt(int(Save.S.kills)), ui.DIM],
	])
	var bottom := HBoxContainer.new()
	bottom.add_theme_constant_override("separation", 8)
	v.add_child(bottom)
	var order := ["fr", "en", "es", "pt", "ja"]
	var lang := str(Save.S.opts.get("lang", "fr"))
	var bl := Button.new()
	bl.text = " " + lang.to_upper() + " "
	bl.tooltip_text = "Langue · Language · Idioma · 言語"
	bl.add_theme_font_size_override("font_size", 11)
	bl.pressed.connect(func():
		var i := (order.find(lang) + 1) % order.size()
		Save.S.opts.lang = order[i]
		Save.save_game()
		main.show_title())
	bottom.add_child(bl)
	var era: Dictionary = Data.ERAS[Data.era_of_level(int(Save.S.max_level))]
	var et := Button.new()
	et.text = " %s · %s " % [era.sys, era.name]
	et.disabled = true
	et.add_theme_font_size_override("font_size", 11)
	bottom.add_child(et)
	var q := Button.new()
	q.text = " " + NVLang.t("◀ Retour") + " · " + NVLang.t("quitter") + " "
	q.add_theme_font_size_override("font_size", 11)
	q.pressed.connect(func(): get_tree().quit())
	bottom.add_child(q)

func _head(v: VBoxContainer, txt: String) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	v.add_child(row)
	var l := Label.new()
	l.text = txt
	l.add_theme_font_size_override("font_size", 11)
	l.add_theme_color_override("font_color", UIKit.ACC)
	row.add_child(l)
	var line := ColorRect.new()
	line.color = Color(UIKit.ACC.r, UIKit.ACC.g, UIKit.ACC.b, 0.35)
	line.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	line.custom_minimum_size = Vector2(0, 2)
	line.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(line)
	ui_spacer_v(v, 2)

func ui_spacer_v(v: VBoxContainer, h: float) -> void:
	var s := Control.new()
	s.custom_minimum_size = Vector2(0, h)
	v.add_child(s)

func _tile(grid: GridContainer, title: String, sub: String, cb: Callable) -> void:
	var b := Button.new()
	b.text = title + "\n" + sub
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.custom_minimum_size = Vector2(218, 46)
	b.add_theme_font_size_override("font_size", 11)
	b.pressed.connect(cb)
	grid.add_child(b)

func ui2_toast(t: String) -> void:
	var l := Label.new()
	l.text = t
	l.add_theme_color_override("font_color", UIKit.GOLD)
	l.add_theme_font_size_override("font_size", 13)
	l.set_anchors_preset(Control.PRESET_CENTER_TOP)
	l.position = Vector2(40, 60)
	add_child(l)
	var tw := create_tween()
	tw.tween_interval(2.2)
	tw.tween_property(l, "modulate:a", 0.0, 0.5)
	tw.tween_callback(l.queue_free)
