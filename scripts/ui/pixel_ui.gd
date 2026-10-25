extends RefCounted
## POLICE PIXEL — « Press Start 2P » (OFL), l'équivalent libre de la
## dot-matrix de la console. Charger une seule fois, tailles multiples de 8.

static var _font_res: Font = null

static func font() -> Font:
	if _font_res == null:
		_font_res = load("res://assets/fonts/pixel.ttf")
	return _font_res
