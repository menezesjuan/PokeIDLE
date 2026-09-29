export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface EvolutionTriggerInfo {
  triggerType: 'level-up' | 'use-item' | 'other';
  minLevel?: number;
  item?: string;
  targetSpeciesName: string;
  targetSpeciesId: number;
}

export interface PokemonSpeciesInfo {
  id: number;
  name: string;
  displayName: string;
  types: string[];
  baseStats: BaseStats;
  spriteFront: string;
  spriteBack: string;
  artwork: string;
  catchRate: number;
  baseExp: number;
  evolutions: EvolutionTriggerInfo[];
}

export interface ActivePokemon {
  uid: string; // Unique instance ID
  speciesId: number;
  name: string;
  displayName: string;
  types: string[];
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  exp: number;
  expToNextLevel: number;
  spriteFront: string;
  spriteBack: string;
  artwork: string;
  evolutions: EvolutionTriggerInfo[];
}

export interface WildPokemon {
  speciesId: number;
  name: string;
  displayName: string;
  types: string[];
  level: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  catchRate: number;
  rewardExp: number;
  rewardMoney: number;
  spriteFront: string;
  artwork: string;
}

const CACHE_PREFIX = 'pokeidle_cache_';

class PokeApiClient {
  private memoryCache: Map<string, any> = new Map();

  private getFromLocalCache<T>(key: string): T | null {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
    return null;
  }

  private saveToLocalCache(key: string, data: any): void {
    this.memoryCache.set(key, data);
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  async getPokemon(idOrName: string | number): Promise<PokemonSpeciesInfo> {
    const key = `pokemon_${String(idOrName).toLowerCase()}`;
    const cached = this.getFromLocalCache<PokemonSpeciesInfo>(key);
    if (cached) return cached;

    // 1. Fetch Pokemon basic data
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
    if (!res.ok) {
      throw new Error(`Pokemon not found: ${idOrName}`);
    }
    const data = await res.json();

    const id = data.id;
    const name = data.name;
    const types = data.types.map((t: any) => t.type.name);

    // Extract stats
    const statsMap: Record<string, number> = {};
    for (const s of data.stats) {
      statsMap[s.stat.name] = s.base_stat;
    }

    const baseStats: BaseStats = {
      hp: statsMap['hp'] || 45,
      attack: statsMap['attack'] || 49,
      defense: statsMap['defense'] || 49,
      spAttack: statsMap['special-attack'] || 65,
      spDefense: statsMap['special-defense'] || 65,
      speed: statsMap['speed'] || 45,
    };

    // Animated showdown sprite or fallback to front_default
    const showdownFront = data.sprites?.other?.showdown?.front_default;
    const showdownBack = data.sprites?.other?.showdown?.back_default;
    const spriteFront = showdownFront || data.sprites?.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    const spriteBack = showdownBack || data.sprites?.back_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
    const artwork = data.sprites?.other?.['official-artwork']?.front_default || spriteFront;

    // 2. Fetch Species data for catch rate & evolution chain
    let catchRate = 120;
    let evolutions: EvolutionTriggerInfo[] = [];

    try {
      const speciesRes = await fetch(data.species.url);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        catchRate = speciesData.capture_rate ?? 120;

        if (speciesData.evolution_chain?.url) {
          evolutions = await this.getEvolutionsForSpecies(speciesData.evolution_chain.url, name);
        }
      }
    } catch (e) {
      console.warn(`Could not fetch species/evolution for ${name}:`, e);
    }

    const result: PokemonSpeciesInfo = {
      id,
      name,
      displayName: capitalize(name),
      types,
      baseStats,
      spriteFront,
      spriteBack,
      artwork,
      catchRate,
      baseExp: data.base_experience || 64,
      evolutions,
    };

    this.saveToLocalCache(key, result);
    // Also cache by ID
    this.saveToLocalCache(`pokemon_${id}`, result);

    return result;
  }

  private async getEvolutionsForSpecies(chainUrl: string, currentSpeciesName: string): Promise<EvolutionTriggerInfo[]> {
    const chainCacheKey = `chain_${chainUrl}`;
    let chainData = this.getFromLocalCache<any>(chainCacheKey);

    if (!chainData) {
      const res = await fetch(chainUrl);
      if (!res.ok) return [];
      chainData = await res.json();
      this.saveToLocalCache(chainCacheKey, chainData);
    }

    const evolutions: EvolutionTriggerInfo[] = [];

    // Helper to traverse evolution chain
    const traverse = (node: any) => {
      if (!node) return;
      if (node.species.name.toLowerCase() === currentSpeciesName.toLowerCase()) {
        for (const next of node.evolves_to || []) {
          const detail = next.evolution_details?.[0];
          let triggerType: 'level-up' | 'use-item' | 'other' = 'level-up';
          let minLevel = detail?.min_level || undefined;
          let item = detail?.item?.name || undefined;

          if (detail?.trigger?.name === 'use-item' || item) {
            triggerType = 'use-item';
          } else if (detail?.trigger?.name === 'level-up') {
            triggerType = 'level-up';
            // Default level if min_level is missing (e.g. happiness, friendship, trade)
            if (!minLevel) {
              minLevel = 25; // Sensible idle fallback for friendship/happiness
            }
          } else if (detail?.trigger?.name === 'trade') {
            // For idle game friendliness, trade evolutions can happen at lv 36 or via evolution stone/level
            triggerType = 'level-up';
            minLevel = 36;
          }

          const targetUrlParts = next.species.url.split('/').filter(Boolean);
          const targetId = parseInt(targetUrlParts[targetUrlParts.length - 1], 10);

          evolutions.push({
            triggerType,
            minLevel,
            item,
            targetSpeciesName: next.species.name,
            targetSpeciesId: targetId,
          });
        }
        return;
      }

      for (const next of node.evolves_to || []) {
        traverse(next);
      }
    };

    traverse(chainData.chain);
    return evolutions;
  }
}

export const pokeApi = new PokeApiClient();

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// Calculate active stats based on level
export function calculateStats(base: BaseStats, level: number): { maxHp: number; attack: number; defense: number; speed: number } {
  // Classic Pokemon formula adaptation for idle game balance
  const maxHp = Math.floor(((2 * base.hp + 31) * level) / 100) + level + 15;
  const attack = Math.floor(((2 * base.attack + 31) * level) / 100) + 5;
  const defense = Math.floor(((2 * base.defense + 31) * level) / 100) + 5;
  const speed = Math.floor(((2 * base.speed + 31) * level) / 100) + 5;

  return { maxHp, attack, defense, speed };
}

// EXP needed to reach next level
export function getExpForLevel(level: number): number {
  // Medium-fast curve
  return Math.floor(4 * Math.pow(level, 3) / 5);
}

export function getExpBetweenLevels(level: number): number {
  return getExpForLevel(level + 1) - getExpForLevel(level);
}
