import React, { useState } from 'react';
import { Innings, Team, Player } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { RefreshCw, UserMinus, UserPlus, AlertCircle } from 'lucide-react';

interface SubstitutionModalProps {
  isOpen: boolean;
  innings: Innings;
  battingTeam: Team;
  bowlingTeam: Team;
  onApplySubstitution: (
    outgoingPlayerId: string,
    incomingPlayerId: string,
    reason: string
  ) => void;
  onClose: () => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  innings,
  battingTeam,
  bowlingTeam,
  onApplySubstitution,
  onClose
}) => {
  const [targetTeamId, setTargetTeamId] = useState<string>(battingTeam.id);
  const [outgoingPlayerId, setOutgoingPlayerId] = useState<string>('');
  const [incomingPlayerId, setIncomingPlayerId] = useState<string>('');
  const [reason, setReason] = useState<string>('Tactical Rooftop Substitution');

  if (!isOpen) return null;

  const targetTeam = targetTeamId === battingTeam.id ? battingTeam : bowlingTeam;
  const isSubstitutionAlreadyUsed = innings.substitutionUsed;

  const allPlayers = StorageService.getPlayers();
  const teamPlayers = allPlayers.filter((p) => targetTeam.playerIds.includes(p.id));

  // Eligible outgoing: active or in team
  // Eligible incoming: bench players or other team squad members
  const availableOutgoing = teamPlayers;
  const availableIncoming = teamPlayers.filter((p) => p.id !== outgoingPlayerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingPlayerId || !incomingPlayerId) {
      alert('Please select both an outgoing and an incoming player.');
      return;
    }
    if (outgoingPlayerId === incomingPlayerId) {
      alert('Outgoing and incoming players must be different.');
      return;
    }
    onApplySubstitution(outgoingPlayerId, incomingPlayerId, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Player Substitution</h2>
            <p className="text-xs text-slate-400">
              Innings Limit: <span className="font-bold text-amber-400">1 Substitution per innings</span>
            </p>
          </div>
        </div>

        {isSubstitutionAlreadyUsed ? (
          <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="text-sm font-bold text-red-200">Substitution Already Used</h3>
            <p className="text-xs text-slate-300">
              Only 1 substitution is allowed per team per innings in this tournament format.
            </p>
            {innings.substitutions.length > 0 && (
              <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2 rounded">
                Used in Over {innings.substitutions[0].over + 1}: Reason:{' '}
                {innings.substitutions[0].reason}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Substituting Team
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[battingTeam, bowlingTeam].map((team) => (
                  <button
                    type="button"
                    key={team.id}
                    onClick={() => {
                      setTargetTeamId(team.id);
                      setOutgoingPlayerId('');
                      setIncomingPlayerId('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      targetTeamId === team.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{team.logoEmoji}</span>
                    <span className="truncate">{team.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Outgoing Player */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <UserMinus className="w-3.5 h-3.5 text-red-400" />
                <span>Outgoing Player (Leaving Field)</span>
              </label>
              <select
                value={outgoingPlayerId}
                onChange={(e) => setOutgoingPlayerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Select Outgoing Player --</option>
                {availableOutgoing.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (#{p.jerseyNumber}) - {p.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Incoming Player */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Incoming Player (Entering Field)</span>
              </label>
              <select
                value={incomingPlayerId}
                onChange={(e) => setIncomingPlayerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Select Incoming Player --</option>
                {availableIncoming.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (#{p.jerseyNumber}) - {p.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Tactical Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="Tactical bowling/batting change"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Confirm Substitution</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
