// Texte japonais des répliques : lecture du balisage, découpage en mots, lectures.
// Balisage : {霧|きり} donne le kanji et sa lecture ; « / » force une coupure entre deux mots (invisible).
// Sans DOM ni Phaser, pour que `npm test` puisse l'utiliser.
import { LEX, type Entry } from './lexicon';

export interface Seg {
  base: string;
  ruby?: string;
}

export interface Token {
  segs: Seg[];
  text: string; // le mot tel qu'écrit
  reading: string; // en kana
  key?: string; // entrée du lexique
  punct?: boolean;
}

const PUNCT = /^[。、！？…・「」『』（）()\s　!?.,〜～]$/;
export const isPunct = (c: string) => PUNCT.test(c);

/** « {漢字|かんじ} » devient des segments ; « / » devient une coupure forcée (segment vide). */
export function parse(src: string): Seg[] {
  const out: Seg[] = [];
  const re = /\{([^|}]+)\|([^}]+)\}/g;
  const plainPart = (s: string) => {
    for (const ch of s) out.push(ch === '/' ? { base: '' } : { base: ch });
  };
  let i = 0;
  for (let m; (m = re.exec(src)); ) {
    plainPart(src.slice(i, m.index));
    out.push({ base: m[1], ruby: m[2] });
    i = m.index + m[0].length;
  }
  plainPart(src.slice(i));
  return out;
}

export const plain = (src: string) => parse(src).map((s) => s.base).join('');

// Formes du lexique, rangées par premier caractère, les plus longues d'abord.
let index: Map<string, [string, string][]> | null = null;
function surfaces(): Map<string, [string, string][]> {
  if (index) return index;
  index = new Map();
  for (const [key, e] of Object.entries(LEX))
    for (const f of [key, ...(e.forms ?? [])]) {
      const list = index.get(f[0]) ?? [];
      list.push([f, key]);
      index.set(f[0], list);
    }
  for (const list of index.values()) list.sort((a, b) => b[0].length - a[0].length);
  return index;
}

/** Découpe une réplique en mots : correspondance la plus longue avec le lexique, sans couper un groupe à furigana. */
export function tokenize(src: string): Token[] {
  const segs = parse(src);
  // Pour chaque caractère du texte : le segment qui le porte. Les coupures possibles sont aux bords des segments.
  let text = '';
  const segAt: number[] = [];
  const edge = new Set<number>([0]);
  const forced = new Set<number>();
  segs.forEach((s, k) => {
    if (!s.base) forced.add(text.length);
    for (let j = 0; j < s.base.length; j++) segAt.push(k);
    text += s.base;
    edge.add(text.length);
  });

  const tokens: Token[] = [];
  const take = (from: number, to: number, key?: string, punct?: boolean) => {
    const first = segAt[from], last = segAt[to - 1];
    const ss = segs.slice(first, last + 1).filter((s) => s.base);
    tokens.push({ segs: ss, text: text.slice(from, to), reading: ss.map((s) => s.ruby ?? s.base).join(''), key, punct });
  };

  let i = 0;
  while (i < text.length) {
    if (isPunct(text[i])) {
      let j = i + 1;
      while (j < text.length && isPunct(text[j]) && !forced.has(j)) j++;
      take(i, j, undefined, true);
      i = j;
      continue;
    }
    let hit: [string, string] | undefined;
    for (const cand of surfaces().get(text[i]) ?? []) {
      const end = i + cand[0].length;
      if (!text.startsWith(cand[0], i) || !edge.has(end)) continue;
      let crosses = false;
      for (const f of forced) if (f > i && f < end) crosses = true;
      if (!crosses) {
        hit = cand;
        break;
      }
    }
    if (hit) {
      take(i, i + hit[0].length, hit[1]);
      i += hit[0].length;
    } else {
      // Mot absent du lexique : on avance d'un segment entier (npm test le signale).
      let j = i + 1;
      while (j < text.length && !edge.has(j)) j++;
      take(i, j);
      i = j;
    }
  }
  return tokens;
}

export const entryOf = (t: Token): Entry | undefined => (t.key ? LEX[t.key] : undefined);
