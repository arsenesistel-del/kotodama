// Vérifie le suivi caché (src/world/progress.ts) : la courbe d'oubli, le rythme d'acquisition d'un mot et d'une
// structure, la détection des structures dans chaque réponse du joueur, le bilan de la semaine, la sauvegarde.
// Lancé par `npm test`. Avec `--show`, affiche la structure reconnue dans chaque réponse.
import { runnerImport } from 'vite';

// Un localStorage en mémoire, comme dans le navigateur.
const mem = new Map();
globalThis.localStorage = {
  get length() {
    return mem.size;
  },
  key: (i) => [...mem.keys()][i] ?? null,
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const { module: P } = await runnerImport('/src/world/progress.ts');
const { module: F } = await runnerImport('/src/world/fsrs.ts');
const { module: D } = await runnerImport('/src/world/dialogue.ts');
const show = process.argv.includes('--show');
let fails = 0;
const fail = (m) => {
  fails++;
  console.error('✗ ' + m);
};
const DAY = 864e5;
const T0 = new Date('2026-11-16T10:00:00').getTime(); // un lundi
let now = T0;
P.clock.now = () => now;

// ---------- courbe d'oubli ----------
for (const s of [0.5, 3, 20]) if (Math.abs(F.retrievability(s, s) - 0.9) > 1e-9) fail(`R(S, S) devrait valoir 0,9 (S = ${s})`);
if (!(F.initS(1) < F.initS(3) && F.initD(1) > F.initD(3))) fail('un raté doit donner une stabilité plus basse et une difficulté plus haute');

// ---------- un mot demandé, puis redit juste un jour sur deux ----------
P.reset();
P.review('w:霧', 1); // il touche le mot : sens demandé
if (P.aid('w:霧') !== 'full') fail('un mot demandé garde son furigana');
for (let i = 0; i < 3; i++) P.review('w:霧', 3); // il le redit trois fois dans la même partie
if (P.card('w:霧').s > 1) fail(`trois réussites le même jour ne doivent pas l'installer (S = ${P.card('w:霧').s.toFixed(2)})`);
const trail = [];
let acquiredDay = 0;
for (let d = 1; d <= 30 && !acquiredDay; d++) {
  now = T0 + d * 2 * DAY;
  if (P.review('w:霧', 3)) acquiredDay = d * 2;
  trail.push(`${d * 2} j : ${P.aid('w:霧')} (S ${P.card('w:霧').s.toFixed(1)})`);
}
if (!acquiredDay || acquiredDay < 4 || acquiredDay > 16) fail(`un mot redit juste un jour sur deux devrait être acquis en deux semaines (${trail.join(', ')})`);
else console.log(`Mot demandé puis redit un jour sur deux : furigana pâle, puis acquis au jour ${acquiredDay}.`);
if (P.aid('w:霧') !== 'off') fail('un mot acquis perd son furigana');
now += 120 * DAY;
if (P.aid('w:霧') !== 'fade') fail('un mot acquis puis oublié retrouve un furigana pâle');

// ---------- une structure, jour après jour ----------
P.reset();
now = T0;
for (let i = 0; i < 10; i++) P.review('s:omou.na', 4);
if (P.status('s:omou.na').status === 'acquired') fail('dix réussites dans la même chasse ne suffisent pas à acquérir une structure');
let sday = 0;
for (let d = 1; d <= 20 && !sday; d++) {
  now = T0 + d * DAY;
  if (P.review('s:omou.na', 3)) sday = d;
}
if (!sday || sday < 3 || sday > 8) fail(`une structure dite juste chaque jour devrait être acquise en une semaine environ (jour ${sday})`);
else console.log(`Structure dite juste chaque jour : acquise au jour ${sday}.`);
const before = P.card('s:omou.na').s;
P.review('s:omou.na', 1);
if (!(P.card('s:omou.na').s < before)) fail('un raté doit faire baisser la stabilité');

// ---------- structures reconnues dans les réponses ----------
const LOST = /と(思|おも)|かもしれ|そう(だ|です)|(ん|の)です|と(言|い)って/;
const KNOWN = new Set(P.STRUCTS);
let n = 0;
for (const [id, lines] of Object.entries(D.DIALOGUES)) {
  lines.forEach((l, i) => {
    if (l.who !== 'player') return;
    for (const jp of l.choices ? l.choices.map((c) => c.jp) : [l.jp]) {
      const ss = P.structuresOf(jp);
      for (const s of ss) if (!KNOWN.has(s)) fail(`${id}:${i} : structure inconnue ${s}`);
      if (LOST.test(jp) && !ss.length) fail(`${id}:${i} : aucune structure reconnue dans ${jp}`);
      if (ss.length) n++;
      if (show) console.log(`${id}:${i}  ${jp.replace(/\{([^|}]+)\|[^}]+\}/g, '$1')}  →  ${ss.map((s) => P.label(s)).join(', ') || '—'}`);
    }
  });
}
const expect = {
  '{大丈夫|だいじょうぶ}だと{思|おも}います。': ['s:omou.na'],
  '{悪|わる}い{影|かげ}じゃないかもしれません。': ['s:kamo.no'],
  '{今年|ことし}は{寒|さむ}かったんですか。': ['s:ndesu.ia'],
  'おじいさんは、「{太一|たいち}は、いい{職人|しょくにん}になると{思|おも}う」と{言|い}っていました。': ['s:omou.ve', 's:inyou'],
};
for (const [jp, want] of Object.entries(expect)) {
  const got = P.structuresOf(jp);
  if (got.join() !== want.join()) fail(`structuresOf(${jp}) : ${got.join()} au lieu de ${want.join()}`);
}
console.log(`Structures reconnues dans ${n} réponses du joueur.`);

// ---------- bilan de la semaine ----------
P.reset();
now = new Date('2026-11-17T21:00:00').getTime(); // mardi
P.logSpeech(9000);
P.logSentence(true);
P.logSentence(false);
P.review('s:kamo.ve', 3);
now = new Date('2026-11-19T02:00:00').getTime(); // nuit de mercredi à jeudi : compte pour mercredi
P.logSpeech(3000);
if (P.dayOf() !== '2026-11-18') fail(`après minuit, la partie compte pour la veille (${P.dayOf()})`);
let w = P.week(0);
if (w.start !== '2026-11-16') fail(`la semaine commence le lundi (${w.start})`);
if (w.ms !== 12000 || w.said !== 2 || w.ok !== 1 || w.active !== 2) fail(`bilan faux : ${JSON.stringify(w)}`);
if (P.weeklyDue()) fail('pas de bilan automatique si la semaine d’avant est vide');
now = new Date('2026-11-23T11:00:00').getTime(); // lundi suivant
if (!P.weeklyDue()) fail('le premier jour d’une nouvelle semaine, le bilan de la précédente s’ouvre');
if (P.weeklyDue()) fail('le bilan automatique ne s’ouvre qu’une fois par semaine');
w = P.week(1);
if (w.ms !== 12000 || P.weeksBack() !== 1) fail('la semaine précédente reste consultable');
console.log('Bilan de la semaine vérifié.');

// ---------- sauvegarde complète ----------
P.flush();
mem.set('kotodama.world.v1', '{"v":1,"place":"kirino"}');
const file = P.backup();
mem.clear();
mem.set('kotodama.world.v1', '{"v":1,"place":"ailleurs"}');
if (P.restore('pas du json')) {
  /* message attendu */
} else fail('un fichier qui n’est pas une sauvegarde doit être refusé');
const err = P.restore(file);
if (err) fail('sauvegarde refusée : ' + err);
if (!mem.get('kotodama.world.v1')?.includes('kirino') || !mem.get('kotodama.progress.v1')) fail('la sauvegarde ne restaure pas tout');
if (P.week(1).ms !== 12000) fail('la progression restaurée est perdue');
console.log('Sauvegarde complète : export et import vérifiés.');

if (fails) {
  console.error(`${fails} problème(s) dans le suivi.`);
  process.exit(1);
}
console.log('Suivi caché vérifié.');
process.exit(0);
