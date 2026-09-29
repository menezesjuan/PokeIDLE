import { activityLog, LogCategory, LogEntry, IdleSessionStats } from '../state/activityLog';

export class LogModal {
  private container: HTMLElement | null = null;
  private currentCategory: LogCategory = 'all';
  private unsubscribe?: () => void;

  public open(defaultCategory: LogCategory = 'all'): void {
    this.close();
    this.currentCategory = defaultCategory;
    activityLog.markAllAsRead();

    this.container = document.createElement('div');
    this.container.className = 'modal-overlay';
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.close();
    });

    this.render();
    document.body.appendChild(this.container);

    this.unsubscribe = activityLog.subscribe(() => {
      if (this.container) {
        this.render();
      }
    });
  }

  public close(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  private formatDuration(ms: number): string {
    const totalSecs = Math.max(1, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }

  private render(): void {
    if (!this.container) return;

    const allLogs = activityLog.getLogs('all');
    const filteredLogs = activityLog.getLogs(this.currentCategory);
    const idleLogsCount = allLogs.filter(l => l.wasIdle).length;

    // Check if we have an idle summary to show
    const summary = activityLog.lastCompletedIdleSummary || 
      (activityLog.currentIdleStats.entriesCount > 0 ? activityLog.currentIdleStats : null);

    this.container.innerHTML = `
      <div class="modal-content" style="max-width: 680px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header">
          <div>
            <div class="modal-title">📜 Diário de Batalha</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
              Histórico detalhado de combates, capturas, drops e eventos enquanto você esteve inativo.
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn-small red" id="btn-clear-logs" style="font-size: 11px; padding: 4px 10px;">
              Limpar Diário
            </button>
            <button class="modal-close-btn" id="log-close">✕</button>
          </div>
        </div>

        <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 12px 16px;">
          <!-- Idle Summary Card -->
          ${summary && summary.entriesCount > 0 ? this.renderIdleSummary(summary) : ''}

          <!-- Filter Tabs -->
          <div class="modal-tabs" style="margin-bottom: 12px; gap: 4px; overflow-x: auto; padding-bottom: 4px;">
            <button class="modal-tab-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">
              Todos (${allLogs.length})
            </button>
            <button class="modal-tab-btn ${this.currentCategory === 'idle' ? 'active' : ''}" data-cat="idle" style="${idleLogsCount > 0 ? 'border-color: #facc15; color: #facc15;' : ''}">
              😴 Enquanto Ausente (${idleLogsCount})
            </button>
            <button class="modal-tab-btn ${this.currentCategory === 'drop' ? 'active' : ''}" data-cat="drop">
              🎁 Drops
            </button>
            <button class="modal-tab-btn ${this.currentCategory === 'catch' ? 'active' : ''}" data-cat="catch">
              🎯 Capturas
            </button>
            <button class="modal-tab-btn ${this.currentCategory === 'battle' ? 'active' : ''}" data-cat="battle">
              ⚔️ Vitórias
            </button>
            <button class="modal-tab-btn ${this.currentCategory === 'level' ? 'active' : ''}" data-cat="level">
              ⚡ Níveis
            </button>
            <button class="modal-tab-btn ${this.currentCategory === 'defeat' ? 'active' : ''}" data-cat="defeat">
              💀 Derrotas
            </button>
          </div>

          <!-- Entries List -->
          ${filteredLogs.length === 0 ? `
            <div style="text-align: center; color: #64748b; padding: 40px 0; font-size: 13px;">
              Nenhum registro encontrado nesta categoria.<br>
              <span style="font-size: 11px; color: #475569;">Conforme seus Pokémons batalham e você fica ausente, novos eventos aparecerão aqui.</span>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${filteredLogs.map(log => this.renderLogItem(log)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderIdleSummary(summary: IdleSessionStats): string {
    const itemsList = Object.entries(summary.itemsCollected)
      .map(([name, count]) => `<span style="background: rgba(0,0,0,0.3); padding: 1px 6px; border-radius: 4px; color: #38bdf8;">+${count}x ${name}</span>`)
      .join(' ');

    const durationText = summary.idleDurationMs > 0 ? this.formatDuration(summary.idleDurationMs) : 'Recente';

    return `
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-bottom: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">💤</span>
            <span style="font-weight: 700; font-size: 13px; color: #60a5fa;">
              Resumo do Período Idle (Enquanto você esteve fora)
            </span>
          </div>
          <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
            ⏱️ Ausente por: ${durationText}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; font-size: 11px;">
          <div style="background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            <div style="color: #94a3b8;">⚔️ Vitórias</div>
            <div style="font-size: 15px; font-weight: 700; color: #34d399;">${summary.battlesWon}</div>
          </div>

          <div style="background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            <div style="color: #94a3b8;">🪙 Moedas Obtidas</div>
            <div style="font-size: 15px; font-weight: 700; color: #fbbf24;">+₽ ${summary.moneyEarned.toLocaleString()}</div>
          </div>

          <div style="background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            <div style="color: #94a3b8;">🎯 Capturas</div>
            <div style="font-size: 15px; font-weight: 700; color: #facc15;">${summary.pokemonCaught.length}</div>
          </div>

          <div style="background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            <div style="color: #94a3b8;">⚡ Níveis Ganhos</div>
            <div style="font-size: 15px; font-weight: 700; color: #a78bfa;">+${summary.levelsGained}</div>
          </div>

          ${summary.defeats > 0 ? `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px; border-radius: 6px;">
              <div style="color: #fca5a5;">💀 Derrotas</div>
              <div style="font-size: 15px; font-weight: 700; color: #ef4444;">${summary.defeats}</div>
            </div>
          ` : ''}
        </div>

        ${itemsList ? `
          <div style="margin-top: 10px; font-size: 11px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <strong style="color: #facc15;">🎁 Itens Coletados:</strong>
            ${itemsList}
          </div>
        ` : ''}

        ${summary.pokemonCaught.length > 0 ? `
          <div style="margin-top: 6px; font-size: 11px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <strong style="color: #facc15;">✨ Capturados:</strong>
            <span style="color: #cbd5e1;">${summary.pokemonCaught.join(', ')}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderLogItem(log: LogEntry): string {
    return `
      <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid ${log.color}; border-radius: 6px; padding: 8px 12px; display: flex; gap: 10px; align-items: flex-start;">
        <div style="font-size: 16px; line-height: 1.2;">
          ${log.icon}
        </div>

        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-weight: 700; font-size: 12px; color: ${log.color};">
                ${log.title}
              </span>
              ${log.wasIdle ? `
                <span style="font-size: 9px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); padding: 1px 5px; border-radius: 4px; font-weight: 700;">
                  AUSENTE
                </span>
              ` : ''}
            </div>

            <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b;">
              ${log.formattedTime}
            </span>
          </div>

          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.35;">
            ${log.description}
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    this.container.querySelector('#log-close')?.addEventListener('click', () => this.close());

    this.container.querySelector('#btn-clear-logs')?.addEventListener('click', () => {
      activityLog.clearLogs();
      this.render();
    });

    const tabButtons = this.container.querySelectorAll('.modal-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as LogCategory;
        if (cat) {
          this.currentCategory = cat;
          this.render();
        }
      });
    });
  }
}

export const logModal = new LogModal();
