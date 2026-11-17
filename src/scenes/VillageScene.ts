import * as Phaser from 'phaser';
import { TILE, type Dir } from '../world/assets';
import { DIR_VEC, ensureAnims, faceToward, idleFrame } from '../world/actor';
import { buildMap, type BuiltMap } from '../world/build';
import { DEPTH, drawMap } from '../world/draw';
import { SPEAKERS } from '../world/dialogue';
import type { MapDef, NpcDef } from '../world/mapdef';
import { MAPS } from '../world/maps';
import { saveWorld, world } from '../world/state';
import * as UI from '../world/ui';
import { hooks } from '../world/vn';
import * as Quests from '../world/quests';

const WALK = 72; // px par seconde
const RUN = 118;
const BODY = { w: 10, h: 6 }; // boîte de collision, aux pieds

interface Npc {
  def: NpcDef;
  sprite: Phaser.GameObjects.Sprite;
  home: Dir;
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
  private target: { kind: 'npc' | 'read'; id: string } | null = null;
  private leaving = false;
  private busy = false;
  private saveClock = 0;
  private marks = new Map<string, Phaser.GameObjects.Image>();

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
    drawMap(this, this.built);

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

    this.makeFog();
    this.setupCamera();
    this.setupInput();
    this.setupSound();

    save.scene = 'village';
    saveWorld();
    UI.showUi(true);
    UI.vignette(true);
    this.game.canvas.style.filter = 'saturate(0.74) brightness(0.94) contrast(1.05)';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    hooks.beforeSave = () => this.storePos();
    hooks.act = (a) => Quests.act(a);
    this.makeMarkers();
    this.refreshQuest();

    this.cameras.main.fadeIn(600, 5, 5, 5);
    UI.placeCard(this.def.name, this.def.fr);
    if (!save.hints) {
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
    } else if (!save.seen['arrival:' + this.def.id]) {
      save.seen['arrival:' + this.def.id] = true;
      saveWorld();
      this.busy = true;
      this.time.delayedCall(1700, () => UI.openDialog('arrival', () => (this.busy = false)));
    }

    // Accès de test : window.KDW.go(x, y) téléporte, KDW.state() décrit la scène.
    (window as unknown as { KDW: unknown }).KDW = {
      go: (x: number, y: number) => this.player.setPosition(x * TILE, y * TILE),
      state: () => ({ x: this.player.x / TILE, y: this.player.y / TILE, face: this.face, target: this.target, dialog: UI.dialogOpen() }),
      talk: () => this.interact(),
      talkTo: (id: string) => {
        this.target = { kind: this.npcs.some((n) => n.def.id === id) ? 'npc' : 'read', id };
        this.interact();
      },
      quests: () => JSON.parse(JSON.stringify(world().quests)),
      hud: () => Quests.hud(),
      mark: (id: string) => Quests.marker(id),
    };
  }

  // ---------- installation ----------

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.def.width * TILE, this.def.height * TILE);
    cam.setRoundPixels(true);
    const zoom = () => {
      const { width, height } = this.scale;
      cam.setZoom(Phaser.Math.Clamp(Math.round(Math.min(width / (TILE * 22), height / (TILE * 13))), 2, 6));
    };
    zoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, zoom, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, zoom, this));
    cam.startFollow(this.player, true, 0.14, 0.14, 0, TILE / 2);
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
    const a = this.def.fog;
    this.fog = [
      this.add.tileSprite(0, 0, w, h, 'fog').setOrigin(0).setDepth(DEPTH.fog).setAlpha(a),
      this.add.tileSprite(0, 0, w, h, 'fog').setOrigin(0).setDepth(DEPTH.fog).setAlpha(a * 0.8).setTileScale(1.9),
    ];
    // La brume est plus épaisse sur la colline du cimetière.
    for (const [x, y, sc] of [[39.5, 33, 0.9], [36, 35, 0.6], [43, 31, 0.5]])
      this.add.image(x * TILE, y * TILE, 'fogblob').setDepth(DEPTH.fog).setAlpha(0.7).setScale(sc);
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
    if (!this.busy && !UI.dialogOpen() && !UI.panelOpen()) {
      if (down(this.keys.left)) vx -= 1;
      if (down(this.keys.right)) vx += 1;
      if (down(this.keys.up)) vy -= 1;
      if (down(this.keys.down)) vy += 1;
    }
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
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
    this.player.setDepth(DEPTH.actors + this.player.y * 1e-5);
    for (const n of this.npcs) n.sprite.setDepth(DEPTH.actors + n.sprite.y * 1e-5);
    const bob = Math.round(Math.sin(this.time.now / 260) * 1.5);
    for (const n of this.npcs) this.marks.get(n.def.id)?.setPosition(n.sprite.x, n.sprite.y - 19 + bob);

    this.followWake(dt, moving);
    this.checkExit();
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
    if (tx < 0 || tx >= W) return true;
    if (ty < 0 || ty >= H) {
      // Hors de la carte, on ne passe que par une sortie.
      const side = ty < 0 ? 'north' : 'south';
      return !this.def.exits.some((e) => e.side === side && tx >= e.from && tx <= e.to);
    }
    return this.built.solid[ty * W + tx] === 1;
  }

  private blocked(x: number, y: number): boolean {
    const x0 = x - BODY.w / 2, x1 = x + BODY.w / 2 - 0.01, y0 = y - BODY.h, y1 = y - 0.01;
    for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [x, y0], [x, y1]])
      if (this.solidAt(px, py)) return true;
    for (const n of this.npcs) {
      const s = n.sprite;
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
    if (!best) {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      for (const r of this.built.readables) if (r.cells.some(([x, y]) => x === tx && y === ty)) best = { kind: 'read', id: r.id };
    }
    this.target = best;
    if (!best) return UI.setPrompt(null);
    if (best.kind === 'npc') UI.setPrompt(`話す <small>${UI.plain(SPEAKERS[best.id]?.name ?? '')}</small>`);
    else if (best.id.startsWith('site-') || Quests.QUESTS.some((q) => q.site === best!.id && Quests.active() === q)) UI.setPrompt('調べる <small>examiner</small>');
    else UI.setPrompt('読む <small>lire</small>');
  }

  private interact(): void {
    const t = this.target;
    if (!t || this.busy) return;
    if (t.kind === 'read') {
      // Un objet peut être le site d'un contrat : la créature s'y montre, on finit sa phrase, puis on chasse.
      const plan = Quests.sitePlan(t.id, this.def.readables[t.id] ?? t.id);
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
    const accepting = plan.ids.some((i) => i.endsWith(':give'));
    const reporting = plan.ids.some((i) => i.endsWith(':report'));
    this.busy = true;
    UI.openChain(plan.ids, () => {
      this.busy = false;
      this.time.delayedCall(400, () => n.sprite.setFrame(idleFrame(n.home)));
      world().seen['talk:' + t.id] = true;
      plan.after?.();
      saveWorld();
      const q = Quests.questById(plan.ids.find((i) => /^c\d:/.test(i))?.split(':')[0] ?? '');
      if (accepting && q) UI.placeCard(q.title, `依頼 · ${q.fr}`, '依');
      if (reporting && q) {
        UI.placeCard(q.title, 'Contrat rempli', '了');
        UI.toast(`縁 ＋1 <small>${Quests.NAMES[t.id] ?? ''}</small>`);
      }
      this.refreshQuest();
    });
  }

  // ---------- contrats ----------

  /** Encart du contrat, marqueurs au-dessus des PNJ, roue du moulin qui tourne une fois le premier contrat fini. */
  private refreshQuest(): void {
    UI.questHud(Quests.hud());
    for (const n of this.npcs) {
      const m = Quests.marker(n.def.id);
      const img = this.marks.get(n.def.id);
      if (img) img.setVisible(!!m).setTexture(m === '？' ? 'mark?' : 'mark!');
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

  // ---------- sorties, son, sauvegarde ----------

  private checkExit(): void {
    const y = this.player.y;
    const H = this.def.height * TILE;
    if (y < 4) this.leave('north');
    else if (y > H - 1) this.leave('south');
  }

  private leave(side: string): void {
    if (this.leaving) return;
    this.leaving = true;
    const save = world();
    const exit = this.def.exits.find((e) => e.side === side);
    save.gate = exit?.gate ?? side;
    save.pos = undefined;
    save.scene = 'map';
    saveWorld();
    UI.setPrompt(null);
    this.cameras.main.fadeOut(450, 5, 5, 5);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('map'));
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
    if (hooks.beforeSave) hooks.beforeSave = undefined;
    hooks.act = undefined;
    UI.questHud(null);
    this.river?.stop();
    this.river?.destroy();
    this.river = undefined;
    UI.setPrompt(null);
    this.game.canvas.style.filter = '';
    this.input.keyboard?.removeAllListeners('keydown');
  }
}
