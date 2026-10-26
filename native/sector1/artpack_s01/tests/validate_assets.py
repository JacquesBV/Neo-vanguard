from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'assets/manifest.json').read_text())
count=0
def check(condition,message):
    global count
    count+=1
    assert condition,message
palette={tuple(bytes.fromhex(c[1:])) for c in m['palette']}
for path,info in m['files'].items():
    p=root/path;im=Image.open(p).convert('RGBA')
    check(hashlib.sha256(p.read_bytes()).hexdigest()==info['sha256'],'hash '+path)
    check(list(im.size)==info['size'],'size '+path)
    if not path.startswith('art_sources/'):
        colors={p[:3] for p in im.getdata() if p[3]}
        check(colors<=palette,'4-tone palette '+path)
        check({p[3] for p in im.getdata()}<={0,255},'binary alpha '+path)
modules=[]
for module in m['environment']:
    im=Image.open(root/module['background']).convert('RGBA');modules.append(im)
    rebuilt=Image.new('RGBA',im.size)
    for path in module['layers']:rebuilt.alpha_composite(Image.open(root/path).convert('RGBA'))
    check(rebuilt.tobytes()==im.tobytes(),'layer reconstruction '+module['name'])
for a in modules:
    for b in modules:check(a.crop((0,159,160,160)).tobytes()==b.crop((0,0,160,1)).tobytes(),'north/south join')
rig=m['rig'];rest=Image.new('RGBA',(96,128))
for part in rig['parts'].values():rest.alpha_composite(Image.open(root/part['texture']).convert('RGBA'))
check(rest.tobytes()==Image.open(root/'assets/boss/guardian_neutral.png').convert('RGBA').tobytes(),'pixel exact neutral rig')
for key,anim in m['animations'].items():
    im=Image.open(root/anim['sheet']);w,h=anim['frame_size']
    check(im.width%w==0 and im.height%h==0,'frame grid '+key)
    check((im.width//w)*(im.height//h)>=anim['frames'],'frame slots '+key)
neutral=Image.open(root/'assets/boss/guardian_neutral.png').convert('RGBA')
dark=tuple(bytes.fromhex(m['palette'][3][1:]))
for y in range(1,neutral.height-1):
    for x in range(1,neutral.width-1):
        pixel=neutral.getpixel((x,y))
        if pixel[3] and any(not neutral.getpixel((x+dx,y+dy))[3] for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]):
            check(pixel[:3]==dark,'positive LCD dark silhouette')
for f in (root/'assets/boss/frames').glob('*.png'):
    im=Image.open(f);b=im.getbbox()
    check(b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height,'unclipped rig frame '+f.name)
report={'checks':count,'failures':0,'pngs_in_manifest':len(m['files']),'animation_sets':len(m['animations']),'background_modules':len(modules),'north_south_pairs':len(modules)**2,'source_rest_reconstruction_exact':True}
(root/'docs/asset_validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
