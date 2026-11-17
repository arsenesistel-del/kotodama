// Peint la carte du monde à l'encre, une fois, dans un canvas : fond, mers, montagnes, brume, routes.
// Les lieux eux-mêmes (sceaux, noms, sabreur) sont posés par la scène, pour être cliquables et animés.
import { PLACES, ROUTE, placeById } from './places';

export const MAP_W = 1600;
export const MAP_H = 1000;

type Pt = { x: number; y: number };

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export function paintInkMap(openIds: Set<string>, scale = 2): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = MAP_W * scale;
  c.height = MAP_H * scale;
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  const r = rand(42);
  const ink = (a: number) => `rgba(236,230,218,${a})`;

  // Fond : noir chaud, plus clair au centre, grain de papier.
  g.fillStyle = '#0d0c0b';
  g.fillRect(0, 0, MAP_W, MAP_H);
  const bg = g.createRadialGradient(MAP_W * 0.52, MAP_H * 0.5, 80, MAP_W * 0.52, MAP_H * 0.5, MAP_W * 0.7);
  bg.addColorStop(0, 'rgba(48,44,39,0.55)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = bg;
  g.fillRect(0, 0, MAP_W, MAP_H);
  for (let i = 0; i < 14000; i++) {
    g.fillStyle = ink(0.015 + r() * 0.05);
    g.fillRect(r() * MAP_W, r() * MAP_H, 1, 1);
  }

  // La mer à l'ouest, sous le port : des traits horizontaux qui ondulent.
  g.save();
  g.beginPath();
  g.moveTo(0, 300);
  g.bezierCurveTo(170, 320, 300, 380, 320, 470);
  g.bezierCurveTo(330, 540, 250, 600, 0, 610);
  g.closePath();
  g.clip();
  g.fillStyle = 'rgba(120,135,145,0.07)';
  g.fillRect(0, 280, 360, 360);
  for (let y = 305; y < 610; y += 9) {
    g.beginPath();
    const off = r() * 40;
    for (let x = -10; x < 340; x += 6) g.lineTo(x, y + Math.sin((x + off) / 18) * 2.2);
    g.strokeStyle = `rgba(190,205,212,${0.07 + r() * 0.12})`;
    g.lineWidth = 1;
    g.stroke();
  }
  g.restore();
  g.beginPath();
  g.moveTo(0, 300);
  g.bezierCurveTo(170, 320, 300, 380, 320, 470);
  g.bezierCurveTo(330, 540, 250, 600, 0, 610);
  g.strokeStyle = ink(0.22);
  g.lineWidth = 1.4;
  g.stroke();

  // Une rivière qui descend des montagnes de l'est.
  g.save();
  g.filter = 'blur(1px)';
  g.beginPath();
  g.moveTo(1120, 0);
  g.bezierCurveTo(1060, 200, 1110, 330, 1030, 420);
  g.bezierCurveTo(960, 500, 1060, 640, 1010, 760);
  g.bezierCurveTo(980, 850, 1040, 930, 1020, 1000);
  g.strokeStyle = 'rgba(160,178,190,0.28)';
  g.lineWidth = 5;
  g.stroke();
  g.restore();

  // Montagnes : des silhouettes lavées à l'encre, de l'arrière vers l'avant.
  const near = (x: number, y: number, d: number) => PLACES.some((p) => Math.hypot(p.x - x, p.y - 20 - y) < d);
  const mounts: { x: number; y: number; w: number; h: number; snow: boolean }[] = [];
  for (let i = 0; i < 420 && mounts.length < 72; i++) {
    const x = 40 + r() * (MAP_W - 80), y = 80 + r() * (MAP_H - 120);
    if (x < 330 && y > 290 && y < 620) continue; // la mer
    const h = 30 + r() * r() * 150 * (1 - (y / MAP_H) * 0.4), w = h * (1.6 + r() * 1.8);
    if (near(x, y, 95)) continue;
    const snow = Math.hypot(x - 930, y - 260) < 260 || (x > 1250 && y < 320);
    mounts.push({ x, y, w, h, snow });
  }
  mounts.sort((a, b) => a.y - b.y);
  for (const m of mounts) {
    const { x, y, w, h } = m;
    const peaks = 1 + Math.floor(r() * 3);
    const pts: Pt[] = [{ x: x - w / 2, y }];
    for (let k = 0; k < peaks; k++) {
      const px = x - w / 2 + (w * (k + 0.5 + (r() - 0.5) * 0.4)) / peaks;
      const ph = h * (k === Math.floor(peaks / 2) ? 1 : 0.6 + r() * 0.3);
      pts.push({ x: px, y: y - ph });
      if (k < peaks - 1) pts.push({ x: px + w / peaks / 2, y: y - ph * (0.45 + r() * 0.2) });
    }
    pts.push({ x: x + w / 2, y });
    // Pentes creusées : raides près du sommet, douces vers la vallée, comme au pinceau.
    const ctrl = pts.map((b, k) => {
      if (!k) return b;
      const a = pts[k - 1];
      const [hi, lo] = a.y < b.y ? [a, b] : [b, a];
      return { x: hi.x + (lo.x - hi.x) * 0.38, y: lo.y - (lo.y - hi.y) * 0.12 };
    });
    const path = () => {
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) g.quadraticCurveTo(ctrl[k].x, ctrl[k].y, pts[k].x, pts[k].y);
    };
    // Masse : couvre ce qui est derrière, puis lavis.
    path();
    g.closePath();
    g.fillStyle = 'rgba(13,12,11,0.92)';
    g.fill();
    const top = y - h;
    const wash = g.createLinearGradient(0, top, 0, y);
    wash.addColorStop(0, m.snow ? 'rgba(236,232,224,0.40)' : 'rgba(215,208,196,0.22)');
    wash.addColorStop(0.55, 'rgba(160,152,140,0.08)');
    wash.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = wash;
    g.fill();
    // Crête au pinceau sec.
    path();
    g.strokeStyle = ink(m.snow ? 0.55 : 0.3);
    g.lineWidth = 1.3;
    g.stroke();
    for (let k = 0; k < 5; k++) {
      const sx = x - w / 3 + r() * w * 0.66, sy = y - h * (0.2 + r() * 0.5);
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx + (r() - 0.5) * 10, sy + 8 + r() * 14);
      g.strokeStyle = ink(0.05 + r() * 0.08);
      g.lineWidth = 1;
      g.stroke();
    }
  }

  // Bancs de brume.
  g.save();
  g.filter = 'blur(22px)';
  for (let i = 0; i < 22; i++) {
    g.fillStyle = `rgba(225,225,220,${0.04 + r() * 0.05})`;
    g.beginPath();
    g.ellipse(r() * MAP_W, r() * MAP_H, 120 + r() * 220, 18 + r() * 30, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Brume plus dense autour de Kirino.
  g.fillStyle = 'rgba(225,228,230,0.10)';
  g.beginPath();
  g.ellipse(220, 760, 210, 70, -0.2, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // La grand-route : ouverte, au pinceau ; fermée, en pointillés pâles.
  const pts = ROUTE.map((id) => placeById(id)!);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const open = openIds.has(p1.id) && openIds.has(p2.id);
    if (open) {
      for (const [lw, a, j] of [[3.4, 0.5, 0.8], [1.8, 0.7, 0.5]] as const) {
        g.beginPath();
        g.moveTo(p1.x + (r() - 0.5) * j, p1.y);
        g.bezierCurveTo(c1.x + (r() - 0.5) * j * 4, c1.y, c2.x, c2.y + (r() - 0.5) * j * 4, p2.x, p2.y);
        g.strokeStyle = ink(a);
        g.lineWidth = lw;
        g.lineCap = 'round';
        g.stroke();
      }
    } else {
      g.save();
      g.setLineDash([2, 10]);
      g.beginPath();
      g.moveTo(p1.x, p1.y);
      g.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
      g.strokeStyle = ink(0.26);
      g.lineWidth = 2;
      g.lineCap = 'round';
      g.stroke();
      g.restore();
    }
  }
  // Sentier du village au col.
  for (const s of PLACES.filter((p) => p.from)) {
    const a = placeById(s.from!)!;
    g.save();
    g.setLineDash([5, 6]);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.quadraticCurveTo((a.x + s.x) / 2 + 40, (a.y + s.y) / 2 + 10, s.x, s.y);
    g.strokeStyle = ink(openIds.has(s.id) ? 0.5 : 0.2);
    g.lineWidth = 1.8;
    g.stroke();
    g.restore();
  }
  return c;
}
