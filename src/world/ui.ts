// Interface du monde, en HTML par-dessus le canvas : invite d'action, titre du lieu, aide des touches, fiche d'un lieu.
// Les dialogues (façon visual novel) sont dans vn.ts ; ce module les réexporte pour les scènes.
import './ui.css';
import * as VN from './vn';

export { advance, dialogOpen, openDialog, openMenu, panelOpen, toggleTranslation, toast } from './vn';
export { plain } from './text';

const root = document.createElement('div');
root.id = 'wui';
root.innerHTML = `
  <div class="vignette"></div>
  <div class="place" hidden><b></b><span class="seal">霧</span><em></em></div>
  <div class="prompt" hidden><kbd>Espace</kbd><span></span></div>
  <div class="hint" hidden></div>
  <div class="card" hidden><small class="ch"></small><b></b><span class="rd"></span><p></p><em></em></div>`;
document.body.appendChild(root);

const $ = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;

export function showUi(on: boolean): void {
  root.hidden = !on;
  VN.show(on);
}

// ---------- invite, titre du lieu, aide ----------

export function setPrompt(label: string | null): void {
  const p = $('.prompt');
  if (!label || VN.dialogOpen() || VN.panelOpen()) {
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
