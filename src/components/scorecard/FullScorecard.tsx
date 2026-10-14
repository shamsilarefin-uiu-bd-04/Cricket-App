import React, { useState } from 'react';
import { Match, Team, Player, Innings } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import {
  FileSpreadsheet,
  ArrowLeft,
  Shield,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { InningsScoreHistory } from './InningsScoreHistory';
import { TeamLogo } from '../common/TeamLogo';

interface FullScorecardProps {
  matchId: string;
  onBack: () => void;
  dataVersion?: number;
}

export const FullScorecard: React.FC<FullScorecardProps> = ({ matchId, onBack, dataVersion }) => {
  const match = StorageService.getMatchById(matchId);
  const teams = StorageService.getTeams();
  const [selectedInningsTab, setSelectedInningsTab] = useState<'inn1' | 'inn2'>('inn1');
  const [viewMode, setViewMode] = useState<'traditional' | 'timeline'>('traditional');

  if (!match) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-slate-400">
        Match not found.
      </div>
    );
  }

  const team1 = teams.find((t) => t.id === match.team1Id) || teams[0];
  const team2 = teams.find((t) => t.id === match.team2Id) || teams[1];

  const inn1 = match.innings1;
  const inn2 = match.innings2;

  const currentInn: Innings | undefined = selectedInningsTab === 'inn1' ? inn1 : inn2;
  const currentBattingTeam = currentInn
    ? teams.find((t) => t.id === currentInn.teamId)
    : team1;
  const currentBowlingTeam = currentInn
    ? teams.find((t) => t.id === currentInn.bowlingTeamId)
    : team2;

  const tourney = StorageService.getTournamentById(match.tournamentId) || StorageService.getActiveTournament();
  const matchOvers = match.overs || currentInn?.maxOvers || tourney?.oversPerInnings || 10;
  const maxBatsmanOvers =
    tourney?.maxOversPerBatsman ||
    (matchOvers <= 6 ? Math.max(2, Math.floor(matchOvers * 0.5)) : Math.min(matchOvers, 4));
  const maxBowlerOvers =
    tourney?.maxOversPerBowler || Math.max(1, Math.ceil(matchOvers / 5));

  const getPlayer = (id: string): Player | undefined => StorageService.getPlayerById(id);

  // Helper to format dismissal text
  const formatDismissal = (b: any) => {
    if (b.isOut) {
      const bowler = b.bowlerId ? getPlayer(b.bowlerId)?.name : '';
      if (b.dismissalType === 'bowled') return `b ${bowler}`;
      if (b.dismissalType === 'caught') return `c & b ${bowler}`;
      if (b.dismissalType === 'stumped') return `st b ${bowler}`;
      if (b.dismissalType === 'run_out') return 'run out';
      if (b.dismissalType === 'hit_wicket') return `hit wicket b ${bowler}`;
      return `out (${b.dismissalType})`;
    }
    if (b.isRetiredLimit) {
      return (
        <span className="text-amber-400 font-semibold">
          Auto-Retired (4 overs limit)
        </span>
      );
    }
    return <span className="text-emerald-400 font-semibold">Not Out</span>;
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Back button & Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Matches / Live Scorer</span>
        </button>

        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          Match #{match.matchNumber} • {match.status.toUpperCase()}
        </span>
      </div>

      {/* Match Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 md:p-6 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Teams Summary */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="flex items-center space-x-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <TeamLogo team={team1} size="lg" />
              <div>
                <div className="text-sm font-bold text-white">{team1.name}</div>
                <div className="text-xl font-black text-slate-100">
                  {inn1?.totalRuns || 0}/{inn1?.wickets || 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({inn1?.oversCompleted || 0}.{inn1?.ballsInCurrentOver || 0} ov)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <TeamLogo team={team2} size="lg" />
              <div>
                <div className="text-sm font-bold text-white">{team2.name}</div>
                <div className="text-xl font-black text-slate-100">
                  {inn2?.totalRuns || 0}/{inn2?.wickets || 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({inn2?.oversCompleted || 0}.{inn2?.ballsInCurrentOver || 0} ov)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Result / Status details */}
          <div className="text-center md:text-right">
            {match.winMargin ? (
              <div className="text-base font-extrabold text-emerald-400">
                {match.winMargin}
              </div>
            ) : match.toss ? (
              <div className="text-xs text-slate-300">
                {teams.find((t) => t.id === match.toss?.winnerTeamId)?.name} won the toss &
                chose to {match.toss.decision} first
              </div>
            ) : (
              <div className="text-xs text-slate-400">Toss pending</div>
            )}
            <div className="text-xs text-slate-500 mt-1">
              Venue: {match.venue} • Format: Single-player batting ({matchOvers} Overs)
            </div>
          </div>
        </div>
      </div>

      {/* Innings Tabs & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setSelectedInningsTab('inn1')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
              selectedInningsTab === 'inn1'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>1st Innings: {inn1 ? teams.find((t) => t.id === inn1.teamId)?.name : team1.name}</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-semibold">
              {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : '0/0'}
            </span>
          </button>

          <button
            onClick={() => setSelectedInningsTab('inn2')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
              selectedInningsTab === 'inn2'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>2nd Innings: {inn2 ? teams.find((t) => t.id === inn2.teamId)?.name : team2.name}</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-semibold">
              {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : '0/0'}
            </span>
          </button>
        </div>

        {/* Sub-view switcher: Traditional Scorecard vs Score History & Timeline */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('traditional')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'traditional'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Scorecard</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'timeline'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Score History & Timeline</span>
          </button>
        </div>
      </div>

      {/* Selected Innings Content */}
      {currentInn ? (
        viewMode === 'timeline' ? (
          <InningsScoreHistory
            innings={currentInn}
            battingTeam={currentBattingTeam}
            bowlingTeam={currentBowlingTeam}
            oversPerInnings={matchOvers}
            comparisonInnings={selectedInningsTab === 'inn2' ? inn1 : undefined}
            comparisonTeam={
              selectedInningsTab === 'inn2'
                ? inn1
                  ? teams.find((t) => t.id === inn1.teamId)
                  : team1
                : undefined
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Batting Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>🏏 Batting: {currentBattingTeam?.name}</span>
                </h3>
              <span className="text-xs text-slate-400">
                Single-Player Batting (Max {maxBatsmanOvers} overs per batsman)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/30">
                    <th className="py-3 px-4">Batsman</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-3 text-right">R</th>
                    <th className="py-3 px-3 text-right">B</th>
                    <th className="py-3 px-3 text-right">4s</th>
                    <th className="py-3 px-3 text-right text-red-400">6s (-4 Penalty)</th>
                    <th className="py-3 px-4 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentInn.batsmen.map((b) => {
                    const p = getPlayer(b.playerId);
                    const sr = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={b.playerId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                          <span>{p?.name || b.playerId}</span>
                          {p?.nickname && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              "{p.nickname}"
                            </span>
                          )}
                          {b.hasReEntered && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-normal">
                              Re-entered
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">{formatDismissal(b)}</td>
                        <td className="py-3 px-3 text-right font-black text-white text-base">
                          {b.runs}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">{b.ballsFaced}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {b.fours}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-400">
                          {b.sixPenalties > 0 ? `${b.sixPenalties} (-${b.sixPenalties * 4}r)` : '0'}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 font-semibold">{sr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Innings Totals Footer */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-4 text-slate-400">
                <span>
                  <strong>Total: </strong>
                  <span className="text-white font-extrabold text-base">
                    {currentInn.totalRuns}/{currentInn.wickets}
                  </span>{' '}
                  ({currentInn.oversCompleted}.{currentInn.ballsInCurrentOver} / {matchOvers} Overs)
                </span>
                <span>
                  Run Rate:{' '}
                  <strong className="text-emerald-400">
                    {(
                      currentInn.totalRuns /
                      Math.max(0.1, currentInn.oversCompleted + currentInn.ballsInCurrentOver / 6)
                    ).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bowling Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>⚾ Bowling: {currentBowlingTeam?.name}</span>
              </h3>
              <span className="text-xs text-slate-400">Highest {maxBowlerOvers} Overs per Bowler</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/30">
                    <th className="py-3 px-4">Bowler</th>
                    <th className="py-3 px-3 text-right">O</th>
                    <th className="py-3 px-3 text-right">M</th>
                    <th className="py-3 px-3 text-right">R</th>
                    <th className="py-3 px-3 text-right">W</th>
                    <th className="py-3 px-3 text-right">Econ</th>
                    <th className="py-3 px-3 text-right">WD</th>
                    <th className="py-3 px-3 text-right">NB</th>
                    <th className="py-3 px-4 text-right">Dead Balls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentInn.bowlers.map((bw) => {
                    const p = getPlayer(bw.playerId);
                    const oversText = `${bw.oversBowled}.${bw.ballsThisOver}`;
                    const econ =
                      bw.totalLegalBalls > 0
                        ? ((bw.runsConceded / bw.totalLegalBalls) * 6).toFixed(2)
                        : '0.00';
                    return (
                      <tr key={bw.playerId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">
                          {p?.name || bw.playerId}
                          <span className="text-xs text-slate-400 block font-normal">
                            {p?.bowlingStyle}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-200">
                          {oversText}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">{bw.maidens}</td>
                        <td className="py-3 px-3 text-right font-bold text-white">
                          {bw.runsConceded}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-400 text-base">
                          {bw.wickets}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">{econ}</td>
                        <td className="py-3 px-3 text-right text-slate-400">{bw.wides}</td>
                        <td className="py-3 px-3 text-right text-slate-400">{bw.noBalls}</td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {bw.deadBalls}{' '}
                          {bw.deadBallPenalties > 0 && (
                            <span className="text-[10px] text-rose-400">
                              (+{bw.deadBallPenalties}p)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DRS Reviews and Substitutions summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DRS Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                <Shield className="w-4 h-4" />
                <span>DRS Reviews (2 per innings • Retained on win)</span>
              </div>
              <p className="text-xs text-slate-300">
                Remaining in this innings: <strong>{currentBattingTeam?.shortName || 'BAT'}: {currentInn.battingTeamReviewsRemaining ?? 2}/2</strong> • <strong>{currentBowlingTeam?.shortName || 'BOWL'}: {currentInn.bowlingTeamReviewsRemaining ?? 2}/2</strong> (Used:{' '}
                {currentInn.reviewsUsedCount})
              </p>
            </div>

            {/* Substitution Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                <RefreshCw className="w-4 h-4" />
                <span>Substitution (1 per innings)</span>
              </div>
              <p className="text-xs text-slate-300">
                {currentInn.substitutionUsed ? (
                  <span>
                    Sub used in Over {currentInn.substitutions[0]?.over + 1}:{' '}
                    {getPlayer(currentInn.substitutions[0]?.incomingPlayerId)?.name} replaced{' '}
                    {getPlayer(currentInn.substitutions[0]?.outgoingPlayerId)?.name}
                  </span>
                ) : (
                  <span>No tactical substitution used yet (1 remaining).</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )
    ) : (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
        Innings has not started yet.
      </div>
    )}
  </div>
);
};
