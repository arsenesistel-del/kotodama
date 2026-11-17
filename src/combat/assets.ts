// Images du combat : chaque fichier de src/assets/combat devient une URL servie par Vite, indexée par son nom.
const files = import.meta.glob('../assets/combat/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const ASSETS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.webp$/, '');
  ASSETS[name] = url;
}
