import * as Phaser from 'phaser';
import { ASSETS } from '../combat/assets';
import { WORLD } from '../world/assets';
import { world } from '../world/state';

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
    // Monde en pixel : feuilles de personnages en cases de 16 px, tuiles, musiques.
    for (const [key, url] of Object.entries(WORLD)) {
      if (key.startsWith('audio/')) this.load.audio(key, url);
      else if (key === 'tiles/watermill') this.load.spritesheet(key, url, { frameWidth: 34, frameHeight: 36 });
      else if (key.startsWith('actors/') && !key.endsWith('_face')) this.load.spritesheet(key, url, { frameWidth: 16, frameHeight: 16 });
      else this.load.image(key, url);
    }
  }

  async create(): Promise<void> {
    // Les polices doivent être prêtes avant de dessiner les noms calligraphiés (carte, combat).
    try {
      const want = ['34px "Yuji Syuku"', '24px "DotGothic16"', '20px "Shippori Mincho"'].map((f) => document.fonts.load(f, '霧野村言霊'));
      await Promise.race([Promise.all([document.fonts.ready, ...want]), new Promise((r) => setTimeout(r, 3000))]);
    } catch {
      /* rien : les polices de repli suffisent */
    }
    // On reprend là où on s'était arrêté : le village, ou la carte du monde.
    this.scene.start(world().scene === 'village' ? 'village' : 'map');
  }
}
