import { gameState } from '../state/gameState';
import { GAME_ITEMS, GameItem } from '../api/itemsData';
import { createIcon } from './icons';
import { marketModal } from './MarketModal';

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
      <div class="modal-content shop-modal-content">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            ${createIcon('shop', 'accent-blue-icon')}
            <span>Poké Mart Oficial</span>
            <span class="user-coins-pill" style="margin-left: 12px;">
              ${createIcon('coin', 'gold-icon', 14)}
              <span>₽ ${gameState.money.toLocaleString()}</span>
            </span>
          </div>
          <button class="modal-close-btn" id="shop-close">
            ${createIcon('close')}
          </button>
        </div>
        <div class="modal-body">
          <!-- P2P Market Promotion Banner -->
          <div style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #38bdf8; display: block; font-size: 13px;">Mercado de Treinadores (P2P) Disponível!</strong>
              <span style="font-size: 11px; color: #94a3b8;">Compre e venda Pokémon raros e itens diretamente com outros treinadores.</span>
            </div>
            <button class="art-primary-btn compact" id="btn-goto-p2p" style="width: auto;">
              ${createIcon('market', '', 14)}
              <span>Ir ao Mercado P2P</span>
            </button>
          </div>

          <div class="modal-tabs">
            <button class="modal-tab-btn ${this.currentTab === 'buy' ? 'active' : ''}" data-tab="buy">Comprar da Loja</button>
            <button class="modal-tab-btn ${this.currentTab === 'sell-items' ? 'active' : ''}" data-tab="sell-items">Vender Meus Itens</button>
            <button class="modal-tab-btn ${this.currentTab === 'sell-pokemon' ? 'active' : ''}" data-tab="sell-pokemon">Vender Pokémon</button>
          </div>

          ${this.currentTab === 'buy' ? this.renderBuyTab() : ''}
          ${this.currentTab === 'sell-items' ? this.renderSellItemsTab() : ''}
          ${this.currentTab === 'sell-pokemon' ? this.renderSellPokemonTab() : ''}
        </div>
      </div>
    `;

    // Event handlers
    this.container.querySelector('#shop-close')?.addEventListener('click', () => this.close());

    this.container.querySelector('#btn-goto-p2p')?.addEventListener('click', () => {
      this.close();
      marketModal.open();
    });

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
  }

  private renderBuyTab(): string {
    const items = Object.values(GAME_ITEMS).filter(item => {
      if (this.buyFilter === 'all') return true;
      return item.category === this.buyFilter;
    });

    return `
      <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
        <button class="filter-chip ${this.buyFilter === 'all' ? 'active' : ''} buy-filter-btn" data-filter="all">Todos</button>
        <button class="filter-chip ${this.buyFilter === 'ball' ? 'active' : ''} buy-filter-btn" data-filter="ball">Pokébolas</button>
        <button class="filter-chip ${this.buyFilter === 'healing' ? 'active' : ''} buy-filter-btn" data-filter="healing">Cura</button>
        <button class="filter-chip ${this.buyFilter === 'stone' ? 'active' : ''} buy-filter-btn" data-filter="stone">Pedras de Evolução</button>
      </div>

      <div class="cards-grid">
        ${items.map(item => this.renderBuyCard(item)).join('')}
      </div>
    `;
  }

  private renderBuyCard(item: GameItem): string {
    const canAfford1 = gameState.money >= item.cost;
    const canAfford10 = gameState.money >= (item.cost * 10);

    return `
      <div class="item-card">
        <div class="card-top">
          <img src="${item.spriteUrl}" alt="${item.name}" class="card-sprite" />
          <div class="card-details">
            <div class="card-name">${item.name}</div>
            <div class="card-count" style="color: #fbbf24;">₽ ${item.cost.toLocaleString()}</div>
          </div>
        </div>
        <div class="card-desc">${item.description}</div>
        <div class="card-actions">
          <button class="btn-small ${canAfford1 ? 'green' : ''}" data-buy-item="${item.id}" data-qty="1" ${!canAfford1 ? 'disabled' : ''}>
            Comprar 1
          </button>
          <button class="btn-small ${canAfford10 ? 'gold' : ''}" data-buy-item="${item.id}" data-qty="10" ${!canAfford10 ? 'disabled' : ''}>
            Comprar 10
          </button>
        </div>
      </div>
    `;
  }

  private renderSellItemsTab(): string {
    const inv = gameState.inventory;
    const itemsToSell = Object.keys(inv).filter(id => (inv[id] || 0) > 0);

    if (itemsToSell.length === 0) {
      return `
        <div style="text-align: center; color: #94a3b8; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 12px;">
          ${createIcon('bag', '', 36)}
          <span>Você não possui itens para vender na mochila.</span>
        </div>
      `;
    }

    return `
      <div class="cards-grid">
        ${itemsToSell.map(id => {
          const item = GAME_ITEMS[id];
          const count = inv[id];
          const sellPrice = Math.floor(item.cost * 0.5);
          return `
            <div class="item-card">
              <div class="card-top">
                <img src="${item.spriteUrl}" alt="${item.name}" class="card-sprite" />
                <div class="card-details">
                  <div class="card-name">${item.name}</div>
                  <div class="card-count">Possui: <strong>${count}</strong> (Vende por ₽ ${sellPrice})</div>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-small gold" data-sell-item="${item.id}" data-qty="1">Vender 1 (+₽ ${sellPrice})</button>
                ${count >= 5 ? `
                  <button class="btn-small gold" data-sell-item="${item.id}" data-qty="${count}">Vender Todos (+₽ ${sellPrice * count})</button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private renderSellPokemonTab(): string {
    const box = gameState.box;

    if (box.length === 0) {
      return `
        <div style="text-align: center; color: #94a3b8; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 12px;">
          ${createIcon('pokeball', '', 36)}
          <span>Nenhum Pokémon disponível no Box para vender ao Poké Mart.</span>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${box.map((p, idx) => {
          const sellValue = Math.floor(p.level * 80 + 100);
          return `
            <div class="my-listing-row">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${p.spriteFront}" style="width: 38px; height: 38px;" />
                <div>
                  <span style="font-weight: 700; color: #f8fafc;">${p.displayName}</span>
                  <span style="font-size: 11px; color: #38bdf8; display: block;">Lv. ${p.level} • HP ${p.currentHp}/${p.maxHp}</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #fbbf24; font-weight: 800; font-family: monospace;">+₽ ${sellValue.toLocaleString()}</span>
                <button class="btn-small gold" data-sell-poke-index="${idx}" data-from-box="true" style="flex: 0 0 auto;">
                  Vender
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
    }
  }

  private handleSellItem(itemId: string, qty: number): void {
    const item = GAME_ITEMS[itemId];
    if (!item) return;

    if (gameState.removeItem(itemId, qty)) {
      const sellPrice = Math.floor(item.cost * 0.5) * qty;
      gameState.addMoney(sellPrice);
      this.render();
    }
  }

  private handleSellPokemon(fromBox: boolean, index: number): void {
    gameState.sellPokemon(fromBox, index);
    this.render();
  }
}

export const shopModal = new ShopModal();
