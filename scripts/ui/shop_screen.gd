extends Control
## BOUTIQUE ORBITALE — vaisseaux, armes, équipements et cosmétiques.
## Achats permanents et sauvegardés, formules de prix exactes du jeu d'origine.

var main: Node
var tab := 0
var tabs_bar: HBoxContainer
var list_box: VBoxContainer
var credits_label: Label

const TABS := ["VAISSEAUX", "ARMES", "ÉQUIPEMENTS", "LIVRÉES", "TRAÎNÉES", "AURAS", "TIRS"]

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 8)
	var t := ui.title_label(v, "⬢ BOUTIQUE ORBITALE")
	credits_label = ui.label(v, "CRÉDITS : %s" % ui.fmt(int(Save.S.credits)), 16, ui.GOLD)
	credits_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.label(v, "Les achats sont permanents et sauvegardés.", 11, ui.DIM)
	# onglets
	tabs_bar = HBoxContainer.new()
	tabs_bar.add_theme_constant_override("separation", 4)
	v.add_child(tabs_bar)
	for i in TABS.size():
		var b := Button.new()
		b.text = TABS[i]
		b.add_theme_font_size_override("font_size", 11)
		b.pressed.connect(func(): select_tab(i))
		tabs_bar.add_child(b)
	list_box = VBoxContainer.new()
	list_box.add_theme_constant_override("separation", 6)
	v.add_child(list_box)
	ui.spacer(v, 6)
	ui.button(v, "◀ Retour au titre", func(): main.show_title())
	select_tab(tab)

func select_tab(i: int) -> void:
	tab = i
	for c in list_box.get_children():
		c.queue_free()
	credits_label.text = "CRÉDITS : %s" % UIKit.fmt(int(Save.S.credits))
	match i:
		0: _fill_ships()
		1: _fill_weapons()
		2: _fill_upgrades()
		3: _fill_list(Data.LIVERIES, "liveries", "livery")
		4: _fill_list(Data.TRAILS, "trails", "trail")
		5: _fill_list(Data.AURAS, "auras", "aura")
		6: _fill_list(Data.BULLET_SKINS, "bullet_skins", "bullet_skin")

func _row(name_txt: String, sub: String, price: int, owned: bool, equipped: bool,
		on_buy: Callable, on_equip: Callable) -> void:
	var row := VBoxContainer.new()
	row.add_theme_constant_override("separation", 2)
	var top := HBoxContainer.new()
	top.add_theme_constant_override("separation", 8)
	list_box.add_child(row)
	row.add_child(top)
	var name_l := Label.new()
	name_l.text = name_txt
	name_l.add_theme_font_size_override("font_size", 14)
	name_l.add_theme_color_override("font_color", UIKit.INK)
	name_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(name_l)
	var st := Label.new()
	if equipped:
		st.text = "ÉQUIPÉ"
		st.add_theme_color_override("font_color", Color("#4dff9e"))
	elif owned:
		st.text = "POSSÉDÉ"
		st.add_theme_color_override("font_color", UIKit.ACC)
	else:
		st.text = "$%s" % UIKit.fmt(price)
		st.add_theme_color_override("font_color", UIKit.GOLD)
	top.add_child(st)
	if not equipped:
		var b := Button.new()
		if owned:
			b.text = "ÉQUIPER"
			b.pressed.connect(on_equip)
		else:
			b.text = "ACHETER $%s" % UIKit.fmt(price)
			b.disabled = int(Save.S.credits) < price
			b.pressed.connect(on_buy)
		b.add_theme_font_size_override("font_size", 11)
		b.size_flags_horizontal = Control.SIZE_SHRINK_END
		row.add_child(b)
	if sub != "":
		var sub_l := Label.new()
		sub_l.text = sub
		sub_l.add_theme_font_size_override("font_size", 11)
		sub_l.add_theme_color_override("font_color", UIKit.DIM)
		sub_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(sub_l)
	var sep := HSeparator.new()
	list_box.add_child(sep)

func _buy(price: int) -> bool:
	if int(Save.S.credits) < price:
		return false
	Save.S.credits = int(Save.S.credits) - price
	credits_label.text = "CRÉDITS : %s" % UIKit.fmt(int(Save.S.credits))
	Audio2.sfx("coin")
	return true

func _fill_ships() -> void:
	for sh in Data.SHIPS:
		var owned: bool = (Save.S.owned.ships as Array).has(sh.id)
		var equipped: bool = Save.S.sel.ship == sh.id
		_row(sh.name, sh.perk, sh.price, owned, equipped,
			func():
				if _buy(sh.price):
					(Save.S.owned.ships as Array).append(sh.id)
					Save.save_game(); select_tab(0),
			func():
				Save.S.sel.ship = sh.id
				Save.save_game(); select_tab(0))

func _fill_weapons() -> void:
	for w in Data.WEAPONS:
		var owned: bool = (Save.S.owned.weapons as Array).has(w.id)
		var equipped: bool = Save.S.sel.weapon == w.id
		_row(w.name, "Arme · %s" % w.id, w.price, owned, equipped,
			func():
				if _buy(w.price):
					(Save.S.owned.weapons as Array).append(w.id)
					Save.save_game(); select_tab(1),
			func():
				Save.S.sel.weapon = w.id
				Save.save_game(); select_tab(1))

func _fill_upgrades() -> void:
	for u in Data.UPGRADES:
		var lv := Save.upg_level(u.id)
		var cost := Save.upg_cost(u)
		var maxed: bool = lv >= int(u.max)
		var consumable: bool = u.get("consumable", false)
		var sub: String = u.step
		if not consumable:
			sub += "  ·  niveau %d/%d" % [lv, u.max]
		else:
			sub += "  ·  possédées : démarrent avec %d" % (2 + lv)
		_row(u.name, sub, cost, false, maxed,
			func():
				if _buy(cost):
					Save.S.owned.upgrades[u.id] = lv + 1
					Save.save_game(); select_tab(2),
			func(): pass)

func _fill_list(list: Array, own_key: String, sel_key: String) -> void:
	for item in list:
		var owned: bool = (Save.S.owned[own_key] as Array).has(item.id)
		var equipped: bool = Save.S.sel[sel_key] == item.id
		var sub: String = str(item.get("note", item.get("desc", "")))
		_row(item.name, sub, item.price, owned, equipped,
			func():
				if _buy(item.price):
					(Save.S.owned[own_key] as Array).append(item.id)
					Save.save_game(); select_tab(tab),
			func():
				Save.S.sel[sel_key] = item.id
				Save.save_game(); select_tab(tab))
