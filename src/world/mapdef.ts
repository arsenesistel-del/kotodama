import type { Dir } from './assets';

/**
 * Un objet posé sur la carte, sur une grille de `w × h` tuiles.
 * `mask` dit, ligne par ligne, quelles cases bloquent : « # » bloque, « o » ouvre (un pont sur l'eau), « . » ne change rien.
 * `above` : nombre de lignes du haut dessinées devant les personnages (cimes, toits).
 */
export interface ObjDef {
  w: number;
  h: number;
  tile: (x: number, y: number) => number; // numéro global, 0 pour rien
  mask: string[];
  above: number;
  // `frame` absent : une image peinte par le code (paint.ts), sans découpage.
  sprite?: { key: string; frameW: number; frameH: number; frame?: number; dx: number; dy: number; anim?: string };
  top?: boolean; // posé par-dessus un autre objet (calque « deco ») : un pot sur une table, l'épouvantail dans la rizière
}

export interface Placed {
  o: ObjDef;
  x: number;
  y: number;
  id?: string; // pour les objets qu'on peut lire ou examiner
}

export interface Spawn {
  x: number;
  y: number;
  face: Dir;
}

export interface NpcDef {
  id: string;
  sprite: string;
  x: number;
  y: number;
  face: Dir;
}

/** Une porte : marcher dessus fait entrer dans un intérieur (`place`, par l'arrivée `gate`). */
export interface Door {
  x: number;
  y: number;
  place: string;
  gate: string;
  name: string; // nom du lieu, affiché à l'entrée
}

/**
 * La vie du village (session 11) : des poules qui picorent, un chat qui dort, des figurants qui passent.
 * `id` sert aux rumeurs ; `route` : le chemin d'un figurant (aller-retour), `area` : là où picore une poule.
 */
export interface Critter {
  id?: string;
  sprite: string;
  x: number;
  y: number;
  kind: 'peck' | 'nap' | 'stroll' | 'stand';
  face?: Dir;
  area?: [number, number, number, number];
  route?: [number, number][];
}

/** Une rumeur entendue en passant : deux figurants discutent quand on s'approche (bulles, sans arrêter le jeu). */
export interface Rumor {
  at: [number, number];
  r: number;
  who: [string, string]; // id des deux figurants (Critter.id), ou d'un PNJ
  ids: string[]; // dialogues joués à tour de rôle (variante « :ep » après l'épilogue)
}

export interface MapDef {
  id: string;
  name: string;
  reading: string;
  fr: string;
  width: number;
  height: number;
  // « . » herbe, « d » chemin, « w » eau, « T » forêt, « g » herbes hautes (rencontres, session 10).
  // Intérieurs (session 11), peints par le code : « F » plancher, « M » tatami, « E » terre battue (土間),
  // « K » plancher sombre du sanctuaire, « W » mur du fond, « X » bord de mur (côtés, bas), « _ » rien (noir).
  terrain: string[][];
  objects: Placed[];
  seed: number;
  music?: string;
  ambience?: { key: string; rows: [number, number] };
  fog: number;
  spawns: Record<string, Spawn>;
  // `place` : la sortie mène directement à un autre lieu en pixel (le col descend au village), sans la carte du monde.
  exits: { side: 'north' | 'south' | 'west' | 'east'; from: number; to: number; gate: string; place?: string }[];
  // Cases bloquées tant que le fil de l'histoire n'a pas posé `flag` (la brume du col, avant que ワケ soit libéré).
  barriers?: { cells: [number, number][]; flag: string; say: string }[];
  // Zones de rencontre : le niveau des 言蟲 selon l'endroit (un champ facile près du village, plus dur plus loin).
  zones?: import('./field').Zone[];
  npcs: NpcDef[];
  readables: Record<string, string>; // id d'objet → id de dialogue
  doors?: Door[];
  interior?: boolean; // un intérieur : pas de brume du dehors, caméra centrée, lumière chaude
  critters?: Critter[];
  rumors?: Rumor[];
}
