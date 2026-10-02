import { pokeApi, PokemonSpeciesInfo } from '../api/pokeApi';
import { createIcon } from './icons';
import { renderPokemonArtCardHtml, PokemonCardData } from './PokemonArtCard';
import { TYPE_CHART, getTypeInfo } from '../api/typeChart';
import { gameState } from '../state/gameState';

// Prominent Kanto & iconic showcase Pokémon IDs
const SHOWCASE_SPECIES_IDS = [
  6,   // Charizard
  254, // Sceptile
  25,  // Pikachu
  9,   // Blastoise
  3,   // Venusaur
  94,  // Gengar
  131, // Lapras
  143, // Snorlax
  149, // Dragonite
  134, // Vaporeon
  135, // Jolteon
  136, // Flareon
  150, // Mewtwo
  144, // Articuno
  145, // Zapdos
  146, // Moltres
  1,   // Bulbasaur
  4,   // Charmander
  7,   // Squirtle
  18,  // Pidgeot
  59,  // Arcanine
  65,  // Alakazam
  68,  // Machamp
  76,  // Golem
  130, // Gyarados
];

export class PokedexModal {
  private overlay: HTMLElement | null = null;
  private selectedPokemon: PokemonCardData | null = null;
  private searchQuery: string = '';
  private selectedType: string = 'all';
  private loadedList: PokemonSpeciesInfo[] = [];

  public open(targetSpeciesId?: number): void {
    this.createModal();
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.loadData(targetSpeciesId);
    }
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.selectedPokemon = null;
    }
  }

  private createModal(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay pokedex-modal-overlay';
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  private async loadData(targetSpeciesId?: number): Promise<void> {
    if (this.loadedList.length === 0) {
      // Load showcase species
      const promises = SHOWCASE_SPECIES_IDS.map(id => pokeApi.getPokemon(id));
      this.loadedList = await Promise.all(promises);
    }

    if (targetSpeciesId) {
      const found = this.loadedList.find(p => p.id === targetSpeciesId) || await pokeApi.getPokemon(targetSpeciesId);
      this.selectedPokemon = {
        speciesId: found.id,
        name: found.name,
        displayName: found.displayName,
        types: found.types,
        artwork: found.artwork,
        spriteFront: found.spriteFront,
      };
    } else if (!this.selectedPokemon && this.loadedList.length > 0) {
      // Default to Charizard (id 6) matching user's reference image!
      const initial = this.loadedList.find(p => p.id === 6) || this.loadedList[0];
      this.selectedPokemon = {
        speciesId: initial.id,
        name: initial.name,
        displayName: initial.displayName,
        types: initial.types,
        artwork: initial.artwork,
        spriteFront: initial.spriteFront,
      };
    }

    this.render();
  }

  private render(): void {
    if (!this.overlay) return;

    // Filter list
    const filtered = this.loadedList.filter(p => {
      const matchesSearch = !this.searchQuery || p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || p.displayName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesType = this.selectedType === 'all' || p.types.includes(this.selectedType);
      return matchesSearch && matchesType;
    });

    const artHtml = this.selectedPokemon ? renderPokemonArtCardHtml(this.selectedPokemon, {
      showSearchPill: true,
      actionText: gameState.party.some(p => p.speciesId === this.selectedPokemon?.speciesId)
        ? 'Presente na Equipe'
        : 'Ver no Mercado P2P',
      actionType: 'market',
    }) : '';

    this.overlay.innerHTML = `
      <div class="modal-content pokedex-modal-content">
        <!-- Modal Top Bar -->
        <div class="modal-header">
          <div class="modal-title">
            ${createIcon('pokedex', 'accent-blue-icon')}
            <span>Pokédex UI Art Model</span>
          </div>
          <button class="modal-close-btn" id="btn-close-pokedex">
            ${createIcon('close')}
          </button>
        </div>

        <div class="modal-body pokedex-modal-body">
          <!-- Main Art Model Card Viewport -->
          <div class="pokedex-art-stage">
            ${artHtml}
          </div>

          <!-- Bottom Pokémon Selector Carousel & Filters -->
          <div class="pokedex-selector-drawer">
            <div class="pokedex-drawer-header">
              <div class="pokedex-search-bar">
                ${createIcon('search', '', 14)}
                <input type="text" id="pokedex-search-input" placeholder="Filtrar por nome..." value="${this.searchQuery}" />
              </div>

              <div class="pokedex-type-filters">
                <button class="pokedex-filter-pill ${this.selectedType === 'all' ? 'active' : ''}" data-type="all">Todos</button>
                <button class="pokedex-filter-pill ${this.selectedType === 'fire' ? 'active' : ''}" data-type="fire">Fogo</button>
                <button class="pokedex-filter-pill ${this.selectedType === 'grass' ? 'active' : ''}" data-type="grass">Planta</button>
                <button class="pokedex-filter-pill ${this.selectedType === 'water' ? 'active' : ''}" data-type="water">Água</button>
                <button class="pokedex-filter-pill ${this.selectedType === 'electric' ? 'active' : ''}" data-type="electric">Elétrico</button>
              </div>
            </div>

            <!-- Horizontal Carousel of Pokemon -->
            <div class="pokedex-cards-carousel">
              ${filtered.map(p => {
                const isSelected = this.selectedPokemon?.speciesId === p.id;
                const typeInfo = getTypeInfo(p.types[0]);
                return `
                  <div class="pokedex-mini-card ${isSelected ? 'active' : ''}" data-species-id="${p.id}" style="--mini-color: ${typeInfo.color};">
                    <img src="${p.spriteFront}" alt="${p.displayName}" class="mini-sprite" />
                    <span class="mini-name">${p.displayName}</span>
                    <span class="mini-id">#${String(p.id).padStart(3, '0')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.overlay) return;

    this.overlay.querySelector('#btn-close-pokedex')?.addEventListener('click', () => this.close());

    // Search
    const searchInput = this.overlay.querySelector('#pokedex-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
      this.searchQuery = searchInput.value.trim();
      this.render();
    });

    // Type filters
    this.overlay.querySelectorAll('.pokedex-filter-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-type') || 'all';
        this.selectedType = type;
        this.render();
      });
    });

    // Selecting a mini card in the carousel
    this.overlay.querySelectorAll('.pokedex-mini-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const speciesId = Number((e.currentTarget as HTMLElement).getAttribute('data-species-id'));
        const found = this.loadedList.find(p => p.id === speciesId);
        if (found) {
          this.selectedPokemon = {
            speciesId: found.id,
            name: found.name,
            displayName: found.displayName,
            types: found.types,
            artwork: found.artwork,
            spriteFront: found.spriteFront,
          };
          this.render();
        }
      });
    });

    // Market button click from Art card
    this.overlay.querySelector('#btn-art-action')?.addEventListener('click', () => {
      this.close();
      const marketEvent = new CustomEvent('open-market-search', { detail: { query: this.selectedPokemon?.displayName || '' } });
      window.dispatchEvent(marketEvent);
    });
  }
}

export const pokedexModal = new PokedexModal();
