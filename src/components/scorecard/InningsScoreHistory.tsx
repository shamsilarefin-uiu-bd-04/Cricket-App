import React, { useState } from 'react';
import { Innings, Team, Player, BallRecord, DrsRecord } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Target,
  Shield,
  RefreshCw,
  Zap,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  User,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface InningsScoreHistoryProps {
  innings: Innings;
  battingTeam?: Team;
  bowlingTeam?: Team;
  comparisonInnings?: Innings; // Optional: 1st innings to compare against in a chase
  comparisonTeam?: Team;
  oversPerInnings?: number;
}

export const InningsScoreHistory: React.FC<InningsScoreHistoryProps> = ({
  innings,
  battingTeam,
  bowlingTeam,
  comparisonInnings,
  comparisonTeam,
  oversPerInnings
}) => {
  const [filterType, setFilterType] = useState<
    'all' | 'wickets' | 'fours' | 'six_penalties' | 'extras'
  >('all');
  const [selectedOverFilter, setSelectedOverFilter] = useState<number | 'all'>('all');
  const [timelineViewMode, setTimelineViewMode] = useState<'overs' | 'events' | 'worm'>('overs');

  const getPlayer = (id: string): Player | undefined => StorageService.getPlayerById(id);

  const activeTournament = StorageService.getActiveTournament();
  const totalOvers = oversPerInnings || innings.maxOvers || activeTournament?.oversPerInnings || 10;

  // Group deliveries by overNumber (0 to totalOvers - 1)
  const oversMap: Record<number, BallRecord[]> = {};
  for (let o = 0; o < totalOvers; o++) {
    oversMap[o] = [];
  }

  innings.balls.forEach((b) => {
    const oNum = Math.min(totalOvers - 1, Math.max(0, b.overNumber));
    if (!oversMap[oNum]) oversMap[oNum] = [];
    oversMap[oNum].push(b);
  });

  // Calculate cumulative stats per over for the worm chart
  interface OverStat {
    overIndex: number; // 0 to totalOvers - 1
    overNumber: number; // 1 to totalOvers
    runsScoredInOver: number;
    wicketsInOver: number;
    foursInOver: number;
    sixPenaltiesInOver: number;
    cumulativeRuns: number;
    cumulativeWickets: number;
    bowlerId?: string;
    balls: BallRecord[];
  }

  let runningRuns = 0;
  let runningWickets = 0;
  const overStats: OverStat[] = [];

  for (let o = 0; o < totalOvers; o++) {
    const ballsInOver = oversMap[o] || [];
    if (ballsInOver.length === 0 && o > innings.oversCompleted) {
      break;
    }

    let overRuns = 0;
    let overWickets = 0;
    let overFours = 0;
    let overSixPenalties = 0;
    let primaryBowlerId: string | undefined = undefined;

    ballsInOver.forEach((b) => {
      overRuns += b.totalRunsOnBall;
      if (b.isWicket) overWickets += 1;
      if (b.runsOffBat === 4) overFours += 1;
      if (b.isSixPenalty) overSixPenalties += 1;
      if (!primaryBowlerId && b.bowlerId) primaryBowlerId = b.bowlerId;
    });

    runningRuns += overRuns;
    runningWickets += overWickets;

    overStats.push({
      overIndex: o,
      overNumber: o + 1,
      runsScoredInOver: overRuns,
      wicketsInOver: overWickets,
      foursInOver: overFours,
      sixPenaltiesInOver: overSixPenalties,
      cumulativeRuns: runningRuns,
      cumulativeWickets: runningWickets,
      bowlerId: primaryBowlerId,
      balls: ballsInOver
    });
  }

  // Filter deliveries for the detailed feed
  const filteredBalls = innings.balls.filter((b) => {
    if (selectedOverFilter !== 'all' && b.overNumber !== selectedOverFilter) {
      return false;
    }
    if (filterType === 'all') return true;
    if (filterType === 'wickets') return b.isWicket;
    if (filterType === 'fours') return b.runsOffBat === 4;
    if (filterType === 'six_penalties') return b.isSixPenalty;
    if (filterType === 'extras') return b.isWide || b.isNoBall || b.isDeadBall;
    return true;
  });

  // Collect key match events in chronological order
  interface TimelineEvent {
    id: string;
    type: 'four' | 'six_penalty' | 'wicket' | 'retirement' | 're_entry' | 'drs' | 'sub' | 'dead_ball_penalty';
    title: string;
    description: string;
    over: number;
    ball: number;
    time?: string;
    badgeColor: string;
  }

  const timelineEvents: TimelineEvent[] = [];

  // 1. Events from balls
  innings.balls.forEach((b, idx) => {
    const bowlerName = getPlayer(b.bowlerId)?.name || 'Bowler';
    const batsmanName = getPlayer(b.batsmanId)?.name || 'Batsman';
    const overDisplay = `${b.overNumber + 1}.${b.ballNumber}`;

    if (b.isWicket) {
      timelineEvents.push({
        id: `event_wkt_${idx}`,
        type: 'wicket',
        title: `🔴 WICKET! (${b.dismissal?.type?.toUpperCase() || 'OUT'})`,
        description: `${batsmanName} dismissed by ${bowlerName} at Over ${overDisplay}. Score: ${b.cumulativeRuns || innings.totalRuns}/${b.cumulativeWickets || innings.wickets}`,
        over: b.overNumber,
        ball: b.ballNumber,
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/50'
      });
    }

    if (b.isSixPenalty) {
      timelineEvents.push({
        id: `event_six_${idx}`,
        type: 'six_penalty',
        title: `⚠️ SIX PENALTY (-4 RUNS DEDUCTED)`,
        description: `${batsmanName} hit a 6 off ${bowlerName}! -4 runs penalized from team score.`,
        over: b.overNumber,
        ball: b.ballNumber,
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50'
      });
    }

    if (b.runsOffBat === 4) {
      timelineEvents.push({
        id: `event_four_${idx}`,
        type: 'four',
        title: `🎯 BOUNDARY 4!`,
        description: `${batsmanName} struck a boundary 4 off ${bowlerName}.`,
        over: b.overNumber,
        ball: b.ballNumber,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
      });
    }

    if (b.deadBallPenaltyAwarded) {
      timelineEvents.push({
        id: `event_db_${idx}`,
        type: 'dead_ball_penalty',
        title: `🚨 DEAD BALL OVER-LIMIT (+1 EXTRA)`,
        description: `3rd or subsequent dead ball in Over ${b.overNumber + 1}! +1 penalty run awarded to ${battingTeam?.name || 'Batting Team'}.`,
        over: b.overNumber,
        ball: b.ballNumber,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
      });
    }
  });

  // 2. Events from DRS history
  (innings.drsHistory || []).forEach((drs, idx) => {
    timelineEvents.push({
      id: `event_drs_${idx}`,
      type: 'drs',
      title: drs.isSuccessful
        ? `⚖️ DRS REVIEW UPHELD (Retained)`
        : `⚖️ DRS REVIEW LOST (-1 Deducted)`,
      description: `${drs.isBattingTeam ? 'Batting' : 'Bowling'} review for ${drs.targetType.toUpperCase()}: ${drs.reason}. ${drs.impactDescription}`,
      over: drs.over,
      ball: drs.ball,
      badgeColor: drs.isSuccessful
        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
        : 'bg-slate-800 text-slate-300 border-slate-700'
    });
  });

  // 3. Events from substitutions
  (innings.substitutions || []).forEach((sub, idx) => {
    const inName = getPlayer(sub.incomingPlayerId)?.name || 'Incoming';
    const outName = getPlayer(sub.outgoingPlayerId)?.name || 'Outgoing';
    timelineEvents.push({
      id: `event_sub_${idx}`,
      type: 'sub',
      title: `🔄 TACTICAL SUBSTITUTION (1/1 Used)`,
      description: `${inName} came onto the field replacing ${outName} in Over ${sub.over + 1}. Reason: ${sub.reason}`,
      over: sub.over,
      ball: sub.ball,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
    });
  });

  // 4. Events from Batsman Retirements & Re-entry
  innings.batsmen.forEach((b) => {
    const pName = getPlayer(b.playerId)?.name || 'Batsman';
    if (b.isRetiredLimit) {
      timelineEvents.push({
        id: `event_ret_${b.playerId}`,
        type: 'retirement',
        title: `🛑 4-OVER MANDATORY RETIREMENT`,
        description: `${pName} completed 24 legal balls (4 overs maximum quota) and auto-retired. Eligible to return once all teammates face balls or are out.`,
        over: Math.min(9, Math.floor(b.ballsFaced / 6)),
        ball: b.ballsFaced % 6,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
      });
    }
    if (b.hasReEntered) {
      timelineEvents.push({
        id: `event_reenter_${b.playerId}`,
        type: 're_entry',
        title: `✨ UNRESTRICTED RETURN TO BAT`,
        description: `${pName} returned to the pitch with NO restrictions after all teammates completed their turns!`,
        over: innings.oversCompleted,
        ball: innings.ballsInCurrentOver,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
      });
    }
  });

  // Sort timeline events by over and ball
  timelineEvents.sort((a, b) => a.over * 10 + a.ball - (b.over * 10 + b.ball));

  // Render ball chip
  const renderBallBadge = (ball: BallRecord, idx: number) => {
    let text = `${ball.runsOffBat}`;
    let style = 'bg-slate-800 text-slate-300 border-slate-700';

    if (ball.isSixPenalty) {
      text = '-4';
      style = 'bg-rose-900/60 text-rose-300 border-rose-500 font-black';
    } else if (ball.isWicket) {
      text = 'W';
      style = 'bg-red-600 text-white border-red-500 font-extrabold';
    } else if (ball.isNoBallFour) {
      text = 'NB+4';
      style = 'bg-purple-600 text-white border-purple-400 font-bold';
    } else if (ball.isNoBall) {
      text = 'NB';
      style = 'bg-amber-600 text-white border-amber-400 font-bold';
    } else if (ball.isWide) {
      text = 'WD';
      style = 'bg-cyan-600 text-white border-cyan-400 font-bold';
    } else if (ball.isDeadBall) {
      text = ball.deadBallPenaltyAwarded ? 'DB+1' : 'DB';
      style = ball.deadBallPenaltyAwarded
        ? 'bg-amber-600 text-white border-amber-400 font-bold'
        : 'bg-slate-700 text-slate-300 border-slate-600';
    } else if (ball.runsOffBat === 4) {
      text = '4';
      style = 'bg-emerald-600 text-white border-emerald-400 font-extrabold shadow-sm shadow-emerald-500/40';
    } else if (ball.runsOffBat === 0) {
      text = '•';
      style = 'bg-slate-800 text-slate-400 border-slate-700';
    }

    const batsmanName = getPlayer(ball.batsmanId)?.name || 'Batsman';
    const bowlerName = getPlayer(ball.bowlerId)?.name || 'Bowler';
    const titleText = `${batsmanName} vs ${bowlerName} • ${ball.commentary}`;

    return (
      <div
        key={idx}
        title={titleText}
        className={`min-w-8 h-8 px-2 rounded-full border flex items-center justify-center text-xs transition-transform hover:scale-110 cursor-help ${style}`}
      >
        {text}
      </div>
    );
  };

  const currentRunRate = (
    innings.totalRuns /
    Math.max(0.1, innings.oversCompleted + innings.ballsInCurrentOver / 6)
  ).toFixed(2);

  const totalFours = innings.batsmen.reduce((acc, b) => acc + (b.fours || 0), 0);
  const totalSixPenalties = innings.batsmen.reduce((acc, b) => acc + (b.sixPenalties || 0), 0);

  return (
    <div className="space-y-6">
      {/* Innings Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <TeamLogo team={battingTeam} size="lg" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                {battingTeam?.name || 'Batting Team'} Score History
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {innings.totalRuns}/{innings.wickets}
                </span>
                <span className="text-sm text-slate-400 font-semibold">
                  ({innings.oversCompleted}.{innings.ballsInCurrentOver} / {totalOvers} Overs)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <span className="text-slate-500 font-semibold mr-1">Run Rate:</span>
              <strong className="text-emerald-400">{currentRunRate}</strong>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <span className="text-slate-500 font-semibold mr-1">Boundaries (4s):</span>
              <strong className="text-emerald-400">{totalFours}</strong>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <span className="text-slate-500 font-semibold mr-1">6 Penalties:</span>
              <strong className="text-rose-400">
                {totalSixPenalties > 0 ? `${totalSixPenalties} (-${totalSixPenalties * 4}r)` : '0'}
              </strong>
            </div>

            {innings.target && (
              <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 font-bold">
                Target: {innings.target}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Switcher (Over Breakdown vs Events Timeline vs Worm Chart) */}
      <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setTimelineViewMode('overs')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            timelineViewMode === 'overs'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Over-by-Over Timeline</span>
        </button>

        <button
          onClick={() => setTimelineViewMode('events')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            timelineViewMode === 'events'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Match Events Feed ({timelineEvents.length})</span>
        </button>

        <button
          onClick={() => setTimelineViewMode('worm')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            timelineViewMode === 'worm'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Run Progression Worm</span>
        </button>
      </div>

      {/* VIEW 1: Over-by-Over Progression Timeline Cards */}
      {timelineViewMode === 'overs' && (
        <div className="space-y-4">
          {overStats.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-3xl">
              No deliveries bowled in this innings yet.
            </div>
          ) : (
            overStats.map((stat) => {
              const bowler = stat.bowlerId ? getPlayer(stat.bowlerId) : undefined;
              const isMaiden = stat.balls.length >= 6 && stat.runsScoredInOver <= 0;
              const hasWicket = stat.wicketsInOver > 0;
              const hasSixPenalty = stat.sixPenaltiesInOver > 0;
              const isCurrentOver = stat.overIndex === innings.oversCompleted;

              return (
                <div
                  key={stat.overIndex}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-lg transition-all ${
                    isCurrentOver
                      ? 'border-emerald-500/50 shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Over Card Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-xs flex items-center justify-center">
                        {stat.overNumber}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-white text-sm">
                            Over {stat.overNumber} of 10
                          </span>
                          {isCurrentOver && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Active Over
                            </span>
                          )}
                          {isMaiden && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              🌟 Maiden
                            </span>
                          )}
                          {hasWicket && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                              🔴 {stat.wicketsInOver} Wicket{stat.wicketsInOver > 1 ? 's' : ''}
                            </span>
                          )}
                          {hasSixPenalty && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              ⚠️ Six Penalty
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Bowler: <strong>{bowler?.name || 'TBD'}</strong>
                          {bowler?.bowlingStyle && (
                            <span className="text-slate-500 ml-1">({bowler.bowlingStyle})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Over Run / Wicket stats & Cumulative Score */}
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">
                        Over Runs:{' '}
                        <strong
                          className={`font-black ${
                            stat.runsScoredInOver < 0
                              ? 'text-rose-400'
                              : stat.runsScoredInOver > 10
                              ? 'text-emerald-400'
                              : 'text-white'
                          }`}
                        >
                          {stat.runsScoredInOver > 0 ? `+${stat.runsScoredInOver}` : stat.runsScoredInOver}
                        </strong>
                      </div>
                      <div className="text-xs text-slate-300 font-bold">
                        Score at Over End:{' '}
                        <span className="text-white font-black text-sm">
                          {stat.cumulativeRuns}/{stat.cumulativeWickets}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px]">
                          (RR: {(stat.cumulativeRuns / stat.overNumber).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ball-by-ball chip badges for this over */}
                  <div className="flex items-center space-x-2 overflow-x-auto py-2 px-1 bg-slate-950/70 rounded-2xl border border-slate-800/80">
                    {stat.balls.length === 0 ? (
                      <span className="text-xs text-slate-500 italic px-2">
                        Awaiting first delivery of this over...
                      </span>
                    ) : (
                      stat.balls.map((b, idx) => renderBallBadge(b, idx))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: Match Events & Milestones Feed */}
      {timelineViewMode === 'events' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Chronological Events Timeline ({timelineEvents.length} Events)</span>
          </h3>

          {timelineEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No boundary, wicket, DRS, or penalty events recorded yet in this innings.
            </div>
          ) : (
            <div className="relative border-l border-slate-800 ml-4 space-y-6">
              {timelineEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="relative pl-6">
                  {/* Dot on timeline */}
                  <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full border ${evt.badgeColor}`}
                      >
                        {evt.title}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Over {evt.over + 1}.{evt.ball}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Run Progression Worm Chart */}
      {timelineViewMode === 'worm' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Innings Worm & Run Rate Curve</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative score progression over {totalOvers} overs
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>{battingTeam?.name || 'Innings Score'}</span>
              </span>
              {comparisonInnings && (
                <span className="flex items-center space-x-1.5 text-blue-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  <span>{comparisonTeam?.name || 'Innings 1'}</span>
                </span>
              )}
            </div>
          </div>

          {/* SVG Worm Curve Visualizer */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
            {overStats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Not enough overs completed to draw worm progression curve.
              </div>
            ) : (
              <div className="min-w-[500px]">
                {/* SVG Curve Canvas */}
                <svg viewBox="0 0 540 220" className="w-full h-52 overflow-visible">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((val, idx) => {
                    const y = 190 - (val / 100) * 160;
                    return (
                      <g key={idx}>
                        <line
                          x1="40"
                          y1={y}
                          x2="520"
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text x="15" y={y + 4} fill="#64748b" fontSize="10" fontWeight="bold">
                          {val}r
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis labels for Overs 1 to totalOvers */}
                  {Array.from({ length: totalOvers }, (_, i) => i + 1).map((ov) => {
                    const x = 40 + (ov / totalOvers) * 460;
                    return (
                      <g key={ov}>
                        <line x1={x} y1="30" x2={x} y2="190" stroke="#1e293b" strokeWidth="1" />
                        <text
                          x={x}
                          y="208"
                          fill="#94a3b8"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Ov {ov}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw Comparison Curve if available (e.g. 1st innings target curve) */}
                  {comparisonInnings && comparisonInnings.balls.length > 0 && (
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      points={(() => {
                        let compRuns = 0;
                        const pts = ['40,190'];
                        for (let o = 1; o <= totalOvers; o++) {
                          const oBalls = comparisonInnings.balls.filter(
                            (b) => b.overNumber === o - 1
                          );
                          const oRuns = oBalls.reduce((acc, b) => acc + b.totalRunsOnBall, 0);
                          compRuns += oRuns;
                          const x = 40 + (o / totalOvers) * 460;
                          const y = Math.max(25, 190 - (compRuns / 100) * 160);
                          pts.push(`${x},${y}`);
                        }
                        return pts.join(' ');
                      })()}
                    />
                  )}

                  {/* Draw Active Innings Curve */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    points={(() => {
                      const pts = ['40,190'];
                      overStats.forEach((st) => {
                        const x = 40 + (st.overNumber / totalOvers) * 460;
                        const y = Math.max(25, 190 - (st.cumulativeRuns / 100) * 160);
                        pts.push(`${x},${y}`);
                      });
                      return pts.join(' ');
                    })()}
                  />

                  {/* Plot Dots for each completed over */}
                  {overStats.map((st) => {
                    const x = 40 + (st.overNumber / totalOvers) * 460;
                    const y = Math.max(25, 190 - (st.cumulativeRuns / 100) * 160);
                    const hasWkt = st.wicketsInOver > 0;
                    return (
                      <g key={st.overNumber}>
                        <circle
                          cx={x}
                          cy={y}
                          r={hasWkt ? 6 : 4}
                          fill={hasWkt ? '#ef4444' : '#10b981'}
                          stroke="#020617"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={y - 10}
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="black"
                          textAnchor="middle"
                        >
                          {st.cumulativeRuns}/{st.cumulativeWickets}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: Full Detailed Deliveries Log with Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Complete Ball-by-Ball Delivery Log ({filteredBalls.length})</span>
          </h3>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Balls' },
              { id: 'fours', label: 'Boundaries (4)' },
              { id: 'six_penalties', label: '6 Penalties (-4)' },
              { id: 'wickets', label: 'Wickets (W)' },
              { id: 'extras', label: 'Extras' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === f.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries list */}
        {filteredBalls.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No deliveries match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto pr-1">
            {filteredBalls.map((b, idx) => {
              const batsman = getPlayer(b.batsmanId);
              const bowler = getPlayer(b.bowlerId);
              const ballOverCoord = `${b.overNumber + 1}.${b.ballNumber}`;

              return (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-slate-400 font-mono w-10">
                      {ballOverCoord}
                    </span>
                    {renderBallBadge(b, idx)}
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1">
                        <span>{batsman?.name || 'Batsman'}</span>
                        <span className="text-slate-500 font-normal">facing</span>
                        <span>{bowler?.name || 'Bowler'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{b.commentary}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        b.totalRunsOnBall < 0
                          ? 'text-rose-400'
                          : b.totalRunsOnBall === 4
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {b.totalRunsOnBall > 0 ? `+${b.totalRunsOnBall}` : b.totalRunsOnBall} r
                    </span>
                    {b.cumulativeRuns !== undefined && (
                      <span className="text-[10px] text-slate-500 block">
                        Score: {b.cumulativeRuns}/{b.cumulativeWickets || 0}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
