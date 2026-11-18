// Les intérieurs de 霧野村 (session 11) : le salon de thé d'おみつ, la maison-atelier de 萬作, le moulin de 太一,
// le petit sanctuaire. Sols et murs peints par le code (paint.ts), meubles peints ou tirés du pack.
// Lettres : « W » mur du fond (vu de face), « X » haut des murs (côtés, bas), « F » plancher, « M » tatami,
// « E » terre battue, « K » plancher sombre. La porte est la case de sol dans la rangée du bas : on sort par le sud.
import type { MapDef, Placed } from '../mapdef';
import { OBJ } from '../objects';

const rows = (r: string[]) => r.map((l) => [...l]);

/** Un intérieur : une porte en bas, qui ramène devant la maison (`gate` dans 霧野村). */
function room(o: Omit<MapDef, 'width' | 'height' | 'terrain' | 'seed' | 'fog' | 'exits' | 'spawns'> & { rows: string[]; door: number; gate: string }): MapDef {
  const terrain = rows(o.rows);
  const H = terrain.length, W = terrain[0].length;
  const { rows: _r, door, gate, ...rest } = o;
  return {
    ...rest,
    width: W,
    height: H,
    terrain,
    seed: 41,
    fog: 0,
    interior: true,
    music: 'audio/village',
    spawns: { in: { x: door + 0.5, y: H - 1.25, face: 'up' } },
    exits: [{ side: 'south', from: door, to: door, gate, place: 'kirino' }],
  };
}

// ---------- 茶屋 : le salon de thé d'おみつ ----------
// Le fourneau et le comptoir à gauche (おみつ derrière), les bancs rouges au milieu, la pièce du fond en tatami à droite.
const chayaObjs: Placed[] = [
  { o: OBJ.shelf, x: 1, y: 1 },
  { o: OBJ.menu, x: 5, y: 1, id: 'menuboard' },
  { o: OBJ.kamidana, x: 9, y: 1, id: 'kamidana' },
  { o: OBJ.kamado, x: 1, y: 2, id: 'kamado' },
  { o: OBJ.lowTable, x: 1, y: 4 },
  { o: OBJ.teaset, x: 2, y: 4 },
  { o: OBJ.dango, x: 3, y: 4 },
  { o: OBJ.tawara, x: 1, y: 6 },
  { o: OBJ.jar, x: 1, y: 7 },
  { o: OBJ.bench2, x: 6, y: 3 },
  { o: OBJ.teaset, x: 6, y: 3 },
  { o: OBJ.bench2, x: 6, y: 6 },
  { o: OBJ.dango, x: 7, y: 6 },
  { o: OBJ.futon, x: 10, y: 4 },
  { o: OBJ.zabuton, x: 9, y: 6 },
  { o: OBJ.lantern, x: 8, y: 2 },
  { o: OBJ.mat, x: 6, y: 8 },
];

export const CHAYA = room({
  id: 'chaya',
  name: '茶屋',
  reading: 'ちゃや',
  fr: 'Le salon de thé d’おみつ',
  rows: [
    'XWWWWWWWWWWWX',
    'XWWWWWWWWWWWX',
    'XEEEEFFFFMMMX',
    'XEEEEFFFFMMMX',
    'XFFFFFFFFMMMX',
    'XFFFFFFFFMMMX',
    'XFFFFFFFFMMMX',
    'XFFFFFFFFFFFX',
    'XXXXXXFXXXXXX',
  ],
  door: 6,
  gate: 'chaya',
  objects: chayaObjs,
  npcs: [{ id: 'omitsu', sprite: 'actors/princess', x: 3.5, y: 3.95, face: 'down' }],
  readables: { menuboard: 'chaya:menuboard', kamidana: 'chaya:kamidana', kamado: 'chaya:kamado' },
});

// ---------- 萬作の家 : la maison-atelier ----------
// À gauche l'atelier en terre battue (établi, outils, planches, le plan du pont), à droite la pièce en tatami
// autour du foyer, et l'autel où est inscrit le nom de お露.
export const IE = room({
  id: 'ie',
  name: '萬作の家',
  reading: 'まんさくのいえ',
  fr: 'La maison-atelier de 萬作',
  rows: [
    'XWWWWWWWWWWWWX',
    'XWWWWWWWWWWWWX',
    'XEEEEEFMMMMMMX',
    'XEEEEEFMMMMMMX',
    'XEEEEEFMMMMMMX',
    'XEEEEEFMMMMMMX',
    'XEEEEEFMMMMMMX',
    'XEEEEEFFFFFFFX',
    'XXXXXEXXXXXXXX',
  ],
  door: 5,
  gate: 'ie',
  objects: [
    { o: OBJ.tools, x: 1, y: 1, id: 'tools' },
    { o: OBJ.plans, x: 4, y: 1, id: 'plans' },
    { o: OBJ.daikon, x: 5, y: 1 },
    { o: OBJ.workbench, x: 1, y: 3, id: 'bench' },
    { o: OBJ.planks, x: 5, y: 2 },
    { o: OBJ.firewood, x: 1, y: 6 },
    { o: OBJ.firewood, x: 1, y: 7 },
    { o: OBJ.bucket, x: 4, y: 7 },
    { o: OBJ.kamidana, x: 8, y: 1 },
    { o: OBJ.shoji, x: 10, y: 1 },
    { o: OBJ.butsudan, x: 12, y: 2, id: 'butsudan' },
    { o: OBJ.irori, x: 9, y: 4, id: 'irori' },
    { o: OBJ.zabuton, x: 8, y: 5 },
    { o: OBJ.zabuton, x: 11, y: 4 },
    { o: OBJ.teaset, x: 11, y: 5 },
    { o: OBJ.chest, x: 7, y: 2 },
    { o: OBJ.mat, x: 5, y: 8 },
  ],
  npcs: [],
  readables: { tools: 'ie:tools', plans: 'ie:plans', bench: 'ie:bench', butsudan: 'ie:butsudan', irori: 'ie:irori' },
});

// ---------- 水車小屋 : le moulin ----------
// La meule sous sa trémie, les ballots de riz, le cahier du grand-père, le dessin de 太一.
export const MILL_IN = room({
  id: 'mill',
  name: '水車小屋',
  reading: 'すいしゃごや',
  fr: 'Le moulin de 太一',
  rows: [
    'XWWWWWWWWWWX',
    'XWWWWWWWWWWX',
    'XEEEEEEEFFFX',
    'XEEEEEEEFFFX',
    'XEEEEEEEFFFX',
    'XEEEEEEEFFFX',
    'XEEEEEEEEEEX',
    'XXXXXEXXXXXX',
  ],
  door: 5,
  gate: 'mill',
  objects: [
    { o: OBJ.shelf, x: 1, y: 1 },
    { o: OBJ.drawing, x: 9, y: 1, id: 'drawing' },
    { o: OBJ.millstone, x: 5, y: 2, id: 'stone' },
    { o: OBJ.tawara, x: 1, y: 2 },
    { o: OBJ.tawara, x: 2, y: 2 },
    { o: OBJ.tawara, x: 1, y: 3, id: 'rice' },
    { o: OBJ.sack, x: 1, y: 5 },
    { o: OBJ.sack, x: 2, y: 5 },
    { o: OBJ.cabinet, x: 10, y: 2, id: 'notebook' },
    { o: OBJ.stool, x: 9, y: 3 },
    { o: OBJ.bucket, x: 8, y: 6 },
    { o: OBJ.mat, x: 5, y: 7 },
  ],
  npcs: [],
  readables: { stone: 'mill:stone', notebook: 'mill:notebook', drawing: 'mill:drawing', rice: 'mill:rice' },
});

// ---------- 霧野神社 : le petit sanctuaire ----------
export const YASHIRO = room({
  id: 'yashiro',
  name: '霧野神社',
  reading: 'きりのじんじゃ',
  fr: 'Le petit sanctuaire de Kirino',
  rows: [
    'XWWWWWWWWX',
    'XWWWWWWWWX',
    'XKKKKKKKKX',
    'XKKKKKKKKX',
    'XKKKKKKKKX',
    'XKKKKKKKKX',
    'XKKKKKKKKX',
    'XXXXKXXXXX',
  ],
  door: 4,
  gate: 'yashiro',
  objects: [
    { o: OBJ.shimenawa, x: 3, y: 0 },
    { o: OBJ.menu, x: 1, y: 1, id: 'yuisho' },
    { o: OBJ.mirror, x: 4, y: 1, id: 'mirror' },
    { o: OBJ.stoneLamp, x: 3, y: 1 },
    { o: OBJ.stoneLamp, x: 5, y: 1 },
    { o: OBJ.saisen, x: 3, y: 4, id: 'saisen' },
    { o: OBJ.omikuji, x: 7, y: 3, id: 'omikuji' },
    { o: OBJ.lantern, x: 1, y: 3 },
    { o: OBJ.lantern, x: 8, y: 3 },
    { o: OBJ.mat, x: 4, y: 7 },
  ],
  npcs: [],
  readables: { yuisho: 'yashiro:yuisho', mirror: 'yashiro:mirror', saisen: 'yashiro:saisen', omikuji: 'omikuji:first' },
});
