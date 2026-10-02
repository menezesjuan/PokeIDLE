import { gameState } from '../state/gameState';
import { GAME_ITEMS, GameItem, ItemCategory } from '../api/itemsData';
import { createIcon } from './icons';

export class BagModal {
  private container: HTMLElement | null = null;
  private currentCategory: 'all' | ItemCategory = 'all';

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

    const inventory = gameState.inventory;
    const itemIds = Object.keys(inventory).filter(id => (inventory[id] || 0) > 0);

    const filteredItems: { item: GameItem; count: number }[] = itemIds
      .map(id => ({ item: GAME_ITEMS[id], count: inventory[id] }))
      .filter(({ item }) => item && (this.currentCategory === 'all' || item.category === this.currentCategory));

    this.container.innerHTML = `
      <div class="modal-content">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <div class="modal-title">
            ${createIcon('bag', 'accent-blue-icon')}
            <span>Mochila de Itens</span>
          </div>
          <button class="modal-close-btn" id="bag-close">
            ${createIcon('close')}
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-tabs">
            <button class="modal-tab-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">Todos</button>
            <button class="modal-tab-btn ${this.currentCategory === 'ball' ? 'active' : ''}" data-cat="ball">Pokébolas</button>
            <button class="modal-tab-btn ${this.currentCategory === 'healing' ? 'active' : ''}" data-cat="healing">Poções e Cura</button>
            <button class="modal-tab-btn ${this.currentCategory === 'stone' ? 'active' : ''}" data-cat="stone">Pedras de Evolução</button>
          </div>

          ${filteredItems.length === 0 ? `
            <div style="text-align: center; color: #94a3b8; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              ${createIcon('bag', '', 36)}
              <span>Nenhum item nesta categoria. Visite a Loja ou vença hunts para conseguir suprimentos!</span>
            </div>
          ` : `
            <div class="cards-grid">
              ${filteredItems.map(({ item, count }) => this.renderItemCard(item, count)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    // Attach listeners
    this.container.querySelector('#bag-close')?.addEventListener('click', () => this.close());

    this.container.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as any;
        this.currentCategory = cat;
        this.render();
      });
    });

    // Action buttons inside cards
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const action = target.getAttribute('data-action');
        const itemId = target.getAttribute('data-item-id');
        if (itemId) this.handleItemAction(action!, itemId);
      });
    });
  }

  private renderItemCard(item: GameItem, count: number): string {
    const isPreferredBall = gameState.settings.preferredBall === item.id;
    const isPreferredPotion = gameState.settings.preferredPotion === item.id;

    let actionBtnHtml = '';
    if (item.category === 'healing') {
      actionBtnHtml = `
        <button class="btn-small green" data-action="use-potion" data-item-id="${item.id}">Curar Ativo</button>
        <button class="btn-small ${isPreferredPotion ? 'gold' : ''}" data-action="set-potion" data-item-id="${item.id}">
          ${isPreferredPotion ? 'Auto-Cura Ativa' : 'Definir Auto'}
        </button>
      `;
    } else if (item.category === 'ball') {
      actionBtnHtml = `
        <button class="btn-small ${isPreferredBall ? 'gold' : ''}" data-action="set-ball" data-item-id="${item.id}">
          ${isPreferredBall ? 'Auto-Captura Ativa' : 'Usar para Captura'}
        </button>
      `;
    } else if (item.category === 'stone') {
      actionBtnHtml = `
        <div style="font-size: 10px; color: #f59e0b; text-align: center; margin-top: 4px;">
          Use na aba Equipe & Box
        </div>
      `;
    }

    return `
      <div class="item-card">
        <div class="card-top">
          <img src="${item.spriteUrl}" alt="${item.name}" class="card-sprite" />
          <div class="card-details">
            <div class="card-name">${item.name}</div>
            <div class="card-count">Qtd: <strong>${count}</strong></div>
          </div>
        </div>
        <div class="card-desc">${item.description}</div>
        <div class="card-actions">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }

  private handleItemAction(action: string, itemId: string): void {
    if (action === 'use-potion') {
      const active = gameState.activePokemon;
      if (!active) return;
      if (active.currentHp >= active.maxHp) {
        alert(`${active.displayName} já está com a vida cheia!`);
        return;
      }
      const success = gameState.useHealingItem(itemId, active);
      if (success) {
        this.render();
      }
    } else if (action === 'set-potion') {
      gameState.updateSettings({ preferredPotion: itemId, autoPotion: true });
      this.render();
    } else if (action === 'set-ball') {
      gameState.updateSettings({ preferredBall: itemId, autoCatch: true });
      this.render();
    }
  }
}

export const bagModal = new BagModal();
