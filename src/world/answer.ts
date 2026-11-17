// Vérification des réponses dites à voix haute dans les dialogues (échelle « Lire » : la phrase est affichée).
// Même principe que le moteur du combat : une expression régulière qui accepte chaque mot écrit en kanji ou en kana,
// et une liste de fautes connues, chacune avec son diagnostic en français. Les fautes sont tirées automatiquement
// de la phrase attendue (règles ci-dessous) : un だ qui manque devant と思います, un な devant んです, etc.
// Sans DOM, pour que `npm test` puisse vérifier chaque réplique du joueur.
import { parse, plain } from './text';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hira = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// Ce que Chrome écrit parfois autrement que la réplique : on le ramène à l'écriture du jeu avant de comparer.
const SPELL: [RegExp, string][] = [
  [/吊橋|つり橋/g, '吊り橋'],
  [/君/g, 'くん'],
  [/大地くん|太地くん/g, '太一くん'],
  [/萬作|万作/g, '萬作'],
  [/下さい/g, 'ください'],
  [/美味しい/g, 'おいしい'],
  [/怖/g, 'こわ'],
  [/宜しく/g, 'よろしく'],
];

/** Texte entendu, nettoyé : ponctuation et espaces ôtés, katakana en hiragana, écritures courantes unifiées. */
export function normHeard(s: string): string {
  let t = (s || '').normalize('NFKC').replace(/[\s、。，,．.！？!?「」『』…〜~・]/g, '');
  for (const [rx, to] of SPELL) t = t.replace(rx, to);
  return hira(t);
}

/** Motif d'une réplique balisée : chaque groupe {漢字|かな} accepte l'une ou l'autre écriture. */
export function pattern(markup: string): string {
  let rx = '';
  for (const s of parse(markup)) {
    if (!s.base) continue;
    if (s.ruby) {
      const forms = [...new Set([normHeard(s.base), hira(s.ruby)])];
      rx += '(?:' + forms.map(esc).join('|') + ')';
    } else {
      const c = normHeard(s.base);
      if (c) rx += esc(c);
    }
  }
  return rx;
}

// Fautes de jointure tirées de la phrase attendue. Chaque règle transforme le balisage de la bonne phrase en une
// phrase fausse, que le jeu reconnaîtra et expliquera.
const O = '\\{思\\|おも\\}';
const RULES: { rx: RegExp; to: string; msg: string }[] = [
  { rx: new RegExp('だと' + O), to: 'と{思|おも}', msg: 'Il manque だ avant と思います.' },
  { rx: new RegExp('だと' + O), to: 'なと{思|おも}', msg: 'Avant と思う, c’est だ, pas な.' },
  { rx: new RegExp('いと' + O), to: 'いだと{思|おも}', msg: 'Pas de だ après un adjectif en い.' },
  { rx: /なんです/, to: 'だんです', msg: 'Devant んです, だ devient な.' },
  { rx: /なんです/, to: 'んです', msg: 'Il manque な devant んです.' },
  { rx: /(た|る)んです/, to: '$1なんです', msg: 'Pas de な après un verbe ou un passé : directement んです.' },
  { rx: /\}かもしれません/, to: '}だかもしれません', msg: 'Pas de だ avant かもしれない.' },
  { rx: /(る|い)かもしれない/, to: '$1だかもしれない', msg: 'Pas de だ avant かもしれない.' },
  { rx: new RegExp('ると' + O), to: 'るだと{思|おも}', msg: 'Pas de だ après un verbe devant と思う.' },
  { rx: /(る|い)そうだ/, to: '$1だそうだ', msg: 'Pas de だ après un verbe devant そうだ.' },
  { rx: /たと\{思\|おも\}/, to: 'ただと{思|おも}', msg: 'Pas de だ après un passé devant と思う.' },
  { rx: /たかもしれない/, to: 'ただかもしれない', msg: 'Pas de だ avant かもしれない.' },
  { rx: /たそうだ/, to: 'ただそうだ', msg: 'Pas de だ après un passé devant そうだ.' },
  { rx: /(た|る)んだ。?$/, to: '$1なんだ。', msg: 'Pas de な après un verbe ou un passé : directement んだ.' },
  { rx: /(た|る)んだ」/, to: '$1なんだ」', msg: 'Pas de な après un verbe ou un passé : directement んだ.' },
  { rx: /\}かったんです/, to: '}いかったんです', msg: 'Au passé, い devient かった.' },
  { rx: /\}かった/, to: '}いかった', msg: 'Au passé, い devient かった.' },
  { rx: /じゃないかもしれません/, to: 'くないかもしれません', msg: 'Après un nom, le négatif est じゃない, pas くない.' },
];

export interface Bad {
  markup: string;
  rx: string;
  msg: string;
}

export interface Target {
  markup: string; // la réplique attendue, balisée
  text: string; // la même, en clair
  rx: string;
  bad: Bad[];
  hear: string[]; // autres textes acceptés tels quels (déjà nettoyés)
}

export function target(markup: string, hear: string[] = []): Target {
  const bad: Bad[] = [];
  for (const r of RULES) {
    if (!r.rx.test(markup)) continue;
    const m = markup.replace(r.rx, r.to);
    if (m !== markup && !bad.some((b) => b.markup === m)) bad.push({ markup: m, rx: pattern(m), msg: r.msg });
  }
  // Un « はい » d'ouverture peut être omis : on juge la phrase, pas la politesse.
  const opt = (rx: string) => rx.replace(/^はい/, '(?:はい)?');
  return { markup, text: plain(markup), rx: opt(pattern(markup)), bad: bad.map((b) => ({ ...b, rx: opt(b.rx) })), hear: hear.map(normHeard) };
}

const ends = (rx: string, h: string) => new RegExp('(?:' + rx + ')$').test(h);

export function accepts(t: Target, heard: string): boolean {
  const h = normHeard(heard);
  return !!h && (ends(t.rx, h) || t.hear.some((x) => h.endsWith(x)));
}

export function diagnose(t: Target, heard: string): string {
  const h = normHeard(heard);
  if (!h) return '';
  for (const b of t.bad) if (ends(b.rx, h)) return b.msg;
  return '';
}

export type Verdict = { ok: true; choice: number } | { ok: false; msg: string; choice: number };

/**
 * Juge ce que le micro a entendu face à une ou plusieurs phrases possibles.
 * `cands` : la transcription principale d'abord, puis les variantes que propose Chrome.
 * Une variante n'est acceptée que si la transcription principale n'est pas une faute diagnostiquée :
 * le moteur vocal ne doit pas valider en douce une faute qu'il aurait corrigée.
 */
export function judge(targets: Target[], cands: string[]): Verdict | null {
  const main = cands[0] ?? '';
  for (let i = 0; i < targets.length; i++) if (accepts(targets[i], main)) return { ok: true, choice: i };
  for (let i = 0; i < targets.length; i++) {
    const msg = diagnose(targets[i], main);
    if (msg) return { ok: false, msg, choice: i };
  }
  for (const c of cands.slice(1)) for (let i = 0; i < targets.length; i++) if (accepts(targets[i], c)) return { ok: true, choice: i };
  return null;
}
