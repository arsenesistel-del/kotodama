// Les quêtes de chasse (session 11, DESIGN « Un monde à parcourir ») : un villageois demande, à voix haute et sans
// tableau, d'apaiser des 言蟲 précis (quelle bête, où, combien), ou de rapporter des matériaux. Comprendre la demande
// fait partie de la quête : l'encart ne la traduit pas, et une bête d'une autre espèce ou d'une autre zone ne compte pas.
// Sans Phaser ni DOM : la scène demande ici quoi jouer, le combat range ses résultats dans field.ts (`tally`),
// et `npm test` vérifie les règles (scripts/check-field.mjs).
import { DIALOGUES } from './dialogue';
import * as Field from './field';
import { saveWorld, world } from './state';
import { plain } from './text';

export interface HuntDef {
  id: string;
  title: string;
  reading: string;
  fr: string;
  giver: string;
  sp?: string; // espèce à apaiser
  zone?: string; // nom de la zone (薄野原 : 野原の入口, 野原の中, 池のほとり)
  mat?: Field.Mat; // ou bien : matériau à rapporter
  n: number;
  after?: string; // contrat de l'histoire à finir avant (« c1 »), ou seulement accepté (« c1+ »)
  reward: Partial<Record<Field.Mat, number>>;
  key: number; // réplique de la demande qui dit quoi, où, combien (affichée dans l'encart, en japonais)
}

export const HUNTS: HuntDef[] = [
  { id: 'h1', title: '薄取り', reading: 'すすきとり', fr: 'Les herbes de la lune', giver: 'omitsu', sp: 'tsubuyaki', zone: '野原の入口', n: 4, after: 'c1+', reward: { kome: 2 }, key: 1 },
  { id: 'h2', title: '鳥追い', reading: 'とりおい', fr: 'Chasser les oiseaux', giver: 'gonbei', sp: 'uwasadori', zone: '野原の入口', n: 3, after: 'c1', reward: { kome: 3 }, key: 1 },
  { id: 'h3', title: '糸集め', reading: 'いとあつめ', fr: 'Du fil pour おたね', giver: 'otane', mat: 'ito', n: 5, after: 'c1', reward: { washi: 2 }, key: 1 },
  { id: 'h4', title: '蛾見物', reading: 'がけんぶつ', fr: 'Voir une phalène', giver: 'taichi', sp: 'mayoiga', zone: '野原の中', n: 1, after: 'c2', reward: { teppen: 1 }, key: 1 },
  { id: 'h5', title: '狐払い', reading: 'きつねばらい', fr: 'Les renards du pont', giver: 'mansaku', sp: 'wakegitsune', zone: '池のほとり', n: 2, after: 'c3', reward: { teppen: 1, mokuhen: 2 }, key: 1 },
];


export interface HuntState {
  step: 'given' | 'done';
  base: number; // bêtes de ce compte déjà apaisées quand la quête a été donnée
}

const tallyKey = (h: HuntDef) => `${h.sp}@${h.zone ?? ''}`;

function opened(h: HuntDef): boolean {
  if (!h.after) return true;
  const plus = h.after.endsWith('+');
  const st = world().quests[h.after.replace('+', '')];
  return plus ? !!st : st?.step === 'done';
}

const hunts = () => (world().hunts ??= {});
export const stateOf = (h: HuntDef): HuntState | undefined => hunts()[h.id];
export const huntById = (id: string) => HUNTS.find((h) => h.id === id);

/** Où en est la quête : combien sont faits (bêtes apaisées depuis la demande, ou matériaux dans le sac). */
export function progress(h: HuntDef): number {
  const st = stateOf(h);
  if (!st) return 0;
  if (h.mat) return Field.field().bag[h.mat] ?? 0;
  return Math.max(0, (Field.field().tally?.[tallyKey(h)] ?? 0) - st.base);
}

export const ready = (h: HuntDef) => stateOf(h)?.step === 'given' && progress(h) >= h.n;

/** Quêtes qu'un PNJ peut donner ou dont il attend le compte rendu, dans l'ordre. */
const ofNpc = (npc: string) => HUNTS.filter((h) => h.giver === npc && opened(h) && stateOf(h)?.step !== 'done');

export interface Plan {
  ids: string[];
  after?: () => { card?: [string, string, string]; toast?: string } | void;
}

/** Ce que dit un PNJ à propos de ses quêtes de chasse, ou rien. */
export function talkPlan(npc: string): Plan | null {
  const h = ofNpc(npc)[0];
  if (!h) return null;
  const st = stateOf(h);
  if (!st)
    return {
      ids: [h.id + ':give'],
      after: () => {
        hunts()[h.id] = { step: 'given', base: h.sp ? Field.field().tally?.[tallyKey(h)] ?? 0 : 0 };
        saveWorld();
        return { card: [h.title, `頼み · ${h.fr}`, '頼'] };
      },
    };
  if (!ready(h)) return { ids: [h.id + ':wait'] };
  return {
    ids: [h.id + ':done'],
    after: () => {
      st.step = 'done';
      const f = Field.field();
      if (h.mat) f.bag[h.mat] = Math.max(0, (f.bag[h.mat] ?? 0) - h.n);
      for (const [m, k] of Object.entries(h.reward)) f.bag[m as Field.Mat] = (f.bag[m as Field.Mat] ?? 0) + (k ?? 0);
      Field.saveField();
      const xp = Field.storyXp('hunt');
      const ups = Field.gainXp(xp);
      const w = world();
      w.en[npc] = (w.en[npc] ?? 0) + 1;
      saveWorld();
      return {
        card: [h.title, 'Demande remplie', '了'],
        toast: `縁 ＋1 <small>${Field.fmtLoot(h.reward)} · 経験 +${xp}${ups.length ? ` · 渡り Lv ${ups[ups.length - 1]}` : ''}</small>`,
      };
    },
  };
}

/** « ！ » au-dessus d'un PNJ qui a une demande à faire ou un compte à recevoir. */
export function marker(npc: string): '！' | null {
  const h = ofNpc(npc)[0];
  return h && (!stateOf(h) || ready(h)) ? '！' : null;
}

/** L'encart : la demande telle qu'elle a été dite (en japonais), et le compte. */
export function hud() {
  return HUNTS.filter((h) => stateOf(h)?.step === 'given').map((h) => {
    const p = Math.min(progress(h), h.n);
    const quote = plain(DIALOGUES[h.id + ':give']?.[h.key]?.jp ?? '');
    return {
      title: h.title,
      reading: h.reading,
      fr: h.fr,
      kind: '頼み',
      rows: [
        { label: `「${quote}」`, done: false, now: !ready(h) },
        { label: h.mat ? `持っている : ${p}` : `鎮めた : ${p}`, done: ready(h), now: !ready(h) },
        { label: `Retourner voir ${NAMES[h.giver]}`, done: false, now: ready(h) },
      ],
    };
  });
}

/** Fin d'un combat : une ligne si la bête comptait pour une quête en cours (« 頼み 鳥追い 2 »). */
export function noteFor(b: Field.Beast): string {
  const h = HUNTS.find((x) => stateOf(x)?.step === 'given' && x.sp === b.sp && x.zone === b.zone);
  if (!h) return '';
  return `<small>頼み · ${h.title} ${Math.min(progress(h), h.n)}${ready(h) ? ' · 済' : ''}</small>`;
}

const NAMES: Record<string, string> = { taichi: '太一', omitsu: 'おみつ', mansaku: '萬作', otane: 'おたね', gonbei: '権兵衛' };
