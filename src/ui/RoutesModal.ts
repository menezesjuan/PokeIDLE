import { gameState } from '../state/gameState';
import { GAME_ROUTES } from '../api/routesData';
import { battleEngine } from '../state/battleEngine';

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

    this.container.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">🗺️ Kanto Map & Hunting Routes</div>
          <button class="modal-close-btn" id="routes-close">✕</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${GAME_ROUTES.map((route, idx) => {
              const isUnlocked = gameState.unlockedRoutes.includes(route.id);
              const isCurrent = gameState.currentRouteId === route.id;
              const kills = gameState.routeKills[route.id] || 0;
              const req = route.requiredKillsToUnlockNext || 15;

              return `
                <div class="item-card" style="${isCurrent ? 'border-color: #3b82f6; background: rgba(59, 130, 246, 0.1);' : (!isUnlocked ? 'opacity: 0.6;' : '')}">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 700; font-size: 14px; color: ${isCurrent ? '#60a5fa' : '#f9fafb'};">
                        ${route.name}
                        ${isCurrent ? '<span style="font-size: 10px; background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">CURRENT</span>' : ''}
                      </div>
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                        Levels: <strong>${route.minLevel}-${route.maxLevel}</strong> | Defeated: <strong>${kills}/${req}</strong>
                      </div>
                      <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
                        Wild Encounters: ${route.encounterPool.map(e => `<span style="background: rgba(0,0,0,0.3); padding: 1px 6px; border-radius: 4px; margin-right: 4px;">${String(e.speciesIdOrName).toUpperCase()}</span>`).join(' ')}
                      </div>
                    </div>

                    <div>
                      ${isUnlocked ? `
                        <button class="btn-small ${isCurrent ? 'gold' : 'green'}" data-travel-route="${route.id}" ${isCurrent ? 'disabled' : ''}>
                          ${isCurrent ? 'Hunting Here' : 'Travel & Hunt'}
                        </button>
                      ` : `
                        <span style="font-size: 11px; color: #ef4444; font-weight: 600;">
                          🔒 Locked (Defeat previous)
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

    this.container.querySelector('#routes-close')?.addEventListener('click', () => this.close());

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
