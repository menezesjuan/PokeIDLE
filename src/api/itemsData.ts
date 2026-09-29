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
  // Pokébolas
  'poke-ball': {
    id: 'poke-ball',
    name: 'Poké Ball',
    category: 'ball',
    cost: 200,
    description: 'Dispositivo padrão para captura de Pokémon selvagens. Taxa de captura 1.0x.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    catchRate: 1.0,
  },
  'great-ball': {
    id: 'great-ball',
    name: 'Great Ball',
    category: 'ball',
    cost: 600,
    description: 'Pokébola de alto desempenho. Taxa de captura 1.5x.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
    catchRate: 1.5,
  },
  'ultra-ball': {
    id: 'ultra-ball',
    name: 'Ultra Ball',
    category: 'ball',
    cost: 1200,
    description: 'Pokébola ultra-eficiente para capturas difíceis. Taxa de captura 2.0x.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
    catchRate: 2.0,
  },
  'master-ball': {
    id: 'master-ball',
    name: 'Master Ball',
    category: 'ball',
    cost: 50000,
    description: 'A melhor bola com taxa de captura infalível (100%). Captura qualquer Pokémon!',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
    catchRate: 255.0,
  },

  // Poções / Cura
  'potion': {
    id: 'potion',
    name: 'Potion',
    category: 'healing',
    cost: 300,
    description: 'Restaura 20 pontos de vida (HP) do Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
    healAmount: 20,
    isPercent: false,
  },
  'super-potion': {
    id: 'super-potion',
    name: 'Super Potion',
    category: 'healing',
    cost: 700,
    description: 'Restaura 60 pontos de vida (HP) do Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',
    healAmount: 60,
    isPercent: false,
  },
  'hyper-potion': {
    id: 'hyper-potion',
    name: 'Hyper Potion',
    category: 'healing',
    cost: 1500,
    description: 'Restaura 150 pontos de vida (HP) do Pokémon.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hyper-potion.png',
    healAmount: 150,
    isPercent: false,
  },
  'max-potion': {
    id: 'max-potion',
    name: 'Max Potion',
    category: 'healing',
    cost: 2500,
    description: 'Restaura completamente (100%) o HP do Pokémon ativo.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-potion.png',
    healAmount: 100,
    isPercent: true,
  },
  'full-restore': {
    id: 'full-restore',
    name: 'Full Restore',
    category: 'healing',
    cost: 3200,
    description: 'Restaura todo o HP e cura todas as condições de status.',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/full-restore.png',
    healAmount: 100,
    isPercent: true,
  },

  // Pedras de Evolução
  'fire-stone': {
    id: 'fire-stone',
    name: 'Fire Stone',
    category: 'stone',
    cost: 5000,
    description: 'Pedra misteriosa que emana calor. Evolui Pokémons de fogo (Eevee, Vulpix, Growlithe).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png',
    targetPokemon: ['eevee', 'vulpix', 'growlithe', 'pansear'],
  },
  'water-stone': {
    id: 'water-stone',
    name: 'Water Stone',
    category: 'stone',
    cost: 5000,
    description: 'Pedra azul reluzente. Evolui certos Pokémons aquáticos (Eevee, Poliwhirl, Shellder, Staryu).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png',
    targetPokemon: ['eevee', 'poliwhirl', 'shellder', 'staryu', 'lombre', 'panpour'],
  },
  'thunder-stone': {
    id: 'thunder-stone',
    name: 'Thunder Stone',
    category: 'stone',
    cost: 5000,
    description: 'Pedra com desenho de raio que estala com eletricidade (Pikachu, Eevee, Magneton).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png',
    targetPokemon: ['pikachu', 'eevee', 'magneton', 'eelektrik'],
  },
  'leaf-stone': {
    id: 'leaf-stone',
    name: 'Leaf Stone',
    category: 'stone',
    cost: 5000,
    description: 'Pedra com marca de folha que ajuda certos Pokémons de planta a evoluir (Gloom, Weepinbell, Exeggcute).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png',
    targetPokemon: ['gloom', 'weepinbell', 'exeggcute', 'nuzleaf', 'pansage'],
  },
  'moon-stone': {
    id: 'moon-stone',
    name: 'Moon Stone',
    category: 'stone',
    cost: 6000,
    description: 'Pedra peculiar escura como a noite estrelada (Nidorina, Nidorino, Clefairy, Jigglypuff).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png',
    targetPokemon: ['nidorina', 'nidorino', 'clefairy', 'jigglypuff', 'skitty', 'munna'],
  },
  'sun-stone': {
    id: 'sun-stone',
    name: 'Sun Stone',
    category: 'stone',
    cost: 6000,
    description: 'Pedra brilhante e vermelha como o sol do meio-dia (Gloom, Sunkern, Cottonee, Petilil).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sun-stone.png',
    targetPokemon: ['gloom', 'sunkern', 'cottonee', 'petilil', 'helioptile'],
  },
  'ice-stone': {
    id: 'ice-stone',
    name: 'Ice Stone',
    category: 'stone',
    cost: 6000,
    description: 'Pedra gelada com um cristal de floco de neve no centro (Eevee -> Glaceon, Vulpix de Alola).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ice-stone.png',
    targetPokemon: ['eevee', 'vulpix-alola', 'sandshrew-alola'],
  },
  'dusk-stone': {
    id: 'dusk-stone',
    name: 'Dusk Stone',
    category: 'stone',
    cost: 7000,
    description: 'Pedra sombria que emana uma aura crepuscular (Murkrow, Misdreavus, Lampent, Doublade).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
    targetPokemon: ['murkrow', 'misdreavus', 'lampent', 'doublade'],
  },
  'shiny-stone': {
    id: 'shiny-stone',
    name: 'Shiny Stone',
    category: 'stone',
    cost: 7000,
    description: 'Pedra deslumbrante que brilha intensamente com pureza (Togetic, Roselia, Minccino, Floette).',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-stone.png',
    targetPokemon: ['togetic', 'roselia', 'minccino', 'floette'],
  },
};
