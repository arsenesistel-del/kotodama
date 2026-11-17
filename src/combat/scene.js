/* ===== 言霊 : décor, créatures, effets (canvas) et sons (WebAudio), tout en code ===== */
import { ASSETS } from './assets';
const cv = document.getElementById('cv'), g = cv.getContext('2d');
let W = 0, HH = 0, DPR = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; HH = window.innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(HH * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0); }
window.addEventListener('resize', resize);
const S = { t: 0, shake: 0, hurt: 0, flash: 0, freeze: 0, zoom: 0, impact: 0, hunt: false, title: true, mon: null, parts: [], nums: [], strokes: [], decals: [], stamps: [], atk: null, dashT: -9, hitT: -9, down: 0, tele: null, dust: [], fog: [], emb: 0 };
for (let i = 0; i < 70; i++) S.dust.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, p: Math.random() * 6.28 });
for (let i = 0; i < 5; i++) S.fog.push({ x: Math.random(), y: 0.5 + Math.random() * 0.2, w: 0.5 + Math.random() * 0.5, s: 0.004 + Math.random() * 0.006 });
const lerp = (a, b, k) => a + (b - a) * k, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = k => k * k * (3 - 2 * k), frac = x => x - Math.floor(x), hash = x => frac(Math.sin(x * 127.1) * 43758.5453);
const BONE = '236,230,218', VERM = '212,65,43', GOLD = '220,185,116';
const MINCHO = '"Shippori Mincho","Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif';

const IMG = {}; for (const k in ASSETS) { const i = new Image(); i.onload = () => { i.ok = true; }; i.src = ASSETS[k]; IMG[k] = i; }

/* un trait de pinceau sec : plusieurs poils le long d'une courbe, qui s'épuisent vers la fin */
function brush(s, k, a) {
  const dx = s.x1 - s.x0, dy = s.y1 - s.y0, cx = (s.x0 + s.x1) / 2 - dy * s.bend, cy = (s.y0 + s.y1) / 2 + dx * s.bend, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, hairs = s.hairs || 11, n = 28;
  g.save(); g.lineCap = 'round';
  for (let h = 0; h < hairs; h++) {
    const o = h / (hairs - 1) - 0.5, r = hash(s.seed + h * 7.31); g.beginPath(); let on = false;
    for (let i = 0; i <= n; i++) {
      const u = i / n * k, wd = s.w * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.92 + 0.06)), 0.55);
      const dry = hash(s.seed + h * 3.7 + i * 1.9) < Math.abs(o) * 0.5 + Math.max(0, u - 0.55) * 1.5 * r;
      if (dry) { on = false; continue; }
      const q = 1 - u, px = q * q * s.x0 + 2 * q * u * cx + u * u * s.x1 + nx * o * wd, py = q * q * s.y0 + 2 * q * u * cy + u * u * s.y1 + ny * o * wd;
      if (on) g.lineTo(px, py); else { g.moveTo(px, py); on = true; }
    }
    g.lineWidth = Math.max(1, s.w / hairs * (0.9 + r * 1.3)); g.strokeStyle = 'rgba(' + s.col + ',' + (a * (0.5 + 0.5 * r)) + ')'; g.stroke();
  }
  g.restore();
}
function ink(x, y, n, speed, col, size, grav) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = speed * (0.25 + Math.random()); S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.2, life: 0.5 + Math.random() * 0.7, max: 1.2, g: grav, c: typeof col === 'function' ? col() : col, s: size * (0.4 + Math.random()) }); } }
const mix = () => Math.random() < 0.45 ? VERM : BONE;

const Scene = {
  setMonster(st) { S.mon = st ? { kind: st.id, big: st.id === 'ou' ? 1.22 : st.id === 'kuzure' ? 0.9 : 1, emit: 0, glyphs: [...st.glyphs], hp: 1, flinch: 0, dying: 0, born: S.t, seed: Math.random() * 100, glitchT: 0, bars: [], stag: false, stagK: 0, rage: false, rageT: -9, rect: null } : null; S.tele = null; S.atk = null; S.strokes = []; S.stamps = []; S.decals = []; S.down = 0; },
  setHp(r) { if (S.mon) S.mon.hp = clamp(r, 0, 1); },
  telegraph(start, dur) { S.tele = { start, dur }; }, clearTele() { S.tele = null; },
  stagger(on) { const m = S.mon; if (!m) return; m.stag = on; if (on) { const P = this.mpos(); S.shake = 14; S.flash = 0.35; S.stamps.push({ txt: '崩', x: P.x - P.r * 2.6, y: P.y - P.r * 1.3, t: S.t, col: GOLD, size: 1.15 }); ink(P.x, P.y, 40, 380, () => Math.random() < 0.5 ? GOLD : BONE, 4); } },
  enrage() { const m = S.mon; if (!m) return; m.rage = true; m.rageT = S.t; S.shake = 20; S.hurt = 0.5; const P = this.mpos(); ink(P.x, P.y, 70, 520, VERM, 5); S.stamps.push({ txt: '怒', x: P.x - P.r * 2.6, y: P.y - P.r * 1.3, t: S.t, col: VERM, size: 1.3 }); },
  // level : 0 coup simple, 1 coup critique, 2 奥義
  slash(level, dmg, label) {
    const m = S.mon; if (!m) return; const P = this.mpos(), R = P.r, crit = level >= 1;
    S.dashT = S.t; m.flinch = 1; S.shake = Math.max(S.shake, level === 2 ? 22 : crit ? 13 : 6);
    if (crit) { S.flash = 0.4; S.freeze = level === 2 ? 0.2 : 0.1; S.zoom = level === 2 ? 1.8 : 1; S.impact = level === 2 ? 0.16 : 0.085; }
    const st = (dl, ang, w, col) => { const c = Math.cos(ang), s = Math.sin(ang), L = R * 2.5; S.strokes.push({ x0: P.x - c * L, y0: P.y - s * L, x1: P.x + c * L, y1: P.y + s * L, bend: 0.08 * (Math.random() < 0.5 ? -1 : 1), w, col, t: S.t + dl, dur: 0.09, hold: 0.22, seed: Math.random() * 99 }); };
    st(0.12, 0.62 + (Math.random() - 0.5) * 0.3, R * (crit ? 0.5 : 0.34), BONE);
    if (crit) st(0.2, -0.7 + (Math.random() - 0.5) * 0.3, R * 0.42, VERM);
    if (level === 2) { st(0.3, 0.05, R * 0.7, BONE); st(0.36, 1.45, R * 0.5, VERM); }
    ink(P.x, P.y, level === 2 ? 90 : crit ? 50 : 24, crit ? 460 : 280, mix, crit ? 5 : 3.5);
    for (let i = 0; i < (crit ? 6 : 3); i++) S.decals.push({ x: P.x + (Math.random() - 0.5) * R * 5, y: HH * (0.6 + Math.random() * 0.1), r: R * (0.15 + Math.random() * 0.5), t: S.t, c: Math.random() < 0.4 ? VERM : '14,12,12' });
    if (S.decals.length > 36) S.decals.splice(0, S.decals.length - 36);
    S.nums.push({ x: P.x + (Math.random() - 0.5) * 70, y: Math.max(HH * 0.2, P.y - R * 1.5), txt: String(Math.round(dmg)), t: S.t, crit, big: level === 2 });
    if (label) S.stamps.push({ txt: label, x: Math.min(W * 0.9, P.x + R * 2.3), y: Math.max(HH * 0.24, P.y - R * 1.2), t: S.t + 0.1, col: level === 2 ? VERM : crit ? GOLD : BONE, size: level === 2 ? 1.25 : 1 });
  },
  monsterAttack() { if (!S.mon) return; S.atk = { t: S.t, hit: false }; Snd.whoosh(); },
  playerDown() { S.down = 0.0001; },
  die() {
    const m = S.mon; if (!m) return; m.dying = 0.0001; m.stag = false; S.flash = 0.9; S.shake = 24; S.freeze = 0.22; S.zoom = 2; S.impact = 0.18; const P = this.mpos(), R = P.r;
    for (let i = 0; i < 4; i++) { const ang = i * 0.8 + 0.3, c = Math.cos(ang), s = Math.sin(ang), L = R * 3; S.strokes.push({ x0: P.x - c * L, y0: P.y - s * L, x1: P.x + c * L, y1: P.y + s * L, bend: 0.06, w: R * 0.55, col: i % 2 ? VERM : BONE, t: S.t + i * 0.05, dur: 0.08, hold: 0.5, seed: Math.random() * 99 }); }
    ink(P.x, P.y, 150, 560, mix, 6, 140); S.stamps.push({ txt: '祓', x: W * 0.5, y: HH * 0.3, t: S.t + 0.5, col: VERM, size: 2.2, long: true });
  },
  mpos() { const r = Math.min(W * 0.75, HH) * 0.118 * (S.mon ? S.mon.big : 1); return { x: W * 0.68, y: HH * 0.35, r }; },
  ppos() { return { x: W * 0.24, y: HH * 0.6, s: HH / 520 }; },

  frame(dt) {
    const real = dt; S.impact = Math.max(0, S.impact - real);
    if (S.freeze > 0) { S.freeze -= dt; dt *= 0.04; } S.zoom = Math.max(0, S.zoom - dt * 3.2);
    S.t += dt; const t = S.t;
    S.shake *= Math.pow(0.0015, dt); S.hurt = Math.max(0, S.hurt - dt * 1.4); S.flash = Math.max(0, S.flash - dt * 2.2);
    let tk = 0; if (S.tele && S.mon) tk = clamp((performance.now() - S.tele.start) / S.tele.dur, 0, 1);
    g.save(); g.clearRect(0, 0, W, HH);
    if (S.shake > 0.3) g.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    const z = 1 + 0.045 * S.zoom + 0.03 * tk * tk; if (z > 1.001) { const zm = this.mpos(), zx = S.zoom > 0.01 ? zm.x : W * 0.5, zy = S.zoom > 0.01 ? zm.y : HH * 0.42; g.translate(zx, zy); g.scale(z, z); g.translate(-zx, -zy); }
    this.bg(t, dt);
    if (S.hunt) this.ground(t);
    if (S.mon) this.monster(t, dt, tk);
    if (S.hunt) this.player(t, dt);
    if (S.impact > 0 && S.mon && S.mon.rect) { // image d'impact : tout noir, silhouettes blanches
      g.fillStyle = 'rgba(4,4,5,0.9)'; g.fillRect(-40, -40, W + 80, HH + 80); const r = S.mon.rect, im = IMG[S.mon.kind];
      g.save(); g.filter = 'brightness(0) invert(1)'; g.translate(r.x, r.y); g.rotate(r.rot); g.drawImage(im, -r.w / 2, -r.h / 2, r.w, r.h); g.restore();
    }
    this.fx(t, dt);
    g.restore();
    const vg = g.createRadialGradient(W / 2, HH * 0.5, Math.min(W, HH) * 0.25, W / 2, HH * 0.5, Math.max(W, HH) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); g.fillStyle = vg; g.fillRect(0, 0, W, HH);
    const rage = S.mon && S.mon.rage && !S.mon.dying ? 0.16 + 0.05 * Math.sin(t * 3) : 0, hv = Math.max(S.hurt * 0.55, rage);
    if (hv > 0) { const hg = g.createRadialGradient(W / 2, HH / 2, Math.min(W, HH) * 0.2, W / 2, HH / 2, Math.max(W, HH) * 0.7); hg.addColorStop(0, 'rgba(160,20,10,0)'); hg.addColorStop(1, 'rgba(190,30,15,' + hv + ')'); g.fillStyle = hg; g.fillRect(0, 0, W, HH); }
    if (S.flash > 0) { g.fillStyle = 'rgba(235,250,245,' + (S.flash * 0.5) + ')'; g.fillRect(0, 0, W, HH); }
  },

  bg(t, dt) {
    const im = IMG[S.hunt ? 'bg_temple' : 'bg_village'];
    g.fillStyle = '#050505'; g.fillRect(-40, -40, W + 80, HH + 80);
    if (im && im.ok) { const z = 1.03 + 0.012 * Math.sin(t * 0.13), sc = Math.max(W / im.width, HH / im.height) * z, dw = im.width * sc, dh = im.height * sc; g.drawImage(im, (W - dw) / 2 + Math.sin(t * 0.09) * 6, (HH - dh) / 2, dw, dh); }
    if (S.hunt) {
      const gx = W * 0.5, gy = HH * 0.37, gr = HH * 0.34, gl = g.createRadialGradient(gx, gy, 2, gx, gy, gr); gl.addColorStop(0, 'rgba(' + BONE + ',' + (0.13 + 0.05 * Math.sin(t * 0.8)) + ')'); gl.addColorStop(1, 'rgba(' + BONE + ',0)'); g.fillStyle = gl; g.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      const hy = HH * 0.5; for (let k = 0; k < 34; k++) { const f = k / 34, y = hy + Math.pow(f, 1.8) * (HH - hy); g.strokeStyle = 'rgba(' + BONE + ',' + (0.012 + 0.035 * (1 - f) * (0.5 + 0.5 * Math.sin(t * 0.7 + k * 1.7))) + ')'; g.lineWidth = 1; g.beginPath(); const off = Math.sin(t * 0.5 + k) * 14 * f; g.moveTo(W * 0.12 * (1 - f) + off, y); g.lineTo(W - W * 0.12 * (1 - f) + off, y); g.stroke(); }
    } else { g.fillStyle = S.title ? 'rgba(4,4,5,0.28)' : 'rgba(4,4,5,0.5)'; g.fillRect(-40, -40, W + 80, HH + 80); }
    for (const f of S.fog) { f.x += f.s * dt; if (f.x > 1.4) f.x = -0.4; const fx = f.x * W, fy = f.y * HH, fw = f.w * W; const fg = g.createRadialGradient(fx, fy, 0, fx, fy, fw * 0.5); fg.addColorStop(0, 'rgba(200,196,188,0.06)'); fg.addColorStop(1, 'rgba(200,196,188,0)'); g.fillStyle = fg; g.fillRect(fx - fw / 2, fy - fw * 0.5, fw, fw); }
    const hot = S.mon && S.mon.rage;
    for (const p of S.dust) { p.y -= 0.016 * p.z * dt * (hot ? 3 : 1); if (p.y < 0) p.y = 1; const x = (p.x + Math.sin(t * 0.3 + p.p) * 0.01) * W, y = p.y * HH; g.fillStyle = 'rgba(' + (p.p % 1 < (hot ? 0.5 : 0.12) ? VERM : BONE) + ',' + (0.08 + 0.22 * p.z * (0.5 + 0.5 * Math.sin(t + p.p))) + ')'; g.fillRect(x, y, 1.4 * p.z + 0.4, 1.4 * p.z + 0.4); }
    if (S.hunt) { const lg = g.createLinearGradient(0, HH * 0.55, 0, HH); lg.addColorStop(0, 'rgba(4,4,5,0)'); lg.addColorStop(1, 'rgba(4,4,5,0.78)'); g.fillStyle = lg; g.fillRect(-40, HH * 0.55, W + 80, HH * 0.45 + 40); }
    if (S.title) { const im2 = IMG.p_ready; if (im2 && im2.ok) { const h = HH * 0.78, w = h * im2.width / im2.height, x = W * 0.7 - w / 2, y = HH * 0.97 - h + Math.sin(t * 0.9) * 3; g.save(); g.globalAlpha = 0.96; g.drawImage(im2, x, y, w, h); g.restore(); } }
  },

  ground(t) { // encre tombée sur l'eau
    for (let i = S.decals.length - 1; i >= 0; i--) { const d = S.decals[i], e = t - d.t; if (e > 9) { S.decals.splice(i, 1); continue; } const a = clamp(e / 0.25, 0, 1) * (1 - clamp((e - 5) / 4, 0, 1)) * 0.55, gr = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * (1 + e * 0.06));
      gr.addColorStop(0, 'rgba(' + d.c + ',' + a + ')'); gr.addColorStop(0.7, 'rgba(' + d.c + ',' + a * 0.5 + ')'); gr.addColorStop(1, 'rgba(' + d.c + ',0)'); g.save(); g.translate(d.x, d.y); g.scale(1, 0.2); g.translate(-d.x, -d.y); g.fillStyle = gr; g.fillRect(d.x - d.r * 2, d.y - d.r * 2, d.r * 4, d.r * 4); g.restore(); }
  },

  monster(t, dt, tk) {
    const m = S.mon, P = this.mpos(), PP = this.ppos(), K = m.kind, im = IMG[K], R = P.r;
    const appear = clamp((t - m.born) / 1.3, 0, 1); m.flinch = Math.max(0, m.flinch - dt * 3.2); m.stagK = lerp(m.stagK, m.stag ? 1 : 0, 1 - Math.pow(0.002, dt));
    if (m.dying) m.dying = Math.min(1, m.dying + dt * 0.5);
    const dy = m.dying, alpha = appear * (1 - dy), unstable = 0.3 * (1 - m.hp) + m.flinch * 0.5 + (m.rage ? 0.12 : 0) + m.stagK * 0.25, hot = tk > 0.75 && !m.stag;
    // attaque : recul, ruée vers le sabreur, retour
    let ox = 0, asc = 1, rot = 0, ghosts = 0;
    if (S.atk) { const e = t - S.atk.t, L = (P.x - PP.x) * 0.5;
      if (e < 0.24) { const k = ease(e / 0.24); ox = R * 0.4 * k; asc = 1 + 0.08 * k; rot = 0.07 * k; }
      else if (e < 0.36) { const k = (e - 0.24) / 0.12; ox = lerp(R * 0.4, -L, k * k); asc = 1.08; rot = lerp(0.07, -0.13, k); ghosts = 1; }
      else if (e < 0.52) { ox = -L; asc = 1.08; rot = -0.13; ghosts = 1 - (e - 0.36) / 0.16; }
      else { const k = ease(clamp((e - 0.52) / 0.42, 0, 1)); ox = lerp(-L, 0, k); asc = lerp(1.08, 1, k); rot = lerp(-0.13, 0, k); }
      if (e >= 0.36 && !S.atk.hit) { S.atk.hit = true; S.hurt = 1; S.shake = 18; S.hitT = t; Snd.hurt(); const hx = PP.x + 10, hy = PP.y - 70 * PP.s;
        S.strokes.push({ x0: hx + R * 1.6, y0: hy - R * 1.5, x1: hx - R * 1.3, y1: hy + R * 1.2, bend: -0.12, w: R * 0.45, col: VERM, t, dur: 0.07, hold: 0.25, seed: Math.random() * 99 });
        S.strokes.push({ x0: hx + R * 1.8, y0: hy - R * 0.9, x1: hx - R * 1.1, y1: hy + R * 1.6, bend: -0.1, w: R * 0.3, col: '20,6,6', t: t + 0.03, dur: 0.07, hold: 0.25, seed: Math.random() * 99 });
        ink(hx, hy, 26, 300, VERM, 4); }
      if (e > 0.96) S.atk = null; }
    const windup = clamp((tk - 0.75) / 0.25, 0, 1) * (m.stag ? 0 : 1);
    const x = P.x + Math.sin(t * 0.6) * 7 + ox + (Math.random() - 0.5) * m.flinch * 16 + m.flinch * R * 0.3 + windup * R * 0.12 + (hot ? (Math.random() - 0.5) * 3 : 0);
    const y = P.y + Math.sin(t * 0.9) * 10 * (1 - m.stagK) - dy * 60 + m.stagK * R * 0.55;
    rot += m.stagK * (0.22 + 0.02 * Math.sin(t * 9)) + m.flinch * 0.05;
    const sc = (1 + 0.02 * Math.sin(t * 1.3)) * (0.92 + 0.08 * appear) * (1 + windup * 0.06) * asc * (m.rage ? 1.05 : 1) * (1 + 0.25 * clamp(1 - (t - m.rageT) / 0.5, 0, 1));
    const h = R * 4.3 * sc, w = im && im.ok ? h * im.width / im.height : h * 0.8;
    m.rect = { x, y, w, h, rot };
    if (dy) { const bw = R * (0.6 + dy * 2.4), bg = g.createLinearGradient(x - bw, 0, x + bw, 0); bg.addColorStop(0, 'rgba(' + BONE + ',0)'); bg.addColorStop(0.5, 'rgba(' + BONE + ',' + (0.5 * (1 - dy)) + ')'); bg.addColorStop(1, 'rgba(' + BONE + ',0)'); g.fillStyle = bg; g.fillRect(x - bw, 0, bw * 2, HH * 0.7); }
    const red = hot || m.rage, ar = R * (3.2 + (m.rage ? 0.6 : 0)), au = g.createRadialGradient(x, y, R * 0.3, x, y, ar);
    au.addColorStop(0, m.stagK > 0.3 ? 'rgba(' + GOLD + ',' + (0.22 * alpha * m.stagK) + ')' : red ? 'rgba(' + VERM + ',' + ((hot ? 0.36 : 0.2) * alpha) + ')' : 'rgba(' + BONE + ',' + ((0.07 + 0.1 * tk) * alpha) + ')'); au.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = au; g.fillRect(x - ar, y - ar, ar * 2, ar * 2);
    g.save(); g.globalAlpha = 0.5 * alpha; const sh = g.createRadialGradient(x, HH * 0.6, 0, x, HH * 0.6, R * 1.9); sh.addColorStop(0, 'rgba(0,0,0,0.9)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.translate(x, HH * 0.6); g.scale(1, 0.16); g.translate(-x, -HH * 0.6); g.fillRect(x - R * 2, HH * 0.6 - R * 2, R * 4, R * 4); g.restore();
    m.emit -= dt; if (m.emit <= 0 && !dy && appear >= 1) { m.emit = m.rage ? 0.05 : 0.12; const up = K === 'tsutae' || K === 'yuragi' || m.rage;
      S.parts.push({ x: x + (Math.random() - 0.5) * w * 0.7, y: y + (up ? -h * 0.1 : h * 0.3) + (Math.random() - 0.5) * h * 0.3, vx: (Math.random() - 0.5) * 24, vy: up ? -50 - Math.random() * 60 : 30, life: 1.3, max: 1.3, g: up ? -30 : 160, c: Math.random() < (m.rage ? 0.6 : 0.18) ? VERM : '210,204,192', s: 1.5 + Math.random() * 3.5 }); }
    if (im && im.ok) {
      const chaos = (1 - appear) * 1.2 + dy * 1.6;
      if (t - m.glitchT > 0.1) { m.glitchT = t; m.bars = []; const nb = Math.floor(Math.random() * 2 + unstable * 7); for (let i = 0; i < nb; i++) m.bars.push({ i: Math.floor(Math.random() * 40), o: (Math.random() - 0.5) * R * (0.25 + unstable) }); }
      const NS = 40, sh2 = im.height / NS, dh = h / NS, off = new Float32Array(NS); for (const b of m.bars) off[b.i] += b.o;
      const body = (a, gx) => { g.globalAlpha = a; for (let i = 0; i < NS; i++) { const f = i / NS, sway = Math.sin(t * 1.5 + f * 4.2 + m.seed) * R * 0.05 * f * f * (1 + windup * 2) + Math.sin(t * 2.7 + f * 9) * R * 0.012;
        const o = off[i] + sway + Math.sin(i * 12.9898 + m.seed) * chaos * R * 1.6; g.drawImage(im, 0, i * sh2, im.width, sh2, -w / 2 + o + gx, -h / 2 + i * dh - dy * (NS - i) * 1.4, w, dh + 0.7); } };
      g.save(); g.translate(x, y); g.rotate(rot);
      if (ghosts > 0.02) for (let j = 3; j >= 1; j--) body(alpha * 0.16 * ghosts, j * R * 0.55);
      body(alpha, 0);
      if (m.flinch > 0.05) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * Math.min(1, m.flinch) * 0.8; g.drawImage(im, -w / 2, -h / 2, w, h); }
      else if (hot) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * (0.14 + 0.12 * Math.sin(t * 24)); g.drawImage(im, -w / 2, -h / 2, w, h); }
      g.restore();
    }
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    m.glyphs.forEach((ch, i) => { const a = t * (m.rage ? 0.5 : 0.22) + i * (6.283 / m.glyphs.length), rr = R * (2.5 + 0.2 * Math.sin(t + i) + dy * 2); const gx = x + Math.cos(a) * rr + (Math.random() < 0.02 ? (Math.random() - 0.5) * 16 : 0), gy = y + Math.sin(a) * rr * 0.6 - dy * 90; g.globalAlpha = alpha * (0.3 + 0.25 * Math.sin(t * 1.6 + i * 2)); g.font = '600 ' + Math.round(R * 0.42) + 'px ' + MINCHO; g.fillStyle = 'rgba(' + (i % 3 === 0 || m.rage ? VERM : BONE) + ',1)'; g.fillText(ch, gx, gy); });
    g.restore();
    if (S.tele && !dy && !m.stag) { const rr = R * 2.15; g.save(); g.lineCap = 'round'; g.lineWidth = 2; g.strokeStyle = 'rgba(' + BONE + ',0.1)'; g.beginPath(); g.arc(P.x, P.y, rr, 0, 6.283); g.stroke(); g.strokeStyle = hot ? 'rgba(232,82,58,0.95)' : 'rgba(' + BONE + ',0.85)'; g.lineWidth = hot ? 5 : 3; g.beginPath(); g.arc(P.x, P.y, rr, -1.5708, -1.5708 + 6.283 * (1 - tk)); g.stroke(); g.restore(); }
    if (m.stagK > 0.4 && !dy) for (let i = 0; i < 3; i++) { const a = t * 2.4 + i * 2.094, sx = x + Math.cos(a) * R * 0.9, sy = y - h * 0.48 + Math.sin(a) * R * 0.22, s = R * 0.12; g.save(); g.translate(sx, sy); g.rotate(t * 3); g.fillStyle = 'rgba(' + GOLD + ',' + (0.9 * m.stagK) + ')'; g.fillRect(-s / 2, -s / 2, s, s); g.restore(); }
    if (dy >= 1) S.mon = null;
  },

  player(t, dt) {
    const P = this.ppos(), M = this.mpos(), rd = IMG.p_ready, sl = IMG.p_slash; if (!rd || !rd.ok) return;
    const kAt = e => { let k = 0; if (e < 0) return 0; if (e < 0.14) k = e / 0.14; else if (e < 0.34) k = 1; else if (e < 0.76) k = 1 - (e - 0.34) / 0.42; return ease(k); };
    if (S.down) S.down = Math.min(1, S.down + dt * 1.2);
    const e0 = t - S.dashT, hurtK = clamp(1 - (t - S.hitT) / 0.45, 0, 1), H0 = HH * 0.36, fade = 1 - S.down * 0.75;
    S.emb -= dt; if (S.emb <= 0 && !S.down) { S.emb = 0.16; S.parts.push({ x: P.x - H0 * 0.34 + Math.random() * H0 * 0.2, y: P.y - H0 * (0.52 + Math.random() * 0.14), vx: -30 - Math.random() * 50, vy: -10 - Math.random() * 25, life: 1.1, max: 1.1, g: -8, c: VERM, s: 1.2 + Math.random() * 2 }); }
    const draw = (e, a) => { const k = kAt(e), striking = k > 0.12 && sl && sl.ok, im = striking ? sl : rd, h = striking ? H0 * 0.84 : H0, w = h * im.width / im.height;
      const cx = lerp(P.x, M.x - M.r * 3.1, k) - hurtK * 34, fy = P.y + (striking ? 0 : Math.sin(t * 1.4) * 1.8) + S.down * H0 * 0.1, x = cx - w * (striking ? 0.42 : 0.56) + (hurtK ? (Math.random() - 0.5) * 7 * hurtK : 0);
      g.save(); g.globalAlpha = 0.16 * a; g.translate(0, fy * 2 + 4); g.scale(1, -1); g.drawImage(im, x, fy - h * 0.5, w, h * 0.5); g.restore();
      g.save(); g.globalAlpha = a; g.drawImage(im, x, fy - h, w, h); if (hurtK > 0.05 && a === fade) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = hurtK * 0.55; g.drawImage(im, x, fy - h, w, h); } g.restore(); };
    if (e0 < 0.5) for (let j = 4; j >= 1; j--) draw(e0 - j * 0.03, 0.2 / j);
    draw(e0, fade);
    if (e0 > 0.02 && e0 < 0.3) { const a = 1 - e0 / 0.3; g.strokeStyle = 'rgba(' + BONE + ',' + (0.35 * a) + ')'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { const yy = P.y - H0 * (0.15 + i * 0.17); g.beginPath(); g.moveTo(P.x - H0 * 0.2, yy); g.lineTo(lerp(P.x, M.x - M.r * 3, clamp(e0 / 0.14, 0, 1)), yy); g.stroke(); } }
  },

  fx(t, dt) {
    for (let i = S.strokes.length - 1; i >= 0; i--) { const s = S.strokes[i], e = t - s.t; if (e < 0) continue; if (e > s.dur + s.hold + 0.25) { S.strokes.splice(i, 1); continue; } brush(s, clamp(e / s.dur, 0.02, 1), 1 - clamp((e - s.dur - s.hold) / 0.25, 0, 1)); }
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts.splice(i, 1); continue; } p.vy += (p.g === undefined ? 380 : p.g) * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.globalAlpha = clamp(p.life / p.max * 1.6, 0, 1); g.fillStyle = 'rgb(' + p.c + ')'; g.beginPath(); g.arc(p.x, p.y, p.s * 0.6, 0, 6.283); g.fill(); }
    g.globalAlpha = 1; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (let i = S.nums.length - 1; i >= 0; i--) { const n = S.nums[i], e = t - n.t; if (e > 1.2) { S.nums.splice(i, 1); continue; } const a = 1 - clamp((e - 0.7) / 0.5, 0, 1), y = n.y - e * 70, sc = n.crit ? 1 + Math.max(0, 0.25 - e) * 2 : 1;
      g.font = '800 ' + Math.round((n.big ? 92 : n.crit ? 64 : 42) * sc * HH / 800) + 'px ' + MINCHO; g.fillStyle = n.crit ? 'rgba(255,214,150,' + a + ')' : 'rgba(235,250,245,' + a + ')'; g.strokeStyle = 'rgba(0,0,0,' + (0.6 * a) + ')'; g.lineWidth = 4; g.strokeText(n.txt, n.x, y); g.fillText(n.txt, n.x, y); }
    // sceaux : 会心, 崩, 怒, 奥義, 祓
    g.textBaseline = 'middle';
    for (let i = S.stamps.length - 1; i >= 0; i--) { const s = S.stamps[i], e = t - s.t, life = s.long ? 1.8 : 1.0; if (e < 0) continue; if (e > life) { S.stamps.splice(i, 1); continue; }
      const k = clamp(e / 0.12, 0, 1), sc = lerp(2.2, 1, ease(k)), a = k * (1 - clamp((e - life + 0.3) / 0.3, 0, 1)), u = HH * 0.058 * s.size, n = s.txt.length, bw = u * 1.5, bh = u * (n * 1.12 + 0.4);
      g.save(); g.translate(s.x, s.y); g.rotate(-0.07); g.scale(sc, sc); g.globalAlpha = a; g.fillStyle = 'rgba(' + s.col + ',0.94)'; g.fillRect(-bw / 2, -bh / 2, bw, bh); g.strokeStyle = 'rgba(5,5,5,0.55)'; g.lineWidth = 2; g.strokeRect(-bw / 2 + 4, -bh / 2 + 4, bw - 8, bh - 8);
      g.fillStyle = s.col === BONE || s.col === GOLD ? '#0a0909' : '#fff6ea'; g.font = '800 ' + Math.round(u) + 'px ' + MINCHO; [...s.txt].forEach((ch, j) => g.fillText(ch, 0, (j - (n - 1) / 2) * u * 1.12)); g.restore(); }
  }
};

/* ---------- sons : tout est synthétisé, volumes bas pour ne pas gêner le micro ---------- */
const Snd = {
  ctx: null, master: null, on: true,
  init() { if (this.ctx) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return; try { this.ctx = new C(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.55 : 0; this.master.connect(this.ctx.destination);
    for (const [f, gn] of [[55, 0.05], [82.5, 0.028], [110.4, 0.016]]) { const o = this.ctx.createOscillator(), gg = this.ctx.createGain(), l = this.ctx.createOscillator(), lg = this.ctx.createGain(); o.type = 'sine'; o.frequency.value = f; gg.gain.value = gn; l.frequency.value = 0.05 + Math.random() * 0.08; lg.gain.value = gn * 0.6; l.connect(lg); lg.connect(gg.gain); o.connect(gg); gg.connect(this.master); o.start(); l.start(); }
    const nb = this.buf(4), src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), ng = this.ctx.createGain(); src.buffer = nb; src.loop = true; f.type = 'lowpass'; f.frequency.value = 320; ng.gain.value = 0.02; src.connect(f); f.connect(ng); ng.connect(this.master); src.start(); },
  buf(sec) { const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  set(on) { this.on = on; if (this.master) this.master.gain.value = on ? 0.55 : 0; },
  tone(f, dur, type, gain, to, delay) { if (!this.ctx) return; const t = this.ctx.currentTime + (delay || 0), o = this.ctx.createOscillator(), gg = this.ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur); gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(gain, t + 0.012); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(gg); gg.connect(this.master); o.start(t); o.stop(t + dur + 0.05); },
  noise(dur, freq, gain, type, to) { if (!this.ctx) return; const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), gg = this.ctx.createGain(); s.buffer = this.buf(dur + 0.1); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur); gg.gain.setValueAtTime(gain, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(gg); gg.connect(this.master); s.start(t); s.stop(t + dur + 0.05); },
  slash(crit) { this.noise(0.22, 5200, 0.16, 'bandpass', 900); if (crit) { this.tone(1318, 0.5, 'sine', 0.09, null, 0.03); this.tone(1976, 0.6, 'sine', 0.06, null, 0.07); } else this.tone(660, 0.18, 'triangle', 0.05); },
  hurt() { this.tone(110, 0.45, 'sawtooth', 0.13, 42); this.noise(0.3, 240, 0.2, 'lowpass'); },
  whoosh() { this.noise(0.34, 300, 0.12, 'bandpass', 2400); },
  heavy() { this.noise(0.5, 6000, 0.2, 'bandpass', 500); this.tone(70, 0.6, 'sine', 0.2, 34); [1318, 1760, 2637].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.06, null, 0.05 + i * 0.05)); },
  stagger() { this.tone(988, 1.1, 'sine', 0.09); this.tone(1482, 1.3, 'sine', 0.05, null, 0.02); this.noise(0.25, 1800, 0.1, 'bandpass', 400); },
  roar() { this.tone(82, 1.1, 'sawtooth', 0.14, 38); this.tone(123, 0.9, 'square', 0.05, 55, 0.04); this.noise(0.9, 180, 0.22, 'lowpass'); },
  drum() { this.tone(92, 0.5, 'sine', 0.22, 40); this.noise(0.12, 900, 0.1, 'lowpass'); },
  ui() { this.tone(880, 0.07, 'sine', 0.025); },
  stamp() { this.tone(160, 0.22, 'sine', 0.14, 60); this.noise(0.08, 2400, 0.08, 'bandpass'); },
  cue() { this.tone(440, 0.12, 'sine', 0.035); },
  miss() { this.tone(196, 0.16, 'triangle', 0.05, 150); },
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.07, null, i * 0.13)); },
  lose() { [330, 262, 196].forEach((f, i) => this.tone(f, 0.8, 'sine', 0.07, null, i * 0.2)); }
};

export { S, Scene, Snd, resize };
