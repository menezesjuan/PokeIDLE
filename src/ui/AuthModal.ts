import { backendClient, AuthUser } from '../api/authApi';
import { gameState } from '../state/gameState';
import { createIcon } from './icons';

export class AuthModal {
  private overlay: HTMLElement | null = null;
  private isRegisterMode: boolean = false;
  private onAuthSuccessCallback?: (user: AuthUser) => void;

  public open(onSuccess?: (user: AuthUser) => void): void {
    this.onAuthSuccessCallback = onSuccess;
    this.createModal();
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private createModal(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay auth-modal-overlay';
    this.renderContent();
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  private renderContent(): void {
    if (!this.overlay) return;

    const user = backendClient.user;

    this.overlay.innerHTML = `
      <div class="modal-content auth-modal-content">
        <div class="modal-header">
          <div class="modal-title">
            ${createIcon(user ? 'trainer' : 'user', 'accent-blue-icon')}
            <span>${user ? 'Perfil do Treinador' : (this.isRegisterMode ? 'Cadastro de Treinador' : 'Acesso ao PokeIDLE')}</span>
          </div>
          <button class="modal-close-btn" id="btn-close-auth">
            ${createIcon('close')}
          </button>
        </div>

        <div class="modal-body auth-modal-body">
          ${user ? this.renderProfileView(user) : this.renderAuthForm()}
        </div>
      </div>
    `;

    this.overlay.querySelector('#btn-close-auth')?.addEventListener('click', () => this.close());
    this.attachEvents();
  }

  private renderProfileView(user: AuthUser): string {
    return `
      <div class="auth-profile-box">
        <div class="auth-profile-avatar">
          <img src="${user.avatar || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/red.png'}" alt="Avatar" />
        </div>
        <div class="auth-profile-details">
          <h3 class="auth-profile-name">${user.trainer_name}</h3>
          <p class="auth-profile-username">@${user.username} • ID #${user.id}</p>
          <div class="auth-profile-stat">
            ${createIcon('coin', 'gold-icon', 14)}
            <span>₽ ${gameState.money.toLocaleString()} Pokécoins</span>
          </div>
        </div>
      </div>

      <div class="auth-cloud-status">
        <div class="auth-cloud-indicator">
          ${createIcon('cloud', 'green-icon', 16)}
          <span>Progresso salvo no banco de dados SQLite</span>
        </div>
        <button class="art-primary-btn compact" id="btn-manual-cloud-save">
          ${createIcon('refresh', '', 14)}
          <span>Salvar Agora na Nuvem</span>
        </button>
      </div>

      <div class="auth-actions-row">
        <button class="art-secondary-btn danger" id="btn-logout-user">
          ${createIcon('close', '', 14)}
          <span>Encerrar Sessão</span>
        </button>
      </div>
    `;
  }

  private renderAuthForm(): string {
    return `
      <div class="auth-form-intro">
        <p>Crie sua conta ou faça login para participar do <strong>Mercado de Treinadores (P2P)</strong> e sincronizar seu progresso no SQLite!</p>
      </div>

      <form id="auth-form" class="auth-form">
        <div class="auth-input-group">
          <label for="auth-username">Nome de Usuário</label>
          <div class="auth-input-wrapper">
            ${createIcon('user', 'input-icon', 16)}
            <input type="text" id="auth-username" placeholder="ex: red_kanto" required autocomplete="username" />
          </div>
        </div>

        ${this.isRegisterMode ? `
          <div class="auth-input-group">
            <label for="auth-trainer-name">Nome do Treinador (Exibição)</label>
            <div class="auth-input-wrapper">
              ${createIcon('sparkles', 'input-icon', 16)}
              <input type="text" id="auth-trainer-name" placeholder="ex: Treinador Red" required />
            </div>
          </div>
        ` : ''}

        <div class="auth-input-group">
          <label for="auth-password">Senha</label>
          <div class="auth-input-wrapper">
            ${createIcon('shield', 'input-icon', 16)}
            <input type="password" id="auth-password" placeholder="••••••••" required autocomplete="current-password" />
          </div>
        </div>

        <div id="auth-error-msg" class="auth-error-msg" style="display: none;"></div>

        <button type="submit" class="art-primary-btn full-width" id="btn-submit-auth">
          <span>${this.isRegisterMode ? 'Cadastrar e Iniciar' : 'Entrar na Conta'}</span>
          ${createIcon('arrow-right', '', 16)}
        </button>

        <div class="auth-switch-mode">
          ${this.isRegisterMode ? `
            <span>Já possui uma conta?</span>
            <button type="button" class="auth-link-btn" id="btn-toggle-mode">Fazer Login</button>
          ` : `
            <span>Novo treinador por aqui?</span>
            <button type="button" class="auth-link-btn" id="btn-toggle-mode">Criar Conta Grátis</button>
          `}
        </div>
      </form>
    `;
  }

  private attachEvents(): void {
    if (!this.overlay) return;

    // Toggle between login and register
    this.overlay.querySelector('#btn-toggle-mode')?.addEventListener('click', () => {
      this.isRegisterMode = !this.isRegisterMode;
      this.renderContent();
    });

    // Form submission
    const form = this.overlay.querySelector('#auth-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = (this.overlay?.querySelector('#auth-username') as HTMLInputElement)?.value.trim();
        const password = (this.overlay?.querySelector('#auth-password') as HTMLInputElement)?.value.trim();
        const trainerName = (this.overlay?.querySelector('#auth-trainer-name') as HTMLInputElement)?.value.trim();
        const errorEl = this.overlay?.querySelector('#auth-error-msg') as HTMLElement;

        if (!username || !password) return;

        let result;
        if (this.isRegisterMode) {
          result = await backendClient.register(username, password, trainerName);
        } else {
          result = await backendClient.login(username, password);
        }

        if (result.success && result.user) {
          // Sync with cloud save if existing
          const cloudSave = await backendClient.loadCloud();
          if (cloudSave) {
            // Merge or update money
            if (cloudSave.money) gameState.money = cloudSave.money;
            if (cloudSave.party && cloudSave.party.length > 0) gameState.party = cloudSave.party;
            if (cloudSave.box) gameState.box = cloudSave.box;
            if (cloudSave.inventory) gameState.inventory = cloudSave.inventory;
            gameState.notify();
          } else {
            // First time saving
            await backendClient.saveCloud({
              money: gameState.money,
              inventory: gameState.inventory,
              party: gameState.party,
              box: gameState.box,
              currentRouteId: gameState.currentRouteId,
              unlockedRoutes: gameState.unlockedRoutes,
              routeKills: gameState.routeKills,
              settings: gameState.settings,
              stats: gameState.stats,
            });
          }

          if (this.onAuthSuccessCallback) {
            this.onAuthSuccessCallback(result.user);
          }
          this.renderContent();
        } else {
          if (errorEl) {
            errorEl.innerText = result.error || 'Ocorreu um erro.';
            errorEl.style.display = 'block';
          }
        }
      });
    }

    // Manual cloud save
    this.overlay.querySelector('#btn-manual-cloud-save')?.addEventListener('click', async () => {
      const btn = this.overlay?.querySelector('#btn-manual-cloud-save') as HTMLButtonElement;
      if (btn) btn.innerText = 'Salvando...';
      await backendClient.saveCloud({
        money: gameState.money,
        inventory: gameState.inventory,
        party: gameState.party,
        box: gameState.box,
        currentRouteId: gameState.currentRouteId,
        unlockedRoutes: gameState.unlockedRoutes,
        routeKills: gameState.routeKills,
        settings: gameState.settings,
        stats: gameState.stats,
      });
      if (btn) btn.innerHTML = `${createIcon('check', '', 14)} <span>Salvo com Sucesso!</span>`;
      setTimeout(() => {
        if (btn) btn.innerHTML = `${createIcon('refresh', '', 14)} <span>Salvar Agora na Nuvem</span>`;
      }, 2000);
    });

    // Logout
    this.overlay.querySelector('#btn-logout-user')?.addEventListener('click', () => {
      backendClient.logout();
      this.renderContent();
    });
  }
}

export const authModal = new AuthModal();
