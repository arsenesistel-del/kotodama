// 霧野村 (Kirino), le village de la brume. Chapitre 1.
// Coordonnées en tuiles de 16 px. La carte est décrite par couches : le terrain (herbe, chemin, eau, forêt),
// puis les objets posés dessus (maisons, arbres, ponts...), puis les personnages.

import type { MapDef, Placed } from '../mapdef';
import { OBJ } from '../objects';

const W = 48;
const H = 40;

function terrain(): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  const fill = (c: string, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) g[y][x] = c;
  };

  // Forêt de montagne tout autour, avec un col au nord et la grand-route au sud.
  fill('T', 0, 0, W - 1, 2);
  fill('.', 21, 0, 26, 2);
  fill('T', 0, 3, 13, 5);
  fill('T', 33, 3, W - 1, 4);
  fill('T', 0, 0, 3, H - 1);
  fill('T', W - 4, 0, W - 1, H - 1);
  fill('T', 0, 37, W - 1, H - 1);
  fill('T', 0, 35, 8, 36);
  fill('T', 4, 6, 6, 8);
  fill('T', 36, 5, 43, 9);
  fill('T', 41, 10, 43, 13);
  fill('T', 26, 33, 30, 36);
  fill('.', 21, 37, 26, H - 1);

  // La rivière, d'ouest en est.
  fill('w', 0, 25, W - 1, 27);

  // Chemins de terre.
  fill('d', 23, 0, 24, 11); // descente du col
  fill('d', 25, 9, 28, 10); // devant le salon de thé
  fill('d', 19, 12, 28, 17); // la place
  fill('d', 6, 13, 18, 14); // route de l'ouest, vers la maison de 萬作
  fill('d', 15, 11, 16, 12); // seuil de la maison du meunier... de la voisine
  fill('d', 10, 15, 11, 23); // descente vers le moulin
  fill('d', 12, 22, 15, 23); // devant le moulin
  fill('d', 23, 18, 24, 24); // vers le pont
  fill('d', 23, 28, 24, H - 1); // la grand-route, au sud
  fill('d', 14, 29, 22, 30); // vers les rizières
  fill('d', 29, 15, 40, 16); // route de l'est
  fill('d', 39, 17, 40, 24); // vers le pont suspendu
  fill('d', 39, 28, 40, 29); // après le pont suspendu
  fill('d', 38, 31, 40, 34); // allée du cimetière
  return g;
}

const objects: Placed[] = [
  // Le salon de thé d'おみつ, à l'entrée du village.
  { o: OBJ.teahouse, x: 26, y: 6 },
  { o: OBJ.bench, x: 29, y: 8 },
  { o: OBJ.pot, x: 25, y: 8 },
  { o: OBJ.barrels, x: 30, y: 6 },

  // Au col : le 地蔵 et le poteau.
  { o: OBJ.jizo, x: 21, y: 3, id: 'site-jizo' },
  { o: OBJ.sign, x: 26, y: 3, id: 'sign-north' },

  // La maison de 萬作, à l'ouest.
  { o: OBJ.houseOrange, x: 6, y: 10 },
  { o: OBJ.crate, x: 10, y: 12 },
  { o: OBJ.logs, x: 11, y: 11 },

  // Maisons autour de la place.
  { o: OBJ.houseBeige, x: 14, y: 8 },
  { o: OBJ.houseDark, x: 30, y: 11 },
  { o: OBJ.houseOrange2, x: 34, y: 11 },
  { o: OBJ.well, x: 20, y: 13, id: 'site-well' },
  { o: OBJ.pot, x: 29, y: 13 },
  { o: OBJ.crate, x: 33, y: 13 },

  // Le moulin à l'arrêt, au bord de la rivière.
  { o: OBJ.mill, x: 13, y: 19, id: 'site-mill' },
  { o: OBJ.wheel, x: 17, y: 23 },
  { o: OBJ.barrels, x: 17, y: 21 },

  // Les ponts.
  { o: OBJ.bridge, x: 22, y: 25 },
  { o: OBJ.ropeBridge, x: 38, y: 25 },
  { o: OBJ.sign, x: 41, y: 23, id: 'sign-bridge' },

  // Les rizières en terrasse, au sud-ouest.
  { o: OBJ.terrace(8, 3), x: 6, y: 29 },
  { o: OBJ.terrace(10, 3), x: 5, y: 32 },
  { o: OBJ.terrace(6, 3), x: 14, y: 32 },
  { o: OBJ.scarecrow, x: 13, y: 31, id: 'site-scarecrow' },

  // La colline du cimetière, au sud-est.
  { o: OBJ.torii, x: 38, y: 29 },
  { o: OBJ.grave, x: 35, y: 32 },
  { o: OBJ.grave, x: 36, y: 34 },
  { o: OBJ.grave, x: 42, y: 32 },
  { o: OBJ.grave, x: 43, y: 34 },
  { o: OBJ.grave, x: 34, y: 35 },
  { o: OBJ.bigSakura, x: 38, y: 33 },
  { o: OBJ.tomb, x: 41, y: 34, id: 'tomb-otsuyu' },

  // Le sud, vers la grand-route.
  { o: OBJ.sign, x: 22, y: 34, id: 'sign-south' },
];

// Arbres isolés dans le village (en plus de la forêt).
const trees: [keyof typeof OBJ, number, number][] = [
  ['pine', 17, 3], ['pine', 29, 3], ['roundTree', 31, 1], ['pine', 14, 5],
  ['sakura', 21, 9], ['roundTree', 12, 8], ['pine', 33, 8],
  ['pine', 6, 16], ['roundTree', 4, 20], ['pine', 7, 21], ['roundTree', 20, 20],
  ['pine', 27, 20], ['sakura', 31, 18], ['pine', 35, 20], ['roundTree', 43, 18],
  ['pine', 27, 29], ['roundTree', 19, 33], ['pine', 31, 31], ['pine', 44, 29],
  ['roundTree', 12, 35], ['pine', 17, 36],
];
for (const [k, x, y] of trees) objects.push({ o: OBJ[k] as Placed['o'], x, y });

// Buissons et rochers.
const small: [keyof typeof OBJ, number, number][] = [
  ['bush', 18, 11], ['bush', 9, 9], ['bush', 28, 18], ['bush', 33, 17], ['bush', 36, 14],
  ['rock', 8, 24], ['rock', 20, 24], ['rock', 30, 24], ['rock', 34, 28], ['rock', 45, 24],
  ['rock', 12, 28], ['bush', 21, 31], ['bush', 33, 30], ['bush', 45, 33], ['bush', 37, 31], ['bush', 42, 30],
];
for (const [k, x, y] of small) objects.push({ o: OBJ[k] as Placed['o'], x, y });

export const KIRINO: MapDef = {
  id: 'kirino',
  name: '霧野村',
  reading: 'きりのむら',
  fr: 'Kirino, le village de la brume',
  width: W,
  height: H,
  terrain: terrain(),
  objects,
  seed: 7,
  music: 'audio/village',
  ambience: { key: 'audio/river', rows: [25, 27] },
  fog: 0.55,
  spawns: {
    north: { x: 23.5, y: 1.5, face: 'down' },
    south: { x: 23.5, y: 38.5, face: 'up' },
  },
  exits: [
    { side: 'north', from: 21, to: 26, gate: 'north' },
    { side: 'south', from: 21, to: 26, gate: 'south' },
  ],
  npcs: [
    { id: 'mansaku', sprite: 'actors/oldman3', x: 10.5, y: 14, face: 'down' },
    { id: 'omitsu', sprite: 'actors/princess', x: 27.5, y: 10, face: 'down' },
    { id: 'taichi', sprite: 'actors/villager5', x: 13, y: 23, face: 'right' },
    { id: 'otane', sprite: 'actors/oldwoman', x: 26.5, y: 16, face: 'left' },
    { id: 'gonbei', sprite: 'actors/villager3', x: 16.5, y: 30, face: 'left' },
  ],
  readables: {
    'sign-north': 'sign-north',
    'sign-bridge': 'sign-bridge',
    'sign-south': 'sign-south',
    'tomb-otsuyu': 'tomb-otsuyu',
    'site-mill': 'site-mill',
    'site-jizo': 'site-jizo',
    'site-well': 'site-well',
    'site-scarecrow': 'site-scarecrow',
  },
};
