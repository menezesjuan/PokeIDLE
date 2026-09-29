import { battleEngine, CombatEvent } from './battleEngine';
import { gameState } from './gameState';
import { GAME_ITEMS } from '../api/itemsData';
import { GAME_ROUTES } from '../api/routesData';

export type LogCategory = 'all' | 'idle' | 'battle' | 'drop' | 'catch' | 'level' | 'defeat' | 'route';

export interface LogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  category: LogCategory;
  icon: string;
  title: string;
  description: string;
  wasIdle: boolean;
  color: string;
}

export interface IdleSessionStats {
  idleDurationMs: number;
  battlesWon: number;
  moneyEarned: number;
  expEarned: number;
  itemsCollected: Record<string, number>;
  pokemonCaught: string[];
  levelsGained: number;
  defeats: number;
  routesAdvanced: string[];
  entriesCount: number;
}

export type ActivityLogListener = () => void;

class ActivityLogManager {
  private logs: LogEntry[] = [];
  private readonly maxLogs: number = 200;
  private listeners: Set<ActivityLogListener> = new Set();

  // Idle tracking
  private lastUserInteraction: number = Date.now();
  private isUserIdle: boolean = false;
  private idleStartTime: number | null = null;
  private readonly IDLE_THRESHOLD_MS = 15000; // 15 seconds without interaction considered idle
  private unreadIdleCount: number = 0;

  // Accumulated stats for current/last idle session
  public currentIdleStats: IdleSessionStats = this.createEmptyStats();
  public lastCompletedIdleSummary: (IdleSessionStats & { endedAt: number }) | null = null;

  constructor() {
    this.setupUserActivityListeners();
    this.setupCombatListeners();
  }

  public subscribe(listener: ActivityLogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in activity log listener:', e);
      }
    }
  }

  private createEmptyStats(): IdleSessionStats {
    return {
      idleDurationMs: 0,
      battlesWon: 0,
      moneyEarned: 0,
      expEarned: 0,
      itemsCollected: {},
      pokemonCaught: [],
      levelsGained: 0,
      defeats: 0,
      routesAdvanced: [],
      entriesCount: 0,
    };
  }

  private setupUserActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const recordActivity = () => {
      const now = Date.now();
      const elapsedSinceLastInteraction = now - this.lastUserInteraction;

      if (this.isUserIdle && elapsedSinceLastInteraction >= this.IDLE_THRESHOLD_MS) {
        // User has returned from idle!
        if (this.idleStartTime) {
          const duration = now - this.idleStartTime;
          this.currentIdleStats.idleDurationMs = duration;

          if (this.currentIdleStats.entriesCount > 0) {
            this.lastCompletedIdleSummary = {
              ...this.currentIdleStats,
              endedAt: now,
            };
          }
        }

        this.isUserIdle = false;
        this.idleStartTime = null;
        this.notify();
      }

      this.lastUserInteraction = now;
    };

    // Listen to user inputs
    window.addEventListener('mousemove', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity, { passive: true });
    window.addEventListener('click', recordActivity, { passive: true });
    window.addEventListener('touchstart', recordActivity, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Minimized or switched tab - instantly treat as idle
        if (!this.isUserIdle) {
          this.isUserIdle = true;
          this.idleStartTime = Date.now();
          this.currentIdleStats = this.createEmptyStats();
        }
      } else {
        recordActivity();
      }
    });

    // Heartbeat check for idle threshold
    setInterval(() => {
      const now = Date.now();
      if (!this.isUserIdle && (now - this.lastUserInteraction >= this.IDLE_THRESHOLD_MS)) {
        this.isUserIdle = true;
        this.idleStartTime = this.lastUserInteraction;
        this.currentIdleStats = this.createEmptyStats();
        this.notify();
      }
    }, 2000);
  }

  private setupCombatListeners(): void {
    battleEngine.subscribe((event: CombatEvent) => {
      this.handleCombatEvent(event);
    });
  }

  private handleCombatEvent(event: CombatEvent): void {
    const isIdle = this.isUserIdle || (Date.now() - this.lastUserInteraction >= this.IDLE_THRESHOLD_MS);

    switch (event.type) {
      case 'pokemon-faint': {
        const wild = event.wildPokemon;
        const player = gameState.activePokemon;
        if (wild) {
          this.addEntry({
            category: 'battle',
            icon: '⚔️',
            title: `Vitória: ${wild.displayName}`,
            description: `${player ? player.displayName : 'Equipe'} venceu o selvagem ${wild.displayName} Lv.${wild.level} (+${wild.rewardExp} EXP, +₽ ${wild.rewardMoney}).`,
            color: '#60a5fa',
            wasIdle: isIdle,
          });

          if (isIdle) {
            this.currentIdleStats.battlesWon++;
            this.currentIdleStats.moneyEarned += wild.rewardMoney;
            this.currentIdleStats.expEarned += wild.rewardExp;
            this.currentIdleStats.entriesCount++;
          }
        }
        break;
      }

      case 'catch-success': {
        const wild = event.wildPokemon;
        const ballItem = event.ballId ? GAME_ITEMS[event.ballId] : null;
        if (wild) {
          this.addEntry({
            category: 'catch',
            icon: '🎯',
            title: `Captura: ${wild.displayName}`,
            description: `Você capturou ${wild.displayName} (Lv.${wild.level}) usando ${ballItem?.name || 'Poké Ball'}!`,
            color: '#facc15',
            wasIdle: isIdle,
          });

          if (isIdle) {
            this.currentIdleStats.pokemonCaught.push(`${wild.displayName} (Lv.${wild.level})`);
            this.currentIdleStats.battlesWon++;
            this.currentIdleStats.entriesCount++;
          }
        }
        break;
      }

      case 'item-drops': {
        if (event.drops && event.drops.length > 0) {
          const dropsSummary = event.drops.map(d => `+${d.count}x ${d.name}`).join(', ');
          this.addEntry({
            category: 'drop',
            icon: '🎁',
            title: 'Drops de Hunt',
            description: `Recompensas da área: ${dropsSummary}.`,
            color: '#38bdf8',
            wasIdle: isIdle,
          });

          if (isIdle) {
            for (const d of event.drops) {
              this.currentIdleStats.itemsCollected[d.name] = (this.currentIdleStats.itemsCollected[d.name] || 0) + d.count;
            }
            this.currentIdleStats.entriesCount++;
          }
        }
        break;
      }

      case 'level-up': {
        const player = gameState.activePokemon;
        if (player) {
          this.addEntry({
            category: 'level',
            icon: '⚡',
            title: `Level Up: ${player.displayName}`,
            description: `${player.displayName} alcançou o Nível ${player.level}! Atributos aumentados.`,
            color: '#34d399',
            wasIdle: isIdle,
          });

          if (isIdle) {
            this.currentIdleStats.levelsGained++;
            this.currentIdleStats.entriesCount++;
          }
        }
        break;
      }

      case 'evolution': {
        const player = gameState.activePokemon;
        if (player) {
          this.addEntry({
            category: 'level',
            icon: '🌟',
            title: `Evolução: ${player.displayName}!`,
            description: `Parabéns! Seu Pokémon evoluiu para ${player.displayName}!`,
            color: '#e879f9',
            wasIdle: isIdle,
          });

          if (isIdle) {
            this.currentIdleStats.entriesCount++;
          }
        }
        break;
      }

      case 'team-fainted': {
        const currentRoute = GAME_ROUTES.find(r => r.id === gameState.currentRouteId) || GAME_ROUTES[0];
        this.addEntry({
          category: 'defeat',
          icon: '💀',
          title: 'Equipe Derrotada!',
          description: `Todos os seus Pokémon desmaiaram em ${currentRoute.name}. O combate pausou para você reviver ou trocar a equipe.`,
          color: '#ef4444',
          wasIdle: isIdle,
        });

        if (isIdle) {
          this.currentIdleStats.defeats++;
          this.currentIdleStats.entriesCount++;
        }
        break;
      }

      case 'route-advanced': {
        this.addEntry({
          category: 'route',
          icon: '🚀',
          title: 'Nova Área Desbloqueada!',
          description: event.message || 'Sua equipe avançou automaticamente para a próxima hunt!',
          color: '#a78bfa',
          wasIdle: isIdle,
        });

        if (isIdle) {
          this.currentIdleStats.routesAdvanced.push(event.message || 'Nova Hunt');
          this.currentIdleStats.entriesCount++;
        }
        break;
      }
    }
  }

  public addEntry(entryData: Omit<LogEntry, 'id' | 'timestamp' | 'formattedTime'>): void {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const entry: LogEntry = {
      ...entryData,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      formattedTime,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (entry.wasIdle) {
      this.unreadIdleCount++;
    }

    this.notify();
  }

  public getLogs(category: LogCategory = 'all'): LogEntry[] {
    if (category === 'all') return [...this.logs];
    if (category === 'idle') return this.logs.filter(l => l.wasIdle);
    return this.logs.filter(l => l.category === category);
  }

  public get unreadCount(): number {
    return this.unreadIdleCount;
  }

  public get isIdle(): boolean {
    return this.isUserIdle;
  }

  public markAllAsRead(): void {
    this.unreadIdleCount = 0;
    this.notify();
  }

  public clearLogs(): void {
    this.logs = [];
    this.unreadIdleCount = 0;
    this.currentIdleStats = this.createEmptyStats();
    this.lastCompletedIdleSummary = null;
    this.notify();
  }
}

export const activityLog = new ActivityLogManager();
