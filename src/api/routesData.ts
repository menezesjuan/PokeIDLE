export interface GameRoute {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  unlockedByDefault?: boolean;
  requiredKillsToUnlockNext?: number;
  encounterPool: {
    speciesIdOrName: string | number;
    weight: number; // probability weight
  }[];
  backgroundTheme: 'grass' | 'forest' | 'cave' | 'water' | 'volcano' | 'electric';
}

export const GAME_ROUTES: GameRoute[] = [
  {
    id: 'route-1',
    name: 'Route 1 (Pallet Town outskirts)',
    minLevel: 2,
    maxLevel: 5,
    unlockedByDefault: true,
    requiredKillsToUnlockNext: 10,
    backgroundTheme: 'grass',
    encounterPool: [
      { speciesIdOrName: 'pidgey', weight: 40 },
      { speciesIdOrName: 'rattata', weight: 40 },
      { speciesIdOrName: 'caterpie', weight: 10 },
      { speciesIdOrName: 'weedle', weight: 10 },
    ],
  },
  {
    id: 'route-2',
    name: 'Route 2 & Viridian City',
    minLevel: 5,
    maxLevel: 8,
    requiredKillsToUnlockNext: 15,
    backgroundTheme: 'grass',
    encounterPool: [
      { speciesIdOrName: 'pidgey', weight: 30 },
      { speciesIdOrName: 'rattata', weight: 25 },
      { speciesIdOrName: 'nidoran-f', weight: 20 },
      { speciesIdOrName: 'nidoran-m', weight: 20 },
      { speciesIdOrName: 'pikachu', weight: 5 },
    ],
  },
  {
    id: 'viridian-forest',
    name: 'Viridian Forest',
    minLevel: 6,
    maxLevel: 10,
    requiredKillsToUnlockNext: 20,
    backgroundTheme: 'forest',
    encounterPool: [
      { speciesIdOrName: 'caterpie', weight: 25 },
      { speciesIdOrName: 'metapod', weight: 20 },
      { speciesIdOrName: 'weedle', weight: 25 },
      { speciesIdOrName: 'kakuna', weight: 20 },
      { speciesIdOrName: 'pikachu', weight: 10 },
    ],
  },
  {
    id: 'route-3',
    name: 'Route 3 & Pewter Path',
    minLevel: 9,
    maxLevel: 13,
    requiredKillsToUnlockNext: 20,
    backgroundTheme: 'grass',
    encounterPool: [
      { speciesIdOrName: 'spearow', weight: 35 },
      { speciesIdOrName: 'jigglypuff', weight: 20 },
      { speciesIdOrName: 'mankey', weight: 25 },
      { speciesIdOrName: 'sandshrew', weight: 20 },
    ],
  },
  {
    id: 'mt-moon',
    name: 'Mt. Moon',
    minLevel: 11,
    maxLevel: 16,
    requiredKillsToUnlockNext: 25,
    backgroundTheme: 'cave',
    encounterPool: [
      { speciesIdOrName: 'zubat', weight: 50 },
      { speciesIdOrName: 'geodude', weight: 30 },
      { speciesIdOrName: 'paras', weight: 15 },
      { speciesIdOrName: 'clefairy', weight: 5 },
    ],
  },
  {
    id: 'route-4',
    name: 'Route 4 & Cerulean Outskirts',
    minLevel: 14,
    maxLevel: 20,
    requiredKillsToUnlockNext: 25,
    backgroundTheme: 'water',
    encounterPool: [
      { speciesIdOrName: 'ekans', weight: 25 },
      { speciesIdOrName: 'oddish', weight: 25 },
      { speciesIdOrName: 'bellsprout', weight: 25 },
      { speciesIdOrName: 'poliwag', weight: 15 },
      { speciesIdOrName: 'psyduck', weight: 10 },
    ],
  },
  {
    id: 'vermilion-route',
    name: 'Route 11 (Vermilion Seaside)',
    minLevel: 18,
    maxLevel: 24,
    requiredKillsToUnlockNext: 30,
    backgroundTheme: 'grass',
    encounterPool: [
      { speciesIdOrName: 'drowzee', weight: 30 },
      { speciesIdOrName: 'meowth', weight: 30 },
      { speciesIdOrName: 'magnemite', weight: 20 },
      { speciesIdOrName: 'diglett', weight: 20 },
    ],
  },
  {
    id: 'rock-tunnel',
    name: 'Rock Tunnel',
    minLevel: 22,
    maxLevel: 28,
    requiredKillsToUnlockNext: 35,
    backgroundTheme: 'cave',
    encounterPool: [
      { speciesIdOrName: 'machop', weight: 30 },
      { speciesIdOrName: 'geodude', weight: 30 },
      { speciesIdOrName: 'onix', weight: 20 },
      { speciesIdOrName: 'graveler', weight: 20 },
    ],
  },
  {
    id: 'pokemon-tower',
    name: 'Pokémon Tower (Lavender Town)',
    minLevel: 25,
    maxLevel: 32,
    requiredKillsToUnlockNext: 40,
    backgroundTheme: 'cave',
    encounterPool: [
      { speciesIdOrName: 'gastly', weight: 50 },
      { speciesIdOrName: 'haunter', weight: 20 },
      { speciesIdOrName: 'cubone', weight: 25 },
      { speciesIdOrName: 'marowak', weight: 5 },
    ],
  },
  {
    id: 'safari-zone',
    name: 'Safari Zone',
    minLevel: 30,
    maxLevel: 38,
    requiredKillsToUnlockNext: 45,
    backgroundTheme: 'forest',
    encounterPool: [
      { speciesIdOrName: 'scyther', weight: 15 },
      { speciesIdOrName: 'pinsir', weight: 15 },
      { speciesIdOrName: 'tauros', weight: 20 },
      { speciesIdOrName: 'kangaskhan', weight: 15 },
      { speciesIdOrName: 'chansey', weight: 15 },
      { speciesIdOrName: 'dratini', weight: 20 },
    ],
  },
  {
    id: 'seafoam-islands',
    name: 'Seafoam Islands',
    minLevel: 35,
    maxLevel: 44,
    requiredKillsToUnlockNext: 50,
    backgroundTheme: 'water',
    encounterPool: [
      { speciesIdOrName: 'seel', weight: 30 },
      { speciesIdOrName: 'dewgong', weight: 15 },
      { speciesIdOrName: 'shellder', weight: 25 },
      { speciesIdOrName: 'slowpoke', weight: 20 },
      { speciesIdOrName: 'staryu', weight: 10 },
    ],
  },
  {
    id: 'cinnabar-volcano',
    name: 'Cinnabar Volcano',
    minLevel: 40,
    maxLevel: 50,
    requiredKillsToUnlockNext: 55,
    backgroundTheme: 'volcano',
    encounterPool: [
      { speciesIdOrName: 'ponyta', weight: 30 },
      { speciesIdOrName: 'growlithe', weight: 25 },
      { speciesIdOrName: 'magmar', weight: 20 },
      { speciesIdOrName: 'koffing', weight: 15 },
      { speciesIdOrName: 'weezing', weight: 10 },
    ],
  },
];
