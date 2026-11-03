// ZOMBIE APOCALYPSE ON A CRUISE SHIP · PART 2 — Chunky 3D Cartoon, 1080x1920. render(t) is a pure function of t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eio, eo, ei, back, hash, V, rbox, sph, cap, cyl, cone, tor, mat, glow, mesh, grp, person, pose, cat, catPose, SKIN } from './kit3d.js';

const W = 1080, H = 1920;
const Q = new URLSearchParams(location.search);
const AO = Q.get('ao') !== '0';

// ---------- timeline ----------
const DUR = 54.0;
const CUT = [0, 10.6, 20.2, 30.0, 40.0, 44.6, 47.4, 51.6];
const CLOCK = [[0, 'DAY 2 • 6:23 AM'], [10.6, 'DAY 2 • 6:24 AM'], [20.2, 'DAY 2 • 6:40 AM'], [30.0, 'DAY 2 • 7:05 AM'],
               [40.0, 'DAY 2 • 7:30 AM'], [44.6, 'DAY 2 • 7:41 AM']];
const VO = { l01: 0.2, l02: 5.7, l03: 10.8, l04: 14.9, l05: 20.4, l06: 23.4, l07: 27.5, l08: 30.3, l09: 32.4, l10: 37.3, l11: 40.3, l12: 44.8, l13: 47.7, l14: 49.9 };
const T = { bulge1: 1.2, bulge2: 2.6, bulge3: 4.1, reach: 6.2, stop: 6.9,
            knock1: 11.35, knock2: 11.62, back1: 13.25, back2: 13.47, back3: 13.69, pop: 14.15,
            crank: 23.9, jerk1: 24.6, jerk2: 25.5, over: 27.4,
            unroll: 30.6, insert: 32.6, route0: 33.1, route1: 36.6, wide2: 37.3,
            static: 41.4, horn: 46.5, clear: 49.6, tilt: 50.9 };
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
const steelM = mat('#9aa3ad', { metalness: .5, roughness: .4 });
function skyPlane(parent, x, y, z, w, h, stops) {
  const sc = document.createElement('canvas'); sc.width = 16; sc.height = 256; const k = sc.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 256); stops.forEach(([o, c]) => gr.addColorStop(o, c));
  k.fillStyle = gr; k.fillRect(0, 0, 16, 256); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: st, fog: false }), x, y, z, parent, { cast: false, receive: false });
}
const DAWN = [[0, '#7aa0d8'], [.6, '#f5bba7'], [1, '#ffe2b8']];

// LIFEBOAT DECK at the origin (morning)
{
  const g = grp(scene); SETS.boatDeck = g;
  mesh(rbox(24, .6, 16, .2), wood, 0, -.3, 2, g);
  for (let i = 0; i < 10; i++) mesh(rbox(24, .02, .06, .01), woodD, 0, .005, -5 + i * 1.5, g, { cast: false });
  for (let x = -11; x <= 11; x += 2.1) mesh(cyl(.08, .08, 1.7), white, x, .85, -5.9, g);
  mesh(cyl(.1, .1, 24), white, 0, 1.7, -5.9, g, { rz: Math.PI / 2 });
  mesh(cyl(.07, .07, 24), white, 0, .9, -5.9, g, { rz: Math.PI / 2 });
  mesh(rbox(.6, 9, 16, .2), whiteW, 11.5, 4.5, 2, g);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) mesh(sph(.35, 16, 10), mat('#1b1d2a', { roughness: .2 }), 11.15, 2.4 + r * 2.6, -3 + c * 3, g, { s: [.3, 1, 1], cast: false });
  // the hull below the deck edge, portholes facing the sea
  mesh(rbox(40, 40, 1.2, .2), whiteW, 0, -20.6, -6.6, g);
  mesh(rbox(40, 1.2, 1.25, .1), mat('#1f3f7a'), 0, -36, -6.6, g, { cast: false });
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) mesh(sph(.32, 12, 8), mat('#28304a', { roughness: .2 }), -13 + c * 2, -3.5 - r * 4.6, -7.2, g, { s: [1, 1, .3], cast: false });
  // davits
  for (const x of [-3.2, 3.2]) { mesh(cyl(.18, .22, 5.2), steelM, x, 2.6, -6.4, g); mesh(cyl(.15, .15, 1.6), steelM, x, 5.1, -7.1, g, { rx: Math.PI / 2 }); }
  // the boat
  const boat = grp(g, 0, 2.2, -7.7); SETS.boat = boat;
  mesh(cap(1.1, 4.6), mat('#ff7a1a', { roughness: .45 }), 0, 0, 0, boat, { rz: Math.PI / 2, s: [1, 1, .95] });
  mesh(cap(1.0, 4.2), mat('#fffaf0', { roughness: .6 }), 0, .5, 0, boat, { rz: Math.PI / 2, s: [.85, 1, .9] });
  for (let i = 0; i < 4; i++) mesh(sph(.2, 14, 10), mat('#1b1d2a', { roughness: .2 }), -2.2 + i * 1.45, .62, .9, boat, { s: [1, .7, .3], cast: false });
  mesh(rbox(6.2, .16, 2.3, .07), mat('#e0312b'), 0, -.12, 0, boat);
  const hinge = grp(boat, 0, 1.32, -.42); SETS.hatch = hinge;
  mesh(rbox(1.05, .12, .9, .05), mat('#ffd23f'), 0, .02, .45, hinge);
  SETS.bulge = mesh(sph(.62, 20, 14), mat('#fffaf0', { roughness: .6 }), .8, 1.0, .1, boat, { s: [1, .2, 1] });
  SETS.cables = [];
  for (const x of [-3.2, 3.2]) SETS.cables.push(mesh(cyl(.03, .03, 1), mat('#3a3a3a'), x, 0, -7.7, g, { cast: false }));
  // the winch
  const wn = grp(g, 4.6, 0, -4.9); SETS.winch = wn;
  mesh(rbox(1.0, 1.1, .9, .12), mat('#e0312b'), 0, .55, 0, wn);
  mesh(cyl(.32, .32, 1.1), steelM, 0, 1.25, 0, wn, { rz: Math.PI / 2 });
  const crank = grp(wn, .62, 1.25, 0); SETS.crank = crank;
  mesh(rbox(.08, .7, .1, .03), mat('#1b1d2a'), 0, .3, 0, crank); mesh(cyl(.06, .06, .3), mat('#ffd23f'), .15, .62, 0, crank, { rz: Math.PI / 2 });
  // sea + sky
  mesh(new THREE.PlaneGeometry(900, 900), mat('#5f87b3', { roughness: .2 }), 0, -38, -100, g, { rx: -Math.PI / 2, cast: false });
  skyPlane(g, 0, 30, -170, 700, 220, DAWN);
}
// BRIDGE at x=600
{
  const g = grp(scene, 600, 0, 0); SETS.bridge = g;
  mesh(rbox(20, .4, 14, .1), mat('#46546a'), 0, -.2, 0, g);
  mesh(rbox(20, 1.7, .8, .1), mat('#e9edf2'), 0, .85, -5, g);
  mesh(rbox(20, .6, 14, .1), mat('#e9edf2'), 0, 6.3, 0, g);
  for (let x = -9; x <= 9; x += 3) mesh(rbox(.28, 4.4, .28, .08), mat('#e9edf2'), x, 3.9, -5, g);
  const out = grp(scene, 600, 0, -40); SETS.outside = out;
  skyPlane(out, 0, 30, -60, 400, 120, [[0, '#86aee6'], [.55, '#f6c9b4'], [.8, '#ffe0b0'], [1, '#fff0d0']]);
  mesh(new THREE.PlaneGeometry(400, 200), mat('#6d93bd', { roughness: .2 }), 0, -6, 20, out, { rx: -Math.PI / 2, cast: false });
  mesh(rbox(9, 1.3, 1.6, .2), mat('#dfe4ea'), 0, .65, -3.7, g);
  for (let i = 0; i < 4; i++) mesh(rbox(1.5, .9, .1, .06), glow(i % 2 ? '#5fe0ff' : '#7dffb5', .9), -3 + i * 2, 1.65, -4.1, g, { rx: -.5, cast: false });
  const wh = grp(g, 0, 1.9, -2.85); mesh(tor(.55, .07), mat('#a8744a'), 0, 0, 0, wh); for (let i = 0; i < 4; i++) mesh(cyl(.04, .04, 1.1), mat('#a8744a'), 0, 0, 0, wh, { rz: i * Math.PI / 4 }); mesh(cyl(.08, .08, .6), mat('#7b8794'), 0, -.5, 0, wh);
  SETS.wheel = wh;
  const ch = grp(g, -.2, 0, -.6); mesh(cyl(.12, .3, .9), mat('#7b8794', { metalness: .5, roughness: .35 }), 0, .45, 0, ch);
  const seat = grp(ch, 0, .9, 0); SETS.seat = seat;
  mesh(rbox(1.3, .35, 1.2, .15), mat('#23262d', { roughness: .4 }), 0, .17, 0, seat); mesh(rbox(1.3, 1.6, .3, .15), mat('#23262d', { roughness: .4 }), 0, 1.0, .5, seat);
  mesh(rbox(.6, 6.6, 14, .05), mat('#e9edf2'), -10, 3.1, 0, g);
  mesh(rbox(.2, 4, 2.4, .08), mat('#7b8794', { metalness: .4 }), -9.6, 2, 2, g);
  mesh(rbox(1.4, 1.2, 1.2, .12), mat('#d9b27a'), -8.8, .6, 1.3, g); mesh(rbox(1.4, 1.2, 1.2, .12), mat('#c9a06a'), -8.8, 1.8, 2.3, g);
  mesh(rbox(1.3, 1.1, 2.8, .25), mat('#e0312b'), -8.6, .55, 3.2, g);
  // the radio on the console
  const rd = grp(g, 1.6, 1.3, -3.5); SETS.radio = rd;
  mesh(rbox(1.1, .55, .55, .1), mat('#3a4150'), 0, .27, 0, rd);
  SETS.radioScreen = mesh(rbox(.5, .22, .05, .03), glow('#7dffb5', 1), -.18, .32, .28, rd, { cast: false });
  mesh(cyl(.07, .07, .05), mat('#ffd23f'), .3, .32, .28, rd, { rx: Math.PI / 2, cast: false });
  mesh(cyl(.02, .02, .7), mat('#1b1d2a'), .4, .85, -.1, rd, { cast: false });
  // the deck plan board (canvas drawn each frame while visible)
  const mc = document.createElement('canvas'); mc.width = 600; mc.height = 1000; SETS.mapC = mc;
  SETS.mapTex = new THREE.CanvasTexture(mc); SETS.mapTex.colorSpace = THREE.SRGBColorSpace;
  const bd = grp(g, 4.6, 0, -2.6); SETS.board = bd;
  mesh(rbox(2.05, 3.25, .14, .06), mat('#2a3350'), 0, 2.75, 0, bd);
  SETS.mapPaper = grp(bd, 0, 4.3, .09);
  mesh(new THREE.PlaneGeometry(1.8, 3.0), new THREE.MeshBasicMaterial({ map: SETS.mapTex, toneMapped: false, fog: false }), 0, -1.5, 0, SETS.mapPaper, { cast: false });
  for (const x of [-.7, .7]) mesh(cyl(.05, .05, 1.2), mat('#7b8794'), x, .6, -.1, bd);
}
// FUNNEL TOP at x=1000 (looking up from the sun deck)
{
  const g = grp(scene, 1000, 0, 0); SETS.funnel = g;
  mesh(rbox(26, .6, 22, .2), wood, 0, -.3, 0, g);
  const fz = -7;
  mesh(cyl(3.4, 3.8, 15, 32), whiteW, 0, 7.5, fz, g);
  mesh(cyl(3.42, 3.42, 2.2, 32, true), mat('#e0312b', { side: THREE.DoubleSide }), 0, 12.2, fz, g);
  mesh(cyl(3.3, 3.42, .9, 32), mat('#1b1d2a'), 0, 15.2, fz, g);
  // catwalk in front of the funnel
  mesh(rbox(10, .25, 2.2, .08), mat('#7b8794'), 0, 8.2, fz + 4.4, g);
  for (let x = -4.6; x <= 4.6; x += 1.15) mesh(cyl(.05, .05, 1.1), white, x, 8.85, fz + 5.4, g);
  mesh(cyl(.07, .07, 9.4), white, 0, 9.4, fz + 5.4, g, { rz: Math.PI / 2 });
  for (const x of [-4.6, 4.6]) mesh(cyl(.12, .12, 8.2), steelM, x, 4.1, fz + 5.2, g);
  // ladder
  for (let i = 0; i < 12; i++) mesh(cyl(.04, .04, .8), white, 3.6, .6 + i * .65, fz + 5.6, g, { rz: Math.PI / 2 });
  // the horn: brass body + bell, facing the camera
  const hn = grp(g, 1.6, 10.6, fz + 3.7); SETS.horn = hn;
  const brass = mat('#d9a441', { metalness: .55, roughness: .3 });
  mesh(cyl(.28, .28, 1.4), brass, 0, 0, -.2, hn, { rx: Math.PI / 2 });
  mesh(cyl(.75, .25, 1.0, 24, true), mat('#d9a441', { metalness: .55, roughness: .3, side: THREE.DoubleSide }), 0, 0, 1.0, hn, { rx: Math.PI / 2 });
  // steam puffs
  SETS.steam = [];
  for (let i = 0; i < 14; i++) { const m = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .35, transparent: true, opacity: 0, depthWrite: false });
    const s = mesh(sph(.6, 16, 12), m, 0, 0, 0, g, { cast: false, receive: false }); s.visible = false; SETS.steam.push(s); }
  skyPlane(g, 0, 40, -150, 600, 260, [[0, '#6f97d4'], [.5, '#f3b3a6'], [.8, '#ffd6a0'], [1, '#ffe9c4']]);
  mesh(sph(5, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff3d6', fog: false }), -14, 26, -140, g, { cast: false, receive: false });
}

// ---------- cast ----------
const C = {};
const YOU = { shirt: '#ffc81e', pants: '#2f5aa8', hair: '#3b2416', hairStyle: 'short', skin: SKIN[1] };
C.you = person(YOU); scene.add(C.you.root);
C.marco = person({ shirt: '#ffffff', stripe: '#24356e', pants: '#24356e', hairStyle: 'cap', hat: '#24356e', skin: SKIN[3] }); scene.add(C.marco.root);
C.cat = cat(); scene.add(C.cat.root);
C.fig = person({ shirt: '#000', pants: '#000', hair: '#000', skin: '#000' }); scene.add(C.fig.root);
{ const dark = mat('#121318', { roughness: 1 }); C.fig.root.traverse(m => { if (m.isMesh) m.material = dark; }); }
SETS.handset = mesh(cap(.07, .3), mat('#1b1d2a'), 0, -.66, .1, C.you.armR, { cast: false });

function place(P, x, y, z, ry = 0) { P.root.visible = true; P.root.position.set(x, y, z); P.root.rotation.set(0, ry, 0); }
function hideAll() { for (const k in C) C[k].root.visible = false; SETS.handset.visible = false; }

// ---------- looks ----------
function look(name) {
  const L = {
    morning: { bg: '#f3c3b0', fog: '#f0cdbd', fd: .006, sky: '#ffe0cc', gnd: '#4a5570', hi: 1.2, key: '#ffd7a8', ki: 2.4, kd: [-10, 9, 12], env: .5, exp: 1.0 },
    deep: { bg: '#f0cdbd', fog: '#e9c6b8', fd: .012, sky: '#ffe0cc', gnd: '#4a5570', hi: 1.3, key: '#ffd7a8', ki: 2.2, kd: [-10, 14, -6], env: .5, exp: 1.0 },
    bridge: { bg: '#f3c3b0', fog: '#f0cdbd', fd: .006, sky: '#ffe8d8', gnd: '#4a5570', hi: 1.25, key: '#ffe0b8', ki: 2.2, kd: [-10, 8, -14], env: .55, exp: 1.0 },
    back: { bg: '#f3b9a6', fog: '#f2c4b0', fd: .004, sky: '#ffd8c0', gnd: '#3a3f55', hi: .55, key: '#ffcf98', ki: 3.0, kd: [-6, 10, -18], env: .25, exp: 1.0 },
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
function setCam(pos, at, fov, focus, aper = 250, up = null) {
  const sx = shake ? Math.sin(tNow * 53) * shake : 0, sy = shake ? Math.cos(tNow * 47) * shake : 0;
  camera.up.copy(up || V(0, 1, 0));
  camera.position.copy(pos).add(V(sx, sy, 0)); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(at.clone().add(V(sx * .5, sy * .5, 0)));
  post.dof.focus = camera.position.distanceTo(focus || at); post.dof.aper = aper; post.dof.maxCoc = 7;
}

// ---------- boat state (shared by scenes 1-3) ----------
function boatState(t) {
  const b1 = seg(t, T.bulge1, T.bulge1 + .3), b2 = seg(t, T.bulge2, T.bulge2 + .25), b3 = seg(t, T.bulge3, T.bulge3 + .22);
  const k1 = seg(t, T.back1, T.back1 + .15), k2 = seg(t, T.back2, T.back2 + .15), k3 = seg(t, T.back3, T.back3 + .15);
  const bump = Math.sin(b1 * Math.PI) * .9 + Math.sin(b2 * Math.PI) * 1.1 + Math.sin(b3 * Math.PI) * 1.3 + (Math.sin(k1 * Math.PI) + Math.sin(k2 * Math.PI) + Math.sin(k3 * Math.PI)) * .9;
  SETS.bulge.visible = t < T.pop;
  SETS.bulge.scale.set(1 + bump * .2, .2 + bump * .9, 1 + bump * .2);
  SETS.bulge.position.x = .8 + (t > T.bulge2 ? -1.5 : 0) + (t > T.bulge3 ? 2.0 : 0) + (t > T.back1 ? -1.0 : 0);
  const pop = seg(t, T.pop, T.pop + .25);
  SETS.hatch.rotation.x = -back(pop, 2.5) * 1.9;
  // lowering: two jerks, then a swing
  const j1 = seg(t, T.jerk1, T.jerk1 + .35), j2 = seg(t, T.jerk2, T.jerk2 + .35);
  const drop = eo(j1) * 1.0 + eo(j2) * 1.2;
  const sw = (t > T.jerk1 ? Math.exp(-(t - T.jerk1) * .6) * Math.sin((t - T.jerk1) * 5) * .05 : 0) + (t > T.jerk2 ? Math.exp(-(t - T.jerk2) * .5) * Math.sin((t - T.jerk2) * 4.4) * .06 : 0);
  SETS.boat.position.y = 2.2 - drop;
  SETS.boat.rotation.x = Math.sin(t * 1.1) * .025 + bump * .05 * Math.sin(t * 13) + sw;
  SETS.boat.rotation.z = Math.sin(t * .9) * .015 + bump * .03 + sw * .5;
  // cables from the davit arms down to the boat
  const top = 5.1, bot = SETS.boat.position.y + .3;
  SETS.cables.forEach(c => { c.scale.y = top - bot; c.position.y = (top + bot) / 2; });
  SETS.crank.rotation.x = t > T.crank ? -(t - T.crank) * 7 * (t < 26.2 ? 1 : 0) - (t >= 26.2 ? (26.2 - T.crank) * 7 : 0) : 0;
  return { bump, pop };
}

// ---------- scenes ----------
function sLifeboat(t) {
  SETS.boatDeck.visible = true;
  const L = look('morning'); scene.fog.density = .003; aimKey(V(0, 0, -5), L, 14);
  points([]);
  boatState(t);
  // you creep toward the rail; at "rule one" the hand reaches and stops
  const w = eio(seg(t, .3, 4.6));
  const reach = eo(seg(t, T.reach, T.reach + .5)) * (1 - eo(seg(t, T.stop, T.stop + .5)) * .55);
  place(C.you, lerp(2.4, .6, w), 0, lerp(-.6, -4.6, w), Math.PI + lerp(.35, .1, w));
  pose(C.you, { t, phase: t * 5, walk: w > 0 && w < 1 ? .45 : 0, lean: .08 * (1 - w) + .05, reachR: reach, nod: -.25, yaw: t > T.stop ? -.25 * eo(seg(t, T.stop, T.stop + .4)) : 0 });
  place(C.cat, lerp(3.5, 2.0, w), 0, lerp(-.2, -3.9, w), Math.PI * .5 + .7);
  catPose(C.cat, t, { arch: t > T.bulge2 ? .18 : 0, tailUp: t > T.bulge1 ? 1 : 0, yaw: -.3, hop: t > T.bulge3 && t < T.bulge3 + .35 ? Math.sin((t - T.bulge3) / .35 * Math.PI) * .25 : 0 });
  shake = 0;
  const u = eio(seg(t, 0, CUT[1]));
  setCam(V(4.5, 3.6, 7.5).lerp(V(2.6, 3.5, 2.2), u), V(.3, 2.3, -7.2).lerp(V(.2, 2.6, -7.4), u), lerp(56, 46, u), V(.3, 2.6, -7.4), 140);
}
function sKnock(t) {
  SETS.boatDeck.visible = true;
  const L = look('morning'); scene.fog.density = .003; aimKey(V(0, 0, -5), L, 14);
  points([]);
  const { pop } = boatState(t);
  // you knock twice, then jump back when the hatch flies open
  const kn = [T.knock1, T.knock2].reduce((a, k) => a + Math.max(0, Math.sin(seg(t, k - .1, k + .1) * Math.PI)), 0);
  const jump = eo(seg(t, T.pop, T.pop + .3));
  place(C.you, .6 - jump * .3, Math.sin(seg(t, T.pop, T.pop + .45) * Math.PI) * .45, -4.6 + jump * 1.6, Math.PI + .1);
  pose(C.you, { t, reachR: t < T.pop ? .85 + kn * .2 : null, armsUp: jump * .8, lean: -jump * .2, nod: -.3 + jump * .15 });
  // Marco pops out of the roof hatch, arms up, screaming
  const up = back(seg(t, T.pop + .05, T.pop + .4), 1.8);
  C.marco.root.visible = t > T.pop;
  if (t > T.pop) {
    const bp = SETS.boat.position; place(C.marco, bp.x - .05, bp.y - .95 + up * .95, bp.z - .1, .15);
    pose(C.marco, { t, armsUp: t < 16.3 ? .9 : lerp(.9, .1, eo(seg(t, 16.3, 16.9))), armX: t > 17.2 ? -.4 : 0, nod: -.12, yaw: t > 16.9 ? .1 * Math.sin(t * 1.5) : 0 });
    if (t > 16.4) C.marco.mouth.scale.set(1, 1, 1); else C.marco.mouth.scale.set(1.8, 3.2, 1);
  }
  // the cat leaps sideways
  const cj = seg(t, T.pop + .05, T.pop + .5);
  place(C.cat, 2.0 + cj * 1.4, Math.sin(cj * Math.PI) * 1.1, -3.9 + cj * .8, Math.PI * .5 + .7);
  catPose(C.cat, t, { arch: t > T.pop ? .25 : .1, tailUp: 1, yaw: -.4 });
  shake = t > T.pop && t < T.pop + .5 ? .05 : 0;
  // two angles: over the shoulder for the knock, then a reverse on the boat for the reveal
  if (t < T.pop - .05) setCam(V(4.6, 3.4, 1.6), V(.3, 2.3, -7.4), 50, V(0, 2.4, -6.9), 220);
  else { const v = eio(seg(t, T.pop, CUT[2])); setCam(V(-2.8, 3.0, 1.8).lerp(V(-2.2, 3.2, .6), v), V(.2, 3.7, -7.6), 48, V(0, 3.9, -7.7), 200); }
}
function sWinch(t) {
  SETS.boatDeck.visible = true;
  const over = t >= T.over;
  const L = look(over ? 'deep' : 'morning'); scene.fog.density = over ? .009 : .003; aimKey(over ? V(0, -10, -8) : V(0, 0, -5), L, over ? 24 : 14);
  points([]);
  boatState(t);
  // Marco at the winch, cranking; you by the rail watching the boat
  place(C.marco, 5.55, 0, -4.4, -Math.PI / 2 - .25);
  const cr = t > T.crank && t < 26.2 ? 1 : 0;
  pose(C.marco, { t, armsFwd: .7, armX: cr * Math.sin((t - T.crank) * 7) * .5, lean: .12, nod: .1 });
  place(C.you, .4, 0, -4.7, Math.PI + .1);
  pose(C.you, { t, nod: t > T.jerk1 ? .35 : -.1, yaw: t < T.jerk1 ? .55 : 0, lean: .06 });
  place(C.cat, -1.1, 0, -4.9, Math.PI * .5 + .5); catPose(C.cat, t, { yaw: -.5, tilt: .2 });
  shake = (t > T.jerk1 && t < T.jerk1 + .3) || (t > T.jerk2 && t < T.jerk2 + .3) ? .04 : 0;
  if (!over) {
    const u = eio(seg(t, CUT[2], T.over));
    setCam(V(-4.6, 4.4, 7.0).lerp(V(-3.4, 4.0, 4.6), u), V(2.0, 2.0, -6.0).lerp(V(1.4, 1.6, -6.8), u), 52, V(1.8, 1.6, -6), 160);
  } else {
    // over the rail: tilt down the hull to the sea
    const v = eio(seg(t, T.over, T.over + 1.6));
    shake = .015;
    C.cat.root.visible = false;
    setCam(V(-3.0, 6.5, -10.5).lerp(V(-2.6, 9.0, -12.5), v), V(.2, 0, -8.6).lerp(V(.5, -36, -9.5), v), lerp(55, 64, v), V(0, -12, -9), 60);
  }
}
const ZDOTS = [[.68, .14], [.78, .16], [.55, .27], [.83, .29], [.62, .40], [.74, .43], [.52, .55], [.86, .56], [.66, .67], [.79, .70], [.58, .81], [.72, .83]];
function drawMap(t) {
  const c = SETS.mapC, k = c.getContext('2d'), w = c.width, h = c.height;
  k.fillStyle = '#e8dcc0'; k.fillRect(0, 0, w, h);
  k.strokeStyle = '#2a3350'; k.lineWidth = 6; k.strokeRect(12, 12, w - 24, h - 24);
  k.fillStyle = '#2a3350'; k.font = '54px "Lilita One"'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('DECK PLAN', w / 2, 62);
  const decks = 8, y0 = 115, y1 = h - 70, dh = (y1 - y0) / decks;
  for (let i = 0; i < decks; i++) {
    const y = y0 + i * dh;
    k.fillStyle = i % 2 ? '#d6c9a8' : '#e0d4b6'; k.beginPath(); k.roundRect(150, y + 6, w - 190, dh - 12, 14); k.fill();
    k.fillStyle = '#5a6378'; k.font = '30px "Lilita One"'; k.textAlign = 'left'; k.fillText('DECK ' + (12 - i), 26, y + dh / 2 + 2);
  }
  // the crew corridor (hidden shaft) on the left of the plan
  k.setLineDash([14, 10]); k.strokeStyle = '#c98a14'; k.lineWidth = 8; k.beginPath(); k.moveTo(186, y0 + 10); k.lineTo(186, y1 - 10); k.stroke(); k.setLineDash([]);
  k.fillStyle = '#d9a441'; k.font = '26px "Lilita One"'; k.save(); k.translate(222, y0 + 270); k.rotate(-Math.PI / 2); k.textAlign = 'center'; k.fillText('CREW ONLY', 0, 0); k.restore();
  // zombies: red dots that pulse
  ZDOTS.forEach(([x, y], i) => { const r = 13 + 3 * Math.sin(t * 6 + i * 1.7); k.fillStyle = '#d4140c'; k.beginPath(); k.arc(x * w, y0 + y * (y1 - y0), r, 0, 7); k.fill(); });
  // bridge star + engine room label
  k.fillStyle = '#2f9e5b'; k.font = '30px "Lilita One"'; k.textAlign = 'right'; k.fillText('★ BRIDGE', w - 52, y0 + dh / 2 + 2);
  k.fillStyle = '#2a3350'; k.fillText('ENGINE ROOM', w - 52, y1 - dh / 2 + 2);
  // the route: bridge → left to the crew shaft → down → right to the engine room
  const pts = [[w - 230, y0 + dh / 2], [186, y0 + dh / 2], [186, y1 - dh / 2], [w - 250, y1 - dh / 2]];
  const segL = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segL.push(d); tot += d; }
  let rem = eio(seg(t, T.route0, T.route1)) * tot;
  k.beginPath(); k.moveTo(...pts[0]);
  let head = pts[0];
  for (let i = 1; i < pts.length && rem > 0; i++) { const f = Math.min(1, rem / segL[i - 1]); head = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; k.lineTo(...head); rem -= segL[i - 1]; }
  k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = '#ffffff'; k.lineWidth = 28; k.stroke(); k.strokeStyle = '#178a45'; k.lineWidth = 16; k.stroke();
  if (t > T.route0) { k.fillStyle = '#ffffff'; k.beginPath(); k.arc(head[0], head[1], 24, 0, 7); k.fill(); k.fillStyle = '#178a45'; k.beginPath(); k.arc(head[0], head[1], 17, 0, 7); k.fill(); }
  SETS.mapTex.needsUpdate = true;
}
function sMap(t) {
  SETS.bridge.visible = true; SETS.outside.visible = true;
  const L = look('bridge'); aimKey(V(603, 0, -2), L, 14);
  points([[[603.5, 5.2, 2], '#ffe8d0', 10, 20]]);
  SETS.outside.position.x = 600 + (t - CUT[3]) * 1.2;
  drawMap(t);
  // the plan unrolls down the board
  const un = eo(seg(t, T.unroll, T.unroll + .7));
  SETS.mapPaper.scale.y = Math.max(.02, un);
  place(C.marco, 603.0, 0, -.9, Math.PI - .55);
  pose(C.marco, { t, reachR: t > T.unroll + .5 ? .95 + .05 * Math.sin(t * 3) : (t > T.unroll - .5 ? 1.1 : 0), nod: -.05 });
  place(C.you, 606.2, 0, -.6, Math.PI + .5); pose(C.you, { t, nod: -.05, yaw: t > T.wide2 ? -.4 : 0 });
  place(C.cat, 605.2, 0, .3, Math.PI * .5 + 1.2); catPose(C.cat, t, { yaw: .4, tilt: .2 });
  shake = 0;
  if (t < T.insert || t >= T.wide2) {
    const u = eio(seg(t, t < T.insert ? CUT[3] : T.wide2, t < T.insert ? T.insert : CUT[4]));
    setCam(V(604.0, 3.6, 7.8).lerp(V(604.4, 3.3, 6.6), u), V(604.5, 2.6, -2.4), 50, V(604.6, 2.8, -2.5), 120);
  } else {
    const v = eio(seg(t, T.insert, T.wide2));
    C.marco.root.visible = C.you.root.visible = C.cat.root.visible = false;
    setCam(V(604.6, 2.36, 5.2).lerp(V(604.6, 2.36, 4.9), v), V(604.6, 2.33, -2.5), 42, V(604.6, 2.8, -2.5), 60);
  }
}
function sRadio(t) {
  SETS.bridge.visible = true; SETS.outside.visible = true;
  const L = look('bridge'); aimKey(V(601, 0, -2), L, 14);
  points([[[601.5, 4.5, 1], '#ffe8d0', 8, 18]]);
  SETS.outside.position.x = 600 + (t - CUT[3]) * 1.2;
  const st = t > T.static ? .4 + .6 * hash(Math.floor(t * 24)) : 1;
  SETS.radioScreen.material.emissiveIntensity = st * 1.4;
  place(C.you, 601.4, 0, -1.6, Math.PI + .15);
  pose(C.you, { t, nod: .1, yaw: t > 42.6 ? -.35 * eo(seg(t, 42.6, 43.2)) : 0 });
  C.you.armR.rotation.x = -2.5; C.you.armR.rotation.z = -.55; SETS.handset.visible = true;
  place(C.marco, 598.8, 0, -.4, Math.PI - .5); pose(C.marco, { t, armX: -.5, nod: t > 42.6 ? .25 : 0 });
  place(C.cat, 600.4, 1.3, -3.4, Math.PI * .5 - .3); catPose(C.cat, t, { tilt: t > 42.2 && t < 43.4 ? .35 : 0, nod: t > 42.2 && t < 43.4 ? -.25 : 0 });
  shake = 0;
  const u = eio(seg(t, CUT[4], CUT[5]));
  setCam(V(603.8, 3.0, 2.8).lerp(V(603.2, 2.9, 2.0), u), V(601.0, 2.1, -2.6), 48, V(601.3, 2.4, -2), 140);
}
function sHorn(t) {
  SETS.bridge.visible = true; SETS.outside.visible = true;
  const L = look('bridge'); aimKey(V(601, 0, -2), L, 14);
  points([[[601.5, 4.5, 1], '#ffe8d0', 8, 18]]);
  SETS.outside.position.x = 600 + (t - CUT[3]) * 1.2;
  const bl = eo(seg(t, T.horn, T.horn + .25));
  place(C.you, 601.6, 0, -1.2, Math.PI * .5 + .2); pose(C.you, { t, nod: -.55 * bl, armsUp: .3 * bl, lean: -.1 * bl });
  place(C.marco, 599.2, 0, -.6, -Math.PI * .5 + .3); pose(C.marco, { t, nod: -.6 * bl, armsUp: .45 * bl });
  const hop = Math.sin(seg(t, T.horn, T.horn + .5) * Math.PI);
  place(C.cat, 600.5, hop * .9, .6, Math.PI * .5); catPose(C.cat, t, { arch: .25 * bl, tailUp: bl });
  shake = t > T.horn ? .06 * Math.exp(-(t - T.horn) * 1.2) + .015 : 0;
  const u = eio(seg(t, CUT[5], CUT[6]));
  setCam(V(605.5, 4.8, 9.6).lerp(V(604.2, 4.2, 7.4), u), V(600.6, 2.0, -.8), 52, V(600.6, 2.2, -.6), 120);
}
function steam(t) {
  // puffs leave the horn bell from T.horn, grow and drift up; after T.clear the blast stops
  const hp = SETS.horn.position;
  SETS.steam.forEach((s, i) => {
    let born = T.horn + i * .2; const life = 1.6;
    const a = (t - born) / life;
    s.visible = a > 0 && a < 1 && born < T.clear - .7;
    if (!s.visible) return;
    const dir = V(-1.0 + .15 * Math.sin(i * 2.3), -.18 + .2 * hash(i), .2);
    s.position.set(hp.x, hp.y, hp.z + 1.4).add(dir.multiplyScalar(a * 4.2));
    s.scale.setScalar(.7 + a * 3.4);
    s.material.opacity = .95 * Math.sin(Math.min(1, a * 3) * Math.PI / 2) * (1 - a);
  });
}
function sFunnel(t) {
  SETS.funnel.visible = true;
  const L = look('back'); aimKey(V(1000, 6, -4), L, 18);
  points([[[1000, 2, 6], '#ffd8b0', 6, 20]]);
  steam(t);
  // the figure on the catwalk, revealed as the steam clears
  place(C.fig, 998.0, 8.33, -2.4, .25);
  const tl = eo(seg(t, T.tilt, T.tilt + .5));
  pose(C.fig, { t, tilt: .45 * tl, nod: .1 });
  shake = .02 * Math.exp(-(t - CUT[6]) * .5);
  const u = eio(seg(t, CUT[6], CUT[7]));
  setCam(V(1003.6, 1.7, 9.5).lerp(V(1001.2, 4.6, 4.2), u), V(1000.4, 9.2, -3).lerp(V(998.3, 9.9, -2.4), u), lerp(54, 40, u), V(998.0, 10.0, -2.4), 110);
}

// ---------- overlay: header + captions ----------
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
  o2.font = '46px "Lilita One"'; o2.fillStyle = INK; o2.fillText('PART 2', W / 2, py + ph / 2 + 3);
  TX.push({ id: 'h2', text: 'PART 2', x0: W / 2 - pw / 2, y0: py, x1: W / 2 + pw / 2, y1: py + ph });
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
const HOT = new Set(['ZOMBIE', 'APOCALYPSE', 'LIFEBOAT...', 'MOVING', "DON'T", 'INSIDE.', 'KNOCK.', 'KNOCKS', 'BACK.', 'ZOMBIE.', 'MARCO,', 'NEVER', 'ALONE.', 'WINCH.', 'DOWN.', 'SHIP.', 'CREW', 'CORRIDORS.', 'NEVER', 'SEE.', 'AROUND', 'RADIO.', 'STATIC.', "NOBODY'S", 'HORN', 'TOUCHED', 'ELSE', 'THERE.']);
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
  o2.fillStyle = 'rgba(0,0,0,.6)'; o2.fillText('PART 3 →', 8, 14);
  o2.lineWidth = 18; o2.strokeStyle = '#e0312b'; o2.lineJoin = 'round'; o2.strokeText('PART 3 →', 0, 0);
  o2.fillStyle = '#ffffff'; o2.fillText('PART 3 →', 0, 0);
  o2.restore();
  TX.push({ id: 'e1', text: 'PART 3 →', x0: 200, y0: 860, x1: 880, y1: 1060 });
}

// ---------- events (sound) ----------
function events() {
  const E = [];
  const ev = (t, type, o = {}) => E.push(Object.assign({ t: +t.toFixed(3), type }, o));
  for (const [id, t] of Object.entries(VO)) ev(t, 'voice', { id });
  ev(0, 'amb', { name: 'deck', t1: CUT[3] }); ev(CUT[3], 'amb', { name: 'bridge', t1: CUT[6] }); ev(CUT[6], 'amb', { name: 'top', t1: CUT[7] });
  CLOCK.slice(1).forEach(([t]) => ev(t, 'tick'));
  ev(.6, 'gull');
  ev(T.bulge1, 'thump', { g: .6 }); ev(T.bulge2, 'thump', { g: .7 }); ev(T.bulge3, 'thump', { g: .8 }); ev(T.bulge3 + .1, 'hiss');
  ev(T.knock1, 'knock'); ev(T.knock2, 'knock');
  ev(T.back1, 'knock', { g: 1.6, p: .7 }); ev(T.back2, 'knock', { g: 1.6, p: .7 }); ev(T.back3, 'knock', { g: 1.8, p: .65 });
  ev(T.pop, 'clank'); ev(T.pop + .05, 'scream', { p: .85 }); ev(T.pop + .25, 'scream', { p: 1.1, g: .7 }); ev(T.pop + .1, 'meow');
  ev(T.pop, 'sting', { g: .8 });
  for (let t = T.crank; t < 26.2; t += .14) ev(t, 'ratchet');
  ev(T.jerk1, 'clunk'); ev(T.jerk2, 'clunk'); ev(T.jerk1 + .1, 'creak'); ev(T.jerk2 + .1, 'creak', { p: .8 });
  ev(T.over, 'whoosh'); ev(T.over + .2, 'sting', { g: .5, low: 1 });
  ev(T.unroll, 'unroll'); ev(T.route0, 'pop'); ev(T.route1, 'pop');
  ev(CUT[4], 'static', { t1: CUT[5] - .05 }); ev(T.static, 'squelch');
  ev(T.horn, 'horn'); ev(T.horn + .1, 'meow', { p: 1.2 });
  ev(T.clear, 'sting', { g: .9, low: 1 }); ev(T.tilt, 'creak', { p: .6 });
  ev(CUT[7], 'cutoff'); ev(CUT[7] + .25, 'endhit');
  return E.sort((a, b) => a.t - b.t);
}

// ---------- render ----------
const SCENES = [sLifeboat, sKnock, sWinch, sMap, sRadio, sHorn, sFunnel];
function render(t) {
  tNow = t; TX = [];
  const i = sceneAt(t);
  o2.clearRect(0, 0, W, H);
  if (i < 7) {
    for (const k of ['boatDeck', 'bridge', 'outside', 'funnel']) SETS[k].visible = false;
    hideAll();
    SETS.mapPaper.scale.y = 1;
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
