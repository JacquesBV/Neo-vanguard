extends Control
## ÉCRAN DE CHARGEMENT DE SECTEUR — réplique de l'overlay nvLoad :
## logo hexagonal, « SECTEUR ## · machine », barre de progression,
## séquence « Analyse de l'appareil… / Mesure du rendu · <profil> / Prêt. »
## et astuce de pilotage. S'adapte automatiquement au plein écran (480×860,
## secteurs 4–24) comme au sous-écran portrait 620×890 de la console FanBoy
## (secteurs 1, 2 et 3).

var level := 1
var machine := "FanBoy"
var in_fanboy := false
var canvas_size := Vector2(480.0, 860.0)
var t := 0.0
var done := false
var status_l: Label = null
var tip_l: Label = null

const CYAN := Color("4cf4ff")
const VIOLET := Color("a98bff")
const PINK := Color("ff5ea8")

var c1: Color
var c2: Color
var c3: Color

const TIPS := [
	["Astuce : frôler les tirs ennemis remplit la jauge de GRAZE.", "Tip: grazing enemy shots fills the GRAZE gauge."],
	["Astuce : le bouton B déclenche la bombe et efface les tirs ennemis.", "Tip: button B triggers a bomb and wipes enemy shots."],
	["Astuce : les coins gagnés sont gardés pour la boutique.", "Tip: coins you earn are kept for the shop."],
	["Astuce : surveille les rails lumineux de menace sur la FanBoy.", "Tip: watch the threat light rails on the FanBoy."],
]

func _lang() -> String:
	var l := str(Save.S.opts.get("lang", "fr"))
	return "fr" if l == "fr" else "en"

func _tx(i: int) -> String:
	return TIPS[(level + int(Time.get_unix_time_from_system() * 0.2)) % TIPS.size()][i]

func _ready() -> void:
	position = Vector2.ZERO
	size = canvas_size
	custom_minimum_size = canvas_size
	if Data.is_fanboy_level(level):
		c1 = Color(Data.INKS[3])
		c2 = Color(Data.INKS[2])
		c3 = Color(Data.INKS[3])
	else:
		c1 = CYAN
		c2 = VIOLET
		c3 = PINK
	var bg := ColorRect.new()
	bg.color = Color(0.055, 0.075, 0.055, 0.97) if Data.is_fanboy_level(level) else Color(0.012, 0.02, 0.05, 0.97)
	bg.position = Vector2.ZERO
	bg.size = canvas_size
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var ui := UIKit
	var pad_x := 44.0 if in_fanboy else 30.0
	var v := MarginContainer.new()
	v.position = Vector2.ZERO
	v.size = canvas_size
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_theme_constant_override("margin_left", int(pad_x))
	v.add_theme_constant_override("margin_right", int(pad_x))
	add_child(v)

	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 14 if in_fanboy else 10)
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(box)

	ui.spacer(box, int(canvas_size.y * 0.26))
	if in_fanboy:
		var boot_hdr := ui.label(box, "FAN BOY™  ·  SYSTÈME EN LIGNE", 15, c2)
		boot_hdr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var sec := ui.label(box, NVLang.t("SECTEUR") + "  %02d  ·  %s" % [level, machine], 20 if in_fanboy else 15, c1)
	sec.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(box, 38 if in_fanboy else 26)
	status_l = ui.label(box, "", 16 if in_fanboy else 13, c1)
	status_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(box, 18 if in_fanboy else 8)
	tip_l = ui.label(box, "", 14 if in_fanboy else 11, c2 if Data.is_fanboy_level(level) else ui.DIM)
	tip_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tip_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(box, 40)

func _seq_status() -> String:
	var lang := _lang()
	if t < 0.45:
		return "Initialisation cartouche FanBoy…" if (in_fanboy and lang == "fr") \
			else ("Initializing FanBoy cartridge…" if in_fanboy \
			else ("Analyse de l'appareil…" if lang == "fr" else "Analysing your device…"))
	if t < 2.7:
		return ("Calibrage matrice LCD · 60 i/s" if (in_fanboy and lang == "fr")
			else ("Calibrating LCD matrix · 60 fps" if in_fanboy
			else ("Mesure du rendu · Balanced" if lang == "fr" else "Measuring rendering · Balanced")))
	var chips: String = ("Appareil : FanBoy · Matrice : OK · 60 i/s" if (in_fanboy and lang == "fr")
		else ("Device : FanBoy · Matrix : OK · 60 fps" if in_fanboy
		else ("Appareil : Balanced · Réglage : Balanced · 60 i/s visés" if lang == "fr"
		else "Device : Balanced · Setting : Balanced · 60 fps target")))
	return ("Prêt.  " + chips) if lang == "fr" else ("Ready.  " + chips)

func _progress() -> float:
	if t < 0.45: return 0.05
	if t < 2.7: return 0.15 + 0.85 * (t - 0.45) / 2.25
	return 1.0

func _process(delta: float) -> void:
	t += delta
	queue_redraw()
	if status_l:
		status_l.text = _seq_status()
	if tip_l and tip_l.text == "":
		tip_l.text = _tx(0 if _lang() == "fr" else 1)
	if t >= 3.7 and not done:
		done = true
		var tw := create_tween()
		tw.tween_property(self, "modulate:a", 0.0, 0.32)
		tw.tween_callback(queue_free)

func _draw() -> void:
	var s := 0.56 if in_fanboy else 0.42
	var cx := canvas_size.x * 0.5
	var cy := canvas_size.y * (0.31 if in_fanboy else 0.384)
	var pts := [Vector2(80, 8), Vector2(142, 44), Vector2(142, 116), Vector2(80, 152), Vector2(18, 116), Vector2(18, 44)]
	var hex: Array[Vector2] = []
	for p in pts:
		hex.append(Vector2(cx, cy) + (Vector2(p.x, p.y) - Vector2(80, 80)) * s)
	var hex_bg := Color(0.08, 0.11, 0.08, 0.92) if Data.is_fanboy_level(level) else Color(0.024, 0.047, 0.11, 0.9)
	draw_colored_polygon(PackedVector2Array(hex), hex_bg)
	for i in 6:
		var a: Vector2 = hex[i]
		var b: Vector2 = hex[(i + 1) % 6]
		var u := float(i) / 6.0
		var col: Color = c1.lerp(c2, u * 2.0) if u < 0.5 else c2.lerp(c3, (u - 0.5) * 2.0)
		draw_line(a, b, col, 2.8 if in_fanboy else 2.4)
	var bw := canvas_size.x * (0.76 if in_fanboy else 0.75)
	var bx := (canvas_size.x - bw) * 0.5
	var by := canvas_size.y * (0.545 if in_fanboy else 0.547)
	var bh := 10.0 if in_fanboy else 8.0
	var bar := Rect2(bx, by, bw, bh)
	draw_rect(bar, Color(1, 1, 1, 0.12))
	var p := _progress()
	if p > 0.0:
		var steps := 24
		for i in steps:
			var u := float(i) / float(steps - 1)
			var seg := Rect2(bar.position.x + bar.size.x * p * u, bar.position.y, bar.size.x * p / float(steps) + 1.0, bar.size.y)
			var col: Color = c1.lerp(c2, u * 2.0) if u < 0.5 else c2.lerp(c3, (u - 0.5) * 2.0)
			draw_rect(seg, col)
