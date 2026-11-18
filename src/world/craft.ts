// Session 12, l'économie (DESIGN « Un monde à parcourir », Le butin) : les matériaux des 言蟲 servent dès le chapitre 1.
// おみつ fait des dango à emporter, qui soignent dans les herbes ; 萬作 pose des pièces sur le sabre (une fois pour
// toutes) et fabrique des 札 (on les porte, chacun sert une fois). On commande à voix haute, comme partout.
// Sans Phaser ni DOM : la scène demande ici quoi proposer, et `npm test` vérifie les recettes (check-balance.mjs).
import type { Line } from './dialogue';
import * as Field from './field';
import { world } from './state';

export type Maker = 'omitsu' | 'mansaku';

export interface Recipe {
  id: Field.Item | Field.Part;
  maker: Maker;
  kind: 'dango' | 'part' | 'charm';
  name: string;
  reading: string;
  fr: string; // ce que ça fait, en français
  cost: Partial<Record<Field.Mat, number>>;
  after?: string; // contrat de l'histoire à finir avant que la recette soit proposée
  max?: number; // combien on peut en porter (dango et 札)
  order: string; // la phrase à dire, balisée
  orderFr: string;
}

export const RECIPES: Recipe[] = [
  {
    id: 'mitarashi', maker: 'omitsu', kind: 'dango', name: 'みたらし団子', reading: 'みたらしだんご', fr: 'Rend 3 PV, dans les herbes ou ailleurs.',
    cost: { kome: 2 }, max: 9, order: 'みたらし{団子|だんご}を、{包|つつ}んでください。', orderFr: 'Des dango mitarashi à emporter, s’il vous plaît.',
  },
  {
    id: 'sanshoku', maker: 'omitsu', kind: 'dango', name: '三色団子', reading: 'さんしょくだんご', fr: 'Rend tous les PV.', after: 'c2',
    cost: { kome: 4 }, max: 5, order: '{三色|さんしょく}{団子|だんご}を、{包|つつ}んでください。', orderFr: 'Des dango tricolores à emporter, s’il vous plaît.',
  },
  {
    id: 'tsukamaki', maker: 'mansaku', kind: 'part', name: '柄巻', reading: 'つかまき', fr: 'Le manche bien tenu : +0,5 s pour répondre.', after: 'c1',
    cost: { ito: 4, washi: 2 }, order: '{刀|かたな}を、{握|にぎ}りやすくしてほしいんです。', orderFr: 'Je voudrais que le sabre soit plus facile à tenir.',
  },
  {
    id: 'mamori', maker: 'mansaku', kind: 'charm', name: '守り札', reading: 'まもりふだ', fr: 'Contre une distorsion de l’histoire, le premier coup reçu est paré. Sert une fois.', after: 'c1',
    cost: { washi: 2, sumi: 2 }, max: 3, order: 'お{守|まも}りを{作|つく}ってください。', orderFr: 'Faites-moi une amulette, s’il vous plaît.',
  },
  {
    id: 'tsuka', maker: 'mansaku', kind: 'part', name: '軽い柄', reading: 'かるいつか', fr: 'Un manche plus léger : le coup critique part jusqu’à 4 s (au lieu de 3,5).', after: 'c2',
    cost: { mokuhen: 4, sumi: 3 }, order: '{刀|かたな}を、{軽|かる}くしてほしいんです。', orderFr: 'Je voudrais un sabre plus léger.',
  },
  {
    id: 'tsuba', maker: 'mansaku', kind: 'part', name: '鍔', reading: 'つば', fr: 'La garde : +1 PV max.', after: 'c2',
    cost: { teppen: 2, mokuhen: 2 }, order: '{鍔|つば}を{付|つ}けてほしいんです。', orderFr: 'Je voudrais une garde sur le sabre.',
  },
  {
    id: 'yobi', maker: 'mansaku', kind: 'charm', name: '呼び札', reading: 'よびふだ', fr: 'Les dix rencontres suivantes : une variante 朱 sur quatre (au lieu d’une sur seize).', after: 'c2',
    cost: { sumi: 3, ito: 1 }, max: 3, order: '{赤|あか}い{札|ふだ}が、ほしいんです。', orderFr: 'Je voudrais le talisman rouge.',
  },
  {
    id: 'saya', maker: 'mansaku', kind: 'part', name: '鞘', reading: 'さや', fr: 'Le fourreau : dégâts +20 % contre les distorsions de l’histoire.', after: 'c3',
    cost: { mokuhen: 5, washi: 4, teppen: 2 }, order: '{鞘|さや}を{作|つく}ってほしいんです。', orderFr: 'Je voudrais un fourreau.',
  },
];

export const recipeById = (id: string) => RECIPES.find((r) => r.id === id);
const done = (id?: string) => !id || world().quests[id]?.step === 'done';

/** 萬作 propose son travail une fois le premier contrat fini (le moulin tourne, il se remet à l'ouvrage). */
export const mansakuOpen = () => done('c1');

/** Recettes qu'un artisan propose : débloquées, pas déjà posées (pièces), pas au maximum (dango, 札). */
export function offered(maker: Maker): Recipe[] {
  const f = Field.field();
  return RECIPES.filter((r) => r.maker === maker && done(r.after) && !(r.kind === 'part' && f.parts[r.id as Field.Part]) && !(r.max && (f.items[r.id as Field.Item] ?? 0) >= r.max));
}

export const canPay = (r: Recipe) => Object.entries(r.cost).every(([m, n]) => (Field.field().bag[m as Field.Mat] ?? 0) >= (n ?? 0));
export const affordable = (maker: Maker) => offered(maker).filter(canPay);

/** Fabrique : prend les matériaux, range l'objet ou pose la pièce. Rend faux si ce n'est pas possible. */
export function make(id: string): boolean {
  const r = recipeById(id);
  if (!r || !offered(r.maker).includes(r) || !canPay(r)) return false;
  const f = Field.field();
  for (const [m, n] of Object.entries(r.cost)) f.bag[m as Field.Mat] = (f.bag[m as Field.Mat] ?? 0) - (n ?? 0);
  if (r.kind === 'part') {
    f.parts[r.id as Field.Part] = true;
    if (r.id === 'tsuba') f.hp = Math.min(Field.hpMax(), f.hp + 1); // la garde donne son PV tout de suite
  } else f.items[r.id as Field.Item] = (f.items[r.id as Field.Item] ?? 0) + 1;
  Field.saveField();
  return true;
}

// ---------- les dango ----------

export const DANGO_HEAL: Record<'mitarashi' | 'sanshoku', number> = { mitarashi: 3, sanshoku: Infinity };

/** Le dango qu'on mange (touche C, bouton de l'encart) : みたらし si elle suffit, sinon le 三色. */
export function bestDango(): 'mitarashi' | 'sanshoku' | null {
  const f = Field.field(), it = f.items, miss = Field.hpMax() - f.hp;
  if (miss <= 0) return null;
  if ((it.sanshoku ?? 0) > 0 && (miss > 3 || !(it.mitarashi ?? 0))) return 'sanshoku';
  if ((it.mitarashi ?? 0) > 0) return 'mitarashi';
  return null;
}

/** Manger un dango : rend des PV ; rend le nombre de PV regagnés (0 si rien à manger ou PV pleins). */
export function eat(id: 'mitarashi' | 'sanshoku' | null = bestDango()): number {
  const f = Field.field();
  if (!id || !(f.items[id] ?? 0) || f.hp >= Field.hpMax()) return 0;
  f.items[id]!--;
  return Field.heal(DANGO_HEAL[id]);
}

export const dangoCount = () => (Field.field().items.mitarashi ?? 0) + (Field.field().items.sanshoku ?? 0);

// ---------- les 札 ----------

/** Le 守り札 pare le premier coup reçu contre une distorsion : rend vrai s'il a servi. */
export function useMamori(): boolean {
  const f = Field.field();
  if (!(f.items.mamori ?? 0)) return false;
  f.items.mamori!--;
  Field.saveField();
  return true;
}

/** Le 呼び札 : dix rencontres où les variantes 朱 sortent plus souvent. Rend faux si un autre agit encore. */
export function useYobi(): boolean {
  const f = Field.field();
  if (!(f.items.yobi ?? 0) || f.lure > 0) return false;
  f.items.yobi!--;
  f.lure = 10;
  Field.saveField();
  return true;
}

// ---------- ce qu'on dit au comptoir ----------

/** La réplique de commande d'une recette (le joueur la dit ; l'artisan répond par `<maker>:make:<id>`). */
const orderChoice = (r: Recipe) => ({ jp: r.order, fr: `${r.orderFr} (${costText(r)})`, goto: `${r.maker}:make:${r.id}`, act: `make:${r.id}` });

export const costText = (r: Recipe) =>
  Field.MAT_ORDER.filter((m) => r.cost[m])
    .map((m) => `${Field.MATS[m].name}×${r.cost[m]}`)
    .join(' ');

/**
 * Les phrases proposées au comptoir (au plus quatre). Au salon de thé : le thé, les dango qu'on peut payer, le repos.
 * Chez 萬作 : ce qu'on peut payer (trois au plus), et de quoi s'en aller. `more` : après une première commande.
 */
const TEA = { jp: 'お{茶|ちゃ}をください。', fr: 'Un thé, s’il vous plaît (rend tous les PV).', goto: 'omitsu:tea', act: 'heal' };
const REST = { jp: '{少|すこ}し{休|やす}ませてください。', fr: 'Laissez-moi me reposer un peu (sauvegarder).', goto: 'chaya:rest', act: 'rest' };
const ENOUGH = (maker: Maker) => ({ jp: 'それで、{大丈夫|だいじょうぶ}です。', fr: 'Ce sera tout.', goto: `${maker}:bye`, act: 'leave' });
const TODAY = { jp: '{今日|きょう}は、{大丈夫|だいじょうぶ}です。', fr: 'Ça ira pour aujourd’hui.', goto: 'mansaku:bye', act: 'leave' };

export function pick(maker: Maker, more = false): Line {
  const can = affordable(maker);
  if (maker === 'omitsu') {
    const dango = can.map(orderChoice);
    const choices = more ? [...dango, ENOUGH('omitsu')] : [TEA, ...dango, REST];
    return { who: 'player', fr: more ? 'Autre chose à emporter ?' : 'Dis ce que tu veux : un thé, des dango à emporter, ou te reposer.', choices };
  }
  return {
    who: 'player',
    fr: 'Dis ce que tu veux qu’il fabrique (la liste est à côté), ou que ça ira pour aujourd’hui.',
    choices: [...can.slice(0, 3).map(orderChoice), more ? ENOUGH('mansaku') : TODAY],
  };
}

/** Toutes les phrases qu'on peut dire au comptoir, pour `npm test` (lexique, lectures, phrases acceptées). */
export const ALL_ORDERS: Line = { who: 'player', fr: 'Toutes les commandes (vérification seulement).', choices: [...RECIPES.map(orderChoice), TEA, REST, ENOUGH('omitsu'), TODAY] };

// ---------- l'encart du comptoir : ce qu'on peut faire faire, et ce qu'on a ----------

export interface SheetRow {
  name: string;
  reading: string;
  fr: string;
  cost: { mat: string; need: number; have: number }[];
  ok: boolean; // on peut le payer
  have: string; // « ×2 », « 済 »
}

/** Ce que montre la fiche d'un artisan pendant la commande (et le 持ち物). */
export function sheet(maker: Maker): SheetRow[] {
  const f = Field.field();
  return RECIPES.filter((r) => r.maker === maker && done(r.after)).map((r) => {
    const made = r.kind === 'part' && !!f.parts[r.id as Field.Part];
    const n = r.kind === 'part' ? 0 : (f.items[r.id as Field.Item] ?? 0);
    return {
      name: r.name,
      reading: r.reading,
      fr: r.fr,
      cost: Field.MAT_ORDER.filter((m) => r.cost[m]).map((m) => ({ mat: Field.MATS[m].name, need: r.cost[m]!, have: f.bag[m] ?? 0 })),
      ok: !made && canPay(r) && offered(maker).includes(r),
      have: made ? '済' : n ? `×${n}${r.max && n >= r.max ? ' max' : ''}` : '',
    };
  });
}
