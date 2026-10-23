# Level 24 — VORAX V2 asset pack and playable finale

A complete HD anime-style asset collection and gameplay integration for Neo-Vanguard’s final sector. The existing game systems remain in place: difficulty scaling, solo/two-player play, keyboard/gamepad/touch input, accessibility options, scoring, harvesting, epilogue, campaign save, and victory screen.

## Playable encounter

1. **Orbital approach** — seamless nebula, layered luminous Earth, parallax debris, the growing VORAX flagship, and attack waves.
2. **Outer airlock** — autopilot arrival, VESTA dialogue, a destructible door with impact flashes, cracks, defensive fire, explosions, and separating halves.
3. **Base corridor** — new turrets and eight defense craft types with distinct movement and attacks.
4. **Inner airlock** — impacts shake the door; the alarm becomes electrified, fractures, and explodes.
5. **Hands of VORAX** — two independently targetable hands, separate HP pools and death states, followed by the airlock tear.
6. **VORAX reveal** — a large anchored, multi-frame sprite; eye attacks and charged crossing red palm beams.
7. **Three forms** — Armored → Necro-Reactor → Singularity. The first two defeats trigger invulnerable transformation sequences and fresh HP pools; only the third defeat ends the boss.
8. **Campaign completion** — harvest, final dialogue, epilogue, 24/24 progression, and the existing victory/finale flow.

## Reusable assets

The pack is in [`assets/level24-v2/`](../assets/level24-v2/). It contains 58 files, with full-resolution PNG masters and optimized WebP runtime assets.

| Collection | Contents |
|---|---|
| `environment/` | Earth with luminous halo, seamless nebula tile, flagship, seamless corridor tile, core chamber |
| `debris/` | Four transparent debris tiles: alloy, solar panel, rock, engine |
| `doors/` | Airlock plus three fracture states and runtime WebP |
| `enemies/` | Eight individual defense sprites and an optimized atlas |
| `hands/` | Left/right open and closed hands plus an eight-pose atlas |
| `boss/` | Three 4×3 atlases, 12 frames per form / 36 frames total, PNG and WebP |
| `effects/` | Charge ring, red beam, and fracture overlays |
| `source/` | Full-resolution environment/debris source art and generation metadata |

[`atlas.json`](../assets/level24-v2/atlas.json) defines frame rectangles, pivots, enemy/hand poses, environment paths, and boss eye/palm anchors. The logical reference cell is **640×640**: full-resolution PNG atlases are 2560×1920, while optimized WebP atlases are 1536×1152 (384×384 cells). Atlas rows are ordered left-to-right, top-to-bottom. [`manifest.json`](../assets/level24-v2/manifest.json) records pack identity, style, collections, runtime entry point, and the three form names.

The PNGs are intended for reuse and editing. The WebP files are the smaller runtime equivalents. The renderer references stable paths, not machine-specific absolute paths.

## Integration map

- `index.html`, controller `nv24-final-rework`: encounter state machine, destructible doors, defense AI, independent hand damage, tear/reveal logic, boss attacks, three HP pools, morphs, and campaign handoff.
- `level24-v2/level24-v2.js`: V2 asset loading, three-form renderer, fluid idle crossfades, charge effects, layered scenery, alarm destruction, morph banners, and diagnostics.
- `level24-v2/build_assets.py`: deterministic asset derivation and atlas pipeline.

The script is included after the level controller and boss-sprite modules. It only replaces level-24 rendering/behavior; other sectors and bosses retain their existing renderers.

## Rebuild

From the repository root, with Python, Pillow, NumPy, and OpenCV available:

```bash
python3 level24-v2/build_assets.py
```

The pipeline regenerates the processed assets and atlas metadata from the included source material and the existing VORAX source art.

## Validation

With the game served on port 8080 and Playwright installed:

```bash
node level24-v2/tests/browser.test.js
```

Optional environment variables:

- `NV_URL` — game URL; defaults to `http://127.0.0.1:8080/?nv24test=1`.
- `NV24_SHOTS` — screenshot output directory.

The `?nv24test=1` query exposes test-only hooks; normal play does not expose them. The suite first observes the real RAF, then uses the production update loop at fixed 50 ms steps so headless software rendering does not make cinematic timing wall-clock dependent.

Validated end to end:

- V2 assets load without missing game assets or page errors.
- Outer-airlock dialogue, destruction, and corridor entry.
- Visible/destructible new defense enemies and turrets.
- Inner-airlock alarm and two independent hand HP pools.
- Tear, reveal, charged crossing palm beams, both transformations, and third/final defeat.
- Epilogue, saved 24/24 progression, and campaign victory screen.

Thirteen inspected captures are written to `tests/shots/`. `tests/vorax-atlas-contact.png` documents all boss frames; `tests/encounter-contact.png` is the encounter contact sheet.
