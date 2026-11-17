import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { VillageScene } from './scenes/VillageScene';
import { WorldMapScene } from './scenes/WorldMapScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#050505',
  pixelArt: true,
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  roundPixels: true,
  scene: [BootScene, VillageScene, WorldMapScene, CombatScene],
});

// Accès en console pour le débogage.
(window as unknown as { game: Phaser.Game }).game = game;
