#!/usr/bin/env python3
"""Génère les effets sonores chiptune de Neo Vanguard (esprit WebAudio du jeu original)."""
import numpy as np, wave, os

SR = 22050
OUT = "/home/user/neo-vanguard-godot/assets/sfx"
os.makedirs(OUT, exist_ok=True)

def env(n, a=0.005, d=0.1):
    t = np.arange(n) / SR
    e = np.ones(n)
    ai = max(1, int(a * SR))
    e[:ai] = np.linspace(0, 1, ai)
    di = max(1, int(d * SR))
    if di < n:
        e[-di:] *= np.linspace(1, 0, di) ** 1.5
    return e

def square(f, n, duty=0.5):
    t = np.arange(n) / SR
    ph = (t * f) % 1.0
    return np.where(ph < duty, 1.0, -1.0)

def tri(f, n):
    t = np.arange(n) / SR
    return 2 * np.abs(2 * ((t * f) % 1.0) - 1) - 1

def saw(f, n):
    t = np.arange(n) / SR
    return 2 * ((t * f) % 1.0) - 1

def sweep(gen, f0, f1, dur, duty=0.5):
    n = int(dur * SR)
    out = np.zeros(n)
    ph = 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * (i / n)
        ph += f / SR
        if gen == "square":
            out[i] = 1.0 if (ph % 1.0) < duty else -1.0
        elif gen == "saw":
            out[i] = 2 * (ph % 1.0) - 1
        else:
            out[i] = 2 * np.abs(2 * (ph % 1.0) - 1) - 1
    return out

def noise(n):
    return np.random.uniform(-1, 1, n)

def lowpass(x, alpha):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y

def save(name, x, vol=0.6):
    x = np.asarray(x, dtype=np.float64)
    m = np.max(np.abs(x)) or 1.0
    x = x / m * vol
    data = (x * 32767).astype(np.int16)
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print("sfx:", name)

N = lambda dur: int(dur * SR)

# tir : blip carré descendant
x = sweep("square", 900, 420, 0.07, 0.4) * env(N(0.07), 0.002, 0.05)
save("shoot", x, 0.30)

# laser : balayage rapide
x = sweep("saw", 1500, 250, 0.13) * env(N(0.13), 0.002, 0.1)
save("laser", x, 0.32)

# canon plasma : carré grave
x = sweep("square", 220, 70, 0.16, 0.3) * env(N(0.16), 0.003, 0.12)
save("cannon", x, 0.42)

# tir ennemi : petit blip haut
x = sweep("square", 1300, 850, 0.06, 0.5) * env(N(0.06), 0.002, 0.04)
save("ehit", x, 0.22)

# explosion : souffle filtré
x = lowpass(noise(N(0.45)), 0.18) * env(N(0.45), 0.001, 0.4)
x += sweep("tri", 160, 40, 0.45) * 0.5 * env(N(0.45), 0.001, 0.4)
save("explode", x, 0.6)

# coin : deux notes carrées (classique arcade)
a = square(988, N(0.07)) * env(N(0.07), 0.002, 0.03)
b = square(1319, N(0.18)) * env(N(0.18), 0.002, 0.14)
save("coin", np.concatenate([a, b]), 0.35)

# power : arpège montant
notes = [523, 659, 784, 1047]
x = np.concatenate([square(f, N(0.08)) * env(N(0.08), 0.002, 0.05) for f in notes])
save("power", x, 0.38)

# pick : blip sinus
t = np.arange(N(0.05)) / SR
x = np.sin(2 * np.pi * 1200 * t) * env(N(0.05), 0.002, 0.04)
save("pick", x, 0.32)

# hurt : buzz descendant
x = sweep("saw", 320, 90, 0.22) * env(N(0.22), 0.002, 0.18)
save("hurt", x, 0.5)

# bouclier brisé : bruit + chute
x = noise(N(0.25)) * 0.6 + sweep("tri", 900, 180, 0.25) * 0.7
save("shieldbreak", x * env(N(0.25), 0.001, 0.22), 0.45)

# alerte : deux tons
a = square(700, N(0.14)) * env(N(0.14), 0.004, 0.06)
b = square(500, N(0.2)) * env(N(0.2), 0.004, 0.12)
save("alert", np.concatenate([a, b]), 0.4)

# alarme boss : 4 alternances
parts = []
for i in range(4):
    f = 620 if i % 2 == 0 else 830
    parts.append(square(f, N(0.16)) * env(N(0.16), 0.004, 0.05))
save("bossalarm", np.concatenate(parts), 0.5)

# secteur neutralisé : fanfare
seq = [(523, 0.1), (659, 0.1), (784, 0.1), (1047, 0.28)]
x = np.concatenate([square(f, N(d)) * env(N(d), 0.003, d * 0.6) for f, d in seq])
save("levelup", x, 0.42)

# bombe : gros boom
x = lowpass(noise(N(0.7)), 0.09) * env(N(0.7), 0.001, 0.65)
x += np.sin(2 * np.pi * 60 * np.arange(N(0.7)) / SR) * 0.8 * env(N(0.7), 0.001, 0.6)
save("bomb", x, 0.7)

# game over : descente triste
seq = [(392, 0.2), (330, 0.2), (262, 0.2), (196, 0.45)]
x = np.concatenate([tri(f, N(d)) * env(N(d), 0.005, d * 0.7) for f, d in seq])
save("gameover", x, 0.45)

# ui : micro blip
t = np.arange(N(0.03)) / SR
save("ui", np.sin(2 * np.pi * 880 * t) * env(N(0.03), 0.001, 0.02), 0.25)
print("OK — effets générés dans", OUT)
