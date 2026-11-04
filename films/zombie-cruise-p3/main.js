// ZOMBIE APOCALYPSE ON A CRUISE SHIP · PART 3 — Chunky 3D Cartoon, 1080x1920. render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eio, eo, ei, back, hash, V, rbox, sph, cap, cyl, cone, tor, mat, glow, mesh, grp, person, pose, cat, catPose, SKIN } from './kit3d.js';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const AO = Q.get('ao') !== '0';

// ---------- timeline ----------
const DUR = 54.4;
const CUT = [0, 8.6, 17.4, 28.4, 37.0, 46.4, 51.8];
const CLOCK = [[0, 'DAY 2 • 2:10 PM'], [8.6, 'DAY 2 • 2:18 PM'], [17.4, 'DAY 2 • 2:26 PM'], [28.4, 'DAY 2 • 2:39 PM'],
               [37.0, 'DAY 2 • 2:51 PM'], [46.4, 'DAY 2 • 2:52 PM']];
const VO = { l01: 0.2, l02: 5.3, l03: 9.0, l04: 12.3, l05: 17.7, l06: 20.5, l07: 25.4, l08: 28.8, l09: 31.4, l10: 37.3, l11: 40.4, l12: 43.5, l13: 47.0 };
const T = { flash1: 1.5, flash2: 4.3, flash3: 7.4,
            peek: 12.1,
            slip: 20.6, catch: 23.3, tiptoe: 25.4,
            click: 28.5, hatch: 33.25, hand: 33.8, around: 35.0,
            sw1: 40.5, sw2: 40.8, sw3: 41.1, lever: 41.85, start: 42.4, lights: 42.9,
            snap: 48.4, lurch: 49.2 };
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
const ptl = []; for (let i = 0; i < 5; i++) { const p = new THREE.PointLight('#ffcf80', 0, 30, 1.6); scene.add(p); ptl.push(p); }
// the torch: a spot from your hand + a faint additive beam cone
const torch = new THREE.SpotLight('#fff1cf', 0, 30, .34, .45, 1.2); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); torch.shadow.bias = -.0005;
scene.add(torch); scene.add(torch.target);
const beamGeo = new THREE.ConeGeometry(1, 1, 32, 1, true); beamGeo.translate(0, -.5, 0);
const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
scene.add(beam);

// ---------- sets ----------
const SETS = {};
const white = mat('#f4f1ea'), whiteW = mat('#fbf6ec');
const steelM = mat('#9aa3ad', { metalness: .5, roughness: .4 }), dark = mat('#1b1d2a');
function skyPlane(parent, x, y, z, w, h, stops) {
  const sc = document.createElement('canvas'); sc.width = 16; sc.height = 256; const k = sc.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 256); stops.forEach(([o, c]) => gr.addColorStop(o, c));
  k.fillStyle = gr; k.fillRect(0, 0, 16, 256); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: st, fog: false }), x, y, z, parent, { cast: false, receive: false });
}
function sign(text, w, h, bg, fg, px = 90) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const k = c.getContext('2d');
  k.fillStyle = bg; k.fillRect(0, 0, c.width, c.height); k.fillStyle = fg; k.font = `${px}px "Lilita One"`; k.textAlign = 'center'; k.textBaseline = 'middle';
  k.fillText(text, c.width / 2, c.height / 2 + 4);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tx, roughness: .6 });
}
// a line of cylinder between two points
function rod(a, b, r, m, parent) {
  const d = b.clone().sub(a), L = d.length();
  const o = mesh(cyl(r, r, L), m, 0, 0, 0, parent);
  o.position.copy(a).add(b).multiplyScalar(.5);
  o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  return o;
}

// BRIDGE in the storm at x=600
{
  const g = grp(scene, 600, 0, 0); SETS.bridge = g;
  mesh(rbox(20, .4, 14, .1), mat('#46546a'), 0, -.2, 0, g);
  mesh(rbox(20, 1.7, .8, .1), mat('#e9edf2'), 0, .85, -5, g);
  mesh(rbox(20, .6, 14, .1), mat('#e9edf2'), 0, 6.3, 0, g);
  for (let x = -9; x <= 9; x += 3) mesh(rbox(.28, 4.4, .28, .08), mat('#e9edf2'), x, 3.9, -5, g);
  mesh(rbox(9, 1.3, 1.6, .2), mat('#dfe4ea'), 0, .65, -3.7, g);
  for (let i = 0; i < 4; i++) mesh(rbox(1.5, .9, .1, .06), glow(i % 2 ? '#5fe0ff' : '#7dffb5', .9), -3 + i * 2, 1.65, -4.1, g, { rx: -.5, cast: false });
  const wh = grp(g, 0, 1.9, -2.85); mesh(tor(.55, .07), mat('#a8744a'), 0, 0, 0, wh); for (let i = 0; i < 4; i++) mesh(cyl(.04, .04, 1.1), mat('#a8744a'), 0, 0, 0, wh, { rz: i * Math.PI / 4 }); mesh(cyl(.08, .08, .6), mat('#7b8794'), 0, -.5, 0, wh);
  const out = grp(scene, 600, 0, -40); SETS.outside = out;
  SETS.stormSky = skyPlane(out, 0, 30, -60, 400, 120, [[0, '#1d1f36'], [.45, '#3b3a5c'], [.75, '#6a5f80'], [1, '#9a8a9c']]);
  SETS.sea = mesh(new THREE.PlaneGeometry(400, 200), mat('#2f4560', { roughness: .15 }), 0, -6, 20, out, { rx: -Math.PI / 2, cast: false });
  // storm clouds: dark lumpy wall
  const cm = mat('#3d3f5e', { roughness: 1 }), cm2 = mat('#2a2c45', { roughness: 1 });
  for (let i = 0; i < 26; i++) { const x = -60 + i * 4.8 + hash(i) * 3, y = 6 + hash(i + 9) * 9, r = 5 + hash(i + 3) * 5;
    mesh(sph(r, 18, 12), i % 3 ? cm : cm2, x, y, -30 - hash(i + 5) * 10, out, { s: [1.3, .7, 1], cast: false, receive: false }); }
  // lightning bolt (zigzag)
  const bolt = grp(out, 6, 0, -26); SETS.bolt = bolt; const bm = glow('#e8ecff', 4);
  let p = V(0, 12, 0); for (let i = 0; i < 7; i++) { const q = p.clone().add(V((hash(i * 3.1) - .5) * 3, -2.2, 0)); rod(p, q, .12, bm, bolt); p = q; }
  // rain streaks just outside the windows
  SETS.rain = []; const rm = new THREE.MeshBasicMaterial({ color: '#c9d6ee', transparent: true, opacity: .45, fog: false });
  for (let i = 0; i < 90; i++) { const r = mesh(cyl(.012, .012, .7, 5), rm, 0, 0, 0, g, { cast: false, receive: false, rz: .12 }); SETS.rain.push(r); }
}
// CREW CORRIDOR at x=200 (runs along -z); the passenger corridor is behind the left wall
{
  const g = grp(scene, 200, 0, 0); SETS.corr = g;
  const wallM = mat('#b8c2c4'), lino = mat('#6f7f70', { roughness: .5 });
  mesh(rbox(3.2, .2, 32, .05), lino, 0, -.1, -8, g);
  mesh(rbox(3.4, .2, 32, .05), mat('#4f5660'), 0, 3.55, -8, g);
  mesh(rbox(.2, 3.6, 32, .05), wallM, 1.7, 1.75, -8, g);
  mesh(rbox(.2, 3.6, 13.35, .05), wallM, -1.7, 1.75, .325 + .5, g);
  mesh(rbox(.2, 3.6, 16.35, .05), wallM, -1.7, 1.75, -14.825, g);
  mesh(rbox(.2, .7, 1.3, .03), wallM, -1.7, 3.15, -6, g);
  // green stripe + kick plates
  for (const x of [-1.58, 1.58]) mesh(rbox(.02, .12, 32, .01), mat('#2f9e5b'), x, 1.05, -8, g, { cast: false });
  // the door (a window in it)
  const dm = mat('#ffd23f');
  mesh(rbox(.12, 1.55, 1.3, .03), dm, -1.6, .775, -6, g);
  mesh(rbox(.12, .55, 1.3, .03), dm, -1.6, 2.525, -6, g);
  for (const s of [-1, 1]) mesh(rbox(.12, .72, .3, .02), dm, -1.6, 1.9, -6 + s * .5, g);
  mesh(tor(.38, .06), steelM, -1.53, 1.9, -6, g, { ry: Math.PI / 2 });
  mesh(rbox(.04, .09, .3, .02), mat('#3a3a3a'), -1.52, 1.15, -5.6, g);
  const sm = sign('CREW ONLY', 1.4, .36, '#e0312b', '#ffffff', 92);
  mesh(new THREE.PlaneGeometry(1.4, .36), sm, -1.585, 3.1, -6, g, { ry: Math.PI / 2, cast: false });
  // pipes on the right wall and the ceiling
  const pr = mat('#c0392b', { roughness: .4 }), pw = mat('#d8d2c4', { roughness: .4 });
  mesh(cyl(.1, .1, 32), pr, 1.42, 3.0, -8, g, { rx: Math.PI / 2 });
  mesh(cyl(.07, .07, 32), pw, 1.45, 2.65, -8, g, { rx: Math.PI / 2 });
  mesh(cyl(.13, .13, 32), mat('#7b8794', { metalness: .4 }), .6, 3.25, -8, g, { rx: Math.PI / 2 });
  for (let z = 4; z > -24; z -= 3) mesh(rbox(.1, .5, .1, .03), mat('#5a6270'), 1.5, 2.85, z, g);
  // emergency lamps
  SETS.lamps = [];
  for (const z of [1, -5, -11, -17]) { const l = mesh(rbox(.4, .14, .25, .05), glow('#ff3a2a', 2.2), 0, 3.38, z, g, { cast: false }); SETS.lamps.push(l); }
  // the passenger corridor beyond the wall: carpet, cream wall, sconces, frames
  mesh(rbox(4, .2, 32, .05), mat('#9e2f43', { roughness: .9 }), -3.7, -.1, -8, g);
  mesh(rbox(.2, 3.6, 32, .05), mat('#f0e2c8'), -5.3, 1.75, -8, g);
  for (let z = 2; z > -22; z -= 4) { mesh(sph(.14), glow('#ffd58a', 2), -5.15, 2.4, z, g, { cast: false }); mesh(rbox(.05, .7, .9, .02), mat(['#2f9e8f', '#d9a441', '#7a5ab5'][Math.abs(z) % 3]), -5.17, 1.7, z - 2, g, { cast: false }); }
  mesh(rbox(4, .2, 32, .05), mat('#e8dcc4'), -3.7, 3.55, -8, g);
}
// STEEL STAIRS at x=1400 (descend toward +x)
{
  const g = grp(scene, 1400, 0, 0); SETS.stairs = g;
  const grate = mat('#8d97a3', { metalness: .55, roughness: .45 }), yel = mat('#ffd23f');
  for (let i = 0; i < 14; i++) {
    for (let b = 0; b < 5; b++) mesh(rbox(.08, .07, 1.8, .02), grate, i * .55 + .06 + b * .11, -i * .4 - .035, 0, g);
    mesh(rbox(.06, .075, 1.8, .02), yel, i * .55 + .03, -i * .4 - .03, 0, g, { cast: false });
    for (const z of [-.92, .92]) mesh(rbox(.55, .4, .06, .02), grate, i * .55 + .275, -i * .4 + .16 - .4, z, g);
  }
  mesh(rbox(3.2, .1, 1.8, .03), grate, -1.6, -.05, 0, g);
  mesh(rbox(3.4, .1, 1.8, .03), grate, 14 * .55 + 1.7, -14 * .4 - .05, 0, g);
  // stringers + handrails
  for (const z of [-.95, .95]) {
    rod(V(0, -.3, z), V(14 * .55, -14 * .4 - .3, z), .07, grate, g);
    rod(V(-.2, 1.0, z), V(14 * .55, -14 * .4 + 1.0, z), .05, mat('#ffd23f'), g);
    for (let i = 0; i <= 14; i += 2) mesh(cyl(.035, .035, 1.0), grate, i * .55, -i * .4 + .5, z, g);
  }
  // the shaft wall behind: painted steel, rivets, deck stencil
  const wm = mat('#4c5d74');
  mesh(rbox(26, 20, .3, .05), wm, 3.5, -4, -1.8, g);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 22; c++) mesh(sph(.05, 8, 6), mat('#5e7088'), -7 + c * 1.0, 5 - r * 2.2, -1.62, g, { cast: false });
  for (let r = 0; r < 9; r++) mesh(rbox(26, .05, .05, .01), mat('#3e4c60'), 3.5, 5.6 - r * 2.2, -1.63, g, { cast: false });
  const st = sign('DECK 7', 1.8, .7, '#4c5d74', '#ffd23f', 150);
  mesh(new THREE.PlaneGeometry(1.8, .7), st, 1.4, 1.6, -1.63, g, { cast: false });
  mesh(cyl(.14, .14, 26), mat('#c0392b'), 3.5, -1.0, -1.45, g, { rz: Math.PI / 2 + .62 });
  mesh(cyl(.09, .09, 26), mat('#d8d2c4'), 3.5, -.4, -1.45, g, { rz: Math.PI / 2 + .62 });
  // caged lamps
  SETS.stairLamps = [mesh(sph(.16), glow('#ffd9a0', 2.5), -.6, 2.6, -1.4, g, { cast: false }), mesh(sph(.16), glow('#ff5a3a', 2.5), 7.6, -3.4, -1.4, g, { cast: false })];
  // far below: another landing in the dark
  mesh(rbox(14, .12, 4, .03), grate, 6, -12, 0, g);
}
// DARK PASSAGE at x=1800 (runs along -z, an open floor hatch at z=-6.5)
{
  const g = grp(scene, 1800, 0, 0); SETS.dark = g;
  const fl = mat('#5d6470', { roughness: .6 }), wl = mat('#6b7482'), hz = -6.5, hx = -.2, hs = .6;
  mesh(rbox(3.2, .2, 10, .03), fl, 0, -.1, hz + hs + 5, g);
  mesh(rbox(3.2, .2, 14, .03), fl, 0, -.1, hz - hs - 7, g);
  mesh(rbox(1.6 + hx - hs, .2, 2 * hs, .02), fl, (-1.6 + hx - hs) / 2, -.1, hz, g);
  mesh(rbox(1.6 - hx - hs, .2, 2 * hs, .02), fl, (1.6 + hx + hs) / 2, -.1, hz, g);
  mesh(rbox(2 * hs, 1.4, 2 * hs, .02), mat('#050507', { roughness: 1 }), hx, -.9, hz, g, { cast: false });
  // hazard edge round the hole
  for (const s of [-1, 1]) { mesh(rbox(2 * hs + .1, .03, .08, .01), mat('#ffd23f'), hx, .005, hz + s * (hs + .04), g, { cast: false }); mesh(rbox(.08, .03, 2 * hs + .1, .01), mat('#ffd23f'), hx + s * (hs + .04), .005, hz, g, { cast: false }); }
  // the lid, standing open on its far hinge
  const lid = grp(g, hx, 0, hz - hs); mesh(rbox(2 * hs, .08, 2 * hs, .02), mat('#7b8794', { metalness: .4 }), 0, 0, hs, lid); lid.rotation.x = -1.75;
  for (const x of [-1.7, 1.7]) mesh(rbox(.2, 3.6, 30, .05), wl, x, 1.75, -7, g);
  mesh(rbox(3.6, .2, 30, .05), mat('#3d434e'), 0, 3.55, -7, g);
  for (let z = 6; z > -22; z -= 2.4) for (const x of [-1.55, 1.55]) mesh(rbox(.05, 3.4, .12, .02), mat('#565e6a'), x, 1.75, z, g, { cast: false });
  mesh(cyl(.12, .12, 30), mat('#a33a2f'), 1.35, 3.0, -7, g, { rx: Math.PI / 2 });
  mesh(cyl(.08, .08, 30), mat('#c9c2b0'), -1.38, 2.8, -7, g, { rx: Math.PI / 2 });
  const st = sign('DECK 6', 1.2, .45, '#6b7482', '#ffd23f', 150); mesh(new THREE.PlaneGeometry(1.2, .45), st, 1.585, 2.2, -2.5, g, { ry: -Math.PI / 2, cast: false });
  // the arm reaching out of the hatch
  const arm = grp(g, hx + .1, -.9, hz + .05); SETS.zArm = arm;
  const zs = mat('#9fb38e'), sl = mat('#5d6b7a');
  mesh(cap(.12, .6), sl, 0, .3, 0, arm);
  const hand = grp(arm, 0, .78, 0); SETS.zHand = hand;
  mesh(sph(.14), zs, 0, 0, 0, hand, { s: [1, .8, .7] });
  SETS.zFingers = [];
  for (let i = 0; i < 4; i++) { const f = grp(hand, -.09 + i * .06, .08, .02); mesh(cap(.03, .12), zs, 0, .08, 0, f); SETS.zFingers.push(f); }
  mesh(cap(.03, .08), zs, .13, .02, .02, hand, { rz: -.9 });
}
// ENGINE ROOM at x=2200
{
  const g = grp(scene, 2200, 0, 0); SETS.eng = g;
  mesh(rbox(18, .2, 30, .05), mat('#4c5562', { roughness: .5 }), 0, -.1, -8, g);
  for (const x of [-1.6, 1.6]) mesh(rbox(.14, .02, 26, .01), mat('#ffd23f'), x, .005, -9, g, { cast: false });
  mesh(rbox(18, 10, .3, .05), mat('#3e4756'), 0, 5, -21, g);
  for (const x of [-9, 9]) mesh(rbox(.3, 10, 30, .05), mat('#3e4756'), x, 5, -8, g);
  mesh(rbox(18, .3, 30, .05), mat('#262b35'), 0, 9, -8, g);
  SETS.pistons = []; SETS.engBlocks = [];
  const ym = mat('#f2b31b', { roughness: .45 }), gm = mat('#7b8794', { metalness: .5, roughness: .35 }), rm = mat('#e0312b');
  for (const x of [-3.6, 3.6]) {
    const e = grp(g, x, 0, -10); SETS.engBlocks.push(e);
    mesh(rbox(3.4, 2.6, 10, .25), ym, 0, 1.3, 0, e);
    mesh(rbox(3.6, .3, 10.4, .1), mat('#3a4150'), 0, .15, 0, e);
    for (let k = 0; k < 5; k++) { const pg = grp(e, 0, 2.6, -4 + k * 2); mesh(cyl(.5, .5, 1.0), gm, 0, .5, 0, pg); mesh(sph(.36), rm, 0, 1.05, 0, pg, { s: [1, .5, 1] }); SETS.pistons.push(pg); }
    mesh(cyl(.25, .25, 5.4), gm, x > 0 ? -1.2 : 1.2, 6.2, -2, g);
    rod(V(x * .66, 3.6, -4), V(x * .66, 8.8, -4), .3, mat('#c9c2b0'), g);
    for (let k = 0; k < 4; k++) mesh(sph(.12), glow('#7dffb5', 1.2), x + (x > 0 ? -1.71 : 1.71), 1.9, -13 + k * 2, g, { cast: false });
  }
  // catwalk on the back wall
  mesh(rbox(16, .15, 1.6, .03), gm, 0, 4.2, -19.8, g);
  for (let x = -7.5; x <= 7.5; x += 1.5) mesh(cyl(.04, .04, 1.0), gm, x, 4.7, -19.0, g);
  mesh(cyl(.05, .05, 16), mat('#ffd23f'), 0, 5.2, -19.0, g, { rz: Math.PI / 2 });
  // ceiling lamps (switch on in a row)
  SETS.engLamps = [];
  for (const z of [-3, -9, -15]) for (const x of [-3.6, 3.6]) {
    const m = new THREE.MeshStandardMaterial({ color: '#2c2f38', emissive: '#fff4d6', emissiveIntensity: 0, roughness: .5 });
    SETS.engLamps.push(mesh(rbox(1.8, .16, .7, .05), m, x, 8.7, z, g, { cast: false }));
  }
  // control panel near the camera
  const pn = grp(g, 0, 0, -1.6); SETS.panel = pn;
  mesh(rbox(2.6, 1.15, .9, .1), mat('#3a4150'), 0, .575, 0, pn);
  mesh(rbox(2.6, .1, .95, .04), mat('#2a2f3a'), 0, 1.2, 0, pn, { rx: .3 });
  SETS.toggles = []; SETS.tLamps = [];
  for (let i = 0; i < 3; i++) {
    const x = -.85 + i * .38;
    mesh(rbox(.24, .05, .24, .02), mat('#9aa3ad'), x, 1.27, .05, pn, { rx: .3, cast: false });
    const tg = grp(pn, x, 1.29, .06); tg.rotation.x = .3; mesh(cyl(.025, .025, .22), mat('#c9ced6', { metalness: .6 }), 0, .1, 0, tg); mesh(sph(.045), mat('#1b1d2a'), 0, .22, 0, tg); SETS.toggles.push(tg);
    const lm = new THREE.MeshStandardMaterial({ color: '#3a1010', emissive: '#ff2a1a', emissiveIntensity: .9, roughness: .4 });
    mesh(sph(.06), lm, x, 1.36, -.25, pn, { cast: false }); SETS.tLamps.push(lm);
  }
  mesh(rbox(.36, .2, .36, .05), mat('#2a2f3a'), .75, 1.3, 0, pn);
  const lv = grp(pn, .75, 1.38, 0); SETS.lever = lv;
  mesh(cyl(.05, .05, .7), mat('#c9ced6', { metalness: .6 }), 0, .35, 0, lv); mesh(sph(.12), mat('#e0312b', { roughness: .3 }), 0, .72, 0, lv);
  const gs = sign('START', .6, .2, '#2a2f3a', '#ffd23f', 130); mesh(new THREE.PlaneGeometry(.6, .2), gs, .75, 1.12, .46, pn, { cast: false });
}
// ATRIUM at x=3000: three balcony levels around the camera
{
  const g = grp(scene, 3000, 0, 0); SETS.atrium = g;
  mesh(rbox(26, .2, 26, .05), mat('#7a2f45', { roughness: .9 }), 0, -.1, -2, g);
  for (let r = -2; r <= 2; r++) mesh(rbox(26, .02, .12, .01), mat('#d9a441'), 0, .005, -2 + r * 3, g, { cast: false });
  mesh(rbox(26, 20, .4, .05), mat('#e8d6b4'), 0, 9, -9.8, g);
  const gold = mat('#d9a441', { metalness: .5, roughness: .3 });
  for (const y of [4, 8, 12]) {
    mesh(rbox(22, .5, 3, .1), mat('#f4ecd8'), 0, y, -8.2, g);
    mesh(rbox(22, .9, .16, .05), mat('#fbf6ec'), 0, y + .7, -6.75, g);
    mesh(cyl(.07, .07, 22), gold, 0, y + 1.18, -6.75, g, { rz: Math.PI / 2 });
    mesh(rbox(22, .14, .1, .03), gold, 0, y - .2, -6.68, g, { cast: false });
    for (let x = -8; x <= 8; x += 4) { mesh(rbox(1.3, 2.4, .1, .05), mat('#3a2a3a'), x + 2, y + 1.45, -9.55, g, { cast: false }); mesh(sph(.14), glow('#ffd58a', 2.2), x, y + 2.3, -9.55, g, { cast: false }); }
  }
  for (const x of [-7.5, 7.5]) mesh(cyl(.45, .45, 16), mat('#fbf6ec'), x, 8, -6.3, g);
  mesh(rbox(1.3, 2.4, .1, .05), mat('#3a2a3a'), -2, 1.2, -9.55, g, { cast: false });
  // hanging lamps over the floor
  SETS.hang = [];
  for (const x of [-3.5, 3.5]) { const h = grp(g, x, 16, -3); mesh(cyl(.02, .02, 6), dark, 0, -3, 0, h, { cast: false }); mesh(sph(.45, 20, 14), glow('#ffd58a', 1.6), 0, -6.2, 0, h, { cast: false }); SETS.hang.push(h); }
}

// ---------- cast ----------
const C = {};
const YOU = { shirt: '#ffc81e', pants: '#2f5aa8', hair: '#3b2416', hairStyle: 'short', skin: SKIN[1] };
C.you = person(YOU); scene.add(C.you.root);
C.marco = person({ shirt: '#ffffff', stripe: '#24356e', pants: '#24356e', hairStyle: 'cap', hat: '#24356e', skin: SKIN[3] }); scene.add(C.marco.root);
C.cat = cat(); scene.add(C.cat.root);
const ZC = ['#7a6a6a', '#5d6b7a', '#7a7058', '#6b5a72', '#5f7262', '#8a5a5a', '#5a6a8a'];
C.z = []; for (let i = 0; i < 19; i++) { const p = person({ zombie: true, shirt: ZC[i % ZC.length], pants: ['#4a4a52', '#3a4258', '#5a4a40'][i % 3], hair: ['#3a3a3a', '#5a4030', '#2a2a2a'][i % 3], hairStyle: ['short', 'none', 'bun', 'short'][i % 4] }); scene.add(p.root); C.z.push(p); }
// a torch in your right hand, a wrench for scene 3
SETS.torchM = mesh(cyl(.06, .05, .32), mat('#1b1d2a', { metalness: .3 }), 0, -.7, .12, C.you.armR, { rx: Math.PI / 2, cast: false });
SETS.torchLens = mesh(cyl(.07, .07, .03), glow('#fff3c4', 3), 0, -.7, .29, C.you.armR, { rx: Math.PI / 2, cast: false });
const wr = grp(scene); SETS.wrench = wr; wr.scale.setScalar(1.7);
mesh(rbox(.07, .5, .03, .015), mat('#c9ced6', { metalness: .7, roughness: .25 }), 0, 0, 0, wr);
mesh(new THREE.TorusGeometry(.08, .03, 8, 16, Math.PI * 1.4), mat('#c9ced6', { metalness: .7, roughness: .25 }), 0, .3, 0, wr, { rz: -Math.PI * .2 });
mesh(rbox(.08, .16, .04, .015), mat('#e0312b'), 0, -.2, 0, wr);

function place(P, x, y, z, ry = 0) { P.root.visible = true; P.root.position.set(x, y, z); P.root.rotation.set(0, ry, 0); }
function hideAll() { C.you.root.visible = C.marco.root.visible = C.cat.root.visible = false; C.z.forEach(p => p.root.visible = false);
  SETS.torchM.visible = SETS.torchLens.visible = false; SETS.wrench.visible = false; torch.intensity = 0; beam.visible = false; }
function zwalk(P, t, i, lunge = 0, w = .55) { const ph = t * 4.2 + i * 1.7; pose(P, { t, phase: ph + .4 * Math.sin(ph * .5), walk: w, armsFwd: 1, lean: .12 + lunge * .25, tilt: .35 * Math.sin(i * 2.1 + 1), yaw: .15 * Math.sin(t * 1.3 + i) }); }

// ---------- looks ----------
function look(name) {
  const L = {
    storm: { bg: '#2c2d48', fog: '#3a3a58', fd: .004, sky: '#a8b0d8', gnd: '#3a3f55', hi: 1.0, key: '#c8d0ff', ki: 1.3, kd: [-6, 10, -14], env: .45, exp: 1.0 },
    crew: { bg: '#140f12', fog: '#1a1214', fd: .035, sky: '#8a7a80', gnd: '#2a1e22', hi: .55, key: '#ffd0c0', ki: .5, kd: [2, 10, 4], env: .25, exp: 1.05 },
    metal: { bg: '#121722', fog: '#121722', fd: .03, sky: '#9fb0cc', gnd: '#2a2e3a', hi: .75, key: '#ffe0b8', ki: 1.2, kd: [-4, 9, 8], env: .35, exp: 1.0 },
    dark: { bg: '#05060b', fog: '#05060b', fd: .06, sky: '#4a5470', gnd: '#0a0b10', hi: .28, key: '#000000', ki: 0, kd: [0, 10, 5], env: .03, exp: 1.0 },
    engDark: { bg: '#0b0d14', fog: '#0b0d14', fd: .03, sky: '#5a6a90', gnd: '#141820', hi: .3, key: '#8aa0d0', ki: .35, kd: [-5, 12, 6], env: .08, exp: 1.0 },
    engOn: { bg: '#2a2f3a', fog: '#2a2f3a', fd: .012, sky: '#fff1d8', gnd: '#4a4f5a', hi: 1.1, key: '#fff0d8', ki: 1.8, kd: [-4, 14, 6], env: .45, exp: 1.0 },
    atrium: { bg: '#2b2235', fog: '#2b2235', fd: .018, sky: '#b9a6d6', gnd: '#3a2a3a', hi: .85, key: '#e8d8ff', ki: 1.3, kd: [4, 16, 10], env: .35, exp: 1.0 },
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
// torch from your hand toward a world target
function aimTorch(target, k = 1) {
  C.you.root.updateMatrixWorld(true);
  const p = SETS.torchLens.getWorldPosition(V(0, 0, 0));
  SETS.torchM.visible = SETS.torchLens.visible = true;
  torch.position.copy(p); torch.target.position.copy(target); torch.intensity = 38 * k;
  const d = target.clone().sub(p), L = Math.min(d.length(), 9);
  beam.visible = k > .01; beam.position.copy(p); beam.quaternion.setFromUnitVectors(V(0, -1, 0), d.normalize());
  const r = Math.tan(.3) * L; beam.scale.set(r, L, r); beam.material.opacity = .06 * k;
}

// ---------- camera ----------
let shake = 0, tNow = 0;
function setCam(pos, at, fov, focus, aper = 250, up = null) {
  const sx = shake ? Math.sin(tNow * 53) * shake : 0, sy = shake ? Math.cos(tNow * 47) * shake : 0;
  camera.up.copy(up || V(0, 1, 0));
  camera.position.copy(pos).add(V(sx, sy, 0)); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(at.clone().add(V(sx * .5, sy * .5, 0)));
  post.dof.focus = camera.position.distanceTo(focus || at); post.dof.aper = aper; post.dof.maxCoc = 7;
}

// ---------- scenes ----------
const flashK = t => [T.flash1, T.flash2, T.flash3].reduce((a, f) => a + (t > f ? Math.exp(-(t - f) * 9) * (1 + .6 * Math.sin((t - f) * 60)) : 0), 0);
function sStorm(t) {
  SETS.bridge.visible = SETS.outside.visible = true;
  const L = look('storm'); aimKey(V(600, 0, -2), L, 14);
  const fl = clamp(flashK(t), 0, 1.6);
  hemi.intensity = L.hi + fl * 2.2; SETS.stormSky.material.color.setScalar(1 + fl * 1.8);
  SETS.bolt.visible = fl > .25; SETS.bolt.position.x = t > T.flash3 ? -10 : (t > T.flash2 ? 4 : 14);
  points([[[600.5, 3.4, 3.5], '#ffe0c0', 3, 14], [[600, 2, -10], '#d8e0ff', fl * 60, 40]]);
  SETS.outside.position.x = 600 + t * .6;
  SETS.rain.forEach((r, i) => { const x = -9 + hash(i) * 18, z = -5.6 - hash(i + 40) * 2.5; const y = 6.5 - ((hash(i + 80) * 7 + t * 11) % 7); r.position.set(x - (6.5 - y) * .08, y, z); });
  // the three of you at the window, backs to us
  place(C.you, 600.85, 0, -1.9, Math.PI + .1); pose(C.you, { t, nod: -.1, yaw: t > T.flash2 ? .25 * eo(seg(t, T.flash2, T.flash2 + .4)) : 0, lean: -.05 * clamp(fl) });
  place(C.marco, 599.45, 0, -1.7, Math.PI - .1); pose(C.marco, { t, nod: -.08, armX: -.3 });
  place(C.cat, 600.2, 1.3, -3.55, Math.PI * .5 - .3); catPose(C.cat, t, { arch: fl > .3 ? .2 : 0, tailUp: t > T.flash1 ? 1 : 0, tilt: -.2 });
  shake = 0;
  const u = eio(seg(t, 0, CUT[1]));
  setCam(V(600.6, 2.8, 5.4).lerp(V(600.3, 2.7, 3.4), u), V(600.0, 3.3, -14).lerp(V(600.1, 3.1, -14), u), lerp(54, 50, u), V(600, 2.2, -2), 120);
}
function sCorr(t) {
  SETS.corr.visible = true;
  const L = look('crew'); aimKey(V(200, 0, -6), L, 12);
  const fl = .85 + .15 * Math.sin(t * 2.3);
  points([[[200, 3.2, 1], '#ff3a2a', 6 * fl, 9], [[200, 3.2, -5], '#ff3a2a', 6 * fl, 9], [[200, 3.2, -11], '#ff3a2a', 5 * fl, 9], [[196.4, 2.8, -6], '#ffcf90', 9, 6], [[196.4, 2.8, -1], '#ffcf90', 6, 6]]);
  // zombies shuffling past in the passenger corridor
  [[0, 196.6, 12.2, -11.5], [1, 195.6, 12.6, -13.5], [2, 196.9, 13.3, -15.5], [3, 196.0, 14.2, -14.5], [4, 196.7, 15.1, -16.5]].forEach(([i, x, t0, z0]) => {
    const p = C.z[i]; if (t < t0 - 1) return; place(p, x, 0, z0 + (t - t0 + 1) * 1.05, 0); zwalk(p, t, i, 0, .5); });
  if (t < T.peek) {
    // the trio walks toward camera down the crew corridor
    const z = lerp(-14, -6.4, seg(t, CUT[1], T.peek));
    place(C.marco, 199.5, 0, z, 0); pose(C.marco, { t, phase: t * 7, walk: .55, nod: .05 });
    place(C.you, 200.55, 0, z - 1.3, -.05); pose(C.you, { t, phase: t * 7 + 1.2, walk: .55, yaw: Math.sin(t * 1.4) * .3 });
    place(C.cat, 200.1, 0, z + 1.0, Math.PI * .5 - .1); catPose(C.cat, t, { hop: Math.abs(Math.sin(t * 9)) * .06, tailUp: 1 });
    const u = eio(seg(t, CUT[1], T.peek));
    shake = 0;
    setCam(V(200.3, 2.6, .5).lerp(V(200.4, 2.3, -1.2), u), V(200, 1.6, -10), 50, V(200, 1.8, z), 150);
  } else {
    // close: the porthole; you flat to the wall beside it, Marco behind; zombies pass on the other side
    place(C.you, 198.95, 0, -6.95, -Math.PI / 2 + .35); pose(C.you, { t, nod: .05, yaw: -.4 + .2 * Math.sin(t * .8), lean: .05, armX: -.2 });
    place(C.marco, 199.75, 0, -8.3, -Math.PI / 2 + .5); pose(C.marco, { t, nod: .1, armX: -.6, armXL: 0 });
    place(C.cat, 199.2, 0, -7.9, Math.PI * .5 + .6); catPose(C.cat, t, { tilt: -.2, yaw: .5, tailUp: .3 });
    const u = eio(seg(t, T.peek, CUT[2]));
    shake = 0;
    setCam(V(200.95, 1.95, -3.3).lerp(V(200.65, 1.95, -4.0), u), V(198.4, 1.85, -6.2), 46, V(198.4, 1.9, -6.0), 90);
  }
}
const stepX = s => s * .55 + .27, stepY = s => -(Math.floor(s) + eio(s - Math.floor(s))) * .4;
function sStairs(t) {
  SETS.stairs.visible = true;
  const L = look('metal'); aimKey(V(1403.5, -2, 0), L, 12);
  points([[[1399.4, 2.4, -1.0], '#ffd9a0', 9, 12], [[1407.6, -3.6, -1.0], '#ff5a3a', 7, 10], [[1404, 1.5, 4], '#9fb8e0', 4, 16]]);
  // slow motion between the slip and the catch
  const slow = t > T.slip && t < T.catch;
  const tf = t < T.slip ? t : (t < T.catch ? T.slip + (t - T.slip) * .12 : T.slip + (T.catch - T.slip) * .12 + (t - T.catch));
  const frozen = t > T.catch && t < T.tiptoe;
  const tt = frozen ? T.slip + (T.catch - T.slip) * .12 : tf;
  // Marco leads (going down), you follow with the wrench, the cat at the back
  const sm = t < T.tiptoe ? lerp(2.0, 5.6, eio(seg(tf, CUT[2], T.slip))) : lerp(5.6, 8.2, seg(t, T.tiptoe, CUT[3]));
  const sy = sm - 2.4, sc = sm - 3.9;
  const tip = t > T.tiptoe;
  const turn = eo(seg(t, T.slip + .1, T.slip + .8));
  place(C.marco, 1400 + stepX(sm), stepY(sm), .1, Math.PI / 2 - turn * Math.PI);
  pose(C.marco, { t: tt, phase: tt * (tip ? 2.4 : 6), walk: t < T.slip || tip ? (tip ? .9 : .5) : 0, lean: turn * .3 * (1 - seg(t, T.catch + 1.2, T.tiptoe)), reachR: turn > .2 && !tip ? turn * .9 : null, armsFwd: turn > .2 && !tip ? turn * .7 : (tip ? .25 : 0), nod: turn * .25 * (1 - seg(t, T.catch + 1.2, T.tiptoe)), armsUp: tip ? .15 : 0 });
  place(C.you, 1400 + stepX(sy), stepY(sy), -.15, Math.PI / 2);
  pose(C.you, { t: tt, phase: tt * (tip ? 2.4 : 6) + 1.5, walk: t < T.slip || tip ? (tip ? .9 : .5) : 0, reachR: t < T.slip ? .55 : (frozen ? .9 : (tip ? null : .9)), armsUp: (slow || frozen) ? .35 : (tip ? .15 : 0), nod: slow ? .3 : 0 });
  place(C.cat, 1400 + stepX(sc), stepY(sc), -.35, 0); catPose(C.cat, t, { arch: slow || frozen ? .22 : 0, tailUp: slow || frozen ? 1 : .3, hop: !frozen && !slow && !tip ? Math.abs(Math.sin(t * 8)) * .05 : 0 });
  C.cat.root.rotation.y = 0; C.cat.root.rotation.z = -.35;
  // the wrench: in your hand, then a slow tumble, caught by Marco just above the step
  SETS.wrench.visible = true;
  C.you.root.updateMatrixWorld(true); C.marco.root.updateMatrixWorld(true);
  const hY = C.you.armR.localToWorld(V(0, -.66, .05)), hM = C.marco.armR.localToWorld(V(0, -.66, .1));
  if (t < T.slip) { SETS.wrench.position.copy(hY); SETS.wrench.rotation.set(0, 0, .3); }
  else {
    const f = seg(t, T.slip, T.catch), end = hM.clone();
    const p = hY.clone().lerp(end, f); p.y = lerp(hY.y, end.y, f) + Math.sin(f * Math.PI) * .25 - f * f * .1;
    if (t >= T.catch) p.copy(end);
    SETS.wrench.position.copy(p); SETS.wrench.rotation.set(f * 1.2, 0, .3 + (t < T.catch ? f * 7.5 : 7.5));
  }
  shake = 0;
  if (t < T.slip) {
    const u = eio(seg(t, CUT[2], T.slip));
    setCam(V(1402.2, 1.6, 9.0).lerp(V(1403.0, .6, 7.6), u), V(1403, -1.4, 0).lerp(V(1403.2, -1.6, 0), u), 50, V(1403, -1.6, 0), 140);
  } else if (t < T.tiptoe) {
    const u = eio(seg(t, T.slip, T.tiptoe));
    const w = SETS.wrench.position;
    setCam(V(1402.8, -.5, 7.0).lerp(V(1402.8, -.7, 6.0), u), V(1402.75, -1.0, 0).lerp(w.clone().setZ(0), .3), 44, w, 70);
  } else {
    const u = eio(seg(t, T.tiptoe, CUT[3]));
    setCam(V(1404.6, -1.6, 9.0).lerp(V(1405.2, -2.0, 8.2), u), V(1404.4, -2.4, 0), 48, V(1404.4, -2.6, 0), 140);
  }
}
function sDark(t) {
  SETS.dark.visible = true;
  look('dark'); aimKey(V(1800, 0, -4), { kd: [0, 10, 5] }, 10);
  points([[[1801.4, 3.1, -16], '#ff3a2a', 2.5, 7], [[1800, 3.2, 3], '#5a70b0', 2.5, 9]]);
  // you lead with the torch, slow; stop at the hatch, then edge round it along the right wall
  const zy = lerp(1.6, -3.2, eio(seg(t, CUT[3] + .3, T.hatch - .1)));
  const ar = eio(seg(t, T.around, CUT[4]));
  const yx = lerp(-.2, .95, ar), yz = lerp(zy, -8.4, ar);
  const walking = (t > CUT[3] + .3 && t < T.hatch - .1) || (t > T.around && t < CUT[4]);
  place(C.you, 1800 + yx, 0, yz, Math.PI - ar * .35);
  pose(C.you, { t, phase: t * 4, walk: walking ? .35 : 0, reachR: .85, lean: t > T.hatch ? -.08 : .04, nod: t > T.hatch ? .35 : .1 });
  place(C.marco, 1800 - .95 + ar * 1.7, 0, Math.max(yz + 1.1, -7.3), Math.PI); pose(C.marco, { t, phase: t * 4 + 1, walk: walking ? .35 : 0, armX: -.3, nod: t > T.hatch ? .3 : 0 });
  place(C.cat, 1800 - .45 + ar * 1.3, 0, Math.max(yz + 2.0, -6.0), -Math.PI / 2); catPose(C.cat, t, { arch: t > T.hand ? .25 : 0, tailUp: t > T.hand ? 1 : 0, yaw: .2 });
  // torch: sweeps the walls, then drops onto the open hatch
  const on = eo(seg(t, T.click, T.click + .12));
  const sweep = V(1800 - .2 + 1.3 * Math.sin(t * 1.4), 1.1 + .7 * Math.sin(t * .9 + 1), zy - 5.5);
  const hatch = V(1799.8, -.2, -6.5);
  const tg = sweep.lerp(hatch, eio(seg(t, T.hatch - .35, T.hatch + .15)));
  if (t > T.around) tg.lerp(V(1799.9, .1, -6.4), 1);
  aimTorch(tg, on);
  // the hand rises out of the hole and grabs at the air
  const up = back(seg(t, T.hand, T.hand + .5), 1.4);
  SETS.zArm.position.y = lerp(-1.5, -.45, up); SETS.zArm.rotation.z = Math.sin(t * 2.2) * .18 * up; SETS.zArm.rotation.x = Math.sin(t * 1.7) * .12 * up - .15;
  SETS.zFingers.forEach((f, i) => f.rotation.x = .5 + .5 * Math.sin(t * 7 + i * .7));
  shake = 0;
  const cz = Math.max(zy, -3.2);
  setCam(V(1801.3, 3.6, cz + 3.4), V(1800.0, .6, cz - 4).lerp(V(1799.85, .1, -6.4), eio(seg(t, T.hatch - .3, T.hatch + .4))), 50, t > T.hatch ? V(1799.8, .2, -6.5) : V(1800, 1.2, cz - 2), 120);
  
}
function sEngine(t) {
  SETS.eng.visible = true;
  const on = t > T.lights;
  const L = look(on ? 'engOn' : 'engDark'); aimKey(V(2200, 0, -8), L, 16);
  const run = seg(t, T.start, T.start + 1.2);
  // lamps bang on in pairs
  SETS.engLamps.forEach((m, i) => { const k = t > T.lights + Math.floor(i / 2) * .16 ? 1 : 0; m.material.emissiveIntensity = k * 2.6; });
  const lk = n => t > T.lights + n * .16 ? 1 : 0;
  points([[[2196.4, 7.8, -3], '#fff1d8', 22 * lk(0), 22], [[2203.6, 7.8, -9], '#fff1d8', 22 * lk(1), 22], [[2196.4, 7.8, -15], '#fff1d8', 22 * lk(2), 22],
          [[2200, 2.6, -2.4], '#ff4030', on ? 0 : .7, 4], [[2200, 4, 3], '#7b90c8', on ? 0 : 5, 16]]);
  if (on) { hemi.intensity = lerp(2.4, 1.1, seg(t, T.lights, T.lights + .5)); }
  SETS.pistons.forEach((p, i) => { p.position.y = 2.6 + run * .3 * Math.sin(t * 16 + i * 1.3); });
  SETS.engBlocks.forEach((e, i) => { e.position.y = run * .02 * Math.sin(t * 40 + i); });
  // switches flip, lamps go green; the lever goes forward
  [T.sw1, T.sw2, T.sw3].forEach((s, i) => { const f = eo(seg(t, s, s + .1)); SETS.toggles[i].rotation.x = lerp(.3, -.5, f);
    const lm = SETS.tLamps[i]; lm.emissive.set(f > .5 ? '#3dff7a' : '#ff2a1a'); lm.color.set(f > .5 ? '#0a3a18' : '#3a1010'); });
  SETS.lever.rotation.x = lerp(-.55, 1.0, back(seg(t, T.lever, T.lever + .35), 1.4));
  // people
  const cheer = seg(t, T.lights + .4, T.lights + .8);
  place(C.marco, 2199.75, 0, -.55, Math.PI + .25);
  const mReach = t > T.sw1 - .4 && t < T.lever + .6;
  pose(C.marco, { t, reachR: mReach ? 1.15 : (cheer > 0 ? null : .1), nod: mReach ? .45 : 0, lean: mReach ? .15 : 0, armsUp: cheer * .9 * (t > 45.2 ? .6 : 1) });
  if (t > T.lever - .3 && t < T.lever + .6) { C.marco.armR.rotation.x = -1.2 + .6 * seg(t, T.lever, T.lever + .35); }
  place(C.you, 2201.2, 0, -.35, Math.PI - .2);
  pose(C.you, { t, reachR: on ? null : .85, nod: on ? -.2 * cheer : .2, armsUp: cheer * .8, yaw: on ? .3 * Math.sin(t * 2) * cheer : 0 });
  if (t < T.sw1 - .15) aimTorch(V(2203.6, 1.6, -8 + Math.sin(t * .6) * 2), eo(seg(t, CUT[4], CUT[4] + .2)));
  place(C.cat, 2198.9, 1.25, -1.65, Math.PI * .5 - .4); catPose(C.cat, t, { arch: run > 0 && t < T.lights + 1.2 ? .25 : 0, tailUp: run > 0 ? 1 : .2, hop: t > T.start && t < T.start + .45 ? Math.sin(seg(t, T.start, T.start + .45) * Math.PI) * .35 : 0, yaw: -.4 });
  shake = run * .03 + (t > T.start && t < T.start + .5 ? .05 : 0);
  if (t < T.sw1 - .15) {
    const u = eio(seg(t, CUT[4], T.sw1 - .15));
    setCam(V(2201.0, 4.6, 6.4).lerp(V(2200.6, 4.1, 4.8), u), V(2200.2, 1.4, -7), 52, V(2200.2, 1.6, -2), 140);
  } else if (t < T.lights) {
    const u = eio(seg(t, T.sw1 - .15, T.lights));
    const pv = eio(seg(t, T.sw3 + .15, T.lever - .1)); setCam(V(2199.9, 4.3, -3.4).lerp(V(2199.9, 4.0, -3.2), u).add(V(.8 * pv, 0, 0)), V(2199.8 + .75 * pv, 1.35, -1.3), 44, V(2199.7, 1.4, -1.5), 90);
  } else {
    const u = eio(seg(t, T.lights, CUT[5]));
    setCam(V(2203.2, 2.0, -6.5).lerp(V(2202.4, 2.3, -5.4), u), V(2200, 2.0, -.6), 54, V(2200.3, 2, -.8), 140);
  }
}
const ZPOS = [];
for (const [y, n] of [[4.25, 5], [8.25, 5], [12.25, 5]]) for (let k = 0; k < n; k++) ZPOS.push([-4.2 + k * 2.1 + (hash(y + k) - .5) * .5, y, -7.4 - hash(k + y * 2) * .5]);
ZPOS.push([-3.1, 0, -2.2], [3.0, 0, -1.6], [-1.2, 0, -4.4], [1.8, 0, -4.9]);
function sAtrium(t) {
  SETS.atrium.visible = true;
  const L = look('atrium'); aimKey(V(3000, 6, -6), L, 18);
  const fl = .8 + .2 * Math.sin(t * 31) * Math.sin(t * 7);
  points([[[2997, 9, -4], '#ffcf90', 14 * fl, 20], [[3003, 9, -4], '#ffcf90', 14 * fl, 20], [[3000, 2, 4], '#9a8ac8', 5, 18]]);
  SETS.hang.forEach((h, i) => { h.rotation.z = Math.sin(t * 2.4 + i) * .04; h.rotation.x = Math.sin(t * 2.1 + i * 2) * .03; });
  const camP = V(3000, 1.5, 9).lerp(V(3000, 1.7, 7.0), eio(seg(t, CUT[5], CUT[6])));
  const sn = back(seg(t, T.snap, T.snap + .22), 2.2), lu = seg(t, T.lurch, T.lurch + .6);
  ZPOS.forEach(([x, y, z], i) => {
    const p = C.z[i], wx = 3000 + x;
    const r0 = (hash(i * 7.3) > .5 ? 1 : -1) * (Math.PI / 2 + (hash(i) - .5) * 1.4) + Math.PI;
    const r1 = Math.atan2(camP.x - wx, camP.z - z);
    const fwd = y === 0 ? lu * (t - T.lurch) * .5 : lu * .25;
    place(p, wx + Math.sin(r1) * fwd, y, z + Math.cos(r1) * fwd, lerp(r0, r1, clamp(sn * (1 + hash(i) * .1), 0, 1.1)));
    const ph = t * 3.2 + i * 1.7;
    pose(p, { t, phase: ph, walk: y === 0 && t > T.lurch ? .5 : 0, armsFwd: t > T.lurch ? lu : .15, lean: t > T.lurch ? .15 + .1 * lu : .25, sway: .05 * Math.sin(t * 1.3 + i),
      nod: t < T.snap ? .5 + .1 * Math.sin(t + i) : lerp(.5, y > 0 ? .25 + y * .02 : -.15, sn), tilt: .3 * Math.sin(i * 2.1 + 1) * (1 - sn * .6), yaw: 0 });
  });
  hemi.intensity = L.hi * fl;
  shake = .012 + (t > T.snap && t < T.snap + .3 ? .04 : 0);
  setCam(camP, V(3000, 7.6, -7).lerp(V(3000, 7.4, -7), eio(seg(t, CUT[5], CUT[6]))), lerp(58, 52, eio(seg(t, CUT[5], CUT[6]))), V(3000, 8, -7), 160);
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
  o2.font = '46px "Lilita One"'; o2.fillStyle = INK; o2.fillText('PART 3', W / 2, py + ph / 2 + 3);
  TX.push({ id: 'h2', text: 'PART 3', x0: W / 2 - pw / 2, y0: py, x1: W / 2 + pw / 2, y1: py + ph });
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
const HOT = new Set(['ZOMBIE', 'APOCALYPSE', 'STORM...', 'ENGINES', 'SEVEN', 'CREW', 'PASSAGES.', 'WALL.', 'NOISE', 'METAL.', 'DROP', 'EVERY', 'SLOW.', 'LIGHT', 'SPEED.', 'DARK,', 'FRONT', 'ENGINE', 'MARCO', 'THREE', 'SWITCHES.', 'LEVER.', 'LIFE.', 'EVERYTHING', 'ELSE']);
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
function endCard(t) {
  o2.fillStyle = '#0d0f18'; o2.fillRect(0, 0, W, H);
  const s = back((t - CUT[6] - .25) / .25, 2);
  if (t < CUT[6] + .25) return;
  o2.save(); o2.translate(W / 2, 960); o2.scale(s, s);
  o2.font = '170px "Lilita One"'; o2.textAlign = 'center'; o2.textBaseline = 'middle';
  o2.fillStyle = 'rgba(0,0,0,.6)'; o2.fillText('PART 4 →', 8, 14);
  o2.lineWidth = 18; o2.strokeStyle = '#e0312b'; o2.lineJoin = 'round'; o2.strokeText('PART 4 →', 0, 0);
  o2.fillStyle = '#ffffff'; o2.fillText('PART 4 →', 0, 0);
  o2.restore();
  TX.push({ id: 'e1', text: 'PART 4 →', x0: 200, y0: 860, x1: 880, y1: 1060 });
}

// ---------- events (sound) ----------
function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push(Object.assign({ t: +t.toFixed(3), type }, o));
  for (const [id, t] of Object.entries(VO)) ev(t, 'voice', { id });
  ev(0, 'amb', { name: 'storm', t1: CUT[1] }); ev(CUT[1], 'amb', { name: 'corr', t1: CUT[2] }); ev(CUT[2], 'amb', { name: 'metal', t1: CUT[3] });
  ev(CUT[3], 'amb', { name: 'dark', t1: CUT[4] }); ev(CUT[4], 'amb', { name: 'eng', t1: CUT[5] }); ev(CUT[5], 'amb', { name: 'atrium', t1: CUT[6] });
  CLOCK.slice(1).forEach(([t]) => ev(t, 'tick'));
  [T.flash1, T.flash2, T.flash3].forEach((f, i) => ev(f + .15, 'thunder', { g: [.8, 1, .9][i] }));
  for (let t = CUT[1] + .1; t < T.peek; t += .36) ev(t, 'step', { g: .5 });
  ev(T.peek + .7, 'groan', { p: .9, g: .5 }); ev(T.peek + 2.3, 'groan', { p: 1.1, g: .45 }); ev(T.peek + 3.9, 'groan', { p: .8, g: .5 });
  for (let t = CUT[2] + .2; t < T.slip; t += .42) ev(t, 'clang', { g: .35 });
  ev(T.slip, 'whoosh'); ev(T.catch, 'catch'); ev(T.catch + .15, 'exhale');
  for (let t = T.tiptoe + .3; t < CUT[3]; t += .8) ev(t, 'clang', { g: .08 });
  ev(T.click, 'click'); for (const d of [29.4, 31.1, 32.0, 34.6, 36.1]) ev(d, 'drip');
  ev(T.hatch, 'sting', { g: .8 }); ev(T.hand, 'groan', { p: .75, g: .9 }); ev(T.hand + .2, 'meow', { p: 1.1 }); ev(T.hand + 1.6, 'groan', { p: .7, g: .6 });
  ev(T.sw1, 'switch'); ev(T.sw2, 'switch'); ev(T.sw3, 'switch'); ev(T.lever, 'clunk');
  ev(T.start, 'engine', { t1: CUT[6] });
  for (let i = 0; i < 3; i++) ev(T.lights + i * .16, 'lampon');
  ev(T.snap, 'sting', { g: 1.0, low: 1 });
  for (let i = 0; i < 9; i++) ev(T.snap + .1 + hash(i) * 2.8, 'groan', { p: .7 + hash(i + 5) * .5, g: .45 });
  ev(CUT[6], 'cutoff'); ev(CUT[6] + .25, 'endhit');
  return E.sort((a, b) => a.t - b.t);
}

// ---------- render ----------
const SCENES = [sStorm, sCorr, sStairs, sDark, sEngine, sAtrium];
function render(t) {
  tNow = t; TX = [];
  const i = sceneAt(t);
  o2.clearRect(0, 0, W, H);
  if (i < 6) {
    for (const k of ['bridge', 'outside', 'corr', 'stairs', 'dark', 'eng', 'atrium']) SETS[k].visible = false;
    hideAll();
    SCENES[i](t);
    post.composer.render();
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
render(0);
window.READY = true;
