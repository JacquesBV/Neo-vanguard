extends Control
## Blank communication panel. Localization remains in the consuming game.
@export_enum("vesta", "guardian") var speaker := "vesta"
var panel: TextureRect
var text_slot: RichTextLabel

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(152,48)
	panel = TextureRect.new()
	panel.texture = load("res://native/sector1/artpack_s01_v2/assets/ui/" + speaker + "_ninepatch.png")
	panel.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	panel.size = Vector2(152,48)
	add_child(panel)
	text_slot = RichTextLabel.new()
	text_slot.name = "LocalizedTextSlot"
	text_slot.position = Vector2(11,13)
	text_slot.size = Vector2(130,24)
	text_slot.text = ""
	text_slot.scroll_active = false
	text_slot.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text_slot.add_theme_font_size_override("normal_font_size",8)
	text_slot.add_theme_color_override("default_color",Color("#2f3329"))
	add_child(text_slot)

func set_speaker(value: String) -> void:
	speaker = value
	if is_instance_valid(panel): panel.texture = load("res://native/sector1/artpack_s01_v2/assets/ui/"+speaker+"_ninepatch.png")
