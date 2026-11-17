// Refaire les voix des figurants avec VOICEVOX, sur ton PC (le moteur ne tourne pas dans les sessions de Claude).
// 1. Ouvre VOICEVOX (l'application suffit : elle lance le moteur sur http://127.0.0.1:50021).
// 2. Dans le dossier du dépôt : node tools/voicevox.mjs
// Le script écrit src/assets/voice/<réplique>.wav pour chaque figurant, met à jour src/assets/voice/index.json,
// puis tu pousses. Pour changer de voix : `node tools/voicevox.mjs --list` affiche les voix et leurs numéros,
// et SPEAKERS ci-dessous dit qui parle avec laquelle. Crédit obligatoire dans CREDITS.md : « VOICEVOX:nom ».
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

const API = 'http://127.0.0.1:50021';
const SPEAKERS = {
  otane: { id: 20, name: 'もち子さん', speed: 0.85, pitch: -0.03 },
  gonbei: { id: 13, name: '青山龍星', speed: 0.85, pitch: 0 },
};

if (process.argv.includes('--list')) {
  for (const s of await (await fetch(API + '/speakers')).json()) console.log(s.name, s.styles.map((x) => `${x.name}=${x.id}`).join(' '));
  process.exit(0);
}

const lines = JSON.parse(execFileSync('node', ['scripts/voice-lines.mjs'], { encoding: 'utf8' }));
const indexPath = 'src/assets/voice/index.json';
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {};
for (const l of lines) {
  const sp = SPEAKERS[l.who];
  if (!sp) continue;
  const q = await (await fetch(`${API}/audio_query?speaker=${sp.id}&text=${encodeURIComponent(l.tts)}`, { method: 'POST' })).json();
  q.speedScale = sp.speed;
  q.pitchScale = sp.pitch;
  const wav = Buffer.from(await (await fetch(`${API}/synthesis?speaker=${sp.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) })).arrayBuffer());
  const old = index[l.file];
  if (old && old.ext !== 'wav' && existsSync(`src/assets/voice/${l.file}.${old.ext}`)) unlinkSync(`src/assets/voice/${l.file}.${old.ext}`);
  writeFileSync(`src/assets/voice/${l.file}.wav`, wav);
  index[l.file] = { id: l.id, who: l.who, text: l.text, tts: l.tts, engine: 'voicevox', voice: `VOICEVOX:${sp.name}`, voice_id: String(sp.id), ext: 'wav' };
  console.log(`${l.file}  ${l.text}`);
}
writeFileSync(indexPath, JSON.stringify(index, null, 1) + '\n');
console.log('Voix VOICEVOX écrites. Ajoute le crédit « VOICEVOX:… » dans CREDITS.md pour chaque voix employée.');
