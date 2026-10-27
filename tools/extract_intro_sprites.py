#!/usr/bin/env python3
"""
Extrait, nettoie et aligne au pixel près les planches de personnages (Pilote 8 poses,
Vesta 8 expressions), Vorax, le chasseur Vanguard MK-I et les 2 cockpits HD pour
la cinématique d'intro de Neo Vanguard.
"""
import os
import shutil
import numpy as np
from PIL import Image
from scipy import ndimage, signal

ROOT = "/home/user/Neo-vanguard"
REF = os.path.join(ROOT, ".cache/ref_models")
OUT = os.path.join(ROOT, "assets/intro")

def clean_rgba(im: Image.Image) -> Image.Image:
    """Supprime le léger halo noir sur les bords semi-transparents (de-fringe)."""
    arr = np.array(im.convert("RGBA"), dtype=np.float32)
    a = arr[:, :, 3:4] / 255.0
    # Unpremultiply / clean dark fringe where alpha is partial
    safe_a = np.maximum(a, 0.08)
    rgb = np.where(a < 0.85, np.clip(arr[:, :, :3] / safe_a, 0, 255), arr[:, :, :3])
    # Suppress tiny isolated alpha dust (< 25 px)
    mask = arr[:, :, 3] > 12
    lbl, num = ndimage.label(mask)
    if num > 0:
        sizes = ndimage.sum(mask, lbl, range(1, num + 1))
        keep = np.zeros(num + 1, dtype=bool)
        for idx, sz in enumerate(sizes, 1):
            if sz >= 25:
                keep[idx] = True
        clean_mask = keep[lbl]
        arr[:, :, 3] = np.where(clean_mask, arr[:, :, 3], 0.0)
    arr[:, :, :3] = np.where(arr[:, :, 3:4] > 0, rgb, 0.0)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")

def best_shift_2d(ref_gray: np.ndarray, cur_gray: np.ndarray, max_shift: int = 40):
    """Trouve le décalage (dx, dy) optimal par corrélation croisée FFT sur une région fixe."""
    r = ref_gray - ref_gray.mean()
    c = cur_gray - cur_gray.mean()
    corr = signal.fftconvolve(r, c[::-1, ::-1], mode="same")
    cy, cx = corr.shape[0] // 2, corr.shape[1] // 2
    sub = corr[cy - max_shift:cy + max_shift + 1, cx - max_shift:cx + max_shift + 1]
    iy, ix = np.unravel_index(np.argmax(sub), sub.shape)
    dy = iy - max_shift
    dx = ix - max_shift
    return int(dx), int(dy)

def slice_and_register(sheet_path: str, row_y: int, row_splits: list, out_dir: str, prefix: str, anchor_y_slice: tuple):
    os.makedirs(out_dir, exist_ok=True)
    im = Image.open(sheet_path).convert("RGBA")
    arr = np.array(im)
    H, W = arr.shape[:2]
    CANVAS = 480
    raw_cells = []
    y_ranges = [(0, row_y), (row_y, H)]
    for r in range(2):
        y0, y1 = y_ranges[r]
        xs = row_splits[r]
        for c in range(4):
            x0, x1 = xs[c], xs[c + 1]
            crop = clean_rgba(Image.fromarray(arr[y0:y1, x0:x1]))
            # Center bounding box initially on CANVAS x CANVAS
            ca = np.array(crop)
            ys, x_idx = np.where(ca[:, :, 3] > 20)
            bx0, bx1 = x_idx.min(), x_idx.max() + 1
            by0, by1 = ys.min(), ys.max() + 1
            sub = ca[by0:by1, bx0:bx1]
            sh, sw = sub.shape[:2]
            canvas = np.zeros((CANVAS, CANVAS, 4), dtype=np.uint8)
            # Align bottom of character consistently at CANVAS - 16
            px = (CANVAS - sw) // 2
            py = CANVAS - 16 - sh
            canvas[py:py + sh, px:px + sw] = sub
            raw_cells.append(canvas)

    # Register all poses against pose 0 using the stable anchor region (chair/legs for Pilot, torso/hips for Vesta)
    ay0, ay1 = anchor_y_slice
    ref_feat = raw_cells[0][ay0:ay1, :, 3].astype(np.float32) + raw_cells[0][ay0:ay1, :, :3].mean(axis=2) * 0.5
    aligned = []
    for idx, cell in enumerate(raw_cells):
        if idx == 0:
            aligned.append(cell)
            dx, dy = 0, 0
        else:
            cur_feat = cell[ay0:ay1, :, 3].astype(np.float32) + cell[ay0:ay1, :, :3].mean(axis=2) * 0.5
            dx, dy = best_shift_2d(ref_feat, cur_feat, max_shift=36)
            shifted = ndimage.shift(cell, shift=(dy, dx, 0), order=0, mode="constant", cval=0)
            aligned.append(shifted)
        out_path = os.path.join(out_dir, f"{prefix}_{idx + 1:02d}.png")
        Image.fromarray(aligned[-1], "RGBA").save(out_path, optimize=True)
        print(f"Saved {out_path} ({CANVAS}x{CANVAS}, align shift dx={dx}, dy={dy})")

    # Also build a clean 4x2 registered atlas (1920x960) for shader/spriteframes usage
    atlas = np.zeros((CANVAS * 2, CANVAS * 4, 4), dtype=np.uint8)
    for idx, cell in enumerate(aligned):
        r, c = idx // 4, idx % 4
        atlas[r * CANVAS:(r + 1) * CANVAS, c * CANVAS:(c + 1) * CANVAS] = cell
    atlas_path = os.path.join(out_dir, f"{prefix}_atlas.png")
    Image.fromarray(atlas, "RGBA").save(atlas_path, optimize=True)
    print(f"Saved registered atlas {atlas_path} ({CANVAS*4}x{CANVAS*2})")

def extract_single(src_path: str, dst_path: str, max_dim: int = 1280, fade_bottom: int = 0):
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    im = clean_rgba(Image.open(src_path))
    arr = np.array(im)
    ys, xs = np.where(arr[:, :, 3] > 16)
    pad = 16
    x0, x1 = max(0, xs.min() - pad), min(arr.shape[1], xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(arr.shape[0], ys.max() + 1 + pad)
    cropped = arr[y0:y1, x0:x1].copy()
    if fade_bottom > 0:
        # Smooth out the flat bottom cut of Vorax torso so he blends naturally into energy/cockpit overlays
        fh = min(fade_bottom, cropped.shape[0] // 4)
        ramp = np.linspace(1.0, 0.0, fh, dtype=np.float32)[:, None]
        cropped[-fh:, :, 3] = (cropped[-fh:, :, 3].astype(np.float32) * ramp).astype(np.uint8)
    out = Image.fromarray(cropped, "RGBA")
    if max(out.size) > max_dim:
        sc = max_dim / float(max(out.size))
        out = out.resize((int(out.width * sc), int(out.height * sc)), Image.Resampling.LANCZOS)
    out.save(dst_path, optimize=True)
    print(f"Saved {dst_path} ({out.size})")

if __name__ == "__main__":
    # 1. Pilot 8 poses (registered on chair + legs: y 250..464)
    slice_and_register(
        os.path.join(REF, "pilot_sheet.png"),
        row_y=431,
        row_splits=[[0, 455, 894, 1321, 1774], [0, 451, 894, 1322, 1774]],
        out_dir=os.path.join(OUT, "characters/pilot"),
        prefix="pilot",
        anchor_y_slice=(245, 468),
    )
    # 2. Vesta 8 expressions (registered on waist/hips: y 260..464)
    slice_and_register(
        os.path.join(REF, "vesta_sheet.png"),
        row_y=450,
        row_splits=[[0, 444, 864, 1306, 1774], [0, 439, 877, 1307, 1774]],
        out_dir=os.path.join(OUT, "characters/vesta"),
        prefix="vesta",
        anchor_y_slice=(255, 468),
    )
    # 3. Vorax HD (with gentle bottom alpha feathering so no hard horizontal cut shows)
    extract_single(
        os.path.join(REF, "vorax.png"),
        os.path.join(OUT, "characters/vorax/vorax_mecha.png"),
        max_dim=1200,
        fade_bottom=48,
    )
    # 4. Vanguard MK-I Starfighter HD
    extract_single(
        os.path.join(REF, "vanguard.png"),
        os.path.join(OUT, "ships/vanguard_mk1.png"),
        max_dim=1200,
        fade_bottom=0,
    )
    # 5. Orbital Cockpits (Portrait 9:16 + Wide 16:9)
    for src_name, dst_name in [
        ("cockpit_portrait.png", "cockpit_orbital_portrait.png"),
        ("cockpit_wide.png", "cockpit_orbital_wide.png"),
    ]:
        im = Image.open(os.path.join(REF, src_name)).convert("RGB")
        im.save(os.path.join(OUT, "bg", dst_name), optimize=True)
        print(f"Saved bg/{dst_name} ({im.size})")
