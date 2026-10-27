extends Control
## OPTIONS — volume musique/effets, difficulté, tir auto, voix, plein écran.

var main: Node

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 10)
	ui.title_label(v, NVLang.t("⚙ Options"))
	ui.spacer(v, 6)
	# langue (LDATA du moteur web : FR source, 5 langues)
	var LANG_NOMS := NVLang.LANG_NAMES
	var lang_l := ui.label(v, "LANGUE · LANGUAGE : %s" % LANG_NOMS[str(Save.S.opts.get("lang", "fr"))], 14, UIKit.INK)
	ui.button(v, "Changer la langue d'affichage", func():
		var order := ["fr", "en", "es", "pt", "ja"]
		var cur := order.find(str(Save.S.opts.get("lang", "fr")))
		Save.S.opts["lang"] = order[(cur + 1) % order.size()]
		lang_l.text = "LANGUE · LANGUAGE : %s" % LANG_NOMS[str(Save.S.opts.lang)]
		Save.save_game())
	ui.make_slider(v, NVLang.t("Musique").to_upper(), float(Save.S.opts.music) / 100.0, func(val):
		Save.S.opts.music = int(round(val * 100))
		Audio2.apply_volumes()
		Save.save_game())
	ui.make_slider(v, NVLang.t("Effets").to_upper(), float(Save.S.opts.sfx) / 100.0, func(val):
		Save.S.opts.sfx = int(round(val * 100))
		Audio2.apply_volumes()
		Save.save_game())
	ui.make_slider(v, "SECOUSSE", float(Save.S.opts.shake) / 100.0, func(val):
		Save.S.opts.shake = int(round(val * 100))
		Save.save_game())
	ui.spacer(v, 8)
	# difficulté
	var diff_l := ui.label(v, "DIFFICULTÉ : %s" % Data.DIFFS[int(Save.S.opts.diff)].name, 14, UIKit.INK)
	ui.button(v, "Changer de difficulté (CADET / PILOTE / AS)", func():
		Save.S.opts.diff = (int(Save.S.opts.diff) + 1) % 3
		diff_l.text = "DIFFICULTÉ : %s" % Data.DIFFS[int(Save.S.opts.diff)].name
		Save.save_game())
	# bascules
	var autofire_l := ui.label(v, "TIR AUTOMATIQUE : %s" % ("OUI" if Save.S.opts.autofire else "NON"), 14, UIKit.INK)
	ui.button(v, "Basculer le tir automatique", func():
		Save.S.opts.autofire = not Save.S.opts.autofire
		autofire_l.text = "TIR AUTOMATIQUE : %s" % ("OUI" if Save.S.opts.autofire else "NON")
		Save.save_game())
	var speech_l := ui.label(v, "ANNONCES VOCALES : %s" % ("OUI" if Save.S.opts.speech else "NON"), 14, UIKit.INK)
	ui.button(v, "Basculer les annonces vocales", func():
		Save.S.opts.speech = not Save.S.opts.speech
		speech_l.text = "ANNONCES VOCALES : %s" % ("OUI" if Save.S.opts.speech else "NON")
		Save.save_game())
	var fs_l := ui.label(v, "PLEIN ÉCRAN : %s" % ("OUI" if DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN else "NON"), 14, UIKit.INK)
	ui.button(v, "Basculer le plein écran", func():
		var full := DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if not full else DisplayServer.WINDOW_MODE_WINDOWED)
		fs_l.text = "PLEIN ÉCRAN : %s" % ("OUI" if not full else "NON"))
	ui.spacer(v, 8)
	ui.label(v, "— AFFICHAGE —", 13, UIKit.ACC)
	var fps_l := ui.label(v, "PERFORMANCES (FPS) : %s" % ("OUI" if Save.S.opts.get("fps", false) else "NON"), 14, UIKit.INK)
	ui.button(v, "Basculer le compteur FPS", func():
		Save.S.opts.fps = not Save.S.opts.get("fps", false)
		fps_l.text = "PERFORMANCES (FPS) : %s" % ("OUI" if Save.S.opts.fps else "NON")
		Save.save_game())
	var scan_l := ui.label(v, "SCANLINES CRT : %s" % ("OUI" if Save.S.opts.get("scanlines", true) else "NON"), 14, UIKit.INK)
	ui.button(v, "Basculer les scanlines (écran à balayage)", func():
		Save.S.opts.scanlines = not Save.S.opts.get("scanlines", true)
		scan_l.text = "SCANLINES CRT : %s" % ("OUI" if Save.S.opts.scanlines else "NON")
		Save.save_game()
		if main.crt: main.crt.refresh())
	var smooth_l := ui.label(v, "LISSAGE DES PIXELS : %s" % ("OUI" if Save.S.opts.get("smooth", false) else "NON"), 14, UIKit.INK)
	ui.button(v, "Basculer le lissage (adoucit le rétro)", func():
		Save.S.opts.smooth = not Save.S.opts.get("smooth", false)
		smooth_l.text = "LISSAGE DES PIXELS : %s" % ("OUI" if Save.S.opts.smooth else "NON")
		Save.save_game()
		main._apply_smooth())
	# FX FanBoy du moteur web (module 24) : contraste LCD + cadre de console
	ui.label(v, "— FX FANBOY (module 24) —", 13, UIKit.ACC)
	var CONTRASTS := {"low": "BAISSÉ", "normal": "NORMAL", "high": "HAUT"}
	var cont_l := ui.label(v, "CONTRASTE LCD : %s" % CONTRASTS[str(Save.S.opts.get("gb_contrast", "normal"))], 14, UIKit.INK)
	ui.button(v, NVLang.t("LCD contrast") + " — comme la molette de console", func():
		var order := ["low", "normal", "high"]
		var cur := order.find(str(Save.S.opts.get("gb_contrast", "normal")))
		Save.S.opts["gb_contrast"] = order[(cur + 1) % order.size()]
		cont_l.text = "CONTRASTE LCD : %s" % CONTRASTS[str(Save.S.opts.gb_contrast)]
		Save.save_game())
	var frame_l := ui.label(v, "CADRE DE CONSOLE (PC) : %s" % ("OUI" if Save.S.opts.get("frame", true) else "NON"), 14, UIKit.INK)
	ui.button(v, NVLang.t("Console frame (PC)") + " — console FanBoy", func():
		Save.S.opts["frame"] = not Save.S.opts.get("frame", true)
		frame_l.text = "CADRE DE CONSOLE (PC) : %s" % ("OUI" if Save.S.opts.frame else "NON")
		Save.save_game()
		if main != null and main.has_method("_apply_era_viewport"):
			main._apply_era_viewport(main.game.level if main.game != null else 1))
	ui.label(v, "TENEUR EN PIXELS : l'ère Pocket reste en 160×144,\nl'ère HD en rendu plein — comme les consoles d'origine.", 11, UIKit.DIM)
	ui.spacer(v, 10)
	ui.label(v, "Effacer la sauvegarde (crédits, achats, records) :", 12, Color("#ff5fa2"))
	ui.button(v, "☠ NOUVELLE CAMPAGNE (efface tout)", func():
		Save.S = Save.default_save()
		Save.save_game()
		main.show_title())
	ui.spacer(v, 10)
	# migration sauvegarde web (localStorage) : collage JSON → user://
	ui.label(v, NVLang.t("Importer une sauvegarde") + " — localStorage « neovanguard.save.v3 » :", 12, UIKit.ACC)
	var imp := LineEdit.new()
	imp.placeholder_text = '{"credits": 9999, "max_level": 12, …}'
	imp.custom_minimum_size = Vector2(0, 40)
	imp.scroll_editable = true
	v.add_child(imp)
	var imp_l := ui.label(v, "", 11, UIKit.DIM)
	ui.button(v, NVLang.t("IMPORTER"), func():
		var parsed: Variant = JSON.parse_string(imp.text)
		if parsed == null or not (parsed is Dictionary):
			imp_l.text = "✖ JSON invalide"
			return
		var keys := ["credits", "max_level", "records", "unlocks", "musicTracks", "pinball", "sel"]
		var n := 0
		for k in keys:
			if (parsed as Dictionary).has(k):
				Save.S[k] = parsed[k]
				n += 1
		for k in ["music", "sfx", "diff", "autofire", "speech", "shake", "lang"]:
			if (parsed as Dictionary).has("opts") and (parsed["opts"] as Dictionary).has(k):
				Save.S.opts[k] = parsed["opts"][k]
				n += 1
		Save.save_game()
		imp_l.text = "✔ %d clés importées — retour au titre" % n
		if n > 0:
			await get_tree().create_timer(0.8).timeout
			main.show_title())
	ui.spacer(v, 10)
	ui.button(v, NVLang.t("◀ Retour"), func(): main.show_title())
