// Vérifie les répliques : chaque kanji a sa lecture, chaque mot est dans le lexique (pour le sens au toucher),
// chaque marqueur de 役割語 existe, et aucune réplique d'avant guérison n'emploie les quatre fins perdues.
// Lancé par `npm test`. Avec `--show`, affiche le découpage de chaque réplique.
import { existsSync, readFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module: D } = await runnerImport('/src/world/dialogue.ts');
const { module: T } = await runnerImport('/src/world/text.ts');
const { module: L } = await runnerImport('/src/world/lexicon.ts');
const { module: A } = await runnerImport('/src/world/answer.ts');
const { module: V } = await runnerImport('/src/world/voicefile.ts');
const voices = existsSync('src/assets/voice/index.json') ? JSON.parse(readFileSync('src/assets/voice/index.json', 'utf8')) : {};
const noVoice = [];

const show = process.argv.includes('--show');
let fails = 0;
const fail = (m) => {
  fails++;
  console.error('✗ ' + m);
};
const kanji = /[㐀-鿿々]/;
const LOST = ['と思', 'かもしれ', 'そうだ', 'そうです', 'んだ', 'んです', 'んじゃ'];

let lines = 0;
let answers = 0;
const used = new Set();
// Une réplique japonaise : lectures, lexique, et (sauf pour le joueur) aucune fin perdue.
function checkJp(where, who, jp) {
  lines++;
  const segs = T.parse(jp);
  for (const s of segs) if (!s.ruby && kanji.test(s.base)) fail(`${where} : « ${s.base} » sans lecture dans ${jp}`);
  const toks = T.tokenize(jp);
  for (const t of toks) {
    if (t.punct) continue;
    if (!t.key) fail(`${where} : « ${t.text} » absent du lexique (${T.plain(jp)})`);
    else used.add(t.key);
  }
  const txt = T.plain(jp);
  if (who !== 'player') for (const w of LOST) if (txt.includes(w)) fail(`${where} : fin perdue « ${w} » avant guérison`);
  if (show) console.log(`${where}  ` + toks.map((t) => (t.punct ? t.text : `[${t.text}${t.key && t.key !== t.text ? '→' + t.key : ''}]`)).join(''));
}
// Une réponse du joueur : la bonne phrase est acceptée écrite en clair et en kana, chaque faute prévue est
// refusée et diagnostiquée, et la bonne phrase n'est jamais prise pour une faute.
function checkAnswer(where, jp) {
  answers++;
  const t = A.target(jp);
  const kana = T.parse(jp).map((s) => s.ruby ?? s.base).join('');
  if (!A.accepts(t, t.text)) fail(`${where} : la bonne phrase n'est pas acceptée (${t.text})`);
  if (!A.accepts(t, kana)) fail(`${where} : la bonne phrase en kana n'est pas acceptée (${kana})`);
  if (A.diagnose(t, t.text)) fail(`${where} : la bonne phrase est prise pour une faute`);
  for (const b of t.bad) {
    const wrong = T.plain(b.markup);
    if (A.accepts(t, wrong)) fail(`${where} : la faute « ${wrong} » est acceptée`);
    if (A.diagnose(t, wrong) !== b.msg) fail(`${where} : la faute « ${wrong} » n'est pas diagnostiquée`);
  }
  if (show) console.log(`${where}  réponse : ${t.text}  fautes prévues : ${t.bad.map((b) => T.plain(b.markup)).join(' · ') || 'aucune'}`);
}

for (const [id, list] of Object.entries(D.DIALOGUES)) {
  list.forEach((l, i) => {
    const where = `${id}:${i}`;
    if (!D.SPEAKERS[l.who]) fail(`${where} : personnage inconnu « ${l.who} »`);
    if (!l.fr) fail(`${where} : pas de traduction`);
    if (l.choices) {
      if (l.who !== 'player') fail(`${where} : seul le joueur a des choix`);
      l.choices.forEach((c, k) => {
        if (!c.fr) fail(`${where}/${k} : pas de traduction`);
        if (c.goto && !D.DIALOGUES[c.goto]) fail(`${where}/${k} : dialogue « ${c.goto} » introuvable`);
        checkJp(`${where}/${k}`, 'player', c.jp);
        checkAnswer(`${where}/${k}`, c.jp);
      });
      return;
    }
    if (!l.jp) {
      if (l.who === 'player') fail(`${where} : réponse du joueur sans phrase`);
      return;
    }
    checkJp(where, l.who, l.jp);
    if (l.who === 'player') checkAnswer(where, l.jp);
    else if (l.who !== 'sign' && l.who !== 'wake') {
      // Voix : un fichier par réplique, dont le texte enregistré est encore celui de la réplique.
      const v = voices[V.voiceFile(where)];
      if (!v || v.text !== T.plain(l.jp) || !existsSync(`src/assets/voice/${V.voiceFile(where)}.${v.ext ?? 'mp3'}`)) noVoice.push(where);
    }
  });
}

for (const [k, e] of Object.entries(L.LEX)) {
  if (!e.fr || !e.pos) fail(`lexique ${k} : sens ou nature manquant`);
  if (e.marker && !L.MARKERS[e.marker]) fail(`lexique ${k} : marqueur inconnu ${e.marker}`);
  if (e.forms && kanji.test(k) && !e.r) fail(`lexique ${k} : lecture du lemme manquante`);
}
if (noVoice.length) console.log(`(répliques sans voix ou dont le texte a changé : ${noVoice.join(' ')} ; voir scripts/voice-lines.mjs)`);
const unused = Object.keys(L.LEX).filter((k) => !used.has(k));
if (unused.length) console.log(`(entrées du lexique pas encore employées : ${unused.join(' ')})`);

if (fails) {
  console.error(`${fails} problème(s) dans les répliques.`);
  process.exit(1);
}
console.log(`Répliques vérifiées : ${lines} en japonais dont ${answers} réponses à dire, ${used.size} mots du lexique employés.`);
