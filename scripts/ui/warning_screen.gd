extends Control
## AVERTISSEMENTS AU LANCEMENT — réplique de 01-nv-warnings.js du jeu original :
## santé (épilepsie photosensible) + œuvre de fiction. Affichés à CHAQUE
## lancement, par-dessus tout, fermés d'un seul geste (Entrée/Espace/Échap/clic).

var main: Node = null
var on_done: Callable = Callable()

const TXT := {
	"fr": { "t": "AVERTISSEMENT", "h1": "Santé — épilepsie",
		"p1": "Chez certaines personnes, des lumières clignotantes ou des motifs lumineux peuvent provoquer des crises d'épilepsie ou des pertes de conscience, même sans aucun antécédent. Ce jeu contient des flashs, des explosions et des changements de couleurs rapides. Si toi ou un membre de ta famille avez déjà eu des crises, demande l'avis d'un médecin avant de jouer. Arrête immédiatement et consulte un médecin en cas de vertiges, de troubles de la vue, de contractions des yeux ou des muscles, de mouvements involontaires, de désorientation ou de perte de conscience.",
		"p2": "Joue dans une pièce bien éclairée, à bonne distance de l'écran, et fais une pause de 10 à 15 minutes toutes les heures. Évite de jouer si tu es fatigué. Les secousses, le halo et l'effet CRT se règlent dans les options graphiques.",
		"h2": "Œuvre de fiction",
		"p3": "Neo Vanguard est une œuvre de fiction. Les personnages, organisations, lieux, consoles, marques et événements présentés sont imaginaires. Toute ressemblance avec des personnes, des entreprises ou des faits réels, existants ou ayant existé, serait purement fortuite.",
		"ok": "J'AI COMPRIS" },
	"en": { "t": "WARNING", "h1": "Health — epilepsy",
		"p1": "In some people, flashing lights or light patterns can trigger epileptic seizures or loss of consciousness, even with no prior history. This game contains flashes, explosions and rapid colour changes. If you or anyone in your family has ever had seizures, ask a doctor before playing. Stop immediately and see a doctor if you experience dizziness, blurred vision, eye or muscle twitching, involuntary movements, disorientation or loss of consciousness.",
		"p2": "Play in a well-lit room, at a good distance from the screen, and take a 10 to 15 minute break every hour. Avoid playing when tired. Screen shake, glow and the CRT effect can be adjusted in the graphics options.",
		"h2": "A work of fiction",
		"p3": "Neo Vanguard is a work of fiction. The characters, organisations, places, consoles, brands and events depicted are imaginary. Any resemblance to real persons, companies or events, living or dead, existing or past, is purely coincidental.",
		"ok": "I UNDERSTAND" },
	"es": { "t": "ADVERTENCIA", "h1": "Salud — epilepsia",
		"p1": "En algunas personas, las luces intermitentes o los patrones luminosos pueden provocar crisis epilépticas o pérdidas de conocimiento, incluso sin antecedentes. Este juego contiene destellos, explosiones y cambios de color rápidos. Si tú o algún familiar habéis tenido crisis, consulta a un médico antes de jugar. Detente de inmediato y consulta a un médico si sientes mareos, visión borrosa, espasmos en los ojos o los músculos, movimientos involuntarios, desorientación o pérdida de conocimiento.",
		"p2": "Juega en una habitación bien iluminada, a buena distancia de la pantalla, y descansa de 10 a 15 minutos cada hora. Evita jugar si estás cansado. Las sacudidas, el halo y el efecto CRT se ajustan en las opciones gráficas.",
		"h2": "Obra de ficción",
		"p3": "Neo Vanguard es una obra de ficción. Los personajes, organizaciones, lugares, consolas, marcas y sucesos presentados son imaginarios. Cualquier parecido con personas, empresas o hechos reales, existentes o pasados, es pura coincidencia.",
		"ok": "ENTENDIDO" },
	"pt": { "t": "AVISO", "h1": "Saúde — epilepsia",
		"p1": "Em algumas pessoas, luzes piscantes ou padrões luminosos podem provocar crises epilépticas ou perda de consciência, mesmo sem histórico. Este jogo contém flashes, explosões e mudanças rápidas de cor. Se você ou alguém da sua família já teve crises, consulte um médico antes de jogar. Pare imediatamente e procure um médico se sentir tontura, visão turva, contrações nos olhos ou músculos, movimentos involuntários, desorientação ou perda de consciência.",
		"p2": "Jogue em um ambiente bem iluminado, a boa distância da tela, e faça uma pausa de 10 a 15 minutos a cada hora. Evite jogar cansado. O tremor de tela, o brilho e o efeito CRT podem ser ajustados nas opções gráficas.",
		"h2": "Obra de ficção",
		"p3": "Neo Vanguard é uma obra de ficção. Os personagens, organizações, lugares, consoles, marcas e acontecimentos apresentados são imaginários. Qualquer semelhança com pessoas, empresas ou fatos reais, existentes ou passados, é mera coincidência.",
		"ok": "ENTENDI" },
	"ja": { "t": "警告", "h1": "健康上の注意 — てんかん",
		"p1": "ごくまれに、強い光の点滅や光のパターンによって、けいれんや意識の喪失などの発作を起こす人がいます。これまで発作の経験がない人でも起こることがあります。このゲームには閃光、爆発、急激な色の変化が含まれます。あなたやご家族に発作の経験がある場合は、遊ぶ前に医師に相談してください。めまい、視覚の異常、目や筋肉のけいれん、意識の混乱、意識の喪失などを感じたら、すぐにプレイを中止し医師の診察を受けてください。",
		"p2": "部屋を明るくし、画面から離れて遊んでください。1時間ごとに10〜15分の休憩をとり、疲れているときは遊ばないでください。画面の揺れ、グロー、CRT効果はグラフィック設定で調整できます。",
		"h2": "フィクションです",
		"p3": "Neo Vanguard はフィクションです。登場する人物、団体、場所、ゲーム機、ブランド、出来事はすべて架空のものです。実在の人物、企業、出来事との類似はすべて偶然です。",
		"ok": "了解" },
}

func _ready() -> void:
	var ui := UIKit
	ui.dark_bg(self, 1.0)
	var T: Dictionary = TXT.get(str(Save.S.opts.get("lang", "fr")), TXT["en"])
	var v := ui.vbox(self, 6, 24.0)
	ui.spacer(v, 26)
	var t := ui.label(v, "⚠  " + str(T["t"]), 26, Color("ffd84a"))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.spacer(v, 8)
	var h1 := ui.label(v, str(T["h1"]).to_upper(), 14, Color("7fe6ff"))
	h1.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var p1 := ui.label(v, str(T["p1"]), 12, Color("cfd8ee"))
	p1.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var p2 := ui.label(v, str(T["p2"]), 12, Color("cfd8ee"))
	p2.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ui.spacer(v, 4)
	var h2 := ui.label(v, str(T["h2"]).to_upper(), 14, Color("7fe6ff"))
	h2.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var p3 := ui.label(v, str(T["p3"]), 12, Color("cfd8ee"))
	p3.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ui.spacer(v, 12)
	var b := ui.button(v, str(T["ok"]), func(): _close())
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER

func _close() -> void:
	if on_done.is_valid():
		on_done.call()
	else:
		if main:
			main.show_title()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("fire") or event.is_action_pressed("pause") \
			or event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_close()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_close()
