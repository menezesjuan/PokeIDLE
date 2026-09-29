import { gameState } from '../state/gameState';
import { GAME_ROUTES } from '../api/routesData';
import { battleEngine } from '../state/battleEngine';
import { getRouteDropsPreview } from '../api/dropsData';

export class RoutesModal {
  private container: HTMLElement | null = null;

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

    const highestPartyLevel = gameState.getHighestPartyLevel();
    const latestUnlocked = gameState.getLatestUnlockedRoute();
    const isAtFrontier = gameState.isAtFrontierRoute();

    this.container.innerHTML = `
      <div class="modal-content" style="max-width: 720px;">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <div class="modal-title">🗺️ Mapa de Kanto & Hunts de Caça</div>
          <button class="modal-close-btn" id="routes-close">✕</button>
        </div>
        <div class="modal-body">

          <!-- Auto-progression banner -->
          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid #374151; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong style="color: ${isAtFrontier ? '#34d399' : '#f59e0b'};">
                  ${isAtFrontier ? '⚡ Na Última Hunt (Fronteira)' : '🌾 Modo Farm Manual em Hunt Anterior'}
                </strong>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                  ${isAtFrontier 
                    ? 'O jogo avança automaticamente para a próxima rota assim que o Pokémon atingir o nível e as vitórias necessárias!' 
                    : `Você voltou para treinar. O auto-avanço retomará assim que você voltar para ${latestUnlocked.name}!`}
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                ${!isAtFrontier ? `
                  <button class="btn-small gold" id="btn-return-frontier" style="padding: 6px 12px;">
                    🚀 Voltar p/ Última Hunt
                  </button>
                ` : ''}

                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; cursor: pointer;">
                  <input type="checkbox" id="check-auto-advance" ${gameState.settings.autoAdvanceRoutes ? 'checked' : ''} />
                  Auto-Avançar
                </label>
              </div>
            </div>
          </div>

          <!-- Routes List -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${GAME_ROUTES.map((route, idx) => {
              const isUnlocked = gameState.unlockedRoutes.includes(route.id);
              const isCurrent = gameState.currentRouteId === route.id;
              const isFrontierRoute = route.id === latestUnlocked.id;
              const kills = gameState.routeKills[route.id] || 0;
              const reqKills = route.requiredKillsToUnlockNext || 15;
              const levelMet = highestPartyLevel >= route.minLevel;

              const dropsPreview = getRouteDropsPreview(route);

              return `
                <div class="item-card" style="${isCurrent ? 'border-color: #3b82f6; background: rgba(59, 130, 246, 0.12);' : (!isUnlocked ? 'opacity: 0.6;' : '')}">
                  <div style="display: flex; gap: 14px; align-items: center;">
                    <!-- Biome authentic preview thumbnail -->
                    <div style="width: 86px; height: 56px; border-radius: 8px; overflow: hidden; position: relative; flex-shrink: 0; border: 1.5px solid ${route.ambientColor}60; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                      <img src="${route.biomeThumbImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                      <span style="position: absolute; bottom: 2px; right: 2px; font-size: 11px; background: rgba(0,0,0,0.65); border-radius: 4px; padding: 1px 4px; border: 1px solid rgba(255,255,255,0.2);">
                        ${route.ambientIcon}
                      </span>
                    </div>

                    <div style="flex: 1;">
                      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-weight: 700; font-size: 14px; color: ${isCurrent ? '#60a5fa' : '#f9fafb'};">
                          ${route.name}
                        </span>
                        <span style="font-size: 10px; color: ${route.ambientColor}; background: ${route.ambientColor}20; padding: 1px 6px; border-radius: 9999px; font-weight: 600; border: 1px solid ${route.ambientColor}40;">
                          ${route.biomeName}
                        </span>
                        ${isCurrent ? '<span style="font-size: 9px; background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CAÇANDO AQUI</span>' : ''}
                        ${isFrontierRoute ? '<span style="font-size: 9px; background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ÚLTIMA HUNT</span>' : ''}
                        <span style="font-size: 9px; background: #475569; color: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${dropsPreview.tierName}</span>
                      </div>

                      <div style="display: flex; gap: 14px; font-size: 11px; color: #94a3b8; margin-top: 4px;">
                        <span>Inimigos: <strong>Lv.${route.minLevel}-${route.maxLevel}</strong></span>
                        <span style="${levelMet ? 'color: #34d399;' : 'color: #f87171;'}">
                          Requer Time: <strong>Lv.${route.minLevel}</strong> (${highestPartyLevel >= route.minLevel ? '✓ Apto' : '✗ Baixo'})
                        </span>
                        <span>Derrotados: <strong>${kills}/${reqKills}</strong></span>
                      </div>

                      <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
                        Selvagens: ${route.encounterPool.map(e => `<span style="background: rgba(0,0,0,0.3); padding: 1px 6px; border-radius: 4px; margin-right: 4px;">${String(e.speciesIdOrName).toUpperCase()}</span>`).join(' ')}
                      </div>

                      <div style="font-size: 11px; margin-top: 5px; display: flex; gap: 8px; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 4px; border-left: 3px solid #facc15;">
                        <span style="color: #facc15; font-weight: 700;">🎁 Drops da Hunt:</span>
                        <span style="color: #38bdf8;">🔴 ${dropsPreview.balls}</span>
                        <span style="color: #4ade80;">🧪 ${dropsPreview.potions}</span>
                      </div>
                    </div>

                    <div style="min-width: 120px; text-align: right;">
                      ${isUnlocked ? `
                        <button class="btn-small ${isCurrent ? 'gold' : 'green'}" data-travel-route="${route.id}" ${isCurrent ? 'disabled' : ''}>
                          ${isCurrent ? 'Na Rota' : 'Viajar & Caçar'}
                        </button>
                      ` : `
                        <span style="font-size: 10px; color: #ef4444; font-weight: 600;">
                          🔒 Bloqueada<br>(Nv.${route.minLevel} + vitórias)
                        </span>
                      `}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.container) return;

    this.container.querySelector('#routes-close')?.addEventListener('click', () => this.close());

    this.container.querySelector('#btn-return-frontier')?.addEventListener('click', () => {
      gameState.returnToFrontierHunt();
      battleEngine.stop();
      battleEngine.start();
      this.render();
    });

    const autoAdvCheck = this.container.querySelector('#check-auto-advance') as HTMLInputElement;
    if (autoAdvCheck) {
      autoAdvCheck.addEventListener('change', (e) => {
        gameState.updateSettings({ autoAdvanceRoutes: (e.target as HTMLInputElement).checked });
      });
    }

    this.container.querySelectorAll('[data-travel-route]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const routeId = (e.currentTarget as HTMLElement).getAttribute('data-travel-route')!;
        gameState.setRoute(routeId);
        battleEngine.stop();
        battleEngine.start();
        this.close();
      });
    });
  }
}

export const routesModal = new RoutesModal();
