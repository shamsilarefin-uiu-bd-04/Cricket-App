import { StorageService } from './storage';

export interface NetworkInfo {
  ip: string;
  port: number;
  url: string;
  isCloud?: boolean;
  publicUrl?: string;
  interfaces: { name: string; ip: string }[];
  connectedClients?: number;
}

const CLIENT_INSTANCE_ID =
  typeof window !== 'undefined'
    ? (window as any).__CRICKET_CLIENT_ID__ ||
      ((window as any).__CRICKET_CLIENT_ID__ = 'c_' + Math.random().toString(36).substring(2, 9))
    : 'server';

export const SyncService = {
  eventSource: null as EventSource | null,
  isInitialized: false,
  connectedClients: 1,
  isSyncing: false,
  hasServerConnection: false,

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const res = await fetch('/api/network-ip');
      if (res.ok) {
        const data = await res.json();
        this.hasServerConnection = true;
        return data;
      }
    } catch {
      // offline / client-only mode
    }

    const host = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
    const port = typeof window !== 'undefined' ? Number(window.location.port) || 5173 : 5173;
    const isCloud = typeof window !== 'undefined' && !host.startsWith('localhost') && !host.startsWith('127.0.0.1') && !host.startsWith('192.168.') && !host.startsWith('10.');
    const fullUrl = typeof window !== 'undefined' ? window.location.origin : `http://${host}:${port}`;

    return {
      ip: host,
      port,
      url: fullUrl,
      isCloud,
      publicUrl: isCloud ? fullUrl : undefined,
      interfaces: [{ name: isCloud ? 'Cloud Online Host' : 'Current Host', ip: host }],
      connectedClients: 1
    };
  },

  init(): void {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Register callback so any local storage changes are broadcasted to mobile server
    StorageService.setOnStateChange(() => {
      this.pushToServer();
    });

    // 1. Initial sync pull from server (e.g. when mobile spectator opens the app)
    this.pullFromServer();

    // 2. Connect to Server-Sent Events (SSE) for instant live updates across mobile devices
    this.connectEventStream();
  },

  async pullFromServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        this.hasServerConnection = true;
        if (data && (data.version || data.matches?.length > 0)) {
          this.applyServerState(data);
        } else {
          // If server state is fresh/empty, seed it from this device
          this.pushToServer();
        }
      }
    } catch {
      // local fallback
    }
  },

  connectEventStream(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/stream');

      this.eventSource.onopen = () => {
        this.hasServerConnection = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'SYNC_UPDATE' && payload.data) {
            this.applyServerState(payload.data);
          } else if (payload.type === 'INITIAL_STATE' && payload.data && (payload.data.version || payload.data.matches?.length > 0)) {
            this.applyServerState(payload.data);
          } else if (payload.type === 'CLIENTS_COUNT') {
            this.connectedClients = payload.count || 1;
            window.dispatchEvent(new CustomEvent('cricket-clients-count', { detail: payload.count }));
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect after 3.5s
        setTimeout(() => {
          this.connectEventStream();
        }, 3500);
      };
    } catch {}
  },

  applyServerState(data: any): void {
    if (!data) return;
    // Prevent double blink / echo loops if update originated from this client instance
    if (data.sourceClientId && data.sourceClientId === CLIENT_INSTANCE_ID) {
      return;
    }
    this.isSyncing = true;
    try {
      let changed = false;

      if (Array.isArray(data.tournaments) && data.tournaments.length > 0) {
        StorageService.saveTournaments(data.tournaments, false);
        changed = true;
      }
      if (data.activeTournamentId) {
        StorageService.setActiveTournamentId(data.activeTournamentId, false);
        changed = true;
      }
      if (Array.isArray(data.teams) && data.teams.length > 0) {
        StorageService.saveTeams(data.teams, false);
        changed = true;
      }
      if (Array.isArray(data.players) && data.players.length > 0) {
        StorageService.savePlayers(data.players, false);
        changed = true;
      }
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        StorageService.saveMatches(data.matches, false);
        changed = true;
      }
      if (data.activeMatchId) {
        StorageService.setActiveMatchId(data.activeMatchId, false);
        changed = true;
      }

      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cricket-sync', { detail: data }));
      }
    } finally {
      this.isSyncing = false;
    }
  },

  async pushToServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isSyncing) return; // avoid echo loops

    try {
      const state = {
        sourceClientId: CLIENT_INSTANCE_ID,
        tournaments: StorageService.getTournaments(),
        activeTournamentId: StorageService.getActiveTournamentId(),
        tournament: StorageService.getActiveTournament(),
        teams: StorageService.getTeams(),
        players: StorageService.getPlayers(),
        matches: StorageService.getMatches(),
        activeMatchId: StorageService.getActiveMatchId(),
        timestamp: Date.now()
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (res.ok) {
        this.hasServerConnection = true;
      }
    } catch {
      // offline or standalone mode
    }
  }
};
