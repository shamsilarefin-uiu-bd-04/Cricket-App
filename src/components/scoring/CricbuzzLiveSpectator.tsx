import React from 'react';
import { Innings, Team, Player, BallRecord } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import {
  Lock,
  Radio,
  Clock,
  Target,
  Eye,
  QrCode
} from 'lucide-react';

interface CricbuzzLiveSpectatorProps {
  innings: Innings;
  battingTeam: Team;
  bowlingTeam: Team;
  activeBatsman?: Player;
  activeBowler?: Player;
  totalOvers: number;
  maxBatsmanOvers: number;
  maxBowlerOvers: number;
  onRequireAdmin: (actionDesc?: string) => void;
  onOpenMobileServer?: () => void;
}

export const CricbuzzLiveSpectator: React.FC<CricbuzzLiveSpectatorProps> = ({
  innings,
  battingTeam,
  bowlingTeam,
  activeBatsman,
  activeBowler,
  totalOvers,
  maxBatsmanOvers,
  maxBowlerOvers,
  onRequireAdmin,
  onOpenMobileServer
}) => {
  // Current active batsman stats
  const batsmanStats = activeBatsman
    ? innings.batsmen.find((b) => b.playerId === activeBatsman.id)
    : undefined;

  // Current active bowler stats
  const bowlerStats = activeBowler
    ? innings.bowlers.find((b) => b.playerId === activeBowler.id)
    : undefined;

  // Overs and runs calculation
  const currentOversDecimal = innings.oversCompleted + innings.ballsInCurrentOver / 6;
  const crr = currentOversDecimal > 0 ? (innings.totalRuns / currentOversDecimal).toFixed(2) : '0.00';

  // Chasing target calculations
  const isSecondInnings = typeof innings.target === 'number';
  const target = innings.target || 0;
  const runsNeeded = target - innings.totalRuns;
  const matchTotalBalls = totalOvers * 6;
  const ballsRemaining = Math.max(0, matchTotalBalls - innings.totalLegalBalls);
  const rrr = ballsRemaining > 0 && runsNeeded > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

  // Current Over balls
  const currentOverIndex = innings.oversCompleted;
  const currentOverNumber = innings.oversCompleted + 1;
  const currentOverBalls = innings.balls.filter((b) => b.overNumber === currentOverIndex);

  // Recent 8 deliveries reversed for commentary stream
  const recentBalls = [...innings.balls].reverse().slice(0, 8);

  // Helper to color-code ball pills like Cricbuzz
  const getBallBadgeStyle = (b: BallRecord) => {
    if (b.isWicket) {
      return 'bg-rose-600 text-white border-rose-400 font-black shadow-rose-900/40';
    }
    if (b.isSixPenalty) {
      return 'bg-rose-950 text-rose-300 border-rose-500 font-black shadow-rose-950/60';
    }
    if (b.runsOffBat === 4 || b.isNoBallFour) {
      return 'bg-blue-600 text-white border-blue-400 font-black shadow-blue-900/40';
    }
    if (b.isDeadBall) {
      return 'bg-amber-600 text-white border-amber-400 font-bold';
    }
    if (b.isWide || b.isNoBall) {
      return 'bg-amber-500 text-slate-950 border-amber-300 font-bold';
    }
    if (b.totalRunsOnBall === 0) {
      return 'bg-slate-800 text-slate-400 border-slate-700 font-medium';
    }
    return 'bg-emerald-600 text-white border-emerald-400 font-bold';
  };

  const formatBallShort = (b: BallRecord) => {
    if (b.isSixPenalty) {
      return '6(-4)';
    }
    if (b.isWicket) {
      return 'W';
    }
    if (b.isNoBallFour) {
      return 'Nb+4';
    }
    if (b.isNoBall) {
      return b.totalRunsOnBall > 1 ? `Nb+${b.totalRunsOnBall - 1}` : 'Nb';
    }
    if (b.isWide) {
      return b.totalRunsOnBall > 1 ? `Wd+${b.totalRunsOnBall - 1}` : 'Wd';
    }
    if (b.isDeadBall) {
      return b.deadBallPenaltyAwarded ? 'DB+1' : 'DB';
    }
    if (b.runsOffBat === 4) {
      return '4';
    }
    if (b.totalRunsOnBall === 0) {
      return '•';
    }
    return `${b.totalRunsOnBall}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header: Cricbuzz Style Live Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black tracking-wider text-red-400 uppercase">
                CRICBUZZ LIVE
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700 font-semibold">
                SPECTATOR
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Real-time match updates • Read-only view
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMobileServer && (
            <button
              onClick={onOpenMobileServer}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Open QR code to share live match with spectators"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Share Match</span>
            </button>
          )}

          <button
            onClick={() => onRequireAdmin('unlock scoring keypad and edit runs')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Login with admin password to enter runs and score deliveries"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Scorer</span>
          </button>
        </div>
      </div>

      {/* Target & Match Equation Card (for 2nd innings) */}
      {isSecondInnings && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-slate-900 border border-amber-500/40 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-1">
            <span className="flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Target: {target} Runs</span>
            </span>
            <span className="text-white">
              Req RR: <strong className="text-amber-400">{rrr}</strong>
            </span>
          </div>
          <div className="text-sm font-black text-white">
            {runsNeeded > 0 ? (
              <span>
                {battingTeam.shortName} need <span className="text-amber-400">{runsNeeded}</span> runs in{' '}
                <span className="text-amber-400">{ballsRemaining}</span> balls
              </span>
            ) : (
              <span className="text-emerald-400">Target Achieved! {battingTeam.name} wins!</span>
            )}
          </div>
        </div>
      )}

      {/* Cricbuzz Match Context Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
          <span className="text-base font-black text-emerald-400">
            {innings.totalRuns}/{innings.wickets}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Overs</span>
          <span className="text-base font-black text-white">
            {innings.oversCompleted}.{innings.ballsInCurrentOver}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {totalOvers}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">CRR</span>
          <span className="text-base font-black text-cyan-400">{crr}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Reviews</span>
          <span className="text-xs font-black text-slate-200 mt-1 block">
            Bat: <strong className="text-emerald-400">{innings.battingTeamReviewsRemaining}</strong> | 
            Bowl: <strong className="text-cyan-400">{innings.bowlingTeamReviewsRemaining}</strong>
          </span>
        </div>
      </div>

      {/* Current Over Delivery Bar (Like Cricbuzz Over Pills) */}
      <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Over {currentOverNumber} Deliveries:</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {currentOverBalls.reduce((acc, b) => acc + b.totalRunsOnBall, 0)} runs this over
          </span>
        </div>

        {currentOverBalls.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {currentOverBalls.map((b, idx) => (
              <div
                key={`${b.overNumber}_${b.ballNumber}_${idx}`}
                className={`min-w-[34px] h-[34px] px-2 rounded-xl border flex items-center justify-center text-xs shadow-md transition-transform transform hover:scale-110 ${getBallBadgeStyle(
                  b
                )}`}
                title={`Over ${b.overNumber}.${b.ballNumber}: ${b.commentary}`}
              >
                {formatBallShort(b)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-1 italic">
            Over {currentOverNumber} has not started yet. Waiting for first delivery...
          </div>
        )}
      </div>

      {/* Striker & Bowler Live Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Active Batsman */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            🏏 Active Striker (Solo)
          </div>
          {activeBatsman ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white truncate max-w-[120px]">
                  {activeBatsman.name}
                </span>
                <span className="text-base font-black text-emerald-400">
                  {batsmanStats?.runs || 0}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    ({batsmanStats?.ballsFaced || 0}b)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>
                  4s: <strong>{batsmanStats?.fours || 0}</strong> • 6s:{' '}
                  <strong className="text-red-400">
                    {batsmanStats?.sixPenalties || 0}
                  </strong>
                </span>
                <span>
                  SR:{' '}
                  <strong className="text-slate-200">
                    {batsmanStats && batsmanStats.ballsFaced > 0
                      ? ((batsmanStats.runs / batsmanStats.ballsFaced) * 100).toFixed(1)
                      : '0.0'}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-1">No batsman on crease</div>
          )}
        </div>

        {/* Active Bowler */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
            ⚡ Active Bowler
          </div>
          {activeBowler ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white truncate max-w-[120px]">
                  {activeBowler.name}
                </span>
                <span className="text-base font-black text-purple-400">
                  {bowlerStats?.wickets || 0}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    /{bowlerStats?.runsConceded || 0}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>
                  Ov: <strong>{bowlerStats?.oversBowled || 0}</strong> ({maxBowlerOvers} max)
                </span>
                <span>
                  Econ:{' '}
                  <strong className="text-slate-200">
                    {bowlerStats && bowlerStats.oversBowled > 0
                      ? (bowlerStats.runsConceded / bowlerStats.oversBowled).toFixed(1)
                      : '0.0'}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-1">No bowler assigned</div>
          )}
        </div>
      </div>

      {/* Cricbuzz Ball-by-Ball Live Commentary Feed */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recent Ball Commentary</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Last 8 deliveries</span>
        </div>

        {recentBalls.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {recentBalls.map((b, idx) => {
              const bMan = StorageService.getPlayerById(b.batsmanId)?.name || 'Striker';
              const bWl = StorageService.getPlayerById(b.bowlerId)?.name || 'Bowler';
              return (
                <div
                  key={`${b.overNumber}_${b.ballNumber}_${idx}`}
                  className="flex items-start space-x-2.5 text-xs p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] border ${getBallBadgeStyle(
                      b
                    )}`}
                  >
                    {formatBallShort(b)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-[11px]">
                        {b.overNumber}.{b.ballNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {bWl} to {bMan}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mt-0.5 leading-snug break-words">
                      {b.commentary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-3 text-center italic">
            Match is in progress. Ball-by-ball commentary will appear here once bowled.
          </div>
        )}
      </div>

      {/* Spectator Notice & Admin Login Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-center">
        <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-300 mb-1">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Watching Live As Spectator</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
          Scores update live as official scorers record balls. Spectators cannot edit runs or change match state.
        </p>
        <button
          onClick={() => onRequireAdmin('official match scorer access')}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Are you the scorer? Login with Admin Pass</span>
        </button>
      </div>
    </div>
  );
};
