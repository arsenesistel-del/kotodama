// Équilibrage du chapitre 1 (session 12) : on joue le chapitre avec les vraies règles du jeu (tirages des rencontres,
// expérience, butin, recettes, PV et dégâts des boss) et un joueur moyen modélisé (temps par phrase, taux d'erreur,
// coups critiques). Le joueur « conseillé » arrive au niveau conseillé de chaque boss avant de l'affronter,
// fait les quêtes de chasse et commande ce qu'il peut payer. On vérifie :
//  - la durée du chapitre : 5 à 8 heures en suivant les niveaux conseillés ;
//  - pas de remplissage : aucune étape ne demande plus d'une heure dans les herbes, et chaque niveau se gagne en
//    une trentaine de combats au plus dans la bonne zone ;
//  - la progression du scripté vers le libre : le joueur conseillé passe par Lire (1 à 3), le négatif (4 à 6),
//    le passé (7 à 9) avant d'entendre des phrases seulement (10), et la brume du fond tient jusqu'au col ;
//  - les boss : gagnés le plus souvent au niveau conseillé, plus durs mais possibles trois niveaux en dessous ;
//  - l'économie : toutes les pièces du sabre sont payables avant le dernier boss, et les dango servent.
// `node scripts/check-balance.mjs --report` affiche le détail (étape par étape).
import { runnerImport } from 'vite';

// Tirages reproductibles : le même résultat à chaque `npm test`.
let seed = 20261118;
Math.random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const { module: X } = await runnerImport('/scripts/balance-entry.ts');
const { F, S, M, H, Q, C, D } = X;
const E = await import('../src/combat/engine.js');

const REPORT = process.argv.includes('--report');
let fails = 0;
const fail = (m) => {
  fails++;
  console.error('✗ ' + m);
};

// ---------- le joueur moyen ----------
// Hypothèses (à revoir après la partie à la voix d'Arsène) : secondes par phrase juste, risque d'erreur,
// chance de commencer à parler assez tôt pour un coup critique, selon ce que demande le niveau de la bête.
const band = (lvl) => (lvl <= 3 ? 0 : lvl <= 6 ? 1 : lvl <= 9 ? 2 : 3);
const SAY = [7, 8.5, 9.5, 10.5]; // secondes par phrase juste (lire la consigne, dire, retour)
const ERR = [0.06, 0.14, 0.2, 0.26]; // une phrase ratée
const CRIT = [0.55, 0.4, 0.3, 0.25]; // départ en moins de 3,5 s
const RIPOSTE = 9; // une phrase ratée coûte la riposte
const FIGHT = 13; // éclair, bandeau, panneau de fin, retour dans les herbes
const WALK = 4; // marcher jusqu'à la prochaine rencontre (une chance sur neuf par case, 4,5 cases par seconde)
const TRIP = 75; // aller au salon de thé et revenir dans les herbes
const ORDER = 18; // une commande dite à voix haute
// Boss : risque d'erreur selon ce qu'ils mêlent, et coût fixe (bandeaux, phrase apaisée, résultat).
const BOSS_ERR = { 'c-kake': 0.12, 'c-yuragi': 0.15, 'c-tsubu': 0.15, 'c-kuzure': 0.17, 'c-mayoi': 0.18, 'c-kiri': 0.22 };
const BOSS_SAY = 9.5, BOSS_CRIT = 0.35, BOSS_FIX = 60, RIGHT = 0.8;
// Temps d'une réplique : PNJ (voix lente pour le voyageur, lecture, un mot touché de temps en temps), ワケ, panneau,
// phrase du joueur (lire, dire, parfois redire).
const LINE = { npc: 8, wake: 4, sign: 5, player: 13 };

// ---------- l'histoire : répliques jouées à chaque étape ----------
const SEG = [
  { id: 'start', pre: ['pro', 'arrival', 'tour', 'post', 'sign-pass', 'sign-north', 'sign-south', 'sign-east', 'mansaku', 'omitsu', 'taichi', 'otane', 'gonbei', 'chaya', 'ie', 'mill', 'yashiro', 'omikuji', 'ema', 'board', 'stall', 'door', 'gossip', 'tomb-otsuyu', 'susuki', 'sign-susuki'], walk: 14 },
  { id: 'c1', pre: ['c1', 'site-mill', 'h1'], walk: 5 },
  { id: 'c2', pre: ['c2', 'site-jizo', 'h2', 'h3', 'craft', 'mansaku:craft', 'mansaku:more', 'mansaku:make'], walk: 6 },
  { id: 'r1', pre: ['r1', 'site-well'], walk: 3 },
  { id: 'c3', pre: ['c3', 'sign-bridge', 'h4', 'omitsu:sanshoku'], walk: 5 },
  { id: 'r2', pre: ['r2', 'site-scarecrow'], walk: 3 },
  { id: 'c4', pre: ['c4', 'h5', 'ep'], walk: 6 },
];
function storyTime(seg) {
  let t = seg.walk * 60;
  for (const [k, ls] of Object.entries(D.DIALOGUES)) {
    if (k === 'craft:orders' || !seg.pre.some((p) => k === p || k.startsWith(p + ':'))) continue;
    for (const l of ls) t += LINE[l.who] ?? LINE.npc;
  }
  return t;
}

// ---------- une rencontre ----------
const rnd = () => Math.random();
function fight(b, clock) {
  const spec = F.levelSpec(b.lvl), k = band(b.lvl), n = F.beastStage(b).enc.n;
  const crit = Math.min(0.9, CRIT[k] + (F.critBonus() ? 0.1 : 0));
  let hp = F.field().hp, crits = 0, hits = 0, t = FIGHT + WALK;
  for (let i = 0; i < n; ) {
    t += SAY[k] + (spec.listen ? 1.5 : 0);
    if (rnd() < ERR[k]) {
      hp--, hits++, (t += RIPOSTE);
      if (hp <= 0) break;
      continue;
    }
    if (rnd() < crit) crits++;
    i++;
  }
  clock.t += t;
  clock.fights++;
  clock.sentences += n + hits;
  clock.bands[k]++;
  if (hp <= 0) {
    F.setHp(0);
    clock.t += TRIP;
    clock.downs++;
    F.heal();
    return null;
  }
  F.meet(b);
  return F.calm(b, { crits, clean: hits === 0, hard: rnd() < 0.3 ? 1 : 0, hp });
}

// ---------- une chasse de boss (game.js : 7 de dégâts, critique ×2, bonne déduction ×1,5, 奥義 ×3, série, 崩, 怒) ----------
function boss(id, clock) {
  const st = E.CONTRACT_STAGES.find((s) => s.id === id);
  const edge = rnd() < RIGHT ? 1.5 : 1;
  for (let tries = 1; tries <= 6; tries++) {
    let mhp = st.hp, php = F.hpMax(), combo = 0, stance = 0, stag = false, raged = false, mamori = (F.field().items.mamori ?? 0) > 0, t = BOSS_FIX;
    const crit = Math.min(0.9, BOSS_CRIT + (F.critBonus() ? 0.1 : 0));
    while (mhp > 0 && php > 0) {
      t += BOSS_SAY;
      const ougi = stag;
      if (rnd() < BOSS_ERR[id] + (raged ? 0.04 : 0)) {
        combo = 0;
        if (ougi) (stag = false), (stance = 0);
        else {
          if (mamori) (mamori = false), C.useMamori();
          else php--;
          stance = Math.max(0, stance - 25);
          t += RIPOSTE;
          if (rnd() < 0.8) mhp -= 6;
        }
        continue;
      }
      const c = rnd() < crit;
      combo++;
      mhp -= 7 * edge * (c ? 2 : 1) * (ougi ? 3 : 1) * (1 + Math.min(combo - 1, 5) * 0.05) * F.bossDmg();
      if (ougi) (stag = false), (stance = 0);
      else stance = Math.min(100, stance + (c ? 34 : 15) * edge);
      if (stance >= 100) stag = true;
      if (!raged && mhp <= st.hp / 2) raged = true;
    }
    clock.t += t;
    clock.bossSent += Math.round((t - BOSS_FIX) / BOSS_SAY);
    if (mhp <= 0) return tries;
    clock.t += TRIP; // défaite : retour au salon de thé, puis on recommence
    F.heal();
  }
  return 7;
}

// ---------- ce qu'on commande en passant au village ----------
const PRIORITY = ['tsukamaki', 'tsuka', 'tsuba', 'saya'];
function shop(clock, beforeBoss) {
  F.heal();
  for (const id of PRIORITY) if (C.make(id)) (clock.t += ORDER), clock.made.push(`${id}@${clock.seg}`);
  if (beforeBoss && !(F.field().items.mamori ?? 0) && C.make('mamori')) (clock.t += ORDER), clock.made.push(`mamori@${clock.seg}`);
  // Le reste du riz part en dango (on en garde de quoi tenir une sortie).
  while ((F.field().items.mitarashi ?? 0) < 4 && C.make('mitarashi')) clock.t += ORDER / 2;
  if ((F.field().items.sanshoku ?? 0) < 1 && C.make('sanshoku')) clock.t += ORDER / 2;
}

// ---------- les quêtes de chasse ----------
function takeHunts() {
  for (const h of H.HUNTS) {
    const p = H.talkPlan(h.giver);
    if (p && p.ids[0] === h.id + ':give') p.after();
  }
}
function returnHunts(clock) {
  for (const h of H.HUNTS) if (H.ready(h)) H.talkPlan(h.giver).after(), clock.hunts++;
}

// ---------- la zone où l'on chasse ----------
const ZONES = M.MAPS.susuki.zones;
const pondOpen = () => S.world().quests.c2?.step === 'done';
const isOpen = (z) => z.lv[0] < 6 || pondOpen();
function zoneFor() {
  const lvl = F.field().lvl;
  // Une quête de chasse en cours dans une zone ouverte passe avant.
  for (const h of H.HUNTS) {
    if (H.stateOf(h)?.step !== 'given' || !h.zone || H.ready(h)) continue;
    const z = ZONES.find((x) => x.name === h.zone);
    if (z && isOpen(z)) return z;
  }
  return [...ZONES].reverse().find((z) => isOpen(z) && z.lv[0] <= lvl) ?? ZONES[0];
}

function farm(clock, until) {
  const startLv = F.field().lvl;
  const per = {};
  let guard = 0;
  while (guard++ < 3000) {
    returnHunts(clock);
    const huntLeft = H.HUNTS.some((h) => H.stateOf(h)?.step === 'given' && !H.ready(h) && (!h.zone || isOpen(ZONES.find((z) => z.name === h.zone))));
    if (F.field().lvl >= until && !huntLeft) break;
    const f = F.field();
    if (f.hp <= Math.ceil(F.hpMax() / 3)) {
      if (C.eat()) (clock.eaten++, (clock.t += 3));
      else (clock.t += TRIP), shop(clock, false);
    }
    const lv = f.lvl;
    const b = F.roll(zoneFor());
    const o = fight(b, clock);
    if (o) per[lv] = (per[lv] ?? 0) + 1;
    clock.maxBeast = Math.max(clock.maxBeast, b.lvl);
    clock.firstListen ??= F.levelSpec(b.lvl).listen ? `${clock.seg} (Lv ${F.field().lvl})` : undefined;
  }
  returnHunts(clock);
  return { per, from: startLv };
}

// ---------- une partie entière ----------
const STEPS = ['c1', 'c2', 'r1', 'c3', 'r2', 'c4'];
function play(policy) {
  store.clear();
  F.resetField();
  const w = S.world();
  Object.assign(w, { quests: {}, hunts: {}, seen: {}, flags: { prologue: true, wake: true }, en: {} });
  const clock = { t: 0, seg: 'start', fights: 0, sentences: 0, bossSent: 0, downs: 0, eaten: 0, hunts: 0, made: [], bands: [0, 0, 0, 0], rows: [], maxBeast: 0, perLevel: {}, firstListen: undefined };
  F.giveBell();
  clock.t += storyTime(SEG[0]);
  for (const id of STEPS) {
    const q = Q.questById(id);
    clock.seg = id;
    const t0 = clock.t, f0 = clock.fights;
    clock.t += storyTime(SEG.find((s) => s.id === id));
    w.quests[id] = { step: 'given', heard: [...q.witnesses] };
    for (const p of ['taichi', 'omitsu', 'mansaku', 'otane', 'gonbei']) w.seen['talk:' + p] = true;
    takeHunts();
    const tf = clock.t;
    const target = policy === 'rec' ? q.rec : policy === 'low' ? Math.max(1, q.rec - 3) : 0;
    const { per } = farm(clock, target);
    for (const [l, n] of Object.entries(per)) clock.perLevel[l] = (clock.perLevel[l] ?? 0) + n;
    const field = clock.t - tf;
    shop(clock, true);
    const lvl = F.field().lvl;
    const tries = boss(q.stage, clock);
    F.gainXp(F.storyXp(q.stage === 'c-kiri' ? 'boss' : 'contract'));
    w.quests[id].step = 'done';
    F.gainXp(F.storyXp('report'));
    clock.rows.push({ id, rec: q.rec, lvl, tries, field: field / 60, step: (clock.t - t0) / 60, fights: clock.fights - f0 });
  }
  clock.made.sort();
  return clock;
}

// ---------- les chiffres ----------
const RUNS = 100;
const runs = (policy) => Array.from({ length: RUNS }, () => play(policy));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))];
const h = (s) => `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')}`;

const rec = runs('rec');
const total = rec.map((r) => r.t);
const T = mean(total);
if (T < 5 * 3600 || T > 8 * 3600) fail(`chapitre conseillé : ${h(T)} (attendu entre 5 et 8 heures)`);
if (pct(total, 0.1) < 4.5 * 3600 || pct(total, 0.9) > 8.5 * 3600) fail(`chapitre conseillé, écart trop large : ${h(pct(total, 0.1))} à ${h(pct(total, 0.9))}`);

// Pas de remplissage : chaque étape demande au plus une heure dans les herbes, et chaque niveau une vingtaine de combats.
for (const id of STEPS) {
  const fm = mean(rec.map((r) => r.rows.find((x) => x.id === id).field));
  if (fm > 60) fail(`${id} : ${Math.round(fm)} min dans les herbes avant le boss (une heure au plus)`);
}
for (let l = 1; l < 9; l++) {
  const n = mean(rec.map((r) => r.perLevel[l] ?? 0));
  if (n > 32) fail(`niveau ${l} → ${l + 1} : ${n.toFixed(1)} combats (32 au plus)`);
}

// Du scripté vers le libre : on passe par chaque palier, dans l'ordre, et les phrases entendues arrivent à la fin.
const bands = [0, 1, 2, 3].map((k) => mean(rec.map((r) => r.bands[k])));
if (bands.some((n) => n < 8)) fail(`chaque palier de niveaux doit être travaillé : ${bands.map((n) => n.toFixed(0)).join(' / ')}`);
const firstListen = rec.map((r) => r.firstListen ?? '—');
if (firstListen.some((x) => /^(c1|c2|r1)/.test(x))) fail(`phrases entendues trop tôt : ${firstListen.find((x) => /^(c1|c2|r1)/.test(x))}`);
for (const r of rec) {
  for (const row of r.rows) if (row.lvl < row.rec) fail(`${row.id} : joueur conseillé au niveau ${row.lvl} (conseillé ${row.rec})`);
}
// Les boss suivent le même tableau, un cran au-dessus de leur niveau conseillé : pas de forme, de 祓 ni d'écoute
// qu'une bête de ce niveau ne demanderait pas.
for (const q of Q.QUESTS) {
  const st = E.CONTRACT_STAGES.find((s) => s.id === q.stage), sp = F.levelSpec(q.rec + 1);
  const extra = st.forms.filter((f) => !sp.forms.includes(f));
  if (extra.length) fail(`${q.id} (conseillé ${q.rec}) : formes ${extra.join(', ')} au-delà du tableau`);
  if (!!st.broken !== sp.broken) fail(`${q.id} (conseillé ${q.rec}) : phrases déformées ${st.broken ? 'trop tôt' : 'manquantes'}`);
  if (!!st.listen && !sp.listen) fail(`${q.id} (conseillé ${q.rec}) : phrases entendues trop tôt`);
  if (st.timer > sp.timer) fail(`${q.id} (conseillé ${q.rec}) : ${st.timer} s pour répondre, plus que les bêtes du même niveau (${sp.timer} s)`);
}
const recs = STEPS.map((id) => Q.questById(id).rec);
if (recs.some((r, i) => i && r < recs[i - 1])) fail(`niveaux conseillés dans le désordre : ${recs.join(', ')}`);

// Les boss : gagnés le plus souvent au premier essai au niveau conseillé ; trois niveaux en dessous, plus dur mais possible.
const low = runs('low');
for (const id of STEPS) {
  const first = mean(rec.map((r) => (r.rows.find((x) => x.id === id).tries === 1 ? 1 : 0)));
  const lowFirst = mean(low.map((r) => (r.rows.find((x) => x.id === id).tries === 1 ? 1 : 0)));
  const lowWin = mean(low.map((r) => (r.rows.find((x) => x.id === id).tries <= 3 ? 1 : 0)));
  if (first < 0.7) fail(`${id} : gagné du premier coup ${Math.round(first * 100)} % au niveau conseillé (70 % au moins)`);
  if (lowWin < 0.5) fail(`${id} : trois niveaux en dessous, gagné en trois essais ${Math.round(lowWin * 100)} % (possible, attendu 50 % au moins)`);
  if (REPORT) console.log(`  ${id} : premier coup ${Math.round(first * 100)} % (conseillé), ${Math.round(lowFirst * 100)} % (3 niveaux en dessous)`);
}

// L'économie : les quatre pièces du sabre avant le dernier boss, les dango mangés, les quêtes de chasse rendues.
for (const p of PRIORITY) {
  const got = mean(rec.map((r) => (r.made.some((m) => m.startsWith(p + '@') && !m.endsWith('@c4')) ? 1 : 0)));
  if (got < 0.8) fail(`${p} : posé avant le dernier boss dans ${Math.round(got * 100)} % des parties (80 % au moins)`);
}
if (mean(rec.map((r) => r.eaten)) < 3) fail(`dango : ${mean(rec.map((r) => r.eaten)).toFixed(1)} mangés dans les herbes`);
if (mean(rec.map((r) => r.hunts)) < 4.5) fail(`quêtes de chasse rendues : ${mean(rec.map((r) => r.hunts)).toFixed(1)} sur 5`);

// Les recettes : chaque artisan a ses répliques, chaque matériau d'une recette tombe d'une bête débloquée avant.
for (const r of C.RECIPES) {
  if (!D.DIALOGUES[`${r.maker}:make:${r.id}`]) fail(`${r.id} : réplique ${r.maker}:make:${r.id} manquante`);
  for (const m of Object.keys(r.cost)) {
    const from = F.SPECIES.filter((s) => s.mats.some(([x]) => x === m));
    if (!from.length) fail(`${r.id} : aucune bête ne laisse ${m}`);
  }
}

if (REPORT) {
  const nm = mean(rec.map((r) => r.fights)), ns = mean(rec.map((r) => r.sentences)), nb = mean(rec.map((r) => r.bossSent));
  console.log(`Joueur conseillé (${RUNS} parties) : ${h(T)} en moyenne (${h(pct(total, 0.1))} à ${h(pct(total, 0.9))}), ${nm.toFixed(0)} combats, ${ns.toFixed(0)} phrases de bêtes, ${nb.toFixed(0)} phrases de boss.`);
  for (const id of STEPS) {
    const rows = rec.map((r) => r.rows.find((x) => x.id === id));
    console.log(`  ${id.padEnd(3)} conseillé Lv ${rows[0].rec} · étape ${mean(rows.map((x) => x.step)).toFixed(0)} min dont ${mean(rows.map((x) => x.field)).toFixed(0)} dans les herbes · ${mean(rows.map((x) => x.fights)).toFixed(0)} combats · Lv ${mean(rows.map((x) => x.lvl)).toFixed(1)} au boss`);
  }
  console.log(`  combats par palier : Lire ${bands[0].toFixed(0)}, négatif ${bands[1].toFixed(0)}, passé ${bands[2].toFixed(0)}, niveau 10 ${bands[3].toFixed(0)}`);
  console.log(`  combats pour passer chaque niveau : ${Object.keys(rec[0].perLevel).map((l) => `${l}→${+l + 1} ${mean(rec.map((r) => r.perLevel[l] ?? 0)).toFixed(0)}`).join(', ')}`);
  console.log(`  défaites dans les herbes ${mean(rec.map((r) => r.downs)).toFixed(1)}, dango mangés ${mean(rec.map((r) => r.eaten)).toFixed(1)}, première phrase entendue : ${firstListen[0]}`);
  console.log(`  commandes (partie type) : ${rec[0].made.join(', ')}`);
  const story = SEG.reduce((a, s) => a + storyTime(s), 0);
  console.log(`  histoire seule (répliques et déplacements) : ${h(story)}`);
  const lowT = mean(low.map((r) => r.t));
  console.log(`Joueur pressé (trois niveaux sous le conseillé) : ${h(lowT)}, Lv ${low[0].rows.map((x) => x.lvl).join(' / ')} aux boss.`);
}

if (fails) {
  console.error(`${fails} problème(s) d'équilibrage.`);
  process.exit(1);
}
console.log(`Équilibrage vérifié : chapitre 1 en ${h(T)} en suivant les niveaux conseillés (${RUNS} parties simulées), boss, économie, paliers.`);
