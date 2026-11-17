// Ressources du monde en pixel (pack Ninja Adventure, CC0). Chaque fichier devient une URL servie par Vite,
// indexée par son dossier et son nom : « tiles/floor », « actors/oldman3 », « audio/village ».
const files = import.meta.glob('../assets/world/**/*.{png,ogg}', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>;

export const WORLD: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const key = path.replace('../assets/world/', '').replace(/\.(png|ogg)$/, '');
  WORLD[key] = url;
}

export const TILE = 16;

// Les feuilles de personnage font 4 colonnes (bas, haut, gauche, droite) sur 7 lignes de 16 px.
// Lignes 0 à 3 : la marche. Ligne 0 : l'arrêt.
export const ACTOR_FRAME = { w: 16, h: 16 };
export const DIRS = ['down', 'up', 'left', 'right'] as const;
export type Dir = (typeof DIRS)[number];
