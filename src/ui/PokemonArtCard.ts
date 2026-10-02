import { getTypeInfo, getPokemonLore } from '../api/typeChart';
import { createIcon } from './icons';

export interface PokemonCardData {
  speciesId: number;
  name: string;
  displayName?: string;
  types: string[];
  level?: number;
  currentHp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  artwork?: string;
  spriteFront?: string;
  price?: number;
  seller_name?: string;
}

export interface CardOptions {
  mirrored?: boolean;
  actionText?: string;
  actionType?: 'primary' | 'market' | 'team';
  onAction?: () => void;
  showSearchPill?: boolean;
}

export function renderPokemonArtCardHtml(pokemon: PokemonCardData, options: CardOptions = {}): string {
  const primaryType = pokemon.types[0]?.toLowerCase() || 'normal';
  const typeInfo = getTypeInfo(primaryType);
  const displayName = pokemon.displayName || pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  const lore = getPokemonLore({ name: displayName, types: pokemon.types, speciesId: pokemon.speciesId });
  const artworkUrl = pokemon.artwork || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.speciesId}.png`;
  const isMirrored = !!options.mirrored;

  // Good against sprites
  const goodSpritesHtml = typeInfo.goodAgainstPokemon.map(p => `
    <div class="art-counter-item" title="Forte contra ${p.name}">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" alt="${p.name}" />
      <span>${p.name}</span>
    </div>
  `).join('');

  // Weak against sprites
  const weakSpritesHtml = typeInfo.weakAgainstPokemon.map(p => `
    <div class="art-counter-item" title="Fraco contra ${p.name}">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" alt="${p.name}" />
      <span>${p.name}</span>
    </div>
  `).join('');

  // Advantage type pills
  const advPillsHtml = typeInfo.advantages.length > 0
    ? typeInfo.advantages.map(t => {
        const tInf = getTypeInfo(t);
        return `<span class="art-type-pill" style="border-color: ${tInf.color}40; background: ${tInf.color}15; color: ${tInf.color};">${tInf.displayName.toUpperCase()}</span>`;
      }).join('')
    : `<span class="art-type-pill muted">NEUTRO</span>`;

  // Weakness type pills
  const weakPillsHtml = typeInfo.weaknesses.map(t => {
    const tInf = getTypeInfo(t);
    return `<span class="art-type-pill" style="border-color: ${tInf.color}40; background: ${tInf.color}15; color: ${tInf.color};">${tInf.displayName.toUpperCase()}</span>`;
  }).join('');

  return `
    <div class="art-model-card ${isMirrored ? 'mirrored' : ''}" style="--element-color: ${typeInfo.color}; --element-gradient: ${typeInfo.gradient};">
      <!-- Zone 1: Strategy & Lore Content -->
      <div class="art-card-info-zone">
        <!-- Top Search Pill & Chip Badges -->
        <div class="art-card-top-bar">
          <div class="art-search-pill">
            <span class="art-search-icon">${createIcon('search', '', 13)}</span>
            <input type="text" class="art-search-input" placeholder="Buscar Pokémon..." value="${displayName}" readonly />
          </div>
          <div class="art-chips-group">
            <button class="art-chip active" title="Tipo Principal">TY</button>
            <button class="art-chip" title="Movimentos">TM</button>
            <button class="art-chip" title="Habilidade">MV</button>
            <button class="art-chip" title="Evolução">EV</button>
          </div>
        </div>

        <!-- Name & ID Header -->
        <div class="art-title-row">
          <div class="art-name-group">
            <h2 class="art-pokemon-name">${displayName}</h2>
            <span class="art-type-dot" style="background: ${typeInfo.color}; box-shadow: 0 0 10px ${typeInfo.color};"></span>
          </div>
          <div class="art-pokedex-number">
            #${String(pokemon.speciesId).padStart(3, '0')}
            ${pokemon.level ? `<span class="art-level-tag">Lv. ${pokemon.level}</span>` : ''}
          </div>
        </div>

        <!-- Lore Description -->
        <div class="art-description-block">
          <span class="art-desc-label">Descrição:</span>
          <p class="art-desc-text">${lore}</p>
        </div>

        <!-- Combat Advantages & Counters -->
        <div class="art-matchup-section">
          <!-- Advantages -->
          <div class="art-matchup-col">
            <div class="art-matchup-header green">
              <span class="art-bullet" style="background: #22c55e;"></span>
              <span>VANTAGEM</span>
            </div>
            <div class="art-pills-row">
              ${advPillsHtml}
            </div>
            <div class="art-matchup-sub">● FORTE CONTRA</div>
            <div class="art-counters-row">
              ${goodSpritesHtml}
            </div>
          </div>

          <!-- Weaknesses -->
          <div class="art-matchup-col">
            <div class="art-matchup-header red">
              <span class="art-bullet" style="background: #ef4444;"></span>
              <span>FRAQUEZA</span>
            </div>
            <div class="art-pills-row">
              ${weakPillsHtml}
            </div>
            <div class="art-matchup-sub">● FRACO CONTRA</div>
            <div class="art-counters-row">
              ${weakSpritesHtml}
            </div>
          </div>
        </div>

        <!-- Optional Bottom Action Bar -->
        ${options.actionText ? `
          <div class="art-action-bar">
            <button class="art-primary-btn" id="btn-art-action">
              ${createIcon(options.actionType === 'market' ? 'market' : 'pokeball', '', 16)}
              <span>${options.actionText}</span>
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Zone 2: Elemental Showcase with Diagonal Cut & Concentric Pokeball Watermark -->
      <div class="art-card-showcase-zone">
        <!-- Concentric Pokéball Watermark Circles -->
        <div class="art-pokeball-watermark">
          <svg viewBox="0 0 300 300" class="art-watermark-svg">
            <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="20"/>
            <circle cx="150" cy="150" r="48" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="16"/>
            <circle cx="150" cy="150" r="22" fill="rgba(255,255,255,0.22)"/>
            <line x1="10" y1="150" x2="102" y2="150" stroke="rgba(255,255,255,0.18)" stroke-width="18"/>
            <line x1="198" y1="150" x2="290" y2="150" stroke="rgba(255,255,255,0.18)" stroke-width="18"/>
          </svg>
        </div>

        <!-- High Definition Pokémon Artwork -->
        <div class="art-artwork-wrapper">
          <div class="art-ground-shadow"></div>
          <img src="${artworkUrl}" alt="${displayName}" class="art-pokemon-img" loading="lazy" />
        </div>

        <!-- Floating Type Badge on Artwork -->
        <div class="art-floating-type-badge">
          <span>${typeInfo.displayName}</span>
        </div>
      </div>
    </div>
  `;
}
