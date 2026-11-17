import * as Phaser from 'phaser';
import { hideCombat, mountCombat } from '../combat/mount';
import * as UI from '../world/ui';

// Le combat v4 tourne tel quel, avec son canvas et son interface, au-dessus de Phaser.
// Pendant ce temps Phaser se met en veille pour ne rien dessiner pour rien.
// Le bouton 地図 du repaire ramène à la carte du monde.
export class CombatScene extends Phaser.Scene {
  constructor() {
    super('combat');
  }

  async create(): Promise<void> {
    const root = document.getElementById('combat')!;
    UI.showUi(false);
    await mountCombat(root);
    const back = () => {
      this.game.loop.wake();
      this.scene.start('map');
    };
    window.addEventListener('kotodama:map', back);
    this.game.canvas.style.visibility = 'hidden';
    this.game.loop.sleep();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('kotodama:map', back);
      hideCombat(root);
      this.game.canvas.style.visibility = '';
      this.game.loop.wake();
    });
  }
}
