// 霧野峠 (le col de Kirino), vu de dessus : le prologue. On monte dans la brume par un sentier en lacets jusqu'à
// la borne dont l'inscription s'arrête au milieu ; y dire la phrase entière libère ワケ. Le sentier redescend
// ensuite vers le village (sortie sud, qui mène à l'entrée nord de 霧野村). Avant, la brume barre la descente.
import type { MapDef, Placed } from '../mapdef';
import { OBJ } from '../objects';

const W = 30;
const H = 26;

function terrain(): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('T'));
  const fill = (c: string, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) g[y][x] = c;
  };
  // Un chemin de terre bordé d'herbe. Session 11 : toute l'herbe d'abord, puis toute la terre, sinon le bord d'herbe
  // d'un tronçon effaçait la terre du précédent et le sentier paraissait coupé en morceaux.
  const segs: [number, number, number, number][] = [];
  const path = (x0: number, y0: number, x1: number, y1: number) => segs.push([x0, y0, x1, y1]);
  // Le replat du sommet, où se dresse la borne.
  fill('.', 11, 1, 18, 6);
  // La montée, depuis le bas à gauche.
  path(4, 18, 5, 25);
  path(4, 17, 10, 18);
  path(9, 9, 10, 17);
  path(9, 8, 14, 9);
  path(13, 3, 14, 8);
  path(13, 3, 17, 4);
  // La descente, à droite : elle ne rejoint le sommet que par la brume (barrière ci-dessous).
  fill('.', 19, 2, 21, 5);
  path(19, 3, 21, 4);
  path(22, 3, 23, 14);
  path(22, 13, 26, 14);
  path(25, 13, 26, 25);
  for (const [x0, y0, x1, y1] of segs) fill('.', x0 - 1, y0 - 1, x1 + 1, y1 + 1);
  // Le sommet reste un replat d'herbe (la brume barre la colonne 19 jusqu'à ce que ワケ soit libéré).
  fill('.', 11, 1, 18, 6);
  for (const [x0, y0, x1, y1] of segs) fill('d', x0, y0, x1, y1);
  // Le bord du monde reste de la forêt, sauf l'arrivée et la sortie.
  return g;
}

const objects: Placed[] = [
  { o: OBJ.stonePost, x: 16, y: 2, id: 'post' },
  { o: OBJ.jizo, x: 12, y: 1 },
  { o: OBJ.rock, x: 17, y: 6 },
  { o: OBJ.rock, x: 12, y: 6 },
  { o: OBJ.sign, x: 27, y: 16, id: 'sign-pass' },
  { o: OBJ.rock, x: 7, y: 20 },
  { o: OBJ.bush, x: 3, y: 22 },
  { o: OBJ.rock, x: 11, y: 12 },
  { o: OBJ.bush, x: 24, y: 8 },
  { o: OBJ.rock, x: 27, y: 21 },
  { o: OBJ.pine, x: 16, y: 5 },
];

export const PASS: MapDef = {
  id: 'pass',
  name: '霧野峠',
  reading: 'きりのとうげ',
  fr: 'Le col de Kirino',
  width: W,
  height: H,
  terrain: terrain(),
  objects,
  seed: 19,
  music: 'audio/road',
  fog: 0.8,
  spawns: {
    start: { x: 4.5, y: 25.6, face: 'up' },
  },
  exits: [{ side: 'south', from: 24, to: 27, gate: 'north', place: 'kirino' }],
  npcs: [],
  readables: { post: 'post:done', 'sign-pass': 'sign-pass' },
  barriers: [{ cells: [[19, 2], [19, 3], [19, 4], [19, 5]], flag: 'wake', say: 'pro:fog' }],
};
