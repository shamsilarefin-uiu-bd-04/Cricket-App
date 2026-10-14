import {
  Player,
  Team,
  Tournament,
  Match,
  StandingsRow,
  PlayerTournamentStats,
  TournamentQualifyRules,
  PlayoffFormat,
  ManualPlayoffOverrides
} from '../types/cricket';
import { FixturesGenerator } from './fixturesGenerator';

export const ADMIN_PASSWORD = '0123admin';

const STORAGE_KEYS = {
  TOURNAMENTS: 'rooftop_cricket_tournaments',
  ACTIVE_TOURNAMENT_ID: 'rooftop_cricket_active_tournament_id',
  TOURNAMENT: 'rooftop_cricket_tournament',
  TEAMS: 'rooftop_cricket_teams',
  PLAYERS: 'rooftop_cricket_players',
  MATCHES: 'rooftop_cricket_matches',
  ACTIVE_MATCH_ID: 'rooftop_cricket_active_match_id',
  ADMIN_AUTH: 'rooftop_cricket_admin_auth'
};

const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStore[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStore[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    delete memoryStore[key];
  }
};

// Seed Players (30 players across 5 teams: 6 players each)
const SEED_PLAYERS: Player[] = [
  // Skyline Strikers
  { id: 'p1', name: 'Zayan Kabir', nickname: 'The Rooftop King', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 7, currentTeamId: 't1', createdAt: '2026-01-01', bio: 'Specialist in 4-run lofted straight drives without losing balls.' },
  { id: 'p2', name: 'Rafiul Hasan', nickname: 'Blade', role: 'Batsman', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 10, currentTeamId: 't1', createdAt: '2026-01-01', bio: 'Sharp placement batsman, strictly avoids 6-penalties.' },
  { id: 'p3', name: 'Tamim Rahman', nickname: 'Bullet', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 99, currentTeamId: 't1', createdAt: '2026-01-01', bio: 'Speedster with tight yorkers and zero dead balls.' },
  { id: 'p4', name: 'Tanvir Ahmed', nickname: 'Spin Doctor', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Spin', jerseyNumber: 8, currentTeamId: 't1', createdAt: '2026-01-01', bio: 'Tricky carrom ball specialist on concrete.' },
  { id: 'p5', name: 'Shahadat Hossain', nickname: 'Wall', role: 'Batsman', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 18, currentTeamId: 't1', createdAt: '2026-01-01', bio: 'Stays at the crease for full 4 overs.' },
  { id: 'p6', name: 'Imran Nazir', nickname: 'Hawk', role: 'Wicket-Keeper', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 33, currentTeamId: 't1', createdAt: '2026-01-01', bio: 'Lightning quick behind the stumps and impact sub.' },

  // Roof Raiders
  { id: 'p7', name: 'Nafis Chowdhury', nickname: 'Captain Cool', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Spin', jerseyNumber: 17, currentTeamId: 't2', createdAt: '2026-01-02', bio: 'Tactical mastermind in short 9-over formats.' },
  { id: 'p8', name: 'Farhan Shakil', nickname: 'Flash', role: 'Batsman', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 22, currentTeamId: 't2', createdAt: '2026-01-02', bio: 'Floor sweeper and boundary accumulator.' },
  { id: 'p9', name: 'Samiul Islam', nickname: 'Sniper', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 45, currentTeamId: 't2', createdAt: '2026-01-02', bio: 'Inswing specialist who targets middle stump.' },
  { id: 'p10', name: 'Arifuzzaman', nickname: 'Magician', role: 'Bowler', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Left-Arm Spin', jerseyNumber: 11, currentTeamId: 't2', createdAt: '2026-01-02', bio: 'Arm ball specialist with great economy.' },
  { id: 'p11', name: 'Mahir Faysal', nickname: 'Anchor', role: 'Batsman', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 5, currentTeamId: 't2', createdAt: '2026-01-02', bio: 'Patient batsman with 4-over endurance.' },
  { id: 'p12', name: 'Sadikur Rahman', nickname: 'Viper', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 9, currentTeamId: 't2', createdAt: '2026-01-02', bio: 'Effective death bowler in 8th and 9th overs.' },

  // Penthouse Panthers
  { id: 'p13', name: 'Abrar Wahid', nickname: 'Panther', role: 'Batsman', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 3, currentTeamId: 't3', createdAt: '2026-01-03', bio: 'Quick hands, finds gaps along the rooftop fence.' },
  { id: 'p14', name: 'Kazi Muntasir', nickname: 'Turbine', role: 'All-Rounder', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 13, currentTeamId: 't3', createdAt: '2026-01-03', bio: 'Explosive all-rounder who can bat and bowl 3 overs.' },
  { id: 'p15', name: 'Mushfiqur Nayeem', nickname: 'Safe Hands', role: 'Wicket-Keeper', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Spin', jerseyNumber: 21, currentTeamId: 't3', createdAt: '2026-01-03', bio: 'Calm under pressure during tight chases.' },
  { id: 'p16', name: 'Rayhan Uddin', nickname: 'Whirlwind', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Left-Arm Fast', jerseyNumber: 88, currentTeamId: 't3', createdAt: '2026-01-03', bio: 'Left-arm angle creates LBW and bowled chances.' },
  { id: 'p17', name: 'Jahidul Haque', nickname: 'Steady', role: 'Batsman', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 14, currentTeamId: 't3', createdAt: '2026-01-03', bio: 'Reliable opener with disciplined stroke play.' },
  { id: 'p18', name: 'Ashikur Rahman', nickname: 'The Claw', role: 'Bowler', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Right-Arm Spin', jerseyNumber: 77, currentTeamId: 't3', createdAt: '2026-01-03', bio: 'Tight leg-breaks with rarely any extras.' },

  // Aerial Aces
  { id: 'p19', name: 'Shakawat Shuvo', nickname: 'Ace', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 1, currentTeamId: 't4', createdAt: '2026-01-04', bio: 'Dynamic captain and star striker.' },
  { id: 'p20', name: 'Nahid Hasan', nickname: 'Falcon', role: 'Batsman', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Left-Arm Spin', jerseyNumber: 24, currentTeamId: 't4', createdAt: '2026-01-04', bio: 'Master of backfoot punch shots for 4 runs.' },
  { id: 'p21', name: 'Ehsanul Karim', nickname: 'Thunder', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 6, currentTeamId: 't4', createdAt: '2026-01-04', bio: 'Aggressive opening bowler who bowls full lengths.' },
  { id: 'p22', name: 'Towhid Hridoy Jr', nickname: 'Finisher', role: 'Batsman', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 27, currentTeamId: 't4', createdAt: '2026-01-04', bio: 'Deadly in the final 3 overs of an innings.' },
  { id: 'p23', name: 'Mehedi Shamim', nickname: 'Fox', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Spin', jerseyNumber: 4, currentTeamId: 't4', createdAt: '2026-01-04', bio: 'Varies pace and flight on rooftop turf.' },
  { id: 'p24', name: 'Rashedul Bappy', nickname: 'Shield', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 12, currentTeamId: 't4', createdAt: '2026-01-04', bio: 'Key DRS review caller with high accuracy.' },

  // Chimney Cyclones
  { id: 'p25', name: 'Kamrul Hasan', nickname: 'Twister', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 19, currentTeamId: 't5', createdAt: '2026-01-05', bio: 'High strike-rate rooftop power hitter.' },
  { id: 'p26', name: 'Adnan Sami', nickname: 'Ghost', role: 'Batsman', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 23, currentTeamId: 't5', createdAt: '2026-01-05', bio: 'Smooth flick shots through mid-wicket.' },
  { id: 'p27', name: 'Wasif Billah', nickname: 'Sling', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 90, currentTeamId: 't5', createdAt: '2026-01-05', bio: 'Round-arm slinger who bowls pinpoint yorkers.' },
  { id: 'p28', name: 'Zubair Hossain', nickname: 'Googly', role: 'Bowler', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Spin', jerseyNumber: 31, currentTeamId: 't5', createdAt: '2026-01-05', bio: 'Deceptive wrist spinner on bouncy rooftops.' },
  { id: 'p29', name: 'Fahim Faisal', nickname: 'Steel', role: 'Batsman', battingStyle: 'Left-Hand Bat', bowlingStyle: 'Right-Arm Medium', jerseyNumber: 16, currentTeamId: 't5', createdAt: '2026-01-05', bio: 'Solid defensive player when wickets fall early.' },
  { id: 'p30', name: 'Shahriar Shanto Jr', nickname: 'Bolt', role: 'All-Rounder', battingStyle: 'Right-Hand Bat', bowlingStyle: 'Right-Arm Fast', jerseyNumber: 55, currentTeamId: 't5', createdAt: '2026-01-05', bio: 'Versatile rover player and fast runner.' }
];

export interface TeamLogoPreset {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  logoEmoji: string;
  logoUrl: string;
}

export const OFFICIAL_TEAM_LOGOS: TeamLogoPreset[] = [
  {
    id: 'choy-chokka',
    name: 'Choy Chokka',
    shortName: 'CHOY',
    primaryColor: '#10b981',
    secondaryColor: '#047857',
    logoEmoji: '🏏',
    logoUrl: '/logos/choy-chokka.jpg'
  },
  {
    id: 'bhai-brothers',
    name: 'Bhai Brothers',
    shortName: 'BHAI',
    primaryColor: '#f59e0b',
    secondaryColor: '#b45309',
    logoEmoji: '🦁',
    logoUrl: '/logos/bhai-brothers.jpg'
  },
  {
    id: 'rooftop-fury',
    name: 'Rooftop Fury',
    shortName: 'FURY',
    primaryColor: '#ef4444',
    secondaryColor: '#991b1b',
    logoEmoji: '🔥',
    logoUrl: '/logos/rooftop-fury.jpg'
  },
  {
    id: 'skyline-vipers',
    name: 'Skyline Vipers',
    shortName: 'VIP',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0369a1',
    logoEmoji: '🐍',
    logoUrl: '/logos/skyline-vipers.png'
  }
];

// Seed Teams (5 teams, with 6 players each)
const SEED_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Skyline Vipers',
    shortName: 'VIP',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0369a1',
    logoEmoji: '🐍',
    logoUrl: '/logos/skyline-vipers.png',
    captainPlayerId: 'p1',
    playerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
  },
  {
    id: 't2',
    name: 'Rooftop Fury',
    shortName: 'FURY',
    primaryColor: '#ef4444',
    secondaryColor: '#991b1b',
    logoEmoji: '🔥',
    logoUrl: '/logos/rooftop-fury.jpg',
    captainPlayerId: 'p7',
    playerIds: ['p7', 'p8', 'p9', 'p10', 'p11', 'p12']
  },
  {
    id: 't3',
    name: 'Bhai Brothers',
    shortName: 'BHAI',
    primaryColor: '#f59e0b',
    secondaryColor: '#b45309',
    logoEmoji: '🦁',
    logoUrl: '/logos/bhai-brothers.jpg',
    captainPlayerId: 'p13',
    playerIds: ['p13', 'p14', 'p15', 'p16', 'p17', 'p18']
  },
  {
    id: 't4',
    name: 'Choy Chokka',
    shortName: 'CHOY',
    primaryColor: '#10b981',
    secondaryColor: '#047857',
    logoEmoji: '🏏',
    logoUrl: '/logos/choy-chokka.jpg',
    captainPlayerId: 'p19',
    playerIds: ['p19', 'p20', 'p21', 'p22', 'p23', 'p24']
  },
  {
    id: 't5',
    name: 'Chimney Cyclones',
    shortName: 'CYC',
    primaryColor: '#8b5cf6',
    secondaryColor: '#6d28d9',
    logoEmoji: '🌪️',
    captainPlayerId: 'p25',
    playerIds: ['p25', 'p26', 'p27', 'p28', 'p29', 'p30']
  }
];

const SEED_TOURNAMENT: Tournament = {
  id: 'tourney_2026',
  name: 'Rooftop Cricket Tournament',
  edition: 'Season 1 (2026)',
  startDate: '2026-10-02',
  endDate: '2026-10-10',
  teamIds: ['t1', 't2', 't3', 't4', 't5'],
  playersPerTeam: 6, // Customizable squad size (e.g. 2 to 30 players)
  oversPerInnings: 10,
  maxOversPerBatsman: 4, // 24 legal balls max
  maxOversPerBowler: 2, // highest 2 overs
  minOversPerBowler: 1,
  reviewsPerInnings: 2,
  substitutionsPerInnings: 1,
  status: 'ongoing',
  qualifyRules: {
    roundRobinType: 'single',
    pointsPerWin: 2,
    pointsPerTie: 1,
    pointsPerLoss: 0,
    playoffFormat: 'semifinals_top4',
    topTeamsCount: 4,
    tieBreaker: 'nrr',
    manualOverrides: {
      enabled: false
    }
  }
};

// Seed Matches
const SEED_MATCHES: Match[] = [
  {
    id: 'm1',
    tournamentId: 'tourney_2026',
    matchNumber: 1,
    stage: 'League',
    team1Id: 't1',
    team2Id: 't2',
    venue: 'Sky Arena Roof Court A',
    scheduledTime: '2026-10-02 14:00',
    status: 'scheduled',
    notes: 'Opening Match of Rooftop Cricket Tournament Season 1.'
  },
  {
    id: 'm2',
    tournamentId: 'tourney_2026',
    matchNumber: 2,
    stage: 'League',
    team1Id: 't3',
    team2Id: 't4',
    venue: 'Sky Arena Roof Court B',
    scheduledTime: '2026-10-02 16:30',
    status: 'scheduled',
    notes: 'Round 1 fixture.'
  },
  {
    id: 'm3',
    tournamentId: 'tourney_2026',
    matchNumber: 3,
    stage: 'League',
    team1Id: 't1',
    team2Id: 't5',
    venue: 'Sky Arena Roof Court A',
    scheduledTime: '2026-10-03 14:00',
    status: 'scheduled'
  },
  {
    id: 'm4',
    tournamentId: 'tourney_2026',
    matchNumber: 4,
    stage: 'League',
    team2Id: 't3',
    team1Id: 't2',
    venue: 'Sky Arena Roof Court B',
    scheduledTime: '2026-10-03 16:30',
    status: 'scheduled'
  },
  {
    id: 'm5',
    tournamentId: 'tourney_2026',
    matchNumber: 5,
    stage: 'League',
    team1Id: 't4',
    team2Id: 't5',
    venue: 'Sky Arena Roof Court A',
    scheduledTime: '2026-10-04 14:00',
    status: 'scheduled'
  }
];

let onStateChangeCallback: (() => void) | null = null;

export const StorageService = {
  setOnStateChange(cb: () => void): void {
    onStateChangeCallback = cb;
  },

  notifyChange(broadcast = true): void {
    if (broadcast && onStateChangeCallback) {
      try {
        onStateChangeCallback();
      } catch (e) {
        console.warn('Storage state change notification error:', e);
      }
    }
  },

  getTournaments(): Tournament[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    if (!raw) {
      // Check legacy single tournament key
      const legacy = safeStorage.getItem(STORAGE_KEYS.TOURNAMENT);
      let initialTourney = SEED_TOURNAMENT;
      if (legacy) {
        try {
          const parsedLegacy = JSON.parse(legacy);
          initialTourney = {
            ...SEED_TOURNAMENT,
            ...parsedLegacy,
            teamIds:
              Array.isArray(parsedLegacy.teamIds) && parsedLegacy.teamIds.length > 0
                ? parsedLegacy.teamIds
                : SEED_TOURNAMENT.teamIds
          };
        } catch {}
      }
      const initial = [initialTourney];
      safeStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(initial));
      safeStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, initial[0].id);
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        const allTeams = this.getTeams();
        const allMatches = this.getMatches();

        const mapped = parsed.map((t: Tournament) => {
          const overs = Number(t.oversPerInnings) || 10;
          let validTeamIds = Array.isArray(t.teamIds) && t.teamIds.length > 0 ? t.teamIds : [];
          if (validTeamIds.length === 0) {
            // Find teams participating from matches belonging to this tournament
            const tourneyMatches = allMatches.filter((m) => m.tournamentId === t.id);
            const matchTeamIds = Array.from(new Set(tourneyMatches.flatMap((m) => [m.team1Id, m.team2Id])));
            if (matchTeamIds.length >= 2) {
              validTeamIds = matchTeamIds;
            } else if (allTeams.length >= 4) {
              validTeamIds = allTeams.slice(0, Math.min(6, allTeams.length)).map((tm) => tm.id);
            } else {
              validTeamIds = SEED_TOURNAMENT.teamIds;
            }
            modified = true;
          }

          return {
            ...t,
            teamIds: validTeamIds,
            playersPerTeam: t.playersPerTeam || 6,
            oversPerInnings: overs,
            maxOversPerBowler: t.maxOversPerBowler || Math.max(1, Math.ceil(overs / 5)),
            maxOversPerBatsman:
              t.maxOversPerBatsman || (overs <= 6 ? Math.max(2, Math.floor(overs * 0.5)) : Math.min(overs, 4))
          };
        });

        if (modified) {
          safeStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch {}
    safeStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify([SEED_TOURNAMENT]));
    return [SEED_TOURNAMENT];
  },

  saveTournaments(tournaments: Tournament[], broadcast = true): void {
    safeStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    this.notifyChange(broadcast);
  },

  getActiveTournamentId(): string {
    const id = safeStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID);
    const tournaments = this.getTournaments();
    if (id && tournaments.some((t) => t.id === id)) {
      return id;
    }
    const defaultId = tournaments[0]?.id || SEED_TOURNAMENT.id;
    safeStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, defaultId);
    return defaultId;
  },

  setActiveTournamentId(id: string, broadcast = true): void {
    const tournaments = this.getTournaments();
    const found = tournaments.find((t) => t.id === id);
    if (found) {
      safeStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, id);
      safeStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(found));
      this.notifyChange(broadcast);
    }
  },

  getActiveTournament(): Tournament {
    const id = this.getActiveTournamentId();
    const tournaments = this.getTournaments();
    return tournaments.find((t) => t.id === id) || tournaments[0] || SEED_TOURNAMENT;
  },

  getTournament(): Tournament {
    return this.getActiveTournament();
  },

  getTournamentById(tournamentId: string): Tournament | undefined {
    return this.getTournaments().find((t) => t.id === tournamentId);
  },

  saveTournament(tournament: Tournament): void {
    const tournaments = this.getTournaments();
    const idx = tournaments.findIndex((t) => t.id === tournament.id);
    if (idx >= 0) {
      tournaments[idx] = tournament;
    } else {
      tournaments.push(tournament);
    }
    this.saveTournaments(tournaments);
    if (this.getActiveTournamentId() === tournament.id) {
      safeStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(tournament));
    }
  },

  updateTournament(
    tournamentId: string,
    updates: Partial<Tournament>
  ): Tournament | undefined {
    const tournaments = this.getTournaments();
    const idx = tournaments.findIndex((t) => t.id === tournamentId);
    if (idx === -1) return undefined;

    const existing = tournaments[idx];
    const updated: Tournament = {
      ...existing,
      ...updates
    };

    // If oversPerInnings updated, re-calculate default quotas if not explicitly provided
    if (updates.oversPerInnings) {
      const overs = Number(updates.oversPerInnings);
      if (!updates.maxOversPerBowler) {
        updated.maxOversPerBowler = Math.max(1, Math.ceil(overs / 5));
      }
      if (!updates.maxOversPerBatsman) {
        updated.maxOversPerBatsman =
          overs <= 6 ? Math.max(2, Math.floor(overs * 0.5)) : Math.min(overs, 4);
      }
    }

    tournaments[idx] = updated;
    this.saveTournaments(tournaments);

    if (this.getActiveTournamentId() === tournamentId) {
      safeStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(updated));
    }

    return updated;
  },

  updateActiveTournamentOvers(overs: number): Tournament {
    const active = this.getActiveTournament();
    const maxBowler = Math.max(1, Math.ceil(overs / 5));
    const maxBatsman = overs <= 6 ? Math.max(2, Math.floor(overs * 0.5)) : Math.min(overs, 4);
    const updated = this.updateTournament(active.id, {
      oversPerInnings: overs,
      maxOversPerBowler: maxBowler,
      maxOversPerBatsman: maxBatsman
    });
    return updated || active;
  },

  updateActiveTournamentSquadSize(playersPerTeam: number): Tournament {
    const active = this.getActiveTournament();
    const cleanSize = Math.max(2, Math.min(30, Number(playersPerTeam) || 6));
    const updated = this.updateTournament(active.id, {
      playersPerTeam: cleanSize
    });
    return updated || active;
  },

  // Create a brand new tournament with custom team count and manual squad size
  createTournament(data: {
    name: string;
    edition: string;
    startDate: string;
    endDate: string;
    teamIds: string[];
    playersPerTeam?: number;
    oversPerInnings?: number;
    maxOversPerBatsman?: number;
    maxOversPerBowler?: number;
    minOversPerBowler?: number;
    reviewsPerInnings?: number;
    substitutionsPerInnings?: number;
    autoGenerateFixtures?: boolean;
    qualifyRules?: Partial<TournamentQualifyRules>;
  }): { tournament: Tournament; createdMatchesCount: number } {
    const newId = `tourney_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTournament: Tournament = {
      id: newId,
      name: data.name.trim() || 'Rooftop Cricket Tournament',
      edition: data.edition.trim() || `Edition ${new Date().getFullYear()}`,
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      endDate: data.endDate || new Date().toISOString().slice(0, 10),
      teamIds: data.teamIds,
      playersPerTeam: Math.max(2, Math.min(30, Number(data.playersPerTeam) || 6)),
      oversPerInnings: data.oversPerInnings ?? 10,
      maxOversPerBatsman: data.maxOversPerBatsman ?? 4,
      maxOversPerBowler: data.maxOversPerBowler ?? 2,
      minOversPerBowler: data.minOversPerBowler ?? 1,
      reviewsPerInnings: data.reviewsPerInnings ?? 2,
      substitutionsPerInnings: data.substitutionsPerInnings ?? 1,
      status: 'ongoing',
      qualifyRules: {
        roundRobinType: data.qualifyRules?.roundRobinType || 'single',
        pointsPerWin: data.qualifyRules?.pointsPerWin ?? 2,
        pointsPerTie: data.qualifyRules?.pointsPerTie ?? 1,
        pointsPerLoss: data.qualifyRules?.pointsPerLoss ?? 0,
        playoffFormat: data.qualifyRules?.playoffFormat || 'semifinals_top4',
        topTeamsCount: data.qualifyRules?.topTeamsCount || 4,
        tieBreaker: data.qualifyRules?.tieBreaker || 'nrr',
        manualOverrides: data.qualifyRules?.manualOverrides || { enabled: false },
        customNotes: data.qualifyRules?.customNotes
      }
    };

    const tournaments = this.getTournaments();
    tournaments.push(newTournament);
    this.saveTournaments(tournaments);
    this.setActiveTournamentId(newId);

    let createdMatchesCount = 0;
    if (data.autoGenerateFixtures && data.teamIds.length >= 2) {
      const allTeams = this.getTeams();
      const selectedTeams = allTeams.filter((t) => data.teamIds.includes(t.id));
      const generatedMatches = FixturesGenerator.generateRoundRobin(
        newId,
        selectedTeams,
        newTournament.startDate,
        1,
        newTournament.oversPerInnings,
        newTournament.qualifyRules?.roundRobinType || 'single'
      );
      const existingMatches = this.getMatches();
      const updatedMatches = [...existingMatches, ...generatedMatches];
      this.saveMatches(updatedMatches);
      createdMatchesCount = generatedMatches.length;
    }

    return { tournament: newTournament, createdMatchesCount };
  },

  // Delete a tournament
  deleteTournament(tournamentId: string): { success: boolean; message: string } {
    const tournaments = this.getTournaments();
    if (tournaments.length <= 1) {
      return {
        success: false,
        message: 'Cannot delete the only tournament. At least one tournament must remain.'
      };
    }

    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) {
      return { success: false, message: 'Tournament not found.' };
    }

    const remaining = tournaments.filter((t) => t.id !== tournamentId);
    this.saveTournaments(remaining);

    // If active was deleted, point active to first remaining
    if (this.getActiveTournamentId() === tournamentId) {
      this.setActiveTournamentId(remaining[0].id);
    }

    return {
      success: true,
      message: `Tournament "${target.name} - ${target.edition}" deleted successfully.`
    };
  },

  getTeams(): Team[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.TEAMS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(SEED_TEAMS));
      return SEED_TEAMS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let modified = false;
        const mapped = parsed.map((t: Team) => {
          if (!t.logoUrl) {
            if (t.id === 't1' || t.name === 'Skyline Vipers' || t.name === 'Skyline Strikers') {
              modified = true;
              return {
                ...t,
                name: t.name === 'Skyline Strikers' ? 'Skyline Vipers' : t.name,
                shortName: t.shortName || 'VIP',
                logoEmoji: t.logoEmoji || '🐍',
                logoUrl: '/logos/skyline-vipers.png'
              };
            }
            if (t.id === 't2' || t.name === 'Rooftop Fury' || t.name === 'Roof Raiders') {
              modified = true;
              return {
                ...t,
                name: t.name === 'Roof Raiders' ? 'Rooftop Fury' : t.name,
                shortName: t.shortName || 'FURY',
                logoEmoji: t.logoEmoji || '🔥',
                logoUrl: '/logos/rooftop-fury.jpg'
              };
            }
            if (t.id === 't3' || t.name === 'Bhai Brothers' || t.name === 'Penthouse Panthers') {
              modified = true;
              return {
                ...t,
                name: t.name === 'Penthouse Panthers' ? 'Bhai Brothers' : t.name,
                shortName: t.shortName || 'BHAI',
                logoEmoji: t.logoEmoji || '🦁',
                logoUrl: '/logos/bhai-brothers.jpg'
              };
            }
            if (t.id === 't4' || t.name === 'Choy Chokka' || t.name === 'Aerial Aces') {
              modified = true;
              return {
                ...t,
                name: t.name === 'Aerial Aces' ? 'Choy Chokka' : t.name,
                shortName: t.shortName || 'CHOY',
                logoEmoji: t.logoEmoji || '🏏',
                logoUrl: '/logos/choy-chokka.jpg'
              };
            }
          }
          return t;
        });

        if (modified) {
          safeStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch {}
    safeStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(SEED_TEAMS));
    return SEED_TEAMS;
  },

  saveTeams(teams: Team[], broadcast = true): void {
    safeStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    this.notifyChange(broadcast);
  },

  getTeamById(teamId: string): Team | undefined {
    return this.getTeams().find((t) => t.id === teamId);
  },

  saveTeam(team: Team): void {
    const teams = this.getTeams();
    const idx = teams.findIndex((t) => t.id === team.id);
    if (idx >= 0) {
      teams[idx] = team;
    } else {
      teams.push(team);
    }
    this.saveTeams(teams);

    // Keep player profile team association 100% in sync
    const players = this.getPlayers();
    let playersChanged = false;
    players.forEach((p) => {
      if (team.playerIds.includes(p.id)) {
        if (p.currentTeamId !== team.id) {
          p.currentTeamId = team.id;
          playersChanged = true;
        }
      } else if (p.currentTeamId === team.id) {
        p.currentTeamId = undefined;
        playersChanged = true;
      }
    });
    if (playersChanged) {
      this.savePlayers(players);
    }
  },

  getPlayers(): Player[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(SEED_PLAYERS));
      return SEED_PLAYERS;
    }
    return JSON.parse(raw);
  },

  savePlayers(players: Player[], broadcast = true): void {
    safeStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    this.notifyChange(broadcast);
  },

  getPlayerById(playerId: string): Player | undefined {
    return this.getPlayers().find((p) => p.id === playerId);
  },

  savePlayer(player: Player): void {
    const players = this.getPlayers();
    const idx = players.findIndex((p) => p.id === player.id);
    if (idx >= 0) {
      players[idx] = player;
    } else {
      players.push(player);
    }
    this.savePlayers(players);

    // If player is assigned to a team, ensure the team squad includes this player
    if (player.currentTeamId) {
      const teams = this.getTeams();
      const team = teams.find((t) => t.id === player.currentTeamId);
      if (team && !team.playerIds.includes(player.id)) {
        team.playerIds.push(player.id);
        this.saveTeams(teams);
      }
    }
  },

  // Generate Playoff Knockouts: Semi-Final 1, Semi-Final 2, and Final (or Direct Final / IPL)
  generatePlayoffs(
    tournamentId: string,
    startDate?: string,
    format?: PlayoffFormat,
    manualOverrides?: ManualPlayoffOverrides
  ): { success: boolean; matches: Match[]; message: string } {
    const tournament = this.getTournamentById(tournamentId) || this.getActiveTournament();
    const allTeams = this.getTeams();
    const tourneyTeams = allTeams.filter((t) => tournament.teamIds.includes(t.id));

    const currentFormat: PlayoffFormat =
      format || tournament.qualifyRules?.playoffFormat || 'semifinals_top4';
    const currentOverrides = manualOverrides || tournament.qualifyRules?.manualOverrides;

    const minTeamsRequired =
      currentFormat === 'direct_final_top2' ? 2 : currentFormat === 'rank1_direct_final' ? 3 : 4;
    if (tourneyTeams.length < minTeamsRequired) {
      return {
        success: false,
        matches: [],
        message: `At least ${minTeamsRequired} teams are required in the tournament to generate playoffs for "${currentFormat}".`
      };
    }

    const standings = this.calculateStandings(tournament.id);
    const existingMatches = this.getMatches();
    const highestNum = existingMatches.reduce((max, m) => Math.max(max, m.matchNumber), 0);

    const playoffMatches = FixturesGenerator.generateKnockouts(
      tournament.id,
      tourneyTeams,
      startDate || tournament.startDate,
      standings,
      highestNum + 1,
      tournament.oversPerInnings,
      currentFormat,
      currentOverrides
    );

    const updated = [...existingMatches, ...playoffMatches];
    this.saveMatches(updated);

    const formatLabel =
      currentFormat === 'direct_final_top2'
        ? 'Grand Final (Top 2)'
        : currentFormat === 'rank1_direct_final'
        ? 'Semi-Final (Rank 2 vs 3) & Grand Final (Rank 1 Direct Finalist)'
        : currentFormat === 'ipl_playoffs'
        ? 'IPL Playoff Brackets (Q1, Eliminator, Q2, Final)'
        : 'Semi-Final 1, Semi-Final 2, and Grand Final';

    return {
      success: true,
      matches: playoffMatches,
      message: `Generated ${formatLabel} for ${tournament.name}!`
    };
  },

  // Switch player's team for future tournaments
  switchPlayerTeam(playerId: string, newTeamId?: string): { success: boolean; message: string } {
    const players = this.getPlayers();
    const teams = this.getTeams();
    const player = players.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'Player not found' };

    const oldTeamId = player.currentTeamId;

    // Remove from old team roster
    if (oldTeamId) {
      const oldTeam = teams.find((t) => t.id === oldTeamId);
      if (oldTeam) {
        oldTeam.playerIds = oldTeam.playerIds.filter((id) => id !== playerId);
        if (oldTeam.captainPlayerId === playerId) {
          oldTeam.captainPlayerId = oldTeam.playerIds[0];
        }
      }
    }

    // Add to new team roster if specified
    if (newTeamId) {
      const newTeam = teams.find((t) => t.id === newTeamId);
      if (newTeam) {
        if (!newTeam.playerIds.includes(playerId)) {
          const activeTourney = this.getActiveTournament();
          const targetSquadSize = Math.max(activeTourney?.playersPerTeam || 11, 25);
          if (newTeam.playerIds.length >= targetSquadSize) {
            return {
              success: false,
              message: `Cannot transfer: ${newTeam.name} already has reached maximum squad capacity (${targetSquadSize} players).`
            };
          }
          newTeam.playerIds.push(playerId);
        }
      }
    }

    player.currentTeamId = newTeamId;
    this.savePlayers(players);
    this.saveTeams(teams);

    const newTeamName = newTeamId ? teams.find((t) => t.id === newTeamId)?.name : 'Free Agent';
    return {
      success: true,
      message: `${player.name} successfully transferred to ${newTeamName}.`
    };
  },

  // Pick an existing registered player from the app pool into a team
  addPlayerToTeam(playerId: string, teamId: string): { success: boolean; message: string } {
    return this.switchPlayerTeam(playerId, teamId);
  },

  // Remove a player from a team (player becomes a Free Agent in the app registry)
  removePlayerFromTeam(playerId: string, teamId: string): { success: boolean; message: string } {
    const teams = this.getTeams();
    const players = this.getPlayers();
    const team = teams.find((t) => t.id === teamId);
    const player = players.find((p) => p.id === playerId);

    if (!team) return { success: false, message: 'Team not found.' };
    if (!player) return { success: false, message: 'Player not found.' };

    team.playerIds = team.playerIds.filter((id) => id !== playerId);
    if (team.captainPlayerId === playerId) {
      team.captainPlayerId = team.playerIds[0] || undefined;
    }
    player.currentTeamId = undefined;

    this.saveTeams(teams);
    this.savePlayers(players);

    return {
      success: true,
      message: `${player.name} removed from ${team.name} and moved to Free Agent pool.`
    };
  },

  // Delete player permanently from the entire application registry
  deletePlayer(playerId: string): { success: boolean; message: string } {
    const players = this.getPlayers();
    const teams = this.getTeams();
    const player = players.find((p) => p.id === playerId);

    if (!player) return { success: false, message: 'Player not found.' };

    // Remove from any teams
    teams.forEach((t) => {
      t.playerIds = t.playerIds.filter((id) => id !== playerId);
      if (t.captainPlayerId === playerId) {
        t.captainPlayerId = t.playerIds[0] || undefined;
      }
    });

    // Remove from players registry
    const remainingPlayers = players.filter((p) => p.id !== playerId);

    this.saveTeams(teams);
    this.savePlayers(remainingPlayers);

    return {
      success: true,
      message: `Player "${player.name}" has been permanently deleted from the app.`
    };
  },

  // Delete a team and release its players to the registered free agent pool
  deleteTeam(teamId: string): { success: boolean; message: string } {
    const teams = this.getTeams();
    const players = this.getPlayers();
    const tournament = this.getTournament();

    const team = teams.find((t) => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    // Release all players to free agents
    players.forEach((p) => {
      if (p.currentTeamId === teamId) {
        p.currentTeamId = undefined;
      }
    });

    // Remove team from all tournaments
    const tournaments = this.getTournaments();
    tournaments.forEach((tourney) => {
      tourney.teamIds = tourney.teamIds.filter((id) => id !== teamId);
    });
    this.saveTournaments(tournaments);

    // Remove team
    const remainingTeams = teams.filter((t) => t.id !== teamId);
    this.saveTeams(remainingTeams);
    this.savePlayers(players);

    // Clean up matches involving this deleted team or set safe fallback
    const matches = this.getMatches();
    const updatedMatches = matches.filter((m) => m.team1Id !== teamId && m.team2Id !== teamId);
    this.saveMatches(updatedMatches);
    const activeMatchId = safeStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH_ID);
    if (activeMatchId && !updatedMatches.some((m) => m.id === activeMatchId)) {
      safeStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, updatedMatches[0]?.id || 'm1');
    }

    return {
      success: true,
      message: `Team "${team.name}" deleted. Its players have been returned to the registered player pool.`
    };
  },

  // Get all registered players who are currently unassigned to any team
  getFreeAgents(): Player[] {
    const players = this.getPlayers();
    const teams = this.getTeams();
    return players.filter((p) => {
      if (!p.currentTeamId) return true;
      return !teams.some((t) => t.id === p.currentTeamId && t.playerIds.includes(p.id));
    });
  },

  getMatches(): Match[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.MATCHES);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(SEED_MATCHES));
      return SEED_MATCHES;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
    safeStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(SEED_MATCHES));
    return SEED_MATCHES;
  },

  saveMatches(matches: Match[], broadcast = true): void {
    safeStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    this.notifyChange(broadcast);
  },

  getMatchById(matchId: string): Match | undefined {
    return this.getMatches().find((m) => m.id === matchId);
  },

  saveMatch(match: Match): void {
    const matches = this.getMatches();
    const idx = matches.findIndex((m) => m.id === match.id);
    if (idx >= 0) {
      matches[idx] = match;
    } else {
      matches.push(match);
    }
    this.saveMatches(matches);
    if (match.tournamentId) {
      this.advanceTournamentPlayoffs(match.tournamentId);
    }
  },

  // Auto-advance playoff brackets when league or semi-final matches complete
  advanceTournamentPlayoffs(tournamentId: string): void {
    if (!tournamentId) return;
    const tourney = this.getTournamentById(tournamentId);

    // If manual overrides are enabled, skip automatic recalculation of playoff seeds
    if (tourney?.qualifyRules?.manualOverrides?.enabled) {
      return;
    }

    const format: PlayoffFormat = tourney?.qualifyRules?.playoffFormat || 'semifinals_top4';
    const matches = this.getMatches();
    const tourneyMatches = matches.filter((m) => m.tournamentId === tournamentId);
    const leagueMatches = tourneyMatches.filter((m) => m.stage === 'League');
    const semiMatches = tourneyMatches
      .filter((m) => m.stage === 'Semi-Final')
      .sort((a, b) => a.matchNumber - b.matchNumber);
    const finalMatch = tourneyMatches.find((m) => m.stage === 'Final');

    let matchesModified = false;

    const allLeagueCompleted =
      leagueMatches.length > 0 && leagueMatches.every((m) => m.status === 'completed');

    // Case A: Direct Final (Top 2 teams)
    if (format === 'direct_final_top2') {
      if (allLeagueCompleted && finalMatch && finalMatch.status === 'scheduled') {
        const standings = this.calculateStandings(tournamentId);
        if (standings.length >= 2) {
          if (
            finalMatch.team1Id !== standings[0].teamId ||
            finalMatch.team2Id !== standings[1].teamId
          ) {
            finalMatch.team1Id = standings[0].teamId;
            finalMatch.team2Id = standings[1].teamId;
            const t1 = this.getTeamById(standings[0].teamId);
            const t2 = this.getTeamById(standings[1].teamId);
            finalMatch.notes = `🏆 GRAND FINAL: Championship Match (${t1?.name || 'Rank 1'} vs ${t2?.name || 'Rank 2'})`;
            matchesModified = true;
          }
        }
      }
      if (matchesModified) {
        this.saveMatches(matches);
      }
      return;
    }

    // Case B: Top 3: Rank 1 Direct Final + Semi-Final (Rank 2 vs Rank 3)
    if (format === 'rank1_direct_final') {
      if (allLeagueCompleted) {
        const standings = this.calculateStandings(tournamentId);
        if (standings.length >= 3) {
          // Semi-Final (Rank 2 vs Rank 3)
          if (semiMatches.length >= 1 && semiMatches[0].status === 'scheduled') {
            if (
              semiMatches[0].team1Id !== standings[1].teamId ||
              semiMatches[0].team2Id !== standings[2].teamId
            ) {
              semiMatches[0].team1Id = standings[1].teamId; // Rank 2
              semiMatches[0].team2Id = standings[2].teamId; // Rank 3
              const t2 = this.getTeamById(standings[1].teamId);
              const t3 = this.getTeamById(standings[2].teamId);
              semiMatches[0].notes = `Semi-Final: Rank 2 (${t2?.name || 'Rank 2'}) vs Rank 3 (${t3?.name || 'Rank 3'}) (Winner advances to Final vs Rank 1)`;
              matchesModified = true;
            }
          }

          // Grand Final: Team 1 is always Rank 1 Direct Finalist
          if (finalMatch && finalMatch.status === 'scheduled') {
            if (finalMatch.team1Id !== standings[0].teamId) {
              finalMatch.team1Id = standings[0].teamId; // Rank 1 Direct Finalist
              const t1 = this.getTeamById(standings[0].teamId);
              finalMatch.notes = `🏆 GRAND FINAL: Championship Match (${t1?.name || 'Rank 1'} Direct Finalist vs Winner of Semi-Final)`;
              matchesModified = true;
            }
          }
        }
      }

      // If Semi-Final is completed, advance the winner to Grand Final (team2Id)
      if (finalMatch && semiMatches.length >= 1 && finalMatch.status === 'scheduled') {
        const sfWinner = semiMatches[0].winningTeamId;
        if (sfWinner && finalMatch.team2Id !== sfWinner) {
          finalMatch.team2Id = sfWinner;
          const t1 = this.getTeamById(finalMatch.team1Id);
          const tWinner = this.getTeamById(sfWinner);
          finalMatch.notes = `🏆 GRAND FINAL: Championship Match (${t1?.name || 'Rank 1'} vs ${tWinner?.name || 'Semi-Final Winner'})`;
          matchesModified = true;
        }
      }

      if (matchesModified) {
        this.saveMatches(matches);
      }
      return;
    }

    // Case C: Top 4 Semifinals (1 vs 4, 2 vs 3)
    if (allLeagueCompleted && semiMatches.length >= 2) {
      const standings = this.calculateStandings(tournamentId);
      if (standings.length >= 4) {
        if (semiMatches[0].status === 'scheduled') {
          if (
            semiMatches[0].team1Id !== standings[0].teamId ||
            semiMatches[0].team2Id !== standings[3].teamId
          ) {
            semiMatches[0].team1Id = standings[0].teamId; // Rank 1
            semiMatches[0].team2Id = standings[3].teamId; // Rank 4
            const t1 = this.getTeamById(standings[0].teamId);
            const t2 = this.getTeamById(standings[3].teamId);
            semiMatches[0].notes = `Semi-Final 1: Rank 1 (${t1?.name || 'Seed 1'}) vs Rank 4 (${t2?.name || 'Seed 4'})`;
            matchesModified = true;
          }
        }
        if (semiMatches[1].status === 'scheduled') {
          if (
            semiMatches[1].team1Id !== standings[1].teamId ||
            semiMatches[1].team2Id !== standings[2].teamId
          ) {
            semiMatches[1].team1Id = standings[1].teamId; // Rank 2
            semiMatches[1].team2Id = standings[2].teamId; // Rank 3
            const t1 = this.getTeamById(standings[1].teamId);
            const t2 = this.getTeamById(standings[2].teamId);
            semiMatches[1].notes = `Semi-Final 2: Rank 2 (${t1?.name || 'Seed 2'}) vs Rank 3 (${t2?.name || 'Seed 3'})`;
            matchesModified = true;
          }
        }
      }
    }

    // Advance winners to the Grand Final:
    if (finalMatch && semiMatches.length >= 2 && finalMatch.status === 'scheduled') {
      const sf1Winner = semiMatches[0].winningTeamId;
      const sf2Winner = semiMatches[1].winningTeamId;

      if (sf1Winner && finalMatch.team1Id !== sf1Winner) {
        finalMatch.team1Id = sf1Winner;
        matchesModified = true;
      }
      if (sf2Winner && finalMatch.team2Id !== sf2Winner) {
        finalMatch.team2Id = sf2Winner;
        matchesModified = true;
      }
      if (matchesModified) {
        const t1 = this.getTeamById(finalMatch.team1Id);
        const t2 = this.getTeamById(finalMatch.team2Id);
        finalMatch.notes = `🏆 GRAND FINAL: Championship Match (${t1?.name || 'SF1 Winner'} vs ${t2?.name || 'SF2 Winner'})`;
      }
    }

    if (matchesModified) {
      this.saveMatches(matches);
    }
  },

  getActiveMatchId(): string | null {
    return safeStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH_ID);
  },

  setActiveMatchId(id: string | null, broadcast = true): void {
    if (id) {
      safeStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, id);
    } else {
      safeStorage.removeItem(STORAGE_KEYS.ACTIVE_MATCH_ID);
    }
    this.notifyChange(broadcast);
  },

  // Calculate detailed lifetime and tournament stats for a player
  // Calculate detailed lifetime and tournament stats for a player
  calculatePlayerStats(playerId: string, tournamentId?: string): PlayerTournamentStats {
    const allMatches = this.getMatches();
    const matches = (tournamentId && tournamentId !== 'all')
      ? allMatches.filter((m) => m.tournamentId === tournamentId)
      : allMatches;

    const stats: PlayerTournamentStats = {
      matchesPlayed: 0,
      inningsBatted: 0,
      notOuts: 0,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixPenalties: 0,
      highScore: 0,
      retiredCount: 0,
      inningsBowled: 0,
      oversBowled: 0,
      legalBallsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      bestBowlingWickets: 0,
      bestBowlingRuns: 0,
      widesConceded: 0,
      noBallsConceded: 0,
      deadBallsConceded: 0,
      deadBallPenaltiesConceded: 0,
      reviewsCalled: 0,
      reviewsSuccessful: 0,
      substitutionsInvolved: 0
    };

    matches.forEach((match) => {
      const inningsList = [match.innings1, match.innings2].filter(Boolean);
      let playedInThisMatch = false;

      inningsList.forEach((inn) => {
        if (!inn) return;

        // Batting stats
        const bat = inn.batsmen.find((b) => b.playerId === playerId);
        if (bat) {
          playedInThisMatch = true;
          stats.inningsBatted += 1;
          stats.runs += bat.runs;
          stats.ballsFaced += bat.ballsFaced;
          stats.fours += bat.fours;
          stats.sixPenalties += bat.sixPenalties;
          if (bat.runs > stats.highScore) {
            stats.highScore = bat.runs;
          }
          if (!bat.isOut) {
            stats.notOuts += 1;
          }
          if (bat.isRetiredLimit) {
            stats.retiredCount += 1;
          }
        }

        // Bowling stats
        const bowl = inn.bowlers.find((bw) => bw.playerId === playerId);
        if (bowl) {
          playedInThisMatch = true;
          stats.inningsBowled += 1;
          stats.legalBallsBowled += bowl.totalLegalBalls;
          stats.maidens += bowl.maidens;
          stats.runsConceded += bowl.runsConceded;
          stats.wickets += bowl.wickets;
          stats.widesConceded += bowl.wides;
          stats.noBallsConceded += bowl.noBalls;
          stats.deadBallsConceded += bowl.deadBalls;
          stats.deadBallPenaltiesConceded += bowl.deadBallPenalties;

          // Best bowling evaluation
          if (
            bowl.wickets > stats.bestBowlingWickets ||
            (bowl.wickets === stats.bestBowlingWickets &&
              stats.bestBowlingWickets > 0 &&
              bowl.runsConceded < stats.bestBowlingRuns)
          ) {
            stats.bestBowlingWickets = bowl.wickets;
            stats.bestBowlingRuns = bowl.runsConceded;
          }
        }

        // Substitution tracking
        inn.substitutions?.forEach((sub) => {
          if (sub.incomingPlayerId === playerId || sub.outgoingPlayerId === playerId) {
            stats.substitutionsInvolved += 1;
          }
        });
      });

      if (playedInThisMatch) {
        stats.matchesPlayed += 1;
      }
    });

    const completedOvers = Math.floor(stats.legalBallsBowled / 6);
    const remainderBalls = stats.legalBallsBowled % 6;
    stats.oversBowled = completedOvers + remainderBalls / 10;

    // Apply any admin manual stat overrides
    const player = this.getPlayerById(playerId);
    if (player?.statsOverrides) {
      Object.entries(player.statsOverrides).forEach(([key, val]) => {
        if (typeof val === 'number') {
          (stats as any)[key] = val;
        }
      });
    }

    return stats;
  },

  // Calculate Standings & Points Table with accurate NRR
  calculateStandings(tournamentId?: string): StandingsRow[] {
    const allTeams = this.getTeams();
    let teams = allTeams;
    if (tournamentId) {
      const tourney = this.getTournamentById(tournamentId);
      if (tourney && tourney.teamIds.length > 0) {
        teams = allTeams.filter((t) => tourney.teamIds.includes(t.id));
      }
    }

    const matches = this.getMatches().filter(
      (m) =>
        (!tournamentId || m.tournamentId === tournamentId) &&
        m.status === 'completed' &&
        (!m.stage || m.stage === 'League')
    );

    const standingsMap: Record<string, StandingsRow> = {};

    teams.forEach((team) => {
      standingsMap[team.id] = {
        teamId: team.id,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        netRunRate: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        form: []
      };
    });

    const tourney = tournamentId ? this.getTournamentById(tournamentId) : this.getActiveTournament();
    const winPts = tourney?.qualifyRules?.pointsPerWin ?? 2;
    const tiePts = tourney?.qualifyRules?.pointsPerTie ?? 1;
    const lossPts = tourney?.qualifyRules?.pointsPerLoss ?? 0;

    matches.forEach((match) => {
      const inn1 = match.innings1;
      const inn2 = match.innings2;

      // Identify team 1 and team 2
      const team1Id = inn1 ? inn1.teamId : match.team1Id;
      const team2Id = inn1 ? inn1.bowlingTeamId : match.team2Id;

      const row1 = standingsMap[team1Id];
      const row2 = standingsMap[team2Id];
      if (!row1 || !row2) return;

      row1.played += 1;
      row2.played += 1;

      // Runs & overs for NRR
      const matchOvers = match.overs || 10;
      const team1Squad = this.getTeamById(team1Id)?.playerIds.length || 4;
      const team2Squad = this.getTeamById(team2Id)?.playerIds.length || 4;

      if (inn1) {
        const inn1AllOut = inn1.wickets >= team1Squad;
        const inn1OversFaced = inn1AllOut
          ? matchOvers
          : inn1.oversCompleted + inn1.ballsInCurrentOver / 6;
        row1.runsScored += inn1.totalRuns;
        row1.oversFaced += inn1OversFaced;
        row2.runsConceded += inn1.totalRuns;
        row2.oversBowled += inn1OversFaced;
      }

      if (inn2) {
        const inn2AllOut = inn2.wickets >= team2Squad;
        const inn2OversFaced = inn2AllOut
          ? matchOvers
          : inn2.oversCompleted + inn2.ballsInCurrentOver / 6;
        row2.runsScored += inn2.totalRuns;
        row2.oversFaced += inn2OversFaced;
        row1.runsConceded += inn2.totalRuns;
        row1.oversBowled += inn2OversFaced;
      }

      if (match.winningTeamId === team1Id) {
        row1.won += 1;
        row1.points += winPts;
        row1.form.push('W');
        row2.lost += 1;
        row2.points += lossPts;
        row2.form.push('L');
      } else if (match.winningTeamId === team2Id) {
        row2.won += 1;
        row2.points += winPts;
        row2.form.push('W');
        row1.lost += 1;
        row1.points += lossPts;
        row1.form.push('L');
      } else {
        // Tied / Draw / Umpire Draw
        row1.tied += 1;
        row1.points += tiePts;
        row1.form.push('T');
        row2.tied += 1;
        row2.points += tiePts;
        row2.form.push('T');
      }
    });

    // Compute NRR
    const result = Object.values(standingsMap).map((row) => {
      const runRateFor = row.oversFaced > 0 ? row.runsScored / row.oversFaced : 0;
      const runRateAgainst = row.oversBowled > 0 ? row.runsConceded / row.oversBowled : 0;
      row.netRunRate = Number((runRateFor - runRateAgainst).toFixed(3));
      // Keep last 5 form
      row.form = row.form.slice(-5);
      return row;
    });

    // Sort by Points descending, then tieBreaker (NRR or most wins) descending
    const tieBreaker = tourney?.qualifyRules?.tieBreaker || 'nrr';
    return result.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (tieBreaker === 'most_wins' && b.won !== a.won) {
        return b.won - a.won;
      }
      return b.netRunRate - a.netRunRate;
    });
  },

  // Reset to seed data
  resetAll(broadcast = true): void {
    safeStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify([SEED_TOURNAMENT]));
    safeStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, SEED_TOURNAMENT.id);
    safeStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(SEED_TOURNAMENT));
    safeStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(SEED_TEAMS));
    safeStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(SEED_PLAYERS));
    safeStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(SEED_MATCHES));
    safeStorage.removeItem(STORAGE_KEYS.ACTIVE_MATCH_ID);
    this.notifyChange(broadcast);
  },

  // Export full JSON database
  exportBackup(): string {
    return JSON.stringify(
      {
        tournaments: this.getTournaments(),
        activeTournamentId: this.getActiveTournamentId(),
        tournament: this.getActiveTournament(),
        teams: this.getTeams(),
        players: this.getPlayers(),
        matches: this.getMatches()
      },
      null,
      2
    );
  },

  // Import JSON database
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.teams) && Array.isArray(data.players)) {
        if (Array.isArray(data.tournaments) && data.tournaments.length > 0) {
          this.saveTournaments(data.tournaments);
          if (data.activeTournamentId) {
            this.setActiveTournamentId(data.activeTournamentId);
          }
        } else if (data.tournament) {
          this.saveTournament(data.tournament);
        }
        this.saveTeams(data.teams);
        this.savePlayers(data.players);
        if (Array.isArray(data.matches)) {
          this.saveMatches(data.matches);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Reset all application state back to fresh default seeds
  resetToDefaults(broadcast = true): void {
    safeStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify([SEED_TOURNAMENT]));
    safeStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT_ID, SEED_TOURNAMENT.id);
    safeStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(SEED_TOURNAMENT));
    safeStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(SEED_TEAMS));
    safeStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(SEED_PLAYERS));
    safeStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(SEED_MATCHES));
    safeStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH_ID, SEED_MATCHES[0].id);
    this.notifyChange(broadcast);
  },

  // Admin Authentication (admin only edit runs & score, others view live like Cricbuzz)
  isAdmin(): boolean {
    return safeStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  loginAsAdmin(password: string): boolean {
    if (password === ADMIN_PASSWORD) {
      safeStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      return true;
    }
    return false;
  },

  logoutAdmin(): void {
    safeStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  },

  setAdmin(status: boolean): void {
    if (status) {
      safeStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      safeStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  },

  // Restart an individual match fixture back to scheduled state
  restartMatch(matchId: string): { success: boolean; match?: Match; message: string } {
    const matches = this.getMatches();
    const idx = matches.findIndex((m) => m.id === matchId);
    if (idx === -1) return { success: false, message: 'Match fixture not found.' };

    const original = matches[idx];
    const resetMatch: Match = {
      ...original,
      status: 'scheduled',
      toss: undefined,
      innings1: undefined,
      innings2: undefined,
      winningTeamId: undefined,
      winMargin: undefined
    };

    matches[idx] = resetMatch;
    this.saveMatches(matches);

    if (this.getActiveMatchId() === matchId) {
      this.setActiveMatchId(matchId);
    }

    return {
      success: true,
      match: resetMatch,
      message: `Match #${original.matchNumber} fixture has been restarted and reset to scheduled!`
    };
  },

  // Restart all fixtures for a tournament back to scheduled state
  restartTournamentFixtures(tournamentId: string): { success: boolean; count: number; message: string } {
    const matches = this.getMatches();
    let count = 0;
    const updated = matches.map((m) => {
      if (m.tournamentId === tournamentId) {
        count++;
        return {
          ...m,
          status: 'scheduled' as const,
          toss: undefined,
          innings1: undefined,
          innings2: undefined,
          winningTeamId: undefined,
          winMargin: undefined
        };
      }
      return m;
    });

    this.saveMatches(updated);
    return {
      success: true,
      count,
      message: `Successfully restarted all ${count} fixtures for this tournament!`
    };
  },

  // Update Tournament Round Robin & Qualification Rules
  updateTournamentQualifyRules(
    tournamentId: string,
    rules: Partial<TournamentQualifyRules>
  ): { success: boolean; tournament?: Tournament; message: string } {
    const tourneys = this.getTournaments();
    const idx = tourneys.findIndex((t) => t.id === tournamentId);
    if (idx === -1) return { success: false, message: 'Tournament not found' };

    const currentRules = tourneys[idx].qualifyRules || {
      roundRobinType: 'single',
      pointsPerWin: 2,
      pointsPerTie: 1,
      pointsPerLoss: 0,
      playoffFormat: 'semifinals_top4',
      topTeamsCount: 4,
      tieBreaker: 'nrr',
      manualOverrides: { enabled: false }
    };

    const currentManual: ManualPlayoffOverrides = currentRules.manualOverrides || { enabled: false };
    const newManual: Partial<ManualPlayoffOverrides> = rules.manualOverrides || {};
    const mergedOverrides: ManualPlayoffOverrides = {
      ...currentManual,
      ...newManual,
      enabled: typeof newManual.enabled === 'boolean' ? newManual.enabled : currentManual.enabled
    };

    tourneys[idx].qualifyRules = {
      ...currentRules,
      ...rules,
      manualOverrides: mergedOverrides
    };

    this.saveTournaments(tourneys);
    return {
      success: true,
      tournament: tourneys[idx],
      message: 'Tournament Round Robin & Qualify rules updated successfully!'
    };
  },

  // Manually apply specific teams to playoff brackets (SF1, SF2, Grand Final)
  applyManualPlayoffMatchups(
    tournamentId: string,
    overrides: ManualPlayoffOverrides
  ): { success: boolean; message: string } {
    const matches = this.getMatches();
    const tourneyMatches = matches.filter((m) => m.tournamentId === tournamentId);
    const semiMatches = tourneyMatches
      .filter((m) => m.stage === 'Semi-Final')
      .sort((a, b) => a.matchNumber - b.matchNumber);
    const finalMatch = tourneyMatches.find((m) => m.stage === 'Final');

    let updatedCount = 0;

    if (semiMatches.length >= 1 && overrides.sf1Team1Id && overrides.sf1Team2Id) {
      if (semiMatches[0].status === 'scheduled') {
        semiMatches[0].team1Id = overrides.sf1Team1Id;
        semiMatches[0].team2Id = overrides.sf1Team2Id;
        const t1 = this.getTeamById(overrides.sf1Team1Id);
        const t2 = this.getTeamById(overrides.sf1Team2Id);
        semiMatches[0].notes = `Semi-Final 1: ${t1?.name || 'Team 1'} vs ${t2?.name || 'Team 2'} (Manual Qualification)`;
        updatedCount++;
      }
    }

    if (semiMatches.length >= 2 && overrides.sf2Team1Id && overrides.sf2Team2Id) {
      if (semiMatches[1].status === 'scheduled') {
        semiMatches[1].team1Id = overrides.sf2Team1Id;
        semiMatches[1].team2Id = overrides.sf2Team2Id;
        const t1 = this.getTeamById(overrides.sf2Team1Id);
        const t2 = this.getTeamById(overrides.sf2Team2Id);
        semiMatches[1].notes = `Semi-Final 2: ${t1?.name || 'Team 1'} vs ${t2?.name || 'Team 2'} (Manual Qualification)`;
        updatedCount++;
      }
    }

    if (finalMatch && overrides.finalTeam1Id && overrides.finalTeam2Id) {
      if (finalMatch.status === 'scheduled') {
        finalMatch.team1Id = overrides.finalTeam1Id;
        finalMatch.team2Id = overrides.finalTeam2Id;
        const t1 = this.getTeamById(overrides.finalTeam1Id);
        const t2 = this.getTeamById(overrides.finalTeam2Id);
        finalMatch.notes = `🏆 GRAND FINAL: ${t1?.name || 'Team 1'} vs ${t2?.name || 'Team 2'} (Manual Qualification)`;
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      this.saveMatches(matches);
    }

    // Save rules state
    this.updateTournamentQualifyRules(tournamentId, {
      manualOverrides: {
        ...overrides,
        enabled: true
      }
    });

    return {
      success: true,
      message: `Manual playoff matchups applied to ${updatedCount} scheduled playoff fixture(s)!`
    };
  }
};
