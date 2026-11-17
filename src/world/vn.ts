// Système de dialogue façon visual novel, en HTML par-dessus le jeu.
// Boîte avec portrait, nom et texte qui défile ; menu rapide en japonais (セーブ, ロード, オート, スキップ, バックログ, 設定) ;
// バックログ ; 既読スキップ ; オート ; emplacements de sauvegarde ; réglages.
// Les aides : furigana seulement sur les mots que le joueur ne sait pas lire, sens en français au toucher,
// et ワケ qui souffle la traduction et signale chaque nouveau marqueur de 役割語.
// Session 4 : les personnages parlent (voix générées à l'avance, réécoute normale ou lente), et le joueur leur
// répond à voix haute ; le micro et le moteur vérifient la phrase (answer.ts).
import './vn.css';
import { Mic, SR } from '../mic.js';
import { judge, target, type Target } from './answer';
import * as Voice from './voice';
import { WORLD } from './assets';
import { DIALOGUES, SPEAKERS, type Choice, type Line } from './dialogue';
import { MEMORY_ART } from './quest-lines';
import { CINE_ART, CINE_FX } from './story-lines';
import { LEX, MARKERS, MARKER_WHO } from './lexicon';
import { MAPS } from './maps';
import { placeById } from './places';
import * as P from './prefs';
import * as Progress from './progress';
import * as Record from './record';
import { newGame, replaceWorld, saveWorld, world, type WorldSave } from './state';
import { entryOf, parse, plain, tokenize, type Token } from './text';

/** Branchements fournis par le jeu (main.ts, scènes). */
export const hooks: {
  load?: () => void; // une partie vient d'être chargée : relancer la bonne scène
  beforeSave?: () => void; // la scène range sa position avant une sauvegarde
  settings?: () => void; // les réglages ont changé (volume)
  act?: (a: string) => void; // une phrase dite porte une action (déduction d'un contrat)
} = {};

// Peintures des souvenirs (session 6), affichées derrière la boîte pendant un souvenir.
const MEM = import.meta.glob('../assets/memory/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const memUrl = (k: string) => Object.entries(MEM).find(([p]) => p.endsWith('/' + k + '.webp'))?.[1];
// Les créatures parlent d'une voix d'écho (la phrase qu'elles répètent).
const ECHO = new Set(['kage', 'yuragi', 'kuzure', 'tsubu', 'mayoi', 'kiri']);

const root = document.createElement('div');
root.id = 'vn';
root.innerHTML = `
  <div class="memory" hidden><img alt=""><b>記憶</b><i class="cseal">訳</i></div>
  <button class="menubtn" title="Menu (Échap)">メニュー</button>
  <div class="whisper" hidden>
    <img alt="">
    <div><i>ワケ</i><p class="wtr" hidden></p><p class="wmk" hidden></p></div>
  </div>
  <div class="dlg" hidden>
    <div class="face"><img alt=""></div>
    <div class="body">
      <div class="name"></div>
      <div class="text"></div>
      <div class="sub" hidden></div>
      <div class="ans" hidden>
        <div class="mic"><i></i><span></span></div>
        <div class="heard"></div>
        <div class="verdict"></div>
        <input class="dbg" hidden placeholder="mode test : tape la phrase, puis Entrée" autocomplete="off">
        <button class="pass" data-a="pass" hidden>飛ばす<small>passer</small></button>
      </div>
    </div>
    <button class="wakebtn" title="ワケ traduit (T)">訳</button>
    <div class="vbtns">
      <button data-a="replay" title="Réécouter (R)">聞</button>
      <button data-a="slow" title="Réécouter lentement (L)">遅</button>
    </div>
    <div class="seal" hidden>言</div>
    <div class="next">▼</div>
    <nav class="qm">
      <button data-a="save" title="Sauvegarder">セーブ</button>
      <button data-a="load" title="Charger">ロード</button>
      <button data-a="auto" title="Défilement automatique (A)">オート</button>
      <button data-a="skip" title="Passer ce qui a déjà été lu (Ctrl)">スキップ</button>
      <button data-a="log" title="Historique (B ou molette)">バックログ</button>
      <button data-a="config" title="Réglages">設定</button>
    </nav>
  </div>
  <div class="word" hidden></div>
  <div class="shade" hidden></div>
  <section class="vp p-menu" hidden>
    <h2>メニュー</h2>
    <div class="menu">
      <button data-a="save">セーブ<small>sauvegarder</small></button>
      <button data-a="load">ロード<small>charger</small></button>
      <button data-a="log">バックログ<small>historique</small></button>
      <button data-a="record">記録<small>bilan de la semaine</small></button>
      <button data-a="scenes">回想<small>revoir les scènes</small></button>
      <button data-a="newgame">はじめから<small>nouvelle partie</small></button>
      <button data-a="config">設定<small>réglages</small></button>
      <button data-a="close">閉じる<small>reprendre</small></button>
    </div>
  </section>
  <section class="vp p-log" hidden>
    <header><h2>バックログ</h2><button class="tgl" data-a="logtr" title="Afficher les traductions">訳</button><button class="x" data-a="close">✕</button></header>
    <div class="log"></div>
    <footer>Touche un mot pour son sens · <kbd>Échap</kbd> fermer</footer>
  </section>
  <section class="vp p-slots" hidden>
    <header><h2></h2><button class="x" data-a="close">✕</button></header>
    <div class="slots"></div>
  </section>
  <section class="vp p-record" hidden>
    <header><h2>記録</h2><button class="nav" data-a="recprev" title="Semaine précédente">‹</button><button class="nav" data-a="recnext" title="Semaine suivante">›</button><button class="x" data-a="close">✕</button></header>
    <div class="rec"></div>
    <footer>Le jeu suit chaque mot et chaque structure que tu dis. L’aide d’un mot s’efface quand il est acquis, et revient s’il s’oublie.</footer>
  </section>
  <section class="vp p-scenes" hidden>
    <header><h2>回想</h2><button class="x" data-a="close">✕</button></header>
    <div class="scenes"></div>
    <footer>Les cinématiques et les souvenirs déjà vus. Rien n’y est compté.</footer>
  </section>
  <section class="vp p-config" hidden>
    <header><h2>設定</h2><button class="x" data-a="close">✕</button></header>
    <div class="config"></div>
  </section>
  <div class="toast" hidden></div>
  <input class="restore" type="file" accept=".json,application/json" hidden>`;
document.body.appendChild(root);

const $ = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
const WAKE_FACE = 'actors/spirit_face';
$<HTMLImageElement>('.whisper img').src = WORLD[WAKE_FACE] ?? '';

export function show(on: boolean): void {
  root.hidden = !on;
  if (!on) closeAll();
}

// ---------- texte : mots, furigana ----------

const tokCache = new Map<string, Token[]>();
const tokensOf = (src: string): Token[] => {
  let t = tokCache.get(src);
  if (!t) tokCache.set(src, (t = tokenize(src)));
  return t;
};

/** HTML d'une réplique, tronquée à `limit` caractères (pour le défilement). Chaque mot est une zone qu'on peut toucher. */
function renderTokens(tokens: Token[], lineId: string, limit = Infinity, peek = false): string {
  let html = '';
  let n = 0;
  tokens.forEach((t, i) => {
    if (n >= limit) return;
    if (t.punct) {
      const s = t.text.slice(0, Math.max(0, limit - n));
      html += esc(s);
      n += s.length;
      return;
    }
    const ruby = P.wantsRuby(t, peek);
    const fade = ruby && !peek && P.fadedRuby(t);
    const e = entryOf(t);
    let inner = '';
    for (const s of t.segs) {
      if (n >= limit) break;
      inner += s.ruby && ruby ? `<ruby${fade ? ' class="fade"' : ''}>${esc(s.base)}<rt>${esc(s.ruby)}</rt></ruby>` : esc(s.base);
      n += s.base.length;
    }
    html += `<span class="w${e?.marker ? ' mk' : ''}" data-l="${esc(lineId)}" data-i="${i}">${inner}</span>`;
  });
  return html;
}

const rubyAll = (src: string) =>
  parse(src)
    .map((s) => (s.ruby ? `<ruby>${esc(s.base)}<rt>${esc(s.ruby)}</rt></ruby>` : esc(s.base)))
    .join('');

const charCount = (tokens: Token[]) => tokens.reduce((s, t) => s + t.text.length, 0);

/** Une réplique par son identifiant « dialogue:numéro », ou « dialogue:numéro/choix » pour la phrase choisie. */
function lineById(id: string): Line | undefined {
  const [base, ch] = id.split('/');
  const k = base.lastIndexOf(':');
  const l = DIALOGUES[base.slice(0, k)]?.[Number(base.slice(k + 1))];
  if (l && ch !== undefined && l.choices) {
    const c: Choice | undefined = l.choices[Number(ch)];
    return c ? { who: l.who, jp: c.jp, fr: c.fr } : undefined;
  }
  return l;
}

const DEBUG = /debug/.test(location.hash + location.search);
const SFX = { ok: WORLD['audio/accept'], miss: WORLD['audio/cancel'] };
function sfx(k: keyof typeof SFX): void {
  if (!SFX[k]) return;
  const a = new Audio(SFX[k]);
  a.volume = Math.min(1, P.settings.volume * 0.7);
  a.play().catch(() => undefined);
}

// ---------- dialogue ----------

let dlgId = '';
let lines: Line[] = [];
let idx = 0;
let tokens: Token[] = [];
let total = 0;
let shown = 0;
let typeTimer = 0;
let waitTimer = 0;
let onEnd: (() => void) | null = null;
let auto = false;
let skip = false;
let ctrlSkip = false;
let peek = false;
let trOpen = false;
let marks: string[] = [];
// Dialogues imbriqués : un choix du joueur mène à son dialogue, puis on reprend après la réplique du choix.
let stack: { id: string; idx: number }[] = [];
// Réponse en cours : les phrases possibles, les essais ratés, et si elle est déjà validée.
let ans: { targets: Target[]; tries: number; done: boolean; texts: string[] } | null = null;

const lineId = () => `${dlgId}:${idx}`;
const cur = () => lines[idx];
export const dialogOpen = () => !$('.dlg').hidden;

/** Joue plusieurs dialogues à la suite, puis `done`. */
export function openChain(ids: string[], done?: () => void): void {
  const [first, ...rest] = ids.filter((i) => DIALOGUES[i]?.length);
  if (!first) return done?.();
  openDialog(first, () => (rest.length ? openChain(rest, done) : done?.()));
}

/** Peinture du dialogue en cours : une cinématique (CINE_ART) ou un souvenir (MEMORY_ART). */
function artNow(): { art?: string; cine: boolean } {
  const ids = [dlgId, ...stack.map((x) => x.id)];
  const cine = ids.map((i) => CINE_ART[i]).find(Boolean);
  if (cine) return { art: cine, cine: true };
  return { art: ids.map((i) => MEMORY_ART[i]).find(Boolean), cine: false };
}

/** Souvenir : la peinture derrière la boîte, et les couleurs passées. Cinématique : la peinture seule, sans le sceau 記憶. */
function setMemory(art: string | undefined, cine = false): void {
  const m = $('.memory');
  const url = art && memUrl(art);
  root.classList.toggle('remember', !!art && !cine);
  root.classList.toggle('cine', !!art && cine);
  if (!url) {
    m.hidden = true;
    m.classList.remove('sealed');
    return;
  }
  const img = $<HTMLImageElement>('.memory img');
  const changed = !img.src.endsWith(url);
  if (changed) img.src = url;
  if (m.hidden || changed) {
    m.hidden = false;
    m.classList.remove('go', 'sealed');
    void m.offsetWidth;
    m.classList.add('go');
  }
}

export function openDialog(id: string, done?: () => void): void {
  lines = DIALOGUES[id] ?? [];
  if (!lines.length) return done?.();
  dlgId = id;
  idx = 0;
  stack = [];
  onEnd = done ?? null;
  $('.dlg').hidden = false;
  $('.menubtn').hidden = true;
  showLine();
}

function showLine(): void {
  const l = cur();
  Voice.stop();
  endAnswer();
  if (l.who === 'player') return showAnswer(l);
  const sp = SPEAKERS[l.who] ?? { name: l.who };
  const box = $('.dlg');
  const a = artNow();
  setMemory(a.art, a.cine);
  if (CINE_FX[lineId()] === 'seal') $('.memory').classList.add('sealed');
  box.classList.toggle('echo', ECHO.has(l.who));
  box.classList.toggle('wake', l.who === 'wake' || l.who === 'stone');
  box.classList.toggle('sign', l.who === 'sign');
  // Le narrateur des cinématiques : sous-titre français toujours affiché, sous le japonais.
  const narr = l.who === 'narr';
  box.classList.toggle('narr', narr);
  $('.sub').hidden = !narr;
  $('.sub').textContent = narr ? l.fr : '';
  $('.face').hidden = !sp.face;
  if (sp.face) $<HTMLImageElement>('.face img').src = WORLD[sp.face];
  $('.name').innerHTML = rubyAll(sp.name);
  $('.wakebtn').hidden = !l.jp;
  $('.vbtns').hidden = !Voice.hasVoice(lineId());
  $('.text').classList.toggle('fr', !l.jp);
  $('.next').classList.remove('on');
  closeWord();
  peek = false;
  trOpen = !!l.jp && P.settings.translate === 'always';

  // バックログ : on garde les 120 dernières répliques.
  const w = world();
  const id = lineId();
  if (w.log[w.log.length - 1] !== id) {
    w.log.push(id);
    if (w.log.length > 120) w.log.splice(0, w.log.length - 120);
  }
  // Marqueurs de 役割語 rencontrés pour la première fois : ワケ les signale.
  marks = [];
  if (l.jp) {
    tokens = tokensOf(l.jp);
    for (const t of tokens) {
      const m = entryOf(t)?.marker;
      if (m && !w.notebook.includes(m)) {
        w.notebook.push(m);
        marks.push(m);
      }
    }
    if (!w.read[id]) P.noteSeen(tokens);
  } else tokens = [{ segs: [{ base: l.fr }], text: l.fr, reading: l.fr, punct: true }];
  saveWorld();
  total = charCount(tokens);
  updateWhisper(false);

  clearTimeout(waitTimer);
  clearInterval(typeTimer);
  const fast = skipping() && !!w.read[id];
  if (!fast) speak(false);
  const ms = P.MS_PER_CHAR[P.settings.textSpeed] * (l.jp ? 1 : 0.45);
  if (fast || ms === 0) return finishLine();
  if (skipping()) setSkip(false); // réplique jamais lue : la スキップ s'arrête
  shown = 0;
  $('.text').innerHTML = '';
  typeTimer = window.setInterval(() => {
    shown++;
    paint();
    if (shown >= total) finishLine();
  }, ms);
}

function paint(): void {
  const l = cur();
  if (l.who === 'player' && ans) {
    if (ans.done) return;
    $('.text').innerHTML = l.choices
      ? l.choices.map((c, k) => `<div class="choice"><b>${'一二三四'[k]}</b><span>${renderTokens(tokensOf(c.jp), `${lineId()}/${k}`, Infinity, peek)}</span></div>`).join('')
      : renderTokens(tokens, lineId(), Infinity, peek);
    return;
  }
  $('.text').innerHTML = l.jp ? renderTokens(tokens, lineId(), shown, peek) : esc(l.fr.slice(0, shown));
}

function finishLine(): void {
  clearInterval(typeTimer);
  shown = total;
  paint();
  $('.next').classList.add('on');
  updateWhisper(true);
  scheduleNext();
}

function scheduleNext(): void {
  clearTimeout(waitTimer);
  if (!dialogOpen() || panelOpen()) return;
  const w = world();
  if (skipping() && w.read[lineId()]) waitTimer = window.setTimeout(next, 70);
  else if (auto) {
    if (cur()?.who === 'player') return; // une réponse se dit, elle ne défile pas
    if (Voice.playing() === lineId()) return; // la fin de la voix relancera l'オート
    const a = P.AUTO_WAIT[P.settings.autoSpeed];
    // Une bulle de ワケ ouverte laisse un peu plus de temps pour la lire.
    const extra = $('.whisper').hidden ? 0 : 1600;
    waitTimer = window.setTimeout(next, a.base + a.per * total + extra);
  }
}

function next(): void {
  clearTimeout(waitTimer);
  Voice.stop();
  world().read[lineId()] = 1;
  saveWorld();
  idx++;
  while (idx >= lines.length && stack.length) {
    const back = stack.pop()!;
    dlgId = back.id;
    lines = DIALOGUES[dlgId] ?? [];
    idx = back.idx + 1;
  }
  if (idx < lines.length) return showLine();
  closeDialog();
}

/** Un choix du joueur mène à son dialogue ; à la fin, on reprend après la réplique du choix. */
function jump(to: string): void {
  stack.push({ id: dlgId, idx });
  dlgId = to;
  lines = DIALOGUES[to] ?? [];
  idx = 0;
  if (lines.length) showLine();
  else next();
}

// ---------- voix ----------

/** Joue la voix de la réplique en cours (normale ou lente). En オート, la suite attend la fin de la voix. */
function speak(slow: boolean): void {
  const id = lineId();
  const on = Voice.play(id, slow, () => {
    $('.vbtns').classList.remove('on');
    if (dialogOpen() && lineId() === id && shown >= total) scheduleNext();
  });
  $('.vbtns').classList.toggle('on', on);
}

function closeDialog(): void {
  clearInterval(typeTimer);
  clearTimeout(waitTimer);
  Voice.stop();
  endAnswer();
  stack = [];
  $('.dlg').hidden = true;
  $('.whisper').hidden = true;
  $('.menubtn').hidden = false;
  $('.dlg').classList.remove('narr');
  setMemory(undefined);
  replaying = false;
  closeWord();
  const cb = onEnd;
  onEnd = null;
  cb?.();
}

/** Espace, Entrée ou clic : ferme la fiche d'un mot, finit d'afficher la réplique, sinon passe à la suivante. */
export function advance(): void {
  if (!dialogOpen() || panelOpen()) return;
  if (!$('.word').hidden) return closeWord();
  if (ans) {
    // Une réponse se dit à voix haute. Espace ne passe que si le jeu le propose (micro absent, trois essais ratés).
    if (!ans.done && !$('.pass').hidden) pass();
    else if (!ans.done) nudge();
    return;
  }
  if (shown < total) return finishLine();
  next();
}

// ---------- répondre à voix haute ----------

function showAnswer(l: Line): void {
  const sp = SPEAKERS.player;
  const box = $('.dlg');
  box.classList.remove('wake', 'sign', 'ok', 'echo', 'narr');
  box.classList.add('answer');
  $('.sub').hidden = true;
  const a = artNow();
  setMemory(a.cine ? a.art : undefined, a.cine);
  $('.face').hidden = !sp.face;
  if (sp.face) $<HTMLImageElement>('.face img').src = WORLD[sp.face];
  $('.name').innerHTML = rubyAll(sp.name) + '<small>声に出して</small>';
  $('.wakebtn').hidden = false;
  $('.vbtns').hidden = true;
  $('.text').classList.remove('fr');
  $('.next').classList.remove('on');
  closeWord();
  setSkip(false);
  peek = false;
  trOpen = P.settings.translate === 'always';
  marks = [];

  const texts = l.choices ? l.choices.map((c) => c.jp) : [l.jp ?? ''];
  ans = { targets: texts.map((t) => target(t)), tries: 0, done: false, texts };
  tokens = texts.flatMap((t) => tokensOf(t));
  total = shown = charCount(tokens);
  paint();
  updateWhisper(true);

  $('.ans').hidden = false;
  $('.heard').textContent = '';
  $('.verdict').textContent = '';
  $('.pass').hidden = true;
  const dbg = $<HTMLInputElement>('.dbg');
  dbg.hidden = !DEBUG;
  if (DEBUG) {
    dbg.value = '';
    setTimeout(() => dbg.focus(), 50);
  }
  micState();
  Mic.arm(onHeard);
}

/** État du micro, sous la phrase : à l'écoute, refusé, ou absent (pas Chrome). Sans micro, on peut passer. */
function micState(): void {
  const m = $('.mic');
  let label = '話してください · dis la phrase à voix haute';
  let off = false;
  if (DEBUG) label = 'mode test : tape la phrase';
  else if (!SR) (label = 'Pas de reconnaissance vocale ici : ouvre le jeu dans Chrome.'), (off = true);
  else {
    Mic.start();
    if (Mic.denied) (label = 'Micro refusé : autorise-le dans Chrome (icône à gauche de l’adresse), puis recharge.'), (off = true);
  }
  m.classList.toggle('off', off);
  m.classList.toggle('live', !off && (DEBUG || Mic.live));
  $('.mic span').textContent = label;
  if (off && ans && !ans.done) $('.pass').hidden = false;
}
Mic.listen(() => {
  if (ans && !ans.done) micState();
});

function onHeard(h: { fin: string; inter: string; cands: string[]; settled: boolean }): void {
  if (!ans || ans.done) return;
  $('.heard').textContent = h.fin + h.inter;
  const v = judge(ans.targets, h.cands);
  if (v?.ok) return success(v.choice);
  if (!h.settled) return;
  if (v && !v.ok) {
    // Faute de jointure reconnue : la structure de cette phrase est ratée.
    for (const id of Progress.structuresOf(ans.texts[v.choice])) Progress.review(id, 1);
  }
  miss(v && !v.ok ? v.msg : 'Je n’ai pas reconnu la phrase. Redis-la en entier.');
}

function miss(msg: string): void {
  if (!ans) return;
  ans.tries++;
  Progress.logSentence(false);
  sfx('miss');
  $('.verdict').textContent = msg;
  const box = $('.dlg');
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
  if (ans.tries >= 3) $('.pass').hidden = false;
  Mic.arm(onHeard); // la prochaine tentative ne lit que ce qui sera dit après
}

function success(choice: number, passed = false): void {
  if (!ans) return;
  ans.done = true;
  Mic.disarm();
  sfx('ok');
  const l = cur();
  $('.verdict').textContent = '';
  $('.dlg').classList.add('ok');
  $('.seal').hidden = false;
  // La phrase dite rejoint la バックログ ; ses mots comptent pour l'acquisition.
  const said = l.choices ? `${lineId()}/${choice}` : lineId();
  const w = world();
  w.log.push(said);
  if (w.log.length > 120) w.log.splice(0, w.log.length - 120);
  w.read[lineId()] = 1;
  saveWorld();
  // Passée sans être dite : rien n'est compté.
  if (!passed) {
    Progress.logSentence(true);
    const got = P.noteSaid(tokensOf(ans.texts[choice]));
    const types = Progress.structuresOf(ans.texts[choice]).filter((id) => Progress.review(id, 3));
    if (types.length) toast(`型を覚えた <small>structure acquise : ${types.map((id) => esc(Progress.label(id))).join('、')}</small>`);
    else if (got.length) toast(`覚えた <small>acquis : ${got.map((t) => esc(t.text)).join('、')}</small>`);
  }
  // Seule la phrase dite reste affichée.
  if (l.choices) {
    tokens = tokensOf(ans.texts[choice]);
    $('.text').innerHTML = renderTokens(tokens, said);
  }
  const goto = l.choices?.[choice]?.goto;
  const action = l.choices?.[choice]?.act;
  if (action) hooks.act?.(passed ? action + ':pass' : action);
  waitTimer = window.setTimeout(() => {
    if (!dialogOpen() || cur() !== l) return;
    if (goto) {
      w.read[lineId()] = 1;
      jump(goto);
    } else next();
  }, 1100);
}

/** Passer une réponse (sans micro, ou après trois essais) : pas de mot compté, ワケ le dit. */
function pass(): void {
  if (!ans || ans.done) return;
  success(0, true);
  $('.dlg').classList.remove('ok');
  $('.seal').hidden = true;
  toast('飛ばした <small>passé : rien n’est compté</small>');
}

function nudge(): void {
  const m = $('.mic');
  m.classList.remove('nudge');
  void m.offsetWidth;
  m.classList.add('nudge');
}

function endAnswer(): void {
  if (!ans) return;
  ans = null;
  Mic.disarm();
  $<HTMLInputElement>('.dbg').blur();
  $('.ans').hidden = true;
  $('.seal').hidden = true;
  $('.dlg').classList.remove('answer', 'ok', 'shake');
}

// ---------- ワケ souffle ----------

function updateWhisper(lineDone: boolean): void {
  const l = cur();
  const tr = $('.wtr'), mk = $('.wmk');
  const jp = l?.jp || l?.choices;
  tr.hidden = !(jp && trOpen);
  tr.textContent = l?.choices ? l.choices.map((c, k) => `${'一二三四'[k]}　${c.fr}`).join('\n') : l?.jp ? l.fr : '';
  mk.hidden = !(lineDone && marks.length);
  mk.innerHTML = marks.map((m) => `<span>${esc(MARKERS[m].wake)}</span>`).join('');
  const wh = $('.whisper');
  wh.hidden = tr.hidden && mk.hidden;
  // La bulle se pose juste au-dessus de la boîte, quelle que soit sa hauteur.
  if (!wh.hidden) wh.style.bottom = `${window.innerHeight - $('.dlg').getBoundingClientRect().top + 12}px`;
  $('.wakebtn').classList.toggle('on', trOpen);
}

export function toggleTranslation(): void {
  if (!dialogOpen() || !(cur()?.jp || cur()?.choices)) return;
  trOpen = !trOpen;
  updateWhisper(shown >= total);
  if (shown >= total) scheduleNext();
}

function togglePeek(): void {
  if (!dialogOpen() || !(cur()?.jp || cur()?.choices)) return;
  peek = !peek;
  paint();
}

// ---------- オート, スキップ ----------

const skipping = () => skip || ctrlSkip;

function setAuto(on: boolean): void {
  auto = on;
  if (on) setSkip(false);
  $('.qm [data-a="auto"]').classList.toggle('on', on);
  $('.dlg').classList.toggle('auto', on);
  if (dialogOpen() && shown >= total) scheduleNext();
}

function setSkip(on: boolean): void {
  skip = on;
  if (on) auto = false;
  $('.qm [data-a="skip"]').classList.toggle('on', skipping());
  $('.qm [data-a="auto"]').classList.toggle('on', auto);
  $('.dlg').classList.toggle('auto', auto);
  if (on && dialogOpen()) {
    if (!world().read[lineId()]) {
      skip = false;
      $('.qm [data-a="skip"]').classList.remove('on');
      toast('未読です <small>pas encore lu</small>');
      return;
    }
    if (shown < total) finishLine();
    else scheduleNext();
  }
}

function setCtrlSkip(on: boolean): void {
  if (ctrlSkip === on) return;
  ctrlSkip = on;
  $('.qm [data-a="skip"]').classList.toggle('on', skipping());
  if (on && dialogOpen() && world().read[lineId()]) {
    if (shown < total) finishLine();
    else scheduleNext();
  }
}

// ---------- fiche d'un mot ----------

let wordTok: Token | null = null;

function openWord(el: HTMLElement): void {
  const src = lineById(el.dataset.l ?? '')?.jp;
  if (!src) return;
  const t = tokensOf(src)[Number(el.dataset.i)];
  if (!t) return;
  wordTok = t;
  P.markAsked(t);
  fillWord();
  const box = $('.word');
  box.hidden = false;
  const r = el.getBoundingClientRect();
  const bw = box.offsetWidth, bh = box.offsetHeight;
  const left = Math.max(10, Math.min(window.innerWidth - bw - 10, r.left + r.width / 2 - bw / 2));
  let top = r.top - bh - 12;
  if (top < 10) top = r.bottom + 12;
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
  refreshText();
}

function fillWord(): void {
  const t = wordTok!;
  const e = entryOf(t);
  const hasKanji = t.segs.some((s) => s.ruby);
  const m = e?.marker ? MARKERS[e.marker] : undefined;
  const lemma = t.key && t.key !== t.text ? `<div class="lemma">${esc(t.key)}${e?.r ? `<small>${esc(e.r)}</small>` : ''}</div>` : '';
  const furiOn = P.wantsRuby(t);
  $('.word').innerHTML = `
    <div class="wh"><b>${esc(t.text)}</b>${hasKanji || t.reading !== t.text ? `<span>${esc(t.reading)}</span>` : ''}</div>
    ${lemma}
    <div class="pos">${esc(e?.pos ?? '')}</div>
    <p>${esc(e?.fr ?? '…')}</p>
    ${m ? `<div class="role"><b>役割語・${m.who}</b> ${esc(t.key === e?.marker ? t.text : e!.marker!)} → ${esc(m.std)}<small>${MARKER_WHO[m.who] ?? ''}</small></div>` : ''}
    ${e?.note ? `<div class="note">${esc(e.note)}</div>` : ''}
    ${hasKanji ? `<button class="furi${furiOn ? ' on' : ''}" title="Afficher ou masquer le furigana de ce mot">ふりがな ${furiOn ? '表示' : '非表示'}</button>` : ''}`;
}

function closeWord(): void {
  $('.word').hidden = true;
  wordTok = null;
}

/** Redessine ce qui porte du furigana après un changement (fiche d'un mot, réglages). */
function refreshText(): void {
  if (dialogOpen() && (cur()?.jp || cur()?.choices)) paint();
  if (!$('.p-log').hidden) renderLog(false);
}

// ---------- panneaux ----------

type Panel = 'menu' | 'log' | 'slots' | 'config' | 'record' | 'scenes';
let panel: Panel | null = null;
export const panelOpen = () => panel !== null;

function openPanel(p: Panel): void {
  closeWord();
  clearTimeout(waitTimer);
  for (const s of root.querySelectorAll<HTMLElement>('.vp')) s.hidden = true;
  $(`.p-${p}`).hidden = false;
  $('.shade').hidden = false;
  panel = p;
}

function closePanel(): void {
  for (const s of root.querySelectorAll<HTMLElement>('.vp')) s.hidden = true;
  $('.shade').hidden = true;
  panel = null;
  closeWord();
  if (dialogOpen() && shown >= total) scheduleNext();
}

export function closeAll(): void {
  closePanel();
  if (dialogOpen()) {
    onEnd = null;
    closeDialog();
  }
}

export const openMenu = () => openPanel('menu');

// バックログ
let logTr = false;
function renderLog(scroll = true): void {
  const list = $('.log');
  const html: string[] = [];
  for (const id of world().log) {
    const l = lineById(id);
    if (!l) continue;
    const sp = SPEAKERS[l.who] ?? { name: '' };
    const read = !!world().read[id] || id === lineId();
    const body = l.jp ? renderTokens(tokensOf(l.jp), id) : esc(l.fr);
    const v = Voice.hasVoice(id) ? `<button class="lv" data-v="${esc(id)}" title="Réécouter">▶</button>` : '';
    html.push(`<div class="ent${l.jp ? '' : ' fr'}${l.who === 'wake' ? ' wake' : ''}${l.who === 'player' ? ' me' : ''}${read ? '' : ' unread'}">
      <div class="who">${sp.name ? rubyAll(sp.name) : '　'}${v}</div>
      <div class="lj">${body}</div>
      ${l.jp ? `<div class="tr"${logTr ? '' : ' hidden'}>${esc(l.fr)}</div>` : ''}
    </div>`);
  }
  list.innerHTML = html.join('') || '<p class="empty">Rien pour l’instant.</p>';
  if (scroll) list.scrollTop = list.scrollHeight;
}
function openLog(): void {
  openPanel('log');
  renderLog();
}

// セーブ・ロード : trois emplacements, en plus de la sauvegarde automatique.
const SLOTS_KEY = 'kotodama.slots.v1';
interface Slot {
  t: number;
  w: WorldSave;
  where: string;
  line: string;
}
function slots(): (Slot | null)[] {
  try {
    const s = JSON.parse(localStorage.getItem(SLOTS_KEY) || '[]');
    return [0, 1, 2].map((i) => s[i] ?? null);
  } catch {
    return [null, null, null];
  }
}
function placeName(w: WorldSave): string {
  const name = MAPS[w.place]?.name ?? placeById(w.place)?.name ?? w.place;
  return w.scene === 'map' ? `地図　${placeById(w.place)?.name ?? name}` : name;
}
let slotMode: 'save' | 'load' = 'save';
let armed = -1;
function renderSlots(): void {
  $('.p-slots h2').textContent = slotMode === 'save' ? 'セーブ' : 'ロード';
  const fmt = (t: number) => {
    const d = new Date(t);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}　${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  $('.slots').innerHTML = slots()
    .map((s, i) => {
      const n = ['一', '二', '三'][i];
      const off = slotMode === 'load' && !s;
      const ask = armed === i ? `<em>${slotMode === 'save' ? '上書きする？' : 'ロードする？'}<small>clique encore pour confirmer</small></em>` : '';
      return `<button class="slot${off ? ' off' : ''}${armed === i ? ' armed' : ''}" data-s="${i}"${off ? ' disabled' : ''}>
        <span class="no">${n}</span>
        ${s ? `<span class="meta"><b>${esc(s.where)}</b><time>${fmt(s.t)}</time><q>${esc(s.line)}</q></span>` : '<span class="meta empty">空き<small>emplacement vide</small></span>'}
        ${ask}
      </button>`;
    })
    .join('');
}
function openSlots(mode: 'save' | 'load'): void {
  slotMode = mode;
  armed = -1;
  openPanel('slots');
  renderSlots();
}
function useSlot(i: number): void {
  const all = slots();
  const s = all[i];
  if (slotMode === 'save') {
    if (s && armed !== i) {
      armed = i;
      return renderSlots();
    }
    hooks.beforeSave?.();
    const w = world();
    const lastId = w.log[w.log.length - 1];
    const last = lastId ? lineById(lastId) : undefined;
    all[i] = { t: Date.now(), w: JSON.parse(JSON.stringify(w)), where: placeName(w), line: last ? (last.jp ? plain(last.jp) : last.fr) : '' };
    try {
      localStorage.setItem(SLOTS_KEY, JSON.stringify(all));
      toast('セーブしました <small>sauvegardé</small>');
    } catch {
      toast('セーブできません <small>stockage indisponible</small>');
    }
    armed = -1;
    renderSlots();
  } else {
    if (!s) return;
    if (armed !== i) {
      armed = i;
      return renderSlots();
    }
    closeAll();
    replaceWorld(s.w);
    toast('ロードしました <small>chargé</small>');
    hooks.load?.();
  }
}

// 設定
function renderConfig(): void {
  const S = P.settings;
  const row = (label: string, fr: string, key: string, opts: [string | number, string][], val: string | number) =>
    `<div class="row"><label>${label}<small>${fr}</small></label><div class="seg">${opts
      .map(([v, t]) => `<button data-k="${key}" data-v="${v}"${v === val ? ' class="on"' : ''}>${t}</button>`)
      .join('')}</div></div>`;
  const st = P.wordsStats();
  $('.config').innerHTML = [
    row('文字の速さ', 'vitesse du texte', 'textSpeed', [[0, 'ゆっくり'], [1, 'ふつう'], [2, 'はやい'], [3, '一瞬']], S.textSpeed),
    row('オートの速さ', 'attente en オート', 'autoSpeed', [[0, 'ゆっくり'], [1, 'ふつう'], [2, 'はやい']], S.autoSpeed),
    row('ふりがな', 'auto : seulement ce que tu ne sais pas lire', 'furigana', [['auto', '自動'], ['all', '全部'], ['none', 'なし']], S.furigana),
    row('読める漢字', 'kanji réputés connus au départ', 'level', [['N3', 'N3まで'], ['N2', 'N2まで']], S.level),
    row('ワケの訳', 'la traduction de ワケ', 'translate', [['tap', 'タップで'], ['always', 'いつも']], S.translate),
    `<div class="row"><label>音量<small>volume général</small></label><input type="range" min="0" max="100" value="${Math.round(S.volume * 100)}" data-k="volume"></div>`,
    `<div class="row"><label>ボイス<small>volume des voix</small></label><input type="range" min="0" max="100" value="${Math.round(S.voice * 100)}" data-k="voice"></div>`,
    `<div class="row"><label>記録<small>toute la partie dans un fichier : monde, mots, progression, combat, réglages</small></label><div class="seg"><button data-k="backup" data-v="1">書き出す</button><button data-k="restore" data-v="1">読み込む</button></div></div>`,
    `<div class="row"><label>単語<small>mots suivis en cours : ${st.asked} · acquis, sans furigana : ${st.hidden}</small></label><div class="seg"><button data-k="reset" data-v="1"${armedReset ? ' class="on"' : ''}>${armedReset ? '本当に？' : 'リセット'}</button></div></div>`,
  ].join('');
}
let armedReset = false;
function setConfig(k: string, v: string): void {
  const S = P.settings as unknown as Record<string, unknown>;
  if (k === 'backup') return downloadBackup();
  if (k === 'restore') return $<HTMLInputElement>('.restore').click();
  if (k === 'reset') {
    if (!armedReset) armedReset = true;
    else {
      P.resetWords();
      armedReset = false;
      toast('リセットしました <small>mots oubliés</small>');
    }
    return renderConfig();
  }
  armedReset = false;
  S[k] = typeof S[k] === 'number' ? Number(v) : v;
  P.saveSettings();
  renderConfig();
  refreshText();
}

// 記録 : le bilan de la semaine.
let recBack = 0;
function openRecord(back: number): void {
  recBack = Math.max(0, Math.min(Progress.weeksBack(), back));
  if (panel !== 'record') openPanel('record');
  $('.rec').innerHTML = Record.render(recBack);
  $('.p-record [data-a="recnext"]').toggleAttribute('disabled', recBack === 0);
  $('.p-record [data-a="recprev"]').toggleAttribute('disabled', recBack >= Progress.weeksBack());
  $('.rec').scrollTop = 0;
}

/** Première partie d'une semaine : le bilan de la précédente s'ouvre tout seul (si rien d'autre n'est ouvert). */
export function maybeWeekly(): void {
  if (root.hidden || dialogOpen() || panelOpen()) return;
  if (Progress.weeklyDue()) openRecord(1);
}

// Sauvegarde complète : un fichier JSON à garder, et à recharger sur un autre navigateur.
function downloadBackup(): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([Progress.backup()], { type: 'application/json' }));
  a.download = `kotodama-${Progress.dayOf()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('書き出しました <small>sauvegarde téléchargée</small>');
}
$<HTMLInputElement>('.restore').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  input.value = '';
  if (!f) return;
  const err = Progress.restore(await f.text());
  if (err) return toast(`読み込めません <small>${esc(err)}</small>`);
  toast('読み込みました <small>partie chargée, redémarrage…</small>');
  setTimeout(() => location.reload(), 900);
});

// ---------- petits messages ----------

let toastTimer = 0;
export function toast(html: string): void {
  const t = $('.toast');
  t.innerHTML = html;
  t.hidden = false;
  t.classList.remove('go');
  void t.offsetWidth;
  t.classList.add('go');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), 1900);
}

// ---------- actions, souris, clavier ----------

function replay(slow: boolean): void {
  if (!dialogOpen() || ans || !Voice.hasVoice(lineId())) return;
  clearTimeout(waitTimer);
  speak(slow);
}

// ---------- 回想 : revoir les cinématiques et les souvenirs ----------

/** Les scènes qu'on peut revoir, dans l'ordre du chapitre. Une scène est débloquée dès que sa première réplique a été lue. */
export const SCENES: { label: string; fr: string; ids: string[] }[] = [
  { label: '序章', fr: 'Prologue : le pays de Yakumo', ids: ['pro:cine1', 'pro:cine2'] },
  { label: '記憶　水車小屋', fr: 'Souvenir : le moulin', ids: ['c1:memory'] },
  { label: '記憶　峠', fr: 'Souvenir : le col', ids: ['c2:memory'] },
  { label: '記憶　井戸', fr: 'Souvenir : le puits', ids: ['r1:memory'] },
  { label: '記憶　吊り橋', fr: 'Souvenir : le pont suspendu', ids: ['c3:memory'] },
  { label: '記憶　案山子', fr: 'Souvenir : l’épouvantail', ids: ['r2:memory'] },
  { label: '記憶　枕元', fr: 'Souvenir : au chevet de Tsuyu', ids: ['c4:memory'] },
  { label: '終章', fr: 'Épilogue : la brume se lève', ids: ['ep:tomb', 'ep:dawn', 'ep:tea', 'ep:seal'] },
];
let replaying = false;
function openScenes(): void {
  openPanel('scenes');
  const w = world();
  $('.scenes').innerHTML = SCENES.map((sc, i) => {
    const ok = !!w.read[sc.ids[0] + ':0'];
    return `<button class="scene${ok ? '' : ' locked'}" data-sc="${i}"${ok ? '' : ' disabled'}><b>${ok ? sc.label : '？？？'}</b><small>${ok ? sc.fr : 'pas encore vue'}</small></button>`;
  }).join('');
}
function playScene(i: number): void {
  const sc = SCENES[i];
  if (!sc || dialogOpen()) return;
  closePanel();
  replaying = true;
  openChain(sc.ids);
}

let armedNew = 0;
function askNewGame(): void {
  const b = $('.p-menu [data-a="newgame"]');
  if (Date.now() - armedNew > 4000) {
    armedNew = Date.now();
    b.innerHTML = 'はじめから<small>sûr ? clique encore : le monde repart du col (tes mots et ta progression restent)</small>';
    return;
  }
  newGame();
  location.reload();
}

function act(a: string): void {
  if (a === 'save' || a === 'load') openSlots(a);
  else if (a === 'auto') setAuto(!auto);
  else if (a === 'replay' || a === 'slow') replay(a === 'slow');
  else if (a === 'pass') pass();
  else if (a === 'skip') setSkip(!skip);
  else if (a === 'log') openLog();
  else if (a === 'record') openRecord(0);
  else if (a === 'scenes') openScenes();
  else if (a === 'newgame') askNewGame();
  else if (a === 'recprev') openRecord(recBack + 1);
  else if (a === 'recnext') openRecord(recBack - 1);
  else if (a === 'config') {
    armedReset = false;
    openPanel('config');
    renderConfig();
  } else if (a === 'close') closePanel();
  else if (a === 'logtr') {
    logTr = !logTr;
    $('.p-log .tgl').classList.toggle('on', logTr);
    renderLog(false);
  }
}

root.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const lv = el.closest<HTMLElement>('.lv[data-v]');
  if (lv) {
    e.stopPropagation();
    return void Voice.play(lv.dataset.v!);
  }
  if (el.closest('.dbg')) return;
  const btn = el.closest<HTMLElement>('[data-a]');
  if (btn) {
    e.stopPropagation();
    return act(btn.dataset.a!);
  }
  if (el.closest('.menubtn')) return openMenu();
  if (el.closest('.wakebtn')) return toggleTranslation();
  const sc = el.closest<HTMLElement>('.scene[data-sc]');
  if (sc) return playScene(Number(sc.dataset.sc));
  const slot = el.closest<HTMLElement>('.slot');
  if (slot) return useSlot(Number(slot.dataset.s));
  const cfg = el.closest<HTMLElement>('.config button');
  if (cfg) return setConfig(cfg.dataset.k!, cfg.dataset.v!);
  if (el.closest('.word')) {
    if (el.closest('.furi') && wordTok) {
      P.setFuri(wordTok, !P.wantsRuby(wordTok));
      fillWord();
      refreshText();
    }
    return;
  }
  const w = el.closest<HTMLElement>('.w');
  if (w) return openWord(w);
  if (el.closest('.shade')) return closePanel();
  if (el.closest('.vp')) return closeWord();
  if (el.closest('.dlg')) return advance();
});

root.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.k === 'volume' || el.dataset.k === 'voice') {
    P.settings[el.dataset.k] = Number(el.value) / 100;
    P.saveSettings();
    hooks.settings?.();
  }
});

// Molette vers le haut sur la boîte : バックログ (comme dans un VN).
$('.dlg').addEventListener('wheel', (e) => {
  if (e.deltaY < 0 && !panelOpen()) openLog();
});

const keyHelp = new Set(['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyT', 'KeyA', 'KeyB', 'KeyF', 'KeyR', 'KeyL', 'Escape']);

// Le système de dialogue passe avant le jeu : écouté en phase de capture, il garde pour lui les touches qu'il utilise.
window.addEventListener(
  'keydown',
  (e) => {
    if (root.hidden) return;
    if (e.key === 'Control') setCtrlSkip(true);
    if (panelOpen()) {
      if (e.code === 'Escape' || (panel === 'log' && e.code === 'KeyB')) closePanel();
      if (!(panel === 'log' && /^Arrow|^Page/.test(e.code))) e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (dialogOpen()) {
      // Mode test : le champ de réponse garde ses touches ; Entrée envoie la phrase au juge.
      if (e.target instanceof HTMLInputElement && e.target.classList.contains('dbg')) {
        e.stopImmediatePropagation();
        if (e.key === 'Enter') {
          Mic.inject(e.target.value);
          e.target.value = '';
        } else if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (!keyHelp.has(e.code)) {
        if (e.key !== 'Control' && e.code !== 'KeyM') e.stopImmediatePropagation();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat && e.code !== 'Space' && e.code !== 'Enter') return;
      if (e.code === 'KeyT') toggleTranslation();
      else if (e.code === 'KeyA') setAuto(!auto);
      else if (e.code === 'KeyB') openLog();
      else if (e.code === 'KeyF') togglePeek();
      else if (e.code === 'KeyR') replay(false);
      else if (e.code === 'KeyL') replay(true);
      else if (e.code === 'Escape') {
        if (!$('.word').hidden) closeWord();
        else openMenu();
      } else advance();
      return;
    }
    if (e.code === 'Escape') {
      e.stopImmediatePropagation();
      openMenu();
    } else if (e.code === 'KeyB' && world().log.length) {
      e.stopImmediatePropagation();
      openLog();
    }
  },
  true,
);
window.addEventListener('keyup', (e) => e.key === 'Control' && setCtrlSkip(false), true);
window.addEventListener('blur', () => setCtrlSkip(false));

// Accès de test : window.KDV.
(window as unknown as { KDV: unknown }).KDV = {
  state: () => ({
    dialog: dialogOpen() ? lineId() : null,
    shown,
    total,
    auto,
    skip: skipping(),
    panel,
    tr: trOpen,
    marks,
    word: wordTok?.text ?? null,
    answer: ans ? { expect: ans.targets.map((t) => t.text), tries: ans.tries, done: ans.done, verdict: $('.verdict').textContent, heard: $('.heard').textContent } : null,
    voice: Voice.playing(),
  }),
  say: (t: string) => Mic.inject(t),
  answer: (k = 0) => ans && Mic.inject(ans.targets[k].text),
  wrong: (k = 0) => ans && ans.targets[k].bad[0] && Mic.inject(plain(ans.targets[k].bad[0].markup)),
  text: () => $('.text').innerHTML,
  open: (id: string) => openDialog(id),
  settings: P.settings,
  lex: LEX,
  record: (back = 0) => openRecord(back),
  progress: Progress,
};
