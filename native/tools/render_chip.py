"""Development bake of sector-one source chiptune events into PCM, no runtime JS."""
from pathlib import Path
import json, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
DATA=json.loads((ROOT/'native/sector1/sector.json').read_text())
OUT=ROOT/'native/sector1/audio'; OUT.mkdir(exist_ok=True)
SR=22050
# Source module 24: 15/7-bit noise sequences.
def noise(bits):
    r=0x7fff; a=[]
    for _ in range(127*64 if bits==7 else 32767):
        b=(r^(r>>1))&1;r=(r>>1)|(b<<14)
        if bits==7:r=(r&~0x40)|(b<<6)
        a.append(.9 if r&1 else -.9)
    return np.array(a)
N15,N7=noise(15),noise(7)
def render(events,duration):
    mix=np.zeros(round(duration*SR),dtype=np.float64)
    for e in events:
        dur=e.get('dur',.1); n=round(dur*SR);t=np.arange(n)/SR;u=t/max(dur,1/SR)
        f=e.get('f',440)
        if e['type']=='noise':
            table=N7 if e.get('metal') or f>5000 else N15
            r0=np.clip(f/1800,.03,6);r1=np.clip(e.get('f2',f)/1800,.03,6)
            rate=r0*(r1/r0)**(np.floor(u*max(2,round(dur*64)))/max(2,round(dur*64)))
            vals=table[(np.cumsum(rate).astype(int))%len(table)];vol=e.get('vol',.25)*.8
        else:
            steps=max(2,round(dur*128));freq=f*(max(20,e.get('f2',f))/f)**(np.floor(u*steps)/steps)
            if e.get('vibrato'):
                vib=np.maximum(0,t-min(.12,dur*.4));freq+=np.where(vib>0,4*np.abs((vib*5.6)%1-.5)-1,0)*f*e['vibrato']
            phase=np.cumsum(freq)/SR
            if e['type'] in ['triangle','sine']:
                tbl=np.r_[np.arange(16),np.arange(15,-1,-1)]/7.5-1
                # Source Fourier 16-harmonic 4-bit waveform.
                vals=np.zeros(n)
                for k in range(1,17):
                    ph=2*np.pi*k*np.arange(32)/32
                    re=(tbl*np.cos(ph)).sum()/16;im=(tbl*np.sin(ph)).sum()/16
                    vals+=re*np.cos(2*np.pi*k*phase)+im*np.sin(2*np.pi*k*phase)
                vol=e.get('vol',.2)*1.25
            else:
                duty=e.get('duty',25)/100
                vals=np.zeros(n)
                for k in range(1,min(64,int(SR/2/max(f,e.get('f2',f)))+1)):
                    vals+=2/(k*np.pi)*np.sin(k*np.pi*duty)*np.cos(2*np.pi*k*phase)
                vol=e.get('vol',.2)
        steps=max(2,round(dur*64));env_u=np.minimum(1,np.floor(u*steps)/steps)
        env=np.round(np.clip(vol*(1-env_u)**1.6/.32,0,1)*15)/15*.32
        start=round(e['t']*SR)
        # Source voices may overlap the loop boundary; wrap tails into the beginning.
        indices=(start+np.arange(n))%len(mix)
        np.add.at(mix,indices,vals*env)
    # Source console-speaker pass: 220 Hz highpass, 4300 Hz lowpass, 1900 Hz presence.
    from scipy.signal import butter,sosfilt
    mix=sosfilt(butter(1,220,fs=SR,btype='high',output='sos'),mix)
    mix=sosfilt(butter(2,4300,fs=SR,btype='low',output='sos'),mix)
    return np.clip(mix*1.6,-.98,.98)
def write(name,events,duration):
    data=(render(events,duration)*32767).astype('<i2')
    with wave.open(str(OUT/(name+'.wav')),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes(data.tobytes())
for name,song in DATA['music'].items():write(name,song['events'],song['duration'])
SFX={
'shoot':(.09,[dict(t=0,f=1600,f2=420,dur=.07,duty=25,vol=.09,type='square')]),
'explode':(.35,[dict(t=0,f=1500,f2=240,dur=.28,vol=.22,type='noise')]),
'enemy':(.08,[dict(t=0,f=520,f2=300,dur=.05,duty=12,vol=.07,type='square')]),
'coin':(.30,[dict(t=0,f=988,dur=.06,duty=50,vol=.16,type='square'),dict(t=.06,f=1319,dur=.22,duty=50,vol=.16,type='square')]),
'alert':(.6,[dict(t=i*.11,f=f,dur=.13,duty=25,vol=.09,type='square') for i,f in enumerate([220,165,110,82])]),
'hurt':(.3,[dict(t=0,f=180,f2=70,dur=.25,vol=.18,type='square')]),
'bomb':(.8,[dict(t=0,f=900,f2=90,dur=.7,vol=.34,type='noise')])}
for name,(duration,events) in SFX.items():write(name,events,duration)
print('Rendered',len(DATA['music'])+len(SFX),'PCM clips from source chiptune events')
