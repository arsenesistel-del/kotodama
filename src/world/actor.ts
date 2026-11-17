import * as Phaser from 'phaser';
import { DIRS, type Dir } from './assets';

/** Crée une fois pour toutes les animations de marche d'une feuille de personnage. */
export function ensureAnims(scene: Phaser.Scene, key: string): void {
  DIRS.forEach((d, i) => {
    const k = `${key}:${d}`;
    if (scene.anims.exists(k)) return;
    // Certaines feuilles n'ont que deux lignes de marche.
    const rows = Math.min(4, Math.floor((scene.textures.get(key).frameTotal - 1) / 4));
    scene.anims.create({
      key: k,
      frames: Array.from({ length: rows }, (_, r) => ({ key, frame: r * 4 + i })),
      frameRate: 8,
      repeat: -1,
    });
  });
}

export const idleFrame = (d: Dir) => DIRS.indexOf(d);

export function faceToward(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export const DIR_VEC: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
