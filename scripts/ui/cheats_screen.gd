extends Control
## MENU DES CODES — les 10 codes secrets du jeu d'origine.
## Tape un code (ex. kabrak77) : il est mémorisé pour toujours.
## Les codes de ticket (module 47) passent d'abord ; les tickets obtenus
## sont listés dans l'encadré « MES TICKETS », rouvrables en surcouche.

var main: Node
var code_input: LineEdit
var feedback: Label
var list_root: VBoxContainer

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 8)
	ui.title_label(v, "☠ CODES SECRETS")
	ui.label(v, "Entrez un code, puis validez. Les codes trouvés restent activables.", 12, ui.DIM)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	v.add_child(row)
	code_input = LineEdit.new()
	code_input.placeholder_text = "CODE"
	code_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	code_input.add_theme_font_size_override("font_size", 16)
	code_input.text_submitted.connect(func(_t): _submit())
	row.add_child(code_input)
	var go := Button.new()
	go.text = "OK"
	go.pressed.connect(_submit)
	row.add_child(go)
	feedback = ui.label(v, "", 13, UIKit.GOLD)
	ui.spacer(v, 6)
	# la liste vit dans un ScrollContainer dédié : les 10 codes + les tickets
	# dépassent la hauteur de l'écran (le menu d'origine défile aussi).
	# NB : ui.vbox() enrobe déjà dans un scroll — celui-ci a besoin d'une
	# hauteur minimale explicite pour ne pas s'effondrer.
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(0, 430)
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(scroll)
	list_root = VBoxContainer.new()
	list_root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list_root.add_theme_constant_override("separation", 4)
	scroll.add_child(list_root)
	ui.button(v, "◀ Retour", func(): main.show_title())
	_refresh_list()

func _deferred_refresh() -> void:
	_refresh_list.call_deferred()

func _submit() -> void:
	# les codes de ticket passent d'abord (wrapper de tryCheatCode, module 47)
	var tick: Dictionary = Tickets.try_code(code_input.text)
	if not tick.is_empty():
		feedback.text = ("✔ %s — %s" % [tick.code, tick.msg]) if tick.ok else ("• %s — %s" % [tick.code, tick.msg])
		feedback.add_theme_color_override("font_color", Color("#4dff9e") if tick.ok else UIKit.ACC)
		code_input.text = ""
		_refresh_list()
		return
	var found: Dictionary = Save.enter_code(code_input.text)
	if found.is_empty():
		feedback.text = "CODE INCONNU"
		feedback.add_theme_color_override("font_color", Color("#ff5fa2"))
		Audio2.sfx("hurt")
	else:
		feedback.text = "✔ %s — %s" % [found.name, found.get("desc_hint", "code activé")]
		feedback.add_theme_color_override("font_color", Color("#4dff9e"))
		Audio2.sfx("power")
	code_input.text = ""
	_refresh_list()

func _refresh_list() -> void:
	if list_root == null:
		return
	for c in list_root.get_children():
		list_root.remove_child(c)
		c.queue_free()
	# ---- MES TICKETS : les tickets obtenus, consultables (module 47) ------
	var mine: Array = Tickets.list()
	if not mine.is_empty():
		var mb := PanelContainer.new()
		var msb := StyleBoxFlat.new()
		msb.bg_color = Color(1.0, 0.843, 0.514, 0.05)
		msb.border_color = Color(1.0, 0.843, 0.514, 0.35)
		msb.set_border_width_all(1)
		msb.set_corner_radius_all(10)
		msb.content_margin_left = 12.0
		msb.content_margin_right = 12.0
		msb.content_margin_top = 10.0
		msb.content_margin_bottom = 10.0
		mb.add_theme_stylebox_override("panel", msb)
		mb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		list_root.add_child(mb)
		var mv := VBoxContainer.new()
		mv.add_theme_constant_override("separation", 4)
		mb.add_child(mv)
		var mt := Label.new()
		mt.text = Tickets.TX.mine
		mt.add_theme_font_size_override("font_size", 11)
		mt.add_theme_color_override("font_color", Color("#ffd783"))
		mv.add_child(mt)
		for it in mine:
			var R: Dictionary = Tickets.RARITIES[it.rarity]
			var bt := Button.new()
			bt.text = "%s · %s · %s · %s" % [Tickets.TX.see, R.label, it.serial,
				(Tickets.TX.rev if it.revealed else Tickets.TX.scr)]
			bt.add_theme_font_size_override("font_size", 11)
			var bs := StyleBoxFlat.new()
			bs.bg_color = Color(1, 1, 1, 0.045)
			bs.border_color = R.color
			bs.set_border_width_all(1)
			bs.set_corner_radius_all(9)
			bs.content_margin_left = 10.0
			bs.content_margin_right = 10.0
			bs.content_margin_top = 5.0
			bs.content_margin_bottom = 5.0
			bt.add_theme_stylebox_override("normal", bs)
			var mid: String = it.model
			bt.pressed.connect(func():
				if main:
					main.open_ticket(mid, func(): _deferred_refresh()))
			mv.add_child(bt)
	# ---- les 10 codes ------------------------------------------------------
	for c in Data.CHEATS:
		var found: bool = Save.cheat_found(c.id)
		var on: bool = Save.cheat_on(c.id)
		var l := Label.new()
		if found:
			l.text = "▸ %s %s" % [c.name, ("— ACTIF" if on and c.type == "toggle" else ("— code : %s" % c.code if c.type != "toggle" else "— inactif"))]
			l.add_theme_color_override("font_color", Color("#4dff9e") if on else UIKit.ACC)
		else:
			l.text = "🔒 %s — indice : %s" % [c.name, c.hint]
			l.add_theme_color_override("font_color", UIKit.DIM)
		l.add_theme_font_size_override("font_size", 12)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		list_root.add_child(l)
		if found and c.type == "toggle":
			var b := Button.new()
			b.text = ("DÉSACTIVER" if on else "ACTIVER") + " — " + c.name
			b.add_theme_font_size_override("font_size", 11)
			var cid: String = c.id
			b.pressed.connect(func():
				Save.S.cheats.on[cid] = not Save.S.cheats.on.get(cid, false)
				Save.save_game()
				_refresh_list())
			list_root.add_child(b)
		if found and c.id == "jump":
			var j := Button.new()
			j.text = "Secteur de départ : %d (cliquer pour +1)" % int(Save.S.cheats.start_level)
			j.add_theme_font_size_override("font_size", 11)
			j.pressed.connect(func():
				Save.S.cheats.start_level = int(Save.S.cheats.start_level) % 24 + 1
				Save.save_game()
				_refresh_list())
			list_root.add_child(j)
