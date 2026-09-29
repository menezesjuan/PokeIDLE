import * as Phaser from 'phaser';
import { gameState } from '../state/gameState';
import { battleEngine, CombatEvent } from '../state/battleEngine';
import { GAME_ROUTES } from '../api/routesData';

export class BattleScene extends Phaser.Scene {
  private playerSprite!: Phaser.GameObjects.Sprite;
  private wildSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private wildShadow!: Phaser.GameObjects.Ellipse;

  private playerHpBarBg!: Phaser.GameObjects.Graphics;
  private playerHpBarFill!: Phaser.GameObjects.Graphics;
  private playerInfoText!: Phaser.GameObjects.Text;
  private playerHpText!: Phaser.GameObjects.Text;

  private wildHpBarBg!: Phaser.GameObjects.Graphics;
  private wildHpBarFill!: Phaser.GameObjects.Graphics;
  private wildInfoText!: Phaser.GameObjects.Text;
  private wildHpText!: Phaser.GameObjects.Text;

  private pokeballSprite!: Phaser.GameObjects.Sprite;
  private routeBannerText!: Phaser.GameObjects.Text;

  private unsubscribeState?: () => void;
  private unsubscribeCombat?: () => void;

  private readonly PLAYER_HOME_X = 220;
  private readonly PLAYER_HOME_Y = 125;
  private readonly WILD_HOME_X = 640;
  private readonly WILD_HOME_Y = 125;

  constructor() {
    super({ key: 'BattleScene' });
  }

  preload(): void {
    // Default placeholder textures
    this.createPlaceholderTextures();
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Draw background landscape
    this.drawBackground(width, height);

    // Route title banner
    this.routeBannerText = this.add.text(width / 2, 16, '', {
      fontSize: '12px',
      color: '#94a3b8',
      fontStyle: 'bold',
      fontFamily: 'monospace, sans-serif',
      stroke: '#0f172a',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // Shadows
    this.playerShadow = this.add.ellipse(this.PLAYER_HOME_X, this.PLAYER_HOME_Y + 36, 68, 20, 0x000000, 0.25);
    this.wildShadow = this.add.ellipse(this.WILD_HOME_X, this.WILD_HOME_Y + 36, 68, 20, 0x000000, 0.25);

    // Sprites
    this.playerSprite = this.add.sprite(this.PLAYER_HOME_X, this.PLAYER_HOME_Y, 'pokemon_placeholder');
    this.playerSprite.setScale(1.7);

    this.wildSprite = this.add.sprite(this.WILD_HOME_X, this.WILD_HOME_Y, 'pokemon_placeholder');
    this.wildSprite.setScale(1.7);
    this.wildSprite.setVisible(false);

    // Pokeball item sprite (for catch animation)
    this.pokeballSprite = this.add.sprite(0, 0, 'pokeball_item');
    this.pokeballSprite.setScale(1.3);
    this.pokeballSprite.setVisible(false);

    // UI: Player Stats Box
    this.playerHpBarBg = this.add.graphics();
    this.playerHpBarFill = this.add.graphics();
    this.playerInfoText = this.add.text(120, 36, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 3,
    });
    this.playerHpText = this.add.text(120, 52, '', {
      fontSize: '10px',
      fontFamily: 'monospace, sans-serif',
      color: '#cbd5e1',
      stroke: '#0f172a',
      strokeThickness: 2,
    });

    // UI: Wild Stats Box
    this.wildHpBarBg = this.add.graphics();
    this.wildHpBarFill = this.add.graphics();
    this.wildInfoText = this.add.text(540, 36, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 3,
    });
    this.wildHpText = this.add.text(540, 52, '', {
      fontSize: '10px',
      fontFamily: 'monospace, sans-serif',
      color: '#cbd5e1',
      stroke: '#0f172a',
      strokeThickness: 2,
    });

    // Subscriptions to state & combat
    this.unsubscribeState = gameState.subscribe(() => {
      this.refreshPlayerDisplay();
      this.refreshRouteBanner();
    });

    this.unsubscribeCombat = battleEngine.subscribe((event) => {
      this.handleCombatEvent(event);
    });

    // Initial setup
    this.refreshPlayerDisplay();
    this.refreshRouteBanner();

    if (battleEngine.currentWild) {
      this.displayWildPokemon(battleEngine.currentWild);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unsubscribeState) this.unsubscribeState();
      if (this.unsubscribeCombat) this.unsubscribeCombat();
    });
  }

  private drawBackground(width: number, height: number): void {
    const bgGraphics = this.add.graphics();

    // Sky / Atmosphere gradient
    bgGraphics.fillGradientStyle(0x1e293b, 0x1e293b, 0x0f172a, 0x0f172a, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Ground platform / Battle arena
    bgGraphics.fillStyle(0x15803d, 0.7); // Grass green
    bgGraphics.fillRoundedRect(40, height - 75, width - 80, 55, 14);

    bgGraphics.lineStyle(2, 0x22c55e, 0.8);
    bgGraphics.strokeRoundedRect(40, height - 75, width - 80, 55, 14);

    // Platform ring markings
    bgGraphics.lineStyle(1, 0x4ade80, 0.35);
    bgGraphics.strokeEllipse(this.PLAYER_HOME_X, this.PLAYER_HOME_Y + 36, 85, 26);
    bgGraphics.strokeEllipse(this.WILD_HOME_X, this.WILD_HOME_Y + 36, 85, 26);
  }

  private createPlaceholderTextures(): void {
    // Generate simple placeholder circle textures if images aren't ready
    if (!this.textures.exists('pokemon_placeholder')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x64748b, 1);
      g.fillCircle(24, 24, 22);
      g.generateTexture('pokemon_placeholder', 48, 48);
    }

    if (!this.textures.exists('pokeball_item')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xef4444, 1);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 12, 20, 10);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(2, 10, 20, 4);
      g.fillCircle(12, 12, 4);
      g.generateTexture('pokeball_item', 24, 24);
    }
  }

  private refreshRouteBanner(): void {
    const route = GAME_ROUTES.find(r => r.id === gameState.currentRouteId) || GAME_ROUTES[0];
    const kills = gameState.routeKills[route.id] || 0;
    const req = route.requiredKillsToUnlockNext || 15;
    this.routeBannerText.setText(`${route.name.toUpperCase()} • DERROTADOS: ${kills}/${req}`);
  }

  private refreshPlayerDisplay(): void {
    const player = gameState.activePokemon;
    if (!player) return;

    this.playerInfoText.setText(`${player.displayName} Nv.${player.level}`);
    this.playerHpText.setText(`${player.currentHp} / ${player.maxHp} HP`);

    // Draw HP bar
    this.drawHpBar(this.playerHpBarBg, this.playerHpBarFill, 120, 68, 160, 8, player.currentHp, player.maxHp);

    // Load sprite
    this.loadPokemonSprite(player.speciesId, player.spriteFront, (key) => {
      if (this.playerSprite.active) {
        this.playerSprite.setTexture(key);
      }
    });
  }

  private displayWildPokemon(wild: any): void {
    this.wildSprite.setVisible(true);
    this.wildShadow.setVisible(true);
    this.wildSprite.setScale(1.7);
    this.wildSprite.setAlpha(1);

    this.wildInfoText.setText(`${wild.displayName} Nv.${wild.level}`);
    this.wildHpText.setText(`${wild.currentHp} / ${wild.maxHp} HP`);

    this.drawHpBar(this.wildHpBarBg, this.wildHpBarFill, 540, 68, 160, 8, wild.currentHp, wild.maxHp);

    this.loadPokemonSprite(wild.speciesId, wild.spriteFront, (key) => {
      if (this.wildSprite.active) {
        this.wildSprite.setTexture(key);
      }
    });
  }

  private loadPokemonSprite(speciesId: number, url: string, onLoaded: (key: string) => void): void {
    const key = `poke_${speciesId}`;
    if (this.textures.exists(key)) {
      onLoaded(key);
      return;
    }

    this.load.image(key, url);
    this.load.once(`filecomplete-image-${key}`, () => {
      onLoaded(key);
    });
    this.load.start();
  }

  private drawHpBar(
    bg: Phaser.GameObjects.Graphics,
    fill: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    current: number,
    max: number
  ): void {
    bg.clear();
    bg.fillStyle(0x334155, 0.9);
    bg.fillRoundedRect(x, y, w, h, 3);
    bg.lineStyle(1, 0x475569, 1);
    bg.strokeRoundedRect(x, y, w, h, 3);

    fill.clear();
    const ratio = Math.max(0, Math.min(1, current / max));
    const fillWidth = Math.round(w * ratio);

    let color = 0x22c55e; // Green
    if (ratio <= 0.25) {
      color = 0xef4444; // Red
    } else if (ratio <= 0.5) {
      color = 0xf59e0b; // Yellow
    }

    fill.fillStyle(color, 1);
    if (fillWidth > 0) {
      fill.fillRoundedRect(x, y, fillWidth, h, 3);
    }
  }

  private handleCombatEvent(event: CombatEvent): void {
    switch (event.type) {
      case 'spawn':
        if (event.wildPokemon) {
          this.displayWildPokemon(event.wildPokemon);
        }
        break;

      case 'bump-attack':
        if (event.attacker === 'player') {
          this.playBumpAttack(this.playerSprite, this.wildSprite, this.PLAYER_HOME_X, this.WILD_HOME_X, event.damage || 0, event.isCrit);
          if (event.wildPokemon) {
            this.wildHpText.setText(`${event.wildPokemon.currentHp} / ${event.wildPokemon.maxHp} HP`);
            this.drawHpBar(this.wildHpBarBg, this.wildHpBarFill, 540, 68, 160, 8, event.wildPokemon.currentHp, event.wildPokemon.maxHp);
          }
        } else {
          this.playBumpAttack(this.wildSprite, this.playerSprite, this.WILD_HOME_X, this.PLAYER_HOME_X, event.damage || 0, event.isCrit);
          const p = gameState.activePokemon;
          if (p) {
            this.playerHpText.setText(`${p.currentHp} / ${p.maxHp} HP`);
            this.drawHpBar(this.playerHpBarBg, this.playerHpBarFill, 120, 68, 160, 8, p.currentHp, p.maxHp);
          }
        }
        break;

      case 'catch-attempt':
        this.playCatchAttempt();
        break;

      case 'catch-success':
        this.playCatchSuccess(event.wildPokemon);
        break;

      case 'catch-fail':
        this.playCatchFail();
        break;

      case 'pokemon-faint':
        this.playWildFaint();
        break;

      case 'level-up':
      case 'evolution':
        this.showFloatingText(this.PLAYER_HOME_X, this.PLAYER_HOME_Y - 45, event.type === 'evolution' ? 'EVOLUIU!' : 'SUBIU DE NÍVEL!', '#38bdf8', true);
        break;

      case 'potion-used':
        this.showFloatingText(this.PLAYER_HOME_X, this.PLAYER_HOME_Y - 35, '+CURA', '#4ade80', false);
        break;

      case 'item-drops':
        if (event.drops && event.drops.length > 0) {
          event.drops.forEach((drop, idx) => {
            this.time.delayedCall(idx * 220, () => {
              const color = drop.category === 'ball' ? (drop.itemId === 'master-ball' ? '#e879f9' : '#38bdf8') : '#4ade80';
              this.showFloatingText(
                this.WILD_HOME_X + (idx === 0 ? -20 : 20),
                this.WILD_HOME_Y - 15 - (idx * 16),
                `+${drop.count} ${drop.name}`,
                color,
                drop.tier >= 3 || drop.itemId === 'master-ball'
              );
            });
          });
        }
        break;
    }
  }

  private playBumpAttack(
    attacker: Phaser.GameObjects.Sprite,
    target: Phaser.GameObjects.Sprite,
    homeX: number,
    targetHomeX: number,
    damage: number,
    isCrit?: boolean
  ): void {
    const isPlayer = homeX < targetHomeX;
    const bumpDistance = isPlayer ? 140 : -140;

    // Fast approach tween
    this.tweens.add({
      targets: attacker,
      x: homeX + bumpDistance,
      duration: 140,
      ease: 'Power2',
      yoyo: true,
      onYoyo: () => {
        // Target flash and recoil
        target.setTint(0xff7777);
        this.tweens.add({
          targets: target,
          x: targetHomeX + (isPlayer ? 15 : -15),
          duration: 90,
          yoyo: true,
          ease: 'Power1',
          onComplete: () => {
            target.clearTint();
            target.setX(targetHomeX);
          },
        });

        // Camera micro-shake
        this.cameras.main.shake(70, isCrit ? 0.007 : 0.003);

        // Show floating damage number
        const dmgX = isPlayer ? this.WILD_HOME_X : this.PLAYER_HOME_X;
        const dmgY = (isPlayer ? this.WILD_HOME_Y : this.PLAYER_HOME_Y) - 30;
        const text = isCrit ? `CRÍTICO! -${damage}` : `-${damage}`;
        const color = isCrit ? '#facc15' : '#f87171';
        this.showFloatingText(dmgX, dmgY, text, color, isCrit);
      },
      onComplete: () => {
        attacker.setX(homeX);
      },
    });
  }

  private playCatchAttempt(): void {
    this.pokeballSprite.setPosition(this.PLAYER_HOME_X + 20, this.PLAYER_HOME_Y);
    this.pokeballSprite.setVisible(true);
    this.pokeballSprite.setAlpha(1);

    // Arc ball to wild position
    this.tweens.add({
      targets: this.pokeballSprite,
      x: this.WILD_HOME_X,
      y: this.WILD_HOME_Y,
      duration: 400,
      ease: 'Cubic.Out',
      onComplete: () => {
        // Shrink wild pokemon into ball
        this.tweens.add({
          targets: this.wildSprite,
          scale: 0.1,
          alpha: 0,
          duration: 250,
          ease: 'Power2',
        });

        // Shake pokeball 3 times
        this.tweens.add({
          targets: this.pokeballSprite,
          angle: { from: -18, to: 18 },
          duration: 160,
          repeat: 3,
          yoyo: true,
          ease: 'Sine.InOut',
        });
      },
    });
  }

  private playCatchSuccess(wildPokemon?: any): void {
    // Star burst and success floater
    this.showFloatingText(this.WILD_HOME_X, this.WILD_HOME_Y - 45, 'CAPTURADO!', '#facc15', true);

    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: this.pokeballSprite,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.pokeballSprite.setVisible(false);
          this.wildSprite.setVisible(false);
          this.wildShadow.setVisible(false);
          this.wildHpBarBg.clear();
          this.wildHpBarFill.clear();
          this.wildInfoText.setText('');
          this.wildHpText.setText('');
        },
      });
    });
  }

  private playCatchFail(): void {
    // Ball pops open and wild re-appears
    this.showFloatingText(this.WILD_HOME_X, this.WILD_HOME_Y - 40, 'ESCAPOU!', '#cbd5e1', false);
    this.pokeballSprite.setVisible(false);

    this.tweens.add({
      targets: this.wildSprite,
      scale: 1.7,
      alpha: 1,
      duration: 200,
    });
  }

  private playWildFaint(): void {
    this.tweens.add({
      targets: [this.wildSprite, this.wildShadow],
      alpha: 0,
      y: this.WILD_HOME_Y + 20,
      duration: 400,
      onComplete: () => {
        this.wildSprite.setVisible(false);
        this.wildShadow.setVisible(false);
        this.wildSprite.setY(this.WILD_HOME_Y);
        this.wildShadow.setY(this.WILD_HOME_Y + 36);
        this.wildHpBarBg.clear();
        this.wildHpBarFill.clear();
        this.wildInfoText.setText('');
        this.wildHpText.setText('');
      },
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: string, isBig: boolean = false): void {
    const floatText = this.add.text(x + Phaser.Math.Between(-15, 15), y, text, {
      fontSize: isBig ? '16px' : '13px',
      fontStyle: 'bold',
      fontFamily: 'monospace, sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: floatText,
      y: y - 35,
      alpha: 0,
      scale: isBig ? 1.25 : 1.1,
      duration: 750,
      ease: 'Power1',
      onComplete: () => {
        floatText.destroy();
      },
    });
  }
}
