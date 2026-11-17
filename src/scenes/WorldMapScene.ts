import * as Phaser from 'phaser';
import { ensureAnims } from '../world/actor';
import { MAP_H, MAP_W, paintInkMap } from '../world/inkmap';
import { PLACES, ROUTE, placeById, type Place } from '../world/places';
import { saveWorld, world } from '../world/state';
import * as UI from '../world/ui';
import { maybeWeekly } from '../world/vn';

const VERMILION = 0xd4412b;
const BONE = 0xece6da;
// Ordre de parcours au clavier : la grand-route, avec le col juste après le village.
const ORDER = ['kirino', 'touge', ...ROUTE.slice(1)];

// La carte du monde, à l'encre. On voyage d'un lieu à l'autre en un clic.
export class WorldMapScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Container;
  private ring!: Phaser.GameObjects.Arc;
  private marker!: Phaser.GameObjects.Sprite;
  private sel = 0;
  private going = false;

  constructor() {
    super('map');
  }

  create(): void {
    const save = world();
    save.scene = 'map';
    saveWorld();
    this.going = false;
    UI.showUi(true);
    UI.vignette(true);
    UI.setPrompt(null);
    this.cameras.main.setBackgroundColor('#0d0c0b');

    const open = new Set(PLACES.filter((p) => p.open).map((p) => p.id));
    if (this.textures.exists('inkmap')) this.textures.remove('inkmap');
    this.textures.addCanvas('inkmap', paintInkMap(open));
    this.board = this.add.container(0, 0);
    this.board.add(this.add.image(0, 0, 'inkmap').setOrigin(0).setScale(0.5));

    // Titre : 八雲の国, à la verticale, avec son sceau.
    this.board.add(
      this.add.text(70, 60, '八\n雲\nの\n国', { fontFamily: '"Yuji Syuku", serif', fontSize: '54px', color: '#ece6da', lineSpacing: 4 }).setAlpha(0.92),
    );
    this.board.add(this.add.rectangle(92, 360, 40, 40, VERMILION));
    this.board.add(this.add.text(92, 360, '地図', { fontFamily: '"Yuji Syuku", serif', fontSize: '15px', color: '#f6ece6' }).setOrigin(0.5));

    for (const p of PLACES) this.addPlace(p);

    // Première partie d'une nouvelle semaine : le bilan de la précédente.
    this.time.delayedCall(1200, () => maybeWeekly());

    this.ring = this.add.circle(0, 0, 22).setStrokeStyle(1.5, BONE, 0.85).setFillStyle();
    this.board.add(this.ring);
    this.tweens.add({ targets: this.ring, scale: 1.25, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Le sabreur, en pixel, là où il se trouve.
    ensureAnims(this, 'actors/samuraiblue');
    const here = placeById(save.place) ?? placeById('kirino')!;
    this.marker = this.add.sprite(here.x - 30, here.y + 8, 'actors/samuraiblue', 0).setOrigin(0.5, 1).setScale(3);
    this.board.add(this.marker);
    this.tweens.add({ targets: this.marker, y: here.y + 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.select(Math.max(0, ORDER.indexOf(here.id)));
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    const kb = this.input.keyboard!;
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.going) return;
      const prev = ['ArrowLeft', 'ArrowUp', 'KeyQ', 'KeyA', 'KeyZ', 'KeyW'].includes(e.code);
      const next = ['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS'].includes(e.code);
      if (prev || next) {
        this.select((this.sel + (next ? 1 : -1) + ORDER.length) % ORDER.length);
        this.blip('audio/move1');
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.travel(placeById(ORDER[this.sel])!);
      } else if (e.code === 'KeyM') this.sound.mute = !this.sound.mute;
    });

    if (this.cache.audio.exists('audio/road') && !this.sound.get('audio/road')?.isPlaying) {
      this.sound.stopAll();
      this.sound.play('audio/road', { loop: true, volume: 0.3 });
    }
    this.cameras.main.fadeIn(500, 5, 5, 5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      kb.removeAllListeners('keydown');
      UI.placeInfo(null, '');
    });

    (window as unknown as { KDM: unknown }).KDM = { go: (id: string) => this.travel(placeById(id)!), sel: () => ORDER[this.sel] };
  }

  private addPlace(p: Place): void {
    const g = this.add.graphics();
    const big = p.kind !== 'site';
    if (p.open) {
      if (big) {
        g.lineStyle(1.2, BONE, 0.45).strokeCircle(p.x, p.y, 17);
        g.fillStyle(VERMILION, 1).fillCircle(p.x, p.y, 11);
        g.fillStyle(0x0d0c0b, 0.9).fillCircle(p.x, p.y, 3.2);
      } else {
        g.fillStyle(VERMILION, 0.9).fillPoints(
          [new Phaser.Math.Vector2(p.x, p.y - 9), new Phaser.Math.Vector2(p.x + 9, p.y), new Phaser.Math.Vector2(p.x, p.y + 9), new Phaser.Math.Vector2(p.x - 9, p.y)],
          true,
        );
      }
    } else {
      g.lineStyle(1.4, BONE, 0.38).strokeCircle(p.x, p.y, big ? 8 : 6);
      if (p.kind === 'boss') g.lineStyle(1, VERMILION, 0.4).strokeCircle(p.x, p.y, 13);
    }
    this.board.add(g);

    const size = !big ? 22 : p.open ? 34 : 26;
    const label = this.add
      .text(p.x + (big ? 26 : 18), p.y, [...p.name].join('\n'), {
        fontFamily: '"Yuji Syuku", serif',
        fontSize: `${size}px`,
        color: '#ece6da',
        lineSpacing: -2,
      })
      .setOrigin(0, 0.5)
      .setAlpha(p.open ? 0.95 : 0.34);
    this.board.add(label);
    this.board.add(this.add.text(p.x, p.y - (big ? 32 : 24), p.chapter, { fontFamily: '"Yuji Syuku", serif', fontSize: '15px', color: '#d4412b' }).setOrigin(0.5).setAlpha(p.open ? 0.9 : 0.35));

    const hit = this.add.zone(p.x + 10, p.y, 80, 110).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      const i = ORDER.indexOf(p.id);
      if (i !== this.sel) {
        this.select(i);
        this.blip('audio/move1');
      }
    });
    hit.on('pointerdown', () => this.travel(p));
    this.board.add(hit);
  }

  private layout(): void {
    const { width, height } = this.scale;
    const s = Math.min(width / MAP_W, height / MAP_H);
    this.board.setScale(s).setPosition((width - MAP_W * s) / 2, (height - MAP_H * s) / 2);
  }

  private select(i: number): void {
    this.sel = i;
    const p = placeById(ORDER[i])!;
    this.ring.setPosition(p.x, p.y);
    const here = world().place === p.id;
    let action: string;
    if (!p.open) action = 'La route ne s’ouvre qu’une fois le lieu précédent apaisé.';
    else if (p.kind === 'site') action = '<kbd>Entrée</kbd> chasser les distorsions (combat)';
    else action = `<kbd>Entrée</kbd> ${here ? 'retourner au village' : 'y aller'}`;
    UI.placeInfo(p, action + '<br><kbd>←</kbd><kbd>→</kbd> changer de lieu');
  }

  private blip(key: string): void {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.35 });
  }

  private travel(p: Place): void {
    if (this.going) return;
    if (!p.open) {
      this.blip('audio/cancel');
      this.tweens.add({ targets: this.ring, x: this.ring.x + 4, duration: 50, yoyo: true, repeat: 2 });
      return;
    }
    this.going = true;
    this.blip('audio/accept');
    const save = world();
    const from = save.place;
    if (p.kind === 'village') {
      // Venir du col, c'est entrer par le nord ; sinon on reprend l'entrée par laquelle on était sorti.
      if (from !== p.id) save.gate = from === 'touge' ? 'north' : 'south';
      save.place = p.id;
      save.pos = undefined;
      save.scene = 'village';
    } else {
      save.place = p.id;
      save.scene = 'map';
    }
    saveWorld();
    UI.placeInfo(null, '');
    this.tweens.add({ targets: this.marker, x: p.x - 30, duration: 380, ease: 'Sine.easeInOut' });
    this.time.delayedCall(250, () => {
      this.cameras.main.fadeOut(420, 5, 5, 5);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (p.kind === 'village') this.scene.start('village');
        else {
          this.sound.stopAll();
          this.scene.start('combat');
        }
      });
    });
  }
}
