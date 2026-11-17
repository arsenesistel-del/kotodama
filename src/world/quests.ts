// Les contrats (DESIGN, « La boucle ») : un PNJ demande de l'aide, on interroge les témoins à voix haute,
// on va sur le site finir la phrase de la créature (la déduction), on la chasse, puis on rapporte au PNJ
// ce qu'on a entendu. Sans Phaser ni DOM : la scène du village demande ici quoi jouer, et `npm test` vérifie
// que chaque contrat a ses répliques.
import { DIALOGUES } from './dialogue';
import { plain } from './text';
import { saveWorld, world } from './state';

export type Frame = 'omou' | 'kamo' | 'souda';

export interface QuestDef {
  id: string;
  title: string; // en japonais
  reading: string;
  fr: string;
  giver: string; // PNJ qui donne le contrat et qui reçoit le rapport
  witnesses: string[]; // PNJ à interroger (le donneur témoigne déjà en donnant le contrat)
  site: string; // objet à examiner où la créature se montre
  siteFr: string;
  stage: string; // chasse du moteur (CONTRACT_STAGES dans engine.js)
  answer: Frame; // la fin perdue
  prev?: string; // contrat à finir avant
}

export const QUESTS: QuestDef[] = [
  { id: 'c1', title: '水車小屋の影', reading: 'すいしゃごやのかげ', fr: 'L’ombre du moulin', giver: 'taichi', witnesses: ['otane', 'gonbei'], site: 'site-mill', siteFr: 'le moulin', stage: 'c-kake', answer: 'omou' },
  { id: 'c2', title: '峠の噂', reading: 'とうげのうわさ', fr: 'La rumeur du col', giver: 'omitsu', witnesses: ['mansaku', 'gonbei'], site: 'site-jizo', siteFr: 'le 地蔵 du col', stage: 'c-yuragi', answer: 'souda', prev: 'c1' },
  { id: 'c3', title: '吊り橋', reading: 'つりばし', fr: 'Le pont suspendu', giver: 'mansaku', witnesses: ['otane', 'taichi'], site: 'sign-bridge', siteFr: 'le pont suspendu', stage: 'c-kuzure', answer: 'kamo', prev: 'c2' },
];

export type Step = 'given' | 'hunt' | 'report' | 'done';
export interface QuestState {
  step: Step;
  heard: string[]; // témoins déjà interrogés
  guess?: Frame; // la fin dite sur le site
  right?: boolean;
  rank?: string; // rang de la chasse gagnée
  tries?: number; // chasses tentées
}

export const NAMES: Record<string, string> = { taichi: '太一', omitsu: 'おみつ', mansaku: '萬作', otane: 'おたね', gonbei: '権兵衛' };

export const questById = (id: string) => QUESTS.find((q) => q.id === id);
export const stateOf = (q: QuestDef): QuestState | undefined => world().quests[q.id];

/** Le contrat en cours ou le prochain à prendre (le premier qui n'est pas fini et dont le précédent l'est). */
export function current(): QuestDef | undefined {
  return QUESTS.find((q) => stateOf(q)?.step !== 'done' && (!q.prev || world().quests[q.prev]?.step === 'done'));
}

/** Contrat accepté et pas encore rapporté. */
export function active(): QuestDef | undefined {
  const q = current();
  const st = q && stateOf(q);
  return q && st && st.step !== 'done' ? q : undefined;
}

export const missing = (q: QuestDef): string[] => q.witnesses.filter((w) => !stateOf(q)?.heard.includes(w));

export interface Plan {
  ids: string[]; // dialogues à jouer à la suite
  after?: () => void; // ce qui change une fois qu'ils sont finis
}

/** Ce que dit un PNJ quand on lui parle, selon où en sont les contrats. */
export function talkPlan(npc: string): Plan {
  const w = world();
  const met = !!w.seen['talk:' + npc];
  // Réplique de base : la première rencontre, puis la réplique courte… ou celle d'après son contrat, si le village a guéri.
  let base = met && DIALOGUES[npc + ':again'] ? npc + ':again' : npc;
  for (const q of QUESTS) if (q.giver === npc && stateOf(q)?.step === 'done' && DIALOGUES[q.id + ':after']) base = q.id + ':after';

  const q = current();
  const st = q && stateOf(q);
  if (q && !st && q.giver === npc)
    return { ids: met ? [q.id + ':give'] : [npc, q.id + ':give'], after: () => accept(q) };
  if (q && st && (st.step === 'given' || st.step === 'hunt')) {
    if (q.witnesses.includes(npc) && !st.heard.includes(npc))
      return {
        ids: [`${q.id}:${npc}`],
        after: () => {
          st.heard.push(npc);
          saveWorld();
        },
      };
    if (q.giver === npc) return { ids: [base, wakeHint(q)] };
  }
  if (q && st && st.step === 'report' && q.giver === npc)
    return {
      ids: [q.id + ':report'],
      after: () => {
        st.step = 'done';
        w.en[npc] = (w.en[npc] ?? 0) + 1;
        saveWorld();
      },
    };
  return { ids: [base] };
}

export function accept(q: QuestDef): void {
  world().quests[q.id] = { step: 'given', heard: [] };
  saveWorld();
}

/** Examiner un objet : le site d'un contrat, ou le texte ordinaire. `ready` : on peut finir la phrase et chasser. */
export function sitePlan(readId: string, fallback: string): Plan & { hunt?: QuestDef } {
  const q = active();
  const st = q && stateOf(q);
  if (q && st && q.site === readId && (st.step === 'given' || st.step === 'hunt')) {
    if (missing(q).length) return { ids: [wakeHint(q)] };
    return { ids: [q.id + ':site'], hunt: q };
  }
  const done = QUESTS.find((x) => x.site === readId && stateOf(x)?.step === 'done');
  if (done && DIALOGUES[readId + ':done']) return { ids: [readId + ':done'] };
  return { ids: [fallback] };
}

/** Action dite dans un dialogue : « guess:c1:omou », la fin choisie sur le site. */
export function act(a: string): void {
  const [kind, id, frame, pass] = a.split(':');
  const q = questById(id);
  const st = q && stateOf(q);
  if (kind !== 'guess' || !q || !st) return;
  st.guess = frame as Frame;
  st.right = frame === q.answer && pass !== 'pass'; // passée sans la dire : pas de bonus
  st.step = 'hunt';
  saveWorld();
}

/** Résultat d'une chasse de contrat, à l'arrivée au village : les dialogues à jouer. */
export function afterHunt(): string[] {
  const w = world();
  const r = w.after;
  w.after = undefined;
  w.hunt = undefined;
  const q = r && questById(r.quest);
  const st = q && stateOf(q);
  if (!q || !st) {
    saveWorld();
    return [];
  }
  st.tries = (st.tries ?? 0) + 1;
  if (!r.won) {
    saveWorld();
    return ['hunt:lost'];
  }
  st.step = 'report';
  st.rank = r.rank;
  saveWorld();
  return [q.id + ':memory', q.id + (st.right ? ':right' : ':wrong')];
}

// ---------- ce que ワケ souffle quand on ne sait plus où aller ----------

const list = (xs: string[]) => xs.map((x) => NAMES[x] ?? x).join(' et ');

export function hintText(q: QuestDef): string {
  const st = stateOf(q);
  if (!st) return `${NAMES[q.giver]} a quelque chose à nous demander.`;
  if (st.step === 'report') return `Retourne voir ${NAMES[q.giver]}. Raconte-lui ce que tu as entendu.`;
  const m = missing(q);
  if (m.length) return `On ne sait pas encore comment finit sa phrase. Interroge d’abord ${list(m)}.`;
  return `On en sait assez. Direction ${q.siteFr}.`;
}

/** Dialogue d'une seule réplique de ワケ, fabriqué à la demande. */
export function wakeHint(q: QuestDef): string {
  DIALOGUES['wake:hint'] = [{ who: 'wake', fr: hintText(q) }];
  return 'wake:hint';
}

/** Ce que montre le petit encart du contrat en cours, ou null. */
export function hud(): { title: string; reading: string; fr: string; rows: { label: string; done: boolean; now: boolean }[] } | null {
  const q = active();
  const st = q && stateOf(q);
  if (!q || !st) return null;
  const heard = (n: string) => st.heard.includes(n);
  const m = missing(q);
  const rows = [
    { label: `Témoins : ${[q.giver, ...q.witnesses].map((n) => (n === q.giver || heard(n) ? '✓' : '・') + (NAMES[n] ?? n)).join('　')}`, done: !m.length, now: !!m.length },
    { label: `Finir sa phrase : ${q.siteFr}`, done: st.step === 'report', now: !m.length && st.step !== 'report' },
    { label: `Rapporter à ${NAMES[q.giver]}`, done: false, now: st.step === 'report' },
  ];
  return { title: q.title, reading: q.reading, fr: q.fr, rows };
}

/** Marqueurs au-dessus des PNJ : « ！ » pour un contrat à prendre ou à rapporter, « ？ » pour un témoin. */
export function marker(npc: string): '！' | '？' | null {
  const q = current();
  if (!q) return null;
  const st = stateOf(q);
  if (!st) return q.giver === npc ? '！' : null;
  if (st.step === 'report') return q.giver === npc ? '！' : null;
  if (st.step === 'given' || st.step === 'hunt') return q.witnesses.includes(npc) && !st.heard.includes(npc) ? '？' : null;
  return null;
}

/** Texte en clair d'une réplique (pour la phrase finale affichée en combat). */
export function finalLine(q: QuestDef): { id: string; jp: string; fr: string } {
  const l = DIALOGUES[q.id + ':final'][0];
  return { id: q.id + ':final:0', jp: plain(l.jp ?? ''), fr: l.fr };
}
