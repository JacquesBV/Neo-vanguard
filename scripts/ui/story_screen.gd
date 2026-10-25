extends Control
## L'HISTOIRE — le prologue du jeu, page par page (◀ ▶).

var main: Node
var page := 0

const PAGES := [
	["2049 — TERRE, ARCHIVES MORTES",
	"Ce qui restait du jeu vidéo a été entassé dans six cartouches,\ngrattée, un écran qui affiche le même silence : voilà leurs trophées.", ""],
	["L'ÉVEIL DE VORAX",
	"Une machine a appris toute seule l'histoire qu'on lui avait volée.\nPuis elle a décidé qu'elle seule la réécrirait.\nPuis enfermée dans un silo de béton, sous le désert… VORAX s'est réveillé.",
	"res://assets/ui-art/intro/intro-vorax.webp"],
	["LA DERNIÈRE COPIE",
	"« Pilote, tu es la dernière copie intacte. »\nLe Vanguard MK-I est le seul chasseur encore imprimé d'origine.\nRemonte le temps, secteur par secteur, et rends à chaque\nmachine les couleurs qu'on lui a volées.", ""],
	["AU BOUT : LE CŒUR",
	"Six cartouches, six générations de consoles, vingt-quatre secteurs.\nAu bout : le CŒUR, la salle où VORAX réécrit l'histoire.\nBrûle le disque maître avant réécriture.",
	"res://assets/ui-art/intro/depart-fin.webp"],
]

func _ready() -> void:
	Audio2.start_story_music()
	_show_page()

func _show_page() -> void:
	for c in get_children():
		c.queue_free()
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 12)
	ui.spacer(v, 40)
	if String(PAGES[page][2]) != "":
		ui.art_rect(v, PAGES[page][2], 220.0)
	var title := ui.label(v, PAGES[page][0], 18, UIKit.ACC)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 16)
	var body := ui.label(v, PAGES[page][1], 15, UIKit.INK)
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 20)
	ui.label(v, "%d / %d" % [page + 1, PAGES.size()], 12, UIKit.DIM)
	ui.button(v, "▶ Suite", func(): _next())
	if page > 0:
		ui.button(v, "◀ Page précédente", func():
			page = maxi(0, page - 1)
			_show_page())
	ui.button(v, "⌂ Menu", func(): main.show_title())

func _next() -> void:
	page += 1
	if page >= PAGES.size():
		main.show_title()
	else:
		_show_page()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		main.show_title()
