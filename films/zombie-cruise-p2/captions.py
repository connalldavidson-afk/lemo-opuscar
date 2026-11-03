# Caption word groups (2-3 words) timed from each voice line's audio: speech chunks are found from pauses,
# matched to the line's punctuation phrases, and words inside a chunk are spread by syllable count.
import json, re, sys, os, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
lines = {l['id']: l['text'] for l in json.load(open(os.path.join(HERE, 'lines.json')))}
starts = json.load(open(os.path.join(HERE, 'vo_starts.json')))
def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower()) or 'a'
    n = len(re.findall(r'[aeiouy]+', w)); n -= w.endswith('e') and n > 1 and not w.endswith('le')
    return max(1, n)
def chunks(id):
    x, sr = sf.read(os.path.join(HERE, 'voices', id + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    h = int(sr * 0.01); e = np.array([np.sqrt(np.mean(x[i:i + h] ** 2)) for i in range(0, len(x) - h, h)])
    on = e > e.max() * 0.05; segs = []; st = None; sil = 0
    for i, v in enumerate(on):
        if v:
            if st is None: st = i
            sil = 0
        elif st is not None:
            sil += 1
            if sil >= 14: segs.append([st / 100, (i - sil + 1) / 100]); st = None; sil = 0
    if st is not None: segs.append([st / 100, len(on) / 100])
    return segs
out = []
for id, t0 in starts.items():
    text = lines[id]
    phrases = [p.strip() for p in re.split(r'(?<=[.,?!])\s+', text) if p.strip()]
    segs = chunks(id)
    # merge or split to match phrase count
    while len(segs) > len(phrases):  # merge the smallest gap
        g = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]; i = int(np.argmin(g))
        segs[i] = [segs[i][0], segs[i + 1][1]]; del segs[i + 1]
    if len(segs) < len(phrases):    # fall back: one span, split by syllables
        span = [segs[0][0], segs[-1][1]]; tot = sum(syl(w) for p in phrases for w in p.split()); segs = []; c = span[0]
        for p in phrases:
            d = (span[1] - span[0]) * sum(syl(w) for w in p.split()) / tot; segs.append([c, c + d]); c += d
    words = []
    for p, (a, b) in zip(phrases, segs):
        ws = p.split(); S = sum(syl(w) for w in ws); c = a
        for w in ws:
            d = (b - a) * syl(w) / S; words.append((w, t0 + c, t0 + c + d)); c += d
    # group 2-3 words, never across a phrase end; avoid single-word groups when possible
    groups = []; cur = []
    for k, (w, a, b) in enumerate(words):
        cur.append((w, a, b))
        end_phrase = bool(re.search(r'[.,?!]$', w))
        nxt_left = len(words) - k - 1
        if end_phrase or len(cur) == 3 or (len(cur) == 2 and nxt_left >= 2 and not re.search(r'[.,?!]$', words[k + 1][0]) and not (k + 2 < len(words) and re.search(r'[.,?!]$', words[k + 2][0]) and len(cur) == 2 and False)):
            groups.append(cur); cur = []
    if cur: groups.append(cur)
    # fold a lone word into its neighbour when the phrase allows
    fixed = []
    for g in groups:
        if len(g) == 1 and fixed and len(fixed[-1]) < 3 and not re.search(r'[.?!]$', fixed[-1][-1][0]): fixed[-1] += g
        else: fixed.append(g)
    for g in fixed:
        out.append({'line': id, 't0': round(g[0][1] - 0.04, 3), 't1': round(g[-1][2], 3), 'text': ' '.join(w for w, _, _ in g)})
# each group holds until the next one (or 0.35 s after its last word when a gap follows)
for i, c in enumerate(out):
    nxt = out[i + 1]['t0'] if i + 1 < len(out) else c['t1'] + 0.6
    c['t1'] = round(min(nxt, c['t1'] + 0.45) if nxt - c['t1'] > 0.45 else nxt, 3)
json.dump(out, open(os.path.join(HERE, 'caps.json'), 'w'), indent=1)
for c in out: print(f"{c['t0']:6.2f}-{c['t1']:6.2f}  {c['text']}")
