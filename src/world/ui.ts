// Interface du monde, en HTML par-dessus le canvas : boîte de dialogue façon visual novel,
// invite d'action, titre du lieu, aide des touches. Le texte japonais passe mieux en HTML (furigana, polices).
import './ui.css';
import { WORLD } from './assets';
import { DIALOGUES, SPEAKERS, type Line } from './dialogue';

const root = document.createElement('div');
root.id = 'wui';
root.innerHTML = `
  <div class="vignette"></div>
  <div class="place" hidden><b></b><span class="seal">霧</span><em></em></div>
  <div class="prompt" hidden><kbd>Espace</kbd><span></span></div>
  <div class="hint" hidden></div>
  <div class="card" hidden><small class="ch"></small><b></b><span class="rd"></span><p></p><em></em></div>
  <div class="dlg" hidden>
    <div class="face"><img alt=""></div>
    <div class="body">
      <div class="name"></div>
      <div class="text"></div>
      <div class="tr" hidden><i>ワケ</i><span></span></div>
    </div>
    <button class="wakebtn" title="Traduction (T)">訳</button>
    <div class="next">▼</div>
  </div>`;
document.body.appendChild(root);

const $ = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;

export function showUi(on: boolean): void {
  root.hidden = !on;
}

/** Transforme « {漢字|かんじ} » en segments, pour un affichage progressif avec furigana. */
function parse(src: string): { base: string; ruby?: string }[] {
  const out: { base: string; ruby?: string }[] = [];
  const re = /\{([^|}]+)\|([^}]+)\}/g;
  let i = 0;
  for (let m; (m = re.exec(src)); ) {
    for (const ch of src.slice(i, m.index)) out.push({ base: ch });
    out.push({ base: m[1], ruby: m[2] });
    i = m.index + m[0].length;
  }
  for (const ch of src.slice(i)) out.push({ base: ch });
  return out;
}

function render(segs: ReturnType<typeof parse>, n: number): string {
  let html = '';
  let k = 0;
  for (const s of segs) {
    if (k >= n) break;
    const esc = s.base.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
    html += s.ruby ? `<ruby>${esc}<rt>${s.ruby}</rt></ruby>` : esc;
    k += s.base.length;
  }
  return html;
}

export const plain = (src: string) => parse(src).map((s) => s.base).join('');

// ---------- dialogue ----------

let lines: Line[] = [];
let idx = 0;
let shown = 0;
let total = 0;
let segs: ReturnType<typeof parse> = [];
let timer = 0;
let onEnd: (() => void) | null = null;
let showTr = false;

export const dialogOpen = () => !$('.dlg').hidden;

export function openDialog(id: string, done?: () => void): void {
  lines = DIALOGUES[id] ?? [];
  if (!lines.length) return done?.();
  idx = 0;
  onEnd = done ?? null;
  $('.dlg').hidden = false;
  setPrompt(null);
  showLine();
}

function showLine(): void {
  const l = lines[idx];
  const sp = SPEAKERS[l.who] ?? { name: l.who };
  const box = $('.dlg');
  box.classList.toggle('wake', l.who === 'wake');
  box.classList.toggle('sign', l.who === 'sign');
  const img = $<HTMLImageElement>('.face img');
  $('.face').hidden = !sp.face;
  if (sp.face) img.src = WORLD[sp.face];
  $('.name').innerHTML = render(parse(sp.name), 99);
  // ワケ parle français ; les autres parlent japonais et ワケ traduit à la demande.
  const text = l.jp ?? l.fr;
  segs = parse(text);
  total = segs.reduce((s, x) => s + x.base.length, 0);
  shown = 0;
  $('.tr span').textContent = l.jp ? l.fr : '';
  $('.tr').hidden = !(l.jp && showTr);
  $('.wakebtn').hidden = !l.jp;
  $('.text').classList.toggle('fr', !l.jp);
  $('.next').classList.remove('on');
  clearInterval(timer);
  const speed = l.jp ? 55 : 22;
  timer = window.setInterval(() => {
    shown++;
    $('.text').innerHTML = render(segs, shown);
    if (shown >= total) finishLine();
  }, speed);
}

function finishLine(): void {
  clearInterval(timer);
  shown = total;
  $('.text').innerHTML = render(segs, total);
  $('.next').classList.add('on');
}

/** Espace ou Entrée : finit d'afficher la réplique, sinon passe à la suivante. */
export function advance(): void {
  if (!dialogOpen()) return;
  if (shown < total) return finishLine();
  idx++;
  if (idx < lines.length) return showLine();
  $('.dlg').hidden = true;
  clearInterval(timer);
  const cb = onEnd;
  onEnd = null;
  cb?.();
}

export function toggleTranslation(): void {
  if (!dialogOpen() || !lines[idx]?.jp) return;
  showTr = !showTr;
  $('.tr').hidden = !showTr;
}

$('.wakebtn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleTranslation();
});
$('.dlg').addEventListener('click', () => advance());

// ---------- invite, titre du lieu, aide ----------

export function setPrompt(label: string | null): void {
  const p = $('.prompt');
  if (!label) {
    p.hidden = true;
    return;
  }
  p.hidden = false;
  $('.prompt span').innerHTML = label;
}

export function placeCard(name: string, fr: string): void {
  const c = $('.place');
  $('.place b').textContent = name;
  $('.place em').textContent = fr;
  c.hidden = false;
  c.classList.remove('go');
  void c.offsetWidth;
  c.classList.add('go');
  window.setTimeout(() => (c.hidden = true), 4600);
}

export function hint(html: string | null, ms = 9000): void {
  const h = $('.hint');
  if (!html) {
    h.hidden = true;
    return;
  }
  h.innerHTML = html;
  h.hidden = false;
  window.setTimeout(() => (h.hidden = true), ms);
}

export function vignette(on: boolean): void {
  $('.vignette').hidden = !on;
}

// ---------- fiche d'un lieu, sur la carte du monde ----------

export function placeInfo(p: { name: string; reading: string; fr: string; chapter: string } | null, action: string): void {
  const c = $('.card');
  if (!p) {
    c.hidden = true;
    return;
  }
  c.hidden = false;
  $('.card .ch').textContent = p.chapter === '終' ? '終章' : `第${p.chapter}章`;
  $('.card b').textContent = p.name;
  $('.card .rd').textContent = p.reading;
  $('.card p').textContent = p.fr;
  $('.card em').innerHTML = action;
}
