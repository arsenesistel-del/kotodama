// Les lieux de la carte du monde, 八雲の国. Coordonnées dans un repère de 1600 × 1000.
// Un lieu « village » s'ouvre en pixel ; un « site » mène à une chasse. Le reste attend son chapitre.

export interface Place {
  id: string;
  name: string;
  reading: string;
  fr: string;
  x: number;
  y: number;
  kind: 'village' | 'site' | 'boss';
  chapter: string; // numéro de chapitre en kanji
  open: boolean;
  from?: string; // lieu auquel il est rattaché (pour les sites)
}

export const PLACES: Place[] = [
  { id: 'kirino', name: '霧野村', reading: 'きりのむら', fr: 'Kirino, le village de la brume', x: 250, y: 790, kind: 'village', chapter: '一', open: true },
  { id: 'touge', name: '霧野峠', reading: 'きりのとうげ', fr: 'Le col de Kirino. Les distorsions y rôdent.', x: 120, y: 610, kind: 'site', chapter: '一', open: true, from: 'kirino' },
  { id: 'tourou', name: '灯籠宿', reading: 'とうろうじゅく', fr: 'Le relais aux lanternes, sur la grand-route', x: 520, y: 700, kind: 'village', chapter: '二', open: false },
  { id: 'shiomi', name: '潮見港', reading: 'しおみみなと', fr: 'Le port de Shiomi, pêcheurs et marchands', x: 390, y: 470, kind: 'village', chapter: '三', open: false },
  { id: 'kaji', name: '鍛冶谷', reading: 'かじだに', fr: 'La vallée des forges', x: 690, y: 520, kind: 'village', chapter: '四', open: false },
  { id: 'chidori', name: '千鳥町', reading: 'ちどりまち', fr: 'La ville du théâtre', x: 930, y: 660, kind: 'village', chapter: '五', open: false },
  { id: 'shirasagi', name: '白鷺城', reading: 'しらさぎじょう', fr: 'Le château du Héron blanc', x: 1130, y: 480, kind: 'village', chapter: '六', open: false },
  { id: 'yukidera', name: '雪寺', reading: 'ゆきでら', fr: 'Le temple sous la neige', x: 930, y: 270, kind: 'village', chapter: '七', open: false },
  { id: 'miyako', name: '言の葉の都', reading: 'ことのはのみやこ', fr: 'La capitale des mots', x: 1240, y: 230, kind: 'village', chapter: '八', open: false },
  { id: 'tou', name: '無言の塔', reading: 'むごんのとう', fr: 'La tour sans voix', x: 1450, y: 110, kind: 'boss', chapter: '終', open: false },
];

// La grand-route, dans l'ordre des chapitres.
export const ROUTE = ['kirino', 'tourou', 'shiomi', 'kaji', 'chidori', 'shirasagi', 'yukidera', 'miyako', 'tou'];

export const placeById = (id: string) => PLACES.find((p) => p.id === id);
