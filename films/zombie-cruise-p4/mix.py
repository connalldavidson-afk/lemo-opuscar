# Zombie Cruise Part 4: ambience, score, foley and voice, all driven by events.json (exported from the picture)
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
CUT = [0, 5.4, 8.8, 18.6, 27.4, 38.0, 44.6, 52.4]
T = {}
for e in E['ev']: T.setdefault(e['type'], e['t'])


# ---------------- ambience beds ----------------
bus()
def rain(d, g=1.0): return 0
def wind(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade(bp(noise(n), 200, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 3.1 + 1)) * g, .4, .4)
def hum(d, f=60, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade((np.sin(2 * np.pi * f * t) * .4 + np.sin(2 * np.pi * f * 2 * t) * .2 + lp(noise(n), 200) * .3) * g, .2, .2)
def room(d, g=1.0):
    n = int(d * SR); return fade(lp(noise(n), 160) * g, .3, .3)
def rumble(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade(lp(noise(n), 110) * 2 * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * t)) * g, .3, .3)
def wash(d, g=1.0, per=4.2):
    n = int(d * SR); t = np.arange(n) / SR
    m = (0.5 + 0.5 * np.sin(2 * np.pi * t / per)) ** 2
    return fade((bp(noise(n), 250, 2500) * m + lp(noise(n), 300) * .5) * g, .4, .4)
def lap(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    m = np.clip(np.sin(2 * np.pi * t / 1.9) + .2 * np.sin(2 * np.pi * t / .7), 0, None) ** 3
    return fade(bp(noise(n), 400, 1800) * m * g, .5, .5)
for e in E['ev']:
    if e['type'] != 'amb': continue
    t0, t1, nm = e['t'], e['t1'], e['name']; d = t1 - t0 + .15
    if nm == 'bridge': add(rumble(d, .5), t0, 1); add(hum(d, 50, .15), t0, 1); add(wind(d, .2), t0, 1)
    if nm == 'deck': add(wind(d, .55), t0, 1); add(wash(d, .35), t0, 1); add(rumble(d, .3), t0, 1)
    if nm == 'corr': add(hum(d, 60, .35), t0, 1); add(room(d, .5), t0, 1); add(rumble(d, .25), t0, 1)
    if nm == 'sea': add(wash(d, .45, 5), t0, 1); add(wind(d, .3), t0, 1); add(rumble(d, .2), t0, 1)
    if nm == 'hull': add(wash(d, .6, 3.5), t0, 1); add(wind(d, .3), t0, 1)
    if nm == 'harbour': add(lap(d, .5), t0, 1); add(room(d, .25), t0, 1)
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
def seq(t0, t1, B, notes, g=1.0, bassk=4, inst=pizz):
    t = t0; k = 0
    while t < t1:
        add(inst(notes[k % len(notes)], .16) if inst is pizz else inst(notes[k % len(notes)]), t, .35 * g)
        if bassk and k % bassk == 0: add(bass(notes[k % len(notes)] - 12, .25), t, .3 * g)
        t += B; k += 1
def eerie(t0, t1, g=1.0):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * mtof(76) * t) * .5 + np.sin(2 * np.pi * mtof(77) * t) * .5 + np.sin(2 * np.pi * mtof(40) * t) * .6
    x *= (0.7 + 0.3 * np.sin(2 * np.pi * t * .5))
    add(fade(x * g * .1, 1.5, .05), t0, 1)
B = T['jet']
drone(0, CUT[2] + .2, 1.0, 36); heart(.4, CUT[2], 70, 92, .5)
seq(CUT[2] + .05, B - .1, .24, (50, 53, 57, 53, 52, 55, 58, 55), 1.0)
seq(B + .05, CUT[3] - .1, .3, (62, 66, 69, 66, 64, 67, 71, 67), .9, 2)          # comic, major
drone(CUT[3], T['doorclang'], 1.0, 34); heart(CUT[3] + .2, T['doorclang'], 96, 132, .7)
add(pad([50, 57, 62, 65, 69], CUT[4] - T['ding'] + .2), T['ding'], .1)
add(pad([50, 57, 62, 66, 69], CUT[5] - CUT[4] + .3), CUT[4] + .2, .16)
for k, m in enumerate((74, 78, 81, 86)): add(bell(m, 2.0), 35.6 + k * .12, .25)
add(pad([55, 62, 67, 71, 74], CUT[6] - CUT[5] + .4), CUT[5], .16)
seq(CUT[5] + .3, CUT[6] - .1, .3, (67, 71, 74, 79, 74, 71), .7, 4, pluck)
add(pad([50, 57, 62, 66], T['drop'] - CUT[6] + .1), CUT[6], .1)
eerie(T['drop'] + .3, CUT[7], .9)
music = take()
music[int(T['doorclang'] * SR):int(T['ding'] * SR)] *= .0
music[int(T['drop'] * SR):int((T['drop'] + .3) * SR)] *= np.linspace(1, 0, int(.3 * SR))[:, None]
music[int(CUT[7] * SR):] = 0

# ---------------- foley ----------------
bus()
def sting(low=0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    hit = np.tanh(np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.5) * 2) * .9
    scr = 0 if low else bp(noise(n), 2500, 7000) * np.exp(-t * 3) * .25
    return hit + scr
def groan(p=1.0):
    d = 1.3; n = int(d * SR); t = np.arange(n) / SR; u = t / d
    f = 85 * p * (1 + .15 * np.sin(np.pi * u)) * (1 + .04 * np.sin(2 * np.pi * 5.5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.zeros(n)
    for h in range(1, 24): fh = f * h; x += (np.exp(-((fh - 450) / 160) ** 2) + .6 * np.exp(-((fh - 1100) / 250) ** 2) + .03) * np.sin(ph * h)
    x += lp(noise(n), 900) * .3
    return fade(np.tanh(x * .25) * np.sin(np.pi * u) ** .7, .05, .2)
def step(dur=.12, f=1200):
    n = int(dur * SR); t = np.arange(n) / SR
    return lp(noise(n), f) * np.exp(-t * 40) * .6 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30) * .4
def clang(g=1.0, f0=520):
    n = int(1.2 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, a in ((f0, 1), (f0 * 2.52, .6), (f0 * 4.4, .4), (f0 * 6.1, .25)): x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * (4 + f / 800))
    return (x * .4 + lp(noise(n), 2000) * np.exp(-t * 60) * .5) * g
def click():
    n = int(.06 * SR); t = np.arange(n) / SR
    return bp(noise(n), 1500, 6000) * np.exp(-t * 200) * .8 + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 150) * .4
def clunk(f=70):
    n = int(.7 * SR); t = np.arange(n) / SR
    return np.tanh((np.sin(2 * np.pi * np.cumsum(f + 50 * np.exp(-t * 15)) / SR) * np.exp(-t * 6) + bp(noise(n), 300, 2500) * np.exp(-t * 20) * .8) * 1.5) * .8
def ratchet(d, rate=14):
    x = np.zeros(int(d * SR)); k = 0
    while k / rate < d - .05:
        c = click(); i = int(k / rate * SR); x[i:i + len(c)] += c[:len(x) - i] * (.5 + .2 * (k % 2)); k += 1
    return x
def jet(d):
    n = int(d * SR); t = np.arange(n) / SR
    x = bp(noise(n), 600, 6000) * .7 + lp(noise(n), 400) * .5
    x *= (0.85 + 0.15 * np.sin(2 * np.pi * 13 * t)) * np.clip(t / .08, 0, 1)
    return fade(x, .01, .3)
def valve():
    n = int(.4 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(900 + 700 * t / .4) / SR) * np.sin(np.pi * t / .4) * .25 + bp(noise(n), 2000, 6000) * .1
def thud(p=1.0):
    n = int(.4 * SR); t = np.arange(n) / SR
    return np.tanh((np.sin(2 * np.pi * np.cumsum(80 * p + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 12) + lp(noise(n), 800) * np.exp(-t * 30)) * 2) * .7
def hiss(d):
    n = int(d * SR); t = np.arange(n) / SR
    return fade(hp(noise(n), 2500) * .4 + lp(noise(n), 200) * np.sin(np.pi * t / d) * .5, .05, .1)
def bang():
    a = clang(.35, 180); a[:int(.7 * SR)] += clunk(55)[:int(.7 * SR)] * 1.1; return a
def splash():
    n = int(1.6 * SR); t = np.arange(n) / SR
    x = bp(noise(n), 300, 5000) * np.exp(-t * 3.5) * 1.2 + lp(noise(n), 200) * np.exp(-t * 6) * 1.2
    for k in range(10):
        i = int((.2 + R.random() * 1.0) * SR); d = plop(); x[i:i + len(d)] += d[:n - i] * .3
    return x
def gull(p=1.0):
    x = np.zeros(int(1.3 * SR))
    for k, (s, d) in enumerate(((0, .28), (.35, .22), (.62, .35))):
        n = int(d * SR); t = np.arange(n) / SR; f = (1700 - 600 * t / d) * p
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        i = int(s * SR); x[i:i + n] += y * np.sin(np.pi * t / d) ** .6 * .3
    return bp(x, 800, 6000)
def drop():
    n = int(2.5 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(38 + 30 * np.exp(-t * 3)) / SR) * np.exp(-t * 1.4) * .9
def creak():
    n = int(.9 * SR); t = np.arange(n) / SR
    f = 140 + 60 * np.sin(np.pi * t / .9); x = (((np.cumsum(f) / SR) % 1) * 2 - 1) * (R.random(n) > .3)
    return bp(x, 400, 2500) * np.sin(np.pi * t / .9) * .4
def tick():
    n = int(.05 * SR); t = np.arange(n) / SR
    return bp(noise(n), 2000, 8000) * np.exp(-t * 120) * .5 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 80) * .25
for e in E['ev']:
    t, ty, g, p = e['t'], e['type'], e.get('g', 1.0), e.get('p', 1.0)
    pan = float(np.sin(t * 3.7)) * .4
    if ty == 'groan': add(groan(p), t, .55 * g, pan=pan)
    elif ty == 'shuffle': add(step(.18, 600), t, .4 * g, pan=pan); add(step(.18, 600), t + .21, .3 * g, pan=-pan)
    elif ty == 'cabinet': add(clunk(120), t, .5); add(click(), t + .05, .6)
    elif ty == 'reel': add(ratchet(e['t1'] - t, 18), t, .35)
    elif ty == 'grab': add(step(.1, 900), t, .5)
    elif ty == 'valve': add(valve(), t, .7)
    elif ty == 'jet':
        x = jet(e['t1'] - t + .05); add(x, t, .5)
    elif ty == 'thud': add(thud(p), t, .7 * g, pan=pan); add(boing(160 * p, 90 * p, .3), t + .02, .18)
    elif ty == 'meow': add(meow(.5, 760 * p, .8), t, .55)
    elif ty == 'button': add(click(), t, .9); add(clunk(140), t + .03, .4)
    elif ty == 'hiss': add(hiss(e['t1'] - t), t, .6)
    elif ty == 'doorclang': add(clang(1.0, 140), t, .8); add(clunk(50), t, .9)
    elif ty == 'run': add(step(.1, 1000), t, .45 * g, pan=pan)
    elif ty == 'bang': add(bang(), t, .9)
    elif ty == 'ding': add(bell(84, 1.2), t, .35)
    elif ty == 'exhale':
        n = int(.9 * SR); tt = np.arange(n) / SR; add(fade(bp(noise(n), 300, 2500) * np.sin(np.pi * tt / .9) ** 1.5 * .35, .05, .2), t, .5)
    elif ty == 'gull': add(gull(p), t, .5, pan=pan)
    elif ty == 'focus': add(click(), t, .4); add(click(), t + .08, .3)
    elif ty == 'winch': add(ratchet(e['t1'] - t, 9), t, .3); add(creak(), t + 1.0, .5); add(creak(), t + 2.8, .4)
    elif ty == 'splash': add(splash(), t, .9)
    elif ty == 'drop': add(drop(), t, .8)
    elif ty == 'creak': add(creak(), t, .5)
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
mix[int(CUT[7] * SR):int((CUT[7] + .25) * SR)] *= 0
mix[int((CUT[7] + 2.0) * SR):] *= np.linspace(1, 0, N - int((CUT[7] + 2.0) * SR))[:, None]
mix /= np.max(np.abs(mix)) / 1.3; mix = np.tanh(mix) * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_16')
m = mix.mean(1)
for a, b in zip(CUT, CUT[1:] + [DUR]):
    seg_ = m[int(a * SR):int(b * SR)]; print(f'{a:5.1f}-{b:5.1f} rms dB', round(20 * np.log10(np.sqrt(np.mean(seg_ ** 2)) + 1e-9), 1))
