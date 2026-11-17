// Les feuilles de tuiles du pack, et la conversion « feuille + colonne + ligne » en numéro de tuile global.

export type SheetName = 'floor' | 'nature' | 'house' | 'water' | 'element' | 'field' | 'detail';

export const SHEETS: Record<SheetName, { cols: number; rows: number }> = {
  floor: { cols: 22, rows: 26 },
  nature: { cols: 24, rows: 21 },
  house: { cols: 33, rows: 23 },
  water: { cols: 28, rows: 17 },
  element: { cols: 16, rows: 15 },
  field: { cols: 5, rows: 15 },
  detail: { cols: 16, rows: 5 },
};

export const SHEET_ORDER = Object.keys(SHEETS) as SheetName[];

// Premier numéro global de chaque feuille, comme dans Tiled (le 0 veut dire « vide »).
export const FIRST_GID: Record<SheetName, number> = {} as Record<SheetName, number>;
{
  let g = 1;
  for (const s of SHEET_ORDER) {
    FIRST_GID[s] = g;
    g += SHEETS[s].cols * SHEETS[s].rows;
  }
}

export function gid(sheet: SheetName, x: number, y: number): number {
  return FIRST_GID[sheet] + y * SHEETS[sheet].cols + x;
}

/**
 * Tuiles de transition du pack (même disposition pour la terre et l'eau) :
 * un carré 3×3 (bords et coins), une bande verticale, une bande horizontale, une tuile isolée,
 * et quatre coins intérieurs. `ox, oy` est le coin haut gauche du bloc dans la feuille.
 * `same(dx, dy)` dit si la case voisine est du même terrain.
 */
export function autotile(sheet: SheetName, ox: number, oy: number, same: (dx: number, dy: number) => boolean): number {
  const n = same(0, -1), s = same(0, 1), w = same(-1, 0), e = same(1, 0);
  const t = (x: number, y: number) => gid(sheet, ox + x, oy + y);
  if (n && s && w && e) {
    if (!same(1, 1)) return t(5, 1);
    if (!same(-1, 1)) return t(6, 1);
    if (!same(1, -1)) return t(5, 2);
    if (!same(-1, -1)) return t(6, 2);
    return t(1, 1);
  }
  if (!w && !e) {
    if (n && s) return t(3, 1);
    if (s) return t(3, 0);
    if (n) return t(3, 2);
    return t(3, 3);
  }
  if (!n && !s) {
    if (w && e) return t(1, 3);
    if (e) return t(0, 3);
    return t(2, 3);
  }
  const cx = !w ? 0 : !e ? 2 : 1;
  const cy = !n ? 0 : !s ? 2 : 1;
  return t(cx, cy);
}
