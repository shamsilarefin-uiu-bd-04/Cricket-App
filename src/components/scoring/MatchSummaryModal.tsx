import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Match, Team, Player } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { Trophy, Award, CheckCircle, ArrowRight } from 'lucide-react';

interface MatchSummaryModalProps {
  isOpen: boolean;
  match: Match;
  team1: Team;
  team2: Team;
  onViewScorecard: () => void;
  onClose: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  isOpen,
  match,
  team1,
  team2,
  onViewScorecard,
  onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const inn1 = match.innings1;
  const inn2 = match.innings2;

  const winnerTeam = match.winningTeamId
    ? match.winningTeamId === team1.id
      ? team1
      : team2
    : null;

  // Derive Best Performer / Player of the Match
  let potmPlayer: Player | undefined;
  if (match.playerOfTheMatchId) {
    potmPlayer = StorageService.getPlayerById(match.playerOfTheMatchId);
  } else {
    // Determine top run scorer or wicket taker
    let bestScore = -1;
    let bestPlayerId = '';

    [inn1, inn2].forEach((inn) => {
      inn?.batsmen.forEach((b) => {
        if (b.runs > bestScore) {
          bestScore = b.runs;
          bestPlayerId = b.playerId;
        }
      });
      inn?.bowlers.forEach((bw) => {
        const points = bw.wickets * 25 - bw.runsConceded;
        if (points > bestScore) {
          bestScore = points;
          bestPlayerId = bw.playerId;
        }
      });
    });

    if (bestPlayerId) {
      potmPlayer = StorageService.getPlayerById(bestPlayerId);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-center">
        {/* Trophy Header */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 mx-auto mb-4 shadow-xl shadow-amber-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          </div>
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block mb-2">
          Match Concluded • 9 Overs
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {winnerTeam ? `${winnerTeam.name} Wins!` : 'Match Tied!'}
        </h2>

        {match.winMargin && (
          <p className="text-sm font-semibold text-emerald-400 mt-1">
            {match.winMargin}
          </p>
        )}

        {/* Innings summary score boxes */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-2xl mb-1">{team1.logoEmoji}</div>
            <div className="text-xs font-bold text-slate-400 uppercase">{team1.name}</div>
            <div className="text-xl font-black text-white mt-1">
              {inn1?.totalRuns || 0}/{inn1?.wickets || 0}
            </div>
            <div className="text-[11px] text-slate-500">
              ({inn1?.oversCompleted || 0}.{inn1?.ballsInCurrentOver || 0} / 9 ov)
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-2xl mb-1">{team2.logoEmoji}</div>
            <div className="text-xs font-bold text-slate-400 uppercase">{team2.name}</div>
            <div className="text-xl font-black text-white mt-1">
              {inn2?.totalRuns || 0}/{inn2?.wickets || 0}
            </div>
            <div className="text-[11px] text-slate-500">
              ({inn2?.oversCompleted || 0}.{inn2?.ballsInCurrentOver || 0} / 9 ov)
            </div>
          </div>
        </div>

        {/* Player of the Match Card */}
        {potmPlayer && (
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Player of the Match
                </div>
                <div className="text-sm font-black text-white">{potmPlayer.name}</div>
                <div className="text-xs text-slate-400">{potmPlayer.role}</div>
              </div>
            </div>
            <span className="text-xl">🌟</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onViewScorecard}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <span>View Full Official Scorecard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Close & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
