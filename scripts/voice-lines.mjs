// Liste des répliques à doubler : une par réplique japonaise d'un personnage (pas le joueur, pas les panneaux).
// Pour chacune : le fichier attendu dans src/assets/voice/, la voix prévue (voir VOICES dans src/world/voice.ts)
// et le texte envoyé au moteur de voix : les mots que le joueur ne sait pas lire et les noms propres sont écrits
// en kana, pour que la voix ne se trompe pas de lecture.
// `node scripts/voice-lines.mjs` affiche la liste en JSON ; `--missing` seulement ce qui manque ou a changé.
import { readFileSync, existsSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module: D } = await runnerImport('/src/world/dialogue.ts');
const { module: T } = await runnerImport('/src/world/text.ts');
const { module: K } = await runnerImport('/src/world/kanji.ts');
const { module: V } = await runnerImport('/src/world/voicefile.ts');

const known = K.knownKanji('N3');
const NAMES = /萬作|太一|権兵衛|水車小屋|年寄|者|明日/; // lectures à imposer
const ttsText = (jp) =>
  T.parse(jp)
    .map((s) => {
      if (!s.ruby) return s.base;
      const hard = [...s.base].some((c) => K.isKanji(c) && !known.has(c));
      return hard || NAMES.test(s.base) ? s.ruby : s.base;
    })
    .join('');

const index = existsSync('src/assets/voice/index.json') ? JSON.parse(readFileSync('src/assets/voice/index.json', 'utf8')) : {};
const out = [];
for (const [id, list] of Object.entries(D.DIALOGUES))
  list.forEach((l, i) => {
    if (!l.jp || l.who === 'player' || l.who === 'sign' || l.who === 'wake') return;
    const file = V.voiceFile(`${id}:${i}`);
    const text = T.plain(l.jp);
    const have = index[file];
    const stale = !have || have.text !== text || !existsSync('src/assets/voice/' + file + '.' + (have.ext ?? 'mp3'));
    out.push({ id: `${id}:${i}`, file, who: l.who, text, tts: ttsText(l.jp), stale });
  });
const missing = process.argv.includes('--missing');
console.log(JSON.stringify(missing ? out.filter((x) => x.stale) : out, null, 1));
