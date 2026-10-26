extends Control
## CRÉDITS — « comment tout est fabriqué » : le jeu original (moteur canvas),
## la musique, les media, et le portage Godot 4.3.

var main: Node = null

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 8)
	ui.spacer(v, 60)
	var t := ui.title_label(v, NVLang.t("Crédits"))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 6)
	var lines := [
		["NEO VANGUARD — ÉDITION COLLECTOR", UIKit.INK, 16],
		["un shoot them up vertical à moteur graphique évolutif", UIKit.DIM, 12],
		["", UIKit.DIM, 8],
		["JEU ORIGINAL", UIKit.ACC, 12],
		["moteur graphique évolutif (6 générations de consoles), canvas + WebAudio,", UIKit.DIM, 11],
		["24 secteurs, 6 cartouches, tout calculé dans le navigateur.", UIKit.DIM, 11],
		["", UIKit.DIM, 8],
		["MUSIQUE", UIKit.ACC, 12],
		["« CYBER MARCH » · IAMONEABE — chiptune par ère, 100% synthétisé", UIKit.DIM, 11],
		["", UIKit.DIM, 8],
		["AFFICHE & MEDIA", UIKit.ACC, 12],
		["illustrations de la collection (assets/media) réutilisées telles quelles", UIKit.DIM, 11],
		["", UIKit.DIM, 8],
		["PORTAGE GODOT", UIKit.GOLD, 12],
		["Godot 4.3 stable — branche port/godot-native, fidélité mesurée", UIKit.DIM, 11],
		["clavier · souris · manette · tactile (pilotage relatif 1:1)", UIKit.DIM, 11],
	]
	for l in lines:
		if str(l[0]) != "":
			var lb := ui.label(v, str(l[0]), int(l[2]), l[1])
			lb.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		else:
			ui.spacer(v, 4)
	ui.spacer(v, 16)
	ui.button(v, NVLang.t("◀ Retour"), func(): main.show_title())

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		main.show_title()
