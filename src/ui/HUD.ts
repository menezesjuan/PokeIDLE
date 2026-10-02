import { gameState } from '../state/gameState';
import { battleEngine, CombatEvent } from '../state/battleEngine';
import { GAME_ITEMS } from '../api/itemsData';
import { GAME_ROUTES } from '../api/routesData';
import { bagModal } from './BagModal';
import { shopModal } from './ShopModal';
import { teamModal } from './TeamModal';
import { routesModal } from './RoutesModal';
import { reviveModal } from './ReviveModal';
import { logModal } from './LogModal';
import { activityLog } from '../state/activityLog';
import { backendClient } from '../api/authApi';
import { authModal } from './AuthModal';
import { marketModal } from './MarketModal';
import { pokedexModal } from './PokedexModal';
import { createIcon } from './icons';

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
  private topElement?: HTMLElement | null;
  private pogoMenuOverlay?: HTMLElement | null;
  private isPinned: boolean = false;
  private isCompact: boolean = false;
  private pipWindow: Window | null = null;

  constructor(hudContainerId: string, tickerContainerId: string, hudTopId: string = 'hud-top') {
    this.element = document.getElementById(hudContainerId)!;
    this.tickerElement = document.getElementById(tickerContainerId)!;
    this.topElement = document.getElementById(hudTopId);

    if (this.tickerElement) {
      this.tickerElement.style.cursor = 'pointer';
      this.tickerElement.title = 'Toque para abrir o Diário de Batalha';
      this.tickerElement.addEventListener('click', () => logModal.open());
    }

    this.createPogoMenuOverlay();

    this.render();
    gameState.subscribe(() => this.render());
    activityLog.subscribe(() => this.render());
    battleEngine.subscribe((event) => this.handleCombatEvent(event));

    window.addEventListener('open-market-search', () => {
      marketModal.open();
    });
  }

  private createPogoMenuOverlay(): void {
    if (document.getElementById('pokeball-menu-overlay')) {
      this.pogoMenuOverlay = document.getElementById('pokeball-menu-overlay');
      return;
    }

    this.pogoMenuOverlay = document.createElement('div');
    this.pogoMenuOverlay.id = 'pokeball-menu-overlay';
    this.pogoMenuOverlay.className = 'pogo-overlay-menu';
    document.body.appendChild(this.pogoMenuOverlay);

    this.pogoMenuOverlay.addEventListener('click', (e) => {
      if (e.target === this.pogoMenuOverlay) {
        this.closePogoMenu();
      }
    });
  }

  public openPogoMenu(): void {
    if (!this.pogoMenuOverlay) return;
    this.renderPogoMenuContent();
    this.pogoMenuOverlay.classList.add('active');
  }

  public closePogoMenu(): void {
    if (!this.pogoMenuOverlay) return;
    this.pogoMenuOverlay.classList.remove('active');
  }

  private renderPogoMenuContent(): void {
    if (!this.pogoMenuOverlay) return;

    const unread = activityLog.unreadCount;
    const s = gameState.settings;
    const user = backendClient.user;

    this.pogoMenuOverlay.innerHTML = `
      <div class="pogo-menu-grid">
        <!-- 1. Mochila -->
        <button class="pogo-menu-item" id="pogo-btn-bag">
          <div class="pogo-menu-circle purple">
            ${createIcon('bag', '', 26)}
          </div>
          <span class="pogo-menu-label">Mochila</span>
        </button>

        <!-- 2. Loja Poké Mart -->
        <button class="pogo-menu-item" id="pogo-btn-shop">
          <div class="pogo-menu-circle gold">
            ${createIcon('shop', '', 26)}
          </div>
          <span class="pogo-menu-label">Poké Mart</span>
        </button>

        <!-- 3. Mercado P2P -->
        <button class="pogo-menu-item" id="pogo-btn-market">
          <div class="pogo-menu-circle cyan">
            ${createIcon('market', '', 26)}
          </div>
          <span class="pogo-menu-label">Mercado P2P</span>
        </button>

        <!-- 4. Pokédex Art Model -->
        <button class="pogo-menu-item" id="pogo-btn-pokedex">
          <div class="pogo-menu-circle red">
            ${createIcon('pokedex', '', 26)}
          </div>
          <span class="pogo-menu-label">Pokédex Art</span>
        </button>

        <!-- 5. Equipe Pokémon -->
        <button class="pogo-menu-item" id="pogo-btn-team">
          <div class="pogo-menu-circle blue">
            ${createIcon('team', '', 26)}
          </div>
          <span class="pogo-menu-label">Equipe & Box</span>
        </button>

        <!-- 6. Rotas & Hunts -->
        <button class="pogo-menu-item" id="pogo-btn-routes">
          <div class="pogo-menu-circle green">
            ${createIcon('map', '', 26)}
          </div>
          <span class="pogo-menu-label">Rotas & Hunts</span>
        </button>

        <!-- 7. Diário de Batalha -->
        <button class="pogo-menu-item" id="pogo-btn-log">
          <div class="pogo-menu-circle cyan" style="position: relative;">
            ${createIcon('diary', '', 26)}
            ${unread > 0 ? `
              <span style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 9999px; font-size: 11px; padding: 2px 6px; font-weight: 800; border: 2px solid #ffffff;">
                ${unread}
              </span>
            ` : ''}
          </div>
          <span class="pogo-menu-label">Diário</span>
        </button>

        <!-- 8. Conta / Treinador -->
        <button class="pogo-menu-item" id="pogo-btn-auth">
          <div class="pogo-menu-circle slate">
            ${createIcon('user', '', 26)}
          </div>
          <span class="pogo-menu-label">${user ? 'Meu Perfil' : 'Login / Conta'}</span>
        </button>

        <!-- 9. Automações -->
        <button class="pogo-menu-item" id="pogo-btn-auto">
          <div class="pogo-menu-circle slate">
            ${createIcon('settings', '', 26)}
          </div>
          <span class="pogo-menu-label">Automações</span>
        </button>
      </div>

      <!-- Quick Toggles Sub-bar in Menu -->
      <div style="display: flex; gap: 8px; margin-bottom: 30px; flex-wrap: wrap; justify-content: center; max-width: 90%;">
        <button class="glass-pill ${s.autoHunt ? 'green' : ''}" id="pogo-toggle-hunt">
          ${createIcon('swords', '', 14)}
          <span>Auto-Caçar: <strong>${s.autoHunt ? 'ON' : 'OFF'}</strong></span>
        </button>
        <button class="glass-pill ${s.autoCatch ? 'green' : ''}" id="pogo-toggle-catch">
          ${createIcon('pokeball', '', 14)}
          <span>Auto-Captura: <strong>${s.autoCatch ? 'ON' : 'OFF'}</strong></span>
        </button>
        <button class="glass-pill ${s.autoPotion ? 'green' : ''}" id="pogo-toggle-heal">
          ${createIcon('heart', '', 14)}
          <span>Auto-Cura: <strong>${s.autoPotion ? 'ON' : 'OFF'}</strong></span>
        </button>
      </div>

      <!-- Close Button -->
      <button class="pogo-menu-close-btn" id="btn-close-pogo-menu" title="Fechar Menu">
        ${createIcon('close', '', 20)}
      </button>
    `;

    // Attach menu actions
    this.pogoMenuOverlay.querySelector('#pogo-btn-bag')?.addEventListener('click', () => {
      this.closePogoMenu();
      bagModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-shop')?.addEventListener('click', () => {
      this.closePogoMenu();
      shopModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-market')?.addEventListener('click', () => {
      this.closePogoMenu();
      marketModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-pokedex')?.addEventListener('click', () => {
      this.closePogoMenu();
      pokedexModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-team')?.addEventListener('click', () => {
      this.closePogoMenu();
      teamModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-routes')?.addEventListener('click', () => {
      this.closePogoMenu();
      routesModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-log')?.addEventListener('click', () => {
      this.closePogoMenu();
      logModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-auth')?.addEventListener('click', () => {
      this.closePogoMenu();
      authModal.open();
    });

    this.pogoMenuOverlay.querySelector('#pogo-btn-auto')?.addEventListener('click', () => {
      const next = !gameState.settings.autoHunt;
      gameState.updateSettings({ autoHunt: next });
      if (next && !battleEngine.isBattling) battleEngine.start();
      this.renderPogoMenuContent();
    });

    this.pogoMenuOverlay.querySelector('#pogo-toggle-hunt')?.addEventListener('click', () => {
      const next = !gameState.settings.autoHunt;
      gameState.updateSettings({ autoHunt: next });
      if (next && !battleEngine.isBattling) battleEngine.start();
      this.renderPogoMenuContent();
    });

    this.pogoMenuOverlay.querySelector('#pogo-toggle-catch')?.addEventListener('click', () => {
      gameState.updateSettings({ autoCatch: !gameState.settings.autoCatch });
      this.renderPogoMenuContent();
    });

    this.pogoMenuOverlay.querySelector('#pogo-toggle-heal')?.addEventListener('click', () => {
      gameState.updateSettings({ autoPotion: !gameState.settings.autoPotion });
      this.renderPogoMenuContent();
    });

    this.pogoMenuOverlay.querySelector('#btn-close-pogo-menu')?.addEventListener('click', () => {
      this.closePogoMenu();
    });
  }

  public render(): void {
    this.renderTopBar();
    this.renderBottomHub();
  }

  private renderTopBar(): void {
    if (!this.topElement) return;

    const currentRoute = GAME_ROUTES.find(r => r.id === gameState.currentRouteId) || GAME_ROUTES[0];
    const isFrontier = gameState.isAtFrontierRoute();
    const kills = gameState.routeKills[currentRoute.id] || 0;
    const reqKills = currentRoute.requiredKillsToUnlockNext || 15;
    const user = backendClient.user;

    // Apply atmospheric biome glow to battle container
    const phaserContainer = document.getElementById('phaser-container');
    if (phaserContainer) {
      phaserContainer.style.borderColor = `${currentRoute.ambientColor}66`;
      phaserContainer.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), 0 0 25px ${currentRoute.ambientColor}25`;
    }

    this.topElement.innerHTML = `
      <div class="hud-top-left">
        <!-- Hunt Route Pill with Biome styling -->
        <button class="glass-pill" id="btn-open-routes" style="border-color: ${currentRoute.ambientColor}80; box-shadow: 0 0 12px ${currentRoute.ambientColor}30;" title="${isFrontier ? 'Última Hunt (Auto-Avanço Ativo)' : 'Hunt Anterior (Treino Manual)'}">
          ${createIcon('map', '', 14)}
          <span>${currentRoute.name.split('(')[0]}</span>
          <span style="font-size: 10px; color: ${currentRoute.ambientColor}; font-weight: 700; background: ${currentRoute.ambientColor}20; padding: 1px 6px; border-radius: 9999px;">${currentRoute.biomeName}</span>
          <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">(${kills}/${reqKills})</span>
        </button>

        <!-- P2P Market Quick Pill -->
        <button class="glass-pill" id="btn-top-market" title="Mercado de Treinadores P2P">
          ${createIcon('market', 'accent-blue-icon', 14)}
          <span>Mercado P2P</span>
        </button>
      </div>

      <div class="hud-top-right">
        <!-- Trainer Account Pill -->
        <button class="glass-pill" id="btn-top-auth" title="Conta de Treinador (SQLite)">
          ${createIcon('user', '', 14)}
          <span>${user ? user.trainer_name : 'Entrar'}</span>
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${user ? '#34d399' : '#94a3b8'}; box-shadow: 0 0 6px ${user ? '#34d399' : '#94a3b8'};"></span>
        </button>

        <!-- Pokédollars Pill -->
        <button class="glass-pill gold" id="btn-top-shop" title="Abrir Poké Mart">
          ${createIcon('coin', 'gold-icon', 14)}
          <span>₽ ${gameState.money.toLocaleString()}</span>
        </button>

        <!-- Pin / PiP Window Button -->
        <button class="glass-pill icon-only" id="btn-toggle-pin" title="Fixar no topo / Janela PiP">
          ${createIcon('pin', '', 14)}
        </button>

        <!-- Compact Toggle -->
        <button class="glass-pill icon-only" id="btn-toggle-compact" title="Alternar modo compacto">
          ${createIcon('compact', '', 14)}
        </button>
      </div>
    `;

    this.topElement.querySelector('#btn-open-routes')?.addEventListener('click', () => routesModal.open());
    this.topElement.querySelector('#btn-top-market')?.addEventListener('click', () => marketModal.open());
    this.topElement.querySelector('#btn-top-auth')?.addEventListener('click', () => authModal.open());
    this.topElement.querySelector('#btn-top-shop')?.addEventListener('click', () => shopModal.open());

    // Window Pinning & PiP Miniplayer
    this.topElement.querySelector('#btn-toggle-pin')?.addEventListener('click', async () => {
      if (window.electronAPI?.toggleAlwaysOnTop) {
        this.isPinned = !this.isPinned;
        window.electronAPI.toggleAlwaysOnTop(this.isPinned);
        window.electronAPI.setCompactMode(this.isPinned);
        this.render();
      } else if ('documentPictureInPicture' in window) {
        await this.toggleDocumentPip();
      } else {
        window.open(window.location.href, 'PokeIDLE_PiP', 'width=440,height=280,status=no,toolbar=no,menubar=no,location=no');
      }
    });

    // Compact Mode
    this.topElement.querySelector('#btn-toggle-compact')?.addEventListener('click', () => {
      this.isCompact = !this.isCompact;
      document.body.classList.toggle('compact-mode', this.isCompact);
      if (window.electronAPI?.setCompactMode) {
        window.electronAPI.setCompactMode(this.isCompact);
      }
      this.render();
    });
  }

  private renderBottomHub(): void {
    const s = gameState.settings;
    const active = gameState.activePokemon;
    const hasConscious = gameState.hasConsciousPartyMember;
    const aliveCount = gameState.party.filter(p => p.currentHp > 0).length;
    const unread = activityLog.unreadCount;

    this.element.innerHTML = `
      <!-- Left: Buddy Leader Profile Pill -->
      <div class="pogo-buddy-card" id="btn-open-team" title="Ver Equipe Pokémon">
        <div class="pogo-buddy-avatar">
          <img src="${active ? active.spriteFront : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'}" />
          ${active ? `<div class="pogo-buddy-level">${active.level}</div>` : ''}
        </div>
        <div class="pogo-buddy-info">
          <div class="pogo-buddy-name">${active ? active.displayName : 'Equipe'}</div>
          <div class="pogo-buddy-hp">
            ${active ? `${active.currentHp}/${active.maxHp} HP` : ''}
            <span style="color: ${aliveCount > 0 ? '#38bdf8' : '#ef4444'}; font-size: 9px; margin-left: 4px;">
              (${aliveCount}/${gameState.party.length})
            </span>
          </div>
        </div>
      </div>

      <!-- Center: 3D Pokémon GO Poké Ball Menu Button -->
      <div class="pogo-pokeball-btn-wrapper">
        <button class="pogo-pokeball-btn" id="btn-pokeball-menu" title="Abrir Menu Pokémon GO">
          <div class="pogo-pokeball-center"></div>
        </button>
      </div>

      <!-- Right: Quick Actions & Automation Status -->
      <div class="pogo-quick-group">
        ${!hasConscious ? `
          <button class="glass-pill" id="btn-open-revive" style="background: rgba(239, 68, 68, 0.35); border-color: #ef4444; color: #fca5a5;">
            ${createIcon('skull', 'red-icon', 14)}
            <span>Reviver (₽ 10)</span>
          </button>
        ` : `
          <!-- Quick Automation Toggles Pill -->
          <button class="pogo-quick-btn" id="btn-quick-auto-toggle" title="Auto-Caçar / Auto-Captura / Auto-Cura">
            ${createIcon('settings', '', 14)}
            <div style="display: flex; gap: 4px; align-items: center;">
              <span class="status-dot ${s.autoHunt ? 'on' : ''}" title="Auto-Hunt"></span>
              <span class="status-dot ${s.autoCatch ? 'on' : ''}" title="Auto-Catch"></span>
              <span class="status-dot ${s.autoPotion ? 'on' : ''}" title="Auto-Heal"></span>
            </div>
          </button>

          <!-- Quick Diário Button -->
          <button class="pogo-quick-btn ${unread > 0 ? 'active' : ''}" id="btn-quick-log" title="Diário de Batalha">
            ${createIcon('diary', '', 14)}
            ${unread > 0 ? `<span style="background: #ef4444; color: white; padding: 1px 5px; border-radius: 9999px; font-size: 9px; font-weight: 800;">${unread}</span>` : ''}
          </button>
        `}
      </div>
    `;

    // Attach bottom events
    this.element.querySelector('#btn-open-team')?.addEventListener('click', () => teamModal.open());
    this.element.querySelector('#btn-pokeball-menu')?.addEventListener('click', () => this.openPogoMenu());
    this.element.querySelector('#btn-open-revive')?.addEventListener('click', () => reviveModal.open());
    this.element.querySelector('#btn-quick-log')?.addEventListener('click', () => logModal.open());

    this.element.querySelector('#btn-quick-auto-toggle')?.addEventListener('click', () => {
      const next = !gameState.settings.autoHunt;
      gameState.updateSettings({ autoHunt: next });
      if (next && !battleEngine.isBattling) battleEngine.start();
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
      placeholder.innerHTML = '<div><strong>PokeIDLE está ativo na janela PiP (Miniplayer) no canto da tela!</strong><br><br><span style="font-size: 12px; color: #60a5fa;">Feche a janela flutuante para restaurar aqui.</span></div>';

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
    if (event.type === 'item-drops' && event.drops) {
      this.tickerElement.innerHTML = `<span style="color: #facc15; font-weight: 700;">[DROPS]</span> ${event.drops.map(d => `<strong style="color: ${d.category === 'ball' ? '#38bdf8' : '#4ade80'};">+${d.count}x ${d.name}</strong>`).join(' &nbsp;•&nbsp; ')}`;
    } else if (event.message) {
      this.tickerElement.innerText = `[REGISTRO] ${event.message}`;
    } else if (event.type === 'bump-attack' && event.attacker === 'player') {
      const p = gameState.activePokemon;
      const w = battleEngine.currentWild;
      if (p && w) {
        this.tickerElement.innerText = `[BATALHA] ${p.displayName} atacou ${w.displayName} causando ${event.damage} de dano!`;
      }
    }

    if (event.type === 'team-fainted') {
      reviveModal.open();
      this.render();
    } else if (event.type === 'route-advanced') {
      this.render();
    }
  }
}
