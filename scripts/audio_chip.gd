extends RefCounted
## =========================================================================
## AUDIO_CHIP — retranscription de la synthèse WebAudio d'origine :
## Audio2.voice (l.2087), Audio2.noise (l.2112), saw3 (l.2128) et les
## recettes de Audio2.sfx (l.2132-2317). Chaque effet est rendu une fois
## en AudioStreamWAV stéréo 16 bits (cache par nom × ère × variante),
## puis rejoué par le pool d'Audio2 — zéro coût par répétition.
## =========================================================================

const SR := 44100

## n2f : demi-tons au-dessus d'une base (l'helper d'origine)
static func n2f(semi: int, base: float) -> float:
	return base * pow(2.0, semi / 12.0)

## ------------------------------------------------------------------ rendu
## evs : tableau d'événements { t, dur, wav, f, f2, vol, pan, att, flt, vib }
##       (flt = { type, f, f2, q } — biquad RBJ, rampes de coupure)
static func render(name: String, era: int, big := false) -> AudioStreamWAV:
	var evs := recipe(name, era, big)
	if evs.is_empty():
		return null
	var total := 0.0
	for ev: Dictionary in evs:
		total = maxf(total, float(ev.t) + float(ev.dur) + 0.06)
	var n := int(ceil(total * SR))
	var L := PackedFloat32Array()
	var R := PackedFloat32Array()
	L.resize(n)
	R.resize(n)
	for ev: Dictionary in evs:
		if ev.get("noise", false):
			_render_noise(L, R, ev)
		else:
			_render_voice(L, R, ev)
	# écho de fin d'ère (applyEraFx d'origine : delay 0,24 s ère 2, 0,30 s au-delà)
	var tap := 0
	var fb := 0.0
	if era == 2:
		tap = int(0.24 * SR); fb = 0.22
	elif era >= 3:
		tap = int(0.30 * SR); fb = 0.30
	if tap > 0 and tap < n:
		for i in range(tap, n):
			var wet: float = (L[i - tap] + R[i - tap]) * 0.5 * fb
			L[i] += wet
			R[i] += wet * 0.82
	var img := AudioStreamWAV.new()
	img.format = AudioStreamWAV.FORMAT_16_BITS
	img.mix_rate = SR
	img.stereo = true
	var pcm := PackedByteArray()
	pcm.resize(n * 4)
	for i in n:
		var l: int = clampi(int(L[i] * 32767.0), -32768, 32767)
		var r: int = clampi(int(R[i] * 32767.0), -32768, 32767)
		pcm.encode_s16(i * 4, l)
		pcm.encode_s16(i * 4 + 2, r)
	img.data = pcm
	return img

## ------------------------------------------------------- voix (Audio2.voice)
static func _render_voice(L: PackedFloat32Array, R: PackedFloat32Array, ev: Dictionary) -> void:
	var t0: float = float(ev.t)
	var dur: float = float(ev.dur)
	var i0: int = int(t0 * SR)
	var n := int(dur * SR)
	if n <= 0 or i0 >= L.size():
		return
	var f0: float = float(ev.f)
	var f1: float = float(ev.get("f2", 0.0))
	var vol: float = float(ev.vol)
	var att: float = float(ev.get("att", 0.004))
	var ph := 0.0
	var flt: Dictionary = ev.get("flt", {})
	var b := _biquad_init(flt, f0)
	var vibs: float = float(ev.get("vib", 0.0))
	var gl := 0.0
	var gr := 0.0
	var pan := clampf(float(ev.get("pan", 0.0)), -1.0, 1.0)
	var pl := cos((pan + 1.0) * PI / 4.0)
	var pr := sin((pan + 1.0) * PI / 4.0)
	for i in n:
		var tt: float = i / float(SR)
		# fréquence : rampe exponentielle f → f2 (exponentialRampToValueAtTime)
		var f: float = f0
		if f1 > 0.0:
			f = f0 * pow(f1 / f0, clampf(tt / dur, 0.0, 1.0))
		if vibs > 0.0:
			f *= 1.0 + vibs * 0.24 * sin(TAU * 6.2 * tt)
		ph = fposmod(ph + f / SR, 1.0)
		var w: String = ev.get("wav", "square")
		var s: float
		if w == "square":
			s = 1.0 if ph < 0.5 else -1.0
		elif w == "sawtooth":
			s = ph * 2.0 - 1.0
		elif w == "sine":
			s = sin(TAU * ph)
		else: # triangle
			s = (4.0 * absf(ph - 0.5) - 1.0)
		# enveloppe : attaque linéaire puis décroissance exponentielle
		var env: float
		if tt < att:
			env = tt / maxf(att, 1e-5)
		else:
			env = pow(0.0001 / maxf(vol, 1e-6), (tt - att) / maxf(dur - att, 1e-5))
		s *= env * vol
		if not flt.is_empty():
			_biquad_step(b, s, flt, f0, tt, dur)
			s = b.y
		var idx := i0 + i
		if idx >= L.size():
			break
		L[idx] += s * pl
		R[idx] += s * pr

## ------------------------------------------------------ bruit (Audio2.noise)
static func _render_noise(L: PackedFloat32Array, R: PackedFloat32Array, ev: Dictionary) -> void:
	var t0: float = float(ev.t)
	var dur: float = float(ev.dur)
	var i0: int = int(t0 * SR)
	var n := int(dur * SR)
	if n <= 0 or i0 >= L.size():
		return
	var vol: float = float(ev.vol)
	var flt: Dictionary = ev.get("flt", {})
	var b := _biquad_init(flt, float(flt.get("f", 1200.0)))
	var pan := clampf(float(ev.get("pan", 0.0)), -1.0, 1.0)
	var pl := cos((pan + 1.0) * PI / 4.0)
	var pr := sin((pan + 1.0) * PI / 4.0)
	var seed := randf() * 97.0
	for i in n:
		var tt: float = i / float(SR)
		var s: float = fposmod(sin(float(i) * 12.9898 + seed) * 43758.5453, 1.0) * 2.0 - 1.0
		var env: float = pow(0.0001 / maxf(vol, 1e-6), tt / maxf(dur, 1e-5))
		s *= env * vol
		if not flt.is_empty():
			_biquad_step(b, s, flt, float(flt.get("f", 1200.0)), tt, dur)
			s = b.y
		var idx := i0 + i
		if idx >= L.size():
			break
		L[idx] += s * pl
		R[idx] += s * pr

## biquad RBJ, coefficients recalculés tous les 32 échantillons (rampes de f)
static func _biquad_init(flt: Dictionary, f0: float) -> Dictionary:
	return { "x1": 0.0, "x2": 0.0, "y1": 0.0, "y2": 0.0, "b0": 1.0, "b1": 0.0, "b2": 0.0, "a1": 0.0, "a2": 0.0, "tick": -1 }

static func _biquad_step(b: Dictionary, x: float, flt: Dictionary, _f0: float, tt: float, dur: float) -> void:
	if b.tick < 0 or int(tt * SR) - b.tick >= 32:
		b.tick = int(tt * SR)
		var fc: float = float(flt.get("f", 800.0))
		var f2: float = float(flt.get("f2", 0.0))
		if f2 > 0.0:
			fc = fc * pow(f2 / maxf(fc, 1.0), clampf(tt / maxf(dur, 1e-5), 0.0, 1.0))
		fc = clampf(fc, 30.0, SR * 0.45)
		var q: float = maxf(0.3, float(flt.get("q", 1.0)))
		var w0 := TAU * fc / SR
		var cs := cos(w0)
		var al := sin(w0) / (2.0 * q)
		var type: String = flt.get("type", "lowpass")
		var b0: float
		var b1: float
		var b2: float
		var a0: float
		var a1: float
		var a2: float
		if type == "lowpass":
			b0 = (1.0 - cs) / 2.0
			b1 = 1.0 - cs
			b2 = b0
			a0 = 1.0 + al
			a1 = -2.0 * cs
			a2 = 1.0 - al
		elif type == "highpass":
			b0 = (1.0 + cs) / 2.0
			b1 = -(1.0 + cs)
			b2 = b0
			a0 = 1.0 + al
			a1 = -2.0 * cs
			a2 = 1.0 - al
		else: # bandpass (const skirt gain 0 dB, comme BiquadFilter WebAudio)
			b0 = al
			b1 = 0.0
			b2 = -al
			a0 = 1.0 + al
			a1 = -2.0 * cs
			a2 = 1.0 - al
		b.b0 = b0 / a0
		b.b1 = b1 / a0
		b.b2 = b2 / a0
		b.a1 = a1 / a0
		b.a2 = a2 / a0
	var xn: float = x
	var yn: float = b.b0 * xn + b.b1 * b.x1 + b.b2 * b.x2 - b.a1 * b.y1 - b.a2 * b.y2
	b.x2 = b.x1
	b.x1 = xn
	b.y2 = b.y1
	b.y1 = yn
	b.y = yn

## ===================================================================== sfx
## Les recettes de Audio2.sfx, ère par ère (e = style de génération 0..5).
static func recipe(name: String, e: int, big := false) -> Array:
	var out: Array = []
	var SEND: float = 0.25 if e >= 3 else (0.1 if e == 2 else 0.0)
	match name:
		"shoot":
			if e == 0:
				out.append(_v(0.0, 880.0, 260.0, 0.055, "square", 0.10))
			elif e == 1:
				out.append(_v(0.0, 1180.0, 300.0, 0.07, "square", 0.085))
				out.append(_n(0.0, 0.03, 0.03, _flt("highpass", 6000.0, 3000.0)))
			elif e == 2:
				out.append(_v(0.0, 1500.0, 380.0, 0.09, "square", 0.07, _flt("bandpass", 1900.0, 0.0, 1.4)))
				out.append(_n(0.0, 0.04, 0.035, _flt("highpass", 7000.0, 2200.0)))
			else:
				out.append(_v(0.0, 2100.0, 420.0, 0.12, "sawtooth", 0.05, _flt("lowpass", 5200.0, 1200.0, 2.5)))
				out.append(_v(0.0, 90.0, 55.0, 0.09, "sine", 0.07))
				out.append(_n(0.0, 0.05, 0.03, _flt("highpass", 9000.0, 3000.0)))
		"cannon":
			out.append(_v(0.0, 420.0, 70.0, 0.2, "sawtooth" if e >= 2 else "square", 0.13))
			out.append(_n(0.0, 0.2 if e >= 2 else 0.1, 0.1, _flt("lowpass", 2600.0, 300.0)))
			if e >= 3:
				out.append(_v(0.0, 120.0, 40.0, 0.3, "sine", 0.2))
		"laser":
			if e == 0:
				out.append(_v(0.0, 1560.0, 0.0, 0.09, "square", 0.07))
			else:
				out.append(_v(0.0, 2400.0 if e >= 2 else 1900.0, 900.0, 0.11, "sawtooth", 0.06, _flt("bandpass", 2400.0, 0.0, 3.4)))
		# (C10) clic d'interface : menus, boutons SELECT/START de la coque
		"uiclick":
			out.append(_v(0.0, 1350.0, 620.0, 0.045, "square", 0.055))
			out.append(_v(0.0, 2250.0, 1000.0, 0.028, "square", 0.03))
		"ehit":
			if e == 0:
				out.append(_n(0.0, 0.04, 0.08, _flt("bandpass", 2600.0, 1600.0, 1.1)))
			else:
				out.append(_n(0.0, 0.06, 0.08, _flt("bandpass", 3600.0, 1400.0, 1.3)))
		"explode":
			if e == 0:
				out.append(_n(0.0, 0.42 if big else 0.22, 0.3 if big else 0.2, _flt("lowpass", 1100.0, 90.0, 0.7)))
				out.append(_v(0.0, 130.0 if big else 200.0, 34.0, 0.36 if big else 0.2, "square", 0.16))
			elif e == 1:
				out.append(_n(0.0, 0.55 if big else 0.28, 0.32 if big else 0.22, _flt("lowpass", 2000.0, 80.0, 0.6)))
				out.append(_v(0.0, 240.0, 40.0, 0.4 if big else 0.22, "square", 0.14))
				out.append(_n(0.0, 0.1, 0.1, _flt("highpass", 5000.0, 1500.0)))
			elif e == 2:
				out.append(_n(0.0, 0.7 if big else 0.34, 0.34 if big else 0.24, _flt("lowpass", 2400.0, 70.0, 0.55)))
				out.append(_v(0.0, 200.0, 32.0, 0.5 if big else 0.26, "sawtooth", 0.16, _flt("lowpass", 900.0, 120.0, 2.0)))
				out.append(_n(0.0, 0.18, 0.1, _flt("highpass", 7000.0, 2000.0)))
			else:
				out.append(_n(0.0, 1.0 if big else 0.45, 0.32 if big else 0.22, _flt("lowpass", 3200.0, 60.0, 0.5)))
				out.append(_v(0.0, 150.0, 26.0, 0.7 if big else 0.35, "sine", 0.3))
				out.append(_v(0.0, 420.0, 60.0, 0.5 if big else 0.3, "sawtooth", 0.12, _flt("lowpass", 1600.0, 200.0, 3.0)))
				out.append(_n(0.0, 0.25, 0.12, _flt("highpass", 11000.0, 3000.0)))
		"hurt":
			if e == 0:
				out.append(_v(0.0, 300.0, 80.0, 0.3, "square", 0.22))
			elif e == 1:
				out.append(_v(0.0, 340.0, 70.0, 0.32, "square", 0.2))
				out.append(_n(0.0, 0.28, 0.14, _flt("lowpass", 900.0, 90.0)))
			elif e == 2:
				out.append(_v(0.0, 360.0, 60.0, 0.4, "sawtooth", 0.18, _flt("lowpass", 1400.0, 200.0, 3.0)))
				out.append(_n(0.0, 0.36, 0.15, _flt("lowpass", 1200.0, 80.0)))
			else:
				out.append(_v(0.0, 420.0, 48.0, 0.55, "sawtooth", 0.16, _flt("lowpass", 2200.0, 120.0, 4.0)))
				out.append(_v(0.0, 130.0, 34.0, 0.5, "sine", 0.28))
				out.append(_n(0.0, 0.4, 0.14, _flt("lowpass", 1600.0, 90.0)))
		"shieldbreak":
			out.append(_v(0.0, 1500.0, 240.0, 0.32, "square", 0.13))
			out.append(_n(0.0, 0.36 if e >= 2 else 0.26, 0.13, _flt("bandpass", 5200.0, 900.0, 2.0)))
		"pick":
			if e == 0:
				out.append(_v(0.0, 1046.0, 0.0, 0.05, "square", 0.1))
				out.append(_v(0.05, 1568.0, 0.0, 0.09, "square", 0.1))
			elif e == 1:
				for i in 3:
					out.append(_v(i * 0.05, n2f([0, 4, 7][i], 1046.0), 0.0, 0.08, "square", 0.09))
			else:
				for i in 4:
					out.append(_v(i * 0.045, n2f([0, 4, 7, 12][i], 1046.0), 0.0, 0.1,
						"triangle" if e >= 3 else "square", 0.08, {}, 0.2 if i % 2 == 1 else -0.2))
		"coin":
			if e == 0:
				for i in 3:
					out.append(_v(i * 0.05, n2f([0, 4, 7][i], 1046.0), 0.0, 0.07, "square", 0.08))
			elif e == 1:
				for i in 3:
					out.append(_v(i * 0.045, n2f([0, 7, 12][i], 1046.0), 0.0, 0.08, "square", 0.08))
			else:
				for i in 4:
					out.append(_v(i * 0.04, n2f([0, 7, 12, 19][i], 1174.0), 0.0, 0.1,
						"triangle" if e >= 3 else "square", 0.07, {}, 0.3 if i % 2 == 1 else -0.3))
		"power":
			var sc: Array = [0, 3, 7, 10, 12, 15, 19]
			for i in sc.size():
				out.append(_v(i * (0.035 if e >= 2 else 0.045), n2f(sc[i], 880.0), 0.0,
					0.09 if e >= 2 else 0.06, "sawtooth" if e >= 3 else "square", 0.075))
			if e >= 3:
				out.append(_n(0.0, 0.5, 0.06, _flt("bandpass", 3000.0, 9000.0, 1.0)))
		"buy":
			for i in 4:
				out.append(_v(i * 0.085, n2f([0, 4, 7, 12][i], 523.0), 0.0, 0.3 if i == 3 else 0.12,
					"sawtooth" if e >= 3 else "triangle", 0.09))
		"ui":
			out.append(_v(0.0, 1200.0 if e >= 3 else 880.0, 1600.0 if e >= 3 else 1100.0, 0.04, "square", 0.05))
		"back":
			out.append(_v(0.0, 620.0, 380.0, 0.05, "square", 0.05))
		"bomb":
			out.append(_n(0.0, 1.3, 0.36, _flt("lowpass", 3400.0, 40.0, 0.5)))
			out.append(_v(0.0, 240.0, 22.0, 1.0, "sawtooth" if e >= 2 else "square", 0.28))
			if e >= 2:
				out.append(_v(0.0, 70.0, 18.0, 1.4, "sine", 0.34))
				out.append(_n(0.1, 1.0, 0.15, _flt("highpass", 9000.0, 1200.0), 0.3))
		"warp":
			for i in 5:
				var f: float = 220.0 * pow(2.0, i * 0.45)
				out.append(_v(i * 0.18, f, f * 3.2, 0.4, "sawtooth" if e >= 3 else "square", 0.07,
					_flt("bandpass", 900.0 + i * 500.0, 0.0, 3.0)))
			out.append(_n(0.5, 1.1, 0.14, _flt("bandpass", 400.0, 8000.0, 0.8)))
			out.append(_v(1.0, 1800.0, 260.0, 0.5, "sawtooth", 0.09, _flt("lowpass", 3000.0, 0.0, 4.0)))
		"warpSwap":
			out.append(_n(0.0, 1.2, 0.34, _flt("lowpass", 9000.0, 60.0, 0.5)))
			out.append(_v(0.0, 90.0, 26.0, 1.0, "sine", 0.34))
			for i in 6:
				out.append(_v(i * 0.035, 2400.0 - i * 340.0, 300.0, 0.35, "sawtooth" if e >= 3 else "square", 0.05))
			for i in 7:
				out.append(_v(0.25 + i * 0.075, n2f([0, 4, 7, 12, 16, 19, 24][i], 523.0), 0.0, 0.5,
					"sawtooth" if e >= 3 else "square", 0.08))
		"alert":
			for i in 4:
				out.append(_v(i * 0.21, 660.0 if i % 2 == 1 else 880.0, 0.0, 0.2 if e >= 2 else 0.16,
					"sawtooth" if e >= 3 else "square", 0.12))
			if e >= 3:
				out.append(_v(0.0, 110.0, 55.0, 1.6, "sawtooth", 0.12, _flt("lowpass", 400.0, 120.0, 4.0)))
		"bossAlarm":
			var classic := e <= 1
			for i in 3:
				var at := i * 0.86
				var base := 700.0 if classic else 520.0
				var wav: String = "square" if classic else ("sawtooth" if e >= 3 else "triangle")
				out.append(_v(at, base, 980.0 if classic else 1040.0, 0.34, wav, 0.17))
				out.append(_v(at + 0.38, 980.0 if classic else 1040.0, base * 0.82, 0.3, wav, 0.15))
			out.append(_v(0.0, 92.0, 42.0, 1.35, "sine" if e >= 3 else "triangle", 0.2))
			if e >= 2:
				out.append(_n(0.0, 0.72, 0.075, _flt("lowpass", 1800.0, 220.0, 0.8)))
		"levelup":
			var sc2: Array = [0, 4, 7, 12, 16, 19, 24, 28]
			for i in sc2.size():
				out.append(_v(i * 0.07, n2f(sc2[i], 523.0), 0.0, 0.16, "sawtooth" if e >= 3 else "square", 0.085))
			if e >= 2:
				out.append(_n(0.0, 0.6, 0.07, _flt("bandpass", 4000.0, 12000.0, 0.8)))
		"reward":
			var sc3: Array = [0, 7, 12, 16, 19, 24, 28] if e >= 2 else [0, 4, 7, 12, 16, 19]
			for i in sc3.size():
				out.append(_v(i * 0.075, n2f(sc3[i], 523.0), 0.0, 0.42 if i == sc3.size() - 1 else 0.18,
					"triangle" if e >= 3 else "square", 0.095, {}, 0.12 if i % 2 == 1 else -0.12))
			if e >= 2:
				out.append(_n(0.22, 0.34, 0.045, _flt("highpass", 5200.0, 9800.0, 0.8)))
		"gameover":
			var sc4: Array = [12, 8, 5, 3, 0, -4] if e >= 2 else [12, 8, 5, 3, 0]
			for i in sc4.size():
				var flt := {}
				if e >= 3:
					flt = _flt("lowpass", 2400.0, 0.0, 2.0)
				out.append(_v(i * 0.22, n2f(sc4[i], 440.0), 0.0, 0.4, "sawtooth" if e >= 3 else "square", 0.11, flt))
		_:
			return []
	return out

## ------------------------------------------------------- constructeurs d'evt
static func _flt(type: String, f: float, f2: float, q := 1.0) -> Dictionary:
	return { "type": type, "f": f, "f2": f2, "q": q }

static func _v(t: float, f: float, f2: float, dur: float, wav: String, vol: float,
		flt := {}, pan := 0.0, vib := 0.0) -> Dictionary:
	var ev := { "t": t, "f": f, "f2": f2, "dur": dur, "wav": wav, "vol": vol, "pan": pan, "vib": vib }
	if not flt.is_empty():
		ev["flt"] = flt
	return ev

static func _n(t: float, dur: float, vol: float, flt: Dictionary, pan := 0.0) -> Dictionary:
	var ev := { "t": t, "dur": dur, "vol": vol, "noise": true, "pan": pan, "flt": flt, "f": 1000.0 }
	return ev
