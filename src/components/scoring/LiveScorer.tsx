import React, { useState, useEffect } from 'react';
import { Match, Innings, Team, Player, TossInfo } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { ScoringEngine, DeliveryInput } from '../../utils/scoringEngine';
import { ScoreboardBanner } from './ScoreboardBanner';
import { OverTracker } from './OverTracker';
import { ScoringKeypad } from './ScoringKeypad';
import { TossModal } from './TossModal';
import { SelectBatsmanModal } from './SelectBatsmanModal';
import { SelectBowlerModal } from './SelectBowlerModal';
import { DrsReviewModal, DrsReviewSubmission } from './DrsReviewModal';
import { SubstitutionModal } from './SubstitutionModal';
import { MatchSummaryModal } from './MatchSummaryModal';
import { InningsScoreHistory } from '../scorecard/InningsScoreHistory';
import { CricbuzzLiveSpectator } from './CricbuzzLiveSpectator';
import { TeamLogo } from '../common/TeamLogo';
import { FriendlyMatchModal } from '../fixtures/FriendlyMatchModal';
import {
  Coins,
  Play,
  RotateCcw,
  Award,
  ChevronRight,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
  LogOut,
  Flag,
  Eye,
  QrCode,
  Users,
  Zap
} from 'lucide-react';
import { EndMatchModal } from './EndMatchModal';

interface LiveScorerProps {
  onOpenScorecard: (matchId: string) => void;
  onRefreshData: () => void;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
  onAdminLogout?: () => void;
  onOpenMobileServer?: () => void;
  dataVersion?: number;
}

export const LiveScorer: React.FC<LiveScorerProps> = ({
  onOpenScorecard,
  onRefreshData,
  isAdmin = false,
  onRequireAdmin,
  onAdminLogout,
  onOpenMobileServer,
  dataVersion
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Modal controls
  const [isTossOpen, setIsTossOpen] = useState(false);
  const [isBatsmanModalOpen, setIsBatsmanModalOpen] = useState(false);
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [isDrsModalOpen, setIsDrsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isEndMatchModalOpen, setIsEndMatchModalOpen] = useState(false);
  const [isFriendlyModalOpen, setIsFriendlyModalOpen] = useState(false);

  // Live Score History & Timeline view controls
  const [showLiveTimeline, setShowLiveTimeline] = useState<boolean>(true);
  const [completedInningsTab, setCompletedInningsTab] = useState<'inn1' | 'inn2'>('inn1');

  // Load data
  const loadData = () => {
    const mList = StorageService.getMatches();
    const tList = StorageService.getTeams();
    setMatches(mList);
    setTeams(tList);

    const activeId = StorageService.getActiveMatchId();
    if (activeId) {
      const current = mList.find((m) => m.id === activeId);
      if (current) {
        setActiveMatch(current);
        return;
      }
    }

    // Default to currently live match if any match is in progress!
    const liveMatch = mList.find(
      (m) =>
        m.status === 'innings1' ||
        m.status === 'innings2' ||
        m.status === 'innings_break' ||
        m.status === 'toss'
    );
    if (liveMatch) {
      setActiveMatch(liveMatch);
      StorageService.setActiveMatchId(liveMatch.id);
      return;
    }

    // Default to first match if no active
    if (mList.length > 0) {
      setActiveMatch(mList[0]);
      StorageService.setActiveMatchId(mList[0].id);
    } else {
      setActiveMatch(null as any);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time mobile sync updates
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('cricket-sync', handleSync);
    return () => {
      window.removeEventListener('cricket-sync', handleSync);
    };
  }, [dataVersion]);

  if (!activeMatch) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Match</h3>
        <p className="text-xs text-slate-400 mb-6">
          No match is currently scheduled or live. You can start a quick 2-team friendly match right away or go to Fixtures.
        </p>
        <button
          onClick={() => {
            if (!isAdmin) {
              onRequireAdmin?.('start friendly match');
              return;
            }
            setIsFriendlyModalOpen(true);
          }}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>⚡ Start 2-Team Friendly Match</span>
        </button>

        {isFriendlyModalOpen && (
          <FriendlyMatchModal
            isOpen={isFriendlyModalOpen}
            onClose={() => setIsFriendlyModalOpen(false)}
            onStartScoring={(matchId) => {
              StorageService.setActiveMatchId(matchId);
              loadData();
              onRefreshData();
            }}
            onRefreshData={onRefreshData}
            isAdmin={isAdmin}
            onRequireAdmin={onRequireAdmin}
          />
        )}
      </div>
    );
  }

  const fallbackTeam1: Team = {
    id: activeMatch?.team1Id || 't1',
    name: 'Team 1',
    shortName: 'T1',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    logoEmoji: '🏏',
    playerIds: []
  };
  const fallbackTeam2: Team = {
    id: activeMatch?.team2Id || 't2',
    name: 'Team 2',
    shortName: 'T2',
    primaryColor: '#f97316',
    secondaryColor: '#c2410c',
    logoEmoji: '⚡',
    playerIds: []
  };

  const team1: Team = teams.find((t) => t.id === activeMatch.team1Id) || teams[0] || fallbackTeam1;
  const team2: Team =
    teams.find((t) => t.id === activeMatch.team2Id) ||
    teams.find((t) => t.id !== team1.id) ||
    teams[1] ||
    fallbackTeam2;

  // Current innings
  const currentInnings: Innings | undefined =
    activeMatch.status === 'innings2'
      ? activeMatch.innings2
      : activeMatch.innings1;

  // Batting and bowling team identification
  const battingTeam: Team = currentInnings
    ? teams.find((t) => t.id === currentInnings.teamId) || team1
    : team1;
  const bowlingTeam: Team = currentInnings
    ? teams.find((t) => t.id === currentInnings.bowlingTeamId) || team2
    : team2;

  // Playing squads for this specific match (customizable 2 to 12+ players)
  const matchSquadSize = activeMatch.playersPerTeam || 6;
  const team1SquadPlayerIds: string[] =
    activeMatch.team1PlayerIds && activeMatch.team1PlayerIds.length > 0
      ? activeMatch.team1PlayerIds
      : team1.playerIds.slice(0, matchSquadSize);
  const team2SquadPlayerIds: string[] =
    activeMatch.team2PlayerIds && activeMatch.team2PlayerIds.length > 0
      ? activeMatch.team2PlayerIds
      : team2.playerIds.slice(0, matchSquadSize);

  const battingSquadPlayerIds =
    battingTeam.id === team1.id ? team1SquadPlayerIds : team2SquadPlayerIds;
  const bowlingSquadPlayerIds =
    bowlingTeam.id === team1.id ? team1SquadPlayerIds : team2SquadPlayerIds;

  // Active player entities
  const activeBatsman = currentInnings?.currentBatsmanId
    ? StorageService.getPlayerById(currentInnings.currentBatsmanId)
    : undefined;
  const activeBowler = currentInnings?.currentBowlerId
    ? StorageService.getPlayerById(currentInnings.currentBowlerId)
    : undefined;

  // Check if we need to pick batsman or bowler
  const requiresBatsmanSelection =
    (activeMatch.status === 'innings1' || activeMatch.status === 'innings2') &&
    currentInnings &&
    !currentInnings.isCompleted &&
    !currentInnings.currentBatsmanId;

  const requiresBowlerSelection =
    (activeMatch.status === 'innings1' || activeMatch.status === 'innings2') &&
    currentInnings &&
    !currentInnings.isCompleted &&
    !currentInnings.currentBowlerId;

  // Save changes to match
  const updateMatchState = (updated: Match) => {
    setActiveMatch(updated);
    StorageService.saveMatch(updated);
    onRefreshData();
  };

  // Toss Handler
  const handleCompleteToss = (toss: TossInfo) => {
    if (!isAdmin) {
      onRequireAdmin?.('conduct match toss and start match');
      return;
    }
    const isTeam1Winner = toss.winnerTeamId === team1.id;
    let battingTeamId = '';
    let bowlingTeamId = '';

    if (toss.decision === 'bat') {
      battingTeamId = isTeam1Winner ? team1.id : team2.id;
      bowlingTeamId = isTeam1Winner ? team2.id : team1.id;
    } else {
      battingTeamId = isTeam1Winner ? team2.id : team1.id;
      bowlingTeamId = isTeam1Winner ? team1.id : team2.id;
    }

    const inn1 = ScoringEngine.createInitialInnings(battingTeamId, bowlingTeamId);

    const updated: Match = {
      ...activeMatch,
      status: 'innings1',
      toss,
      innings1: inn1
    };

    updateMatchState(updated);
    setIsTossOpen(false);
    setIsBatsmanModalOpen(true);
  };

  // Select Batsman Handler
  const handleSelectBatsman = (playerId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('select batsman');
      return;
    }
    if (!currentInnings) return;

    const updatedInnings: Innings = {
      ...currentInnings,
      currentBatsmanId: playerId
    };

    // If returning from retirement or not-out, mark hasReEntered
    const currentTourney =
      StorageService.getTournamentById(activeMatch.tournamentId || '') ||
      StorageService.getActiveTournament();
    const matchOvers = activeMatch.overs || currentTourney?.oversPerInnings || 10;
    const maxBatOvers =
      currentTourney?.maxOversPerBatsman ||
      (matchOvers <= 6 ? Math.max(2, Math.floor(matchOvers * 0.5)) : Math.min(matchOvers, 4));
    const maxBatBalls = maxBatOvers * 6;

    const existing = updatedInnings.batsmen.find((b) => b.playerId === playerId);
    if (existing && (existing.isRetiredLimit || existing.ballsFaced >= maxBatBalls)) {
      existing.hasReEntered = true;
      existing.isRetiredLimit = false;
    }

    const updated: Match = {
      ...activeMatch,
      [activeMatch.status === 'innings2' ? 'innings2' : 'innings1']: updatedInnings
    };

    updateMatchState(updated);
    setIsBatsmanModalOpen(false);
  };

  // Select Bowler Handler
  const handleSelectBowler = (playerId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('select bowler');
      return;
    }
    if (!currentInnings) return;

    const updatedInnings: Innings = {
      ...currentInnings,
      currentBowlerId: playerId
    };

    const updated: Match = {
      ...activeMatch,
      [activeMatch.status === 'innings2' ? 'innings2' : 'innings1']: updatedInnings
    };

    updateMatchState(updated);
    setIsBowlerModalOpen(false);
  };

  // Record Delivery Handler
  const handleRecordDelivery = (input: DeliveryInput) => {
    if (!isAdmin) {
      onRequireAdmin?.('record delivery / score runs');
      return;
    }
    if (!currentInnings) return;

    try {
      const currentTournament =
        StorageService.getTournamentById(activeMatch.tournamentId || '') ||
        StorageService.getActiveTournament();
      const matchOvers = activeMatch.overs || currentTournament?.oversPerInnings || 10;
      const maxBatsmanOvers =
        currentTournament?.maxOversPerBatsman ||
        (matchOvers <= 6 ? Math.max(2, Math.floor(matchOvers * 0.5)) : Math.min(matchOvers, 4));
      const maxBowlerOvers =
        currentTournament?.maxOversPerBowler || Math.max(1, Math.ceil(matchOvers / 5));

      const result = ScoringEngine.recordDelivery(currentInnings, input, {
        oversPerInnings: matchOvers,
        maxOversPerBatsman: maxBatsmanOvers,
        maxOversPerBowler: maxBowlerOvers
      });

      if (result.alertMessage) {
        setBannerAlert(result.alertMessage);
        setTimeout(() => setBannerAlert(null), 5000);
      }

      // Check for ALL OUT condition (if requires new batsman, but no unbatted or retired eligible exist)
      if (result.requiresNewBatsman && !result.isInningsOver) {
        const avail = ScoringEngine.getAvailableBatsmen(
          result.updatedInnings,
          battingSquadPlayerIds,
          { totalOvers: matchOvers }
        );
        if (avail.unbattedPlayerIds.length === 0 && !avail.canReEnterRetired) {
          result.isInningsOver = true;
          result.updatedInnings.isCompleted = true;
          setBannerAlert('💥 ALL OUT! All squad batsmen have been dismissed.');
          setTimeout(() => setBannerAlert(null), 5000);
        }
      }

      let nextStatus = activeMatch.status;
      let nextMatch: Match = {
        ...activeMatch,
        [activeMatch.status === 'innings2' ? 'innings2' : 'innings1']: result.updatedInnings
      };

      // Check for Innings 1 Completion
      if (activeMatch.status === 'innings1' && result.isInningsOver) {
        // Prepare Innings 2
        const target = result.updatedInnings.totalRuns + 1;
        const inn2 = ScoringEngine.createInitialInnings(
          result.updatedInnings.bowlingTeamId,
          result.updatedInnings.teamId,
          target
        );
        nextStatus = 'innings_break';
        nextMatch = {
          ...nextMatch,
          status: 'innings_break',
          innings2: inn2
        };
        setBannerAlert(`🏁 Innings 1 Concluded! Target for 2nd innings: ${target} runs.`);
      }
      // Check for Innings 2 Completion (Match ends)
      else if (activeMatch.status === 'innings2' && result.isInningsOver) {
        const inn1Runs = nextMatch.innings1?.totalRuns || 0;
        const inn2Runs = result.updatedInnings.totalRuns;
        const target = result.updatedInnings.target || inn1Runs + 1;

        let winnerId: string | undefined = undefined;
        let margin = '';

        if (inn2Runs >= target) {
          winnerId = result.updatedInnings.teamId;
          const maxSquadWickets = battingSquadPlayerIds.length;
          const remainingWickets = maxSquadWickets - result.updatedInnings.wickets;
          margin = `Won by ${Math.max(1, remainingWickets)} wickets`;
        } else if (inn2Runs < inn1Runs) {
          winnerId = result.updatedInnings.bowlingTeamId;
          margin = `Won by ${inn1Runs - inn2Runs} runs`;
        } else {
          // Tied match: In knockouts (Semi-Final or Final), determine winner via boundary count or fewer wickets lost
          if (nextMatch.stage === 'Semi-Final' || nextMatch.stage === 'Final') {
            const inn1Fours = nextMatch.innings1?.batsmen.reduce((a, b) => a + (b.fours || 0), 0) || 0;
            const inn2Fours = result.updatedInnings.batsmen.reduce((a, b) => a + (b.fours || 0), 0) || 0;
            if (inn2Fours > inn1Fours) {
              winnerId = result.updatedInnings.teamId;
              margin = `Match Tied • Won on Boundary Count (${inn2Fours} vs ${inn1Fours} Fours)`;
            } else if (inn1Fours > inn2Fours) {
              winnerId = result.updatedInnings.bowlingTeamId;
              margin = `Match Tied • Won on Boundary Count (${inn1Fours} vs ${inn2Fours} Fours)`;
            } else {
              const inn1Wickets = nextMatch.innings1?.wickets || 0;
              const inn2Wickets = result.updatedInnings.wickets;
              if (inn2Wickets < inn1Wickets) {
                winnerId = result.updatedInnings.teamId;
                margin = `Match Tied • Won on Fewer Wickets Lost (${inn2Wickets} vs ${inn1Wickets} Wkts)`;
              } else {
                winnerId = result.updatedInnings.bowlingTeamId;
                margin = `Match Tied • Won on Fewer Wickets Lost (${inn1Wickets} vs ${inn2Wickets} Wkts)`;
              }
            }
          } else {
            margin = 'Match Tied';
          }
        }

        nextStatus = 'completed';
        nextMatch = {
          ...nextMatch,
          status: 'completed',
          winningTeamId: winnerId,
          winMargin: margin
        };

        setIsSummaryOpen(true);
      }

      updateMatchState(nextMatch);

      // Prompt next batsman or bowler if required
      if (result.requiresNewBatsman && !result.isInningsOver) {
        setIsBatsmanModalOpen(true);
      } else if (result.requiresNewBowler && !result.isInningsOver) {
        setIsBowlerModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Scoring error');
    }
  };

  // Undo delivery
  const handleUndoDelivery = () => {
    if (!isAdmin) {
      onRequireAdmin?.('undo delivery');
      return;
    }
    if (!currentInnings || currentInnings.balls.length === 0) return;
    const reverted = ScoringEngine.undoLastDelivery(currentInnings);
    const updated: Match = {
      ...activeMatch,
      [activeMatch.status === 'innings2' ? 'innings2' : 'innings1']: reverted
    };
    updateMatchState(updated);
    setBannerAlert('↩️ Last delivery undone successfully.');
    setTimeout(() => setBannerAlert(null), 3000);
  };

  // Resume completed match for corrections or undo
  const handleResumeCompletedMatch = () => {
    if (!isAdmin) {
      onRequireAdmin?.('resume match & edit scores');
      return;
    }
    if (
      !window.confirm(
        'Re-open this concluded match? Its status will revert to live scoring so you can correct or undo deliveries.'
      )
    ) {
      return;
    }
    const prevStatus =
      activeMatch.innings2 && activeMatch.innings2.balls.length > 0 ? 'innings2' : 'innings1';
    const targetInn = prevStatus === 'innings2' ? activeMatch.innings2 : activeMatch.innings1;
    if (targetInn) {
      targetInn.isCompleted = false;
    }
    const updated: Match = {
      ...activeMatch,
      status: prevStatus,
      winningTeamId: undefined,
      winMargin: undefined
    };
    updateMatchState(updated);
    setBannerAlert('🔓 Match re-opened for live scoring.');
    setTimeout(() => setBannerAlert(null), 4000);
  };

  // Restart current match fixture back to scheduled state
  const handleRestartCurrentFixture = () => {
    if (!isAdmin) {
      onRequireAdmin?.('restart active match fixture');
      return;
    }
    if (
      window.confirm(
        `Restart Match #${activeMatch.matchNumber} (${team1?.shortName || 'T1'} vs ${team2?.shortName || 'T2'})? All toss, score records, and deliveries will be reset back to scheduled.`
      )
    ) {
      const res = StorageService.restartMatch(activeMatch.id);
      alert(res.message);
      loadData();
      onRefreshData();
    }
  };

  // Umpire Decision: End live match prematurely (Draw or Win)
  const handleUmpireEndMatch = (outcome: { winnerId?: string; winMargin: string; notes?: string }) => {
    if (!isAdmin) {
      onRequireAdmin?.('end live match by umpire decision');
      return;
    }

    // Finalize innings 1
    const inn1 = activeMatch.innings1 ? { ...activeMatch.innings1, isCompleted: true } : undefined;
    // Finalize innings 2 or create closed innings 2
    let inn2 = activeMatch.innings2;
    if (inn2) {
      inn2 = { ...inn2, isCompleted: true };
    } else if (inn1) {
      inn2 = {
        ...ScoringEngine.createInitialInnings(inn1.bowlingTeamId, inn1.teamId, inn1.totalRuns + 1),
        isCompleted: true
      };
    }

    const updatedMatch: Match = {
      ...activeMatch,
      status: 'completed',
      innings1: inn1,
      innings2: inn2,
      winningTeamId: outcome.winnerId,
      winMargin: outcome.winMargin,
      notes: outcome.notes || (outcome.winnerId ? `${outcome.winMargin}` : 'Match Drawn by Umpire Decision')
    };

    updateMatchState(updatedMatch);
    setIsEndMatchModalOpen(false);
    setIsSummaryOpen(true);
    setBannerAlert(`🏁 Match ended by Umpire: ${outcome.winMargin}`);
  };

  // DRS Review
  const handleApplyDrsReview = (review: DrsReviewSubmission) => {
    if (!isAdmin) {
      onRequireAdmin?.('submit DRS review');
      return;
    }
    if (!currentInnings) return;
    const { updatedInnings, message } = ScoringEngine.handleDrsReview(
      currentInnings,
      review
    );
    const updated: Match = {
      ...activeMatch,
      [activeMatch.status === 'innings2' ? 'innings2' : 'innings1']: updatedInnings
    };
    updateMatchState(updated);
    setBannerAlert(message);
    setTimeout(() => setBannerAlert(null), 6000);
    setIsDrsModalOpen(false);
  };

  // Substitution
  const handleApplySubstitution = (
    outgoingPlayerId: string,
    incomingPlayerId: string,
    reason: string
  ) => {
    if (!isAdmin) {
      onRequireAdmin?.('use player substitution');
      return;
    }
    if (!currentInnings) return;
    const { updatedInnings, message, success } = ScoringEngine.handleSubstitution(
      currentInnings,
      outgoingPlayerId,
      incomingPlayerId,
      reason
    );
    if (!success) {
      alert(message);
      return;
    }
    const updated: Match = {
      ...activeMatch,
      [activeMatch.status === 'innings2' ? 'innings2' : 'innings1']: updatedInnings
    };
    updateMatchState(updated);
    setBannerAlert(message);
  };

  // Start 2nd innings after break
  const handleStartInnings2 = () => {
    if (!isAdmin) {
      onRequireAdmin?.('start 2nd innings');
      return;
    }
    const updated: Match = {
      ...activeMatch,
      status: 'innings2'
    };
    updateMatchState(updated);
    setIsBatsmanModalOpen(true);
  };

  const currentTournament =
    StorageService.getTournamentById(activeMatch?.tournamentId || '') ||
    StorageService.getActiveTournament();
  const matchOvers = activeMatch?.overs || currentTournament?.oversPerInnings || 10;
  const maxBatsmanOvers =
    currentTournament?.maxOversPerBatsman ||
    (matchOvers <= 6 ? Math.max(2, Math.floor(matchOvers * 0.5)) : Math.min(matchOvers, 4));
  const maxBowlerOvers =
    currentTournament?.maxOversPerBowler || Math.max(1, Math.ceil(matchOvers / 5));

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Top Match Bar / Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            M{activeMatch.matchNumber}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex flex-wrap items-center gap-2">
              <span>{activeMatch.stage} Match • {activeMatch.venue}</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-extrabold flex items-center space-x-1">
                <Users className="w-2.5 h-2.5" />
                <span>{matchSquadSize} vs {matchSquadSize} Players</span>
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-extrabold">
                ⚡ {matchOvers} Overs Format
              </span>
            </div>
            <div className="text-base font-black text-white flex items-center space-x-2">
              <span>{team1?.name || 'Team 1'}</span>
              <span className="text-slate-500 text-xs">vs</span>
              <span>{team2?.name || 'Team 2'}</span>
            </div>
          </div>
        </div>

        {/* Match Select dropdown & View Scorecard */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              if (!isAdmin) {
                onRequireAdmin?.('create friendly match');
                return;
              }
              setIsFriendlyModalOpen(true);
            }}
            title="Start a 2-team friendly match without tournament"
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600/30 to-teal-600/30 hover:from-cyan-600/50 hover:to-teal-600/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Friendly Match</span>
            <span className="sm:hidden">+ Friendly</span>
          </button>

          <select
            value={activeMatch.id}
            onChange={(e) => {
              const selected = matches.find((m) => m.id === e.target.value);
              if (selected) {
                setActiveMatch(selected);
                StorageService.setActiveMatchId(selected.id);
              }
            }}
            className="flex-1 sm:flex-none bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            {matches.map((m) => {
              const tA = teams.find((t) => t.id === m.team1Id)?.shortName || 'T1';
              const tB = teams.find((t) => t.id === m.team2Id)?.shortName || 'T2';
              const isFriendly = m.stage === 'Friendly' || m.tournamentId === 'friendly';
              return (
                <option key={m.id} value={m.id}>
                  {isFriendly ? '🤝 [Friendly] ' : `Match #${m.matchNumber}: `}
                  {tA} vs {tB} ({m.status.toUpperCase()})
                </option>
              );
            })}
          </select>

          <button
            onClick={() => onOpenScorecard(activeMatch.id)}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scorecard</span>
          </button>

          {/* Mobile Server & QR Code Share */}
          {onOpenMobileServer && (
            <button
              onClick={onOpenMobileServer}
              title="Broadcast live score to mobile phones & spectators"
              className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Mobile Server</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          )}

          {/* Admin vs Spectator Role Indicator & Quick Switch */}
          {isAdmin ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="hidden md:inline">Admin Scorer</span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Log out of Admin Scorer mode and switch to Cricbuzz spectator view?')) {
                    if (onAdminLogout) {
                      onAdminLogout();
                    } else {
                      StorageService.logoutAdmin();
                      onRefreshData();
                    }
                  }
                }}
                className="ml-1 px-2 py-0.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                title="Log out of admin mode and watch as spectator"
              >
                <LogOut className="w-3 h-3" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold shrink-0">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Spectator Mode</span>
              <button
                type="button"
                onClick={() => onRequireAdmin?.('unlock official scorer keypad')}
                className="ml-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                title="Enter admin passcode to score matches"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Scorer Login</span>
              </button>
            </div>
          )}

          {/* End Game Button (Umpire Decision: Draw or Win) - ADMIN ONLY */}
          {isAdmin && activeMatch.status !== 'completed' && (
            <button
              onClick={() => setIsEndMatchModalOpen(true)}
              title="Umpire Match Control: Declare Draw or One Team Win"
              className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>End Game</span>
            </button>
          )}

          {/* Restart Fixture Button - ADMIN ONLY */}
          {isAdmin && (
            <button
              onClick={handleRestartCurrentFixture}
              title="Restart this fixture back to scheduled state"
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center space-x-1 transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Rule Alert Banner */}
      {bannerAlert && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/50 text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{bannerAlert}</span>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="text-xs text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* MATCH STATUS VIEWS */}

      {/* 1. Scheduled / Toss Stage */}
      {activeMatch.status === 'scheduled' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Coins className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Match Ready for Toss</h2>
          <p className="text-sm text-slate-400 mb-6">
            Rooftop Cricket Tournament Match #{activeMatch.matchNumber}. {matchOvers} overs per innings.
            Single-player batting format.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
              <TeamLogo team={team1} size="lg" className="mb-2" />
              <span className="font-bold text-white text-sm">{team1?.name || 'Team 1'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
              <TeamLogo team={team2} size="lg" className="mb-2" />
              <span className="font-bold text-white text-sm">{team2?.name || 'Team 2'}</span>
            </div>
          </div>

          {/* Scheduled Match Controller: Admin vs Spectator */}
          {isAdmin ? (
            <>
              {/* Team Chooser for Scheduled Match */}
              <div className="mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Choose / Change Match Teams:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newT1 = activeMatch.team2Id;
                      const newT2 = activeMatch.team1Id;
                      updateMatchState({
                        ...activeMatch,
                        team1Id: newT1,
                        team2Id: newT2
                      });
                    }}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <span>⇄ Swap Sides</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Team 1 (First Batting / Toss):
                    </label>
                    <select
                      value={team1.id}
                      onChange={(e) => {
                        const newId = e.target.value;
                        if (newId === team2.id) {
                          alert('Team 1 and Team 2 cannot be the same team.');
                          return;
                        }
                        updateMatchState({
                          ...activeMatch,
                          team1Id: newId
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === team2.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Team 2 (Opponent):
                    </label>
                    <select
                      value={team2.id}
                      onChange={(e) => {
                        const newId = e.target.value;
                        if (newId === team1.id) {
                          alert('Team 1 and Team 2 cannot be the same team.');
                          return;
                        }
                        updateMatchState({
                          ...activeMatch,
                          team2Id: newId
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.id === team1.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsTossOpen(true)}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Coins className="w-5 h-5" />
                <span>Conduct Official Match Toss</span>
              </button>
            </>
          ) : (
            <div className="space-y-3 mb-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scheduled • Waiting for Toss</span>
                </span>
                <p className="text-xs text-slate-400">
                  This match has not started yet. When toss is completed by the admin, live ball-by-ball score will appear here automatically!
                </p>
              </div>

              <button
                onClick={() => onRequireAdmin?.('conduct official match toss')}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login to Conduct Toss</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Innings Break View */}
      {activeMatch.status === 'innings_break' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-4">
            <Play className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Innings Break</h2>
          <p className="text-sm text-slate-300 mb-2">
            <strong>{activeMatch.innings1 ? (battingTeam?.name || 'Team') : 'Team'}</strong> scored{' '}
            <span className="text-emerald-400 font-extrabold text-lg">
              {activeMatch.innings1?.totalRuns}/{activeMatch.innings1?.wickets}
            </span>{' '}
            in {matchOvers} overs.
          </p>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl mb-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Target to Win</div>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {(activeMatch.innings1?.totalRuns || 0) + 1} Runs
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {activeMatch.innings2 ? (bowlingTeam?.name || 'Chasing team') : 'Chasing team'} requires{' '}
              {(activeMatch.innings1?.totalRuns || 0) + 1} runs from {matchOvers} overs ({matchOvers * 6} balls)
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={handleStartInnings2}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95 mb-6 cursor-pointer"
            >
              <Play className="w-5 h-5" />
              <span>Start 2nd Innings (Chase Target)</span>
            </button>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Innings Break • Target Set</span>
              </span>
              <p>2nd innings will start shortly when players take the field.</p>
            </div>
          )}

          {/* 1st Innings Timeline during Innings Break */}
          {activeMatch.innings1 && (
            <div className="text-left border-t border-slate-800 pt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>1st Innings Complete Score History & Timeline</span>
              </h3>
              <InningsScoreHistory
                innings={activeMatch.innings1}
                battingTeam={teams.find((t) => t.id === activeMatch.innings1?.teamId) || team1}
                bowlingTeam={teams.find((t) => t.id === activeMatch.innings1?.bowlingTeamId) || team2}
                oversPerInnings={matchOvers}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. Completed Match View */}
      {activeMatch.status === 'completed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Match Concluded</h2>
          <p className="text-base font-bold text-emerald-400 mb-6">{activeMatch.winMargin}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
              <TeamLogo team={team1} size="md" className="mb-1.5" />
              <div className="text-xs font-bold text-slate-400">{team1?.name || 'Team 1'}</div>
              <div className="text-xl font-black text-white mt-1">
                {activeMatch.innings1?.totalRuns}/{activeMatch.innings1?.wickets}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
              <TeamLogo team={team2} size="md" className="mb-1.5" />
              <div className="text-xs font-bold text-slate-400">{team2?.name || 'Team 2'}</div>
              <div className="text-xl font-black text-white mt-1">
                {activeMatch.innings2?.totalRuns}/{activeMatch.innings2?.wickets}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onOpenScorecard(activeMatch.id)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
            >
              <span>View Full Official Scorecard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Re-open Match Summary
            </button>
            <button
              onClick={handleResumeCompletedMatch}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center space-x-1.5 transition-colors"
            >
              {isAdmin ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume Match & Undo Last Delivery</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>🔒 Admin Login to Resume Concluded Match</span>
                </>
              )}
            </button>
          </div>

          {/* Completed Match Innings Timelines */}
          <div className="mt-8 text-left border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Match Score History & Timelines</span>
              </h3>

              <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletedInningsTab('inn1')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    completedInningsTab === 'inn1'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1st Innings ({team1?.shortName})
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedInningsTab('inn2')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    completedInningsTab === 'inn2'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2nd Innings ({team2?.shortName})
                </button>
              </div>
            </div>

            {completedInningsTab === 'inn1' && activeMatch.innings1 && (
              <InningsScoreHistory
                innings={activeMatch.innings1}
                battingTeam={teams.find((t) => t.id === activeMatch.innings1?.teamId) || team1}
                bowlingTeam={teams.find((t) => t.id === activeMatch.innings1?.bowlingTeamId) || team2}
                oversPerInnings={matchOvers}
              />
            )}

            {completedInningsTab === 'inn2' && activeMatch.innings2 && (
              <InningsScoreHistory
                innings={activeMatch.innings2}
                battingTeam={teams.find((t) => t.id === activeMatch.innings2?.teamId) || team2}
                bowlingTeam={teams.find((t) => t.id === activeMatch.innings2?.bowlingTeamId) || team1}
                comparisonInnings={activeMatch.innings1}
                comparisonTeam={teams.find((t) => t.id === activeMatch.innings1?.teamId) || team1}
                oversPerInnings={matchOvers}
              />
            )}
          </div>
        </div>
      )}

      {/* 4. Active Live Innings View (innings1 or innings2) */}
      {(activeMatch.status === 'innings1' || activeMatch.status === 'innings2') &&
        currentInnings && (
          <div>
            {!isAdmin ? (
              /* CRICBUZZ PURE SPECTATOR MODE (Live score only, ZERO run/wicket buttons) */
              <div className="space-y-6">
                {/* Cricbuzz Spectator Center */}
                <CricbuzzLiveSpectator
                  innings={currentInnings}
                  battingTeam={battingTeam}
                  bowlingTeam={bowlingTeam}
                  activeBatsman={activeBatsman}
                  activeBowler={activeBowler}
                  totalOvers={matchOvers}
                  maxBatsmanOvers={maxBatsmanOvers}
                  maxBowlerOvers={maxBowlerOvers}
                  onRequireAdmin={(desc) => onRequireAdmin?.(desc || 'unlock scoring keypad')}
                  onOpenMobileServer={onOpenMobileServer}
                />

                {/* Over Tracker: Visual legal balls in each over */}
                <div>
                  <OverTracker
                    balls={currentInnings.balls}
                    oversCompleted={currentInnings.oversCompleted}
                    ballsInCurrentOver={currentInnings.ballsInCurrentOver}
                    totalOvers={matchOvers}
                  />
                </div>

                {/* Live Progression, Over-by-Over Breakdown & Worm Curve */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-white block">
                          Official Match Score History & Worm Curve
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {currentInnings.balls.length} deliveries bowled • Over-by-over graph
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <InningsScoreHistory
                      innings={currentInnings}
                      battingTeam={battingTeam}
                      bowlingTeam={bowlingTeam}
                      oversPerInnings={matchOvers}
                      comparisonInnings={
                        activeMatch.status === 'innings2' ? activeMatch.innings1 : undefined
                      }
                      comparisonTeam={
                        activeMatch.status === 'innings2'
                          ? activeMatch.innings1
                            ? teams.find((t) => t.id === activeMatch.innings1?.teamId)
                            : team1
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ADMIN SCORER CONTROL ROOM (Keypad, Pick Batsman/Bowler, DRS & Subs) */
              <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
                {/* Left Column (Desktop 7 cols): Live Scoreboard Banner, Over Tracker & Prompts */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Live Scoreboard Banner */}
                  <ScoreboardBanner
                    innings={currentInnings}
                    battingTeam={battingTeam}
                    bowlingTeam={bowlingTeam}
                    activeBatsman={activeBatsman}
                    activeBowler={activeBowler}
                    onOpenDrsModal={() => setIsDrsModalOpen(true)}
                    onOpenSubModal={() => setIsSubModalOpen(true)}
                    oversPerInnings={matchOvers}
                    maxOversPerBatsman={maxBatsmanOvers}
                    maxOversPerBowler={maxBowlerOvers}
                  />

                  {/* Over Tracker */}
                  <div>
                    <OverTracker
                      balls={currentInnings.balls}
                      oversCompleted={currentInnings.oversCompleted}
                      ballsInCurrentOver={currentInnings.ballsInCurrentOver}
                      totalOvers={matchOvers}
                    />
                  </div>

                  {/* Live Score History & Timeline */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <button
                      type="button"
                      onClick={() => setShowLiveTimeline(!showLiveTimeline)}
                      className="w-full p-4 bg-slate-950/80 hover:bg-slate-800/60 border-b border-slate-800 flex items-center justify-between transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-white block">
                            Live Score History & Timeline
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {currentInnings.balls.length} deliveries bowled • Over breakdown • Worm curve
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-xs text-emerald-400 font-bold">
                        <span>{showLiveTimeline ? 'Collapse' : 'Expand Timeline'}</span>
                        {showLiveTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {showLiveTimeline && (
                      <div className="p-4">
                        <InningsScoreHistory
                          innings={currentInnings}
                          battingTeam={battingTeam}
                          bowlingTeam={bowlingTeam}
                          oversPerInnings={matchOvers}
                          comparisonInnings={
                            activeMatch.status === 'innings2' ? activeMatch.innings1 : undefined
                          }
                          comparisonTeam={
                            activeMatch.status === 'innings2'
                              ? activeMatch.innings1
                                ? teams.find((t) => t.id === activeMatch.innings1?.teamId)
                                : team1
                              : undefined
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Prompt Banners if batsman or bowler missing */}
                  {requiresBatsmanSelection && (
                    <div className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-2xl text-center shadow-lg">
                      <p className="text-sm font-bold text-amber-300 mb-2">
                        No batsman on the pitch! A batsman must be selected to resume play.
                      </p>
                      <button
                        onClick={() => setIsBatsmanModalOpen(true)}
                        className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Pick Next Batsman
                      </button>
                    </div>
                  )}

                  {requiresBowlerSelection && !requiresBatsmanSelection && (
                    <div className="bg-purple-500/20 border border-purple-500/40 p-4 rounded-2xl text-center shadow-lg">
                      <p className="text-sm font-bold text-purple-300 mb-2">
                        Over completed! Select bowler for Over #{currentInnings.oversCompleted + 1} (Highest {maxBowlerOvers} overs per bowler).
                      </p>
                      <button
                        onClick={() => setIsBowlerModalOpen(true)}
                        className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Pick Bowler for Over {currentInnings.oversCompleted + 1}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column (Desktop 5 cols): Keypad for Admin Scorer */}
                <div className="lg:col-span-5 lg:sticky lg:top-20 mt-4 lg:mt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs shadow-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-emerald-300 font-bold text-[11px] sm:text-xs">
                          Scorer Keypad Active (Admin)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setIsEndMatchModalOpen(true)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                          title="End Live Match (Umpire Decision: Draw or One Team Win)"
                        >
                          <Flag className="w-3 h-3 text-rose-400" />
                          <span>End Match</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Log out of Admin Scorer mode and switch to Cricbuzz spectator view?')) {
                              if (onAdminLogout) {
                                onAdminLogout();
                              } else {
                                StorageService.logoutAdmin();
                                onRefreshData();
                              }
                            }
                          }}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                          title="Log out of Admin Scorer mode"
                        >
                          <LogOut className="w-3 h-3 text-red-400" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>

                    <ScoringKeypad
                      onRecordDelivery={handleRecordDelivery}
                      onUndoLastDelivery={handleUndoDelivery}
                      onChangeBowler={() => setIsBowlerModalOpen(true)}
                      onChangeBatsman={() => setIsBatsmanModalOpen(true)}
                      disabled={requiresBatsmanSelection || requiresBowlerSelection}
                      canUndo={currentInnings.balls.length > 0}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* MODALS */}
      <TossModal
        isOpen={isTossOpen}
        team1={team1}
        team2={team2}
        onCompleteToss={handleCompleteToss}
        onClose={() => setIsTossOpen(false)}
      />

      {currentInnings && (
        <>
          <SelectBatsmanModal
            isOpen={isBatsmanModalOpen}
            innings={currentInnings}
            battingTeamPlayerIds={battingSquadPlayerIds}
            totalOvers={matchOvers}
            maxOversPerBatsman={maxBatsmanOvers}
            onSelectBatsman={handleSelectBatsman}
            onClose={() => setIsBatsmanModalOpen(false)}
          />

          <SelectBowlerModal
            isOpen={isBowlerModalOpen}
            innings={currentInnings}
            bowlingTeamPlayerIds={bowlingSquadPlayerIds}
            currentBowlerId={currentInnings.currentBowlerId}
            totalOvers={matchOvers}
            maxOversPerBowler={maxBowlerOvers}
            onSelectBowler={handleSelectBowler}
            onClose={() => setIsBowlerModalOpen(false)}
          />

          <DrsReviewModal
            isOpen={isDrsModalOpen}
            innings={currentInnings}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            onApplyReview={handleApplyDrsReview}
            onClose={() => setIsDrsModalOpen(false)}
          />

          <SubstitutionModal
            isOpen={isSubModalOpen}
            innings={currentInnings}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            onApplySubstitution={handleApplySubstitution}
            onClose={() => setIsSubModalOpen(false)}
          />
        </>
      )}

      {activeMatch && (
        <MatchSummaryModal
          isOpen={isSummaryOpen}
          match={activeMatch}
          team1={team1}
          team2={team2}
          onViewScorecard={() => {
            setIsSummaryOpen(false);
            onOpenScorecard(activeMatch.id);
          }}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}

      {activeMatch && (
        <EndMatchModal
          isOpen={isEndMatchModalOpen}
          match={activeMatch}
          team1={team1}
          team2={team2}
          onConfirmEndMatch={handleUmpireEndMatch}
          onClose={() => setIsEndMatchModalOpen(false)}
        />
      )}

      {isFriendlyModalOpen && (
        <FriendlyMatchModal
          isOpen={isFriendlyModalOpen}
          onClose={() => setIsFriendlyModalOpen(false)}
          onStartScoring={(matchId) => {
            StorageService.setActiveMatchId(matchId);
            loadData();
            onRefreshData();
          }}
          onRefreshData={onRefreshData}
          isAdmin={isAdmin}
          onRequireAdmin={onRequireAdmin}
        />
      )}
    </div>
  );
};
