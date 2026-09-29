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
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <div class="modal-title">👥 Equipe Pokémon & Box</div>
          <button class="modal-close-btn" id="team-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-tabs">
            <button class="modal-tab-btn ${this.currentTab === 'party' ? 'active' : ''}" data-tab="party">
              Equipe Ativa (${gameState.party.length}/6)
            </button>
            <button class="modal-tab-btn ${this.currentTab === 'box' ? 'active' : ''}" data-tab="box">
              Box de Reserva (${gameState.box.length})
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
            alert(`Incrível! ${pokemon.displayName} evoluiu!`);
            this.render();
          }
        }
      });
    });

    // Revive actions
    this.container.querySelectorAll('[data-revive-poke]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = (e.currentTarget as HTMLElement).getAttribute('data-revive-poke')!;
        if (gameState.revivePokemon(uid)) {
          this.render();
        } else {
          alert('Pokédollars insuficientes! Reviver requer ₽ 10.');
        }
      });
    });

    this.container.querySelector('#btn-team-revive-all')?.addEventListener('click', () => {
      const res = gameState.reviveAllParty();
      if (res.success) {
        this.render();
      } else {
        alert('Pokédollars insuficientes para reviver toda a equipe!');
      }
    });

    this.container.querySelectorAll('[data-swap-box]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const partyIdx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-swap-box')!, 10);
        this.promptSwapWithBox(partyIdx);
      });
    });
  }

  private renderParty(): string {
    const party = gameState.party;
    const faintedCount = gameState.faintedPartyMembers.length;
    const totalCost = faintedCount * 10;

    return `
      ${faintedCount > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong style="color: #f87171;">💀 ${faintedCount} Pokémon desmaiado(s) na equipe!</strong>
            <div style="font-size: 11px; color: #fca5a5;">Reviva individualmente por ₽ 10 cada ou reviva todos:</div>
          </div>
          <button class="btn-small gold" id="btn-team-revive-all" ${gameState.money < totalCost ? 'disabled' : ''} style="padding: 6px 12px;">
            ✨ Reviver Todos (${faintedCount} por ₽ ${totalCost})
          </button>
        </div>
      ` : ''}

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
          Sua Box de reserva está vazia. Capture mais Pokémon para vê-los aqui!
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
            ${ready ? '★ Pronto para evoluir!' : `Evolui no Nv.${minLvl}`} para <strong>${evo.targetSpeciesName.toUpperCase()}</strong>
          </span>`;
        } else if (evo.triggerType === 'use-item' && evo.item) {
          const item = GAME_ITEMS[evo.item];
          const hasStone = gameState.getItemCount(evo.item) > 0;
          return `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="color: #f59e0b;">Evolui com ${item?.name || evo.item} para <strong>${evo.targetSpeciesName.toUpperCase()}</strong></span>
              ${hasStone ? `
                <button class="btn-small gold" data-use-stone="${evo.item}" data-poke-uid="${p.uid}" style="flex: 0 0 auto;">
                  Usar ${item?.name}
                </button>
              ` : `
                <span style="font-size: 10px; color: #ef4444;">(Precisa da pedra)</span>
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

    const isFainted = p.currentHp <= 0;

    return `
      <div class="poke-card" style="${isLeader ? 'border: 1px solid #3b82f6; background: rgba(59, 130, 246, 0.08);' : ''} ${isFainted ? 'border-color: #ef4444; background: rgba(239, 68, 68, 0.05);' : ''}">
        <div style="display: flex; gap: 14px; align-items: center;">
          <img src="${p.spriteFront}" alt="${p.displayName}" class="card-sprite" style="width: 56px; height: 56px; ${isFainted ? 'filter: grayscale(1) opacity(0.6);' : ''}" />
          
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px; font-weight: 700;">${p.displayName}</span>
              <span style="font-size: 12px; color: #60a5fa; font-weight: 600;">Lv.${p.level}</span>
              ${isLeader ? '<span style="background: #2563eb; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">LÍDER EM BATALHA</span>' : ''}
              ${isFainted ? '<span style="background: #ef4444; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">DESMAIADO</span>' : ''}
            </div>

            <div class="poke-types">
              ${p.types.map(t => `<span class="type-pill type-${t}">${t}</span>`).join('')}
            </div>

            <!-- Stats Bar -->
            <div style="display: flex; gap: 14px; font-size: 11px; color: #cbd5e1; margin-top: 4px;">
              <span style="${isFainted ? 'color: #ef4444; font-weight: 700;' : ''}">HP: <strong>${p.currentHp}/${p.maxHp}</strong></span>
              <span>ATQ: <strong>${p.attack}</strong></span>
              <span>DEF: <strong>${p.defense}</strong></span>
              <span>VEL: <strong>${p.speed}</strong></span>
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
          <div style="display: flex; flex-direction: column; gap: 6px; min-width: 130px;">
            ${isFainted ? `
              <button class="btn-small gold" data-revive-poke="${p.uid}" ${gameState.money < 10 ? 'disabled' : ''}>
                Reviver (₽ 10)
              </button>
            ` : ''}

            ${!isBox && !isLeader && !isFainted ? `
              <button class="btn-small green" data-set-active="${index}">Definir como Líder</button>
            ` : ''}

            ${!isBox && gameState.box.length > 0 ? `
              <button class="btn-small secondary" data-swap-box="${index}" title="Trocar com um Pokémon da Box">
                🔄 Trocar com a Box
              </button>
            ` : ''}

            ${!isBox && gameState.party.length > 1 ? `
              <button class="btn-small secondary" data-move-box="${index}">Remover da equipe</button>
            ` : ''}

            ${isBox ? `
              <button class="btn-small green" data-move-party="${index}" ${gameState.party.length >= 6 ? 'disabled' : ''}>
                Mover para Equipe
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private promptSwapWithBox(partyIdx: number): void {
    const box = gameState.box;
    if (box.length === 0) {
      alert('Sua Box de reserva está vazia.');
      return;
    }

    const list = box
      .map((p, idx) => `${idx + 1}: ${p.displayName} (Nv.${p.level} - HP ${p.currentHp}/${p.maxHp} ${p.currentHp <= 0 ? '💀' : '💚'})`)
      .join('\n');

    const choice = prompt(`Selecione um Pokémon da Box para colocar na equipe:\n${list}\n\nDigite o número (1-${box.length}):`);
    if (choice) {
      const selectedIdx = parseInt(choice, 10) - 1;
      if (box[selectedIdx]) {
        gameState.swapPartyAndBox(partyIdx, selectedIdx);
        this.render();
      }
    }
  }
}

export const teamModal = new TeamModal();
