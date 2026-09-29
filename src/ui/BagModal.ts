import { gameState } from '../state/gameState';
import { GAME_ITEMS, GameItem, ItemCategory } from '../api/itemsData';

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
        <div class="modal-header">
          <div class="modal-title">🎒 Mochila de Itens</div>
          <button class="modal-close-btn" id="bag-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-tabs">
            <button class="modal-tab-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">Todos</button>
            <button class="modal-tab-btn ${this.currentCategory === 'ball' ? 'active' : ''}" data-cat="ball">Pokébolas</button>
            <button class="modal-tab-btn ${this.currentCategory === 'healing' ? 'active' : ''}" data-cat="healing">Poções e Cura</button>
            <button class="modal-tab-btn ${this.currentCategory === 'stone' ? 'active' : ''}" data-cat="stone">Pedras de Evolução</button>
          </div>

          ${filteredItems.length === 0 ? `
            <div style="text-align: center; color: #9ca3af; padding: 40px 0;">
              Nenhum item nesta categoria. Visite a <strong>Loja</strong> ou vença hunts para conseguir suprimentos!
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
          ${isPreferredPotion ? '★ Auto-Cura' : 'Definir Auto'}
        </button>
      `;
    } else if (item.category === 'ball') {
      actionBtnHtml = `
        <button class="btn-small ${isPreferredBall ? 'gold' : ''}" data-action="set-ball" data-item-id="${item.id}">
          ${isPreferredBall ? '★ Bola de Captura' : 'Usar na Captura'}
        </button>
      `;
    } else if (item.category === 'stone') {
      actionBtnHtml = `
        <button class="btn-small gold" data-action="use-stone" data-item-id="${item.id}">Usar Pedra</button>
      `;
    }

    return `
      <div class="item-card">
        <div class="card-top">
          <img src="${item.spriteUrl}" alt="${item.name}" class="card-sprite" />
          <div class="card-details">
            <div class="card-name">${item.name}</div>
            <div class="card-count">x${count}</div>
          </div>
        </div>
        <div class="card-desc">${item.description}</div>
        <div class="card-actions">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }

  private async handleItemAction(action: string, itemId: string): Promise<void> {
    const active = gameState.activePokemon;

    if (action === 'use-potion') {
      if (!active) return;
      if (active.currentHp >= active.maxHp) {
        alert(`${active.displayName} já está com o HP cheio!`);
        return;
      }
      gameState.useHealingItem(itemId, active);
      this.render();
    } else if (action === 'set-potion') {
      gameState.updateSettings({ preferredPotion: itemId });
      this.render();
    } else if (action === 'set-ball') {
      gameState.updateSettings({ preferredBall: itemId });
      this.render();
    } else if (action === 'use-stone') {
      // Find eligible Pokemon in party & box
      const allPokemons = [...gameState.party, ...gameState.box];
      const eligible = allPokemons.filter(p => 
        p.evolutions.some(e => e.triggerType === 'use-item' && e.item === itemId)
      );

      if (eligible.length === 0) {
        alert(`Nenhum dos seus Pokémons atuais pode evoluir com a ${GAME_ITEMS[itemId]?.name}!`);
        return;
      }

      // Prompt or select pokemon to evolve
      const names = eligible.map((p, idx) => `${idx + 1}: ${p.displayName} (Nv.${p.level})`).join('\n');
      const selection = prompt(`Qual Pokémon você deseja evoluir com ${GAME_ITEMS[itemId]?.name}?\n${names}\n\nDigite o número (1-${eligible.length}):`);
      if (selection) {
        const index = parseInt(selection, 10) - 1;
        if (eligible[index]) {
          await gameState.useEvolutionStone(itemId, eligible[index]);
          alert(`${eligible[index].displayName} evoluiu com sucesso!`);
          this.render();
        }
      }
    }
  }
}

export const bagModal = new BagModal();
