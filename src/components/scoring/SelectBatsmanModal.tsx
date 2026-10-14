import React from 'react';
import { Innings, Player } from '../../types/cricket';
import { ScoringEngine } from '../../utils/scoringEngine';
import { StorageService } from '../../utils/storage';
import { UserCheck, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';

interface SelectBatsmanModalProps {
  isOpen: boolean;
  innings: Innings;
  battingTeamPlayerIds: string[];
  totalOvers?: number;
  maxOversPerBatsman?: number;
  onSelectBatsman: (playerId: string) => void;
  onClose?: () => void;
  isInitial?: boolean;
}

export const SelectBatsmanModal: React.FC<SelectBatsmanModalProps> = ({
  isOpen,
  innings,
  battingTeamPlayerIds,
  totalOvers,
  maxOversPerBatsman,
  onSelectBatsman,
  onClose,
  isInitial = false
}) => {
  if (!isOpen) return null;

  const activeTournament = StorageService.getActiveTournament();
  const resolvedTotalOvers = totalOvers || innings.maxOvers || activeTournament?.oversPerInnings || 10;
  const resolvedMaxBatsmanOvers =
    maxOversPerBatsman ||
    activeTournament?.maxOversPerBatsman ||
    (resolvedTotalOvers <= 6 ? Math.max(2, Math.floor(resolvedTotalOvers * 0.5)) : Math.min(resolvedTotalOvers, 4));
  const resolvedMaxBatsmanBalls = resolvedMaxBatsmanOvers * 6;

  const { unbattedPlayerIds, canReEnterRetired, retiredPlayerIds, reEntryReason } =
    ScoringEngine.getAvailableBatsmen(innings, battingTeamPlayerIds, { totalOvers: resolvedTotalOvers });

  const getPlayer = (id: string): Player | undefined => StorageService.getPlayerById(id);

  // If literally no one can bat (all out, or retired and completed)
  const noBatsmenAvailable = unbattedPlayerIds.length === 0 && !canReEnterRetired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Select Next Batsman</h2>
              <p className="text-xs text-slate-400">Single-Player Batting Format (1 on pitch)</p>
            </div>
          </div>

          {/* Rule banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-300 space-y-1">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Key Batting Rules:</strong>
                <div>• Batsman out <strong>CANNOT play twice</strong> (আউট হওয়া ব্যাটসম্যান আর ব্যাট করতে পারবে না).</div>
                <div>• Batsman must retire after {resolvedMaxBatsmanOvers} overs ({resolvedMaxBatsmanBalls} balls).</div>
                <div>• <strong>Not-out batsman can bat again</strong> if overs or balls are remaining (আউট না হওয়া ব্যাটসম্যান ওভার বা বল বাকি থাকলে আবার ব্যাট করতে পারবে).</div>
                <div>• Once re-entered, the batsman plays with <strong>NO restriction</strong>!</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1 font-medium">
            <span>Overs Faced: {innings.oversCompleted}.{innings.ballsInCurrentOver} / {resolvedTotalOvers} Overs</span>
            <span className="font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {Math.max(0, resolvedTotalOvers * 6 - innings.totalLegalBalls)} Balls Remaining
            </span>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Unbatted squad members */}
          {unbattedPlayerIds.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Available Batsmen ({unbattedPlayerIds.length})
              </h3>
              <div className="space-y-2">
                {unbattedPlayerIds.map((playerId) => {
                  const p = getPlayer(playerId);
                  if (!p) return null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectBatsman(p.id)}
                      className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500/50 flex items-center justify-between text-left transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">
                          #{p.jerseyNumber || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-emerald-300 flex items-center space-x-2">
                            <span>{p.name}</span>
                            {p.nickname && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                "{p.nickname}"
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {p.role} • {p.battingStyle}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                        Take Crease →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Retired Batsmen Re-entry Section */}
          {canReEnterRetired && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl shadow-lg shadow-emerald-950/40">
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-black uppercase tracking-wide mb-1">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Re-entry Unlocked: No Batting Restriction!</span>
              </div>
              <p className="text-xs text-emerald-200/90 mb-3 font-medium">
                {reEntryReason || `Retired batsman can now return to the crease and bat freely without ${resolvedMaxBatsmanOvers}-over auto-retirement limit.`}
              </p>
              <div className="space-y-2">
                {retiredPlayerIds.map((playerId) => {
                  const p = getPlayer(playerId);
                  const batInnings = innings.batsmen.find((b) => b.playerId === playerId);
                  if (!p) return null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectBatsman(p.id)}
                      className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-between text-left transition-all group"
                    >
                      <div>
                        <div className="text-sm font-black text-white group-hover:text-emerald-300 flex items-center space-x-2">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            UNRESTRICTED
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Earlier: {batInnings?.runs || 0} runs ({batInnings?.ballsFaced || 0} balls) • Re-enters crease
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl group-hover:scale-105 transition-transform">
                        Bat Again ↩️
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dismissed / Previously Batted Players (Information only) */}
          {innings.batsmen.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Already Batted / Dismissed
              </h3>
              <div className="space-y-1.5 opacity-70">
                {innings.batsmen.map((b) => {
                  const p = getPlayer(b.playerId);
                  if (!p) return null;
                  return (
                    <div
                      key={b.playerId}
                      className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300">{p.name}</span>
                      <span className="text-slate-400">
                        {b.runs} ({b.ballsFaced}b) •{' '}
                        {b.isOut
                          ? `Out (${b.dismissalType})`
                          : b.isRetiredLimit
                          ? `Auto-Retired (${resolvedMaxBatsmanOvers} overs)`
                          : 'Batted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {noBatsmenAvailable && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-center text-xs text-red-300">
              <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="font-bold text-sm">All Batsmen Out / Ineligible</p>
              <p className="mt-1 text-slate-400">
                No further batsmen are eligible to bat. The innings has reached its conclusion.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {onClose && !isInitial && (
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
