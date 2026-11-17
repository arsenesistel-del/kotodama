// Images du combat : chaque fichier de src/assets/combat devient une URL servie par Vite, indexée par son nom.
// ASSETS : les peintures à l'encre (titre, repaire). PX : les créatures en pixel de la chasse (tools/pixelize.py).
const files = import.meta.glob('../assets/combat/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const pixels = import.meta.glob('../assets/combat/px/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const byName = (all: Record<string, string>) => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(all)) out[path.split('/').pop()!.replace(/\.\w+$/, '')] = url;
  return out;
};

export const ASSETS = byName(files);
export const PX = byName(pixels);
