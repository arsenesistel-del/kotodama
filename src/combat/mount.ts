import shell from './shell.html?raw';
import './style.css';

type Game = typeof import('./game.js');
let mounted: Promise<Game> | null = null;

// Pose l'interface du combat v4 dans la page, puis charge son code. Une seule fois : le combat garde son état ensuite.
export function mountCombat(root: HTMLElement): Promise<Game> {
  if (!mounted) {
    root.innerHTML = shell;
    mounted = import('./game.js');
  }
  root.hidden = false;
  return mounted;
}

export function hideCombat(root: HTMLElement): void {
  root.hidden = true;
}
