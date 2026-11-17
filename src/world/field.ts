// Les rencontres (session 10, REFONTE.md) : les 言蟲 des herbes hautes, leur niveau, le niveau du 渡り, le butin, le sac,
// la clochette 鈴 et le 図鑑. Sans Phaser ni DOM : la scène du monde demande ici quoi faire, le combat (game.js) y range
// ses résultats, et `npm test` vérifie les règles (scripts/check-field.mjs).
import { world } from './state';

const KEY = 'kotodama.field.v1';

export type Frame = 'omou' | 'kamo' | 'souda' | 'ndesu';
export type Mat = 'sumi' | 'washi' | 'ito' | 'mokuhen' | 'teppen' | 'kome';

export interface Species {
  id: string;
  name: string; // en japonais
  reading: string;
  fr: string;
  frame: Frame; // la fin qu'elle porte : voir la bête, c'est savoir quelle fin dire
  px: string; // image du combat (src/assets/combat/px/<px>.png) et peinture du 図鑑 (src/assets/combat/<px>.webp)
  after?: string; // contrat de l'histoire à finir avant qu'elle se montre
  mats: [Mat, number][]; // ce qu'elle laisse, avec le poids du tirage
  lore: string;
  glyphs: string;
}

/** Les quatre espèces du chapitre 1, une par fin rendue au village. */
export const SPECIES: Species[] = [
  {
    id: 'tsubuyaki', name: 'つぶやき', reading: 'つぶやき', fr: 'Le marmonneur', frame: 'omou', px: 'k_tsubu',
    mats: [['washi', 3], ['sumi', 2], ['kome', 2], ['ito', 1]],
    lore: 'Une boule d’avis ravalés. On l’entend marmonner « je trouve que… » et jamais la suite. Elle grignote les mots qui traînent dans l’herbe.',
    glyphs: 'と思う呟',
  },
  {
    id: 'uwasadori', name: 'うわさ鳥', reading: 'うわさどり', fr: 'L’oiseau-rumeur', frame: 'souda', px: 'k_uwasa', after: 'c1',
    mats: [['ito', 3], ['kome', 3], ['washi', 1], ['sumi', 1]],
    lore: 'Il picore les on-dit à moitié transmis et les répète de touffe en touffe. Il ne sait jamais d’où vient ce qu’il raconte.',
    glyphs: 'そうだ噂',
  },
  {
    id: 'mayoiga', name: 'まよい蛾', reading: 'まよいが', fr: 'La phalène qui hésite', frame: 'kamo', px: 'k_mayoi', after: 'c2',
    mats: [['washi', 3], ['ito', 2], ['sumi', 2], ['mokuhen', 1]],
    lore: 'Ses ailes battent entre deux positions sans choisir. Elle naît des « peut-être » qu’on n’a pas osé dire.',
    glyphs: 'かもしれ迷',
  },
  {
    id: 'wakegitsune', name: 'わけ狐', reading: 'わけぎつね', fr: 'Le renard des raisons', frame: 'ndesu', px: 'k_wake', after: 'c3',
    mats: [['mokuhen', 3], ['sumi', 2], ['teppen', 1], ['kome', 1]],
    lore: 'Il penche la tête comme pour demander pourquoi. Il se nourrit des explications commencées et laissées là. ワケ le trouve « un peu trop curieux ».',
    glyphs: 'んだ訳',
  },
];

export const MATS: Record<Mat, { name: string; reading: string; fr: string; tier: number }> = {
  washi: { name: '和紙', reading: 'わし', fr: 'Papier de mûrier, encore plié comme une lettre jamais envoyée.', tier: 0 },
  kome: { name: '米', reading: 'こめ', fr: 'Une poignée de riz. Les 言蟲 en volent dans les rizières en friche.', tier: 0 },
  sumi: { name: '墨', reading: 'すみ', fr: 'Un bâton d’encre. Ce qui reste d’une bête apaisée.', tier: 0 },
  ito: { name: '糸', reading: 'いと', fr: 'Du fil, solide. おたね en manque toujours.', tier: 1 },
  mokuhen: { name: '木片', reading: 'もくへん', fr: 'Des éclats de bois dur. 萬作 sait quoi en faire.', tier: 1 },
  teppen: { name: '鉄片', reading: 'てっぺん', fr: 'Un éclat de fer. Rare, et précieux pour une lame.', tier: 2 },
};
export const MAT_ORDER: Mat[] = ['washi', 'kome', 'sumi', 'ito', 'mokuhen', 'teppen'];

export const FRAME_JP: Record<Frame, string> = { omou: '〜と思う', kamo: '〜かもしれない', souda: '〜そうだ', ndesu: '〜んだ' };
const FRAME_FR: Record<Frame, string> = { omou: 'un avis', kamo: 'un doute', souda: 'un on-dit', ndesu: 'une explication' };

// ---------- sauvegarde ----------

export interface Met {
  seen: number;
  calmed: number;
  maxLv: number;
  rare: number; // variantes rares rencontrées
  first: string; // jour de la première rencontre
}

export interface FieldSave {
  v: 1;
  lvl: number;
  xp: number; // vers le niveau suivant
  hp: number; // PV entre deux combats (on récupère au village)
  bag: Partial<Record<Mat, number>>;
  bell: boolean; // la clochette tinte : pas de rencontres
  hasBell: boolean;
  beasts: Record<string, Met>;
  wins: number;
}

const fresh = (): FieldSave => ({ v: 1, lvl: 1, xp: 0, hp: maxHp(1), bag: {}, bell: false, hasBell: false, beasts: {}, wins: 0 });
let cache: FieldSave | null = null;

export function field(): FieldSave {
  if (cache) return cache;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    cache = s && s.v === 1 ? Object.assign(fresh(), s) : fresh();
  } catch {
    cache = fresh();
  }
  return cache!;
}

export function saveField(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(field()));
  } catch {
    /* navigation privée */
  }
}

/** Pour les tests : repartir de zéro, ou d'un état donné. */
export function resetField(s?: Partial<FieldSave>): void {
  cache = Object.assign(fresh(), s ?? {});
}

// ---------- le 渡り progresse ----------
// Du confort seulement : des PV, un peu de temps. Le niveau du joueur ne change jamais la phrase demandée.

export const maxHp = (lvl: number): number => 4 + Math.ceil(lvl / 2);
export const timeBonus = (lvl: number): number => Math.min(3, (lvl - 1) * 0.3);
export const xpToNext = (lvl: number): number => 15 + 10 * lvl;

/** Ajoute de l'expérience ; rend les niveaux gagnés. Un niveau gagné rend tous les PV. */
export function gainXp(n: number): number[] {
  const f = field();
  const ups: number[] = [];
  f.xp += Math.max(0, Math.round(n));
  while (f.xp >= xpToNext(f.lvl) && f.lvl < 99) {
    f.xp -= xpToNext(f.lvl);
    f.lvl++;
    ups.push(f.lvl);
  }
  if (ups.length) f.hp = maxHp(f.lvl);
  saveField();
  return ups;
}

export function heal(): void {
  const f = field();
  f.hp = maxHp(f.lvl);
  saveField();
}

/** Expérience des contrats (REFONTE : bêtes, quêtes, contrats). */
export const XP_CONTRACT = 30;
export const XP_BOSS = 60;
export const XP_REPORT = 20;

// ---------- les bêtes ----------

const doneQuest = (id?: string) => !id || world().quests[id]?.step === 'done';
export const unlocked = (): Species[] => SPECIES.filter((s) => doneQuest(s.after));
export const speciesById = (id: string) => SPECIES.find((s) => s.id === id);

export interface LevelSpec {
  scale: 'lire' | 'construire';
  forms: string[]; // formes du moteur (aff, neg, past, negpast)
  timer: number; // secondes, avant le bonus du joueur
  n: number; // phrases justes pour l'apaiser
  broken: boolean; // phrases déformées (祓)
  mixed: boolean; // structures du chapitre mélangées
  listen: boolean; // phrase seulement entendue (haut de tranche)
}

/** Le niveau d'une bête, c'est la difficulté de sa phrase (tableau de REFONTE.md). */
export function levelSpec(lvl: number): LevelSpec {
  const n = Math.min(4, 2 + Math.floor(lvl / 4));
  if (lvl <= 3) return { scale: 'lire', forms: ['aff'], timer: 14, n, broken: false, mixed: false, listen: false };
  if (lvl <= 6) return { scale: 'construire', forms: ['aff', 'aff', 'neg'], timer: 13, n, broken: false, mixed: false, listen: false };
  if (lvl <= 9) return { scale: 'construire', forms: ['past', 'negpast', 'past', 'negpast', 'neg'], timer: 11, n, broken: false, mixed: false, listen: false };
  return { scale: 'construire', forms: ['aff', 'neg', 'past', 'negpast'], timer: 11, n, broken: true, mixed: true, listen: lvl >= TRANCHE[1] };
}

/** Tranche de niveaux du chapitre 1. */
export const TRANCHE: [number, number] = [1, 10];

export interface Beast {
  sp: string;
  lvl: number;
  rare: boolean;
}

export interface Zone {
  rect: [number, number, number, number]; // x0, y0, x1, y1 en tuiles, bornes comprises
  lv: [number, number];
  name: string;
}

/** Tirage d'une rencontre dans une zone d'herbes hautes. */
export function roll(zone: Zone, r: () => number = Math.random): Beast {
  const list = unlocked();
  // La plus récente des espèces sort un peu plus souvent : c'est la fin qu'on vient de rendre au village.
  const w = list.map((_, i) => 1 + (i === list.length - 1 && i > 0 ? 0.6 : 0));
  let v = r() * w.reduce((a, b) => a + b, 0), sp = list[0];
  for (let i = 0; i < list.length; i++) if ((v -= w[i]) < 0) { sp = list[i]; break; }
  const [a, b] = zone.lv;
  const rare = r() < 1 / 16;
  const lvl = Math.max(TRANCHE[0], Math.min(TRANCHE[1], a + Math.floor(r() * (b - a + 1)) + (rare ? 1 : 0)));
  return { sp: sp.id, lvl, rare };
}

/** Chance de rencontre par case d'herbe haute traversée. */
export const RATE = 1 / 9;

export const beastName = (b: Beast) => (b.rare ? '朱' : '') + speciesById(b.sp)!.name;

/** La chasse que le moteur jouera (même forme que STAGES dans engine.js, plus `enc`). */
export function beastStage(b: Beast) {
  const sp = speciesById(b.sp)!;
  const spec = levelSpec(b.lvl);
  const frames = spec.mixed ? [...new Set(unlocked().map((s) => s.frame))] : [sp.frame];
  const keys = frames.flatMap((f) => ['na', 'no', 'ia', 've'].map((t) => `${f}.${t}`));
  const n = spec.n + (b.rare ? 1 : 0);
  return {
    id: 'k-' + sp.id,
    art: sp.px,
    bg: 'susuki',
    lvl: Math.min(5, Math.floor(b.lvl / 2)),
    name: beastName(b),
    fr: `${sp.fr} · Lv ${b.lvl}`,
    hint: `${FRAME_JP[sp.frame]} : ${FRAME_FR[sp.frame]}${spec.mixed ? ' (et les autres fins du village)' : ''}`,
    keys,
    forms: spec.forms,
    hp: n * 10,
    timer: spec.timer - (b.rare ? 1 : 0),
    hue: 0,
    glyphs: sp.glyphs,
    enc: { n, sp: sp.id, lvl: b.lvl, rare: b.rare, show: spec.scale === 'lire' ? 'full' : 'pair', broken: spec.broken, listen: spec.listen },
  };
}

export function meet(b: Beast): void {
  const f = field();
  const m = (f.beasts[b.sp] ??= { seen: 0, calmed: 0, maxLv: 0, rare: 0, first: new Date().toLocaleDateString('sv-SE') });
  m.seen++;
  m.maxLv = Math.max(m.maxLv, b.lvl);
  if (b.rare) m.rare++;
  saveField();
}

/** Expérience d'une bête apaisée : son niveau, plus les coups critiques et un combat sans coup reçu. */
export function beastXp(b: Beast, crits: number, clean: boolean): number {
  return Math.round((3 + 2 * b.lvl) * (b.rare ? 2 : 1) + crits + (clean ? 2 : 0));
}

/**
 * Butin d'une bête apaisée. Plus riche en haut de tranche et sur une variante rare, et quand la phrase était
 * à échéance ou difficile pour le joueur (règle 6 : le meilleur butin vient de ce qui est dur).
 */
export function loot(b: Beast, hard: number, r: () => number = Math.random): Partial<Record<Mat, number>> {
  const sp = speciesById(b.sp)!;
  const out: Partial<Record<Mat, number>> = {};
  const add = (m: Mat, n = 1) => (out[m] = (out[m] ?? 0) + n);
  const pick = (): Mat => {
    // En haut de tranche, les matériaux rares sortent plus souvent.
    const ws = sp.mats.map(([m, w]) => w * (MATS[m].tier && b.lvl >= 8 ? 2 : 1));
    let v = r() * ws.reduce((a, c) => a + c, 0);
    for (let i = 0; i < ws.length; i++) if ((v -= ws[i]) < 0) return sp.mats[i][0];
    return sp.mats[0][0];
  };
  let rolls = 1 + (b.lvl >= 5 ? 1 : 0) + (b.lvl >= 8 ? 1 : 0) + (hard > 0 ? 1 : 0) + (b.rare ? 1 : 0);
  while (rolls-- > 0) add(pick());
  if (b.rare || (b.lvl >= 9 && r() < 0.25)) add('teppen');
  return out;
}

export interface Outcome {
  xp: number;
  ups: number[];
  loot: Partial<Record<Mat, number>>;
  hard: number;
}

/** Fin d'un combat gagné : 図鑑, expérience, butin dans le sac, PV gardés. */
export function calm(b: Beast, o: { crits: number; clean: boolean; hard: number; hp: number }): Outcome {
  const f = field();
  const m = f.beasts[b.sp];
  if (m) m.calmed++;
  f.wins++;
  f.hp = Math.max(1, o.hp);
  const got = loot(b, o.hard);
  for (const [k, n] of Object.entries(got)) f.bag[k as Mat] = (f.bag[k as Mat] ?? 0) + (n ?? 0);
  const xp = beastXp(b, o.crits, o.clean);
  saveField();
  const ups = gainXp(xp);
  return { xp, ups, loot: got, hard: o.hard };
}

/** Le joueur s'est enfui, ou il a perdu : on garde ses PV (au moins 1, puisqu'on ramène au village après une défaite). */
export function setHp(hp: number): void {
  field().hp = Math.max(0, hp);
  saveField();
}

// ---------- la clochette ----------

export function giveBell(): void {
  const f = field();
  f.hasBell = true;
  saveField();
}

export function toggleBell(on = !field().bell): boolean {
  const f = field();
  if (!f.hasBell) return false;
  f.bell = on;
  saveField();
  return f.bell;
}

export const fmtLoot = (l: Partial<Record<Mat, number>>): string =>
  MAT_ORDER.filter((m) => l[m])
    .map((m) => `${MATS[m].name}×${l[m]}`)
    .join('　');
