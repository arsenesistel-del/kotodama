import type { MapDef } from '../mapdef';
import { KIRINO } from './kirino';
import { PASS } from './pass';
import { SUSUKI } from './susuki';

// Les lieux où l'on se déplace en pixel, par identifiant de la carte du monde.
export const MAPS: Record<string, MapDef> = {
  kirino: KIRINO,
  pass: PASS,
  susuki: SUSUKI,
};
