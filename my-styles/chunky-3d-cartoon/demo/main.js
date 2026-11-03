// ZOMBIE APOCALYPSE ON A CRUISE SHIP · PART 1 — Chunky 3D Cartoon, 1080x1920. render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eio, eo, ei, back, hash, V, rbox, sph, cap, cyl, cone, tor, mat, glow, mesh, grp, person, pose, cat, catPose, SKIN } from './kit3d.js';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const AO = Q.get('ao') !== '0';

// ---------- timeline ----------
const DUR = 54.0;
const CUT = [0, 6.3, 10.8, 18.0, 25.2, 36.6, 44.6, 51.4];
const SCN = ['party', 'screams', 'lift', 'stairs', 'buffet', 'bridge', 'lifeboat', 'end'];
const CLOCK = [[0, 'DAY 1 • 9:42 PM'], [6.3, 'DAY 1 • 9:44 PM'], [10.8, 'DAY 1 • 9:51 PM'], [18.0, 'DAY 1 • 9:58 PM'],
               [25.2, 'DAY 1 • 10:06 PM'], [36.6, 'DAY 2 • 6:15 AM'], [44.6, 'DAY 2 • 6:22 AM']];
const VO = { l01: 0.15, l02: 4.25, l03: 6.4, l04: 11.0, l05: 13.2, l06: 18.2, l07: 20.4, l08: 25.4, l09: 28.1, l10: 33.6, l11: 37.3, l12: 40.8, l13: 44.8, l14: 48.0 };
const T = { twitch: 2.0, snap: 5.0, starts: 8.75, doors: 15.35, eyes: 21.5, climb: 22.4, water: 28.95, rolls: 29.85, catJump: 34.1, trust: 35.05,
            drift: 42.9, spot: 45.1, bulge1: 48.7, bulge2: 50.15, bulge3: 50.85 };
let CAPS = [];
const sceneAt = t => { let i = 0; for (let k = 0; k < CUT.length; k++) if (t >= CUT[k]) i = k; return i; };

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, .1, 500);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .35;
scene.fog = new THREE.FogExp2('#22305e', .02);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: AO, aoRadius: .6, aoThickness: 1.2, aoAmt: .55 });
post.bloom.strength = .35; post.bloom.threshold = .9; post.bloom.radius = .5;
post.vig.uniforms.amt.value = .3; post.vig.uniforms.contrast.value = .12; post.vig.uniforms.sat.value = 1.12;

const hemi = new THREE.HemisphereLight('#3b4f8f', '#2a1e2e', 1.0); scene.add(hemi);
const key = new THREE.DirectionalLight('#cfd8ff', 1.2); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -.0004; key.shadow.normalBias = .03;
scene.add(key); scene.add(key.target);
const ptl = []; for (let i = 0; i < 4; i++) { const p = new THREE.PointLight('#ffcf80', 0, 30, 1.6); scene.add(p); ptl.push(p); }

// ---------- sets ----------
const SETS = {};
const wood = mat('#c48d5c'), woodD = mat('#a8744a'), white = mat('#f4f1ea'), whiteW = mat('#fbf6ec');

// DECK (party, screams, buffet) at origin
{
  const g = grp(scene); SETS.deck = g;
  mesh(rbox(44, .6, 34, .2), wood, 0, -.3, -2, g);
  for (let i = 0; i < 22; i++) mesh(rbox(44, .02, .06, .01), woodD, 0, .005, -18 + i * 1.5, g, { cast: false });
  // pool
  mesh(rbox(11, .55, 7, .3), white, -5.5, .27, -3.5, g);
  mesh(rbox(10.2, .3, 6.2, .12), mat('#3cc8dc', { emissive: '#0c5866', emissiveIntensity: .8, roughness: .12 }), -5.5, .42, -3.5, g);
  // railing + sea
  for (let x = -21; x <= 21; x += 2.1) mesh(cyl(.08, .08, 1.7), white, x, .85, -13, g);
  mesh(cyl(.1, .1, 44), white, 0, 1.7, -13, g, { rz: Math.PI / 2 });
  mesh(cyl(.07, .07, 44), white, 0, .9, -13, g, { rz: Math.PI / 2 });
  const sea = mesh(new THREE.PlaneGeometry(900, 900), mat('#10244a', { roughness: .25 }), 0, -9, -100, g, { rx: -Math.PI / 2, cast: false }); SETS.sea = sea;
  // superstructure on the left with lit windows
  mesh(rbox(7, 11, 26, .5), whiteW, -19, 5.5, -2, g);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) mesh(rbox(.2, 1.1, 1.8, .08), glow('#ffd58a', 1.3), -15.45, 2 + r * 3, -13 + c * 3, g, { cast: false });
  mesh(rbox(.3, 3, 2.4, .1), mat('#7b8794'), -15.4, 1.5, 4, g); // door
  // loungers
  for (let i = 0; i < 4; i++) { const lg = grp(g, -10 + i * 2.6, 0, 3.2); mesh(rbox(1.3, .35, 3, .15), mat(i % 2 ? '#3d7fe0' : '#ffffff'), 0, .5, 0, lg); mesh(rbox(1.3, 1.1, .3, .12), mat(i % 2 ? '#3d7fe0' : '#ffffff'), 0, .95, -1.4, lg, { rx: -.35 }); for (const sx of [-.5, .5]) mesh(cyl(.06, .06, .5), white, sx, .25, 0, lg); }
  // buffet
  const bf = grp(g, 5, 0, -4.2); SETS.buffet = bf;
  mesh(rbox(6.4, 1.15, 1.8, .12), white, 0, .58, 0, bf);
  mesh(rbox(6.5, .3, 1.9, .1), mat('#e0312b'), 0, .95, 0, bf); // skirt band (the ship's red)
  for (let i = 0; i < 4; i++) mesh(rbox(1.25, .12, 1.0, .05), mat('#c9ced6', { metalness: .6, roughness: .3 }), -2.3 + i * 1.55, 1.22, 0, bf);
  const rolls = []; for (let i = 0; i < 9; i++) rolls.push(mesh(sph(.2), mat('#d9a35c'), -1.4 + (i % 3) * .38, 1.42, -.25 + Math.floor(i / 3) * .26, bf, { s: [1, .75, 1] }));
  const bottles = []; for (let i = 0; i < 6; i++) { const b = grp(bf, .9 + (i % 3) * .32, 1.28, -.2 + Math.floor(i / 3) * .35); mesh(cyl(.1, .1, .55), mat('#9fd8ff', { roughness: .08, clearcoat: 1 }), 0, .28, 0, b); mesh(cyl(.06, .06, .1), mat('#2f6fe0'), 0, .6, 0, b); bottles.push(b); }
  mesh(sph(.35), mat('#ff7a6b'), -2.3, 1.4, 0, bf, { s: [1, .5, 1] });
  mesh(sph(.3), mat('#8fd16b'), 2.35, 1.38, 0, bf, { s: [1, .6, 1] });
  SETS.rolls = rolls; SETS.bottles = bottles;
  // string lights (two sagging lines)
  const bulbs = [];
  for (const [z, y0] of [[-6, 6.5], [1, 6.2]]) for (let i = 0; i <= 26; i++) { const u = i / 26, x = lerp(-15, 18, u), y = y0 - Math.sin(u * Math.PI) * 1.4; bulbs.push(mesh(sph(.13, 10, 8), glow(i % 3 === 0 ? '#ff7ac8' : i % 3 === 1 ? '#ffd27a' : '#7ae0ff', 2.2), x, y, z, g, { cast: false })); }
  for (const [z, y0] of [[-6, 6.5], [1, 6.2]]) { const pts = []; for (let i = 0; i <= 26; i++) { const u = i / 26; pts.push(V(lerp(-15, 18, u), y0 - Math.sin(u * Math.PI) * 1.4 + .12, z)); }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#1b1d2a' }))); }
  for (const x of [-15, 18]) for (const z of [-6, 1]) mesh(cyl(.09, .09, 6.6), white, x, 3.3, z, g);
  // DJ booth neon
  mesh(rbox(2.4, 1.2, 1, .15), mat('#2a2140'), -6, .6, -9, g); mesh(rbox(2.5, .12, 1.05, .05), glow('#ff4fd8', 2.5), -6, 1.2, -9, g, { cast: false });
  // alarm beacons (red, used after the apocalypse starts)
  SETS.alarm = [mesh(sph(.25, 12, 8), glow('#ff2a2a', 0), -15.3, 4.2, 6, g, { cast: false }), mesh(sph(.25, 12, 8), glow('#ff2a2a', 0), 10, 3.2, -12.8, g, { cast: false })];
}
// LIFT LOBBY at x=200
{
  const g = grp(scene, 200, 0, 0); SETS.lift = g;
  mesh(rbox(20, .4, 14, .1), mat('#8a2c3b'), 0, -.2, 0, g);
  for (let i = 0; i < 10; i++) mesh(rbox(.18, .02, 14, .01), mat('#a8443f'), -9 + i * 2, .01, 0, g, { cast: false });
  const wall = mat('#f1e6d0'), brass = mat('#c9a35a', { metalness: .6, roughness: .35 });
  // back wall with two openings (x -4.4..-1.6 and 1.6..4.4, h 4.4)
  mesh(rbox(5.6, 8, .6, .05), wall, -7.2, 4, -4, g); mesh(rbox(3.2, 8, .6, .05), wall, 0, 4, -4, g); mesh(rbox(5.6, 8, .6, .05), wall, 7.2, 4, -4, g);
  for (const x of [-3, 3]) { mesh(rbox(2.8, 3.6, .6, .05), wall, x, 6.2, -4, g); mesh(rbox(3.4, .3, .7, .1), brass, x, 4.55, -3.9, g); for (const s of [-1, 1]) mesh(rbox(.3, 4.6, .7, .1), brass, x + s * 1.55, 2.3, -3.9, g);
    mesh(rbox(1, .4, .1, .08), glow('#ffb347', 1.5), x, 5.1, -3.65, g, { cast: false }); }
  mesh(cyl(.12, .12, .06), glow('#ffcf6b', 2), 0, 1.6, -3.65, g, { rx: Math.PI / 2, cast: false });
  // the right lift: interior + doors
  const inside = mat('#d9c9a4');
  mesh(rbox(3, .3, 3, .05), mat('#6b5a44'), 3, .1, -5.8, g); mesh(rbox(3.2, 4.6, .3, .05), inside, 3, 2.3, -7.4, g);
  mesh(rbox(.3, 4.6, 3.2, .05), inside, 1.5, 2.3, -5.8, g); mesh(rbox(.3, 4.6, 3.2, .05), inside, 4.5, 2.3, -5.8, g); mesh(rbox(3.2, .3, 3.2, .05), glow('#fff2cc', .6), 3, 4.5, -5.8, g, { cast: false });
  SETS.liftLight = new THREE.PointLight('#d8ffd0', 0, 9, 1.5); SETS.liftLight.position.set(203, 3.6, -5.8); scene.add(SETS.liftLight);
  const steel = mat('#b8c0c8', { metalness: .7, roughness: .28 });
  SETS.doors = []; for (const x of [-3, 3]) for (const s of [-1, 1]) SETS.doors.push(mesh(rbox(1.38, 4.3, .14, .05), steel, x + s * .7, 2.15, -3.75, g));
  // sconces
  for (const x of [-9, 0, 9]) mesh(sph(.3, 12, 8), glow('#ffd58a', 2), x, 5.5, -3.6, g, { s: [1, .6, .5], cast: false });
  // side wall
  mesh(rbox(.6, 8, 14, .05), wall, -10, 4, 0, g);
}
// STAIRWELL at x=400 (up to the right, down to the left)
{
  const g = grp(scene, 400, 0, 0); SETS.stairs = g;
  const step = mat('#d6d9de'), rail = mat('#e0312b');
  mesh(rbox(4, .5, 4, .1), step, 0, -.25, 0, g);                                   // landing
  for (let i = 1; i <= 12; i++) mesh(rbox(1.0, .5 * i + .2, 3.6, .08), step, 2 + i * .9 - .45, (.5 * i - .3) / 2, 0, g);     // up
  for (let i = 1; i <= 12; i++) mesh(rbox(1.0, .5, 3.6, .08), mat('#8d93a1'), -2 - i * .9 + .45, -.25 - .5 * i, 0, g);     // down
  mesh(rbox(40, 22, .5, .1), mat('#efe7d6'), 0, 3, -2.3, g);                        // back wall
  mesh(rbox(14, 14, .55, .1), mat('#2a3350'), -9.5, -8.5, -2.28, g);               // dark lower wall
  for (const [x0, y0, x1, y1] of [[2, 1.4, 13, 7.4], [-2, 1.4, -13, -4.6]]) { const len = Math.hypot(x1 - x0, y1 - y0); mesh(cyl(.07, .07, len), rail, (x0 + x1) / 2, (y0 + y1) / 2, 1.7, g, { rz: Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2 }); }
  // signs: canvas-drawn plates
  const plate = (txt, col, x, y) => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const k = c.getContext('2d');
    k.fillStyle = col; k.beginPath(); k.roundRect(8, 8, 496, 240, 40); k.fill(); k.fillStyle = '#fff'; k.font = '120px "Lilita One"'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(txt, 256, 136);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; SETS.signTex = SETS.signTex || []; SETS.signTex.push([tx, k, c, txt, col]);
    mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshStandardMaterial({ map: tx, roughness: .5, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: .25 }), x, y, -2.0, g, { cast: false }); };
  plate('DECK 12 ↑', '#2f9e5b', 7, 7.5); plate('DECK 5 ↓', '#5a6378', -6.5, -2.2);
  SETS.topLight = new THREE.PointLight('#fff1c8', 0, 24, 1.2); SETS.topLight.position.set(412, 10, 2); scene.add(SETS.topLight);
  SETS.eyes = []; for (let i = 0; i < 5; i++) { const ex = -3.4 - i * 1.05, sy = -.25 - .5 * ((-ex - 2) / .9 + .5); const e = grp(g, ex, sy - 1.25 - hash(i + 3) * .5, -1.3 + hash(i + 7) * .5);
    for (const s of [-1, 1]) mesh(sph(.09, 10, 8), glow('#d6ff7a', 3), s * .16, 0, 0, e, { cast: false }); SETS.eyes.push(e); }
}
// BRIDGE at x=600 (dawn)
{
  const g = grp(scene, 600, 0, 0); SETS.bridge = g;
  mesh(rbox(20, .4, 14, .1), mat('#46546a'), 0, -.2, 0, g);
  mesh(rbox(20, 1.7, .8, .1), mat('#e9edf2'), 0, .85, -5, g);
  mesh(rbox(20, .6, 14, .1), mat('#e9edf2'), 0, 6.3, 0, g);
  for (let x = -9; x <= 9; x += 3) mesh(rbox(.28, 4.4, .28, .08), mat('#e9edf2'), x, 3.9, -5, g);
  // sky + sea outside (they drift)
  const out = grp(scene, 600, 0, -40); SETS.outside = out;
  const sc = document.createElement('canvas'); sc.width = 16; sc.height = 256; const k = sc.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6f97d4'); gr.addColorStop(.55, '#f3b3a6'); gr.addColorStop(.8, '#ffd6a0'); gr.addColorStop(1, '#ffe9c4');
  k.fillStyle = gr; k.fillRect(0, 0, 16, 256); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(400, 120), new THREE.MeshBasicMaterial({ map: st, fog: false }), 0, 30, -60, out, { cast: false, receive: false });
  mesh(new THREE.PlaneGeometry(400, 200), mat('#6d93bd', { roughness: .2 }), 0, -6, 20, out, { rx: -Math.PI / 2, cast: false });
  mesh(sph(3, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff3d6', fog: false }), 18, 2, -58, out, { cast: false, receive: false });
  // console with screens + small wheel
  mesh(rbox(9, 1.3, 1.6, .2), mat('#dfe4ea'), 0, .65, -3.7, g);
  for (let i = 0; i < 4; i++) mesh(rbox(1.5, .9, .1, .06), glow(i % 2 ? '#5fe0ff' : '#7dffb5', .9), -3 + i * 2, 1.65, -4.1, g, { rx: -.5, cast: false });
  const wh = grp(g, 0, 1.9, -2.85); mesh(tor(.55, .07), mat('#a8744a'), 0, 0, 0, wh); for (let i = 0; i < 4; i++) mesh(cyl(.04, .04, 1.1), mat('#a8744a'), 0, 0, 0, wh, { rz: i * Math.PI / 4 }); mesh(cyl(.08, .08, .6), mat('#7b8794'), 0, -.5, 0, wh);
  SETS.wheel = wh;
  // captain's chair
  const ch = grp(g, -.2, 0, -.6); SETS.chair = ch;
  mesh(cyl(.12, .3, .9), mat('#7b8794', { metalness: .5, roughness: .35 }), 0, .45, 0, ch);
  const seat = grp(ch, 0, .9, 0); SETS.seat = seat;
  mesh(rbox(1.3, .35, 1.2, .15), mat('#23262d', { roughness: .4 }), 0, .17, 0, seat);
  mesh(rbox(1.3, 1.6, .3, .15), mat('#23262d', { roughness: .4 }), 0, 1.0, .5, seat);
  for (const s of [-1, 1]) mesh(rbox(.2, .2, 1, .08), mat('#23262d'), s * .7, .5, .05, seat);
  mesh(rbox(.9, .5, .1, .05), mat('#ffffff'), 0, 1.75, .45, seat); // headrest cover
  // side wall + barricaded door
  mesh(rbox(.6, 6.6, 14, .05), mat('#e9edf2'), -10, 3.1, 0, g);
  mesh(rbox(.2, 4, 2.4, .08), mat('#7b8794', { metalness: .4 }), -9.6, 2, 2, g);
  mesh(rbox(1.4, 1.2, 1.2, .12), mat('#d9b27a'), -8.8, .6, 1.3, g); mesh(rbox(1.4, 1.2, 1.2, .12), mat('#c9a06a'), -8.8, 1.8, 2.3, g);
  mesh(rbox(1.3, 1.1, 2.8, .25), mat('#e0312b'), -8.6, .55, 3.2, g); mesh(rbox(1.2, 1.2, 1.2, .12), mat('#d9b27a'), -8.7, .6, 2.6, g, { ry: .3 });
  mesh(rbox(1.2, .3, 1.2, .1), mat('#3d7fe0'), -8.7, 2.55, 1.6, g, { rz: .4 });
  // supplies by "you"
  SETS.bridgeStuff = grp(g, 3.6, 0, 1.6);
  for (let i = 0; i < 3; i++) { const b = grp(SETS.bridgeStuff, i * .3, 0, .9); mesh(cyl(.1, .1, .55), mat('#9fd8ff', { roughness: .08, clearcoat: 1 }), 0, .28, 0, b); mesh(cyl(.06, .06, .1), mat('#2f6fe0'), 0, .6, 0, b); }
  mesh(rbox(.8, .6, .5, .2), mat('#3f8f5a'), 1.2, .3, .9, SETS.bridgeStuff); for (let i = 0; i < 3; i++) mesh(sph(.18), mat('#d9a35c'), 1.0 + i * .2, .68, .9, SETS.bridgeStuff, { s: [1, .75, 1] });
}
// LIFEBOAT DECK at x=800 (dawn)
{
  const g = grp(scene, 800, 0, 0); SETS.boatDeck = g;
  mesh(rbox(24, .6, 16, .2), wood, 0, -.3, 2, g);
  for (let i = 0; i < 10; i++) mesh(rbox(24, .02, .06, .01), woodD, 0, .005, -5 + i * 1.5, g, { cast: false });
  for (let x = -11; x <= 11; x += 2.1) mesh(cyl(.08, .08, 1.7), white, x, .85, -6, g);
  mesh(cyl(.1, .1, 24), white, 0, 1.7, -6, g, { rz: Math.PI / 2 });
  mesh(rbox(.6, 9, 16, .2), whiteW, 11.5, 4.5, 2, g);
  // davits
  for (const x of [-3.2, 3.2]) { mesh(cyl(.18, .22, 6), mat('#9aa3ad', { metalness: .5, roughness: .4 }), x, 3, -6.6, g); mesh(cyl(.15, .15, 3), mat('#9aa3ad', { metalness: .5, roughness: .4 }), x, 6, -8, g, { rx: Math.PI / 2 }); }
  const boat = grp(g, 0, 3.4, -9.4); SETS.boat = boat;
  mesh(cap(1.3, 5.2), mat('#ff7a1a', { roughness: .45 }), 0, 0, 0, boat, { rz: Math.PI / 2, s: [1, 1, .95] });
  mesh(cap(1.2, 4.8), mat('#fffaf0', { roughness: .6 }), 0, .55, 0, boat, { rz: Math.PI / 2, s: [.85, 1, .9] });
  for (let i = 0; i < 4; i++) mesh(sph(.22, 14, 10), mat('#1b1d2a', { roughness: .2 }), -2.4 + i * 1.6, .7, 1.07, boat, { s: [1, .7, .3], cast: false });
  mesh(rbox(6.8, .18, 2.7, .08), mat('#e0312b'), 0, -.15, 0, boat);
  SETS.bulge = mesh(sph(.7, 20, 14), mat('#fffaf0', { roughness: .6 }), .8, 1.2, .2, boat, { s: [1, .2, 1] });
  for (const x of [-3.2, 3.2]) mesh(cyl(.03, .03, 3.2), mat('#3a3a3a'), x, 1.6, 0, boat);
  const sea = mesh(new THREE.PlaneGeometry(900, 900), mat('#5f87b3', { roughness: .2 }), 0, -12, -100, g, { rx: -Math.PI / 2, cast: false });
  const sc = document.createElement('canvas'); sc.width = 16; sc.height = 256; const k = sc.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#7aa0d8'); gr.addColorStop(.6, '#f5bba7'); gr.addColorStop(1, '#ffe2b8');
  k.fillStyle = gr; k.fillRect(0, 0, 16, 256); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(600, 160), new THREE.MeshBasicMaterial({ map: st, fog: false }), 0, 40, -160, g, { cast: false, receive: false });
}

// ---------- cast ----------
const C = {};
const YOU = { shirt: '#ffc81e', pants: '#2f5aa8', hair: '#3b2416', hairStyle: 'short', skin: SKIN[1] };
C.you = person(YOU); scene.add(C.you.root);
C.cat = cat(); scene.add(C.cat.root);
const GUEST = [{ shirt: '#e0312b', hair: '#1b1d2a', hairStyle: 'bun', skin: SKIN[2] }, { shirt: '#2fa8e0', hair: '#c9862f', skin: SKIN[0] },
  { shirt: '#3fbf6a', hair: '#1b1d2a', hairStyle: 'cap', hat: '#ffffff', skin: SKIN[3] }, { shirt: '#ff7a1a', hair: '#7a3b1f', hairStyle: 'bun', skin: SKIN[4] },
  { shirt: '#c45ad9', hair: '#e8d06a', skin: SKIN[0] }, { shirt: '#ff5fa2', hair: '#3b2416', skin: SKIN[1] }, { shirt: '#2f5aa8', hair: '#1b1d2a', hairStyle: 'cap', hat: '#ffc81e', skin: SKIN[2] }];
C.guests = GUEST.map(o => { const p = person(Object.assign({ pants: '#2f3b63' }, o)); scene.add(p.root); return p; });
C.odd = person({ shirt: '#ff8fb1', stripe: '#ffffff', pants: '#e9e2cf', hair: '#5a4a3a', skin: '#bcc79e' }); scene.add(C.odd.root);   // the strange passenger
const ZC = ['#7a6a6a', '#5d6b7a', '#7a7058', '#6b5a72', '#5f7262'];
C.z = ZC.map((c, i) => { const p = person({ zombie: true, shirt: c, pants: '#4a4a52', hair: '#3a3a3a', hairStyle: i % 2 ? 'short' : 'none' }); scene.add(p.root); return p; });

function place(P, x, y, z, ry = 0) { P.root.visible = true; P.root.position.set(x, y, z); P.root.rotation.set(0, ry, 0); }
function hideAll() { for (const k in C) { const v = C[k]; if (Array.isArray(v)) v.forEach(p => p.root.visible = false); else v.root.visible = false; } }
const walkTo = (t, t0, t1, a, b) => { const u = clamp((t - t0) / (t1 - t0)); return a.clone().lerp(b, u); };

// ---------- looks ----------
function look(name, t) {
  const L = {
    night: { bg: '#1d2a52', fog: '#26346a', fd: .018, sky: '#5068b0', gnd: '#2a1e2e', hi: 1.1, key: '#cfd8ff', ki: 1.1, kd: [-8, 18, 10], env: .35, exp: 1.1 },
    lobby: { bg: '#3a2a2a', fog: '#3a2c2c', fd: .02, sky: '#fff0d8', gnd: '#5a2e30', hi: 1.3, key: '#ffe8c8', ki: 1.4, kd: [-6, 14, 12], env: .45, exp: 1.05 },
    stairs: { bg: '#121a33', fog: '#1a2242', fd: .045, sky: '#d8d4ff', gnd: '#141a30', hi: .7, key: '#fff1c8', ki: 1.5, kd: [10, 20, 8], env: .3, exp: 1.05 },
    dawn: { bg: '#f3c3b0', fog: '#f0cdbd', fd: .006, sky: '#ffe0cc', gnd: '#4a5570', hi: 1.2, key: '#ffd7a8', ki: 2.4, kd: [-10, 8, -14], env: .5, exp: 1.0 },
  }[name];
  scene.background = new THREE.Color(L.bg); scene.fog.color.set(L.fog); scene.fog.density = L.fd;
  hemi.color.set(L.sky); hemi.groundColor.set(L.gnd); hemi.intensity = L.hi;
  key.color.set(L.key); key.intensity = L.ki; scene.environmentIntensity = L.env; renderer.toneMappingExposure = L.exp;
  return L;
}
function aimKey(target, L, span = 14) {
  key.target.position.copy(target); key.position.copy(target).add(V(...L.kd));
  const s = key.shadow.camera; s.left = -span; s.right = span; s.top = span; s.bottom = -span; s.near = 1; s.far = 80; s.updateProjectionMatrix();
}
function points(list) { ptl.forEach((p, i) => { const d = list[i]; if (d) { p.position.set(...d[0]); p.color.set(d[1]); p.intensity = d[2]; p.distance = d[3] || 30; } else p.intensity = 0; }); }

// ---------- camera ----------
let shake = 0;
function setCam(pos, at, fov, focus, aper = 250) {
  const sx = shake ? Math.sin(tNow * 53) * shake : 0, sy = shake ? Math.cos(tNow * 47) * shake : 0;
  camera.position.copy(pos).add(V(sx, sy, 0)); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(at.clone().add(V(sx * .5, sy * .5, 0)));
  post.dof.focus = camera.position.distanceTo(focus || at); post.dof.aper = aper; post.dof.maxCoc = 7;
}
let tNow = 0;

// ---------- scenes ----------
function dance(P, t, i) { pose(P, { t, bob: Math.abs(Math.sin(t * 6.4 + i)) * .12, sway: Math.sin(t * 3.2 + i) * .12, armsUp: .35 + .3 * Math.sin(t * 3.2 + i * 2), yaw: Math.sin(t * 1.6 + i) * .3 }); }
function zwalk(P, t, i, lunge = 0) { const ph = t * 4.2 + i * 1.7; pose(P, { t, phase: ph + .4 * Math.sin(ph * .5), walk: .55, armsFwd: 1, lean: .12 + lunge * .25, tilt: .35 * Math.sin(i * 2.1 + 1), yaw: .15 * Math.sin(t * 1.3 + i) }); }

function sParty(t) {
  SETS.deck.visible = true;
  const L = look('night', t); aimKey(V(2, 0, -2), L, 18);
  points([[[-6, 5.2, -6], '#ffcf80', 18, 26], [[6, 5.2, -6], '#ff9ad8', 14, 26], [[4, 5.0, 1], '#ffd58a', 16, 24], [[-6, 2, -9], '#ff4fd8', 10, 14]]);
  SETS.alarm.forEach(a => a.visible = false);
  // guests dance around the pool and the middle
  const gp = [[-9.5, -7.5], [-2.2, -7.2], [-10.5, .6], [-1.4, .4], [-4.2, 2.6], [1.0, -6.8], [-7.5, -8.8]];
  C.guests.forEach((p, i) => { place(p, gp[i][0], 0, gp[i][1], Math.atan2(-gp[i][0] + -5.5, 3) * .3 + (i % 2 ? .4 : -.4)); dance(p, t, i); });
  // the strange passenger behind the buffet
  place(C.odd, 6.2, 0, -5.6, -.25);
  const tw = t > T.twitch ? Math.sin(t * 23) * .12 * (Math.sin(t * 2.7) > .2 ? 1 : 0) : 0;
  const snap = eo(seg(t, T.snap, T.snap + .2));
  pose(C.odd, { t, tilt: .35 + tw, yaw: lerp(-.6, .25, snap), nod: lerp(.15, -.05, snap), armsFwd: t > 3.6 ? .35 : 0, lean: .15, reachR: t < 3.6 ? .6 + .1 * Math.sin(t * 3) : null });
  // you, foreground, holding a drink
  place(C.you, 0.6, 0, 2.8, 2.58); pose(C.you, { t, bob: Math.sin(t * 6.4) * .03, reachR: .55, yaw: lerp(0, .35, seg(t, 4.2, 5.0)) });
  // ship's cat on the deck by the buffet
  place(C.cat, 3.0, 0, -2.4, -.9); catPose(C.cat, t, { yaw: lerp(.4, -.7, seg(t, 4.6, 5.2)), tailUp: t > T.snap ? .8 : 0, arch: t > T.snap ? .12 : 0 });
  // camera: party wide → push to the buffet
  const u = eio(seg(t, 0, 5.6));
  shake = 0;
  setCam(V(-3.0, 8.0, 13.5).lerp(V(2.2, 3.7, 3.4), u), V(1.0, 1.2, -4.0).lerp(V(5.8, 2.7, -5.4), u), lerp(56, 38, u), C.odd.root.position.clone().add(V(0, 2.4, 0)), lerp(160, 260, u));
}
function sScreams(t) {
  SETS.deck.visible = true;
  const L = look('night', t); aimKey(V(-5, 0, -3), L, 18);
  const al = t > T.starts ? .5 + .5 * Math.sin(t * 9) : 0;
  SETS.alarm.forEach(a => { a.visible = t > T.starts; a.material.emissiveIntensity = al * 4; });
  points([[[-6, 5.2, -6], '#ffcf80', 14, 26], [[-12, 4, 5], '#ff2a2a', al * 30, 30], [[4, 5.0, 1], '#ffd58a', 10, 24], [[-6, 2, -9], '#ff4fd8', 8, 14]]);
  const dt = t - CUT[1];
  // guests flee toward the camera
  const runs = [[-9, -8, 1.5, 9], [-3, -7, 4, 9.5], [-11, 0, -3, 10], [-1, 0, 5, 8.5], [-5, 2, 0, 11], [1, -6, 6, 6], [-8, -9, -6, 7]];
  C.guests.forEach((p, i) => { const r = runs[i], u = clamp((dt - .1 * i) / 4.2); const pos = V(lerp(r[0], r[2], u), 0, lerp(r[1], r[3], u));
    place(p, pos.x, 0, pos.z, Math.atan2(r[2] - r[0], r[3] - r[1])); pose(p, { t, phase: t * 13 + i, walk: 1.2, lean: .25, armsUp: .7 }); });
  // zombies lurch out of the superstructure door
  C.z.slice(0, 4).forEach((p, i) => { const u = clamp((dt - .3 * i) / 4.5); place(p, lerp(-14.5, -10 + i * 1.6, u), 0, lerp(4 - i * 1.2, -1 + i * .8, u), 1.2 - i * .15); zwalk(p, t, i); });
  place(C.you, 7.5, 0, 3.5, -1.9 + Math.sin(t * 2) * .1); pose(C.you, { t, yaw: .4, lean: -.05, armsUp: dt < 1 ? .2 : 0 });
  C.cat.root.visible = false;
  // whip pan from the buffet to the pool, then handheld
  const w = eo(seg(dt, 0, .35));
  shake = t > T.starts ? .05 : .025;
  setCam(V(3.5, 5.0, 13), V(6, 2.6, -4).lerp(V(-8, 1.6, 0.5), w), 56, V(-7, 2, 2), 150);
}
function sLift(t) {
  SETS.lift.visible = true;
  const L = look('lobby', t); aimKey(V(200, 0, -2), L, 12);
  const dt = t - CUT[2], open = eio(seg(t, T.doors, T.doors + .7));
  SETS.doors.forEach((d, i) => { const lx = i < 2 ? -3 : 3, s = i % 2 ? 1 : -1; d.position.x = lx + s * (.7 + (i >= 2 ? open * 1.4 : 0)); });
  SETS.liftLight.intensity = open * 14 * (.85 + .15 * Math.sin(t * 31));
  points([[[200, 6, 4], '#ffe1b0', 18, 30], [[193, 5, -2], '#ffd58a', 8, 14], [[207, 5, -2], '#ffd58a', 8, 14]]);
  // passengers crowd in front of the right lift
  const crowd = [[201.8, -1.6], [203.6, -1.2], [202.6, -.2], [204.4, .2]];
  [0, 1, 3, 5].forEach((gi, k) => { const p = C.guests[gi]; const [x, z] = crowd[k]; const rec = eo(seg(t, T.doors + .25 + k * .06, T.doors + .7));
    place(p, x + (x - 203) * rec * .4, 0, z + rec * 2.2, Math.PI + (k % 2 ? .1 : -.1)); pose(p, { t, phase: t * 3 + k, walk: dt < 2.2 ? .25 : 0, armsUp: rec * .8, lean: -rec * .2, yaw: Math.sin(t + k) * .1 }); });
  // zombies inside
  C.z.slice(0, 3).forEach((p, i) => { place(p, 202.2 + i * .8, .25, -6.2 + (i % 2) * .5, 0); zwalk(p, t, i, open); p.root.position.z += open * .6; });
  // you, walking away to the left (no lift for you)
  const yp = walkTo(t, 12.4, 17.6, V(198, 0, 2.5), V(193, 0, 2));
  place(C.you, yp.x, 0, yp.z, -1.5); pose(C.you, { t, phase: t * 7, walk: t > 12.4 && t < 17.6 ? .8 : 0, yaw: t > T.doors ? .9 : 0 });
  C.cat.root.visible = false;
  shake = t > T.doors && t < T.doors + .6 ? .06 : 0;
  // low angle behind the crowd → push to the doors
  const u = eio(seg(t, CUT[2], T.doors));
  setCam(V(198.5, 5.0, 10).lerp(V(200.4, 4.3, 6.2), u), V(202, 2.4, -3.5).lerp(V(203, 2.5, -5), u), lerp(54, 46, u), V(203, 2.5, -5.4), 200);
}
function sStairs(t) {
  SETS.stairs.visible = true;
  const L = look('stairs', t); aimKey(V(400, 0, 0), L, 16);
  SETS.topLight.intensity = 30;
  points([[[396, -5, 5], '#4a7cff', 6 + 4 * Math.sin(t * 17) * (Math.sin(t * 3) > 0 ? 1 : 0), 14]]);
  SETS.eyes.forEach((e, i) => { const on = seg(t, T.eyes + i * .18, T.eyes + i * .18 + .15); e.visible = on > .02; e.scale.set(1, Math.max(.05, on * (Math.sin(t * 3 + i * 2) > .95 ? .1 : 1)), 1); });
  // you on the landing, then climbing up
  const cl = seg(t, T.climb, CUT[4] - .2);
  const x = 400 + lerp(0, 7.5, cl), y = Math.max(0, (x - 401.6) / .9 * .5);
  place(C.you, x, y, .3, Math.PI / 2 * (cl > 0 ? 1 : .2)); pose(C.you, { t, phase: t * 7, walk: cl > 0 && cl < 1 ? .9 : 0, lean: cl > 0 ? .1 : 0, yaw: t < T.eyes ? -.5 : (t < T.climb ? -.9 : 0) });
  C.cat.root.visible = false;
  shake = 0;
  // side-on: up (bright) above, down (dark) below; slow drift down then up
  const u = eio(seg(t, 22.1, 24.9)), d0 = eio(seg(t, CUT[3], 21.2));
  setCam(V(400.5 + lerp(lerp(.5, -.8, d0), 2.5, u), lerp(lerp(2.2, .4, d0), 5.5, u), 13.5), V(400.5 + lerp(lerp(-.5, -2.2, d0), 3.5, u), lerp(lerp(.8, -1.4, d0), 4.2, u), 0), 50, C.you.root.position.clone().add(V(0, 2, 0)), 120);
}
function sBuffet(t) {
  SETS.deck.visible = true;
  const L = look('night', t); aimKey(V(5, 0, -3), L, 14);
  const al = .5 + .5 * Math.sin(t * 9);
  SETS.alarm.forEach(a => { a.visible = true; a.material.emissiveIntensity = al * 4; });
  points([[[5, 5, -1], '#ffd58a', 14, 20], [[10, 3.2, -12.8], '#ff2a2a', al * 30, 30], [[-6, 2, -9], '#ff4fd8', 6, 14]]);
  // items fly from the table into the tote
  SETS.bottles.forEach((b, i) => { b.visible = !(i === 1 && t > T.water + .25) && !(i === 4 && t > T.water + .6); });
  SETS.rolls.forEach((r, i) => { r.visible = !(i < 3 && t > T.rolls + .15 * i + .2); });
  // zombies far by the pool in the haze
  C.z.forEach((p, i) => { place(p, -9 + i * 2.4, 0, -6 + Math.sin(i) * 2 + (t - CUT[4]) * .15, .5 + i * .2); zwalk(p, t, i); });
  // you at the buffet (over the shoulder)
  const hug = eo(seg(t, T.catJump + .3, T.catJump + .6));
  place(C.you, 4.6, 0, -2.7, Math.PI + .15);
  const grab = (t > T.water - .3 && t < T.water + .4) || (t > T.rolls - .3 && t < T.rolls + .6) ? 1 : 0;
  pose(C.you, { t, reachR: hug ? null : grab * .8, hug: hug, yaw: t > T.trust ? .25 : 0, nod: .1 });
  // the cat: on the table end, jumps into your arms
  const j = seg(t, T.catJump, T.catJump + .45);
  const p0 = V(7.6, 1.15, -4.0), p1 = C.you.root.position.clone().add(V(-.1, 1.2, -.62));
  const cp = p0.clone().lerp(p1, eio(j)); cp.y += Math.sin(j * Math.PI) * 1.0;
  place(C.cat, cp.x, cp.y, cp.z, j < 1 ? Math.PI : Math.PI * .5);
  catPose(C.cat, t, { yaw: t > T.trust ? .9 : 0, tilt: t > T.trust ? .2 : 0, hop: 0 });
  // tote bag on your left side
  shake = 0;
  const u = eio(seg(t, CUT[4], CUT[5]));
  const fc = t < T.catJump ? V(5, 1.6, -4) : C.cat.root.position;
  if (t < T.catJump - .1) setCam(V(2.4, 4.8, 1.8).lerp(V(2.9, 4.3, 1.0), u), V(5.4, 1.2, -4.4), 50, fc, 220);
  else setCam(V(5.4, 2.9, -8.6), V(4.7, 2.3, -3.0), 44, C.cat.root.position.clone().add(V(0, .5, 0)), 260);
}
function sBridge(t) {
  SETS.bridge.visible = true; SETS.outside.visible = true;
  const L = look('dawn', t); aimKey(V(600, 0, -2), L, 14);
  points([[[600, 5.5, 2], '#ffe8d0', 10, 20]]);
  // drifting: the view outside slides and rolls
  const dt = t - CUT[5];
  SETS.outside.position.x = 600 + dt * 1.6; SETS.outside.rotation.z = Math.sin(t * .6) * .03 + (t > T.drift ? seg(t, T.drift, T.drift + 1.5) * .02 : 0);
  SETS.seat.rotation.y = Math.sin(t * .5) * .5 + .3;          // the empty chair turns on its own
  SETS.wheel.rotation.z = Math.sin(t * .7) * .4;
  // you sitting against the console, the cat beside you
  place(C.you, 602.8, 0, 2.4, -.5); pose(C.you, { t, sit: true, armX: -.3, yaw: Math.sin(t * .4) * .2 - .3, nod: -.05 });
  place(C.cat, 601.5, 0, 3.0, -.9); catPose(C.cat, t, { yaw: Math.sin(t * .8) * .3 });
  shake = 0;
  const u = eio(seg(t, CUT[5], CUT[6]));
  setCam(V(606.5, 5.4, 10.5).lerp(V(604.8, 4.8, 8.4), u), V(600.8, 1.2, -1).lerp(V(600.6, 1.4, -1.4), u), 54, V(601.5, 1.2, 1), 130);
}
function sLifeboat(t) {
  SETS.boatDeck.visible = true;
  const L = look('dawn', t); scene.fog.density = .003; aimKey(V(800, 0, -5), L, 16);
  points([]);
  const b1 = seg(t, T.bulge1, T.bulge1 + .3), b2 = seg(t, T.bulge2, T.bulge2 + .25), b3 = seg(t, T.bulge3, T.bulge3 + .2);
  const bump = Math.sin(b1 * Math.PI) * .9 + Math.sin(b2 * Math.PI) * 1.2 + Math.sin(b3 * Math.PI) * 1.5;
  SETS.bulge.scale.set(1 + bump * .2, .2 + bump * .95, 1 + bump * .2); SETS.bulge.position.x = .8 + (t > T.bulge2 ? -1.6 : 0) + (t > T.bulge3 ? 2.2 : 0);
  SETS.boat.rotation.x = Math.sin(t * 1.1) * .03 + bump * .06 * Math.sin(t * 13);
  SETS.boat.rotation.z = Math.sin(t * .9) * .02 + bump * .04;
  // you, over the shoulder; the cat hisses
  place(C.you, 802.6, 0, 1.6, Math.PI + .35); pose(C.you, { t, yaw: 0, nod: -.15, armsUp: t > T.bulge2 ? .12 : 0, lean: t > T.bulge3 ? -.08 : 0 });
  place(C.cat, 801.2, 0, .4, Math.PI * .5 + .6); catPose(C.cat, t, { arch: t > T.bulge1 ? .18 : 0, tailUp: t > T.bulge1 ? 1 : 0, yaw: -.3 });
  shake = t > T.bulge3 ? .03 : 0;
  const u = eio(seg(t, CUT[6], CUT[7]));
  setCam(V(805.5, 5.6, 13).lerp(V(803.6, 5.0, 9.6), u), V(800.2, 2.8, -8).lerp(V(800.4, 3.3, -9.2), u), lerp(58, 50, u), V(800.4, 3.6, -9.4), 120);
}

// ---------- overlay: header + captions ----------
const ov = document.getElementById('ov'), o2 = ov.getContext('2d');
const INK = '#1b1d2a';
let TX = [];
function rr(x, y, w, h, r) { o2.beginPath(); o2.roundRect(x, y, w, h, r); }
function asterisk(x, y, r) { o2.save(); o2.translate(x, y); o2.strokeStyle = '#fff'; o2.lineWidth = r * .42; o2.lineCap = 'round';
  for (let i = 0; i < 4; i++) { o2.rotate(Math.PI / 4); o2.beginPath(); o2.moveTo(-r, 0); o2.lineTo(r, 0); o2.stroke(); } o2.restore(); }
function clockIcon(x, y, r, t) { o2.save(); o2.translate(x, y); o2.strokeStyle = '#fff'; o2.lineWidth = 5; o2.beginPath(); o2.arc(0, 0, r, 0, 7); o2.stroke();
  o2.lineCap = 'round'; o2.beginPath(); o2.moveTo(0, 0); o2.lineTo(0, -r * .6); o2.moveTo(0, 0); o2.lineTo(r * .45, r * .2); o2.stroke(); o2.restore(); }
function header(t) {
  const title = 'ZOMBIE APOCALYPSE ON A CRUISE SHIP';
  // red banner
  o2.font = '52px "Lilita One"'; const tw = o2.measureText(title).width; const bw = Math.min(1020, tw + 170), bx = (W - bw) / 2, by = 64, bh = 92;
  o2.fillStyle = 'rgba(0,0,0,.35)'; rr(bx + 6, by + 8, bw, bh, 22); o2.fill();
  o2.fillStyle = '#e0312b'; rr(bx, by, bw, bh, 22); o2.fill();
  o2.lineWidth = 5; o2.strokeStyle = '#ffffff'; rr(bx + 8, by + 8, bw - 16, bh - 16, 16); o2.stroke();
  let fs = 52; if (tw > bw - 170) fs = 52 * (bw - 170) / tw;
  o2.font = `${fs}px "Lilita One"`; o2.fillStyle = '#fff'; o2.textAlign = 'center'; o2.textBaseline = 'middle'; o2.fillText(title, W / 2, by + bh / 2 + 3);
  const w2 = o2.measureText(title).width; asterisk(W / 2 - w2 / 2 - 38, by + bh / 2, 15); asterisk(W / 2 + w2 / 2 + 38, by + bh / 2, 15);
  TX.push({ id: 'h1', text: title, x0: bx, y0: by, x1: bx + bw, y1: by + bh });
  // PART badge
  const pw = 210, ph = 62, py = by + bh + 16;
  o2.fillStyle = 'rgba(0,0,0,.3)'; rr(W / 2 - pw / 2 + 4, py + 6, pw, ph, 18); o2.fill();
  o2.fillStyle = '#fff3d6'; rr(W / 2 - pw / 2, py, pw, ph, 18); o2.fill();
  o2.font = '46px "Lilita One"'; o2.fillStyle = INK; o2.fillText('PART 1', W / 2, py + ph / 2 + 3);
  TX.push({ id: 'h2', text: 'PART 1', x0: W / 2 - pw / 2, y0: py, x1: W / 2 + pw / 2, y1: py + ph });
  // clock pill with tick-over
  let ci = 0; for (let i = 0; i < CLOCK.length; i++) if (t >= CLOCK[i][0]) ci = i;
  const cur = CLOCK[ci][1], prev = ci ? CLOCK[ci - 1][1] : null, f = ci ? eo(seg(t, CLOCK[ci][0], CLOCK[ci][0] + .3)) : 1;
  o2.font = '40px "Lilita One"'; const cw = Math.max(o2.measureText(cur).width, prev ? o2.measureText(prev).width : 0) + 120, cy = py + ph + 14, chh = 64;
  o2.fillStyle = 'rgba(0,0,0,.3)'; rr(W / 2 - cw / 2 + 4, cy + 6, cw, chh, 32); o2.fill();
  o2.fillStyle = '#1b1d2a'; rr(W / 2 - cw / 2, cy, cw, chh, 32); o2.fill();
  clockIcon(W / 2 - cw / 2 + 44, cy + chh / 2, 17, t);
  o2.save(); rr(W / 2 - cw / 2, cy, cw, chh, 32); o2.clip();
  o2.fillStyle = '#fff'; o2.textAlign = 'left';
  if (prev && f < 1) o2.fillText(prev, W / 2 - cw / 2 + 80, cy + chh / 2 + 3 - f * chh);
  o2.fillText(cur, W / 2 - cw / 2 + 80, cy + chh / 2 + 3 + (1 - f) * chh);
  o2.restore();
}
const HOT = new Set(['ZOMBIE', 'APOCALYPSE', 'OCEAN.', 'RUN.', 'LIFT.', 'UP,', 'DOWN.', 'DARK.', 'BUFFET', 'WATER', 'BREAD', 'ROLLS.', 'CAT.', 'BRIDGE.', 'EMPTY.', 'DRIFTING.', 'LIFEBOAT.', 'MOVING.', 'STARTS.', 'SCREAMING', "CAN'T", "DON'T", 'UP', 'INSIDE']);
function captions(t) {
  for (const c of CAPS) {
    if (t < c.t0 || t >= c.t1) continue;
    const words = c.text.toUpperCase().split(' ');
    const s = back((t - c.t0) / .14, 2.2) * .15 + .85;
    let fs = 112; o2.font = `${fs}px "Lilita One"`;
    const sp = o2.measureText(' ').width;
    const widths = () => words.map(w => o2.measureText(w).width);
    let ws = widths(), tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    if (tot > 980) { fs *= 980 / tot; o2.font = `${fs}px "Lilita One"`; ws = widths(); tot = ws.reduce((a, b) => a + b, 0) + o2.measureText(' ').width * (words.length - 1); }
    const y = 1385;
    o2.save(); o2.translate(W / 2, y); o2.scale(s, s); o2.translate(-W / 2, -y);
    o2.textAlign = 'left'; o2.textBaseline = 'middle'; o2.lineJoin = 'round';
    let x = W / 2 - tot / 2;
    words.forEach((w, i) => {
      o2.fillStyle = 'rgba(15,16,28,.75)'; o2.fillText(w, x + 6, y + 10);
      o2.lineWidth = fs * .12; o2.strokeStyle = INK; o2.strokeText(w, x, y);
      o2.fillStyle = HOT.has(w) ? '#ffd23f' : '#ffffff'; o2.fillText(w, x, y);
      x += ws[i] + o2.measureText(' ').width;
    });
    o2.restore();
  }
}
function endCard(t) {
  o2.fillStyle = '#0d0f18'; o2.fillRect(0, 0, W, H);
  const s = back((t - CUT[7] - .25) / .25, 2);
  if (t < CUT[7] + .25) return;
  o2.save(); o2.translate(W / 2, 960); o2.scale(s, s);
  o2.font = '170px "Lilita One"'; o2.textAlign = 'center'; o2.textBaseline = 'middle';
  o2.fillStyle = 'rgba(0,0,0,.6)'; o2.fillText('PART 2 →', 8, 14);
  o2.lineWidth = 18; o2.strokeStyle = '#e0312b'; o2.lineJoin = 'round'; o2.strokeText('PART 2 →', 0, 0);
  o2.fillStyle = '#ffffff'; o2.fillText('PART 2 →', 0, 0);
  o2.restore();
  TX.push({ id: 'e1', text: 'PART 2 →', x0: 200, y0: 860, x1: 880, y1: 1060 });
}

// ---------- events (sound) ----------
function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push(Object.assign({ t: +t.toFixed(3), type }, o));
  for (const [id, t] of Object.entries(VO)) ev(t, 'voice', { id });
  // ambience states
  ev(0, 'amb', { name: 'party', t1: CUT[1] }); ev(CUT[1], 'amb', { name: 'panic', t1: CUT[2] }); ev(CUT[2], 'amb', { name: 'lobby', t1: CUT[3] });
  ev(CUT[3], 'amb', { name: 'stairs', t1: CUT[4] }); ev(CUT[4], 'amb', { name: 'alarm', t1: CUT[5] }); ev(CUT[5], 'amb', { name: 'bridge', t1: CUT[6] }); ev(CUT[6], 'amb', { name: 'deck', t1: CUT[7] });
  CLOCK.slice(1).forEach(([t]) => ev(t, 'tick'));
  ev(T.twitch, 'groan', { g: .25 }); ev(T.snap, 'sting', { g: .6 });
  ev(CUT[1], 'scream'); ev(CUT[1] + .4, 'scream', { p: 1.15 }); ev(CUT[1] + 1.1, 'scream', { p: .9 }); ev(T.starts, 'sting', { g: 1 }); ev(T.starts, 'alarm');
  for (let k = 0; k < 4; k++) ev(CUT[1] + .5 + k * 1.1, 'groan', { g: .5, p: .8 + k * .1 });
  ev(CUT[2] + .3, 'ding'); ev(T.doors - .4, 'ding'); ev(T.doors, 'doors'); ev(T.doors + .15, 'sting', { g: 1 }); ev(T.doors + .3, 'groan', { g: .9 }); ev(T.doors + .45, 'scream', { p: 1.1 });
  ev(T.eyes, 'groan', { g: .6, p: .7 }); ev(T.eyes + .1, 'sting', { g: .5, low: 1 });
  for (let t = T.climb; t < CUT[4] - .3; t += .29) ev(t, 'step');
  ev(T.water, 'bottle'); ev(T.water + .35, 'bottle'); ev(T.rolls, 'rustle'); ev(T.rolls + .3, 'rustle');
  ev(T.catJump, 'meow'); ev(T.catJump + .45, 'thump', { g: .4 }); ev(T.trust + .2, 'purr');
  ev(CUT[5] + .2, 'creak'); ev(T.drift, 'creak', { p: .8 });
  ev(T.spot, 'gull'); ev(T.bulge1, 'thump'); ev(T.bulge2, 'thump'); ev(T.bulge2 + .1, 'hiss'); ev(T.bulge3, 'thump', { g: 1.2 }); ev(T.bulge3 + .1, 'groan', { g: .8, p: .75 });
  ev(CUT[7], 'cutoff'); ev(CUT[7] + .25, 'endhit');
  // caption cues for the .srt (full sentences per voice line)
  return E.sort((a, b) => a.t - b.t);
}

// ---------- render ----------
const SCENES = [sParty, sScreams, sLift, sStairs, sBuffet, sBridge, sLifeboat];
function render(t) {
  tNow = t; TX = [];
  const i = sceneAt(t);
  o2.clearRect(0, 0, W, H);
  if (i < 7) {
    for (const k of ['deck', 'lift', 'stairs', 'bridge', 'boatDeck', 'outside']) SETS[k].visible = false;
    SETS.liftLight.intensity = 0; SETS.topLight.intensity = 0;
    hideAll();
    SCENES[i](t);
    post.composer.render();
    // a quick flash on cuts
    const since = t - CUT[i];
    if (i > 0 && since < .05) { o2.fillStyle = 'rgba(255,255,255,.5)'; o2.fillRect(0, 0, W, H); }
    captions(t);
  } else endCard(t);
  header(t);
}
window.render = render; window.DUR = DUR; window.EV = events();
window.TEXTS = t => { render(t); return TX.slice(); };
await document.fonts.load('52px "Lilita One"');
CAPS = await (await fetch('caps.json')).json();
// re-draw sign textures now that the font is loaded
for (const [tx, k, c, txt, col] of SETS.signTex) { k.clearRect(0, 0, 512, 256); k.fillStyle = col; k.beginPath(); k.roundRect(8, 8, 496, 240, 40); k.fill(); k.fillStyle = '#fff'; k.font = '120px "Lilita One"'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(txt, 256, 136); tx.needsUpdate = true; }
render(0);
window.READY = true;
