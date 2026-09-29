export type ItemCategory = 'ball' | 'healing' | 'stone';

export interface GameItem {
  id: string; // PokeAPI name (e.g., 'poke-ball', 'potion', 'fire-stone')
  name: string;
  category: ItemCategory;
  cost: number;
  description: string;
  spriteUrl: string;
  catchRate?: number;
  healAmount?: number;
  isPercent?: boolean;
  targetPokemon?: string[]; // Pokemon names this stone can evolve
}

export const GAME_ITEMS: Record<string, GameItem> = {
  // Poké Balls
  'poke-ball': {
    id: 'poke-ball',
    name: 'Poké Ball',
    category: 'ball',
    cost: 200,
    description: 'A device for catching wild Pokémon. 1.0x catch rate.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    catchRate: 1.0,
  },
  'great-ball': {
    id: 'great-ball',
    name: 'Great Ball',
    category: 'ball',
    cost: 600,
    description: 'A good, high-performance Ball. 1.5x catch rate.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
    catchRate: 1.5,
  },
  'ultra-ball': {
    id: 'ultra-ball',
    name: 'Ultra Ball',
    category: 'ball',
    cost: 1200,
    description: 'An ultra-high-performance Ball. 2.0x catch rate.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
    catchRate: 2.0,
  },
  'master-ball': {
    id: 'master-ball',
    name: 'Master Ball',
    category: 'ball',
    cost: 50000,
    description: 'The best Ball with the ultimate level of performance. 100% catch rate.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
    catchRate: 255.0,
  },

  // Potions / Healing
  'potion': {
    id: 'potion',
    name: 'Potion',
    category: 'healing',
    cost: 300,
    description: 'Restores 20 HP of active Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
    healAmount: 20,
    isPercent: false,
  },
  'super-potion': {
    id: 'super-potion',
    name: 'Super Potion',
    category: 'healing',
    cost: 700,
    description: 'Restores 60 HP of active Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',
    healAmount: 60,
    isPercent: false,
  },
  'hyper-potion': {
    id: 'hyper-potion',
    name: 'Hyper Potion',
    category: 'healing',
    cost: 1500,
    description: 'Restores 150 HP of active Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hyper-potion.png',
    healAmount: 150,
    isPercent: false,
  },
  'max-potion': {
    id: 'max-potion',
    name: 'Max Potion',
    category: 'healing',
    cost: 2500,
    description: 'Fully restores the HP of active Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-potion.png',
    healAmount: 100,
    isPercent: true,
  },
  'full-restore': {
    id: 'full-restore',
    name: 'Full Restore',
    category: 'healing',
    cost: 3200,
    description: 'Fully restores the HP and cures all status.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/full-restore.png',
    healAmount: 100,
    isPercent: true,
  },

  // Evolution Stones
  'fire-stone': {
    id: 'fire-stone',
    name: 'Fire Stone',
    category: 'stone',
    cost: 5000,
    description: 'A peculiar stone that can evolve certain fire-attuned Pokémon (Eevee, Vulpix, Growlithe).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png',
    targetPokemon: ['eevee', 'vulpix', 'growlithe', 'pansear'],
  },
  'water-stone': {
    id: 'water-stone',
    name: 'Water Stone',
    category: 'stone',
    cost: 5000,
    description: 'A peculiar stone that can evolve certain water-attuned Pokémon (Eevee, Poliwhirl, Shellder, Staryu).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png',
    targetPokemon: ['eevee', 'poliwhirl', 'shellder', 'staryu', 'lombre', 'panpour'],
  },
  'thunder-stone': {
    id: 'thunder-stone',
    name: 'Thunder Stone',
    category: 'stone',
    cost: 5000,
    description: 'A peculiar stone that can evolve certain electric-attuned Pokémon (Pikachu, Eevee, Magneton, Eelektrik).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
    targetPokemon: ['pikachu', 'eevee', 'magneton', 'eelektrik'],
  },
  'leaf-stone': {
    id: 'leaf-stone',
    name: 'Leaf Stone',
    category: 'stone',
    cost: 5000,
    description: 'A peculiar stone that can evolve certain grass-attuned Pokémon (Gloom, Weepinbell, Exeggcute).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png',
    targetPokemon: ['gloom', 'weepinbell', 'exeggcute', 'nuzleaf', 'pansage'],
  },
  'moon-stone': {
    id: 'moon-stone',
    name: 'Moon Stone',
    category: 'stone',
    cost: 6000,
    description: 'A peculiar stone that can evolve Pokémon like Nidorina, Nidorino, Clefairy, Jigglypuff.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png',
    targetPokemon: ['nidorina', 'nidorino', 'clefairy', 'jigglypuff', 'skitty', 'munna'],
  },
  'sun-stone': {
    id: 'sun-stone',
    name: 'Sun Stone',
    category: 'stone',
    cost: 6000,
    description: 'A peculiar stone as red as the sun (Gloom, Sunkern, Cottonee, Petilil, Helioptile).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sun-stone.png',
    targetPokemon: ['gloom', 'sunkern', 'cottonee', 'petilil', 'helioptile'],
  },
  'ice-stone': {
    id: 'ice-stone',
    name: 'Ice Stone',
    category: 'stone',
    cost: 6000,
    description: 'A peculiar stone as cold as ice (Eevee -> Glaceon, Alolan Vulpix, Sandshrew).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-stone.png',
    targetPokemon: ['eevee', 'vulpix-alola', 'sandshrew-alola'],
  },
  'dusk-stone': {
    id: 'dusk-stone',
    name: 'Dusk Stone',
    category: 'stone',
    cost: 7000,
    description: 'A peculiar dark stone (Murkrow, Misdreavus, Lampent, Doublade).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
    targetPokemon: ['murkrow', 'misdreavus', 'lampent', 'doublade'],
  },
  'shiny-stone': {
    id: 'shiny-stone',
    name: 'Shiny Stone',
    category: 'stone',
    cost: 7000,
    description: 'A peculiar stone that shines with a dazzling light (Togetic, Roselia, Minccino, Floette).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-stone.png',
    targetPokemon: ['togetic', 'roselia', 'minccino', 'floette'],
  },
};
