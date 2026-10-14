import React from 'react';
import { Innings, Player } from '../../types/cricket';
import { ScoringEngine } from '../../utils/scoringEngine';
import { StorageService } from '../../utils/storage';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface SelectBowlerModalProps {
  isOpen: boolean;
  innings: Innings;
  bowlingTeamPlayerIds: string[];
  currentBowlerId?: string;
  totalOvers?: number;
  maxOversPerBowler?: number;
  onSelectBowler: (playerId: string) => void;
  onClose?: () => void;
}

export const SelectBowlerModal: React.FC<SelectBowlerModalProps> = ({
  isOpen,
  innings,
  bowlingTeamPlayerIds,
  currentBowlerId,
  totalOvers,
  maxOversPerBowler,
  onSelectBowler,
  onClose
}) => {
  if (!isOpen) return null;

  const activeTournament = StorageService.getActiveTournament();
  const resolvedTotalOvers = totalOvers || innings.maxOvers || activeTournament?.oversPerInnings || 10;
  const resolvedMaxOvers =
    maxOversPerBowler ||
    activeTournament?.maxOversPerBowler ||
    Math.max(1, Math.ceil(resolvedTotalOvers / 5));

  const { eligiblePlayerIds, bowlerOverCounts, warnings } = ScoringEngine.getEligibleBowlers(
    innings,
    bowlingTeamPlayerIds,
    currentBowlerId,
    { maxOversPerBowler: resolvedMaxOvers, totalOvers: resolvedTotalOvers }
  );

  const getPlayer = (id: string): Player | undefined => StorageService.getPlayerById(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Select Bowler for Over #{innings.oversCompleted + 1}</h2>
              <p className="text-xs text-slate-400">Total match length: {resolvedTotalOvers} Overs</p>
            </div>
          </div>

          {/* Rule banner */}
          <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg text-xs text-slate-300 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Bowler Rules:</strong> Highest {resolvedMaxOvers} overs per bowler ({resolvedTotalOvers}-over format). No back-to-back overs.
            </span>
          </div>

          {/* Strategic warnings */}
          {warnings.length > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs">
              {warnings.map((w, idx) => (
                <div key={idx}>{w}</div>
              ))}
            </div>
          )}
        </div>

        {/* Bowler List */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Eligible Bowlers ({eligiblePlayerIds.length})
          </h3>

          {eligiblePlayerIds.map((playerId) => {
            const p = getPlayer(playerId);
            if (!p) return null;
            const oversBowled = bowlerOverCounts[playerId] || 0;
            const bowlerStats = innings.bowlers.find((b) => b.playerId === playerId);

            return (
              <button
                key={p.id}
                onClick={() => onSelectBowler(p.id)}
                className="w-full p-3.5 rounded-xl bg-slate-800/90 hover:bg-purple-950/40 border border-slate-700 hover:border-purple-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">
                    #{p.jerseyNumber || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-purple-300 flex items-center space-x-2">
                      <span>{p.name}</span>
                      {oversBowled === 0 && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Needs 1 Over
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.bowlingStyle} • {oversBowled}/{resolvedMaxOvers} overs bowled (Max {resolvedMaxOvers})
                      {bowlerStats && ` (${bowlerStats.wickets}w, ${bowlerStats.runsConceded}r)`}
                    </div>
                  </div>
                </div>

                {/* Over dots indicator */}
                <div className="flex items-center space-x-1.5">
                  {Array.from({ length: resolvedMaxOvers }).map((_, slot) => (
                    <span
                      key={slot}
                      className={`w-2.5 h-2.5 rounded-full ${
                        slot < oversBowled ? 'bg-purple-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-purple-400 font-bold ml-2 group-hover:translate-x-1 transition-transform">
                    Bowl →
                  </span>
                </div>
              </button>
            );
          })}

          {/* Ineligible bowlers (Highest limit reached or bowled last over) */}
          <div className="pt-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Ineligible for This Over
            </h4>
            <div className="space-y-1.5 opacity-60">
              {bowlingTeamPlayerIds
                .filter((id) => !eligiblePlayerIds.includes(id))
                .map((playerId) => {
                  const p = getPlayer(playerId);
                  if (!p) return null;
                  const overs = bowlerOverCounts[playerId] || 0;
                  const isConsecutive = playerId === currentBowlerId;
                  const isMaxed = overs >= resolvedMaxOvers;

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300">{p.name}</span>
                      <span className="text-slate-400">
                        {isMaxed
                          ? `Reached highest ${resolvedMaxOvers} overs limit`
                          : isConsecutive
                          ? 'Just bowled previous over'
                          : `${overs}/${resolvedMaxOvers} overs`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        {onClose && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
