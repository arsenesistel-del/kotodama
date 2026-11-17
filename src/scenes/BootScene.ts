import * as Phaser from 'phaser';
import { ASSETS } from '../combat/assets';

// Charge les images avant d'entrer dans le jeu, avec une barre à l'encre.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const y = height / 2;
    const w = Math.min(360, width * 0.6);
    const bar = this.add.rectangle(width / 2 - w / 2, y, 0, 2, 0xd4412b).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, y, w, 2, 0xece6da, 0.15);
    this.add
      .text(width / 2, y - 34, '言霊', { fontFamily: '"Shippori Mincho", serif', fontSize: '28px', color: '#ece6da' })
      .setOrigin(0.5);

    this.load.on('progress', (p: number) => bar.setSize(w * p, 2));
    for (const [key, url] of Object.entries(ASSETS)) this.load.image(key, url);
  }

  async create(): Promise<void> {
    // Les polices du combat doivent être prêtes avant de dessiner les noms calligraphiés.
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
    } catch {
      /* rien : les polices de repli suffisent */
    }
    this.scene.start('combat');
  }
}
