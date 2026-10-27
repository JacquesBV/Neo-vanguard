#!/usr/bin/env python3
"""
Génère le pack complet de 12 effets sonores cinématiques (SFX) Manga / Anime / SF
en 44.1 kHz Stéréo pour la cinématique d'intro de Neo Vanguard (sans voix IA).
Calé sur le tempo 134 BPM de la musique d'intro (assets/music/title.mp3).
"""
import os
import wave
import json
import numpy as np
from scipy import signal

SR = 44100
ROOT = "/home/user/Neo-vanguard"
SFX_OUT = os.path.join(ROOT, "assets/intro/audio/sfx")
os.makedirs(SFX_OUT, exist_ok=True)


def butter_filter(x: np.ndarray, cutoff, btype: str, order: int = 4) -> np.ndarray:
    sos = signal.butter(order, cutoff, btype=btype, fs=SR, output="sos")
    return signal.sosfilt(sos, x).astype(np.float32)


def comb_delay(x: np.ndarray, delay_ms: float, feedback: float = 0.35, mix: float = 0.35) -> np.ndarray:
    d = max(1, int(SR * delay_ms / 1000.0))
    b = np.zeros(d + 1, dtype=np.float32)
    b[0] = 1.0 - mix
    b[d] = mix
    a = np.zeros(d + 1, dtype=np.float32)
    a[0] = 1.0
    a[d] = -feedback
    return signal.lfilter(b, a, x).astype(np.float32)


def stereo_reverb(x_l: np.ndarray, x_r: np.ndarray, decay: float = 0.45, damp_hz: float = 3200.0, wet: float = 0.18):
    delays_l = [29.7, 37.1, 41.1, 43.7]
    delays_r = [31.3, 38.9, 42.7, 46.1]
    rev_l = np.zeros_like(x_l)
    rev_r = np.zeros_like(x_r)
    for dl, dr in zip(delays_l, delays_r):
        rev_l += comb_delay(x_l, dl, feedback=decay, mix=0.7) * 0.25
        rev_r += comb_delay(x_r, dr, feedback=decay, mix=0.7) * 0.25
    rev_l = butter_filter(rev_l, damp_hz, "low", 2)
    rev_r = butter_filter(rev_r, damp_hz, "low", 2)
    for ap in [5.0, 1.7]:
        d = int(SR * ap / 1000.0)
        b = np.zeros(d + 1); b[0] = -0.5; b[d] = 1.0
        a = np.zeros(d + 1); a[0] = 1.0; a[d] = -0.5
        rev_l = signal.lfilter(b, a, rev_l).astype(np.float32)
        rev_r = signal.lfilter(b, a, rev_r).astype(np.float32)
    return x_l * (1.0 - wet) + rev_l * wet, x_r * (1.0 - wet) + rev_r * wet


def save_wav_stereo(path: str, left: np.ndarray, right: np.ndarray, peak_db: float = -1.5) -> float:
    n = min(len(left), len(right))
    st = np.stack([left[:n], right[:n]], axis=1).astype(np.float32)
    st = np.tanh(st * 1.15) / np.tanh(1.15)
    pk = float(np.max(np.abs(st)))
    target = 10.0 ** (peak_db / 20.0)
    if pk > 1e-6:
        st = st * (target / pk)
    pcm = np.clip(st * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return n / float(SR)


def build_all():
    rng = np.random.default_rng(2049)

    # 1. sfx_manga_slash.wav : découpe de case manga ultra-nerveuse (whoosh + éclat acier)
    dur = 0.42
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    sweep_l = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [600, 7500], "bandpass", 3) * np.exp(-((t - 0.06) / 0.055) ** 2)
    sweep_r = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [800, 9000], "bandpass", 3) * np.exp(-((t - 0.075) / 0.06) ** 2)
    ping = np.sin(2 * np.pi * (3200 - 1900 * t / dur) * t) * np.exp(-t * 22.0) * 0.55
    sub = np.sin(2 * np.pi * (150 * np.exp(-t * 14.0)) * t) * np.exp(-t * 12.0) * 0.7
    save_wav_stereo(f"{SFX_OUT}/sfx_manga_slash.wav", sweep_l + ping + sub, sweep_r + ping * 0.9 + sub, -2.0)

    # 2. sfx_vorax_dread_horn.wav : Corne biomécanique abyssale de Vorax
    dur = 2.15
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    env = np.minimum(t / 0.08, 1.0) * np.exp(-np.maximum(0.0, t - 0.75) * 1.9)
    f0 = 46.0 - 5.0 * (t / dur)
    horn_l = np.zeros(n, dtype=np.float32)
    horn_r = np.zeros(n, dtype=np.float32)
    for k, det in [(1, 0.0), (2, 0.4), (3, -0.5), (4, 0.8), (6, -1.1), (8, 1.5)]:
        amp = 1.0 / (k ** 0.75)
        horn_l += amp * signal.sawtooth(2 * np.pi * (f0 * k + det) * t)
        horn_r += amp * signal.sawtooth(2 * np.pi * (f0 * k - det * 1.1) * t + 0.4)
    horn_l = np.tanh(butter_filter(horn_l, 950.0, "low", 3) * 1.8) * env
    horn_r = np.tanh(butter_filter(horn_r, 1050.0, "low", 3) * 1.8) * env
    metal = np.sin(2 * np.pi * 1120 * t) * np.exp(-t * 9.0) * 0.18
    horn_l, horn_r = stereo_reverb(horn_l + metal, horn_r + metal, decay=0.62, damp_hz=2400.0, wet=0.30)
    save_wav_stereo(f"{SFX_OUT}/sfx_vorax_dread_horn.wav", horn_l, horn_r, -1.5)

    # 3. sfx_hologram_materialize.wav : Apparition mystique cristalline de Vesta
    dur = 1.15
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0]
    holo_l = np.zeros(n, dtype=np.float32)
    holo_r = np.zeros(n, dtype=np.float32)
    for i, f in enumerate(freqs):
        t0 = i * 0.055
        mask = np.maximum(0.0, t - t0)
        e = (mask > 0) * np.exp(-mask * 4.5) * (1.0 - np.exp(-mask * 80.0))
        tone = np.sin(2 * np.pi * f * mask + 1.5 * np.sin(2 * np.pi * f * 2.0 * mask) * np.exp(-mask * 8.0))
        pan = 0.25 + 0.5 * (i / max(1, len(freqs) - 1))
        holo_l += tone * e * (1.0 - pan * 0.5)
        holo_r += tone * e * (0.5 + pan * 0.5)
    holo_l, holo_r = stereo_reverb(holo_l, holo_r, decay=0.55, damp_hz=8000.0, wet=0.35)
    save_wav_stereo(f"{SFX_OUT}/sfx_hologram_materialize.wav", holo_l, holo_r, -3.0)

    # 4. sfx_neural_awaken.wav : Impulsion synaptique + battement sourd d'éveil du Pilote
    dur = 1.10
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    hb1 = np.sin(2 * np.pi * 56.0 * t) * np.exp(-((t - 0.08) / 0.045) ** 2)
    hb2 = np.sin(2 * np.pi * 50.0 * t) * np.exp(-((t - 0.27) / 0.055) ** 2) * 0.85
    riser = np.sin(2 * np.pi * (280 + 1800 * (t / dur) ** 2) * t) * np.exp(-((t - 0.45) / 0.28) ** 2) * 0.35
    spark_l = hb1 + hb2 + riser + np.sin(2 * np.pi * 2640 * t) * np.exp(-np.maximum(0, t - 0.42) * 14) * (t > 0.42) * 0.25
    spark_r = hb1 + hb2 + riser * 0.9 + np.sin(2 * np.pi * 2652 * t) * np.exp(-np.maximum(0, t - 0.42) * 14) * (t > 0.42) * 0.25
    save_wav_stereo(f"{SFX_OUT}/sfx_neural_awaken.wav", spark_l, spark_r, -2.5)

    # 5. sfx_world_card_tick.wav : Verrouillage technologique de chacun des 8 Mondes (134 BPM)
    dur = 0.26
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    click = np.sin(2 * np.pi * (1950 - 900 * t / dur) * t) * np.exp(-t * 32.0) * 0.65
    lock = np.sin(2 * np.pi * 880 * t) * np.exp(-np.maximum(0, t - 0.045) * 26.0) * (t > 0.045) * 0.55
    lock2 = np.sin(2 * np.pi * 1320 * t) * np.exp(-np.maximum(0, t - 0.075) * 22.0) * (t > 0.075) * 0.50
    whoosh = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [1200, 6000], "bandpass", 2) * np.exp(-t * 18.0) * 0.35
    save_wav_stereo(f"{SFX_OUT}/sfx_world_card_tick.wav", click + lock + whoosh, click + lock2 + whoosh, -3.5)

    # 6. sfx_glitch_burst.wav : Interférence électromagnétique rouge de Vorax
    dur = 0.55
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    gates = ((np.sin(2 * np.pi * 29.0 * t) > -0.1) & (np.sin(2 * np.pi * 13.0 * t) > -0.3)).astype(np.float32)
    gl_l = (signal.square(2 * np.pi * (140 + 620 * np.mod(t * 11, 1.0)) * t) * 0.4 + rng.uniform(-1, 1, n) * 0.45) * gates * np.exp(-t * 4.2)
    gl_r = (signal.sawtooth(2 * np.pi * (165 + 540 * np.mod(t * 9, 1.0)) * t) * 0.4 + rng.uniform(-1, 1, n) * 0.45) * gates * np.exp(-t * 4.2)
    save_wav_stereo(f"{SFX_OUT}/sfx_glitch_burst.wav", gl_l.astype(np.float32), gl_r.astype(np.float32), -2.5)

    # 7. sfx_reactor_charge.wav : Montée en puissance des bimoteurs plasma bleus du Vanguard
    dur = 3.20
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    u = t / dur
    env = (u ** 1.4) * np.minimum(1.0, (1.0 - u) * 14.0)
    f_turb = 110.0 + 980.0 * (u ** 2.1)
    ph = np.cumsum(2 * np.pi * f_turb / SR)
    turb_l = (np.sin(ph) * 0.55 + np.sin(ph * 2.01) * 0.30 + signal.sawtooth(ph * 0.5) * 0.25) * env
    turb_r = (np.sin(ph * 1.003) * 0.55 + np.sin(ph * 1.99) * 0.30 + signal.sawtooth(ph * 0.502) * 0.25) * env
    jet = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [250, 4800], "bandpass", 2) * (u ** 1.8) * 0.45
    save_wav_stereo(f"{SFX_OUT}/sfx_reactor_charge.wav", turb_l + jet, turb_r + jet, -2.5)

    # 8. sfx_catapult_launch.wav : Catapultage électromagnétique + postcombustion supersonique !
    dur = 2.60
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    boom = np.sin(2 * np.pi * (95.0 * np.exp(-t * 5.2) + 34.0) * t) * np.exp(-t * 2.6) * 0.95
    roar_l = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [90, 5200], "bandpass", 2) * np.exp(-t * 1.35) * 0.85
    roar_r = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [90, 5200], "bandpass", 2) * np.exp(-t * 1.35) * 0.85
    rail = np.sin(2 * np.pi * (420 + 2400 * np.exp(-t * 6.0)) * t) * np.exp(-t * 4.5) * 0.45
    save_wav_stereo(f"{SFX_OUT}/sfx_catapult_launch.wav", boom + roar_l + rail, boom + roar_r + rail * 0.9, -1.0)

    # 9. sfx_logo_impact.wav : Impact final monumental du logo NEO VANGUARD
    dur = 2.80
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    sub_drop = np.sin(2 * np.pi * (110.0 * np.exp(-t * 6.5) + 38.0) * t) * np.exp(-t * 1.65) * 0.95
    chord_l = np.zeros(n, dtype=np.float32)
    chord_r = np.zeros(n, dtype=np.float32)
    for i, f in enumerate([146.83, 220.0, 293.66, 440.0, 587.33, 880.0]):
        c_env = (1.0 - np.exp(-t * 90.0)) * np.exp(-t * (1.2 + i * 0.22))
        chord_l += np.sin(2 * np.pi * f * t) * c_env * 0.22
        chord_r += np.sin(2 * np.pi * (f * 1.002) * t + 0.3) * c_env * 0.22
    hit_nz = butter_filter(rng.uniform(-1, 1, n).astype(np.float32), [1500, 9000], "bandpass", 2) * np.exp(-t * 14.0) * 0.5
    out_l, out_r = stereo_reverb(sub_drop + chord_l + hit_nz, sub_drop + chord_r + hit_nz, decay=0.65, damp_hz=5500.0, wet=0.32)
    save_wav_stereo(f"{SFX_OUT}/sfx_logo_impact.wav", out_l, out_r, -1.0)

    # 10. sfx_cue_vesta.wav : Signature sonore non-vocale de Vesta (onde cristalline mystique douce)
    dur = 0.38
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    vl = (np.sin(2 * np.pi * 880.0 * t) * 0.5 + np.sin(2 * np.pi * 1318.5 * t) * 0.35) * np.exp(-t * 9.5) * (1.0 - np.exp(-t * 120.0))
    vr = (np.sin(2 * np.pi * 884.0 * t) * 0.5 + np.sin(2 * np.pi * 1760.0 * t) * 0.30) * np.exp(-t * 9.5) * (1.0 - np.exp(-t * 120.0))
    vl, vr = stereo_reverb(vl.astype(np.float32), vr.astype(np.float32), decay=0.45, damp_hz=7000.0, wet=0.28)
    save_wav_stereo(f"{SFX_OUT}/sfx_cue_vesta.wav", vl, vr, -6.0)

    # 11. sfx_cue_pilote.wav : Signature sonore non-vocale du Pilote (impulsion cockpit tactique)
    dur = 0.22
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    pl = (np.sin(2 * np.pi * 1174.6 * t) * np.exp(-t * 28.0) + np.sin(2 * np.pi * 1567.9 * np.maximum(0, t - 0.045)) * (t > 0.045) * np.exp(-np.maximum(0, t - 0.045) * 24.0)) * 0.5
    save_wav_stereo(f"{SFX_OUT}/sfx_cue_pilote.wav", pl.astype(np.float32), (pl * 0.92).astype(np.float32), -6.5)

    # 12. sfx_cue_vorax.wav : Signature sonore non-vocale de Vorax (impact servo-mécanique grave)
    dur = 0.52
    n = int(dur * SR); t = np.arange(n, dtype=np.float32) / SR
    vx_l = np.tanh((signal.sawtooth(2 * np.pi * (62.0 - 18.0 * t / dur) * t) * 0.7 + np.sin(2 * np.pi * 124.0 * t) * 0.4) * np.exp(-t * 6.5) * 1.8)
    vx_r = np.tanh((signal.sawtooth(2 * np.pi * (61.2 - 18.0 * t / dur) * t + 0.5) * 0.7 + np.sin(2 * np.pi * 185.0 * t) * 0.35) * np.exp(-t * 6.5) * 1.8)
    vx_l = butter_filter(vx_l.astype(np.float32), 750.0, "low", 3)
    vx_r = butter_filter(vx_r.astype(np.float32), 820.0, "low", 3)
    save_wav_stereo(f"{SFX_OUT}/sfx_cue_vorax.wav", vx_l, vx_r, -4.0)

    manifest = {"sfx": {}}
    for fn in sorted(os.listdir(SFX_OUT)):
        if fn.endswith(".wav"):
            with wave.open(os.path.join(SFX_OUT, fn), "rb") as w:
                d = w.getnframes() / float(w.getframerate())
            manifest["sfx"][fn[:-4]] = {"duration": round(d, 3), "path": f"res://assets/intro/audio/sfx/{fn}"}
            print(f"SFX OK: {fn} ({d:.2f}s)")
    with open(os.path.join(ROOT, "assets/intro/audio/sfx_manifest.json"), "w", encoding="utf-8") as fp:
        json.dump(manifest, fp, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    build_all()
