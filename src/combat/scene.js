/* ===== 言霊 : fond du titre et du repaire (encre), état partagé, sons (WebAudio) ===== */
import { ASSETS } from './assets';
import { Pix } from './pixel.js';
const cv = document.getElementById('cv'), g = cv.getContext('2d');
let W = 0, HH = 0, DPR = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; HH = window.innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(HH * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0); }
window.addEventListener('resize', resize);
const S = { t: 0, shake: 0, hurt: 0, flash: 0, freeze: 0, impact: 0, hunt: false, title: true, tele: null, dust: [], fog: [] };
for (let i = 0; i < 70; i++) S.dust.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, p: Math.random() * 6.28 });
for (let i = 0; i < 5; i++) S.fog.push({ x: Math.random(), y: 0.5 + Math.random() * 0.2, w: 0.5 + Math.random() * 0.5, s: 0.004 + Math.random() * 0.006 });
const BONE = '236,230,218', VERM = '212,65,43';

const IMG = {}; for (const k in ASSETS) { const i = new Image(); i.onload = () => { i.ok = true; }; i.src = ASSETS[k]; IMG[k] = i; }

/* La chasse se dessine en pixel (pixel.js). Ici ne reste que le fond à l'encre du titre et du repaire. */
const Scene = Object.assign(Pix, {
  frame(dt) {
    const real = dt; S.impact = Math.max(0, S.impact - real);
    if (S.freeze > 0) { S.freeze -= dt; dt *= 0.04; }
    S.t += dt; S.shake *= Math.pow(0.0015, dt); S.hurt = Math.max(0, S.hurt - dt * 1.4); S.flash = Math.max(0, S.flash - dt * 2.2);
    if (S.hunt) return Pix.draw(g, cv, dt);
    g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, HH); inkBg(S.t, dt); g.restore();
    const vg = g.createRadialGradient(W / 2, HH * 0.5, Math.min(W, HH) * 0.25, W / 2, HH * 0.5, Math.max(W, HH) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)'); g.fillStyle = vg; g.fillRect(0, 0, W, HH);
  }
});

function inkBg(t, dt) {
  const im = IMG.bg_village;
  g.fillStyle = '#050505'; g.fillRect(-40, -40, W + 80, HH + 80);
  if (im && im.ok) { const z = 1.03 + 0.012 * Math.sin(t * 0.13), sc = Math.max(W / im.width, HH / im.height) * z, dw = im.width * sc, dh = im.height * sc; g.drawImage(im, (W - dw) / 2 + Math.sin(t * 0.09) * 6, (HH - dh) / 2, dw, dh); }
  g.fillStyle = S.title ? 'rgba(4,4,5,0.28)' : 'rgba(4,4,5,0.5)'; g.fillRect(-40, -40, W + 80, HH + 80);
  for (const f of S.fog) { f.x += f.s * dt; if (f.x > 1.4) f.x = -0.4; const fx = f.x * W, fy = f.y * HH, fw = f.w * W; const fg = g.createRadialGradient(fx, fy, 0, fx, fy, fw * 0.5); fg.addColorStop(0, 'rgba(200,196,188,0.06)'); fg.addColorStop(1, 'rgba(200,196,188,0)'); g.fillStyle = fg; g.fillRect(fx - fw / 2, fy - fw * 0.5, fw, fw); }
  for (const p of S.dust) { p.y -= 0.016 * p.z * dt; if (p.y < 0) p.y = 1; const x = (p.x + Math.sin(t * 0.3 + p.p) * 0.01) * W, y = p.y * HH; g.fillStyle = 'rgba(' + (p.p % 1 < 0.12 ? VERM : BONE) + ',' + (0.08 + 0.22 * p.z * (0.5 + 0.5 * Math.sin(t + p.p))) + ')'; g.fillRect(x, y, 1.4 * p.z + 0.4, 1.4 * p.z + 0.4); }
  if (S.title) { const im2 = IMG.p_ready; if (im2 && im2.ok) { const h = HH * 0.78, w = h * im2.width / im2.height, x = W * 0.7 - w / 2, y = HH * 0.97 - h + Math.sin(t * 0.9) * 3; g.save(); g.globalAlpha = 0.96; g.drawImage(im2, x, y, w, h); g.restore(); } }
}

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

Pix.S = S; Pix.Snd = Snd;

export { S, Scene, Snd, resize };
