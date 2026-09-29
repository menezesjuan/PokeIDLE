import { gameState } from '../state/gameState';
import { ActivePokemon, getExpForLevel } from '../api/pokeApi';
import { GAME_ITEMS } from '../api/itemsData';

export class TeamModal {
  private container: HTMLElement | null = null;
  private currentTab: 'party' | 'box' = 'party';

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
          <div class="modal-title">👥 Pokémon Team & Storage</div>
          <button class="modal-close-btn" id="team-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-tabs">
            <button class="modal-tab-btn ${this.currentTab === 'party' ? 'active' : ''}" data-tab="party">
              Active Party (${gameState.party.length}/6)
            </button>
            <button class="modal-tab-btn ${this.currentTab === 'box' ? 'active' : ''}" data-tab="box">
              Storage Box (${gameState.box.length})
            </button>
          </div>

          ${this.currentTab === 'party' ? this.renderParty() : this.renderBox()}
        </div>
      </div>
    `;

    this.container.querySelector('#team-close')?.addEventListener('click', () => this.close());

    this.container.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        this.render();
      });
    });

    // Action buttons
    this.container.querySelectorAll('[data-set-active]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-set-active')!, 10);
        gameState.setActivePokemon(idx);
        this.render();
      });
    });

    this.container.querySelectorAll('[data-move-box]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-move-box')!, 10);
        gameState.movePokemonToBox(idx);
        this.render();
      });
    });

    this.container.querySelectorAll('[data-move-party]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-move-party')!, 10);
        gameState.movePokemonToParty(idx);
        this.render();
      });
    });

    this.container.querySelectorAll('[data-use-stone]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const uid = target.getAttribute('data-poke-uid')!;
        const itemId = target.getAttribute('data-use-stone')!;
        const pokemon = [...gameState.party, ...gameState.box].find(p => p.uid === uid);
        if (pokemon) {
          const success = await gameState.useEvolutionStone(itemId, pokemon);
          if (success) {
            alert(`Awesome! ${pokemon.displayName} evolved!`);
            this.render();
          }
        }
      });
    });
  }

  private renderParty(): string {
    const party = gameState.party;
    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${party.map((p, idx) => this.renderPokemonDetailCard(p, idx, false)).join('')}
      </div>
    `;
  }

  private renderBox(): string {
    const box = gameState.box;
    if (box.length === 0) {
      return `
        <div style="text-align: center; color: #9ca3af; padding: 40px 0;">
          Your storage box is empty. Catch more Pokémon to see them here!
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${box.map((p, idx) => this.renderPokemonDetailCard(p, idx, true)).join('')}
      </div>
    `;
  }

  private renderPokemonDetailCard(p: ActivePokemon, index: number, isBox: boolean): string {
    const isLeader = !isBox && index === 0;

    // Check evolutions
    let evoInfoHtml = '';
    if (p.evolutions && p.evolutions.length > 0) {
      const evoList = p.evolutions.map(evo => {
        if (evo.triggerType === 'level-up') {
          const minLvl = evo.minLevel || 25;
          const ready = p.level >= minLvl;
          return `<span style="color: ${ready ? '#4ade80' : '#94a3b8'};">
            ${ready ? '★ Ready to evolve!' : `Evolves at Lv.${minLvl}`} into <strong>${evo.targetSpeciesName.toUpperCase()}</strong>
          </span>`;
        } else if (evo.triggerType === 'use-item' && evo.item) {
          const item = GAME_ITEMS[evo.item];
          const hasStone = gameState.getItemCount(evo.item) > 0;
          return `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="color: #f59e0b;">Evolves with ${item?.name || evo.item} into <strong>${evo.targetSpeciesName.toUpperCase()}</strong></span>
              ${hasStone ? `
                <button class="btn-small gold" data-use-stone="${evo.item}" data-poke-uid="${p.uid}" style="flex: 0 0 auto;">
                  Use ${item?.name}
                </button>
              ` : `
                <span style="font-size: 10px; color: #ef4444;">(Need stone)</span>
              `}
            </div>
          `;
        }
        return '';
      }).join('');

      evoInfoHtml = `<div style="margin-top: 6px; font-size: 11px; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 4px;">${evoList}</div>`;
    }

    // EXP progress
    const currentExpInLevel = p.exp - getExpForLevel(p.level);
    const expRatio = Math.min(1, Math.max(0, currentExpInLevel / Math.max(1, p.expToNextLevel)));
    const expPercent = Math.round(expRatio * 100);

    return `
      <div class="poke-card" style="${isLeader ? 'border: 1px solid #3b82f6; background: rgba(59, 130, 246, 0.08);' : ''}">
        <div style="display: flex; gap: 14px; align-items: center;">
          <img src="${p.spriteFront}" alt="${p.displayName}" class="card-sprite" style="width: 56px; height: 56px;" />
          
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px; font-weight: 700;">${p.displayName}</span>
              <span style="font-size: 12px; color: #60a5fa; font-weight: 600;">Lv.${p.level}</span>
              ${isLeader ? '<span style="background: #2563eb; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">IN BATTLE</span>' : ''}
            </div>

            <div class="poke-types">
              ${p.types.map(t => `<span class="type-pill type-${t}">${t}</span>`).join('')}
            </div>

            <!-- Stats Bar -->
            <div style="display: flex; gap: 14px; font-size: 11px; color: #cbd5e1; margin-top: 4px;">
              <span>HP: <strong>${p.currentHp}/${p.maxHp}</strong></span>
              <span>ATK: <strong>${p.attack}</strong></span>
              <span>DEF: <strong>${p.defense}</strong></span>
              <span>SPD: <strong>${p.speed}</strong></span>
            </div>

            <!-- EXP Bar -->
            <div style="margin-top: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: monospace;">
                <span>EXP: ${currentExpInLevel}/${p.expToNextLevel}</span>
                <span>${expPercent}%</span>
              </div>
              <div style="background: #334155; height: 4px; border-radius: 2px; overflow: hidden; margin-top: 2px;">
                <div style="background: #3b82f6; width: ${expPercent}%; height: 100%;"></div>
              </div>
            </div>

            ${evoInfoHtml}
          </div>

          <!-- Actions -->
          <div style="display: flex; flex-direction: column; gap: 6px; min-width: 100px;">
            ${!isBox && !isLeader ? `
              <button class="btn-small green" data-set-active="${index}">Set as Active</button>
              <button class="btn-small secondary" data-move-box="${index}">To Box</button>
            ` : ''}

            ${isBox ? `
              <button class="btn-small green" data-move-party="${index}" ${gameState.party.length >= 6 ? 'disabled' : ''}>
                Move to Party
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

export const teamModal = new TeamModal();
