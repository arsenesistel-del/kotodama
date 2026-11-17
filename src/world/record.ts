// Bilan de la semaine (記録) : minutes parlées, phrases dites, structures et mots acquis, ce que le jeu va ramener.
// Rendu en HTML pour le panneau de vn.ts. Les chiffres viennent du suivi caché (progress.ts).
import * as Progress from './progress';

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
const DOW = ['月', '火', '水', '木', '金', '土', '日'];
const frDate = (day: string, opts: Intl.DateTimeFormatOptions) => new Date(day + 'T12:00:00').toLocaleDateString('fr-FR', opts);
const num = (n: number, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Minutes, avec une décimale en dessous de dix. */
export function minutes(ms: number): string {
  const m = ms / 60000;
  return m === 0 ? '0' : m < 10 ? num(Math.max(0.1, m), 1) : num(Math.round(m));
}

function delta(now: number, before: number, unit: string, running: boolean): string {
  if (!before && !now) return '';
  // Semaine en cours : pas de « moins », elle n'est pas finie.
  if (running) return before ? `<small>semaine d’avant : ${unit === 'min' ? minutes(before) + ' min' : num(before)}</small>` : '';
  if (!before) return `<small class="up">nouveau</small>`;
  const d = now - before;
  if (Math.abs(d) < 1e-9) return `<small>comme la semaine d’avant</small>`;
  return `<small class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${unit === 'min' ? minutes(Math.abs(d)) + ' min' : num(Math.abs(d))} sur la semaine d’avant</small>`;
}

function range(start: string): string {
  const end = Progress.addDays(start, 6);
  const sameMonth = start.slice(5, 7) === end.slice(5, 7);
  return sameMonth
    ? `du ${frDate(start, { day: 'numeric' })} au ${frDate(end, { day: 'numeric', month: 'long' })}`
    : `du ${frDate(start, { day: 'numeric', month: 'long' })} au ${frDate(end, { day: 'numeric', month: 'long' })}`;
}

const chip = (id: string, cls = '') => `<span class="chip${cls ? ' ' + cls : ''}">${esc(Progress.label(id))}</span>`;

export function render(back: number): string {
  const w = Progress.week(back);
  const today = Progress.dayOf();
  const c = Progress.counts();
  const pct = w.said ? Math.round((100 * w.ok) / w.said) : 0;
  const ago = back === 0 ? 'cette semaine' : back === 1 ? 'la semaine dernière' : `il y a ${back} semaines`;

  // Minutes parlées par jour : une barre par jour, chiffre affiché sur le meilleur jour et sur aujourd'hui, le reste au survol.
  const max = Math.max(...w.days.map((d) => d.ms), 1);
  const best = w.days.reduce((b, d, i) => (d.ms > w.days[b].ms ? i : b), 0);
  const bars = w.days
    .map((d, i) => {
      const h = d.ms ? Math.max(4, Math.round((88 * d.ms) / max)) : 0;
      const isToday = d.date === today;
      const tip = `${frDate(d.date, { weekday: 'long', day: 'numeric' })} : ${minutes(d.ms)} min, ${d.said} phrase${d.said > 1 ? 's' : ''}`;
      const shown = d.ms && (i === best || isToday);
      return `<div class="day${isToday ? ' today' : ''}${d.date > today ? ' future' : ''}" data-tip="${esc(tip)}">
        <div class="col">${shown ? `<em>${minutes(d.ms)}</em>` : ''}<i style="height:${h}px"></i></div>
        <b>${DOW[i]}</b>
      </div>`;
    })
    .join('');

  // Structures : les quatre fins sur les quatre types de mots, et le discours rapporté.
  const tab = Progress.structTable();
  const cell = (id: string) => {
    const s = tab.find((x) => x.id === id)!;
    const k = !s.seen ? 'new' : s.status === 'acquired' ? (s.r < Progress.SLIP ? 'slip' : 'acq') : 'learn';
    const glyph = { new: '未', learn: '中', acq: '得', slip: '忘' }[k];
    const fill = s.seen ? Math.min(1, s.s / Progress.acqOf(id)) : 0;
    const tip = !s.seen
      ? `${s.label} : jamais dite`
      : `${s.label} : ${k === 'acq' ? 'acquise' : k === 'slip' ? 'acquise, mais elle s’oublie' : 'en cours'} · tiendrait ${num(s.s, s.s < 10 ? 1 : 0)} j · souvenir ${Math.round(s.r * 100)} %${s.due ? ' · à revoir' : ''}`;
    return `<td class="${k}${s.seen && s.due ? ' due' : ''}" data-tip="${esc(tip)}"><span>${glyph}</span><i style="width:${Math.round(fill * 100)}%"></i></td>`;
  };
  const frames = Object.keys(Progress.FRAME_LABEL);
  const types = Object.keys(Progress.TYPE_LABEL);
  const grid = `<table class="sgrid"><thead><tr><th></th>${types.map((t) => `<th>${Progress.TYPE_LABEL[t]}</th>`).join('')}</tr></thead><tbody>
    ${frames.map((f) => `<tr><th>${Progress.FRAME_LABEL[f]}</th>${types.map((t) => cell(`s:${f}.${t}`)).join('')}</tr>`).join('')}
    <tr><th>「…」と言っていた</th>${cell('s:inyou')}<td class="void" colspan="3"></td></tr>
  </tbody></table>`;

  const dueS = tab.filter((s) => s.seen && s.due).sort((a, b) => a.r - b.r).map((s) => s.id);
  const dueW = Progress.dueWords();
  const acq = [...w.acqS.map((id) => chip(id, 's')), ...w.acqW.map((id) => chip(id))];

  return `
    <div class="wk"><b>${range(w.start)}</b><span>${ago}${w.active ? ` · ${w.active} jour${w.active > 1 ? 's' : ''} de jeu` : ''}</span></div>
    <div class="tiles">
      <div class="tile"><small>話した</small><b>${minutes(w.ms)}<u>min</u></b><span>minutes parlées</span>${delta(w.ms, w.prev.ms, 'min', back === 0)}</div>
      <div class="tile"><small>言った</small><b>${num(w.said)}</b><span>phrases dites</span>${w.said ? `<small>${pct} % justes</small>` : ''}</div>
      <div class="tile"><small>型</small><b>${w.acqS.length}</b><span>structure${w.acqS.length > 1 ? 's' : ''} acquise${w.acqS.length > 1 ? 's' : ''}</span><small>${c.structsAcq} sur ${Progress.STRUCTS.length} en tout</small></div>
      <div class="tile"><small>語</small><b>${w.acqW.length}</b><span>mot${w.acqW.length > 1 ? 's' : ''} acquis</span><small>${w.hunts ? `${w.wins} chasse${w.wins > 1 ? 's' : ''} gagnée${w.wins > 1 ? 's' : ''} sur ${w.hunts}` : ''}</small></div>
    </div>
    <h3>話した時間<small>minutes parlées, jour par jour</small></h3>
    <div class="mbars">${bars}</div>
    <h3>型<small>未 jamais dite · 中 en cours · 得 acquise · 忘 s’oublie · le trait sous la case : ce qu’elle tient</small></h3>
    ${grid}
    ${acq.length ? `<h3>覚えた<small>acquis ${ago}</small></h3><div class="chips">${acq.join('')}</div>` : ''}
    ${back === 0 && (dueS.length || dueW.length) ? `<h3>復習<small>ce que le jeu va te ramener dans les chasses et les dialogues</small></h3><div class="chips">${[...dueS.map((id) => chip(id, 's')), ...dueW.map((id) => chip(id))].join('')}</div>` : ''}
    ${!w.said && !w.ms ? `<p class="empty">${back === 0 ? 'Rien encore cette semaine. Parle à quelqu’un au village, ou pars en chasse.' : 'Rien cette semaine-là.'}</p>` : ''}`;
}
