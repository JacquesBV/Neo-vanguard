#!/usr/bin/env python3
import io
import mimetypes
import re
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

REPO = Path(__file__).resolve().parent.parent
FULL_ZIP_CACHE = Path("/tmp/Neo-Vanguard-Godot-Complet.zip")
FULL_EXCLUDE_DIRS = {".git", ".godot", ".cache", "__pycache__", "originaux"}
FULL_EXCLUDE_SUFFIXES = {".pyc", ".tmp"}

def ensure_full_godot_zip() -> Path:
    if FULL_ZIP_CACHE.is_file() and FULL_ZIP_CACHE.stat().st_size > 1_000_000:
        return FULL_ZIP_CACHE
    already_compressed = {".png", ".webp", ".jpg", ".jpeg", ".mp3", ".ogg", ".zip"}
    tmp_path = Path("/tmp/Neo-Vanguard-Godot-Complet.part")
    with zipfile.ZipFile(tmp_path, "w", allowZip64=True) as zf:
        for sub in sorted(REPO.rglob("*")):
            rel_parts = sub.relative_to(REPO).parts
            if any(p in FULL_EXCLUDE_DIRS for p in rel_parts):
                continue
            if not sub.is_file():
                continue
            if sub.name == ".DS_Store" or sub.suffix.lower() in FULL_EXCLUDE_SUFFIXES:
                continue
            arc = "Neo-Vanguard/" + str(sub.relative_to(REPO)).replace("\\", "/")
            comp = zipfile.ZIP_STORED if sub.suffix.lower() in already_compressed else zipfile.ZIP_DEFLATED
            zf.write(sub, arcname=arc, compress_type=comp)
    tmp_path.replace(FULL_ZIP_CACHE)
    return FULL_ZIP_CACHE

PACK_PATHS = [
    "assets/intro",
    "assets/Fanboy_original.png",
    "assets/layout.json",
    "assets/layers",
    "assets/audio",
    "scripts/intro",
    "scripts/fanboy.gd",
    "scripts/led.gdshader",
    "scripts/sprites/boss_atlas.gd",
    "scenes/IntroCinematic.tscn",
    "scenes/FanBoy.tscn",
    "tests/test_fanboy.gd",
    "docs/INTRO_CINEMATIC.md",
    "docs/FANBOY_README_FR.md",
    "docs/lighting_preview.jpg",
    "docs/asset_provenance.txt",
    "tools/extract_intro_sprites.py",
    "tools/build_console_holograms.py",
    "tools/build_constellation_panel.py",
    "tools/build_intro_sfx.py",
    "project.godot",
    "assets/data/lang.json",
    "scripts/data.gd",
    "scripts/audio2.gd",
    "scripts/main.gd",
    "scripts/game.gd",
    "scripts/sheets.gd",
    "scripts/ui/warning_screen.gd",
    "scripts/ui/title_screen.gd",
    "scripts/ui/story_deck.gd",
    "scripts/ui/story_screen.gd",
    "scripts/ui/sector_select.gd",
    "scripts/ui/brief_screen.gd",
    "scripts/ui/hud_overlay.gd",
    "scripts/ui/load_sector_screen.gd",
    "scripts/ui/options_screen.gd",
    "scripts/ui/scanlines.gd",
    "scripts/ui/credits_screen.gd",
]

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NEO VANGUARD — Aperçu Cinématique Intro (Godot 4.7)</title>
<link rel="preload" as="image" href="assets/intro/panels/panel_01_terre_eclipse.png" />
<style>
  :root {
    --bg: #050814;
    --panel: #0b1226;
    --border: rgba(76, 244, 255, 0.35);
    --cyan: #4cf4ff;
    --gold: #ffd166;
    --crimson: #ff4055;
    --ink: #eef6ff;
    --dim: #92a8c8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(circle at 50% 0%, #101d3d 0%, #050814 68%);
    color: var(--ink);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 12px 18px;
    background: rgba(6, 10, 24, 0.92);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .badge {
    padding: 4px 9px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
    border-radius: 6px; background: rgba(76, 244, 255, 0.14);
    border: 1px solid var(--cyan); color: var(--cyan);
  }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  button, a.btn {
    cursor: pointer; font-size: 12px; font-weight: 700; padding: 9px 13px;
    border-radius: 8px; border: 1px solid var(--border); background: #101b37;
    color: var(--ink); text-decoration: none; transition: 0.15s ease;
    display: inline-flex; align-items: center; gap: 6px;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  button:hover, a.btn:hover { border-color: var(--cyan); background: #172952; }
  .btn-gold {
    background: linear-gradient(135deg, rgba(255, 209, 102, 0.24), rgba(255, 145, 56, 0.22));
    border-color: var(--gold); color: var(--gold);
  }
  .btn-play {
    background: linear-gradient(135deg, rgba(76, 244, 255, 0.26), rgba(90, 120, 255, 0.28));
    border-color: var(--cyan); color: #fff;
  }
  main {
    flex: 1; display: grid; grid-template-columns: minmax(300px, 460px) 1fr;
    gap: 16px; padding: 12px 14px; max-width: 1380px; width: 100%; margin: 0 auto;
  }
  @media (max-width: 920px) { main { grid-template-columns: 1fr; justify-items: stretch; padding: 10px; } }
  .stage-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .canvas-frame {
    position: relative; width: min(92vw, 420px); aspect-ratio: 480 / 860;
    border-radius: 14px; overflow: hidden;
    border: 2px solid rgba(76, 244, 255, 0.55);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.7), 0 0 28px rgba(76, 244, 255, 0.18);
    background: #04060e; touch-action: manipulation; -webkit-user-select: none; user-select: none;
  }
  canvas { width: 100%; height: 100%; display: block; touch-action: manipulation; }
  .start-overlay {
    position: absolute; inset: 0; cursor: pointer;
    background: radial-gradient(circle at 50% 40%, #0a132b 0%, #04060e 78%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 24px; gap: 14px; z-index: 5;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .start-overlay.hidden { display: none; }
  .start-big {
    font-size: 15px; padding: 13px 22px; border-radius: 999px;
    background: linear-gradient(135deg, #1ea7ff, #6b5bff);
    border: 2px solid #9be8ff; color: #fff;
    box-shadow: 0 0 25px rgba(76, 244, 255, 0.5);
  }
  .inspector { display: flex; flex-direction: column; gap: 14px; width: 100%; }
  .card {
    background: rgba(11, 18, 38, 0.88);
    border: 1px solid rgba(76, 244, 255, 0.24);
    border-radius: 12px; padding: 14px 16px;
  }
  .card h2 {
    font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--cyan); margin-bottom: 10px;
  }
  .paths-list {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; line-height: 1.65; color: #d6e6ff;
  }
  .paths-list code {
    color: var(--gold); background: rgba(255, 209, 102, 0.1);
    padding: 1px 5px; border-radius: 4px;
  }
  .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
  .thumb {
    background: #060a16; border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; overflow: hidden; text-align: center;
    font-size: 10px; color: var(--dim); padding-bottom: 4px;
  }
  .thumb img { width: 100%; height: 92px; object-fit: cover; display: block; margin-bottom: 4px; }
  .sfx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 6px; }
  .sfx-btn { font-size: 11px; padding: 6px 9px; justify-content: space-between; }
</style>
</head>
<body>
<header>
  <div class="brand">
    <span class="badge">GODOT 4.7.2 · 480×860</span>
    <div>
      <div style="font-weight:800;font-size:15px;letter-spacing:0.04em;">NEO VANGUARD — CINÉMATIQUE D'INTRO MANGA</div>
      <div style="font-size:11px;color:var(--dim);">8 Mondes — 24 Secteurs · 5 Familles Technologiques · 134 BPM (Sans voix IA)</div>
    </div>
  </div>
  <div class="actions">
    <a class="btn btn-play" href="./">🎮 Console FanBoy (Secteurs 1–3)</a>
    <button class="btn-play" id="btnReplay">▶ Rejouer 00:00</button>
    <button id="btnPrev">◀ Préc.</button>
    <button id="btnNext">Suiv. ▶</button>
    <a class="btn btn-gold" href="https://github.com/JacquesBV/Neo-vanguard/archive/refs/heads/arena/38f5f5c5-neo-vanguard.zip" target="_blank" rel="noopener">⬇ ZIP Complet (GitHub)</a>
  </div>
</header>

<main>
  <div class="stage-wrap">
    <div class="canvas-frame">
      <canvas id="stage" width="480" height="860"></canvas>
      <div class="start-overlay" id="overlay">
        <div style="font-size:11px;letter-spacing:0.12em;color:var(--cyan);font-weight:700;">ÉDITION GODOT 4.7 · 134 BPM</div>
        <div style="font-size:26px;font-weight:900;letter-spacing:0.06em;">NEO VANGUARD</div>
        <div style="font-size:13px;color:var(--dim);max-width:310px;line-height:1.45;">
          Cinématique animée 9 scènes synchronisée sur <b>title.mp3</b> + <b>12 SFX stéréo 44,1 kHz</b>.
        </div>
        <button class="start-big" id="btnStart">▶ LANCER LA CINÉMATIQUE</button>
      </div>
    </div>
    <div style="font-size:11px;color:var(--dim);text-align:center;">
      Cliquez sur l'écran ou sur <b>SUIVANT ▶</b> pour avancer d'une scène, ou sur <b>PASSER ⏭</b> en haut à droite.
    </div>
  </div>

  <div class="inspector">
    <div class="card">
      <h2>📁 Fichiers du pack Godot 4.7</h2>
      <div class="paths-list">
        • Scène Godot 4.7 : <code>scenes/IntroCinematic.tscn</code><br/>
        • Réalisateur & données : <code>scripts/intro/{intro_cinematic,intro_data,intro_assets}.gd</code><br/>
        • Shaders GPU : <code>assets/intro/shaders/{manga_fx,hologram_vesta,vorax_glitch,world_era_card}.gdshader</code><br/>
        • Planches & Modèles : <code>assets/intro/panels/panel_01..10.png</code>, <code>consoles/holo_01..08.png</code>, <code>characters/</code>, <code>ships/</code><br/>
        • 12 SFX WAV stéréo 44.1 kHz : <code>assets/intro/audio/sfx/*.wav</code> (aucune voix IA)<br/>
        • Intégration jeu : <code>scripts/main.gd</code> + bouton <b>🎬 Revoir la cinématique d'intro</b> sur <code>title_screen.gd</code>
      </div>
    </div>

    <div class="card">
      <h2>🔊 Écouter les 12 SFX stéréo 44.1 kHz individuellement</h2>
      <div class="sfx-grid" id="sfxGrid"></div>
    </div>

    <div class="card">
      <h2>🎨 Les 10 Planches Manga & Modèles Officiels</h2>
      <div class="thumbs" id="thumbGrid"></div>
    </div>
  </div>
</main>

<script>
const ASSET_VER = "?v=" + Date.now();
const TOP_BAR_H = 48;
const DIALOGUE_TOP_Y = 640;
const STAGE_H = DIALOGUE_TOP_Y - TOP_BAR_H;

const WORLDS = [
  { world:1, console:"FanBoy", fam:"FAMILLE I / V  ·  PORTABLE 8 BITS", spec:"Matrice monochrome 4 nuances · Synthèse 4 canaux", hw:"COQUE BEIGE · 4 VERTS OLIVE", sectors:"SECTEURS 01 — 03", color:"#b4d642", accent:"#f2dfb6", holo:"assets/intro/consoles/holo_01_fanboy.png", sig:"Portable verticale beige · Blason ailé, pad bleu & 4 verts olive", bg:"assets/intro/panels/panel_09_huit_mondes_constellation.png", z:[1.14,1.24], p0:[0.00,0.30], p1:[0.00,0.22] },
  { world:2, console:"FanBoy Adventure", fam:"FAMILLE II / V  ·  PORTABLE 32 BITS", spec:"Écran nomade couleur 32 bits · Perspective plane", hw:"VIOLET INDIGO · 2 ACTIONS RONDES", sectors:"SECTEURS 04 — 06", color:"#7b5cff", accent:"#d8caff", holo:"assets/intro/consoles/holo_02_fanboy_adv.png", sig:"Portable horizontale violet indigo · Poignées sombres & 2D couleur", bg:"assets/intro/panels/panel_09_huit_mondes_constellation.png", z:[1.16,1.26], p0:[0.02,0.20], p1:[-0.02,0.12] },
  { world:3, console:"NEXUS 8", fam:"FAMILLE III / V  ·  CONSOLES DE SALON 8 BITS", spec:"Palettes 8 bits contrastées · Balayage phosphore CRT", hw:"CUBIQUE GRIS/ROUGE · PAD CAPSULE 3B", sectors:"SECTEURS 07 — 09", color:"#f0485a", accent:"#e8edf5", holo:"assets/intro/consoles/holo_03_nexus8.png", sig:"Console cubique gris & rouge · Cartouche haute & pad capsule 3 actions", bg:"assets/intro/panels/panel_05_mondes_retro_evolution.png", z:[1.05,1.18], p0:[0.02,-0.10], p1:[-0.02,0.06] },
  { world:4, console:"Masterion 8", fam:"FAMILLE III / V  ·  CONSOLES DE SALON 8 BITS", spec:"Palettes 8 bits contrastées · Balayage phosphore CRT", hw:"ARCHE NOIRE/ROUGE · PAD RECTANGULAIRE", sectors:"SECTEURS 10 — 12", color:"#ff5c38", accent:"#ffc8bc", holo:"assets/intro/consoles/holo_04_masterion8.png", sig:"Arche facettée noire & rouge · Manette rectangulaire 3 actions", bg:"assets/intro/panels/panel_09_huit_mondes_constellation.png", z:[1.18,1.28], p0:[-0.02,0.04], p1:[0.02,-0.04] },
  { world:5, console:"NEXUS 16", fam:"FAMILLE IV / V  ·  CONSOLES 16 BITS", spec:"Multi-parallaxe · Synthèse FM · Démesure Arcade", hw:"LONGITUDINALE · STICK ARCADE 6B", sectors:"SECTEURS 13 — 15", color:"#6ea8ff", accent:"#e4f0ff", holo:"assets/intro/consoles/holo_05_nexus16.png", sig:"Châssis gris longitudinal · Cartouche large & stick arcade 6 couleurs", bg:"assets/intro/panels/panel_09_huit_mondes_constellation.png", z:[1.18,1.30], p0:[0.02,-0.06], p1:[-0.02,-0.14] },
  { world:6, console:"MegaStorm 16", fam:"FAMILLE IV / V  ·  CONSOLES 16 BITS", spec:"Multi-parallaxe · Synthèse FM · Démesure Arcade", hw:"NOIR/OR · PAD ERGONOMIQUE 5B", sectors:"SECTEURS 16 — 18", color:"#ff8c38", accent:"#ffe2b0", holo:"assets/intro/consoles/holo_06_megastorm16.png", sig:"Console noire à coins dorés · Cartouche bombée & pad 5 actions", bg:"assets/intro/panels/panel_06_mondes_16_32_bits.png", z:[1.04,1.16], p0:[0.00,0.24], p1:[0.00,0.12] },
  { world:7, console:"Arcadion HCS", fam:"FAMILLE IV / V  ·  CONSOLES 16 BITS", spec:"Multi-parallaxe · Synthèse FM · Démesure Arcade", hw:"CENTRALE OR · 2 STATIONS LCD HCS", sectors:"SECTEURS 19 — 21", color:"#ebc363", accent:"#fff1be", holo:"assets/intro/consoles/holo_07_arcadion_hcs.png", sig:"Holographic Control Station · Centrale noire/or & 2 stations LCD", bg:"assets/intro/panels/panel_09_huit_mondes_constellation.png", z:[1.18,1.30], p0:[-0.02,-0.20], p1:[0.02,-0.28] },
  { world:8, console:"Polytron 32", fam:"FAMILLE V / V  ·  CONSOLE 32 BITS", spec:"Polygones 3D temps réel · Faisceau optique laser", hw:"DISQUE OPTIQUE · ÉCRAN VERRE 3D", sectors:"SECTEURS 22 — 24", color:"#38c8ff", accent:"#dcf7ff", holo:"assets/intro/consoles/holo_08_polytron32.png", sig:"Monocoque blanche à écran transparent · Polygones 3D & pad 4 couleurs", bg:"assets/intro/panels/panel_06_mondes_16_32_bits.png", z:[1.04,1.16], p0:[0.00,-0.18], p1:[0.00,-0.28] }
];

const SCENES = [
  { act:1, t0:0.00, t1:8.06, img:"assets/intro/panels/panel_01_terre_eclipse.png", kicker:"PROLOGUE · L'ÉCLIPSE DES COULEURS", speaker:"VESTA · CONSCIENCE MYSTIQUE", col:"#7fe6ff", stamp:"静寂 // SILENCE",
    lines:["Depuis l'aube de cet univers, huit vestiges de consoles sacrées insufflaient la couleur, le son et la vie aux étoiles.","Mais l'ombre s'étend désormais d'orbite en orbite, drainant chaque monde vers un silence monochrome."] },
  { act:1, t0:8.06, t1:16.12, img:"assets/intro/panels/panel_02_vorax_citadelle.png", kicker:"LA MENACE · SEIGNEUR DE LA DÉSOLATION", speaker:"VORAX · FLÉAU MÉCANIQUE", col:"#ff4055", stamp:"破壊 // VORAX",
    lines:["« Je réduirai vos consoles sacrées en cendres ! Plus de couleurs, plus de vie : seuls régneront le chaos et la désolation ! »","Son armée mécanique tient déjà les vingt-quatre secteurs sous sa loi d'acier."] },
  { act:2, t0:16.12, t1:23.28, img:"assets/intro/panels/panel_04_pilote_eveil.png", kicker:"ORBITE HAUTE · LE PILOTE SANS MÉMOIRE", speaker:"LE PILOTE · MÉMOIRE EFFACÉE", col:"#5cc8ff", stamp:"覚醒 // ÉVEIL",
    lines:["« Où suis-je ? Je ne sais plus mon nom, ni rien de ma vie... Seuls mes réflexes de pilote répondent encore. »","Au cœur du cockpit orbital, une lueur mystique traverse le brouillard de son oubli."] },
  { act:2, t0:23.28, t1:28.65, img:"assets/intro/panels/panel_03_vesta_archive.png", kicker:"CONNEXION D'ÂME · VESTA SE MANIFESTE", speaker:"VESTA · CONSCIENCE CONNECTÉE", col:"#c8a8ff", stamp:"共鳴 // LIEN",
    lines:["« N'aie aucune crainte. Je suis Vesta, une conscience liée à la tienne au-delà de l'oubli. »","« Ensemble, préservons les vestiges sacrés que Vorax cherche à anéantir. »"] },
  { act:3, t0:28.65, t1:43.00, img:"assets/intro/panels/panel_09_huit_mondes_constellation.png", kicker:"8 MONDES — 24 SECTEURS · 5 FAMILLES TECHNOLOGIQUES", speaker:"VESTA · CARTOGRAPHIE SACRÉE", col:"#7fe6ff", stamp:"進化 // 8 MONDES",
    lines:["Huit consoles sacrées unies en cinq familles technologiques : du portable 8 bits jusqu'aux polygones 32 bits.","Trois secteurs par monde — vingt-quatre batailles pour rallumer les couleurs de l'univers !"] },
  { act:4, t0:43.00, t1:49.25, img:"assets/intro/panels/panel_10_clash_energie.png", kicker:"ONDE DE CHOC · L'ARMÉE DE VORAX ATTAQUE", speaker:"VORAX · COMMANDEMENT SUPRÊME", col:"#ff4055", stamp:"激突 // CHOC",
    lines:["« Aucun chasseur solitaire ne franchira mes vingt-quatre gardiens ! Sombrez dans le gris éternel ! »"] },
  { act:4, t0:49.25, t1:56.42, img:"assets/intro/panels/panel_07_vanguard_ignition.png", kicker:"SERMENT DU PILOTE · MISE À FEU DU VANGUARD", speaker:"LE PILOTE · CHASSEUR VANGUARD", col:"#ffd166", stamp:"点火 // IGNITION",
    lines:["« J'ignore tout de mon passé, Vesta... mais j'accepte ta mission ! »","« Bimoteurs plasma à cent pour cent — nous rendrons la vie aux huit mondes ! »"] },
  { act:5, t0:56.42, t1:63.58, img:"assets/intro/panels/panel_05_mondes_retro_evolution.png", kicker:"CATAPULTAGE ORBITAL · CONTRE-OFFENSIVE VANGUARD", speaker:"VESTA & LE PILOTE", col:"#4cf4ff", stamp:"出撃 // ENVOL !",
    lines:["« Nos consciences ne font qu'une ! De FanBoy à Polytron 32, brise les chaînes de Vorax ! »"] },
  { act:5, t0:63.58, t1:71.64, img:"assets/intro/panels/panel_08_envol_final.png", kicker:"8 MONDES — 24 SECTEURS · 5 FAMILLES TECHNOLOGIQUES", speaker:"NEO VANGUARD", col:"#ffd166", stamp:"開幕 // START",
    lines:["Préservez les vestiges sacrés. Rallumez les couleurs de l'univers."] }
];

const SFX_NAMES = [
  "sfx_manga_slash","sfx_vorax_dread_horn","sfx_hologram_materialize","sfx_neural_awaken",
  "sfx_world_card_tick","sfx_glitch_burst","sfx_reactor_charge","sfx_catapult_launch",
  "sfx_logo_impact","sfx_cue_vesta","sfx_cue_pilote","sfx_cue_vorax"
];

const SFX_CUES = [
  {t:0.15, sfx:"sfx_cue_vesta"}, {t:8.06, sfx:"sfx_manga_slash"}, {t:8.10, sfx:"sfx_vorax_dread_horn"},
  {t:8.35, sfx:"sfx_glitch_burst"}, {t:12.20, sfx:"sfx_cue_vorax"}, {t:16.12, sfx:"sfx_manga_slash"},
  {t:16.20, sfx:"sfx_neural_awaken"}, {t:20.15, sfx:"sfx_cue_pilote"}, {t:23.28, sfx:"sfx_hologram_materialize"},
  {t:25.75, sfx:"sfx_cue_vesta"}, {t:28.65, sfx:"sfx_manga_slash"}, {t:28.68, sfx:"sfx_world_card_tick"},
  {t:30.44, sfx:"sfx_world_card_tick"}, {t:32.23, sfx:"sfx_world_card_tick"}, {t:34.02, sfx:"sfx_world_card_tick"},
  {t:35.82, sfx:"sfx_world_card_tick"}, {t:37.61, sfx:"sfx_world_card_tick"}, {t:39.40, sfx:"sfx_world_card_tick"},
  {t:41.19, sfx:"sfx_world_card_tick"}, {t:43.00, sfx:"sfx_manga_slash"}, {t:43.08, sfx:"sfx_glitch_burst"},
  {t:43.35, sfx:"sfx_cue_vorax"}, {t:49.25, sfx:"sfx_manga_slash"}, {t:49.45, sfx:"sfx_cue_pilote"},
  {t:53.20, sfx:"sfx_reactor_charge"}, {t:56.42, sfx:"sfx_catapult_launch"}, {t:57.10, sfx:"sfx_cue_vesta"},
  {t:63.58, sfx:"sfx_logo_impact"}
];

const ALL_IMAGES = [
  "assets/intro/panels/panel_01_terre_eclipse.png",
  "assets/intro/panels/panel_02_vorax_citadelle.png",
  "assets/intro/panels/panel_03_vesta_archive.png",
  "assets/intro/panels/panel_04_pilote_eveil.png",
  "assets/intro/panels/panel_05_mondes_retro_evolution.png",
  "assets/intro/panels/panel_06_mondes_16_32_bits.png",
  "assets/intro/panels/panel_07_vanguard_ignition.png",
  "assets/intro/panels/panel_08_envol_final.png",
  "assets/intro/panels/panel_09_huit_mondes_constellation.png",
  "assets/intro/panels/panel_10_clash_energie.png",
  "assets/intro/bg/cockpit_orbital_wide.png",
  "assets/intro/bg/cockpit_orbital_portrait.png",
  "assets/intro/characters/vorax/vorax_mecha.png",
  "assets/intro/ships/vanguard_mk1.png"
];
for (let i=1;i<=8;i++) {
  ALL_IMAGES.push(`assets/intro/characters/pilot/pilot_0${i}.png`);
  ALL_IMAGES.push(`assets/intro/characters/vesta/vesta_0${i}.png`);
}
WORLDS.forEach(w => ALL_IMAGES.push(w.holo));

const imgs = {};
ALL_IMAGES.forEach(p => {
  const im = new Image();
  im.src = p + ASSET_VER;
  imgs[p] = im;
});

const music = new Audio("assets/music/title.mp3");
music.preload = "none";

function okImg(im) { return Boolean(im && im.complete && im.naturalWidth > 0); }

function playSfx(name, vol=0.8) {
  const a = new Audio(`assets/intro/audio/sfx/${name}.wav`);
  a.volume = vol;
  a.play().catch(()=>{});
}

const sfxGrid = document.getElementById("sfxGrid");
SFX_NAMES.forEach(n => {
  const b = document.createElement("button");
  b.className = "sfx-btn";
  b.innerHTML = `<span>${n.replace("sfx_","")}</span><span>▶</span>`;
  b.onclick = () => playSfx(n, 0.9);
  sfxGrid.appendChild(b);
});

const thumbItems = [
  ["M1 FanBoy","assets/intro/consoles/holo_01_fanboy.png"],
  ["M2 FanBoy Adv.","assets/intro/consoles/holo_02_fanboy_adv.png"],
  ["M3 NEXUS 8","assets/intro/consoles/holo_03_nexus8.png"],
  ["M4 Masterion 8","assets/intro/consoles/holo_04_masterion8.png"],
  ["M5 NEXUS 16","assets/intro/consoles/holo_05_nexus16.png"],
  ["M6 MegaStorm 16","assets/intro/consoles/holo_06_megastorm16.png"],
  ["M7 Arcadion HCS","assets/intro/consoles/holo_07_arcadion_hcs.png"],
  ["M8 Polytron 32","assets/intro/consoles/holo_08_polytron32.png"],
  ["Panel 01","assets/intro/panels/panel_01_terre_eclipse.png"],
  ["Panel 02","assets/intro/panels/panel_02_vorax_citadelle.png"],
  ["Panel 03","assets/intro/panels/panel_03_vesta_archive.png"],
  ["Panel 04","assets/intro/panels/panel_04_pilote_eveil.png"],
  ["Panel 05","assets/intro/panels/panel_05_mondes_retro_evolution.png"],
  ["Panel 06","assets/intro/panels/panel_06_mondes_16_32_bits.png"],
  ["Panel 07","assets/intro/panels/panel_07_vanguard_ignition.png"],
  ["Panel 08","assets/intro/panels/panel_08_envol_final.png"],
  ["Panel 09","assets/intro/panels/panel_09_huit_mondes_constellation.png"],
  ["Panel 10","assets/intro/panels/panel_10_clash_energie.png"],
  ["Pilote","assets/intro/characters/pilot/pilot_08.png"],
  ["Vesta","assets/intro/characters/vesta/vesta_08.png"],
  ["Vorax","assets/intro/characters/vorax/vorax_mecha.png"],
  ["Vanguard","assets/intro/ships/vanguard_mk1.png"]
];
const thumbGrid = document.getElementById("thumbGrid");
thumbItems.forEach(([lbl, src]) => {
  const d = document.createElement("div");
  d.className = "thumb";
  d.innerHTML = `<img src="${src}${ASSET_VER}" loading="lazy"/><div>${lbl}</div>`;
  thumbGrid.appendChild(d);
});

const cv = document.getElementById("stage");
const ctx = cv.getContext("2d");
let running = false;
let t = 0;
let lastTs = 0;
let cueIdx = 0;
let flash = 0;
let shakeAmp = 0;
let lastScene = 0;
let lastWorld = -1;
let seekLockUntil = 0;

const particles = Array.from({length: 28}, (_, i) => ({
  x: (i * 137.5) % 480,
  y: TOP_BAR_H + ((i * 79.3) % STAGE_H),
  spd: 18 + (i % 6) * 5,
  sz: 1.2 + (i % 3) * 0.55,
  ph: i * 0.7
}));

function sceneIndexAt(sec) {
  let idx = 0;
  for (let i=0;i<SCENES.length;i++) if (sec >= SCENES[i].t0) idx = i;
  return idx;
}

function startFrom(sec) {
  t = sec;
  lastScene = sceneIndexAt(sec);
  lastWorld = -1;
  flash = 0;
  shakeAmp = 0;
  seekLockUntil = performance.now() + 340;
  cueIdx = 0;
  while (cueIdx < SFX_CUES.length && SFX_CUES[cueIdx].t < t - 0.02) cueIdx++;
  try { music.currentTime = sec; } catch (e) {}
  music.play().catch(()=>{});
  running = true;
  document.getElementById("overlay").classList.add("hidden");
  lastTs = performance.now();
}

const overlayEl = document.getElementById("overlay");
let lastIntroTapMs = 0;
function startOrTriggerOverlay(ev) {
  const nowMs = performance.now();
  if (nowMs - lastIntroTapMs < 220) return;
  lastIntroTapMs = nowMs;
  if (ev && ev.cancelable) ev.preventDefault();
  startFrom(0);
}
document.getElementById("btnStart").addEventListener("click", startOrTriggerOverlay);
overlayEl.addEventListener("click", startOrTriggerOverlay);
overlayEl.addEventListener("touchend", startOrTriggerOverlay, {passive: false});
document.getElementById("btnReplay").onclick = () => startFrom(0);
document.getElementById("btnNext").onclick = () => {
  const i = sceneIndexAt(t);
  if (i + 1 < SCENES.length) { playSfx("sfx_manga_slash", 0.7); startFrom(SCENES[i+1].t0); flash = 0.45; }
  else { window.location.href = "./"; }
};
document.getElementById("btnPrev").onclick = () => {
  const i = sceneIndexAt(t);
  startFrom(SCENES[Math.max(0, i-1)].t0);
};
function onStageTap(clientX, clientY, ev) {
  const nowMs = performance.now();
  if (nowMs - lastIntroTapMs < 220) return;
  lastIntroTapMs = nowMs;
  if (ev && ev.cancelable) ev.preventDefault();
  if (!running) { startFrom(0); return; }
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const x = (clientX - r.left) * (480 / r.width);
  const y = (clientY - r.top) * (860 / r.height);
  if (x > 360 && y < 48) { startFrom(63.58); return; }
  const i = sceneIndexAt(t);
  if (i + 1 < SCENES.length) { playSfx("sfx_manga_slash", 0.7); startFrom(SCENES[i+1].t0); flash = 0.45; }
  else { window.location.href = "./"; }
}
cv.addEventListener("click", (e) => onStageTap(e.clientX, e.clientY, e));
cv.addEventListener("touchend", (e) => {
  if (e.changedTouches && e.changedTouches.length > 0) {
    onStageTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e);
  }
}, {passive: false});

function lerp(a, b, u) { return a + (b - a) * u; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function drawCoverRegion(path, bx, by, bw, bh, zoom=1.0, panX=0.0, panY=0.0, overlay=null) {
  const im = imgs[path];
  if (!im || !im.complete || !im.naturalWidth) return;
  const tw = im.naturalWidth, th = im.naturalHeight;
  const boxAspect = bw / Math.max(1, bh);
  const texAspect = tw / Math.max(1, th);
  let uvW = 1.0, uvH = 1.0;
  if (boxAspect > texAspect) uvH = texAspect / boxAspect;
  else uvW = boxAspect / texAspect;
  uvW /= Math.max(1.0, zoom);
  uvH /= Math.max(1.0, zoom);
  const u0 = clamp(0.5 + panX - uvW * 0.5, 0.002, 0.998 - uvW);
  const v0 = clamp(0.5 + panY - uvH * 0.5, 0.002, 0.998 - uvH);
  ctx.drawImage(im, u0 * tw, v0 * th, uvW * tw, uvH * th, bx, by, bw, bh);
  if (overlay) { ctx.fillStyle = overlay; ctx.fillRect(bx, by, bw, bh); }
}

function drawPoseSeq(prefix, keyframes, u, x, y, w, h, fadeSpan=0.12) {
  let idxA = keyframes[0][1], idxB = idxA, blend = 0;
  for (let i=1; i<keyframes.length; i++) {
    const trig = keyframes[i][0];
    if (u >= trig) {
      idxA = keyframes[i][1]; idxB = idxA;
      if (u < trig + fadeSpan) {
        idxA = keyframes[i-1][1]; idxB = keyframes[i][1];
        blend = clamp((u - trig) / fadeSpan, 0, 1);
      }
    }
  }
  const imA = imgs[`${prefix}${idxA}.png`];
  if (idxA === idxB || blend <= 0.001) {
    if (okImg(imA)) ctx.drawImage(imA, x, y, w, h);
  } else {
    const imB = imgs[`${prefix}${idxB}.png`];
    ctx.save();
    if (okImg(imA)) { ctx.globalAlpha = 1 - blend; ctx.drawImage(imA, x, y, w, h); }
    if (okImg(imB)) { ctx.globalAlpha = blend; ctx.drawImage(imB, x, y, w, h); }
    ctx.restore();
  }
}

function drawMangaFrame(x, y, w, h, col, lw=2.2) {
  ctx.strokeStyle = "#02040a"; ctx.lineWidth = 3.2;
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
}

function wrapText(text, x, y, maxW, lineH) {
  for (const para of text.split("\n")) {
    if (!para.trim()) { y += lineH * 0.35; continue; }
    let cur = "";
    for (const w of para.split(" ")) {
      const cand = cur ? cur + " " + w : w;
      if (ctx.measureText(cand).width > maxW && cur) {
        ctx.fillText(cur, x, y); y += lineH; cur = w;
      } else cur = cand;
    }
    if (cur) { ctx.fillText(cur, x, y); y += lineH; }
  }
}

function render(now) {
  requestAnimationFrame(render);
  const dt = lastTs ? Math.min(0.05, (now - lastTs)/1000) : 0.016;
  lastTs = now;
  if (!running) {
    ctx.fillStyle = "#04060e"; ctx.fillRect(0, 0, 480, 860);
    return;
  }
  const p01 = imgs["assets/intro/panels/panel_01_terre_eclipse.png"];
  if (t < 0.05 && (!p01 || !p01.complete || !p01.naturalWidth)) {
    ctx.fillStyle = "#04060e"; ctx.fillRect(0, 0, 480, 860);
    return;
  }
  if (!music.paused && !music.seeking && now >= seekLockUntil && Math.abs(music.currentTime - t) < 0.70 && music.currentTime < 72.5) {
    t = music.currentTime;
  } else {
    t += dt;
  }
  if (t >= 71.64) { startFrom(0); return; }
  while (cueIdx < SFX_CUES.length && SFX_CUES[cueIdx].t <= t + 0.02) {
    const sname = SFX_CUES[cueIdx].sfx;
    playSfx(sname, 0.8);
    if (["sfx_catapult_launch","sfx_logo_impact"].includes(sname)) { flash = 0.85; shakeAmp = 6.5; }
    else if (sname === "sfx_vorax_dread_horn") shakeAmp = 4.0;
    cueIdx++;
  }
  flash = Math.max(0, flash - dt * 3.8);
  shakeAmp = Math.max(0, shakeAmp - dt * 18.0);

  const si = sceneIndexAt(t);
  if (si !== lastScene) {
    lastScene = si;
    flash = Math.max(flash, 0.35);
    if ([1,5,7,8].includes(si)) shakeAmp = Math.max(shakeAmp, 3.5);
  }
  const sc = SCENES[si];
  const u = clamp((t - sc.t0) / Math.max(0.01, sc.t1 - sc.t0), 0, 1);
  const beat = Math.pow(1.0 - ((t / (60/134)) % 1.0), 2.4);
  const shkX = shakeAmp > 0.05 ? Math.sin(t * 61) * shakeAmp : 0;
  const shkY = shakeAmp > 0.05 ? Math.cos(t * 47) * shakeAmp * 0.7 : 0;

  const spdMul = si >= 7 ? 3.2 : 0.7;
  for (const p of particles) {
    p.y -= p.spd * spdMul * dt;
    if (p.y < TOP_BAR_H) { p.y = DIALOGUE_TOP_Y - 2; p.x = (p.x + 173) % 480; }
  }

  ctx.fillStyle = "#04060e"; ctx.fillRect(0, 0, 480, 860);
  if (si === 8) {
    drawCoverRegion("assets/intro/panels/panel_08_envol_final.png", shkX, shkY, 480, 860,
      lerp(1.00, 1.018, u), 0, lerp(0.004, -0.004, u));
  }
  ctx.save(); ctx.beginPath(); ctx.rect(0, TOP_BAR_H, 480, STAGE_H); ctx.clip();

  if (si === 0) {
    drawCoverRegion("assets/intro/panels/panel_01_terre_eclipse.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
      lerp(1.02, 1.10, u), lerp(-0.015, 0.015, u), lerp(-0.10, 0.08, u));
  } else if (si === 1) {
    if (u < 0.52) {
      const ua = u / 0.52;
      drawCoverRegion("assets/intro/panels/panel_02_vorax_citadelle.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
        lerp(1.00, 1.08, ua), 0, lerp(-0.14, 0.08, ua));
    } else {
      ctx.fillStyle = "#110308"; ctx.fillRect(0, TOP_BAR_H, 480, STAGE_H);
      drawCoverRegion("assets/intro/panels/panel_10_clash_energie.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
        1.30, -0.14, -0.16, "rgba(18,3,8,0.58)");
      const subU = (u - 0.52) / 0.48;
      const vw = lerp(656, 694, Math.pow(subU, 0.65));
      const vh = vw * (927 / 1200);
      const vy = TOP_BAR_H + (STAGE_H + 22) - vh * 0.929;
      const vxIm = imgs["assets/intro/characters/vorax/vorax_mecha.png"];
      if (okImg(vxIm)) ctx.drawImage(vxIm, (480 - vw)*0.5 + shkX, vy + shkY, vw, vh);
    }
  } else if (si === 2) {
    if (u < 0.56) {
      const up = u / 0.56;
      drawCoverRegion("assets/intro/bg/cockpit_orbital_wide.png", 0, TOP_BAR_H, 480, STAGE_H,
        1.08, lerp(-0.025, 0.02, up), 0, "rgba(6,10,24,0.44)");
      const psz = lerp(548, 568, up);
      const py = TOP_BAR_H + (STAGE_H + 92) - psz * (463 / 480);
      drawPoseSeq("assets/intro/characters/pilot/pilot_0", [[0,1],[0.26,2],[0.54,4],[0.78,5]], up,
        (480 - psz)*0.5 + shkX, py + shkY, psz, psz, 0.12);
    } else {
      const ub = (u - 0.56) / 0.44;
      drawCoverRegion("assets/intro/panels/panel_04_pilote_eveil.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
        lerp(1.01, 1.10, ub), 0, lerp(-0.06, -0.10, ub));
    }
  } else if (si === 3) {
    if (u < 0.46) {
      const ua = u / 0.46;
      drawCoverRegion("assets/intro/panels/panel_03_vesta_archive.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
        lerp(1.00, 1.06, ua), 0, lerp(-0.08, 0.04, ua));
    } else {
      drawCoverRegion("assets/intro/bg/cockpit_orbital_portrait.png", 0, TOP_BAR_H, 480, STAGE_H,
        1.10, 0, -0.08, "rgba(10,12,28,0.58)");
      const subU = (u - 0.46) / 0.54;
      const vsz = lerp(556, 580, subU);
      const vy = TOP_BAR_H + (STAGE_H + 24) - vsz * (463 / 480);
      drawPoseSeq("assets/intro/characters/vesta/vesta_0", [[0,2],[0.34,6],[0.72,5]], subU,
        (480 - vsz)*0.5, vy, vsz, vsz, 0.14);
    }
  } else if (si === 4) {
    drawCoverRegion("assets/intro/panels/panel_09_huit_mondes_constellation.png", 0, TOP_BAR_H, 480, STAGE_H,
      1.04, 0, lerp(0.10, -0.10, u), "rgba(6,10,24,0.68)");
  } else if (si === 7) {
    if (u < 0.50) {
      const u7a = u / 0.50;
      drawCoverRegion("assets/intro/panels/panel_05_mondes_retro_evolution.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
        lerp(1.01, 1.13, u7a), lerp(0.015, -0.015, u7a), lerp(-0.08, 0.06, u7a));
    } else {
      const u7b = (u - 0.50) / 0.50;
      drawCoverRegion("assets/intro/panels/panel_06_mondes_16_32_bits.png", shkX, TOP_BAR_H + shkY, 480, STAGE_H,
        lerp(1.01, 1.10, u7b), lerp(0.01, -0.01, u7b), lerp(0.08, -0.05, u7b));
    }
  }

  if ([0,1,3,7,8].includes(si)) {
    for (const p of particles) {
      const tw = 0.28 + 0.5 * Math.abs(Math.sin(t * 2.4 + p.ph));
      if (si === 7) {
        ctx.strokeStyle = `rgba(166,242,255,${tw * 0.65})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.sz * 11); ctx.stroke();
      } else {
        ctx.fillStyle = si === 1 ? `rgba(255,64,85,${tw*0.42})` : (si === 8 ? `rgba(255,209,102,${tw*0.42})` : `rgba(127,230,255,${tw*0.42})`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI*2); ctx.fill();
      }
    }
  }
  ctx.restore();

  if (si === 4) {
    const wu = clamp(u * 0.9999, 0, 0.9999);
    const wi = Math.min(7, Math.floor(wu * 8));
    const locU = (wu * 8) % 1.0;
    if (wi !== lastWorld) { lastWorld = wi; flash = Math.max(flash, 0.25); }
    const w = WORLDS[wi];

    // Rail de progression M1..M8 (24 secteurs)
    const railY = 56, totalW = 436, worldW = (totalW - 7 * 6) / 8;
    for (let m=0; m<8; m++) {
      const mx = 22 + m * (worldW + 6);
      const isCur = m === wi, isDone = m < wi;
      ctx.fillStyle = isCur ? "rgba(28,46,84,0.92)" : (isDone ? "rgba(18,30,58,0.82)" : "rgba(10,16,32,0.72)");
      ctx.fillRect(mx, railY, worldW, 24);
      ctx.strokeStyle = isCur ? WORLDS[m].color : "rgba(120,150,195,0.42)";
      ctx.lineWidth = isCur ? 2.0 : 1.0;
      ctx.strokeRect(mx, railY, worldW, 24);
      ctx.textAlign = "center";
      ctx.fillStyle = isCur ? "#ffffff" : "rgba(210,230,250,0.82)";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`M${m+1}`, mx + worldW * 0.5, railY + 13);
      for (let s=0; s<3; s++) {
        const sw = ((worldW - 10) / 3) - 2;
        const sx = mx + 5 + s * ((worldW - 10) / 3);
        ctx.fillStyle = (isDone || isCur) ? WORLDS[m].color : "rgba(65,80,105,0.45)";
        ctx.fillRect(sx, railY + 17, sw, 4);
      }
    }

    ctx.fillStyle = "rgba(10,18,38,0.94)"; ctx.fillRect(22, 88, 436, 26);
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.5; ctx.strokeRect(22, 88, 436, 26);
    ctx.textAlign = "center";
    ctx.fillStyle = w.accent; ctx.font = "bold 11px sans-serif";
    ctx.fillText(w.fam, 240, 105);

    ctx.save(); ctx.beginPath(); ctx.rect(22, 118, 436, 340); ctx.clip();
    const bgOverlay = w.bg.endsWith("panel_09_huit_mondes_constellation.png") ? "rgba(5,9,22,0.78)" : "rgba(6,11,26,0.68)";
    drawCoverRegion(w.bg, 22, 118, 436, 340, lerp(w.z[0], w.z[1], locU),
      lerp(w.p0[0], w.p1[0], locU), lerp(w.p0[1], w.p1[1], locU), bgOverlay);

    // Socle orbital elliptique sous la console canonique
    ctx.save();
    ctx.strokeStyle = w.color; ctx.globalAlpha = 0.62; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(240, 428, 144, 19, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = w.accent; ctx.globalAlpha = 0.38; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(240, 428, 98, 12.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    const hIm = imgs[w.holo];
    if (hIm && hIm.complete && hIm.naturalWidth > 0) {
      const hSz = lerp(270, 286, Math.pow(locU, 0.65));
      const hx = 240 - hSz * 0.5, hy = 118 + 180 - hSz * 0.5;
      if (locU < 0.24) {
        const scanU = clamp(locU / 0.24, 0.02, 1.0);
        ctx.save(); ctx.globalAlpha = 0.20;
        ctx.drawImage(hIm, hx, hy, hSz, hSz);
        ctx.restore();
        ctx.drawImage(hIm, 0, 0, hIm.naturalWidth, hIm.naturalHeight * scanU, hx, hy, hSz, hSz * scanU);
        const yScan = hy + hSz * scanU;
        ctx.strokeStyle = w.color; ctx.lineWidth = 4.0;
        ctx.beginPath(); ctx.moveTo(hx + 14, yScan); ctx.lineTo(hx + hSz - 14, yScan); ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(hx + 22, yScan); ctx.lineTo(hx + hSz - 22, yScan); ctx.stroke();
      } else {
        ctx.drawImage(hIm, hx, hy, hSz, hSz);
      }
    }

    // Bandeaux techniques supérieurs RELIQUE + typologie matérielle
    ctx.fillStyle = "rgba(8,15,36,0.88)"; ctx.fillRect(30, 126, 98, 19);
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.1; ctx.strokeRect(30, 126, 98, 19);
    ctx.textAlign = "center"; ctx.fillStyle = w.accent; ctx.font = "bold 9px sans-serif";
    ctx.fillText(`RELIQUE 0${wi+1}/08`, 79, 139);

    ctx.fillStyle = "rgba(8,15,36,0.88)"; ctx.fillRect(218, 126, 232, 19);
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.1; ctx.strokeRect(218, 126, 232, 19);
    ctx.fillStyle = "#e8f4ff"; ctx.font = "bold 9px sans-serif";
    ctx.fillText(w.hw, 334, 139);

    ctx.restore();
    drawMangaFrame(22, 118, 436, 340, w.color, 2.2 + 0.6 * beat);

    // Fiche monde canonique (y = 464..530)
    ctx.fillStyle = "rgba(8,14,30,0.92)"; ctx.fillRect(24, 464, 432, 66);
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.4; ctx.strokeRect(24, 464, 432, 66);
    ctx.beginPath(); ctx.arc(52, 497, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,34,64,0.85)"; ctx.fill();
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.4; ctx.stroke();
    if (okImg(hIm)) ctx.drawImage(hIm, 26, 471, 52, 52);

    ctx.textAlign = "left";
    const cTitle = `MONDE ${w.world} / 8 — ${w.console.toUpperCase()}`;
    ctx.fillStyle = "#ffffff"; ctx.font = cTitle.length > 25 ? "bold 12.5px sans-serif" : "bold 14.5px sans-serif";
    ctx.fillText(cTitle, 80, 488);

    ctx.fillStyle = "rgba(20,34,64,0.9)"; ctx.fillRect(326, 472, 120, 22);
    ctx.strokeStyle = w.color; ctx.lineWidth = 1.3; ctx.strokeRect(326, 472, 120, 22);
    ctx.textAlign = "center"; ctx.fillStyle = w.accent; ctx.font = "bold 9.5px sans-serif";
    ctx.fillText(w.sectors, 386, 487);

    ctx.textAlign = "left";
    ctx.fillStyle = w.accent; ctx.font = "10px sans-serif";
    ctx.fillText(w.sig, 80, 507);
    ctx.fillStyle = "rgba(192,218,246,0.88)"; ctx.font = "9.5px sans-serif";
    ctx.fillText(w.spec, 80, 522);

    // Galerie des 8 consoles canoniques (2 rangées × 4)
    for (let m=0; m<8; m++) {
      const gx = 22 + (m % 4) * 110.5, gy = 544 + Math.floor(m / 4) * 28;
      const active = m === wi;
      ctx.fillStyle = active ? "rgba(24,42,78,0.95)" : "rgba(10,16,32,0.84)";
      ctx.fillRect(gx, gy, 105, 23);
      ctx.strokeStyle = active ? WORLDS[m].color : "rgba(110,145,190,0.35)";
      ctx.lineWidth = active ? 1.7 : 1.0;
      ctx.strokeRect(gx, gy, 105, 23);
      const mh = imgs[WORLDS[m].holo];
      if (okImg(mh)) ctx.drawImage(mh, gx + 2, gy + 1.5, 20, 20);
      ctx.textAlign = "center";
      ctx.fillStyle = active ? "#fff" : "rgba(205,224,246,0.88)";
      ctx.font = WORLDS[m].console.length > 12 ? "bold 8px sans-serif" : "bold 9px sans-serif";
      ctx.fillText(WORLDS[m].console, gx + 62.5, gy + 15);
    }
  } else {
    lastWorld = -1;
  }

  if (si === 5) {
    ctx.save(); ctx.beginPath(); ctx.rect(18, 56, 444, 188); ctx.clip();
    ctx.fillStyle = "#14040a"; ctx.fillRect(18, 56, 444, 188);
    drawCoverRegion("assets/intro/panels/panel_10_clash_energie.png", 18, 56, 444, 188, 1.35, -0.15, -0.22, "rgba(20,4,10,0.52)");
    const vw5 = lerp(404, 428, u), vh5 = vw5 * (927 / 1200);
    const vxIm = imgs["assets/intro/characters/vorax/vorax_mecha.png"];
    if (okImg(vxIm)) ctx.drawImage(vxIm, 18 + (444 - vw5)*0.5, 48, vw5, vh5);
    ctx.restore();
    drawMangaFrame(18, 56, 444, 188, "#ff4055", 2.4);

    ctx.save(); ctx.beginPath(); ctx.rect(18, 254, 444, 174); ctx.clip();
    drawCoverRegion("assets/intro/panels/panel_10_clash_energie.png", 18, 254, 444, 174, lerp(1.04, 1.18, u), 0, 0);
    ctx.restore();
    drawMangaFrame(18, 254, 444, 174, "#eef6ff", 2.0);

    ctx.save(); ctx.beginPath(); ctx.rect(18, 438, 217, 190); ctx.clip();
    drawCoverRegion("assets/intro/bg/cockpit_orbital_portrait.png", 18, 438, 217, 190, 1.2, 0, -0.15, "rgba(8,12,28,0.52)");
    const vsz = 268, vy = 438 + (190 + 64) - vsz * (463 / 480);
    drawPoseSeq("assets/intro/characters/vesta/vesta_0", [[0,3],[0.42,4]], u, 18 + (217 - vsz)*0.5, vy, vsz, vsz, 0.14);
    ctx.restore();
    drawMangaFrame(18, 438, 217, 190, "#c8a8ff", 2.0);

    ctx.save(); ctx.beginPath(); ctx.rect(245, 438, 217, 190); ctx.clip();
    drawCoverRegion("assets/intro/bg/cockpit_orbital_wide.png", 245, 438, 217, 190, 1.2, 0, -0.08, "rgba(8,14,32,0.48)");
    const psz = 290, py = 438 + (190 + 64) - psz * (463 / 480);
    drawPoseSeq("assets/intro/characters/pilot/pilot_0", [[0,6],[0.45,8]], u, 245 + (217 - psz)*0.5, py, psz, psz, 0.14);
    ctx.restore();
    drawMangaFrame(245, 438, 217, 190, "#5cc8ff", 2.0);
  }

  if (si === 6) {
    ctx.save(); ctx.beginPath(); ctx.rect(18, 56, 444, 184); ctx.clip();
    drawCoverRegion("assets/intro/bg/cockpit_orbital_wide.png", 18, 56, 444, 184, 1.15, lerp(-0.02, 0.02, u), -0.05, "rgba(8,14,32,0.44)");
    const psz = lerp(350, 364, u), py = 56 + (184 + 110) - psz * (463 / 480);
    drawPoseSeq("assets/intro/characters/pilot/pilot_0", [[0,8],[0.38,7]], u, 18 + (444 - psz)*0.5, py, psz, psz, 0.12);
    ctx.restore();
    drawMangaFrame(18, 56, 444, 184, "#ffd166", 2.2);

    const vibAmt = clamp((t - 53.2) * 0.75, 0, 2.0);
    const vx = Math.sin(t * 52) * vibAmt, vy2 = Math.cos(t * 43) * vibAmt;
    ctx.save(); ctx.beginPath(); ctx.rect(18, 250, 444, 378); ctx.clip();
    drawCoverRegion("assets/intro/panels/panel_07_vanguard_ignition.png", 18 + vx, 250 + vy2, 444, 378,
      lerp(1.02, 1.14, Math.pow(u, 0.65)), 0, lerp(0.03, -0.03, u));
    ctx.restore();
    drawMangaFrame(18, 250, 444, 378, "#4cf4ff", 2.4);
  }

  if (si === 7) {
    ctx.save(); ctx.beginPath(); ctx.rect(18, 58, 174, 128); ctx.clip();
    ctx.fillStyle = "#071024"; ctx.fillRect(18, 58, 174, 128);
    drawCoverRegion("assets/intro/bg/cockpit_orbital_portrait.png", 18, 58, 174, 128, 1.25, 0, -0.16, "rgba(7,16,36,0.52)");
    const vsz = 216, vy = 58 + (128 + 68) - vsz * (463 / 480);
    drawPoseSeq("assets/intro/characters/vesta/vesta_0", [[0,7],[0.40,8]], u, 18 + (174 - vsz)*0.5, vy, vsz, vsz, 0.14);
    ctx.restore();
    drawMangaFrame(18, 58, 174, 128, "#4cf4ff", 2.2);
  }

  ctx.fillStyle = si === 8 ? "rgba(5,8,20,0.72)" : "rgba(5,8,20,0.82)";
  ctx.fillRect(0, 0, 480, TOP_BAR_H);
  if (si === 8) {
    ctx.fillStyle = "rgba(4,7,17,0.90)";
    ctx.fillRect(0, 804, 480, 56);
  } else {
    ctx.fillStyle = "#040711";
    ctx.fillRect(0, DIALOGUE_TOP_Y, 480, 860 - DIALOGUE_TOP_Y);
    ctx.strokeStyle = sc.col; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(0, DIALOGUE_TOP_Y); ctx.lineTo(480, DIALOGUE_TOP_Y); ctx.stroke();
  }

  ctx.fillStyle = sc.col; ctx.fillRect(14, 13, 4, 22);
  ctx.textAlign = "left"; ctx.fillStyle = "#e6f4ff"; ctx.font = "bold 11px sans-serif";
  ctx.fillText(sc.kicker, 25, 29);

  ctx.fillStyle = "rgba(12,20,40,0.9)"; ctx.fillRect(364, 11, 102, 28);
  ctx.strokeStyle = "#7fe6ff"; ctx.lineWidth = 1.3; ctx.strokeRect(364, 11, 102, 28);
  ctx.textAlign = "center"; ctx.fillStyle = "#d8f3ff"; ctx.font = "bold 11px sans-serif";
  ctx.fillText("PASSER ⏭", 415, 29);

  if (si === 8) {
    const slam = clamp((u - 0.16) / 0.24, 0, 1);
    if (slam > 0.005) {
      ctx.save(); ctx.globalAlpha = Math.pow(slam, 0.45);
      ctx.fillStyle = "rgba(6,13,33,0.86)"; ctx.fillRect(20, 732, 440, 70);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.2; ctx.strokeRect(20, 732, 440, 70);
      ctx.strokeStyle = "rgba(76,220,255,0.40)"; ctx.lineWidth = 1.0; ctx.strokeRect(24, 736, 432, 62);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(25,140,255,0.65)"; ctx.font = "900 24px sans-serif";
      ctx.fillText("NEO VANGUARD", 242, 759);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("NEO VANGUARD", 240, 757);
      ctx.fillStyle = "rgba(18,31,62,0.94)"; ctx.fillRect(78, 764, 324, 19);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.3; ctx.strokeRect(78, 764, 324, 19);
      ctx.fillStyle = "#ffe07a"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("8 MONDES — 24 SECTEURS", 240, 778);
      ctx.fillStyle = "#ebf6ff"; ctx.font = "9.5px sans-serif";
      ctx.fillText("Préservez les vestiges sacrés. Rallumez les couleurs de l'univers.", 240, 796);
      ctx.restore();
    }
  } else {
    const bx = 16, by = 652, bw = 448, bh = 150;
    ctx.fillStyle = "rgba(10,18,38,0.98)";
    ctx.beginPath(); ctx.moveTo(bx+10, by); ctx.lineTo(bx+bw, by); ctx.lineTo(bx+bw-10, by+bh); ctx.lineTo(bx, by+bh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = sc.col; ctx.lineWidth = 2.0; ctx.stroke();

    ctx.fillStyle = "#0d1936"; ctx.fillRect(bx+14, by-11, 286, 22);
    ctx.strokeStyle = sc.col; ctx.lineWidth = 1.6; ctx.strokeRect(bx+14, by-11, 286, 22);
    ctx.textAlign = "left"; ctx.fillStyle = sc.col; ctx.font = "bold 11px sans-serif";
    ctx.fillText(sc.speaker, bx+24, by+4);

    ctx.textAlign = "right"; ctx.fillStyle = sc.col + "bb"; ctx.font = "bold 10px sans-serif";
    ctx.fillText(sc.stamp, bx+bw-16, by+17);

    const fullTxt = sc.lines.join("\n\n");
    const chars = Math.max(1, Math.ceil(fullTxt.length * Math.min(1, u / 0.65)));
    ctx.textAlign = "left"; ctx.fillStyle = "#eef6ff"; ctx.font = "13px sans-serif";
    wrapText(fullTxt.slice(0, chars), bx + 20, by + 36, bw - 40, 18.5);
  }

  ctx.fillStyle = "rgba(36,52,86,0.85)"; ctx.fillRect(18, 810, 444, 4);
  ctx.fillStyle = "#4cf4ff"; ctx.fillRect(18, 810, 444 * (t / 71.64), 4);
  for (const s of SCENES) {
    const sx = 18 + 444 * (s.t0 / 71.64);
    ctx.fillStyle = "rgba(218,240,255,0.7)"; ctx.fillRect(sx, 808, 2, 8);
  }
  const mm = String(Math.floor(t/60)).padStart(2,"0"), ss = String(Math.floor(t%60)).padStart(2,"0");
  ctx.textAlign = "left"; ctx.fillStyle = "#a8c8ec"; ctx.font = "10px sans-serif";
  ctx.fillText(`${mm}:${ss} / 01:11  ·  ACTE ${sc.act}/5  ·  SCÈNE ${si+1}/9`, 18, 838);

  ctx.fillStyle = "rgba(15,28,56,0.88)"; ctx.fillRect(336, 820, 130, 28);
  ctx.strokeStyle = "rgba(90,204,255,0.68)"; ctx.lineWidth = 1.2; ctx.strokeRect(336, 820, 130, 28);
  ctx.textAlign = "center"; ctx.fillStyle = "#9be8ff"; ctx.font = "bold 11px sans-serif";
  ctx.fillText(si >= 8 ? "JOUER ▶" : "SUIVANT ▶", 401, 838);

  if (flash > 0.01) {
    ctx.fillStyle = `rgba(235,248,255,${flash * 0.35})`;
    ctx.fillRect(0, 0, 480, 860);
  }
  if (t < 0.26) {
    const openFade = 1.0 - clamp(t / 0.26, 0, 1);
    ctx.fillStyle = `rgba(4,6,14,${openFade})`;
    ctx.fillRect(0, 0, 480, 860);
  }
}
requestAnimationFrame(render);
</script>
</body>
</html>
"""

FANBOY_HTML = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NEO VANGUARD — Console FanBoy Animée (Secteurs 1–3 · Godot 4.7)</title>
<style>
  :root {
    --bg: #050814; --panel: #0b1226; --border: rgba(76, 244, 255, 0.35);
    --cyan: #4cf4ff; --gold: #ffd166; --ink: #eef6ff; --dim: #92a8c8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(circle at 50% 0%, #101d3d 0%, #050814 68%);
    color: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh; display: flex; flex-direction: column;
  }
  header {
    padding: 12px 18px; background: rgba(6, 10, 24, 0.92);
    border-bottom: 1px solid var(--border); display: flex; flex-wrap: wrap;
    gap: 12px; align-items: center; justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .badge {
    padding: 4px 9px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
    border-radius: 6px; background: rgba(76, 244, 255, 0.14);
    border: 1px solid var(--cyan); color: var(--cyan);
  }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  button, a.btn {
    cursor: pointer; font-size: 12px; font-weight: 700; padding: 9px 13px;
    border-radius: 8px; border: 1px solid var(--border); background: #101b37;
    color: var(--ink); text-decoration: none; transition: 0.15s ease;
    display: inline-flex; align-items: center; gap: 6px;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  button:hover, a.btn:hover, button.active { border-color: var(--cyan); background: #1c3568; }
  .btn-gold {
    background: linear-gradient(135deg, rgba(255, 209, 102, 0.24), rgba(255, 145, 56, 0.22));
    border-color: var(--gold); color: var(--gold);
  }
  .btn-play {
    background: linear-gradient(135deg, rgba(76, 244, 255, 0.26), rgba(90, 120, 255, 0.28));
    border-color: var(--cyan); color: #fff;
  }
  main {
    flex: 1; display: grid; grid-template-columns: minmax(300px, 450px) 1fr;
    gap: 16px; padding: 12px 14px; max-width: 1380px; width: 100%; margin: 0 auto;
  }
  @media (max-width: 920px) {
    header { padding: 8px 10px; gap: 8px; }
    .brand-sub { display: none; }
    main { grid-template-columns: 1fr; justify-items: stretch; padding: 8px 10px; gap: 12px; }
  }
  .stage-col { width: 100%; display: flex; flex-direction: column; align-items: center; }
  .canvas-frame {
    position: relative; width: min(92vw, 415px); aspect-ratio: 937 / 1679;
    border-radius: 14px; overflow: hidden;
    border: 2px solid rgba(76, 244, 255, 0.55);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.72), 0 0 28px rgba(76, 244, 255, 0.18);
    background: #04060e;
    touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  canvas { width: 100%; height: 100%; display: block; touch-action: none; }
  .card {
    background: rgba(11, 18, 38, 0.88); border: 1px solid rgba(76, 244, 255, 0.22);
    border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; width: 100%;
  }
  .card h3 { font-size: 12px; letter-spacing: 0.06em; color: var(--cyan); margin-bottom: 6px; }
  .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }
  .kv { font-size: 12px; color: var(--dim); line-height: 1.55; }
  .kv code { color: var(--gold); background: rgba(255, 209, 102, 0.1); padding: 1px 5px; border-radius: 4px; }
</style>
</head>
<body>
<header>
  <div class="brand">
    <span class="badge">FANBOY · SECTEURS 1–3</span>
    <div>
      <div style="font-weight:800;font-size:14px;letter-spacing:0.04em;">CONSOLE FANBOY INTERACTIVE (TACTILE MOBILE & SOURIS)</div>
      <div class="brand-sub" style="font-size:11px;color:var(--dim);">Boutons A/B corrigés sur coque · Jauge COQUE 8 crans alignée · Multi-touch</div>
    </div>
  </div>
  <div class="actions">
    <a class="btn btn-play" href="intro">🎬 Cinématique d'Intro</a>
    <a class="btn btn-gold" href="https://github.com/JacquesBV/Neo-vanguard/archive/refs/heads/arena/38f5f5c5-neo-vanguard.zip" target="_blank" rel="noopener">⬇ ZIP Complet (GitHub)</a>
  </div>
</header>
<main>
  <div class="stage-col">
    <div class="canvas-frame">
      <canvas id="cv" width="937" height="1679"></canvas>
    </div>
    <div style="font-size:11px;color:var(--dim);text-align:center;margin-top:6px;">
      📱 Touchez le <b>stick</b>, les boutons <b>A</b> (tir) / <b>B</b> (bombe), <b>SELECT/START</b>, l'interrupteur <b>ON/OFF</b> ou directement l'écran LCD.
    </div>
  </div>
  <div style="width:100%;">
    <div class="card">
      <h3>LANCER UN SECTEUR (NIVEAUX 1, 2, 3 INCLUS → BASCULE NIVEAU 4)</h3>
      <div class="kv">Cliquez pour tester le lancement de chaque secteur dans le <code>GameViewport (620×890)</code> de la FanBoy, puis la bascule plein écran au Secteur 4 (<i>FanBoy Adventure</i>) :</div>
      <div class="row">
        <button id="sec1" class="active" onclick="launchSector(1)">▶ Secteur 1 (FanBoy)</button>
        <button id="sec2" onclick="launchSector(2)">▶ Secteur 2 (FanBoy)</button>
        <button id="sec3" onclick="launchSector(3)">▶ Secteur 3 (FanBoy)</button>
        <button id="sec4" onclick="launchSector(4)">▶ Secteur 4 (FanBoy Adventure · Plein écran)</button>
      </div>
    </div>
    <div class="card">
      <h3>ÉTATS LUMINEUX & TÉLÉMÉTRIE TEMPS RÉEL (SHADERS + JAUGES)</h3>
      <div class="row">
        <button onclick="setSimThreat(0.10)">🟢 Calme (#48e4a1)</button>
        <button onclick="setSimThreat(0.50)">🟠 Attention (#ffae32)</button>
        <button onclick="spawnSimBoss()">🔴 Boss Critique (#ff343a)</button>
        <button onclick="togglePower()">⏻ Interrupteur ON/OFF</button>
      </div>
      <div class="kv" id="teleReadout" style="margin-top:10px;">Initialisation des calques FanBoy…</div>
    </div>
    <div class="card">
      <h3>INTERACTION DIRECTE SUR LA CONSOLE</h3>
      <div class="kv">
        • <b>Stick analogique gauche</b> : déplacez à la souris / au doigt sur 360° (retour ressort + <code>stick_return.wav</code>).<br/>
        • <b>Bouton A rouge</b> : tir continu vers l'avant depuis les canons d'ailes du Vanguard.<br/>
        • <b>Bouton B doré</b> : bombe IEM (onde de choc LCD).<br/>
        • <b>SELECT</b> : fige / reprend la partie sur le LCD · <b>START</b> : ouvre / ferme le menu pause.<br/>
        • <b>Interrupteur latéral haut-gauche</b> : clic ou glissement vertical ON/OFF (<code>switch_on.wav</code> / <code>switch_off.wav</code>) — coupe l'écran, les jauges et toutes les LED.<br/>
        • <b>Fichiers Godot intégrés</b> : <code>scenes/FanBoy.tscn</code>, <code>scripts/fanboy.gd</code>, <code>scripts/led.gdshader</code>, <code>assets/layout.json</code>, <code>assets/layers/*.png</code>, <code>assets/audio/*.wav</code>, <code>tests/test_fanboy.gd</code>.
      </div>
    </div>
  </div>
</main>
<script>
const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");
const lcd = document.createElement("canvas");
lcd.width = 620; lcd.height = 890;
const lctx = lcd.getContext("2d");
const glowCv = document.createElement("canvas");
glowCv.width = 937; glowCv.height = 1679;
const gctx = glowCv.getContext("2d");

const CENTERS = {
  a: {x: 635.5, y: 1386.5}, b: {x: 757.0, y: 1297.5},
  select: {x: 522.5, y: 1261.5}, start: {x: 522.5, y: 1324.5},
  stick: {x: 296.5, y: 1344.0}, power: {x: 106.5, y: 212.0}, led: {x: 107.0, y: 219.5}
};
const LAYER_KEYS = ["hidden_sockets","shell","threat_lights","a","b","select","start","stick","power","led"];
const imgs = {};
LAYER_KEYS.forEach(k => { const im = new Image(); im.src = `assets/layers/${k}.png?v=2`; imgs[k] = im; });
const HULL_CELLS = [
  [221,1522,9,17],[234,1522,10,17],[249,1522,10,17],[264,1522,10,17],
  [280,1522,10,17],[294,1522,10,17],[308,1522,10,17],[322,1522,14,17]
];
const BOSS_CELLS = [
  [221,1563,12,18],[236,1563,12,18],[252,1563,12,18],[267,1563,12,18],[283,1563,12,18],[298,1563,12,18],
  [314,1563,12,18],[329,1563,12,18],[345,1563,12,18],[360,1563,12,18],[376,1563,12,18],[391,1563,12,18],
  [406,1563,12,18],[422,1563,12,18],[437,1563,12,18],[453,1563,12,18],[468,1563,12,18],[484,1563,12,18],
  [499,1563,12,18],[515,1563,12,18],[530,1563,12,18],[546,1563,12,18],[561,1563,12,18],[577,1563,12,18],
  [592,1563,12,18],[608,1563,12,18],[623,1563,12,18],[638,1563,12,18],[654,1563,12,18],[667,1563,7,18]
];
const sfx = {};
["press","release","switch_on","switch_off","stick_return"].forEach(k => { sfx[k] = new Audio(`assets/audio/${k}.wav`); sfx[k].volume = 0.45; });
function playSfx(k){ try { const a = sfx[k].cloneNode(); a.volume = 0.45; a.play().catch(()=>{}); } catch(e){} }

let sector = 1, powered = true, powerY = 0, ledEnergy = 1.0;
let stickVec = {x:0, y:0}, stickVis = {x:0, y:0};
let held = {a:false, b:false, select:false, start:false, screenFire:false};
let loadT = 0, paused = false, pauseMenu = false;
let ship = {x: 310, y: 700, hp: 8, maxHp: 8, lives: 3, bombs: 3, score: 0};
let bullets = [], enemies = [], shocks = [], boss = null, simThreatOverride = -1;
const captures = new Map();
let lastTouchMs = 0;

function okImg(im){ return Boolean(im && im.complete && im.naturalWidth > 0); }

function launchSector(lv) {
  sector = lv;
  [1,2,3,4].forEach(n => document.getElementById("sec"+n).classList.toggle("active", n===lv));
  loadT = 0; paused = false; pauseMenu = false;
  bullets = []; enemies = []; shocks = []; boss = null; simThreatOverride = -1;
  ship.x = 310; ship.y = 700; ship.hp = 8;
  for (let i = 0; i < 4 + lv; i++) {
    enemies.push({x: 110 + (i*110)%400, y: 140 + (i%3)*75, hp: 3, vx: (i%2?1:-1)*55});
  }
  if (lv <= 3 && !powered) togglePower(true);
  ledEnergy = 0.1;
}
function setSimThreat(v){ simThreatOverride = v; if (v < 0.7) boss = null; }
function spawnSimBoss(){
  simThreatOverride = 0.92;
  boss = {name: sector===1 ? "GARDIEN DU SILO" : (sector===2 ? "FOREMAN BASTION" : "SENTINELLE OMÉGA"), hp: 90, maxHp: 100, x: 310, y: 245, dir: 1};
}
function togglePower(forceOn){
  powered = (typeof forceOn === "boolean") ? forceOn : !powered;
  powerY = powered ? 0 : 18;
  playSfx(powered ? "switch_on" : "switch_off");
  if (!powered) { held = {a:false,b:false,select:false,start:false,screenFire:false}; stickVec = {x:0,y:0}; captures.clear(); }
}
launchSector(1);

function clientToMaster(clientX, clientY){
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return {x: 0, y: 0};
  return { x: (clientX - r.left) * (937 / r.width), y: (clientY - r.top) * (1679 / r.height) };
}
function hitTest(p){
  if (Math.abs(p.x - CENTERS.power.x) <= 42 && Math.abs(p.y - (CENTERS.power.y + powerY)) <= 68) return "power";
  if (!powered) return "";
  if (Math.hypot(p.x - CENTERS.stick.x, p.y - CENTERS.stick.y) <= 122) return "stick";
  if (Math.hypot(p.x - CENTERS.a.x, p.y - CENTERS.a.y) <= 68) return "a";
  if (Math.hypot(p.x - CENTERS.b.x, p.y - CENTERS.b.y) <= 62) return "b";
  if (Math.abs(p.x - CENTERS.select.x) <= 52 && Math.abs(p.y - CENTERS.select.y) <= 28) return "select";
  if (Math.abs(p.x - CENTERS.start.x) <= 52 && Math.abs(p.y - CENTERS.start.y) <= 28) return "start";
  if (p.x >= 158 && p.x <= 778 && p.y >= 287 && p.y <= 1177) return "screen";
  return "";
}
function handleDown(id, clientX, clientY){
  if (sector >= 4) {
    const p = clientToMaster(clientX, clientY);
    captures.set(id, {target: "full", lastP: p});
    ship.x = Math.max(48, Math.min(572, p.x * (620 / 937)));
    ship.y = Math.max(120, Math.min(820, p.y * (890 / 1679)));
    return;
  }
  const p = clientToMaster(clientX, clientY);
  const t = hitTest(p);
  if (!t) return;
  captures.set(id, {target: t, startY: p.y, dragged: false});
  if (t === "power") return;
  if (t === "stick") updateStick(p);
  else if (t === "screen") {
    held.screenFire = true;
    ship.x = Math.max(48, Math.min(572, p.x - 158));
    ship.y = Math.max(120, Math.min(820, p.y - 287 - 48));
  } else if (t in held) {
    held[t] = true; playSfx("press");
    if (t === "b" && ship.bombs > 0 && !paused) { ship.bombs--; shocks.push({x: ship.x, y: ship.y, r: 16}); }
    if (t === "select") { if (pauseMenu) { pauseMenu = false; paused = false; } else paused = !paused; }
    if (t === "start") { pauseMenu = !pauseMenu; paused = pauseMenu; }
  }
}
function handleMove(id, clientX, clientY){
  const cap = captures.get(id);
  if (!cap) return;
  const p = clientToMaster(clientX, clientY);
  if (cap.target === "full") {
    ship.x = Math.max(48, Math.min(572, p.x * (620 / 937)));
    ship.y = Math.max(120, Math.min(820, p.y * (890 / 1679)));
  } else if (cap.target === "stick") {
    updateStick(p);
  } else if (cap.target === "screen" && powered && !paused) {
    ship.x = Math.max(48, Math.min(572, p.x - 158));
    ship.y = Math.max(120, Math.min(820, p.y - 287 - 48));
  } else if (cap.target === "power") {
    const dy = p.y - cap.startY;
    if (Math.abs(dy) > 7) cap.dragged = true;
    powerY = Math.max(0, Math.min(18, (powered ? 0 : 18) + dy));
  }
}
function handleUp(id){
  const cap = captures.get(id);
  if (!cap) return;
  captures.delete(id);
  if (cap.target === "power") {
    if (cap.dragged) togglePower(powerY < 9);
    else togglePower(!powered);
  } else if (cap.target === "stick") {
    if (Math.hypot(stickVec.x, stickVec.y) > 0.2) playSfx("stick_return");
    stickVec = {x:0, y:0};
  } else if (cap.target === "screen") {
    held.screenFire = false;
  } else if (cap.target in held && held[cap.target]) {
    held[cap.target] = false; playSfx("release");
  }
}

// Multi-touch natif mobile (prioritaire dans les iframes mobiles Safari/Chrome)
cv.addEventListener("touchstart", ev => {
  lastTouchMs = performance.now();
  if (ev.cancelable) ev.preventDefault();
  for (let i = 0; i < ev.changedTouches.length; i++) {
    const t = ev.changedTouches[i];
    handleDown("t" + t.identifier, t.clientX, t.clientY);
  }
}, {passive: false});
cv.addEventListener("touchmove", ev => {
  lastTouchMs = performance.now();
  if (ev.cancelable) ev.preventDefault();
  for (let i = 0; i < ev.changedTouches.length; i++) {
    const t = ev.changedTouches[i];
    handleMove("t" + t.identifier, t.clientX, t.clientY);
  }
}, {passive: false});
function onTouchEnd(ev){
  lastTouchMs = performance.now();
  if (ev.cancelable) ev.preventDefault();
  for (let i = 0; i < ev.changedTouches.length; i++) {
    handleUp("t" + ev.changedTouches[i].identifier);
  }
}
cv.addEventListener("touchend", onTouchEnd, {passive: false});
cv.addEventListener("touchcancel", onTouchEnd, {passive: false});

// Souris / stylet bureau (ignoré si événement synthétique post-tactile)
cv.addEventListener("pointerdown", ev => {
  if (ev.pointerType === "touch" || performance.now() - lastTouchMs < 500) return;
  try { cv.setPointerCapture(ev.pointerId); } catch(e) {}
  handleDown("p" + ev.pointerId, ev.clientX, ev.clientY);
});
cv.addEventListener("pointermove", ev => {
  if (ev.pointerType === "touch" || performance.now() - lastTouchMs < 500) return;
  handleMove("p" + ev.pointerId, ev.clientX, ev.clientY);
});
function endPtr(ev){
  if (ev.pointerType === "touch") return;
  handleUp("p" + ev.pointerId);
}
cv.addEventListener("pointerup", endPtr);
cv.addEventListener("pointercancel", endPtr);

function updateStick(p){
  const dx = p.x - CENTERS.stick.x, dy = p.y - CENTERS.stick.y;
  const d = Math.hypot(dx, dy);
  const clamped = Math.min(d, 72) / 72;
  if (clamped < 0.12) { stickVec = {x:0, y:0}; return; }
  const m = (clamped - 0.12) / 0.88;
  stickVec = {x: (dx/d)*m, y: (dy/d)*m};
}

let lastT = performance.now(), fireCd = 0;
function tick(now){
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  loadT += dt;
  stickVis.x += (stickVec.x * 17 - stickVis.x) * Math.min(1, dt * 18);
  stickVis.y += (stickVec.y * 17 - stickVis.y) * Math.min(1, dt * 18);
  ledEnergy += ((powered ? 1.0 : 0.0) - ledEnergy) * (1 - Math.exp(-dt * 10));

  if ((sector >= 4 || powered) && !paused) {
    ship.x = Math.max(48, Math.min(572, ship.x + stickVec.x * 320 * dt));
    ship.y = Math.max(120, Math.min(820, ship.y + stickVec.y * 320 * dt));
    fireCd -= dt;
    if ((held.a || held.screenFire || sector >= 4) && fireCd <= 0) {
      fireCd = 0.14;
      bullets.push({x: ship.x - 14, y: ship.y - 22}, {x: ship.x + 14, y: ship.y - 22});
    }
    bullets.forEach(b => b.y -= 620 * dt);
    bullets = bullets.filter(b => b.y > 40);
    enemies.forEach(e => {
      e.x += e.vx * dt;
      if (e.x < 70 || e.x > 550) e.vx *= -1;
      bullets.forEach(b => {
        if (Math.abs(b.x - e.x) < 26 && Math.abs(b.y - e.y) < 24) { b.y = -99; e.hp--; ship.score += 25; }
      });
    });
    enemies = enemies.filter(e => e.hp > 0);
    if (enemies.length < 3 && !boss) {
      enemies.push({x: 100 + Math.random()*420, y: 130 + Math.random()*140, hp: 3, vx: (Math.random()>0.5?1:-1)*60});
    }
    if (boss) {
      boss.x += boss.dir * 75 * dt;
      if (boss.x < 150 || boss.x > 470) boss.dir *= -1;
      bullets.forEach(b => {
        if (Math.abs(b.x - boss.x) < 68 && Math.abs(b.y - boss.y) < 42) { b.y = -99; boss.hp = Math.max(5, boss.hp - 0.8); ship.score += 10; }
      });
    }
    shocks.forEach(s => s.r += 540 * dt);
    shocks = shocks.filter(s => s.r < 520);
  }

  const threat = simThreatOverride >= 0 ? simThreatOverride : Math.min(1, enemies.length * 0.08 + (boss ? 0.72 : 0));
  const lightCol = threat < 0.33 ? "#48e4a1" : (threat < 0.67 ? "#ffae32" : "#ff343a");

  if (sector >= 4) {
    // Secteur 4 : FanBoy Adventure en plein écran couleur
    ctx.fillStyle = "#081229"; ctx.fillRect(0, 0, 937, 1679);
    for (let i = 0; i < 45; i++) {
      const sy = ((now * 0.12 + i * 190) % 1679);
      ctx.fillStyle = i%3===0 ? "#5de6ff" : "#3a5a9c";
      ctx.fillRect((i * 173) % 937, sy, 4, 4);
    }
    ctx.fillStyle = "rgba(10,20,44,0.9)"; ctx.fillRect(0, 0, 937, 88);
    ctx.fillStyle = "#4cf4ff"; ctx.font = "bold 28px monospace";
    ctx.fillText(`SECTEUR 04 · FANBOY ADVENTURE (PLEIN ÉCRAN COULEUR)`, 34, 54);
    const sx = ship.x * (937/620), sy = ship.y * (1679/890);
    ctx.fillStyle = "#4cf4ff";
    ctx.beginPath(); ctx.moveTo(sx, sy-42); ctx.lineTo(sx-34, sy+30); ctx.lineTo(sx+34, sy+30); ctx.closePath(); ctx.fill();
    bullets.forEach(b => { ctx.fillStyle = "#ffd166"; ctx.fillRect(b.x*(937/620)-4, b.y*(1679/890)-18, 8, 28); });
    if (loadT < 2.2) {
      ctx.fillStyle = `rgba(6,11,24,${Math.max(0, 1 - (loadT-1.4)/0.8)})`;
      ctx.fillRect(0, 0, 937, 1679);
      ctx.fillStyle = "#ffd166"; ctx.font = "bold 36px sans-serif";
      ctx.fillText("SECTEUR 04 — FANBOY ADVENTURE", 165, 810);
      ctx.fillStyle = "#9be8ff"; ctx.font = "24px monospace";
      ctx.fillText("Console FanBoy désactivée → Bascule 480×860 Plein Écran", 125, 865);
    }
  } else {
    // Rendu LCD 620×890 des Secteurs 1, 2 et 3
    lctx.fillStyle = "#9ea483"; lctx.fillRect(0, 0, 620, 890);
    lctx.strokeStyle = "rgba(89,92,76,0.32)"; lctx.lineWidth = 2;
    const scrollY = (now * 0.08) % 64;
    for (let y = -64; y < 890; y += 64) {
      lctx.strokeRect(18, y + scrollY, 584, 56);
    }
    enemies.forEach(e => {
      lctx.fillStyle = "#2f3329";
      lctx.fillRect(e.x - 22, e.y - 16, 44, 32);
      lctx.fillStyle = "#7d8267";
      lctx.fillRect(e.x - 10, e.y - 6, 20, 12);
    });
    if (boss) {
      lctx.fillStyle = "#2f3329"; lctx.fillRect(boss.x - 74, boss.y - 36, 148, 72);
      lctx.fillStyle = "#595c4c"; lctx.fillRect(boss.x - 56, boss.y - 20, 112, 40);
      lctx.fillStyle = "#2f3329"; lctx.font = "bold 17px monospace";
      lctx.fillText(`⬥ ${boss.name} ⬥`, 175, 68);
    }
    bullets.forEach(b => { lctx.fillStyle = "#2f3329"; lctx.fillRect(b.x - 3, b.y - 14, 6, 20); });
    shocks.forEach(s => { lctx.strokeStyle = "#2f3329"; lctx.lineWidth = 5; lctx.beginPath(); lctx.arc(s.x, s.y, s.r, 0, Math.PI*2); lctx.stroke(); });
    // Vaisseau Vanguard orienté vers l'avant
    lctx.fillStyle = "#2f3329";
    lctx.beginPath(); lctx.moveTo(ship.x, ship.y - 28); lctx.lineTo(ship.x - 24, ship.y + 20); lctx.lineTo(ship.x + 24, ship.y + 20); lctx.closePath(); lctx.fill();
    // Bandeau LCD supérieur
    lctx.fillStyle = "rgba(47,51,41,0.16)"; lctx.fillRect(0, 0, 620, 38);
    lctx.fillStyle = "#2f3329"; lctx.font = "bold 18px monospace";
    lctx.fillText(`SC ${String(ship.score).padStart(7,"0")}`, 18, 26);
    lctx.fillText(`SEC 0${sector} · PULSE`, 235, 26);
    lctx.fillText(`CR 120`, 520, 26);

    if (paused) {
      lctx.fillStyle = "rgba(158,164,131,0.78)"; lctx.fillRect(60, 360, 500, 150);
      lctx.strokeStyle = "#2f3329"; lctx.lineWidth = 4; lctx.strokeRect(60, 360, 500, 150);
      lctx.fillStyle = "#2f3329"; lctx.font = "bold 30px monospace";
      lctx.fillText(pauseMenu ? "MENU START (PAUSE)" : "PAUSE (SELECT)", 145, 425);
      lctx.font = "18px monospace";
      lctx.fillText("Appuyez sur SELECT ou START pour reprendre", 95, 470);
    }
    if (loadT < 2.2) {
      const a = Math.max(0, Math.min(1, (2.2 - loadT) / 0.6));
      lctx.fillStyle = `rgba(11,16,32,${0.94 * a})`; lctx.fillRect(0, 0, 620, 890);
      lctx.fillStyle = `rgba(232,243,255,${a})`; lctx.font = "bold 28px monospace";
      lctx.fillText(`SECTEUR 0${sector} — FANBOY`, 145, 405);
      lctx.fillStyle = `rgba(76,244,255,${a})`;
      lctx.fillRect(110, 445, 400 * Math.min(1, loadT / 1.5), 12);
      lctx.strokeStyle = `rgba(76,244,255,${a})`; lctx.strokeRect(110, 445, 400, 12);
    }

    ctx.clearRect(0, 0, 937, 1679);
    if (okImg(imgs.hidden_sockets)) ctx.drawImage(imgs.hidden_sockets, 0, 0);
    if (powered) ctx.drawImage(lcd, 158, 287);
    else { ctx.fillStyle = "#010101"; ctx.fillRect(158, 287, 620, 890); }
    if (okImg(imgs.shell)) ctx.drawImage(imgs.shell, 0, 0);

    // Rails lumineux de menace (simulation led.gdshader)
    if (okImg(imgs.threat_lights) && ledEnergy > 0.01) {
      gctx.clearRect(0, 0, 937, 1679);
      gctx.drawImage(imgs.threat_lights, 0, 0);
      gctx.globalCompositeOperation = "source-atop";
      gctx.fillStyle = lightCol;
      gctx.fillRect(0, 0, 937, 1679);
      gctx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.globalAlpha = 0.88 * ledEnergy;
      ctx.drawImage(glowCv, 0, 0);
      ctx.restore();
    }

    // Jauges COQUE (8 cellules) et BOSS (30 cellules) — coordonnées exactes de assets/layout.json
    if (powered) {
      ctx.fillStyle = "#72b9e8";
      const hullCells = Math.min(HULL_CELLS.length, Math.ceil((ship.hp / ship.maxHp) * HULL_CELLS.length));
      for (let i = 0; i < hullCells; i++) {
        const [cx, cy, cw, ch] = HULL_CELLS[i];
        ctx.fillRect(cx, cy, cw, ch);
      }
      const bossCells = boss ? Math.min(BOSS_CELLS.length, Math.ceil((boss.hp / boss.maxHp) * BOSS_CELLS.length)) : 0;
      for (let i = 0; i < bossCells; i++) {
        const [cx, cy, cw, ch] = BOSS_CELLS[i];
        ctx.fillRect(cx, cy, cw, ch);
      }
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${ship.lives}`, 414 + 18.5, 1536);
      ctx.fillText(`${ship.bombs}`, 564 + 18.0, 1536);
      if (boss) { ctx.font = "bold 11px monospace"; ctx.fillText(boss.name.slice(0, 13), 691 + 64.0, 1535.5); }
      ctx.textAlign = "left";
    }

    // Contrôles mobiles
    function drawCentered(im, cx, cy, sc=1){
      if (!okImg(im)) return;
      const w = im.width * sc, h = im.height * sc;
      ctx.drawImage(im, cx - w/2, cy - h/2, w, h);
    }
    drawCentered(imgs.a, CENTERS.a.x, CENTERS.a.y + (held.a?3:0), held.a?0.95:1);
    drawCentered(imgs.b, CENTERS.b.x, CENTERS.b.y + (held.b?3:0), held.b?0.95:1);
    drawCentered(imgs.select, CENTERS.select.x, CENTERS.select.y + (held.select?2:0), held.select?0.96:1);
    drawCentered(imgs.start, CENTERS.start.x, CENTERS.start.y + (held.start?2:0), held.start?0.96:1);
    drawCentered(imgs.stick, CENTERS.stick.x + stickVis.x, CENTERS.stick.y + stickVis.y, 1);
    drawCentered(imgs.power, CENTERS.power.x, CENTERS.power.y + powerY, 1);
    if (okImg(imgs.led)) {
      drawCentered(imgs.led, CENTERS.led.x, CENTERS.led.y + powerY, 1);
      if (ledEnergy > 0.02) {
        ctx.save();
        ctx.globalAlpha = 0.75 * ledEnergy;
        ctx.fillStyle = lightCol;
        ctx.beginPath(); ctx.arc(CENTERS.led.x, CENTERS.led.y + powerY, 9, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
  }

  document.getElementById("teleReadout").innerHTML =
    `Secteur actif : <code>0${sector}</code> (${sector<=3 ? "Console FanBoy active · GameViewport 620×890" : "FanBoy Adventure · Plein écran 480×860"}) · ` +
    `Alimentation : <code>${powered ? "ON" : "OFF"}</code> · ` +
    `Stick : <code>(${stickVec.x.toFixed(2)}, ${stickVec.y.toFixed(2)})</code> · ` +
    `Menace LED : <code>${Math.round(threat*100)}% (${lightCol})</code> · ` +
    `COQUE : <code>${ship.hp}/${ship.maxHp}</code> · BOSS : <code>${boss ? Math.round(boss.hp)+"%" : "0 (vide)"}</code>`;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>
</body>
</html>
"""

class IntroPreviewHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        self.send_header("Content-Security-Policy", "frame-ancestors *")
        self.send_header("Cache-Control", "no-store")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_HEAD(self):
        raw_path = unquote(self.path.split("?", 1)[0]).lstrip("/")
        if raw_path in ("Neo-Vanguard-Godot-Complet.zip", "full-godot-pack.zip"):
            zpath = ensure_full_godot_zip()
            fsize = zpath.stat().st_size
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="Neo-Vanguard-Godot-Complet.zip"')
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(fsize))
            self._send_cors()
            self.end_headers()
            return
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        raw_path = unquote(self.path.split("?", 1)[0]).lstrip("/")
        if raw_path in ("", "index.html", "fanboy", "fanboy.html"):
            body = FANBOY_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self._send_cors()
            self.end_headers()
            self.wfile.write(body)
            return

        if raw_path in ("intro", "intro.html"):
            body = INDEX_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self._send_cors()
            self.end_headers()
            self.wfile.write(body)
            return

        if raw_path in ("Neo-Vanguard-Godot-Complet.zip", "full-godot-pack.zip"):
            zpath = ensure_full_godot_zip()
            fsize = zpath.stat().st_size
            range_hdr = self.headers.get("Range")
            if range_hdr:
                m = re.match(r"bytes=(\d+)-(\d*)", range_hdr)
                if m:
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else fsize - 1
                    end = min(end, fsize - 1)
                    if start <= end:
                        length = end - start + 1
                        self.send_response(206)
                        self.send_header("Content-Type", "application/zip")
                        self.send_header("Content-Disposition", 'attachment; filename="Neo-Vanguard-Godot-Complet.zip"')
                        self.send_header("Accept-Ranges", "bytes")
                        self.send_header("Content-Range", f"bytes {start}-{end}/{fsize}")
                        self.send_header("Content-Length", str(length))
                        self._send_cors()
                        self.end_headers()
                        with open(zpath, "rb") as fh:
                            fh.seek(start)
                            remaining = length
                            while remaining > 0:
                                chunk = fh.read(min(1024 * 1024, remaining))
                                if not chunk:
                                    break
                                self.wfile.write(chunk)
                                remaining -= len(chunk)
                        return
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="Neo-Vanguard-Godot-Complet.zip"')
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(fsize))
            self._send_cors()
            self.end_headers()
            with open(zpath, "rb") as fh:
                while True:
                    chunk = fh.read(1024 * 1024)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
            return

        if raw_path == "download-pack.zip":
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for rel in PACK_PATHS:
                    target = REPO / rel
                    if target.is_file():
                        zf.write(target, arcname=rel)
                    elif target.is_dir():
                        for sub in sorted(target.rglob("*")):
                            if sub.is_file():
                                zf.write(sub, arcname=str(sub.relative_to(REPO)))
            data = buf.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="neo-vanguard-intro-godot47.zip"')
            self.send_header("Content-Length", str(len(data)))
            self._send_cors()
            self.end_headers()
            self.wfile.write(data)
            return

        target = (REPO / raw_path).resolve()
        if not str(target).startswith(str(REPO)) or not target.is_file():
            self.send_error(404, "Not found")
            return

        ctype, _ = mimetypes.guess_type(str(target))
        ctype = ctype or "application/octet-stream"
        fsize = target.stat().st_size
        range_hdr = self.headers.get("Range")

        if range_hdr:
            m = re.match(r"bytes=(\d+)-(\d*)", range_hdr)
            if m:
                start = int(m.group(1))
                end = int(m.group(2)) if m.group(2) else fsize - 1
                end = min(end, fsize - 1)
                if start <= end:
                    length = end - start + 1
                    self.send_response(206)
                    self.send_header("Content-Type", ctype)
                    self.send_header("Accept-Ranges", "bytes")
                    self.send_header("Content-Range", f"bytes {start}-{end}/{fsize}")
                    self.send_header("Content-Length", str(length))
                    self._send_cors()
                    self.end_headers()
                    with open(target, "rb") as fh:
                        fh.seek(start)
                        self.wfile.write(fh.read(length))
                    return

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(fsize))
        self._send_cors()
        self.end_headers()
        with open(target, "rb") as fh:
            self.wfile.write(fh.read())

if __name__ == "__main__":
    srv = ThreadingHTTPServer(("0.0.0.0", 8080), IntroPreviewHandler)
    print("Neo Vanguard Intro Preview listening on http://0.0.0.0:8080", flush=True)
    srv.serve_forever()
