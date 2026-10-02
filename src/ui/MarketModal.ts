import { backendClient, MarketListing, TradeHistoryItem } from '../api/authApi';
import { gameState } from '../state/gameState';
import { createIcon } from './icons';
import { authModal } from './AuthModal';
import { renderPokemonArtCardHtml, PokemonCardData } from './PokemonArtCard';
import { getTypeInfo } from '../api/typeChart';
import { GAME_ITEMS } from '../api/itemsData';

export class MarketModal {
  private overlay: HTMLElement | null = null;
  private activeTab: 'browse' | 'my-listings' | 'history' = 'browse';
  private filterType: 'all' | 'pokemon' | 'item' = 'all';
  private searchQuery: string = '';
  private sortBy: 'recent' | 'price_asc' | 'price_desc' | 'level_desc' = 'recent';
  private inspectListing: MarketListing | null = null;
  private showCreateListingModal: boolean = false;

  public open(): void {
    this.createModal();
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.loadAndRender();
    }
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.inspectListing = null;
      this.showCreateListingModal = false;
    }
  }

  private createModal(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay market-modal-overlay';
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  private async loadAndRender(): Promise<void> {
    if (!this.overlay) return;

    if (this.inspectListing) {
      this.renderInspectView(this.inspectListing);
      return;
    }

    if (this.showCreateListingModal) {
      this.renderCreateListingView();
      return;
    }

    const user = backendClient.user;
    let listings: MarketListing[] = [];
    let myListings: MarketListing[] = [];
    let history: TradeHistoryItem[] = [];

    if (this.activeTab === 'browse') {
      listings = await backendClient.getMarketListings({
        type: this.filterType === 'all' ? undefined : this.filterType,
        query: this.searchQuery,
        sortBy: this.sortBy,
      });
    } else if (this.activeTab === 'my-listings' && user) {
      myListings = await backendClient.getMyListings(user.id);
    } else if (this.activeTab === 'history') {
      history = await backendClient.getTradeHistory();
    }

    this.overlay.innerHTML = `
      <div class="modal-content market-modal-content">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title">
            ${createIcon('market', 'accent-blue-icon')}
            <span>Mercado de Treinadores (P2P)</span>
          </div>
          <div class="market-header-stats">
            <span class="user-coins-pill">
              ${createIcon('coin', 'gold-icon', 14)}
              <span>₽ ${gameState.money.toLocaleString()}</span>
            </span>
            <button class="modal-close-btn" id="btn-close-market">
              ${createIcon('close')}
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="market-nav-tabs">
          <button class="market-tab-btn ${this.activeTab === 'browse' ? 'active' : ''}" data-tab="browse">
            ${createIcon('search', '', 14)}
            <span>Explorar Ofertas</span>
          </button>
          <button class="market-tab-btn ${this.activeTab === 'my-listings' ? 'active' : ''}" data-tab="my-listings">
            ${createIcon('tag', '', 14)}
            <span>Meus Anúncios</span>
          </button>
          <button class="market-tab-btn ${this.activeTab === 'history' ? 'active' : ''}" data-tab="history">
            ${createIcon('scroll', '', 14)}
            <span>Histórico de Trocas</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="modal-body market-modal-body">
          ${this.activeTab === 'browse' ? this.renderBrowseTab(listings) : ''}
          ${this.activeTab === 'my-listings' ? this.renderMyListingsTab(myListings) : ''}
          ${this.activeTab === 'history' ? this.renderHistoryTab(history) : ''}
        </div>
      </div>
    `;

    this.attachMainEvents();
  }

  private renderBrowseTab(listings: MarketListing[]): string {
    return `
      <!-- Search & Filters Toolbar -->
      <div class="market-toolbar">
        <div class="market-search-box">
          ${createIcon('search', 'search-icon', 14)}
          <input type="text" id="market-search-input" placeholder="Buscar por Pokémon ou Vendedor..." value="${this.searchQuery}" />
          ${this.searchQuery ? `<button id="btn-clear-search" class="clear-btn">${createIcon('close', '', 12)}</button>` : ''}
        </div>

        <div class="market-filters-row">
          <div class="filter-chips-group">
            <button class="filter-chip ${this.filterType === 'all' ? 'active' : ''}" data-filter="all">Todos</button>
            <button class="filter-chip ${this.filterType === 'pokemon' ? 'active' : ''}" data-filter="pokemon">Pokémon</button>
            <button class="filter-chip ${this.filterType === 'item' ? 'active' : ''}" data-filter="item">Itens</button>
          </div>

          <div class="market-sort-select">
            <select id="market-sort-select">
              <option value="recent" ${this.sortBy === 'recent' ? 'selected' : ''}>Mais Recentes</option>
              <option value="price_asc" ${this.sortBy === 'price_asc' ? 'selected' : ''}>Menor Preço</option>
              <option value="price_desc" ${this.sortBy === 'price_desc' ? 'selected' : ''}>Maior Preço</option>
              <option value="level_desc" ${this.sortBy === 'level_desc' ? 'selected' : ''}>Maior Nível</option>
            </select>
          </div>

          <button class="art-primary-btn compact" id="btn-open-create-listing">
            ${createIcon('plus', '', 14)}
            <span>Anunciar</span>
          </button>
        </div>
      </div>

      <!-- Listings Grid -->
      <div class="market-cards-grid">
        ${listings.length === 0 ? `
          <div class="market-empty-state">
            ${createIcon('search', 'empty-icon', 36)}
            <p>Nenhuma oferta encontrada no mercado com esses filtros.</p>
          </div>
        ` : listings.map(l => this.renderListingCard(l)).join('')}
      </div>
    `;
  }

  private renderListingCard(listing: MarketListing): string {
    const isPokemon = listing.item_type === 'pokemon';
    const pokeData = listing.item_data;
    const primaryType = pokeData?.types?.[0]?.toLowerCase() || 'normal';
    const typeInfo = getTypeInfo(primaryType);

    const artworkUrl = pokeData?.artwork || (isPokemon
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${listing.item_id}.png`
      : (GAME_ITEMS[listing.item_id]?.spriteUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'));

    return `
      <div class="market-card ${isPokemon ? 'pokemon-card' : 'item-card'}" data-listing-id="${listing.id}" style="--item-color: ${isPokemon ? typeInfo.color : '#38bdf8'};">
        <!-- Visual Showcase Zone -->
        <div class="market-card-visual" style="background: ${isPokemon ? typeInfo.gradient : 'linear-gradient(135deg, #1e293b, #0f172a)'};">
          <!-- Pokeball Watermark -->
          <div class="market-card-watermark">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="8"/>
              <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>
              <line x1="5" y1="50" x2="34" y2="50" stroke="rgba(255,255,255,0.18)" stroke-width="8"/>
              <line x1="66" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.18)" stroke-width="8"/>
            </svg>
          </div>
          <img src="${artworkUrl}" alt="${listing.item_name}" class="market-card-img" loading="lazy" />
          ${isPokemon ? `
            <span class="market-level-badge">Lv. ${listing.level}</span>
          ` : `
            <span class="market-qty-badge">x${listing.quantity}</span>
          `}
        </div>

        <!-- Info Details -->
        <div class="market-card-details">
          <div class="market-card-title-row">
            <h4 class="market-card-title">${listing.item_name}</h4>
            ${isPokemon ? `<span class="market-type-tag" style="background: ${typeInfo.color}20; color: ${typeInfo.color};">${typeInfo.displayName}</span>` : ''}
          </div>

          <div class="market-seller-row">
            ${createIcon('trainer', 'seller-icon', 12)}
            <span>Vendedor: <strong>${listing.seller_name}</strong></span>
          </div>

          <div class="market-card-footer">
            <div class="market-price-tag">
              ${createIcon('coin', 'gold-icon', 14)}
              <span>₽ ${listing.price.toLocaleString()}</span>
            </div>
            <button class="art-primary-btn compact btn-buy-listing" data-id="${listing.id}">
              <span>Comprar</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderMyListingsTab(listings: MarketListing[]): string {
    const user = backendClient.user;
    if (!user) {
      return `
        <div class="market-auth-prompt">
          ${createIcon('trainer', 'auth-icon', 40)}
          <h3>Entre com sua Conta de Treinador</h3>
          <p>Faça login para ver e gerenciar os seus anúncios ativos no Mercado de Treinadores.</p>
          <button class="art-primary-btn" id="btn-login-from-market">
            ${createIcon('user', '', 16)}
            <span>Fazer Login / Cadastrar</span>
          </button>
        </div>
      `;
    }

    if (listings.length === 0) {
      return `
        <div class="market-empty-state">
          ${createIcon('tag', 'empty-icon', 36)}
          <p>Você ainda não possui nenhum anúncio publicado no mercado.</p>
          <button class="art-primary-btn compact" id="btn-open-create-listing" style="margin-top: 14px;">
            ${createIcon('plus', '', 14)}
            <span>Criar Meu Primeiro Anúncio</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="my-listings-list">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-weight: 700; color: #94a3b8;">Total de anúncios: ${listings.length}</span>
          <button class="art-primary-btn compact" id="btn-open-create-listing">
            ${createIcon('plus', '', 14)}
            <span>Novo Anúncio</span>
          </button>
        </div>

        ${listings.map(l => `
          <div class="my-listing-row ${l.status}">
            <div class="my-listing-info">
              <span class="my-listing-name">${l.item_name} ${l.item_type === 'pokemon' ? `(Lv. ${l.level})` : `(x${l.quantity})`}</span>
              <span class="my-listing-status ${l.status}">${l.status === 'active' ? '🟢 Ativo' : (l.status === 'sold' ? `🎉 Vendido para ${l.buyer_name || 'Treinador'}` : '⚪ Cancelado')}</span>
            </div>
            <div class="my-listing-actions">
              <span class="my-listing-price">₽ ${l.price.toLocaleString()}</span>
              ${l.status === 'active' ? `
                <button class="art-secondary-btn danger compact btn-cancel-listing" data-id="${l.id}">
                  <span>Cancelar</span>
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderHistoryTab(history: TradeHistoryItem[]): string {
    if (history.length === 0) {
      return `
        <div class="market-empty-state">
          ${createIcon('scroll', 'empty-icon', 36)}
          <p>Nenhuma transação recente no histórico do mercado.</p>
        </div>
      `;
    }

    return `
      <div class="market-history-table">
        <div class="history-table-header">
          <span>Item / Pokémon</span>
          <span>Comprador</span>
          <span>Vendedor</span>
          <span>Valor</span>
          <span>Data</span>
        </div>
        ${history.map(h => `
          <div class="history-table-row">
            <div class="history-item-col">
              <strong>${h.item_name}</strong>
              <span style="font-size: 11px; color: #94a3b8;">${h.item_type === 'pokemon' ? `Lv. ${h.level}` : `x${h.quantity}`}</span>
            </div>
            <span class="history-trainer-col">${h.buyer_name}</span>
            <span class="history-trainer-col">${h.seller_name}</span>
            <span class="history-price-col">₽ ${h.price.toLocaleString()}</span>
            <span class="history-date-col">${new Date(h.transacted_at).toLocaleDateString()}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Inspect Pokémon / Listing with Full Pokédex UI Art Model!
  private renderInspectView(listing: MarketListing): void {
    if (!this.overlay) return;

    const pokeData = listing.item_data;
    const cardData: PokemonCardData = {
      speciesId: Number(listing.item_id) || 1,
      name: pokeData?.name || listing.item_name,
      displayName: listing.item_name,
      types: pokeData?.types || ['normal'],
      level: listing.level,
      currentHp: pokeData?.currentHp,
      maxHp: pokeData?.maxHp,
      attack: pokeData?.attack,
      defense: pokeData?.defense,
      speed: pokeData?.speed,
      artwork: pokeData?.artwork,
      price: listing.price,
      seller_name: listing.seller_name,
    };

    const artHtml = renderPokemonArtCardHtml(cardData, {
      actionText: `Comprar de ${listing.seller_name} por ₽ ${listing.price.toLocaleString()}`,
      actionType: 'market',
    });

    this.overlay.innerHTML = `
      <div class="modal-content inspect-modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <button class="back-btn" id="btn-back-from-inspect">
              ${createIcon('arrow-right', 'rotate-180', 16)}
              <span>Voltar ao Mercado</span>
            </button>
          </div>
          <button class="modal-close-btn" id="btn-close-market">
            ${createIcon('close')}
          </button>
        </div>
        <div class="modal-body inspect-modal-body">
          ${artHtml}
        </div>
      </div>
    `;

    this.overlay.querySelector('#btn-back-from-inspect')?.addEventListener('click', () => {
      this.inspectListing = null;
      this.loadAndRender();
    });

    this.overlay.querySelector('#btn-close-market')?.addEventListener('click', () => this.close());

    this.overlay.querySelector('#btn-art-action')?.addEventListener('click', async () => {
      await this.executeBuy(listing);
    });
  }

  // Create Listing Modal View
  private renderCreateListingView(): void {
    if (!this.overlay) return;

    const user = backendClient.user;
    if (!user) {
      this.showCreateListingModal = false;
      this.activeTab = 'my-listings';
      this.loadAndRender();
      return;
    }

    const boxPokemon = gameState.box;
    const inventoryItems = Object.entries(gameState.inventory);

    this.overlay.innerHTML = `
      <div class="modal-content create-listing-content">
        <div class="modal-header">
          <div class="modal-title">
            ${createIcon('plus', 'accent-blue-icon')}
            <span>Anunciar no Mercado de Treinadores</span>
          </div>
          <button class="modal-close-btn" id="btn-cancel-create">
            ${createIcon('close')}
          </button>
        </div>

        <div class="modal-body">
          <div class="create-listing-tabs">
            <button class="create-tab-btn active" id="tab-create-poke">Vender Pokémon do Box (${boxPokemon.length})</button>
            <button class="create-tab-btn" id="tab-create-item">Vender Itens da Mochila (${inventoryItems.length})</button>
          </div>

          <div id="create-poke-section">
            ${boxPokemon.length === 0 ? `
              <p style="color: #94a3b8; text-align: center; padding: 20px;">Você não tem nenhum Pokémon no Box para vender. Capture mais criaturas ou mova da equipe!</p>
            ` : `
              <label style="font-weight: 700; margin-bottom: 8px; display: block;">Selecione o Pokémon:</label>
              <div class="create-pick-grid">
                ${boxPokemon.map((p, idx) => `
                  <div class="create-pick-card" data-box-idx="${idx}">
                    <img src="${p.spriteFront}" alt="${p.displayName}" />
                    <span style="font-weight: 700;">${p.displayName}</span>
                    <span style="font-size: 10px; color: #38bdf8;">Lv. ${p.level}</span>
                  </div>
                `).join('')}
              </div>

              <div class="auth-input-group" style="margin-top: 16px;">
                <label>Preço em Pokécoins (₽)</label>
                <div class="auth-input-wrapper">
                  ${createIcon('coin', 'input-icon', 16)}
                  <input type="number" id="input-listing-price" min="10" placeholder="ex: 1200" value="500" />
                </div>
              </div>

              <button class="art-primary-btn full-width" id="btn-submit-listing-poke" style="margin-top: 14px;" disabled>
                <span>Confirmar Anúncio de Pokémon</span>
              </button>
            `}
          </div>

          <div id="create-item-section" style="display: none;">
            ${inventoryItems.length === 0 ? `
              <p style="color: #94a3b8; text-align: center; padding: 20px;">Sua mochila está vazia.</p>
            ` : `
              <label style="font-weight: 700; margin-bottom: 8px; display: block;">Selecione o Item:</label>
              <div class="create-pick-grid">
                ${inventoryItems.map(([id, qty]) => {
                  const item = GAME_ITEMS[id];
                  return `
                    <div class="create-pick-card" data-item-id="${id}">
                      <img src="${item?.spriteUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'}" />
                      <span style="font-weight: 700;">${item?.name || id}</span>
                      <span style="font-size: 10px; color: #38bdf8;">Qtd: ${qty}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                <div class="auth-input-group">
                  <label>Quantidade a Vender</label>
                  <input type="number" id="input-item-qty" min="1" value="1" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; padding: 10px; width: 100%;" />
                </div>
                <div class="auth-input-group">
                  <label>Preço Total (₽)</label>
                  <input type="number" id="input-item-price" min="10" value="250" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; padding: 10px; width: 100%;" />
                </div>
              </div>

              <button class="art-primary-btn full-width" id="btn-submit-listing-item" style="margin-top: 14px;" disabled>
                <span>Confirmar Anúncio de Item</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.attachCreateEvents();
  }

  private attachCreateEvents(): void {
    if (!this.overlay) return;

    this.overlay.querySelector('#btn-cancel-create')?.addEventListener('click', () => {
      this.showCreateListingModal = false;
      this.loadAndRender();
    });

    const tabPoke = this.overlay.querySelector('#tab-create-poke');
    const tabItem = this.overlay.querySelector('#tab-create-item');
    const secPoke = this.overlay.querySelector('#create-poke-section') as HTMLElement;
    const secItem = this.overlay.querySelector('#create-item-section') as HTMLElement;

    tabPoke?.addEventListener('click', () => {
      tabPoke.classList.add('active');
      tabItem?.classList.remove('active');
      secPoke.style.display = 'block';
      secItem.style.display = 'none';
    });

    tabItem?.addEventListener('click', () => {
      tabItem.classList.add('active');
      tabPoke?.classList.remove('active');
      secItem.style.display = 'block';
      secPoke.style.display = 'none';
    });

    // Selecting Pokemon
    let selectedBoxIdx: number | null = null;
    const pokeCards = this.overlay.querySelectorAll('#create-poke-section .create-pick-card');
    const btnSubmitPoke = this.overlay.querySelector('#btn-submit-listing-poke') as HTMLButtonElement;

    pokeCards.forEach(c => {
      c.addEventListener('click', () => {
        pokeCards.forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        selectedBoxIdx = Number(c.getAttribute('data-box-idx'));
        if (btnSubmitPoke) btnSubmitPoke.disabled = false;
      });
    });

    btnSubmitPoke?.addEventListener('click', async () => {
      if (selectedBoxIdx === null) return;
      const user = backendClient.user;
      if (!user) return;

      const price = Number((this.overlay?.querySelector('#input-listing-price') as HTMLInputElement)?.value) || 500;
      const pokemon = gameState.box[selectedBoxIdx];
      if (!pokemon) return;

      // Remove from Box locally
      gameState.box.splice(selectedBoxIdx, 1);
      gameState.notify();

      // Post to SQLite
      await backendClient.createListing({
        seller_id: user.id,
        seller_name: user.trainer_name,
        item_type: 'pokemon',
        item_id: String(pokemon.speciesId),
        item_name: pokemon.displayName,
        item_data: pokemon,
        level: pokemon.level,
        quantity: 1,
        price,
      });

      this.showCreateListingModal = false;
      this.activeTab = 'my-listings';
      this.loadAndRender();
    });

    // Selecting Item
    let selectedItemId: string | null = null;
    const itemCards = this.overlay.querySelectorAll('#create-item-section .create-pick-card');
    const btnSubmitItem = this.overlay.querySelector('#btn-submit-listing-item') as HTMLButtonElement;

    itemCards.forEach(c => {
      c.addEventListener('click', () => {
        itemCards.forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        selectedItemId = c.getAttribute('data-item-id');
        if (btnSubmitItem) btnSubmitItem.disabled = false;
      });
    });

    btnSubmitItem?.addEventListener('click', async () => {
      if (!selectedItemId) return;
      const user = backendClient.user;
      if (!user) return;

      const qty = Number((this.overlay?.querySelector('#input-item-qty') as HTMLInputElement)?.value) || 1;
      const price = Number((this.overlay?.querySelector('#input-item-price') as HTMLInputElement)?.value) || 250;
      const currentQty = gameState.getItemCount(selectedItemId);

      if (currentQty < qty) {
        alert('Quantidade de itens insuficiente na mochila.');
        return;
      }

      // Remove from inventory
      gameState.removeItem(selectedItemId, qty);

      const itemName = GAME_ITEMS[selectedItemId]?.name || selectedItemId;

      // Post to SQLite
      await backendClient.createListing({
        seller_id: user.id,
        seller_name: user.trainer_name,
        item_type: 'item',
        item_id: selectedItemId,
        item_name: itemName,
        level: 1,
        quantity: qty,
        price,
      });

      this.showCreateListingModal = false;
      this.activeTab = 'my-listings';
      this.loadAndRender();
    });
  }

  private async executeBuy(listing: MarketListing): Promise<void> {
    const user = backendClient.user;
    if (!user) {
      authModal.open(async () => {
        await this.executeBuy(listing);
      });
      return;
    }

    if (gameState.money < listing.price) {
      alert(`Pokécoins insuficientes! Você possui ₽ ${gameState.money.toLocaleString()}, mas o preço é ₽ ${listing.price.toLocaleString()}.`);
      return;
    }

    const res = await backendClient.buyListing(listing.id, user.id);
    if (res.success && res.listing) {
      // Deduct coins locally
      gameState.spendMoney(listing.price);

      // Add to player inventory or party/box
      if (listing.item_type === 'pokemon' && listing.item_data) {
        if (gameState.party.length < 6) {
          gameState.party.push(listing.item_data);
        } else {
          gameState.box.push(listing.item_data);
        }
      } else if (listing.item_type === 'item') {
        gameState.addItem(listing.item_id, listing.quantity);
      }

      gameState.notify();
      alert(`Parabéns! Você adquiriu ${listing.item_name} com sucesso!`);
      this.inspectListing = null;
      this.loadAndRender();
    } else {
      alert(res.error || 'Erro ao efetuar a compra.');
    }
  }

  private attachMainEvents(): void {
    if (!this.overlay) return;

    this.overlay.querySelector('#btn-close-market')?.addEventListener('click', () => this.close());

    // Tab buttons
    this.overlay.querySelectorAll('.market-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        if (tab) {
          this.activeTab = tab;
          this.loadAndRender();
        }
      });
    });

    // Filters
    this.overlay.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterType = (e.currentTarget as HTMLElement).getAttribute('data-filter') as any;
        this.loadAndRender();
      });
    });

    // Search
    const searchInput = this.overlay.querySelector('#market-search-input') as HTMLInputElement;
    searchInput?.addEventListener('change', () => {
      this.searchQuery = searchInput.value.trim();
      this.loadAndRender();
    });

    this.overlay.querySelector('#btn-clear-search')?.addEventListener('click', () => {
      this.searchQuery = '';
      this.loadAndRender();
    });

    // Sort
    const sortSelect = this.overlay.querySelector('#market-sort-select') as HTMLSelectElement;
    sortSelect?.addEventListener('change', () => {
      this.sortBy = sortSelect.value as any;
      this.loadAndRender();
    });

    // Open create listing
    this.overlay.querySelector('#btn-open-create-listing')?.addEventListener('click', () => {
      if (!backendClient.user) {
        authModal.open(() => {
          this.showCreateListingModal = true;
          this.loadAndRender();
        });
      } else {
        this.showCreateListingModal = true;
        this.loadAndRender();
      }
    });

    // Login prompt from market
    this.overlay.querySelector('#btn-login-from-market')?.addEventListener('click', () => {
      authModal.open(() => this.loadAndRender());
    });

    // Inspect listing or click buy
    this.overlay.querySelectorAll('.market-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicked on buy button directly, trigger buy
        const target = e.target as HTMLElement;
        const buyBtn = target.closest('.btn-buy-listing');
        const listingId = Number(card.getAttribute('data-listing-id'));

        // If it's a pokemon card and not clicked directly on buy, open inspect art view!
        if (!buyBtn && card.classList.contains('pokemon-card')) {
          backendClient.getMarketListings().then(listings => {
            const found = listings.find(l => l.id === listingId);
            if (found) {
              this.inspectListing = found;
              this.loadAndRender();
            }
          });
        }
      });
    });

    // Buy button clicks
    this.overlay.querySelectorAll('.btn-buy-listing').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const listingId = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
        const listings = await backendClient.getMarketListings();
        const found = listings.find(l => l.id === listingId);
        if (found) {
          await this.executeBuy(found);
        }
      });
    });

    // Cancel listing
    this.overlay.querySelectorAll('.btn-cancel-listing').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const listingId = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
        const user = backendClient.user;
        if (!user) return;

        const res = await backendClient.cancelListing(listingId, user.id);
        if (res.success && res.returnedItem) {
          // Return item to player
          if (res.returnedItem.item_type === 'pokemon' && res.returnedItem.item_data) {
            gameState.box.push(res.returnedItem.item_data);
          } else if (res.returnedItem.item_type === 'item') {
            gameState.addItem(res.returnedItem.item_id, res.returnedItem.quantity);
          }
          gameState.notify();
          this.loadAndRender();
        }
      });
    });
  }
}

export const marketModal = new MarketModal();
