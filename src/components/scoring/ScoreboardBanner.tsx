import React from 'react';
import { Innings, Team, Player } from '../../types/cricket';
import { TeamLogo } from '../common/TeamLogo';
import { Shield, RefreshCw, AlertCircle, Sparkles, User, Zap } from 'lucide-react';

interface ScoreboardBannerProps {
  innings: Innings;
  battingTeam: Team;
  bowlingTeam: Team;
  activeBatsman?: Player;
  activeBowler?: Player;
  onOpenDrsModal: () => void;
  onOpenSubModal: () => void;
  oversPerInnings?: number;
  maxOversPerBatsman?: number;
  maxOversPerBowler?: number;
}

export const ScoreboardBanner: React.FC<ScoreboardBannerProps> = ({
  innings,
  battingTeam,
  bowlingTeam,
  activeBatsman,
  activeBowler,
  onOpenDrsModal,
  onOpenSubModal,
  oversPerInnings,
  maxOversPerBatsman,
  maxOversPerBowler
}) => {
  const safeBatting: Team = battingTeam || {
    id: 't1',
    name: 'Batting Team',
    shortName: 'BAT',
    primaryColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    logoEmoji: '🏏',
    playerIds: []
  };
  const safeBowling: Team = bowlingTeam || {
    id: 't2',
    name: 'Bowling Team',
    shortName: 'BOWL',
    primaryColor: '#f97316',
    secondaryColor: '#c2410c',
    logoEmoji: '⚡',
    playerIds: []
  };

  const totalOvers = oversPerInnings || innings.maxOvers || 10;
  const maxBatsmanOvers =
    maxOversPerBatsman ||
    (totalOvers <= 6 ? Math.max(2, Math.floor(totalOvers * 0.5)) : Math.min(totalOvers, 4));
  const maxBatsmanBalls = maxBatsmanOvers * 6;
  const maxBowlerOvers = maxOversPerBowler || Math.max(1, Math.ceil(totalOvers / 5));

  // Current active batsman stats
  const batsmanStats = activeBatsman
    ? innings.batsmen.find((b) => b.playerId === activeBatsman.id)
    : undefined;

  // Current active bowler stats
  const bowlerStats = activeBowler
    ? innings.bowlers.find((b) => b.playerId === activeBowler.id)
    : undefined;

  // Calculate overs in decimal format
  const currentOversDecimal = innings.oversCompleted + innings.ballsInCurrentOver / 6;
  const crr = currentOversDecimal > 0 ? (innings.totalRuns / currentOversDecimal).toFixed(2) : '0.00';

  // Chasing target calculations
  const isSecondInnings = typeof innings.target === 'number';
  const target = innings.target || 0;
  const runsNeeded = target - innings.totalRuns;
  const matchTotalBalls = totalOvers * 6;
  const ballsRemaining = Math.max(0, matchTotalBalls - innings.totalLegalBalls);
  const rrr = ballsRemaining > 0 && runsNeeded > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

  // Batsman limit
  const batsmanBalls = batsmanStats?.ballsFaced || 0;
  const batsmanProgress = Math.min(100, (batsmanBalls / maxBatsmanBalls) * 100);
  const batsmanBallsLeft = Math.max(0, maxBatsmanBalls - batsmanBalls);

  // Bowler limit
  const bowlerBallsThisOver = bowlerStats?.ballsThisOver || 0;
  const bowlerOvers = bowlerStats?.oversBowled || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-4">
      {/* Top Banner: Match Score Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Batting Team and Big Score */}
          <div className="flex items-center space-x-4">
            <TeamLogo team={safeBatting} size="xl" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-300">{safeBatting.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  BATTING
                </span>
              </div>
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {innings.totalRuns}
                  <span className="text-2xl text-slate-400 font-bold">/{innings.wickets}</span>
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-400">
                  ({innings.oversCompleted}.{innings.ballsInCurrentOver} / {totalOvers} ov)
                </span>
              </div>
            </div>
          </div>

          {/* Target & Rates */}
          <div className="flex items-center space-x-4 text-center sm:text-right">
            <div>
              <div className="text-xs text-slate-400">Current Run Rate</div>
              <div className="text-lg font-extrabold text-emerald-400">{crr}</div>
            </div>

            {isSecondInnings && (
              <div className="border-l border-slate-800 pl-4">
                <div className="text-xs text-amber-300 font-semibold">
                  Target: {target} ({runsNeeded > 0 ? `Need ${runsNeeded} off ${ballsRemaining}b` : 'Target Achieved!'})
                </div>
                <div className="text-lg font-extrabold text-amber-400">
                  RRR: {rrr}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Active Single-Player Batsman & Active Bowler Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60">
        {/* Active Batsman Card (Single-player Batting Focus) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 uppercase tracking-wider">
              <span>🏏 Active Batsman (Solo on Crease)</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Limit: {maxBatsmanOvers} Overs ({maxBatsmanBalls} Balls)
            </span>
          </div>

          {activeBatsman ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                    #{activeBatsman.jerseyNumber || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>{activeBatsman.name}</span>
                      {activeBatsman.nickname && (
                        <span className="text-[10px] text-slate-400">"{activeBatsman.nickname}"</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-white">
                    {batsmanStats?.runs || 0}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">
                    ({batsmanStats?.ballsFaced || 0} balls)
                  </span>
                </div>
              </div>

              {/* Batsman stats subrow */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>
                  4s: <strong className="text-emerald-400">{batsmanStats?.fours || 0}</strong> • 6s
                  Hit:{' '}
                  <strong className="text-red-400">
                    {batsmanStats?.sixPenalties || 0} (-{((batsmanStats?.sixPenalties || 0) * 4)} runs)
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

              {/* Batsman Limit Progress Bar / Unrestricted badge */}
              {batsmanStats?.hasReEntered ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-2 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Re-entered: Batting without restriction (No auto-retire limit)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black">
                    UNRESTRICTED
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Batting Limit Meter: {batsmanBalls}/{maxBatsmanBalls} Legal Balls</span>
                    <span className={batsmanBallsLeft <= 6 ? 'text-amber-400 font-bold' : ''}>
                      {batsmanBallsLeft > 0 ? `${batsmanBallsLeft} balls left before auto-retire` : `${maxBatsmanOvers} Overs Reached!`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        batsmanBalls >= maxBatsmanBalls
                          ? 'bg-red-500'
                          : batsmanBalls >= Math.floor(maxBatsmanBalls * 0.75)
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${batsmanProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500 italic">
              No batsman selected. Please pick next batsman.
            </div>
          )}
        </div>

        {/* Active Bowler Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 flex items-center space-x-1 uppercase tracking-wider">
              <span>⚾ Active Bowler</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Highest {maxBowlerOvers} Overs Limit
            </span>
          </div>

          {activeBowler ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                    #{activeBowler.jerseyNumber || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>{activeBowler.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{activeBowler.bowlingStyle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white">
                    {bowlerStats?.wickets || 0}
                  </span>
                  <span className="text-xs text-slate-400">
                    /{bowlerStats?.runsConceded || 0}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    ({bowlerOvers}.{bowlerBallsThisOver} ov)
                  </div>
                </div>
              </div>

              {/* Bowler Details Subrow */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>
                  Wides: {bowlerStats?.wides || 0} • NBs: {bowlerStats?.noBalls || 0} • Dead Balls:{' '}
                  {bowlerStats?.deadBalls || 0}
                </span>
                <span>
                  Econ:{' '}
                  <strong className="text-slate-200">
                    {bowlerStats && bowlerStats.totalLegalBalls > 0
                      ? ((bowlerStats.runsConceded / bowlerStats.totalLegalBalls) * 6).toFixed(2)
                      : '0.00'}
                  </strong>
                </span>
              </div>

              {/* Bowler Limit Dots (Highest overs quota) */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Overs Bowled (Max {maxBowlerOvers}):</span>
                <div className="flex items-center space-x-1.5">
                  {Array.from({ length: maxBowlerOvers }, (_, i) => i + 1).map((slot) => (
                    <span
                      key={slot}
                      className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        slot <= bowlerOvers
                          ? 'bg-purple-600 text-white'
                          : slot === bowlerOvers + 1 && bowlerBallsThisOver > 0
                          ? 'bg-purple-500 text-white font-bold'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500 italic">
              No bowler selected. Please pick bowler for this over.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Dead Ball Rule Warning, DRS & Subs */}
      <div className="bg-slate-950 p-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Dead ball status in over */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-400">Dead Balls this over:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              innings.deadBallsInCurrentOver >= 2
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {innings.deadBallsInCurrentOver} / 2
          </span>
          {innings.deadBallsInCurrentOver >= 2 && (
            <span className="text-[11px] text-rose-400 font-bold">
              ⚠️ Next dead ball adds +1 run extra!
            </span>
          )}
        </div>

        {/* DRS and Substitution Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenDrsModal}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 flex items-center space-x-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              DRS: {safeBatting.shortName} {innings.battingTeamReviewsRemaining ?? 2}/2 • {safeBowling.shortName} {innings.bowlingTeamReviewsRemaining ?? 2}/2
            </span>
          </button>

          <button
            onClick={onOpenSubModal}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-colors ${
              innings.substitutionUsed
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sub: {innings.substitutionUsed ? 'Used (1/1)' : 'Available (1/1)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
