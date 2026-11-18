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
  flags: Record<string, boolean>; // le fil du chapitre : prologue vu, ワケ libéré, épilogue joué (ch1)
  hunts?: Record<string, import('./hunts').HuntState>; // quêtes de chasse des villageois (session 11)
  count?: Record<string, number>; // compteurs du village : 絵馬 déjà lus, おみくじ tirées
}

// Une nouvelle partie commence au col, avant le village : c'est là que le prologue libère ワケ.
const fresh = (): WorldSave => ({ v: 1, scene: 'village', place: 'pass', gate: 'start', seen: {}, hints: false, read: {}, log: [], notebook: [], quests: {}, en: {}, flags: {} });

/** Partie commencée avant la session 8 (sans prologue) : on la considère comme passée par le col. */
function migrate(s: WorldSave): WorldSave {
  if (!s.flags) s.flags = {};
  // 霧野峠 (le repaire) n'est plus sur la carte depuis la session 10.
  if (s.place === 'touge') {
    s.place = 'kirino';
    s.gate = 'north';
    s.scene = 'village';
    s.pos = undefined;
  }
  if (!s.flags.prologue && s.place !== 'pass') {
    s.flags.prologue = true;
    s.flags.wake = true;
  }
  return s;
}

let cache: WorldSave | null = null;

export function world(): WorldSave {
  if (cache) return cache;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    cache = s && s.v === 1 ? migrate(Object.assign(fresh(), s)) : fresh();
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
  cache = migrate(Object.assign(fresh(), JSON.parse(JSON.stringify(s))));
  saveWorld();
}

/** Nouvelle partie : le monde repart du col. Les mots, la progression et les réglages suivent le joueur et restent. */
export function newGame(): void {
  cache = fresh();
  saveWorld();
}
