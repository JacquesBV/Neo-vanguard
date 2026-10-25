extends Control
## ÉCRAN TITRE — reproduit le menu du jeu original :
## campagne, 2 joueurs, défi du jour, histoire, boutique, radio, options…

var main: Node

func _ready() -> void:
	var ui := UIKit
	var scr := self
	ui.title_backdrop(scr)
	var v := ui.vbox(scr, 8)
	# affiche
	var art := Label.new()
	art.text = "  ██  NEO  VANGUARD  ██\n  shoot them up vertical évolutif\n  24 secteurs · 6 générations de consoles"
	art.add_theme_font_size_override("font_size", 18)
	art.add_theme_color_override("font_color", ui.INK)
	art.add_theme_color_override("font_shadow_color", Color(ui.ACC.r, ui.ACC.g, ui.ACC.b, 0.45))
	art.add_theme_constant_override("shadow_offset_x", 0)
	art.add_theme_constant_override("shadow_offset_y", 0)
	art.add_theme_constant_override("shadow_outline_size", 14)
	art.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	art.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_child(art)
	ui.spacer(v, 8)

	var era: Dictionary = Data.ERAS[Data.era_of_level(int(Save.S.max_level))]
	ui.chip_row(v, [
		["RECORD %s" % ui.fmt(int(Save.S.best)), ui.GOLD],
		["COINS %s" % ui.fmt(int(Save.S.credits)), ui.GOLD],
		["SECTEUR MAX %d/24" % int(Save.S.max_level), ui.ACC],
		["KILLS %s" % ui.fmt(int(Save.S.kills)), ui.DIM],
	])
	ui.label(v, "PROCHAINE MACHINE : %s · %s" % [era.sys, era.name], 11, ui.DIM)
	ui.spacer(v, 6)

	var head := ui.label(v, NVLang.t("— CAMPAGNE —"), 13, ui.ACC)
	head.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	if int(Save.S.max_level) > 1:
		ui.button(v, "▶ Continuer la campagne — secteur %d" % int(Save.S.max_level),
			func(): main.begin_campaign(int(Save.S.max_level)), true)
	ui.button(v, "▶ Commencer la campagne\n     24 secteurs, six générations de consoles",
		func(): main.begin_campaign(1), true)
	ui.button(v, "⧉ 2 joueurs\n     Deux vaisseaux, un seul écran",
		func(): main.begin_two_players())
	ui.button(v, "◈ Défi du jour\n     Une seule tentative comptée par jour", func():
		if main.try_daily():
			main.begin_campaign(1 + int(Save.S.max_level) / 2, true)
		else:
			ui2_toast("Défi du jour déjà tenté — reviens demain !"))

	var head2 := ui.label(v, "— PRÉPARATION —", 13, ui.ACC)
	head2.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.button(v, NVLang.t("⬢ Boutique") + " — vaisseaux, armes, livrées", func(): main.show_shop())
	ui.button(v, NVLang.t("L'histoire") + " — le récit complet", func(): main.show_story())
	ui.button(v, NVLang.t("⚙ Options"), func(): main.show_options())
	ui.button(v, NVLang.t("Commandes"), func(): main.show_help())
	ui.button(v, NVLang.t("☠ Menu cheat") + " — 10 codes secrets à trouver", func(): main.show_cheats())
	ui.button(v, NVLang.t("Classement"), func(): main.show_records())
	ui.spacer(v, 10)
	ui.button(v, NVLang.t("◀ Retour") + " · quitter", func(): get_tree().quit())

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
