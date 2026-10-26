extends Node2D
## Independent VFX, attached to a muzzle for its lifetime. No damage collider.
var elapsed := 0.0
var sheet: Texture2D = preload("res://native/sector1/artpack_s01/assets/fx/beam_sheet.png")
var maximum_length := 88

func _process(delta: float) -> void:
	elapsed += delta
	if elapsed > 0.7:
		queue_free()
		return
	queue_redraw()

func _draw() -> void:
	var frame := int(elapsed * 12.0) % 4
	for yy in range(0, maximum_length, 20):
		var length := mini(20, maximum_length - yy)
		draw_texture_rect_region(sheet, Rect2(-3, yy, 6, length), Rect2(frame * 48 + 21, 14, 6, length))
