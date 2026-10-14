import React, { useState } from 'react';
import { Team, Player, PlayerRole, BattingStyle, BowlingStyle } from '../../types/cricket';
import { StorageService, OFFICIAL_TEAM_LOGOS } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Crown,
  UserPlus,
  UserMinus,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface TeamsViewProps {
  onOpenPlayerProfile: (playerId: string) => void;
  onRefreshData: () => void;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
  dataVersion?: number;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  onOpenPlayerProfile,
  onRefreshData,
  isAdmin = false,
  onRequireAdmin,
  dataVersion
}) => {
  const teams = StorageService.getTeams();
  const allPlayers = StorageService.getPlayers();
  const freeAgents = StorageService.getFreeAgents();

  // Team Modals
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pick player modal
  const [pickingForTeamId, setPickingForTeamId] = useState<string | null>(null);
  const [selectedPoolPlayerId, setSelectedPoolPlayerId] = useState<string>('');

  // Edit player modal
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerNickname, setEditPlayerNickname] = useState('');
  const [editPlayerRole, setEditPlayerRole] = useState<PlayerRole>('Batsman');
  const [editPlayerBatStyle, setEditPlayerBatStyle] = useState<BattingStyle>('Right-Hand Bat');
  const [editPlayerBowlStyle, setEditPlayerBowlStyle] = useState<BowlingStyle>('Right-Arm Medium');
  const [editPlayerJersey, setEditPlayerJersey] = useState<number>(10);

  // Quick Register Player Modal (Register 1st in app, then pick into team)
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [quickRegName, setQuickRegName] = useState('');
  const [quickRegNickname, setQuickRegNickname] = useState('');
  const [quickRegRole, setQuickRegRole] = useState<PlayerRole>('All-Rounder');
  const [quickRegJersey, setQuickRegJersey] = useState<number>(7);

  // Team Form states
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('🏏');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [captainPlayerId, setCaptainPlayerId] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Image file is too large. Please select an image under 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setLogoUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getPlayer = (id: string): Player | undefined => allPlayers.find((p) => p.id === id);

  // Team Management Handlers
  const handleOpenEditTeam = (team: Team) => {
    if (!isAdmin) {
      onRequireAdmin?.('edit team details');
      return;
    }
    setEditingTeam(team);
    setName(team.name);
    setShortName(team.shortName);
    setLogoEmoji(team.logoEmoji);
    setLogoUrl(team.logoUrl || '');
    setPrimaryColor(team.primaryColor);
    setCaptainPlayerId(team.captainPlayerId || team.playerIds[0] || '');
  };

  const handleOpenAddTeam = () => {
    if (!isAdmin) {
      onRequireAdmin?.('add new team');
      return;
    }
    setEditingTeam(null);
    setName('');
    setShortName('');
    setLogoEmoji('⚡');
    setLogoUrl('');
    setPrimaryColor('#10b981');
    setCaptainPlayerId('');
    setIsAddModalOpen(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('save team details');
      return;
    }
    if (editingTeam) {
      const updated: Team = {
        ...editingTeam,
        name,
        shortName: shortName.toUpperCase(),
        logoEmoji,
        logoUrl: logoUrl || undefined,
        primaryColor,
        captainPlayerId: captainPlayerId || editingTeam.playerIds[0]
      };
      StorageService.saveTeam(updated);
      setEditingTeam(null);
    } else {
      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name,
        shortName: shortName.toUpperCase() || 'NEW',
        logoEmoji,
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor: primaryColor,
        captainPlayerId,
        playerIds: []
      };
      StorageService.saveTeam(newTeam);
      setIsAddModalOpen(false);
    }
    onRefreshData();
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('delete team');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete "${teamName}"? All players in this team will be returned to the registered free agent pool.`
      )
    ) {
      const res = StorageService.deleteTeam(teamId);
      alert(res.message);
      onRefreshData();
    }
  };

  // Player in Team Management
  const handleRemovePlayerFromTeam = (playerId: string, teamId: string, playerName: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('remove player from team squad');
      return;
    }
    if (
      window.confirm(
        `Remove "${playerName}" from the team squad? The player will remain registered in the app pool as a Free Agent.`
      )
    ) {
      const res = StorageService.removePlayerFromTeam(playerId, teamId);
      alert(res.message);
      onRefreshData();
    }
  };

  const handleOpenPickPlayer = (teamId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('pick player into team squad');
      return;
    }
    setPickingForTeamId(teamId);
    setSelectedPoolPlayerId(freeAgents[0]?.id || '');
  };

  const handleConfirmPickPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('add player to squad');
      return;
    }
    if (!pickingForTeamId || !selectedPoolPlayerId) {
      alert('Please select a player to pick into the squad.');
      return;
    }

    const res = StorageService.addPlayerToTeam(selectedPoolPlayerId, pickingForTeamId);
    alert(res.message);
    if (res.success) {
      setPickingForTeamId(null);
      onRefreshData();
    }
  };

  // Edit Player Handler
  const handleOpenEditPlayer = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      onRequireAdmin?.('edit player details');
      return;
    }
    setEditingPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerNickname(player.nickname || '');
    setEditPlayerRole(player.role);
    setEditPlayerBatStyle(player.battingStyle);
    setEditPlayerBowlStyle(player.bowlingStyle);
    setEditPlayerJersey(player.jerseyNumber || 10);
  };

  const handleSavePlayerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('save player profile');
      return;
    }
    if (!editingPlayer) return;

    const updated: Player = {
      ...editingPlayer,
      name: editPlayerName.trim(),
      nickname: editPlayerNickname.trim() || undefined,
      role: editPlayerRole,
      battingStyle: editPlayerBatStyle,
      bowlingStyle: editPlayerBowlStyle,
      jerseyNumber: Number(editPlayerJersey) || 99
    };

    StorageService.savePlayer(updated);
    alert(`Player profile for "${updated.name}" updated successfully!`);
    setEditingPlayer(null);
    onRefreshData();
  };

  // Quick Registration Handler (Register 1st in app, then pick into team)
  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('register new player');
      return;
    }
    if (!quickRegName.trim()) return;

    const newP: Player = {
      id: `player_${Date.now()}`,
      name: quickRegName.trim(),
      nickname: quickRegNickname.trim() || undefined,
      role: quickRegRole,
      battingStyle: 'Right-Hand Bat',
      bowlingStyle: 'Right-Arm Medium',
      jerseyNumber: Number(quickRegJersey) || 11,
      createdAt: new Date().toISOString()
    };

    StorageService.savePlayer(newP);
    alert(`"${newP.name}" is now registered in the app pool! You can now pick them into any team.`);
    setIsQuickRegisterOpen(false);
    setQuickRegName('');
    setQuickRegNickname('');
    onRefreshData();
  };

  const targetPickingTeam = pickingForTeamId
    ? teams.find((t) => t.id === pickingForTeamId)
    : null;

  const activeTournament = StorageService.getActiveTournament();
  const tournamentSquadTarget = activeTournament?.playersPerTeam || 5;

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Tournament Teams ({teams.length} Teams)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manual Teams Format • Squad Target: {tournamentSquadTarget} Players per Team • Full Player & Team Editing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Step 1: Register in app */}
          <button
            onClick={() => setIsQuickRegisterOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>1️⃣ Register Player in App</span>
          </button>

          {/* Add team (Always available for admin) */}
          <button
            onClick={handleOpenAddTeam}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* Registration Process Banner */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl mb-6 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong>Manual Squad Rules (Tournament Target: {tournamentSquadTarget} Players/Team):</strong>
          <span className="text-slate-400 ml-1">
            Each team features customizable squad sizes (Target: <strong>{tournamentSquadTarget} players</strong>). Squads with at least <strong>{Math.min(2, tournamentSquadTarget)} players</strong> can participate in matches. Players are <strong>first registered in the app pool</strong>, then managers can <strong>pick them into their squad</strong>. You can edit any player, transfer them to other teams, or release them back to free agency.
          </span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const squad = team.playerIds.map((id) => getPlayer(id)).filter(Boolean) as Player[];
          const captain = squad.find((p) => p.id === team.captainPlayerId) || squad[0];
          const isSquadFull = squad.length >= tournamentSquadTarget;

          return (
            <div
              key={team.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              {/* Header color accent */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: team.primaryColor }}
              />

              <div>
                {/* Team Info & Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TeamLogo team={team} size="xl" />
                    <div>
                      <h2 className="text-lg font-black text-white leading-tight">
                        {team.name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-bold text-slate-400">
                          [{team.shortName}]
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            squad.length >= tournamentSquadTarget
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : squad.length >= Math.min(2, tournamentSquadTarget)
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {squad.length >= tournamentSquadTarget
                            ? `Full Squad (${squad.length}/${tournamentSquadTarget})`
                            : squad.length >= Math.min(2, tournamentSquadTarget)
                            ? `Squad (${squad.length}/${tournamentSquadTarget})`
                            : `${squad.length}/${tournamentSquadTarget} (Need ${tournamentSquadTarget - squad.length} more)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditTeam(team)}
                      title="Edit Team Details"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      title="Delete Team"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Captain Banner */}
                {captain && (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5 mb-4 flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300 font-semibold truncate">
                      Captain: {captain.name} (#{captain.jerseyNumber})
                    </span>
                  </div>
                )}

                {/* Squad Members List */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Squad Members ({squad.length})</span>
                    {!isSquadFull && (
                      <span className="text-emerald-400 lowercase font-normal">
                        ({6 - squad.length} slots left)
                      </span>
                    )}
                  </div>

                  {squad.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => onOpenPlayerProfile(player.id)}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-black">
                          #{player.jerseyNumber || '?'}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-emerald-300 transition-colors block leading-tight">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {player.role} • {player.battingStyle}
                          </span>
                        </div>
                      </div>

                      {/* Edit & Remove Player Buttons */}
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditPlayer(player, e)}
                          title="Edit Player Details"
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemovePlayerFromTeam(player.id, team.id, player.name)}
                          title="Remove Player from Team (Returns to Free Agent Pool)"
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/50 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {squad.length === 0 && (
                    <div className="text-xs text-slate-500 italic py-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                      No players picked yet. Pick from registered player pool below.
                    </div>
                  )}

                  {/* Pick Player from Pool Button */}
                  {!isSquadFull && (
                    <button
                      onClick={() => handleOpenPickPlayer(team.id)}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-500/40 hover:border-emerald-500/80 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Pick Player from App Registry</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className={squad.length >= tournamentSquadTarget ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {squad.length >= tournamentSquadTarget ? '✓ Full Squad' : squad.length >= Math.min(2, tournamentSquadTarget) ? '• Squad Forming' : '• Incomplete Squad'}
                </span>
                <span>
                  {squad.length >= tournamentSquadTarget
                    ? `Squad Full (${squad.length}/${tournamentSquadTarget})`
                    : `${squad.length}/${tournamentSquadTarget} Players`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pick Player from Pool Modal */}
      {pickingForTeamId && targetPickingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Pick Player for {targetPickingTeam.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select an available registered player from the pool to add to the squad.
            </p>

            <form onSubmit={handleConfirmPickPlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Registered Player
                </label>

                {allPlayers.length === 0 ? (
                  <div className="text-xs text-slate-400">No players registered yet.</div>
                ) : (
                  <select
                    value={selectedPoolPlayerId}
                    onChange={(e) => setSelectedPoolPlayerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Choose Registered Player --</option>
                    {/* Free Agents first */}
                    <optgroup label="Free Agents / Unassigned">
                      {freeAgents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (#{p.jerseyNumber}) - {p.role} [{p.battingStyle}]
                        </option>
                      ))}
                    </optgroup>
                    {/* Other players if transfer */}
                    <optgroup label="Registered Players in other teams (Transfer)">
                      {allPlayers
                        .filter((p) => p.currentTeamId && p.currentTeamId !== pickingForTeamId)
                        .map((p) => {
                          const currentT = teams.find((t) => t.id === p.currentTeamId);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (#{p.jerseyNumber}) - from {currentT?.name || 'Other Team'}
                            </option>
                          );
                        })}
                    </optgroup>
                  </select>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPickingForTeamId(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Confirm Pick
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Edit Player: {editingPlayer.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update player attributes, jersey number, and style.
            </p>

            <form onSubmit={handleSavePlayerEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={editPlayerNickname}
                    onChange={(e) => setEditPlayerNickname(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Jersey #
                  </label>
                  <input
                    type="number"
                    value={editPlayerJersey}
                    onChange={(e) => setEditPlayerJersey(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={editPlayerRole}
                  onChange={(e) => setEditPlayerRole(e.target.value as PlayerRole)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Batting Style
                  </label>
                  <select
                    value={editPlayerBatStyle}
                    onChange={(e) => setEditPlayerBatStyle(e.target.value as BattingStyle)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Right-Hand Bat">Right-Hand Bat</option>
                    <option value="Left-Hand Bat">Left-Hand Bat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Bowling Style
                  </label>
                  <select
                    value={editPlayerBowlStyle}
                    onChange={(e) => setEditPlayerBowlStyle(e.target.value as BowlingStyle)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Right-Arm Fast">Right-Arm Fast</option>
                    <option value="Right-Arm Medium">Right-Arm Medium</option>
                    <option value="Right-Arm Spin">Right-Arm Spin</option>
                    <option value="Left-Arm Fast">Left-Arm Fast</option>
                    <option value="Left-Arm Spin">Left-Arm Spin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Player Registration Modal */}
      {isQuickRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Register Player in App Registry
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Step 1 of 2: Create the player profile. Afterwards, you can pick them into any team.
            </p>

            <form onSubmit={handleQuickRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahfuzul Alam"
                  value={quickRegName}
                  onChange={(e) => setQuickRegName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Thunder"
                    value={quickRegNickname}
                    onChange={(e) => setQuickRegNickname(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Jersey Number
                  </label>
                  <input
                    type="number"
                    value={quickRegJersey}
                    onChange={(e) => setQuickRegJersey(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={quickRegRole}
                  onChange={(e) => setQuickRegRole(e.target.value as PlayerRole)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="Wicket-Keeper">Wicket-Keeper</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuickRegisterOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Register in App Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add Team Modal */}
      {(editingTeam || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTeam ? `Edit Team: ${editingTeam.name}` : 'Create New Team'}
            </h3>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              {/* Official Tournament Logo Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Official Team Logos & Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OFFICIAL_TEAM_LOGOS.map((preset) => {
                    const isSelected = logoUrl === preset.logoUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setLogoUrl(preset.logoUrl);
                          setLogoEmoji(preset.logoEmoji);
                          if (!name || name === 'Team' || !editingTeam) {
                            setName(preset.name);
                            setShortName(preset.shortName);
                            setPrimaryColor(preset.primaryColor);
                          }
                        }}
                        className={`p-2 rounded-2xl border text-left flex flex-col items-center text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700/80 mb-1.5 shadow-sm bg-slate-900">
                          <img
                            src={preset.logoUrl}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white truncate w-full">
                          {preset.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          [{preset.shortName}]
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Logo Upload or URL */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Active Logo & Custom Upload</span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Reset / Remove Image
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <TeamLogo
                    team={{ name, logoUrl, logoEmoji, primaryColor }}
                    size="xl"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or enter logo image URL (e.g. /logos/...)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Skyline Vipers"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Short Name (3-4 chars)
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value.toUpperCase())}
                    placeholder="SKY"
                    maxLength={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 uppercase font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Logo Emoji
                  </label>
                  <input
                    type="text"
                    value={logoEmoji}
                    onChange={(e) => setLogoEmoji(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                  />
                </div>
              </div>

              {editingTeam && editingTeam.playerIds.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Team Captain
                  </label>
                  <select
                    value={captainPlayerId}
                    onChange={(e) => setCaptainPlayerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {editingTeam.playerIds.map((pId) => {
                      const p = getPlayer(pId);
                      return (
                        <option key={pId} value={pId}>
                          {p?.name} (#{p?.jerseyNumber})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeam(null);
                    setIsAddModalOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
