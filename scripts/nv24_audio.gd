extends Node
## =========================================================================
## NV24ANIME — couche d'échantillons du secteur 24 (module 29). Chaque
## événement important du secteur 24 joue son échantillon du pack officiel
## (assets/sector24/audio) ; si le fichier est absent, repli sur la synthèse
## d'origine via Audio2.sfx(). Point d'accès unique : Nv24Audio.sound(n).
## =========================================================================

## le pack officiel garde ses sous-dossiers wav/ et ogg/ (structure du dépôt)
const DIR_WAV := "res://assets/sector24/audio/wav/"
const DIR_OGG := "res://assets/sector24/audio/ogg/"
## les 16 événements sonores du module 29 (packSnd / NV24ANIME.sound)
const EVENTS := [
	"01_intercepteur_tir", "02_tourelle_double", "03_missile_depart", "04_impact_blindage",
	"05_drone_explosion", "06_bombardier_explosion", "07_tourelle_detruite", "09_sas_impact",
	"11_doigts_percement", "12_doigt_blesse", "15_alerte_electricite", "16_alerte_verre_brise",
	"20_vorax_poing", "21_vorax_bouclier", "24_debris_retombee", "25_base_effondrement",
]
## repli synthé : chaque échantillon a son bruit de substitution du moteur
const FALLBACK := {
	"01_intercepteur_tir": "eshoot", "02_tourelle_double": "eshoot", "03_missile_depart": "cannon",
	"04_impact_blindage": "ehit", "05_drone_explosion": "boom", "06_bombardier_explosion": "boom",
	"07_tourelle_detruite": "boom", "09_sas_impact": "hit", "11_doigts_percement": "bossalarm",
	"12_doigt_blesse": "hit", "15_alerte_electricite": "zap", "16_alerte_verre_brise": "glass",
	"20_vorax_poing": "hit", "21_vorax_bouclier": "shield", "24_debris_retombee": "hit",
	"25_base_effondrement": "boom",
}

var _pool: Array[AudioStreamPlayer] = []
var _cache: Dictionary = {}

func _ready() -> void:
	for i in 6:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)

## l'équivalent exact de packSnd(n) / NV24ANIME.sound(n)
func sound(n: String) -> void:
	var stream: AudioStream = null
	if _cache.has(n):
		stream = _cache[n]
	else:
		var path: String = DIR_WAV + n + ".wav"
		if ResourceLoader.exists(path):
			stream = load(path)
		else:
			path = DIR_OGG + n + ".ogg"
			if ResourceLoader.exists(path):
				stream = load(path)
		_cache[n] = stream
	if stream == null:
		# repli : la synthèse d'origine (le pack son reste maître s'il est là)
		Audio2.sfx(FALLBACK.get(n, "hit"))
		return
	for p in _pool:
		if not p.playing:
			p.stream = stream
			p.volume_db = 0.0
			p.pitch_scale = 1.0
			p.play()
			return

func samples_disponibles() -> int:
	var c := 0
	for ev in EVENTS:
		if ResourceLoader.exists(DIR_WAV + ev + ".wav") or ResourceLoader.exists(DIR_OGG + ev + ".ogg"):
			c += 1
	return c

func _exit_tree() -> void:
	for p in _pool:
		p.stop()
	_pool.clear()
	_cache.clear()
