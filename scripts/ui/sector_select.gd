extends Control
## SÉLECTION DE SECTEUR — rejouer n'importe quel secteur déjà atteint.
## (L'écran titre du web ne propose que « continuer au max » ; cette vue
## ajoute l'accès direct, utile pour rejouer les secteurs 2-4 GameBoy quand
## la sauvegarde pointe déjà plus loin. Verrouillé au-delà du record.)

var main: Node = null

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 8)
	var t := ui.title_label(v, NVLang.t("CHOISIR UN SECTEUR"))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var mx := int(Save.S.max_level)
	var sub := ui.label(v, NVLang.t("Vingt-quatre secteurs. Quatre par machine. Un seul pilote.") + "  ·  " + NVLang.t("Débloqué : secteur %d") % mx, 11, ui.DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 6)
	var grid := GridContainer.new()
	grid.columns = 6
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(grid)
	for lv in range(1, Data.MAX_LEVEL + 1):
		var b := Button.new()
		var locked := lv > mx
		b.text = ("%d" % lv) if not locked else "🔒"
		b.custom_minimum_size = Vector2(64, 46)
		b.add_theme_font_size_override("font_size", 13)
		if lv == mx and not locked:
			b.add_theme_color_override("font_color", UIKit.GOLD)
		if locked:
			b.disabled = true
		else:
			var picked := lv
			b.pressed.connect(func():
				main.begin_campaign(picked))
		grid.add_child(b)
	var era: Dictionary = Data.ERAS[Data.era_of_level(clampi(mx, 1, Data.MAX_LEVEL))]
	var lab := ui.label(v, "%s · %s" % [era.sys, era.name], 11, ui.ACC)
	lab.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 8)
	ui.button(v, NVLang.t("◀ Retour"), func(): main.show_title())

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		main.show_title()
