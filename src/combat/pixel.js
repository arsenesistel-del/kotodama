/* ===== 言霊 : la chasse en pixel, de profil, façon vieux Final Fantasy =====
   Tout se dessine dans un petit tampon (environ 270 × 150 pixels du jeu), agrandi d'un facteur entier :
   aucun pixel n'est jamais coupé. La créature est à gauche, le sabreur et ワケ à droite.
   Les sceaux (会心, 崩, 怒, 奥義, 祓) et les lettres qui tournent restent à l'encre, en pleine résolution.
   Même interface que l'ancien rendu à l'encre : game.js n'a pas changé. */
import { PX } from './assets';
import { WORLD } from '../world/assets';

const load = src => { const i = new Image(); i.onload = () => { i.ok = true; built.clear(); }; i.src = src; return i; };
const IMG = { hero: load(WORLD['actors/samuraiblue']), wake: load(WORLD['actors/spirit']) };
for (const k of ['nature', 'house', 'element', 'watermill']) IMG[k] = load(WORLD['tiles/' + k]);
for (const k in PX) IMG['px_' + k] = load(PX[k]);

/* palette : celle du pack, rampe d'encre et un seul vermillon (plus l'or éteint du 崩) */
const C = {
  ink: '#141b1b', ink2: '#2b2a33', slate: '#3b3643', grey: '#4e484a', stone: '#8e8a8c', ash: '#9ba7aa', bone: '#d2c9c9', paper: '#f2eaf1', white: '#ffffff',
  verm: '#d4412b', verm2: '#9e2919', verm3: '#681f14', ember: '#e46d3a', gold: '#f1ae41', moss: '#56634d', moss2: '#5f7160', sage: '#8d977f', earth: '#584b46', bark: '#46402e', dusk: '#695953', river: '#4a5270', mist: '#b6beb0'
};
const BONE = '236,230,218', VERM = '212,65,43', GOLD = '220,185,116';
const MINCHO = '"Shippori Mincho","Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif';
const DOT = '"DotGothic16",monospace';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k, ease = k => k * k * (3 - 2 * k);
const frac = x => x - Math.floor(x), hash = x => frac(Math.sin(x * 127.1) * 43758.5453);
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- tampon ---------- */
const buf = document.createElement('canvas'), b = buf.getContext('2d');
let BW = 0, BH = 0, Z = 1, GY = 0;
// Le sol se place juste au-dessus des fenêtres du bas : on mesure où elles commencent.
const cmd = () => document.querySelector('#hunt .cmd');
function fit(cw, ch) {
  const z = Math.max(2, Math.floor(Math.min(cw / 236, ch / 150)));
  const w = Math.ceil(cw / z), h = Math.ceil(ch / z), el = cmd(), r = el && el.offsetHeight ? el.getBoundingClientRect() : null;
  const top = r ? r.top * cw / window.innerWidth : ch * 0.65, gy = Math.round(top / z) - 15;
  if (z !== Z || w !== BW || h !== BH || gy !== GY) { Z = z; BW = buf.width = w; BH = buf.height = h; GY = gy; built.clear(); }
  b.imageSmoothingEnabled = false;
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };

/* ---------- sprites ---------- */
// feuille de personnage du pack : 4 colonnes (bas, haut, gauche, droite), 7 lignes de 16 px
const cell = (im, col, row) => [im, col * 16, row * 16, 16, 16];
const HERO = { idle: [2, 0], walk: [[2, 0], [2, 1], [2, 2], [2, 3]], attack: [2, 4], hurt: [2, 5], win: [1, 6] };
function blit(ctx, src, x, y, flip) { const [im, sx, sy, sw, sh] = src; if (!im.ok) return; ctx.drawImage(im, sx, sy, sw, sh, Math.round(x), Math.round(y), sw, sh); }
// une silhouette d'une seule couleur (coup reçu, image d'impact, aura de colère)
function silhouette(im, sx, sy, sw, sh, col) { const [c, x] = canvas(sw, sh); x.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, sw, sh); return c; }
function tinted(im, sx, sy, sw, sh, col) { const [c, x] = canvas(sw, sh); x.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, sw, sh); x.globalCompositeOperation = 'destination-in'; x.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); return c; }

// ce qu'on calcule une fois par taille d'écran ou par créature
const built = new Map();
function once(key, f) { if (!built.has(key)) built.set(key, f()); return built.get(key); }

function creature(id) {
  return once('mon:' + id, () => {
    const im = IMG['px_' + id]; if (!im || !im.ok) return null;
    const w = im.width, h = im.height, [c, x] = canvas(w, h); x.drawImage(im, 0, 0);
    const data = x.getImageData(0, 0, w, h).data, pix = [];
    // chaque pixel opaque, avec son seuil d'apparition et de dissolution
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { const i = (y * w + xx) * 4; if (data[i + 3] > 0) pix.push({ x: xx, y, r: data[i], g: data[i + 1], b: data[i + 2], k: hash(xx * 13.7 + y * 71.3) }); }
    return { im: c, w, h, pix, white: silhouette(c, 0, 0, w, h, C.paper), black: silhouette(c, 0, 0, w, h, C.ink), red: silhouette(c, 0, 0, w, h, C.verm), gold: silhouette(c, 0, 0, w, h, C.gold) };
  });
}
function heroSil(col) { return once('hero:' + col, () => IMG.hero.ok ? silhouette(IMG.hero, 0, 0, 64, 112, col) : null); }
function wakeSprite() { return once('wake', () => IMG.wake.ok ? tinted(IMG.wake, 0, 0, 64, 112, '#c9d2d8') : null); }

/* ---------- chiffres de dégâts, police pixel 5 × 7 ---------- */
const DIG = ['01110100011001110101110011000101110', '00100011000010000100001000010001110', '01110100010000100110010001000011111', '11110000010000101110000010000111110', '00010001100101010010111110001000010', '11111100001111000001000011000101110', '00110010001000011110100011000101110', '11111000010001000100010000100001000', '01110100011000101110100011000101110', '01110100011000101111000010001001100'];
function digits(ctx, txt, x, y, col, sc) {
  const s = sc || 1, w = (txt.length * 6 - 1) * s;
  let ox = Math.round(x - w / 2);
  for (const pass of [0, 1]) { // contour noir d'abord, puis la couleur
    let px = ox;
    for (const ch of txt) { const d = DIG[+ch]; if (d) for (let i = 0; i < 35; i++) if (d[i] === '1') { const cx = px + (i % 5) * s, cy = Math.round(y) + Math.floor(i / 5) * s; if (pass === 0) { ctx.fillStyle = C.ink; ctx.fillRect(cx - 1, cy - 1, s + 2, s + 2); } else { ctx.fillStyle = col; ctx.fillRect(cx, cy, s, s); } } px += 6 * s; }
  }
}

/* ---------- décors : un par créature, peints dans la palette du pack ---------- */
const SETS = {
  kake: { sky: ['#3b3643', '#695953', '#8e7c73'], far: '#584b46', near: '#433737', ground: ['#46402e', '#2e3939', '#141b1b'], fog: '#bfa49e', fogA: 0.18, trees: 'pine', mark: 'mill', river: true },
  kuzure: { sky: ['#4e484a', '#748e90', '#9ba7aa'], far: '#6f7d7f', near: '#3e4b42', ground: ['#56634d', '#2e3939', '#141b1b'], fog: '#d2c9c9', fogA: 0.2, trees: null, mark: 'bridge' },
  yuragi: { sky: ['#584b46', '#8d977f', '#b6beb0'], far: '#8d977f', near: '#5f7160', ground: ['#5f7160', '#3e4b42', '#141b1b'], fog: '#d2c9c9', fogA: 0.32, trees: 'pine', mark: 'jizo' },
  tsutae: { sky: ['#141b1b', '#242118', '#3b3643'], far: '#2e3939', near: '#1c2222', ground: ['#3b3643', '#242118', '#0b0e0e'], fog: '#695953', fogA: 0.14, trees: 'round', mark: 'lanterns', stars: true },
  wake: { sky: ['#141b1b', '#2e3939', '#3b3643'], far: '#2b2a33', near: '#1c2222', ground: ['#4e484a', '#2b2a33', '#0b0e0e'], fog: '#9ba7aa', fogA: 0.14, trees: 'pine', mark: 'torii', stars: true },
  ou: { sky: ['#090b0c', '#141b1b', '#242118'], far: '#1c1414', near: '#0e0c0c', ground: ['#242118', '#141b1b', '#050606'], fog: '#681f14', fogA: 0.16, trees: null, mark: 'moon' },
  // Session 8 : la place du village à la nuit tombée (le puits), les rizières au crépuscule, la colline du cimetière.
  tsubu: { sky: ['#1c2222', '#3b3643', '#584b46'], far: '#2e3939', near: '#242118', ground: ['#584b46', '#2e3939', '#141b1b'], fog: '#8e7c73', fogA: 0.2, trees: 'round', mark: 'well' },
  mayoi: { sky: ['#3b3643', '#8e7c73', '#bfa49e'], far: '#695953', near: '#56634d', ground: ['#5f7160', '#3e4b42', '#141b1b'], fog: '#d2c9c9', fogA: 0.22, trees: null, mark: 'paddy' },
  kiri: { sky: ['#2b2a33', '#748e90', '#d2c9c9'], far: '#8e8a8c', near: '#4e484a', ground: ['#4e484a', '#2b2a33', '#141b1b'], fog: '#f2eaf1', fogA: 0.42, trees: null, mark: 'hill' }
};
// un dégradé en bandes tramées, comme sur les vieilles consoles
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
function ramp(cols, steps) { const out = []; for (let i = 0; i < steps; i++) { const t = i / (steps - 1) * (cols.length - 1), j = Math.min(cols.length - 2, Math.floor(t)), f = t - j, a = rgb(cols[j]), c = rgb(cols[j + 1]); out.push(hex(a.map((v, k) => lerp(v, c[k], f)))); } return out; }
function bands(ctx, x0, y0, w, h, base) {
  const cols = ramp(base, Math.max(3, Math.round(h / 7))), n = cols.length - 1;
  for (let y = 0; y < h; y++) { const t = y / Math.max(1, h - 1) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i;
    for (let x = 0; x < w; x++) { ctx.fillStyle = bay(x, y) < f ? cols[i + 1] : cols[i]; ctx.fillRect(x0 + x, y0 + y, 1, 1); } }
}
function ridge(ctx, seed, base, amp, col, rough) {
  ctx.fillStyle = col;
  for (let x = 0; x < BW; x++) { const u = x / 60; let v = 0, a = 1, f = 1; for (let o = 0; o < 4; o++) { v += Math.sin(u * f * 1.7 + seed * 9.1 + o * 2.3) * a; a *= rough; f *= 2.13; }
    const top = Math.round(base - Math.abs(v) * amp); ctx.fillRect(x, top, 1, GY - top + 1); }
}
const tile = (sheet, sx, sy, w, h) => [IMG[sheet], sx * 16, sy * 16, w * 16, h * 16];
const PROP = { well: tile('element', 6, 1, 1, 1), houseA: tile('house', 0, 0, 4, 3), tea: tile('house', 16, 0, 3, 3), scarecrow: tile('element', 15, 0, 1, 1), grave: tile('element', 5, 2, 1, 1), tomb: tile('element', 4, 2, 1, 1), sakura: tile('nature', 0, 18, 3, 3), pine: tile('nature', 2, 0, 2, 2), round: tile('nature', 0, 0, 2, 2), mill: tile('house', 12, 0, 4, 3), houseDark: tile('house', 19, 0, 4, 3), torii: tile('house', 0, 5, 3, 2), jizo: tile('element', 0, 5, 1, 2), sign: tile('element', 6, 3, 1, 2), rock: tile('nature', 8, 12, 1, 1) };
// un objet du pack, voilé par la brume selon sa profondeur
function prop(ctx, p, x, y, fog, a) { const [im, sx, sy, sw, sh] = p; if (!im.ok) return; const [c, cx] = canvas(sw, sh); cx.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); cx.globalCompositeOperation = 'source-atop'; cx.globalAlpha = a; cx.fillStyle = fog; cx.fillRect(0, 0, sw, sh); ctx.drawImage(c, Math.round(x), Math.round(y - sh)); }

function backdrop(id) {
  return once('bg:' + id, () => {
    const s = SETS[id] || SETS.kake, [c, x] = canvas(BW, BH), seed = id.length * 1.37 + id.charCodeAt(0) * 0.11;
    bands(x, 0, 0, BW, GY, s.sky);
    if (s.stars) for (let i = 0; i < BW * 0.25; i++) { x.fillStyle = hash(i * 3.1 + seed) < 0.2 ? C.bone : C.stone; x.fillRect(Math.floor(hash(i * 1.7 + seed) * BW), Math.floor(hash(i * 2.9 + seed) * GY * 0.55), 1, 1); }
    if (s.mark === 'moon') { const mx = Math.round(BW * 0.5), my = Math.round(GY * 0.34), r = Math.round(BH * 0.11);
      for (let y = -r * 3; y <= r * 3; y++) for (let xx = -r * 3; xx <= r * 3; xx++) { const d = Math.hypot(xx, y) / r; if (d <= 1) { x.fillStyle = d > 0.82 || bay(xx, y) < (d - 0.4) * 0.5 ? C.verm2 : C.verm; x.fillRect(mx + xx, my + y, 1, 1); } else if (d < 3 && bay(xx + 9, y + 9) < (3 - d) / 2 * 0.28) { x.fillStyle = C.verm3; x.fillRect(mx + xx, my + y, 1, 1); } } }
    ridge(x, seed, GY - BH * 0.12, BH * 0.16, s.far, 0.55);
    ridge(x, seed + 4.2, GY - BH * 0.04, BH * 0.07, s.near, 0.5);
    if (s.mark === 'bridge') { // gorge et pont suspendu, au loin
      const x0 = Math.round(BW * 0.12), x1 = Math.round(BW * 0.88), y0 = Math.round(GY - BH * 0.2);
      x.fillStyle = s.near; for (let xx = 0; xx < BW; xx++) { const edge = xx < x0 + 6 ? 0 : xx > x1 - 6 ? 0 : -1; if (edge < 0) continue; x.fillRect(xx, y0 + 2 + Math.round(hash(xx * 0.71) * 3), 1, GY); }
      bands(x, x0 + 6, y0 + 8, x1 - x0 - 12, GY - y0 - 8, ['#2e3939', '#141b1b', '#090b0c']); // la gorge
      x.fillStyle = s.near; for (let yy = y0 + 8; yy < GY; yy++) { const j = Math.round(hash(yy * 1.3) * 4); x.fillRect(x0 + 6, yy, j, 1); x.fillRect(x1 - 6 - j, yy, j, 1); }
      for (let k = 0; k <= 1; k++) for (let xx = x0; xx <= x1; xx++) { const u = (xx - x0) / (x1 - x0), sag = Math.round(10 * (1 - (2 * u - 1) ** 2)), y = y0 + sag - k * 4; x.fillStyle = k ? C.stone : C.bark; x.fillRect(xx, y, 1, 1); if (!k && xx % 3 === 0) { x.fillStyle = C.earth; x.fillRect(xx, y + 1, 1, 2); } if (k && xx % 8 === 0) { x.fillStyle = C.bark; x.fillRect(xx, y, 1, 4); } }
      for (const px of [x0, x1]) { x.fillStyle = C.bark; x.fillRect(px - 1, y0 - 6, 2, 10); }
    }
    if (s.trees) { const p = PROP[s.trees]; for (let i = 0; i < BW / 18; i++) { const tx = Math.floor(i * 19 + hash(i + seed) * 12) - 10, near = hash(i * 7.7 + seed) < 0.35; prop(x, p, tx, GY + (near ? 2 : -2), s.fog, near ? 0.55 : 0.7); } }
    if (s.river) { const ry = GY - 1; for (let xx = 0; xx < BW; xx++) for (let y = 0; y < 5; y++) { x.fillStyle = bay(xx, y) < 0.15 + y * 0.12 ? C.ink : C.river; if (y === 1 && hash(xx * 0.37 + 1) < 0.25) x.fillStyle = C.ash; x.fillRect(xx, ry + y, 1, 1); } }
    // le sol, de plus en plus sombre vers le bas (les fenêtres du bas le recouvrent)
    bands(x, 0, GY + (s.river ? 4 : 0), BW, BH - GY, s.ground);
    for (let i = 0; i < BW * 0.9; i++) { const gx = Math.floor(hash(i * 5.3 + seed) * BW), gy = GY + 4 + Math.floor(hash(i * 3.9 + seed) ** 2 * (BH - GY) * 0.5); x.fillStyle = hash(i) < 0.5 ? s.sky[2] : s.far; x.globalAlpha = 0.5; x.fillRect(gx, gy, 1, 1 + (hash(i * 9.1) < 0.3 ? 1 : 0)); x.globalAlpha = 1; }
    // le repère du lieu
    if (s.mark === 'mill') { prop(x, PROP.mill, BW * 0.04, GY + 2, s.fog, 0.55); const w = IMG.watermill; if (w.ok) { const [cc, cx] = canvas(34, 36); cx.drawImage(w, 0, 0, 34, 36, 0, 0, 34, 36); cx.globalCompositeOperation = 'source-atop'; cx.globalAlpha = 0.55; cx.fillStyle = s.fog; cx.fillRect(0, 0, 34, 36); x.drawImage(cc, Math.round(BW * 0.04 + 62), GY + 4 - 36); } }
    if (s.mark === 'jizo') { prop(x, PROP.jizo, BW * 0.52, GY + 3, s.fog, 0.4); prop(x, PROP.sign, BW * 0.58, GY + 3, s.fog, 0.4); prop(x, PROP.rock, BW * 0.47, GY + 4, s.fog, 0.45); }
    if (s.mark === 'torii') prop(x, PROP.torii, BW * 0.5 - 24, GY + 1, s.fog, 0.55);
    if (s.mark === 'well') { prop(x, PROP.houseA, BW * 0.02, GY + 2, s.fog, 0.6); prop(x, PROP.tea, BW * 0.7, GY + 2, s.fog, 0.55); prop(x, PROP.well, BW * 0.5, GY + 4, s.fog, 0.35);
      const lx = Math.round(BW * 0.7 + 40), ly = GY - 30; for (let y = -8; y <= 8; y++) for (let xx = -8; xx <= 8; xx++) { const d = Math.hypot(xx, y) / 8; if (d < 1 && bay(xx + 4, y + 4) < (1 - d) * 0.5) { x.fillStyle = C.verm2; x.fillRect(lx + xx, ly + y, 1, 1); } } x.fillStyle = C.verm; x.fillRect(lx - 2, ly - 3, 4, 6); }
    if (s.mark === 'paddy') { // rizières en terrasses : des bandes d'eau qui reflètent le ciel
      for (let k = 0; k < 4; k++) { const y0 = GY - 4 - k * 7, x0 = Math.round(hash(k * 3.3) * 20) - 10, w = BW - k * 30; for (let xx = Math.max(0, x0); xx < Math.min(BW, x0 + w); xx++) { x.fillStyle = C.moss2; x.fillRect(xx, y0, 1, 1); x.fillStyle = bay(xx, k) < 0.4 ? s.sky[2] : s.sky[1]; x.fillRect(xx, y0 + 1, 1, 2); } }
      prop(x, PROP.scarecrow, BW * 0.62, GY + 3, s.fog, 0.3); prop(x, PROP.scarecrow, BW * 0.15, GY - 10, s.fog, 0.6); }
    if (s.mark === 'hill') { prop(x, PROP.sakura, BW * 0.66, GY + 2, s.fog, 0.45);
      for (const [gx, gy, a] of [[0.1, 2, 0.5], [0.2, 0, 0.62], [0.33, 3, 0.4], [0.86, 1, 0.55], [0.94, 3, 0.4]]) prop(x, PROP.grave, BW * gx, GY + gy, s.fog, a);
      prop(x, PROP.tomb, BW * 0.58, GY + 4, s.fog, 0.3); x.fillStyle = C.verm; x.fillRect(Math.round(BW * 0.58) + 6, GY + 1, 2, 2); }
    if (s.mark === 'lanterns') { prop(x, PROP.houseDark, BW * 0.02, GY + 2, '#141b1b', 0.55); prop(x, PROP.houseDark, BW * 0.62, GY + 2, '#141b1b', 0.55);
      for (const lx of [0.3, 0.45, 0.88]) { const cx0 = Math.round(BW * lx), cy0 = GY - 10; // lanterne de pierre et sa lueur
        for (let y = -9; y <= 9; y++) for (let xx = -9; xx <= 9; xx++) { const d = Math.hypot(xx, y) / 9; if (d < 1 && bay(xx + 4, y + 4) < (1 - d) * 0.5) { x.fillStyle = C.verm2; x.fillRect(cx0 + xx, cy0 + y, 1, 1); } }
        x.fillStyle = C.grey; x.fillRect(cx0 - 3, cy0 - 5, 7, 2); x.fillRect(cx0 - 1, cy0 + 3, 3, 8); x.fillRect(cx0 - 3, cy0 + 10, 7, 2); x.fillStyle = C.ember; x.fillRect(cx0 - 2, cy0 - 3, 5, 5); x.fillStyle = C.gold; x.fillRect(cx0 - 1, cy0 - 2, 3, 3); }
    }
    if (s.mark === 'moon') for (const [px, ph] of [[0.12, 0.3], [0.2, 0.18], [0.8, 0.26], [0.9, 0.2]]) { const tx = Math.round(BW * px), th = Math.round(BH * ph); x.fillStyle = C.ink; x.fillRect(tx - 2, GY - th, 5, th + 2); x.fillRect(tx - 4, GY - th + 3, 9, 1); x.fillStyle = C.verm3; x.fillRect(tx, GY - th - 3, 1, 3); }
    return c;
  });
}
function fogLayer(id, k) { // une nappe de brume tramée, deux fois la largeur de l'écran pour défiler en boucle
  return once('fog:' + id + k, () => {
    const s = SETS[id] || SETS.kake, w = BW * 2, h = Math.round(BH * 0.3), [c, x] = canvas(w, h); x.fillStyle = s.fog;
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { const u = xx / w * 6.283, v = (Math.sin(u * 2 + k * 3) * 0.5 + Math.sin(u * 5 + k) * 0.3 + Math.sin(u * 9 + 1.3 * k) * 0.2) * 0.5 + 0.5, d = Math.sin(Math.PI * y / h) * v; if (bay(xx, y) < d * 0.55) x.fillRect(xx, y, 1, 1); }
    return c;
  });
}

/* ---------- état ---------- */
const P = { mon: null, parts: [], nums: [], slashes: [], decals: [], stamps: [], atk: null, dashT: -9, dashLvl: 0, hitT: -9, down: 0, won: 0, mote: [], t: 0, glitchT: 0, bars: [], impactKind: 0 };
for (let i = 0; i < 40; i++) P.mote.push({ x: Math.random(), y: Math.random(), z: 0.4 + Math.random() * 0.6, p: Math.random() * 6.28 });

// positions dans le tampon : la créature à gauche, le sabreur à droite
function mpos() { const m = P.mon, cr = m && creature(m.kind), w = cr ? cr.w : 60, h = cr ? cr.h : 64; return { x: Math.round(BW * 0.3), y: GY + 6, w, h, cx: Math.round(BW * 0.3), cy: GY + 6 - h / 2 }; }
function hpos() { return { x: Math.round(BW * 0.74), y: GY + 4 }; }

function burst(x, y, n, sp, cols, grav, life) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.25 + Math.random()); P.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.25, g: grav === undefined ? 160 : grav, life: (life || 0.7) * (0.6 + Math.random() * 0.6), max: life || 0.7, c: cols[Math.floor(Math.random() * cols.length)], s: Math.random() < 0.2 ? 2 : 1 }); } }
function slashLine(x0, y0, x1, y1, w, col, delay, hold) { P.slashes.push({ x0, y0, x1, y1, w, col, t: P.t + (delay || 0), dur: 0.07, hold: hold || 0.16 }); }
function stamp(txt, bx, by, col, size, long) { P.stamps.push({ txt, bx, by, t: P.t, col, size: size || 1, long }); }

const Pix = {
  S: null, // l'état partagé de scene.js (secousse, éclair, gel), branché au démarrage
  setMonster(st) {
    P.mon = st ? { kind: st.art || st.id, stage: st, hp: 1, flinch: 0, dying: 0, born: P.t, stag: false, stagK: 0, rage: false, rageT: -9, glyphs: [...st.glyphs], seed: Math.random() * 100 } : null;
    P.atk = null; P.slashes = []; P.stamps = []; P.decals = []; P.nums = []; P.parts = []; P.down = 0; P.won = 0; P.dashT = -9; P.hitT = -9; if (this.S) this.S.tele = null;
  },
  setHp(r) { if (P.mon) P.mon.hp = clamp(r, 0, 1); },
  telegraph(start, dur) { this.S.tele = { start, dur }; }, clearTele() { this.S.tele = null; },
  stagger(on) { const m = P.mon; if (!m) return; m.stag = on; if (on) { const M = mpos(); this.S.shake = 3; this.S.flash = 0.3; stamp('崩', M.cx - M.w * 0.6, M.cy - M.h * 0.3, GOLD, 1.15); burst(M.cx, M.cy, 30, 70, [C.gold, C.bone, C.paper]); } },
  enrage() { const m = P.mon; if (!m) return; m.rage = true; m.rageT = P.t; this.S.shake = 4; this.S.hurt = 0.5; const M = mpos(); burst(M.cx, M.cy, 50, 90, [C.verm, C.verm2, C.ember]); stamp('怒', M.cx - M.w * 0.6, M.cy - M.h * 0.3, VERM, 1.3); },
  // level : 0 coup simple, 1 coup critique, 2 奥義
  slash(level, dmg, label) {
    const m = P.mon; if (!m) return; const M = mpos(), crit = level >= 1, S = this.S;
    P.dashT = P.t; P.dashLvl = level; m.hitAt = P.t + 0.13; m.hitLvl = level;
    // le coup part quand le sabreur arrive sur la créature
    const R = M.h * 0.42, cx = M.cx, cy = M.cy;
    const cut = (dl, ang, w, col) => { const c = Math.cos(ang), s = Math.sin(ang); slashLine(cx + c * R, cy - s * R, cx - c * R, cy + s * R, w, col, dl, level === 2 ? 0.3 : 0.16); };
    cut(0.12, 0.85, crit ? 3 : 2, C.paper);
    if (crit) cut(0.19, -0.75, 2, C.verm);
    if (level === 2) { cut(0.27, 0.05, 4, C.paper); cut(0.34, 1.5, 2, C.verm); }
    setTimeout(() => {
      if (!P.mon) return; m.flinch = 1; S.shake = Math.max(S.shake, level === 2 ? 5 : crit ? 3 : 1.5);
      if (crit) { S.flash = 0.35; S.freeze = level === 2 ? 0.2 : 0.1; S.impact = level === 2 ? 0.16 : 0.085; }
      burst(cx, cy, level === 2 ? 70 : crit ? 40 : 18, crit ? 110 : 70, [C.paper, C.bone, C.verm, C.ink]);
      for (let i = 0; i < (crit ? 5 : 2); i++) P.decals.push({ x: cx + rnd(-30, 30), y: GY + 6 + Math.round(rnd(0, 8)), r: rnd(2, crit ? 6 : 4), t: P.t, c: Math.random() < 0.4 ? C.verm2 : C.ink });
      if (P.decals.length > 30) P.decals.splice(0, P.decals.length - 30);
      P.nums.push({ x: cx + rnd(-10, 10), y: cy - M.h * 0.2, txt: String(Math.round(dmg)), t: P.t, crit, big: level === 2 });
      if (label) stamp(label, Math.min(BW * 0.55, cx + M.w * 0.55), cy - M.h * 0.25, level === 2 ? VERM : crit ? GOLD : BONE, level === 2 ? 1.25 : 1);
    }, 130);
  },
  monsterAttack() { if (!P.mon) return; P.atk = { t: P.t, hit: false }; this.S && this.Snd && this.Snd.whoosh(); },
  playerDown() { P.down = 0.0001; },
  die() {
    const m = P.mon; if (!m) return; const S = this.S, M = mpos();
    m.dying = 0.0001; m.stag = false; S.flash = 0.8; S.shake = 6; S.freeze = 0.22; S.impact = 0.18;
    for (let i = 0; i < 4; i++) { const a = i * 0.8 + 0.3, c = Math.cos(a), s = Math.sin(a), R = M.h * 0.6; slashLine(M.cx + c * R, M.cy - s * R, M.cx - c * R, M.cy + s * R, 3, i % 2 ? C.verm : C.paper, i * 0.05, 0.45); }
    stamp('祓', BW * 0.5, BH * 0.28, VERM, 2.2, true); P.won = P.t;
  },

  draw(g, cv, dt) {
    const S = this.S; fit(cv.width, cv.height);
    P.t += dt; const t = P.t, m = P.mon, cr = m && creature(m.kind), M = mpos(), Hh = hpos();
    let tk = 0; if (S.tele && m) tk = clamp((performance.now() - S.tele.start) / S.tele.dur, 0, 1);
    const id = m ? m.kind : (P.lastKind || 'kake'); if (m) P.lastKind = m.kind;

    // décor et brume
    const bg = backdrop(id); b.drawImage(bg, 0, 0);
    const s = SETS[id] || SETS.kake;
    for (let k = 0; k < 2; k++) { const f = fogLayer(id, k), off = Math.floor((t * (k ? 3 : 1.6) + k * 97) % (BW * 2)); b.globalAlpha = s.fogA * (k ? 0.8 : 1); const fy = Math.round(GY - f.height * (k ? 0.75 : 0.35)); b.drawImage(f, -off, fy); b.drawImage(f, BW * 2 - off, fy); }
    b.globalAlpha = 1;
    // poussières qui montent (rouges quand la créature est enragée)
    const hot = m && m.rage;
    for (const p of P.mote) { p.y -= 0.012 * p.z * dt * (hot ? 3 : 1); if (p.y < 0) p.y = 1; const x = Math.round((p.x + Math.sin(t * 0.3 + p.p) * 0.01) * BW), y = Math.round(p.y * GY); if (Math.sin(t * 1.3 + p.p * 4) > 0.2) { b.fillStyle = (p.p % 1) < (hot ? 0.5 : 0.1) ? C.verm : C.bone; b.globalAlpha = 0.35 + 0.4 * p.z; b.fillRect(x, y, 1, 1); } }
    b.globalAlpha = 1;
    // encre tombée au sol
    for (let i = P.decals.length - 1; i >= 0; i--) { const d = P.decals[i], e = t - d.t; if (e > 8) { P.decals.splice(i, 1); continue; } const a = clamp(e / 0.2, 0, 1) * (1 - clamp((e - 5) / 3, 0, 1)); b.fillStyle = d.c; const r = Math.round(d.r); for (let yy = -1; yy <= 1; yy++) for (let xx = -r; xx <= r; xx++) if ((xx * xx) / (r * r) + yy * yy * 0.5 <= 1 && bay(xx, yy) < a * 0.8) b.fillRect(Math.round(d.x) + xx, d.y + yy, 1, 1); }

    // la créature
    if (m && cr) this.drawMonster(t, dt, tk, m, cr, M, Hh);
    // le sabreur et ワケ
    this.drawHero(t, dt, M, Hh);

    // image d'impact : tout noir, silhouettes blanches
    if (S.impact > 0 && m && cr && m.last) { b.fillStyle = C.ink; b.fillRect(0, 0, BW, BH); b.drawImage(cr.white, m.last.x, m.last.y); const hs = heroSil(C.paper); if (hs && P.last) b.drawImage(hs, P.last.sx, P.last.sy, 16, 16, P.last.x, P.last.y, 16, 16); }

    this.drawFx(t, dt);

    // agrandissement entier, avec la secousse en pixels du jeu
    const sh = S.shake > 0.3 ? S.shake : 0, ox = Math.round((Math.random() - 0.5) * sh) * Z, oy = Math.round((Math.random() - 0.5) * sh) * Z;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.fillStyle = '#050505'; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(buf, ox, oy, BW * Z, BH * Z);
    this.overlay(g, cv, t, ox, oy, M);
    g.restore();
  },

  drawMonster(t, dt, tk, m, cr, M, Hh) {
    const appear = clamp((t - m.born) / 1.4, 0, 1);
    if (t >= (m.hitAt || 0)) m.flinch = Math.max(0, m.flinch - dt * 4);
    m.stagK = lerp(m.stagK, m.stag ? 1 : 0, 1 - Math.pow(0.002, dt));
    if (m.dying) m.dying = Math.min(1, m.dying + dt * 0.45);
    const dy = m.dying, windup = clamp((tk - 0.75) / 0.25, 0, 1) * (m.stag ? 0 : 1);
    // attaque : recul, ruée vers le sabreur, retour
    let ox = 0, ghosts = 0;
    if (P.atk) { const e = t - P.atk.t, L = Hh.x - 18 - (M.x + cr.w / 2);
      if (e < 0.24) ox = -Math.round(5 * ease(e / 0.24));
      else if (e < 0.36) { ox = Math.round(lerp(-5, L, ((e - 0.24) / 0.12) ** 2)); ghosts = 1; }
      else if (e < 0.52) { ox = L; ghosts = 1 - (e - 0.36) / 0.16; }
      else ox = Math.round(lerp(L, 0, ease(clamp((e - 0.52) / 0.42, 0, 1))));
      if (e >= 0.36 && !P.atk.hit) { P.atk.hit = true; const S = this.S; S.hurt = 1; S.shake = 4; P.hitT = t; this.Snd && this.Snd.hurt();
        slashLine(Hh.x + 10, Hh.y - 20, Hh.x - 6, Hh.y - 2, 2, C.verm, 0, 0.2); slashLine(Hh.x + 12, Hh.y - 15, Hh.x - 4, Hh.y + 1, 1, C.verm3, 0.03, 0.2); burst(Hh.x, Hh.y - 9, 22, 70, [C.verm, C.verm2, C.paper]); }
      if (e > 0.96) P.atk = null; }
    const bob = Math.round(Math.sin(t * 1.7) * 2 * (1 - m.stagK)), shake = (windup > 0 && Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0) + (m.flinch > 0.3 ? -Math.round(m.flinch * 4) : 0);
    const x = Math.round(M.x - cr.w / 2 + ox + shake + (m.stagK > 0.3 ? Math.round(Math.sin(t * 9)) : 0));
    const y = Math.round(M.y - cr.h + bob + m.stagK * 4 - dy * 10);
    m.last = { x, y };
    // ombre au sol
    b.fillStyle = C.ink; b.globalAlpha = 0.5 * appear * (1 - dy);
    const sw = Math.round(cr.w * 0.36); for (let xx = -sw; xx <= sw; xx++) { const k = 1 - (xx / sw) ** 2; if (bay(xx, 0) < k) b.fillRect(M.x + ox + xx, M.y, 1, 1); if (bay(xx, 1) < k * 0.6) b.fillRect(M.x + ox + xx, M.y + 1, 1, 1); }
    b.globalAlpha = 1;
    // aura : rouge quand elle s'enrage ou va frapper, dorée quand elle vacille
    const aura = m.stagK > 0.3 ? cr.gold : (m.rage || windup > 0) ? cr.red : null;
    if (aura && !dy && appear >= 1 && (m.rage || Math.sin(t * 22) > -0.3)) for (const [dx, dy2] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) b.drawImage(aura, x + dx, y + dy2);
    // apparition et apaisement : pixel par pixel
    if (appear < 1 || dy > 0) { this.dissolve(cr, x, y, appear, dy, t); }
    else {
      // distorsion : quelques bandes horizontales décalées, plus souvent quand elle faiblit
      const unstable = 0.25 * (1 - m.hp) + m.flinch * 0.6 + (m.rage ? 0.15 : 0) + windup * 0.3;
      if (t - P.glitchT > 0.09) { P.glitchT = t; P.bars = []; const nb = Math.floor(Math.random() * 1.6 + unstable * 6); for (let i = 0; i < nb; i++) P.bars.push({ y: Math.floor(Math.random() * cr.h), h: 1 + Math.floor(Math.random() * 3), o: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * (1 + unstable * 4))) }); }
      const img = m.flinch > 0.55 ? cr.white : cr.im;
      if (ghosts > 0.05) for (let j = 3; j >= 1; j--) { b.globalAlpha = 0.18 * ghosts; b.drawImage(cr.im, x - j * 7, y); }
      b.globalAlpha = 1;
      let yy = 0; const bars = P.bars.slice().sort((a, c) => a.y - c.y);
      for (const bar of bars) { if (bar.y > yy) b.drawImage(img, 0, yy, cr.w, bar.y - yy, x, y + yy, cr.w, bar.y - yy); const hh = Math.min(bar.h, cr.h - bar.y); if (hh > 0) b.drawImage(img, 0, bar.y, cr.w, hh, x + bar.o, y + bar.y, cr.w, hh); yy = Math.max(yy, bar.y + hh); }
      if (yy < cr.h) b.drawImage(img, 0, yy, cr.w, cr.h - yy, x, y + yy, cr.w, cr.h - yy);
      if (m.rage) { b.globalAlpha = 0.12 + 0.08 * Math.sin(t * 6); b.drawImage(cr.red, x, y); b.globalAlpha = 1; }
      if (m.stagK > 0.3) { b.globalAlpha = 0.25 * m.stagK; b.drawImage(cr.black, x, y); b.globalAlpha = 1; }
      if (windup > 0 && Math.sin(t * 30) > 0.6) { b.globalAlpha = 0.5; b.drawImage(cr.white, x, y); b.globalAlpha = 1; }
    }
    // étoiles du 崩 au-dessus de la tête
    if (m.stagK > 0.4 && !dy) for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.094, sx = Math.round(M.x + ox + Math.cos(a) * 12), sy = Math.round(y - 4 + Math.sin(a) * 3); b.fillStyle = C.gold; b.fillRect(sx, sy - 1, 1, 3); b.fillRect(sx - 1, sy, 3, 1); b.fillStyle = C.paper; b.fillRect(sx, sy, 1, 1); }
    // la créature lâche des copeaux d'encre
    m.emit = (m.emit || 0) - dt;
    if (m.emit <= 0 && !dy && appear >= 1) { m.emit = m.rage ? 0.06 : 0.16; const up = m.kind === 'tsutae' || m.kind === 'yuragi' || m.rage;
      P.parts.push({ x: x + Math.random() * cr.w, y: y + cr.h * (up ? 0.3 : 0.75) + rnd(-6, 6), vx: rnd(-8, 8), vy: up ? -rnd(12, 26) : 8, g: up ? -6 : 40, life: 1.3, max: 1.3, c: Math.random() < (m.rage ? 0.6 : 0.15) ? C.verm : C.stone, s: 1 }); }
    if (dy >= 1) P.mon = null;
  },

  // naissance ou apaisement : les pixels s'assemblent, ou se détachent et montent comme des flocons d'encre
  dissolve(cr, x, y, appear, dy, t) {
    const key = 'dis:' + cr.w + 'x' + cr.h, tmp = once(key, () => canvas(cr.w, cr.h)), [c, cx] = tmp, id = cx.createImageData(cr.w, cr.h), d = id.data;
    for (const p of cr.pix) {
      let on, white = false;
      if (dy > 0) { const th = (1 - p.y / cr.h) * 0.45 + p.k * 0.55; on = dy * 1.15 < th; white = dy * 1.15 > th - 0.12; if (!on && !p.gone) { p.gone = true; if (Math.random() < 0.35) P.parts.push({ x: x + p.x, y: y + p.y, vx: rnd(-6, 6), vy: -rnd(10, 34), g: -10, life: rnd(0.8, 1.8), max: 1.8, c: Math.random() < 0.2 ? C.verm : C.bone, s: 1 }); } }
      else { on = appear > p.k * 0.85; white = appear < p.k * 0.85 + 0.12; }
      if (!on) continue; const i = (p.y * cr.w + p.x) * 4;
      if (white) { d[i] = 242; d[i + 1] = 234; d[i + 2] = 241; } else { d[i] = p.r; d[i + 1] = p.g; d[i + 2] = p.b; } d[i + 3] = 255;
    }
    if (dy === 0) for (const p of cr.pix) p.gone = false;
    cx.putImageData(id, 0, 0); b.drawImage(c, x, y);
  },

  drawHero(t, dt, M, Hh) {
    const hero = IMG.hero; if (!hero.ok) return; const m = P.mon;
    if (P.down) P.down = Math.min(1, P.down + dt * 1.5);
    const e0 = t - P.dashT, hurt = clamp(1 - (t - P.hitT) / 0.5, 0, 1), lvl = P.dashLvl;
    // le pas en avant : course, coup, retour (plus loin et plus vite sur un critique ou un 奥義)
    const target = m ? M.x + Math.round((creature(m.kind) || { w: 50 }).w * 0.3) + 6 : Hh.x;
    const dash = e => { if (e < 0 || e > 0.75) return [0, null]; if (e < 0.12) return [ease(e / 0.12), 'run']; if (e < 0.34) return [1, 'cut']; return [1 - ease((e - 0.34) / 0.41), 'back']; };
    const [k, ph] = dash(e0);
    let x = Math.round(lerp(Hh.x, target, k)) - 8, y = Hh.y - 16, frame = HERO.idle;
    if (ph === 'run' || ph === 'back') frame = HERO.walk[Math.floor(t * 14) % 4];
    if (ph === 'cut') frame = HERO.attack;
    if (hurt > 0) { frame = HERO.hurt; x += Math.round(hurt * 5); }
    if (P.won && t - P.won > 1.1) frame = HERO.win; // la pose de victoire, face à nous
    // ワケ flotte derrière, il sursaute quand le sabreur encaisse
    const wk = wakeSprite();
    if (wk) { const wf = Math.floor(t * 3) % 4, wx = Hh.x + 10 + (hurt > 0.5 ? 3 : 0), wy = Hh.y - 30 + Math.round(Math.sin(t * 2) * 2) + (P.down ? Math.round(P.down * 10) : 0); b.globalAlpha = 0.88; b.drawImage(wk, 2 * 16, wf * 16, 16, 16, wx, wy, 16, 16); b.globalAlpha = 1; }
    // ombre
    b.fillStyle = C.ink; b.globalAlpha = 0.5; for (let xx = -5; xx <= 5; xx++) if (bay(xx, 0) < 1 - (xx / 5) ** 2) b.fillRect(x + 8 + xx, Hh.y, 1, 1); b.globalAlpha = 1;
    // traînée sur un critique ou un 奥義
    if (ph && lvl > 0) for (let j = 3; j >= 1; j--) { const [kk] = dash(e0 - j * 0.03); b.globalAlpha = 0.25 / j; blit(b, cell(hero, ...frame), Math.round(lerp(Hh.x, target, kk)) - 8, y); }
    b.globalAlpha = 1;
    if (P.down > 0) { // à terre : la case tournée d'un quart de tour, sans flou
      b.save(); b.translate(x + 8, Hh.y - 6); b.rotate(Math.PI / 2 * Math.min(1, P.down * 2)); b.drawImage(hero, HERO.hurt[0] * 16, HERO.hurt[1] * 16, 16, 16, -8, -8, 16, 16); b.restore(); P.last = null; return;
    }
    const blink = hurt > 0 && Math.floor(t * 24) % 2 === 0;
    if (blink) { const hs = heroSil(C.verm); if (hs) b.drawImage(hs, frame[0] * 16, frame[1] * 16, 16, 16, x, y, 16, 16); }
    else blit(b, cell(hero, ...frame), x, y);
    P.last = { x, y, sx: frame[0] * 16, sy: frame[1] * 16 };
    // la lame, pendant le coup
    if (ph === 'cut') { b.fillStyle = C.paper; for (let i = 0; i < 9; i++) b.fillRect(x - 1 - i, y + 9 - Math.floor(i / 3), 1, 1); b.fillStyle = C.ash; b.fillRect(x, y + 9, 2, 1); }
  },

  drawFx(t, dt) {
    // coups de lame : des traits de pixels qui s'étirent puis s'effacent en trame
    for (let i = P.slashes.length - 1; i >= 0; i--) { const s = P.slashes[i], e = t - s.t; if (e < 0) continue; if (e > s.dur + s.hold + 0.2) { P.slashes.splice(i, 1); continue; }
      const k = clamp(e / s.dur, 0, 1), a = 1 - clamp((e - s.dur - s.hold) / 0.2, 0, 1), len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0), n = Math.ceil(len);
      b.fillStyle = s.col;
      for (let j = 0; j <= n * k; j++) { const u = j / n, px = Math.round(lerp(s.x0, s.x1, u)), py = Math.round(lerp(s.y0, s.y1, u)), w = Math.max(1, Math.round(s.w * Math.sin(Math.PI * clamp(u, 0.05, 0.95)))); for (let q = 0; q < w; q++) if (bay(px + q, py) < a) b.fillRect(px, py - Math.floor(w / 2) + q, 1, 1); } }
    // particules : des pixels carrés
    for (let i = P.parts.length - 1; i >= 0; i--) { const p = P.parts[i]; p.life -= dt; if (p.life <= 0) { P.parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; const a = clamp(p.life / p.max * 1.5, 0, 1); if (bay(Math.round(p.x), Math.round(p.y)) > a) continue; b.fillStyle = p.c; b.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    // chiffres qui rebondissent, comme dans les vieux Final Fantasy
    for (let i = P.nums.length - 1; i >= 0; i--) { const n = P.nums[i], e = t - n.t; if (e > 1.3) { P.nums.splice(i, 1); continue; }
      const hop = e < 0.5 ? Math.abs(Math.sin(e / 0.5 * Math.PI * 1.5)) * (1 - e / 0.5) * 12 : 0, rise = e > 0.9 ? (e - 0.9) * 10 : 0;
      if (e > 1.0 && Math.floor(e * 20) % 2) continue;
      digits(b, n.txt, n.x, n.y - hop - rise, n.big ? C.verm : n.crit ? '#ffcb8d' : C.paper, n.big ? 2 : 1); }
  },

  // en pleine résolution par-dessus les pixels : sceaux à l'encre et lettres de la créature
  overlay(g, cv, t, ox, oy, M) {
    const m = P.mon, S = this.S, toX = x => ox + x * Z, toY = y => oy + y * Z;
    if (m && !m.dying && m.last && t - m.born > 1) { const cr = creature(m.kind); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = Math.round(Z * 7) + 'px ' + DOT;
      m.glyphs.forEach((ch, i) => { const a = t * (m.rage ? 0.5 : 0.22) + i * (6.283 / m.glyphs.length), rx = cr.w * 0.75, ry = cr.h * 0.42, gx = Math.round(M.x + Math.cos(a) * rx), gy = Math.round(m.last.y + cr.h * 0.5 + Math.sin(a) * ry * 0.6);
        g.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.6 + i * 2); g.fillStyle = 'rgb(' + (i % 3 === 0 || m.rage ? VERM : BONE) + ')'; g.fillText(ch, toX(gx), toY(gy)); }); g.globalAlpha = 1; }
    g.textBaseline = 'middle';
    for (let i = P.stamps.length - 1; i >= 0; i--) { const s = P.stamps[i], e = t - s.t, life = s.long ? 1.8 : 1.0; if (e < 0) continue; if (e > life) { P.stamps.splice(i, 1); continue; }
      const k = clamp(e / 0.12, 0, 1), sc = lerp(2.2, 1, ease(k)), a = k * (1 - clamp((e - life + 0.3) / 0.3, 0, 1)), u = cv.height * 0.058 * s.size, n = s.txt.length, bw = u * 1.5, bh = u * (n * 1.12 + 0.4);
      g.save(); g.translate(toX(s.bx), toY(s.by)); g.rotate(-0.07); g.scale(sc, sc); g.globalAlpha = a; g.fillStyle = 'rgba(' + s.col + ',0.94)'; g.fillRect(-bw / 2, -bh / 2, bw, bh); g.strokeStyle = 'rgba(5,5,5,0.55)'; g.lineWidth = 2; g.strokeRect(-bw / 2 + 4, -bh / 2 + 4, bw - 8, bh - 8);
      g.fillStyle = s.col === BONE || s.col === GOLD ? '#0a0909' : '#fff6ea'; g.font = '800 ' + Math.round(u) + 'px ' + MINCHO; [...s.txt].forEach((ch, j) => g.fillText(ch, 0, (j - (n - 1) / 2) * u * 1.12)); g.restore(); }
    // voile rouge quand on encaisse ou que la créature est enragée, éclair blanc sur les coups forts
    const W = cv.width, H = cv.height, rage = m && m.rage && !m.dying ? 0.14 + 0.05 * Math.sin(t * 3) : 0, hv = Math.max(S.hurt * 0.5, rage);
    if (hv > 0) { const hg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); hg.addColorStop(0, 'rgba(160,20,10,0)'); hg.addColorStop(1, 'rgba(190,30,15,' + hv + ')'); g.fillStyle = hg; g.fillRect(0, 0, W, H); }
    if (S.flash > 0) { g.fillStyle = 'rgba(242,234,241,' + (S.flash * 0.45) + ')'; g.fillRect(0, 0, W, H); }
  }
};

export { Pix };
