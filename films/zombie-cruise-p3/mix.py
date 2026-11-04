# Zombie Cruise Part 3: ambience, score, foley and voice, all driven by events.json (exported from the picture)
import json, os, sys, numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import synth_lib as S
from synth_lib import *
E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur'] + .2; SR = S.SR; N = int(SR * DUR)
def bus(): S.N = N; S.L = np.zeros(N); S.R = np.zeros(N)
def take(): return np.stack([S.L, S.R], 1)
R = np.random.default_rng(13)
def noise(n): return R.standard_normal(n)
def fade(x, a=.05, b=.05):
    n = len(x); e = np.ones(n); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.minimum(e[-ib:], np.linspace(1, 0, ib))
    return x * e
def lerp(a, b, x): return a + (b - a) * x
CUT = [0, 8.6, 17.4, 28.4, 37.0, 46.4, 51.8]
T = {e['type']: e['t'] for e in E['ev']}
ENG = [e for e in E['ev'] if e['type'] == 'engine'][0]['t']

# ---------------- ambience beds ----------------
bus()
def rain(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    x = hp(noise(n), 1200) * .5 + bp(noise(n), 300, 1500) * .3
    drops = (R.random(n) > .9993) * 1.0; x += lp(drops, 4000) * 3
    return fade(x * (0.8 + 0.2 * np.sin(2 * np.pi * t / 2.7)) * g, .3, .3)
def wind(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade(bp(noise(n), 200, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 3.1 + 1)) * g, .4, .4)
def hum(d, f=60, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade((np.sin(2 * np.pi * f * t) * .4 + np.sin(2 * np.pi * f * 2 * t) * .2 + lp(noise(n), 200) * .3) * g, .2, .2)
def room(d, g=1.0):
    n = int(d * SR); return fade(lp(noise(n), 160) * g, .3, .3)
for e in E['ev']:
    if e['type'] != 'amb': continue
    t0, t1, nm = e['t'], e['t1'], e['name']; d = t1 - t0 + .15
    if nm == 'storm': add(rain(d, .5), t0, 1); add(wind(d, .5), t0, 1); add(hum(d, 50, .12), t0, 1)
    if nm == 'corr': add(hum(d, 60, .35), t0, 1); add(room(d, .5), t0, 1)
    if nm == 'metal': add(hum(d, 45, .2), t0, 1); add(room(d, .6), t0, 1)
    if nm == 'dark': add(room(d, .7), t0, 1); add(hum(d, 40, .1), t0, 1)
    if nm == 'eng': add(room(d, .6), t0, 1); add(hum(d, 50, .15), t0, 1)
    if nm == 'atrium': add(room(d, .5), t0, 1)
amb = take()

# ---------------- music ----------------
bus()
def drone(t0, t1, g=1.0, root=38):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m, a in ((root, 1), (root + 7, .5), (root + 12, .35), (root + 13, .12)):
        for det in (-.2, .2): x += a * (((mtof(m) * (1 + det / 100) * t) % 1) * 2 - 1)
    x = lp(x, 700) * (0.8 + 0.2 * np.sin(2 * np.pi * t * .23))
    add(fade(x * g * .12, .6, .4), t0, 1)
def heart(t0, t1, bpm0=72, bpm1=72, g=1.0):
    t = t0
    while t < t1:
        add(kick(.7), t, .55 * g); add(kick(.5), t + .16, .3 * g)
        t += 60 / lerp(bpm0, bpm1, (t - t0) / max(1e-6, t1 - t0))
def sneak(t0, t1, g=1.0, B=.32, seq=(50, 53, 57, 53, 52, 55, 58, 55)):
    t = t0; k = 0
    while t < t1:
        add(pizz(seq[k % 8], .16), t, .35 * g)
        if k % 4 == 0: add(bass(seq[k % 8] - 12, .25), t, .3 * g)
        t += B; k += 1
drone(0, CUT[1] + .3, 1.0, 36); heart(.3, CUT[1], 66, 76, .5)
sneak(CUT[1] + .1, CUT[2] - .1, 1.0)
sneak(CUT[2] + .1, T['whoosh'] - .05, .9, .3)
sneak(T['exhale'] + 1.5, CUT[3] - .1, .7, .6, (62, 65, 62, 66, 62, 65, 69, 65))   # comic tiptoe
drone(CUT[3], CUT[4] + .2, 1.0, 34); heart(CUT[3] + .5, CUT[4], 70, 96, .55)
drone(CUT[4], ENG, .8, 38)
add(pad([50, 57, 62, 66, 69], CUT[5] - ENG - .2), ENG + .5, .14)
drone(CUT[5] - .1, CUT[6], 1.2, 33); heart(CUT[5] + .2, CUT[6], 84, 138, .9)
music = take()
music[int(T['whoosh'] * SR):int((T['exhale'] + 1.4) * SR)] *= .0
music[int(CUT[6] * SR):] = 0

# ---------------- foley ----------------
bus()
def sting(low=0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    hit = np.tanh(np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.5) * 2) * .9
    scr = 0 if low else bp(noise(n), 2500, 7000) * np.exp(-t * 3) * .25 + np.sin(2 * np.pi * np.cumsum(1800 + 600 * t) / SR) * np.exp(-t * 3.5) * .12
    return hit + scr
def groan(p=1.0):
    d = 1.3; n = int(d * SR); t = np.arange(n) / SR; u = t / d
    f = 85 * p * (1 + .15 * np.sin(np.pi * u)) * (1 + .04 * np.sin(2 * np.pi * 5.5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.zeros(n)
    for h in range(1, 24): fh = f * h; x += (np.exp(-((fh - 450) / 160) ** 2) + .6 * np.exp(-((fh - 1100) / 250) ** 2) + .03) * np.sin(ph * h)
    x += lp(noise(n), 900) * .3
    return fade(np.tanh(x * .25) * np.sin(np.pi * u) ** .7, .05, .2)
def thunder(g=1.0):
    d = 3.0; n = int(d * SR); t = np.arange(n) / SR
    x = lp(noise(n), 160) * 2.2 * np.exp(-t * 1.1) + bp(noise(n), 200, 1600) * np.exp(-t * 6) * (R.random(n) > .5) * 1.2
    x = x * (1 + .6 * np.sin(2 * np.pi * 1.7 * t) * np.exp(-t))
    return fade(np.tanh(x) * g, .005, .4)
def step():
    n = int(.12 * SR); t = np.arange(n) / SR
    return lp(noise(n), 1200) * np.exp(-t * 40) * .6 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30) * .4
def clang(g=1.0):
    n = int(.9 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, a in ((520, 1), (1310, .6), (2290, .4), (3170, .25)): x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * (5 + f / 800))
    return (x * .4 + lp(noise(n), 2000) * np.exp(-t * 60) * .5) * g
def catch_():
    n = int(.2 * SR); t = np.arange(n) / SR
    return lp(noise(n), 900) * np.exp(-t * 50) * .8 + np.sin(2 * np.pi * 140 * t) * np.exp(-t * 40) * .4
def exhale():
    n = int(.9 * SR); t = np.arange(n) / SR
    return fade(bp(noise(n), 300, 2500) * np.sin(np.pi * t / .9) ** 1.5 * .35, .05, .2)
def click():
    n = int(.06 * SR); t = np.arange(n) / SR
    return bp(noise(n), 1500, 6000) * np.exp(-t * 200) * .8 + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 150) * .4
def drip():
    n = int(.25 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(1100 + 900 * np.exp(-t * 30)) / SR) * np.exp(-t * 25) * .5
def switch():
    return click() * 1.2
def clunk():
    n = int(.7 * SR); t = np.arange(n) / SR
    return np.tanh((np.sin(2 * np.pi * np.cumsum(70 + 50 * np.exp(-t * 15)) / SR) * np.exp(-t * 6) + bp(noise(n), 300, 2500) * np.exp(-t * 20) * .8) * 1.5) * .8
def engine(d):
    n = int(d * SR); t = np.arange(n) / SR
    spin = np.clip(t / 1.4, 0, 1) ** .7; f = 18 + 30 * spin
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.tanh((np.sin(ph) + .6 * np.sin(2 * ph) + .3 * np.sin(3 * ph)) * 1.5) * .7
    x += (lp(noise(n), 300) * (1 - spin) + lp(noise(n), 700) * spin) * .5 * (0.6 + 0.4 * np.sin(ph * .5) ** 2)
    x += bp(noise(n), 900, 3000) * .12 * spin * (np.sin(ph * 2) > .6)
    start = np.exp(-t * 4) * np.sin(2 * np.pi * np.cumsum(60 + 40 * np.sin(2 * np.pi * 9 * t)) / SR) * .6 * (t < 1.2)
    return fade(x * np.clip(t / .3, 0, 1) + start, .02, .05)
def lampon():
    n = int(.5 * SR); t = np.arange(n) / SR
    return np.tanh(lp(noise(n), 600) * np.exp(-t * 18) * 3) * .6 + bp(noise(n), 3000, 8000) * np.exp(-t * 10) * .15
def tick():
    n = int(.05 * SR); t = np.arange(n) / SR
    return bp(noise(n), 2000, 8000) * np.exp(-t * 120) * .5 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 80) * .25
for e in E['ev']:
    t, ty, g, p = e['t'], e['type'], e.get('g', 1.0), e.get('p', 1.0)
    pan = float(np.sin(t * 3.7)) * .4
    if ty == 'sting': add(sting(e.get('low', 0)), t, .6 * g)
    elif ty == 'thunder': add(thunder(g), t, .8)
    elif ty == 'step': add(step(), t, .5 * g, pan=pan)
    elif ty == 'groan': add(groan(p), t, .55 * g, pan=pan)
    elif ty == 'clang': add(clang(g), t, .6, pan=pan * .5)
    elif ty == 'whoosh': add(whoosh(1.2, False), t, .45)
    elif ty == 'catch': add(catch_(), t, .8)
    elif ty == 'exhale': add(exhale(), t, .5)
    elif ty == 'click': add(click(), t, .6)
    elif ty == 'drip': add(drip(), t, .3, pan=pan)
    elif ty == 'meow': add(meow(.5, 760 * p, .8), t, .6)
    elif ty == 'switch': add(switch(), t, .7)
    elif ty == 'clunk': add(clunk(), t, .9)
    elif ty == 'engine':
        d = e['t1'] - t + .1; x = engine(d)
        k = np.ones(len(x)); i5 = int((CUT[5] - t) * SR); k[i5:] = .45   # muffled through the decks in the atrium
        add(x * k, t, 1.0)
    elif ty == 'lampon': add(lampon(), t, .7)
    elif ty == 'tick': add(tick(), t, .6)
    elif ty == 'endhit': add(sting(1), t, .8)
fx = take()

# ---------------- voice ----------------
V = np.zeros(N)
for e in E['ev']:
    if e['type'] != 'voice': continue
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); i = int(e['t'] * SR); V[i:i + len(x)] += x[:N - i]
win = int(.01 * SR)
envv = np.sqrt(np.convolve(V ** 2, np.ones(win) / win, 'same')) + 1e-6
gain = np.convolve(np.where(envv > .07, (.07 / envv) ** .55, 1.0), np.ones(win) / win, 'same')
V = V * gain; V = V + .2 * hp(V, 2500)
vr = np.sqrt(np.mean(V[np.abs(V) > .01] ** 2))
def norm(x, db):
    r = np.sqrt(np.mean(x ** 2)) + 1e-9; return x * (vr / r) * 10 ** (db / 20)
music = norm(music, -11); amb = norm(amb, -17); fx = norm(fx, -7)
de = np.convolve(np.abs(V), np.ones(int(.1 * SR)) / int(.1 * SR), 'same')
duck = 1 - .4 * np.clip(de / (de.max() * .3), 0, 1)
fxd = fx * (1 - .25 * np.clip(de / (de.max() * .3), 0, 1))[:, None]
mix = (music + amb) * duck[:, None] + fxd + V[:, None]
mix[int(CUT[6] * SR):int((CUT[6] + .25) * SR)] *= 0
mix[int((CUT[6] + 2.0) * SR):] *= np.linspace(1, 0, N - int((CUT[6] + 2.0) * SR))[:, None]
mix /= np.max(np.abs(mix)) / 1.3; mix = np.tanh(mix) * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_16')
m = mix.mean(1)
for a, b in zip(CUT, CUT[1:] + [DUR]):
    seg_ = m[int(a * SR):int(b * SR)]; print(f'{a:5.1f}-{b:5.1f} rms dB', round(20 * np.log10(np.sqrt(np.mean(seg_ ** 2)) + 1e-9), 1))
