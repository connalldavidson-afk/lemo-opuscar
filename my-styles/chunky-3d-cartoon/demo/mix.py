# Zombie Cruise Part 1: ambience, drone score, foley and voice, all driven by events.json (exported from the picture)
import json, os, sys, numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import synth_lib as S
from synth_lib import *
E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur'] + .2; SR = S.SR; N = int(SR * DUR)
def bus(): S.N = N; S.L = np.zeros(N); S.R = np.zeros(N)
def take(): return np.stack([S.L, S.R], 1)
R = np.random.default_rng(11)
def noise(n): return R.standard_normal(n)
def fade(x, a=.05, b=.05):
    n = len(x); e = np.ones(n); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.minimum(e[-ib:], np.linspace(1, 0, ib))
    return x * e
CUT = [0, 6.3, 10.8, 18.0, 25.2, 36.6, 44.6, 51.4]

# ---------------- ambience beds ----------------
bus()
def ocean(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    x = lp(noise(n), 500) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 5.5) ** 2) + hp(lp(noise(n), 3000), 900) * .15 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.3))
    return fade(x * g, .3, .3)
def hum(d, f=60, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade((np.sin(2 * np.pi * f * t) * .4 + np.sin(2 * np.pi * f * 2 * t) * .2 + lp(noise(n), 200) * .3) * g, .2, .2)
def wind(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return fade(bp(noise(n), 250, 1600) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 3.1 + 1)) * g, .4, .4)
def alarm(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    on = (np.sin(2 * np.pi * t * 1.6) > 0).astype(float)
    return fade((np.sign(np.sin(2 * np.pi * 880 * t)) * .3 + np.sin(2 * np.pi * 660 * t) * .5) * on * g, .05, .2)
def crowd(d, g=1.0):
    n = int(d * SR); x = np.zeros(n)
    for k in range(8):
        f0 = R.uniform(180, 320); t = np.arange(n) / SR
        f = f0 * (1 + .08 * np.sin(2 * np.pi * R.uniform(.3, .9) * t + k))
        x += np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * R.uniform(.4, 1.2) * t + k)) ** 3
    return fade(bp(x + noise(n) * .2, 300, 2500) * g * .25, .2, .3)
for e in E['ev']:
    if e['type'] != 'amb': continue
    t0, t1, nm = e['t'], e['t1'], e['name']; d = t1 - t0 + .15
    if nm in ('party', 'panic', 'alarm'): add(ocean(d, .25), t0, 1)
    if nm == 'party': add(crowd(d, .7), t0, 1)
    if nm == 'panic': add(crowd(d, 1.3), t0, 1)
    if nm == 'lobby': add(hum(d, 55, .5), t0, 1)
    if nm == 'stairs': add(hum(d, 40, .7), t0, 1); add(wind(d, .15), t0, 1)
    if nm == 'alarm': add(alarm(d, .12), t0, 1, pan=.4)
    if nm == 'bridge': add(wind(d, .35), t0, 1); add(ocean(d, .18), t0, 1)
    if nm == 'deck': add(wind(d, .5), t0, 1); add(ocean(d, .35), t0, 1)
amb = take()

# ---------------- music ----------------
bus()
def party(t0, t1):   # muffled deck-party groove (diegetic, low-passed)
    B = .5; ch = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    t = t0
    while t < t1:
        b = int((t - t0) / B); add(kick(.8), t, .6)
        if b % 2: add(clap(), t, .25)
        add(bass(ch[(b // 4) % 4][0] - 12, .2), t, .4); add(bass(ch[(b // 4) % 4][0], .15), t + B / 2, .25)
        if b % 4 == 0: add(pad(ch[(b // 4) % 4], 4 * B), t, .18)
        t += B
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
        bpm = lerp(bpm0, bpm1, (t - t0) / max(1e-6, t1 - t0)); t += 60 / bpm
def lerp(a, b, x): return a + (b - a) * x
party(0, CUT[1])
drone(CUT[1], CUT[5] + .3, 1.0)
heart(CUT[1] + .2, CUT[2], 96, 96, .7)
heart(CUT[3], CUT[4], 76, 92, .8)
heart(CUT[4] + .3, CUT[5], 84, 84, .5)
add(pad([50, 57, 62, 66], CUT[6] - CUT[5]), CUT[5], .14)                   # the breath on the bridge
drone(CUT[6], CUT[7], 1.1, 36); heart(CUT[6] + .3, CUT[7], 70, 128, .9)    # rising to the cliffhanger, cut dead
music = take()
music[int(CUT[7] * SR):] = 0

# ---------------- foley ----------------
bus()
def sting(low=0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    hit = np.tanh(np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.5) * 2) * .9
    scr = 0 if low else bp(noise(n), 2500, 7000) * np.exp(-t * 3) * .25 + np.sin(2 * np.pi * np.cumsum(1800 + 600 * t) / SR) * np.exp(-t * 3.5) * .12
    return hit + scr
def scream(p=1.0):
    d = .9; n = int(d * SR); t = np.arange(n) / SR; u = t / d
    f = 520 * p * (1 + .5 * np.sin(np.pi * np.clip(u * 1.4, 0, 1))) * (1 + .03 * np.sin(2 * np.pi * 7 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.zeros(n)
    for h in range(1, 10): fh = f * h; x += (np.exp(-((fh - 900 * p) / 400) ** 2) + .8 * np.exp(-((fh - 2600) / 600) ** 2) + .05) * np.sin(ph * h) / h ** .5
    x += bp(noise(n), 1500, 5000) * .2
    return fade(x * np.sin(np.pi * u) ** .5 * .5, .02, .15)
def groan(p=1.0):
    d = 1.3; n = int(d * SR); t = np.arange(n) / SR; u = t / d
    f = 85 * p * (1 + .15 * np.sin(np.pi * u)) * (1 + .04 * np.sin(2 * np.pi * 5.5 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.zeros(n)
    for h in range(1, 24): fh = f * h; x += (np.exp(-((fh - 450) / 160) ** 2) + .6 * np.exp(-((fh - 1100) / 250) ** 2) + .03) * np.sin(ph * h)
    x += lp(noise(n), 900) * .3
    return fade(np.tanh(x * .25) * np.sin(np.pi * u) ** .7, .05, .2)
def ding():
    return bell(84, 1.2) * .5 + bell(79, 1.2) * .0
def doors():
    n = int(.8 * SR); t = np.arange(n) / SR
    return fade(bp(noise(n), 400, 2500) * np.sin(np.pi * t / .8) * .5 + np.sin(2 * np.pi * 120 * t) * np.exp(-t * 3) * .2, .02, .1)
def step():
    n = int(.12 * SR); t = np.arange(n) / SR
    return lp(noise(n), 1200) * np.exp(-t * 40) * .6 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30) * .4
def rustle():
    n = int(.45 * SR); t = np.arange(n) / SR
    return bp(noise(n), 1500, 6000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * t))) * np.sin(np.pi * t / .45) * .5
def purr():
    n = int(1.4 * SR); t = np.arange(n) / SR
    return fade(lp(noise(n), 300) * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) * .6, .1, .3)
def creak(p=1.0):
    n = int(.9 * SR); t = np.arange(n) / SR
    f = (70 + 40 * np.sin(2 * np.pi * 1.3 * t)) * p
    s = ((np.cumsum(f) / SR) % 1) * 2 - 1
    return fade(bp(s, 300, 2200) * np.sin(np.pi * t / .9) * .5, .05, .1)
def gull():
    out = np.zeros(int(1.2 * SR))
    for k, o in enumerate((0, .35, .6)):
        n = int(.3 * SR); t = np.arange(n) / SR; f = 1800 - 900 * t / .3
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .3) * .2; i = int(o * SR); out[i:i + n] += s
    return out
def thump(g=1.0):
    n = int(.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(55 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 9) + lp(noise(n), 400) * np.exp(-t * 25) * .5) * g
def hiss():
    n = int(.7 * SR); t = np.arange(n) / SR
    return fade(hp(noise(n), 3000) * np.sin(np.pi * t / .7) * .35, .03, .1)
def tick():
    n = int(.05 * SR); t = np.arange(n) / SR
    return bp(noise(n), 2000, 8000) * np.exp(-t * 120) * .5 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 80) * .25
def bell_alarm():
    out = np.zeros(int(1.5 * SR))
    for k in range(6): b = bell(88, .4) * .3; i = int(k * .12 * SR); out[i:i + len(b)] += b[:len(out) - i]
    return out
for e in E['ev']:
    t, ty, g, p = e['t'], e['type'], e.get('g', 1.0), e.get('p', 1.0)
    pan = float(np.sin(t * 3.7)) * .4
    if ty == 'sting': add(sting(e.get('low', 0)), t, .6 * g)
    elif ty == 'scream': add(scream(p), t, .45, pan=pan)
    elif ty == 'groan': add(groan(p), t, .55 * g, pan=-pan)
    elif ty == 'alarm': add(bell_alarm(), t, .4)
    elif ty == 'ding': add(ding(), t, .5)
    elif ty == 'doors': add(doors(), t, .6)
    elif ty == 'step': add(step(), t, .35)
    elif ty == 'bottle': add(clink(2200), t, .5); add(clink(3100), t + .05, .3)
    elif ty == 'rustle': add(rustle(), t, .5)
    elif ty == 'meow': add(meow(.55, 700, .8), t, .7)
    elif ty == 'purr': add(purr(), t, .5)
    elif ty == 'thump': add(thump(g), t, .7)
    elif ty == 'creak': add(creak(p), t, .4)
    elif ty == 'gull': add(gull(), t, .5, pan=-.5)
    elif ty == 'hiss': add(hiss(), t, .5)
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
music = norm(music, -11); amb = norm(amb, -16); fx = norm(fx, -6)
de = np.convolve(np.abs(V), np.ones(int(.1 * SR)) / int(.1 * SR), 'same')
duck = 1 - .4 * np.clip(de / (de.max() * .3), 0, 1)
mix = (music + amb) * duck[:, None] + fx + V[:, None]
mix[int((CUT[7] + 2.4) * SR):] *= np.linspace(1, 0, N - int((CUT[7] + 2.4) * SR))[:, None]
mix /= np.max(np.abs(mix)) / 1.3; mix = np.tanh(mix) * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_16')
m = mix.mean(1); lo = np.sqrt(np.mean(lp(m, 120, 4) ** 2)); rest = np.sqrt(np.mean(hp(m, 120, 4) ** 2))
print('mix written', round(len(m) / SR, 2), 's; low vs rest dB', round(20 * np.log10(lo / rest), 1))
