// Réglages du joueur et mémoire des mots (ce qu'il sait lire ou non).
// Séparés de la sauvegarde du monde : ils suivent le joueur, pas la partie.
import { isKanji, knownKanji } from './kanji';
import { LEX } from './lexicon';
import * as Progress from './progress';
import type { Token } from './text';

export type Speed = 0 | 1 | 2 | 3; // ゆっくり, ふつう, はやい, 一瞬

export interface Settings {
  textSpeed: Speed;
  autoSpeed: 0 | 1 | 2;
  furigana: 'auto' | 'all' | 'none';
  level: 'N3' | 'N2'; // kanji réputés connus
  translate: 'tap' | 'always'; // ワケ traduit à la demande ou toujours
  volume: number; // 0 à 1
  voice: number; // volume des voix, 0 à 1 (multiplié par le volume général)
}

const SKEY = 'kotodama.settings.v1';
const WKEY = 'kotodama.words.v1';

const defaults = (): Settings => ({ textSpeed: 1, autoSpeed: 1, furigana: 'auto', level: 'N3', translate: 'tap', volume: 0.8, voice: 1 });

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
// Ce que le joueur sait lire vient du suivi caché (progress.ts) : un mot dont il a demandé le sens garde son
// furigana, qui pâlit à mesure qu'il le redit juste sur plusieurs jours, disparaît quand le mot est acquis,
// et revient, pâle, si le mot s'oublie. Le bouton ふりがな de la fiche reste un choix manuel qui passe avant.

/** État d'un mot : `asked` = sens demandés ; `furi` = furigana forcé (true) ou masqué (false) par le joueur. */
interface WordState {
  asked: number;
  furi?: boolean;
  seen: number;
  said?: number; // fois où le joueur l'a prononcé juste, dans une réponse validée par le micro
}

const words: Record<string, WordState> = load(WKEY, {} as Record<string, WordState>);
export const saveWords = () => store(WKEY, words);

const idOf = (t: Token) => t.key ?? t.text;

// Reprise de la session 4 : « acquis » voulait dire trois fois prononcé juste (furigana masqué automatiquement),
// et toucher un mot forçait son furigana. Ces deux réglages automatiques deviennent des cartes du suivi caché.
Progress.migrate('words', (at) => {
  for (const [id, w] of Object.entries(words)) {
    if (w.furi === false && (w.said ?? 0) >= 3 && w.asked > 0) {
      Progress.seed('w:' + id, Progress.ACQ_W, 1, at);
      delete w.furi;
    } else if (w.asked > 0) {
      Progress.seed('w:' + id, Math.max(0.4, Math.min(1.5, 0.4 * 1.4 ** (w.said ?? 0))), 1, at);
      if (w.furi === true) delete w.furi;
    }
  }
  saveWords();
});

export function wordState(t: Token): WordState {
  return (words[idOf(t)] ??= { asked: 0, seen: 0 });
}

/** Le mot a des kanji que le joueur n'est pas réputé savoir lire. */
export function hardKanji(t: Token): boolean {
  const known = knownKanji(settings.level);
  return [...t.text].some((c) => isKanji(c) && !known.has(c));
}

/** Aide du suivi caché pour ce mot, ou null si la règle par défaut s'applique. */
function aidOf(t: Token): 'full' | 'fade' | 'off' | null {
  const c = Progress.card(Progress.wordId(t));
  if (!c) return null;
  const byDefault = !!(t.key && LEX[t.key]?.name) || hardKanji(t);
  // Un mot réputé lisible qu'il n'a jamais demandé reste sans furigana, même suivi.
  if (!byDefault && c.l === 0) return null;
  return Progress.aid(Progress.wordId(t));
}

/** Faut-il afficher le furigana de ce mot ? Seulement s'il a des kanji et que le joueur ne sait pas le lire. */
export function wantsRuby(t: Token, peek = false): boolean {
  if (!t.segs.some((s) => s.ruby)) return false;
  if (peek || settings.furigana === 'all') return true;
  if (settings.furigana === 'none') return false;
  const w = words[idOf(t)];
  if (w?.furi !== undefined) return w.furi;
  const a = aidOf(t);
  if (a) return a !== 'off';
  if (t.key && LEX[t.key]?.name) return true;
  return hardKanji(t);
}

/** Furigana pâle : le mot s'installe, ou il s'oublie. */
export function fadedRuby(t: Token): boolean {
  if (settings.furigana !== 'auto' || words[idOf(t)]?.furi !== undefined) return false;
  return aidOf(t) === 'fade';
}

/** Le joueur a demandé le sens d'un mot : pour le suivi caché, c'est un raté. */
export function markAsked(t: Token): void {
  wordState(t).asked++;
  if (Progress.tracked(t)) Progress.review(Progress.wordId(t), 1);
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

/** Le joueur vient de dire juste une phrase : chaque mot compte. Rend les mots, autrefois demandés, qui viennent d'être acquis. */
export function noteSaid(tokens: Token[]): Token[] {
  const got: Token[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!Progress.tracked(t) || seen.has(Progress.wordId(t))) continue;
    seen.add(Progress.wordId(t));
    const w = wordState(t);
    w.said = (w.said ?? 0) + 1;
    if (Progress.review(Progress.wordId(t), 3) && Progress.card(Progress.wordId(t))!.l > 0) got.push(t);
  }
  saveWords();
  return got;
}

export function wordsStats(): { asked: number; hidden: number } {
  const c = Progress.counts();
  return { asked: c.words - c.wordsAcq, hidden: c.wordsAcq };
}

export function resetWords(): void {
  for (const k of Object.keys(words)) delete words[k];
  saveWords();
  Progress.forgetWords();
}
