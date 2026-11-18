import * as Phaser from 'phaser';
import { TILE } from './assets';
import type { BuiltMap } from './build';
import { FIRST_GID, SHEET_ORDER } from './tileset';
import { paintKey } from './paint';

export const DEPTH = { ground: 0, paint: 0.5, detail: 1, below: 2, deco: 2.5, actors: 3, above: 5, fog: 6 } as const;

/** Pose la carte dans une scène Phaser : quatre calques de tuiles et les images animées. */
export function drawMap(scene: Phaser.Scene, built: BuiltMap): Phaser.Tilemaps.Tilemap {
  const { width: W, height: H } = built.def;
  const map = scene.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: W, height: H });
  const tilesets = SHEET_ORDER.map((s) => map.addTilesetImage(s, 'tiles/' + s, TILE, TILE, 0, 0, FIRST_GID[s])!);
  // Intérieurs : sols et murs peints par le code, une image par case (textures prêtes : paint.ts).
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const key = built.paint[y][x] && paintKey(built, x, y);
      if (key) scene.add.image(x * TILE, y * TILE, key).setOrigin(0).setDepth(DEPTH.paint);
    }
  for (const name of ['ground', 'detail', 'below', 'deco', 'above'] as const) {
    const layer = map.createBlankLayer(name, tilesets, 0, 0, W, H)!;
    const g = built.grids[name];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x]) layer.putTileAt(g[y][x], x, y);
    layer.setDepth(DEPTH[name]);
  }
  for (const s of built.sprites) {
    const sp = s.o.sprite!;
    const im = scene.add
      .sprite(s.x * TILE + sp.dx, s.y * TILE + sp.dy, sp.key, sp.frame)
      .setOrigin(0, 0)
      .setDepth(s.o.top ? DEPTH.deco : DEPTH.actors + (s.y + s.o.h) * TILE * 1e-5);
    if (sp.anim) im.play(sp.anim);
  }
  return map;
}
