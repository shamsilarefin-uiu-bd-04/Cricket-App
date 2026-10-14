import React from 'react';
import { BallRecord } from '../../types/cricket';

interface OverTrackerProps {
  balls: BallRecord[];
  oversCompleted: number;
  ballsInCurrentOver: number;
  totalOvers?: number;
}

export const OverTracker: React.FC<OverTrackerProps> = ({
  balls,
  oversCompleted,
  ballsInCurrentOver,
  totalOvers = 10
}) => {
  // Get balls in current over
  // If innings completed all overs, show final over deliveries
  const isAllOversCompleted = oversCompleted >= totalOvers;
  const effectiveOverNum =
    isAllOversCompleted && balls.length > 0 ? totalOvers - 1 : oversCompleted;
  const currentOverBalls = balls.filter((b) => b.overNumber === effectiveOverNum);

  // Helper to format ball chip
  const renderBallBadge = (ball: BallRecord, idx: number) => {
    let text = `${ball.runsOffBat}`;
    let style = 'bg-slate-800 text-slate-300 border-slate-700';

    if (ball.isSixPenalty) {
      text = '-4';
      style = 'bg-red-600/30 text-red-300 border-red-500 font-extrabold';
    } else if (ball.isWicket) {
      text = 'W';
      style = 'bg-red-600 text-white border-red-500 font-bold';
    } else if (ball.isNoBallFour) {
      text = 'NB+4';
      style = 'bg-purple-600 text-white border-purple-400 font-bold';
    } else if (ball.isNoBall) {
      text = 'NB';
      style = 'bg-amber-600 text-white border-amber-400 font-bold';
    } else if (ball.isWide) {
      text = 'WD';
      style = 'bg-blue-600 text-white border-blue-400 font-bold';
    } else if (ball.isDeadBall) {
      text = ball.deadBallPenaltyAwarded ? 'DB+1' : 'DB';
      style = ball.deadBallPenaltyAwarded
        ? 'bg-rose-600 text-white border-rose-400 font-bold'
        : 'bg-slate-700 text-slate-300 border-slate-600';
    } else if (ball.runsOffBat === 4) {
      text = '4';
      style = 'bg-emerald-600 text-white border-emerald-400 font-extrabold shadow-sm shadow-emerald-500/50';
    } else if (ball.runsOffBat === 0) {
      text = '•';
      style = 'bg-slate-800 text-slate-400 border-slate-700';
    }

    return (
      <div
        key={idx}
        title={ball.commentary}
        className={`min-w-8 h-8 px-2 rounded-full border flex items-center justify-center text-xs transition-transform hover:scale-110 ${style}`}
      >
        {text}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {isAllOversCompleted ? (
            <span className="text-emerald-400 font-black">All {totalOvers} Overs Completed</span>
          ) : (
            `Current Over ${oversCompleted + 1} of ${totalOvers} (${ballsInCurrentOver}/6 Balls)`
          )}
        </span>
        <span className="text-[11px] text-slate-500">
          Total Deliveries Bowled: {balls.length}
        </span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto py-1">
        {currentOverBalls.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-1">
            Over starting... awaiting first delivery
          </div>
        ) : (
          currentOverBalls.map((b, idx) => renderBallBadge(b, idx))
        )}
      </div>
    </div>
  );
};
