import { gameState } from '../state/gameState';
import { GAME_ITEMS, GameItem } from '../api/itemsData';

export class ShopModal {
  private container: HTMLElement | null = null;
  private currentTab: 'buy' | 'sell-items' | 'sell-pokemon' = 'buy';
  private buyFilter: 'all' | 'ball' | 'healing' | 'stone' = 'all';

  public open(): void {
    this.close();
    this.container = document.createElement('div');
    this.container.className = 'modal-overlay';
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.close();
    });

    this.render();
    document.body.appendChild(this.container);
  }

  public close(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">
            🛒 Poké Mart & Pokémon Exchange
            <span class="money-badge" style="margin-left: 12px;">₽ ${gameState.money.toLocaleString()}</span>
          </div>
          <button class="modal-close-btn" id="shop-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-tabs">
            <button class="modal-tab-btn ${this.currentTab === 'buy' ? 'active' : ''}" data-tab="buy">Buy Items</button>
            <button class="modal-tab-btn ${this.currentTab === 'sell-items' ? 'active' : ''}" data-tab="sell-items">Sell Items</button>
            <button class="modal-tab-btn ${this.currentTab === 'sell-pokemon' ? 'active' : ''}" data-tab="sell-pokemon">Sell Pokémon</button>
          </div>

          ${this.currentTab === 'buy' ? this.renderBuyTab() : ''}
          ${this.currentTab === 'sell-items' ? this.renderSellItemsTab() : ''}
          ${this.currentTab === 'sell-pokemon' ? this.renderSellPokemonTab() : ''}
        </div>
      </div>
    `;

    // Event handlers
    this.container.querySelector('#shop-close')?.addEventListener('click', () => this.close());

    this.container.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        this.render();
      });
    });

    // Sub-filters in buy tab
    this.container.querySelectorAll('.buy-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.buyFilter = (e.currentTarget as HTMLElement).getAttribute('data-filter') as any;
        this.render();
      });
    });

    // Buy actions
    this.container.querySelectorAll('[data-buy-item]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const itemId = target.getAttribute('data-buy-item')!;
        const qty = parseInt(target.getAttribute('data-qty') || '1', 10);
        this.handleBuy(itemId, qty);
      });
    });

    // Sell item actions
    this.container.querySelectorAll('[data-sell-item]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const itemId = target.getAttribute('data-sell-item')!;
        const qty = parseInt(target.getAttribute('data-qty') || '1', 10);
        this.handleSellItem(itemId, qty);
      });
    });

    // Sell pokemon actions
    this.container.querySelectorAll('[data-sell-poke-index]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const fromBox = target.getAttribute('data-from-box') === 'true';
        const index = parseInt(target.getAttribute('data-sell-poke-index')!, 10);
        this.handleSellPokemon(fromBox, index);
      });
    });

    // Auto-release duplicate toggle
    const autoReleaseCheck = this.container.querySelector('#auto-release-duplicates') as HTMLInputElement;
    if (autoReleaseCheck) {
      autoReleaseCheck.addEventListener('change', (e) => {
        gameState.updateSettings({ autoReleaseDuplicates: (e.target as HTMLInputElement).checked });
      });
    }
  }

  private renderBuyTab(): string {
    const items = Object.values(GAME_ITEMS).filter(item => 
      this.buyFilter === 'all' || item.category === this.buyFilter
    );

    return `
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button class="btn-small ${this.buyFilter === 'all' ? 'gold' : ''} buy-filter-btn" data-filter="all">All</button>
        <button class="btn-small ${this.buyFilter === 'ball' ? 'gold' : ''} buy-filter-btn" data-filter="ball">Poké Balls</button>
        <button class="btn-small ${this.buyFilter === 'healing' ? 'gold' : ''} buy-filter-btn" data-filter="healing">Potions</button>
        <button class="btn-small ${this.buyFilter === 'stone' ? 'gold' : ''} buy-filter-btn" data-filter="stone">Stones</button>
      </div>
      <div class="cards-grid">
        ${items.map(item => {
          const canAfford1 = gameState.money >= item.cost;
          const canAfford10 = gameState.money >= (item.cost * 10);

          return `
            <div class="item-card">
              <div class="card-top">
                <img src="${item.spriteUrl}" alt="${item.name}" class="card-sprite" />
                <div class="card-details">
                  <div class="card-name">${item.name}</div>
                  <div class="card-count" style="color: var(--pokedollar-gold);">₽ ${item.cost.toLocaleString()}</div>
                </div>
              </div>
              <div class="card-desc">${item.description}</div>
              <div class="card-actions">
                <button class="btn-small green" data-buy-item="${item.id}" data-qty="1" ${!canAfford1 ? 'disabled' : ''}>
                  Buy x1
                </button>
                <button class="btn-small green" data-buy-item="${item.id}" data-qty="10" ${!canAfford10 ? 'disabled' : ''}>
                  Buy x10
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private renderSellItemsTab(): string {
    const inv = gameState.inventory;
    const itemsOwned = Object.keys(inv).filter(id => (inv[id] || 0) > 0);

    if (itemsOwned.length === 0) {
      return `
        <div style="text-align: center; color: #9ca3af; padding: 40px 0;">
          Your bag is empty! You don't have any items to sell.
        </div>
      `;
    }

    return `
      <div class="cards-grid">
        ${itemsOwned.map(id => {
          const item = GAME_ITEMS[id];
          if (!item) return '';
          const count = inv[id];
          const sellPrice = Math.floor(item.cost * 0.5);

          return `
            <div class="item-card">
              <div class="card-top">
                <img src="${item.spriteUrl}" alt="${item.name}" class="card-sprite" />
                <div class="card-details">
                  <div class="card-name">${item.name}</div>
                  <div class="card-count">Owned: x${count} | Sell: ₽ ${sellPrice.toLocaleString()}</div>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-small red" data-sell-item="${item.id}" data-qty="1">
                  Sell x1 (+₽ ${sellPrice})
                </button>
                <button class="btn-small red" data-sell-item="${item.id}" data-qty="${count}">
                  Sell All (+₽ ${(sellPrice * count).toLocaleString()})
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private renderSellPokemonTab(): string {
    const boxPokemons = gameState.box;
    const partyPokemons = gameState.party;

    return `
      <div style="margin-bottom: 14px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <strong style="color: #60a5fa;">Pokémon Breeder Exchange:</strong>
          <span style="color: #9ca3af; font-size: 12px; margin-left: 6px;">Sell excess Pokémon for ₽ PokéDollars based on level!</span>
        </div>
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
          <input type="checkbox" id="auto-release-duplicates" ${gameState.settings.autoReleaseDuplicates ? 'checked' : ''} />
          Auto-Sell Duplicates
        </label>
      </div>

      <div style="font-size: 13px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">
        📦 Storage Box (${boxPokemons.length} Pokémon)
      </div>

      ${boxPokemons.length === 0 ? `
        <div style="text-align: center; color: #9ca3af; padding: 20px 0;">
          No Pokémon in your storage box. Captured Pokémon will appear here when your party of 6 is full!
        </div>
      ` : `
        <div class="cards-grid" style="margin-bottom: 20px;">
          ${boxPokemons.map((poke, idx) => {
            const sellValue = Math.floor(poke.level * 80 + 100);
            return `
              <div class="poke-card">
                <div class="card-top">
                  <img src="${poke.spriteFront}" alt="${poke.displayName}" class="card-sprite" />
                  <div class="card-details">
                    <div class="card-name">${poke.displayName} <span style="font-size: 11px; color: #60a5fa;">Lv.${poke.level}</span></div>
                    <div class="poke-types">
                      ${poke.types.map(t => `<span class="type-pill type-${t}">${t}</span>`).join('')}
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <button class="btn-small red" data-from-box="true" data-sell-poke-index="${idx}">
                    Sell for ₽ ${sellValue.toLocaleString()}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <div style="font-size: 13px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">
        👥 Active Party (Can sell if more than 1 Pokémon)
      </div>
      <div class="cards-grid">
        ${partyPokemons.map((poke, idx) => {
          const sellValue = Math.floor(poke.level * 80 + 100);
          const isOnlyPokemon = partyPokemons.length <= 1;

          return `
            <div class="poke-card">
              <div class="card-top">
                <img src="${poke.spriteFront}" alt="${poke.displayName}" class="card-sprite" />
                <div class="card-details">
                  <div class="card-name">${poke.displayName} <span style="font-size: 11px; color: #60a5fa;">Lv.${poke.level}</span></div>
                  <div class="poke-types">
                    ${poke.types.map(t => `<span class="type-pill type-${t}">${t}</span>`).join('')}
                  </div>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-small red" data-from-box="false" data-sell-poke-index="${idx}" ${isOnlyPokemon ? 'disabled' : ''}>
                  ${isOnlyPokemon ? 'Active Starter' : `Sell for ₽ ${sellValue.toLocaleString()}`}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private handleBuy(itemId: string, qty: number): void {
    const item = GAME_ITEMS[itemId];
    if (!item) return;
    const totalCost = item.cost * qty;
    if (gameState.spendMoney(totalCost)) {
      gameState.addItem(itemId, qty);
      this.render();
    } else {
      alert('Not enough PokéDollars!');
    }
  }

  private handleSellItem(itemId: string, qty: number): void {
    const item = GAME_ITEMS[itemId];
    if (!item) return;
    const owned = gameState.getItemCount(itemId);
    const toSell = Math.min(owned, qty);
    if (toSell > 0) {
      const sellPrice = Math.floor(item.cost * 0.5) * toSell;
      gameState.removeItem(itemId, toSell);
      gameState.addMoney(sellPrice);
      this.render();
    }
  }

  private handleSellPokemon(fromBox: boolean, index: number): void {
    const earned = gameState.sellPokemon(fromBox, index);
    if (earned > 0) {
      this.render();
    }
  }
}

export const shopModal = new ShopModal();
