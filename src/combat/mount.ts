import shell from './shell.html?raw';
import './style.css';

let mounted: Promise<void> | null = null;

// Pose l'interface du combat v4 dans la page, puis charge son code. Une seule fois : le combat garde son état ensuite.
export function mountCombat(root: HTMLElement): Promise<void> {
  if (!mounted) {
    root.innerHTML = shell;
    mounted = import('./game.js').then(() => undefined);
  }
  root.hidden = false;
  return mounted;
}

export function hideCombat(root: HTMLElement): void {
  root.hidden = true;
}
