import { gameState } from '../state/gameState';
import { battleEngine } from '../state/battleEngine';
import { createIcon } from './icons';

export class ReviveModal {
  private container: HTMLElement | null = null;

  public open(): void {
    this.close();
    this.container = document.createElement('div');
    this.container.className = 'modal-overlay';
    this.container.addEventListener('click', (e) => {
      // Don't close if no alive pokemon
      if (e.target === this.container && gameState.hasConsciousPartyMember) {
        this.close();
      }
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

    const faintedCount = gameState.faintedPartyMembers.length;
    const totalReviveCost = faintedCount * 10;
    const canAffordAll = gameState.money >= totalReviveCost;
    const hasConscious = gameState.hasConsciousPartyMember;

    // Check emergency state
    const hasAnyAliveEverywhere = [...gameState.party, ...gameState.box].some(p => p.currentHp > 0);
    const isEmergency = !hasAnyAliveEverywhere && gameState.money < 10;

    // Alive Pokemon in Box that can be swapped in
    const aliveBoxPokemons = gameState.box.filter(p => p.currentHp > 0);

    this.container.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="sheet-handle"></div>
        <div class="modal-header" style="background: #1e1b4b; border-bottom: 2px solid #ef4444;">
          <div class="modal-title" style="color: #f87171;">
            ${createIcon('skull', 'red-icon')}
            <span>Equipe de Combate Derrotada</span>
            <span class="user-coins-pill" style="margin-left: 12px;">
              ${createIcon('coin', 'gold-icon', 14)}
              <span>₽ ${gameState.money.toLocaleString()}</span>
            </span>
          </div>
          ${hasConscious ? `<button class="modal-close-btn" id="revive-close">${createIcon('close')}</button>` : ''}
        </div>

        <div class="modal-body">
          <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 12px;">
            Sua equipe desmaiou em combate! Você pode <strong>reviver cada Pokémon por ₽ 10</strong> ou <strong>substituí-lo por um Pokémon com vida da sua Box</strong>.
          </p>

          ${isEmergency ? `
            <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; margin-bottom: 14px; text-align: center;">
              <strong style="color: #f87171;">⚠️ Sem moedas suficientes e nenhum Pokémon vivo!</strong>
              <div style="font-size: 11px; color: #fca5a5; margin: 4px 0 8px;">A Enfermeira Joy pode prestar cuidados de emergência gratuitos para você continuar.</div>
              <button class="btn-small green" id="btn-emergency-joy" style="padding: 6px 14px; font-size: 12px;">
                🏥 Receber Tratamento de Emergência da Enfermeira Joy
              </button>
            </div>
          ` : ''}

          <!-- Party Members List -->
          <div style="font-weight: 700; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">
            Equipe Atual (${gameState.party.length} Pokémons):
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            ${gameState.party.map((p, idx) => {
              const isDead = p.currentHp <= 0;
              const canAffordSingle = gameState.money >= 10;

              return `
                <div class="poke-card" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; ${isDead ? 'border-color: #ef4444; background: rgba(239, 68, 68, 0.08);' : 'border-color: #10b981;'}">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${p.spriteFront}" alt="${p.displayName}" style="width: 42px; height: 42px; ${isDead ? 'filter: grayscale(1) opacity(0.6);' : ''}" />
                    <div>
                      <div style="font-weight: 700; font-size: 13px;">
                        ${p.displayName} <span style="font-size: 11px; color: #60a5fa;">Nv.${p.level}</span>
                        ${isDead ? '<span style="color: #ef4444; font-size: 10px; margin-left: 6px;">[DESMAIADO]</span>' : '<span style="color: #34d399; font-size: 10px; margin-left: 6px;">[PRONTO]</span>'}
                      </div>
                      <div style="font-size: 11px; color: #cbd5e1; font-family: monospace;">
                        HP: ${p.currentHp} / ${p.maxHp}
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 6px; align-items: center;">
                    ${isDead ? `
                      <button class="btn-small gold" data-revive-uid="${p.uid}" ${!canAffordSingle ? 'disabled' : ''} style="min-width: 105px;">
                        Reviver (₽ 10)
                      </button>
                    ` : `
                      <span style="font-size: 11px; color: #34d399; font-weight: 700; padding: 4px 8px;">💚 Com Vida</span>
                    `}

                    <!-- Swap with Box button if box has alive Pokemon -->
                    ${aliveBoxPokemons.length > 0 ? `
                      <button class="btn-small secondary" data-open-swap="${idx}" title="Substituir por Pokémon com vida da Box">
                        🔄 Trocar
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Action Buttons -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${faintedCount > 1 ? `
              <button class="btn-small gold" id="btn-revive-all" ${!canAffordAll ? 'disabled' : ''} style="padding: 8px 12px; font-size: 12px;">
                ✨ Reviver Todos (${faintedCount} Pokémons por ₽ ${totalReviveCost})
              </button>
            ` : ''}

            <button class="btn-small green" id="btn-resume-battle" ${!hasConscious ? 'disabled' : ''} style="padding: 8px 16px; font-size: 12px; flex: 1;">
              ⚔️ ${hasConscious ? 'Voltar ao Combate' : 'Reviva ou Troque para Continuar'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.container) return;

    this.container.querySelector('#revive-close')?.addEventListener('click', () => {
      if (gameState.hasConsciousPartyMember) {
        this.close();
      }
    });

    // Revive single
    this.container.querySelectorAll('[data-revive-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = (e.currentTarget as HTMLElement).getAttribute('data-revive-uid')!;
        if (gameState.revivePokemon(uid)) {
          this.render();
        }
      });
    });

    // Revive all
    this.container.querySelector('#btn-revive-all')?.addEventListener('click', () => {
      const res = gameState.reviveAllParty();
      if (res.success) {
        this.render();
      }
    });

    // Emergency Joy heal
    this.container.querySelector('#btn-emergency-joy')?.addEventListener('click', () => {
      if (gameState.emergencyJoyHeal()) {
        this.render();
      }
    });

    // Resume battle
    this.container.querySelector('#btn-resume-battle')?.addEventListener('click', () => {
      if (gameState.hasConsciousPartyMember) {
        this.close();
        battleEngine.resumeCombat();
      }
    });

    // Swap with Box Pokemon
    this.container.querySelectorAll('[data-open-swap]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const partyIdx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-open-swap')!, 10);
        this.promptSwapWithBox(partyIdx);
      });
    });
  }

  private promptSwapWithBox(partyIdx: number): void {
    const aliveBox = gameState.box
      .map((p, idx) => ({ poke: p, boxIndex: idx }))
      .filter(item => item.poke.currentHp > 0);

    if (aliveBox.length === 0) {
      alert('Não há Pokémons vivos na Box para substituição.');
      return;
    }

    const list = aliveBox
      .map((item, idx) => `${idx + 1}: ${item.poke.displayName} (Lv.${item.poke.level} - HP ${item.poke.currentHp}/${item.poke.maxHp})`)
      .join('\n');

    const choice = prompt(`Escolha qual Pokémon da Box colocar no time:\n${list}\n\nDigite o número (1-${aliveBox.length}):`);
    if (choice) {
      const selectedIdx = parseInt(choice, 10) - 1;
      if (aliveBox[selectedIdx]) {
        gameState.swapPartyAndBox(partyIdx, aliveBox[selectedIdx].boxIndex);
        this.render();
      }
    }
  }
}

export const reviveModal = new ReviveModal();
