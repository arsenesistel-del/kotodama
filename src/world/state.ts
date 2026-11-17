// Sauvegarde du monde (où l'on est, ce qu'on a déjà vu). Séparée de celle du combat (`kotodama.v1`).
const KEY = 'kotodama.world.v1';

export interface WorldSave {
  v: 1;
  scene: 'village' | 'map';
  place: string; // lieu courant sur la carte du monde
  gate: string; // entrée du village par laquelle on arrive
  pos?: { x: number; y: number; face: string }; // position dans le village, en tuiles
  seen: Record<string, boolean>; // dialogues et lieux déjà vus
  hints: boolean; // aide des touches déjà montrée
  read: Record<string, 1>; // répliques déjà lues (« dialogue:numéro »), pour 既読スキップ
  log: string[]; // バックログ : les dernières répliques affichées
  notebook: string[]; // 言葉帳 : marqueurs de 役割語 déjà rencontrés
  quests: Record<string, import('./quests').QuestState>; // contrats acceptés (voir quests.ts)
  en: Record<string, number>; // 縁 : le lien avec chaque PNJ
  hunt?: string; // contrat dont la chasse est en cours
  after?: { quest: string; won: boolean; rank: string }; // résultat d'une chasse, à jouer au retour au village
}

const fresh = (): WorldSave => ({ v: 1, scene: 'village', place: 'kirino', gate: 'north', seen: {}, hints: false, read: {}, log: [], notebook: [], quests: {}, en: {} });

let cache: WorldSave | null = null;

export function world(): WorldSave {
  if (cache) return cache;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    cache = s && s.v === 1 ? Object.assign(fresh(), s) : fresh();
  } catch {
    cache = fresh();
  }
  return cache!;
}

export function saveWorld(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(world()));
  } catch {
    /* navigation privée : on joue sans sauvegarde */
  }
}

/** Remplace la partie en cours (chargement d'un emplacement de sauvegarde). */
export function replaceWorld(s: WorldSave): void {
  cache = Object.assign(fresh(), JSON.parse(JSON.stringify(s)));
  saveWorld();
}
