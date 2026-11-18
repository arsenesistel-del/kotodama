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
    const row = e.side === 'north' ? 0 : H - 1, col = e.side === 'west' ? 0 : W - 1, side = e.side === 'west' || e.side === 'east';
    let ok = false;
    for (let i = e.from; i <= e.to; i++) if (side ? reach(col, i) : reach(i, row)) ok = true;
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

  // Herbes hautes (session 10) : chaque case est dans une zone de rencontre, au niveau du chapitre 1 (1 à 10).
  let tall = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!built.grass[y * W + x]) continue;
      tall++;
      if (!reach(x, y)) fail(`${id} : herbes hautes inaccessibles en ${x},${y}`);
      if (!(def.zones ?? []).some((z) => x >= z.rect[0] && x <= z.rect[2] && y >= z.rect[1] && y <= z.rect[3])) fail(`${id} : herbes hautes hors zone en ${x},${y}`);
    }
  for (const z of def.zones ?? []) if (z.lv[0] < 1 || z.lv[1] > 10 || z.lv[0] > z.lv[1]) fail(`${id} : zone « ${z.name} » hors de la tranche 1 à 10`);
  for (const e of def.exits) if (e.place && !M.MAPS[e.place]) fail(`${id} : la sortie ${e.side} mène à ${e.place}, qui n'existe pas`);
  for (const e of def.exits) if (e.place && !M.MAPS[e.place].spawns[e.gate]) fail(`${id} : la sortie ${e.side} arrive par « ${e.gate} », absent de ${e.place}`);

  // Portes et intérieurs (session 11) : la porte s'ouvre sur une case qu'on atteint, l'intérieur existe, on en ressort
  // devant cette même porte ; figurants et rumeurs ont leurs répliques.
  for (const d of def.doors ?? []) {
    if (!M.MAPS[d.place]) fail(`${id} : la porte ${d.x},${d.y} mène à ${d.place}, qui n'existe pas`);
    else if (!M.MAPS[d.place].spawns[d.gate]) fail(`${id} : la porte de ${d.place} arrive par « ${d.gate} », absent`);
    if (!reach(d.x, d.y + 1)) fail(`${id} : on ne peut pas atteindre la porte de ${d.place}`);
    if (built.solid[d.y * W + d.x]) fail(`${id} : la porte de ${d.place} est murée`);
    const back = M.MAPS[d.place]?.exits.find((e) => e.place === id);
    const sp = back && def.spawns[back.gate];
    if (!sp) fail(`${id} : on ne ressort pas de ${d.place}`);
    else if (Math.floor(sp.x) !== d.x || Math.floor(sp.y - 0.2) !== d.y + 1) fail(`${id} : en sortant de ${d.place}, on n'arrive pas devant sa porte`);
  }
  for (const c of def.critters ?? []) {
    if (solid(Math.floor(c.x), Math.floor(c.y - 0.2))) fail(`${id} : ${c.sprite} est dans un mur`);
    if (c.id && !D.SPEAKERS[c.id]) fail(`${id} : le figurant ${c.id} n'a pas de nom`);
  }
  for (const r of def.rumors ?? []) for (const k of r.ids) if (!D.DIALOGUES[k]) fail(`${id} : rumeur ${k} sans répliques`);

  let open = 0;
  for (let i = 0; i < W * H; i++) open += seen[i];
  console.log(`${def.name} (${id}) : ${W}×${H}, ${open} cases accessibles, ${def.npcs.length} personnages, ${built.readables.length} choses à lire${tall ? `, ${tall} cases d'herbes hautes` : ''}.`);
}

// Toutes les répliques se terminent et ont une traduction.
for (const [k, lines] of Object.entries(D.DIALOGUES)) for (const l of lines) if (!l.fr) fail(`dialogue ${k} : une réplique sans traduction`);

if (fails) {
  console.error(`${fails} problème(s) dans les cartes.`);
  process.exit(1);
}
console.log('Cartes vérifiées.');
