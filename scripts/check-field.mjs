// Vérifie les rencontres (session 10, REFONTE.md) : le niveau d'une bête règle la difficulté de sa phrase (tableau),
// un combat dure 2 à 4 phrases, les espèces se montrent au fil de l'histoire, chaque phrase d'une bête est acceptée
// par le moteur, le 渡り gagne des niveaux, le butin est plus riche quand la phrase était dure, la clochette marche.
import { runnerImport } from 'vite';

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { module: X } = await runnerImport('/scripts/field-entry.ts');
const { F, S, M } = X;
const E = await import('../src/combat/engine.js');

let fails = 0;
const fail = (m) => {
  fails++;
  console.error('✗ ' + m);
};
const eq = (a, b, m) => JSON.stringify(a) !== JSON.stringify(b) && fail(`${m} : ${JSON.stringify(a)} au lieu de ${JSON.stringify(b)}`);

// Le tableau des niveaux.
for (let l = 1; l <= 10; l++) {
  const s = F.levelSpec(l);
  if (s.n < 2 || s.n > 4) fail(`Lv ${l} : ${s.n} phrases`);
  if (l <= 3 && (s.scale !== 'lire' || s.forms.some((f) => f !== 'aff'))) fail(`Lv ${l} : phrase entière au présent attendue`);
  if (l >= 4 && l <= 6 && (s.scale !== 'construire' || !s.forms.includes('neg') || s.forms.some((f) => !['aff', 'neg'].includes(f)))) fail(`Lv ${l} : présent et négatif attendus`);
  if (l >= 7 && l <= 9 && (!s.forms.includes('past') || !s.forms.includes('negpast') || s.timer >= F.levelSpec(6).timer)) fail(`Lv ${l} : passé, négatif passé et moins de temps attendus`);
  if (l >= 10 && !(s.broken && s.mixed && s.listen)) fail(`Lv ${l} : 祓, structures mêlées et écoute attendus`);
}

// Les espèces se montrent au fil de l'histoire.
const w = S.world();
eq(F.unlocked().map((s) => s.id), ['tsubuyaki'], 'au début, seule つぶやき');
w.quests.c1 = { step: 'done', heard: [] };
w.quests.c2 = { step: 'done', heard: [] };
eq(F.unlocked().map((s) => s.id), ['tsubuyaki', 'uwasadori', 'mayoiga'], 'après le col, うわさ鳥 et まよい蛾');
w.quests.c3 = { step: 'done', heard: [] };
eq(F.unlocked().length, 4, 'après le pont, les quatre');

// Les zones de 薄野原 tirent dans leur tranche, et toutes les phrases des bêtes sont justes pour le moteur.
const zones = M.MAPS.susuki.zones;
let items = 0;
for (const z of zones)
  for (let i = 0; i < 300; i++) {
    const b = F.roll(z);
    if (b.lvl < z.lv[0] || b.lvl > Math.min(10, z.lv[1] + 1)) fail(`${z.name} : Lv ${b.lvl}`);
    const st = F.beastStage(b);
    if (st.enc.n < 2 || st.enc.n > 5) fail(`${b.sp} Lv ${b.lvl} : ${st.enc.n} phrases`);
    if (!st.keys.some((k) => k.startsWith(F.speciesById(b.sp).frame + '.'))) fail(`${b.sp} : sa fin n'est pas dans ses phrases`);
    const it = E.nextItem(st, {}, null);
    items++;
    if (!st.forms.includes(it.form)) fail(`${b.sp} Lv ${b.lvl} : forme ${it.form} hors du niveau`);
    if (!E.matches(it, it.canon) || !E.matches(it, it.kana)) fail(`phrase refusée : ${it.canon}`);
    if (it.pk + it.fk !== it.canon.slice(it.cue.a.length + 1)) fail(`phrase entière mal découpée : ${it.canon}`);
  }

// Le 渡り : des PV et un peu de temps, jamais la phrase.
F.resetField();
eq([F.maxHp(1), F.maxHp(5), F.maxHp(10)], [5, 7, 9], 'PV par niveau');
let total = 0;
for (let l = 1; l < 10; l++) total += F.xpToNext(l);
if (total < 400 || total > 900) fail(`expérience jusqu'au niveau 10 : ${total}`);
const ups = F.gainXp(F.xpToNext(1) + F.xpToNext(2));
eq(ups, [2, 3], 'deux niveaux gagnés');
eq(F.field().hp, F.maxHp(3), 'un niveau gagné rend les PV');

// Le butin : plus riche en haut de tranche, sur une variante rare, et quand la phrase était dure (règle 6).
const sum = (l) => Object.values(l).reduce((a, b) => a + b, 0);
const avg = (b, hard) => {
  let n = 0;
  for (let i = 0; i < 400; i++) n += sum(F.loot(b, hard));
  return n / 400;
};
const easy = avg({ sp: 'tsubuyaki', lvl: 2, rare: false }, 0), hard = avg({ sp: 'tsubuyaki', lvl: 2, rare: false }, 1);
const top = avg({ sp: 'tsubuyaki', lvl: 9, rare: false }, 0), rare = avg({ sp: 'tsubuyaki', lvl: 2, rare: true }, 0);
if (!(hard > easy && top > easy && rare > easy)) fail(`butin : facile ${easy}, dur ${hard}, haut ${top}, rare ${rare}`);

// Une rencontre gagnée : 図鑑, sac, expérience.
F.resetField();
const b = { sp: 'uwasadori', lvl: 5, rare: false };
F.meet(b);
const o = F.calm(b, { crits: 1, clean: true, hard: 1, hp: 4 });
eq(F.field().beasts.uwasadori.calmed, 1, 'bête apaisée au 図鑑');
if (sum(F.field().bag) !== sum(o.loot) || !sum(o.loot)) fail('le butin n’est pas dans le sac');
if (o.xp !== F.beastXp(b, 1, true)) fail('expérience');

// La clochette : il faut l'avoir.
F.resetField();
eq(F.toggleBell(true), false, 'pas de clochette sans l’avoir trouvée');
F.giveBell();
eq(F.toggleBell(true), true, 'clochette qui tinte');

if (fails) {
  console.error(`${fails} problème(s) dans les rencontres.`);
  process.exit(1);
}
console.log(`Rencontres vérifiées : niveaux 1 à 10, ${items} phrases de bêtes acceptées, expérience, butin, clochette.`);
