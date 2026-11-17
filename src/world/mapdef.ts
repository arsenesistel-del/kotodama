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
  sprite?: { key: string; frameW: number; frameH: number; frame: number; dx: number; dy: number };
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

export interface MapDef {
  id: string;
  name: string;
  reading: string;
  fr: string;
  width: number;
  height: number;
  terrain: string[][]; // « . » herbe, « d » chemin, « w » eau, « T » forêt
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
  npcs: NpcDef[];
  readables: Record<string, string>; // id d'objet → id de dialogue
}
