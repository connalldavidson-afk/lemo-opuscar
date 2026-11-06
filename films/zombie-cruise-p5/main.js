// ZOMBIE APOCALYPSE ON A CRUISE SHIP · PART 5 — Chunky 3D Cartoon, 1080x1920. render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eio, eo, ei, back, hash, V, rbox, sph, cap, cyl, cone, tor, mat, glow, mesh, grp, person, pose, cat, catPose, SKIN } from './kit3d.js';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const AO = Q.get('ao') !== '0';


// ---------- timeline ----------
const DUR = 54.2;
const CUT = [0, 7.9, 15.6, 25.4, 36.4, 43.4, 52.0];
const CLOCK = [[0, 'DAY 3 • 7:16 AM'], [7.9, 'DAY 3 • 7:17 AM'], [15.6, 'DAY 3 • 7:29 AM'], [25.4, 'DAY 3 • 7:34 AM'],
               [36.4, 'DAY 3 • 7:36 AM'], [43.4, 'DAY 3 • 7:52 AM']];
const VO = { l01: 0.3, l02: 5.5, l03: 8.2, l04: 12.4, l05: 16.2, l06: 20.4, l07: 25.9, l08: 28.6, l09: 33.6, l10: 37.0, l11: 40.8, l12: 44.6, l13: 47.8 };
const T = { lever: 9.5, row: 10.6, bump: 13.9, stir: 14.1, settle: 15.0,
            curtain: 18.6, close: 21.0,
            slot: 27.9, pov: 28.5, grinY: 31.1, grinM: 31.35, back: 32.1, bolt1: 32.3, bolt2: 32.7, bolt3: 33.1, open: 33.6, wave: 34.5, walkIn: 35.3,
            shh: 38.3, kid: 40.3,
            horn1: 44.0, emerge: 45.0, camB: 48.8, horn2: 49.4, puff: 50.1 };
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
// boat extras: outboard engine with a lever, exhaust puffs, an oar
{
  const b = SETS.boat;
  const en = grp(b, -2.6, .7, 0); mesh(rbox(.55, .7, .6, .12), mat('#3a3e48'), 0, .2, 0, en); mesh(rbox(.6, .2, .65, .08), mat('#e0312b'), 0, .62, 0, en); mesh(cyl(.06, .06, 1.1), steelM, -.05, -.5, 0, en);
  SETS.lever = grp(b, -2.1, 1.15, .5); mesh(cyl(.03, .03, .45), steelM, 0, .22, 0, SETS.lever); mesh(sph(.075), mat('#e0312b'), 0, .46, 0, SETS.lever);
  const pm = new THREE.MeshStandardMaterial({ color: '#8f959e', transparent: true, opacity: .55, roughness: 1 });
  SETS.puffs = []; for (let i = 0; i < 8; i++) SETS.puffs.push(mesh(sph(.13, 10, 8), pm, 0, 0, 0, b, { cast: false }));
  SETS.oar = grp(b, .7, 1.2, -.95); const wood = mat('#c9a77a');
  rod(V(0, .45, .55), V(0, -1.25, -1.45), .035, wood, SETS.oar);
  mesh(rbox(.06, .55, .28, .03), wood, 0, -1.4, -1.62, SETS.oar, { rx: .87 });
}
function chalkMat(smiley, bg) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const k = c.getContext('2d'); if (bg) { k.fillStyle = bg; k.fillRect(0, 0, 512, 256); }
  k.strokeStyle = 'rgba(250,250,245,.95)'; k.lineCap = 'round'; k.lineJoin = 'round';
  const line = (pts, w) => { for (let p = 0; p < 3; p++) { k.lineWidth = w - p * 3; k.beginPath(); pts.forEach(([x, y], i) => { const jx = (hash(i * 7 + p) - .5) * 5, jy = (hash(i * 11 + p * 3) - .5) * 5; i ? k.lineTo(x + jx, y + jy) : k.moveTo(x + jx, y + jy); }); k.stroke(); } };
  const ax = smiley ? 40 : 70, bx = smiley ? 300 : 440;
  line([[ax, 130], [bx, 122]], 18); line([[bx - 70, 70], [bx, 122], [bx - 66, 180]], 18);
  if (smiley) { k.lineWidth = 14; k.beginPath(); k.arc(410, 125, 70, 0, Math.PI * 2); k.stroke(); k.fillStyle = k.strokeStyle; k.beginPath(); k.arc(385, 105, 10, 0, 7); k.arc(435, 105, 10, 0, 7); k.fill(); k.beginPath(); k.arc(410, 128, 40, .25, Math.PI - .25); k.stroke(); }
  k.globalCompositeOperation = bg ? 'source-atop' : 'destination-out';
  for (let i = 0; i < 2600; i++) { k.fillStyle = bg ? bg : `rgba(0,0,0,${.3 + hash(i) * .7})`; k.globalAlpha = bg ? .3 + hash(i) * .7 : 1; k.fillRect(hash(i * 3 + 1) * 512, hash(i * 5 + 2) * 256, 2 + hash(i) * 3, 2); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  if (bg) return new THREE.MeshStandardMaterial({ map: tx, roughness: .85 });
  return new THREE.MeshStandardMaterial({ map: tx, transparent: true, depthWrite: false, roughness: 1, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: .25 });
}
const HCOL = ['#e89a6a', '#e8cf6a', '#7ab8c8', '#e8e2d4', '#c88aa0', '#8ab890', '#d07a5a'];
function lighthouse(parent, x, y, z, r, h, n) {
  const lh = grp(parent, x, y, z);
  for (let k = 0; k < n; k++) mesh(cyl(r * (1 - k * .05) - .02, r * (1 - (k - 1) * .05), h), mat(k % 2 ? '#a83a30' : '#e2ddd2', { roughness: .8 }), 0, h / 2 + k * h, 0, lh);
  return lh;
}
// SLEEPING ZOMBIES stand along the quay edge (harbour set, quay top y=1.8, edge z=-50)
const SLEEPX = [-11.5, -8.8, -6.3, -2.6, .3, 2.9, 5.6, 8.4, 11.2];
// BACK STREET at x=3400: a lane running along -z between two rows of houses
{
  const g = grp(scene, 3400, 0, 0); SETS.street = g;
  const cc = document.createElement('canvas'); cc.width = cc.height = 256; const k = cc.getContext('2d'); k.fillStyle = '#4e4a48'; k.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 96 + (hash(x * 7 + y * 13) * 36 | 0); k.fillStyle = `rgb(${v + 14},${v + 8},${v + 4})`; k.beginPath(); k.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 9); k.fill(); }
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace; ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(2, 30);
  mesh(new THREE.PlaneGeometry(4.4, 80), new THREE.MeshStandardMaterial({ map: ct, roughness: .9 }), 0, 0, -30, g, { rx: -Math.PI / 2, cast: false });
  const win = mat('#1d2129', { roughness: .3 }), sill = mat('#efe9dc');
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    const z = 6 - i * 5.2 - (side > 0 ? 1.7 : 0), h = 6.5 + hash(i * 3 + side + 5) * 3.5, x = side * 4.7;
    mesh(rbox(5, h, 5.1, .12), mat(HCOL[(i * 2 + (side > 0 ? 3 : 0)) % 7], { roughness: .85 }), x, h / 2, z, g);
    mesh(rbox(3.6, 3.6, 5.2, .12), mat(['#8a3a2e', '#5a4a52', '#3e4a5a'][(i + (side > 0)) % 3], { roughness: .8 }), x, h, z, g, { rz: Math.PI / 4, s: [.95, .55, 1] });
    for (let r = 0; r < Math.floor((h - 2.4) / 2.1); r++) for (const dz of [-1.3, 1.3]) {
      const wy = 3.3 + r * 2.1; if (side > 0 && Math.abs(z + dz + 1.5) < .9 && r === 0) continue;
      mesh(rbox(.08, 1.1, .8, .03), win, side * 2.19, wy, z + dz, g, { cast: false }); mesh(rbox(.18, .1, 1.0, .03), sill, side * 2.16, wy - .6, z + dz, g, { cast: false });
    }
    mesh(rbox(.08, 1.9, 1.0, .03), mat(['#4a3428', '#2f4a5a', '#5a2e2e'][i % 3]), side * 2.19, .95, z + (hash(i + side) > .5 ? .9 : -.9), g, { cast: false });
  }
  SETS.arrow1 = mesh(new THREE.PlaneGeometry(1.7, .85), chalkMat(false), -.1, .012, -3.4, g, { rx: -Math.PI / 2, cast: false, receive: false }); SETS.arrow1.rotation.z = Math.PI / 2;
  SETS.arrow2 = mesh(new THREE.PlaneGeometry(1.1, .55), chalkMat(true, HCOL[6]), -2.19, .85, -11.0, g, { ry: Math.PI / 2, cast: false, receive: false });
  // the window with a curtain on the right (lane face x=2.2)
  const cw = grp(g, 2.13, 3.3, -1.5); SETS.curtWin = cw;
  mesh(rbox(.06, 1.2, .9, .03), win, 0, 0, 0, cw, { cast: false }); mesh(rbox(.18, .1, 1.1, .03), sill, .03, -.65, 0, cw, { cast: false });
  SETS.eyes = grp(cw, -.02, .1, 0); for (const s of [-1, 1]) { mesh(sph(.07), mat('#ffffff', { roughness: .3 }), 0, 0, s * .1, SETS.eyes, { s: [.5, 1, 1], cast: false }); mesh(sph(.035), mat('#111111'), -.03, 0, s * .1, SETS.eyes, { cast: false }); }
  SETS.curtain = mesh(rbox(.03, 1.1, .82, .01), mat('#efe3c4', { roughness: 1 }), -.05, 0, 0, cw, { cast: false });
  SETS.streetLH = lighthouse(g, .6, 0, -70, 2.4, 3.2, 5);
}
// LIGHTHOUSE DOOR at x=3800: tower centre z=-5 (r 3), a hollow stone porch, door hinged at x=-.65
{
  const g = grp(scene, 3800, 0, 0); SETS.door = g;
  lighthouse(g, 0, 0, -5.2, 3.2, 3.4, 6);
  const stone = mat('#b8b2a6', { roughness: .9 }), st2 = mat('#8d8a84', { roughness: .9 });
  mesh(rbox(9, 1, 40, .3), st2, 0, -.5, -6, g);
  for (let i = 0; i < 24; i++) mesh(rbox(1.6 + hash(i) * .8, 1.2, 1.6, .5), st2, (i % 2 ? 1 : -1) * (4.7 + hash(i + 2) * .5), -.4, 12 - i * 2.2, g, { ry: hash(i + 4) });
  // porch: side walls, roof, front pieces around the doorway, a dark interior
  mesh(rbox(.3, 3.2, 1.6, .05), stone, -1.15, 1.6, -1.6, g); mesh(rbox(.3, 3.2, 1.6, .05), stone, 1.15, 1.6, -1.6, g);
  mesh(rbox(2.9, .35, 1.9, .08), mat('#8a3a2e'), 0, 3.3, -1.5, g);
  mesh(rbox(.55, 3.2, .3, .05), stone, -.95, 1.6, -.85, g); mesh(rbox(.55, 3.2, .3, .05), stone, .95, 1.6, -.85, g); mesh(rbox(1.4, .75, .3, .05), stone, 0, 2.83, -.85, g);
  mesh(rbox(2.0, 3.0, .1, .02), mat('#120c0c'), 0, 1.5, -2.35, g, { cast: false });
  mesh(rbox(1.6, .14, .8, .04), st2, 0, .07, -.3, g);
  const dh = grp(g, -.66, 0, -.9); SETS.doorH = dh; const wd = mat('#5a3a26', { roughness: .7 });
  mesh(rbox(1.3, 2.42, .12, .03), wd, .65, 1.22, 0, dh);
  for (let i = 0; i < 4; i++) mesh(rbox(1.3, .05, .02, .01), mat('#3e281a'), .65, .5 + i * .55, .07, dh, { cast: false });
  for (const y of [.55, 1.9]) mesh(rbox(1.2, .08, .03, .01), mat('#2a2a2e', { metalness: .6, roughness: .4 }), .65, y, .08, dh, { cast: false });
  mesh(rbox(.56, .26, .03, .01), mat('#100808'), .65, 2.12, .07, dh, { cast: false });
  SETS.slotPlate = mesh(rbox(.58, .28, .03, .01), mat('#2a2a2e', { metalness: .6, roughness: .4 }), .65, 2.12, .085, dh, { cast: false });
  SETS.slotGlow = mesh(new THREE.PlaneGeometry(.5, .2), glow('#ff3a28', 2.0), .65, 2.12, .072, dh, { cast: false });
  mesh(sph(.06), mat('#2a2a2e', { metalness: .6 }), 1.15, 1.2, .1, dh, { cast: false });
  const out = grp(scene, 3800, 0, 0); SETS.doorOut = out;
  mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: '#56677a', roughness: .2, metalness: .1 }), 0, -1, 0, out, { rx: -Math.PI / 2, cast: false });
  skyPlane(out, 0, 30, 120, 500, 140, [[0, '#5f6c80'], [.6, '#8c98aa'], [1, '#b8c0cc']], Math.PI);
  for (let i = 0; i < 10; i++) { const h = 4 + hash(i + 2) * 4; mesh(rbox(4.2, h, 4, .2), mat(HCOL[i % 7], { roughness: .8 }), -25 + i * 5, h / 2, 60, out, { cast: false }); }
}
// INSIDE THE LIGHTHOUSE at x=4200: a round room (r 3.4), red light, survivors along the back wall
{
  const g = grp(scene, 4200, 0, 0); SETS.inside = g;
  mesh(new THREE.CircleGeometry(3.4, 40), mat('#6a5a50', { roughness: .9 }), 0, 0, 0, g, { rx: -Math.PI / 2, cast: false });
  mesh(new THREE.CylinderGeometry(3.4, 3.4, 9, 40, 1, true), mat('#d8cfc0', { roughness: .9, side: THREE.BackSide }), 0, 4.5, 0, g, { cast: false });
  for (const [x, z, w] of [[-1.3, -2.4, 1.4], [.4, -2.8, 1.6], [2.0, -2.0, 1.2]]) mesh(rbox(w, .5, .7, .08), mat('#8a6a4e'), x, .25, z, g, { ry: -x * .25 });
  mesh(rbox(.6, .45, .45, .06), mat('#c9a77a'), -2.4, .22, -1.2, g); mesh(rbox(.5, .4, .4, .05), mat('#b0905e'), -2.6, .66, -1.0, g);
  for (let i = 0; i < 5; i++) mesh(cyl(.09, .09, .2), mat('#c0c4cc', { metalness: .6, roughness: .3 }), -2.2 + i * .2, .55, -1.35, g);
  mesh(rbox(.5, .7, .5, .06), mat('#8a6a4e'), .3, .35, -1.6, g);
  SETS.lantern = grp(g, .3, .7, -1.6); mesh(cyl(.13, .15, .32), glow('#ff3a22', 2.2), 0, .16, 0, SETS.lantern, { cast: false }); mesh(cyl(.17, .17, .05), mat('#2a2a2e'), 0, .34, 0, SETS.lantern);
  mesh(rbox(1.6, .1, 1.0, .05), mat('#5a6a8a'), -1.3, .55, -2.4, g, { rx: .1 });
  // doorway glow at the front
  mesh(new THREE.PlaneGeometry(1.2, 2.3), glow('#c8d4e2', .5), 0, 1.15, 3.36, g, { ry: Math.PI, cast: false });
  // teddy for the kid
  SETS.teddy = grp(scene); const tb = mat('#a8744a'); mesh(sph(.16), tb, 0, 0, 0, SETS.teddy); mesh(sph(.11), tb, 0, .22, 0, SETS.teddy); for (const s of [-1, 1]) mesh(sph(.045), tb, s * .08, .32, 0, SETS.teddy);
}
// LAMP ROOM at x=4600 (floor y=0; the sea is 30 m below) and the cruise ship coming out of the fog
{
  const g = grp(scene, 4600, 0, 0); SETS.lamp = g;
  const red = mat('#a83a30', { roughness: .7 }), white = mat('#e8e4da');
  mesh(new THREE.CircleGeometry(3.3, 40), mat('#5a5e66', { roughness: .7 }), 0, 0, 0, g, { rx: -Math.PI / 2, cast: false });
  mesh(new THREE.CylinderGeometry(3.3, 3.3, .9, 48, 1, true), mat('#a83a30', { roughness: .7, side: THREE.DoubleSide }), 0, .45, 0, g);
  mesh(tor(3.3, .08, 8, 64), white, 0, .9, 0, g, { rx: Math.PI / 2 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .31; mesh(rbox(.1, 2.6, .1, .03), mat('#2a2e36'), Math.sin(a) * 3.28, 2.2, Math.cos(a) * 3.28, g); }
  mesh(tor(3.3, .06, 8, 64), mat('#2a2e36'), 0, 3.5, 0, g, { rx: Math.PI / 2 });
  mesh(cone(3.8, 2.2, 32), red, 0, 4.6, 0, g); mesh(sph(.3), mat('#2a2e36'), 0, 5.8, 0, g);
  mesh(cyl(.4, .55, .9), mat('#2a2e36'), 0, .45, 2.3, g);
  mesh(cyl(.7, .7, 1.4, 24), new THREE.MeshStandardMaterial({ color: '#7d8a8a', metalness: .9, roughness: .12 }), 0, 1.6, 2.3, g);
  for (let k = 0; k < 5; k++) mesh(tor(.72, .03), mat('#c9a33a', { metalness: .7, roughness: .3 }), 0, 1.0 + k * .3, 2.3, g, { rx: Math.PI / 2, cast: false });
  // balcony + tower down to the sea
  mesh(new THREE.RingGeometry(3.3, 4.4, 48), mat('#3a3e46'), 0, -.05, 0, g, { rx: -Math.PI / 2, cast: false });
  mesh(tor(4.35, .04, 6, 64), mat('#2a2e36'), 0, 1.0, 0, g, { rx: Math.PI / 2, cast: false });
  for (let k = 0; k < 9; k++) mesh(cyl(3.0 + k * .12, 3.1 + k * .12, 3.4), k % 2 ? red : white, 0, -2.0 - k * 3.4, 0, g, { cast: false });
  const out = grp(scene, 4600, 0, 0); SETS.lampOut = out;
  mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: '#5d6e80', roughness: .25, metalness: .1 }), 0, -30, 0, out, { rx: -Math.PI / 2, cast: false });
  // the cruise ship: bow toward +z
  const sh = grp(out, 0, -30, -400); SETS.ship = sh;
  const hullM = mat('#f4f6f8', { roughness: .5 }), navy = mat('#24356e'), winM = mat('#1d2433', { roughness: .2 });
  mesh(rbox(26, 16, 120, 1), hullM, 0, 8, 0, sh, { cast: false });
  mesh(cone(13, 30, 32), hullM, 0, 8, 75, sh, { rx: Math.PI / 2, s: [1, 1, .62], cast: false });
  mesh(rbox(26.2, 1.4, 120.2, .3), navy, 0, 15.2, 0, sh, { cast: false });
  mesh(rbox(26.2, 2.2, 120.2, .3), mat('#c0392b'), 0, 1.0, 0, sh, { cast: false });
  for (const s of [-1, 1]) for (const y of [5, 8.5, 12]) mesh(rbox(.1, .9, 112, .05), winM, s * 13.06, y, -2, sh, { cast: false });
  const TIERS = [[22, 3.5, 92, 17.75, -8], [20, 3.5, 82, 21.25, -12], [18, 3.5, 72, 24.75, -16]];
  SETS.shipRails = [];
  for (const [w, h, l, y, z] of TIERS) {
    mesh(rbox(w, h, l, .3), hullM, 0, y, z, sh, { cast: false });
    mesh(rbox(w - 2, 1.1, .1, .05), winM, 0, y + .2, z + l / 2 + .03, sh, { cast: false });
    for (const s of [-1, 1]) mesh(rbox(.1, 1.1, l - 4, .05), winM, s * (w / 2 + .03), y + .2, z, sh, { cast: false });
    SETS.shipRails.push([w, y - h / 2, z + l / 2]);
  }
  mesh(rbox(28, 3, 7, .3), hullM, 0, 28.0, 18, sh, { cast: false }); mesh(rbox(26, 1.2, .1, .05), winM, 0, 28.3, 21.55, sh, { cast: false });
  const fn = grp(sh, 0, 27, -30); mesh(cyl(4, 4.6, 12, 24), mat('#e0312b'), 0, 6, 0, fn, { cast: false }); mesh(cyl(4.05, 4.1, 1.6, 24), navy, 0, 10.2, 0, fn, { cast: false });
  // the horde along the rails: instanced bodies, heads and glowing eyes
  const NZ = 220, bodyG = cap(.5, .9), headG = sph(.52, 10, 8), eyeG = sph(.15, 6, 4);
  const zb = new THREE.InstancedMesh(bodyG, mat('#6b6a72'), NZ), zh = new THREE.InstancedMesh(headG, mat('#9ab89a'), NZ), ze = new THREE.InstancedMesh(eyeG, glow('#f6f2b8', 2.2), NZ * 2);
  const ZCOL = ['#7a6a6a', '#5d6b7a', '#7a7058', '#6b5a72', '#5f7262', '#8a5a5a', '#5a6a8a'];
  for (let i = 0; i < NZ; i++) zb.setColorAt(i, new THREE.Color(ZCOL[i % 7]));
  SETS.horde = { zb, zh, ze, spots: [] };
  for (const m of [zb, zh, ze]) { sh.add(m); m.frustumCulled = false; }
  // spots: hull deck edge (y=16) and each tier's front edge, plus the bow
  const add = (x, y, z) => SETS.horde.spots.push([x, y, z]);
  for (let k = 0; k < 40; k++) { const u = k / 39; const a = (u - .5) * Math.PI * .9; add(Math.sin(a) * 12, 16, 60 + Math.cos(a) * 10); }
  for (const s of [-1, 1]) for (let k = 0; k < 22; k++) add(s * 12.2, 16, 56 - k * 2.6);
  for (const [w, y, z] of SETS.shipRails) { const top = y + 3.5; for (let k = 0; k < Math.floor(w / 1.1); k++) add(-w / 2 + .5 + k * 1.1, top, z - .6); for (const s of [-1, 1]) for (let k = 0; k < 8; k++) add(s * (w / 2 - .6), top, z - 2 - k * 2.4); }
  SETS.horde.spots.length = Math.min(NZ, SETS.horde.spots.length);
  SETS.steam = []; for (let i = 0; i < 14; i++) SETS.steam.push(mesh(sph(1, 12, 8), new THREE.MeshStandardMaterial({ color: '#f4f6f8', transparent: true, opacity: .8, roughness: 1 }), 0, 0, 0, sh, { cast: false }));
}

// ---------- cast ----------
const C = {};
const YOU = { shirt: '#ffc81e', pants: '#2f5aa8', hair: '#3b2416', hairStyle: 'short', skin: SKIN[1] };
C.you = person(YOU); scene.add(C.you.root);
C.marco = person({ shirt: '#ffffff', stripe: '#24356e', pants: '#24356e', hairStyle: 'cap', hat: '#24356e', skin: SKIN[3] }); scene.add(C.marco.root);
C.cat = cat(); scene.add(C.cat.root);
C.keeper = person({ shirt: '#3d5a7a', pants: '#3a3a44', hair: '#e4e4e4', hairStyle: 'bun', skin: SKIN[0] }); scene.add(C.keeper.root);
C.kid = person({ shirt: '#e06a8a', pants: '#3a4258', hair: '#2a1a12', hairStyle: 'bun', skin: SKIN[2] }); scene.add(C.kid.root);
C.cook = person({ shirt: '#f4f1ea', pants: '#4a4a52', hairStyle: 'captain', skin: SKIN[0] }); scene.add(C.cook.root);
C.old = person({ shirt: '#8ab890', pants: '#5a4a40', hair: '#bdbdbd', hairStyle: 'short', skin: SKIN[3] }); scene.add(C.old.root);
const ZC = ['#7a6a6a', '#5d6b7a', '#7a7058', '#6b5a72', '#5f7262', '#8a5a5a', '#5a6a8a'];
C.z = []; for (let i = 0; i < 10; i++) { const p = person({ zombie: true, shirt: ZC[i % ZC.length], pants: ['#4a4a52', '#3a4258', '#5a4a40'][i % 3], hair: ['#3a3a3a', '#5a4030', '#2a2a2a'][i % 3], hairStyle: ['short', 'none', 'bun', 'short'][i % 4] }); scene.add(p.root); C.z.push(p); }
// the keeper's glasses + red torch
{ const gl = grp(C.keeper.head, 0, .36, .4); for (const s of [-1, 1]) mesh(tor(.1, .018), mat('#2a2a2e'), s * .15, 0, 0, gl, { cast: false }); }
SETS.torch = grp(C.keeper.armR, 0, -.66, .08); mesh(cyl(.06, .07, .3), mat('#2a2a2e'), 0, 0, .1, SETS.torch, { rx: Math.PI / 2 }); mesh(new THREE.CircleGeometry(.055, 16), glow('#ff3a28', 3), 0, 0, .26, SETS.torch, { cast: false });
// grins (zombies can't smile): a wide open smile with teeth, swapped in for the mouth
function grinMesh(P) {
  const gm = grp(P.head, 0, .12, .385); gm.visible = false;
  mesh(new THREE.CircleGeometry(.23, 24, Math.PI, Math.PI), mat('#3a0e14'), 0, .03, 0, gm, { cast: false, s: [1, 1.1, 1] });
  mesh(new THREE.PlaneGeometry(.36, .07), mat('#ffffff', { roughness: .3 }), 0, -.015, .004, gm, { cast: false });
  P.grin = gm; return gm;
}
grinMesh(C.you); grinMesh(C.marco); grinMesh(C.keeper);
const torchLight = new THREE.SpotLight('#ff4a30', 0, 12, .32, .45, 1.2); scene.add(torchLight); scene.add(torchLight.target);

const ALLROOTS = () => [C.you.root, C.marco.root, C.cat.root, C.keeper.root, C.kid.root, C.cook.root, C.old.root, ...C.z.map(p => p.root)];
function place(P, x, y, z, ry = 0, parent = scene) { if (P.root.parent !== parent) parent.add(P.root); P.root.visible = true; P.root.position.set(x, y, z); P.root.rotation.set(0, ry, 0); P.root.scale.setScalar(P === C.cat ? 1.25 : 1); }
function hideAll() {
  for (const r of ALLROOTS()) { if (r.parent !== scene) scene.add(r); r.visible = false; r.rotation.set(0, 0, 0); }
  SETS.boat.visible = false; SETS.teddy.visible = false;
  for (const P of [C.you, C.marco, C.keeper]) { P.grin.visible = false; P.mouth.visible = true; }
  C.z.forEach(p => { p.head.scale.set(1, 1, 1); lids(p, 1); });
  C.cat.body.scale.set(1, 1, 1); C.cat.tail.forEach(g => g.children.forEach(m => { if (m.isMesh) m.scale.set(1, 1, 1); }));
  torchLight.intensity = 0;
}
function grin(P, k) { P.grin.visible = k > .02; P.mouth.visible = !P.grin.visible; P.grin.scale.set(.6 + .4 * k, .3 + .7 * k, 1); }
const ZEYE = glow('#f6f2b8', 1.6);
function eyesOf(P) { if (!P.eyes) P.eyes = P.head.children.filter(m => m.material === ZEYE); return P.eyes; }
function lids(P, k) { eyesOf(P).forEach(e => e.scale.set(1, lerp(.18, 1.15, k), .6)); }
function snooze(P, t, i) { pose(P, { t: t * .3, armsFwd: 0, lean: .12 + .04 * Math.sin(t * .7 + i), nod: .95 + .08 * Math.sin(t * .9 + i * 2), tilt: .35 * Math.sin(i * 2.3 + .5), sway: .05 * Math.sin(t * .8 + i) }); P.armL.rotation.x = .15; P.armR.rotation.x = .15; P.mouth.scale.set(1, .6, 1); lids(P, 0); }
function tiptoe(P, t, i, w = .9) { const ph = t * 5.2 + i * 1.3; pose(P, { t, phase: ph, walk: w, lean: .16, nod: .12, bob: .06 * Math.abs(Math.sin(ph)) }); for (const [a, s] of [[P.armL, -1], [P.armR, 1]]) { a.rotation.x = -1.1 + .1 * Math.sin(ph); a.rotation.z = s * .5; } }

// ---------- looks ----------
function look(name) {
  const L = {
    harbour: { bg: '#7d8a9c', fog: '#8693a5', fd: .019, sky: '#b8c4d4', gnd: '#4a5260', hi: 1.05, key: '#c8d2e0', ki: .6, kd: [-6, 12, 8], env: .35, exp: 1.0 },
    street: { bg: '#8693a5', fog: '#8a96a8', fd: .028, sky: '#b8c4d4', gnd: '#4a5060', hi: 1.0, key: '#d0d8e4', ki: .55, kd: [5, 14, 4], env: .32, exp: 1.0 },
    door: { bg: '#8a96a8', fog: '#8a96a8', fd: .02, sky: '#b8c4d4', gnd: '#4a5060', hi: .95, key: '#d0d8e4', ki: .6, kd: [6, 12, 10], env: .3, exp: 1.0 },
    slot: { bg: '#3a4250', fog: '#3a4250', fd: .03, sky: '#6a7484', gnd: '#2a2e38', hi: .35, key: '#8a96a8', ki: .2, kd: [6, 12, 10], env: .1, exp: 1.0 },
    inside: { bg: '#140808', fog: '#1a0a0a', fd: .02, sky: '#6a3a34', gnd: '#1a0a0a', hi: .5, key: '#ff7050', ki: .25, kd: [-3, 8, 4], env: .12, exp: 1.08 },
    lamp: { bg: '#a3adb8', fog: '#a3adb8', fd: .008, sky: '#d0d8e0', gnd: '#5a6068', hi: 1.1, key: '#e0e6ee', ki: .8, kd: [-8, 12, 10], env: .4, exp: 1.0 },
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
// boat world frame (harbour): rotation y=π/2, so boat-local +x (bow) points to world -z and local +z to world +x
function boatAt(bz, t, bump = 0) {
  SETS.boat.visible = true;
  SETS.boat.position.set(3000, -.15 + Math.sin(t * 1.5) * .04, bz); SETS.boat.rotation.set(Math.sin(t * 1.2) * .015 + bump * .04, Math.PI / 2, Math.sin(t * 1.4) * .02);
}
function puffs(t, on) {
  SETS.puffs.forEach((p, i) => {
    const life = 1.4, born = Math.floor((t - i * .175) / life) * life + i * .175, k = (t - born) / life;
    p.visible = born < on; if (!p.visible) return;
    p.position.set(-2.7 - k * 1.2, 1.45 + k * 1.1, Math.sin(i * 2.1) * .15); p.scale.setScalar(.6 + k * 1.8); p.material.opacity = .55 * (1 - k);
  });
}
function sleepers(t, skip = -1) { SLEEPX.forEach((x, i) => { if (i === skip || i >= C.z.length) return; place(C.z[i], 3000 + x, 1.8, -50.7 + (hash(i) - .5) * .3, (hash(i + 3) - .5) * .4); snooze(C.z[i], t, i); }); }
function boatCrew(t, o = {}) {
  place(C.you, -1.55, .85, 0, o.youRy ?? 0, SETS.boat); pose(C.you, { t, sit: true, nod: o.youNod ?? .05, lean: o.youLean || 0 });
  place(C.marco, .45, .85, -.15, Math.PI / 2, SETS.boat); pose(C.marco, { t, sit: true, nod: o.mNod ?? 0, armsFwd: o.row ? .8 : 0, yaw: o.mYaw || 0, lean: o.mLean || 0 });
  place(C.cat, 1.85, .97, 0, 0, SETS.boat); catPose(C.cat, t, o.cat || { tailUp: .4 });
}
function sQuay(t) {
  SETS.harb.visible = true;
  const L = look('harbour'); aimKey(V(3000, 0, -40), L, 24);
  points([[[3000, 6, -30], '#c8d2e0', 3, 30]]);
  const bz = lerp(-24, -38, eo(seg(t, 0, CUT[1] + 1.2)));
  boatAt(bz, t); puffs(t, 99);
  SETS.lever.rotation.z = 0; SETS.oar.rotation.set(0, 0, 0);
  boatCrew(t, { youRy: Math.PI / 2, youNod: -.05, cat: { tailUp: lerp(.4, -.2, seg(t, 5.5, 6.5)), tilt: .1, arch: .1 * seg(t, 5.5, 6.5) } });
  SETS.buoys.forEach((b, i) => b.position.y = .05 + Math.sin(t * 1.6 + i) * .08);
  sleepers(t);
  shake = 0;
  const u = eio(seg(t, 0, CUT[1])), z2 = eio(seg(t, 5.6, CUT[1]));
  setCam(V(3001.7, 2.6, bz + 7.4).lerp(V(3001.5, 2.5, bz + 6.6), u), V(3000, lerp(2.2, 3.2, z2), -50), lerp(40, 28, z2), V(3000, 2.8, -50.5), lerp(60, 40, z2));
}
function sGlide(t) {
  SETS.harb.visible = true;
  const L = look('harbour'); aimKey(V(3000, 0, -46), L, 14);
  points([[[3003, 5, -44], '#c8d2e0', 3, 20]]);
  const kb = Math.max(0, t - T.bump), bump = kb > 0 ? Math.sin(kb * 9) * Math.exp(-kb * 3) : 0;
  const bz = lerp(-38, -47.1, eo(seg(t, CUT[1], T.bump))) + (kb > 0 ? .12 * Math.sin(kb * 3) * Math.exp(-kb * 1.5) : 0);
  boatAt(bz, t, bump); puffs(t, T.lever + .25);
  SETS.lever.rotation.z = 1.1 * eo(seg(t, T.lever - .1, T.lever + .15));
  const rowing = t > T.row && t < T.bump - .3, rp = (t - T.row) * 3.6;
  SETS.oar.rotation.set(rowing ? .12 * Math.sin(rp) : 0, rowing ? .45 * Math.sin(rp + 1.2) : 0, 0);
  const duck = eio(seg(t, 12.9, 13.3)) * (1 - eio(seg(t, 15.1, 15.5)));
  const freeze = t > T.stir && t < T.settle + .3;
  boatCrew(t, { youRy: 0, youNod: freeze ? -.25 : .05, youLean: freeze ? -.08 : 0, row: rowing || t > T.bump - .3, mNod: freeze ? -.35 : 0, mYaw: freeze ? -.2 : 0,
    cat: { tailUp: 1 - duck * 1.3, tilt: -.25 * duck, arch: 0, yaw: freeze ? .3 : 0 } });
  C.cat.body.position.y -= .12 * duck; C.cat.body.scale.set(1 + .1 * duck, 1 - .3 * duck, 1);
  const pull = t > T.lever - .45 && t < T.lever + .6;
  if (pull) { C.you.armL.rotation.x = -.75 + .35 * eo(seg(t, T.lever - .1, T.lever + .15)); C.you.armL.rotation.z = -.6; }
  if (freeze) { C.you.armL.rotation.x = C.you.armR.rotation.x = -1.6; C.you.armL.rotation.z = .3; C.you.armR.rotation.z = -.3; }
  SETS.buoys.forEach((b, i) => b.position.y = .05 + Math.sin(t * 1.6 + i) * .08);
  // the sleeper over the bow leans out; the bump makes it stir, then it nods off again
  sleepers(t, 4);
  const Z = C.z[4]; place(Z, 3000.25, 1.8, -50.55, 0);
  const lift = eo(seg(t, T.stir, T.stir + .35)) * (1 - eio(seg(t, T.settle, T.settle + .6)));
  snooze(Z, t, 4); Z.body.rotation.x = .38; Z.head.rotation.x = lerp(.95, -.25, lift); Z.head.rotation.y = .35 * lift * Math.sin((t - T.stir) * 2);
  Z.armR.rotation.x = .3 + .1 * Math.sin(t * 1.3); Z.armL.rotation.x = .2; Z.mouth.scale.set(1, lerp(.6, 1.5, lift), 1); lids(Z, lift);
  shake = kb > 0 && kb < .3 ? .02 : 0;
  if (t < 11.4) {
    const u = eio(seg(t, CUT[1], 11.4));
    setCam(V(3004.4, 2.0, bz + 3.6).lerp(V(3003.9, 1.9, bz + 3.0), u), V(3000, 1.25, bz + 1.9), 40, V(3000, 1.4, bz + 1.6), 90);
  } else {
    const u = eio(seg(t, 11.4, CUT[2]));
    setCam(V(3007.6, 2.4, -44.0).lerp(V(3006.9, 2.4, -44.5), u), V(2999.8, 2.5, -48.4), 44, V(3000, 2.2, -48.8), 110);
  }
}
function sStreet(t) {
  SETS.street.visible = true;
  const L = look('street'); aimKey(V(3400, 0, -6), L, 16);
  points([[[3400, 5, -4], '#c8d2e0', 2, 20]]);
  const partB = t >= T.close;
  const z0 = partB ? Math.max(-9.6, -5.6 - 1.0 * (t - T.close)) : 3.2 - 1.0 * (t - CUT[2]);
  const sniff = partB ? eio(seg(t, 23.6, 24.0)) * (1 - eio(seg(t, 24.9, 25.3))) : 0;
  place(C.you, 3399.5, 0, z0, Math.PI); tiptoe(C.you, t, 0);
  place(C.marco, 3400.55, 0, z0 + .9, Math.PI); tiptoe(C.marco, t, 1);
  const cz = partB ? Math.max(-10.3, -6.3 - 1.15 * (t - T.close)) : z0 - 1.0;
  place(C.cat, partB ? lerp(3399.75, 3398.7, eio(seg(t, 22.4, 23.6))) : 3399.75, 0, cz, Math.PI / 2 + sniff * (Math.PI / 2)); catPose(C.cat, t, { tailUp: 1, yaw: sniff * .5, tilt: -.2 * sniff, hop: !partB || t < 23.3 ? Math.abs(Math.sin(t * 5.2)) * .05 : 0 });
  if (sniff > 0) { C.you.root.rotation.y = Math.PI + sniff * .4; }
  // the curtain twitches; eyes peek out, then it falls back
  const ct = eio(seg(t, T.curtain, T.curtain + .3)) * (1 - eio(seg(t, T.curtain + 1.4, T.curtain + 1.8)));
  SETS.curtain.position.z = .3 * ct; SETS.curtain.scale.z = 1 - .55 * ct; SETS.eyes.visible = ct > .3;
  shake = 0;
  if (!partB) {
    const u = eio(seg(t, CUT[2], T.close));
    setCam(V(3401.1, 1.9, -9.6).lerp(V(3401.0, 1.85, -8.8), u), V(3400.3, 1.45, 0).lerp(V(3400.3, 1.6, -1.5), u), 50, V(3400, 1.4, z0), 150);
  } else {
    const u = eio(seg(t, T.close, CUT[3]));
    setCam(V(3401.9, 1.15, -10.7).lerp(V(3401.5, 1.05, -10.8), u), V(3397.87, .8, -10.9), 44, V(3397.9, .85, -11.0), 100);
  }
}
function sDoor(t) {
  SETS.door.visible = SETS.doorOut.visible = true;
  const pov = t >= T.pov && t < T.back;
  const L = look(pov ? 'slot' : 'door'); aimKey(V(3800, 0, 0), L, 12);
  points([[[3800, 6, 6], '#c8d2e0', 2, 20]]);
  // the trio walks up and stops in front of the door
  const arr = eo(seg(t, CUT[3], 27.4)), walking = t < 27.4;
  const inw = eio(seg(t, T.walkIn, CUT[4] + .4)), zIn = -2.2 * inw;
  place(C.you, 3799.45, 0, lerp(6.0, 1.7, arr) + zIn, Math.PI); place(C.marco, 3800.55, 0, lerp(6.8, 1.75, arr) + zIn, Math.PI);
  pose(C.you, { t, phase: t * 5, walk: walking || inw > 0 && inw < 1 ? .6 : 0, nod: -.1 }); pose(C.marco, { t, phase: t * 5 + 1, walk: walking || inw > 0 && inw < 1 ? .6 : 0, nod: -.1 });
  place(C.cat, 3800.0, 0, lerp(5.4, 1.25, arr) + zIn, Math.PI / 2); catPose(C.cat, t, { tailUp: .8, tilt: .35, hop: walking ? Math.abs(Math.sin(t * 6)) * .05 : 0 });
  const gy = eo(seg(t, T.grinY, T.grinY + .25)) * (1 - eio(seg(t, 34.4, 34.9))), gm = eo(seg(t, T.grinM, T.grinM + .25)) * (1 - eio(seg(t, 34.5, 35.0)));
  grin(C.you, gy); grin(C.marco, gm);
  if (gy > 0) C.you.head.rotation.z = .08 * gy; if (gm > 0) C.marco.head.rotation.z = -.1 * gm;
  // slot, bolts, door
  const so = eo(seg(t, T.slot, T.slot + .25)) * (1 - eo(seg(t, T.back + .05, T.back + .3)));
  SETS.slotPlate.position.x = .65 + .5 * so; SETS.slotGlow.visible = so > .05;
  const jolt = [T.bolt1, T.bolt2, T.bolt3].reduce((a, b) => a + (t > b ? Math.exp(-(t - b) * 18) * Math.sin((t - b) * 60) : 0), 0);
  SETS.doorH.rotation.y = 1.9 * eio(seg(t, T.open, T.open + .9)) + jolt * .006;
  // the keeper, inside, with the red torch
  const open = t > T.open;
  if (open) {
    place(C.keeper, 3800.1, 0, -1.6 + .3 * eo(seg(t, T.open + .3, T.open + 1)), 0);
    const wv = seg(t, T.wave, T.wave + 1.4);
    pose(C.keeper, { t, reachR: .7, nod: -.05 }); C.keeper.armL.rotation.x = -wv * 2.2 * (wv < 1 ? 1 : 0); C.keeper.armL.rotation.z = -.2 - .4 * Math.sin(wv * Math.PI * 4) * (wv < 1 ? 1 : 0);
    grin(C.keeper, .45 * eo(seg(t, T.wave - .3, T.wave + .1)));
    C.keeper.root.updateMatrixWorld(true); torchLight.position.copy(SETS.torch.getWorldPosition(V(0, 0, 0)));
    torchLight.target.position.set(3800, 1.6, 1.7); torchLight.intensity = 10; torchLight.color.set('#ff4a30');
  }
  shake = 0;
  if (pov) {
    const tg = [[28.5, V(3800, 1.6, 2.2)], [28.9, V(3799.45, 2.3, 1.7)], [29.9, V(3800.55, 2.3, 1.75)], [30.9, V(3800, 2.2, 1.7)]];
    let a = tg[0][1].clone();
    for (let i = 1; i < tg.length; i++) a.lerp(tg[i][1], eio(seg(t, tg[i][0] - .35, tg[i][0] + .05)));
    torchLight.position.set(3800, 2.12, -.75); torchLight.target.position.copy(a); torchLight.intensity = 5; torchLight.angle = .34; torchLight.color.set('#ffa08a');
    setCam(V(3800, 2.12, -.62), a.clone().lerp(V(3800, 2.0, 1.7), .5), 70, a, 40);
  } else if (t < T.pov) {
    const u = eio(seg(t, CUT[3], T.pov));
    torchLight.angle = .32;
    setCam(V(3802.4, 2.3, 9.8).lerp(V(3801.9, 2.1, 7.6), u), V(3800, 3.4, -2).lerp(V(3800, 2.4, -1), u), 50, V(3800, 2.0, -.8), 140);
  } else {
    const u = eio(seg(t, T.back, CUT[4]));
    torchLight.angle = .32;
    setCam(V(3804.8, 2.1, 3.9).lerp(V(3804.4, 2.05, 3.4), u), V(3800.1, 1.5, .4), 46, V(3800, 1.7, .5), 120);
  }
}
function sInside(t) {
  SETS.inside.visible = true;
  const L = look('inside'); aimKey(V(4200, 0, 0), L, 6);
  const fl = 1 + .06 * Math.sin(t * 13) * Math.sin(t * 7.3);
  points([[[4200.3, 1.3, -1.6], '#ff4028', 9 * fl, 7], [[4200, 1.6, 3.0], '#b8c8dc', 2.2, 6], [[4198.6, 2.5, -1.5], '#ff6a40', 1.5, 5]]);
  // survivors along the back wall
  place(C.kid, 4198.75, .36, -2.25, .25); C.kid.root.scale.setScalar(.68); pose(C.kid, { t, sit: true, nod: .1, armsFwd: .5 });
  place(C.cook, 4200.45, .3, -2.6, -.05); pose(C.cook, { t, sit: true, nod: .05 + .03 * Math.sin(t), armX: -.2 });
  place(C.old, 4202.0, .3, -1.85, -.55); pose(C.old, { t, sit: true, nod: .15, tilt: .1, armX: -.3 });
  SETS.teddy.visible = true; C.kid.root.updateMatrixWorld(true); SETS.teddy.position.copy(C.kid.root.localToWorld(V(0, .95, .45)));
  // the keeper: finger to her lips
  if (t < T.kid) place(C.keeper, 4199.35, 0, -.3, .35); else place(C.keeper, 4200.9, 0, .1, -.4); pose(C.keeper, { t, nod: -.05 });
  const sh = eio(seg(t, T.shh - .3, T.shh + .1));
  C.keeper.armR.rotation.set(lerp(0, -2.45, sh), 0, lerp(.12, -.6, sh)); C.keeper.armL.rotation.x = -.6 * (1 - sh);
  // the trio just inside the door
  place(C.you, 4199.55, 0, 1.75, Math.PI + .15); pose(C.you, { t, nod: .05 });
  place(C.marco, 4201.35, 0, 1.55, Math.PI - .3); pose(C.marco, { t, nod: .05, armsUp: 0 });
  const kidT = t >= T.kid;
  if (!kidT) { place(C.cat, 4199.9, 0, 1.3, Math.PI / 2 + .3); catPose(C.cat, t, { tailUp: .8, tilt: .2 }); }
  else {
    place(C.cat, 4198.7, 0, -1.7, -Math.PI / 2 + .6);
    catPose(C.cat, t, { tailUp: .9, tilt: .25, nod: 0, yaw: -.5 + .15 * Math.sin(t * 1.5) });
    C.kid.armR.rotation.x = -.7 + .2 * Math.sin(t * 4); C.kid.armL.rotation.x = -.7;
    SETS.teddy.position.copy(C.kid.root.localToWorld(V(-.45, .95, .35)));
  }
  shake = 0;
  if (!kidT) {
    const u = eio(seg(t, CUT[4], T.kid));
    setCam(V(4200.45, 2.4, 3.05).lerp(V(4200.4, 2.3, 2.8), u), V(4199.6, 1.2, -1.6), 56, V(4199.7, 1.8, .4), 120);
  } else {
    const u = eio(seg(t, T.kid, CUT[5]));
    setCam(V(4199.5, 1.7, 2.1).lerp(V(4199.45, 1.65, 1.7), u), V(4198.8, .9, -2.0), 32, V(4198.75, .9, -2.1), 70);
  }
}
function horde(t, sh) {
  const { zb, zh, ze, spots } = SETS.horde; const m = new THREE.Matrix4();
  spots.forEach(([x, y, z], i) => {
    const sx = .12 * Math.sin(t * 3 + i * 1.7), b = Math.abs(Math.sin(t * 2.2 + i)) * .1;
    m.makeTranslation(x + sx, y + 1.5 + b, z); zb.setMatrixAt(i, m);
    m.makeTranslation(x + sx * 1.4, y + 2.75 + b, z + .35); zh.setMatrixAt(i, m);
    m.makeTranslation(x + sx * 1.4 - .2, y + 2.8 + b, z + .82); ze.setMatrixAt(i * 2, m);
    m.makeTranslation(x + sx * 1.4 + .2, y + 2.8 + b, z + .82); ze.setMatrixAt(i * 2 + 1, m);
  });
  zb.count = zh.count = spots.length; ze.count = spots.length * 2;
  zb.instanceMatrix.needsUpdate = zh.instanceMatrix.needsUpdate = ze.instanceMatrix.needsUpdate = true;
}
function sLamp(t) {
  SETS.lamp.visible = SETS.lampOut.visible = true;
  const L = look('lamp'); aimKey(V(4600, 0, -1), L, 8);
  scene.fog.density = lerp(.0095, .0042, eio(seg(t, T.emerge - .5, CUT[6])));
  points([[[4600, 2.6, 1.5], '#e0e6ee', 3, 8]]);
  const zS = lerp(-560, -185, eo(seg(t, CUT[5], CUT[6] + .6)));
  SETS.ship.position.set(5, -30 + Math.sin(t * .4) * .3, zS); SETS.ship.rotation.y = -.05;
  horde(t);
  SETS.steam.forEach((s, i) => {
    const k = (t - T.horn2 - i * .07) / 2.2; s.visible = k > 0 && k < 1; if (!s.visible) return;
    s.position.set(Math.sin(i * 2.3) * 1.5, 40 + k * 10 + i * .3, -27 + k * 3); s.scale.setScalar(1.2 + k * 5); s.material.opacity = .85 * (1 - k);
  });
  const fl = eio(seg(t, T.horn1, T.horn1 + .2)) * (1 - eio(seg(t, T.horn1 + .9, T.horn1 + 1.6)));
  const lean = -.08 * fl, back2 = t > T.horn2 ? -.06 * eo(seg(t, T.horn2, T.horn2 + .3)) : 0;
  place(C.keeper, 4598.55, 0, -1.7, Math.PI + .25); pose(C.keeper, { t, nod: -.1, lean: lean + back2 }); SETS.torch.visible = true;
  place(C.you, 4599.55, 0, -2.25, Math.PI + .05); pose(C.you, { t, nod: -.12 - .05 * fl, lean: lean + back2 });
  place(C.marco, 4600.95, 0, -1.85, Math.PI - .1); pose(C.marco, { t, nod: -.1, lean: lean + back2, armsFwd: t > T.horn2 ? .3 : 0 });
  const pf = eo(seg(t, T.puff, T.puff + .25));
  place(C.cat, 4601.6, .93, -2.62, Math.PI / 2 - .15); catPose(C.cat, t, { tailUp: lerp(.3, 1.3, pf), arch: .35 * pf, tilt: -.1, hop: .06 * Math.sin(seg(t, T.puff, T.puff + .3) * Math.PI) });
  C.cat.tail.forEach(g => g.children.forEach(m => { if (m.isMesh) m.scale.set(1 + 1.6 * pf, 1, 1 + 1.6 * pf); }));
  C.cat.body.scale.set(1 + .08 * pf, 1 + .12 * pf, 1 + .12 * pf);
  shake = fl * .01 + (t > T.horn2 && t < T.horn2 + 1.2 ? .012 : 0);
  if (t < T.camB) {
    const u = eio(seg(t, CUT[5], T.camB));
    setCam(V(4600.45, 3.1, 1.4).lerp(V(4600.4, 2.95, .4), u), V(4600.3, -7, -150), 50, V(4600, -10, -300), 0);
  } else {
    const u = eio(seg(t, T.camB, CUT[6]));
    setCam(V(4602.7, 2.0, 1.3).lerp(V(4602.5, 1.9, .7), u), V(4601.0, -1.3, -16), 46, V(4601.6, 1.3, -2.6), 50);
  }
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
  o2.font = '46px "Lilita One"'; o2.fillStyle = INK; o2.fillText('PART 5', W / 2, py + ph / 2 + 3);
  TX.push({ id: 'h2', text: 'PART 5', x0: W / 2 - pw / 2, y0: py, x1: W / 2 + pw / 2, y1: py + ph });
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
const HOT = new Set(['ZOMBIE', 'APOCALYPSE', 'LAND...', 'QUAY.', 'CUT', 'ENGINE', 'ASLEEP', 'SIGNS', 'LIVING', 'ARROWS.', 'SMILEY', 'HUMAN.', 'SMILE.', 'GRIN.', 'WORKS.', 'PURPOSE.', 'LIGHT', 'SAFE.', 'QUIET.', 'DARK.', 'HORN', 'FOG.', 'ENGINES', 'OFF.']);
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
// the keeper's view through the door slot: a wide slit, red at the edges
function slotMask(t) {
  const k = eo(seg(t, T.pov, T.pov + .25)), w = 1000 * (1.3 - .3 * k), h = 560 * (1.3 - .3 * k), cy = 980;
  o2.save(); o2.fillStyle = '#060404'; o2.beginPath(); o2.rect(0, 0, W, H); o2.roundRect(W / 2 - w / 2, cy - h / 2, w, h, 40); o2.fill('evenodd');
  const gr = o2.createRadialGradient(W / 2, cy, h * .4, W / 2, cy, w * .6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,0,0,.6)');
  o2.fillStyle = gr; o2.beginPath(); o2.roundRect(W / 2 - w / 2, cy - h / 2, w, h, 40); o2.fill();
  o2.restore();
}
function endCard(t) {
  o2.fillStyle = '#0d0f18'; o2.fillRect(0, 0, W, H);
  const s = back((t - CUT[6] - .25) / .25, 2);
  if (t < CUT[6] + .25) return;
  o2.save(); o2.translate(W / 2, 960); o2.scale(s, s);
  o2.font = '190px "Lilita One"'; o2.textAlign = 'center'; o2.textBaseline = 'middle';
  o2.fillStyle = 'rgba(0,0,0,.6)'; o2.fillText('PART 6?', 8, 14);
  o2.lineWidth = 18; o2.strokeStyle = '#e0312b'; o2.lineJoin = 'round'; o2.strokeText('PART 6?', 0, 0);
  o2.fillStyle = '#ffffff'; o2.fillText('PART 6?', 0, 0);
  o2.restore();
  TX.push({ id: 'e1', text: 'PART 6?', x0: 200, y0: 850, x1: 880, y1: 1070 });
}

// ---------- events (sound) ----------
function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push(Object.assign({ t: +t.toFixed(3), type }, o));
  for (const [id, t] of Object.entries(VO)) ev(t, 'voice', { id });
  ev(0, 'amb', { name: 'harbour', t1: CUT[2] }); ev(CUT[2], 'amb', { name: 'street', t1: CUT[3] }); ev(CUT[3], 'amb', { name: 'door', t1: CUT[4] });
  ev(CUT[4], 'amb', { name: 'inside', t1: CUT[5] }); ev(CUT[5], 'amb', { name: 'lamp', t1: CUT[6] });
  CLOCK.slice(1).forEach(([t]) => ev(t, 'tick'));
  ev(0, 'putter', { t1: T.lever + .15 }); ev(T.lever, 'lever'); ev(T.lever + .12, 'cough');
  for (const t of [2.4, 4.7, 6.9, 12.0]) ev(t, 'snore', { p: .7 + hash(t) * .3 });
  for (let t = T.row + .3; t < T.bump - .3; t += 1.75) ev(t, 'oar');
  ev(T.bump, 'bump'); ev(T.stir, 'groan', { p: .85, g: .55 }); ev(T.settle + .2, 'snore', { p: .65 });
  for (let t = CUT[2] + .2, k = 0; t < CUT[3] - .2; t += .38, k++) if (Math.abs(t - T.close) > .15) ev(t, 'step', { g: .3 + .1 * (k % 2) });
  ev(19.9, 'dog'); ev(T.curtain, 'swish'); ev(T.curtain + 1.4, 'swish');
  ev(23.8, 'sniff'); ev(24.4, 'meow', { p: 1.35, g: .5 });
  for (let t = CUT[3] + .2; t < 27.4; t += .42) ev(t, 'step', { g: .4 });
  ev(T.slot, 'slot'); ev(T.pov - .05, 'click');
  ev(T.grinY + .05, 'boing'); ev(T.grinM + .05, 'boing', { p: 1.2 });
  for (const b of [T.bolt1, T.bolt2, T.bolt3]) ev(b, 'bolt'); ev(T.open, 'doorcreak'); ev(T.open + 1.2, 'exhale');
  for (let t = T.walkIn; t < CUT[4]; t += .4) ev(t, 'step', { g: .35 });
  ev(T.shh, 'shh'); ev(T.kid + .3, 'purr', { t1: CUT[5] });
  ev(T.horn1, 'horn', { g: .55, far: 1 }); ev(T.emerge, 'thrum', { t1: CUT[6] }); ev(T.horn2, 'horn', { g: 1.0 });
  for (let i = 0; i < 10; i++) ev(47.2 + i * .45 + hash(i) * .3, 'groan', { p: .7 + hash(i + 4) * .5, g: .25, far: 1 });
  ev(T.puff, 'hisscat');
  ev(CUT[6], 'cutoff'); ev(CUT[6] + .25, 'endhit');
  return E.sort((a, b) => a.t - b.t);
}

// ---------- render ----------
const SCENES = [sQuay, sGlide, sStreet, sDoor, sInside, sLamp];
const SETKEYS = ['harb', 'street', 'door', 'doorOut', 'inside', 'lamp', 'lampOut'];
function render(t) {
  tNow = t; TX = [];
  const i = sceneAt(t);
  o2.clearRect(0, 0, W, H);
  if (i < 6) {
    for (const k of SETKEYS) SETS[k].visible = false;
    hideAll();
    SCENES[i](t);
    post.composer.render();
    const since = t - CUT[i];
    if (i > 0 && since < .05) { o2.fillStyle = 'rgba(255,255,255,.5)'; o2.fillRect(0, 0, W, H); }
    if (i === 3 && t >= T.pov && t < T.back) slotMask(t);
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
