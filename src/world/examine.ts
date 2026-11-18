// Ce qu'on lit en examinant un objet du village (session 11) : le texte change avec l'histoire (l'avis du village,
// la lettre de la mère d'おみつ, le dessin de 太一...), les 絵馬 se lisent l'une après l'autre, l'おみくじ se tire au hasard.
// Sans Phaser ni DOM.
import { DIALOGUES } from './dialogue';
import { saveWorld, world } from './state';

const done = (id: string) => world().quests[id]?.step === 'done';
const healed = () => !!world().flags.ch1;

/** Les dialogues à jouer pour l'objet `id` du lieu `place` (`base` : son dialogue ordinaire). */
export function readPlan(place: string, id: string, base: string): string[] {
  const w = world();
  const count = (w.count ??= {});
  const ep = (k: string) => (healed() && DIALOGUES[k + ':ep'] ? k + ':ep' : k);
  switch (`${place}/${id}`) {
    case 'kirino/board':
      return [healed() ? 'board:3' : done('c3') ? 'board:2' : done('c1') ? 'board:1' : 'board'];
    case 'kirino/ema': {
      // Une tablette après l'autre ; la première fois, ワケ explique ce que c'est.
      const n = (count.ema ?? 0) % 5;
      count.ema = (count.ema ?? 0) + 1;
      saveWorld();
      return count.ema === 1 ? ['ema', 'ema:1'] : ['ema:' + (n + 1)];
    }
    case 'yashiro/omikuji': {
      const first = !count.omikuji;
      count.omikuji = (count.omikuji ?? 0) + 1;
      saveWorld();
      const k = 'omikuji:' + (1 + Math.floor(Math.random() * 5));
      return first ? ['omikuji:first', k] : [k];
    }
    case 'yashiro/saisen':
      return [ep('yashiro:saisen')];
    case 'chaya/kamidana':
      return [done('c2') ? 'chaya:kamidana:letter' : 'chaya:kamidana'];
    case 'ie/plans':
      return [done('c3') ? 'ie:plans:new' : 'ie:plans'];
    case 'ie/butsudan':
      return [ep('ie:butsudan')];
    case 'mill/stone':
      return [done('c1') ? 'mill:stone:turn' : 'mill:stone'];
    case 'mill/drawing':
      return [done('c1') ? 'mill:drawing:after' : 'mill:drawing'];
  }
  return [base];
}

/** La prochaine rumeur à entendre au puits (variante « :ep » après l'épilogue). */
export function nextRumor(ids: string[]): string {
  const w = world();
  const count = (w.count ??= {});
  const k = 'rumor:' + ids[0];
  const id = ids[(count[k] ?? 0) % ids.length];
  count[k] = (count[k] ?? 0) + 1;
  saveWorld();
  return healed() && DIALOGUES[id + ':ep'] ? id + ':ep' : id;
}
