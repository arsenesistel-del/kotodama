import * as Phaser from 'phaser';
import { hideCombat, mountCombat } from '../combat/mount';
import * as UI from '../world/ui';
import { NAMES, finalLine, questById, stateOf } from '../world/quests';
import { saveWorld, world } from '../world/state';

// Le combat tourne avec son canvas et son interface, au-dessus de Phaser.
// Pendant ce temps Phaser se met en veille pour ne rien dessiner pour rien.
// Deux entrées : le repaire (霧野峠 sur la carte, bouton 地図 pour revenir), ou la chasse d'un contrat lancée
// depuis le village (`{ quest: 'c1' }`), qui ramène au village avec son résultat.
export class CombatScene extends Phaser.Scene {
  private quest = '';

  constructor() {
    super('combat');
  }

  init(data: { quest?: string }): void {
    this.quest = data?.quest ?? '';
  }

  async create(): Promise<void> {
    const root = document.getElementById('combat')!;
    UI.showUi(false);
    const game = await mountCombat(root);
    const toMap = () => {
      this.game.loop.wake();
      this.scene.start('map');
    };
    const toVillage = (e: Event) => {
      const { won, rank } = (e as CustomEvent<{ won: boolean; rank: string }>).detail;
      world().after = { quest: this.quest, won, rank };
      world().scene = 'village';
      saveWorld();
      this.game.loop.wake();
      this.scene.start('village');
    };
    window.addEventListener('kotodama:map', toMap);
    window.addEventListener('kotodama:village', toVillage);
    this.game.canvas.style.visibility = 'hidden';
    this.game.loop.sleep();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('kotodama:map', toMap);
      window.removeEventListener('kotodama:village', toVillage);
      hideCombat(root);
      this.game.canvas.style.visibility = '';
      this.game.loop.wake();
    });

    const q = questById(this.quest);
    const st = q && stateOf(q);
    if (q && st) game.huntContract(q.stage, { bonus: !!st.right, final: finalLine(q), back: `Retourne voir ${NAMES[q.giver]} au village.` });
    else game.openHub();
  }
}
