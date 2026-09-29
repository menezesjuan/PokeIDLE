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

    if (this.tickerElement) {
      this.tickerElement.style.cursor = 'pointer';
      this.tickerElement.title = 'Clique para abrir o Diário de Aventuras e Resumo Idle';
      this.tickerElement.addEventListener('click', () => logModal.open());
    }

    this.render();
    gameState.subscribe(() => this.render());
    activityLog.subscribe(() => this.render());
    battleEngine.subscribe((event) => this.handleCombatEvent(event));
  }

  public render(): void {
    const s = gameState.settings;
    const currentRoute = GAME_ROUTES.find(r => r.id === gameState.currentRouteId) || GAME_ROUTES[0];
    const preferredBallItem = GAME_ITEMS[s.preferredBall] || GAME_ITEMS['poke-ball'];
    const preferredPotionItem = GAME_ITEMS[s.preferredPotion] || GAME_ITEMS['potion'];
    const isFrontier = gameState.isAtFrontierRoute();
    const hasConscious = gameState.hasConsciousPartyMember;
    const aliveCount = gameState.party.filter(p => p.currentHp > 0).length;
    const faintedCount = gameState.party.length - aliveCount;

    this.element.innerHTML = `
      <div class="hud-left">
        <div class="money-badge">
          <span class="icon">₽</span>
          <span>${gameState.money.toLocaleString()}</span>
        </div>

        <button class="nav-action-btn secondary" id="btn-open-routes" title="${isFrontier ? 'Última Hunt (Auto-Avanço Ativo)' : 'Hunt Anterior (Treino Manual)'}">
          ${isFrontier ? '⚡' : '🌾'} ${currentRoute.name.split('(')[0]}
        </button>
      </div>

      <div class="hud-center">
        ${!hasConscious ? `
          <button class="idle-toggle-btn active red" id="btn-open-revive" style="font-weight: 700; padding: 6px 14px;">
            💀 Equipe Derrotada! [Reviver / Trocar Equipe (₽ 10)]
          </button>
        ` : `
          <!-- Auto-Hunt Toggle -->
          <button class="idle-toggle-btn ${s.autoHunt ? 'active' : ''}" id="toggle-hunt" title="Alternar caça automática de Pokémon selvagens">
            ⚔️ Auto-Caçar: <strong>${s.autoHunt ? 'LIGADO' : 'DESLIGADO'}</strong>
          </button>

          <!-- Auto-Catch Toggle -->
          <button class="idle-toggle-btn ${s.autoCatch ? 'active' : ''}" id="toggle-catch" title="Alternar captura automática usando a Pokébola preferida">
            <img src="${preferredBallItem.spriteUrl}" style="width: 16px; height: 16px; vertical-align: middle;" />
            Auto-Captura: <strong>${s.autoCatch ? 'LIGADO' : 'DESLIGADO'}</strong>
          </button>

          <!-- Auto-Heal Toggle -->
          <button class="idle-toggle-btn ${s.autoPotion ? 'active' : ''}" id="toggle-potion" title="Alternar cura automática com poções quando o HP estiver baixo">
            <img src="${preferredPotionItem.spriteUrl}" style="width: 16px; height: 16px; vertical-align: middle;" />
            Auto-Cura &le;${s.autoPotionThreshold}%: <strong>${s.autoPotion ? 'LIGADO' : 'DESLIGADO'}</strong>
          </button>
        `}
      </div>

      <div class="hud-right">
        ${faintedCount > 0 ? `
          <button class="nav-action-btn red" id="btn-quick-revive" title="Reviver Pokémons desmaiados">
            💀 Reviver (${faintedCount})
          </button>
        ` : ''}

        <button class="nav-action-btn warning" id="btn-open-shop" title="Abrir a Loja Poké Mart">
          🛒 Loja
        </button>
        <button class="nav-action-btn purple" id="btn-open-bag" title="Abrir a Mochila de Itens">
          🎒 Mochila (${Object.values(gameState.inventory).reduce((a, b) => a + b, 0)})
        </button>
        <button class="nav-action-btn" id="btn-open-team" title="Gerenciar Equipe de Combate e Box">
          👥 Equipe (${aliveCount}/${gameState.party.length})
        </button>
        <button class="nav-action-btn ${activityLog.unreadCount > 0 ? 'gold' : 'secondary'}" id="btn-open-log" title="Diário de Batalha & Histórico de Atividades">
          📜 Diário de Batalha${activityLog.unreadCount > 0 ? ` <span style="background: #ef4444; color: white; padding: 1px 5px; border-radius: 9999px; font-size: 10px; font-weight: 800; margin-left: 2px;">${activityLog.unreadCount}</span>` : ''}
        </button>

        <!-- Taskbar / Electron Window options -->
        <button class="nav-action-btn secondary" id="btn-toggle-pin" title="Fixar janela sempre no topo (Miniplayer)">
          ${this.isPinned ? '📌 Fixado' : '📍 Fixar'}
        </button>
        <button class="nav-action-btn secondary" id="btn-toggle-compact" title="Alternar modo barra compacta">
          ${this.isCompact ? 'Expandir' : 'Compactar'}
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
    this.element.querySelector('#btn-open-log')?.addEventListener('click', () => logModal.open());
    this.element.querySelector('#btn-open-revive')?.addEventListener('click', () => reviveModal.open());
    this.element.querySelector('#btn-quick-revive')?.addEventListener('click', () => reviveModal.open());

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
    if (event.type === 'item-drops' && event.drops) {
      this.tickerElement.innerHTML = `<span style="color: #facc15; font-weight: 700;">🎁 [DROPS]</span> ${event.drops.map(d => `<strong style="color: ${d.category === 'ball' ? '#38bdf8' : '#4ade80'};">+${d.count}x ${d.name}</strong>`).join(' &nbsp;•&nbsp; ')}`;
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
