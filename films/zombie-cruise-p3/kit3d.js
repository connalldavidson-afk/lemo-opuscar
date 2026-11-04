// Chunky 3D Cartoon kit: rounded-primitive builders, the capsule character rig, the ship's cat.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const eo = x => 1 - Math.pow(1 - x, 3);
export const ei = x => x * x * x;
export const back = (x, s = 1.7) => { x = clamp(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
export function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- cached geometry + materials ----------
const G = new Map(), M = new Map();
const gk = (k, f) => { if (!G.has(k)) G.set(k, f()); return G.get(k); };
export const rbox = (w, h, d, r = .12) => gk(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)));
export const sph = (r, ws = 24, hs = 16) => gk(`s${r},${ws}`, () => new THREE.SphereGeometry(r, ws, hs));
export const cap = (r, l) => gk(`c${r},${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 14));
export const cyl = (rt, rb, h, n = 20, open = false) => gk(`y${rt},${rb},${h},${n},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, n, 1, open));
export const cone = (r, h) => gk(`k${r},${h}`, () => new THREE.ConeGeometry(r, h, 14));
export const tor = (R, r) => gk(`t${R},${r}`, () => new THREE.TorusGeometry(R, r, 10, 32));
export function mat(color, o = {}) {
  const k = JSON.stringify([color, o]);
  if (!M.has(k)) {
    const P = o.clearcoat ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const m = new P(Object.assign({ color, roughness: .55, metalness: 0 }, o));
    M.set(k, m);
  }
  return M.get(k);
}
export const glow = (color, k = 1) => mat(color, { emissive: color, emissiveIntensity: k, roughness: .4 });
export function mesh(geo, m, x = 0, y = 0, z = 0, parent, o = {}) {
  const me = new THREE.Mesh(geo, m); me.position.set(x, y, z);
  me.castShadow = o.cast !== false; me.receiveShadow = o.receive !== false;
  if (o.rx) me.rotation.x = o.rx; if (o.ry) me.rotation.y = o.ry; if (o.rz) me.rotation.z = o.rz;
  if (o.s) Array.isArray(o.s) ? me.scale.set(...o.s) : me.scale.setScalar(o.s);
  if (parent) parent.add(me);
  return me;
}
export const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; };

// ---------- character ----------
export const SKIN = ['#f3c7a1', '#d9a07a', '#a8704c', '#7a4e33', '#f0d0b0'];
export function person(o = {}) {
  const z = !!o.zombie;
  const skin = mat(z ? '#9fb38e' : (o.skin || SKIN[0]));
  const shirt = mat(o.shirt || '#ffcc22'), pants = mat(o.pants || '#2f3b63'), shoe = mat(o.shoe || '#2a2a33');
  const root = new THREE.Group(), body = grp(root);
  const P = { root, body };
  // legs
  for (const s of [-1, 1]) {
    const leg = grp(body, s * .17, .95, 0);
    mesh(cap(.13, .52), pants, 0, -.42, 0, leg);
    mesh(rbox(.28, .18, .42, .08), shoe, 0, -.86, .07, leg);
    P[s < 0 ? 'legL' : 'legR'] = leg;
  }
  mesh(cap(.34, .12), pants, 0, 1.0, 0, body);                       // shorts / hips
  const torso = mesh(cap(.36, .42), shirt, 0, 1.42, 0, body); P.torso = torso;
  if (o.stripe) mesh(cyl(.37, .37, .1, 24, true), mat(o.stripe, { side: THREE.DoubleSide }), 0, 1.42, 0, body);
  // arms
  for (const s of [-1, 1]) {
    const arm = grp(body, s * .44, 1.7, 0);
    mesh(cap(.1, .38), shirt, 0, -.27, 0, arm);
    mesh(sph(.13), skin, 0, -.6, 0, arm);
    P[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // head
  const head = grp(body, 0, 1.98, 0); P.head = head;
  mesh(sph(.42, 32, 20), skin, 0, .3, 0, head);
  const eyeW = z ? glow('#f6f2b8', 1.6) : mat('#ffffff', { roughness: .3 });
  for (const s of [-1, 1]) {
    mesh(sph(.105), eyeW, s * .15, .36, .34, head, { s: [1, 1.15, .6], cast: false });
    if (!z) {
      mesh(sph(.058), mat('#1b1d2a', { roughness: .2 }), s * .15, .35, .41, head, { cast: false });
      mesh(sph(.018), glow('#ffffff', 1), s * .15 + .02, .38, .455, head, { cast: false });
    }
  }
  const mouth = mesh(cap(z ? .07 : .035, z ? .08 : .12), mat('#5a1e24'), 0, .1, .39, head, { rz: z ? 0 : Math.PI / 2, cast: false }); P.mouth = mouth;
  // hair / hat
  const hc = mat(o.hair || '#4a2e1f');
  const hs = o.hairStyle || 'short';
  if (hs === 'short') mesh(new THREE.SphereGeometry(.44, 24, 12, 0, Math.PI * 2, 0, Math.PI * .42), hc, 0, .32, -.03, head, { rx: -.25 });
  if (hs === 'bun') { mesh(new THREE.SphereGeometry(.44, 24, 12, 0, Math.PI * 2, 0, Math.PI * .45), hc, 0, .32, -.03, head, { rx: -.2 }); mesh(sph(.17), hc, 0, .78, -.2, head); }
  if (hs === 'cap') { mesh(new THREE.SphereGeometry(.45, 24, 12, 0, Math.PI * 2, 0, Math.PI * .4), mat(o.hat || '#e0312b'), 0, .32, 0, head); mesh(rbox(.5, .06, .35, .03), mat(o.hat || '#e0312b'), 0, .5, .4, head, { rx: -.15 }); }
  if (hs === 'captain') { mesh(cyl(.42, .45, .28), mat('#ffffff'), 0, .74, 0, head); mesh(rbox(.6, .05, .3, .02), mat('#1b1d2a'), 0, .62, .38, head); }
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  P.zombie = z;
  return P;
}
// pose: all angles from t (pure)
export function pose(P, o = {}) {
  const ph = o.phase || 0, wa = o.walk || 0;
  const sw = Math.sin(ph) * wa * .55;
  P.legL.rotation.x = sw; P.legR.rotation.x = -sw;
  if (o.sit) { P.legL.rotation.x = P.legR.rotation.x = -1.45; }
  P.body.position.y = (o.sit ? -.85 : 0) + Math.abs(Math.sin(ph)) * .07 * wa + (o.bob || 0);
  P.body.rotation.x = o.lean || 0;
  P.body.rotation.z = o.sway || 0;
  const fwd = o.armsFwd || 0, up = o.armsUp || 0;
  for (const s of [-1, 1]) {
    const arm = s < 0 ? P.armL : P.armR;
    const swing = -s * sw * .9 * (1 - fwd) * (1 - up);
    const flail = up * Math.sin((o.t || 0) * 14 + s) * .35;
    arm.rotation.x = swing - fwd * 1.45 + (o.armX || 0) * (s < 0 ? (o.armXL ?? 1) : (o.armXR ?? 1));
    arm.rotation.z = s * (.12 + up * 2.5 + flail) + (o.armZ || 0);
  }
  if (o.reachR != null) { P.armR.rotation.x = -o.reachR * 1.5; P.armR.rotation.z = .12; }
  if (o.hug) { for (const s of [-1, 1]) { const a = s < 0 ? P.armL : P.armR; a.rotation.x = -1.2 * o.hug; a.rotation.z = -s * .55 * o.hug + s * .12 * (1 - o.hug); } }
  P.head.rotation.set(o.nod || 0, o.yaw || 0, o.tilt || 0);
  if (P.zombie) P.mouth.scale.set(1, 1 + .4 * Math.sin((o.t || 0) * 5 + ph), 1);
}

// ---------- the ship's cat (crew vest) ----------
export function cat() {
  const fur = mat('#f0913a'), furL = mat('#ffd2a0'), vest = mat('#24356e'), stripe = mat('#ffd23f', { side: THREE.DoubleSide, emissive: '#5a4400', emissiveIntensity: .4 });
  const root = new THREE.Group(), body = grp(root);
  const C = { root, body };
  mesh(cap(.2, .42), fur, 0, .42, 0, body, { rz: Math.PI / 2 });
  mesh(cap(.214, .24), vest, .02, .42, 0, body, { rz: Math.PI / 2 });
  mesh(cyl(.218, .218, .05, 24, true), stripe, .02, .42, 0, body, { rz: Math.PI / 2 });
  for (const [x, zz] of [[.22, .1], [.22, -.1], [-.22, .1], [-.22, -.1]]) mesh(cap(.06, .16), fur, x, .17, zz, body);
  const head = grp(body, .4, .6, 0); C.head = head;
  mesh(sph(.21, 28, 18), fur, 0, 0, 0, head);
  mesh(sph(.11), furL, .13, -.07, 0, head, { s: [.8, .7, 1.2] });
  for (const s of [-1, 1]) {
    mesh(cone(.075, .16), fur, -.02, .2, s * .11, head, { rx: s * .25 });
    mesh(sph(.055), mat('#c8e04a', { roughness: .2 }), .16, .04, s * .085, head, { s: [.6, 1, 1], cast: false });
    mesh(sph(.032), mat('#111111'), .19, .04, s * .085, head, { s: [.6, 1.6, .6], cast: false });
  }
  mesh(sph(.025), mat('#ff8fa3'), .21, -.03, 0, head, { cast: false });
  // tail chain
  let p = grp(body, -.38, .45, 0); C.tail = [p];
  for (let i = 0; i < 4; i++) { mesh(cap(.05, .14), fur, 0, .1, 0, p); const n = grp(p, 0, .19, 0); C.tail.push(n); p = n; }
  root.scale.setScalar(1.25);
  return C;
}
export function catPose(C, t, o = {}) {
  const sway = Math.sin(t * 2.2) * .25;
  C.tail.forEach((g, i) => { g.rotation.z = (i === 0 ? -.5 : .28) + sway * (i ? .5 : 1) + (o.tailUp || 0) * (i === 0 ? .8 : 0); });
  C.head.rotation.set(o.tilt || 0, o.yaw || 0, o.nod || 0);
  C.body.position.y = o.hop || 0;
  C.body.rotation.z = o.arch || 0;
}
