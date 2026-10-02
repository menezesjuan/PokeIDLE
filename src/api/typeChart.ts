export interface TypeInfo {
  name: string;
  displayName: string;
  color: string;
  gradient: string;
  advantages: string[]; // types it is super effective against
  weaknesses: string[]; // types it is vulnerable to
  goodAgainstPokemon: { name: string; id: number }[];
  weakAgainstPokemon: { name: string; id: number }[];
}

export const TYPE_CHART: Record<string, TypeInfo> = {
  fire: {
    name: 'fire',
    displayName: 'Fogo',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #b91c1c 100%)',
    advantages: ['grass', 'ice', 'bug', 'steel'],
    weaknesses: ['water', 'ground', 'rock'],
    goodAgainstPokemon: [
      { name: 'Venusaur', id: 3 },
      { name: 'Abomasnow', id: 460 },
      { name: 'Scizor', id: 212 },
    ],
    weakAgainstPokemon: [
      { name: 'Blastoise', id: 9 },
      { name: 'Swampert', id: 260 },
      { name: 'Tyranitar', id: 248 },
    ],
  },
  grass: {
    name: 'grass',
    displayName: 'Planta',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #15803d 100%)',
    advantages: ['water', 'ground', 'rock'],
    weaknesses: ['fire', 'ice', 'flying', 'bug', 'poison'],
    goodAgainstPokemon: [
      { name: 'Blastoise', id: 9 },
      { name: 'Golem', id: 76 },
      { name: 'Swampert', id: 260 },
    ],
    weakAgainstPokemon: [
      { name: 'Charizard', id: 6 },
      { name: 'Talonflame', id: 663 },
      { name: 'Gengar', id: 94 },
    ],
  },
  water: {
    name: 'water',
    displayName: 'Água',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0369a1 100%)',
    advantages: ['fire', 'ground', 'rock'],
    weaknesses: ['electric', 'grass'],
    goodAgainstPokemon: [
      { name: 'Charizard', id: 6 },
      { name: 'Rhydon', id: 112 },
      { name: 'Arcanine', id: 59 },
    ],
    weakAgainstPokemon: [
      { name: 'Pikachu', id: 25 },
      { name: 'Sceptile', id: 254 },
      { name: 'Zapdos', id: 145 },
    ],
  },
  electric: {
    name: 'electric',
    displayName: 'Elétrico',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #fde047 0%, #eab308 50%, #a16207 100%)',
    advantages: ['water', 'flying'],
    weaknesses: ['ground'],
    goodAgainstPokemon: [
      { name: 'Gyarados', id: 130 },
      { name: 'Pidgeot', id: 18 },
      { name: 'Lapras', id: 131 },
    ],
    weakAgainstPokemon: [
      { name: 'Dugtrio', id: 51 },
      { name: 'Garchomp', id: 445 },
      { name: 'Nidoking', id: 34 },
    ],
  },
  normal: {
    name: 'normal',
    displayName: 'Normal',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #475569 100%)',
    advantages: [],
    weaknesses: ['fighting'],
    goodAgainstPokemon: [
      { name: 'Rattata', id: 19 },
      { name: 'Meowth', id: 52 },
    ],
    weakAgainstPokemon: [
      { name: 'Machamp', id: 68 },
      { name: 'Lucario', id: 448 },
    ],
  },
  ice: {
    name: 'ice',
    displayName: 'Gelo',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%)',
    advantages: ['grass', 'ground', 'flying', 'dragon'],
    weaknesses: ['fire', 'fighting', 'rock', 'steel'],
    goodAgainstPokemon: [
      { name: 'Dragonite', id: 149 },
      { name: 'Garchomp', id: 445 },
      { name: 'Rayquaza', id: 384 },
    ],
    weakAgainstPokemon: [
      { name: 'Charizard', id: 6 },
      { name: 'Machamp', id: 68 },
    ],
  },
  fighting: {
    name: 'fighting',
    displayName: 'Lutador',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #c2410c 100%)',
    advantages: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weaknesses: ['flying', 'psychic', 'fairy'],
    goodAgainstPokemon: [
      { name: 'Snorlax', id: 143 },
      { name: 'Tyranitar', id: 248 },
      { name: 'Lapras', id: 131 },
    ],
    weakAgainstPokemon: [
      { name: 'Alakazam', id: 65 },
      { name: 'Pidgeot', id: 18 },
    ],
  },
  poison: {
    name: 'poison',
    displayName: 'Veneno',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7e22ce 100%)',
    advantages: ['grass', 'fairy'],
    weaknesses: ['ground', 'psychic'],
    goodAgainstPokemon: [
      { name: 'Venusaur', id: 3 },
      { name: 'Clefable', id: 36 },
    ],
    weakAgainstPokemon: [
      { name: 'Alakazam', id: 65 },
      { name: 'Dugtrio', id: 51 },
    ],
  },
  ground: {
    name: 'ground',
    displayName: 'Terrestre',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)',
    advantages: ['fire', 'electric', 'poison', 'rock', 'steel'],
    weaknesses: ['water', 'grass', 'ice'],
    goodAgainstPokemon: [
      { name: 'Pikachu', id: 25 },
      { name: 'Arcanine', id: 59 },
      { name: 'Gengar', id: 94 },
    ],
    weakAgainstPokemon: [
      { name: 'Blastoise', id: 9 },
      { name: 'Venusaur', id: 3 },
    ],
  },
  flying: {
    name: 'flying',
    displayName: 'Voador',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #4f46e5 100%)',
    advantages: ['grass', 'fighting', 'bug'],
    weaknesses: ['electric', 'ice', 'rock'],
    goodAgainstPokemon: [
      { name: 'Machamp', id: 68 },
      { name: 'Heracross', id: 214 },
    ],
    weakAgainstPokemon: [
      { name: 'Pikachu', id: 25 },
      { name: 'Articuno', id: 144 },
    ],
  },
  psychic: {
    name: 'psychic',
    displayName: 'Psíquico',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #be185d 100%)',
    advantages: ['fighting', 'poison'],
    weaknesses: ['bug', 'ghost', 'dark'],
    goodAgainstPokemon: [
      { name: 'Machamp', id: 68 },
      { name: 'Gengar', id: 94 },
    ],
    weakAgainstPokemon: [
      { name: 'Gengar', id: 94 },
      { name: 'Umbreon', id: 197 },
    ],
  },
  bug: {
    name: 'bug',
    displayName: 'Inseto',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #a3e635 0%, #84cc16 50%, #4d7c0f 100%)',
    advantages: ['grass', 'psychic', 'dark'],
    weaknesses: ['fire', 'flying', 'rock'],
    goodAgainstPokemon: [
      { name: 'Alakazam', id: 65 },
      { name: 'Exeggutor', id: 103 },
    ],
    weakAgainstPokemon: [
      { name: 'Charizard', id: 6 },
      { name: 'Pidgeot', id: 18 },
    ],
  },
  rock: {
    name: 'rock',
    displayName: 'Pedra',
    color: '#a8a29e',
    gradient: 'linear-gradient(135deg, #d6d3d1 0%, #a8a29e 50%, #57534e 100%)',
    advantages: ['fire', 'ice', 'flying', 'bug'],
    weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'],
    goodAgainstPokemon: [
      { name: 'Charizard', id: 6 },
      { name: 'Pidgeot', id: 18 },
    ],
    weakAgainstPokemon: [
      { name: 'Blastoise', id: 9 },
      { name: 'Machamp', id: 68 },
    ],
  },
  ghost: {
    name: 'ghost',
    displayName: 'Fantasma',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #4c1d95 100%)',
    advantages: ['psychic', 'ghost'],
    weaknesses: ['ghost', 'dark'],
    goodAgainstPokemon: [
      { name: 'Alakazam', id: 65 },
      { name: 'Mewtwo', id: 150 },
    ],
    weakAgainstPokemon: [
      { name: 'Gengar', id: 94 },
      { name: 'Umbreon', id: 197 },
    ],
  },
  dragon: {
    name: 'dragon',
    displayName: 'Dragão',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #3730a3 100%)',
    advantages: ['dragon'],
    weaknesses: ['ice', 'dragon', 'fairy'],
    goodAgainstPokemon: [
      { name: 'Dragonite', id: 149 },
      { name: 'Kingdra', id: 230 },
    ],
    weakAgainstPokemon: [
      { name: 'Articuno', id: 144 },
      { name: 'Lapras', id: 131 },
    ],
  },
  steel: {
    name: 'steel',
    displayName: 'Aço',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #334155 100%)',
    advantages: ['ice', 'rock', 'fairy'],
    weaknesses: ['fire', 'fighting', 'ground'],
    goodAgainstPokemon: [
      { name: 'Lapras', id: 131 },
      { name: 'Aerodactyl', id: 142 },
    ],
    weakAgainstPokemon: [
      { name: 'Charizard', id: 6 },
      { name: 'Machamp', id: 68 },
    ],
  },
  dark: {
    name: 'dark',
    displayName: 'Sombrio',
    color: '#475569',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #1e293b 100%)',
    advantages: ['psychic', 'ghost'],
    weaknesses: ['fighting', 'bug', 'fairy'],
    goodAgainstPokemon: [
      { name: 'Alakazam', id: 65 },
      { name: 'Gengar', id: 94 },
    ],
    weakAgainstPokemon: [
      { name: 'Machamp', id: 68 },
      { name: 'Heracross', id: 214 },
    ],
  },
  fairy: {
    name: 'fairy',
    displayName: 'Fada',
    color: '#f472b6',
    gradient: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 50%, #db2777 100%)',
    advantages: ['fighting', 'dragon', 'dark'],
    weaknesses: ['poison', 'steel'],
    goodAgainstPokemon: [
      { name: 'Dragonite', id: 149 },
      { name: 'Machamp', id: 68 },
    ],
    weakAgainstPokemon: [
      { name: 'Gengar', id: 94 },
      { name: 'Scizor', id: 212 },
    ],
  },
};

export function getTypeInfo(typeName: string): TypeInfo {
  return TYPE_CHART[typeName.toLowerCase()] || TYPE_CHART['normal'];
}

export function getPokemonLore(pokemon: { name: string; types: string[]; speciesId: number }): string {
  const t = pokemon.types[0]?.toLowerCase() || 'normal';
  const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

  const LORES: Record<number, string> = {
    6: 'Charizard, o Pokémon Dragão de Fogo, voa em busca de oponentes poderosos. Seu sopro incandescente atinge temperaturas capazes de derreter rochas.',
    254: 'Sceptile, o Pokémon Lâmina da Floresta, possui folhas afiadas como espadas em seus braços e move-se com agilidade sobre-humana entre as árvores.',
    25: 'Pikachu acumula eletricidade em suas bochechas vermelhas. Quando ameaçado ou empolgado, descarrega raios de alta voltagem contra os inimigos.',
    9: 'Blastoise possui canhões de água de alta pressão em sua carapaça, capazes de disparar jatos que perfuram placas maciças de aço.',
    3: 'Venusaur absorve a luz solar através da imensa flor em suas costas, convertendo energia pura em fragrâncias aromáticas e ataques devastadores.',
    94: 'Gengar esconde-se nas sombras da noite. Nas noites de lua cheia, diz-se que se a sua sombra se mexer sozinha, um Gengar está rindo de você.',
    131: 'Lapras é um Pokémon gentil de coração puro que desliza pelos mares. Compreende as emoções humanas e transporta viajantes em segurança.',
    143: 'Snorlax não fica satisfeito até ingerir centenas de quilos de comida por dia. Logo após comer, adormece em um sono profundo e inabalável.',
    149: 'Dragonite é um Pokémon marítimo lendário que viaja o globo em menos de dezesseis horas. Salva náufragos e embarcações perdidas em tempestades.',
    134: 'Vaporeon tem uma estrutura molecular muito semelhante à da água, permitindo que ele se dissolva na correnteza e se torne invisível.',
  };

  if (LORES[pokemon.speciesId]) {
    return LORES[pokemon.speciesId];
  }

  const typeDesc: Record<string, string> = {
    fire: `${name} é um formidável Pokémon do tipo Fogo, com grande poder ofensivo e chamas ardentes capazes de subjugar inimigos na arena.`,
    grass: `${name} é um ágil Pokémon do tipo Planta, com domínio sobre a energia natural e raízes curativas para sustentar batalhas prolongadas.`,
    water: `${name} é um versátil Pokémon do tipo Água, utilizando correntes rápidas e resistência líquida para controlar o ritmo do combate.`,
    electric: `${name} é um veloz Pokémon do tipo Elétrico, liberando descargas elétricas estonteantes que paralisam adversários com rapidez.`,
    ghost: `${name} é um misterioso Pokémon do tipo Fantasma, imune a golpes comuns e capaz de iludir oponentes com técnicas sobrenaturais.`,
    dragon: `${name} é um soberano Pokémon do tipo Dragão, ostentando atributos de combate elevados e resistência elemental de elite.`,
    psychic: `${name} é um brilhante Pokémon do tipo Psíquico, controlando ondas telecinéticas para subjugar qualquer ameaça.`,
  };

  return typeDesc[t] || `${name} é um valente Pokémon em constante evolução, treinando dia após dia nas rotas de Kanto para se tornar uma lenda.`;
}
