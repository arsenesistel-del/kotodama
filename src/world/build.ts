import type { MapDef, ObjDef, Placed } from './mapdef';
import { FOREST_TREES } from './objects';
import { autotile, gid } from './tileset';

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(r: () => number, list: [T, number][]): T {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let v = r() * total;
  for (const [x, w] of list) if ((v -= w) < 0) return x;
  return list[list.length - 1][0];
}

export interface BuiltMap {
  def: MapDef;
  grids: { ground: number[][]; detail: number[][]; below: number[][]; above: number[][] };
  solid: Uint8Array;
  sprites: { o: ObjDef; x: number; y: number }[];
  readables: { id: string; cells: [number, number][] }[];
}

const GRASS = gid('floor', 0, 12);
const GRASS_VARIANTS = [gid('floor', 1, 12), gid('floor', 2, 12), gid('floor', 3, 12), gid('floor', 4, 12), gid('floor', 2, 11), gid('floor', 3, 11)];
const DIRT_VARIANTS = [gid('floor', 0, 11), gid('floor', 1, 11)];
const TUFTS = [gid('detail', 0, 2), gid('detail', 1, 2), gid('detail', 2, 2), gid('detail', 3, 2), gid('detail', 6, 2)];
const FOREST_FILL = [gid('nature', 0, 10), gid('nature', 1, 10), gid('nature', 2, 10)];
const FLOWERS = [gid('detail', 5, 2)];

/** Calcule toutes les tuiles et la grille de collision, sans rien dessiner. Testable hors navigateur. */
export function buildMap(def: MapDef): BuiltMap {
  const { width: W, height: H, terrain: t } = def;
  const r = rng(def.seed);
  const grid = () => Array.from({ length: H }, () => Array<number>(W).fill(0));
  const ground = grid(), detail = grid(), below = grid(), above = grid();
  const solid = new Uint8Array(W * H);
  const occupied = new Uint8Array(W * H);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? null : t[y][x]);

  for (let y = 0; y < H; y++) {
    if (t[y].length !== W) throw new Error(`${def.id} : la ligne ${y} fait ${t[y].length} cases au lieu de ${W}`);
    for (let x = 0; x < W; x++) {
      const c = t[y][x];
      const same = (dx: number, dy: number) => {
        const v = at(x + dx, y + dy);
        return v === null || v === c;
      };
      if (c === 'd') {
        const g = autotile('floor', 0, 7, same);
        ground[y][x] = g === gid('floor', 1, 8) && r() < 0.05 ? DIRT_VARIANTS[Math.floor(r() * DIRT_VARIANTS.length)] : g;
      } else if (c === 'w') {
        ground[y][x] = autotile('water', 0, 6, same);
        solid[y * W + x] = 1;
      } else if (c === 'T') {
        ground[y][x] = GRASS;
        solid[y * W + x] = 1;
      } else {
        ground[y][x] = r() < 0.18 ? GRASS_VARIANTS[Math.floor(r() * GRASS_VARIANTS.length)] : GRASS;
      }
    }
  }

  const sprites: BuiltMap['sprites'] = [];
  const readables: BuiltMap['readables'] = [];

  const place = (p: Placed) => {
    const { o, x: px, y: py } = p;
    const cells: [number, number][] = [];
    for (let y = 0; y < o.h; y++) {
      for (let x = 0; x < o.w; x++) {
        const X = px + x, Y = py + y;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const g = o.tile(x, y);
        if (g) (y < o.above ? above : below)[Y][X] = g;
        const m = o.mask[y]?.[x] ?? '.';
        if (m === '#') {
          solid[Y * W + X] = 1;
          cells.push([X, Y]);
        } else if (m === 'o') solid[Y * W + X] = 0;
        occupied[Y * W + X] = 1;
      }
    }
    if (o.sprite) sprites.push({ o, x: px, y: py });
    if (p.id) readables.push({ id: p.id, cells });
  };

  // La forêt : des arbres en quinconce sur les cases « T », dont le pied tombe dans la forêt.
  for (let y = -1; y < H; y += 2) {
    for (let x = (y + 1) % 4 === 0 ? -1 : 0; x < W; x += 2) {
      if (at(x, y + 1) !== 'T' && at(x + 1, y + 1) !== 'T') continue;
      if (at(x, y + 1) === 'w' || at(x + 1, y + 1) === 'w') continue;
      place({ o: pickWeighted(r, FOREST_TREES), x, y });
    }
  }
  // Les trous de la forêt reçoivent un buisson, pour qu'aucune case bloquante n'ait l'air vide.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (t[y][x] === 'T' && !below[y][x] && !above[y][x] && !(y + 1 < H && above[y + 1][x])) below[y][x] = FOREST_FILL[Math.floor(r() * FOREST_FILL.length)];
  for (const p of def.objects) place(p);

  // Herbes folles et fleurs, là où rien n'est posé.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (t[y][x] !== '.' || occupied[y * W + x]) continue;
      const v = r();
      if (v < 0.07) detail[y][x] = TUFTS[Math.floor(r() * TUFTS.length)];
      else if (v < 0.085) detail[y][x] = FLOWERS[0];
    }
  }

  return { def, grids: { ground, detail, below, above }, solid, sprites, readables };
}

