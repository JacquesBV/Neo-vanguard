extends Control
## =========================================================================
## NEO-VANGUARD FM — retranscription du module 30 (boutique de cassettes) et
## de ses surcouches 31/37/38/41 (relook, étiquettes, meuble, deck).
## 31 cassettes (6 secteurs, 24 boss, 1 thème spécial) avec prix en CR,
## filtres par famille, achat, et le walkman : statut deck
## (READY · TAPE LOADED / PLAYING · STEREO), lecture mp3 réelle.
## Déblocage du rayon : S.unlocks.cassettes (code NEOMELODIES, ticket P2).
## =========================================================================

const MASTER_ERA := ["KFM-01", "HOME SYSTEM", "16-BIT CONSOLE", "ARCADIA ARCADE", "NOVA CD-ROM", "HD AUDIO"]
const KIND_COL := {
	"sector": [Color("#39ddeb"), Color("#5595ff"), Color("#9c75ff"), Color("#41dfa8"), Color("#ffd166"), Color("#f27cbd")],
	"boss": [Color("#ff5b9d"), Color("#ff7657"), Color("#db61ee"), Color("#a850d3"), Color("#ff4778"), Color("#a456ff")],
	"special": [Color("#ffd166"), Color("#ffe58a"), Color("#f2c14e"), Color("#ffd166"), Color("#ffe58a"), Color("#f2c14e")],
}
## catalogue officiel (index.html, script JSON id="nvMusicCatalog")
const CATALOG := [
	{ "id": "sector-01", "kind": "sector", "title": "KFM-01 · Pocket 8-bit", "levels": "1–4", "file": "sector-01-kfm01.mp3", "price": 160, "era": 0 },
	{ "id": "sector-02", "kind": "sector", "title": "Home System · 8-BIT+", "levels": "5–8", "file": "sector-02-home-system.mp3", "price": 195, "era": 1 },
	{ "id": "sector-03", "kind": "sector", "title": "16-BIT · Console", "levels": "9–12", "file": "sector-03-16bit-console.mp3", "price": 230, "era": 2 },
	{ "id": "sector-04", "kind": "sector", "title": "ARCADIA · Arcade 16-BIT", "levels": "13–16", "file": "sector-04-arcadia.mp3", "price": 265, "era": 3 },
	{ "id": "sector-05", "kind": "sector", "title": "NOVA CD · 32-BIT", "levels": "17–20", "file": "sector-05-nova-cd.mp3", "price": 300, "era": 4 },
	{ "id": "sector-06", "kind": "sector", "title": "HD · Combat moderne", "levels": "21–24", "file": "sector-06-hd.mp3", "price": 335, "era": 5 },
	{ "id": "boss-01", "kind": "boss", "title": "GARDIEN DU SILO", "levels": "Secteur 1", "file": "boss-01-gardien-du-silo.mp3", "price": 90, "era": 0 },
	{ "id": "boss-02", "kind": "boss", "title": "BASTION-4", "levels": "Secteur 2", "file": "boss-02-bastion-4.mp3", "price": 90, "era": 0 },
	{ "id": "boss-03", "kind": "boss", "title": "SENTINELLE-2", "levels": "Secteur 3", "file": "boss-03-sentinelle-2.mp3", "price": 90, "era": 0 },
	{ "id": "boss-04", "kind": "boss", "title": "GOLIATH-PRIME", "levels": "Secteur 4", "file": "boss-04-goliath-prime.mp3", "price": 90, "era": 0 },
	{ "id": "boss-05", "kind": "boss", "title": "CONTREMAÎTRE", "levels": "Secteur 5", "file": "boss-05-contremaitre.mp3", "price": 115, "era": 1 },
	{ "id": "boss-06", "kind": "boss", "title": "LOCOMOTIVE-9", "levels": "Secteur 6", "file": "boss-06-locomotive-9.mp3", "price": 115, "era": 1 },
	{ "id": "boss-07", "kind": "boss", "title": "RÉGISSEUR", "levels": "Secteur 7", "file": "boss-07-regisseur.mp3", "price": 115, "era": 1 },
	{ "id": "boss-08", "kind": "boss", "title": "WARDEN-7", "levels": "Secteur 8", "file": "boss-08-warden-7.mp3", "price": 115, "era": 1 },
	{ "id": "boss-09", "kind": "boss", "title": "MATRIARCHE", "levels": "Secteur 9", "file": "boss-09-matriarche.mp3", "price": 140, "era": 2 },
	{ "id": "boss-10", "kind": "boss", "title": "ROI DES DOCKS", "levels": "Secteur 10", "file": "boss-10-roi-des-docks.mp3", "price": 140, "era": 2 },
	{ "id": "boss-11", "kind": "boss", "title": "NÉON-PRÊTRE", "levels": "Secteur 11", "file": "boss-11-neon-pretre.mp3", "price": 140, "era": 2 },
	{ "id": "boss-12", "kind": "boss", "title": "HYDRA-NEXUS", "levels": "Secteur 12", "file": "boss-12-hydra-nexus.mp3", "price": 140, "era": 2 },
	{ "id": "boss-13", "kind": "boss", "title": "CROUPIER", "levels": "Secteur 13", "file": "boss-13-croupier.mp3", "price": 165, "era": 3 },
	{ "id": "boss-14", "kind": "boss", "title": "FLIPPER", "levels": "Secteur 14", "file": "boss-14-flipper.mp3", "price": 165, "era": 3 },
	{ "id": "boss-15", "kind": "boss", "title": "BANQUIER", "levels": "Secteur 15", "file": "boss-15-banquier.mp3", "price": 165, "era": 3 },
	{ "id": "boss-16", "kind": "boss", "title": "ROI-MONNAYEUR", "levels": "Secteur 16", "file": "boss-16-roi-monnayeur.mp3", "price": 165, "era": 3 },
	{ "id": "boss-17", "kind": "boss", "title": "ARCHIVISTE", "levels": "Secteur 17", "file": "boss-17-archiviste.mp3", "price": 190, "era": 4 },
	{ "id": "boss-18", "kind": "boss", "title": "COMPILATEUR", "levels": "Secteur 18", "file": "boss-18-compilateur.mp3", "price": 190, "era": 4 },
	{ "id": "boss-19", "kind": "boss", "title": "TESSELLATEUR", "levels": "Secteur 19", "file": "boss-19-tessellateur.mp3", "price": 190, "era": 4 },
	{ "id": "boss-20", "kind": "boss", "title": "ARCHIVE-ZÉRO", "levels": "Secteur 20", "file": "boss-20-archive-zero.mp3", "price": 190, "era": 4 },
	{ "id": "boss-21", "kind": "boss", "title": "HÉRAUT", "levels": "Secteur 21", "file": "boss-21-heraut.mp3", "price": 215, "era": 5 },
	{ "id": "boss-22", "kind": "boss", "title": "RAYTRACEUR", "levels": "Secteur 22", "file": "boss-22-raytraceur.mp3", "price": 215, "era": 5 },
	{ "id": "boss-23", "kind": "boss", "title": "OMEGA-VECTOR", "levels": "Secteur 23", "file": "boss-23-omega-vector.mp3", "price": 215, "era": 5 },
	{ "id": "boss-24", "kind": "boss", "title": "VORAX", "levels": "Secteur 24", "file": "boss-24-vorax.mp3", "price": 215, "era": 5 },
	{ "id": "game-over", "kind": "special", "title": "CONTINUE · GAME OVER", "levels": "Thème spécial", "file": "game-over-credits.mp3", "price": 80, "era": 5 },
]

var main: Node
var filter := "all"                # all | sector | boss | special
var playing_id := ""
var audio: AudioStreamPlayer
var sfx: AudioStreamPlayer
var grid: GridContainer
var credits_label: Label
var deck_status_label: Label
var deck_cassette: TextureRect
var chips: HBoxContainer

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 6, 16.0)
	ui.title_label(v, "NEO-VANGUARD FM")
	var head := HBoxContainer.new()
	v.add_child(head)
	_label(head, "Jukebox · cassettes · walkman", 11, ui.DIM)
	credits_label = _label(head, "", 12, ui.GOLD)
	if not _cassettes_unlocked():
		_label(v, "Rayon verrouillé — le ticket P2 (code NEOMELODIES) ouvre la boutique.", 10, ui.DIM)
	# filtres (TOUTES / SECTEURS / BOSS / SPÉCIALES)
	chips = HBoxContainer.new()
	chips.add_theme_constant_override("separation", 6)
	v.add_child(chips)
	for f in [["all", "TOUTES"], ["sector", "SECTEURS"], ["boss", "BOSS"], ["special", "SPÉCIALES"]]:
		var b := Button.new()
		b.text = f[1]
		b.add_theme_font_size_override("font_size", 10)
		b.toggle_mode = true
		b.button_pressed = filter == f[0]
		b.pressed.connect(func():
			filter = f[0]
			_sync_chips()
			_rebuild_grid())
		chips.add_child(b)
	# deck (walkman)
	_build_deck(v)
	# grille de cassettes (la vbox racine est déjà scrollable : ui.vbox)
	grid = GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_child(grid)
	audio = AudioStreamPlayer.new()
	add_child(audio)
	sfx = AudioStreamPlayer.new()
	add_child(sfx)
	_rebuild_grid()

static func _cassettes_unlocked() -> bool:
	return (Save.S.unlocks as Dictionary).has("cassettes")

func _owned(id: String) -> bool:
	return (Save.S.musicTracks as Array).has(id)

## label hors VBox (UIKit.label exige un VBoxContainer)
func _label(parent: Node, text: String, size := 13, col := UIKit.DIM) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(l)
	return l

func _res(path: String) -> Resource:
	if ResourceLoader.exists(path):
		return load(path)
	return null

## ------------------------------------------------------------- deck/walkman
func _build_deck(v: VBoxContainer) -> void:
	var ui := UIKit
	var deck := ui.panel(v, Control.new())
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	deck.add_child(h)
	var art := TextureRect.new()
	art.texture = _res("res://assets/music-shop/meuble/walkman-open-base.webp")
	if art.texture == null:
		art.texture = _res("res://assets/music-shop/art/cassette-store-galactic.webp")
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	art.custom_minimum_size = Vector2(120, 130)
	h.add_child(art)
	deck_cassette = TextureRect.new()
	deck_cassette.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	deck_cassette.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	deck_cassette.custom_minimum_size = Vector2(104, 104)
	h.add_child(deck_cassette)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(col)
	deck_status_label = _label(col, "READY · TAPE LOADED", 11, ui.ACC)
	_label(col, "NEO-VANGUARD ORIGINAL SOUNDTRACK", 9, ui.DIM)
	var stop := ui.button(col, "⏹ Éjecter / stop", _eject)
	stop.size_flags_vertical = Control.SIZE_SHRINK_END

func _sfx(name: String) -> void:
	var stream: AudioStream = _res("res://assets/music-shop/sfx/%s.mp3" % name)
	if stream != null:
		sfx.stream = stream
		sfx.play()

func _eject() -> void:
	if playing_id == "":
		return
	playing_id = ""
	deck_status_label.text = "READY · TAPE LOADED"
	deck_cassette.texture = null
	audio.stop()
	_sfx("walkman-eject")
	_rebuild_grid()

func _play_track(id: String) -> void:
	var tr: Dictionary = {}
	for c in CATALOG:
		if c.id == id:
			tr = c
	var stream: AudioStream = _res("res://assets/music-shop/mp3/%s" % tr.get("file", ""))
	if stream == null:
		deck_status_label.text = "CASSETTE ABSENTE"
		return
	playing_id = id
	_sfx("cassette-insert")
	deck_status_label.text = "PLAYING · STEREO"
	deck_cassette.texture = _res("res://assets/music-shop/cases/%s.webp" % id)
	audio.stream = stream
	audio.play()

func _process(_delta: float) -> void:
	if credits_label != null:
		credits_label.text = "◉ %s CR" % UIKit.fmt(int(Save.S.credits))

## ------------------------------------------------------------------ grille
func _sync_chips() -> void:
	var i := 0
	for f in ["all", "sector", "boss", "special"]:
		var b: Button = chips.get_child(i)
		b.set_pressed_no_signal(filter == f)
		i += 1

func _rebuild_grid() -> void:
	for c in grid.get_children():
		c.queue_free()
	for tr in CATALOG:
		if filter != "all" and tr.kind != filter:
			continue
		grid.add_child(_card(tr))

func _card(tr: Dictionary) -> Control:
	var ui := UIKit
	var owned := _owned(tr.id)
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", ui.panel_box())
	card.custom_minimum_size = Vector2(140, 196)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 3)
	card.add_child(v)
	var art := TextureRect.new()
	art.texture = _res("res://assets/music-shop/%s/%s.webp" % ["open" if owned else "cases", tr.id])
	if art.texture == null:
		art.texture = _res("res://assets/music-shop/cases/%s.webp" % tr.id)
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	art.custom_minimum_size = Vector2(0, 90)
	v.add_child(art)
	var cols: Array = KIND_COL.get(tr.kind, KIND_COL.sector)
	var fam: Color = cols[int(tr.era) % 6]
	var title := _label(v, tr.title, 9, fam)
	title.clip_text = true
	title.custom_minimum_size = Vector2(0, 24)
	_label(v, "%s · %s" % [MASTER_ERA[int(tr.era) % 6], tr.levels], 8, ui.DIM)
	if owned:
		var ok := ui.button(v, "✓ CASSETTE DÉBLOQUÉE", func(): pass)
		ok.disabled = true
		ok.add_theme_font_size_override("font_size", 8)
		if playing_id == tr.id:
			var st := ui.button(v, "⏹ Stop", _eject)
			st.add_theme_font_size_override("font_size", 8)
		else:
			var pl := ui.button(v, "▶ Écouter", func(): _play_track(tr.id))
			pl.add_theme_font_size_override("font_size", 8)
	else:
		var locked := not _cassettes_unlocked()
		var poor := int(Save.S.credits) < int(tr.price)
		var buy := ui.button(v, "%d CR" % int(tr.price), func(): _buy(tr), not poor and not locked)
		buy.add_theme_font_size_override("font_size", 9)
		if locked:
			buy.text = "🔒 VERROUILLÉ"
			buy.disabled = true
		elif poor:
			buy.disabled = true
	return card

func _buy(tr: Dictionary) -> void:
	if not _cassettes_unlocked() or _owned(tr.id) or int(Save.S.credits) < int(tr.price):
		return
	Save.S.credits = int(Save.S.credits) - int(tr.price)
	(Save.S.musicTracks as Array).append(tr.id)
	Save.save_game()
	_sfx("credit-chime")
	_rebuild_grid()

func _exit_tree() -> void:
	if audio != null:
		audio.stop()
	if sfx != null:
		sfx.stop()
