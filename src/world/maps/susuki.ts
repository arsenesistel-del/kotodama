// 薄野原 (Susukinohara), la lande aux herbes hautes, à l'est du village. Session 10.
// Hors du village, les bouts de phrases lâchés sans être finis s'agglutinent en petites bêtes, les 言蟲.
// On les rencontre au hasard en marchant dans les herbes hautes (« g »). Trois zones, de plus en plus loin du village :
// l'entrée (niveaux 1 à 3), le milieu de la lande (3 à 6), l'étang (6 à 8) et le fond de la lande (8 à 10).
// À l'entrée, un 地蔵 porte un 鈴 : la clochette qui éloigne les bêtes quand on veut juste traverser.
import type { MapDef, Placed } from '../mapdef';
import { OBJ } from '../objects';

const W = 42;
const H = 28;

function terrain(): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  const fill = (c: string, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) g[y][x] = c;
  };
  // Une nappe d'herbes hautes aux bords irréguliers : on retire des cases au hasard sur le pourtour.
  let seed = 3;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const patch = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const edge = x === x0 || x === x1 || y === y0 || y === y1;
        if (!edge || r() > 0.4) g[y][x] = 'g';
      }
  };

  // Forêt tout autour ; on entre par l'ouest (depuis le village).
  fill('T', 0, 0, W - 1, 2);
  fill('T', 0, H - 3, W - 1, H - 1);
  fill('T', 0, 0, 1, H - 1);
  fill('T', W - 3, 0, W - 1, H - 1);
  fill('.', 0, 12, 1, 15); // l'entrée, depuis la route de l'est du village
  fill('T', 2, 3, 4, 7);
  fill('T', 2, 20, 6, 24);
  fill('T', 16, 3, 19, 4);
  fill('T', 27, 3, 29, 5);
  fill('T', 20, 22, 25, 24);

  // Les herbes hautes.
  patch(6, 4, 14, 10); // l'entrée, au nord du chemin
  patch(7, 17, 15, 22); // l'entrée, au sud
  patch(17, 6, 25, 11); // le milieu de la lande
  patch(17, 16, 26, 21);
  patch(29, 7, 37, 11); // le fond, autour de l'étang
  patch(28, 16, 37, 24);

  // Le chemin, d'ouest en est, qui se perd vers l'étang.
  fill('d', 0, 13, 27, 14);
  fill('d', 26, 12, 33, 13);
  fill('d', 15, 8, 16, 13); // vers le nord du milieu
  // L'étang.
  fill('w', 31, 13, 35, 15);
  return g;
}

const objects: Placed[] = [
  // À l'entrée : le 地蔵 au 鈴, et le panneau.
  { o: OBJ.jizo, x: 4, y: 10, id: 'bell-jizo' },
  { o: OBJ.sign, x: 3, y: 15, id: 'sign-susuki' },
  // Une vieille rizière en friche au sud, avec son épouvantail penché.
  { o: OBJ.terrace(5, 3), x: 10, y: 23 },
  { o: OBJ.scarecrow, x: 12, y: 24 },
  // Au fond, une petite borne au bord de l'étang.
  { o: OBJ.grave, x: 36, y: 13 },
];

const trees: [keyof typeof OBJ, number, number][] = [
  ['pine', 5, 1], ['roundTree', 12, 1], ['pine', 23, 1], ['pine', 33, 1],
  ['roundTree', 16, 14], ['pine', 27, 14], ['sakura', 38, 18], ['roundTree', 3, 17],
];
for (const [k, x, y] of trees) objects.push({ o: OBJ[k] as Placed['o'], x, y });

const small: [keyof typeof OBJ, number, number][] = [
  ['rock', 5, 12], ['bush', 9, 15], ['rock', 21, 15], ['bush', 24, 13], ['rock', 30, 12], ['bush', 37, 13], ['rock', 38, 9], ['bush', 27, 7],
];
for (const [k, x, y] of small) objects.push({ o: OBJ[k] as Placed['o'], x, y });

export const SUSUKI: MapDef = {
  id: 'susuki',
  name: '薄野原',
  reading: 'すすきのはら',
  fr: 'La lande aux herbes hautes',
  width: W,
  height: H,
  terrain: terrain(),
  objects,
  seed: 23,
  music: 'audio/village',
  fog: 0.32,
  spawns: {
    west: { x: 1.5, y: 14.6, face: 'right' },
  },
  exits: [{ side: 'west', from: 12, to: 15, gate: 'east', place: 'kirino' }],
  // Session 12 : le fond se coupe en deux (l'étang 6 à 8, au nord ; le fond de la lande 8 à 10, au sud), et la brume
  // le ferme tant que le contrat du col n'est pas rapporté (on y arrive vers le niveau 5 ou 6).
  zones: [
    { rect: [5, 3, 15, 23], lv: [1, 3], name: '野原の入口' },
    { rect: [16, 5, 27, 22], lv: [3, 6], name: '野原の中' },
    { rect: [28, 6, 38, 14], lv: [6, 8], name: '池のほとり' },
    { rect: [28, 15, 38, 25], lv: [8, 10], name: '野原の奥' },
  ],
  barriers: [{ cells: Array.from({ length: 19 }, (_, i): [number, number] => [27, 6 + i]), flag: 'c2', say: 'susuki:fog' }],
  npcs: [],
  readables: { 'bell-jizo': 'susuki:bell', 'sign-susuki': 'sign-susuki' },
};
