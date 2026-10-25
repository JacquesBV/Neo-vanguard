extends RefCounted
class_name NVLang
## =========================================================================
## i18n — table LDATA du moteur web (442 entrées FR → [en, es, pt, ja]).
## Même sémantique que L() : le français est la langue source, recherche par
## texte (puis insensible à la casse), majuscules propagées, nombres isolés
## réinjectés dans les « # » de la traduction.
## =========================================================================

const LANGS := ["en", "es", "pt", "ja"]
const LANG_NAMES := {
	"fr": "Français", "en": "English", "es": "Español", "pt": "Português", "ja": "日本語",
}

static var _idx := {}
static var _lc := {}
static var _loaded := false

static func _load() -> void:
	if _loaded: return
	_loaded = true
	var txt := ""
	var f := FileAccess.open("res://assets/data/lang.json", FileAccess.READ)
	if f != null:
		txt = f.get_as_text()
	var data: Variant = JSON.parse_string(txt) if txt != "" else null
	if data == null or not (data is Dictionary): return
	for l in LANGS:
		_idx[l] = {}
		_lc[l] = {}
	for fr in data:
		var v: Variant = data[fr]
		if not (v is Array): continue
		var k := _norm(str(fr))
		for i in 4:
			if i < (v as Array).size() and str(v[i]) != "":
				_idx[LANGS[i]][k] = str(v[i])
				_lc[LANGS[i]][k.to_lower()] = str(v[i])

static func _norm(s: String) -> String:
	# approx de lnorm() : bords + espaces doublés réduits
	var parts := s.strip_edges().split(" ", false)
	return " ".join(parts)

## l'équivalent exact de L(s) / tx() du moteur web
static func t(s: String) -> String:
	if s.is_empty(): return s
	_load()
	var lang: String = str(Save.S.opts.get("lang", "fr"))
	if lang == "fr" or not _idx.has(lang):
		return s
	var pre := s.length() - s.strip_edges(true, false).length()
	var suf := s.length() - s.strip_edges(false, true).length()
	var core := s.substr(pre, s.length() - pre - suf)
	var hit: String = _idx[lang].get(_norm(core), "")
	if hit == "":
		hit = _lc[lang].get(_norm(core).to_lower(), "")
	if hit == "":
		return s
	# le texte source en capitales reste en capitales (HUD, jaquettes)
	if core.length() > 2 and core == core.to_upper() and core != core.to_lower():
		hit = hit.to_upper()
	# nombres isolés du texte source → « # » de la traduction, dans l'ordre
	var re := RegEx.new()
	re.compile("(^|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])(\\d+)")
	var nums: Array = []
	for m in re.search_all(core):
		nums.append(m.get_string(2))
	var out := hit
	for n in nums:
		var pos := out.find("#")
		if pos >= 0:
			out = out.substr(0, pos) + str(n) + out.substr(pos + 1)
	return s.substr(0, pre) + out + (s.substr(s.length() - suf) if suf > 0 else "")
