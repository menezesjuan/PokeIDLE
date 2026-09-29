import { GameRoute } from './routesData';
import { WildPokemon } from './pokeApi';
import { GAME_ITEMS } from './itemsData';

export interface ItemDrop {
  itemId: string;
  name: string;
  count: number;
  category: 'ball' | 'healing';
  tier: number;
  spriteUrl: string;
}

/**
 * Determines difficulty tier (1: Novice, 2: Intermediate, 3: Advanced, 4: Master)
 * based on hunt route levels and wild Pokemon level.
 */
export function getHuntTier(route: GameRoute, wildLevel?: number): number {
  const avgLevel = (route.minLevel + route.maxLevel) / 2;
  const effectiveLevel = Math.max(avgLevel, wildLevel || route.minLevel);
  if (effectiveLevel < 11) return 1;  // Tier 1: Novice (Route 1, Route 2, Viridian Forest, Route 3)
  if (effectiveLevel < 23) return 2;  // Tier 2: Intermediate (Mt. Moon, Route 4, Route 11)
  if (effectiveLevel < 35) return 3;  // Tier 3: Advanced (Rock Tunnel, Pokemon Tower, Safari Zone)
  return 4;                           // Tier 4: Master (Seafoam Islands, Cinnabar Volcano)
}

/**
 * Returns human-readable drop descriptions for UI preview in Routes modal.
 */
export function getRouteDropsPreview(route: GameRoute): { balls: string; potions: string; tierName: string } {
  const tier = getHuntTier(route);
  switch (tier) {
    case 1:
      return {
        tierName: 'Iniciante (Tier 1)',
        balls: 'Poké Ball (1-2x), Great Ball rara',
        potions: 'Potion (1-2x), Super Potion rara',
      };
    case 2:
      return {
        tierName: 'Intermediário (Tier 2)',
        balls: 'Poké Ball (2-3x), Great Ball (1-2x), Ultra Ball rara',
        potions: 'Potion (2-3x), Super Potion (1-2x), Hyper Potion rara',
      };
    case 3:
      return {
        tierName: 'Avançado (Tier 3)',
        balls: 'Great Ball (2-3x), Ultra Ball (1-2x), Poké Ball (3-4x)',
        potions: 'Super Potion (2-3x), Hyper Potion (1-2x), Potion (3-4x)',
      };
    case 4:
    default:
      return {
        tierName: 'Mestre (Tier 4)',
        balls: 'Ultra Ball (2-4x), Great Ball (3-5x), Master Ball rara (5%)',
        potions: 'Hyper Potion (2-4x), Super Potion (3-5x), Max Potion / Full Restore',
      };
  }
}

/**
 * Generates Poke Ball and Potion drops at the end of each hunt/battle encounter.
 * Quality and quantity scale according to the hunt difficulty.
 */
export function generateHuntDrops(route: GameRoute, wild: WildPokemon): ItemDrop[] {
  const tier = getHuntTier(route, wild.level);
  const drops: ItemDrop[] = [];

  // --- 1. Poké Balls Drop ---
  let ballId = 'poke-ball';
  let ballCount = 1;
  const ballRoll = Math.random();

  if (tier === 1) {
    if (ballRoll < 0.85) {
      ballId = 'poke-ball';
      ballCount = Math.floor(Math.random() * 2) + 1; // 1-2
    } else {
      ballId = 'great-ball';
      ballCount = 1;
    }
  } else if (tier === 2) {
    if (ballRoll < 0.40) {
      ballId = 'poke-ball';
      ballCount = Math.floor(Math.random() * 2) + 2; // 2-3
    } else if (ballRoll < 0.88) {
      ballId = 'great-ball';
      ballCount = Math.floor(Math.random() * 2) + 1; // 1-2
    } else {
      ballId = 'ultra-ball';
      ballCount = 1;
    }
  } else if (tier === 3) {
    if (ballRoll < 0.20) {
      ballId = 'poke-ball';
      ballCount = Math.floor(Math.random() * 2) + 3; // 3-4
    } else if (ballRoll < 0.70) {
      ballId = 'great-ball';
      ballCount = Math.floor(Math.random() * 2) + 2; // 2-3
    } else {
      ballId = 'ultra-ball';
      ballCount = Math.floor(Math.random() * 2) + 1; // 1-2
    }
  } else {
    // Tier 4
    if (ballRoll < 0.35) {
      ballId = 'great-ball';
      ballCount = Math.floor(Math.random() * 3) + 3; // 3-5
    } else if (ballRoll < 0.95) {
      ballId = 'ultra-ball';
      ballCount = Math.floor(Math.random() * 3) + 2; // 2-4
    } else {
      // 5% Jackpot Master Ball
      ballId = 'master-ball';
      ballCount = 1;
    }
  }

  const ballItem = GAME_ITEMS[ballId];
  if (ballItem) {
    drops.push({
      itemId: ballId,
      name: ballItem.name,
      count: ballCount,
      category: 'ball',
      tier,
      spriteUrl: ballItem.spriteUrl,
    });
  }

  // --- 2. Potions / Healing Drop ---
  let potionId = 'potion';
  let potionCount = 1;
  const potionRoll = Math.random();

  if (tier === 1) {
    if (potionRoll < 0.85) {
      potionId = 'potion';
      potionCount = Math.floor(Math.random() * 2) + 1; // 1-2
    } else {
      potionId = 'super-potion';
      potionCount = 1;
    }
  } else if (tier === 2) {
    if (potionRoll < 0.40) {
      potionId = 'potion';
      potionCount = Math.floor(Math.random() * 2) + 2; // 2-3
    } else if (potionRoll < 0.88) {
      potionId = 'super-potion';
      potionCount = Math.floor(Math.random() * 2) + 1; // 1-2
    } else {
      potionId = 'hyper-potion';
      potionCount = 1;
    }
  } else if (tier === 3) {
    if (potionRoll < 0.20) {
      potionId = 'potion';
      potionCount = Math.floor(Math.random() * 2) + 3; // 3-4
    } else if (potionRoll < 0.70) {
      potionId = 'super-potion';
      potionCount = Math.floor(Math.random() * 2) + 2; // 2-3
    } else {
      potionId = 'hyper-potion';
      potionCount = Math.floor(Math.random() * 2) + 1; // 1-2
    }
  } else {
    // Tier 4
    if (potionRoll < 0.30) {
      potionId = 'super-potion';
      potionCount = Math.floor(Math.random() * 3) + 3; // 3-5
    } else if (potionRoll < 0.75) {
      potionId = 'hyper-potion';
      potionCount = Math.floor(Math.random() * 3) + 2; // 2-4
    } else if (potionRoll < 0.95) {
      potionId = 'max-potion';
      potionCount = Math.floor(Math.random() * 2) + 1; // 1-2
    } else {
      potionId = 'full-restore';
      potionCount = 1;
    }
  }

  const potionItem = GAME_ITEMS[potionId];
  if (potionItem) {
    drops.push({
      itemId: potionId,
      name: potionItem.name,
      count: potionCount,
      category: 'healing',
      tier,
      spriteUrl: potionItem.spriteUrl,
    });
  }

  return drops;
}
