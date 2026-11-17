import type { MapDef } from '../mapdef';
import { KIRINO } from './kirino';
import { PASS } from './pass';

// Les lieux où l'on se déplace en pixel, par identifiant de la carte du monde.
export const MAPS: Record<string, MapDef> = {
  kirino: KIRINO,
  pass: PASS,
};
