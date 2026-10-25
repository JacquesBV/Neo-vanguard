extends Control
## RECORDS — meilleure partie, secteur max, kills, série, top 5.

var main: Node

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 8)
	ui.title_label(v, "▦ RECORDS")
	ui.chip_row(v, [
		["RECORD %s" % ui.fmt(int(Save.S.best)), ui.GOLD],
		["SECTEUR MAX %d/24" % int(Save.S.max_level), ui.ACC],
		["KILLS %s" % ui.fmt(int(Save.S.kills)), ui.DIM],
	])
	ui.chip_row(v, [
		["MISSIONS %d" % int(Save.S.runs), ui.DIM],
		["CHAÎNE MAX ×%.2f" % (1.0 + mini(int(Save.S.combo_best), 60) * 0.05), ui.GOLD],
		["FRÔLEMENTS %d" % int(Save.S.graze_total), ui.ACC],
	])
	var d: Dictionary = Save.S.daily
	ui.label(v, "DÉFI DU JOUR : meilleur score %s · tentatives aujourd'hui %d/1" % [ui.fmt(int(d.best)), int(d.tries)], 12, ui.GOLD)
	ui.spacer(v, 10)
	ui.label(v, "— CLASSEMENT — 5 MEILLEURES MISSIONS —", 13, ui.ACC)
	if (Save.S.board as Array).is_empty():
		ui.label(v, "Aucune partie enregistrée. Termine une mission pour entrer au classement.", 12, ui.DIM)
	else:
		var i := 1
		for run in Save.S.board:
			ui.label(v, "%d.  SCORE %s   ·   SECTEUR %d   ·   %s" % [i, ui.fmt(int(run.score)), int(run.level), run.get("date", "")],
				13, UIKit.INK if i == 1 else ui.DIM)
			i += 1
	ui.spacer(v, 10)
	ui.button(v, "◀ Retour", func(): main.show_title())
