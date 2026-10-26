extends Control
## COOP EN LIGNE — réplique du panneau scr-online du jeu original dans son
## état hors ligne (le portage natif n'embarque pas la signalisation web) :
## statut « Hors ligne », création/connexion indisponibles.

var main: Node = null

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 10)
	ui.spacer(v, 90)
	var panel := ui.panel(v, Control.new())
	var pv: VBoxContainer = panel.get_child(0).get_child(0) if panel.get_child(0) and panel.get_child(0).get_child_count() > 0 else null
	# panel() emballe un Control ; on reconstruit simplement dans v si besoin
	var w: VBoxContainer = pv if pv else v
	var t := ui.title_label(w, NVLang.t("COOP EN LIGNE"))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var sub := ui.label(w, NVLang.t("Deux téléphones, un code à cinq caractères, le même secteur"), 12, ui.DIM)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ui.spacer(w, 10)
	var st := ui.label(w, "● " + NVLang.t("Hors ligne"), 14, Color("ff7a7a"))
	st.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(w, 8)
	var b1 := ui.button(w, "⌁ " + NVLang.t("Créer une partie"), func(): pass)
	b1.disabled = true
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	w.add_child(row)
	var code := LineEdit.new()
	code.placeholder_text = NVLang.t("CODE")
	code.max_length = 5
	code.custom_minimum_size = Vector2(150, 40)
	code.editable = false
	row.add_child(code)
	var b2 := ui.button(w, NVLang.t("Rejoindre"), func(): pass)
	b2.disabled = true
	ui.spacer(w, 12)
	ui.label(w, NVLang.t("Aucune installation, aucun compte — l'un crée, l'autre rejoint, c'est tout.") + "\n(" + NVLang.t("Hors ligne") + " — le réseau du navigateur n'est pas porté)", 11, ui.DIM).autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ui.spacer(w, 10)
	ui.button(w, NVLang.t("◀ Retour"), func(): main.show_title())

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		main.show_title()
