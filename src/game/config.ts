import * as Phaser from 'phaser';
import { BattleScene } from './BattleScene';

export function createGameConfig(containerId: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: containerId,
    width: 860,
    height: 180,
    backgroundColor: '#0f172a',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BattleScene],
  };
}
