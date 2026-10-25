extends Control
## OPTIONS — volume musique/effets, difficulté, tir auto, voix, plein écran.

var main: Node

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 10)
	ui.title_label(v, "⚙ OPTIONS")
	ui.spacer(v, 6)
	ui.make_slider(v, "MUSIQUE", float(Save.S.opts.music) / 100.0, func(val):
		Save.S.opts.music = int(round(val * 100))
		Audio2.apply_volumes()
		Save.save_game())
	ui.make_slider(v, "EFFETS", float(Save.S.opts.sfx) / 100.0, func(val):
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
	ui.label(v, "TENEUR EN PIXELS : l'ère Pocket reste en 160×144,\nl'ère HD en rendu plein — comme les consoles d'origine.", 11, UIKit.DIM)
	ui.spacer(v, 10)
	ui.label(v, "Effacer la sauvegarde (crédits, achats, records) :", 12, Color("#ff5fa2"))
	ui.button(v, "☠ NOUVELLE CAMPAGNE (efface tout)", func():
		Save.S = Save.default_save()
		Save.save_game()
		main.show_title())
	ui.spacer(v, 10)
	ui.button(v, "◀ Retour", func(): main.show_title())
