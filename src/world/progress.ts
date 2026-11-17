// Suivi caché (DESIGN, « La boucle ») : chaque mot et chaque structure a sa courbe d'oubli (fsrs.ts).
// Le jeu note ce qu'il observe : une phrase dite juste, une jointure ratée, une lecture demandée. Il s'en sert pour
// effacer les aides des mots acquis (et les remettre quand un mot s'oublie), pour choisir les phrases des chasses
// selon l'échéance, et pour le bilan de la semaine (minutes parlées, phrases dites, structures acquises).
// Stocké à part (`kotodama.progress.v1`) : comme les mots, il suit le joueur, pas l'emplacement de sauvegarde.
// Sans DOM, pour que `npm test` puisse le vérifier.
import * as F from './fsrs';
import { LEX } from './lexicon';
import { tokenize, type Token } from './text';

export type Grade = F.Grade;
/**
 * Stabilité (en jours) à partir de laquelle un mot est acquis : son aide disparaît. Avec la courbe par défaut,
 * il faut le redire juste pendant à peu près une semaine, un jour sur un ou deux.
 */
export const ACQ_W = 10;
/** Pareil pour une structure, plus exigeant : une première phrase juste part déjà de trois jours. */
export const ACQ_S = 14;
export const acqOf = (id: string): number => (id.startsWith('s:') ? ACQ_S : ACQ_W);
/** Stabilité à partir de laquelle le furigana pâlit. */
export const FADE = 3;
/** En dessous, la carte arrive à échéance : le jeu la ramène. */
export const TARGET = 0.9;
/** En dessous, un mot acquis est en train de s'oublier : son aide revient, pâle. */
export const SLIP = 0.8;

export interface Card {
  s: number; // stabilité, en jours
  d: number; // difficulté, 1 à 10
  t: number; // dernière révision (ms)
  day: string; // jour de la dernière révision
  g: Grade; // dernière note
  n: number; // révisions
  l: number; // ratés (une lecture demandée compte comme un raté)
  acq?: number; // première fois acquise (ms)
}

export interface DayLog {
  ms: number; // temps de parole
  said: number; // phrases dites (jugées par le jeu)
  ok: number; // dont justes
  acq: string[]; // cartes acquises ce jour-là
  hunts: number;
  wins: number;
}

interface Store {
  v: 1;
  cards: Record<string, Card>;
  days: Record<string, DayLog>;
  shown?: string; // lundi de la dernière semaine dont le bilan s'est ouvert tout seul
  mig?: Record<string, 1>; // reprises des anciennes données déjà faites
}

const KEY = 'kotodama.progress.v1';
const DAY = 864e5;

/** Horloge, remplaçable dans les tests. */
export const clock = { now: () => Date.now() };

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Le jour de jeu commence à 4 h : une partie qui déborde après minuit compte pour la veille. */
export const dayOf = (ms = clock.now()): string => ymd(new Date(ms - 4 * 3600e3));
const dateOf = (day: string) => new Date(day + 'T12:00:00');
export const addDays = (day: string, n: number): string => {
  const d = dateOf(day);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const mondayOf = (day: string): string => addDays(day, -((dateOf(day).getDay() + 6) % 7));

let cache: Store | null = null;
const hasLS = () => typeof localStorage !== 'undefined';

function store(): Store {
  if (cache) return cache;
  let s: Store | null = null;
  try {
    if (hasLS()) s = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    s = null;
  }
  cache = s && s.v === 1 ? Object.assign({ v: 1, cards: {}, days: {} }, s) : { v: 1, cards: {}, days: {} };
  return cache;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
/** Écriture groupée : une chasse note beaucoup de cartes d'affilée. */
function save(): void {
  if (!hasLS() || saveTimer) return;
  saveTimer = setTimeout(flush, 400);
}
export function flush(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  try {
    if (hasLS()) localStorage.setItem(KEY, JSON.stringify(store()));
  } catch {
    /* navigation privée */
  }
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', flush);

/** Remet tout à zéro (tests, ou import d'une sauvegarde). */
export function reset(s?: Store): void {
  cache = s ?? { v: 1, cards: {}, days: {} };
  flush();
}

// ---------- notes ----------

export const card = (id: string): Card | undefined => store().cards[id];
export const retention = (c: Card, at = clock.now()): number => F.retrievability((at - c.t) / DAY, c.s);

/**
 * Le jeu observe le joueur sur une carte. Un jour nouveau : mise à jour FSRS complète.
 * Le même jour : un raté compte (une fois de suite), et la reprise qui le suit aussi ; dix réussites dans la même
 * chasse ne valent pas dix jours de révision. Rend `true` si la carte vient d'être acquise pour la première fois.
 */
export function review(id: string, g: Grade, opts: { at?: number; quiet?: boolean } = {}): boolean {
  const at = opts.at ?? clock.now();
  const st = store();
  const today = dayOf(at);
  let c = st.cards[id];
  if (!c) {
    const g0 = Math.min(g, 3) as Grade; // une première fois ne peut pas être « facile »
    c = st.cards[id] = { s: F.initS(g0), d: F.initD(g0), t: at, day: today, g, n: 0, l: 0 };
  } else if (c.day !== today) {
    const r = F.retrievability((at - c.t) / DAY, c.s);
    c.s = g === 1 ? F.forgetS(c.d, c.s, r) : F.recallS(c.d, c.s, r, g);
    c.d = F.nextD(c.d, g);
  } else if ((g === 1 && c.g !== 1) || (g > 1 && c.g === 1)) {
    c.s = F.shortS(c.s, g);
    c.d = F.nextD(c.d, g);
  }
  c.s = Math.max(0.05, c.s);
  c.n++;
  if (g === 1) c.l++;
  c.g = g;
  c.t = at;
  c.day = today;
  let fresh = false;
  if (c.s >= acqOf(id) && !c.acq) {
    c.acq = at;
    fresh = true;
    if (!opts.quiet) log(at).acq.push(id);
  }
  save();
  return fresh;
}

export type Status = 'new' | 'learning' | 'acquired';
export function status(id: string, at = clock.now()): { status: Status; due: boolean; r: number; s: number } {
  const c = card(id);
  if (!c) return { status: 'new', due: true, r: 0, s: 0 };
  const r = retention(c, at);
  return { status: c.s >= acqOf(id) ? 'acquired' : 'learning', due: r < TARGET, r, s: c.s };
}

/**
 * Aide d'un mot : `full` (furigana normal), `fade` (pâle : le mot s'installe, ou il s'oublie), `off` (acquis).
 * `null` : le jeu n'a rien observé, la règle par défaut s'applique (kanji au-delà du niveau choisi).
 */
export function aid(id: string, at = clock.now()): 'full' | 'fade' | 'off' | null {
  const c = card(id);
  if (!c) return null;
  const r = retention(c, at);
  if (c.s >= acqOf(id)) return r >= SLIP ? 'off' : 'fade';
  return c.s >= FADE ? 'fade' : 'full';
}

// ---------- mots ----------

const NOT_WORDS = new Set(['particule', 'particule finale', 'copule', 'copule polie', 'copule négative', 'fin de phrase', 'suffixe', 'interjection', 'conjonction']);
export const wordId = (t: Token): string => 'w:' + (t.key ?? t.text);
/** Un mot qu'on suit (pas les particules ni les fins de phrase, qui sont des structures). */
export const tracked = (t: Token): boolean => !t.punct && !!t.key && !NOT_WORDS.has(LEX[t.key]?.pos ?? '');

/** Mot d'une chasse (moteur du combat) : « この町 » est suivi comme « 町 ». */
export const huntWordId = (surface: string): string => 'w:' + surface.replace(/^(この|その|あの)/, '');

/** Remise à zéro des mots (設定). Les structures restent. */
export function forgetWords(): void {
  const st = store();
  for (const id of Object.keys(st.cards)) if (id.startsWith('w:')) delete st.cards[id];
  flush();
}

// ---------- structures ----------

export const FRAME_LABEL: Record<string, string> = { omou: '〜と思う', kamo: '〜かもしれない', souda: '〜そうだ', ndesu: '〜んです' };
export const TYPE_LABEL: Record<string, string> = { na: 'な形容詞', no: '名詞', ia: 'い形容詞', ve: '動詞' };
/** Toutes les structures suivies au chapitre 1 : les quatre fins sur les quatre types de mots, et le discours rapporté. */
export const STRUCTS: string[] = [...Object.keys(FRAME_LABEL).flatMap((f) => Object.keys(TYPE_LABEL).map((t) => `s:${f}.${t}`)), 's:inyou'];

export function label(id: string): string {
  if (id === 's:inyou') return '「…」と言っていた';
  if (id.startsWith('s:')) {
    const [f, t] = id.slice(2).split('.');
    return `${FRAME_LABEL[f] ?? f} × ${TYPE_LABEL[t] ?? t}`;
  }
  return id.slice(2);
}

const FRAME_OF: Record<string, string> = { と思う: 'omou', かもしれない: 'kamo', そうだ: 'souda', んです: 'ndesu' };
const SKIP_BACK = new Set(['particule', 'particule finale', 'copule', 'copule polie', 'copule négative', 'suffixe']);
const TYPE_OF: Record<string, string> = { 'adjectif い': 'ia', 'adjectif な': 'na', verbe: 've' };

/** Les structures qu'une phrase fait produire : 「大丈夫だと思います」 → s:omou.na. */
export function structuresOf(markup: string): string[] {
  const toks = tokenize(markup);
  const out: string[] = [];
  toks.forEach((t, i) => {
    const f = t.key && FRAME_OF[t.key];
    if (f) {
      let j = i - 1;
      while (j >= 0 && (toks[j].punct || SKIP_BACK.has(LEX[toks[j].key ?? '']?.pos ?? ''))) j--;
      const pos = j >= 0 ? LEX[toks[j].key ?? '']?.pos : undefined;
      if (pos) out.push(`s:${f}.${TYPE_OF[pos] ?? 'no'}`);
    }
    if (t.key === '言う' && toks[i - 1]?.key === 'と' && toks[i - 2]?.text.includes('」')) out.push('s:inyou');
  });
  return [...new Set(out)];
}

// ---------- journal du jour ----------

function log(at = clock.now()): DayLog {
  const d = dayOf(at);
  return (store().days[d] ??= { ms: 0, said: 0, ok: 0, acq: [], hunts: 0, wins: 0 });
}
export function logSpeech(ms: number): void {
  if (!(ms > 0)) return;
  log().ms += Math.min(ms, 20000);
  save();
}
export function logSentence(ok: boolean): void {
  const l = log();
  l.said++;
  if (ok) l.ok++;
  save();
}
export function logHunt(won: boolean): void {
  const l = log();
  l.hunts++;
  if (won) l.wins++;
  save();
}

// ---------- bilan de la semaine ----------

export interface Week {
  start: string; // lundi
  days: { date: string; ms: number; said: number; ok: number }[];
  ms: number;
  said: number;
  ok: number;
  hunts: number;
  wins: number;
  acqS: string[];
  acqW: string[];
  prev: { ms: number; said: number };
  active: number; // jours joués
}

function sumWeek(start: string) {
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const date = addDays(start, i);
    const l = store().days[date];
    return { date, ms: l?.ms ?? 0, said: l?.said ?? 0, ok: l?.ok ?? 0, hunts: l?.hunts ?? 0, wins: l?.wins ?? 0, acq: l?.acq ?? [] };
  });
  return days;
}

/** Bilan d'une semaine : 0 = celle-ci, 1 = la précédente… */
export function week(back = 0): Week {
  const start = addDays(mondayOf(dayOf()), -7 * back);
  const d = sumWeek(start);
  const p = sumWeek(addDays(start, -7));
  const acq = [...new Set(d.flatMap((x) => x.acq))];
  const sum = (xs: typeof d, k: 'ms' | 'said' | 'ok' | 'hunts' | 'wins') => xs.reduce((a, x) => a + x[k], 0);
  return {
    start,
    days: d.map(({ date, ms, said, ok }) => ({ date, ms, said, ok })),
    ms: sum(d, 'ms'),
    said: sum(d, 'said'),
    ok: sum(d, 'ok'),
    hunts: sum(d, 'hunts'),
    wins: sum(d, 'wins'),
    acqS: acq.filter((x) => x.startsWith('s:')),
    acqW: acq.filter((x) => x.startsWith('w:')),
    prev: { ms: sum(p, 'ms'), said: sum(p, 'said') },
    active: d.filter((x) => x.said || x.ms).length,
  };
}

/** La semaine la plus ancienne qui a quelque chose (pour la navigation du bilan). */
export function weeksBack(): number {
  const days = Object.keys(store().days).sort();
  if (!days.length) return 0;
  const first = mondayOf(days[0]);
  return Math.max(0, Math.round((dateOf(mondayOf(dayOf())).getTime() - dateOf(first).getTime()) / (7 * DAY)));
}

/** Première partie d'une nouvelle semaine, et la précédente a été jouée : le bilan s'ouvre tout seul. */
export function weeklyDue(): boolean {
  const st = store();
  const monday = mondayOf(dayOf());
  if (st.shown === monday) return false;
  st.shown = monday;
  save();
  const w = week(1);
  return w.said > 0 || w.ms > 0;
}

/** État des structures, pour le bilan. */
export function structTable(at = clock.now()) {
  return STRUCTS.map((id) => ({ id, label: label(id), ...status(id, at), seen: !!card(id) }));
}

/** Mots dont il a demandé le sens et qui arrivent à échéance : ceux que le jeu va ramener. */
export function dueWords(at = clock.now(), max = 12): string[] {
  return Object.entries(store().cards)
    .filter(([id, c]) => id.startsWith('w:') && c.l > 0 && retention(c, at) < TARGET)
    .sort((a, b) => retention(a[1], at) - retention(b[1], at))
    .slice(0, max)
    .map(([id]) => id);
}

export function counts(at = clock.now()): { words: number; wordsAcq: number; structs: number; structsAcq: number } {
  const cs = Object.entries(store().cards);
  const acq = (id: string, c: Card) => c.s >= acqOf(id) && retention(c, at) >= SLIP;
  return {
    words: cs.filter(([id]) => id.startsWith('w:')).length,
    wordsAcq: cs.filter(([id, c]) => id.startsWith('w:') && acq(id, c)).length,
    structs: cs.filter(([id]) => id.startsWith('s:')).length,
    structsAcq: cs.filter(([id, c]) => id.startsWith('s:') && acq(id, c)).length,
  };
}

// ---------- reprise des anciennes données ----------

/** Une seule fois par source : `fn` reçoit un instant situé la veille (le jeu d'aujourd'hui compte comme un jour nouveau). */
export function migrate(name: string, fn: (at: number) => void): void {
  const st = store();
  st.mig ??= {};
  if (st.mig[name]) return;
  fn(clock.now() - DAY);
  st.mig[name] = 1;
  flush();
}

/** Carte posée telle quelle (reprise des anciennes données). */
export function seed(id: string, s: number, l: number, at: number): void {
  const st = store();
  if (st.cards[id]) return;
  st.cards[id] = { s, d: 6, t: at, day: dayOf(at), g: 3, n: 1, l, acq: s >= acqOf(id) ? at : undefined };
}

// ---------- sauvegarde complète ----------

/** Toute la partie (monde, emplacements, mots, réglages, combat, progression) en un fichier JSON. */
export function backup(): string {
  flush();
  const keys: Record<string, string> = {};
  if (hasLS())
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('kotodama.')) keys[k] = localStorage.getItem(k)!;
    }
  return JSON.stringify({ kotodama: 1, at: new Date().toISOString(), keys });
}

/** Remplace la partie par celle d'un fichier de sauvegarde. Rend un message d'erreur, ou '' si tout va bien. */
export function restore(json: string): string {
  let data: { kotodama?: number; keys?: Record<string, unknown> };
  try {
    data = JSON.parse(json);
  } catch {
    return 'Ce fichier n’est pas une sauvegarde de Kotodama.';
  }
  const keys = data?.keys;
  if (data?.kotodama !== 1 || !keys || typeof keys !== 'object') return 'Ce fichier n’est pas une sauvegarde de Kotodama.';
  const entries = Object.entries(keys).filter(([k, v]) => k.startsWith('kotodama.') && typeof v === 'string') as [string, string][];
  if (!entries.length) return 'Sauvegarde vide.';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const old: string[] = [];
  for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i)!.startsWith('kotodama.')) old.push(localStorage.key(i)!);
  for (const k of old) localStorage.removeItem(k);
  for (const [k, v] of entries) localStorage.setItem(k, v);
  cache = null;
  return '';
}
