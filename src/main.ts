import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { VillageScene } from './scenes/VillageScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { Mic } from './mic.js';
import { settings } from './world/prefs';
import * as Progress from './world/progress';
import { world } from './world/state';
import { hooks } from './world/vn';

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

// Volume réglé dans 設定 ; partie chargée depuis ロード : on relance la scène où elle se trouve.
game.sound.volume = settings.volume;
hooks.settings = () => (game.sound.volume = settings.volume);
hooks.load = () => {
  const target = world().scene === 'village' ? 'village' : 'map';
  const active = game.scene.getScenes(true).find((s) => s.scene.key !== 'boot');
  if (active) active.scene.start(target);
  else game.scene.start(target);
};

// Temps de parole, pour le bilan de la semaine (dialogues et chasses partagent le micro).
Mic.spoken = (ms: number) => Progress.logSpeech(ms);

// La sauvegarde vit dans le navigateur : on demande à Chrome de ne pas l'effacer pour faire de la place.
navigator.storage?.persist?.().catch(() => undefined);
