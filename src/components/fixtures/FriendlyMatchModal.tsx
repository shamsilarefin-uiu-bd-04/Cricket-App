import React, { useState, useEffect } from 'react';
import { StorageService } from '../../utils/storage';
import { Team, Player } from '../../types/cricket';
import { TeamLogo } from '../common/TeamLogo';
import {
  Users,
  Zap,
  Calendar,
  MapPin,
  Clock,
  X,
  PlusCircle,
  Check,
  Edit3,
  UserCheck
} from 'lucide-react';

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
  const allPlayers = StorageService.getPlayers();

  const [team1Id, setTeam1Id] = useState<string>(existingTeams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState<string>(
    existingTeams[1]?.id || existingTeams[0]?.id || ''
  );
  const [overs, setOvers] = useState<number>(10);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [venue, setVenue] = useState<string>('Sky Arena Rooftop Court');
  const [scheduledTime, setScheduledTime] = useState<string>(
    new Date().toISOString().replace('T', ' ').slice(0, 16)
  );

  // Custom player names editor state
  const [t1PlayerNames, setT1PlayerNames] = useState<string[]>([]);
  const [t2PlayerNames, setT2PlayerNames] = useState<string[]>([]);
  const [showSquadCustomizer, setShowSquadCustomizer] = useState<boolean>(false);

  // Quick custom team creation toggles
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamShortName, setNewTeamShortName] = useState<string>('');
  const [newTeamEmoji, setNewTeamEmoji] = useState<string>('🏏');
  const [newTeamColor, setNewTeamColor] = useState<string>('#06b6d4');

  const t1 = existingTeams.find((t) => t.id === team1Id);
  const t2 = existingTeams.find((t) => t.id === team2Id);

  // Synchronize player names when team or playersPerTeam changes
  useEffect(() => {
    if (!isOpen) return;

    const loadSquadNames = (team?: Team): string[] => {
      const names: string[] = [];
      const currentIds = team?.playerIds || [];
      const teamLabel = team?.name || 'Player';

      for (let i = 0; i < playersPerTeam; i++) {
        if (i < currentIds.length) {
          const p = allPlayers.find((player) => player.id === currentIds[i]);
          names.push(p?.name || `${teamLabel} ${i + 1}`);
        } else {
          names.push(`${teamLabel} Player ${i + 1}`);
        }
      }
      return names;
    };

    setT1PlayerNames(loadSquadNames(t1));
    setT2PlayerNames(loadSquadNames(t2));
  }, [team1Id, team2Id, playersPerTeam, isOpen]);

  if (!isOpen) return null;

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

    const cleanSquadSize = Math.max(2, Math.min(15, Number(playersPerTeam) || 6));

    // Resolve or update player entities with customized names
    const resolveSquadIds = (teamId: string, customNames: string[]): string[] => {
      const existingTeam = StorageService.getTeamById(teamId);
      const existingIds = existingTeam?.playerIds || [];
      const finalSquadIds: string[] = [];

      for (let i = 0; i < cleanSquadSize; i++) {
        const nameToUse = (customNames[i] || '').trim();

        if (i < existingIds.length) {
          const existingPlayer = StorageService.getPlayerById(existingIds[i]);
          if (existingPlayer) {
            if (nameToUse && existingPlayer.name !== nameToUse) {
              existingPlayer.name = nameToUse;
              StorageService.savePlayer(existingPlayer);
            }
            finalSquadIds.push(existingPlayer.id);
            continue;
          }
        }

        // Create new player entity if squad needs expansion
        const newP: Player = {
          id: `p_friendly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${i}`,
          name: nameToUse || `${existingTeam?.name || 'Team'} Player ${i + 1}`,
          role: i % 2 === 0 ? 'All-Rounder' : (i % 3 === 0 ? 'Bowler' : 'Batsman'),
          battingStyle: 'Right-Hand Bat',
          bowlingStyle: 'Right-Arm Medium',
          jerseyNumber: i + 1,
          currentTeamId: teamId,
          createdAt: new Date().toISOString()
        };
        StorageService.savePlayer(newP);
        finalSquadIds.push(newP.id);
      }

      if (existingTeam) {
        existingTeam.playerIds = Array.from(new Set([...existingTeam.playerIds, ...finalSquadIds]));
        StorageService.saveTeam(existingTeam);
      }

      return finalSquadIds;
    };

    const team1SquadIds = resolveSquadIds(team1Id, t1PlayerNames);
    const team2SquadIds = resolveSquadIds(team2Id, t2PlayerNames);

    const match = StorageService.createFriendlyMatch({
      team1Id,
      team2Id,
      overs: Number(overs) || 10,
      playersPerTeam: cleanSquadSize,
      team1PlayerIds: team1SquadIds,
      team2PlayerIds: team2SquadIds,
      venue: venue.trim() || 'Sky Arena Rooftop Court',
      scheduledTime: scheduledTime || new Date().toISOString().replace('T', ' ').slice(0, 16),
      autoActivate: startNow
    });

    onRefreshData();
    onClose();

    if (startNow && onStartScoring) {
      onStartScoring(match.id);
    } else {
      alert(`Friendly match #${match.matchNumber} (${cleanSquadSize} vs ${cleanSquadSize} • ${overs} Overs) successfully created!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
              Customize squad size (2 to 12 players), overs, and teams without tournament restrictions.
            </p>
          </div>
        </div>

        {/* Standalone Notice */}
        <div className="mb-5 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-start space-x-2.5">
          <span className="text-base leading-none">ℹ️</span>
          <span>
            Friendly matches are completely isolated. All-out and wickets will dynamically adapt to the chosen <strong>{playersPerTeam} vs {playersPerTeam}</strong> squad size.
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
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
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
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
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
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                        newTeamEmoji === em ? 'bg-cyan-500/30 border border-cyan-400 scale-105' : 'bg-slate-900'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Team</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Players per Team (Squad Size: 2 to 12 players) */}
        <div className="mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Players per Team (দলপ্রতি খেলোয়াড়: ২ থেকে ১২ জন)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSquadCustomizer(!showSquadCustomizer)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{showSquadCustomizer ? 'Hide Player Names' : 'Edit Player Names'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {[2, 3, 4, 5, 6, 8, 10, 11, 12].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setPlayersPerTeam(count)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  playersPerTeam === count
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {count}v{count} {count === 6 ? '★ Standard' : count === 11 ? 'XI' : count === 2 ? 'Duo' : ''}
              </button>
            ))}
            <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Custom:</span>
              <input
                type="number"
                min={2}
                max={15}
                value={playersPerTeam}
                onChange={(e) => setPlayersPerTeam(Math.max(2, Math.min(15, parseInt(e.target.value) || 6)))}
                className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5 text-xs text-white text-center font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-400">players</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            অল-আউট (All Out) এবং উইকেট মার্জিন ম্যাচটিতে <strong>{playersPerTeam}</strong> জন ব্যাটসম্যানের ওপর ভিত্তি করে নির্ধারিত হবে।
          </p>

          {/* Expandable Squad Customizer (Edit Player Names) */}
          {showSquadCustomizer && (
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Team 1 Squad */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-cyan-300 mb-1 flex items-center justify-between">
                  <span>{t1?.name || 'Team 1'} ({playersPerTeam} Players)</span>
                </div>
                {Array.from({ length: playersPerTeam }).map((_, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 w-4 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      value={t1PlayerNames[idx] || ''}
                      onChange={(e) => {
                        const copy = [...t1PlayerNames];
                        copy[idx] = e.target.value;
                        setT1PlayerNames(copy);
                      }}
                      placeholder={`Player ${idx + 1}`}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                ))}
              </div>

              {/* Team 2 Squad */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>{t2?.name || 'Team 2'} ({playersPerTeam} Players)</span>
                </div>
                {Array.from({ length: playersPerTeam }).map((_, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 w-4 text-right">{idx + 1}.</span>
                    <input
                      type="text"
                      value={t2PlayerNames[idx] || ''}
                      onChange={(e) => {
                        const copy = [...t2PlayerNames];
                        copy[idx] = e.target.value;
                        setT2PlayerNames(copy);
                      }}
                      placeholder={`Player ${idx + 1}`}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Overs Format Selection */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Overs per Innings (ইনিংস প্রতি ওভার)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[5, 6, 8, 10, 12, 15, 20].map((ov) => (
              <button
                key={ov}
                type="button"
                onClick={() => setOvers(ov)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30 active:scale-98 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>⚡ Start Scoring ({playersPerTeam}v{playersPerTeam})</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateMatch(false)}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Add to Fixtures</span>
          </button>
        </div>
      </div>
    </div>
  );
};
