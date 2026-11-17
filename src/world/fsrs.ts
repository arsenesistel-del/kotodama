// Courbe d'oubli façon FSRS (version 5, paramètres par défaut). Sans DOM.
// Une carte a une stabilité S (en jours : le temps au bout duquel on n'a plus que 90 % de chances de s'en souvenir)
// et une difficulté D (1 à 10). Chaque fois que le jeu observe le joueur (il dit juste, il se trompe, il demande
// une lecture), il note la carte de 1 à 4 et met S et D à jour.
// Formules : https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm

export type Grade = 1 | 2 | 3 | 4; // 1 raté, 2 difficile, 3 juste, 4 facile

export const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const clampD = (d: number) => Math.min(10, Math.max(1, d));

/** Probabilité de s'en souvenir après `t` jours, pour une stabilité `s`. */
export const retrievability = (t: number, s: number): number => Math.pow(1 + (FACTOR * Math.max(0, t)) / s, DECAY);

export const initS = (g: Grade): number => W[g - 1];
export const initD = (g: Grade): number => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);

export function nextD(d: number, g: Grade): number {
  const damped = d + (-W[6] * (g - 3) * (10 - d)) / 9;
  return clampD(W[7] * initD(4) + (1 - W[7]) * damped);
}

/** Révision réussie après un intervalle d'au moins un jour. */
export function recallS(d: number, s: number, r: number, g: Grade): number {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
}

/** Oubli après un intervalle d'au moins un jour. */
export function forgetS(d: number, s: number, r: number): number {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
}

/** Révision le jour même. */
export const shortS = (s: number, g: Grade): number => s * Math.exp(W[17] * (g - 3 + W[18]));
