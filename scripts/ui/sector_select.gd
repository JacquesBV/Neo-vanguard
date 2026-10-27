extends Control
## SÉLECTION DE SECTEUR — rejouer n'importe quel secteur déjà atteint.
## Accès direct aux 8 mondes — 24 secteurs (3 secteurs par console inventée,
## de FanBoy à Polytron 32, avec hologrammes des 8 consoles sacrées).

var main: Node = null

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 6)
	var t := ui.title_label(v, NVLang.t("CHOISIR UN SECTEUR"))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var mx := int(Save.S.max_level)
	var sub := ui.label(v, NVLang.t("8 mondes — 24 secteurs · 3 par monde.") + "  ·  " + NVLang.t("Débloqué : secteur %d") % mx, 11, ui.DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 4)

	# Grille des 24 secteurs (conservée en unique GridContainer de 24 boutons)
	var grid := GridContainer.new()
	grid.columns = 6
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(grid)
	for lv in range(1, Data.MAX_LEVEL + 1):
		var b := Button.new()
		var locked := lv > mx
		var con_lv: Dictionary = Data.console_of_level(lv)
		b.text = ("%d" % lv) if not locked else "🔒"
		b.custom_minimum_size = Vector2(64, 42)
		b.add_theme_font_size_override("font_size", 13)
		if lv == mx and not locked:
			b.add_theme_color_override("font_color", UIKit.GOLD)
		elif not locked:
			b.add_theme_color_override("font_color", Color(str(con_lv.color)))
		if locked:
			b.disabled = true
		else:
			var picked := lv
			b.pressed.connect(func():
				Audio2.sfx("uiclick")
				main.begin_campaign(picked))
		grid.add_child(b)

	ui.spacer(v, 4)
	# Galerie des hologrammes des 8 consoles inventées (2 rangées × 4 mondes)
	for row_i in range(2):
		var hb := HBoxContainer.new()
		hb.alignment = BoxContainer.ALIGNMENT_CENTER
		hb.add_theme_constant_override("separation", 6)
		v.add_child(hb)
		for col_i in range(4):
			var w_i := row_i * 4 + col_i
			var cdef: Dictionary = Data.CONSOLES[w_i]
			var s_first := w_i * 3 + 1
			var unlocked_w := (mx >= s_first)
			var card := VBoxContainer.new()
			card.custom_minimum_size = Vector2(102, 74)
			card.alignment = BoxContainer.ALIGNMENT_CENTER
			card.add_theme_constant_override("separation", 1)
			var tr := TextureRect.new()
			tr.custom_minimum_size = Vector2(44, 44)
			tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			tr.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
			tr.texture = NVIntroAssets.tex(str(cdef.holo))
			tr.modulate = Color(1, 1, 1, 1.0 if unlocked_w else 0.35)
			card.add_child(tr)
			var nl := Label.new()
			nl.text = str(cdef.name)
			nl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			nl.add_theme_font_size_override("font_size", 9)
			nl.add_theme_color_override("font_color", Color(str(cdef.color)) if unlocked_w else UIKit.DIM)
			card.add_child(nl)
			var sl := Label.new()
			sl.text = "S%s" % str(cdef.sectors)
			sl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			sl.add_theme_font_size_override("font_size", 8)
			sl.add_theme_color_override("font_color", UIKit.DIM)
			card.add_child(sl)
			hb.add_child(card)

	var cur_con: Dictionary = Data.console_of_level(clampi(mx, 1, Data.MAX_LEVEL))
	var lab := ui.label(v, "Monde %d/8 · %s — %s" % [int(cur_con.world), str(cur_con.name), str(cur_con.tag)], 11, Color(str(cur_con.color)))
	lab.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 4)
	ui.button(v, NVLang.t("◀ Retour"), func(): main.show_title())

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		main.show_title()
