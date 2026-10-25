extends Control
## GAME OVER — bilan de mission : score, record, crédits versés en boutique.

var main: Node
var st: Dictionary = {}
var daily_mode := false

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 10)
	ui.spacer(v, 30)
	var t := ui.title_label(v, "MISSION TERMINÉE")
	var best_beaten: bool = int(st.score) >= int(Save.S.best) and int(st.score) > 0
	var sub := ui.label(v, "Pilote, mission terminée. Reprends ton souffle.\nLe Vanguard reste à tes côtés.", 14, UIKit.DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 12)
	var s1 := ui.label(v, "SCORE : %s" % ui.fmt(int(st.score)), 26, UIKit.INK)
	s1.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	if best_beaten:
		var nb := ui.label(v, "★ NOUVEAU RECORD ★", 16, UIKit.GOLD)
		nb.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.chip_row(v, [
		["SECTEUR ATTEINT %d" % int(st.level), UIKit.ACC],
		["KILLS %d" % int(st.kills), UIKit.DIM],
		["CHAÎNE MAX ×%.2f" % (1.0 + mini(int(st.combo_max), 60) * 0.05), UIKit.GOLD],
	])
	ui.label(v, "Crédits gagnés en mission : +$%s (versés en boutique)" % ui.fmt(int(st.credits)), 13, UIKit.GOLD)
	if daily_mode:
		ui.label(v, "Défi du jour : score enregistré, reviens demain pour une nouvelle tentative.", 12, UIKit.GOLD)
	ui.spacer(v, 16)
	ui.button(v, "↻ Rejouer — secteur %d" % int(st.level), func():
		main.campaign_level = int(st.level)
		main.daily_mode = false
		main._show_brief(), true)
	ui.button(v, "⬢ Boutique", func(): main.show_shop())
	ui.button(v, "⌂ Menu titre", func(): main.show_title())
