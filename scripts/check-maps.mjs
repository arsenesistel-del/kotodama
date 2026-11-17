// Vérifie chaque carte en pixel : dimensions, points d'arrivée libres, sorties, PNJ et panneaux atteignables à pied,
// et que chaque personnage ou panneau a ses répliques. Lancé par `npm test`, donc avant chaque mise en ligne.
import { runnerImport } from 'vite';

const { module: B } = await runnerImport('/src/world/build.ts');
const { module: M } = await runnerImport('/src/world/maps/index.ts');
const { module: D } = await runnerImport('/src/world/dialogue.ts');

let fails = 0;
const fail = (m) => {
  fails++;
  console.error('✗ ' + m);
};

for (const [id, def] of Object.entries(M.MAPS)) {
  const built = B.buildMap(def);
  const W = def.width, H = def.height;
  const solid = (x, y) => x < 0 || y < 0 || x >= W || y >= H || built.solid[y * W + x] === 1;
  const npcCell = new Set(def.npcs.map((n) => `${Math.floor(n.x)},${Math.floor(n.y - 0.2)}`));

  const spawns = Object.entries(def.spawns);
  for (const [name, s] of spawns) if (solid(Math.floor(s.x), Math.floor(s.y - 0.2))) fail(`${id} : l'arrivée « ${name} » est dans un mur`);

  // Parcours en largeur depuis la première arrivée.
  const [, s0] = spawns[0];
  const seen = new Uint8Array(W * H);
  const q = [[Math.floor(s0.x), Math.floor(s0.y - 0.2)]];
  seen[q[0][1] * W + q[0][0]] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (solid(X, Y) || seen[Y * W + X] || npcCell.has(`${X},${Y}`)) continue;
      seen[Y * W + X] = 1;
      q.push([X, Y]);
    }
  }
  const reach = (x, y) => x >= 0 && y >= 0 && x < W && y < H && seen[y * W + x] === 1;
  const nextTo = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(x + dx, y + dy));

  for (const [name, s] of spawns) if (!reach(Math.floor(s.x), Math.floor(s.y - 0.2))) fail(`${id} : l'arrivée « ${name} » est coupée du reste`);
  for (const e of def.exits) {
    const row = e.side === 'north' ? 0 : H - 1;
    let ok = false;
    for (let x = e.from; x <= e.to; x++) if (reach(x, row)) ok = true;
    if (!ok) fail(`${id} : la sortie ${e.side} est inaccessible`);
  }
  for (const n of def.npcs) {
    if (!nextTo(Math.floor(n.x), Math.floor(n.y - 0.2))) fail(`${id} : on ne peut pas approcher ${n.id}`);
    if (!D.DIALOGUES[n.id]) fail(`${id} : ${n.id} n'a pas de répliques`);
    if (!D.SPEAKERS[n.id]) fail(`${id} : ${n.id} n'a pas de nom`);
  }
  for (const r of built.readables) {
    if (!r.cells.some(([x, y]) => nextTo(x, y))) fail(`${id} : on ne peut pas lire ${r.id}`);
    if (!D.DIALOGUES[def.readables[r.id] ?? r.id]) fail(`${id} : ${r.id} n'a pas de texte`);
  }
  for (const k of Object.keys(def.readables)) if (!built.readables.some((r) => r.id === k)) fail(`${id} : ${k} n'est posé nulle part`);

  let open = 0;
  for (let i = 0; i < W * H; i++) open += seen[i];
  console.log(`${def.name} (${id}) : ${W}×${H}, ${open} cases accessibles, ${def.npcs.length} personnages, ${built.readables.length} choses à lire.`);
}

// Toutes les répliques se terminent et ont une traduction.
for (const [k, lines] of Object.entries(D.DIALOGUES)) for (const l of lines) if (!l.fr) fail(`dialogue ${k} : une réplique sans traduction`);

if (fails) {
  console.error(`${fails} problème(s) dans les cartes.`);
  process.exit(1);
}
console.log('Cartes vérifiées.');
