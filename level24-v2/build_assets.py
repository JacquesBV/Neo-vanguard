#!/usr/bin/env python3
"""Build the reusable Level 24 V2 atlases from original/generated source art.

The script is deterministic. It only uses local source images, performs background
removal, palette unification, anchored atlas packing and reusable effect creation.
"""
from pathlib import Path
import json, math, random
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'assets/level24-v2'
SRC = PACK / 'source'
OLD = ROOT / 'assets/level24'
META = json.loads((SRC / 'vorax-meta.json').read_text())
random.seed(24024)

for folder in ['environment', 'debris', 'doors', 'enemies', 'hands', 'boss', 'effects']:
    (PACK / folder).mkdir(parents=True, exist_ok=True)


def save(im, path, quality=92):
    path = Path(path)
    if path.suffix == '.webp':
        im.save(path, quality=quality, method=6)
    else:
        im.save(path, optimize=True)


def black_cut(path, pad=8):
    """Remove only near-black pixels connected to the canvas border."""
    im = Image.open(path).convert('RGB')
    a = np.asarray(im)
    candidate = (a.max(axis=2) < 34).astype(np.uint8)
    n, labels = cv2.connectedComponents(candidate, connectivity=4)
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
    bg = np.isin(labels, list(border)) & (candidate > 0)
    fg = (~bg).astype(np.uint8) * 255
    fg = cv2.GaussianBlur(fg, (0, 0), .65)
    out = np.dstack([a, fg])
    rgba = Image.fromarray(out, 'RGBA')
    box = rgba.getbbox()
    if box:
        x0, y0, x1, y1 = box
        rgba = rgba.crop((max(0, x0-pad), max(0, y0-pad), min(im.width, x1+pad), min(im.height, y1+pad)))
    return rgba


def contain(im, size, pad=0):
    w, h = size
    out = Image.new('RGBA', (w, h))
    c = im.copy()
    c.thumbnail((w-2*pad, h-2*pad), Image.Resampling.LANCZOS)
    out.alpha_composite(c, ((w-c.width)//2, (h-c.height)//2))
    return out


def mirror_tile(im, size=1024):
    base = im.convert('RGB').resize((size//2, size//2), Image.Resampling.LANCZOS)
    out = Image.new('RGB', (size, size))
    out.paste(base, (0, 0))
    out.paste(ImageOps.mirror(base), (size//2, 0))
    out.paste(ImageOps.flip(base), (0, size//2))
    out.paste(ImageOps.flip(ImageOps.mirror(base)), (size//2, size//2))
    return out


# Environment -----------------------------------------------------------------
earth = black_cut(SRC / 'earth.png')
save(contain(earth, (1024, 1024), 12), PACK / 'environment/earth.png')
save(contain(earth, (768, 768), 8), PACK / 'environment/earth.webp')
nebula = mirror_tile(Image.open(SRC / 'nebula.png'), 1024)
save(nebula, PACK / 'environment/nebula-tile.webp', 88)
corridor = mirror_tile(Image.open(SRC / 'corridor.png'), 1024)
save(corridor, PACK / 'environment/corridor-tile.webp', 90)
core = Image.open(SRC / 'core-chamber.png').convert('RGB').resize((1024, 1536), Image.Resampling.LANCZOS)
save(core, PACK / 'environment/core-chamber.webp', 92)
base = black_cut(SRC / 'vorax-base.png')
save(contain(base, (1536, 1024), 6), PACK / 'environment/vorax-base.png')
save(contain(base, (1152, 768), 5), PACK / 'environment/vorax-base.webp')

# Debris ----------------------------------------------------------------------
DEBRIS = ['alloy', 'solar', 'rock', 'engine']
debris_manifest = []
for i, name in enumerate(DEBRIS):
    im = black_cut(SRC / f'debris-{name}.png')
    tile = contain(im, (320, 320), 16)
    save(tile, PACK / f'debris/{name}.png')
    save(tile.resize((192, 192), Image.Resampling.LANCZOS), PACK / f'debris/{name}.webp')
    debris_manifest.append({'id': name, 'file': f'debris/{name}.png', 'size': [320, 320], 'anchor': [160, 160], 'mass': [0.65, 0.9, 1.35, 1.1][i]})

# Airlock ---------------------------------------------------------------------
door = black_cut(SRC / 'airlock.png', 2)
door = door.resize((864, 572), Image.Resampling.LANCZOS)
save(door, PACK / 'doors/airlock.png')
save(door, PACK / 'doors/airlock.webp', 94)
# Reusable impact/fracture variants.
for n in range(1, 4):
    d = door.copy()
    glow = Image.new('RGBA', d.size)
    dr = ImageDraw.Draw(glow)
    rng = random.Random(240 + n)
    for j in range(3+n*2):
        x = rng.randint(130, 734); y = rng.randint(80, 490)
        pts = [(x, y)]
        for k in range(rng.randint(3, 6)):
            x += rng.randint(-55, 55); y += rng.randint(22, 65)
            pts.append((x, y))
        dr.line(pts, fill=(255, 110, 140, 220), width=2+n//2)
        dr.line([(x+2, y) for x, y in pts], fill=(170, 90, 255, 130), width=1)
    glow = glow.filter(ImageFilter.GaussianBlur(.45))
    d.alpha_composite(glow)
    save(d, PACK / f'doors/airlock-fracture-{n}.png')

# Palette helpers -------------------------------------------------------------
def red_grade(im, mode):
    arr = np.array(im.convert('RGBA'))
    hsv = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2HSV)
    h, s, v = [hsv[:, :, i] for i in range(3)]
    if mode in ('enemy', 'hand'):
        mask = ((s < 82) & (v > 45) & (arr[:, :, 3] > 0))
        strength = .58 if mode == 'enemy' else .38
        h2 = h.copy(); s2 = s.copy(); v2 = v.copy()
        h2[mask] = 175
        s2[mask] = np.clip(s[mask].astype(float) + (150-s[mask])*strength, 0, 255)
        if mode == 'enemy': v2[mask] = np.clip(v[mask].astype(float)*1.04, 0, 255)
        rgb = cv2.cvtColor(np.dstack([h2, s2, v2]).astype(np.uint8), cv2.COLOR_HSV2RGB)
        arr[:, :, :3] = rgb
    elif mode == 'form2':
        mask = (((h < 12) | (h > 168)) & (s > 75) & (v > 40) & (arr[:, :, 3] > 0))
        h2 = h.copy(); s2 = s.copy(); v2 = v.copy()
        h2[mask] = 145
        s2[mask] = np.clip(s[mask].astype(float)*.88, 0, 255)
        rgb = cv2.cvtColor(np.dstack([h2, s2, v2]).astype(np.uint8), cv2.COLOR_HSV2RGB)
        arr[:, :, :3] = rgb
    elif mode == 'form3':
        mask = (((h < 12) | (h > 168)) & (s > 70) & (v > 35) & (arr[:, :, 3] > 0))
        # Obsidian/silver armor while retaining the hottest scarlet energy.
        hot = mask & (v > 205) & (s > 135)
        h2 = h.copy(); s2 = s.copy(); v2 = v.copy()
        h2[mask] = 0; s2[mask] = 68; v2[mask] = np.clip(v[mask].astype(float)*.82 + 28, 0, 255)
        h2[hot] = 0; s2[hot] = 220; v2[hot] = 255
        rgb = cv2.cvtColor(np.dstack([h2, s2, v2]).astype(np.uint8), cv2.COLOR_HSV2RGB)
        arr[:, :, :3] = rgb
    return Image.fromarray(arr, 'RGBA')

# Enemies: preserve the established gameplay atlas coordinates, new palette. ---
FR = [[9,35,408,439],[424,55,352,387],[767,62,390,422],[1157,16,368,463],[11,498,457,488],[478,509,310,457],[788,502,390,479],[1190,504,323,430]]
ENEMY_NAMES = ['lance','orbe','griffe','gatling','tambour','tourelle','dard','manta']
old_enemies = Image.open(OLD / 'defense-enemies-spritesheet.png').convert('RGBA')
enemy_atlas = Image.new('RGBA', old_enemies.size)
enemy_frames = []
for name, (x,y,w,h) in zip(ENEMY_NAMES, FR):
    crop = red_grade(old_enemies.crop((x,y,x+w,y+h)), 'enemy')
    save(crop, PACK / f'enemies/{name}.png')
    enemy_atlas.alpha_composite(crop, (x,y))
    enemy_frames.append({'id': name, 'rect': [x,y,w,h], 'anchor': [x+w/2,y+h/2]})
save(enemy_atlas, PACK / 'enemies/defense-atlas.png')
save(enemy_atlas, PACK / 'enemies/defense-atlas.webp', 93)

# Hands -----------------------------------------------------------------------
HR = [[17,8,450,515],[489,7,414,531],[892,40,332,461],[1229,43,296,468],[37,528,389,485],[484,530,371,483],[877,505,334,503],[1218,509,302,500]]
old_hands = Image.open(OLD / 'vorax-hands-spritesheet.png').convert('RGBA')
fist = red_grade(old_hands.crop((17,8,467,523)), 'hand')
open_hand = red_grade(old_hands.crop((892,40,1224,501)), 'hand')
save(fist, PACK / 'hands/left-fist.png')
save(open_hand, PACK / 'hands/left-open.png')
save(ImageOps.mirror(fist), PACK / 'hands/right-fist.png')
save(ImageOps.mirror(open_hand), PACK / 'hands/right-open.png')


def fit_exact(im, w, h, angle=0, scale=1):
    c = im.copy()
    if angle: c = c.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    c.thumbnail((int(w*.94*scale), int(h*.94*scale)), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (w,h))
    out.alpha_composite(c, ((w-c.width)//2,(h-c.height)//2))
    return out


def electricity(im, seed):
    out = im.copy(); layer = Image.new('RGBA', im.size); d = ImageDraw.Draw(layer); rng = random.Random(seed)
    for j in range(7):
        x = rng.randint(20, im.width-20); y = rng.randint(15, max(16,im.height//3)); pts=[(x,y)]
        for k in range(6):
            x += rng.randint(-28,28); y += rng.randint(20,45); pts.append((x,y))
        d.line(pts, fill=(210,150,255,240), width=3)
        d.line([(x+2,y) for x,y in pts], fill=(255,255,255,220), width=1)
    blur = layer.filter(ImageFilter.GaussianBlur(5)); out.alpha_composite(blur); out.alpha_composite(layer)
    return out

hand_atlas = Image.new('RGBA', (1536,1024))
poses = [fist, ImageOps.mirror(fist), open_hand, ImageOps.mirror(open_hand), fist.rotate(-7,expand=True), ImageOps.mirror(fist).rotate(7,expand=True), electricity(open_hand,24), electricity(ImageOps.mirror(open_hand),25)]
hand_frames=[]
for i,((x,y,w,h),pose) in enumerate(zip(HR,poses)):
    c=fit_exact(pose,w,h)
    hand_atlas.alpha_composite(c,(x,y))
    hand_frames.append({'frame':i,'rect':[x,y,w,h],'anchor':[x+w/2,y+h/2],'pose':['fist-left','fist-right','open-left','open-right','grip-left','grip-right','storm-left','storm-right'][i]})
save(hand_atlas, PACK / 'hands/vorax-hands-atlas.png')
save(hand_atlas, PACK / 'hands/vorax-hands-atlas.webp', 93)

# Vorax: three anchored 12-frame atlases ---------------------------------------
vorax = Image.open(ROOT / 'assets/bosses/boss-24.webp').convert('RGBA')
CELL = 640
FORM_SOURCES = [
    [0,6,8,0,2,11,1,11,12,4,14,5],
    [15,16,17,15,18,17,18,19,19,20,20,21],
    [13,13,13,13,11,13,12,11,12,4,14,5],
]
FRAME_NAMES = ['idle-a','idle-b','idle-c','idle-d','charge','palms-charge','eyes-fire','palms-fire','beam-release','hit','critical','death']
FORM_IDS = ['cuirasse','necro-reacteur','singularite']
boss_manifest=[]


def extract_frame(idx):
    x,y,w,h,ax,ay,sc = META['f'][idx]
    return vorax.crop((x,y,x+w,y+h)), (ax,ay)


def blade_halo(size, seed, final=False):
    out=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(out); rng=random.Random(seed)
    cx,cy=size/2,size*.53
    for i in range(8 if final else 6):
        a=i*math.tau/(8 if final else 6)+.18
        r=size*.39; x=cx+math.cos(a)*r; y=cy+math.sin(a)*r*.72
        ux,uy=math.cos(a),math.sin(a); px,py=-uy,ux
        length=58 if final else 42; width=10 if final else 7
        pts=[(x+ux*length,y+uy*length),(x+px*width,y+py*width),(x-ux*length*.4,y-uy*length*.4),(x-px*width,y-py*width)]
        d.polygon(pts,fill=(255,40,75,185) if final else (180,70,255,145),outline=(255,210,225,220))
    return out.filter(ImageFilter.GaussianBlur(.35))

for form, sources in enumerate(FORM_SOURCES):
    raw=[extract_frame(i) for i in sources]
    # A single scale per form preserves volume and prevents pumping between poses.
    scale=min(575/max(im.width for im,a in raw), 560/max(im.height for im,a in raw), 1.35)
    atlas=Image.new('RGBA',(CELL*4,CELL*3))
    frames=[]
    for i,(im,(ax,ay)) in enumerate(raw):
        mode='base' if form==0 else ('form2' if form==1 else 'form3')
        im=red_grade(im,mode)
        if form>=1 and i not in (9,11):
            halo=blade_halo(CELL, 2400+form*100+i, final=form==2)
        else: halo=None
        nw,nh=round(im.width*scale),round(im.height*scale)
        im=im.resize((nw,nh),Image.Resampling.LANCZOS)
        cell=Image.new('RGBA',(CELL,CELL))
        if halo: cell.alpha_composite(halo)
        # Stable logical anchor close to the original marionette's body centre.
        px=round(322-ax*scale); py=round(316-ay*scale)
        cell.alpha_composite(im,(px,py))
        if form==2 and i in (4,5,6,7,8):
            glow=Image.new('RGBA',(CELL,CELL)); gd=ImageDraw.Draw(glow)
            gd.ellipse((272,250,372,350),fill=(255,30,65,80))
            glow=glow.filter(ImageFilter.GaussianBlur(24)); cell.alpha_composite(glow)
        x=(i%4)*CELL; y=(i//4)*CELL
        atlas.alpha_composite(cell,(x,y))
        frames.append({'frame':i,'name':FRAME_NAMES[i],'rect':[x,y,CELL,CELL],'anchor':[322,316],'sourceFrame':sources[i]})
    fid=FORM_IDS[form]
    save(atlas,PACK/f'boss/vorax-{fid}.png')
    save(atlas.resize((1536,1152),Image.Resampling.LANCZOS),PACK/f'boss/vorax-{fid}.webp',92)
    boss_manifest.append({'form':form,'id':fid,'file':f'boss/vorax-{fid}.png','runtimeFile':f'boss/vorax-{fid}.webp','cell':[CELL,CELL],'columns':4,'rows':3,'anchor':[322,316],'frames':frames})

# Effects ---------------------------------------------------------------------
size=256
yy,xx=np.mgrid[0:size,0:size]; dx=xx-size/2; dy=yy-size/2; r=np.sqrt(dx*dx+dy*dy)
a=np.exp(-((r-82)/8)**2)*220
rgba=np.zeros((size,size,4),dtype=np.uint8); rgba[:,:,:3]=[255,55,90]; rgba[:,:,3]=a.astype(np.uint8)
save(Image.fromarray(rgba,'RGBA'),PACK/'effects/charge-ring.png')
beam=np.zeros((64,256,4),dtype=np.uint8)
for x in range(64):
    q=abs(x-31.5)/31.5; alpha=int(max(0,1-q)**1.8*220)
    beam[:,x,:3]=[255,35,65]; beam[:,x,3]=alpha
save(Image.fromarray(beam,'RGBA'),PACK/'effects/beam-red.png')
fract=Image.new('RGBA',(512,512)); fd=ImageDraw.Draw(fract); rng=random.Random(2424)
for i in range(14):
    x=256+rng.randint(-25,25); y=256+rng.randint(-25,25); pts=[(x,y)]
    ang=rng.random()*math.tau
    for j in range(rng.randint(3,7)):
        ang+=rng.uniform(-.55,.55); ln=rng.randint(25,65); x+=math.cos(ang)*ln; y+=math.sin(ang)*ln; pts.append((x,y))
    fd.line(pts,fill=(255,110,150,230),width=2)
save(fract,PACK/'effects/fracture.png')

# Machine-readable atlas -------------------------------------------------------
atlas={
    'logicalCell':[640,640], 'boss':boss_manifest,
    'enemies':{'file':'enemies/defense-atlas.png','runtimeFile':'enemies/defense-atlas.webp','frames':enemy_frames},
    'hands':{'file':'hands/vorax-hands-atlas.png','runtimeFile':'hands/vorax-hands-atlas.webp','frames':hand_frames},
    'debris':debris_manifest,
    'environment':{
        'earth':'environment/earth.png','nebula':'environment/nebula-tile.webp','base':'environment/vorax-base.png',
        'corridor':'environment/corridor-tile.webp','core':'environment/core-chamber.webp'
    },
    'bossAnchors':[
        {'eyes':[[294,151],[350,151]],'head':[322,170],'hands':[[142,400],[502,400]],'chest':[322,285]},
        {'eyes':[[292,208],[352,208]],'head':[322,225],'hands':[[128,388],[516,388]],'chest':[322,285]},
        {'eyes':[[294,151],[350,151]],'head':[322,170],'hands':[[135,400],[509,400]],'chest':[322,285]}
    ]
}
(PACK/'atlas.json').write_text(json.dumps(atlas,indent=2))
# Visual QA contact sheet, not loaded by the game.
contact=Image.new('RGB',(4*320,9*350),(8,8,14)); cd=ImageDraw.Draw(contact)
for form,fid in enumerate(FORM_IDS):
    im=Image.open(PACK/f'boss/vorax-{fid}.png')
    for i in range(12):
        cell=im.crop(((i%4)*CELL,(i//4)*CELL,(i%4+1)*CELL,(i//4+1)*CELL)); cell.thumbnail((310,320))
        x=(i%4)*320; y=(form*3+i//4)*350
        contact.paste(cell,(x+(320-cell.width)//2,y+20),cell); cd.text((x+8,y+4),f'{fid} · {i}',fill='white')
contact.save(ROOT/'level24-v2/tests/vorax-atlas-contact.png')
print('Built Level 24 V2 assets:',PACK)
