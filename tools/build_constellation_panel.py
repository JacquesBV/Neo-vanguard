#!/usr/bin/env python3
"""
Génère assets/intro/panels/panel_09_huit_mondes_constellation.png (768x1376) :
Spirale stellaire ascendante des 8 Mondes — 24 Secteurs où chaque palier
arbore la console canonique validée correspondante (de FanBoy en bas jusqu'à
Polytron 32 au sommet, en passant par Arcadion HCS).
"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

W, H = 768, 1376
CONSOLES = [
    ("holo_01_fanboy.png", "#b4d642"),
    ("holo_02_fanboy_adv.png", "#7b5cff"),
    ("holo_03_nexus8.png", "#f0485a"),
    ("holo_04_masterion8.png", "#ff5c38"),
    ("holo_05_nexus16.png", "#6ea8ff"),
    ("holo_06_megastorm16.png", "#ff8c38"),
    ("holo_07_arcadion_hcs.png", "#ebc363"),
    ("holo_08_polytron32.png", "#38c8ff"),
]


def hex_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def spiral_pt(u: float):
    # u = 0 (bas, Monde 1 FanBoy) -> u = 1 (sommet, Monde 8 Polytron 32)
    y = 1248.0 - u * 1072.0
    amp = 268.0 * (1.0 - 0.56 * u)
    ang = u * 4.4 * math.pi + 0.35
    x = W * 0.5 + math.sin(ang) * amp
    z = math.cos(ang)
    return x, y, z


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def main() -> None:
    rng = random.Random(20261027)
    bg = Image.new("RGBA", (W, H), (3, 5, 16, 255))

    # Nébuleuses cosmiques douces accordées aux teintes canoniques
    neb = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ndr = ImageDraw.Draw(neb, "RGBA")
    for cx, cy, r, col in [
        (560, 1180, 250, (125, 165, 50, 36)),
        (220, 1000, 255, (105, 78, 225, 42)),
        (540, 810, 245, (215, 62, 78, 38)),
        (200, 620, 255, (90, 145, 235, 42)),
        (560, 420, 250, (225, 168, 65, 40)),
        (384, 185, 285, (48, 175, 245, 50)),
    ]:
        ndr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    neb = neb.filter(ImageFilter.GaussianBlur(78))
    bg = Image.alpha_composite(bg, neb)

    # Champ d'étoiles profond
    sdr = ImageDraw.Draw(bg, "RGBA")
    tints = [(255, 255, 255), (195, 228, 255), (255, 228, 196)]
    radii = [0.8] * 10 + [1.1] * 6 + [1.6] * 3 + [2.3] * 1
    for _ in range(540):
        sx = rng.uniform(0.0, W)
        sy = rng.uniform(0.0, H)
        sr = rng.choice(radii)
        al = rng.randint(90, 245)
        tint = rng.choice(tints)
        sdr.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(*tint, al))

    # Ruban orbital 3D de la spirale des 24 secteurs
    ribbon = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rdr = ImageDraw.Draw(ribbon, "RGBA")
    N = 420
    pts_main, pts_in, pts_out, cols = [], [], [], []
    palette = [hex_rgb(c) for _, c in CONSOLES]
    for i in range(N + 1):
        u = i / N
        x, y, z = spiral_pt(u)
        w_half = 19.0 * (1.0 - 0.35 * u) * (0.78 + 0.28 * z)
        pts_main.append((x, y))
        pts_in.append((x - w_half, y + 6.0))
        pts_out.append((x + w_half, y - 6.0))
        f = u * 7.0
        k0 = min(6, int(f))
        t = f - k0
        c0, c1 = palette[k0], palette[k0 + 1]
        cols.append(tuple(int(c0[j] * (1.0 - t) + c1[j] * t) for j in range(3)))

    for i in range(N):
        c = cols[i]
        rdr.line([pts_in[i], pts_in[i + 1]], fill=(*c, 195), width=3)
        rdr.line([pts_out[i], pts_out[i + 1]], fill=(*c, 195), width=3)
        rdr.line([pts_main[i], pts_main[i + 1]], fill=(255, 255, 255, 155), width=2)
        if i % 5 == 0:
            rdr.line([pts_in[i], pts_out[min(N, i + 3)]], fill=(*c, 125), width=2)
            rdr.line([pts_out[i], pts_in[min(N, i + 3)]], fill=(*c, 110), width=1)

    # 24 étoiles-relais de secteurs le long de la spirale (3 par monde)
    for sec in range(24):
        u_s = (sec + 0.5) / 24.0
        sx, sy, _ = spiral_pt(u_s)
        sc = palette[sec // 3]
        rdr.ellipse([sx - 8, sy - 8, sx + 8, sy + 8], fill=(*sc, 170))
        rdr.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=(255, 255, 255, 248))

    rib_glow = ribbon.filter(ImageFilter.GaussianBlur(12))
    bg = Image.alpha_composite(bg, rib_glow)
    bg = Image.alpha_composite(bg, ribbon)

    # Paliers équilibrés en quinconce ascendant pour zéro chevauchement des 8 consoles canoniques
    node_us = [0.045, 0.175, 0.310, 0.440, 0.575, 0.705, 0.835, 0.968]
    fixed_positions = [
        (586.0, 1204.0),  # M1 FanBoy (droite bas)
        (356.0, 1042.0),  # M2 FanBoy Adventure (centre-gauche)
        (178.0, 882.0),   # M3 NEXUS 8 (gauche)
        (456.0, 742.0),   # M4 Masterion 8 (centre-droite)
        (582.0, 578.0),   # M5 NEXUS 16 (droite)
        (198.0, 452.0),   # M6 MegaStorm 16 (gauche)
        (556.0, 318.0),   # M7 Arcadion HCS (droite haut)
        (364.0, 144.0),   # M8 Polytron 32 (sommet)
    ]

    for idx, (fn, chex) in enumerate(CONSOLES):
        u_w = node_us[idx]
        nx, ny = fixed_positions[idx]
        sz = 200 if idx == 7 else (188 if idx == 6 else 172)
        rgb = hex_rgb(chex)

        # Halo stellaire + socle orbital elliptique sous chaque console
        halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        hdr = ImageDraw.Draw(halo, "RGBA")
        hr = int(sz * 0.48)
        hdr.ellipse([int(nx) - hr, int(ny) - hr, int(nx) + hr, int(ny) + hr], fill=(*rgb, 64))
        halo = halo.filter(ImageFilter.GaussianBlur(24))
        bg = Image.alpha_composite(bg, halo)

        sp_x, sp_y, _ = spiral_pt(u_w)
        bdr = ImageDraw.Draw(bg, "RGBA")
        ped_off = 0.36 if idx in (1, 6) else 0.44
        ped_y = ny + sz * ped_off
        bdr.line([(sp_x, sp_y), (nx, ped_y)], fill=(*rgb, 175), width=2)
        bdr.ellipse([sp_x - 5, sp_y - 5, sp_x + 5, sp_y + 5], fill=(255, 255, 255, 240))
        for rx_m, al in [(0.44, 155), (0.31, 105)]:
            rx = sz * rx_m
            ry = rx * 0.19
            bdr.ellipse([nx - rx, ped_y - ry, nx + rx, ped_y + ry], outline=(*rgb, al), width=2)

        holo = Image.open(Path("assets/intro/consoles") / fn).convert("RGBA")
        holo_rs = holo.resize((sz, sz), Image.Resampling.LANCZOS)
        bg.alpha_composite(holo_rs, (int(nx - sz * 0.5), int(ny - sz * 0.52)))

    out_path = Path("assets/intro/panels/panel_09_huit_mondes_constellation.png")
    bg.convert("RGB").save(out_path, format="PNG", optimize=True)
    print("Built panel_09_huit_mondes_constellation.png:", bg.size, f"({out_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
