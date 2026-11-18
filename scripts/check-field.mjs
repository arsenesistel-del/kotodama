// Vérifie les rencontres (session 10, REFONTE.md) : le niveau d'une bête règle la difficulté de sa phrase (tableau),
// un combat dure 2 à 4 phrases, les espèces se montrent au fil de l'histoire, chaque phrase d'une bête est acceptée
// par le moteur, le 渡り gagne des niveaux, le butin est plus riche quand la phrase était dure, la clochette marche.
import { runnerImport } from 'vite';

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { module: X } = await runnerImport('/scripts/field-entry.ts');
const { F, S, M, H, D, C } = X;
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
// Session 12 : la courbe est réglée sur la partie entière (scripts/check-balance.mjs) ; ici, un ordre de grandeur.
if (total < 4000 || total > 10000) fail(`expérience jusqu'au niveau 10 : ${total}`);
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
const want = F.beastXp(b, 1, true);
const o = F.calm(b, { crits: 1, clean: true, hard: 1, hp: 4 });
eq(F.field().beasts.uwasadori.calmed, 1, 'bête apaisée au 図鑑');
if (sum(F.field().bag) !== sum(o.loot) || !sum(o.loot)) fail('le butin n’est pas dans le sac');
if (o.xp !== want) fail('expérience');

// Session 12 : une bête trop faible rapporte moins ; une série sans coup reçu (連鎖) rapporte plus, jusqu'à +50 %.
{
  const weak = { sp: 'tsubuyaki', lvl: 1, rare: false };
  if (!(F.beastXp(weak, 0, true, 8, 0) < F.beastXp(weak, 0, true, 3, 0))) fail('une bête trop faible doit rapporter moins');
  const mid = { sp: 'tsubuyaki', lvl: 5, rare: false };
  const x0 = F.beastXp(mid, 0, true, 5, 0), x3 = F.beastXp(mid, 0, true, 5, 3), x9 = F.beastXp(mid, 0, true, 5, 9);
  if (!(x3 > x0 && x9 === Math.round(x0 * 1.5))) fail(`連鎖 : ${x0}, ${x3}, ${x9}`);
  if (F.beastXp(mid, 0, false, 5, 4) !== F.beastXp(mid, 0, false, 5, 0)) fail('連鎖 : un coup reçu, pas de bonus');
  F.resetField();
  F.calm(mid, { crits: 0, clean: true, hard: 0, hp: 5 });
  F.calm(mid, { crits: 0, clean: true, hard: 0, hp: 5 });
  eq(F.field().chain, 2, 'deux combats sans coup reçu');
  F.calm(mid, { crits: 0, clean: false, hard: 0, hp: 4 });
  eq(F.field().chain, 0, 'un coup reçu rompt la chaîne');
}

// Session 12 : おみつ et 萬作. On ne paie que ce qu'on a, les pièces se posent une fois et font leur effet,
// les dango soignent, le 守り札 sert une fois, le 呼び札 rend les 朱 plus fréquents pour dix rencontres.
{
  const ws = S.world();
  ws.quests = {};
  F.resetField();
  eq(C.offered('mansaku').length, 0, '萬作 ne fabrique rien avant le moulin');
  eq(C.offered('omitsu').map((r) => r.id), ['mitarashi'], 'avant le col, seulement les みたらし');
  eq(C.make('mitarashi'), false, 'pas de riz, pas de dango');
  F.field().bag.kome = 5;
  eq(C.make('mitarashi'), true, 'みたらし pour deux mesures de riz');
  eq([F.field().bag.kome, F.field().items.mitarashi], [3, 1], 'riz pris, dango dans le sac');
  F.field().hp = 1;
  eq(C.eat(), 3, 'une みたらし rend trois PV');
  eq(C.eat(), 0, 'plus de dango');
  ws.quests.c1 = { step: 'done', heard: [] };
  ws.quests.c2 = { step: 'done', heard: [] };
  ws.quests.c3 = { step: 'done', heard: [] };
  eq(C.offered('mansaku').length, 6, 'après le pont, les six commandes de 萬作');
  const lv = F.field().lvl, hp0 = F.hpMax(), t0 = F.timeNow();
  Object.assign(F.field().bag, { ito: 19, washi: 19, mokuhen: 19, sumi: 19, teppen: 19 });
  for (const id of ['tsukamaki', 'tsuba', 'tsuka', 'saya']) eq(C.make(id), true, `pièce ${id}`);
  eq(C.make('tsuba'), false, 'une pièce ne se pose qu’une fois');
  eq([F.hpMax() - hp0, +(F.timeNow() - t0).toFixed(2), F.critBonus(), F.bossDmg()], [1, 0.5, 500, 1.2], 'effets des pièces');
  eq(F.maxHp(lv) + 1, F.hpMax(), 'la garde ajoute un PV au niveau');
  eq(C.make('mamori'), true, '守り札');
  eq(C.useMamori(), true, 'le 守り札 pare un coup');
  eq(C.useMamori(), false, 'il ne sert qu’une fois');
  eq(C.make('yobi'), true, '呼び札');
  eq(C.useYobi(), true, 'le 呼び札 agit');
  eq(F.rareChance(), 1 / 4, 'une variante 朱 sur quatre');
  for (let i = 0; i < 10; i++) F.meet({ sp: 'tsubuyaki', lvl: 2, rare: false });
  eq(F.rareChance(), 1 / 16, 'après dix rencontres, une sur seize');
  // Les phrases du comptoir : quatre au plus, et toujours de quoi s'en aller chez 萬作.
  for (const m of ['omitsu', 'mansaku']) {
    const l = C.pick(m);
    if (l.choices.length > 4) fail(`${m} : ${l.choices.length} phrases proposées`);
    for (const c of l.choices) if (!D.DIALOGUES[c.goto]) fail(`${m} : réponse ${c.goto} manquante`);
  }
  if (!C.pick('mansaku').choices.some((c) => c.act === 'leave')) fail('萬作 : pas de phrase pour s’en aller');
  // はじめから : le 渡り repart du niveau 1, le 図鑑 reste.
  F.field().lvl = 7;
  F.meet({ sp: 'mayoiga', lvl: 7, rare: false });
  F.newRun();
  eq([F.field().lvl, F.field().parts.tsuba ?? false, !!F.field().beasts.mayoiga], [1, false, true], 'nouvelle partie');
}

// La clochette : il faut l'avoir.
F.resetField();
eq(F.toggleBell(true), false, 'pas de clochette sans l’avoir trouvée');
F.giveBell();
eq(F.toggleBell(true), true, 'clochette qui tinte');

// Les quêtes de chasse (session 11) : seules comptent la bonne bête, dans la bonne zone, apaisée après la demande.
F.resetField();
const wh = S.world();
wh.quests = {};
wh.hunts = {};
wh.seen = {};
eq(H.talkPlan('gonbei'), null, 'quête du 権兵衛 avant le moulin');
wh.quests.c1 = { step: 'done', heard: [] };
for (const h of H.HUNTS) {
  if (h.sp && !F.speciesById(h.sp)) fail(`quête ${h.id} : espèce inconnue ${h.sp}`);
  if (h.zone && !M.MAPS.susuki.zones.some((z) => z.name === h.zone)) fail(`quête ${h.id} : zone inconnue ${h.zone}`);
}
const hz = M.MAPS.susuki.zones.find((z) => z.name === '野原の入口');
F.calm({ sp: 'uwasadori', lvl: 2, rare: false, zone: hz.name }, { crits: 0, clean: true, hard: 0, hp: 5 }); // avant la demande : ne compte pas
const give = H.talkPlan('gonbei');
eq(give?.ids, ['h2:give'], 'la demande du 権兵衛');
give.after();
const h2 = H.huntById('h2');
eq(H.progress(h2), 0, 'une bête apaisée avant la demande');
F.calm({ sp: 'tsubuyaki', lvl: 2, rare: false, zone: hz.name }, { crits: 0, clean: true, hard: 0, hp: 5 }); // mauvaise espèce
F.calm({ sp: 'uwasadori', lvl: 5, rare: false, zone: '野原の中' }, { crits: 0, clean: true, hard: 0, hp: 5 }); // mauvaise zone
eq(H.progress(h2), 0, 'mauvaise espèce ou mauvaise zone');
eq(H.talkPlan('gonbei')?.ids, ['h2:wait'], 'pas fini : il redit sa demande');
for (let i = 0; i < 3; i++) F.calm({ sp: 'uwasadori', lvl: 2, rare: false, zone: hz.name }, { crits: 0, clean: true, hard: 0, hp: 5 });
eq(H.progress(h2), 3, 'trois oiseaux');
eq(H.marker('gonbei'), '！', 'marqueur : rapport à faire');
const kome = F.field().bag.kome ?? 0;
const done = H.talkPlan('gonbei');
eq(done?.ids, ['h2:done'], 'le compte rendu');
done.after();
eq((F.field().bag.kome ?? 0) - kome, 3, 'récompense en riz');
eq(H.talkPlan('gonbei'), null, 'quête finie');
// Matériaux : おたね prend ses cinq fils.
const t = H.talkPlan('otane');
t.after();
F.field().bag.ito = 6;
eq(H.ready(H.huntById('h3')), true, 'cinq fils dans le sac');
H.talkPlan('otane').after();
eq(F.field().bag.ito, 1, 'les fils sont donnés');
for (const h of H.HUNTS) for (const k of ['give', 'wait', 'done']) if (!D.DIALOGUES[`${h.id}:${k}`]) fail(`quête ${h.id} : dialogue ${k} manquant`);

if (fails) {
  console.error(`${fails} problème(s) dans les rencontres.`);
  process.exit(1);
}
console.log(`Rencontres vérifiées : niveaux 1 à 10, ${items} phrases de bêtes acceptées, expérience, butin, clochette, quêtes de chasse, commandes chez おみつ et 萬作.`);
