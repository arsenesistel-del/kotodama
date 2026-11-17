import * as Phaser from 'phaser';
import { hideCombat, mountCombat } from '../combat/mount';

// Le combat v4 tourne tel quel, avec son canvas et son interface, au-dessus de Phaser.
// Pendant ce temps Phaser se met en veille pour ne rien dessiner pour rien.
// Le village et la carte seront des scènes Phaser à part entière.
export class CombatScene extends Phaser.Scene {
  constructor() {
    super('combat');
  }

  async create(): Promise<void> {
    const root = document.getElementById('combat')!;
    await mountCombat(root);
    this.game.canvas.style.visibility = 'hidden';
    this.game.loop.sleep();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      hideCombat(root);
      this.game.canvas.style.visibility = '';
      this.game.loop.wake();
    });
  }
}
