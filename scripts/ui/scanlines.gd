extends Node2D
## RENDU ÉCRAN — CRT pour les ères HD, et effet LCD Game Boy 1re génération
## pour l'ère POCKET (secteurs 1 à 4) : grille de pixels réelle (48×32 cellules
## comme la fenêtre 4:3), ombre intérieure du verre, rémanence (ghosting) de
## la frame précédente et micro-vignettage — l'aspect des vraies consoles
## qu'on voit en capture vidéo. Les teintes du jeu restent inchangées.

var game: Node = null
var frame_t := 0.0

func refresh() -> void:
	queue_redraw()

func _process(delta: float) -> void:
	# l'effet LCD vit en continu (rémanence + scintillement léger)
	if game and game.era_idx == 0:
		frame_t += delta
		queue_redraw()

func _draw() -> void:
	if not Save.S.opts.get("scanlines", true):
		return
	if game == null:
		return
	if game.era_idx == 0:
		_draw_lcd_effect()
		return
	var yy := 2.0
	while yy < 860.0:
		draw_line(Vector2(0, yy), Vector2(480, yy), Color(0, 0, 0, 0.13), 1.0)
		yy += 3.0
	# léger vignettage
	for i in 3:
		draw_rect(Rect2(-i * 2, -i * 2, 480 + i * 4, 860 + i * 4), Color(0, 0, 0, 0.0), false, 2.0)

# ---- effet LCD première génération -----------------------------------------
# Le verre (Data.GLASS) affiche un champ 480x360 ; la matrice visible compte
# 48 x 32 cellules (comme les tuiles du moteur), soit ~8,7 x 9,8 px par
# « pixel » console : c'est la trame qu'on devine sur les vraies dalles.
func _draw_lcd_effect() -> void:
	var glass: Rect2 = Data.GLASS
	var ink := Color(Data.INKS[0])
	# 1) rémanence : la frame courante, redessinée 1,5 px plus bas, en fondu —
	#    imite la persistance des cristaux liquides (le pixel « traîne »).
	var tex: Texture2D = main_frame_tex()
	if tex != null:
		draw_texture_rect(tex, Rect2(glass.position + Vector2(0.0, 1.5), glass.size),
			false, Color(1, 1, 1, 0.16))
	# 2) grille de la matrice LCD : traits fins entre cellules
	var cols := 48
	var rows := 32
	var cw: float = glass.size.x / float(cols)
	var ch: float = glass.size.y / float(rows)
	var gx := 0.0
	while gx < glass.size.x:
		draw_line(Vector2(glass.position.x + gx, glass.position.y),
			Vector2(glass.position.x + gx, glass.position.y + glass.size.y),
			Color(ink.r, ink.g, ink.b, 0.055), 1.0)
		gx += cw
	var gy := 0.0
	while gy < glass.size.y:
		draw_line(Vector2(glass.position.x, glass.position.y + gy),
			Vector2(glass.position.x + glass.size.x, glass.position.y + gy),
			Color(ink.r, ink.g, ink.b, 0.045), 1.0)
		gy += ch
	# 3) ombre intérieure du verre : la dalle s'éteint vers les bords
	for i in 5:
		var a: float = 0.035 - i * 0.006
		draw_rect(Rect2(glass.position.x + i * 2.0, glass.position.y + i * 2.0,
			glass.size.x - i * 4.0, 2.0), Color(ink.r, ink.g, ink.b, a))
		draw_rect(Rect2(glass.position.x + i * 2.0, glass.position.y + glass.size.y - (i + 1) * 2.0,
			glass.size.x - i * 4.0, 2.0), Color(ink.r, ink.g, ink.b, a))
		draw_rect(Rect2(glass.position.x + i * 2.0, glass.position.y + i * 2.0,
			2.0, glass.size.y - i * 4.0), Color(ink.r, ink.g, ink.b, a))
		draw_rect(Rect2(glass.position.x + glass.size.x - (i + 1) * 2.0, glass.position.y + i * 2.0,
			2.0, glass.size.y - i * 4.0), Color(ink.r, ink.g, ink.b, a))
	# 4) scintillement de rétroéclairage (très léger, 60 Hz-like)
	var flicker: float = 0.018 + 0.008 * sin(frame_t * 113.0)
	draw_rect(glass, Color(1.0, 1.0, 0.96, flicker * 0.35))

var main_node: Node = null

func main_frame_tex() -> Texture2D:
	# la texture affichée par main (SubViewport) : pour la rémanence
	# (accès via get("tr") : « tr » est aussi une méthode native de Node)
	if main_node == null:
		return null
	var trv: Object = main_node.get("tr")
	if trv != null and "texture" in trv:
		return trv.texture
	return null
