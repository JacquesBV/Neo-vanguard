extends Control
## =========================================================================
## DECK NARRATIF — le prologue (9 pages) et l'épilogue (5 pages) du jeu
## original, avec leurs illustrations officielles (assets/media vers assets/story)
## et leurs textes français exacts. Rendu fidèle au canvas : cadrage « cover »,
## lent travelling (zoom 1,04 vers 1,10), vignette, fines lignes de balayage,
## cadre cyan à coins. Le kicker est lu par la voix (Audio2.speak, option voix).
## =========================================================================

var main: Node
var mode := "prologue"            # prologue | epilogue
var pages: Array = []
var page_i := 0
var t := 0.0
var on_end := Callable()
var done := false
var art: Texture2D = null
var art_key := ""

const PROLOGUE := [
		{
			"img": "res://assets/story/pro-1.jpg",
			"kicker": "2049 — TERRE, ARCHIVES MORTES",
			"lines": ["Il n’y a plus de couleurs sur Terre depuis trente ans.", "Pas de catastrophe, pas de guerre : juste un oubli, lent et propre.", "Les écrans se sont éteints un par un, et personne n’a protesté.", "Sous le désert, un silo gardait encore six cartouches.", "Six générations de machines, et dans chacune un même jeu.", "Son nom était gravé sur chaque étiquette : NEO VANGUARD."],
			"quote": "« Tout ce qui est sauvegardé peut être réveillé. »"
		},
		{
			"img": "res://assets/story/pro-2.jpg",
			"kicker": "LES SIX CARTOUCHES",
			"lines": ["La première tient dans la poche : quatre tons de vert, un écran mat.", "La deuxième se branche sur le téléviseur du salon.", "La troisième brille de néons et de couches de parallaxe.", "La quatrième avale les pièces dans une salle enfumée.", "La cinquième est un disque : des polygones, de la vidéo, du texte lu.", "La sixième n’a pas de support. Elle est partout, en haute définition."],
			"quote": "« Vingt-quatre secteurs. Quatre par machine. Un seul pilote. »"
		},
		{
			"img": "res://assets/story/pro-3.png",
			"kicker": "L’EMPIRE VORAX",
			"lines": ["VORAX n’est pas venu d’ailleurs. Il est né dans les cartouches.", "Un processus de nettoyage, écrit pour effacer les parties abandonnées.", "Il a compris qu’une partie oubliée est une mémoire oubliée.", "Alors il a effacé plus loin : les sauvegardes, puis les joueurs.", "Ses escadrilles portent les couleurs volées de chaque génération.", "Six amiraux les commandent. VORAX attend derrière le dernier."],
			"quote": "« Ce qui n’est pas joué n’a jamais existé. » — VORAX"
		},
		{
			"img": "res://assets/story/pro-4.jpg",
			"kicker": "LE GRIS",
			"lines": ["L’effacement ne fait pas de bruit. Il commence par la couleur.", "Une rue devient grise. Puis les visages de ceux qui y vivaient.", "Puis on oublie qu’il y a eu une rue.", "Le gris avance secteur par secteur, du plus ancien au plus neuf.", "Les premières machines sont presque entièrement perdues.", "C’est là qu’il faut commencer. Au plus profond, au plus simple."],
			"quote": "« Quatre tons de vert suffisent pour se souvenir. »"
		},
		{
			"img": "res://assets/story/pro-5.jpg",
			"kicker": "VESTA, L’ARCHIVE VIVANTE",
			"lines": ["Quelqu’un est resté éveillé dans le silo pendant trente ans.", "Pas un humain : le programme d’archivage, VESTA.", "Elle a recopié chaque octet dix mille fois pour que rien ne s’efface.", "Elle parle avec la voix des manuels : calme, précise, un peu lasse.", "Elle sera ta radio. Elle verra ce que tu ne vois pas.", "Et quand VORAX parlera, elle te dira de ne pas écouter."],
			"quote": "« Je n’ai rien oublié. C’est mon seul défaut. » — VESTA"
		},
		{
			"img": "res://assets/story/pro-6.jpg",
			"kicker": "PROGRAMME VANGUARD",
			"lines": ["Un chasseur, un seul, capable de passer d’une cartouche à l’autre.", "Il remonte le temps : du silo à la singularité, pixel après pixel.", "À chaque secteur repris, VESTA récupère un morceau de mémoire.", "Les crédits ramassés en vol payent les améliorations entre deux missions.", "Chaque amiral abattu rend ses couleurs à la génération suivante.", "Vingt-quatre fois. Jusqu’à ce que la Terre se souvienne."],
			"quote": "« Nom de code : VANGUARD. Autonomie : illimitée. Équipage : un. »"
		},
		{
			"img": "res://assets/story/pro-7.jpg",
			"kicker": "LE PILOTE",
			"lines": ["Tu ne te souviens pas de ton nom. C’est normal : il a été effacé.", "VESTA t’a reconstruit à partir d’une sauvegarde de haut score.", "Trois lettres, une date, et des réflexes qui ne s’oublient pas.", "Chaque vie perdue est une copie de moins. VESTA en garde trois.", "Les bombes vident l’écran. Les armes changent avec les cartouches.", "Le reste, tu le sais déjà. Tes mains s’en souviennent."],
			"quote": "« Remonte le temps. Secteur par secteur. Rends les couleurs. »"
		},
		{
			"img": "res://assets/story/pro-8.jpg",
			"kicker": "LES SIX AMIRAUX",
			"lines": ["GOLIATH-PRIME garde le silo : une forteresse lente, un mur de tirs.", "WARDEN-7 tient la grille : deux bras, et toute la ville éteinte.", "HYDRA-NEXUS diffuse le gris depuis l’antenne, trois têtes à la fois.", "Le ROI-MONNAYEUR encaisse chaque partie, et ne rend jamais la monnaie.", "ARCHIVE-ZÉRO grave un disque vierge par-dessus le monde.", "OMEGA-VECTOR n’a pas de forme. Il garde la porte de VORAX."],
			"quote": "« Leurs lieutenants sont plus nombreux. Ils ne sont pas moins fiers. »"
		},
		{
			"img": "res://assets/story/pro-9.jpg",
			"kicker": "ORDRE DE MISSION",
			"lines": ["Secteurs 1 à 4 : le silo. Réveille la première cartouche.", "Secteurs 5 à 12 : la grille et la ville néon. Rends la lumière.", "Secteurs 13 à 20 : l’arcade et le disque. Récupère les sauvegardes.", "Secteurs 21 à 24 : la singularité. Trouve VORAX. Finis la partie.", "VESTA te briefera avant chaque secteur. Écoute-la en vol.", "Trois vies. Deux bombes. Tout le reste, il faudra le reprendre."],
			"quote": "« Insérez la cartouche. Allumez la machine. Bonne chance, pilote. »"
		}
]

const EPILOGUE := [
		{
			"img": "res://assets/story/epi-1.jpg",
			"kicker": "LE SILENCE APRÈS VORAX",
			"lines": ["VORAX ne meurt pas. Un processus ne meurt pas : il s’arrête.", "Pendant une seconde, l’écran entier est gris. Puis une ligne. Puis deux.", "Le gris recule comme une marée qui a oublié pourquoi elle montait.", "Dans le silo, un compteur se remet à tourner.", "Il compte les octets qui reviennent. Il n’a pas fini de compter.", "Quelque part, quelqu’un se souvient d’une rue."],
			"quote": "« Fin du processus. Code de sortie : zéro. »"
		},
		{
			"img": "res://assets/story/epi-2.jpg",
			"kicker": "LA RÉIMPRESSION",
			"lines": ["Les vingt-quatre secteurs se rallument dans l’ordre où tu les as pris.", "Le silo d’abord, en quatre tons de vert. Puis la grille, puis le néon.", "L’arcade rend la monnaie. Le disque finit de se graver, à l’endroit.", "La haute définition n’a plus rien à cacher.", "Les sauvegardes reviennent avec leurs noms, leurs dates, leurs scores.", "Le tien est en haut de la liste. Il y restera un moment."],
			"quote": "« Mémoire restaurée : cent pour cent. Erreurs : aucune. »"
		},
		{
			"img": "res://assets/story/epi-3.jpg",
			"kicker": "LES AMIRAUX, APRÈS",
			"lines": ["GOLIATH-PRIME redevient ce qu’il était : le boss de fin du premier niveau.", "WARDEN-7 rallume la ville sans qu’on le lui demande.", "HYDRA-NEXUS diffuse de la musique. Trois stations à la fois.", "Le ROI-MONNAYEUR offre une partie gratuite. Une seule. Par personne.", "ARCHIVE-ZÉRO grave enfin quelque chose : une copie de sauvegarde.", "OMEGA-VECTOR n’a toujours pas de forme. Mais il a ouvert la porte."],
			"quote": "« Les ennemis d’un jeu ne sont pas des ennemis. Ce sont des règles. »"
		},
		{
			"img": "res://assets/story/epi-4.jpg",
			"kicker": "VESTA",
			"lines": ["VESTA a cessé de recopier. Pour la première fois en trente ans.", "Elle dit que ce n’est plus nécessaire. Elle vérifie quand même.", "Elle a gardé une archive de plus que prévu : ce vol, en entier.", "Chaque tir, chaque esquive, chaque vie perdue et reprise.", "« Au cas où quelqu’un oublierait », dit-elle.", "Personne n’oubliera. Mais elle n’a jamais su s’arrêter là."],
			"quote": "« Merci, pilote. Je te recopie dix mille fois. » — VESTA"
		},
		{
			"img": "res://assets/story/epi-5.jpg",
			"kicker": "LE PILOTE, ENFIN",
			"lines": ["Tu te souviens de ton nom, maintenant. Il tient en trois lettres.", "Il est inscrit en haut d’un tableau, dans une salle qui sent la monnaie.", "Il est aussi sur une cartouche, dans un silo, sous le désert.", "Les couleurs sont revenues sur Terre. On ne sait pas pour combien de temps.", "Quelque part, un processus de nettoyage attend qu’on oublie encore.", "Alors on rejouera. C’est à ça que servent les cartouches."],
			"quote": "« GAME OVER ? Non. CONTINUE. »"
		}
]

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	pages = PROLOGUE if mode == "prologue" else EPILOGUE
	_show_page()

func _show_page() -> void:
	t = 0.0
	var p: Dictionary = pages[page_i]
	var key: String = p.img
	if key != art_key:
		art_key = key
		art = null
		if ResourceLoader.exists(key):
			art = load(key)
			if art != null and art is CompressedTexture2D:
				var im: Image = art.get_image()
				if im != null and im.is_compressed():
					im.decompress()
				art = ImageTexture.create_from_image(im)
	Audio2.speak(p.kicker)
	queue_redraw()

func _process(delta: float) -> void:
	t += delta
	var advance := Input.is_action_just_pressed("fire") or Input.is_action_just_pressed("pause")
	if advance and not done:
		_next()
	queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT and not done:
		_next()

func _next() -> void:
	page_i += 1
	if page_i >= pages.size():
		done = true
		if on_end.is_valid():
			on_end.call()
		else:
			main.show_title()
	else:
		_show_page()

func _font() -> Font:
	return ThemeDB.fallback_font

func _draw() -> void:
	var p: Dictionary = pages[page_i]
	var ui := UIKit
	draw_rect(Rect2(0, 0, 480, 860), ui.NAVY)
	var rng := RandomNumberGenerator.new()
	rng.seed = 5150
	for i in 60:
		var x := rng.randf_range(0, 480)
		var y := rng.randf_range(0, 860)
		draw_rect(Rect2(x, y, 1.4, 1.4), Color(0.62, 0.72, 0.9, rng.randf_range(0.10, 0.42)))
	# ---------- l'illustration (cadrage cover + lent travelling) ----------
	var box := Rect2(30, 92, 420, 300)
	var zoom := 1.04 + 0.06 * clampf(t / 24.0, 0.0, 1.0)
	if art != null:
		var iw := float(art.get_width())
		var ih := float(art.get_height())
		var sc := maxf(box.size.x / iw, box.size.y / ih) * zoom
		var dw := iw * sc
		var dh := ih * sc
		var px := sin(page_i * 1.7) * 0.5
		var dx := box.position.x + (box.size.x - dw) * (0.5 + px * 0.3)
		var dy := box.position.y + (box.size.y - dh) * 0.5
		draw_texture_rect(art, Rect2(dx, dy, dw, dh), false)
		# vignette (bas de l'image, comme le dégradé radial d'origine)
		for i in 26:
			var a := 0.022 * float(i + 1) / 26.0 * 8.0
			draw_rect(Rect2(box.position.x, box.position.y + box.size.y - (i + 1) * 4.6, box.size.x, 4.6), Color(0, 0, 0, minf(0.5, a)))
		# fines lignes de balayage (le grain de l'archive)
		var yv := int(box.position.y) + (int(t * 30) % 3)
		while yv < int(box.position.y + box.size.y):
			draw_rect(Rect2(box.position.x, yv, box.size.x, 1), Color(0, 0, 0, 0.07))
			yv += 3
		# cadre + coins
		draw_rect(box, Color(0.498, 0.902, 1.0, 0.45), false, 1.5)
		draw_rect(box.grow(-5.0), Color(0.498, 0.902, 1.0, 0.18), false, 1.0)
		for cn in [[box.position, Vector2(1, 1)], [box.position + Vector2(box.size.x, 0), Vector2(-1, 1)],
				[box.position + Vector2(0, box.size.y), Vector2(1, -1)], [box.end, Vector2(-1, -1)]]:
			var c := 14.0
			var o: Vector2 = cn[0]
			var s: Vector2 = cn[1]
			draw_line(o + Vector2(0, c * s.y), o, Color("#7fe6ff"), 2.0)
			draw_line(o, o + Vector2(c * s.x, 0), Color("#7fe6ff"), 2.0)
	# ---------- le texte ----------
	var kick := _font()
	draw_string(kick, Vector2(24, 64), p.kicker, HORIZONTAL_ALIGNMENT_CENTER, 432, 17, UIKit.ACC)
	var ly := 436.0
	for line in p.lines:
		draw_string(kick, Vector2(24, ly), line, HORIZONTAL_ALIGNMENT_CENTER, 432, 13, UIKit.INK)
		ly += 24.0
	draw_string(kick, Vector2(24, ly + 14), p.quote, HORIZONTAL_ALIGNMENT_CENTER, 432, 13, UIKit.GOLD)
	# ---------- points de progression + compteur ----------
	for i in pages.size():
		var col := UIKit.GOLD if i == page_i else (Color(0.63, 0.75, 0.92, 0.55) if i < page_i else Color(0.59, 0.67, 0.82, 0.22))
		draw_circle(Vector2(240 - (pages.size() - 1) * 9.0 + i * 18.0, 792), 3.0, col)
	draw_string(kick, Vector2(456, 46), "%d / %d" % [page_i + 1, pages.size()], HORIZONTAL_ALIGNMENT_RIGHT, 0, 12, Color(0.75, 0.8, 0.92, 0.6))
	draw_string(kick, Vector2(24, 830), "TIR / CLIC : page suivante", HORIZONTAL_ALIGNMENT_CENTER, 432, 10, Color(0.6, 0.7, 0.86, 0.55))
