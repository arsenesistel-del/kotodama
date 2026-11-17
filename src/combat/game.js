/* ===== 言霊 : micro, chasse, progression, interface ===== */
import { ASSETS } from './assets';
import { STAGES, nextItem, matches, diagnose, norm, med, statusOf, FRAMES, TYPES, ALLKEYS, keyLabel } from './engine.js';
import { S, Scene, Snd, resize } from './scene.js';
const $ = s => document.querySelector(s);
const DEBUG = /debug/.test(location.hash + location.search);
const SAVE_KEY = 'kotodama.v1', FAST = 3500, MAXHP = 5;
let save = { v: 1, stats: {}, stages: {}, total: 0, days: {}, sound: true, intro: false, read: 'ask', frags: {} };
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 1) save = Object.assign(save, s); } catch (e) { } }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
const today = () => new Date().toLocaleDateString('sv-SE');

/* ---------- micro : une seule écoute continue, mais chaque phrase ne lit que ce qui est dit après son départ ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const Mic = {
  rec: null, want: false, live: false, base: 0, len: 0, pending: false, pIdx: -1, pLen: 0, carryIdx: -1, carryLen: 0, handler: null, denied: false, restarts: 0,
  start() {
    if (!SR) return false; if (this.rec) return true;
    const r = this.rec = new SR(); r.lang = 'ja-JP'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 5;
    r.onstart = () => { this.live = true; this.base = 0; this.len = 0; this.pending = false; this.pIdx = -1; this.carryIdx = -1; micUi(); };
    r.onend = () => { this.live = false; this.pending = false; micUi(); if (this.want && !this.denied) { this.restarts++; setTimeout(() => { try { r.start(); } catch (e) { } }, 120); } };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.denied = true; this.want = false; micUi(); } };
    r.onresult = e => {
      this.len = e.results.length; let inter = '', pIdx = -1, pLen = 0; const fins = [];
      for (let j = 0; j < e.results.length; j++) {
        const x = e.results[j]; if (!x.isFinal && pIdx < 0) { pIdx = j; pLen = x[0].transcript.length; }
        if (j < this.base) continue;
        // la phrase précédente peut encore être en cours de finalisation : on ne garde que ce qui a été dit après
        const cut = t => (j === this.carryIdx ? (t.length > this.carryLen ? t.slice(this.carryLen) : '') : t);
        if (x.isFinal) { const alts = Array.from(x).map(a => cut(a.transcript)); if (j === this.carryIdx && norm(alts[0]).length <= 2) continue; fins.push(alts); }
        else inter += cut(x[0].transcript);
      }
      this.pending = pIdx >= 0; this.pIdx = pIdx; this.pLen = pLen; if (!this.handler) return;
      const fin = fins.map(a => a[0]).join(''), cands = [fin + inter];
      fins.forEach((alts, i) => alts.slice(1).forEach(a => cands.push(fins.map((b, k) => k === i ? a : b[0]).join('') + inter)));
      this.handler({ fin, inter, cands, settled: !!fin && !inter });
    };
    this.want = true; try { r.start(); } catch (e) { } return true;
  },
  arm(h) { if (this.pending && this.pIdx >= 0) { this.base = this.pIdx; this.carryIdx = this.pIdx; this.carryLen = this.pLen; } else { this.base = this.len; this.carryIdx = -1; } this.handler = h; },
  disarm() { this.handler = null; },
  flush() { if (this.rec && this.live) { try { this.rec.abort(); } catch (e) { } } },
  inject(text) { if (this.handler) this.handler({ fin: text, inter: '', cands: [text], settled: true }); }
};
function micUi() { const el = $('#mic'); if (!el) return; el.textContent = Mic.denied ? 'micro refusé' : Mic.live ? 'micro ouvert' : DEBUG ? 'mode texte' : 'micro coupé'; el.className = Mic.live ? 'on' : 'off'; if (!$('#hub').hidden) hub(); }

/* ---------- chasse ---------- */
const H = { stage: null, mhp: 0, php: MAXHP, item: null, phase: 'idle', combo: 0, best: 0, log: [], t0: 0, tFirst: null, heard: '', deadline: 0, dur: 0, lastSpeech: 0, tries: 0, timers: [], voids: 0, stance: 0, stag: false, raged: false, kind: 'kiri', recent: [] };
const later = (f, ms) => { const t = setTimeout(f, ms); H.timers.push(t); return t; };
function clearTimers() { H.timers.forEach(clearTimeout); H.timers = []; }
function show(id) { for (const s of ['title', 'hub', 'hunt', 'result']) $('#' + s).hidden = s !== id; S.hunt = id === 'hunt'; S.title = id === 'title'; }
let wiping = false;
function go(fn) { // rideau d'encre entre deux écrans
  if (wiping) return; wiping = true; const w = $('#wipe'); w.className = 'in';
  setTimeout(() => { fn(); w.className = 'out'; setTimeout(() => { w.className = ''; wiping = false; }, 350); }, 310);
}
function flashBanner(txt, cls, ms) { const b = $('#banner'); b.innerHTML = '<b>' + txt + '</b>'; b.className = 'banner in flash ' + (cls || ''); later(() => { b.className = 'banner'; }, ms); }
const rb = (k, r) => /[一-鿿]/.test(k) ? '<ruby>' + k + '<rt>' + r + '</rt></ruby>' : k;

function startHunt(stage) {
  clearTimers(); Object.assign(H, { stage, mhp: stage.hp, php: MAXHP, item: null, phase: 'intro', combo: 0, best: 0, log: [], voids: 0, started: Date.now(), stance: 0, stag: false, raged: false, kind: 'kiri', recent: [] });
  Scene.setMonster(stage); show('hunt'); hud(); $('#readhint').hidden = true; $('#hunt').classList.add('cine');
  $('#cue').innerHTML = ''; $('#cue').hidden = true; $('#heard').textContent = ''; $('#fb').className = 'fb'; $('#fb').innerHTML = ''; $('#fb').hidden = true; $('#acts').hidden = true; $('#tbar').style.transform = 'scaleX(0)';
  const b = $('#banner'); b.innerHTML = '<b>' + stage.name + '</b><div class="sub"><span>' + stage.fr + '</span><em>' + stage.hint + '</em></div>'; b.className = 'banner in';
  later(() => Snd.drum(), 500); later(() => Snd.drum(), 1250);
  later(() => { b.className = 'banner'; $('#hunt').classList.remove('cine'); later(nextExchange, 450); }, 2700);
}
function hud() {
  $('#php').innerHTML = Array.from({ length: MAXHP }, (_, i) => '<i class="' + (i < H.php ? 'full' : '') + '"></i>').join('');
  const r = 'scaleX(' + Math.max(0, H.mhp / H.stage.hp) + ')'; $('#mname').textContent = H.stage.name; $('#mhp').style.transform = r; $('#mlag').style.transform = r;
  $('#stance').style.transform = 'scaleX(' + (H.stag ? 1 : H.stance / 100) + ')'; $('.stbar').classList.toggle('full', H.stag);
  const cb = $('#combo'), ct = H.combo > 1 ? H.combo + ' 連' : ''; if (cb.textContent !== ct) { cb.textContent = ct; cb.classList.add('bump'); setTimeout(() => cb.classList.remove('bump'), 160); } Scene.setHp(H.mhp / H.stage.hp);
}
function nextExchange() { H.phase = 'wait'; present(); }
function pick() { let it; for (let i = 0; i < 14; i++) { it = nextItem(H.stage, save.stats, H.item); if (!H.recent.includes(it.cue.a + it.cue.b)) break; } H.recent.push(it.cue.a + it.cue.b); if (H.recent.length > 7) H.recent.shift(); return it; }
const KINDS = { kiri: '斬', harae: '祓', ougi: '奥義' };
function present() {
  const it = H.item = pick(), c = it.cue, idx = STAGES.indexOf(H.stage), pH = 0.18 + idx * 0.03 + (H.raged ? 0.15 : 0);
  H.kind = H.stag ? 'ougi' : it.broken && Math.random() < pH ? 'harae' : 'kiri';
  H.dur = H.stage.timer * 1000 * (H.raged ? 0.85 : 1) * (H.kind === 'ougi' ? 1.2 : 1);
  let html = '<span class="kind">' + KINDS[H.kind] + '</span>';
  if (H.kind === 'harae') { const b = it.broken; html += '<div class="broken">' + rb(b.a, b.ar) + 'は' + rb(b.w, b.wr) + b.tail + rb(b.fk, b.fr) + '</div><div class="note">Phrase déformée. Redis-la juste.</div>'; }
  else html += '<div class="pair"><span>' + rb(c.a, c.ar) + '</span><i>／</i><span>' + rb(c.b, c.br) + '</span></div><div class="chips">' + (c.form ? '<em class="form">' + c.form + '</em>' : '') + '<em>' + c.frame + '</em></div>' + (H.kind === 'ougi' ? '<div class="note">Elle vacille. Dégâts triplés.</div>' : '');
  $('#cue').innerHTML = html;
  $('#cue').className = 'cue pop ' + H.kind + (save.read === 'always' ? ' showread' : ''); $('#cue').hidden = false; $('#readhint').hidden = save.read !== 'ask'; $('#heard').textContent = ''; $('#fb').className = 'fb'; $('#fb').innerHTML = ''; $('#fb').hidden = true; $('#acts').hidden = true;
  H.phase = 'cue'; H.t0 = performance.now(); H.tFirst = null; H.heard = ''; H.lastSpeech = 0; H.deadline = H.t0 + H.dur;
  Scene.telegraph(H.t0, H.dur); Snd.cue(); Mic.arm(onSpeech);
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
}
function success() {
  clearTimers(); Mic.disarm(); Scene.clearTele(); const now = performance.now(), start = H.tFirst, total = now - H.t0, crit = start <= FAST, ougi = H.kind === 'ougi', harae = H.kind === 'harae';
  H.combo++; H.best = Math.max(H.best, H.combo);
  const dmg = 7 * (crit ? 2 : 1) * (ougi ? 3 : 1) * (total > 9000 ? 0.7 : 1) * (1 + Math.min(H.combo - 1, 5) * 0.05);
  record(true, start); H.log.push({ ok: true, crit, t: start, canon: H.item.canon, key: H.item.key, read: !!H.item.read, kind: H.kind });
  H.mhp -= dmg; H.phase = 'fb';
  if (ougi) { H.stag = false; H.stance = 0; later(() => Scene.stagger(false), 700); } else H.stance = Math.min(100, H.stance + (crit ? 34 : 15));
  Scene.slash(ougi ? 2 : crit ? 1 : 0, dmg, ougi ? '奥義' : crit ? '会心' : harae ? '祓' : ''); if (ougi) Snd.heavy(); else Snd.slash(crit); if (crit || ougi) later(() => Snd.stamp(), 110); hud();
  $('#cue').hidden = true; $('#readhint').hidden = true; $('#fb').hidden = false; $('#fb').className = 'fb ok' + (crit ? ' crit' : '') + (ougi ? ' ougi' : '');
  $('#fb').innerHTML = '<b>' + H.item.canon + '</b><span>' + H.item.kana + '</span><u>' + (ougi ? '奥義 · ' : '') + (crit ? '会心 · ' : '') + (start / 1000).toFixed(1) + ' s' + (crit ? '' : ' · juste, mais trop lent pour un coup critique') + '</u>';
  $('#tbar').style.transform = 'scaleX(0)';
  if (H.mhp <= 0) return later(victory, ougi ? 900 : 700);
  later(() => { if (!H.raged && H.mhp <= H.stage.hp * 0.5) return rage(); proceed(); }, ougi ? 1700 : crit ? 1150 : 1500);
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
  clearTimers(); Mic.disarm(); H.phase = 'fb'; H.mhp = Math.max(1, H.mhp - 6); H.stance = Math.min(99, H.stance + 8); Scene.slash(0, 6, '立直'); Snd.slash(false); hud();
  $('#fb').className = 'fb redo'; $('#acts').hidden = true; later(nextExchange, 1000);
}
function riposteMiss() { H.tries++; Snd.miss(); $('#fb').classList.add('shake'); later(() => $('#fb').classList.remove('shake'), 400); H.heard = ''; Mic.arm(onSpeech); if (H.tries >= 3) { $('#acts').hidden = true; later(nextExchange, 600); } }
function voidLast() { // le micro a mal entendu : le coup est annulé
  if (H.phase !== 'riposte') return; clearTimers(); Mic.disarm();
  const l = H.log.pop(), st = save.stats[l.key]; if (st && st.h.length) { st.n--; st.h.pop(); save.total--; }
  H.php = Math.min(MAXHP, H.php + 1); H.voids++; hud(); $('#acts').hidden = true; nextExchange();
}
function rankOf() { const ok = H.log.filter(l => l.ok), crit = ok.filter(l => l.crit).length, hits = MAXHP - H.php, cr = ok.length ? crit / ok.length : 0; return hits === 0 && cr >= 0.7 ? 'S' : hits <= 1 && cr >= 0.5 ? 'A' : hits <= 2 ? 'B' : 'C'; }
const RANKS = ['C', 'B', 'A', 'S'], FRAG = { S: 3, A: 2, B: 1, C: 1 };
function victory() {
  clearTimers(); H.phase = 'end'; Mic.disarm(); Scene.die(); Snd.heavy(); later(() => Snd.win(), 700); $('#hunt').classList.add('cine'); const rank = rankOf();
  const s = save.stages[H.stage.id] || (save.stages[H.stage.id] = { clears: 0, best: '' }); const first = !s.clears; s.clears++;
  if (!s.best || RANKS.indexOf(rank) > RANKS.indexOf(s.best)) s.best = rank;
  save.frags[H.stage.id] = (save.frags[H.stage.id] || 0) + FRAG[rank]; persist();
  later(() => go(() => result(true, rank, first)), 2700);
}
function defeat() { clearTimers(); H.phase = 'end'; Mic.disarm(); Scene.playerDown(); Snd.lose(); persist(); $('#hunt').classList.add('cine'); later(() => go(() => result(false, '', false)), 1500); }
function quitHunt() { if (H.phase === 'idle' || H.phase === 'end') return; clearTimers(); H.phase = 'idle'; Mic.disarm(); persist(); go(() => { Scene.setMonster(null); hub(); }); }
function result(won, rank, first) {
  const ok = H.log.filter(l => l.ok), crit = ok.filter(l => l.crit), fails = H.log.filter(l => !l.ok), m = med(ok.map(l => l.t));
  $('#rtitle').textContent = won ? '歪み、消ゆ' : '力尽きた'; $('#rsub').textContent = won ? H.stage.fr + ' est dissipée.' : H.stage.fr + ' tient encore. Tes phrases comptent quand même.';
  $('#rrank').textContent = won ? rank : '—'; $('#rrank').className = 'rank r' + (rank || 'x');
  $('#rstats').innerHTML = '<div><b>' + H.log.length + '</b>phrases dites</div><div><b>' + ok.length + '</b>justes</div><div><b>' + crit.length + '</b>coups critiques</div><div><b>' + (m === null ? '—' : (m / 1000).toFixed(1) + ' s') + '</b>démarrage médian</div><div><b>' + H.best + '</b>meilleure série</div><div><b>' + ok.filter(l => l.kind === 'ougi').length + '</b>奥義 placées</div>';
  const idx = STAGES.indexOf(H.stage), nx = STAGES[idx + 1];
  $('#rfrag').textContent = won ? '欠片 +' + FRAG[rank] + ' · fragments de ' + H.stage.name + ' : ' + save.frags[H.stage.id] + '. Ils serviront à la forge.' : '';
  $('#runlock').textContent = won && first && nx ? 'Nouvelle distorsion repérée : ' + nx.name + ' (' + nx.fr + ').' : won && first ? 'Toutes les distorsions du sabre de l\'avis sont tombées une fois. Vise le rang S.' : '';
  $('#rfails').innerHTML = fails.length ? fails.map(l => '<li><b>' + l.canon + '</b><span>' + l.kana + '</span><small>' + (l.diag || 'Phrase différente de l\'attendu.') + (l.heard ? ' Entendu : ' + l.heard : '') + '</small></li>').join('') : '<li class="none">Aucune phrase ratée.</li>';
  Scene.setMonster(null); $('#hunt').classList.remove('cine'); show('result'); if (won) later(() => Snd.stamp(), 380);
}

/* ---------- repaire ---------- */
let TAB = 'quests';
function unlocked(i) { return i === 0 || !!(save.stages[STAGES[i - 1].id] && save.stages[STAGES[i - 1].id].clears) || DEBUG; }
function hub() {
  show('hub'); const micOk = Mic.live || DEBUG, next = STAGES.findIndex(s => !(save.stages[s.id] && save.stages[s.id].clears));
  for (const t of ['quests', 'book', 'opts']) $('#tab-' + t).hidden = t !== TAB; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB));
  $('#stages').innerHTML = STAGES.map((s, i) => { const sv = save.stages[s.id], open = unlocked(i);
    return '<button class="stage' + (open ? '' : ' locked') + (open && i === next ? ' next' : '') + '" data-i="' + i + '"' + (open && micOk ? '' : ' disabled') + '><span class="art"><img src="' + ASSETS[s.id] + '" alt=""></span><span class="txt"><span class="n">' + (open ? s.name : '？？？') + '</span><span class="f">' + (open ? s.fr : 'Dissipe la précédente') + '</span><span class="h">' + (open ? s.hint : '') + '</span><span class="m">' + (sv ? '討伐 ' + sv.clears + ' · 欠片 ' + (save.frags[s.id] || 0) : '') + '</span></span><span class="r r' + (sv && sv.best || 'x') + '">' + (sv && sv.best ? sv.best : '') + '</span></button>'; }).join('');
  let g2 = '<table class="grid"><thead><tr><th></th>' + Object.values(TYPES).map(t => '<th>' + t + '</th>').join('') + '</tr></thead><tbody>';
  for (const f in FRAMES) { g2 += '<tr><th>' + FRAMES[f].lab + '</th>'; for (const t in TYPES) { const st = save.stats[f + '.' + t], sta = statusOf(st); let txt = ''; if (st && st.h.length) { const okk = st.h.filter(x => x.ok), mm = med(okk.map(x => x.t)); txt = Math.round(100 * okk.length / st.h.length) + '%' + (mm !== null ? '<small>' + (mm / 1000).toFixed(1) + ' s</small>' : ''); } g2 += '<td class="c ' + sta + '">' + txt + '</td>'; } g2 += '</tr>'; }
  $('#bestiary').innerHTML = g2 + '</tbody></table>';
  $('#totals').textContent = save.total + ' phrases dites · ' + (save.days[today()] || 0) + ' aujourd\'hui';
  const fr = Object.values(save.frags).reduce((a, b) => a + b, 0); $('#frags').textContent = fr ? '欠片 ' + fr : '';
  $('#hubmic').textContent = DEBUG ? 'Mode texte : tape la phrase dans le champ du bas.' : !SR ? 'Ce navigateur n\'a pas de reconnaissance vocale. Ouvre le jeu dans Google Chrome.' : Mic.denied ? 'Micro refusé. Autorise-le (icône à gauche de la barre d\'adresse), puis recharge la page.' : Mic.live ? '' : 'Le micro n\'est pas encore ouvert. Accepte la demande de Chrome.';
  $('#sound').textContent = save.sound ? 'Son : oui' : 'Son : non'; $('#read').textContent = READS[save.read] || READS.ask;
  if (!save.intro) $('#howto').hidden = false;
}
function report() {
  const lines = ['KOTODAMA · ' + today() + ' · ' + save.total + ' phrases en tout'];
  for (const s of STAGES) { const sv = save.stages[s.id]; if (sv) lines.push(s.name + ' : ' + sv.clears + ' fois, meilleur rang ' + sv.best); }
  for (const k of ALLKEYS) { const st = save.stats[k]; if (st && st.h.length) { const ok = st.h.filter(x => x.ok), m = med(ok.map(x => x.t)); lines.push(keyLabel(k) + ' : ' + ok.length + '/' + st.h.length + ' justes, démarrage ' + (m === null ? 'n/a' : (m / 1000).toFixed(1) + ' s') + ' (' + statusOf(st) + ')'); } }
  return lines.join('\n');
}

/* ---------- commandes ---------- */
const READS = { ask: 'Lectures : sur demande', always: 'Lectures : toujours', never: 'Lectures : jamais' };
$('#enter').addEventListener('click', () => { Snd.on = save.sound; Snd.init(); if (!DEBUG) Mic.start(); go(hub); });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; TAB = b.dataset.tab; Snd.ui(); hub(); });
$('#stages').addEventListener('click', e => { const b = e.target.closest('.stage'); if (!b || b.disabled) return; Snd.stamp(); go(() => startHunt(STAGES[+b.dataset.i])); });
$('#quit').addEventListener('click', quitHunt);
$('#void').addEventListener('click', voidLast);
$('#skip').addEventListener('click', () => { if (H.phase !== 'riposte') return; clearTimers(); Mic.disarm(); $('#acts').hidden = true; nextExchange(); });
$('#again').addEventListener('click', () => go(() => startHunt(H.stage)));
$('#back').addEventListener('click', () => go(hub));
$('#sound').addEventListener('click', () => { save.sound = !save.sound; Snd.set(save.sound); persist(); hub(); });
$('#showhow').addEventListener('click', () => { $('#howto').hidden = false; });
$('#okhow').addEventListener('click', () => { save.intro = true; persist(); $('#howto').hidden = true; });
$('#copy').addEventListener('click', async () => { const t = $('#rep'); t.hidden = false; t.value = report(); let ok = false; try { await navigator.clipboard.writeText(t.value); ok = true; } catch (e) { try { t.select(); ok = document.execCommand('copy'); } catch (e2) { } } $('#copy').textContent = ok ? 'Compte rendu copié' : 'Sélectionne le texte et copie-le'; });
function showRead() { if (save.read === 'never' || H.phase !== 'cue') return; $('#cue').classList.add('showread'); H.item.read = true; }
document.addEventListener('keydown', e => { if ($('#hunt').hidden) return; if (e.code === 'Escape') quitHunt(); if (e.code === 'KeyF' || e.code === 'Space') { e.preventDefault(); showRead(); } });
$('#cue').addEventListener('click', showRead);
$('#read').addEventListener('click', () => { save.read = { ask: 'always', always: 'never', never: 'ask' }[save.read] || 'ask'; persist(); hub(); });
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = performance.now(); else if (hiddenAt) { const d = performance.now() - hiddenAt; H.deadline += d; H.t0 += d; if (S.tele) S.tele.start += d; hiddenAt = 0; } });
if (DEBUG) { const d = $('#dbg'); d.hidden = false; d.addEventListener('keydown', e => { if (e.key === 'Enter') { Mic.inject(d.value); d.value = ''; } e.stopPropagation(); }); }
window.KD = { H, Mic, S, save: () => save, say: t => Mic.inject(t), answer: () => Mic.inject(H.item.canon), wrong: () => Mic.inject(H.item.broken.text) };

load(); if (!save.frags) save.frags = {}; resize(); micUi();
let lastT = performance.now();
(function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; Scene.frame(dt); tick(); requestAnimationFrame(loop); })(performance.now());
