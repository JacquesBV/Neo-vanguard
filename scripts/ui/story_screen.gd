extends Control
## L'HISTOIRE — le prologue du jeu, page par page (◀ ▶).

var main: Node
var page := 0

const PAGES := [
	["L'ÉCLIPSE DES COULEURS",
	"Huit vestiges de consoles sacrées insufflaient la couleur et la vie à l'univers,\njusqu'à ce que l'ombre mécanique les plonge dans un silence monochrome.", ""],
	["VORAX, SEIGNEUR DE LA DÉSOLATION",
	"À la tête de son armée, VORAX ne cherche que le chaos et la destruction.\nIl a scellé les vingt-quatre secteurs pour éteindre à jamais les couleurs.",
	"res://assets/ui-art/intro/intro-vorax.webp"],
	["VESTA & LE PILOTE SANS MÉMOIRE",
	"Éveillé sans aucun souvenir à bord du chasseur Vanguard,\nle pilote entend la voix mystique de VESTA, liée à sa conscience,\net accepte sa mission sacrée.", ""],
	["8 MONDES — 24 SECTEURS",
	"Huit consoles sacrées réparties en cinq familles technologiques,\nde FanBoy à Polytron 32. Libère chaque secteur et terrasse VORAX !",
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
