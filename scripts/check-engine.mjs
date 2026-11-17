// Vérifie le générateur de phrases du combat : chaque phrase juste est acceptée,
// chaque phrase déformée (祓) est refusée et reçoit un diagnostic en français.
import { gen, matches, diagnose, ALLKEYS, STAGES, nextItem } from '../src/combat/engine.js';

const N = 400;
let total = 0;
const errors = [];
for (const key of ALLKEYS) {
  for (const form of ['aff', 'neg', 'past']) {
    for (let i = 0; i < N; i++) {
      const it = gen(key, [form]);
      total++;
      if (!matches(it, it.canon)) errors.push(`juste refusée : ${it.canon}`);
      if (diagnose(it, it.canon)) errors.push(`juste diagnostiquée : ${it.canon}`);
      if (matches(it, it.broken.text)) errors.push(`déformée acceptée : ${it.broken.text} (attendu ${it.canon})`);
      if (!diagnose(it, it.broken.text)) errors.push(`déformée sans diagnostic : ${it.broken.text} (attendu ${it.canon})`);
    }
  }
}
for (const stage of STAGES) {
  let last = null;
  for (let i = 0; i < 200; i++) last = nextItem(stage, {}, last);
}

const uniq = [...new Set(errors)];
if (uniq.length) {
  console.error(`${uniq.length} erreurs sur ${total} phrases :`);
  for (const e of uniq.slice(0, 30)) console.error('  ' + e);
  process.exit(1);
}
console.log(`${total} phrases générées, toutes justes acceptées, toutes déformées refusées et diagnostiquées.`);
