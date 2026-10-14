import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Match, Team } from '../../types/cricket';
import { TeamLogo } from '../common/TeamLogo';
import {
  Flag,
  AlertTriangle,
  Trophy,
  Handshake,
  CheckCircle2,
  X,
  ShieldAlert
} from 'lucide-react';

interface EndMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  team1: Team;
  team2: Team;
  onConfirmEndMatch: (outcome: {
    winnerId?: string;
    winMargin: string;
    notes?: string;
  }) => void;
}

export const EndMatchModal: React.FC<EndMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  team1,
  team2,
  onConfirmEndMatch
}) => {
  const [outcomeType, setOutcomeType] = useState<'draw' | 'team1_win' | 'team2_win'>('draw');
  const [customMargin, setCustomMargin] = useState<string>('Match Drawn (Umpire Decision)');
  const [reason, setReason] = useState<string>('Rooftop match concluded early by official umpire decision.');

  if (!isOpen) return null;

  const handleSelectOutcome = (type: 'draw' | 'team1_win' | 'team2_win') => {
    setOutcomeType(type);
    if (type === 'draw') {
      setCustomMargin('Match Drawn (Umpire Decision)');
    } else if (type === 'team1_win') {
      setCustomMargin(`${team1.name} won by Umpire Decision`);
    } else if (type === 'team2_win') {
      setCustomMargin(`${team2.name} won by Umpire Decision`);
    }
  };

  const handleConfirm = () => {
    let winnerId: string | undefined = undefined;
    if (outcomeType === 'team1_win') winnerId = team1.id;
    if (outcomeType === 'team2_win') winnerId = team2.id;

    onConfirmEndMatch({
      winnerId,
      winMargin: customMargin.trim() || (winnerId ? 'Won by Umpire Decision' : 'Match Drawn'),
      notes: reason.trim() || undefined
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left overflow-hidden">
        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Umpire: End Live Match</h2>
            <p className="text-xs text-rose-300 font-semibold mt-0.5">
              Official premature match conclusion (Draw or Win)
            </p>
          </div>
        </div>

        {/* Current match state card */}
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl mb-5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <TeamLogo team={team1} size="sm" />
            <span className="font-bold text-white">{team1.shortName}</span>
            {match.innings1 && (
              <span className="text-slate-400 font-mono">
                {match.innings1.totalRuns}/{match.innings1.wickets}
              </span>
            )}
          </div>
          <span className="text-slate-500 font-bold px-2">vs</span>
          <div className="flex items-center space-x-2">
            {match.innings2 && (
              <span className="text-slate-400 font-mono">
                {match.innings2.totalRuns}/{match.innings2.wickets}
              </span>
            )}
            <span className="font-bold text-white">{team2.shortName}</span>
            <TeamLogo team={team2} size="sm" />
          </div>
        </div>

        {/* Outcome Choices */}
        <div className="space-y-2.5 mb-5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Select Official Match Outcome:
          </label>

          {/* Option 1: Draw */}
          <div
            onClick={() => handleSelectOutcome('draw')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              outcomeType === 'draw'
                ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span>Match Drawn / Tie</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-extrabold">
                    1 Pt Each
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Both teams share points equally in the tournament standings table.
                </div>
              </div>
            </div>
            {outcomeType === 'draw' && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
          </div>

          {/* Option 2: Team 1 Win */}
          <div
            onClick={() => handleSelectOutcome('team1_win')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              outcomeType === 'team1_win'
                ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span>{team1.name} Win</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-extrabold">
                    Full Win Pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Umpire declares {team1.name} the winner (DLS, forfeit, or score lead).
                </div>
              </div>
            </div>
            {outcomeType === 'team1_win' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          </div>

          {/* Option 3: Team 2 Win */}
          <div
            onClick={() => handleSelectOutcome('team2_win')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              outcomeType === 'team2_win'
                ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span>{team2.name} Win</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-extrabold">
                    Full Win Pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Umpire declares {team2.name} the winner (DLS, forfeit, or score lead).
                </div>
              </div>
            </div>
            {outcomeType === 'team2_win' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          </div>
        </div>

        {/* Outcome Description / Win Margin Input */}
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-semibold text-slate-300">
            Official Margin / Result Announcement:
          </label>
          <input
            type="text"
            value={customMargin}
            onChange={(e) => setCustomMargin(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
            placeholder="e.g. Match Drawn (Umpire Decision) or Won by Forfeit"
          />
        </div>

        {/* Reason / Umpire Notes */}
        <div className="space-y-1.5 mb-6">
          <label className="text-xs font-semibold text-slate-300">
            Umpire Reason / Stoppage Notes:
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
            placeholder="e.g. Rooftop rain curfew, player injury, or mutual forfeit"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancel (Resume Live)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-1.5 transition-all transform active:scale-95"
          >
            <Flag className="w-4 h-4" />
            <span>Confirm & End Game</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
