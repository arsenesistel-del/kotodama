import type { MapDef } from '../mapdef';
import { KIRINO } from './kirino';
import { PASS } from './pass';
import { SUSUKI } from './susuki';
import { CHAYA, IE, MILL_IN, YASHIRO } from './interiors';

// Les lieux où l'on se déplace en pixel, par identifiant de la carte du monde.
export const MAPS: Record<string, MapDef> = {
  kirino: KIRINO,
  pass: PASS,
  susuki: SUSUKI,
  chaya: CHAYA,
  ie: IE,
  mill: MILL_IN,
  yashiro: YASHIRO,
};
