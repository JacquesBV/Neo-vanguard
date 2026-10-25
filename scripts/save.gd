extends Node
## =========================================================================
## SAVE — équivalent Godot du localStorage du jeu original.
## Même structure que defaultSave() du JS : crédits, achats, sélections,
## options, codes de triche, records, matériaux, défi du jour.
## Fichier : user://neovanguard.save.v3.json
## =========================================================================

const SAVE_PATH := "user://neovanguard.save.v3.json"

var S: Dictionary = {}
var autosave_timer: float = 0.0

func _ready() -> void:
	load_game()

func default_save() -> Dictionary:
	return {
		"v": 3,
		"credits": 500,
		"best": 0, "quick_best": 0, "max_level": 1, "kills": 0, "runs": 0, "playtime": 0,
		"owned": {
			"ships": ["falcon"], "weapons": ["pulse"], "upgrades": {},
			"liveries": ["squadron"], "trails": ["pixel"], "auras": ["none"],
			"bullet_skins": ["stock"], "bombs": 2,
		},
		"sel": { "ship": "falcon", "weapon": "pulse", "livery": "squadron",
			"trail": "pixel", "aura": "none", "bullet_skin": "stock" },
		"materials": { "scrap": 0, "crystal": 0, "circuit": 0 },
		"opts": {
			"music": 50, "sfx": 70, "diff": 1, "autofire": false, "fps": false,
			"scanlines": true, "smooth": false,
			"speech": true, "shake": 100, "two_p": false, "lang": "fr",
		},
		"cheats": { "found": {}, "on": {}, "start_level": 1 },
		"tickets": { "items": {}, "next": 1, "counters": {} },
		"unlocks": {},
		"musicTracks": [],
		"pinball": { "completed": false, "gift_seen": true, "best": 0, "help_seen": false },
		"medals": {}, "board": [], "rank_best": "", "combo_best": 0, "graze_total": 0,
		"daily": { "d": "", "tries": 0, "score": 0, "best": 0, "streak": 0, "last": "" },
	}

func load_game() -> void:
	var d := default_save()
	S = d.duplicate(true)
	if FileAccess.file_exists(SAVE_PATH):
		var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
		if f:
			var parsed: Variant = JSON.parse_string(f.get_as_text())
			if parsed is Dictionary:
				deep_merge(S, parsed)
	# garde-fous (comme dans le JS : une sauvegarde abîmée ne plante jamais)
	if not (S.owned is Dictionary): S.owned = d.owned.duplicate(true)
	if not (S.owned.upgrades is Dictionary): S.owned.upgrades = {}
	if not (S.opts is Dictionary): S.opts = d.opts.duplicate(true)
	if not (S.sel is Dictionary): S.sel = d.sel.duplicate(true)
	for key in ["ships", "weapons", "liveries", "trails", "auras", "bullet_skins"]:
		if not (S.owned.get(key) is Array) or (S.owned[key] as Array).is_empty():
			S.owned[key] = (d.owned[key] as Array).duplicate()
	S.cheats = S.cheats if (S.cheats is Dictionary) else d.cheats.duplicate(true)
	if not (S.cheats.found is Dictionary): S.cheats.found = {}
	if not (S.cheats.on is Dictionary): S.cheats.on = {}
	# un élément sélectionné doit être possédé
	_chk("ship", "ships", Data.SHIPS)
	_chk("weapon", "weapons", Data.WEAPONS)
	_chk("livery", "liveries", Data.LIVERIES)
	_chk("trail", "trails", Data.TRAILS)
	_chk("aura", "auras", Data.AURAS)
	_chk("bullet_skin", "bullet_skins", Data.BULLET_SKINS)

func _chk(sel_key: String, own_key: String, list: Array) -> void:
	var owned: Array = S.owned[own_key]
	if not owned.has(S.sel[sel_key]) or list.is_empty():
		S.sel[sel_key] = owned[0]

func deep_merge(base: Dictionary, over: Dictionary) -> void:
	for k in over:
		if base.has(k) and base[k] is Dictionary and over[k] is Dictionary:
			deep_merge(base[k], over[k])
		else:
			base[k] = over[k]

func save_game() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(S, "  ", false))

func _process(delta: float) -> void:
	# sauvegarde automatique douce toutes les 10 s
	autosave_timer += delta
	if autosave_timer > 10.0:
		autosave_timer = 0.0
		save_game()

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()

# --- helpers ----------------------------------------------------------------
func upg_level(id: String) -> int:
	return int(S.owned.upgrades.get(id, 0))

func upg_cost(def: Dictionary) -> int:
	return Data.upg_cost(def, upg_level(def.id))

func cheat_found(id: String) -> bool:
	return S.cheats.found.get(id, false) == true

func cheat_on(id: String) -> bool:
	return S.cheats.found.get(id, false) == true and S.cheats.on.get(id, false) == true

func any_cheat() -> bool:
	for c in Data.CHEATS:
		if cheat_on(c.id): return true
	return false

func norm_code(s: String) -> String:
	var out := ""
	for ch in s.to_lower():
		if (ch >= "a" and ch <= "z") or (ch >= "0" and ch <= "9"):
			out += ch
	return out

func enter_code(raw: String) -> Dictionary:
	var code := norm_code(raw)
	for c in Data.CHEATS:
		if norm_code(c.code) == code:
			S.cheats.found[c.id] = true
			if c.type == "toggle":
				S.cheats.on[c.id] = not S.cheats.on.get(c.id, false)
			elif c.type == "action":
				apply_cheat_action(c.id)
			elif c.type == "select":
				S.cheats.on[c.id] = true
			save_game()
			return c
	return {}

func apply_cheat_action(id: String) -> void:
	match id:
		"rich":
			S.credits = int(S.credits) + 50000
		"unlock":
			for sh in Data.SHIPS: if not (S.owned.ships as Array).has(sh.id): (S.owned.ships as Array).append(sh.id)
			for w in Data.WEAPONS: if not (S.owned.weapons as Array).has(w.id): (S.owned.weapons as Array).append(w.id)
			for l in Data.LIVERIES: if not (S.owned.liveries as Array).has(l.id): (S.owned.liveries as Array).append(l.id)
			for t in Data.TRAILS: if not (S.owned.trails as Array).has(t.id): (S.owned.trails as Array).append(t.id)
			for a in Data.AURAS: if not (S.owned.auras as Array).has(a.id): (S.owned.auras as Array).append(a.id)
			for b in Data.BULLET_SKINS: if not (S.owned.bullet_skins as Array).has(b.id): (S.owned.bullet_skins as Array).append(b.id)
			for u in Data.UPGRADES: S.owned.upgrades[u.id] = u.max
		"flipper":
			pass  # la table de flipper est un module séparé du jeu original
		"jump":
			S.cheats.on["jump"] = true
	save_game()

# --- statistiques du vaisseau (computeStats du JS, valeurs exactes) ----------
func compute_stats(level: int) -> Dictionary:
	var sp: Dictionary = Data.ship_by_id(S.sel.ship)
	var wp: Dictionary = Data.weapon_by_id(S.sel.weapon)
	var eng := upg_level("engine")
	var st := {
		"ship": sp, "weapon": wp,
		# 464 = vitesse de base du JS (« deux fois plus rapide »)
		"speed": 464.0 * sp.speed * (1.0 + 0.06 * eng),
		"max_hp": 3 + int(sp.hp) + upg_level("hull"),
		"fire_mul": (1.0 + 0.07 * upg_level("rate")) * sp.fire,
		"dmg_mul": 1.0 + 0.08 * upg_level("dmg"),
		"drones": (1 if sp.id == "spectre" else 0) + (1 if sp.id == "singularis" else 0) + upg_level("drone"),
		"shields": upg_level("shield") + (1 if sp.id == "singularis" else 0) + (1 if sp.id == "falconA" else 0),
		"magnet": 92.0 * (1.0 + 0.45 * upg_level("magnet")) * (1.5 if sp.id == "singularis" else 1.0),
		"credit_mul": 1.0 + 0.15 * upg_level("credit"),
		"luck": upg_level("luck"),
		"pierce": 1 if sp.id == "spectre" else 0,
		"contact_mul": 0.5 if sp.id == "titan" else (0.75 if sp.id == "falconA" else 1.0),
		"dodge": 0.15 if sp.id == "viper" else (0.08 if sp.id == "falconB" else 0.0),
		"regen": sp.id == "singularis",
	}
	if cheat_on("rage"):
		st.speed *= 2.0
		st.fire_mul *= 1.5
	st.fire_cd = Data.FIRE_CD[wp.id] / st.fire_mul
	return st

# --- équilibrage ennemis (eScale du JS) --------------------------------------
func e_scale(level: int) -> Dictionary:
	var d: Dictionary = Data.DIFFS[int(S.opts.diff)]
	var leq := Data.lv_eq(level)
	return {
		"hp": d.hp * (1.0 + (leq - 1.0) * 0.42),
		"bs": d.bs * (1.0 + (leq - 1.0) * 0.045),
		"dmg": d.dmg,
		"credit": d.credit,
		"lives": d.lives,
	}
