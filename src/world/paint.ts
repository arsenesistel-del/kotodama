// Intérieurs et objets japonais peints par le code (session 11), dans la palette du pack Ninja Adventure :
// plancher, tatami, terre battue, murs de plâtre à poutres, et ce que le pack n'a pas (foyer 囲炉裏, autel 仏壇,
// étagère des dieux 神棚, meule, ballots de riz, shoji, 絵馬, tableau d'avis, ombrelle rouge du salon de thé...).
// Les textures sont créées une fois (`paintTextures`), puis posées comme des tuiles (`paintKey`) ou comme des objets
// (`PAINTED_OBJ` dans objects.ts). Rien n'est téléchargé : tout tient dans ce fichier.
import type { BuiltMap } from './build';

export const PAL = {
  ink: '#141b1b', dk: '#3b3643', g1: '#4e484a', g2: '#695953', g3: '#816855', g4: '#90775e', g5: '#8e7c73', g6: '#b3957f',
  w0: '#965340', w1: '#9c6546', w2: '#a3754e', w3: '#bd7959', w4: '#c8966b', w5: '#d3865f',
  l0: '#d2b37d', l1: '#eecf9b', l2: '#fce2ca', l3: '#f1c471', l4: '#ffe18d', wh: '#ffffff', pa: '#f2eaf1',
  r0: '#d14b34', r1: '#e0394c', r2: '#8f3e56', or: '#e46d3a', or2: '#ef914f',
  gd: '#345a52', g7: '#56864c', ol: '#a8a129', ol2: '#adbc3a', gr: '#74a334',
  b0: '#2d697b', b1: '#4a5270', b2: '#548789', s0: '#5f7160', s1: '#8d977f', s2: '#abc2bc',
};
type C = keyof typeof PAL;

/** Petit pinceau à pixels sur un canvas. */
class Pen {
  g: CanvasRenderingContext2D;
  constructor(public c: HTMLCanvasElement, private seed = 7) {
    this.g = c.getContext('2d')!;
  }
  r(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }
  f(col: C, x: number, y: number, w = 1, h = 1): this {
    this.g.fillStyle = PAL[col];
    this.g.fillRect(x, y, w, h);
    return this;
  }
  /** Rectangle cerné d'encre. */
  box(col: C, x: number, y: number, w: number, h: number, edge: C = 'ink'): this {
    return this.f(edge, x, y, w, h).f(col, x + 1, y + 1, w - 2, h - 2);
  }
  /** Disque plein (approximatif, en pixels). */
  disc(col: C, cx: number, cy: number, rx: number, ry = rx): this {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
      this.f(col, Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
    return this;
  }
}

type Painter = (p: Pen) => void;
const SPECS: Record<string, { w: number; h: number; draw: Painter }> = {};
const def = (key: string, w: number, h: number, draw: Painter) => (SPECS[key] = { w, h, draw });

// ---------- sols ----------

for (let v = 0; v < 3; v++)
  def('p-F' + v, 16, 16, (p) => {
    // Plancher : trois lattes horizontales, joints décalés.
    p.f('w3', 0, 0, 16, 16);
    for (let k = 0; k < 3; k++) {
      const y = k * 5 + 1;
      p.f('w4', 0, y, 16, 1).f('w2', 0, y + 4, 16, 1);
      const j = (k * 7 + v * 5) % 16;
      p.f('w1', j, y, 1, 4);
      if (p.r() < 0.5) p.f('w5', (j + 6) % 16, y + 2, 2, 1);
    }
  });
for (let v = 0; v < 2; v++)
  def('p-K' + v, 16, 16, (p) => {
    // Plancher sombre et ciré du sanctuaire.
    p.f('w0', 0, 0, 16, 16);
    for (let k = 0; k < 4; k++) p.f('w1', 0, k * 4, 16, 1).f('w0', (k * 5 + v * 8) % 16, k * 4, 1, 4);
    p.f('w2', 2 + v * 6, 2, 3, 1);
  });
for (let v = 0; v < 3; v++)
  def('p-E' + v, 16, 16, (p) => {
    // Terre battue (土間), mouchetée.
    p.f('g3', 0, 0, 16, 16);
    for (let i = 0; i < 14; i++) p.f(p.r() < 0.5 ? 'g2' : 'g4', Math.floor(p.r() * 16), Math.floor(p.r() * 16));
    if (v === 1) p.f('g6', 5, 9, 2, 1);
    if (v === 2) p.f('g2', 10, 4, 3, 1);
  });
// Tatami : une natte fait deux cases de large ; bordure (縁) sombre sur les grands côtés.
for (const half of [0, 1])
  def('p-M' + half, 16, 16, (p) => {
    p.f('ol', 0, 0, 16, 16);
    for (let y = 2; y < 14; y += 2) p.f('ol2', 0, y, 16, 1);
    p.f('gd', 0, 0, 16, 2).f('gd', 0, 14, 16, 2).f('ink', 0, 15, 16, 1);
    if (half === 0) p.f('g7', 0, 0, 1, 16);
    else p.f('g7', 15, 2, 1, 12);
  });

// ---------- murs ----------
// « W » : le mur du fond, vu de face. En haut une poutre (長押), du plâtre, une plinthe en bas ; un poteau toutes les quatre cases.
for (const part of ['t', 'm', 'b'])
  for (const post of [0, 1])
    def(`p-W${part}${post}`, 16, 16, (p) => {
      p.f('l1', 0, 0, 16, 16);
      for (let i = 0; i < 6; i++) p.f('l0', Math.floor(p.r() * 16), Math.floor(p.r() * 16));
      if (part === 't') p.f('w0', 0, 0, 16, 4).f('w2', 0, 1, 16, 1).f('ink', 0, 4, 16, 1).f('w1', 0, 9, 16, 2);
      if (part === 'b') p.f('w1', 0, 12, 16, 4).f('w3', 0, 12, 16, 1).f('ink', 0, 15, 16, 1);
      if (post) p.f('w1', 0, 0, 3, 16).f('w3', 0, 0, 1, 16).f('ink', 3, 0, 1, part === 'b' ? 12 : 16);
    });
// « X » : le haut d'un mur vu d'au-dessus (côtés et bas). Une poutre claire du côté de la pièce.
for (let m = 0; m < 16; m++)
  def('p-X' + m, 16, 16, (p) => {
    p.f('ink', 0, 0, 16, 16);
    const [l, r, u, d] = [m & 1, m & 2, m & 4, m & 8];
    if (r) p.f('w0', 10, 0, 6, 16).f('w2', 11, 0, 2, 16).f('ink', 15, 0, 1, 16);
    if (l) p.f('w0', 0, 0, 6, 16).f('w2', 3, 0, 2, 16).f('ink', 0, 0, 1, 16);
    if (u) p.f('w0', 0, 0, 16, 7).f('w2', 0, 2, 16, 2).f('ink', 0, 0, 16, 1);
    if (d) p.f('w0', 0, 10, 16, 6).f('w2', 0, 12, 16, 2).f('ink', 0, 15, 16, 1);
  });
def('p-_', 16, 16, (p) => p.f('ink', 0, 0, 16, 16));

/** Texture d'une case peinte, selon ses voisines. */
export function paintKey(b: BuiltMap, x: number, y: number): string {
  const t = b.paint, c = t[y][x];
  const at = (dx: number, dy: number) => t[y + dy]?.[x + dx] ?? '_';
  const floor = (dx: number, dy: number) => ['F', 'M', 'E', 'K'].includes(at(dx, dy)) || b.def.terrain[y + dy]?.[x + dx] === 'd';
  const v = (x * 7 + y * 13) % 3;
  switch (c) {
    case 'F':
      return 'p-F' + v;
    case 'K':
      return 'p-K' + (v % 2);
    case 'E':
      return 'p-E' + v;
    case 'M': {
      // Les nattes se décalent d'une rangée à l'autre, comme un vrai plancher de tatami.
      let x0 = x;
      while (t[y][x0 - 1] === 'M') x0--;
      return 'p-M' + ((x - x0 + (y % 2)) % 2);
    }
    case 'W': {
      const part = at(0, -1) !== 'W' ? 't' : at(0, 1) !== 'W' ? 'b' : 'm';
      return `p-W${part}${x % 4 === 1 ? 1 : 0}`;
    }
    case 'X':
      return 'p-X' + ((floor(-1, 0) ? 2 : 0) | (floor(1, 0) ? 1 : 0) | (floor(0, -1) ? 8 : 0) | (floor(0, 1) ? 4 : 0));
    default:
      return 'p-_';
  }
}

// ---------- objets peints ----------
// Taille en pixels ; l'objet correspondant (masque, calque) est dans objects.ts.

def('p-shoji', 32, 16, (p) => {
  // Fenêtre de papier : cadre de bois, croisillons, papier qui laisse passer le jour.
  p.box('w1', 1, 1, 30, 13).f('pa', 2, 2, 28, 11);
  for (let x = 2; x < 30; x += 5) p.f('w3', x + 4, 2, 1, 11);
  for (let y = 2; y < 13; y += 4) p.f('w3', 2, y + 3, 28, 1);
  p.f('wh', 3, 3, 3, 2).f('wh', 13, 3, 3, 2);
});
def('p-irori', 32, 32, (p) => {
  // Foyer creusé dans le plancher, cendre, braises, la crémaillère et sa bouilloire.
  p.box('w0', 0, 4, 32, 26).f('w2', 1, 5, 30, 2).f('g1', 4, 9, 24, 17).f('g2', 5, 10, 22, 15);
  for (let i = 0; i < 30; i++) p.f(p.r() < 0.5 ? 'g4' : 'g5', 5 + Math.floor(p.r() * 22), 10 + Math.floor(p.r() * 15));
  p.f('ink', 11, 18, 10, 5).f('r0', 12, 19, 8, 3).f('or', 13, 19, 2, 2).f('l4', 17, 20, 1, 1).f('or2', 15, 21, 3, 1);
  p.f('ink', 15, 0, 2, 14).f('w2', 15, 0, 1, 12);
  p.disc('ink', 16, 15, 6, 4).disc('dk', 16, 15, 5, 3).f('g1', 13, 13, 3, 1).f('ink', 21, 13, 3, 2);
});
def('p-embers', 32, 32, (p) => {
  // Image des braises seule, posée par-dessus et qui palpite.
  p.f('or', 12, 19, 3, 2).f('l4', 15, 20, 2, 1).f('r1', 18, 19, 2, 2);
});
def('p-butsudan', 16, 32, (p) => {
  // Autel des ancêtres : laque noire, dorures, tablette (位牌), bougie et fleur.
  p.box('dk', 0, 2, 16, 29).f('ink', 1, 3, 14, 1).f('l3', 2, 4, 12, 1).f('ink', 3, 6, 10, 15).f('r2', 4, 7, 8, 13);
  p.f('l3', 6, 9, 4, 9).f('ink', 7, 10, 2, 7).f('l4', 7, 8, 2, 1);
  p.f('l3', 2, 22, 12, 1).f('ink', 2, 24, 12, 6).f('w1', 3, 25, 10, 4);
  p.f('pa', 3, 19, 1, 3).f('l4', 3, 18, 1, 1).f('r1', 11, 18, 2, 2).f('g7', 12, 20, 1, 2);
});
def('p-kamidana', 32, 16, (p) => {
  // Étagère des dieux : planchette, petit sanctuaire, sakaki et papiers en zigzag.
  p.f('ink', 0, 10, 32, 3).f('w4', 1, 10, 30, 1).f('w2', 1, 11, 30, 1);
  p.box('l1', 10, 2, 12, 8).f('w2', 9, 1, 14, 2).f('ink', 15, 5, 2, 4);
  p.f('g7', 3, 4, 3, 6).f('gr', 4, 3, 2, 2).f('g7', 26, 4, 3, 6).f('gr', 26, 3, 2, 2);
  p.f('ink', 0, 0, 32, 1).f('wh', 7, 1, 2, 3).f('wh', 23, 1, 2, 3);
});
def('p-millstone', 32, 32, (p) => {
  // Meule de pierre (石臼) sur son socle, le trou et le manche.
  p.disc('ink', 16, 18, 14, 11).disc('s0', 16, 18, 13, 10).disc('s1', 16, 16, 12, 8).disc('s2', 16, 15, 11, 7);
  for (let a = 0; a < 8; a++) p.f('s1', 16 + Math.round(Math.cos(a) * 8), 15 + Math.round(Math.sin(a) * 5), 2, 1);
  p.disc('ink', 16, 15, 3, 2).disc('g1', 16, 15, 2, 1).f('ink', 25, 8, 2, 8).f('w2', 25, 8, 1, 7);
});
def('p-tawara', 16, 16, (p) => {
  // Ballot de riz (俵) : paille tressée, liens.
  p.box('l0', 1, 3, 14, 12).f('l3', 2, 4, 12, 2).f('ol', 2, 12, 12, 2);
  for (const x of [4, 8, 11]) p.f('w1', x, 3, 1, 12);
  p.f('ink', 1, 7, 14, 1).f('w0', 1, 8, 14, 1);
});
def('p-sack', 16, 16, (p) => {
  // Sac de farine, noué.
  p.disc('ink', 8, 10, 6, 5).disc('pa', 8, 10, 5, 4).f('l1', 4, 12, 8, 2).f('ink', 7, 3, 2, 3).f('w2', 6, 4, 4, 1);
});
def('p-kamado', 32, 24, (p) => {
  // Fourneau de terre (かまど) à deux feux, une marmite noire, la gueule rougeoyante.
  p.box('g6', 0, 4, 32, 19).f('l0', 1, 5, 30, 2).f('g4', 1, 18, 30, 4);
  p.disc('ink', 9, 9, 6, 3).disc('dk', 9, 9, 5, 2).disc('ink', 23, 9, 6, 3).disc('g1', 23, 8, 5, 2).f('w0', 21, 4, 4, 2);
  p.f('ink', 5, 14, 8, 6).f('r0', 6, 15, 6, 5).f('or', 7, 17, 4, 3).f('ink', 19, 14, 8, 6).f('r2', 20, 15, 6, 5);
});
def('p-noren', 32, 16, (p) => {
  // Rideau d'entrée (暖簾) indigo, fendu en trois, avec un cercle blanc.
  p.f('w1', 0, 0, 32, 2);
  for (let k = 0; k < 3; k++) p.box('b1', 1 + k * 10, 2, 10, 13).f('b0', 2 + k * 10, 12, 8, 2);
  p.disc('pa', 16, 7, 3, 3).disc('b1', 16, 7, 1, 1);
});
def('p-menu', 32, 16, (p) => {
  // Les plaquettes du menu (品書き), écrites au pinceau, accrochées au mur.
  for (let k = 0; k < 4; k++) {
    const x = 2 + k * 7;
    p.box('l2', x, 1, 6, 14).f('ink', x + 2, 3, 2, 1).f('ink', x + 2, 5, 1, 3).f('ink', x + 3, 9, 1, 3).f('r0', x + 2, 13, 2, 1);
  }
});
def('p-saisen', 32, 16, (p) => {
  // Tronc à offrandes (賽銭箱) : boîte de bois, barreaux, le nom gravé.
  p.box('w2', 1, 3, 30, 12).f('w4', 2, 4, 28, 2).f('ink', 2, 6, 28, 1);
  for (let x = 4; x < 29; x += 3) p.f('w0', x, 6, 1, 6);
  p.f('ink', 2, 12, 28, 1).f('l3', 13, 8, 6, 2);
});
def('p-mirror', 16, 32, (p) => {
  // Le miroir sacré sur son support, un bout de corde.
  p.f('w0', 4, 18, 8, 13).f('w2', 5, 19, 6, 2).f('ink', 3, 30, 10, 2);
  p.disc('ink', 8, 11, 6, 6).disc('l3', 8, 11, 5, 5).disc('l4', 7, 10, 3, 3).f('wh', 6, 8, 1, 2);
});
def('p-shimenawa', 64, 16, (p) => {
  // Corde sacrée (注連縄) tendue sous la poutre, avec ses papiers en zigzag.
  for (let x = 0; x < 64; x++) {
    const y = 2 + Math.round(Math.sin((x / 64) * Math.PI) * 3);
    p.f('ink', x, y, 1, 4).f('l0', x, y + 1, 1, 2);
    if (x % 6 === 0) p.f('l3', x, y + 1, 1, 1);
  }
  for (const x of [12, 30, 48]) p.f('wh', x, 7, 3, 2).f('wh', x + 1, 9, 3, 2).f('wh', x, 11, 3, 2).f('pa', x + 1, 13, 2, 1);
});
def('p-ema', 32, 32, (p) => {
  // Le portant des 絵馬 : petit toit, plaquettes de bois en pentagone, cordons rouges.
  p.f('ink', 3, 6, 2, 26).f('ink', 27, 6, 2, 26).f('w1', 3, 6, 1, 25).f('w1', 27, 6, 1, 25);
  p.f('ink', 0, 2, 32, 5).f('w0', 1, 3, 30, 3).f('w2', 1, 3, 30, 1);
  p.f('ink', 4, 13, 24, 1).f('ink', 4, 22, 24, 1);
  const tab = (x: number, y: number) => {
    p.f('ink', x, y + 1, 7, 7).f('l1', x + 1, y + 2, 5, 5).f('ink', x + 3, y, 1, 1).f('l1', x + 2, y + 1, 3, 1).f('r0', x + 3, y - 1, 1, 2);
    p.f('w2', x + 2, y + 4, 3, 1);
  };
  for (const x of [5, 12, 19]) tab(x, 14);
  for (const x of [8, 16]) tab(x, 23);
});
def('p-omikuji', 16, 16, (p) => {
  // La boîte des oracles (おみくじ), hexagonale, un bâton qui dépasse.
  p.box('r0', 3, 5, 10, 10).f('r1', 4, 6, 8, 2).f('ink', 7, 1, 2, 5).f('l1', 7, 1, 1, 4).f('l3', 5, 10, 6, 2);
});
def('p-board', 32, 32, (p) => {
  // Le tableau d'avis du village (掲示板) : un petit toit, des papiers punaisés.
  p.f('ink', 4, 10, 2, 22).f('ink', 26, 10, 2, 22).f('w1', 4, 10, 1, 21).f('w1', 26, 10, 1, 21);
  p.f('ink', 0, 4, 32, 4).f('w0', 1, 5, 30, 2).f('ink', 2, 2, 28, 3).f('w2', 3, 3, 26, 1);
  p.box('w3', 3, 9, 26, 14).f('pa', 5, 11, 9, 10).f('l1', 16, 11, 11, 6).f('pa', 17, 18, 8, 4);
  for (let y = 13; y < 20; y += 2) p.f('g2', 7, y, 5, 1);
  for (let y = 12; y < 16; y += 2) p.f('g2', 18, y, 7, 1);
  p.f('r0', 9, 11, 1, 1).f('r0', 21, 11, 1, 1);
});
def('p-tools', 32, 16, (p) => {
  // Les outils du charpentier au mur : scie, rabot, maillet, équerre.
  p.f('w1', 0, 2, 32, 2).f('ink', 0, 4, 32, 1);
  p.f('ink', 3, 5, 9, 6).f('s2', 4, 6, 7, 4).f('w0', 11, 6, 3, 2);
  for (let x = 4; x < 11; x += 2) p.f('s0', x, 9, 1, 1);
  p.f('ink', 16, 5, 2, 9).f('w2', 16, 5, 1, 8).f('ink', 14, 12, 6, 3).f('w0', 15, 12, 4, 2);
  p.f('ink', 23, 5, 1, 9).f('ink', 23, 13, 7, 1).f('s1', 24, 12, 5, 1);
});
def('p-plans', 16, 16, (p) => {
  // Un plan du pont, épinglé : papier jauni, l'arc du pont, des cotes.
  p.box('l2', 1, 1, 14, 13).f('r0', 7, 1, 2, 1);
  for (let x = 3; x < 13; x++) p.f('b1', x, 9 - Math.round(Math.sin(((x - 3) / 9) * Math.PI) * 3), 1, 1);
  p.f('b1', 3, 9, 1, 3).f('b1', 12, 9, 1, 3).f('g4', 3, 11, 10, 1);
});
def('p-drawing', 16, 16, (p) => {
  // Le dessin d'un enfant : un moulin et sa roue, au charbon.
  p.box('pa', 1, 2, 14, 12).f('ink', 3, 6, 5, 5).f('ink', 3, 5, 5, 1).f('g1', 4, 7, 3, 3);
  p.disc('ink', 11, 9, 3, 3).disc('pa', 11, 9, 2, 2).f('ink', 11, 6, 1, 7).f('ink', 8, 9, 7, 1).f('b2', 2, 12, 12, 1);
});
def('p-bench', 32, 16, (p) => {
  // Banc de salon de thé (縁台) couvert d'un tissu rouge.
  p.f('ink', 2, 10, 2, 6).f('ink', 28, 10, 2, 6).f('w1', 2, 10, 1, 5).f('w1', 28, 10, 1, 5);
  p.box('r0', 0, 3, 32, 9).f('r1', 1, 4, 30, 2).f('r2', 1, 10, 30, 1);
});
def('p-parasol', 48, 48, (p) => {
  // Grande ombrelle rouge (野点傘) au-dessus du banc, sa hampe.
  p.f('ink', 23, 18, 2, 30).f('w1', 23, 18, 1, 29);
  p.disc('ink', 24, 16, 23, 14).disc('r0', 24, 16, 22, 13).disc('r1', 24, 13, 20, 9);
  for (let a = -1; a <= 1; a += 0.25) p.f('r2', 24 + Math.round(a * 20), 16 + Math.round((1 - Math.abs(a)) * 0) + 8, 1, 4);
  p.disc('ink', 24, 7, 2, 2).f('l3', 24, 6, 1, 1);
});
def('p-lantern', 16, 16, (p) => {
  // Lanterne de papier rouge (提灯), avec ses cerclages.
  p.f('ink', 7, 0, 2, 2).f('ink', 5, 2, 6, 1).disc('ink', 8, 8, 5, 5).disc('r0', 8, 8, 4, 4).f('r1', 5, 6, 6, 1).f('r1', 5, 10, 6, 1);
  p.f('l4', 7, 7, 2, 3).f('ink', 5, 13, 6, 1).f('ink', 7, 14, 2, 2);
});
def('p-glow', 32, 32, (p) => {
  // Halo chaud (lanterne, foyer) : posé en mode additif, il respire.
  const g = p.g.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,203,141,0.55)');
  g.addColorStop(1, 'rgba(255,203,141,0)');
  p.g.fillStyle = g;
  p.g.fillRect(0, 0, 32, 32);
});
def('p-zabuton', 16, 16, (p) => p.box('b1', 2, 4, 12, 10).f('b0', 3, 5, 10, 2).f('pa', 7, 8, 2, 2));
def('p-teaset', 16, 16, (p) => {
  // Plateau avec théière et deux tasses, posé sur une table.
  p.f('ink', 1, 8, 14, 6).f('w0', 2, 9, 12, 4).disc('ink', 6, 7, 3, 3).disc('g1', 6, 7, 2, 2).f('ink', 9, 5, 2, 1);
  p.f('ink', 10, 8, 3, 3).f('pa', 11, 9, 1, 1).f('ink', 3, 11, 2, 2).f('pa', 3, 11, 1, 1);
});
def('p-dango', 16, 16, (p) => {
  // Une assiette de brochettes de dango (rose, blanc, vert).
  p.disc('ink', 8, 11, 7, 3).disc('pa', 8, 11, 6, 2);
  for (const [x, c] of [[4, 'r1'], [7, 'pa'], [10, 'gr']] as [number, C][]) p.disc('ink', x, 7, 2, 2).disc(c, x, 7, 1, 1);
  p.f('l0', 2, 9, 12, 1);
});
def('p-futon', 32, 32, (p) => {
  // Futon déplié sur le tatami, oreiller de son.
  p.box('pa', 2, 3, 28, 27).f('b2', 3, 12, 26, 17).f('b0', 3, 27, 26, 2);
  for (let x = 5; x < 28; x += 6) p.f('s2', x, 15, 2, 2).f('s2', x + 3, 21, 2, 2);
  p.box('l1', 9, 4, 14, 6).f('l0', 10, 8, 12, 1);
});
def('p-shelf', 32, 16, (p) => {
  // Étagère murale avec bols et pots.
  p.f('ink', 0, 10, 32, 3).f('w3', 0, 10, 32, 1).f('w1', 0, 11, 32, 1);
  p.disc('ink', 6, 7, 4, 3).disc('b1', 6, 7, 3, 2).f('ink', 13, 3, 6, 7).f('g6', 14, 4, 4, 5).disc('ink', 25, 7, 4, 3).disc('l1', 25, 7, 3, 2);
});
def('p-chute', 16, 32, (p) => {
  // La trémie de bois au-dessus de la meule, d'où tombe le grain.
  p.f('ink', 1, 0, 14, 12).f('w2', 2, 1, 12, 10).f('w4', 2, 1, 12, 1).f('ink', 5, 12, 6, 8).f('w1', 6, 12, 4, 7);
  for (let y = 21; y < 31; y += 3) p.f('l1', 7 + (y % 2), y, 1, 1);
});
def('p-stone-lamp', 16, 32, (p) => {
  // Lanterne de pierre (石灯籠) : socle, foyer ajouré, chapeau.
  p.f('ink', 4, 26, 8, 6).f('s1', 5, 27, 6, 4).f('ink', 6, 17, 4, 10).f('s1', 7, 18, 2, 8);
  p.f('ink', 3, 10, 10, 8).f('s1', 4, 11, 8, 6).f('l4', 6, 12, 4, 3).f('ink', 1, 5, 14, 5).f('s2', 2, 6, 12, 2).f('ink', 7, 2, 2, 3);
});
def('p-komainu', 16, 16, (p) => {
  // Chien-lion de pierre (狛犬) assis sur son socle.
  p.f('ink', 2, 11, 12, 5).f('s0', 3, 12, 10, 3).disc('ink', 8, 7, 5, 5).disc('s1', 8, 7, 4, 4).f('s2', 6, 4, 3, 2);
  p.f('ink', 6, 6, 1, 1).f('ink', 10, 6, 1, 1).f('ink', 7, 9, 3, 1);
});
def('p-stall', 48, 32, (p) => {
  // L'étal d'おたね : une table basse, des baquets de légumes et de pickles, un toit de toile.
  p.f('ink', 2, 0, 44, 6).f('b2', 3, 1, 42, 3);
  for (let x = 3; x < 45; x += 6) p.f('pa', x, 1, 3, 3);
  p.f('ink', 3, 6, 2, 26).f('ink', 43, 6, 2, 26);
  p.box('w3', 1, 18, 46, 8).f('w4', 2, 19, 44, 2).f('ink', 4, 26, 2, 6).f('ink', 42, 26, 2, 6);
  const tub = (x: number, c: C, d: C) => p.disc('ink', x, 16, 6, 4).disc('w1', x, 16, 5, 3).disc(c, x, 15, 4, 2).f(d, x - 2, 14, 2, 1).f(d, x + 1, 16, 2, 1);
  tub(10, 'l4', 'ol'); // 沢庵
  tub(24, 'r2', 'r0'); // 梅干し
  tub(38, 'gr', 'g7'); // 菜っ葉
  p.f('pa', 18, 22, 12, 4).f('ink', 20, 23, 1, 2).f('ink', 23, 23, 1, 2).f('ink', 26, 23, 2, 1);
});
def('p-daikon', 16, 16, (p) => {
  // Des radis blancs à sécher, accrochés.
  p.f('ink', 0, 1, 16, 1);
  for (const x of [2, 7, 12]) p.f('g7', x, 2, 2, 3).f('ink', x - 1, 5, 4, 9).f('pa', x, 5, 2, 8).f('pa', x, 13, 1, 1);
});
def('p-firewood', 16, 16, (p) => {
  // Bûches empilées.
  for (const [x, y] of [[1, 9], [6, 9], [11, 9], [3, 5], [8, 5], [6, 1]]) p.disc('ink', x + 2, y + 2, 2, 2).disc('w3', x + 2, y + 2, 1, 1).f('l1', x + 2, y + 2, 1, 1);
});
def('p-workbench', 48, 16, (p) => {
  // L'établi : une grosse planche sur tréteaux, une planche en cours, des copeaux.
  p.f('ink', 3, 8, 3, 8).f('ink', 42, 8, 3, 8).box('w2', 0, 3, 48, 7).f('w4', 1, 4, 46, 1);
  p.f('ink', 10, 1, 22, 3).f('l1', 11, 2, 20, 1).f('ink', 34, 1, 6, 3).f('s2', 35, 2, 4, 1);
  for (const x of [14, 22, 30]) p.f('l2', x, 11, 2, 1).f('l2', x + 3, 13, 1, 1);
});
def('p-planks', 16, 16, (p) => {
  // Planches debout contre le mur.
  for (const x of [2, 6, 10]) p.f('ink', x, 1, 4, 15).f('w4', x + 1, 2, 2, 13).f('w2', x + 1, 2, 1, 13);
});
def('p-letter', 16, 16, (p) => {
  // Une lettre pliée, posée.
  p.box('pa', 2, 5, 12, 8).f('l1', 3, 6, 10, 1).f('g2', 4, 8, 7, 1).f('g2', 4, 10, 5, 1).f('r0', 11, 10, 2, 2);
});
def('p-mat', 16, 16, (p) => {
  // Le seuil de la porte : la lumière du dehors.
  const g = p.g.createLinearGradient(0, 16, 0, 0);
  g.addColorStop(0, 'rgba(252,226,202,0.5)');
  g.addColorStop(1, 'rgba(252,226,202,0)');
  p.g.fillStyle = g;
  p.g.fillRect(1, 0, 14, 16);
});
def('p-smoke', 8, 8, (p) => p.disc('s2', 4, 4, 3, 3).disc('pa', 3, 3, 1, 1));
def('p-ripple', 16, 8, (p) => p.f('wh', 3, 3, 4, 1).f('wh', 9, 5, 3, 1).f('s2', 7, 3, 2, 1));
def('p-bubble', 8, 8, (p) => p.f('pa', 0, 0, 8, 8));

/** Crée toutes les textures peintes (une fois par partie). `add` : la fonction de la scène qui range un canvas. */
export function paintTextures(has: (k: string) => boolean, add: (k: string, c: HTMLCanvasElement) => void): void {
  let seed = 3;
  for (const [key, s] of Object.entries(SPECS)) {
    if (has(key)) continue;
    const c = document.createElement('canvas');
    c.width = s.w;
    c.height = s.h;
    s.draw(new Pen(c, (seed = (seed * 48271) % 2147483647)));
    add(key, c);
  }
}

export const paintSize = (key: string) => SPECS[key];
