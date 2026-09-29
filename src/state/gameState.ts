import { ActivePokemon, PokemonSpeciesInfo, pokeApi, calculateStats, getExpForLevel, getExpBetweenLevels } from '../api/pokeApi';
import { GAME_ITEMS } from '../api/itemsData';
import { GAME_ROUTES, GameRoute } from '../api/routesData';

export interface GameSettings {
  autoHunt: boolean;
  autoCatch: boolean;
  preferredBall: string;
  autoPotion: boolean;
  autoPotionThreshold: number; // e.g. 40 (%)
  preferredPotion: string;
  autoReleaseDuplicates: boolean;
  soundEnabled: boolean;
  autoAdvanceRoutes: boolean;
}

export interface GameSaveData {
  money: number;
  inventory: Record<string, number>;
  party: ActivePokemon[];
  box: ActivePokemon[];
  currentRouteId: string;
  unlockedRoutes: string[];
  routeKills: Record<string, number>;
  settings: GameSettings;
  stats: {
    totalBattlesWon: number;
    totalCaught: number;
    totalMoneyEarned: number;
    totalEvolutions: number;
  };
}

export type StateListener = (state: GameStateManager) => void;

class GameStateManager {
  public money: number = 1000;
  public inventory: Record<string, number> = {
    'poke-ball': 15,
    'potion': 8,
  };
  public party: ActivePokemon[] = [];
  public box: ActivePokemon[] = [];
  public currentRouteId: string = 'route-1';
  public unlockedRoutes: string[] = ['route-1'];
  public routeKills: Record<string, number> = { 'route-1': 0 };
  public settings: GameSettings = {
    autoHunt: true,
    autoCatch: true,
    preferredBall: 'poke-ball',
    autoPotion: true,
    autoPotionThreshold: 40,
    preferredPotion: 'potion',
    autoReleaseDuplicates: false,
    soundEnabled: true,
    autoAdvanceRoutes: true,
  };
  public stats = {
    totalBattlesWon: 0,
    totalCaught: 0,
    totalMoneyEarned: 0,
    totalEvolutions: 0,
  };

  private listeners: Set<StateListener> = new Set();
  private saveKey = 'pokeidle_savedata_v1';

  constructor() {
    this.load();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    }
    this.save();
  }

  public get activePokemon(): ActivePokemon | null {
    return this.party.length > 0 ? this.party[0] : null;
  }

  public addMoney(amount: number): void {
    this.money += Math.max(0, Math.floor(amount));
    this.stats.totalMoneyEarned += Math.max(0, Math.floor(amount));
    this.notify();
  }

  public spendMoney(amount: number): boolean {
    if (this.money >= amount) {
      this.money -= amount;
      this.notify();
      return true;
    }
    return false;
  }

  public addItem(itemId: string, count: number = 1): void {
    this.inventory[itemId] = (this.inventory[itemId] || 0) + count;
    this.notify();
  }

  public removeItem(itemId: string, count: number = 1): boolean {
    const current = this.inventory[itemId] || 0;
    if (current >= count) {
      this.inventory[itemId] = current - count;
      if (this.inventory[itemId] <= 0) {
        delete this.inventory[itemId];
      }
      this.notify();
      return true;
    }
    return false;
  }

  public getItemCount(itemId: string): number {
    return this.inventory[itemId] || 0;
  }

  // Create starter pokemon if party is empty
  public async initStarter(starterIdOrName: string | number = 'pikachu'): Promise<void> {
    if (this.party.length === 0) {
      const species = await pokeApi.getPokemon(starterIdOrName);
      const pokemon = this.createPokemonInstance(species, 5);
      this.party.push(pokemon);
      this.notify();
    }
  }

  public createPokemonInstance(species: PokemonSpeciesInfo, level: number): ActivePokemon {
    const stats = calculateStats(species.baseStats, level);
    const expBase = getExpForLevel(level);
    const expNext = getExpBetweenLevels(level);

    return {
      uid: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      speciesId: species.id,
      name: species.name,
      displayName: species.displayName,
      types: species.types,
      level,
      currentHp: stats.maxHp,
      maxHp: stats.maxHp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      exp: expBase,
      expToNextLevel: expNext,
      spriteFront: species.spriteFront,
      spriteBack: species.spriteBack,
      artwork: species.artwork,
      evolutions: species.evolutions,
    };
  }

  public async catchPokemon(species: PokemonSpeciesInfo, level: number): Promise<ActivePokemon> {
    const pokemon = this.createPokemonInstance(species, level);
    this.stats.totalCaught++;

    // Check if auto-release duplicates is enabled and player already owns this species
    const isOwned = this.party.some(p => p.speciesId === species.id) || this.box.some(p => p.speciesId === species.id);
    if (this.settings.autoReleaseDuplicates && isOwned) {
      // Auto-sell duplicate for extra pokedollars
      const sellValue = Math.floor(pokemon.level * 60 + (species.baseExp || 50));
      this.addMoney(sellValue);
      return pokemon;
    }

    if (this.party.length < 6) {
      this.party.push(pokemon);
    } else {
      this.box.push(pokemon);
    }

    this.notify();
    return pokemon;
  }

  public setActivePokemon(index: number): void {
    if (index > 0 && index < this.party.length) {
      const selected = this.party.splice(index, 1)[0];
      this.party.unshift(selected);
      this.notify();
    }
  }

  public movePokemonToParty(boxIndex: number): boolean {
    if (this.party.length >= 6) return false;
    if (boxIndex >= 0 && boxIndex < this.box.length) {
      const p = this.box.splice(boxIndex, 1)[0];
      this.party.push(p);
      this.notify();
      return true;
    }
    return false;
  }

  public movePokemonToBox(partyIndex: number): boolean {
    if (this.party.length <= 1) return false; // Must keep at least 1
    if (partyIndex >= 0 && partyIndex < this.party.length) {
      const p = this.party.splice(partyIndex, 1)[0];
      this.box.push(p);
      this.notify();
      return true;
    }
    return false;
  }

  public swapPartyAndBox(partyIndex: number, boxIndex: number): boolean {
    if (partyIndex >= 0 && partyIndex < this.party.length && boxIndex >= 0 && boxIndex < this.box.length) {
      const fromParty = this.party[partyIndex];
      const fromBox = this.box[boxIndex];
      this.party[partyIndex] = fromBox;
      this.box[boxIndex] = fromParty;
      this.notify();
      return true;
    }
    return false;
  }

  public get hasConsciousPartyMember(): boolean {
    return this.party.some(p => p.currentHp > 0);
  }

  public get faintedPartyMembers(): ActivePokemon[] {
    return this.party.filter(p => p.currentHp <= 0);
  }

  public revivePokemon(uid: string): boolean {
    const pokemon = [...this.party, ...this.box].find(p => p.uid === uid);
    if (!pokemon || pokemon.currentHp > 0) return false;
    const REVIVE_COST = 10;
    if (this.money < REVIVE_COST) return false;

    this.spendMoney(REVIVE_COST);
    pokemon.currentHp = pokemon.maxHp;
    this.notify();
    return true;
  }

  public reviveAllParty(): { success: boolean; revivedCount: number; totalCost: number } {
    const fainted = this.party.filter(p => p.currentHp <= 0);
    if (fainted.length === 0) return { success: false, revivedCount: 0, totalCost: 0 };
    const costPer = 10;
    const totalCost = fainted.length * costPer;
    if (this.money < totalCost) return { success: false, revivedCount: 0, totalCost };

    this.spendMoney(totalCost);
    for (const p of fainted) {
      p.currentHp = p.maxHp;
    }
    this.notify();
    return { success: true, revivedCount: fainted.length, totalCost };
  }

  public emergencyJoyHeal(): boolean {
    // Only available if player has < 10 coins and 0 alive pokemon in entire party and box
    const hasAnyAlive = [...this.party, ...this.box].some(p => p.currentHp > 0);
    if (hasAnyAlive || this.money >= 10) return false;
    if (this.party.length > 0) {
      this.party[0].currentHp = Math.max(10, Math.round(this.party[0].maxHp * 0.5));
      this.notify();
      return true;
    }
    return false;
  }

  public sellPokemon(fromBox: boolean, index: number): number {
    const list = fromBox ? this.box : this.party;
    if (!fromBox && this.party.length <= 1) return 0; // Can't sell last pokemon

    if (index >= 0 && index < list.length) {
      const pokemon = list.splice(index, 1)[0];
      const sellValue = Math.floor(pokemon.level * 80 + 100);
      this.addMoney(sellValue);
      this.notify();
      return sellValue;
    }
    return 0;
  }

  // Use Healing Item
  public useHealingItem(itemId: string, pokemon: ActivePokemon): boolean {
    const item = GAME_ITEMS[itemId];
    if (!item || item.category !== 'healing') return false;
    if (pokemon.currentHp >= pokemon.maxHp) return false;
    if (!this.removeItem(itemId, 1)) return false;

    let healed = 0;
    if (item.isPercent) {
      healed = pokemon.maxHp;
    } else {
      healed = item.healAmount || 20;
    }

    pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healed);
    this.notify();
    return true;
  }

  // Use Evolution Stone
  public async useEvolutionStone(itemId: string, pokemon: ActivePokemon): Promise<boolean> {
    const item = GAME_ITEMS[itemId];
    if (!item || item.category !== 'stone') return false;
    if (this.getItemCount(itemId) <= 0) return false;

    // Check if pokemon has an evolution triggered by this item
    const evo = pokemon.evolutions.find(e => e.triggerType === 'use-item' && e.item === itemId);
    if (!evo) return false;

    this.removeItem(itemId, 1);
    await this.evolvePokemon(pokemon, evo.targetSpeciesId);
    return true;
  }

  // Check and perform level-up evolution if requirements are met
  public async checkLevelUpEvolution(pokemon: ActivePokemon): Promise<boolean> {
    const evo = pokemon.evolutions.find(e => e.triggerType === 'level-up' && e.minLevel !== undefined && pokemon.level >= e.minLevel);
    if (evo) {
      await this.evolvePokemon(pokemon, evo.targetSpeciesId);
      return true;
    }
    return false;
  }

  public async evolvePokemon(pokemon: ActivePokemon, targetSpeciesId: number): Promise<void> {
    try {
      const newSpecies = await pokeApi.getPokemon(targetSpeciesId);
      pokemon.speciesId = newSpecies.id;
      pokemon.name = newSpecies.name;
      pokemon.displayName = newSpecies.displayName;
      pokemon.types = newSpecies.types;
      pokemon.spriteFront = newSpecies.spriteFront;
      pokemon.spriteBack = newSpecies.spriteBack;
      pokemon.artwork = newSpecies.artwork;
      pokemon.evolutions = newSpecies.evolutions;

      // Recalculate stats keeping HP ratio
      const hpRatio = pokemon.currentHp / pokemon.maxHp;
      const stats = calculateStats(newSpecies.baseStats, pokemon.level);
      pokemon.maxHp = stats.maxHp;
      pokemon.currentHp = Math.round(stats.maxHp * Math.max(0.2, hpRatio));
      pokemon.attack = stats.attack;
      pokemon.defense = stats.defense;
      pokemon.speed = stats.speed;

      this.stats.totalEvolutions++;
      this.notify();
    } catch (e) {
      console.error('Failed to evolve pokemon:', e);
    }
  }

  // Grant EXP to active Pokemon and handle level ups
  public async addExp(pokemon: ActivePokemon, expAmount: number): Promise<{ leveledUp: boolean; evolved: boolean }> {
    let leveledUp = false;
    let evolved = false;

    pokemon.exp += expAmount;
    let expForNext = getExpForLevel(pokemon.level + 1);

    while (pokemon.exp >= expForNext && pokemon.level < 100) {
      pokemon.level++;
      leveledUp = true;
      expForNext = getExpForLevel(pokemon.level + 1);

      // Recalculate stats
      const baseSpecies = await pokeApi.getPokemon(pokemon.speciesId);
      const newStats = calculateStats(baseSpecies.baseStats, pokemon.level);
      const hpGain = newStats.maxHp - pokemon.maxHp;
      pokemon.maxHp = newStats.maxHp;
      pokemon.currentHp += Math.max(2, hpGain);
      pokemon.attack = newStats.attack;
      pokemon.defense = newStats.defense;
      pokemon.speed = newStats.speed;

      // Check level evolution
      const didEvolve = await this.checkLevelUpEvolution(pokemon);
      if (didEvolve) {
        evolved = true;
      }
    }

    pokemon.expToNextLevel = getExpBetweenLevels(pokemon.level);
    if (leveledUp) {
      this.checkRouteProgression(this.currentRouteId);
    }
    this.notify();
    return { leveledUp, evolved };
  }

  // Route progression helpers
  public getLatestUnlockedRoute(): GameRoute {
    let highestIdx = 0;
    for (const rId of this.unlockedRoutes) {
      const idx = GAME_ROUTES.findIndex(r => r.id === rId);
      if (idx > highestIdx) highestIdx = idx;
    }
    return GAME_ROUTES[highestIdx] || GAME_ROUTES[0];
  }

  public isAtFrontierRoute(): boolean {
    const latest = this.getLatestUnlockedRoute();
    return this.currentRouteId === latest.id;
  }

  public getHighestPartyLevel(): number {
    if (this.party.length === 0) return 1;
    return Math.max(...this.party.map(p => p.level));
  }

  public checkRouteProgression(routeId: string): { unlockedNext: boolean; advancedNext: boolean; nextRoute?: GameRoute } {
    const routeIndex = GAME_ROUTES.findIndex(r => r.id === routeId);
    if (routeIndex === -1 || routeIndex >= GAME_ROUTES.length - 1) {
      return { unlockedNext: false, advancedNext: false };
    }

    const currentRoute = GAME_ROUTES[routeIndex];
    const nextRoute = GAME_ROUTES[routeIndex + 1];
    const requiredKills = currentRoute.requiredKillsToUnlockNext || 15;
    const currentKills = this.routeKills[routeId] || 0;

    // Progression requirement 1: Defeated enough wild Pokemon in this hunt
    const killsMet = currentKills >= requiredKills;

    // Progression requirement 2: Pokemon level meets or exceeds the required level for the next route!
    const highestLevel = this.getHighestPartyLevel();
    const levelMet = highestLevel >= nextRoute.minLevel;

    let unlockedNext = false;
    let advancedNext = false;

    if (killsMet && levelMet) {
      if (!this.unlockedRoutes.includes(nextRoute.id)) {
        this.unlockedRoutes.push(nextRoute.id);
        unlockedNext = true;
      }

      // Progression requirement 3: Auto-advance only if player is at their latest unlocked hunt (frontier)
      // If player voluntarily backtracked to an earlier route, they are manual-farming.
      // Auto-advance resumes as soon as they select their latest hunt!
      const isFrontier = this.isAtFrontierRoute() || (routeId === this.getLatestUnlockedRoute().id);
      if (isFrontier && this.settings.autoAdvanceRoutes) {
        this.currentRouteId = nextRoute.id;
        advancedNext = true;
      }
    }

    this.notify();
    return { unlockedNext, advancedNext, nextRoute };
  }

  // Record Route Kill
  public recordRouteKill(routeId: string): { unlockedNext: boolean; advancedNext: boolean; nextRoute?: GameRoute } {
    this.routeKills[routeId] = (this.routeKills[routeId] || 0) + 1;
    this.stats.totalBattlesWon++;
    return this.checkRouteProgression(routeId);
  }

  public setRoute(routeId: string): void {
    if (this.unlockedRoutes.includes(routeId)) {
      this.currentRouteId = routeId;
      this.notify();
    }
  }

  public returnToFrontierHunt(): void {
    const latest = this.getLatestUnlockedRoute();
    this.setRoute(latest.id);
  }

  public updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.notify();
  }

  // Persistence
  private save(): void {
    try {
      const data: GameSaveData = {
        money: this.money,
        inventory: this.inventory,
        party: this.party,
        box: this.box,
        currentRouteId: this.currentRouteId,
        unlockedRoutes: this.unlockedRoutes,
        routeKills: this.routeKills,
        settings: this.settings,
        stats: this.stats,
      };
      localStorage.setItem(this.saveKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save game state to localStorage:', e);
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (raw) {
        const data: GameSaveData = JSON.parse(raw);
        if (data.money !== undefined) this.money = data.money;
        if (data.inventory) this.inventory = data.inventory;
        if (data.party && data.party.length > 0) this.party = data.party;
        if (data.box) this.box = data.box;
        if (data.currentRouteId) this.currentRouteId = data.currentRouteId;
        if (data.unlockedRoutes) this.unlockedRoutes = data.unlockedRoutes;
        if (data.routeKills) this.routeKills = data.routeKills;
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
        if (data.stats) this.stats = { ...this.stats, ...data.stats };
      }
    } catch (e) {
      console.warn('Failed to load game state:', e);
    }
  }

  public resetProgress(): void {
    localStorage.removeItem(this.saveKey);
    window.location.reload();
  }
}

export const gameState = new GameStateManager();
