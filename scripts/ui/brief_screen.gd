extends Control
## L'APPROCHE DU SECTEUR — l'écran de briefing d'origine.
## T13 : affiche l'illustration OFFICIELLE du secteur (assets/media/briefings
## du jeu original → res://assets/ui-art/briefings/secteur-nn.webp), qui
## remplace la jaquette procédurale. Sous l'image : la machine de l'ère et
## son support (cartouche ou disque). 6 secondes (BOX_DUR), passable au tir.

var main: Node
var level := 1
static var _art_cache := {}
var t := 0.0
var done := false
var stars_bg: Array = []

func _ready() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = level * 331 + 7
	for i in 40:
		stars_bg.append({ "x": rng.randf_range(0, 480), "y": rng.randf_range(0, 860), "s": rng.randf_range(0.5, 1.8) })

func _process(delta: float) -> void:
	t += delta
	if (t > Data.BOX_DUR or Input.is_action_just_pressed("fire") or Input.is_action_just_pressed("pause")) and not done:
		done = true
		main.launch_level()
		return
	queue_redraw()

func _font() -> Font:
	return ThemeDB.fallback_font

func _draw() -> void:
	var art_path := "res://assets/ui-art/briefings/secteur-%02d.webp" % maxi(1, level)
	var art: Texture2D = null
	if _art_cache.has(level):
		art = _art_cache[level]
	elif ResourceLoader.exists(art_path):
		art = load(art_path)
		_art_cache[level] = art
	var era := Data.era_of_level(level)
	var acc := Color("#38e0ff")

	# fond du salon + poussières
	draw_rect(Rect2(0, 0, 480, 860), Color("#04060c"))
	for st in stars_bg:
		draw_rect(Rect2(st.x, st.y, st.s, st.s), Color(1, 1, 1, 0.14))
	draw_string(_font(), Vector2(0, 64), "APPROCHE DU SECTEUR", HORIZONTAL_ALIGNMENT_CENTER, 480, 13, Color("#9fb0c2"))

	# ---------- l'illustration officielle du secteur ----------
	if art != null:
		var aw := 448.0
		var ah := aw * art.get_height() / art.get_width()
		var ay := 92.0
		draw_texture_rect(art, Rect2(16, ay, aw, ah), false)
		draw_rect(Rect2(16, ay, aw, ah), Color(acc.r, acc.g, acc.b, 0.28), false, 1.0)

	# ---------- l'hologramme de la console inventée du monde ----------
	var con: Dictionary = Data.console_of_level(level)
	var con_col := Color(str(con.color))
	var sy2 := 396.0
	var hdr_txt := "MONDE %d / 8  ·  %s  —  %s" % [int(con.world), str(con.name).to_upper(), str(con.tag)]
	draw_string(_font(), Vector2(0, sy2 - 10), hdr_txt, HORIZONTAL_ALIGNMENT_CENTER, 480, 12, con_col)
	var holo_tex := NVIntroAssets.tex(str(con.holo))
	if holo_tex != null:
		var h_sz := 184.0
		var hx := (480.0 - h_sz) * 0.5
		draw_circle(Vector2(240.0, sy2 + h_sz * 0.48), h_sz * 0.34, Color(con_col.r, con_col.g, con_col.b, 0.12))
		draw_texture_rect(holo_tex, Rect2(hx, sy2, h_sz, h_sz), false)
	elif era <= 3:
		draw_rect(Rect2(180, sy2, 120, 46), Color("#2a3040"))
		draw_rect(Rect2(180, sy2, 120, 46), Color("#3d465c"), false, 2.0)
		for i in 5:
			draw_rect(Rect2(192 + i * 22, sy2 + 8, 12, 30), Color("#1d2230"))
		draw_rect(Rect2(200, sy2 + 14, 80, 18), Color("#0c1018"))
	else:
		draw_circle(Vector2(240, sy2 + 23), 29, Color("#cfd9e8"))
		draw_circle(Vector2(240, sy2 + 23), 21, Color("#8d9ec7"))
		draw_circle(Vector2(240, sy2 + 23), 8, Color("#04060c"))
		draw_arc(Vector2(240, sy2 + 23), 29, 0, TAU, 32, acc, 1.5)

	# ---------- bouton ----------
	if t > 0.9 and fmod(t, 0.9) < 0.55:
		draw_string(_font(), Vector2(0, 608), "TIR / ENTRÉE : décoller", HORIZONTAL_ALIGNMENT_CENTER, 480, 14, Color("#eaf6ff"))
