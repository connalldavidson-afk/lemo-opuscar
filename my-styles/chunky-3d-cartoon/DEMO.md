# Chunky 3D Cartoon — demo: Zombie Apocalypse on a Cruise Ship · Part 1

One example among many. Don't reuse its story, arc, shots, props or timings.

**What it is:** 54 s, 1080×1920, 24 fps, English voice (Kokoro `am_michael`). A second-person survival short: three rules on a cruise ship at night, a morning on the bridge, a lifeboat cliffhanger, hard cut to "PART 2 →". Film: `test.mp4`, poster: `test.jpg`.

**Where each technique lives (`demo/`):**

| Technique | File |
|---|---|
| Rounded-primitive builders, cached geometry and materials | `kit3d.js` (`rbox`, `sph`, `cap`, `cyl`, `mat`, `glow`, `mesh`, `grp`) |
| Capsule character rig + pure pose function (walk, flail, reach, hug, sit; zombie variant) | `kit3d.js` (`person`, `pose`) |
| Sidekick animal with tail chain | `kit3d.js` (`cat`, `catPose`) |
| Renderer, soft shadows, procedural environment, fog haze, post (DOF, AO, bloom, vignette) | `main.js` top; `$LIB/core/three/post.js` |
| Sets far apart on one scene, toggled per shot | `main.js` (sets at x = 0, 200, 400, 600, 800) |
| Per-scene light "looks" (night, lobby, stairs, dawn) | `main.js` (`look`, `aimKey`, `points`) |
| Camera keys, shake, focus | `main.js` (`setCam`) |
| Fixed series header (banner, PART badge, ticking clock pill) and 2–3-word captions | `main.js` (`header`, `captions`, `endCard`) on the `#ov` canvas |
| Caption timing from voice pauses + syllables | `captions.py` → `caps.json` |
| Sound: drone, pulse, stingers, ambience beds, foley, ducking | `mix.py` + `synth_lib.py` |

**Pitfall found while making it:** never scale a mesh to 0 on any axis (an "eyes off" blink). The normal matrix turns into NaN, and bloom spreads it into big black blocks. Hide it with `visible = false` and keep the scale ≥ 0.05.

**Rebuild:** `sh demo/build.sh` (set `LIB` at its top; writes to `$OUT`). No GPU: about 1.5 h for the frames.
