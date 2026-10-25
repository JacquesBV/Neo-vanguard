extends Node2D
## SCANLINES CRT — l'écran à balayage des bornes, par-dessus tout.
## Se dessine une fois ; queue_redraw() quand on bascule l'option.

func refresh() -> void:
	queue_redraw()

var game: Node = null

func _draw() -> void:
	if not Save.S.opts.get("scanlines", true):
		return
	if game and game.era_idx == 0:
		return # LCD lisse : pas de balayage tube sur la Pocket
	var yy := 2.0
	while yy < 860.0:
		draw_line(Vector2(0, yy), Vector2(480, yy), Color(0, 0, 0, 0.13), 1.0)
		yy += 3.0
	# léger vignettage
	for i in 3:
		draw_rect(Rect2(-i * 2, -i * 2, 480 + i * 4, 860 + i * 4), Color(0, 0, 0, 0.0), false, 2.0)
