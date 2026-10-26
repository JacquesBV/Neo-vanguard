extends Control
## ÉCRAN DE CHARGEMENT DE SECTEUR — réplique de l'overlay nvLoad de
## 43-nv-fluid-js.js : logo hexagonal, « SECTEUR ## · machine », barre de
## progression, séquence « Analyse de l'appareil… / Mesure du rendu · <profil> /
## Prêt. » + puces (Appareil/Réglage/i-s visées) et astuce de tir. Fige la vue
## ~3,2 s comme le calibrage du navigateur, puis s'efface de lui-même.

var level := 1
var machine := "KFM-01"
var t := 0.0
var done := false
var status_l: Label = null
var tip_l: Label = null

const CYAN := Color("4cf4ff")
const VIOLET := Color("a98bff")
const PINK := Color("ff5ea8")

const TIPS := [
	["Astuce : frôler les tirs ennemis remplit la jauge de GRAZE.", "Tip: grazing enemy shots fills the GRAZE gauge."],
	["Astuce : la bombe efface tous les tirs à l'écran.", "Tip: the bomb wipes every bullet on screen."],
	["Astuce : les coins gagnés sont gardés pour la boutique.", "Tip: coins you earn are kept for the shop."],
	["Astuce : change de set de tir pour chaque type d'ennemi.", "Tip: switch weapon sets for each enemy type."],
]

func _lang() -> String:
	var l := str(Save.S.opts.get("lang", "fr"))
	return "fr" if l == "fr" else "en"

func _tx(i: int) -> String:
	return TIPS[(level + int(Time.get_unix_time_from_system() * 0.2)) % TIPS.size()][i]

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.012, 0.02, 0.05, 0.97)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var ui := UIKit
	var v := ui.vbox(self, 10, 30.0)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	ui.spacer(v, 240)
	var sec := ui.label(v, NVLang.t("SECTEUR") + "  %02d  ·  %s" % [level, machine], 15, ui.INK)
	sec.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 26)
	status_l = ui.label(v, "", 13, ui.ACC)
	status_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	# barre de progression dessinée dans _draw
	tip_l = ui.label(v, "", 11, ui.DIM)
	tip_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tip_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 40)

func _seq_status() -> String:
	var lang := _lang()
	if t < 0.45:
		return "Analyse de l'appareil…" if lang == "fr" else "Analysing your device…"
	if t < 2.7:
		return ("Mesure du rendu · Balanced" if lang == "fr" else "Measuring rendering · Balanced")
	if t < 3.3:
		var chips := ("Appareil : Balanced · Réglage : Balanced · 60 i/s visés" if lang == "fr"
			else "Device : Balanced · Setting : Balanced · 60 fps target")
		return ("Prêt.  " + chips) if lang == "fr" else ("Ready.  " + chips)
	return ("Prêt.  " + ("Appareil : Balanced · Réglage : Balanced · 60 i/s visés" if lang == "fr"
		else "Ready.  " + ("Device : Balanced · Setting : Balanced · 60 fps target")))

func _progress() -> float:
	if t < 0.45: return 0.02
	if t < 2.7: return 0.15 + 0.75 * (t - 0.45) / 2.25
	if t < 3.3: return 1.0
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
	# logo hexagonal réduit au-dessus de la barre (comme l'overlay web)
	var s := 0.42
	var cx := 240.0
	var cy := 330.0
	var pts := [Vector2(80, 8), Vector2(142, 44), Vector2(142, 116), Vector2(80, 152), Vector2(18, 116), Vector2(18, 44)]
	var hex: Array[Vector2] = []
	for p in pts:
		hex.append(Vector2(cx, cy) + (Vector2(p.x, p.y) - Vector2(80, 80)) * s)
	draw_colored_polygon(PackedVector2Array(hex), Color(0.024, 0.047, 0.11, 0.9))
	for i in 6:
		var a: Vector2 = hex[i]
		var b: Vector2 = hex[(i + 1) % 6]
		var u := float(i) / 6.0
		var col := CYAN.lerp(VIOLET, u * 2.0) if u < 0.5 else VIOLET.lerp(PINK, (u - 0.5) * 2.0)
		draw_line(a, b, col, 2.4)
	# barre de progression : piste + remplissage dégradé
	var bar := Rect2(60, 470, 360, 8)
	draw_rect(bar, Color(1, 1, 1, 0.10))
	var p := _progress()
	if p > 0.0:
		var fill := Rect2(bar.position, Vector2(bar.size.x * p, bar.size.y))
		var steps := 24
		for i in steps:
			var u := float(i) / float(steps - 1)
			var seg := Rect2(bar.position.x + bar.size.x * p * u, bar.position.y, bar.size.x * p / float(steps) + 1.0, bar.size.y)
			var col: Color
			if u < 0.5: col = CYAN.lerp(VIOLET, u * 2.0)
			else: col = VIOLET.lerp(PINK, (u - 0.5) * 2.0)
			draw_rect(seg, col)
