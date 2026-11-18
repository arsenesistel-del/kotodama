// Rend une carte en pixel entière dans une image PNG, pour repérer les placements incohérents (passe en captures).
// node tools/render-map.mjs kirino [sortie.png] [échelle]
// Les tuiles, les objets, la roue du moulin, les PNJ (première image de leur feuille), et en option (--marks)
// un cadre vermillon autour des objets lisibles, un cadre bleu autour des portes. Le rendu des images passe par
// tools/render-map.py (Pillow).
import { runnerImport } from 'vite';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const marks = process.argv.includes('--marks');
const [id = 'kirino', out = `/tmp/map-${id}.png`, scale = '2'] = args;
const { module: B } = await runnerImport('/src/world/build.ts');
const { module: M } = await runnerImport('/src/world/maps/index.ts');
const { module: T } = await runnerImport('/src/world/tileset.ts');
const def = M.MAPS[id];
if (!def) throw new Error(`carte inconnue : ${id} (${Object.keys(M.MAPS).join(', ')})`);
const built = B.buildMap(def);
const dump = {
  w: def.width,
  h: def.height,
  sheets: T.SHEET_ORDER.map((s) => ({ name: s, first: T.FIRST_GID[s], cols: T.SHEETS[s].cols })),
  grids: built.grids,
  grass: [...built.grass],
  paint: built.paint,
  sprites: built.sprites.map((s) => ({ key: s.o.sprite.key, fw: s.o.sprite.frameW, fh: s.o.sprite.frameH, x: s.x * 16 + s.o.sprite.dx, y: s.y * 16 + s.o.sprite.dy })),
  npcs: def.npcs.map((n) => ({ sprite: n.sprite, x: n.x * 16, y: n.y * 16 })),
  readables: marks ? built.readables : [],
  doors: marks ? (def.doors ?? []).map((d) => [[d.x, d.y]]) : [],
  scale: Number(scale),
};
const tmp = join(mkdtempSync(join(tmpdir(), 'kd-')), 'map.json');
writeFileSync(tmp, JSON.stringify(dump));
execFileSync('python3', ['-I', resolve('tools/render-map.py'), tmp, resolve('src/assets/world'), out], { stdio: 'inherit' });
console.log(out);
