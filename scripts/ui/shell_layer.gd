extends Node2D
## =========================================================================
## COQUE FANBOY NV-01 — (C11) matière PHOTORÉALISTE : la coque néon est
## une image (assets/coque/nv01-shell.png, 960×1720 → 480×860) réalisée
## d'après l'art officiel du jeu. Ici : texture seule, sous la vue.
## Tout le DYNAMIQUE (LED HUD, néon de progression, curseur POWER, labels,
## boot/off) est dessiné par hud_overlay — au-dessus de la vue.
## LE VERRE : Data.GLASS = Rect2(24, 126, 432, 324) — écran XXL 4:3 pile,
## le néon du cadre entoure exactement la vitre.
## (C11) la texture est convertie en ImageTexture une fois au chargement :
## certains drivers (llvmpipe) rendent la CompressedTexture2D lossless en
## blanc — l'image décompressée, elle, s'affiche fidèlement partout.
## =========================================================================

var main: Node = null
var _tex: Texture2D = null

func _ready() -> void:
	z_index = -1
	var raw: Texture2D = load("res://assets/coque/nv01-shell.png")
	if raw != null and raw.get_image() != null:
		_tex = ImageTexture.create_from_image(raw.get_image())

func game() -> Node:
	return main.game if main else null

func _process(_d: float) -> void:
	queue_redraw()   # cheap : un seul draw call quand actif

func _draw() -> void:
	var g: Node = game()
	if g == null or g.state != "play":
		return
	if g.era_idx != 0:
		return   # ères 1+ : vue plein écran, la barre tactile vit dans hud_overlay
	# la coque photographique, étirée exactement sur la fenêtre 480×860
	if _tex != null:
		draw_texture_rect(_tex, Rect2(0, 0, 480, 860), false)
