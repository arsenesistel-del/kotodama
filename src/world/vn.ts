// Système de dialogue façon visual novel, en HTML par-dessus le jeu.
// Boîte avec portrait, nom et texte qui défile ; menu rapide en japonais (セーブ, ロード, オート, スキップ, バックログ, 設定) ;
// バックログ ; 既読スキップ ; オート ; emplacements de sauvegarde ; réglages.
// Les aides : furigana seulement sur les mots que le joueur ne sait pas lire, sens en français au toucher,
// et ワケ qui souffle la traduction et signale chaque nouveau marqueur de 役割語.
import './vn.css';
import { WORLD } from './assets';
import { DIALOGUES, SPEAKERS, type Line } from './dialogue';
import { LEX, MARKERS, MARKER_WHO } from './lexicon';
import { MAPS } from './maps';
import { placeById } from './places';
import * as P from './prefs';
import { replaceWorld, saveWorld, world, type WorldSave } from './state';
import { entryOf, parse, plain, tokenize, type Token } from './text';

/** Branchements fournis par le jeu (main.ts, scènes). */
export const hooks: {
  load?: () => void; // une partie vient d'être chargée : relancer la bonne scène
  beforeSave?: () => void; // la scène range sa position avant une sauvegarde
  settings?: () => void; // les réglages ont changé (volume)
} = {};

const root = document.createElement('div');
root.id = 'vn';
root.innerHTML = `
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
    </div>
    <button class="wakebtn" title="ワケ traduit (T)">訳</button>
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
  <section class="vp p-config" hidden>
    <header><h2>設定</h2><button class="x" data-a="close">✕</button></header>
    <div class="config"></div>
  </section>
  <div class="toast" hidden></div>`;
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
    const e = entryOf(t);
    let inner = '';
    for (const s of t.segs) {
      if (n >= limit) break;
      inner += s.ruby && ruby ? `<ruby>${esc(s.base)}<rt>${esc(s.ruby)}</rt></ruby>` : esc(s.base);
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

function lineById(id: string): Line | undefined {
  const k = id.lastIndexOf(':');
  return DIALOGUES[id.slice(0, k)]?.[Number(id.slice(k + 1))];
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

const lineId = () => `${dlgId}:${idx}`;
const cur = () => lines[idx];
export const dialogOpen = () => !$('.dlg').hidden;

export function openDialog(id: string, done?: () => void): void {
  lines = DIALOGUES[id] ?? [];
  if (!lines.length) return done?.();
  dlgId = id;
  idx = 0;
  onEnd = done ?? null;
  $('.dlg').hidden = false;
  $('.menubtn').hidden = true;
  showLine();
}

function showLine(): void {
  const l = cur();
  const sp = SPEAKERS[l.who] ?? { name: l.who };
  const box = $('.dlg');
  box.classList.toggle('wake', l.who === 'wake');
  box.classList.toggle('sign', l.who === 'sign');
  $('.face').hidden = !sp.face;
  if (sp.face) $<HTMLImageElement>('.face img').src = WORLD[sp.face];
  $('.name').innerHTML = rubyAll(sp.name);
  $('.wakebtn').hidden = !l.jp;
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
    const a = P.AUTO_WAIT[P.settings.autoSpeed];
    // Une bulle de ワケ ouverte laisse un peu plus de temps pour la lire.
    const extra = $('.whisper').hidden ? 0 : 1600;
    waitTimer = window.setTimeout(next, a.base + a.per * total + extra);
  }
}

function next(): void {
  clearTimeout(waitTimer);
  world().read[lineId()] = 1;
  saveWorld();
  idx++;
  if (idx < lines.length) return showLine();
  closeDialog();
}

function closeDialog(): void {
  clearInterval(typeTimer);
  clearTimeout(waitTimer);
  $('.dlg').hidden = true;
  $('.whisper').hidden = true;
  $('.menubtn').hidden = false;
  closeWord();
  const cb = onEnd;
  onEnd = null;
  cb?.();
}

/** Espace, Entrée ou clic : ferme la fiche d'un mot, finit d'afficher la réplique, sinon passe à la suivante. */
export function advance(): void {
  if (!dialogOpen() || panelOpen()) return;
  if (!$('.word').hidden) return closeWord();
  if (shown < total) return finishLine();
  next();
}

// ---------- ワケ souffle ----------

function updateWhisper(lineDone: boolean): void {
  const l = cur();
  const tr = $('.wtr'), mk = $('.wmk');
  tr.hidden = !(l?.jp && trOpen);
  tr.textContent = l?.jp ? l.fr : '';
  mk.hidden = !(lineDone && marks.length);
  mk.innerHTML = marks.map((m) => `<span>${esc(MARKERS[m].wake)}</span>`).join('');
  const wh = $('.whisper');
  wh.hidden = tr.hidden && mk.hidden;
  // La bulle se pose juste au-dessus de la boîte, quelle que soit sa hauteur.
  if (!wh.hidden) wh.style.bottom = `${window.innerHeight - $('.dlg').getBoundingClientRect().top + 12}px`;
  $('.wakebtn').classList.toggle('on', trOpen);
}

export function toggleTranslation(): void {
  if (!dialogOpen() || !cur()?.jp) return;
  trOpen = !trOpen;
  updateWhisper(shown >= total);
  if (shown >= total) scheduleNext();
}

function togglePeek(): void {
  if (!dialogOpen() || !cur()?.jp) return;
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
  if (dialogOpen() && cur()?.jp) paint();
  if (!$('.p-log').hidden) renderLog(false);
}

// ---------- panneaux ----------

type Panel = 'menu' | 'log' | 'slots' | 'config';
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
    html.push(`<div class="ent${l.jp ? '' : ' fr'}${l.who === 'wake' ? ' wake' : ''}${read ? '' : ' unread'}">
      <div class="who">${sp.name ? rubyAll(sp.name) : '　'}</div>
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
    `<div class="row"><label>音量<small>volume</small></label><input type="range" min="0" max="100" value="${Math.round(S.volume * 100)}" data-k="volume"></div>`,
    `<div class="row"><label>単語<small>mots dont tu as demandé la lecture : ${st.asked} · furigana masqué : ${st.hidden}</small></label><div class="seg"><button data-k="reset" data-v="1"${armedReset ? ' class="on"' : ''}>${armedReset ? '本当に？' : 'リセット'}</button></div></div>`,
  ].join('');
}
let armedReset = false;
function setConfig(k: string, v: string): void {
  const S = P.settings as unknown as Record<string, unknown>;
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

function act(a: string): void {
  if (a === 'save' || a === 'load') openSlots(a);
  else if (a === 'auto') setAuto(!auto);
  else if (a === 'skip') setSkip(!skip);
  else if (a === 'log') openLog();
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
  const btn = el.closest<HTMLElement>('[data-a]');
  if (btn) {
    e.stopPropagation();
    return act(btn.dataset.a!);
  }
  if (el.closest('.menubtn')) return openMenu();
  if (el.closest('.wakebtn')) return toggleTranslation();
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
  if (el.dataset.k === 'volume') {
    P.settings.volume = Number(el.value) / 100;
    P.saveSettings();
    hooks.settings?.();
  }
});

// Molette vers le haut sur la boîte : バックログ (comme dans un VN).
$('.dlg').addEventListener('wheel', (e) => {
  if (e.deltaY < 0 && !panelOpen()) openLog();
});

const keyHelp = new Set(['Space', 'Enter', 'NumpadEnter', 'KeyE', 'KeyT', 'KeyA', 'KeyB', 'KeyF', 'Escape']);

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
  state: () => ({ dialog: dialogOpen() ? lineId() : null, shown, total, auto, skip: skipping(), panel, tr: trOpen, marks, word: wordTok?.text ?? null }),
  text: () => $('.text').innerHTML,
  open: (id: string) => openDialog(id),
  settings: P.settings,
  lex: LEX,
};
