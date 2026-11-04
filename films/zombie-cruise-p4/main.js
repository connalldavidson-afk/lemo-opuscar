// ZOMBIE APOCALYPSE ON A CRUISE SHIP · PART 4 — Chunky 3D Cartoon, 1080x1920. render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eio, eo, ei, back, hash, V, rbox, sph, cap, cyl, cone, tor, mat, glow, mesh, grp, person, pose, cat, catPose, SKIN } from './kit3d.js';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const AO = Q.get('ao') !== '0';

// ---------- timeline ----------
const DUR = 54.6;
const CUT = [0, 5.4, 8.8, 18.6, 27.4, 38.0, 44.6, 52.4];
const CLOCK = [[0, 'DAY 3 • 5:48 AM'], [8.8, 'DAY 3 • 5:51 AM'], [18.6, 'DAY 3 • 6:04 AM'], [27.4, 'DAY 3 • 6:37 AM'],
               [38.0, 'DAY 3 • 6:41 AM'], [44.6, 'DAY 3 • 7:15 AM']];
const VO = { l01: 0.3, l02: 6.0, l03: 9.2, l04: 13.6, l05: 19.0, l06: 24.3, l07: 27.8, l08: 31.8, l09: 35.6, l10: 38.6, l11: 45.6, l12: 47.7 };
const T = { peep: 3.6,
            open: 9.5, pull: 10.1, hand: 10.7, aim: 11.3, blast: 12.4,
            button: 21.5, shut0: 21.65, shut1: 22.85, bang1: 23.15, bang2: 23.65, bang3: 24.25, green: 24.6, door2: 25.4,
            binoc: 33.4, pov: 34.5,
            lower0: 38.3, splash: 43.0,
            dark: 47.7, turn: 49.9 };
let CAPS = [];
const sceneAt = t => { let i = 0; for (let k = 0; k < CUT.length; k++) if (t >= CUT[k]) i = k; return i; };

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, .1, 1500);
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
const ptl = []; for (let i = 0; i < 5; i++) { const p = new THREE.PointLight('#ffcf80', 0, 30, 1.6); scene.add(p); ptl.push(p); }

// ---------- helpers ----------
const SETS = {};
const steelM = mat('#9aa3ad', { metalness: .5, roughness: .4 }), dark = mat('#1b1d2a');
function skyPlane(parent, x, y, z, w, h, stops, ry = 0) {
  const sc = document.createElement('canvas'); sc.width = 16; sc.height = 256; const k = sc.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 256); stops.forEach(([o, c]) => gr.addColorStop(o, c));
  k.fillStyle = gr; k.fillRect(0, 0, 16, 256); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: st, fog: false }), x, y, z, parent, { cast: false, receive: false, ry });
}
function sign(text, w, h, bg, fg, px = 90) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const k = c.getContext('2d');
  k.fillStyle = bg; k.fillRect(0, 0, c.width, c.height); k.fillStyle = fg; k.font = `${px}px "Lilita One"`; k.textAlign = 'center'; k.textBaseline = 'middle';
  k.fillText(text, c.width / 2, c.height / 2 + 4);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tx, roughness: .6 });
}
function rod(a, b, r, m, parent) {
  const d = b.clone().sub(a), L = d.length();
  const o = mesh(cyl(r, r, L), m, 0, 0, 0, parent);
  o.position.copy(a).add(b).multiplyScalar(.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  return o;
}
// a unit cylinder stretched between two world points every frame
function stretch(o, a, b) { const d = b.clone().sub(a), L = Math.max(1e-3, d.length()); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); o.scale.set(1, L, 1); }
function hazardTex(rep = 6) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const k = c.getContext('2d');
  k.fillStyle = '#ffd23f'; k.fillRect(0, 0, 256, 256); k.fillStyle = '#1b1d2a';
  for (let i = -4; i < 8; i++) { k.beginPath(); k.moveTo(i * 64, 0); k.lineTo(i * 64 + 32, 0); k.lineTo(i * 64 + 32 + 256, 256); k.lineTo(i * 64 + 256, 256); k.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rep, 1);
  return tx;
}

// BRIDGE at x=600 (night in scene 1, sunrise in scene 5); the ship heads toward -z
{
  const g = grp(scene, 600, 0, 0); SETS.bridge = g;
  const wm = mat('#e9edf2'), fl = mat('#46546a');
  mesh(rbox(13, .3, 9.4, .1), fl, 0, -.15, 0, g);
  mesh(rbox(13, 1.5, .4, .1), wm, 0, .75, -4.5, g);
  mesh(rbox(13, .5, 9.4, .1), wm, 0, 5.0, 0, g);
  for (let x = -6; x <= 6; x += 2.4) mesh(rbox(.26, 3.4, .26, .08), wm, x, 3.1, -4.5, g);
  for (const x of [-6.4, 6.4]) { mesh(rbox(.3, 1.5, 9.4, .1), wm, x, .75, 0, g); for (let z = -4.2; z <= 4.4; z += 2.2) mesh(rbox(.26, 3.4, .26, .08), wm, x, 3.1, z, g); }
  // back wall with a door and its porthole
  mesh(rbox(5.0, 5, .3, .08), wm, -3.9, 2.5, 4.6, g); mesh(rbox(5.4, 5, .3, .08), wm, 3.7, 2.5, 4.6, g); mesh(rbox(1.6, 2.4, .3, .08), wm, -.6, 3.8, 4.6, g);
  const door = mat('#cfd6de'); mesh(rbox(1.5, 2.6, .12, .05), door, -.6, 1.3, 4.66, g);
  mesh(tor(.24, .05), steelM, -.6, 1.9, 4.58, g); mesh(new THREE.CircleGeometry(.22, 24), new THREE.MeshStandardMaterial({ color: '#0a1020', roughness: .1, transparent: true, opacity: .35 }), -.6, 1.9, 4.6, g, { cast: false });
  mesh(rbox(.08, .2, .12, .03), mat('#3a3a3a'), -.05, 1.25, 4.56, g);
  mesh(new THREE.PlaneGeometry(.9, .26), sign('BRIDGE', .9, .26, '#1b1d2a', '#ffd23f', 120), -.6, 2.85, 4.44, g, { cast: false, ry: Math.PI });
  // console + wheel + screens
  mesh(rbox(9, 1.3, 1.4, .2), mat('#dfe4ea'), 0, .65, -3.6, g);
  mesh(rbox(9, .12, 1.5, .05), mat('#2a2f3a'), 0, 1.34, -3.6, g, { rx: .25 });
  SETS.screens = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.MeshStandardMaterial({ color: '#0b2030', emissive: i % 2 ? '#5fe0ff' : '#7dffb5', emissiveIntensity: .9, roughness: .4 }); SETS.screens.push(mesh(rbox(1.4, .85, .1, .05), m, -3.2 + i * 2.1, 1.75, -4.0, g, { rx: -.45, cast: false })); }
  const radar = mesh(new THREE.CircleGeometry(.32, 32), new THREE.MeshStandardMaterial({ color: '#06281a', emissive: '#2bff8a', emissiveIntensity: .7 }), -2.6, 1.42, -3.3, g, { rx: -Math.PI / 2 + .25, cast: false });
  SETS.radarSweep = mesh(new THREE.PlaneGeometry(.3, .02), glow('#b8ffd8', 3), 0, 0, .002, radar, { cast: false }); SETS.radarSweep.geometry = new THREE.PlaneGeometry(.3, .02).translate(.15, 0, 0);
  const wh = grp(g, 0, 1.5, -2.75); SETS.wheel = wh; mesh(tor(.55, .07), mat('#a8744a'), 0, 0, 0, wh); for (let i = 0; i < 4; i++) mesh(cyl(.04, .04, 1.1), mat('#a8744a'), 0, 0, 0, wh, { rz: i * Math.PI / 4 }); mesh(cyl(.09, .09, .14), mat('#7b8794'), 0, 0, 0, wh, { rx: Math.PI / 2 });
  mesh(cyl(.1, .14, 1.2), mat('#7b8794'), 0, .6, -2.95, g);
  // outside: skies, sea, the bow, the coast far ahead
  const out = grp(scene, 600, 0, 0); SETS.outside = out;
  SETS.nightSky = skyPlane(out, 0, 60, -700, 1800, 260, [[0, '#060a1c'], [.6, '#122047'], [.85, '#2a3c78'], [1, '#41548f']]);
  SETS.nightSkyB = skyPlane(out, 0, 30, 60, 300, 120, [[0, '#060a1c'], [.7, '#16244f'], [1, '#2a3c78']], Math.PI);
  SETS.sunSky = skyPlane(out, 0, 70, -700, 1800, 300, [[0, '#4a6aa8'], [.45, '#b98aa6'], [.75, '#ffb070'], [.92, '#ffd59a'], [1, '#ffe7c2']]);
  SETS.sun = mesh(sph(26, 32, 20), new THREE.MeshBasicMaterial({ color: '#fff0c8', fog: false }), 150, 18, -690, out, { cast: false, receive: false });
  SETS.seaM = new THREE.MeshStandardMaterial({ color: '#1d2f55', roughness: .18, metalness: .1 });
  mesh(new THREE.PlaneGeometry(2400, 2400), SETS.seaM, 0, -11, 0, out, { rx: -Math.PI / 2, cast: false });
  SETS.wakes = [];
  for (let i = 0; i < 26; i++) SETS.wakes.push(mesh(rbox(3 + hash(i) * 5, .05, .25, .02), new THREE.MeshBasicMaterial({ color: '#c9d6ee', transparent: true, opacity: .5, fog: true }), 0, -10.95, 0, out, { cast: false, receive: false }));
  const bow = grp(out, 0, 0, 0); SETS.bow = bow;
  mesh(rbox(14, 9, 30, 2), mat('#f4f6f8'), 0, -6.5, -22, bow);
  mesh(cone(7, 14), mat('#f4f6f8'), 0, -6.5, -42, bow, { rx: -Math.PI / 2, s: [1, 1, .64] });
  mesh(rbox(12.6, .2, 30, .1), mat('#8a5a3a'), 0, -1.95, -22, bow);
  for (let z = -8; z > -40; z -= 3) { mesh(cyl(.05, .05, 1), steelM, -6.2, -1.4, z, bow); mesh(cyl(.05, .05, 1), steelM, 6.2, -1.4, z, bow); }
  // the coast, far ahead (seen in the binoculars)
  const co = grp(scene, 600, -11, -330); SETS.coast = co;
  const hill = mat('#5f9e5a', { roughness: .9 }), hill2 = mat('#4c8a55', { roughness: .9 }), rock = mat('#9a8f86');
  for (let i = 0; i < 9; i++) mesh(sph(22 + hash(i) * 18, 24, 14), i % 2 ? hill : hill2, -90 + i * 22, -14 + hash(i + 3) * 8, -62 - hash(i + 7) * 20, co, { s: [1.4, .7, 1], cast: false });
  mesh(rbox(220, 3, 14, .5), mat('#d9c9a0'), 0, 1, -8, co, { cast: false });
  const HC = ['#ff8a5c', '#ffd23f', '#5fc8e8', '#f4f1ea', '#e06a8a', '#7dd38a'];
  for (let i = 0; i < 16; i++) { const x = -26 + i * 3.6 + hash(i) * 1.2, h = 3 + hash(i + 2) * 3;
    mesh(rbox(3, h, 3, .3), mat(HC[i % 6]), x, 2.5 + h / 2, -8 - hash(i + 9) * 6, co, { cast: false });
    mesh(rbox(2.4, 2.4, 3.1, .2), mat('#c0503a'), x, 2.5 + h, -8 - hash(i + 9) * 6, co, { rz: Math.PI / 4, s: [.9, .6, 1], cast: false }); }
  mesh(rbox(10, 2.2, 3, .3), rock, 30, 1.5, 0, co, { cast: false });
  const lh = grp(co, 32, 2.5, 0); for (let k = 0; k < 5; k++) mesh(cyl(1.3 - k * .12, 1.4 - k * .12, 3), mat(k % 2 ? '#e0312b' : '#f4f1ea'), 0, 1.5 + k * 3, 0, lh, { cast: false });
  mesh(cyl(1.1, 1.1, 1.6), glow('#fff2c0', 1.2), 0, 16.3, 0, lh, { cast: false }); mesh(cone(1.4, 1.6), mat('#e0312b'), 0, 17.9, 0, lh, { cast: false });
}
// OUTSIDE STAIR at x=1000: top landing (y=5, z 0..3) against the white superstructure (x=-1.7), 12 steps down toward -z
const NSTEP = 12, RISE = .42;
const stairY = s => s <= NSTEP ? 5 - s * RISE : 0, stairZ = s => s <= NSTEP ? -s * RISE : -NSTEP * RISE - (s - NSTEP) * .6;
{
  const g = grp(scene, 1000, 0, 0); SETS.stair = g;
  const wall = mat('#eef1f4'), deck = mat('#7a8a99', { roughness: .6 }), teak = mat('#a8744a', { roughness: .7 }), rail = mat('#f4f6f8');
  mesh(rbox(.4, 22, 34, .1), wall, -1.9, 4, -6, g);
  for (let z = 4; z > -22; z -= 2.6) for (const y of [2.2, 7.6]) { mesh(tor(.28, .05), steelM, -1.68, y, z, g, { ry: Math.PI / 2, cast: false }); mesh(new THREE.CircleGeometry(.26, 20), mat('#1a2438', { roughness: .1 }), -1.69, y, z, g, { ry: Math.PI / 2, cast: false }); }
  mesh(rbox(2.2, .15, 3.4, .04), teak, -.75, 4.925, 1.7, g);
  for (let i = 0; i < NSTEP; i++) {
    mesh(rbox(1.7, .08, RISE, .02), teak, -.65, 5 - (i + 1) * RISE - .04, -(i + .5) * RISE, g);
    mesh(rbox(1.7, .02, .06, .01), mat('#ffd23f'), -.65, 5 - (i + 1) * RISE + .005, -i * RISE - .05, g, { cast: false });
  }
  rod(V(.3, 5.0, 0), V(.3, 0, -NSTEP * RISE), .06, steelM, g);
  rod(V(.3, 6.0, 0), V(.3, 1.0, -NSTEP * RISE), .05, rail, g);
  for (let i = 0; i <= NSTEP; i += 3) mesh(cyl(.035, .035, 1.0), rail, .3, 5 - i * RISE + .5, -i * RISE, g);
  rod(V(.3, 6.0, 0), V(.3, 6.0, 3.4), .05, rail, g); for (const z of [1.1, 2.3, 3.4]) mesh(cyl(.035, .035, 1.0), rail, .3, 5.5, z, g);
  rod(V(-1.7, 6.0, 3.4), V(.3, 6.0, 3.4), .05, rail, g);
  // lower deck
  mesh(rbox(6, .2, 14, .05), deck, 1.1, -.1, -12, g);
  rod(V(4.1, 1.0, -5.0), V(4.1, 1.0, -19), .05, rail, g); for (let z = -5; z > -19; z -= 1.5) mesh(cyl(.035, .035, 1.0), rail, 4.1, .5, z, g);
  // fire-hose cabinet on the wall by the landing
  const cb = grp(g, -1.62, 6.0, 2.3); SETS.cab = cb;
  mesh(rbox(.24, 1.2, .95, .05), mat('#c0392b'), 0, 0, 0, cb);
  mesh(rbox(.05, 1.05, .8, .02), mat('#3a1515'), .1, 0, 0, cb, { cast: false });
  SETS.reel = grp(cb, .13, .05, 0); mesh(tor(.28, .1), mat('#e8e0c8'), 0, 0, 0, SETS.reel, { ry: Math.PI / 2 }); mesh(cyl(.08, .08, .2), steelM, 0, 0, 0, SETS.reel, { rz: Math.PI / 2 });
  const dh = grp(cb, .13, 0, .48); SETS.cabDoor = dh;
  mesh(rbox(.04, 1.15, .92, .02), mat('#e0312b'), .02, 0, -.46, dh);
  mesh(new THREE.PlaneGeometry(.6, .36), sign('FIRE HOSE', .6, .36, '#e0312b', '#ffffff', 80), .045, .2, -.46, dh, { ry: Math.PI / 2, cast: false });
  const st = sign('DECK 11', 1.6, .55, '#eef1f4', '#24356e', 140); mesh(new THREE.PlaneGeometry(1.6, .55), st, -1.69, 7.7, .8, g, { ry: Math.PI / 2, cast: false });
  SETS.stairLamps = [mesh(sph(.13), glow('#ffd9a0', 2.6), -1.6, 7.1, 1.2, g, { cast: false }), mesh(sph(.13), glow('#ffd9a0', 2.6), -1.6, 2.4, -5.5, g, { cast: false }), mesh(sph(.13), glow('#ffd9a0', 2.6), -1.6, 2.4, -11, g, { cast: false })];
  const out = grp(scene, 1000, 0, 0); SETS.stairOut = out;
  SETS.stairSky = skyPlane(out, 80, 20, -20, 400, 120, [[0, '#0e1838'], [.6, '#2a3c70'], [.88, '#6f6f9e'], [1, '#c48a8a']], -Math.PI / 2);
  skyPlane(out, 0, 20, -120, 400, 120, [[0, '#0e1838'], [.6, '#2a3c70'], [.88, '#6f6f9e'], [1, '#c48a8a']]);
  mesh(new THREE.PlaneGeometry(800, 800), mat('#1f3258', { roughness: .2 }), 0, -12, 0, out, { rx: -Math.PI / 2, cast: false });
}
// the hose: a tube rebuilt each frame, a nozzle, the water jet and splash
const hoseM = mat('#e8e0c8', { roughness: .7 });
SETS.hose = new THREE.Mesh(new THREE.BufferGeometry(), hoseM); SETS.hose.castShadow = true; scene.add(SETS.hose);
SETS.nozzle = grp(scene); mesh(cyl(.07, .1, .42), mat('#d9a441', { metalness: .6, roughness: .3 }), 0, 0, 0, SETS.nozzle, { rx: Math.PI / 2 }); mesh(cyl(.11, .11, .1), mat('#c0392b'), 0, 0, -.12, SETS.nozzle, { rx: Math.PI / 2 });
const waterM = new THREE.MeshStandardMaterial({ color: '#cfeeff', emissive: '#5aaaf0', emissiveIntensity: .55, roughness: .1, transparent: true, opacity: .82 });
SETS.jet = []; for (let i = 0; i < 70; i++) SETS.jet.push(mesh(sph(.13, 12, 8), waterM, 0, 0, 0, scene, { cast: false }));
SETS.splash = []; for (let i = 0; i < 40; i++) SETS.splash.push(mesh(sph(.07, 10, 6), waterM, 0, 0, 0, scene, { cast: false }));
// WATERTIGHT DOOR corridor at x=1400 (runs along -z; the bulkhead at z=-4)
{
  const g = grp(scene, 1400, 0, 0); SETS.corr = g;
  const wallM = mat('#c3ccd4'), floorM = mat('#5f6b78', { roughness: .55 });
  mesh(rbox(3.4, .2, 34, .05), floorM, 0, -.1, -10, g);
  mesh(rbox(3.6, .2, 34, .05), mat('#4f5660'), 0, 3.55, -10, g);
  for (const x of [-1.8, 1.8]) mesh(rbox(.2, 3.6, 34, .05), wallM, x, 1.75, -10, g);
  for (const x of [-1.68, 1.68]) mesh(rbox(.02, .12, 34, .01), mat('#2f9e5b'), x, 1.05, -10, g, { cast: false });
  // bulkhead frame with the opening (1.7 wide, 2.6 high)
  const bm = mat('#9aa3ad', { metalness: .3, roughness: .5 });
  mesh(rbox(.95, 3.6, .4, .05), bm, -1.25, 1.75, -4, g); mesh(rbox(.95, 3.6, .4, .05), bm, 1.25, 1.75, -4, g); mesh(rbox(3.4, .95, .4, .05), bm, 0, 3.08, -4, g);
  const hz = new THREE.MeshStandardMaterial({ map: hazardTex(5), roughness: .6 });
  mesh(rbox(.06, 2.6, .44, .02), hz, -.8, 1.3, -4, g, { cast: false }); mesh(rbox(.06, 2.6, .44, .02), hz, .8, 1.3, -4, g, { cast: false });
  // the sliding door (behind the bulkhead), with a little window
  const d = grp(g, 0, 0, -4.32); SETS.wtDoor = d;
  const dm = mat('#8a95a3', { metalness: .35, roughness: .45 }), wy = 2.0, hw = .3;
  mesh(rbox(1.9, wy - hw, .22, .04), dm, 0, (wy - hw) / 2, 0, d); mesh(rbox(1.9, 2.75 - wy - hw, .22, .04), dm, 0, (2.75 + wy + hw) / 2, 0, d);
  for (const sgn of [-1, 1]) mesh(rbox(.95 - hw, 2 * hw + .02, .22, .02), dm, sgn * (hw + (.95 - hw) / 2), wy, 0, d);
  mesh(rbox(1.92, .34, .24, .03), new THREE.MeshStandardMaterial({ map: hazardTex(4), roughness: .6 }), 0, .3, 0, d, { cast: false });
  mesh(tor(.38, .07), steelM, 0, 2.0, .12, d); mesh(new THREE.CircleGeometry(.36, 24), new THREE.MeshStandardMaterial({ color: '#cfe0ea', roughness: .05, transparent: true, opacity: .12 }), 0, 2.0, .125, d, { cast: false });
  for (let i = 0; i < 4; i++) mesh(sph(.04, 8, 6), steelM, -.75 + (i % 2) * 1.5, .7 + (i > 1 ? 1.4 : 0), .12, d, { cast: false });
  // button panel on the right wall, lamp + SEALED sign over the door
  const pn = grp(g, 1.68, 1.45, -3.0); SETS.btnPanel = pn;
  mesh(rbox(.1, .6, .5, .04), mat('#e8e4d8'), 0, 0, 0, pn);
  SETS.btn = grp(pn, -.08, -.04, 0); mesh(cyl(.13, .13, .1), mat('#e0312b', { roughness: .3 }), 0, 0, 0, SETS.btn, { rz: Math.PI / 2 });
  mesh(new THREE.PlaneGeometry(.42, .12), sign('CLOSE', .42, .12, '#e8e4d8', '#1b1d2a', 100), -.06, .2, 0, pn, { ry: -Math.PI / 2, cast: false });
  SETS.doorLampM = new THREE.MeshStandardMaterial({ color: '#3a1010', emissive: '#ff2a1a', emissiveIntensity: 2.2, roughness: .4 });
  mesh(sph(.16), SETS.doorLampM, -.55, 3.05, -3.78, g, { cast: false, s: [1, .7, .6] });
  SETS.sealM = sign('SEALED', 1.0, .3, '#1b2a20', '#3a4a40', 120); SETS.sealM.emissive = new THREE.Color('#ffffff'); SETS.sealM.emissiveMap = SETS.sealM.map; SETS.sealM.emissiveIntensity = 0;
  mesh(new THREE.PlaneGeometry(1.0, .3), SETS.sealM, .35, 3.05, -3.79, g, { cast: false });
  // amber beacon
  SETS.beacon = grp(g, 1.2, 3.38, -3.6); mesh(cyl(.1, .12, .2), glow('#ffab2e', 2.5), 0, 0, 0, SETS.beacon, { cast: false });
  // fluorescent strips beyond
  for (let z = -6; z > -26; z -= 4) mesh(rbox(.18, .06, 1.6, .02), glow('#eaf4ff', 2.0), 0, 3.42, z, g, { cast: false });
  for (let z = 1; z > -4; z -= 4) mesh(rbox(.18, .06, 1.6, .02), glow('#eaf4ff', 2.0), 0, 3.42, z, g, { cast: false });
  mesh(cyl(.1, .1, 34), mat('#c0392b'), 1.5, 3.05, -10, g, { rx: Math.PI / 2 }); mesh(cyl(.07, .07, 34), mat('#d8d2c4'), -1.52, 2.8, -10, g, { rx: Math.PI / 2 });
  mesh(new THREE.PlaneGeometry(1.2, .4), sign('DECK 10', 1.2, .4, '#c3ccd4', '#24356e', 140), -1.69, 2.3, -1.6, g, { ry: Math.PI / 2, cast: false });
}
// THE LIFEBOAT (moves between scenes 6 and 7); long axis x, bow at +x
{
  const b = grp(scene); SETS.boat = b;
  const or = mat('#ff7a1a', { roughness: .45 }), wh = mat('#f4f1ea');
  mesh(rbox(4.4, 1.0, 1.9, .42), or, 0, .5, 0, b);
  mesh(rbox(1.2, .8, 1.5, .4), or, 2.2, .62, 0, b, { s: [1, 1, .9] });
  for (const z of [-.9, .9]) mesh(rbox(4.6, .28, .14, .06), wh, .1, 1.1, z, b);
  for (const x of [-2.18, 2.5]) mesh(rbox(.14, .28, 1.8, .06), wh, x, 1.1, 0, b);
  mesh(rbox(4.2, .06, 1.6, .02), mat('#d9c9a0'), 0, .99, 0, b, { cast: false });
  for (const x of [-1.0, .4]) mesh(rbox(.3, .12, 1.7, .04), mat('#c9a77a'), x, 1.05, 0, b);
  mesh(rbox(4.0, .1, 1.95, .03), mat('#ffffff'), 0, .32, 0, b, { cast: false });
  for (const z of [-.97, .97]) mesh(new THREE.PlaneGeometry(1.1, .3), sign('LB 3', 1.1, .3, '#ff7a1a', '#ffffff', 140), -1.3, .62, z * 1.0, b, { ry: z > 0 ? 0 : Math.PI, cast: false });
  SETS.hooks = [V(-1.8, 1.25, 0), V(1.8, 1.25, 0)];
}
// HULL + davits at x=2200 (hull face at z=0, water y=0)
{
  const g = grp(scene, 2200, 0, 0); SETS.hull = g;
  mesh(rbox(70, 18, 1.2, .3), mat('#f4f6f8'), 0, 7, -.6, g);
  mesh(rbox(70.1, 1.4, 1.25, .1), mat('#c0392b'), 0, .1, -.6, g, { cast: false });
  mesh(rbox(70.1, .5, 1.25, .1), mat('#24356e'), 0, 10.8, -.6, g, { cast: false });
  for (const y of [3.4, 6.2, 8.8]) for (let x = -30; x <= 30; x += 2.4) { mesh(tor(.3, .06), steelM, x + (y > 6 ? 1.2 : 0), y, .02, g, { cast: false }); mesh(new THREE.CircleGeometry(.28, 20), mat('#1a2438', { roughness: .1 }), x + (y > 6 ? 1.2 : 0), y, .01, g, { cast: false }); }
  // top deck edge + rail
  mesh(rbox(70, .3, 3, .1), mat('#d9dde2'), 0, 16.0, -.3, g);
  mesh(cyl(.06, .06, 70), mat('#f4f6f8'), 0, 17.05, 1.0, g, { rz: Math.PI / 2 });
  for (let x = -34; x <= 34; x += 1.2) mesh(cyl(.035, .035, 1.0), mat('#f4f6f8'), x, 16.6, 1.0, g);
  // davits
  SETS.davTips = [];
  for (const x of [-1.8, 1.8]) { rod(V(x, 16.0, -.2), V(x, 18.0, .6), .12, mat('#e9edf2'), g); rod(V(x, 18.0, .6), V(x, 17.6, 2.3), .12, mat('#e9edf2'), g); mesh(sph(.16), steelM, x, 17.5, 2.3, g); SETS.davTips.push(V(2200 + x, 17.4, 2.3)); }
  SETS.cables = [0, 1].map(() => { const c = new THREE.Mesh(cyl(.025, .025, 1, 6), mat('#3a3a3a')); scene.add(c); return c; });
  const out = grp(scene, 2200, 0, 0); SETS.hullOut = out;
  SETS.hullSea = mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: '#3f78a8', roughness: .15, metalness: .1 }), 0, 0, 0, out, { rx: -Math.PI / 2, cast: false });
  skyPlane(out, 0, 30, -60, 400, 160, [[0, '#7aa6d8'], [.6, '#bcd2ea'], [.9, '#ffd6a8'], [1, '#ffe2c0']]);
  SETS.ripples = []; for (let i = 0; i < 14; i++) SETS.ripples.push(mesh(tor(1, .04), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .6 }), 0, .02, 0, out, { rx: Math.PI / 2, cast: false, receive: false }));
}
// HARBOUR at x=3000: the lifeboat glides along -z toward a quay; every light is out
{
  const g = grp(scene, 3000, 0, 0); SETS.harb = g;
  SETS.harbSea = mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: '#4d5f72', roughness: .2, metalness: .1 }), 0, 0, -100, g, { rx: -Math.PI / 2, cast: false });
  const stone = mat('#8d8a84', { roughness: .9 }), stone2 = mat('#6f6c68', { roughness: .9 });
  mesh(rbox(90, 2.4, 12, .3), stone, 0, .6, -56, g);
  for (let x = -44; x <= 44; x += 3) mesh(rbox(2.9, .3, .4, .05), stone2, x, 1.85, -50.1, g, { cast: false });
  const HC = ['#e89a6a', '#e8cf6a', '#7ab8c8', '#e8e2d4', '#c88aa0', '#8ab890', '#d07a5a'];
  const win = mat('#1d2129', { roughness: .3 });
  for (let i = 0; i < 15; i++) {
    const x = -33 + i * 4.7 + (hash(i) - .5), h = 5 + hash(i + 2) * 5, w = 4.2, z = -55 - hash(i + 9) * 3;
    mesh(rbox(w, h, 4, .2), mat(HC[i % 7], { roughness: .8 }), x, 1.8 + h / 2, z, g);
    mesh(rbox(3.3, 3.3, 4.1, .15), mat(['#8a3a2e', '#5a4a52', '#3e4a5a'][i % 3], { roughness: .8 }), x, 1.8 + h, z, g, { rz: Math.PI / 4, s: [.9, .55, 1] });
    for (let r = 0; r < Math.floor(h / 1.8); r++) for (const dx of [-1.1, 0, 1.1]) mesh(rbox(.6, .8, .06, .03), win, x + dx, 3.2 + r * 1.8, z + 2.02, g, { cast: false });
    mesh(rbox(.9, 1.5, .06, .03), mat('#3a2a22'), x + (hash(i + 4) > .5 ? 1.2 : -1.2), 2.55, z + 2.02, g, { cast: false });
  }
  // dark street lamps along the quay edge
  for (let x = -36; x <= 36; x += 8) { mesh(cyl(.08, .1, 4.2), mat('#2a2e36'), x, 3.9, -51.2, g); mesh(sph(.3, 14, 10), mat('#55595f', { roughness: .3 }), x, 6.1, -51.2, g, { cast: false }); }
  // crane
  const cr = grp(g, 22, 1.8, -54); const ym = mat('#c9a33a', { roughness: .7 });
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rod(V(x, 0, z), V(x * .5, 14, z * .5), .14, ym, cr);
  rod(V(0, 14, 0), V(-14, 15.5, 0), .2, ym, cr); rod(V(0, 14, 0), V(4, 13.8, 0), .2, ym, cr); mesh(rbox(1.6, 1.6, 1.6, .1), ym, 0, 14.4, 0, cr);
  rod(V(-12, 15.3, 0), V(-12, 7, 0), .03, dark, cr);
  // breakwater + dark lighthouse on the left
  mesh(rbox(5, 1.8, 30, .4), stone2, -16, .3, -30, g);
  const lh = grp(g, -16, 1.2, -18); for (let k = 0; k < 4; k++) mesh(cyl(1.0 - k * .1, 1.1 - k * .1, 2.2), mat(k % 2 ? '#a83a30' : '#d8d4cc'), 0, 1.1 + k * 2.2, 0, lh);
  mesh(cyl(.8, .8, 1.2), mat('#4a4e54', { roughness: .2 }), 0, 9.4, 0, lh); mesh(cone(1.0, 1.2), mat('#a83a30'), 0, 10.6, 0, lh);
  // moored boats
  for (const [x, c] of [[-8, '#e8e2d4'], [-4.5, '#7ab8c8'], [6, '#e8e2d4'], [10, '#c88aa0']]) { const mb = grp(g, x, 0, -48.6); mesh(rbox(2.6, .7, 1.2, .3), mat(c), 0, .25, 0, mb); mesh(cyl(.04, .04, 3), mat('#e8e2d4'), 0, 1.8, 0, mb); }
  // floating buoys + a drifting deck chair (the ship's)
  SETS.buoys = []; for (const [x, z] of [[-4, -22], [4.5, -26], [-6, -34]]) SETS.buoys.push(mesh(sph(.35, 16, 10), mat('#e0312b'), x, .1, z, g));
  skyPlane(g, 0, 40, -160, 600, 160, [[0, '#5f6c80'], [.6, '#8c98aa'], [1, '#b8c0cc']]);
}

// ---------- cast ----------
const C = {};
const YOU = { shirt: '#ffc81e', pants: '#2f5aa8', hair: '#3b2416', hairStyle: 'short', skin: SKIN[1] };
C.you = person(YOU); scene.add(C.you.root);
C.marco = person({ shirt: '#ffffff', stripe: '#24356e', pants: '#24356e', hairStyle: 'cap', hat: '#24356e', skin: SKIN[3] }); scene.add(C.marco.root);
C.cat = cat(); scene.add(C.cat.root);
const ZC = ['#7a6a6a', '#5d6b7a', '#7a7058', '#6b5a72', '#5f7262', '#8a5a5a', '#5a6a8a'];
C.z = []; for (let i = 0; i < 14; i++) { const p = person({ zombie: true, shirt: ZC[i % ZC.length], pants: ['#4a4a52', '#3a4258', '#5a4a40'][i % 3], hair: ['#3a3a3a', '#5a4030', '#2a2a2a'][i % 3], hairStyle: ['short', 'none', 'bun', 'short'][i % 4] }); scene.add(p.root); C.z.push(p); }
// binoculars on Marco's face
SETS.binoc = grp(C.marco.head, 0, .36, .5); for (const s of [-1, 1]) mesh(cyl(.075, .085, .26), mat('#1b1d2a', { roughness: .4 }), s * .13, 0, 0, SETS.binoc, { rx: Math.PI / 2, cast: false }); mesh(rbox(.14, .06, .1, .02), mat('#3a3e48'), 0, 0, -.02, SETS.binoc, { cast: false });

const ALLROOTS = () => [C.you.root, C.marco.root, C.cat.root, ...C.z.map(p => p.root)];
function place(P, x, y, z, ry = 0, parent = scene) { if (P.root.parent !== parent) parent.add(P.root); P.root.visible = true; P.root.position.set(x, y, z); P.root.rotation.set(0, ry, 0); P.root.scale.setScalar(P === C.cat ? 1.25 : 1); }
function hideAll() {
  for (const r of ALLROOTS()) { if (r.parent !== scene) scene.add(r); r.visible = false; r.rotation.set(0, 0, 0); }
  SETS.hose.visible = SETS.nozzle.visible = false; SETS.jet.forEach(s => s.visible = false); SETS.splash.forEach(s => s.visible = false);
  SETS.binoc.visible = false; SETS.boat.visible = false; SETS.cables.forEach(c => c.visible = false);
  C.z.forEach(p => { p.head.scale.set(1, 1, 1); });
}
function zwalk(P, t, i, lunge = 0, w = .55) { const ph = t * 4.2 + i * 1.7; pose(P, { t, phase: ph + .4 * Math.sin(ph * .5), walk: w, armsFwd: 1, lean: .12 + lunge * .25, tilt: .35 * Math.sin(i * 2.1 + 1), yaw: .15 * Math.sin(t * 1.3 + i) }); }

// ---------- looks ----------
function look(name) {
  const L = {
    night: { bg: '#0b1330', fog: '#0b1330', fd: .004, sky: '#6a80c8', gnd: '#1a1e2e', hi: .75, key: '#9fb4ff', ki: .7, kd: [-4, 9, -10], env: .25, exp: 1.05 },
    predawn: { bg: '#22335f', fog: '#2a3b68', fd: .01, sky: '#8aa0d8', gnd: '#2a2e44', hi: .95, key: '#c0ccff', ki: 1.0, kd: [8, 12, 6], env: .3, exp: 1.05 },
    door: { bg: '#141820', fog: '#141820', fd: .03, sky: '#c8d4e0', gnd: '#2a2e38', hi: .7, key: '#f0f4ff', ki: .8, kd: [2, 10, 5], env: .3, exp: 1.0 },
    sunrise: { bg: '#f0a060', fog: '#f6c08c', fd: .0016, sky: '#ffd8b0', gnd: '#5a4a5a', hi: 1.0, key: '#ffb070', ki: 2.2, kd: [10, 5, -14], env: .45, exp: 1.0 },
    morning: { bg: '#a9c4e0', fog: '#c8d6e6', fd: .003, sky: '#e8f0ff', gnd: '#6a7a8a', hi: 1.1, key: '#ffd6a8', ki: 2.0, kd: [16, 10, 14], env: .5, exp: 1.0 },
    harbour: { bg: '#7d8a9c', fog: '#8693a5', fd: .019, sky: '#b8c4d4', gnd: '#4a5260', hi: 1.05, key: '#c8d2e0', ki: .6, kd: [-6, 12, 8], env: .35, exp: 1.0 },
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
let shake = 0, tNow = 0;
function setCam(pos, at, fov, focus, aper = 250) {
  const sx = shake ? Math.sin(tNow * 53) * shake : 0, sy = shake ? Math.cos(tNow * 47) * shake : 0;
  camera.up.set(0, 1, 0);
  camera.position.copy(pos).add(V(sx, sy, 0)); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(at.clone().add(V(sx * .5, sy * .5, 0)));
  post.dof.focus = camera.position.distanceTo(focus || at); post.dof.aper = aper; post.dof.maxCoc = 7;
}

// ---------- scenes ----------
function shipMotion(t, k = 1) {
  SETS.outside.position.set(600, Math.sin(t * .9) * .25 * k, 0);
  SETS.bow.position.set(0, 0, 0); SETS.bow.rotation.z = Math.sin(t * .7) * .02 * k;
  SETS.wakes.forEach((w, i) => { const x = (hash(i) - .5) * 60, zz = -20 - ((hash(i + 30) * 160 + t * 9) % 160); w.position.set(x, -10.95, zz); });
}
function sBridgeNight(t) {
  SETS.bridge.visible = SETS.outside.visible = true; SETS.nightSky.visible = SETS.nightSkyB.visible = true;
  SETS.sunSky.visible = SETS.sun.visible = false; SETS.coast.visible = false; SETS.seaM.color.set('#14234a');
  const L = look('night'); aimKey(V(600, 0, -1), L, 10);
  shipMotion(t);
  SETS.screens.forEach((m, i) => m.material.emissiveIntensity = .8 + .2 * Math.sin(t * 3 + i));
  SETS.radarSweep.rotation.z = -t * 2.6;
  points([[[600, 2.3, -3.4], '#7fe8ff', 7, 6], [[597.4, 1.8, -3.2], '#2bff8a', 4, 4], [[599.4, 4.4, 1], '#ffd9a8', 3, 10], [[599.4, 2.3, 6.2], '#5a70b0', 4, 6]]);
  // you at the wheel, facing forward (and us); Marco at the radar; the cat on the console
  place(C.you, 600, 0, -1.95, Math.PI); pose(C.you, { t, armsFwd: .75, armZ: 0, nod: .05, tilt: Math.sin(t * .8) * .05, lean: .03 });
  SETS.wheel.rotation.z = Math.sin(t * .6) * .5;
  C.you.armL.rotation.z = -.35 + SETS.wheel.rotation.z * .3; C.you.armR.rotation.z = .35 + SETS.wheel.rotation.z * .3;
  const look2 = eo(seg(t, T.peep + .3, T.peep + .8));
  place(C.marco, 598.95, 0, -1.2, Math.PI - .35 + look2 * 2.6); pose(C.marco, { t, nod: .45 * (1 - look2), armX: -.35 * (1 - look2), yaw: look2 * .3 });
  place(C.cat, 600.95, 1.3, -3.3, Math.PI * .5 + 1.5); catPose(C.cat, t, { tilt: -.15, yaw: look2 * -.9, tailUp: look2, arch: look2 * .2 });
  // a shape passes the porthole of the back door
  const z0 = C.z[0]; const zx = lerp(597.4, 599.0, seg(t, T.peep - .4, T.peep + 1.6));
  if (t > T.peep - .4) { place(z0, zx, 0, 5.15, Math.PI / 2); zwalk(z0, t, 0, 0, .4); }
  shake = .008;
  const u = eio(seg(t, 0, CUT[1]));
  setCam(V(600.6, 3.1, -7.4).lerp(V(600.5, 3.0, -6.5), u), V(599.85, 1.9, -1).lerp(V(599.6, 1.9, 1.5), seg(t, T.peep, T.peep + 1.2) * .7), 46, V(600, 2.2, -1.9), 110);
}
function zombieStair(P, t, i, s, lane) {
  place(P, 1000 + lane, stairY(s), stairZ(s), 0);
  zwalk(P, t, i, 0, .5); P.body.position.y += .05;
}
function sClimb(t) {
  SETS.stair.visible = SETS.stairOut.visible = true;
  const L = look('predawn'); aimKey(V(1000, 2, -4), L, 12);
  points([[[999.0, 7.0, 1.2], '#ffd9a0', 10, 9], [[999.0, 2.4, -5.5], '#ffd9a0', 9, 8], [[999.0, 2.4, -11], '#ffd9a0', 9, 8], [[1003, 4, -6], '#8aa0d8', 4, 16]]);
  const base = [4.0, 5.2, 5.6, 7.0, 8.2, 9.6, 11.2, 12.4, 13.6, 14.6, 15.8];
  base.forEach((b, i) => zombieStair(C.z[i], t, i, b - .38 * (t - CUT[1]), [-.95, -.35, -1.15, -.55, -.95, -.25, -.75, .5, 1.4, -.4, .8][i]));
  shake = 0;
  const u = eio(seg(t, CUT[1], CUT[2]));
  setCam(V(999.4, 8.9, 3.0).lerp(V(999.4, 8.5, 2.4), u), V(999.3, 1.6, -5.5), 50, V(999.3, 3.4, -2.2), 160);
}
const HOSEZ = [[4.4, -.95], [5.6, -.4], [6.9, -1.05], [8.3, -.55], [9.6, -1.0], [11.0, -.35], [12.6, .6], [13.8, -.3]];
function sHose(t) {
  SETS.stair.visible = SETS.stairOut.visible = true;
  const L = look('predawn'); aimKey(V(1000, 3, -2), L, 12);
  points([[[999.0, 7.0, 1.2], '#ffd9a0', 10, 9], [[999.0, 2.4, -5.5], '#ffd9a0', 9, 8], [[999.0, 2.4, -11], '#ffd9a0', 9, 8], [[1003, 6, 3], '#8aa0d8', 5, 16]]);
  // the cabinet opens, the reel turns as the hose pays out
  SETS.cabDoor.rotation.y = -2.0 * back(seg(t, T.open, T.open + .35), 1.3);
  SETS.reel.rotation.x = -seg(t, T.pull, T.blast) * 9;
  const turn = eio(seg(t, T.hand, T.aim));
  place(C.marco, 999.0, 5, 2.35, -Math.PI / 2 + eo(seg(t, T.pull + .2, T.hand)) * -1.0);
  pose(C.marco, { t, reachR: t < T.hand + .3 ? (t > T.open - .3 ? 1.1 : .2) : .3, nod: .2, lean: t > T.blast ? -.05 : 0, armsUp: t > T.blast + 2.2 ? .35 * seg(t, T.blast + 2.2, T.blast + 2.6) : 0 });
  place(C.you, 999.95, 5, 1.9, -Math.PI / 2 - turn * (Math.PI / 2 - .05));
  const brace = t > T.blast ? 1 : 0;
  pose(C.you, { t, armsFwd: t > T.hand ? 1 : .2, lean: brace * -.18 + Math.sin(t * 30) * .01 * brace, nod: .25, tilt: brace * Math.sin(t * 2) * .05 });
  place(C.cat, 998.6, 5, 2.9, Math.PI * .5 - .4); catPose(C.cat, t, { tailUp: 1, arch: t > T.blast && t < T.blast + 1 ? .2 : 0, hop: t > T.blast + 2.6 ? Math.abs(Math.sin(t * 7)) * .12 : 0, yaw: -.3 });
  // nozzle: in Marco's hand, then yours
  C.you.root.updateMatrixWorld(true); C.marco.root.updateMatrixWorld(true);
  const reelW = SETS.reel.getWorldPosition(V(0, 0, 0));
  SETS.nozzle.visible = SETS.hose.visible = t > T.pull;
  let nz, ndir;
  if (t < T.hand) { nz = C.marco.armR.localToWorld(V(0, -.7, .1)); ndir = V(0, -1, -1).normalize(); }
  else { const a = C.you.armR.localToWorld(V(0, -.68, .02)), b = C.you.armL.localToWorld(V(0, -.68, .02)); nz = a.lerp(b, .5); ndir = V(0, 0, -1).applyQuaternion(C.you.root.quaternion).add(V(0, -.55, 0)).normalize(); }
  SETS.nozzle.position.copy(nz); SETS.nozzle.lookAt(nz.clone().sub(ndir));
  if (t > T.pull) {
    const mid = reelW.clone().lerp(nz, .5); mid.y = Math.min(reelW.y, nz.y) - .5;
    const curve = new THREE.CatmullRomCurve3([reelW, reelW.clone().add(V(.35, -.3, 0)), mid, nz.clone().add(ndir.clone().multiplyScalar(-.3)), nz]);
    SETS.hose.geometry.dispose(); SETS.hose.geometry = new THREE.TubeGeometry(curve, 40, .05, 8, false);
  }
  // zombies climbing; the jet knocks them over one by one and they slide back down
  const tgtS = lerp(4.1, 13.2, eio(seg(t, T.blast + .05, T.blast + 3.3)));
  HOSEZ.forEach(([b, lane], i) => {
    const P = C.z[i];
    const sHit = b - .3 * (T.blast - CUT[2]) - .3 * (i * .25);
    const hit = T.blast + .12 + Math.max(0, (sHit - 4.1)) / (13.2 - 4.1) * 3.0;
    if (t < hit) { zombieStair(P, t, i, b - .3 * (Math.min(t, hit) - CUT[2]) - (t > T.blast ? 0 : 0), lane); return; }
    const f = eo(seg(t, hit, hit + .3)), sl = eo(seg(t, hit, hit + 1.5));
    const s = sHit + sl * (NSTEP + 1.2 + i * .9 - sHit);
    place(P, 1000 + lane, stairY(s) + .2 * f, stairZ(s), 0);
    P.root.rotation.x = -1.35 * f; P.root.rotation.z = Math.sin(i * 3) * .4 * f;
    pose(P, { t, armsUp: f, lean: 0, nod: -.4 * f, tilt: .3 });
  });
  // the jet
  const on = seg(t, T.blast, T.blast + .18);
  if (on > 0) {
    const p0 = nz.clone().add(ndir.clone().multiplyScalar(.25));
    const tg = V(1000 - .55, stairY(tgtS) + (tgtS < NSTEP ? 1.1 : .35), stairZ(tgtS));
    const c1 = p0.clone().lerp(tg, .45).add(V(0, .9, 0));
    const pt = u => { const a = p0.clone().lerp(c1, u), b = c1.clone().lerp(tg, u); return a.lerp(b, u); };
    SETS.jet.forEach((s, k) => { const u = ((k / SETS.jet.length) + t * 3.1) % 1; if (u > on) return; s.visible = true; s.position.copy(pt(u)).add(V((hash(k) - .5) * .06 * u, (hash(k + 3) - .5) * .06 * u, 0)); s.scale.setScalar(.7 + u * 1.3 + .3 * Math.sin(k * 1.7 + t * 20)); });
    if (on >= 1) SETS.splash.forEach((s, k) => { const ph = ((k / SETS.splash.length) + t * 2.2) % 1, a = hash(k) * 6.28, sp = .6 + hash(k + 9) * 1.4; s.visible = true; s.position.set(tg.x + Math.cos(a) * sp * ph, tg.y + ph * 1.6 - ph * ph * 2.4, tg.z + Math.sin(a) * sp * ph * .7 + ph * .4); s.scale.setScalar(1.2 * (1 - ph) + .2); });
  }
  shake = t > T.blast ? .006 : 0;
  if (t < T.blast - .15) {
    const u = eio(seg(t, CUT[2], T.blast - .15));
    setCam(V(1000.5, 6.6, -2.2).lerp(V(1000.35, 6.5, -1.6), u), V(999.25, 5.9, 2.2).lerp(V(999.6, 5.9, 1.7), seg(t, T.hand, T.aim)), 48, V(999.3, 6.1, 1.6), 120);
  } else {
    const u = eio(seg(t, T.blast - .15, CUT[3]));
    setCam(V(1001.9, 8.4, 3.4).lerp(V(1001.7, 8.1, 2.8), u), V(999.3, 2.4, -4.2), 50, V(999.5, 3.2, -3), 170);
  }
}
const DOORZ = [[-16, -.4, 0], [-18.5, .5, .3], [-20, -.6, .6], [-22.5, .2, .9]];
function sDoor(t) {
  SETS.corr.visible = true;
  const L = look('door'); aimKey(V(1400, 0, -4), L, 12);
  const fl = t > T.button ? (.75 + .25 * Math.sin(t * 9) * Math.sin(t * 23)) : 1;
  const bc = t > T.button && t < T.green ? 1 : 0, ba = t * 7;
  SETS.beacon.rotation.y = ba;
  points([[[1400, 3.2, -1], '#eaf4ff', 7, 9], [[1400, 3.2, -10], '#eaf4ff', 9 * fl, 12], [[1400, 3.2, -18], '#eaf4ff', 7 * fl, 12],
          [[1401.2 + Math.cos(ba) * .6, 3.0, -3.6 + Math.sin(ba) * .6], '#ffab2e', bc * 9, 7], [[1399.45, 3.0, -3.7], t > T.green ? '#3dff7a' : '#ff3a2a', 3, 4]]);
  SETS.beacon.children[0].material.emissiveIntensity = 2.5;
  if (t > T.bang1 && t < T.door2) points([[[1400, 2.4, -4.85], '#d8ffe0', 2.2, 1.6], [[1400, 3.2, -1], '#eaf4ff', 5, 9], [[1399.45, 3.0, -3.7], t > T.green ? '#3dff7a' : '#ff3a2a', 3, 4]]);
  // the door slides shut from the left
  const sh = eio(seg(t, T.shut0, T.shut1));
  const bang = [T.bang1, T.bang2, T.bang3].reduce((a, b) => a + (t > b ? Math.exp(-(t - b) * 14) * Math.sin((t - b) * 70) : 0), 0);
  SETS.wtDoor.position.set(lerp(-1.75, 0, sh), 0, -4.32 + bang * .02);
  const g2 = t > T.green;
  SETS.doorLampM.emissive.set(g2 ? '#3dff7a' : '#ff2a1a'); SETS.doorLampM.color.set(g2 ? '#0a3a18' : '#3a1010');
  SETS.sealM.emissiveIntensity = g2 ? 1.4 : 0; SETS.sealM.color.set(g2 ? '#3dff7a' : '#3a4a40');
  SETS.btn.position.x = -.08 + (t > T.button && t < T.button + .25 ? .05 : 0);
  // the trio on our side
  const slam = t > T.button - .35 && t < T.button + .5;
  place(C.you, 1400.85, 0, -2.75, slam ? Math.PI / 2 + .25 : Math.PI - .25); pose(C.you, { t, reachR: slam ? 1.15 : null, nod: .1, lean: slam ? .1 : (t > T.door2 ? -.05 : 0), armsUp: t > T.door2 + .2 ? .0 : 0 });
  if (slam) C.you.armR.rotation.z = -.1;
  place(C.marco, 1399.55, 0, -1.9, Math.PI + .1); pose(C.marco, { t, armsFwd: t > T.bang1 && t < T.green ? .5 : 0, lean: t > T.bang1 && t < T.green ? -.1 : 0, nod: .05, armsUp: t > T.door2 ? .35 * seg(t, T.door2, T.door2 + .3) : 0 });
  place(C.cat, 1400.15, 0, -1.6, Math.PI * .5 + .4); catPose(C.cat, t, { arch: t > T.bang1 && t < T.green + .5 ? .3 : 0, tailUp: 1, yaw: .4, hop: t > T.bang1 && t < T.bang1 + .3 ? .2 * Math.sin(seg(t, T.bang1, T.bang1 + .3) * Math.PI) : 0 });
  // zombies sprint up the corridor; the first ends with its face squashed against the window
  DOORZ.forEach(([z0, lane, dl], i) => {
    const P = C.z[i]; const t0 = T.button - .9 + dl;
    const z = Math.min(-4.95 - i * .35, z0 + Math.max(0, t - t0) * 4.6);
    if (t < CUT[3] + 1.2) return;
    place(P, 1400 + lane * (z > -6.5 ? .4 : 1), 0, z, 0);
    const arrived = z >= -4.95 - i * .35 - .01;
    pose(P, { t, phase: t * 9 + i, walk: arrived ? 0 : .9, armsFwd: 1, lean: arrived ? .22 : .3, nod: arrived ? -.1 : .2, tilt: .2 * Math.sin(i * 2), armsUp: arrived ? .25 * Math.abs(Math.sin(t * 6 + i)) : 0 });
    if (i === 0 && arrived) { P.root.position.set(1400, -.22, -5.45); P.head.scale.set(1.04, 1, .82); P.mouth.scale.set(1.1, 1.4, 1); }
  });
  shake = (t > T.bang1 && t < T.bang3 + .4) ? .01 * Math.abs(bang) * 3 + .004 : 0;
  if (t < T.bang1) {
    const u = eio(seg(t, CUT[3], T.bang1));
    setCam(V(1400.5, 2.0, 2.6).lerp(V(1400.4, 1.95, 1.4), u), V(1400, 1.55, -8).lerp(V(1400, 1.7, -6), u), 50, V(1400, 1.6, -4.2), 150);
  } else if (t < T.door2) {
    const u = eio(seg(t, T.bang1, T.door2));
    setCam(V(1400.3, 2.15, -1.9).lerp(V(1400.15, 2.12, -2.4), u), V(1400, 1.98, -4.4), 46, V(1400, 2.08, -4.3), 60);
  } else {
    const u = eio(seg(t, T.door2, CUT[4]));
    setCam(V(1401.0, 2.2, 1.3).lerp(V(1400.8, 2.2, .6), u), V(1400, 1.7, -4), 50, V(1400.2, 1.6, -2.4), 150);
  }
}
function sSunrise(t) {
  SETS.bridge.visible = SETS.outside.visible = true; SETS.sunSky.visible = SETS.sun.visible = true; SETS.coast.visible = true;
  SETS.nightSky.visible = SETS.nightSkyB.visible = false; SETS.seaM.color.set('#5a6f9a');
  const L = look('sunrise'); aimKey(V(600, 0, -1), L, 12);
  shipMotion(t, .4);
  points([[[600, 3, -6], '#ffb070', 14, 18], [[600, 4.4, 2], '#ffe0c0', 4, 12]]);
  const pov = t > T.pov;
  const up = eio(seg(t, T.binoc, T.binoc + .7));
  place(C.you, 600, 0, -1.95, Math.PI); pose(C.you, { t, armsFwd: .95, nod: -.05 });
  C.you.armL.rotation.z = -.35; C.you.armR.rotation.z = .35;
  place(C.marco, 601.35, 0, -2.4, Math.PI - .1); pose(C.marco, { t, nod: -.1 * up });
  for (const [a, s] of [[C.marco.armL, -1], [C.marco.armR, 1]]) { a.rotation.x = lerp(0, -2.55, up); a.rotation.z = lerp(s * .12, -s * .55, up); }
  SETS.binoc.visible = up > .7;
  place(C.cat, 598.6, 1.3, -3.4, Math.PI * .5 - .1); catPose(C.cat, t, { tailUp: .6, tilt: -.1, yaw: Math.sin(t * .5) * .2 });
  shake = 0;
  if (!pov) {
    const u = eio(seg(t, CUT[4], T.pov));
    setCam(V(603.6, 2.5, 2.6).lerp(V(603.2, 2.5, 1.9), u), V(599.6, 2.6, -6).lerp(V(600.0, 2.7, -6), u), 50, V(601.3, 2.5, -2.4), 140);
  } else {
    const u = seg(t, T.pov, CUT[5]);
    const wob = V(Math.sin(t * 1.7) * .8 + Math.sin(t * 4.1) * .25, Math.sin(t * 2.3) * .5, 0);
    const tg = V(lerp(588, 626, eio(seg(t, T.pov, T.pov + 2.6))), -4.5, -330).add(wob);
    setCam(V(600.5, 3.0, -3.0), tg, lerp(8, 6.8, eio(u)), tg, 0);
  }
}
function sLower(t) {
  SETS.hull.visible = SETS.hullOut.visible = true; SETS.boat.visible = true;
  const L = look('morning'); aimKey(V(2200, 6, 1), L, 18);
  points([[[2203, 4, 8], '#ffe0c0', 6, 20]]);
  const by = lerp(13.6, -.3, eio(seg(t, T.lower0, T.splash))) + (t > T.splash ? Math.sin((t - T.splash) * 5) * .12 * Math.exp(-(t - T.splash) * 1.5) : 0);
  const sway = t < T.splash ? Math.sin(t * 2.1) * .05 : Math.sin(t * 1.6) * .04;
  SETS.boat.position.set(2200, by, 2.3); SETS.boat.rotation.set(sway, 0, Math.sin(t * 1.3) * .03);
  SETS.boat.updateMatrixWorld(true);
  SETS.cables.forEach((c, i) => { c.visible = true; stretch(c, SETS.davTips[i], SETS.boat.localToWorld(SETS.hooks[i].clone())); });
  place(C.you, -.6, .85, 0, Math.PI / 2, SETS.boat); pose(C.you, { t, sit: true, nod: t < T.splash ? .35 : -.1, armsUp: t > T.splash + .3 ? .5 * seg(t, T.splash + .3, T.splash + .7) : 0, yaw: -.3 });
  place(C.marco, .8, .85, 0, Math.PI / 2, SETS.boat); pose(C.marco, { t, sit: true, armX: -.5, nod: -.4, yaw: .2 });
  place(C.cat, 1.9, .85, 0, .3, SETS.boat); C.cat.root.scale.setScalar(1.25 / 1); catPose(C.cat, t, { tailUp: 1, tilt: .3, yaw: -.4 });
  // zombies crowd the rail above, reaching down
  for (let i = 0; i < 12; i++) {
    const P = C.z[i], x = -6.5 + i * 1.15 + (hash(i) - .5) * .4;
    place(P, 2200 + x, 16.15, .25 + hash(i + 2) * .3, (hash(i + 5) - .5) * .5);
    pose(P, { t, armsFwd: 1, lean: .45 + .1 * Math.sin(t * 3 + i), nod: .5, tilt: .3 * Math.sin(i * 2.1), armX: -.3 + .3 * Math.sin(t * 5 + i) });
  }
  // splash ripples
  SETS.ripples.forEach((r, i) => { const k = (t - T.splash - i * .12); r.visible = k > 0 && k < 2.5; if (!r.visible) return; r.position.set(2200 + (i % 2 ? 1.8 : -1.8) * (i % 3 ? 1 : .2), .02, 2.3); r.scale.setScalar(.4 + k * 1.8); r.material.opacity = .7 * (1 - k / 2.5); });
  shake = t > T.splash && t < T.splash + .3 ? .03 : 0;
  const u = eio(seg(t, CUT[5], CUT[6]));
  const lk = V(2200, Math.max(by + 1.8, 2.5) + lerp(3, 0, u), 1.5);
  setCam(V(2203.0, 1.3, 15.5).lerp(V(2202.2, 1.0, 12.8), u), lk, 54, V(2200, by + 1, 2.3), 140);
}
function sHarbour(t) {
  SETS.harb.visible = true; SETS.boat.visible = true;
  const L = look('harbour'); aimKey(V(3000, 0, -20), L, 30);
  points([[[3000, 6, -8], '#c8d2e0', 3, 20]]);
  const bz = lerp(-3, -14, seg(t, CUT[6], CUT[7] + 1)) ;
  SETS.boat.position.set(3000, -.15 + Math.sin(t * 1.5) * .05, bz); SETS.boat.rotation.set(Math.sin(t * 1.2) * .02, Math.PI / 2, Math.sin(t * 1.4) * .025);
  SETS.buoys.forEach((b, i) => b.position.y = .05 + Math.sin(t * 1.6 + i) * .08);
  place(C.you, -.9, .85, .45, Math.PI / 2, SETS.boat); pose(C.you, { t, sit: true, nod: -.05, yaw: t > T.dark ? .25 * Math.sin((t - T.dark) * .8) : 0 });
  place(C.marco, .2, .85, -.45, Math.PI / 2, SETS.boat); pose(C.marco, { t, sit: true, nod: -.1, yaw: t > T.dark + .5 ? -.3 : 0, armX: -.4 });
  // the cat on the stern, looking ahead; then it turns round and looks straight at us
  const tu = eio(seg(t, T.turn, T.turn + 1.2));
  place(C.cat, -2.0, .95, .05, lerp(0, Math.PI - 1.4, tu), SETS.boat);
  catPose(C.cat, t, { yaw: lerp(0, 1.4, eio(seg(t, T.turn + .3, T.turn + 1.3))), tilt: lerp(-.05, .12, tu), tailUp: lerp(1, -.3, tu), nod: 0 });
  shake = 0;
  SETS.boat.updateMatrixWorld(true);
  const catW = C.cat.head.getWorldPosition(V(0, 0, 0));
  const u = eio(seg(t, CUT[6], T.turn)), u2 = eio(seg(t, T.turn, CUT[7]));
  const p1 = V(3000.6, 2.4, bz + 6.4).lerp(V(3000.4, 2.2, bz + 5.0), u);
  const p2 = V(catW.x + .15, catW.y + .1, catW.z + 1.9);
  const a1 = V(3000, 3.2, bz - 40), a2 = catW.clone();
  setCam(p1.lerp(p2, u2), a1.lerp(a2, u2), lerp(50, 42, u2), V(catW.x, catW.y, catW.z).lerp(V(3000, 2, bz - 40), 1 - u2), lerp(80, 60, u2));
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
  o2.font = '52px "Lilita One"'; const tw = o2.measureText(title).width; const bw = Math.min(1020, tw + 170), bx = (W - bw) / 2, by = 64, bh = 92;
  o2.fillStyle = 'rgba(0,0,0,.35)'; rr(bx + 6, by + 8, bw, bh, 22); o2.fill();
  o2.fillStyle = '#e0312b'; rr(bx, by, bw, bh, 22); o2.fill();
  o2.lineWidth = 5; o2.strokeStyle = '#ffffff'; rr(bx + 8, by + 8, bw - 16, bh - 16, 16); o2.stroke();
  let fs = 52; if (tw > bw - 170) fs = 52 * (bw - 170) / tw;
  o2.font = `${fs}px "Lilita One"`; o2.fillStyle = '#fff'; o2.textAlign = 'center'; o2.textBaseline = 'middle'; o2.fillText(title, W / 2, by + bh / 2 + 3);
  const w2 = o2.measureText(title).width; asterisk(W / 2 - w2 / 2 - 38, by + bh / 2, 15); asterisk(W / 2 + w2 / 2 + 38, by + bh / 2, 15);
  TX.push({ id: 'h1', text: title, x0: bx, y0: by, x1: bx + bw, y1: by + bh });
  const pw = 210, ph = 62, py = by + bh + 16;
  o2.fillStyle = 'rgba(0,0,0,.3)'; rr(W / 2 - pw / 2 + 4, py + 6, pw, ph, 18); o2.fill();
  o2.fillStyle = '#fff3d6'; rr(W / 2 - pw / 2, py, pw, ph, 18); o2.fill();
  o2.font = '46px "Lilita One"'; o2.fillStyle = INK; o2.fillText('PART 4', W / 2, py + ph / 2 + 3);
  TX.push({ id: 'h2', text: 'PART 4', x0: W / 2 - pw / 2, y0: py, x1: W / 2 + pw / 2, y1: py + ph });
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
const HOT = new Set(['ZOMBIE', 'APOCALYPSE', 'ENGINES...', 'BRIDGE.', 'ALL', 'FIRE', 'HOSES,', 'WEAPONS.', 'WATER', 'CROWD.', 'ONE.', 'SEAL', 'DECKS', 'DOOR', 'LESS', 'LAND.', 'LIFEBOAT', 'SMALLER', 'THERE', 'LIFEBOAT.', 'TOGETHER,', 'HARBOUR', 'LIGHT', 'OUT.']);
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
    TX.push({ id: 'cap', text: c.text.toUpperCase(), x0: W / 2 - tot / 2, y0: y - fs / 2, x1: W / 2 + tot / 2, y1: y + fs / 2 });
  }
}
// binocular mask: two overlapping circles
function binocMask(t) {
  const k = eo(seg(t, T.pov, T.pov + .25));
  const r = 330 * (1.4 - .4 * k), cy = 900;
  o2.save(); o2.fillStyle = '#05060a'; o2.beginPath(); o2.rect(0, 0, W, H);
  o2.moveTo(W / 2 - 170 + r, cy); o2.arc(W / 2 - 170, cy, r, 0, Math.PI * 2);
  o2.moveTo(W / 2 + 170 + r, cy); o2.arc(W / 2 + 170, cy, r, 0, Math.PI * 2);
  o2.fill('evenodd');
  // fill the lens overlap so it isn't punched back to black
  o2.globalCompositeOperation = 'destination-out'; o2.beginPath(); o2.arc(W / 2 - 170, cy, r, 0, 7); o2.fill(); o2.beginPath(); o2.arc(W / 2 + 170, cy, r, 0, 7); o2.fill();
  o2.globalCompositeOperation = 'source-over';
  const gr = o2.createRadialGradient(W / 2, cy, r * .6, W / 2, cy, r * 1.25); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
  o2.fillStyle = gr; o2.beginPath(); o2.arc(W / 2 - 170, cy, r, 0, 7); o2.arc(W / 2 + 170, cy, r, 0, 7); o2.fill();
  o2.restore();
}
function endCard(t) {
  o2.fillStyle = '#0d0f18'; o2.fillRect(0, 0, W, H);
  const s = back((t - CUT[7] - .25) / .25, 2);
  if (t < CUT[7] + .25) return;
  o2.save(); o2.translate(W / 2, 960); o2.scale(s, s);
  o2.font = '190px "Lilita One"'; o2.textAlign = 'center'; o2.textBaseline = 'middle';
  o2.fillStyle = 'rgba(0,0,0,.6)'; o2.fillText('PART 5?', 8, 14);
  o2.lineWidth = 18; o2.strokeStyle = '#e0312b'; o2.lineJoin = 'round'; o2.strokeText('PART 5?', 0, 0);
  o2.fillStyle = '#ffffff'; o2.fillText('PART 5?', 0, 0);
  o2.restore();
  TX.push({ id: 'e1', text: 'PART 5?', x0: 200, y0: 850, x1: 880, y1: 1070 });
}

// ---------- events (sound) ----------
function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push(Object.assign({ t: +t.toFixed(3), type }, o));
  for (const [id, t] of Object.entries(VO)) ev(t, 'voice', { id });
  ev(0, 'amb', { name: 'bridge', t1: CUT[1] }); ev(CUT[1], 'amb', { name: 'deck', t1: CUT[3] }); ev(CUT[3], 'amb', { name: 'corr', t1: CUT[4] });
  ev(CUT[4], 'amb', { name: 'sea', t1: CUT[5] }); ev(CUT[5], 'amb', { name: 'hull', t1: CUT[6] }); ev(CUT[6], 'amb', { name: 'harbour', t1: CUT[7] });
  CLOCK.slice(1).forEach(([t]) => ev(t, 'tick'));
  ev(T.peep, 'groan', { p: .8, g: .35 });
  for (let t = CUT[1] + .1; t < T.blast; t += .5) ev(t, 'shuffle', { g: .5 });
  for (const t of [CUT[1] + .4, CUT[1] + 1.8, CUT[1] + 2.9, CUT[2] + 1.2, CUT[2] + 2.6]) ev(t, 'groan', { p: .8 + hash(t) * .4, g: .5 });
  ev(T.open, 'cabinet'); ev(T.pull, 'reel', { t1: T.hand }); ev(T.hand, 'grab'); ev(T.blast - .1, 'valve');
  ev(T.blast, 'jet', { t1: CUT[3] });
  for (let i = 0; i < HOSEZ.length; i++) ev(T.blast + .15 + i * .19, 'thud', { g: .7 + hash(i) * .3, p: .8 + hash(i + 3) * .4 });
  for (let i = 0; i < 4; i++) ev(T.blast + .3 + i * .45, 'groan', { p: 1.2 + hash(i) * .3, g: .4 });
  ev(T.blast + 2.4, 'meow', { p: 1.15 });
  ev(T.button, 'button'); ev(T.shut0, 'hiss', { t1: T.shut1 }); ev(T.shut1, 'doorclang');
  for (let t = T.button - .8; t < T.shut1; t += .22) ev(t, 'run', { g: .5 });
  ev(T.button + .2, 'groan', { p: 1.1, g: .6 });
  for (const b of [T.bang1, T.bang2, T.bang3]) ev(b, 'bang');
  ev(T.bang1 + .1, 'groan', { p: .9, g: .6 }); ev(T.green, 'ding'); ev(T.green + .3, 'exhale');
  for (const g of [29.0, 31.4, 36.9]) ev(g, 'gull', { p: .9 + hash(g) * .3 });
  ev(T.binoc + .2, 'grab'); ev(T.pov, 'focus');
  ev(T.lower0, 'winch', { t1: T.splash });
  for (let i = 0; i < 5; i++) ev(T.lower0 + .4 + i * 1.6 + hash(i) * .5, 'groan', { p: .8 + hash(i + 7) * .4, g: .35 });
  ev(T.splash, 'splash'); ev(T.splash + .4, 'gull', { p: 1.1 });
  ev(T.dark, 'drop'); ev(T.turn + .4, 'creak');
  ev(CUT[7], 'cutoff'); ev(CUT[7] + .25, 'endhit');
  return E.sort((a, b) => a.t - b.t);
}

// ---------- render ----------
const SCENES = [sBridgeNight, sClimb, sHose, sDoor, sSunrise, sLower, sHarbour];
const SETKEYS = ['bridge', 'outside', 'coast', 'stair', 'stairOut', 'corr', 'hull', 'hullOut', 'harb'];
function render(t) {
  tNow = t; TX = [];
  const i = sceneAt(t);
  o2.clearRect(0, 0, W, H);
  if (i < 7) {
    for (const k of SETKEYS) SETS[k].visible = false;
    hideAll();
    SCENES[i](t);
    post.composer.render();
    const since = t - CUT[i];
    if (i > 0 && since < .05) { o2.fillStyle = 'rgba(255,255,255,.5)'; o2.fillRect(0, 0, W, H); }
    if (i === 4 && t > T.pov) binocMask(t);
    captions(t);
  } else endCard(t);
  header(t);
}
window.render = render; window.DUR = DUR; window.EV = events();
window.TEXTS = t => { render(t); return TX.slice(); };
await document.fonts.load('52px "Lilita One"');
CAPS = await (await fetch('caps.json')).json();
render(0);
window.READY = true;
