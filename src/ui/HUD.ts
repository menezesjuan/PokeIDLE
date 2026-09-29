import { gameState } from '../state/gameState';
import { battleEngine, CombatEvent } from '../state/battleEngine';
import { GAME_ITEMS } from '../api/itemsData';
import { GAME_ROUTES } from '../api/routesData';
import { bagModal } from './BagModal';
import { shopModal } from './ShopModal';
import { teamModal } from './TeamModal';
import { routesModal } from './RoutesModal';

declare global {
  interface Window {
    electronAPI?: {
      toggleAlwaysOnTop: (pin: boolean) => void;
      setCompactMode: (compact: boolean) => void;
      isElectron: boolean;
    };
  }
}

export class HUD {
  private element: HTMLElement;
  private tickerElement: HTMLElement;
  private isPinned: boolean = false;
  private isCompact: boolean = false;
  private pipWindow: Window | null = null;

  constructor(hudContainerId: string, tickerContainerId: string) {
    this.element = document.getElementById(hudContainerId)!;
    this.tickerElement = document.getElementById(tickerContainerId)!;

    this.render();
    gameState.subscribe(() => this.render());
    battleEngine.subscribe((event) => this.handleCombatEvent(event));
  }

  public render(): void {
    const s = gameState.settings;
    const currentRoute = GAME_ROUTES.find(r => r.id === gameState.currentRouteId) || GAME_ROUTES[0];
    const preferredBallItem = GAME_ITEMS[s.preferredBall] || GAME_ITEMS['poke-ball'];
    const preferredPotionItem = GAME_ITEMS[s.preferredPotion] || GAME_ITEMS['potion'];

    this.element.innerHTML = `
      <div class="hud-left">
        <div class="money-badge">
          <span class="icon">₽</span>
          <span>${gameState.money.toLocaleString()}</span>
        </div>

        <button class="nav-action-btn secondary" id="btn-open-routes" title="Change Route">
          🗺️ ${currentRoute.name.split('(')[0]}
        </button>
      </div>

      <div class="hud-center">
        <!-- Auto-Hunt Toggle -->
        <button class="idle-toggle-btn ${s.autoHunt ? 'active' : ''}" id="toggle-hunt" title="Toggle automatic hunting of wild Pokemon">
          ⚔️ Auto-Hunt: <strong>${s.autoHunt ? 'ON' : 'OFF'}</strong>
        </button>

        <!-- Auto-Catch Toggle -->
        <button class="idle-toggle-btn ${s.autoCatch ? 'active' : ''}" id="toggle-catch" title="Toggle automatic catching using preferred Pokeball">
          <img src="${preferredBallItem.spriteUrl}" style="width: 16px; height: 16px; vertical-align: middle;" />
          Auto-Catch: <strong>${s.autoCatch ? 'ON' : 'OFF'}</strong>
        </button>

        <!-- Auto-Heal Toggle -->
        <button class="idle-toggle-btn ${s.autoPotion ? 'active' : ''}" id="toggle-potion" title="Toggle automatic healing when HP is low">
          <img src="${preferredPotionItem.spriteUrl}" style="width: 16px; height: 16px; vertical-align: middle;" />
          Auto-Heal &le;${s.autoPotionThreshold}%: <strong>${s.autoPotion ? 'ON' : 'OFF'}</strong>
        </button>
      </div>

      <div class="hud-right">
        <button class="nav-action-btn warning" id="btn-open-shop">
          🛒 Shop
        </button>
        <button class="nav-action-btn purple" id="btn-open-bag">
          🎒 Bag (${Object.values(gameState.inventory).reduce((a, b) => a + b, 0)})
        </button>
        <button class="nav-action-btn" id="btn-open-team">
          👥 Team (${gameState.party.length}/6)
        </button>

        <!-- Taskbar / Electron Window options -->
        <button class="nav-action-btn secondary" id="btn-toggle-pin" title="Pin window always on top">
          ${this.isPinned ? '📌 Pinned' : '📍 Pin'}
        </button>
        <button class="nav-action-btn secondary" id="btn-toggle-compact" title="Toggle compact taskbar strip mode">
          ${this.isCompact ? 'Expand' : 'Compact'}
        </button>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Toggles
    this.element.querySelector('#toggle-hunt')?.addEventListener('click', () => {
      const next = !gameState.settings.autoHunt;
      gameState.updateSettings({ autoHunt: next });
      if (next && !battleEngine.isBattling) {
        battleEngine.start();
      }
    });

    this.element.querySelector('#toggle-catch')?.addEventListener('click', () => {
      gameState.updateSettings({ autoCatch: !gameState.settings.autoCatch });
    });

    this.element.querySelector('#toggle-potion')?.addEventListener('click', () => {
      gameState.updateSettings({ autoPotion: !gameState.settings.autoPotion });
    });

    // Modals
    this.element.querySelector('#btn-open-routes')?.addEventListener('click', () => routesModal.open());
    this.element.querySelector('#btn-open-shop')?.addEventListener('click', () => shopModal.open());
    this.element.querySelector('#btn-open-bag')?.addEventListener('click', () => bagModal.open());
    this.element.querySelector('#btn-open-team')?.addEventListener('click', () => teamModal.open());

    // Window Pinning & PiP Miniplayer
    this.element.querySelector('#btn-toggle-pin')?.addEventListener('click', async () => {
      if (window.electronAPI?.toggleAlwaysOnTop) {
        this.isPinned = !this.isPinned;
        window.electronAPI.toggleAlwaysOnTop(this.isPinned);
        window.electronAPI.setCompactMode(this.isPinned);
        this.render();
      } else if ('documentPictureInPicture' in window) {
        await this.toggleDocumentPip();
      } else {
        // Fallback popup window
        window.open(window.location.href, 'PokeIDLE_PiP', 'width=440,height=280,status=no,toolbar=no,menubar=no,location=no');
      }
    });

    // Compact Mode
    this.element.querySelector('#btn-toggle-compact')?.addEventListener('click', () => {
      this.isCompact = !this.isCompact;
      document.body.classList.toggle('compact-mode', this.isCompact);
      if (window.electronAPI?.setCompactMode) {
        window.electronAPI.setCompactMode(this.isCompact);
      }
      this.render();
    });
  }

  private async toggleDocumentPip(): Promise<void> {
    const dPip = (window as any).documentPictureInPicture;
    if (!dPip) return;

    if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
      this.isPinned = false;
      this.render();
      return;
    }

    try {
      this.pipWindow = await dPip.requestWindow({
        width: 440,
        height: 270,
      });

      // Copy stylesheets
      [...document.styleSheets].forEach((sheet) => {
        try {
          const cssRules = [...sheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          this.pipWindow!.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            this.pipWindow!.document.head.appendChild(link);
          }
        }
      });

      const win = this.pipWindow;
      if (!win) return;

      win.document.title = 'PokeIDLE - Miniplayer';
      win.document.body.classList.add('compact-mode');
      win.document.body.style.cssText = 'margin: 0; padding: 0; background: #0b0f19; overflow-x: hidden;';

      const appEl = document.getElementById('app');
      const placeholder = document.createElement('div');
      placeholder.id = 'pip-placeholder';
      placeholder.style.cssText = 'display: flex; justify-content: center; align-items: center; height: 100vh; color: #94a3b8; font-family: sans-serif; text-align: center; font-size: 14px; padding: 20px;';
      placeholder.innerHTML = '<div>🎮 <strong>PokeIDLE está ativo na janela PiP (Miniplayer) no canto da tela!</strong><br><br><span style="font-size: 12px; color: #60a5fa;">Feche a janela flutuante para restaurar aqui.</span></div>';

      if (appEl && appEl.parentNode) {
        appEl.parentNode.insertBefore(placeholder, appEl);
        win.document.body.appendChild(appEl);
      }

      this.isPinned = true;
      this.render();

      win.addEventListener('pagehide', () => {
        if (placeholder.parentNode && appEl) {
          placeholder.parentNode.replaceChild(appEl, placeholder);
        }
        this.pipWindow = null;
        this.isPinned = false;
        this.render();
      });
    } catch (e) {
      console.error('Failed to open Document PiP:', e);
      window.open(window.location.href, 'PokeIDLE_PiP', 'width=440,height=280,status=no,toolbar=no,menubar=no,location=no');
    }
  }

  private handleCombatEvent(event: CombatEvent): void {
    if (event.message) {
      this.tickerElement.innerText = `[LOG] ${event.message}`;
    } else if (event.type === 'bump-attack' && event.attacker === 'player') {
      const p = gameState.activePokemon;
      const w = battleEngine.currentWild;
      if (p && w) {
        this.tickerElement.innerText = `[BATTLE] ${p.displayName} bumped wild ${w.displayName} for ${event.damage} dmg!`;
      }
    }
  }
}
