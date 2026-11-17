// Vérifie les répliques : chaque kanji a sa lecture, chaque mot est dans le lexique (pour le sens au toucher),
// chaque marqueur de 役割語 existe, et aucune réplique d'avant guérison n'emploie les quatre fins perdues.
// Lancé par `npm test`. Avec `--show`, affiche le découpage de chaque réplique.
import { runnerImport } from 'vite';

const { module: D } = await runnerImport('/src/world/dialogue.ts');
const { module: T } = await runnerImport('/src/world/text.ts');
const { module: L } = await runnerImport('/src/world/lexicon.ts');

const show = process.argv.includes('--show');
let fails = 0;
const fail = (m) => {
  fails++;
  console.error('✗ ' + m);
};
const kanji = /[㐀-鿿々]/;
const LOST = ['と思', 'かもしれ', 'そうだ', 'そうです', 'んだ', 'んです', 'んじゃ'];

let lines = 0;
const used = new Set();
for (const [id, list] of Object.entries(D.DIALOGUES)) {
  list.forEach((l, i) => {
    if (!D.SPEAKERS[l.who]) fail(`${id}:${i} : personnage inconnu « ${l.who} »`);
    if (!l.fr) fail(`${id}:${i} : pas de traduction`);
    if (!l.jp) return;
    lines++;
    const segs = T.parse(l.jp);
    for (const s of segs) if (!s.ruby && kanji.test(s.base)) fail(`${id}:${i} : « ${s.base} » sans lecture dans ${l.jp}`);
    const toks = T.tokenize(l.jp);
    for (const t of toks) {
      if (t.punct) continue;
      if (!t.key) fail(`${id}:${i} : « ${t.text} » absent du lexique (${T.plain(l.jp)})`);
      else used.add(t.key);
    }
    const txt = T.plain(l.jp);
    for (const w of LOST) if (txt.includes(w)) fail(`${id}:${i} : fin perdue « ${w} » avant guérison`);
    if (show) console.log(`${id}:${i}  ` + toks.map((t) => (t.punct ? t.text : `[${t.text}${t.key && t.key !== t.text ? '→' + t.key : ''}]`)).join(''));
  });
}

for (const [k, e] of Object.entries(L.LEX)) {
  if (!e.fr || !e.pos) fail(`lexique ${k} : sens ou nature manquant`);
  if (e.marker && !L.MARKERS[e.marker]) fail(`lexique ${k} : marqueur inconnu ${e.marker}`);
  if (e.forms && kanji.test(k) && !e.r) fail(`lexique ${k} : lecture du lemme manquante`);
}
const unused = Object.keys(L.LEX).filter((k) => !used.has(k));
if (unused.length) console.log(`(entrées du lexique pas encore employées : ${unused.join(' ')})`);

if (fails) {
  console.error(`${fails} problème(s) dans les répliques.`);
  process.exit(1);
}
console.log(`Répliques vérifiées : ${lines} en japonais, ${used.size} mots du lexique employés.`);
