extends Node
## TICKETS À GRATTER (pack « Réaliste V3 ») — réplique fidèle du module 47.
## · Après le générique, le ticket LÉGENDAIRE remplace l'ancien cadeau de fin.
##   Il révèle CAFAITFLIPPER ; le gratter ne débloque rien : seule la saisie
##   dans CODES valide le code.
## · Le code fonctionne à tout moment (ticket obtenu ou non) et ne se valide
##   qu'une fois : une seule information persistante, S.unlocks.pinball.
## · Ticket ÉPIQUE offert en battant le boss du secteur 12 (bilan de secteur),
##   code NEOMELODIES → menu complet des cassettes audio.
## Sauvegarde : S.tickets { items, next, counters } + S.unlocks.

const DIR := "res://assets/tickets/"
const TW := 1536.0                       ## ticket source
const TH := 1024.0
const ZONE := Rect2(1020, 435, 440, 245) ## zone à gratter (px source)
const SERIAL_RECT := Rect2(1060, 900, 330, 66)
const ROT := -4.0                        ## inclinaison de la carte (deg)
const REVEAL_AT := 0.65
const CODE := "CAFAITFLIPPER"

const RARITIES := {
	"casual":     { "id": "casual",     "label": "CASUAL",     "rank": 1, "color": Color8(167, 169, 164), "base": DIR + "base_casual.webp",     "pastille": DIR + "pastille_casual.png" },
	"peu_commun": { "id": "peu_commun", "label": "PEU COMMUN", "rank": 2, "color": Color8(112, 166, 123), "base": DIR + "base_peu_commun.webp", "pastille": DIR + "pastille_peu_commun.png" },
	"rare":       { "id": "rare",       "label": "RARE",       "rank": 3, "color": Color8(105, 155, 193), "base": DIR + "base_rare.webp",       "pastille": DIR + "pastille_rare.png" },
	"epique":     { "id": "epique",     "label": "ÉPIQUE",     "rank": 4, "color": Color8(164, 126, 179), "base": DIR + "base_epique.webp",     "pastille": DIR + "pastille_epique.png" },
	"legendaire": { "id": "legendaire", "label": "LÉGENDAIRE", "rank": 5, "color": Color8(199, 165, 92),  "base": DIR + "base_legendaire.webp", "pastille": DIR + "pastille_legendaire.png" },
}

## Modèles de tickets. Seul celui de fin a une récompense de débloqué :
## les autres raretés sont prêtes pour de futures récompenses.
const MODELS := {
	# collection 01 : ticket de fin, après le générique
	"finale": { "id": "finale", "collection": 1, "rarity": "legendaire",
		"base": DIR + "base_legendaire.webp", "reward": DIR + "recompense_fin.png", "code": CODE },
	# collection 02 : offert en battant le boss du secteur 12 (bilan de secteur)
	"neo_melodies_002": { "id": "neo_melodies_002", "collection": 2, "rarity": "epique",
		"base": DIR + "neomelodies_base_epique.webp", "reward": DIR + "neomelodies_recompense.png", "code": "NEOMELODIES" },
}

## Codes de ticket — une seule logique pour tous, une seule donnée
## persistante par code (S.unlocks[clé]).
const TICKET_CODES := {
	"CAFAITFLIPPER": { "key": "pinball",
		"ok": "Code du ticket validé. Termine Neo-Vanguard pour débloquer la table Néon Orbit.",
		"again": "Code du ticket déjà validé. La table Néon Orbit se débloque après la fin de la campagne." },
	"NEOMELODIES": { "key": "cassettes",
		"ok": "Code validé ! Le menu complet des cassettes audio est maintenant déverrouillé.",
		"again": "Ce code a déjà été saisi et validé. Le menu complet des cassettes audio est déjà déverrouillé." },
}

## Textes d'interface (le jeu d'origine est traduit ; Godot reste en FR)
const TX := {
	"kicker": { "legendaire": "RÉCOMPENSE LÉGENDAIRE", "epique": "RÉCOMPENSE ÉPIQUE" },
	"title": "TICKET MYSTÈRE",
	"sub": "Gratte la zone argentée avec ton doigt, ou avec la souris en maintenant le clic.",
	"scr": "intact", "rev": "révélé",
	"revealA": "Révéler le ticket",
	"revealH": "Pour qui ne peut pas faire le geste de grattage.",
	"codeL": "Code révélé", "codeH": "À saisir dans la rubrique CODES.",
	"copy": "Copier le code", "copied": "Code copié.",
	"codes": "Aller aux codes", "menu": "Retour au menu", "cont": "Continuer",
	"mine": "MES TICKETS", "see": "Voir le ticket",
	"serialL": "Numéro de série", "ticketL": "Ticket à gratter légendaire",
}
## Verrou du menu des cassettes (boutique musicale du site d'origine)
const LOCK_SUB := "Verrouillé · code de ticket requis"
const LOCK_MSG := "Menu des cassettes verrouillé : saisis le code de ton ticket dans CODES."

func store() -> Dictionary:
	if not (Save.S.tickets is Dictionary):
		Save.S.tickets = { "items": {}, "next": 1, "counters": {} }
	var st: Dictionary = Save.S.tickets
	if not (st.items is Dictionary): st.items = {}
	if not (st.next is int) or int(st.next) < 1: st.next = 1
	if not (st.counters is Dictionary): st.counters = {}
	return st

func persist() -> void:
	Save.save_game()

func fmt_serial(col: int, n: int) -> String:
	return "NV-%03d-%06d" % [col, n]

func next_number(st: Dictionary, col: int) -> int:
	if col == 1:
		var n: int = int(st.next)
		st.next = n + 1
		return n
	var k := str(col)
	var n2: int = int(st.counters.get(k, 1))
	st.counters[k] = n2 + 1
	return n2

## Attribue un exemplaire une seule fois ; le numéro ne change plus ensuite.
func award(model_id: String) -> Dictionary:
	var st := store()
	var m: Dictionary = MODELS.get(model_id, {})
	if m.is_empty():
		return {}
	var it: Dictionary = st.items.get(model_id, {})
	if it.is_empty():
		it = {
			"model": model_id, "collection": int(m.collection), "rarity": m.rarity,
			"serial": fmt_serial(int(m.collection), next_number(st, int(m.collection))),
			"awarded_at": int(Time.get_unix_time_from_system()),
			"progress": 0.0, "revealed": false, "revealed_at": 0,
		}
		st.items[model_id] = it
		persist()
	return it

func get_item(model_id: String) -> Dictionary:
	return store().items.get(model_id, {})

func list() -> Array:
	var items: Array = []
	var st := store()
	for k in st.items:
		if MODELS.has(k):
			items.append(st.items[k])
	items.sort_custom(func(a, b): return int(a.collection) < int(b.collection))
	return items

func is_unlocked(key: String) -> bool:
	if not (Save.S.unlocks is Dictionary): Save.S.unlocks = {}
	return (Save.S.unlocks as Dictionary).has(key)

## Valide un code de ticket. true = première validation.
func validate_ticket_code(code: String) -> bool:
	var c: Dictionary = TICKET_CODES.get(code, {})
	if c.is_empty():
		return false
	if not (Save.S.unlocks is Dictionary): Save.S.unlocks = {}
	if (Save.S.unlocks as Dictionary).has(c.key):
		return false
	Save.S.unlocks[c.key] = { "code": code, "at": int(Time.get_unix_time_from_system()) }
	persist()
	return true

## Point d'entrée « saisie d'un code » : si le code est un code de ticket,
## le traite ( messages ok / déjà validé + jingle ) et renvoie
## { ok, msg, code } ; sinon renvoie {} pour laisser la main aux codes
## classiques (exactement le wrapper de tryCheatCode du module 47).
func try_code(raw: String) -> Dictionary:
	var code := raw.strip_edges().to_upper()
	if not TICKET_CODES.has(code):
		return {}
	var c: Dictionary = TICKET_CODES[code]
	var first := validate_ticket_code(code)
	Audio2.sfx("levelup" if first else "ui")
	return { "ok": first, "code": code, "msg": c.ok if first else c.again }

## Base de ticket d'un modèle (neomelodies a sa propre base)
func base_of(model_id: String) -> String:
	var m: Dictionary = MODELS.get(model_id, {})
	if m.has("base"):
		return m.base
	var r: Dictionary = RARITIES.get(m.get("rarity", ""), {})
	return r.get("base", "")
