# Chunky 3D Cartoon · 圆润 3D 卡通 — Style Prompt

Made from a blank page; techniques from Brick Toy (brick-toy) in Lemo-Opuscar.
Default size: 1080×1920.

> A smooth, rounded 3D cartoon world for vertical "what if" survival series: chunky characters in bright clothes under soft, hazy light, a fixed series header at the top, 2–3-word captions in the lower third, and a calm narrator giving advice while chaos happens on screen.
> References (grammar only): second-person "what if" survival shorts on vertical video (the series header, the deadpan advice over chaos, the word-group captions, the part-by-part cliffhangers); soft-lit 3D cartoon shorts and toy-like game dioramas (rounded primitives, saturated clothing, atmospheric haze). Copy no creator's characters, branding, channel name, music or episodes.

## 1. Essence, and what it is not

A world modelled from **rounded primitives** (capsules, spheres, rounded boxes) with a soft satin finish, lit softly, fading into coloured haze. The camera tells a second-person survival story ("If X happens while you're on Y…") in short scenes, each one a piece of advice illustrated by chaos.

One-glance traits: capsule people with big simple eyes and bright clothes; grey-green zombies with stiff outstretched arms; soft contact shadows; the far background melting into tinted fog; a red series banner, a cream PART badge and a clock pill fixed at the top; huge white words with a dark shadow in the lower third.

Not Brick Toy (no studs, no real desk, no stop-motion stepping: motion is smooth), not photoreal (no textures, no realistic faces), not flat 2D (everything is lit 3D), not gore (zombies are cartoon-grey and goofy-menacing; no blood, no wounds, no injuries shown).

## 2. Materials & rendering

- **Geometry**: only rounded primitives. Characters: a capsule torso in clothing colour, a sphere head (skin), two sphere eyes with dark pupils and a white catch-light, a small mouth shape, capsule arms ending in sphere mitten hands, capsule legs with rounded-box shoes. Hair or hats are one rounded shape. Sets: rounded boxes with generous radius, cylinders for railings and poles, flat-ish slabs for decks.
- **Material**: `MeshStandardMaterial`/`MeshPhysicalMaterial`, roughness ~0.55, metalness 0, a light clearcoat (~0.15) on hero props only. No image textures; detail is geometry or flat colour.
- **Light**: a soft warm key (directional, soft shadows, shadow radius high), a hemisphere fill (sky colour over a darker ground colour), a procedural room environment at low intensity for gentle reflections, and practical point lights for lamps and neon at night.
- **Haze**: scene fog (exponential) tinted to the sky colour, so distance fades into atmosphere; mild depth of field on the background (`core/three/post.js`), GTAO for contact darkening where affordable.
- **Render budget**: render at 1× with MSAA; no supersampling on a machine without a GPU. Keep a scene under a few hundred meshes; instanced crowds.

## 3. Colour logic

- **People own the saturated colours**: each character wears one bright primary (red, yellow, blue, green, orange, pink) plus white or black trim. The narrator's "you" character always wears the same colour (default: sunshine yellow) so viewers find them in every shot.
- **Sets are softer**: whites, pastels, warm woods, pale teal water.
- **Zombies** are desaturated: skin `#9fb38e`-ish grey-green, faded and torn-looking clothes (darker, greyer versions of the people's colours), glowing pale eyes in the dark.
- **Night**: deep blue sky and fog (`#1d2a52` → `#2e3f73`), warm practical lights (string bulbs, neon pink/cyan accents). **Day**: pale blue-pink dawn haze.
- **Red is reserved** for the header banner and danger (alarm lights, emergency signs).

## 4. Type & subtitles

- **Series header, fixed for the whole film**, top of frame, centred, above the action (top ~300 px of 1920):
  1. a red rounded banner (`#e0312b`, dark offset shadow) with "✱ SERIES TITLE ✱" in white heavy type (Lilita One);
  2. a cream badge (`#fff3d6`, dark text) underneath: "PART n";
  3. a dark pill (`#1b1d2a`, white text) with a clock icon: the in-story time "DAY 1 • 9:42 PM". It **ticks over** at each scene change (old time flips out, new time flips in) with a click.
- **Captions** are the subtitles: big heavy white words (Lilita One, ~110 px), a dark drop shadow and a thin dark stroke, upper-case, centred in the lower third (~y 1300–1450 of 1920, above the app's own UI). **2–3 words at a time**, each group popping in (scale 0.85 → 1 with a slight overshoot) as it is spoken. One key word per group may be yellow.
- A short title card ("PART 2 →") uses the same caption type on a dark ground.
- Readability rule for this style: word groups follow speech, so a group may be shorter than 1.8 s; together they cover every spoken word, and the `.srt` holds full sentences (≥ max(1.8 s, speech + 0.6 s)).

## 5. Motion quality

- **Smooth, on ones** at 24 fps (no stepping).
- People: walk with a bob and arm swing (legs ±0.5 rad); run with a forward lean; panic = arms up and flailing; idle = breathing scale on the torso and a slight sway.
- Zombies: lurch (uneven step timing, head tilted, arms stiff forward), slow then a sudden lunge at scares.
- Rounded shapes stay rigid: no squash and stretch on bodies; heads can bob and turn.
- Props pop into the hand with a small overshoot; doors slide with ease-in-out.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic.

| Move | Expresses | Can serve |
|---|---|---|
| Slow push-in on a detail | Something is wrong | the first sign; a suspicious character |
| High wide / top-down over the set | Layout, being trapped | "you can't run"; a map of the ship |
| Low angle near the floor | Threat looming | zombies approaching; a door about to open |
| Whip pan | Sudden scare | screams; something at the edge of frame |
| Over-the-shoulder of "you" | Second person: you're there | advice moments; choices |
| Handheld shake | Impact, panic | a crash; a barricade hit |
| Slow orbit | Calm after chaos, unease | an empty room; the drifting ship |
| Hard cut to black + card | Cliffhanger | the end of every part |

Framing: the action lives in the middle band of the vertical frame (between the header and the captions); faces and hands that matter are never under the header or captions. Hard cuts between scenes, often on a stinger.

## 7. Sound palette

- **Narrator**: calm, matter-of-fact, unhurried (normal speed), slightly close-mic'd; the voice never panics.
- **Ambience** per set: ocean wash, ship engine hum, wind on deck, muffled party music, alarm bells.
- **Music**: low synth drone with a slow pulse (heartbeat kick), tension rising per rule; a stinger (low hit + high screech) on each scare; music cuts dead before the cliffhanger.
- **Foley** (synthesized): footsteps, screams (filtered noise + pitch glides, kept short, never graphic), elevator ding and door slide, zombie groans (low formant growls), packet rustle, bottle clinks, meow, metal door slam, clock tick for timestamp changes.
- Mix: voice on top, music and ambience ducked under it; −14 LUFS.

## 8. Native moves

- **Rule over chaos.** The rule is spoken calmly while the danger plays out on screen, caption first. *Fits content like:* "Don't take the lift" as doors open on zombies; "Stay on the roof" as water rises.
- **Clock jump.** The header pill ticks over to a new time and the scene changes, marking time and tension. *Fits content like:* the next morning; hour 3 of a blackout.
- **Calm narrator, panicked crowd.** Matter-of-fact voice over running, screaming cartoon crowds.
- **The sidekick.** A cute animal companion with one piece of uniform rides along and reacts. *Fits content like:* a ship's cat in a crew vest; a ski-patrol dog; a lab mouse.
- **Hard-cut cliffhanger.** The reveal begins and the film cuts to "PART n+1 →".

## 9. Pitfalls of the medium

- No GPU: software WebGL is slow. Keep mesh counts low (instancing for crowds), shadows on the key light only, AO and DOF modest; test the per-frame time before the full render.
- Fog too thick washes the subject; tune per shot so the subject keeps contrast.
- Header and captions cover the top ~300 px and the lower third: block the action between them.
- Capsule people read as identical: give each a distinct clothing colour and one hat/hair shape.
- Zombies must stay cartoon: no blood, no injuries, no gore.
- Caption word groups need timings: without word-level speech recognition, derive them from pauses in each line's audio and split by syllables; check by eye on a strip.
- Emoji glyphs (✱) must exist in the font; draw the ✱ as a shape if not.
- Never scale a mesh to 0 on any axis (e.g. an "eyes off" blink): its normal matrix becomes NaN and bloom spreads it into big black blocks. Use `visible = false` and keep scales ≥ 0.05.

## 10. Engine

In `demo/`: `kit3d.js` (rounded-primitive builders, the capsule character rig with its pure `pose()`, the sidekick cat), `main.js` (renderer + post, sets, per-scene light looks, camera keys, the 2D overlay: header, captions, end card), `captions.py` (2–3-word groups timed from the voice), `mix.py` + `synth_lib.py` (drone, stingers, beds, foley, ducking). Technique base: Brick Toy, `$LIB/styles/brick-toy/demo/main.js` (renderer + `makePost` from `$LIB/core/three/post.js`, camera keys, events), `$LIB/styles/brick-toy/demo/set.js` (lighting).

## 11. Variation space

You decide the scenario, the series title, the sets, the cast, the sidekick, the rules, the timestamps, the opening, the cliffhanger, the camera path and the music. All far from the first film:

- Scenarios: a blackout in a skyscraper; a flood on a theme park; an alien landing during a school trip.
- Openings: the clock pill alone ticking in black before the world fades in; an aerial of the whole setting; a close-up of the sidekick's reaction.
- Cliffhangers: a knock from the other side of the barricade; the sidekick runs off; the radio answers.
