import React, { useState } from 'react';
import { StorageService } from '../../utils/storage';
import { Team } from '../../types/cricket';
import { TeamLogo } from '../common/TeamLogo';
import { Users, Zap, Calendar, MapPin, Clock, X, PlusCircle, Check } from 'lucide-react';

interface FriendlyMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScoring?: (matchId: string) => void;
  onRefreshData: () => void;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
}

export const FriendlyMatchModal: React.FC<FriendlyMatchModalProps> = ({
  isOpen,
  onClose,
  onStartScoring,
  onRefreshData,
  isAdmin = false,
  onRequireAdmin
}) => {
  const existingTeams = StorageService.getTeams();

  const [team1Id, setTeam1Id] = useState<string>(existingTeams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState<string>(
    existingTeams[1]?.id || existingTeams[0]?.id || ''
  );
  const [overs, setOvers] = useState<number>(10);
  const [venue, setVenue] = useState<string>('Sky Arena Rooftop Court');
  const [scheduledTime, setScheduledTime] = useState<string>(
    new Date().toISOString().replace('T', ' ').slice(0, 16)
  );

  // Quick custom team creation toggles
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamShortName, setNewTeamShortName] = useState<string>('');
  const [newTeamEmoji, setNewTeamEmoji] = useState<string>('🏏');
  const [newTeamColor, setNewTeamColor] = useState<string>('#06b6d4');

  if (!isOpen) return null;

  const t1 = existingTeams.find((t) => t.id === team1Id);
  const t2 = existingTeams.find((t) => t.id === team2Id);

  const handleCreateNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    const shortName = (newTeamShortName || newTeamName.slice(0, 3)).toUpperCase();
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: newTeamName.trim(),
      shortName,
      primaryColor: newTeamColor,
      secondaryColor: '#0f172a',
      logoEmoji: newTeamEmoji || '🏏',
      playerIds: []
    };

    StorageService.saveTeam(newTeam);
    onRefreshData();
    setTeam2Id(newTeam.id);
    setIsCreatingNewTeam(false);
    setNewTeamName('');
    setNewTeamShortName('');
  };

  const handleCreateMatch = (startNow: boolean) => {
    if (!isAdmin) {
      onRequireAdmin?.('create friendly match');
      return;
    }

    if (!team1Id || !team2Id) {
      alert('Please select two teams.');
      return;
    }

    if (team1Id === team2Id) {
      alert('Team 1 and Team 2 must be different.');
      return;
    }

    const match = StorageService.createFriendlyMatch({
      team1Id,
      team2Id,
      overs: Number(overs) || 10,
      venue: venue.trim() || 'Sky Arena Rooftop Court',
      scheduledTime: scheduledTime || new Date().toISOString().replace('T', ' ').slice(0, 16),
      autoActivate: startNow
    });

    onRefreshData();
    onClose();

    if (startNow && onStartScoring) {
      onStartScoring(match.id);
    } else {
      alert(`Friendly match #${match.matchNumber} (${overs} Overs) successfully created!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center space-x-2">
              <span>Friendly Match (2 Teams)</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Standalone
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Score or schedule an independent 2-team exhibition game without tournament rules.
            </p>
          </div>
        </div>

        {/* Standalone Notice */}
        <div className="mb-5 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-start space-x-2.5">
          <span className="text-base leading-none">ℹ️</span>
          <span>
            Friendly matches are completely isolated. They will <strong>NOT</strong> alter tournament points table, Net Run Rate (NRR), or playoff qualifications.
          </span>
        </div>

        {/* Team 1 & Team 2 Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Team 1 */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Team 1 (Home)</span>
              {t1 && <TeamLogo team={t1} size="xs" />}
            </label>
            <select
              value={team1Id}
              onChange={(e) => setTeam1Id(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
            >
              {existingTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.logoEmoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team 2 */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Team 2 (Away)</span>
              {t2 && <TeamLogo team={t2} size="xs" />}
            </label>
            <select
              value={team2Id}
              onChange={(e) => setTeam2Id(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
            >
              {existingTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.logoEmoji} {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Add Custom Team Toggle */}
        <div className="mb-4">
          {!isCreatingNewTeam ? (
            <button
              type="button"
              onClick={() => setIsCreatingNewTeam(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Need a different team? Create custom team</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateNewTeam}
              className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-500/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">Quick Create Custom Team</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewTeam(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Dream XI"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Short Name</label>
                  <input
                    type="text"
                    value={newTeamShortName}
                    onChange={(e) => setNewTeamShortName(e.target.value)}
                    placeholder="DXI"
                    maxLength={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs text-slate-400">Emoji:</span>
                  {['🏏', '⚡', '🦅', '🔥', '🦁', '👑'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewTeamEmoji(em)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                        newTeamEmoji === em ? 'bg-cyan-500/30 border border-cyan-400 scale-105' : 'bg-slate-900'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Team</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Overs Format Selection */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Overs per Innings
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[5, 6, 8, 10, 12, 15, 20].map((ov) => (
              <button
                key={ov}
                type="button"
                onClick={() => setOvers(ov)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  overs === ov
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {ov} Ov {ov === 10 ? '★ Standard' : ov === 20 ? 'T20' : ''}
              </button>
            ))}
            <div className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400">Custom:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={overs}
                onChange={(e) => setOvers(Math.max(1, parseInt(e.target.value) || 10))}
                className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-white text-center font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-400">ov</span>
            </div>
          </div>
        </div>

        {/* Venue & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Venue</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Date & Time</span>
            </label>
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="YYYY-MM-DD HH:MM"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleCreateMatch(true)}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30 active:scale-98 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>⚡ Start Scoring Now (Toss)</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateMatch(false)}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Add to Fixtures</span>
          </button>
        </div>
      </div>
    </div>
  );
};
