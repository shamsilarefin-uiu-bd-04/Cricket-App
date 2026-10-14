import React, { useState } from 'react';
import { DeliveryInput } from '../../utils/scoringEngine';
import { DismissalType } from '../../types/cricket';
import { RotateCcw, AlertOctagon, Zap, ShieldAlert, Sparkles, UserX } from 'lucide-react';

interface ScoringKeypadProps {
  onRecordDelivery: (input: DeliveryInput) => void;
  onUndoLastDelivery: () => void;
  onChangeBowler: () => void;
  onChangeBatsman: () => void;
  disabled?: boolean;
  canUndo?: boolean;
}

export const ScoringKeypad: React.FC<ScoringKeypadProps> = ({
  onRecordDelivery,
  onUndoLastDelivery,
  onChangeBowler,
  onChangeBatsman,
  disabled = false,
  canUndo = false
}) => {
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<DismissalType>('bowled');
  const [commentary, setCommentary] = useState('');

  const handleRuns = (runs: number) => {
    onRecordDelivery({
      runsOffBat: runs,
      isSixPenalty: false,
      isWide: false,
      isNoBall: false,
      isNoBallFour: false,
      isDeadBall: false,
      isWicket: false
    });
  };

  const handleSixPenalty = () => {
    onRecordDelivery({
      runsOffBat: -4,
      isSixPenalty: true,
      commentary: '⚠️ SIX HIT! Rooftop Penalty: -4 runs deducted from score!'
    });
  };

  const handleWide = () => {
    onRecordDelivery({
      runsOffBat: 0,
      isWide: true,
      commentary: 'Wide ball bowled (+1 run extra, re-bowl)'
    });
  };

  const handleNoBall = () => {
    onRecordDelivery({
      runsOffBat: 0,
      isNoBall: true,
      commentary: 'No ball bowled (+1 run extra, re-bowl)'
    });
  };

  const handleNoBallFour = () => {
    onRecordDelivery({
      runsOffBat: 4,
      isNoBallFour: true,
      commentary: '💥 NO BALL + 4! Ball not counted, 5 runs added (1 NB + 4 off bat)!'
    });
  };

  const handleDeadBall = () => {
    onRecordDelivery({
      runsOffBat: 0,
      isDeadBall: true,
      commentary: 'Dead ball delivery'
    });
  };

  const confirmWicket = () => {
    onRecordDelivery({
      runsOffBat: 0,
      isWicket: true,
      dismissalType: wicketType,
      commentary: `OUT! Dismissed via ${wicketType}.`
    });
    setShowWicketModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Scoring Control Pad
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onChangeBatsman}
            disabled={disabled}
            className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Change Batsman
          </button>
          <button
            onClick={onChangeBowler}
            disabled={disabled}
            className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Change Bowler
          </button>
          <button
            onClick={onUndoLastDelivery}
            disabled={!canUndo || disabled}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
              canUndo && !disabled
                ? 'bg-slate-800 hover:bg-red-950/40 text-red-400 border border-red-800/40'
                : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo Ball</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Runs */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3">
        {[0, 1, 2, 3].map((run) => (
          <button
            key={run}
            onClick={() => handleRuns(run)}
            disabled={disabled}
            className="py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xl sm:text-2xl shadow hover:border-slate-500 transition-all active:scale-95 disabled:opacity-40"
          >
            {run}
          </button>
        ))}

        {/* 4 Runs Boundary (Only 4-run shots allowed) */}
        <button
          onClick={() => handleRuns(4)}
          disabled={disabled}
          className="py-4 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400 text-white font-black text-xl sm:text-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center relative overflow-hidden"
        >
          <span>4</span>
          <span className="text-[9px] font-extrabold tracking-tighter text-emerald-200">
            BOUNDARY
          </span>
        </button>
      </div>

      {/* Specialty Row: 6 Penalty (-4 Runs) and No-Ball + 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
        {/* Hitting a 6 Results in -4 Penalty */}
        <button
          onClick={handleSixPenalty}
          disabled={disabled}
          className="p-3 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 border-2 border-red-500 text-white font-extrabold shadow-lg shadow-red-700/40 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-red-200" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black flex items-center space-x-1">
                <span>HIT A 6</span>
                <span className="text-red-200 bg-red-950/80 px-1.5 py-0.5 rounded text-[11px]">
                  -4 PENALTY
                </span>
              </div>
              <div className="text-[10px] text-red-200 font-medium">
                Over-the-roof loss: Deducts 4 team runs
              </div>
            </div>
          </div>
          <span className="text-lg font-black text-red-200 group-hover:scale-110 transition-transform">
            -4
          </span>
        </button>

        {/* Hitting a 4 on a No-Ball (1 NB + 4 bat = 5 runs, ball not counted) */}
        <button
          onClick={handleNoBallFour}
          disabled={disabled}
          className="p-3 rounded-xl bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 hover:from-purple-700 hover:to-indigo-700 border border-purple-500 text-white font-extrabold shadow-lg shadow-purple-800/30 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-200" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">NO-BALL + 4</div>
              <div className="text-[10px] text-purple-200 font-medium">
                Ball not counted • 5 runs added (1+4)
              </div>
            </div>
          </div>
          <span className="text-lg font-black text-purple-200 group-hover:scale-110 transition-transform">
            +5
          </span>
        </button>
      </div>

      {/* Extras and Wicket Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Wide */}
        <button
          onClick={handleWide}
          disabled={disabled}
          className="py-3 px-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 border border-blue-700 text-blue-200 font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-40"
        >
          <div>WIDE</div>
          <div className="text-[10px] text-blue-300 font-normal">+1 (Re-bowl)</div>
        </button>

        {/* No-Ball */}
        <button
          onClick={handleNoBall}
          disabled={disabled}
          className="py-3 px-2 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700 text-amber-200 font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-40"
        >
          <div>NO-BALL</div>
          <div className="text-[10px] text-amber-300 font-normal">+1 (Re-bowl)</div>
        </button>

        {/* Dead Ball (After 2 in over, +1 extra) */}
        <button
          onClick={handleDeadBall}
          disabled={disabled}
          className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-40"
        >
          <div>DEAD BALL</div>
          <div className="text-[10px] text-slate-400 font-normal">&gt;2 in over = +1 extra</div>
        </button>

        {/* Wicket */}
        <button
          onClick={() => setShowWicketModal(true)}
          disabled={disabled}
          className="py-3 px-2 rounded-xl bg-red-700 hover:bg-red-600 border border-red-500 text-white font-black text-xs sm:text-sm shadow-md shadow-red-700/40 transition-all active:scale-95 disabled:opacity-40"
        >
          <div>🔴 WICKET</div>
          <div className="text-[10px] text-red-200 font-normal">Out on Crease</div>
        </button>
      </div>

      {/* Wicket Dismissal Picker Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Confirm Batsman Dismissal</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Single-player format: Batsman is out and must leave the pitch.
            </p>

            <div className="space-y-2 mb-4">
              {(
                [
                  ['bowled', 'Bowled (Stumps shattered)'],
                  ['caught', 'Caught (Direct catch)'],
                  ['run_out', 'Run Out (Failed crease reach)'],
                  ['stumped', 'Stumped (Keeper stumping)'],
                  ['hit_wicket', 'Hit Wicket']
                ] as [DismissalType, string][]
              ).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setWicketType(type)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    wicketType === type
                      ? 'bg-red-500/20 border-red-500 text-red-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowWicketModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmWicket}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30"
              >
                Confirm Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
