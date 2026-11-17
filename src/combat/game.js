/* ===== 言霊 : micro, chasse, progression, interface ===== */
import { STAGES, CONTRACT_STAGES, nextItem, matches, diagnose, norm, med } from './engine.js';
import { S, Scene, Snd, resize } from './scene.js';
import { Mic, SR } from '../mic.js';
import * as Voice from '../world/voice';
import * as Progress from '../world/progress';
import { setBias } from './engine.js';
import * as Field from '../world/field';
const $ = s => document.querySelector(s);
const DEBUG = /debug/.test(location.hash + location.search);
const SAVE_KEY = 'kotodama.v1', FAST = 3500, MAXHP = 5;
let save = { v: 1, stats: {}, stages: {}, total: 0, days: {}, sound: true, intro: false, read: 'ask', frags: {} };
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 1) save = Object.assign(save, s); } catch (e) { } }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
const today = () => new Date().toLocaleDateString('sv-SE');

function micUi() { const el = $('#mic'); if (!el) return; el.textContent = Mic.denied ? 'micro refusé' : Mic.live ? 'micro ouvert' : DEBUG ? 'mode texte' : 'micro coupé'; el.className = Mic.live ? 'on' : 'off'; }

/* ---------- chasse ---------- */
const H = { stage: null, mhp: 0, php: MAXHP, maxhp: MAXHP, php0: MAXHP, tb: 0, hard: 0, item: null, phase: 'idle', combo: 0, best: 0, log: [], t0: 0, tFirst: null, heard: '', deadline: 0, dur: 0, lastSpeech: 0, tries: 0, timers: [], voids: 0, stance: 0, stag: false, raged: false, kind: 'kiri', recent: [], acq: [] };
const later = (f, ms) => { const t = setTimeout(f, ms); H.timers.push(t); return t; };
function clearTimers() { H.timers.forEach(clearTimeout); H.timers = []; }
function show(id) { for (const s of ['hunt', 'result']) $('#' + s).hidden = s !== id; S.hunt = id === 'hunt'; S.title = false; }
// Contrat en cours (chasse lancée depuis le village) : { bonus, final: { id, jp, fr }, back }.
let C = null;
// Rencontre dans les herbes hautes (session 10) : { beast } ; la chasse est courte, voir `stage.enc` (field.ts).
let E = null;
let wiping = false;
function go(fn) { // rideau d'encre entre deux écrans
  if (wiping) return; wiping = true; const w = $('#wipe'); w.className = 'in';
  setTimeout(() => { fn(); w.className = 'out'; setTimeout(() => { w.className = ''; wiping = false; }, 350); }, 310);
}
function flashBanner(txt, cls, ms) { const b = $('#banner'); b.innerHTML = '<b>' + txt + '</b>'; b.className = 'banner in flash ' + (cls || ''); later(() => { b.className = 'banner'; }, ms); }
const rb = (k, r, cls) => /[一-鿿]/.test(k) ? '<ruby' + (cls ? ' class="' + cls + '"' : '') + '>' + k + '<rt>' + r + '</rt></ruby>' : k;
// Suivi caché : un mot dont il a demandé la lecture garde son furigana (pâle quand il s'installe) jusqu'à être acquis.
function aidCls(word) { if (save.read !== 'ask') return ''; const id = Progress.huntWordId(word), c = Progress.card(id); if (!c || !c.l) return ''; const a = Progress.aid(id); return a === 'full' ? 'aid' : a === 'fade' ? 'aid fade' : ''; }
const huntWords = it => [Progress.huntWordId(it.cue.a), Progress.huntWordId(it.cue.b)];
// Une structure à échéance, ou difficile pour le joueur : le butin d'une rencontre est plus riche (règle 6).
function isHard(key) { const id = 's:' + key, c = Progress.card(id); return !!c && (Progress.status(id).due || c.d >= 7 || c.l >= 2); }
// Phrase seulement entendue (haut de tranche) : la voix japonaise de Chrome. Sans elle, on affiche les mots.
let jaVoice = null;
function voices() { try { jaVoice = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang)) || null; } catch (e) { } }
if (window.speechSynthesis) { voices(); speechSynthesis.addEventListener?.('voiceschanged', voices); }
const canListen = () => !!jaVoice || (DEBUG && /listen/.test(location.hash));
function sayAloud(text, done) {
  if (!jaVoice) return later(done, 400);
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.voice = jaVoice; u.rate = 0.88; let ok = false; const end = () => { if (!ok) { ok = true; later(done, 250); } }; u.onend = end; u.onerror = end; speechSynthesis.cancel(); speechSynthesis.speak(u); later(end, 9000); } catch (e) { later(done, 400); }
}

function startHunt(stage) {
  const f = Field.field(), mx = Field.maxHp(f.lvl), php = E ? Math.max(1, Math.min(mx, f.hp || mx)) : mx;
  clearTimers(); Object.assign(H, { stage, mhp: stage.hp, php, maxhp: mx, php0: php, tb: Field.timeBonus(f.lvl), hard: 0, item: null, phase: 'intro', combo: 0, best: 0, log: [], voids: 0, started: Date.now(), stance: 0, stag: false, raged: false, kind: 'kiri', recent: [], acq: [] });
  Scene.setMonster(stage); show('hunt'); hud(); $('#readhint').hidden = true; $('#hunt').classList.add('cine');
  $('#cue').innerHTML = ''; $('#cue').hidden = true; $('#heard').textContent = ''; $('#fb').className = 'fb'; $('#fb').innerHTML = ''; $('#fb').hidden = true; $('#acts').hidden = true; $('#tbar').style.transform = 'scaleX(0)';
  const b = $('#banner'); b.innerHTML = '<b>' + stage.name + '</b><div class="sub"><span>' + stage.fr + '</span><em>' + stage.hint + '</em>' + (C && C.bonus ? '<em class="edge">刃 · ta lame porte la bonne fin : dégâts ×1,5, 崩 plus rapide</em>' : '') + (E && E.beast.rare ? '<em class="edge">朱 · variante rare : plus forte, plus de butin</em>' : '') + '</div>'; b.className = 'banner in' + (E ? ' small' : '');
  $('#quit').textContent = E ? '逃げる · fuir' : 'Quitter'; $('#eres').hidden = true; $('.cmd').classList.remove('gone');
  later(() => Snd.drum(), 500); if (!E) later(() => Snd.drum(), 1250);
  later(() => { b.className = 'banner'; $('#hunt').classList.remove('cine'); later(nextExchange, 450); }, E ? 1700 : 2700);
}
function hud() {
  $('#php').innerHTML = Array.from({ length: H.maxhp }, (_, i) => '<i class="' + (i < H.php ? 'full' : '') + '"></i>').join('');
  const r = 'scaleX(' + Math.max(0, H.mhp / H.stage.hp) + ')'; $('#mname').textContent = H.stage.name; $('#mhp').style.transform = r; $('#mlag').style.transform = r;
  $('#stance').style.transform = 'scaleX(' + (H.stag ? 1 : H.stance / 100) + ')'; $('.stbar').classList.toggle('full', H.stag);
  const cb = $('#combo'), ct = H.combo > 1 ? H.combo + ' 連' : ''; if (cb.textContent !== ct) { cb.textContent = ct; cb.classList.add('bump'); setTimeout(() => cb.classList.remove('bump'), 160); } Scene.setHp(H.mhp / H.stage.hp);
}
function nextExchange() { H.phase = 'wait'; present(); }
function pick() { let it; for (let i = 0; i < 14; i++) { it = nextItem(H.stage, save.stats, H.item); if (!H.recent.includes(it.cue.a + it.cue.b)) break; } H.recent.push(it.cue.a + it.cue.b); if (H.recent.length > 7) H.recent.shift(); return it; }
const KINDS = { kiri: '斬', harae: '祓', ougi: '奥義', listen: '聞' };
function present() {
  const it = H.item = pick(), c = it.cue, idx = H.stage.lvl ?? STAGES.indexOf(H.stage), pH = 0.18 + idx * 0.03 + (H.raged ? 0.15 : 0), en = H.stage.enc;
  it.hard = isHard(it.key);
  H.kind = H.stag ? 'ougi' : it.broken && (!en || en.broken) && Math.random() < pH ? 'harae' : en && en.listen && canListen() && Math.random() < 0.35 ? 'listen' : 'kiri';
  H.dur = (H.stage.timer + H.tb) * 1000 * (H.raged ? 0.85 : 1) * (H.kind === 'ougi' ? 1.2 : 1);
  let html = '<span class="kind">' + KINDS[H.kind] + '</span>';
  const ca = aidCls(c.a), cb = aidCls(c.b);
  if (H.kind === 'listen') html += '<div class="ear">♪ ・・・</div><div class="note">Écoute, puis redis la phrase. Clic : réécouter.</div>';
  else if (en && en.show === 'full' && H.kind === 'kiri') html += '<div class="full">' + rb(c.a, c.ar, ca) + 'は' + rb(it.pk, it.pr, cb) + rb(it.fk, it.fr) + '</div><div class="note">Lis la phrase à voix haute.</div>';
  else if (H.kind === 'harae') { const b = it.broken; html += '<div class="broken">' + rb(b.a, b.ar, ca) + 'は' + rb(b.w, b.wr, cb) + b.tail + rb(b.fk, b.fr) + '</div><div class="note">Phrase déformée. Redis-la juste.</div>'; }
  else html += '<div class="pair"><span>' + rb(c.a, c.ar, ca) + '</span><i>／</i><span>' + rb(c.b, c.br, cb) + '</span></div><div class="chips">' + (c.form ? '<em class="form">' + c.form + '</em>' : '') + '<em>' + c.frame + '</em></div>' + (H.kind === 'ougi' ? '<div class="note">Elle vacille. Dégâts triplés.</div>' : '');
  $('#cue').innerHTML = html;
  $('#cue').className = 'cue pop ' + H.kind + (save.read === 'always' ? ' showread' : ''); $('#cue').hidden = false; $('#readhint').hidden = save.read !== 'ask'; $('#heard').textContent = ''; $('#fb').className = 'fb'; $('#fb').innerHTML = ''; $('#fb').hidden = true; $('#acts').hidden = true;
  const arm = () => { H.phase = 'cue'; H.t0 = performance.now(); H.tFirst = null; H.heard = ''; H.lastSpeech = 0; H.deadline = H.t0 + H.dur; Scene.telegraph(H.t0, H.dur); Mic.arm(onSpeech); };
  Snd.cue();
  // Phrase entendue : le micro n'écoute qu'une fois la voix finie (sinon il entendrait le jeu).
  if (H.kind === 'listen') { H.phase = 'listen'; Mic.disarm(); sayAloud(it.canon, arm); } else arm();
}
function onSpeech(ev) {
  if (H.phase !== 'cue' && H.phase !== 'riposte') return;
  const text = ev.fin + ev.inter; if (!text.trim()) return;
  const now = performance.now(); if (H.tFirst === null) H.tFirst = now - H.t0; H.heard = text; H.lastSpeech = now;
  $('#heard').innerHTML = ev.fin + (ev.inter ? '<i>' + ev.inter + '</i>' : '');
  // la première transcription fait foi ; les variantes ne servent que si elle n'est pas une erreur connue
  const top = ev.cands[0], good = matches(H.item, top) || (!diagnose(H.item, top) && ev.cands.slice(1).some(c => matches(H.item, c)));
  if (good) return H.phase === 'cue' ? success() : riposteOk();
  clearTimeout(H.grace);
  // phrase complète et différente, stable depuis un moment : échec. Phrase incomplète : c'est une pause, on attend la suite.
  H.grace = later(() => {
    const complete = norm(text).length >= norm(H.item.canon).length - 1 || diagnose(H.item, text);
    if (!complete) return;
    if (H.phase === 'cue') fail('wrong'); else if (H.phase === 'riposte') riposteMiss();
  }, ev.settled ? 700 : 1500);
}
function tick() { // appelé à chaque image
  if (H.phase !== 'cue') return; const now = performance.now(), left = H.deadline - now;
  $('#tbar').style.transform = 'scaleX(' + Math.max(0, left / H.dur) + ')';
  if (left > 0) return;
  if (H.lastSpeech && now - H.lastSpeech < 1500 && left > -4000) return; // en train de parler : on laisse finir
  fail('slow');
}
function record(ok, t) {
  const st = save.stats[H.item.key] || (save.stats[H.item.key] = { n: 0, h: [] });
  st.n++; st.h.push({ ok, t: Math.round(t || 0) }); if (st.h.length > 12) st.h.shift();
  save.total++; save.days[today()] = (save.days[today()] || 0) + 1;
  // Suivi caché : la structure (juste et rapide, juste, juste mais lente, ratée) et les deux mots.
  Progress.logSentence(ok);
  const got = [];
  if (Progress.review('s:' + H.item.key, ok ? (t <= FAST ? 4 : t > 9000 ? 2 : 3) : 1)) got.push('s:' + H.item.key);
  if (H.item.read || ok) for (const id of huntWords(H.item)) if (Progress.review(id, H.item.read ? 1 : 3) && Progress.card(id).l > 0) got.push(id);
  for (const id of got) if (!H.acq.includes(id)) H.acq.push(id);
}
function success() {
  clearTimers(); Mic.disarm(); Scene.clearTele(); const now = performance.now(), start = H.tFirst, total = now - H.t0, crit = start <= FAST, ougi = H.kind === 'ougi', harae = H.kind === 'harae';
  H.combo++; H.best = Math.max(H.best, H.combo);
  const edge = C && C.bonus ? 1.5 : 1, en = H.stage.enc; // déduction juste : la lame porte la bonne fin
  // Rencontre : chaque phrase juste compte pour une (deux sur un 奥義), pour qu'un combat dure 2 à 4 phrases.
  const dmg = en ? 10 * (ougi ? 2 : 1) : 7 * edge * (crit ? 2 : 1) * (ougi ? 3 : 1) * (total > 9000 ? 0.7 : 1) * (1 + Math.min(H.combo - 1, 5) * 0.05);
  if (H.item.hard) H.hard++;
  record(true, start); H.log.push({ ok: true, crit, t: start, canon: H.item.canon, key: H.item.key, read: !!H.item.read, kind: H.kind });
  H.mhp -= dmg; H.phase = 'fb';
  if (ougi) { H.stag = false; H.stance = 0; later(() => Scene.stagger(false), 700); } else if (!en || en.rare) H.stance = Math.min(100, H.stance + (crit ? 34 : 15) * edge * (en ? 2.6 : 1));
  Scene.slash(ougi ? 2 : crit ? 1 : 0, dmg, ougi ? '奥義' : crit ? '会心' : harae ? '祓' : ''); if (ougi) Snd.heavy(); else Snd.slash(crit); if (crit || ougi) later(() => Snd.stamp(), 110); hud();
  $('#cue').hidden = true; $('#readhint').hidden = true; $('#fb').hidden = false; $('#fb').className = 'fb ok' + (crit ? ' crit' : '') + (ougi ? ' ougi' : '');
  $('#fb').innerHTML = '<b>' + H.item.canon + '</b><span>' + H.item.kana + '</span><u>' + (ougi ? '奥義 · ' : '') + (crit ? '会心 · ' : '') + (start / 1000).toFixed(1) + ' s' + (crit ? '' : ' · juste, mais trop lent pour un coup critique') + '</u>';
  $('#tbar').style.transform = 'scaleX(0)';
  if (H.mhp <= 0) return later(victory, ougi ? 900 : 700);
  later(() => { if (!H.raged && (!en || en.rare) && H.mhp <= H.stage.hp * 0.5) return rage(); proceed(); }, ougi ? 1700 : crit ? 1150 : 1500);
}
function proceed() { if (H.stance >= 100 && !H.stag) return stagger(); nextExchange(); }
function rage() { H.raged = true; H.phase = 'fx'; $('#fb').hidden = true; Scene.enrage(); Snd.roar(); flashBanner('怒', '', 1100); later(proceed, 1350); }
function stagger() { H.stag = true; H.phase = 'fx'; $('#fb').hidden = true; Scene.stagger(true); Snd.stagger(); flashBanner('崩', 'gold', 850); hud(); later(nextExchange, 1000); }
function fail(why) {
  clearTimers(); Mic.disarm(); Scene.clearTele(); const it = H.item, heard = H.heard;
  const diag = diagnose(it, heard) || (why === 'slow' ? (heard ? 'Trop lent.' : 'Rien entendu à temps.') : '');
  H.combo = 0; record(false, H.tFirst); H.log.push({ ok: false, canon: it.canon, kana: it.kana, key: it.key, heard, diag });
  $('#tbar').style.transform = 'scaleX(0)'; $('#cue').hidden = true; $('#readhint').hidden = true; $('#fb').hidden = false; $('#fb').className = 'fb ko';
  if (H.kind === 'ougi') { // l'ouverture se referme, sans coup reçu
    H.stag = false; H.stance = 0; Scene.stagger(false); Snd.miss(); hud(); H.phase = 'fb';
    $('#fb').innerHTML = '<u>' + (diag ? diag + ' ' : '') + 'L\'ouverture se referme.</u><b>' + it.canon + '</b><span>' + it.kana + '</span>';
    return later(nextExchange, 2300);
  }
  H.php--; H.stance = Math.max(0, H.stance - 25); Scene.monsterAttack(); hud(); H.phase = 'hit';
  $('#php').classList.add('hit'); setTimeout(() => $('#php').classList.remove('hit'), 400);
  $('#fb').innerHTML = (diag ? '<u>' + diag + '</u>' : '') + '<b>' + it.canon + '</b><span>' + it.kana + '</span>' + (H.php > 0 ? '<p>Redis la phrase juste pour reprendre l\'initiative.</p>' : '');
  if (H.php <= 0) return later(defeat, 1700);
  later(() => { H.phase = 'riposte'; H.tries = 0; H.heard = ''; $('#heard').textContent = ''; $('#acts').hidden = false; $('#void').hidden = !heard; Mic.arm(onSpeech); }, 900);
}
function riposteOk() {
  clearTimers(); Progress.logSentence(true); Mic.disarm(); H.phase = 'fb'; H.mhp = Math.max(1, H.mhp - 6); H.stance = Math.min(99, H.stance + 8); Scene.slash(0, 6, '立直'); Snd.slash(false); hud();
  $('#fb').className = 'fb redo'; $('#acts').hidden = true; later(nextExchange, 1000);
}
function riposteMiss() { H.tries++; Progress.logSentence(false); Snd.miss(); $('#fb').classList.add('shake'); later(() => $('#fb').classList.remove('shake'), 400); H.heard = ''; Mic.arm(onSpeech); if (H.tries >= 3) { $('#acts').hidden = true; later(nextExchange, 600); } }
function voidLast() { // le micro a mal entendu : le coup est annulé
  if (H.phase !== 'riposte') return; clearTimers(); Mic.disarm();
  const l = H.log.pop(), st = save.stats[l.key]; if (st && st.h.length) { st.n--; st.h.pop(); save.total--; }
  H.php = Math.min(H.maxhp, H.php + 1); H.voids++; hud(); $('#acts').hidden = true; nextExchange();
}
function rankOf() { const ok = H.log.filter(l => l.ok), crit = ok.filter(l => l.crit).length, hits = H.php0 - H.php, cr = ok.length ? crit / ok.length : 0; return hits === 0 && cr >= 0.7 ? 'S' : hits <= 1 && cr >= 0.5 ? 'A' : hits <= 2 ? 'B' : 'C'; }
const RANKS = ['C', 'B', 'A', 'S'], FRAG = { S: 3, A: 2, B: 1, C: 1 };
function victory() {
  clearTimers(); H.phase = 'end'; Mic.disarm(); Scene.die(); Snd.heavy(); later(() => Snd.win(), 700); $('#hunt').classList.add('cine'); const rank = rankOf();
  const s = save.stages[H.stage.id] || (save.stages[H.stage.id] = { clears: 0, best: '' }); const first = !s.clears; s.clears++;
  if (!s.best || RANKS.indexOf(rank) > RANKS.indexOf(s.best)) s.best = rank;
  const fid = H.stage.art || H.stage.id, gain = FRAG[rank] + (C && C.bonus ? 1 : 0); H.gain = gain; H.won = true; H.rank = rank;
  if (E) return encWon();
  save.frags[fid] = (save.frags[fid] || 0) + gain; persist(); Progress.logHunt(true);
  H.xp = C ? (H.stage.boss ? Field.XP_BOSS : Field.XP_CONTRACT) : 0; H.ups = H.xp ? Field.gainXp(H.xp) : [];
  if (!C) return later(() => go(() => result(true, rank, first)), 2700);
  // Contrat : apaisée, la créature dit enfin sa phrase entière, avec la voix de celui qui l'avait laissée en suspens.
  later(() => {
    const f = C.final, b = $('#banner');
    b.innerHTML = '<b>' + f.jp + '</b><div class="sub"><span>' + f.fr + '</span><em>' + H.stage.name + ' · 鎮め</em></div>';
    b.className = 'banner in final'; Voice.play(f.id);
  }, 1900);
  later(() => { $('#banner').className = 'banner'; go(() => result(true, rank, first)); }, 8400);
}
function defeat() { if (E) return encLost(); clearTimers(); Progress.logHunt(false); H.won = false; H.rank = ''; H.phase = 'end'; Mic.disarm(); Scene.playerDown(); Snd.lose(); persist(); $('#hunt').classList.add('cine'); later(() => go(() => result(false, '', false)), 1500); }
function quitHunt() { if (H.phase === 'idle' || H.phase === 'end') return; clearTimers(); H.phase = 'idle'; Mic.disarm(); persist(); stopVoice(); if (E) { Field.setHp(H.php); return leave(false, '', { fled: true }); } leave(false, ''); }
function stopVoice() { try { speechSynthesis.cancel(); } catch (e) { } }
// Fin d'une chasse de contrat : retour au village, qui jouera le souvenir ou la remarque de ワケ.
function leave(won, rank, extra) { clearTimers(); Mic.disarm(); Voice.stop(); stopVoice(); const enc = !!E; C = null; E = null; Scene.setMonster(null); show('none'); window.dispatchEvent(new CustomEvent('kotodama:village', { detail: Object.assign({ won, rank, enc }, extra || {}) })); }
/** Rencontre dans les herbes hautes (src/scenes/CombatScene.ts) : une bête de field.ts, un combat de 2 à 4 phrases. */
export function huntBeast(beast) {
  const st = Field.beastStage(beast); E = { beast }; C = null; load(); Snd.on = save.sound; Snd.init(); if (!DEBUG) Mic.start();
  Field.meet(beast); startHunt(st);
}
// Fin d'une rencontre : expérience, butin, ce qui vient d'être acquis, puis retour dans les herbes.
function encWon() {
  const crits = H.log.filter(l => l.ok && l.crit).length, o = Field.calm(E.beast, { crits, clean: H.php >= H.php0, hard: H.hard, hp: H.php });
  Progress.logHunt(true);
  const f = Field.field(), need = Field.xpToNext(f.lvl);
  later(() => {
    $('.cmd').classList.add('gone');
    $('#etitle').innerHTML = H.stage.name + '<small>鎮まった</small>';
    $('#esub').textContent = (crits ? '会心 ×' + crits + ' · ' : '') + (H.php >= H.php0 ? 'sans coup reçu' : 'PV ' + H.php + '/' + H.maxhp);
    $('#elv').textContent = '渡り Lv ' + f.lvl; $('#expn').textContent = '経験 +' + o.xp; $('#exp').style.transform = 'scaleX(' + Math.min(1, f.xp / need) + ')';
    $('#eups').innerHTML = o.ups.length ? '<b>レベルアップ</b> Lv ' + o.ups[o.ups.length - 1] + ' · PV max ' + Field.maxHp(f.lvl) + ' · +' + Field.timeBonus(f.lvl).toFixed(1).replace('.', ',') + ' s pour répondre' : '';
    $('#eloot').innerHTML = '<b>手に入れた</b> ' + Field.fmtLoot(o.loot) + (o.hard ? '<small>phrase à revoir bien dite : butin plus riche</small>' : '');
    $('#eacq').innerHTML = H.acq.length ? '<b>' + (H.acq.some(id => id.startsWith('s:')) ? '型を覚えた' : '覚えた') + '</b>' + H.acq.map(id => '<span>' + Progress.label(id) + '</span>').join('') : '';
    $('#eok').textContent = '続ける · continuer'; $('#eres').hidden = false; $('#eres').className = 'eres won'; if (o.ups.length) Snd.win(); else Snd.stamp();
  }, 1700);
}
function encLost() {
  clearTimers(); Progress.logHunt(false); H.phase = 'end'; Mic.disarm(); Scene.playerDown(); Snd.lose(); Field.setHp(0);
  later(() => {
    $('.cmd').classList.add('gone');
    $('#etitle').innerHTML = '力尽きた<small>à bout de forces</small>'; $('#esub').textContent = H.stage.name + ' s’éloigne dans les herbes. ワケ te ramène au village.';
    for (const k of ['#elv', '#expn', '#eups', '#eloot', '#eacq']) $(k).innerHTML = ''; $('#exp').style.transform = 'scaleX(0)';
    $('#eok').textContent = '村へ · au village'; $('#eres').hidden = false; $('#eres').className = 'eres lost';
  }, 1500);
}
function encDone() { if ($('#eres').hidden) return; $('#eres').hidden = true; const won = H.won !== false && H.phase === 'end' && H.mhp <= 0; leave(won, '', won ? {} : { down: true }); }
/** Chasse lancée par un contrat du village (voir src/scenes/CombatScene.ts). */
export function huntContract(stageId, opts) {
  const st = CONTRACT_STAGES.find(s => s.id === stageId); if (!st) return;
  C = opts; E = null; load(); Snd.on = save.sound; Snd.init(); if (!DEBUG) Mic.start();
  startHunt(st);
}
function result(won, rank, first) {
  const ok = H.log.filter(l => l.ok), crit = ok.filter(l => l.crit), fails = H.log.filter(l => !l.ok), m = med(ok.map(l => l.t));
  $('#rtitle').textContent = won ? '歪み、消ゆ' : '力尽きた'; $('#rsub').textContent = won ? H.stage.fr + ' est dissipée.' : H.stage.fr + ' tient encore. Tes phrases comptent quand même.';
  $('#rrank').textContent = won ? rank : '—'; $('#rrank').className = 'rank r' + (rank || 'x');
  $('#rstats').innerHTML = '<div><b>' + H.log.length + '</b>phrases dites</div><div><b>' + ok.length + '</b>justes</div><div><b>' + crit.length + '</b>coups critiques</div><div><b>' + (m === null ? '—' : (m / 1000).toFixed(1) + ' s') + '</b>démarrage médian</div><div><b>' + H.best + '</b>meilleure série</div><div><b>' + ok.filter(l => l.kind === 'ougi').length + '</b>奥義 placées</div>';
  const fid = H.stage.art || H.stage.id;
  $('#rfrag').textContent = won ? '欠片 +' + H.gain + (C && C.bonus ? ' (dont 1 pour la bonne déduction)' : '') + ' · fragments de ' + H.stage.name + ' : ' + save.frags[fid] + '. Ils serviront à la forge.' + (H.xp ? ' · 経験 +' + H.xp + (H.ups.length ? ' · レベルアップ : 渡り Lv ' + H.ups[H.ups.length - 1] : '') : '') : '';
  $('#racq').innerHTML = H.acq.length ? '<b>' + (H.acq.some(id => id.startsWith('s:')) ? '型を覚えた' : '覚えた') + '</b>' + H.acq.map(id => '<span>' + Progress.label(id) + '</span>').join('') : '';
  $('#runlock').textContent = won ? C.back : 'Sa phrase n\'a pas bougé. Rechasse, ou reviens plus tard.';
  $('#again').hidden = won; $('#back').textContent = '村へ戻る · retour au village';
  $('#rfails').innerHTML = fails.length ? fails.map(l => '<li><b>' + l.canon + '</b><span>' + l.kana + '</span><small>' + (l.diag || 'Phrase différente de l\'attendu.') + (l.heard ? ' Entendu : ' + l.heard : '') + '</small></li>').join('') : '<li class="none">Aucune phrase ratée.</li>';
  Scene.setMonster(null); $('#hunt').classList.remove('cine'); show('result'); if (won) later(() => Snd.stamp(), 380);
}

/* ---------- commandes ---------- */
$('#quit').addEventListener('click', quitHunt);
$('#void').addEventListener('click', voidLast);
$('#skip').addEventListener('click', () => { if (H.phase !== 'riposte') return; clearTimers(); Mic.disarm(); $('#acts').hidden = true; nextExchange(); });
$('#again').addEventListener('click', () => go(() => startHunt(H.stage)));
$('#back').addEventListener('click', () => leave(H.won, H.rank));
$('#eok').addEventListener('click', encDone);
function showRead() { if (save.read === 'never' || H.phase !== 'cue' || H.kind === 'listen') return; $('#cue').classList.add('showread'); H.item.read = true; }
document.addEventListener('keydown', e => {
  if ($('#hunt').hidden) return;
  if (!$('#eres').hidden) { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); encDone(); } return; }
  if (e.code === 'Escape') quitHunt(); if (e.code === 'KeyF' || e.code === 'Space') { e.preventDefault(); showRead(); }
});
$('#cue').addEventListener('click', () => { if (H.kind === 'listen' && H.phase === 'cue') { const t = performance.now(); Mic.disarm(); H.phase = 'listen'; sayAloud(H.item.canon, () => { const d = performance.now() - t; H.deadline += d; H.t0 += d; if (S.tele) S.tele.start += d; H.phase = 'cue'; Mic.arm(onSpeech); }); return; } showRead(); });
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = performance.now(); else if (hiddenAt) { const d = performance.now() - hiddenAt; H.deadline += d; H.t0 += d; if (S.tele) S.tele.start += d; hiddenAt = 0; } });
if (DEBUG) { const d = $('#dbg'); d.hidden = false; d.addEventListener('keydown', e => { if (e.key === 'Enter') { Mic.inject(d.value); d.value = ''; } e.stopPropagation(); }); }
window.KD = { H, Mic, S, save: () => save, eres: () => !$('#eres').hidden, cont: encDone, say: t => Mic.inject(t), answer: () => Mic.inject(H.item.canon), wrong: () => Mic.inject(H.item.broken.text) };

load(); if (!save.frags) save.frags = {};
// Reprise des anciennes chasses dans le suivi caché (une fois), puis le choix des phrases selon l'échéance.
Progress.migrate('combat', at => { for (const k in save.stats) for (const x of save.stats[k].h || []) Progress.review('s:' + k, x.ok ? (x.t <= FAST ? 4 : 3) : 1, { at, quiet: true }); });
setBias({
  key: k => { const s = Progress.status('s:' + k); return s.status === 'new' ? 1.3 : s.due ? 1.8 : s.status === 'acquired' ? 0.6 : 1.1; },
  entry: (e, type) => { let w = 1; for (const word of [e[0][0], type === 'ia' ? e[1][0] + 'い' : e[1][0]]) { const id = Progress.huntWordId(word), c = Progress.card(id); if (c && c.l > 0) w += (Progress.aid(id) === 'off' ? 0 : 2) + (Progress.status(id).due ? 1 : 0); } return w; }
}); resize(); Mic.listen(micUi); micUi();
let lastT = performance.now();
(function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; Scene.frame(dt); tick(); requestAnimationFrame(loop); })(performance.now());
