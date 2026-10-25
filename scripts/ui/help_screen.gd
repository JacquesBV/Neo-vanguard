extends Control
## COMMANDES — clavier, souris, manette.

var main: Node

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self)
	var v := ui.vbox(self, 8)
	ui.title_label(v, "? COMMANDES")
	ui.label(v, "AU CLAVIER", 14, UIKit.ACC)
	ui.label(v, "Flèches ou ZQSD/WASD : piloter\nEspace ou Entrée : tir\nMaj : mouvement de précision\nG : bombe intelligente\nX : changer d'arme\nÉchap ou P : pause", 13)
	ui.label(v, "À LA SOURIS", 14, UIKit.ACC)
	ui.label(v, "Le vaisseau suit le curseur, bouton gauche : tir, bouton droit : bombe.", 13)
	ui.label(v, "AU DOIGT (téléphone / tablette)", 14, UIKit.ACC)
	ui.label(v, "Pose le doigt et glisse : le vaisseau suit, avec un décalage pour ne pas se cacher sous le pouce.", 13)
	ui.label(v, "À LA MANETTE", 14, UIKit.ACC)
	ui.label(v, "Stick gauche : piloter · A/RT : tir · B/LT : bombe · Y : arme · Start : pause", 13)
	ui.label(v, "À DEUX, SUR LE MÊME CLAVIER", 14, UIKit.ACC)
	ui.label(v, "Joueur 1 : flèches + Espace + G\nJoueur 2 : I/J/K/L + F (tir) + G (bombe)", 13)
	ui.spacer(v, 10)
	var sec1 := ui.label(v, "CARTE DE PROGRESSION", 14, UIKit.ACC)
	ui.art_rect(v, "res://assets/ui-art/intro/carte-progression.webp", 300.0)
	var sec2 := ui.label(v, "TICKETS DE BOUTIQUE", 14, UIKit.ACC)
	ui.label(v, "Cinq bases de collection, quatre raretés — le musée du jeu d'origine.", 12)
	for f in ["base_casual", "base_rare", "base_epique", "base_legendaire", "base_peu_commun"]:
		ui.art_rect(v, "res://assets/tickets/%s.webp" % f, 90.0)
	ui.label(v, "ART DU SILO FINAL (VORAX)", 14, UIKit.ACC)
	for f in ["outer-space", "flagship-base-corridor", "door-corridor", "sas-door", "base-interior"]:
		ui.art_rect(v, "res://assets/ui-art/level24/%s.webp" % f, 170.0)
	ui.spacer(v, 10)
	ui.button(v, "◀ Retour", func(): main.show_title())
