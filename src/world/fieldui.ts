// Écrans de la メニュー ajoutés en session 10 : 持ち物 (le sac, le 渡り, la clochette) et 図鑑 (le bestiaire de tout
// ce qu'on a croisé : les 言蟲 des herbes hautes et les distorsions de l'histoire). Rendus en HTML par vn.ts.
// Aussi les réglages du combat, passés du repaire (retiré) à 設定 : lectures et effets sonores.
import { ASSETS } from '../combat/assets';
import * as Field from './field';
import * as Progress from './progress';
import { finalLine, questById, type QuestState } from './quests';
import { world } from './state';

const COMBAT = 'kotodama.v1';

/** Réglages du combat, gardés dans sa sauvegarde (game.js les relit au début de chaque combat). */
export function combatPref(k: 'read' | 'sound'): string | boolean {
  try {
    const s = JSON.parse(localStorage.getItem(COMBAT) || '{}');
    return k === 'read' ? (s.read ?? 'ask') : s.sound !== false;
  } catch {
    return k === 'read' ? 'ask' : true;
  }
}
export function setCombatPref(k: 'read' | 'sound', v: string | boolean): void {
  try {
    const s = JSON.parse(localStorage.getItem(COMBAT) || 'null') ?? { v: 1, stats: {}, stages: {}, total: 0, days: {}, frags: {} };
    s[k] = v;
    localStorage.setItem(COMBAT, JSON.stringify(s));
  } catch {
    /* rien */
  }
}

function frags(): number {
  try {
    const s = JSON.parse(localStorage.getItem(COMBAT) || '{}');
    return Object.values((s.frags ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0);
  } catch {
    return 0;
  }
}

const sec = (n: number) => n.toFixed(1).replace('.', ',');

/** 持ち物 : le 渡り, les matériaux, les objets. */
export function renderBag(): string {
  const f = Field.field();
  const need = Field.xpToNext(f.lvl);
  const pips = Array.from({ length: Field.maxHp(f.lvl) }, (_, i) => `<i class="${i < f.hp ? 'on' : ''}"></i>`).join('');
  const me = `<div class="me"><b>渡り</b><span class="lv">Lv ${f.lvl}</span><span class="hp">${pips}</span>
    <div class="xp"><i style="transform:scaleX(${Math.min(1, f.xp / need)})"></i></div>
    <small>経験 ${f.xp} / ${need} · PV ${f.hp}/${Field.maxHp(f.lvl)} · temps de réponse +${sec(Field.timeBonus(f.lvl))} s · ${f.wins} bête${f.wins > 1 ? 's' : ''} apaisée${f.wins > 1 ? 's' : ''}</small>
    <small>Le niveau donne des PV et un peu de temps. Il ne dit jamais la phrase à ta place.</small></div>`;
  const mats = Field.MAT_ORDER.map((m) => {
    const n = f.bag[m] ?? 0, d = Field.MATS[m];
    return `<div class="mat${n ? '' : ' none'}${d.tier === 2 ? ' rare' : ''}"><b><ruby>${d.name}<rt>${d.reading}</rt></ruby></b><span>×${n}</span><small>${n ? d.fr : '…'}</small></div>`;
  }).join('');
  const fr = frags();
  const items = [
    f.hasBell
      ? `<div class="item"><b>鈴</b><small>La clochette du 地蔵 de 薄野原. Tant qu’elle tinte, les 言蟲 s’écartent. Touche <kbd>X</kbd>.</small><button data-a="bell" class="${f.bell ? 'on' : ''}">${f.bell ? '止める · ranger' : '鳴らす · faire tinter'}</button></div>`
      : '',
    fr ? `<div class="item"><b>欠片</b><small>Fragments des distorsions apaisées : ${fr}. Ils serviront à la forge, au 鍛冶谷.</small></div>` : '',
  ].join('');
  return `${me}<h3>素材 <small>matériaux · bientôt chez おみつ et 萬作</small></h3><div class="mats">${mats}</div>${items ? `<h3>大事なもの <small>objets</small></h3>${items}` : ''}`;
}

// Les distorsions de l'histoire : la créature v4 (ou nouvelle) et le contrat où on la rencontre.
const BOSSES: { art: string; name: string; reading: string; fr: string; quest: string }[] = [
  { art: 'kake', name: '欠けの影', reading: 'かけのかげ', fr: 'L’ombre du manque', quest: 'c1' },
  { art: 'yuragi', name: '揺らぎ', reading: 'ゆらぎ', fr: 'Le vacillement', quest: 'c2' },
  { art: 'tsubu', name: '呟き', reading: 'つぶやき', fr: 'Le marmonnement', quest: 'r1' },
  { art: 'kuzure', name: '崩れ', reading: 'くずれ', fr: 'L’effondrement', quest: 'c3' },
  { art: 'mayoi', name: '迷い', reading: 'まよい', fr: 'L’hésitation', quest: 'r2' },
  { art: 'kiri', name: '霧の主', reading: 'きりのぬし', fr: 'Le seigneur de la brume', quest: 'c4' },
];
const seenBoss = (q?: QuestState) => !!q && (q.guess !== undefined || !!q.tries || !!q.rank || q.step === 'report' || q.step === 'done');
const calmedBoss = (q?: QuestState) => !!q && (!!q.rank || q.step === 'report' || q.step === 'done');

/** 図鑑 : tout ce qu'on a croisé. Une silhouette et « ？？？ » pour le reste. */
export function renderZukan(): string {
  const f = Field.field();
  const beasts = Field.SPECIES.map((sp, i) => {
    const m = f.beasts[sp.id];
    const no = String(i + 1).padStart(3, '0');
    if (!m) return `<div class="zc unknown"><span class="no">${no}</span><img src="${ASSETS[sp.px]}" alt=""><b>？？？</b><small>${Field.unlocked().includes(sp) ? 'Quelque part dans les herbes hautes.' : 'Pas encore apparue.'}</small></div>`;
    const acq = ['na', 'no', 'ia', 've'].filter((t) => Progress.status(`s:${sp.frame}.${t}`).status === 'acquired').length;
    return `<div class="zc"><span class="no">${no}</span><img src="${ASSETS[sp.px]}" alt=""><b><ruby>${sp.name}<rt>${sp.reading}</rt></ruby></b><em>${sp.fr}</em>
      <span class="chip">${Field.FRAME_JP[sp.frame]}</span><small>${sp.lore}</small>
      <div class="cnt">出会い ${m.seen} · 鎮め ${m.calmed} · 最高 Lv ${m.maxLv}${m.rare ? ` · 朱 ${m.rare}` : ''} · 型 ${acq}/4</div></div>`;
  }).join('');
  const w = world();
  const bosses = BOSSES.map((b) => {
    const q = w.quests[b.quest], qd = questById(b.quest);
    if (!seenBoss(q)) return `<div class="zc unknown boss"><img src="${ASSETS[b.art]}" alt=""><b>？？？</b><small>Une distorsion de l’histoire.</small></div>`;
    const fin = calmedBoss(q) && qd ? finalLine(qd) : null;
    return `<div class="zc boss"><img src="${ASSETS[b.art]}" alt=""><b><ruby>${b.name}<rt>${b.reading}</rt></ruby></b><em>${b.fr}</em>
      <small>${qd ? `${qd.side ? '小依頼' : '依頼'} ${qd.title}` : ''}${q?.rank ? ` · rang ${q.rank}` : ''}</small>
      ${fin ? `<p class="fin">「${fin.jp.replace(/^「|」$/g, '')}」</p>` : '<small>Pas encore apaisée.</small>'}</div>`;
  }).join('');
  const nb = Object.keys(f.beasts).length;
  return `<h3>言蟲 <small>petites bêtes des herbes hautes · ${nb}/${Field.SPECIES.length}</small></h3><div class="zgrid">${beasts}</div>
    <h3>歪み <small>distorsions de l’histoire</small></h3><div class="zgrid">${bosses}</div>`;
}
