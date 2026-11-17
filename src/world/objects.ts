// Catalogue des objets du décor, découpés dans les feuilles du pack Ninja Adventure.
import type { ObjDef } from './mapdef';
import { gid, type SheetName } from './tileset';

function rect(sheet: SheetName, sx: number, sy: number, w: number, h: number, mask?: string[], above?: number): ObjDef {
  return {
    w,
    h,
    tile: (x, y) => gid(sheet, sx + x, sy + y),
    mask: mask ?? Array.from({ length: h }, (_, y) => (y === h - 1 ? '#' : '.').repeat(w)),
    above: above ?? h - 1,
  };
}

const solid = (w: number, h: number) => Array.from({ length: h }, () => '#'.repeat(w));

// Un pont de `w` tuiles de large : garde-corps à gauche et à droite, planches au milieu.
function bridge(row: number, w: number): ObjDef {
  return {
    w,
    h: 3,
    tile: (x, y) => gid('house', x === 0 ? 10 : x === w - 1 ? 12 : 11, row + y),
    mask: Array.from({ length: 3 }, () => '#' + 'o'.repeat(w - 2) + '#'),
    above: 0,
  };
}

// Rizière en terrasse : un plateau d'herbe surélevé, découpé en neuf morceaux.
function terrace(w: number, h: number): ObjDef {
  return {
    w,
    h,
    tile: (x, y) => gid('field', x === 0 ? 0 : x === w - 1 ? 2 : 1, 3 + (y === 0 ? 0 : y === h - 1 ? 2 : 1)),
    mask: solid(w, h),
    above: 0,
  };
}

const tree = (sx: number, sy: number) => rect('nature', sx, sy, 2, 2);

export const OBJ = {
  // Maisons (toutes bloquantes ; le toit passe devant les personnages)
  houseOrange: rect('house', 0, 0, 4, 3, solid(4, 3), 2),
  houseBeige: rect('house', 4, 0, 4, 3, solid(4, 3), 2),
  houseOrange2: rect('house', 8, 0, 4, 3, solid(4, 3), 2),
  mill: rect('house', 12, 0, 4, 3, solid(4, 3), 2),
  teahouse: rect('house', 16, 0, 3, 3, solid(3, 3), 2),
  houseDark: rect('house', 19, 0, 4, 3, solid(4, 3), 2),
  torii: rect('house', 0, 5, 3, 2, ['...', '#.#'], 1),

  // Ponts
  bridge: bridge(15, 4),
  ropeBridge: bridge(19, 4),

  // Nature
  pine: tree(2, 0),
  roundTree: tree(0, 0),
  oak: tree(6, 0),
  lightTree: tree(16, 0),
  sakura: tree(14, 0),
  bigSakura: rect('nature', 0, 18, 3, 3, ['...', '...', '.#.'], 2),
  bush: rect('nature', 0, 10, 1, 1, ['#'], 0),
  rock: rect('nature', 8, 12, 1, 1, ['#'], 0),

  // Petits objets
  well: rect('element', 6, 1, 1, 1, ['#'], 0),
  pot: rect('element', 4, 0, 1, 1, ['#'], 0),
  barrels: rect('element', 2, 0, 1, 1, ['#'], 0),
  crate: rect('element', 0, 2, 1, 1, ['#'], 0),
  logs: rect('element', 8, 2, 1, 1, ['#'], 0),
  bench: rect('element', 11, 1, 3, 1, ['###'], 0),
  jizo: rect('element', 0, 5, 1, 2, ['.', '#'], 1),
  sign: rect('element', 6, 3, 1, 2, ['.', '#'], 1),
  grave: rect('element', 5, 2, 1, 1, ['#'], 0),
  tomb: rect('element', 4, 2, 1, 1, ['#'], 0),
  stonePost: rect('element', 5, 2, 1, 1, ['#'], 0), // la borne du col, dont l'inscription s'arrête
  scarecrow: rect('element', 15, 0, 1, 1, ['#'], 0),

  // La roue du moulin : une image animée du pack, laissée immobile (le moulin est à l'arrêt).
  wheel: {
    w: 2,
    h: 2,
    tile: () => 0,
    mask: ['##', '##'],
    above: 0,
    sprite: { key: 'tiles/watermill', frameW: 34, frameH: 36, frame: 0, dx: -1, dy: -4 },
  } as ObjDef,

  terrace,
};

// Arbres de la forêt, avec leur poids dans le tirage.
export const FOREST_TREES: [ObjDef, number][] = [
  [OBJ.pine, 6],
  [OBJ.roundTree, 2],
  [OBJ.oak, 1],
  [OBJ.lightTree, 1],
];
