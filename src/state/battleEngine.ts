import { pokeApi, WildPokemon, PokemonSpeciesInfo, calculateStats } from '../api/pokeApi';
import { gameState } from './gameState';
import { GAME_ROUTES, GameRoute } from '../api/routesData';
import { GAME_ITEMS } from '../api/itemsData';

export type CombatEventType = 
  | 'spawn'
  | 'bump-attack'
  | 'catch-attempt'
  | 'catch-success'
  | 'catch-fail'
  | 'pokemon-faint'
  | 'player-faint'
  | 'potion-used'
  | 'level-up'
  | 'evolution';

export interface CombatEvent {
  type: CombatEventType;
  attacker?: 'player' | 'wild';
  damage?: number;
  isCrit?: boolean;
  wildPokemon?: WildPokemon | null;
  message?: string;
  ballId?: string;
}

export type CombatListener = (event: CombatEvent) => void;

class BattleEngine {
  public currentWild: WildPokemon | null = null;
  public wildSpecies: PokemonSpeciesInfo | null = null;
  public isBattling: boolean = false;
  private combatTimer: any = null;
  private listeners: Set<CombatListener> = new Set();
  private isProcessingTurn: boolean = false;

  public subscribe(listener: CombatListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CombatEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in combat listener:', e);
      }
    }
  }

  public start(): void {
    if (this.isBattling) return;
    this.isBattling = true;
    this.spawnNextEncounter();
  }

  public stop(): void {
    this.isBattling = false;
    if (this.combatTimer) {
      clearTimeout(this.combatTimer);
      this.combatTimer = null;
    }
  }

  public async spawnNextEncounter(): Promise<void> {
    if (!this.isBattling) return;

    // Check player party
    const active = gameState.activePokemon;
    if (!active) {
      console.warn('No active Pokemon in party to battle.');
      return;
    }

    // If active is fainted, try to heal or switch
    if (active.currentHp <= 0) {
      this.handlePartyFainted();
      return;
    }

    const currentRoute = GAME_ROUTES.find(r => r.id === gameState.currentRouteId) || GAME_ROUTES[0];
    
    // Pick wild pokemon from encounter pool
    const pool = currentRoute.encounterPool;
    const totalWeight = pool.reduce((acc, curr) => acc + curr.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const item of pool) {
      if (rand < item.weight) {
        chosen = item;
        break;
      }
      rand -= item.weight;
    }

    const wildLevel = Math.floor(
      Math.random() * (currentRoute.maxLevel - currentRoute.minLevel + 1)
    ) + currentRoute.minLevel;

    try {
      const species = await pokeApi.getPokemon(chosen.speciesIdOrName);
      const stats = calculateStats(species.baseStats, wildLevel);

      this.wildSpecies = species;
      this.currentWild = {
        speciesId: species.id,
        name: species.name,
        displayName: species.displayName,
        types: species.types,
        level: wildLevel,
        currentHp: stats.maxHp,
        maxHp: stats.maxHp,
        attack: stats.attack,
        defense: stats.defense,
        speed: stats.speed,
        catchRate: species.catchRate,
        rewardExp: Math.max(10, Math.floor((species.baseExp * wildLevel) / 6)),
        rewardMoney: Math.max(15, wildLevel * 28 + Math.floor(Math.random() * 20)),
        spriteFront: species.spriteFront,
        artwork: species.artwork,
      };

      this.emit({
        type: 'spawn',
        wildPokemon: this.currentWild,
      });

      // Schedule first bump attack
      this.scheduleNextBump(900);
    } catch (e) {
      console.error('Failed to spawn wild pokemon:', e);
      setTimeout(() => this.spawnNextEncounter(), 2000);
    }
  }

  private scheduleNextBump(delayMs: number = 1300): void {
    if (!this.isBattling) return;
    if (this.combatTimer) clearTimeout(this.combatTimer);

    this.combatTimer = setTimeout(() => {
      this.executeBumpTurn();
    }, delayMs);
  }

  private async executeBumpTurn(): Promise<void> {
    if (!this.isBattling || this.isProcessingTurn) return;
    this.isProcessingTurn = true;

    try {
      const player = gameState.activePokemon;
      const wild = this.currentWild;

      if (!player || !wild || player.currentHp <= 0 || wild.currentHp <= 0) {
        this.isProcessingTurn = false;
        return;
      }

      // Check auto-potion before attacking
      this.checkAutoPotion(player);

      // --- 1. Player attacks Wild ---
      const playerCrit = Math.random() < 0.12;
      const playerDmg = this.calculateDamage(player.level, player.attack, wild.defense, playerCrit);
      wild.currentHp = Math.max(0, wild.currentHp - playerDmg);

      this.emit({
        type: 'bump-attack',
        attacker: 'player',
        damage: playerDmg,
        isCrit: playerCrit,
        wildPokemon: wild,
      });

      // Check if Wild fainted
      if (wild.currentHp <= 0) {
        await this.handleWildDefeated();
        this.isProcessingTurn = false;
        return;
      }

      // --- 2. Wild attacks Player (after brief reaction delay) ---
      setTimeout(async () => {
        if (!this.isBattling || !this.currentWild || this.currentWild.currentHp <= 0) {
          this.isProcessingTurn = false;
          return;
        }

        const wildCrit = Math.random() < 0.08;
        const wildDmg = this.calculateDamage(wild.level, wild.attack, player.defense, wildCrit);
        player.currentHp = Math.max(0, player.currentHp - wildDmg);
        gameState.notify();

        this.emit({
          type: 'bump-attack',
          attacker: 'wild',
          damage: wildDmg,
          isCrit: wildCrit,
          wildPokemon: wild,
        });

        // Check auto-potion after taking damage
        this.checkAutoPotion(player);

        // Check if Player fainted
        if (player.currentHp <= 0) {
          this.handlePartyFainted();
          this.isProcessingTurn = false;
          return;
        }

        this.isProcessingTurn = false;
        // Schedule next bump cycle
        this.scheduleNextBump(1200);
      }, 550);

    } catch (e) {
      console.error('Error during bump turn:', e);
      this.isProcessingTurn = false;
    }
  }

  private calculateDamage(attackerLevel: number, attack: number, defense: number, isCrit: boolean): number {
    const basePower = 40;
    const variation = 0.85 + Math.random() * 0.3; // 85% to 115%
    const critMult = isCrit ? 1.5 : 1.0;
    const raw = (((2 * attackerLevel / 5 + 2) * basePower * (attack / Math.max(1, defense))) / 50 + 2) * variation * critMult;
    return Math.max(1, Math.round(raw));
  }

  private checkAutoPotion(player: any): void {
    if (!gameState.settings.autoPotion) return;
    const hpPercent = (player.currentHp / player.maxHp) * 100;
    if (hpPercent <= gameState.settings.autoPotionThreshold) {
      // Find suitable potion
      const pref = gameState.settings.preferredPotion;
      const candidates = [pref, 'potion', 'super-potion', 'hyper-potion', 'max-potion', 'full-restore'];
      for (const pId of candidates) {
        if (gameState.getItemCount(pId) > 0) {
          if (gameState.useHealingItem(pId, player)) {
            this.emit({
              type: 'potion-used',
              message: `${player.displayName} healed with ${GAME_ITEMS[pId]?.name}!`,
            });
            break;
          }
        }
      }
    }
  }

  private async handleWildDefeated(): Promise<void> {
    const player = gameState.activePokemon;
    const wild = this.currentWild;
    const species = this.wildSpecies;

    if (!player || !wild || !species) return;

    let caught = false;

    // Check Auto-Catch
    if (gameState.settings.autoCatch) {
      const ballId = this.selectBestBall();
      if (ballId) {
        gameState.removeItem(ballId, 1);
        const ballItem = GAME_ITEMS[ballId];
        const ballMult = ballItem?.catchRate || 1.0;

        // Catch formula based on PokeAPI catchRate
        // Max catch rate 255. Lower HP = higher chance.
        const hpFactor = (3 * wild.maxHp - 2 * wild.currentHp) / (3 * wild.maxHp);
        const catchChance = Math.min(0.99, ((species.catchRate * ballMult) / 255) * hpFactor + 0.15);

        this.emit({
          type: 'catch-attempt',
          ballId,
          wildPokemon: wild,
        });

        if (ballMult >= 250 || Math.random() < catchChance) {
          caught = true;
          await gameState.catchPokemon(species, wild.level);
          this.emit({
            type: 'catch-success',
            ballId,
            wildPokemon: wild,
            message: `Gotcha! ${wild.displayName} was caught!`,
          });
        } else {
          this.emit({
            type: 'catch-fail',
            ballId,
            wildPokemon: wild,
            message: `Oh no! The wild ${wild.displayName} broke free!`,
          });
        }
      }
    }

    if (!caught) {
      this.emit({
        type: 'pokemon-faint',
        wildPokemon: wild,
        message: `Wild ${wild.displayName} fainted!`,
      });
    }

    // Rewards: EXP & Money
    gameState.addMoney(wild.rewardMoney);
    const { leveledUp, evolved } = await gameState.addExp(player, wild.rewardExp);

    if (leveledUp) {
      this.emit({
        type: 'level-up',
        message: `${player.displayName} grew to Level ${player.level}!`,
      });
    }

    if (evolved) {
      this.emit({
        type: 'evolution',
        message: `What? ${player.displayName} evolved into ${player.displayName}!`,
      });
    }

    // Record route kill
    gameState.recordRouteKill(gameState.currentRouteId);

    // Wait before next wild spawn
    setTimeout(() => {
      this.currentWild = null;
      this.wildSpecies = null;
      if (gameState.settings.autoHunt && this.isBattling) {
        this.spawnNextEncounter();
      }
    }, caught ? 1400 : 1000);
  }

  private selectBestBall(): string | null {
    const pref = gameState.settings.preferredBall;
    if (gameState.getItemCount(pref) > 0) return pref;

    const ballsOrder = ['poke-ball', 'great-ball', 'ultra-ball', 'master-ball'];
    for (const b of ballsOrder) {
      if (gameState.getItemCount(b) > 0) return b;
    }
    return null;
  }

  private handlePartyFainted(): void {
    // Find next conscious pokemon in party
    const nextIndex = gameState.party.findIndex(p => p.currentHp > 0);
    if (nextIndex > 0) {
      gameState.setActivePokemon(nextIndex);
      this.emit({
        type: 'player-faint',
        message: `Switched to ${gameState.activePokemon?.displayName}!`,
      });
      setTimeout(() => this.executeBumpTurn(), 800);
      return;
    }

    // All fainted: Pokemon Center Rest (cooldown & full heal)
    this.emit({
      type: 'player-faint',
      message: 'All Pokémon fainted! Resting at the Pokémon Center...',
    });

    setTimeout(() => {
      for (const p of gameState.party) {
        p.currentHp = p.maxHp;
      }
      gameState.notify();
      if (gameState.settings.autoHunt && this.isBattling) {
        this.spawnNextEncounter();
      }
    }, 3500);
  }
}

export const battleEngine = new BattleEngine();
