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
			"kicker": "L'ÉCLIPSE DES COULEURS",
			"lines": [
				"Autrefois, huit vestiges de consoles sacrées veillaient sur l'univers.",
				"De leurs circuits jaillissaient la couleur, la musique et la vie.",
				"Mais une ombre froide s'étend désormais d'orbite en orbite.",
				"Partout où elle passe, les mondes basculent dans le gris et le silence.",
				"Huit mondes menacés d'extinction, vingt-quatre secteurs sous scellés.",
				"Un seul chasseur porte encore l'emblème : NEO VANGUARD."
			],
			"quote": "« Tant qu'une lueur subsiste, la vie peut renaître. »"
		},
		{
			"img": "res://assets/story/pro-2.jpg",
			"kicker": "8 MONDES — 24 SECTEURS",
			"lines": [
				"Cinq familles technologiques unissent les huit consoles sacrées :",
				"FanBoy en portable 8 bits, FanBoy Adventure en portable 32 bits,",
				"NEXUS 8 et Masterion 8 pour les consoles de salon 8 bits,",
				"NEXUS 16, MegaStorm 16 et Arcadion HCS pour la famille 16 bits,",
				"jusqu'au sanctuaire optique 32 bits de Polytron 32.",
				"Trois secteurs par monde : vingt-quatre champs de bataille."
			],
			"quote": "« Huit mondes. Vingt-quatre secteurs. Cinq familles technologiques. »"
		},
		{
			"img": "res://assets/story/pro-3.png",
			"kicker": "VORAX, SEIGNEUR DU CHAOS",
			"lines": [
				"À la tête d'une armée mécanique sans pitié marche VORAX.",
				"Il méprise la vie, la mémoire et l'éclat des couleurs.",
				"Son unique dessein : plonger l'univers dans le chaos et la désolation.",
				"S'il détruit les huit consoles sacrées, tout restera terne à jamais.",
				"Vingt-quatre gardiens d'acier exécutent déjà ses ordres.",
				"Et au bout du vingt-quatrième secteur, VORAX attend en personne."
			],
			"quote": "« Plus de couleurs, plus d'espoir : seul régnera le néant ! » — VORAX"
		},
		{
			"img": "res://assets/story/pro-4.jpg",
			"kicker": "UN MONDE SANS COULEURS",
			"lines": [
				"La désolation ne commence pas par le feu, mais par la pâleur.",
				"Les néons s'éteignent, les mélodies se brisent, les étoiles pâlissent.",
				"Sans les vestiges sacrés, l'univers perd son âme fragment par fragment.",
				"Il faut reprendre la route depuis l'origine même du signal :",
				"les quatre nuances d'émeraude du premier monde, FanBoy.",
				"C'est là, au Secteur 1, que commence la reconquête."
			],
			"quote": "« Quatre nuances suffisent pour rallumer l'univers. »"
		},
		{
			"img": "res://assets/story/pro-5.jpg",
			"kicker": "VESTA, LA CONSCIENCE MYSTIQUE",
			"lines": [
				"Dans le silence orbital s'élève une présence lumineuse : VESTA.",
				"Sous les traits d'une femme mystique, sa conscience veille.",
				"Un lien invisible et profond l'unit directement à ton esprit.",
				"Sa voix calme traverse le brouillard et te montre la trajectoire.",
				"Elle connaît chacun des huit mondes et la faille de chaque gardien.",
				"Quand la tempête de VORAX gronde, sa lumière reste ton phare."
			],
			"quote": "« Je suis Vesta, liée à ta conscience au-delà de l'oubli. » — VESTA"
		},
		{
			"img": "res://assets/story/pro-6.jpg",
			"kicker": "LE PILOTE SANS MÉMOIRE",
			"lines": [
				"Dans le cockpit orbital, tu ouvres les yeux sans aucun souvenir.",
				"Ni ton nom, ni ton visage d'hier, ni la moindre trace de ta vie.",
				"Pourtant, dès que tes mains se posent sur les commandes, tout répond.",
				"Tes réflexes de pilote sont intacts, gravés au plus profond de toi.",
				"Malgré l'amnésie, la voix de VESTA résonne comme une évidence.",
				"Sans connaître ton passé, tu choisis de lui faire confiance."
			],
			"quote": "« J'ignore qui j'étais... mais je sais pourquoi je vole. »"
		},
		{
			"img": "res://assets/story/pro-7.jpg",
			"kicker": "LE CHASSEUR VANGUARD",
			"lines": [
				"Ton vaisseau est le chasseur spatial bimoteur VANGUARD.",
				"Conçu pour traverser les cinq familles technologiques sans faillir,",
				"il adapte sa coque et ses armes à l'essence de chaque monde.",
				"Les crédits récoltés au combat renforcent ses boucliers et ses tirs.",
				"Chaque secteur libéré ravive les couleurs du monde qu'il protège.",
				"À son bord, le pilote sans mémoire accepte la mission sacrée."
			],
			"quote": "« Bimoteurs plasma parés. Cap sur le premier monde ! »"
		},
		{
			"img": "res://assets/story/pro-8.jpg",
			"kicker": "LES GARDIENS DE VORAX",
			"lines": [
				"Chaque monde est verrouillé par trois secteurs de haute intensité.",
				"Escadrilles mécaniques, croiseurs lourds et boss colossaux y veillent.",
				"Des matrices portables de FanBoy aux citadelles 8 bits de NEXUS 8,",
				"des tempêtes 16 bits de MegaStorm 16 et Arcadion HCS,",
				"jusqu'aux forteresses polygonales de Polytron 32,",
				"aucun gardien ne cédera le passage sans livrer bataille."
			],
			"quote": "« Vingt-quatre secteurs. Vingt-quatre verrous à briser. »"
		},
		{
			"img": "res://assets/story/pro-9.jpg",
			"kicker": "ORDRE DE MISSION",
			"lines": [
				"Secteurs 1 à 6 : FanBoy et FanBoy Adventure — l'élan nomade.",
				"Secteurs 7 à 12 : NEXUS 8 et Masterion 8 — les bastions 8 bits.",
				"Secteurs 13 à 21 : NEXUS 16, MegaStorm 16 et Arcadion HCS — l'âge 16 bits.",
				"Secteurs 22 à 24 : Polytron 32 — l'assaut final contre VORAX.",
				"Écoute VESTA, préserve les consoles sacrées et rends la vie à l'univers.",
				"Bonne chasse, pilote."
			],
			"quote": "« Huit mondes à sauver. Allumez les réacteurs ! »"
		}
]

const EPILOGUE := [
		{
			"img": "res://assets/story/epi-1.jpg",
			"kicker": "LA CHUTE DE VORAX",
			"lines": [
				"Dans un dernier éclat aveuglant, la citadelle de VORAX s'effondre.",
				"Le silence gris se fissure, balayé par une onde de lumière pure.",
				"De FanBoy jusqu'à Polytron 32, les huit vestiges sacrés chantent à nouveau.",
				"Les vingt-quatre secteurs retrouvent leurs couleurs, leur souffle et leur vie.",
				"Dans le cockpit du Vanguard, les alarmes s'apaisent enfin.",
				"La mission confiée par VESTA est accomplie."
			],
			"quote": "« La désolation a reculé. Les couleurs vivent encore. »"
		},
		{
			"img": "res://assets/story/epi-2.jpg",
			"kicker": "LE MURMURE DE VESTA",
			"lines": [
				"Devant la verrière étoilée, la silhouette de VESTA brille d'une douceur nouvelle.",
				"Ce n'était pas une étrangère : c'était l'écho sacré de ton propre surnom,",
				"la part de ton âme qui refusait de céder aux ténèbres.",
				"« Tu as protégé ce que tu aimais, pilote », murmure-t-elle en souriant.",
				"« Le long voyage dans la nuit s'achève. Il est temps de rouvrir les yeux. »",
				"Autour de toi, les étoiles blanches se fondent en une clarté familière."
			],
			"quote": "« Souviens-toi de ton nom, Vesta... Reviens vers eux. »"
		},
		{
			"img": "res://assets/story/epi-3.jpg",
			"kicker": "AU-DELÀ DU COMA",
			"lines": [
				"Le grondement des bimoteurs laisse place au bip régulier d'un moniteur.",
				"Une chambre d'hôpital baignée par la lumière calme du matin.",
				"Après un temps indéterminé plongé dans le coma, tes paupières s'ouvrent.",
				"Toute l'aventure vécue à travers les huit mondes était le combat intérieur",
				"de ton esprit luttant pour revenir à la vie et préserver sa mémoire.",
				"Et soudain, chaque souvenir perdu te revient avec une netteté absolue."
			],
			"quote": "« Les ténèbres se dissipent. La mémoire est revenue. »"
		},
		{
			"img": "res://assets/story/epi-4.jpg",
			"kicker": "NOLAN VEY, DIT « VESTA »",
			"lines": [
				"Tu t'appelles Nolan Vey — pilote militaire surnommé « Vesta ».",
				"Lors de ta dernière mission réelle, tu as tout risqué au péril de ta vie",
				"pour sauver un peuple entier menacé d'un génocide certain.",
				"Gravement blessé après les avoir mis hors de danger, tu avais sombré.",
				"Même au fond de l'inconscience, le pilote en toi n'a jamais cessé",
				"de défendre la vie contre le chaos et la destruction."
			],
			"quote": "« Indicatif d'appel : VESTA. Mission accomplie, commandant Vey. »"
		},
		{
			"img": "res://assets/story/epi-5.jpg",
			"kicker": "LE RETOUR À LA VIE",
			"lines": [
				"Les portes de l'hôpital s'ouvrent enfin sur le chemin du foyer.",
				"Chez lui, Nolan pousse la porte de sa salle de rétro-gaming chérie,",
				"où brillent paisiblement les écrans et les souvenirs d'une passion intacte.",
				"Puis des pas accourent : son épouse se jette dans ses bras,",
				"suivie de leurs deux enfants, sa fille et son fils, les yeux pleins de joie.",
				"Les vraies couleurs de son univers n'ont jamais été aussi vivantes."
			],
			"quote": "« Bienvenue à la maison, Nolan. »"
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
