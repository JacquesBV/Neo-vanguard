#!/usr/bin/env python3
"""
Adapte les 8 consoles canoniques validées du pack officiel
`NeoVanguard_References_Consoles_LMArena` vers `assets/intro/consoles/` :
  1. holo_01_fanboy.png        — FanBoy (Secteurs 1–3)
  2. holo_02_fanboy_adv.png    — FanBoy Adventure (Secteurs 4–6)
  3. holo_03_nexus8.png        — NEXUS 8 (Secteurs 7–9)
  4. holo_04_masterion8.png    — Masterion 8 (Secteurs 10–12)
  5. holo_05_nexus16.png       — NEXUS 16 (Secteurs 13–15)
  6. holo_06_megastorm16.png   — MegaStorm 16 (Secteurs 16–18)
  7. holo_07_arcadion_hcs.png  — Arcadion HCS (Secteurs 19–21, Holographic Control Station)
  8. holo_08_polytron32.png    — Polytron 32 (Secteurs 22–24)

Règles strictes :
- Aucun pixel opaque des consoles validées n'est recoloré, déformé ni recomposé par IA.
- Chaque ensemble RGBA haute définition est recadré au plus près, mis à l'échelle
  proportionnelle (768×768 RGBA, LANCZOS) avec un halo radial doux strictement
  DERRIÈRE la silhouette alpha pour détacher les coques sombres sur fond spatial.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

PACK_DIR = Path("/tmp/nv_console_refs/NeoVanguard_References_Consoles")
OUT_DIR = Path("assets/intro/consoles")
CANVAS_SZ = 768
MAX_SPAN = 716

SPECS = [
    {
        "world": 1,
        "name": "FanBoy",
        "sectors": [1, 3],
        "src": "02_PNG_TRANSPARENTS/01_fanboy_ensemble.png",
        "out": "holo_01_fanboy.png",
        "color": "#b4d642",
        "accent": "#f2dfb6",
    },
    {
        "world": 2,
        "name": "FanBoy Adventure",
        "sectors": [4, 6],
        "src": "02_PNG_TRANSPARENTS/02_fanboy_adventure_ensemble.png",
        "out": "holo_02_fanboy_adv.png",
        "color": "#7b5cff",
        "accent": "#d8caff",
    },
    {
        "world": 3,
        "name": "NEXUS 8",
        "sectors": [7, 9],
        "src": "02_PNG_TRANSPARENTS/03_nexus_8_ensemble.png",
        "out": "holo_03_nexus8.png",
        "color": "#f0485a",
        "accent": "#e8edf5",
    },
    {
        "world": 4,
        "name": "Masterion 8",
        "sectors": [10, 12],
        "src": "02_PNG_TRANSPARENTS/04_masterion_8_ensemble.png",
        "out": "holo_04_masterion8.png",
        "color": "#ff5c38",
        "accent": "#ffc8bc",
    },
    {
        "world": 5,
        "name": "NEXUS 16",
        "sectors": [13, 15],
        "src": "02_PNG_TRANSPARENTS/05_nexus_16_ensemble.png",
        "out": "holo_05_nexus16.png",
        "color": "#6ea8ff",
        "accent": "#e4f0ff",
    },
    {
        "world": 6,
        "name": "MegaStorm 16",
        "sectors": [16, 18],
        "src": "02_PNG_TRANSPARENTS/06_megastorm_16_ensemble.png",
        "out": "holo_06_megastorm16.png",
        "color": "#ff8c38",
        "accent": "#ffe2b0",
    },
    {
        "world": 7,
        "name": "Arcadion HCS",
        "sectors": [19, 21],
        "src": "02_PNG_TRANSPARENTS/07_arcadion_hcs_ensemble.png",
        "out": "holo_07_arcadion_hcs.png",
        "color": "#ebc363",
        "accent": "#fff1be",
    },
    {
        "world": 8,
        "name": "Polytron 32",
        "sectors": [22, 24],
        "src": "02_PNG_TRANSPARENTS/08_polytron_32_ensemble.png",
        "out": "holo_08_polytron32.png",
        "color": "#38c8ff",
        "accent": "#dcf7ff",
    },
]


def hex_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tight_bbox(im: Image.Image, thr: int = 8):
    alpha_mask = im.split()[3].point(lambda a: 255 if a > thr else 0)
    return alpha_mask.getbbox()


def build_console_sprite(src_path: Path, out_path: Path, hex_col: str) -> None:
    im = Image.open(src_path).convert("RGBA")
    # Nettoyage des résidus alpha quasi-nuls (< 4) sans toucher à l'antialiasing
    r_ch, g_ch, b_ch, a_ch = im.split()
    a_clean = a_ch.point(lambda a: 0 if a < 4 else a)
    im = Image.merge("RGBA", (r_ch, g_ch, b_ch, a_clean))

    bb = tight_bbox(im, thr=8)
    crop = im.crop(bb)

    scale = min(MAX_SPAN / crop.width, MAX_SPAN / crop.height)
    nw = max(1, int(round(crop.width * scale)))
    nh = max(1, int(round(crop.height * scale)))
    resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_SZ, CANVAS_SZ), (0, 0, 0, 0))
    ox = (CANVAS_SZ - nw) // 2
    oy = (CANVAS_SZ - nh) // 2

    # Halo doux strictement en arrière-plan pour détacher les coques noires sur le vide spatial
    rgb = hex_rgb(hex_col)
    glow = Image.new("RGBA", (CANVAS_SZ, CANVAS_SZ), (0, 0, 0, 0))
    gdr = ImageDraw.Draw(glow, "RGBA")
    cx, cy = CANVAS_SZ // 2, CANVAS_SZ // 2 + 8
    rx, ry = int(nw * 0.44), int(nh * 0.42)
    gdr.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(*rgb, 40))
    # Contre-contour subtil dérivé de l'alpha du matériel (jamais par-dessus !)
    sil_a = resized.split()[3].point(lambda a: min(68, a // 3))
    sil_layer = Image.new("RGBA", (CANVAS_SZ, CANVAS_SZ), (0, 0, 0, 0))
    sil_tint = Image.new("RGBA", (nw, nh), (*rgb, 255))
    sil_tint.putalpha(sil_a)
    sil_layer.paste(sil_tint, (ox, oy))
    sil_layer = sil_layer.filter(ImageFilter.GaussianBlur(14))

    glow = glow.filter(ImageFilter.GaussianBlur(36))
    canvas = Image.alpha_composite(canvas, glow)
    canvas = Image.alpha_composite(canvas, sil_layer)

    # Pose 100 % fidèle du matériel canonique au premier plan
    fg = Image.new("RGBA", (CANVAS_SZ, CANVAS_SZ), (0, 0, 0, 0))
    fg.paste(resized, (ox, oy))
    canvas = Image.alpha_composite(canvas, fg)

    canvas.save(out_path, format="PNG", optimize=True)
    print(f"Built {out_path.name}: {canvas.size}, hardware={nw}x{nh}, size={out_path.stat().st_size // 1024} KB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    old_aes = OUT_DIR / "holo_07_arcadion_aes.png"
    if old_aes.exists():
        old_aes.unlink()
        print("Removed obsolete holo_07_arcadion_aes.png")

    if not PACK_DIR.exists():
        print(f"Pack directory {PACK_DIR} not mounted; verifying existing canonical PNGs in {OUT_DIR}:")
        for s in SPECS:
            p = OUT_DIR / s["out"]
            assert p.exists(), f"Missing {p}"
            print(f"  OK {p.name} ({p.stat().st_size // 1024} KB)")
        return

    for s in SPECS:
        build_console_sprite(PACK_DIR / s["src"], OUT_DIR / s["out"], s["color"])

    src_json = PACK_DIR / "03_FICHES_CONSOLES/consoles.json"
    if src_json.exists():
        raw = json.loads(src_json.read_text(encoding="utf-8"))
        canon_out = []
        for item, sp in zip(raw, SPECS):
            canon_out.append({
                "world": sp["world"],
                "slug": item["slug"],
                "name": item["name"],
                "sectors": item["sectors"],
                "color": sp["color"],
                "accent": sp["accent"],
                "sprite": f"res://assets/intro/consoles/{sp['out']}",
                "body": item["body"],
                "controls": item["controls"],
                "cartridge": item["cartridge"],
                "screen": item["screen"],
                "identity": item["identity"],
            })
        (OUT_DIR / "consoles_canon.json").write_text(
            json.dumps(canon_out, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print("Wrote assets/intro/consoles/consoles_canon.json")


if __name__ == "__main__":
    main()
