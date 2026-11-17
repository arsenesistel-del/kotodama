// Réglages du joueur et mémoire des mots (ce qu'il sait lire ou non).
// Séparés de la sauvegarde du monde : ils suivent le joueur, pas la partie.
import { isKanji, knownKanji } from './kanji';
import { LEX } from './lexicon';
import type { Token } from './text';

export type Speed = 0 | 1 | 2 | 3; // ゆっくり, ふつう, はやい, 一瞬

export interface Settings {
  textSpeed: Speed;
  autoSpeed: 0 | 1 | 2;
  furigana: 'auto' | 'all' | 'none';
  level: 'N3' | 'N2'; // kanji réputés connus
  translate: 'tap' | 'always'; // ワケ traduit à la demande ou toujours
  volume: number; // 0 à 1
}

const SKEY = 'kotodama.settings.v1';
const WKEY = 'kotodama.words.v1';

const defaults = (): Settings => ({ textSpeed: 1, autoSpeed: 1, furigana: 'auto', level: 'N3', translate: 'tap', volume: 0.8 });

function load<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v ? Object.assign(fallback as object, v) : fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, v: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* navigation privée */
  }
}

export const settings: Settings = load(SKEY, defaults());
export const saveSettings = () => store(SKEY, settings);

export const MS_PER_CHAR = [80, 48, 24, 0];
export const AUTO_WAIT = [
  { base: 2400, per: 70 },
  { base: 1500, per: 45 },
  { base: 800, per: 25 },
];

// ---------- mots ----------

/** État d'un mot : `asked` = lectures demandées ; `furi` = furigana forcé (true) ou masqué (false) par le joueur. */
interface WordState {
  asked: number;
  furi?: boolean;
  seen: number;
}
const words: Record<string, WordState> = load(WKEY, {} as Record<string, WordState>);
export const saveWords = () => store(WKEY, words);

const idOf = (t: Token) => t.key ?? t.text;

export function wordState(t: Token): WordState {
  return (words[idOf(t)] ??= { asked: 0, seen: 0 });
}

/** Le mot a des kanji que le joueur n'est pas réputé savoir lire. */
export function hardKanji(t: Token): boolean {
  const known = knownKanji(settings.level);
  return [...t.text].some((c) => isKanji(c) && !known.has(c));
}

/** Faut-il afficher le furigana de ce mot ? Seulement s'il a des kanji et que le joueur ne sait pas le lire. */
export function wantsRuby(t: Token, peek = false): boolean {
  if (!t.segs.some((s) => s.ruby)) return false;
  if (peek || settings.furigana === 'all') return true;
  if (settings.furigana === 'none') return false;
  const w = words[idOf(t)];
  if (w?.furi !== undefined) return w.furi;
  if (t.key && LEX[t.key]?.name) return true;
  return hardKanji(t);
}

/** Le joueur a demandé le sens d'un mot : s'il a des kanji, le jeu le considère désormais illisible pour lui. */
export function markAsked(t: Token): void {
  const w = wordState(t);
  w.asked++;
  if (t.segs.some((s) => s.ruby) && w.furi === undefined) w.furi = true;
  saveWords();
}

export function setFuri(t: Token, on: boolean): void {
  wordState(t).furi = on;
  saveWords();
}

export function noteSeen(tokens: Token[]): void {
  for (const t of tokens) if (!t.punct) wordState(t).seen++;
  saveWords();
}

export function wordsStats(): { asked: number; hidden: number } {
  const v = Object.values(words);
  return { asked: v.filter((w) => w.furi === true).length, hidden: v.filter((w) => w.furi === false).length };
}

export function resetWords(): void {
  for (const k of Object.keys(words)) delete words[k];
  saveWords();
}
