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
}

const fresh = (): WorldSave => ({ v: 1, scene: 'village', place: 'kirino', gate: 'north', seen: {}, hints: false });

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
