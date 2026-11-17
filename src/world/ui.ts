// Interface du monde, en HTML par-dessus le canvas : invite d'action, titre du lieu, aide des touches, fiche d'un lieu.
// Les dialogues (façon visual novel) sont dans vn.ts ; ce module les réexporte pour les scènes.
import './ui.css';
import * as VN from './vn';

export { advance, dialogOpen, openChain, openDialog, openMenu, panelOpen, toggleTranslation, toast } from './vn';
export { plain } from './text';

const root = document.createElement('div');
root.id = 'wui';
root.innerHTML = `
  <div class="vignette"></div>
  <div class="place" hidden><b></b><span class="seal">霧</span><em></em></div>
  <div class="prompt" hidden><kbd>Espace</kbd><span></span></div>
  <div class="hint" hidden></div>
  <div class="quests" hidden></div>
  <div class="field" hidden></div>
  <div class="card" hidden><small class="ch"></small><b></b><span class="rd"></span><p></p><em></em></div>`;
document.body.appendChild(root);
// La clochette de l'encart du 渡り : la scène écoute cet événement (touche X aussi).
root.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('.field .bell')) window.dispatchEvent(new Event('kotodama:bell'));
});

const $ = <T extends HTMLElement>(s: string) => (root.querySelector(s) ?? card.querySelector(s)) as T;

// Le carton de chapitre passe au-dessus de tout, dialogues compris.
const card = document.createElement('div');
card.id = 'kcard';
card.innerHTML = `<div class="chapter" hidden><small></small><b></b><em></em><span class="seal"></span></div>
  <div class="start" hidden><b>言霊</b><em>KOTODAMA</em><button>はじめる<small>clic ou Espace · Chrome, micro et son allumés</small></button></div>`;
document.body.appendChild(card);

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

export function placeCard(name: string, fr: string, seal = '霧'): void {
  const c = $('.place');
  $('.place .seal').textContent = seal;
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

// ---------- contrats en cours, en haut à gauche ----------

type QuestBox = { title: string; reading: string; fr: string; side?: boolean; rows: { label: string; done: boolean; now: boolean }[] };

/** Les contrats en cours : celui de l'histoire en entier, les contrats de révision repliés sur leur étape. */
export function questHud(list: QuestBox[] | QuestBox | null): void {
  const box = $('.quests');
  const qs = !list ? [] : Array.isArray(list) ? list : [list];
  box.hidden = !qs.length;
  box.innerHTML = qs
    .map((q, i) => {
      const rows = i === 0 ? q.rows : q.rows.filter((r) => r.now);
      return `<div class="quest${i ? ' small' : ''}"><small>${q.side ? '小依頼' : '依頼'}</small><b><ruby>${q.title}<rt>${q.reading}</rt></ruby></b><em>${q.fr}</em><ul>${rows
        .map((r) => `<li class="${r.done ? 'done' : ''}${r.now ? ' now' : ''}">${r.label}</li>`)
        .join('')}</ul></div>`;
    })
    .join('');
}

/** L'encart du 渡り dans les herbes hautes (session 10) : niveau, PV, expérience, clochette, zone. */
export function fieldHud(f: { lvl: number; hp: number; max: number; xp: number; bell: boolean | null; zone: string } | null): void {
  const box = $('.field');
  box.hidden = !f;
  if (!f) return;
  const pips = Array.from({ length: f.max }, (_, i) => `<i class="${i < f.hp ? 'on' : ''}"></i>`).join('');
  box.innerHTML = `<div class="row"><b>渡り</b><span class="lv">Lv ${f.lvl}</span><span class="hp">${pips}</span>${
    f.bell === null ? '' : `<button class="bell${f.bell ? ' on' : ''}" title="Clochette (X)">鈴<small>${f.bell ? 'ちりん' : 'X'}</small></button>`
  }</div><div class="xp"><i style="transform:scaleX(${Math.max(0, Math.min(1, f.xp))})"></i></div>${f.zone ? `<em>${f.zone}</em>` : ''}`;
}

// ---------- carton de chapitre, plein écran ----------

/** Carton noir avec le titre du chapitre calligraphié à la verticale. `end` : le sceau 了 de fin de chapitre. */
export function chapterCard(ch: string, title: string, sub: string, end = false, ms = 5200): Promise<void> {
  const c = $('.chapter');
  $('.chapter small').textContent = ch;
  $('.chapter b').textContent = title;
  $('.chapter em').textContent = sub;
  $('.chapter .seal').textContent = end ? '了' : '';
  $('.chapter .seal').hidden = !end;
  c.hidden = false;
  c.classList.remove('go');
  void c.offsetWidth;
  c.classList.add('go');
  return new Promise((r) =>
    window.setTimeout(() => {
      c.hidden = true;
      r();
    }, ms),
  );
}

/** Écran d'ouverture d'une nouvelle partie : un clic, qui autorise aussi le son et le micro dans Chrome. */
export function pressStart(): Promise<void> {
  const st = card.querySelector('.start') as HTMLElement;
  st.hidden = false;
  return new Promise((r) => {
    const go = (e?: Event) => {
      if (e instanceof KeyboardEvent && !['Space', 'Enter'].includes(e.code)) return;
      e?.preventDefault();
      e?.stopImmediatePropagation();
      window.removeEventListener('keydown', go, true);
      st.removeEventListener('click', go);
      st.classList.add('out');
      window.setTimeout(() => {
        st.hidden = true;
        st.classList.remove('out');
        r();
      }, 700);
    };
    st.addEventListener('click', go);
    window.addEventListener('keydown', go, true);
  });
}
