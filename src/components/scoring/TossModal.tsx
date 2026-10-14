import React, { useState } from 'react';
import { Team, TossInfo } from '../../types/cricket';
import { Coins, CheckCircle2 } from 'lucide-react';

interface TossModalProps {
  isOpen: boolean;
  team1: Team;
  team2: Team;
  onCompleteToss: (toss: TossInfo) => void;
  onClose: () => void;
}

export const TossModal: React.FC<TossModalProps> = ({
  isOpen,
  team1,
  team2,
  onCompleteToss,
  onClose
}) => {
  const [flipping, setFlipping] = useState(false);
  const [winnerTeamId, setWinnerTeamId] = useState<string>(team1.id);
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');
  const [coinSide, setCoinSide] = useState<'heads' | 'tails' | null>(null);

  if (!isOpen) return null;

  const handleFlipCoin = () => {
    setFlipping(true);
    setCoinSide(null);
    setTimeout(() => {
      const isHeads = Math.random() > 0.5;
      setCoinSide(isHeads ? 'heads' : 'tails');
      setWinnerTeamId(isHeads ? team1.id : team2.id);
      setFlipping(false);
    }, 1000);
  };

  const handleConfirm = () => {
    onCompleteToss({
      winnerTeamId,
      decision,
      tossTime: new Date().toISOString()
    });
  };

  const winnerTeam = winnerTeamId === team1.id ? team1 : team2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-3">
            <Coins className={`w-8 h-8 ${flipping ? 'animate-spin' : ''}`} />
          </div>
          <h2 className="text-2xl font-black text-white">Match Coin Toss</h2>
          <p className="text-sm text-slate-400 mt-1">
            {team1.name} vs {team2.name}
          </p>
        </div>

        {/* Coin Flip Interactive Section */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center mb-5">
          <button
            onClick={handleFlipCoin}
            disabled={flipping}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <Coins className="w-4 h-4" />
            <span>{flipping ? 'Flipping Digital Coin...' : 'Spin the Toss Coin'}</span>
          </button>
          {coinSide && (
            <p className="text-xs text-amber-400 mt-2 font-medium">
              Coin landed on {coinSide.toUpperCase()}! {winnerTeam.name} won the toss.
            </p>
          )}
        </div>

        {/* Winner Selection (Manual override or coin decided) */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Toss Winner
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[team1, team2].map((team) => (
                <button
                  key={team.id}
                  onClick={() => setWinnerTeamId(team.id)}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                    winnerTeamId === team.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{team.logoEmoji}</span>
                  <span className="truncate">{team.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDecision('bat')}
                className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                  decision === 'bat'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>🏏</span>
                <span>Bat First</span>
              </button>
              <button
                onClick={() => setDecision('bowl')}
                className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                  decision === 'bowl'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>⚾</span>
                <span>Bowl First</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary text */}
        <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg text-xs text-slate-300 mb-6 text-center">
          <span className="font-bold text-white">{winnerTeam.name}</span> won the toss and elected to{' '}
          <span className="font-bold text-emerald-400 uppercase">{decision}</span> first.
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Start Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
