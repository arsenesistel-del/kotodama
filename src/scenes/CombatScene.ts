import * as Phaser from 'phaser';
import { hideCombat, mountCombat } from '../combat/mount';
import * as UI from '../world/ui';
import type { Beast } from '../world/field';
import { NAMES, finalLine, questById, stateOf } from '../world/quests';
import { saveWorld, world } from '../world/state';

// Le combat tourne avec son canvas et son interface, au-dessus de Phaser.
// Pendant ce temps Phaser se met en veille pour ne rien dessiner pour rien.
// Deux entrées, toutes deux depuis le monde en pixel : la chasse d'un contrat (`{ quest: 'c1' }`), ou une rencontre
// dans les herbes hautes (`{ beast }`, session 10). Les deux ramènent là où l'on était. Le repaire de la v4 n'existe plus.
export class CombatScene extends Phaser.Scene {
  private quest = '';
  private beast: Beast | null = null;

  constructor() {
    super('combat');
  }

  init(data: { quest?: string; beast?: Beast }): void {
    this.quest = data?.quest ?? '';
    this.beast = data?.beast ?? null;
  }

  async create(): Promise<void> {
    const root = document.getElementById('combat')!;
    UI.showUi(false);
    const game = await mountCombat(root);
    const back = (e: Event) => {
      const d = (e as CustomEvent<{ won: boolean; rank: string; enc?: boolean; down?: boolean; fled?: boolean }>).detail;
      const w = world();
      if (d.enc) {
        // Rencontre : on reprend dans les herbes, à la même place. À bout de forces, ワケ ramène au village.
        if (d.down) {
          w.place = 'kirino';
          w.pos = { x: 27.5, y: 11.6, face: 'down' };
          w.flags.downed = true;
        }
      } else w.after = { quest: this.quest, won: d.won, rank: d.rank };
      w.scene = 'village';
      saveWorld();
      this.game.loop.wake();
      this.scene.start('village');
    };
    window.addEventListener('kotodama:village', back);
    this.game.canvas.style.visibility = 'hidden';
    this.game.loop.sleep();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('kotodama:village', back);
      hideCombat(root);
      this.game.canvas.style.visibility = '';
      this.game.loop.wake();
    });

    if (this.beast) return game.huntBeast(this.beast);
    const q = questById(this.quest);
    const st = q && stateOf(q);
    if (q && st) game.huntContract(q.stage, { bonus: !!st.right, final: finalLine(q), back: `Retourne voir ${NAMES[q.giver]} au village.` });
    else {
      // Rien à chasser (ancienne sauvegarde ouverte sur le repaire) : retour au village.
      world().scene = 'village';
      if (world().place === 'touge') world().place = 'kirino';
      saveWorld();
      this.scene.start('village');
    }
  }
}
