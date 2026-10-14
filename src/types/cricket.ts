export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
export type BattingStyle = 'Right-Hand Bat' | 'Left-Hand Bat';
export type BowlingStyle = 'Right-Arm Fast' | 'Right-Arm Medium' | 'Right-Arm Spin' | 'Left-Arm Fast' | 'Left-Arm Spin';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  avatar?: string;
  jerseyNumber?: number;
  bio?: string;
  currentTeamId?: string; // Current team, but player is independent and can switch teams
  createdAt: string;
  statsOverrides?: Partial<PlayerTournamentStats>;
}

export interface PlayerTournamentStats {
  matchesPlayed: number;
  // Batting
  inningsBatted: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixPenalties: number; // Hitting a 6 causes -4 runs penalty
  highScore: number;
  retiredCount: number; // Auto-retired after 4 overs
  // Bowling
  inningsBowled: number;
  oversBowled: number;
  legalBallsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  widesConceded: number;
  noBallsConceded: number;
  deadBallsConceded: number;
  deadBallPenaltiesConceded: number; // 3rd+ dead ball in an over gives +1 run
  // Fielding / DRS
  reviewsCalled: number;
  reviewsSuccessful: number;
  substitutionsInvolved: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  logoEmoji: string;
  logoUrl?: string;
  captainPlayerId?: string;
  playerIds: string[]; // Custom squad size per tournament (e.g. 5-11 players)
}

export type MatchStatus = 'scheduled' | 'toss' | 'innings1' | 'innings_break' | 'innings2' | 'completed' | 'abandoned';

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'retired_limit' // Auto-retired after 4 overs (24 balls)
  | 'retired_hurt';

export interface BatsmanInnings {
  playerId: string;
  runs: number;
  ballsFaced: number; // legal balls
  fours: number;
  sixPenalties: number; // sixes hit causing -4
  isOut: boolean;
  dismissalType?: DismissalType;
  bowlerId?: string;
  isRetiredLimit: boolean; // reaches 24 legal balls (4 overs)
  hasReEntered: boolean; // returned at the end after all others batted
  battingOrder: number;
}

export interface BowlerInnings {
  playerId: string;
  oversBowled: number; // full overs
  ballsThisOver: number; // 0 to 5
  totalLegalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  deadBalls: number;
  deadBallPenalties: number; // after 2 dead balls in an over, +1 extra each
}

export interface BallRecord {
  ballNumber: number; // within over (1-6 for legal)
  overNumber: number; // 0 to 8 (9 overs)
  bowlerId: string;
  batsmanId: string;
  runsOffBat: number; // 0, 1, 2, 3, 4, or -4 for six penalty
  isSixPenalty: boolean; // Six hit -> minus 4 runs
  isWide: boolean;
  isNoBall: boolean;
  isNoBallFour: boolean; // Hitting 4 on no-ball -> not counted as legal ball, 4 + 1 runs
  isDeadBall: boolean;
  deadBallPenaltyAwarded: boolean; // If this was dead ball #3+ in current over (+1 run)
  extras: number;
  totalRunsOnBall: number; // net added to team score (can be negative for 6 penalty)
  cumulativeRuns?: number; // Total innings runs after this delivery
  cumulativeWickets?: number; // Total wickets after this delivery
  isLegalBall: boolean;
  isWicket: boolean;
  dismissal?: {
    type: DismissalType;
    batsmanId: string;
    bowlerId?: string;
  };
  reviewTaken?: {
    teamId: string;
    decision: 'upheld' | 'overturned'; // upheld = review retained
    reason: string;
  };
  commentary: string;
  timestamp: string;
}

export interface DrsRecord {
  teamId: string;
  isBattingTeam: boolean;
  targetType: 'wicket' | 'boundary' | 'six_penalty' | 'extra' | 'other';
  reason: string;
  isSuccessful: boolean; // true = upheld/retained, false = lost
  over: number;
  ball: number;
  impactDescription: string;
  timestamp: string;
}

export interface Innings {
  teamId: string; // Batting team
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  totalLegalBalls: number; // 10 overs * 6 = 60 max
  oversCompleted: number; // 0 to 10
  ballsInCurrentOver: number; // 0 to 5
  currentBatsmanId?: string;
  currentBowlerId?: string;
  batsmen: BatsmanInnings[];
  bowlers: BowlerInnings[];
  balls: BallRecord[];
  deadBallsInCurrentOver: number; // tracks 1st, 2nd, 3rd+ in current over
  battingTeamReviewsRemaining: number; // Starts at 2
  bowlingTeamReviewsRemaining: number; // Starts at 2
  reviewsRemaining: number; // Backwards compatibility
  reviewsUsedCount: number;
  drsHistory: DrsRecord[];
  substitutionUsed: boolean; // Max 1 substitution per innings
  substitutions: {
    outgoingPlayerId: string;
    incomingPlayerId: string;
    over: number;
    ball: number;
    reason: string;
  }[];
  isCompleted: boolean;
  target?: number; // For 2nd innings
  maxOvers?: number; // Total overs for this innings (e.g. 5, 6, 8, 10, 12, 20)
}

export interface TossInfo {
  winnerTeamId: string;
  decision: 'bat' | 'bowl';
  tossTime: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber: number;
  stage: 'League' | 'Semi-Final' | 'Final' | 'Friendly';
  team1Id: string;
  team2Id: string;
  venue: string;
  scheduledTime: string;
  status: MatchStatus;
  overs?: number; // Match overs override if any (defaults to tournament.oversPerInnings)
  toss?: TossInfo;
  innings1?: Innings;
  innings2?: Innings;
  winningTeamId?: string;
  winMargin?: string;
  playerOfTheMatchId?: string;
  notes?: string;
}

export type RoundRobinType = 'single' | 'double' | 'custom';
export type PlayoffFormat =
  | 'semifinals_top4'
  | 'direct_final_top2'
  | 'rank1_direct_final'
  | 'ipl_playoffs'
  | 'manual_override';
export type TieBreakerRule = 'nrr' | 'head_to_head' | 'most_wins' | 'manual_admin';

export interface ManualPlayoffOverrides {
  enabled: boolean;
  sf1Team1Id?: string;
  sf1Team2Id?: string;
  sf2Team1Id?: string;
  sf2Team2Id?: string;
  finalTeam1Id?: string;
  finalTeam2Id?: string;
  customQualifiedTeamIds?: string[];
  notes?: string;
}

export interface TournamentQualifyRules {
  roundRobinType: RoundRobinType; // 'single' (each team once) | 'double' (home & away / twice) | 'custom'
  pointsPerWin: number; // default 2
  pointsPerTie: number; // default 1
  pointsPerLoss: number; // default 0
  playoffFormat: PlayoffFormat; // 'semifinals_top4' | 'direct_final_top2' | 'ipl_playoffs' | 'manual_override'
  topTeamsCount: number; // default 4 (or 2 for direct final)
  tieBreaker: TieBreakerRule; // default 'nrr'
  manualOverrides?: ManualPlayoffOverrides;
  customNotes?: string;
}

export interface Tournament {
  id: string;
  name: string; // "Rooftop Cricket Tournament"
  edition: string;
  startDate: string;
  endDate: string;
  teamIds: string[]; // Custom team count (2, 3, 4, 5, 6, 8, etc.)
  playersPerTeam?: number; // Customizable squad size (e.g. 2 to 30 players)
  oversPerInnings: number; // 10 overs per innings
  maxOversPerBatsman: number; // 4 overs (24 balls)
  maxOversPerBowler: number; // 2 overs highest
  minOversPerBowler: number; // 1
  reviewsPerInnings: number; // 2
  substitutionsPerInnings: number; // 1
  status: 'upcoming' | 'ongoing' | 'completed';
  qualifyRules?: TournamentQualifyRules;
}

export interface StandingsRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  netRunRate: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  form: ('W' | 'L' | 'T')[];
}
