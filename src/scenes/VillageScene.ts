import * as Phaser from 'phaser';
import { TILE, type Dir } from '../world/assets';
import { DIR_VEC, ensureAnims, faceToward, idleFrame } from '../world/actor';
import { buildMap, type BuiltMap } from '../world/build';
import { DEPTH, drawMap } from '../world/draw';
import { SPEAKERS } from '../world/dialogue';
import type { Critter, Door, MapDef, NpcDef } from '../world/mapdef';
import { MAPS } from '../world/maps';
import { saveWorld, world } from '../world/state';
import * as UI from '../world/ui';
import { hooks, maybeWeekly } from '../world/vn';
import * as Quests from '../world/quests';
import * as Field from '../world/field';
import * as Hunts from '../world/hunts';
import { nextRumor, readPlan } from '../world/examine';
import { paintTextures } from '../world/paint';
import { DIALOGUES } from '../world/dialogue';
import * as Voice from '../world/voice';

const WALK = 72; // px par seconde
const RUN = 118;
const BODY = { w: 10, h: 6 }; // boîte de collision, aux pieds

interface Npc {
  def: NpcDef;
  sprite: Phaser.GameObjects.Sprite;
  home: Dir;
  cameo?: boolean; // venu le temps d'une cinématique (おみつ devant son salon de thé)
}

/** Une bête ou un figurant du village (session 11). */
interface Crit {
  def: Critter;
  sprite: Phaser.GameObjects.Sprite;
  goal: { x: number; y: number } | null;
  wait: number;
  t: number;
}

type Keys = Record<'up' | 'down' | 'left' | 'right' | 'run', Phaser.Input.Keyboard.Key[]>;

// Le village vu de dessus : déplacement libre au clavier, collisions sur la grille, caméra qui suit.
export class VillageScene extends Phaser.Scene {
  private def!: MapDef;
  private built!: BuiltMap;
  private player!: Phaser.GameObjects.Sprite;
  private wake!: Phaser.GameObjects.Sprite;
  private face: Dir = 'down';
  private npcs: Npc[] = [];
  private keys!: Keys;
  private trail: { x: number; y: number }[] = [];
  private fog: Phaser.GameObjects.TileSprite[] = [];
  private river?: Phaser.Sound.BaseSound;
  private target: { kind: 'npc' | 'read' | 'crit'; id: string } | null = null;
  // Session 11 : la vie du village, les portes, le salon de thé.
  private crits: Crit[] = [];
  private doorMarks: { door: Door; img: Phaser.GameObjects.Image }[] = [];
  private rumorOn = false;
  private rumorAt = -1e9;
  private rumorAway = true;
  private bubbles: { el: HTMLElement; who: () => Phaser.GameObjects.Sprite | undefined }[] = [];
  private pending: { heal?: boolean; rest?: boolean } = {};
  private lookClock = 0;
  private leaving = false;
  private busy = false;
  private saveClock = 0;
  private marks = new Map<string, Phaser.GameObjects.Image>();
  private cutting = false; // une cinématique en pixel déplace les personnages : les touches ne comptent plus
  private blobs: Phaser.GameObjects.Image[] = [];
  private barrierFog: Phaser.GameObjects.Image[] = [];
  private fogSaidAt = -1e9;
  private lastPos = { x: 0, y: 0 };
  // Herbes hautes (session 10) : le pied de chaque touffe passe devant le sabreur ; une rencontre au hasard par case.
  private tufts = new Map<number, Phaser.GameObjects.Image>();
  private cell = -1;
  private grace = 0;
  private forceNext = false;

  constructor() {
    super('village');
  }

  create(): void {
    const save = world();
    this.def = MAPS[save.place] ?? MAPS.kirino;
    this.built = buildMap(this.def);
    this.leaving = false;
    this.busy = false;
    this.npcs = [];
    this.trail = [];
    this.cutting = false;
    this.blobs = [];
    this.barrierFog = [];
    // Session 11 : sols, murs et meubles peints par le code, animations des bêtes et de l'eau.
    paintTextures((k) => this.textures.exists(k), (k, c) => this.textures.addCanvas(k, c));
    this.makeAnims();
    drawMap(this, this.built);
    this.crits = [];
    this.doorMarks = [];
    this.bubbles = [];
    this.pending = {};
    this.rumorOn = false;
    this.rumorAway = true;
    this.tufts.clear();
    this.cell = -1;
    this.grace = 3;
    this.makeGrass();

    // Point d'arrivée : la position sauvegardée si on recharge la page dans le village, sinon l'entrée.
    const sp = save.scene === 'village' && save.pos ? save.pos : this.def.spawns[save.gate] ?? Object.values(this.def.spawns)[0];
    this.face = (sp.face as Dir) ?? 'down';
    ensureAnims(this, 'actors/samuraiblue');
    this.player = this.add.sprite(sp.x * TILE, sp.y * TILE, 'actors/samuraiblue', idleFrame(this.face)).setOrigin(0.5, 1);

    for (const n of this.def.npcs) {
      ensureAnims(this, n.sprite);
      const s = this.add.sprite(n.x * TILE, n.y * TILE, n.sprite, idleFrame(n.face)).setOrigin(0.5, 1);
      this.npcs.push({ def: n, sprite: s, home: n.face });
    }

    // ワケ, le petit esprit d'encre, suit le sabreur.
    this.wake = this.add.sprite(this.player.x - 12, this.player.y - 6, 'actors/spirit', 0).setOrigin(0.5, 1).setAlpha(0.88);
    this.wake.setTint(0xc9d2d8);
    // Avant le prologue, ワケ est encore coincé dans la borne du col.
    this.wake.setVisible(!!save.flags.wake);

    this.makeCritters();
    this.makeFog();
    this.makeLife();
    this.setupCamera();
    this.setupInput();
    this.setupSound();

    save.scene = 'village';
    saveWorld();
    UI.showUi(true);
    UI.vignette(true);
    this.game.canvas.style.transition = '';
    // Un intérieur a sa lumière chaude ; dehors, le village est terne tant que la brume tient.
    this.game.canvas.style.filter = this.def.interior
      ? 'saturate(0.92) sepia(0.06) brightness(1.02)'
      : this.healed() ? 'saturate(0.95) brightness(1) contrast(1.03)' : 'saturate(0.74) brightness(0.94) contrast(1.05)';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    hooks.beforeSave = () => this.storePos();
    hooks.act = (a) => this.onAct(a);
    hooks.bell = () => this.refreshField();
    const onBell = () => this.ringBell();
    window.addEventListener('kotodama:bell', onBell);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('kotodama:bell', onBell));
    this.makeMarkers();
    this.refreshQuest();
    // Session 11 : on reprend des forces au salon de thé (お茶, お団子), plus en entrant au village.
    this.refreshField();

    this.cameras.main.fadeIn(600, 5, 5, 5);
    const prologue = this.def.id === 'pass' && !save.flags.prologue;
    // Le titre du lieu : à chaque arrivée dehors, une fois seulement pour un intérieur.
    if (!prologue && (!this.def.interior || !save.seen['place:' + this.def.id])) UI.placeCard(this.def.name, this.def.fr, this.def.interior ? '家' : '霧');
    save.seen['place:' + this.def.id] = true;
    if (!save.hints && !prologue) {
      UI.hint(
        '<kbd>ZQSD</kbd> ou <kbd>↑←↓→</kbd> marcher · <kbd>Maj</kbd> courir<br><kbd>Espace</kbd> parler, lire · <kbd>T</kbd> ワケ traduit · clic sur un mot : son sens<br><kbd>A</kbd> オート · <kbd>Ctrl</kbd> スキップ · <kbd>B</kbd> バックログ · <kbd>Échap</kbd> メニュー · <kbd>M</kbd> son',
        16000,
      );
      save.hints = true;
    }
    // Retour d'une chasse de contrat : le souvenir, ou la remarque de ワケ après une défaite.
    save.hunt = undefined;
    if (save.after) {
      this.busy = true;
      const ids = Quests.afterHunt();
      this.time.delayedCall(900, () =>
        UI.openChain(ids, () => {
          this.busy = false;
          this.refreshQuest();
        }),
      );
    } else if (prologue) {
      this.busy = true;
      void this.prologue();
    } else if (save.flags.downed) {
      save.flags.downed = false;
      Field.heal();
      this.refreshField();
      saveWorld();
      this.busy = true;
      this.time.delayedCall(700, () => UI.openChain(['down:wake'], () => (this.busy = false)));
    } else if (this.def.zones && !save.seen['arrival:' + this.def.id]) {
      save.seen['arrival:' + this.def.id] = true;
      saveWorld();
      this.busy = true;
      this.time.delayedCall(900, () => UI.openChain(['susuki:intro'], () => (this.busy = false)));
    } else if (this.def.id === 'kirino' && !save.seen['arrival:' + this.def.id]) {
      save.seen['arrival:' + this.def.id] = true;
      saveWorld();
      this.busy = true;
      void this.arrival(save.gate === 'north');
    }

    // Première partie d'une nouvelle semaine : le bilan de la précédente, une fois l'arrivée posée.
    this.time.delayedCall(2600, () => maybeWeekly());

    // Accès de test : window.KDW.go(x, y) téléporte, KDW.state() décrit la scène.
    (window as unknown as { KDW: unknown }).KDW = {
      go: (x: number, y: number) => this.player.setPosition(x * TILE, y * TILE),
      state: () => ({ x: this.player.x / TILE, y: this.player.y / TILE, face: this.face, target: this.target, dialog: UI.dialogOpen() }),
      talk: () => this.interact(),
      talkTo: (id: string) => {
        this.target = { kind: this.npcs.some((n) => n.def.id === id) ? 'npc' : this.crits.some((c) => c.def.id === id) ? 'crit' : 'read', id };
        this.interact();
      },
      // Session 11 : `KDW.enter('chaya')` entre par la porte d'un intérieur, `KDW.hunts()` l'état des quêtes de chasse,
      // `KDW.place()` le lieu courant, `KDW.crits()` les bêtes et figurants, `KDW.rumor()` lance la rumeur du puits.
      enter: (place: string) => {
        const d = this.def.doors?.find((x) => x.place === place);
        if (d) this.enterDoor(d);
      },
      place: () => this.def.id,
      hunts: () => JSON.parse(JSON.stringify(world().hunts ?? {})),
      huntHud: () => Hunts.hud(),
      crits: () => this.crits.map((c) => ({ id: c.def.id, sprite: c.def.sprite, x: c.sprite.x / TILE, y: c.sprite.y / TILE })),
      rumor: () => this.def.rumors?.[0] && this.playRumor(this.def.rumors[0]),
      bubbles: () => this.bubbles.map((b) => b.el.textContent),
      quests: () => JSON.parse(JSON.stringify(world().quests)),
      flags: () => ({ ...world().flags }),
      busy: () => this.busy,
      card: (end = false) => UI.chapterCard('第一章', '霧の村', end ? 'Fin du premier chapitre' : 'Chapitre premier · Le village de la brume', end),
      hud: () => Quests.hud(),
      mark: (id: string) => Quests.marker(id),
      // Rencontres : `KDW.field()` l'état du 渡り, `KDW.grass()` la case et la zone, `KDW.meet()` force la prochaine
      // rencontre (au prochain pas dans les herbes), `KDW.fight(sp, lvl, rare)` lance un combat tout de suite.
      field: () => JSON.parse(JSON.stringify(Field.field())),
      grass: () => ({ cell: this.cell, inGrass: this.inGrass(), zone: this.zoneHere()?.name ?? null, bell: Field.field().bell }),
      meet: () => (this.forceNext = true),
      fight: (sp = 'tsubuyaki', lvl = 1, rare = false) => this.encounter({ sp, lvl, rare }),
      bell: (on?: boolean) => this.ringBell(on),
    };
  }

  // ---------- installation ----------

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.def.width * TILE, this.def.height * TILE);
    cam.setRoundPixels(true);
    const zoom = () => {
      const { width, height } = this.scale;
      // Un intérieur remplit l'écran (on voit toute la pièce) ; dehors, environ 22 × 13 cases.
      const z = this.def.interior
        ? Math.floor(Math.min(width / (TILE * (this.def.width + 1)), height / (TILE * (this.def.height + 3))))
        : Math.round(Math.min(width / (TILE * 22), height / (TILE * 13)));
      cam.setZoom(Phaser.Math.Clamp(z, 2, this.def.interior ? 7 : 6));
      if (this.def.interior && this.player) this.frameRoom();
    };
    zoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, zoom, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, zoom, this));
    cam.startFollow(this.player, true, 0.14, 0.14, 0, TILE / 2);
    if (this.def.interior) this.frameRoom();
  }

  /** Un intérieur plus petit que l'écran : la pièce entière au centre, un peu haute pour laisser la place au dialogue. */
  private frameRoom(): void {
    const cam = this.cameras.main, w = this.def.width * TILE, h = this.def.height * TILE;
    if (w > cam.width / cam.zoom || h > cam.height / cam.zoom) return;
    cam.stopFollow();
    cam.removeBounds();
    cam.centerOn(w / 2, h / 2 + 40 / cam.zoom + TILE * 0.6);
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const k = (c: number) => kb.addKey(c, true, false);
    const K = Phaser.Input.Keyboard.KeyCodes;
    // Clavier français (ZQSD) et anglais (WASD), plus les flèches.
    this.keys = {
      up: [k(K.UP), k(K.Z), k(K.W)],
      down: [k(K.DOWN), k(K.S)],
      left: [k(K.LEFT), k(K.Q), k(K.A)],
      right: [k(K.RIGHT), k(K.D)],
      run: [k(K.SHIFT)],
    };
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.leaving) return;
      // Pendant un dialogue, les touches vont au système de dialogue (vn.ts), qui les garde pour lui.
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        if (!UI.dialogOpen() && !UI.panelOpen()) this.interact();
      } else if (e.code === 'KeyM') this.sound.mute = !this.sound.mute;
      else if (e.code === 'KeyX' && !UI.dialogOpen() && !UI.panelOpen()) this.ringBell();
    });
  }

  private setupSound(): void {
    const m = this.def.music;
    if (m && this.cache.audio.exists(m)) {
      const cur = this.sound.get(m);
      if (!cur || !cur.isPlaying) {
        this.sound.stopAll();
        this.sound.play(m, { loop: true, volume: 0.32 });
      }
    }
    const a = this.def.ambience;
    if (a && this.cache.audio.exists(a.key)) {
      this.river = this.sound.add(a.key, { loop: true, volume: 0 });
      this.river.play();
    }
  }

  private makeFog(): void {
    const S = 256;
    const canvas = () => {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      return c;
    };
    if (!this.textures.exists('fog')) {
      // Texture de brume qui se répète sans couture : chaque nappe est aussi dessinée de l'autre côté du bord.
      const c = canvas(), g = c.getContext('2d')!;
      let seed = 11;
      const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 34; i++) {
        const x = r() * S, y = r() * S, rx = 40 + r() * 80, ry = rx * (0.35 + r() * 0.3), a = 0.18 + r() * 0.3;
        for (const ox of [-S, 0, S])
          for (const oy of [-S, 0, S]) {
            g.save();
            g.translate(x + ox, y + oy);
            g.scale(1, ry / rx);
            const grd = g.createRadialGradient(0, 0, 0, 0, 0, rx);
            grd.addColorStop(0, `rgba(226,232,236,${a})`);
            grd.addColorStop(1, 'rgba(226,232,236,0)');
            g.fillStyle = grd;
            g.fillRect(-rx, -rx, rx * 2, rx * 2);
            g.restore();
          }
      }
      this.textures.addCanvas('fog', c)!.setFilter(Phaser.Textures.FilterMode.LINEAR);
      // Une nappe isolée, pour épaissir la brume à un endroit.
      const b = canvas(), h = b.getContext('2d')!;
      const grd = h.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grd.addColorStop(0, 'rgba(226,232,236,0.75)');
      grd.addColorStop(0.5, 'rgba(226,232,236,0.35)');
      grd.addColorStop(1, 'rgba(226,232,236,0)');
      h.fillStyle = grd;
      h.fillRect(0, 0, S, S);
      this.textures.addCanvas('fogblob', b)!.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    const w = this.def.width * TILE, h = this.def.height * TILE;
    const a = this.def.fog * (this.healed() ? 0.22 : 1);
    this.fog = [
      this.add.tileSprite(0, 0, w, h, 'fog').setOrigin(0).setDepth(DEPTH.fog).setAlpha(a),
      this.add.tileSprite(0, 0, w, h, 'fog').setOrigin(0).setDepth(DEPTH.fog).setAlpha(a * 0.8).setTileScale(1.9),
    ];
    // La brume est plus épaisse sur la colline du cimetière (jusqu'à l'épilogue).
    if (this.def.id === 'kirino' && !this.healed())
      for (const [x, y, sc] of [[39.5, 33, 0.9], [36, 35, 0.6], [43, 31, 0.5]])
        this.blobs.push(this.add.image(x * TILE, y * TILE, 'fogblob').setDepth(DEPTH.fog).setAlpha(0.7).setScale(sc));
    // Au col, la brume qui barre la descente.
    for (const b of this.def.barriers ?? [])
      if (!world().flags[b.flag])
        for (const [x, y] of b.cells) this.barrierFog.push(this.add.image((x + 0.5) * TILE, (y + 0.5) * TILE, 'fogblob').setDepth(DEPTH.fog).setAlpha(0.95).setScale(0.32));
  }

  /** Le village a retrouvé sa voix (épilogue joué) : brume légère, couleurs revenues. */
  private healed(): boolean {
    return this.def.id === 'kirino' && !!world().flags.ch1;
  }

  // ---------- boucle ----------

  update(_t: number, dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    this.fog[0].tilePositionX += dt * 4;
    this.fog[0].tilePositionY += dt * 1.2;
    this.fog[1].tilePositionX -= dt * 2.5;
    if (this.leaving) return;

    const down = (k: Phaser.Input.Keyboard.Key[]) => k.some((x) => x.isDown);
    let vx = 0, vy = 0;
    if (!this.busy && !this.cutting && !UI.dialogOpen() && !UI.panelOpen()) {
      if (down(this.keys.left)) vx -= 1;
      if (down(this.keys.right)) vx += 1;
      if (down(this.keys.up)) vy -= 1;
      if (down(this.keys.down)) vy += 1;
    }
    let moving = vx !== 0 || vy !== 0;
    if (this.cutting) {
      // Pendant une cinématique, c'est le script qui fait marcher le sabreur.
      moving = this.player.x !== this.lastPos.x || this.player.y !== this.lastPos.y;
    } else if (moving) {
      const len = Math.hypot(vx, vy);
      const sp = (down(this.keys.run) ? RUN : WALK) * dt;
      const horiz: Dir = vx < 0 ? 'left' : 'right', vert: Dir = vy < 0 ? 'up' : 'down';
      if (!vx || !vy) this.face = vx ? horiz : vert;
      else if (this.face !== horiz && this.face !== vert) this.face = horiz;
      this.move((vx / len) * sp, (vy / len) * sp);
      this.player.anims.play(`actors/samuraiblue:${this.face}`, true);
      this.player.anims.timeScale = down(this.keys.run) ? 1.5 : 1;
    } else {
      this.player.anims.stop();
      this.player.setFrame(idleFrame(this.face));
    }
    this.lastPos = { x: this.player.x, y: this.player.y };
    this.player.setDepth(DEPTH.actors + this.player.y * 1e-5);
    for (const n of this.npcs) n.sprite.setDepth(DEPTH.actors + n.sprite.y * 1e-5);
    const bob = Math.round(Math.sin(this.time.now / 260) * 1.5);
    for (const n of this.npcs) this.marks.get(n.def.id)?.setPosition(n.sprite.x, n.sprite.y - 19 + bob);
    for (const d of this.doorMarks) d.img.setY(d.door.y * TILE - 3 + bob);

    this.followWake(dt, moving);
    this.updateCritters(dt);
    this.updateBubbles();
    if (this.cutting) return;
    this.checkExit();
    this.checkDoor();
    this.checkRumor();
    this.npcLook(dt);
    this.storyTriggers();
    this.grassStep(moving);
    this.updateTarget();
    this.updateAmbience();

    this.saveClock += dt;
    if (this.saveClock > 2) {
      this.saveClock = 0;
      this.storePos();
    }
  }

  // ---------- déplacement et collisions ----------

  private solidAt(px: number, py: number): boolean {
    const { width: W, height: H } = this.def;
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= W) {
      // Sur les côtés aussi, on ne passe que par une sortie (la route de l'est mène à 薄野原).
      const side = tx < 0 ? 'west' : 'east';
      return ty < 0 || ty >= H || !this.def.exits.some((e) => e.side === side && ty >= e.from && ty <= e.to);
    }
    if (ty < 0 || ty >= H) {
      // Hors de la carte, on ne passe que par une sortie.
      const side = ty < 0 ? 'north' : 'south';
      return !this.def.exits.some((e) => e.side === side && tx >= e.from && tx <= e.to);
    }
    if (this.barrierAt(tx, ty)) return true;
    return this.built.solid[ty * W + tx] === 1;
  }

  /** La brume du col barre la descente tant que ワケ n'est pas libéré. */
  private barrierAt(tx: number, ty: number) {
    const f = world().flags;
    return this.def.barriers?.find((b) => !f[b.flag] && b.cells.some(([x, y]) => x === tx && y === ty));
  }

  private blocked(x: number, y: number): boolean {
    const x0 = x - BODY.w / 2, x1 = x + BODY.w / 2 - 0.01, y0 = y - BODY.h, y1 = y - 0.01;
    for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [x, y0], [x, y1]])
      if (this.solidAt(px, py)) return true;
    for (const n of this.npcs) {
      const s = n.sprite;
      if (Math.abs(s.x - x) < (BODY.w + 10) / 2 && y > s.y - 6 && y - BODY.h < s.y) return true;
    }
    for (const c of this.crits) {
      if (c.def.kind !== 'stand') continue;
      const s = c.sprite;
      if (Math.abs(s.x - x) < (BODY.w + 10) / 2 && y > s.y - 6 && y - BODY.h < s.y) return true;
    }
    return false;
  }

  private move(dx: number, dy: number): void {
    const p = this.player;
    // Axe par axe, pour glisser le long des murs ; petit coup de pouce pour contourner un angle.
    if (dx && !this.blocked(p.x + dx, p.y)) p.x += dx;
    else if (dx && !dy) for (const nudge of [-1, 1]) if (!this.blocked(p.x + dx, p.y + nudge * 3)) { p.y += nudge * Math.abs(dx); break; }
    if (dy && !this.blocked(p.x, p.y + dy)) p.y += dy;
    else if (dy && !dx) for (const nudge of [-1, 1]) if (!this.blocked(p.x + nudge * 3, p.y + dy)) { p.x += nudge * Math.abs(dy); break; }
  }

  private followWake(dt: number, moving: boolean): void {
    const p = this.player;
    if (Math.hypot(p.x - this.wake.x, p.y - this.wake.y) > 80) this.trail = [];
    if (moving || !this.trail.length) this.trail.push({ x: p.x, y: p.y });
    if (this.trail.length > 18) this.trail.shift();
    const goal = this.trail[0];
    const t = this.time.now / 1000;
    const tx = goal.x + (moving ? 0 : -11), ty = goal.y - 5 + Math.sin(t * 2.4) * 2.2;
    this.wake.x += (tx - this.wake.x) * Math.min(1, dt * 5);
    this.wake.y += (ty - this.wake.y) * Math.min(1, dt * 5);
    const dx = p.x - this.wake.x, dy = p.y - this.wake.y;
    this.wake.setFrame(idleFrame(Math.hypot(dx, dy) < 6 ? this.face : faceToward(dx, dy)));
    // Il flotte : il passe devant ce qui est derrière lui.
    this.wake.setDepth(DEPTH.actors + (this.wake.y + 6) * 1e-5);
  }

  // ---------- parler, lire ----------

  private updateTarget(): void {
    if (this.busy || UI.dialogOpen() || UI.panelOpen()) {
      UI.setPrompt(null);
      return;
    }
    const p = this.player;
    const [fx, fy] = DIR_VEC[this.face];
    const px = p.x + fx * 12, py = p.y - 3 + fy * 12;
    let best: VillageScene['target'] = null;
    let bestD = 22;
    for (const n of this.npcs) {
      const d = Math.hypot(n.sprite.x - px, n.sprite.y - 4 - py);
      if (d < bestD) {
        bestD = d;
        best = { kind: 'npc', id: n.def.id };
      }
    }
    for (const c of this.crits) {
      if (!c.def.id) continue;
      const d = Math.hypot(c.sprite.x - px, c.sprite.y - 4 - py);
      if (d < bestD) {
        bestD = d;
        best = { kind: 'crit', id: c.def.id };
      }
    }
    if (!best) {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      for (const r of this.built.readables) if (r.cells.some(([x, y]) => x === tx && y === ty)) best = { kind: 'read', id: r.id };
    }
    this.target = best;
    if (!best) return UI.setPrompt(null);
    if (best.kind === 'npc') UI.setPrompt(`話す <small>${UI.plain(SPEAKERS[best.id]?.name ?? '')}</small>`);
    else if (best.kind === 'crit') UI.setPrompt(`聞く <small>${UI.plain(SPEAKERS[best.id]?.name ?? '')} · écouter</small>`);
    else if (best.id.startsWith('site-') || Quests.QUESTS.some((q) => q.site === best!.id && Quests.active() === q)) UI.setPrompt('調べる <small>examiner</small>');
    else UI.setPrompt('読む <small>lire</small>');
  }

  private interact(): void {
    const t = this.target;
    if (!t || this.busy) return;
    if (t.kind === 'read' && t.id === 'post' && !world().flags.wake) {
      this.busy = true;
      void this.freeWake();
      return;
    }
    if (t.kind === 'read' && t.id === 'bell-jizo') {
      const had = Field.field().hasBell;
      this.busy = true;
      UI.openChain([had ? 'susuki:bell:again' : 'susuki:bell'], () => {
        this.busy = false;
        if (had) return;
        Field.giveBell();
        if (this.cache.audio.exists('audio/accept')) this.sound.play('audio/accept', { volume: 0.45 });
        UI.placeCard('鈴', 'La clochette du 地蔵 : elle éloigne les 言蟲', '鈴');
        this.refreshField();
      });
      return;
    }
    if (t.kind === 'crit') {
      // Un figurant : on écoute la rumeur du moment (avec la traduction de ワケ, comme un dialogue).
      const r = this.def.rumors?.find((x) => x.who.includes(t.id));
      if (!r) return;
      this.busy = true;
      this.clearBubbles();
      UI.openChain([nextRumor(r.ids)], () => (this.busy = false));
      return;
    }
    if (t.kind === 'read') {
      // Un objet peut être le site d'un contrat : la créature s'y montre, on finit sa phrase, puis on chasse.
      // Sinon, son texte peut changer avec l'histoire (examine.ts).
      const base = this.def.readables[t.id] ?? t.id;
      const plan = Quests.sitePlan(t.id, base);
      if (!plan.hunt && plan.ids.length === 1 && plan.ids[0] === base) plan.ids = readPlan(this.def.id, t.id, base);
      this.busy = true;
      UI.openChain(plan.ids, () => {
        this.busy = false;
        const st = plan.hunt && Quests.stateOf(plan.hunt);
        if (plan.hunt && st?.step === 'hunt' && st.guess) this.startHunt(plan.hunt);
        else this.refreshQuest();
      });
      return;
    }
    const n = this.npcs.find((x) => x.def.id === t.id)!;
    // Le PNJ se tourne vers le sabreur pendant qu'il parle.
    n.sprite.setFrame(idleFrame(faceToward(this.player.x - n.sprite.x, this.player.y - n.sprite.y)));
    // Ce qu'il dit dépend des contrats : le donner, témoigner, recevoir le rapport, ou sa réplique ordinaire.
    const plan = Quests.talkPlan(t.id);
    // Rien sur les contrats : une quête de chasse à donner ou à recevoir, ou, au salon de thé, la commande d'おみつ.
    let hunt: Hunts.Plan | null = null;
    if (plan.ordinary && world().seen['talk:' + t.id]) {
      const hint = plan.hint ? [plan.hint] : [];
      hunt = Hunts.talkPlan(t.id);
      // Au salon de thé, おみつ prend toujours la commande (après avoir rappelé sa demande, s'il y en a une en cours).
      const order = this.def.id === 'chaya' && t.id === 'omitsu' && (!hunt || hunt.ids[0].endsWith(':wait')) ? ['chaya:menu'] : [];
      if (hunt) plan.ids = [...hunt.ids, ...order, ...hint];
      else if (order.length) plan.ids = [...order, ...hint];
    }
    const accepting = !hunt && plan.ids.some((i) => i.endsWith(':give'));
    const reporting = !hunt && plan.ids.some((i) => i.endsWith(':report'));
    this.busy = true;
    this.pending = {};
    UI.openChain(plan.ids, () => {
      this.busy = false;
      this.time.delayedCall(400, () => n.sprite.setFrame(idleFrame(n.home)));
      world().seen['talk:' + t.id] = true;
      plan.after?.();
      saveWorld();
      const got = hunt?.after?.();
      if (got) {
        if (got.card) UI.placeCard(...got.card);
        if (got.toast) UI.toast(got.toast);
        this.refreshField();
      }
      this.afterOrder();
      const q = Quests.questById(plan.ids.find((i) => Quests.RX_QUEST.test(i))?.split(':')[0] ?? '');
      if (accepting && q) UI.placeCard(q.title, `${q.side ? '小依頼' : '依頼'} · ${q.fr}`, '依');
      if (reporting && q) {
        UI.placeCard(q.title, 'Contrat rempli', '了');
        const ups = Field.gainXp(Field.XP_REPORT);
        UI.toast(`縁 ＋1 <small>${Quests.NAMES[t.id] ?? ''} · 経験 +${Field.XP_REPORT}${ups.length ? ` · 渡り Lv ${ups[ups.length - 1]}` : ''}</small>`);
        this.refreshField();
      }
      this.refreshQuest();
      // Le cœur de la brume rapporté : 萬作 monte enfin sur la colline, et c'est l'épilogue.
      if (reporting && q?.id === 'c4') {
        this.busy = true;
        void this.epilogue();
      }
    });
  }

  // ---------- contrats ----------

  /** Encart du contrat, marqueurs au-dessus des PNJ, roue du moulin qui tourne une fois le premier contrat fini. */
  private refreshQuest(): void {
    UI.questHud([...Quests.hud(), ...Hunts.hud()]);
    for (const n of this.npcs) {
      const m = this.markerOf(n.def.id);
      const img = this.marks.get(n.def.id);
      if (img) img.setVisible(!!m).setTexture(m === '？' ? 'mark?' : 'mark!');
    }
    // Les portes : le marqueur de celui qui attend à l'intérieur (おみつ dans son salon de thé).
    for (const d of this.doorMarks) {
      const m = MAPS[d.door.place]?.npcs.map((n) => this.markerOf(n.id)).find(Boolean);
      d.img.setVisible(!!m).setTexture(m === '？' ? 'mark?' : 'mark!');
    }
    const turning = world().quests.c1?.step === 'done';
    if (!this.anims.exists('wheel-turn')) this.anims.create({ key: 'wheel-turn', frames: this.anims.generateFrameNumbers('tiles/watermill', { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
    for (const o of this.children.list)
      if (o instanceof Phaser.GameObjects.Sprite && o.texture.key === 'tiles/watermill') {
        if (turning && !o.anims.isPlaying) o.play('wheel-turn');
        if (!turning && o.anims.isPlaying) o.stop();
      }
  }

  private makeMarkers(): void {
    // Petite bulle en pixel, os pâle, signe vermillon : « ！ » contrat à prendre ou à rapporter, « ？ » témoin.
    const glyphs: Record<string, string[]> = {
      '!': ['..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
      '?': ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'],
    };
    for (const [k, rows] of Object.entries(glyphs)) {
      const key = 'mark' + k;
      if (this.textures.exists(key)) continue;
      const c = document.createElement('canvas');
      c.width = 9;
      c.height = 11;
      const g = c.getContext('2d')!;
      g.fillStyle = '#141b1b';
      g.fillRect(1, 0, 7, 9);
      g.fillRect(0, 1, 9, 7);
      g.fillRect(3, 9, 3, 1);
      g.fillRect(4, 10, 1, 1);
      g.fillStyle = '#ece6da';
      g.fillRect(1, 1, 7, 7);
      g.fillRect(4, 8, 1, 1);
      g.fillStyle = '#d4412b';
      rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && g.fillRect(2 + x, 1 + y, 1, 1)));
      this.textures.addCanvas(key, c);
    }
    this.marks.clear();
    for (const n of this.npcs) this.marks.set(n.def.id, this.add.image(n.sprite.x, n.sprite.y - 19, 'mark!').setOrigin(0.5, 1).setDepth(DEPTH.fog + 1).setVisible(false));
    for (const d of this.def.doors ?? [])
      this.doorMarks.push({ door: d, img: this.add.image((d.x + 0.5) * TILE, d.y * TILE - 3, 'mark!').setOrigin(0.5, 1).setDepth(DEPTH.fog + 1).setVisible(false) });
  }

  private startHunt(q: Quests.QuestDef): void {
    if (this.leaving) return;
    this.leaving = true;
    this.storePos();
    const save = world();
    save.hunt = q.id;
    saveWorld();
    UI.setPrompt(null);
    UI.questHud(null);
    this.cameras.main.flash(260, 212, 65, 43);
    this.time.delayedCall(280, () => this.cameras.main.fadeOut(500, 5, 5, 5));
    this.time.delayedCall(820, () => this.scene.start('combat', { quest: q.id }));
  }

  // ---------- le fil de l'histoire : prologue, arrivée, épilogue ----------

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, () => r()));
  }

  private say(...ids: string[]): Promise<void> {
    return new Promise((r) => UI.openChain(ids, () => r()));
  }

  private npc(id: string): Npc | undefined {
    return this.npcs.find((n) => n.def.id === id);
  }

  private sprite(id: string): Phaser.GameObjects.Sprite | undefined {
    return id === 'player' ? this.player : id === 'wake' ? this.wake : this.npc(id)?.sprite;
  }

  private turn(id: string, dir: Dir): void {
    const s = this.sprite(id);
    s?.anims.stop();
    s?.setFrame(idleFrame(dir));
    if (id === 'player') this.face = dir;
  }

  private place(id: string, x: number, y: number, dir: Dir): void {
    const s = this.sprite(id);
    if (!s) return;
    s.setPosition(x * TILE, y * TILE);
    this.turn(id, dir);
    if (id === 'player') this.trail = [];
  }

  /** Fait marcher un personnage de point en point (en tuiles), avec son animation de marche. */
  private async walk(id: string, pts: [number, number][], speed = WALK): Promise<void> {
    const s = this.sprite(id);
    if (!s) return;
    const key = id === 'player' ? 'actors/samuraiblue' : this.npc(id)!.def.sprite;
    let dir: Dir = 'down';
    for (const [tx, ty] of pts) {
      const X = tx * TILE, Y = ty * TILE, dx = X - s.x, dy = Y - s.y, d = Math.hypot(dx, dy);
      if (d < 0.5) continue;
      dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      s.anims.play(`${key}:${dir}`, true);
      await new Promise<void>((r) => this.tweens.add({ targets: s, x: X, y: Y, duration: (d / speed) * 1000, onComplete: () => r() }));
    }
    this.turn(id, dir);
  }

  /** Déplace la caméra vers une case, sans suivre le sabreur. */
  private async pan(x: number, y: number, ms = 1400): Promise<void> {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(x * TILE, y * TILE, ms, 'Sine.easeInOut', true);
    await this.wait(ms + 100);
  }

  private async follow(ms = 900): Promise<void> {
    await this.pan(this.player.x / TILE, this.player.y / TILE - 0.5, ms);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14, 0, TILE / 2);
  }

  private fade(out: boolean, ms = 700): Promise<void> {
    const cam = this.cameras.main;
    if (out) cam.fadeOut(ms, 5, 5, 5);
    else cam.fadeIn(ms, 5, 5, 5);
    return this.wait(ms + 50);
  }

  private startCut(): void {
    this.busy = true;
    this.cutting = true;
    UI.setPrompt(null);
  }

  private endCut(): void {
    this.cutting = false;
    this.busy = false;
    this.refreshQuest();
  }

  /** 序章 : écran d'ouverture, cinématique sur le pays de Yakumo, carton du chapitre, puis le col. */
  private async prologue(): Promise<void> {
    this.startCut();
    await UI.pressStart();
    await this.say('pro:cine1', 'pro:cine2');
    await UI.chapterCard('第一章', '霧の村', 'Chapitre premier · Le village de la brume');
    const save = world();
    save.flags.prologue = true;
    saveWorld();
    UI.placeCard(this.def.name, this.def.fr, '峠');
    if (!save.hints) {
      UI.hint('<kbd>ZQSD</kbd> ou <kbd>↑←↓→</kbd> marcher · <kbd>Maj</kbd> courir · <kbd>Espace</kbd> lire, parler<br><kbd>Échap</kbd> メニュー · <kbd>M</kbd> son', 14000);
      save.hints = true;
      saveWorld();
    }
    this.endCut();
  }

  /** Ce qui se déclenche en marchant : la voix dans la borne du col, la brume qui barre la descente. */
  private storyTriggers(): void {
    if (this.busy || UI.dialogOpen() || UI.panelOpen()) return;
    const save = world();
    if (this.def.id === 'pass' && !save.flags.wake) {
      const post = this.built.readables.find((r) => r.id === 'post');
      const [px, py] = post?.cells[0] ?? [0, 0];
      if (!save.seen['pro:call'] && Math.hypot(this.player.x / TILE - px - 0.5, this.player.y / TILE - py - 0.5) < 7) {
        save.seen['pro:call'] = true;
        saveWorld();
        this.busy = true;
        UI.openDialog('pro:call', () => (this.busy = false));
        return;
      }
    }
    for (const b of this.def.barriers ?? []) {
      if (save.flags[b.flag]) continue;
      const near = b.cells.some(([x, y]) => Math.hypot(this.player.x / TILE - x - 0.5, this.player.y / TILE - 0.3 - y - 0.5) < 1.3);
      if (near && this.time.now - this.fogSaidAt > 9000) {
        this.fogSaidAt = this.time.now;
        this.busy = true;
        UI.openDialog(b.say, () => (this.busy = false));
      }
    }
  }

  /** La phrase de la borne, dite en entier : ワケ sort de la pierre. */
  private async freeWake(): Promise<void> {
    this.startCut();
    const post = this.built.readables.find((r) => r.id === 'post')!;
    const [px, py] = post.cells[0];
    this.turn('player', faceToward(px * TILE + 8 - this.player.x, py * TILE + 8 - this.player.y));
    await this.say('pro:post');
    // La pierre se fend de vermillon, et l'esprit d'encre en sort.
    const cam = this.cameras.main;
    cam.flash(500, 212, 65, 43);
    cam.shake(380, 0.006);
    if (this.cache.audio.exists('audio/accept')) this.sound.play('audio/accept', { volume: 0.5 });
    const save = world();
    save.flags.wake = true;
    saveWorld();
    this.wake.setPosition((px + 0.5) * TILE, (py + 0.9) * TILE).setVisible(true).setAlpha(0).setScale(0.4);
    this.trail = [];
    this.tweens.add({ targets: this.wake, alpha: 0.88, scale: 1, y: this.wake.y - 10, duration: 1100, ease: 'Back.easeOut' });
    for (const f of this.barrierFog) this.tweens.add({ targets: f, alpha: 0, scale: 0.8, duration: 2600, onComplete: () => f.destroy() });
    this.barrierFog = [];
    await this.wait(1500);
    await this.say('pro:free');
    UI.placeCard('ワケ', 'Le traducteur, libéré de la borne', '訳');
    this.endCut();
  }

  /** Arrivée au village : おみつ et 萬作 échangent des faits nus, ワケ comprend, puis il fait le tour du village. */
  private async arrival(fromNorth: boolean): Promise<void> {
    this.startCut();
    const home = this.npc('mansaku')?.def;
    // おみつ sort de son salon de thé pour l'occasion, puis y rentre.
    this.cameo('omitsu', 27.5, 10, 'down');
    this.place('mansaku', 30.5, 10.6, 'left');
    await this.wait(900);
    if (fromNorth) {
      await this.walk('player', [[23.5, 8.6], [24.5, 10.6]]);
      this.turn('player', 'right');
    }
    this.turn('omitsu', 'left');
    await this.wait(300);
    await this.say('arrival');
    // 萬作 rentre chez lui pendant que ワケ fait le tour.
    if (home) void this.walk('mansaku', [[25.5, 11], [24.2, 13.6], [12, 13.6], [home.x, home.y]], 34).then(() => this.turn('mansaku', home.face));
    this.turn('omitsu', 'down');
    await this.pan(9, 12);
    await this.say('tour:house');
    void this.walk('omitsu', [[27.5, 8.4]], 40).then(() => this.dropCameo('omitsu'));
    await this.pan(16.5, 22.5);
    await this.say('tour:mill');
    await this.pan(40, 24.5);
    await this.say('tour:bridge');
    await this.pan(39.5, 32.5, 1200);
    await this.say('tour:hill');
    await this.follow(1500);
    await this.say('tour:end');
    if (home) this.place('mansaku', home.x, home.y, home.face);
    this.endCut();
  }

  /** 終章 : 萬作 dit enfin sa phrase sur la tombe, la brume se lève, le village se dispute, la route s'ouvre. */
  private async epilogue(): Promise<void> {
    this.startCut();
    UI.questHud(null);
    await this.wait(500);
    await this.fade(true, 900);
    // Sur la colline, devant la tombe de お露.
    this.place('mansaku', 41.5, 34, 'down');
    this.place('player', 39.2, 32.6, 'right');
    this.wake.setPosition(38.4 * TILE, 32.2 * TILE);
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.centerOn(40.5 * TILE, 33 * TILE);
    await this.fade(false, 1100);
    await this.wait(500);
    await this.say('ep:tomb');
    // La brume se lève.
    if (this.cache.audio.exists('audio/accept')) this.sound.play('audio/accept', { volume: 0.4 });
    for (const f of this.fog) this.tweens.add({ targets: f, alpha: this.def.fog * 0.22 * (f === this.fog[0] ? 1 : 0.8), duration: 5000, ease: 'Sine.easeInOut' });
    for (const b of this.blobs) this.tweens.add({ targets: b, alpha: 0, scale: b.scale * 1.6, duration: 4200 });
    this.game.canvas.style.transition = 'filter 5s ease';
    this.game.canvas.style.filter = 'saturate(0.95) brightness(1) contrast(1.03)';
    await this.pan(40.5, 29, 4200);
    await this.say('ep:dawn');
    // Le lendemain, devant le salon de thé : le village a retrouvé ses avis.
    await this.fade(true, 700);
    const save = world();
    save.flags.ch1 = true;
    saveWorld();
    this.cameo('omitsu', 27.5, 10, 'right');
    this.place('mansaku', 30.5, 10.6, 'left');
    this.place('taichi', 28.5, 12.4, 'up');
    this.place('player', 24.5, 10.6, 'right');
    this.turn('omitsu', 'right');
    cam.centerOn(27 * TILE, 10.5 * TILE);
    await this.fade(false, 900);
    await this.say('ep:tea');
    this.turn('mansaku', 'left');
    this.turn('omitsu', 'left');
    await this.say('ep:thanks');
    await this.say('ep:seal');
    await UI.chapterCard('第一章', '霧の村', 'Fin du premier chapitre', true, 6200);
    // Chacun rentre chez lui ; le sabreur reprend la main.
    this.dropCameo('omitsu');
    for (const id of ['mansaku', 'taichi', 'omitsu']) {
      const n = this.npc(id);
      if (n) this.place(id, n.def.x, n.def.y, n.def.face);
    }
    await this.follow(600);
    await this.say('ep:end');
    UI.placeCard('灯籠宿', 'La route du sud est ouverte', '道');
    this.endCut();
  }

  // ---------- herbes hautes et rencontres (session 10) ----------

  /** Dessine les touffes d'herbes hautes : le fond sous les personnages, le pied devant. Textures peintes par le code. */
  private makeGrass(): void {
    const g = this.built.grass;
    if (!g.some((v) => v)) return;
    if (!this.textures.exists('susuki0')) this.paintGrass();
    const W = this.def.width;
    for (let i = 0; i < g.length; i++) {
      if (!g[i]) continue;
      const x = (i % W) * TILE, y = Math.floor(i / W) * TILE, v = (i * 7 + (i >> 3)) % 3;
      this.add.image(x, y - 4, 'susuki' + v).setOrigin(0).setDepth(DEPTH.below + 0.5 + y * 1e-5);
      this.tufts.set(i, this.add.image(x, y + TILE, 'susukiF' + (v % 2)).setOrigin(0, 1).setDepth(DEPTH.actors + (y + TILE) * 1e-5));
    }
    // Le vent passe : de temps en temps, une vague couche les plumets.
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        const t = this.time.now / 1000;
        for (const [i, im] of this.tufts) if (Math.sin((i % W) * 0.5 - t * 1.3) > 0.85) this.tweens.add({ targets: im, x: im.x + 1, duration: 160, yoyo: true });
      },
    });
  }

  private paintGrass(): void {
    // Palette du pack : vert sombre, vert, vert clair, contour d'encre ; plumets d'eulalie os pâle et paille.
    // Chaque touffe fait 16 × 20 : elle déborde de 4 pixels sur la case du dessus, les rangées se recouvrent.
    const DARK = '#4a7f4b', MID = '#74a334', LIGHT = '#adbc3a', INK = '#2c4a33', PLUME = ['#efe6cf', '#d8ccb0', '#c8a878'];
    let seed = 5;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const make = (key: string, h: number, f: (g: CanvasRenderingContext2D) => void) => {
      const c = document.createElement('canvas');
      c.width = 16;
      c.height = h;
      const g = c.getContext('2d')!;
      f(g);
      this.textures.addCanvas(key, c);
    };
    const px = (g: CanvasRenderingContext2D, x: number, y: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(((x % 16) + 16) % 16, y, 1, 1);
    };
    // Une tige : de la base vers le haut, qui ploie ; plumet au sommet.
    const blade = (g: CanvasRenderingContext2D, x: number, base: number, h: number, lean: number, col: string, plume: boolean) => {
      let tx = x;
      for (let k = 0; k < h; k++) {
        tx = Math.round(x + (lean * k * k) / (h * h) * 3);
        px(g, tx, base - k, k < 2 ? DARK : col);
      }
      if (plume) for (let k = 0; k < 4; k++) px(g, tx + (k % 2 ? Math.sign(lean || 1) : 0), base - h - k, PLUME[(k + x) % 3]);
    };
    for (let v = 0; v < 3; v++)
      make('susuki' + v, 20, (g) => {
        // La masse de la touffe, plus sombre que la prairie, avec une ombre en bas qui dessine la rangée.
        g.fillStyle = MID;
        g.fillRect(0, 9, 16, 11);
        for (let x = 0; x < 16; x++) {
          px(g, x, 19, DARK);
          px(g, x, 18, x % 3 ? DARK : MID);
          px(g, x, 8 + Math.round(r() * 2), MID);
        }
        for (let i = 0; i < 9; i++) {
          const x = Math.floor(r() * 16), h = 9 + Math.floor(r() * 7), l = (r() - 0.5) * 1.6;
          blade(g, x, 17, h, l, r() < 0.5 ? LIGHT : DARK, r() < 0.45);
        }
        for (let i = 0; i < 5; i++) px(g, Math.floor(r() * 16), 11 + Math.floor(r() * 6), INK);
      });
    // Le pied des touffes, dessiné devant les personnages : on a de l'herbe jusqu'aux genoux.
    for (const v of [0, 1])
      make('susukiF' + v, 8, (g) => {
        for (let x = 0; x < 16; x++) {
          const h = 3 + Math.floor(r() * 5);
          for (let k = 0; k < h; k++) px(g, x + (k > 3 && r() < 0.5 ? 1 : 0), 7 - k, k === 0 ? DARK : x % 2 ? MID : LIGHT);
        }
      });
  }

  private inGrass(): boolean {
    const p = this.player, W = this.def.width;
    const tx = Math.floor(p.x / TILE), ty = Math.floor((p.y - 2) / TILE);
    return tx >= 0 && ty >= 0 && tx < W && ty < this.def.height && this.built.grass[ty * W + tx] === 1;
  }

  private zoneHere(): Field.Zone | undefined {
    const tx = Math.floor(this.player.x / TILE), ty = Math.floor((this.player.y - 2) / TILE);
    return this.def.zones?.find((z) => tx >= z.rect[0] && tx <= z.rect[2] && ty >= z.rect[1] && ty <= z.rect[3]);
  }

  /** Chaque case d'herbes hautes traversée peut réveiller un 言蟲, sauf quand le 鈴 tinte. */
  private grassStep(moving: boolean): void {
    if (!this.def.zones || this.busy || UI.dialogOpen() || UI.panelOpen()) return;
    const W = this.def.width, p = this.player;
    const c = Math.floor((p.y - 2) / TILE) * W + Math.floor(p.x / TILE);
    if (c === this.cell) return;
    this.cell = c;
    this.refreshField();
    if (!moving || !this.inGrass()) return;
    const tuft = this.tufts.get(c);
    if (tuft) {
      this.tweens.add({ targets: tuft, x: tuft.x + (Math.random() < 0.5 ? -1 : 1), duration: 70, yoyo: true, repeat: 1 });
      if (this.cache.audio.exists('audio/move1') && Math.random() < 0.35) this.sound.play('audio/move1', { volume: 0.08, rate: 1.6 });
    }
    if (Field.field().bell) return;
    if (this.grace > 0 && !this.forceNext) {
      this.grace--;
      return;
    }
    const zone = this.zoneHere();
    if (!zone) return;
    if (this.forceNext || Math.random() < Field.RATE) {
      this.forceNext = false;
      this.encounter(Field.roll(zone));
    }
  }

  /** Une bête surgit : éclair, la touffe s'agite, puis le combat. */
  private encounter(b: Field.Beast): void {
    if (this.leaving) return;
    this.leaving = true;
    this.busy = true;
    this.storePos();
    UI.setPrompt(null);
    UI.fieldHud(null);
    const cam = this.cameras.main;
    this.player.anims.stop();
    this.player.setFrame(idleFrame(this.face));
    const tuft = this.tufts.get(this.cell);
    if (tuft) this.tweens.add({ targets: tuft, x: tuft.x + 2, duration: 50, yoyo: true, repeat: 5 });
    if (this.cache.audio.exists('audio/accept')) this.sound.play('audio/accept', { volume: 0.4, rate: 0.7 });
    cam.flash(180, 236, 230, 218);
    this.time.delayedCall(260, () => cam.flash(180, 212, 65, 43));
    this.time.delayedCall(520, () => cam.fadeOut(420, 5, 5, 5));
    this.time.delayedCall(960, () => this.scene.start('combat', { beast: b }));
  }

  /** Le 鈴 tinte ou se tait (touche X, ou メニュー → 持ち物). */
  private ringBell(on?: boolean): void {
    const f = Field.field();
    if (!f.hasBell) {
      if (this.def.zones) UI.toast('鈴 <small>tu n’as pas encore de clochette</small>');
      return;
    }
    const now = Field.toggleBell(on);
    if (now && this.cache.audio.exists('audio/accept')) this.sound.play('audio/accept', { volume: 0.3, rate: 1.8 });
    UI.toast(now ? '鈴 ちりん… <small>les 言蟲 s’écartent</small>' : '鈴 <small>rangé : les bêtes peuvent sortir des herbes</small>');
    this.refreshField();
  }

  /** L'encart du 渡り : niveau, PV, clochette, zone et niveau des bêtes. Seulement là où il y a des herbes hautes. */
  private refreshField(): void {
    const f = Field.field(), z = this.zoneHere();
    // Dans le village aussi (session 11), dès qu'on a combattu : on voit ses PV et on sait quand passer au salon de thé.
    if (!this.def.zones && (this.def.id === 'pass' || (!f.wins && !f.hasBell && f.hp >= Field.maxHp(f.lvl)))) return UI.fieldHud(null);
    UI.fieldHud({ lvl: f.lvl, hp: f.hp, max: Field.maxHp(f.lvl), xp: f.xp / Field.xpToNext(f.lvl), bell: f.hasBell ? f.bell : null, zone: z ? `${z.name} · Lv ${z.lv[0]}–${z.lv[1]}` : '' });
  }

  // ---------- le village vivant (session 11) ----------

  private makeAnims(): void {
    const mk = (key: string, tex: string, frames: number[], rate: number) => {
      if (!this.anims.exists(key) && this.textures.exists(tex)) this.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: f })), frameRate: rate, repeat: -1 });
    };
    mk('ripple', 'tiles/ripples', [0, 1, 2, 3], 3);
    mk('leaf', 'tiles/leaf', [0, 1, 2, 3, 4, 5], 6);
  }

  /** Poules, chat, figurants : posés d'après la carte (`critters`). */
  private makeCritters(): void {
    for (const def of this.def.critters ?? []) {
      if (def.kind === 'stand') ensureAnims(this, def.sprite);
      const frame = def.kind === 'stand' ? idleFrame(def.face ?? 'down') : 0;
      const sprite = this.add.sprite(def.x * TILE, def.y * TILE, def.sprite, frame).setOrigin(0.5, 1);
      this.crits.push({ def, sprite, goal: null, wait: Math.random() * 3, t: Math.random() * 2 });
    }
  }

  private freeCell(x: number, y: number): boolean {
    const tx = Math.floor(x / TILE), ty = Math.floor((y - 2) / TILE);
    return tx >= 0 && ty >= 0 && tx < this.def.width && ty < this.def.height && !this.built.solid[ty * this.def.width + tx];
  }

  private updateCritters(dt: number): void {
    const p = this.player;
    for (const c of this.crits) {
      const s = c.sprite;
      c.t += dt;
      s.setDepth(DEPTH.actors + s.y * 1e-5);
      if (c.def.kind === 'nap') {
        // Le chat respire, une oreille bouge de temps en temps.
        s.setFrame(Math.floor(c.t / 1.7) % 2);
        continue;
      }
      if (c.def.kind === 'stand') {
        // Les commères se font face ; elles regardent le sabreur quand il s'approche.
        const near = Math.hypot(p.x - s.x, p.y - s.y) < 26;
        s.setFrame(idleFrame(near ? faceToward(p.x - s.x, p.y - s.y) : c.def.face ?? 'down'));
        continue;
      }
      // Une poule : elle picore, fait quelques pas, s'écarte quand on arrive.
      const dP = Math.hypot(p.x - s.x, p.y - s.y);
      if (dP < 18 && (!c.goal || c.wait > 0)) {
        const a = Math.atan2(s.y - p.y, s.x - p.x);
        const g = { x: s.x + Math.cos(a) * 24, y: s.y + Math.sin(a) * 24 };
        if (this.freeCell(g.x, g.y)) c.goal = g, c.wait = 0;
      }
      if (c.goal) {
        const dx = c.goal.x - s.x, dy = c.goal.y - s.y, d = Math.hypot(dx, dy);
        const sp = (dP < 18 ? 40 : 14) * dt;
        if (d < 1 || !this.freeCell(s.x + (dx / d) * sp, s.y + (dy / d) * sp)) {
          c.goal = null;
          c.wait = 1 + Math.random() * 3;
        } else {
          s.x += (dx / d) * sp;
          s.y += (dy / d) * sp;
          s.setFlipX(dx < 0);
          s.setFrame(Math.floor(c.t * 6) % 2);
        }
        continue;
      }
      c.wait -= dt;
      s.setFrame(Math.sin(c.t * 7) > 0.6 ? 1 : 0); // elle picore
      if (c.wait <= 0 && c.def.area) {
        const [x0, y0, x1, y1] = c.def.area;
        const g = { x: (x0 + Math.random() * (x1 - x0 + 1)) * TILE, y: (y0 + 0.6 + Math.random() * (y1 - y0)) * TILE };
        if (this.freeCell(g.x, g.y)) c.goal = g;
        else c.wait = 0.5;
      }
    }
  }

  /** Les PNJ regardent le sabreur quand il passe près d'eux, et jettent parfois un coup d'œil ailleurs. */
  private npcLook(dt: number): void {
    if (this.busy || UI.dialogOpen()) return;
    this.lookClock -= dt;
    const glance = this.lookClock <= 0;
    if (glance) this.lookClock = 2.5 + Math.random() * 3;
    for (const n of this.npcs) {
      if (n.cameo || n.sprite.anims.isPlaying) continue;
      const dx = this.player.x - n.sprite.x, dy = this.player.y - n.sprite.y;
      if (Math.hypot(dx, dy) < 34) n.sprite.setFrame(idleFrame(faceToward(dx, dy)));
      else if (glance && Math.random() < 0.35) {
        const d = (['down', 'left', 'right'] as Dir[])[Math.floor(Math.random() * 3)];
        n.sprite.setFrame(idleFrame(d));
        this.time.delayedCall(1400, () => !n.sprite.anims.isPlaying && n.sprite.setFrame(idleFrame(n.home)));
      }
    }
  }

  /** Fumées, feuilles qui tombent, rides sur l'eau, halos des lanternes et des foyers, poussière de farine. */
  private makeLife(): void {
    // Halos chauds sur les lanternes, le foyer, le fourneau, les lanternes de pierre : ils respirent.
    for (const s of this.built.sprites) {
      const k = s.o.sprite!.key;
      if (!['p-lantern', 'p-irori', 'p-kamado', 'p-stone-lamp'].includes(k)) continue;
      const cx = s.x * TILE + s.o.w * 8, cy = s.y * TILE + (k === 'p-stone-lamp' ? 6 : k === 'p-lantern' ? 8 : s.o.h * 8);
      const g = this.add.image(cx, cy, 'p-glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.above + 0.5).setScale(k === 'p-lantern' ? 1.1 : 1.6).setAlpha(0.7);
      this.tweens.add({ targets: g, alpha: 0.4, scale: g.scale * 0.92, duration: 900 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (k === 'p-irori') {
        const e = this.add.image(s.x * TILE, s.y * TILE, 'p-embers').setOrigin(0).setDepth(DEPTH.actors + (s.y + 2) * TILE * 1e-5 + 1e-6);
        this.tweens.add({ targets: e, alpha: 0.2, duration: 380, yoyo: true, repeat: -1 });
      }
    }
    // Fumées des cheminées (dehors) et vapeur du fourneau, du foyer (dedans).
    const smokes: [number, number][] =
      this.def.id === 'kirino' ? [[27.4, 6.3], [8.6, 10.2], [36.2, 11.1]] : this.built.sprites.filter((s) => ['p-kamado', 'p-irori'].includes(s.o.sprite!.key)).map((s) => [s.x + 1, s.y + 0.6]);
    for (const [x, y] of smokes)
      this.time.addEvent({
        delay: 900 + Math.random() * 500,
        loop: true,
        callback: () => {
          const im = this.add.image(x * TILE + (Math.random() * 4 - 2), y * TILE, 'p-smoke').setDepth(DEPTH.above + 0.4).setAlpha(this.def.interior ? 0.35 : 0.55).setScale(0.5);
          this.tweens.add({ targets: im, y: im.y - 22, x: im.x + 7, alpha: 0, scale: 1.4, duration: 3200, onComplete: () => im.destroy() });
        },
      });
    // La meule tourne une fois le moulin réparé : un peu de farine vole.
    const stone = this.def.id === 'mill' && world().quests.c1?.step === 'done' && this.built.sprites.find((s) => s.o.sprite!.key === 'p-millstone');
    if (stone) {
      const sp = this.children.list.find((o) => o instanceof Phaser.GameObjects.Sprite && o.texture.key === 'p-millstone') as Phaser.GameObjects.Sprite | undefined;
      if (sp) this.tweens.add({ targets: sp, x: sp.x + 0.6, duration: 120, yoyo: true, repeat: -1 });
      this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
          const im = this.add.image((stone.x + 0.4 + Math.random() * 1.2) * TILE, (stone.y + 1) * TILE, 'p-smoke').setDepth(DEPTH.above).setAlpha(0.5).setScale(0.25).setTint(0xfce2ca);
          this.tweens.add({ targets: im, y: im.y - 10, alpha: 0, duration: 1400, onComplete: () => im.destroy() });
        },
      });
    }
    if (this.def.interior) return;
    // Rides sur l'eau, là où il y a de l'eau, et à la roue du moulin.
    const water: [number, number][] = [];
    for (let y = 0; y < this.def.height; y++) for (let x = 0; x < this.def.width; x++) if (this.def.terrain[y][x] === 'w' && this.def.terrain[y - 1]?.[x] === 'w' && this.def.terrain[y + 1]?.[x] === 'w') water.push([x, y]);
    for (let i = 0; i < Math.min(14, water.length); i++) {
      const [x, y] = water[Math.floor(Math.random() * water.length)];
      const r = this.add.sprite(x * TILE, y * TILE, 'tiles/ripples').setOrigin(0).setDepth(DEPTH.ground + 0.6).setAlpha(0.8);
      if (this.anims.exists('ripple')) r.play({ key: 'ripple', startFrame: Math.floor(Math.random() * 4) });
      this.tweens.add({ targets: r, x: r.x + 24, duration: 6000 + Math.random() * 4000, repeat: -1, onRepeat: () => r.setX(x * TILE) });
    }
    // Des feuilles d'automne tombent des arbres du village (pas des forêts du bord).
    const trees = this.def.objects.filter((o) => o.o.w === 2 && o.o.h === 2 && o.o.tile(0, 0) && !o.id);
    if (trees.length && this.textures.exists('tiles/leaf'))
      this.time.addEvent({
        delay: 700,
        loop: true,
        callback: () => {
          const cam = this.cameras.main.worldView;
          const vis = trees.filter((t) => cam.contains(t.x * TILE + 16, t.y * TILE + 16));
          if (!vis.length || Math.random() < 0.4) return;
          const t = vis[Math.floor(Math.random() * vis.length)];
          const lf = this.add.sprite(t.x * TILE + 4 + Math.random() * 24, t.y * TILE + 6, 'tiles/leaf').setDepth(DEPTH.above + 0.3);
          lf.setTint([0xd78b4a, 0xe46d3a, 0xc8966b, 0xadbc3a][Math.floor(Math.random() * 4)]);
          if (this.anims.exists('leaf')) lf.play('leaf');
          this.tweens.add({ targets: lf, y: lf.y + 30 + Math.random() * 14, x: lf.x + 10 + Math.random() * 12, alpha: { from: 1, to: 0 }, duration: 3800, ease: 'Sine.easeIn', onComplete: () => lf.destroy() });
        },
      });
  }

  // ---------- rumeurs entendues en passant ----------

  /** Deux figurants discutent quand on passe près d'eux : des bulles, sans arrêter le jeu. */
  private checkRumor(): void {
    const r = this.def.rumors?.[0];
    if (!r || this.rumorOn) return;
    const d = Math.hypot(this.player.x / TILE - r.at[0], this.player.y / TILE - r.at[1]);
    if (d > r.r + 1.5) this.rumorAway = true;
    if (d > r.r || !this.rumorAway || this.time.now - this.rumorAt < 25000 || this.busy || UI.dialogOpen()) return;
    this.playRumor(r);
  }

  private playRumor(r: NonNullable<MapDef['rumors']>[number]): void {
    this.rumorOn = true;
    this.rumorAway = false;
    this.rumorAt = this.time.now;
    const id = nextRumor(r.ids);
    const lines = DIALOGUES[id] ?? [];
    const w = world();
    let t = 0;
    lines.forEach((l, i) => {
      this.time.delayedCall(t, () => {
        if (UI.dialogOpen() || this.leaving) return;
        this.clearBubbles();
        const who = () => this.crits.find((c) => c.def.id === l.who)?.sprite ?? this.npc(l.who)?.sprite;
        this.bubble(UI.plain(l.jp ?? ''), who);
        Voice.play(`${id}:${i}`);
        // La rumeur entre dans la バックログ, avec sa traduction (bouton 訳).
        w.log.push(`${id}:${i}`);
        if (w.log.length > 120) w.log.splice(0, w.log.length - 120);
        saveWorld();
      });
      t += 2600 + (l.jp ?? '').length * 90;
    });
    this.time.delayedCall(t, () => {
      this.clearBubbles();
      this.rumorOn = false;
    });
  }

  private bubble(text: string, who: () => Phaser.GameObjects.Sprite | undefined): void {
    const el = document.createElement('div');
    el.className = 'kbubble';
    el.textContent = text;
    document.body.appendChild(el);
    this.bubbles.push({ el, who });
    this.updateBubbles();
  }

  private updateBubbles(): void {
    if (!this.bubbles.length) return;
    const cam = this.cameras.main, r = this.game.canvas.getBoundingClientRect(), k = r.width / this.scale.width;
    for (const b of this.bubbles) {
      const s = b.who();
      if (!s) continue;
      b.el.style.left = `${r.left + (s.x - cam.worldView.x) * cam.zoom * k}px`;
      b.el.style.top = `${r.top + (s.y - 20 - cam.worldView.y) * cam.zoom * k}px`;
      b.el.hidden = UI.dialogOpen() || UI.panelOpen();
    }
  }

  private clearBubbles(): void {
    for (const b of this.bubbles) b.el.remove();
    this.bubbles = [];
  }

  // ---------- portes et intérieurs ----------

  /** Marcher sur une porte fait entrer dans la maison. */
  private checkDoor(): void {
    if (this.busy || this.leaving || UI.dialogOpen() || UI.panelOpen()) return;
    const tx = Math.floor(this.player.x / TILE), ty = Math.floor((this.player.y - 2) / TILE);
    const d = this.def.doors?.find((x) => x.x === tx && x.y === ty);
    if (d) this.enterDoor(d);
  }

  private enterDoor(d: Door): void {
    if (this.leaving) return;
    this.leaving = true;
    const save = world();
    save.place = d.place;
    save.gate = d.gate;
    save.pos = undefined;
    save.scene = 'village';
    saveWorld();
    UI.setPrompt(null);
    if (this.cache.audio.exists('audio/move1')) this.sound.play('audio/move1', { volume: 0.25, rate: 0.8 });
    // `fade(…, true)` : même si le fondu d'arrivée n'est pas fini, sinon on resterait coincé sur le seuil.
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart());
    this.cameras.main.fade(320, 5, 5, 5, true);
  }

  /** Le marqueur d'un PNJ : son contrat d'abord, sinon une quête de chasse (une fois qu'on l'a rencontré). */
  private markerOf(id: string): '！' | '？' | null {
    return Quests.marker(id) ?? (world().seen['talk:' + id] ? Hunts.marker(id) : null);
  }

  /** Ce qu'une phrase dite déclenche : la déduction d'un contrat, ou une commande au salon de thé. */
  private onAct(a: string): void {
    if (a.startsWith('guess:')) return Quests.act(a);
    if (a.startsWith('heal')) this.pending.heal = true;
    if (a.startsWith('rest')) this.pending.rest = true;
  }

  /** Après la commande : le thé et les dango rendent les forces, se reposer ouvre la セーブ. */
  private afterOrder(): void {
    const p = this.pending;
    this.pending = {};
    if (!p.heal && !p.rest) return;
    const f = Field.field();
    const was = f.hp;
    Field.heal();
    this.refreshField();
    if (this.cache.audio.exists('audio/accept')) this.sound.play('audio/accept', { volume: 0.35, rate: 1.3 });
    if (p.rest) {
      UI.toast(`一休み <small>PV ${Field.maxHp(f.lvl)}/${Field.maxHp(f.lvl)} · sauvegarde ouverte</small>`);
      UI.openSave();
    } else UI.toast(`ごちそうさま <small>PV ${was} → ${Field.maxHp(f.lvl)}</small>`);
  }

  /** Un PNJ qui vit ailleurs vient le temps d'une cinématique (おみつ devant son salon de thé). */
  private cameo(id: string, x: number, y: number, face: Dir): void {
    if (this.npc(id)) return this.place(id, x, y, face);
    const def = Object.values(MAPS).flatMap((m) => m.npcs).find((n) => n.id === id);
    if (!def) return;
    ensureAnims(this, def.sprite);
    const sprite = this.add.sprite(x * TILE, y * TILE, def.sprite, idleFrame(face)).setOrigin(0.5, 1);
    this.npcs.push({ def: { ...def, x, y, face }, sprite, home: face, cameo: true });
  }

  private dropCameo(id: string): void {
    const n = this.npc(id);
    if (!n?.cameo) return;
    n.sprite.destroy();
    this.npcs = this.npcs.filter((x) => x !== n);
  }

  // ---------- sorties, son, sauvegarde ----------

  private checkExit(): void {
    const y = this.player.y;
    const H = this.def.height * TILE;
    const x = this.player.x;
    if (y < 4) this.leave('north');
    else if (y > H - 1) this.leave('south');
    else if (x < 2) this.leave('west');
    else if (x > this.def.width * TILE - 2) this.leave('east');
  }

  private leave(side: string): void {
    if (this.leaving) return;
    this.leaving = true;
    const save = world();
    const exit = this.def.exits.find((e) => e.side === side);
    save.gate = exit?.gate ?? side;
    save.pos = undefined;
    // Une sortie peut mener droit à un autre lieu en pixel (le col descend au village).
    if (exit?.place) save.place = exit.place;
    save.scene = exit?.place ? 'village' : 'map';
    saveWorld();
    UI.setPrompt(null);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => (exit?.place ? this.scene.restart() : this.scene.start('map')));
    this.cameras.main.fade(450, 5, 5, 5, true);
  }

  private updateAmbience(): void {
    const a = this.def.ambience;
    if (!this.river || !a) return;
    const ty = this.player.y / TILE;
    const d = ty < a.rows[0] ? a.rows[0] - ty : ty > a.rows[1] ? ty - a.rows[1] : 0;
    (this.river as Phaser.Sound.WebAudioSound).setVolume?.(Math.max(0, 0.45 - d * 0.045));
  }

  private storePos(): void {
    const s = world();
    if (s.scene !== 'village') return;
    s.pos = { x: this.player.x / TILE, y: this.player.y / TILE, face: this.face };
    saveWorld();
  }

  private cleanup(): void {
    this.clearBubbles();
    if (hooks.beforeSave) hooks.beforeSave = undefined;
    hooks.act = undefined;
    hooks.bell = undefined;
    UI.questHud(null);
    UI.fieldHud(null);
    this.river?.stop();
    this.river?.destroy();
    this.river = undefined;
    UI.setPrompt(null);
    this.game.canvas.style.filter = '';
    this.input.keyboard?.removeAllListeners('keydown');
  }
}
