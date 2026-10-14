import React, { useState } from 'react';
import { Player, Team, PlayerRole, BattingStyle, BowlingStyle } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import {
  UserCheck,
  Search,
  Plus,
  ArrowRightLeft,
  Award,
  Zap,
  Shield,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Trash2,
  Trophy,
  Filter,
  BarChart3,
  X,
  Edit2,
  Lock,
  Unlock,
  LogOut
} from 'lucide-react';

interface PlayerProfilesViewProps {
  initialSelectedPlayerId?: string | null;
  onRefreshData: () => void;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
  onAdminLogout?: () => void;
  dataVersion?: number;
}

export const PlayerProfilesView: React.FC<PlayerProfilesViewProps> = ({
  initialSelectedPlayerId,
  onRefreshData,
  isAdmin = false,
  onRequireAdmin,
  onAdminLogout,
  dataVersion
}) => {
  const tournaments = StorageService.getTournaments();
  const activeTournament = StorageService.getActiveTournament();

  const [viewMode, setViewMode] = useState<'profiles' | 'leaderboards'>('profiles');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(activeTournament.id);
  const [modalStatMode, setModalStatMode] = useState<'tournament' | 'career'>('tournament');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    initialSelectedPlayerId || null
  );

  // Transfer modal
  const [transferPlayer, setTransferPlayer] = useState<Player | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>('');

  // Edit player modal (Name, Jersey, Role, and Stats - Admin Only)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editActiveTab, setEditActiveTab] = useState<'profile' | 'stats'>('profile');
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerJersey, setEditPlayerJersey] = useState<number>(10);
  const [editPlayerNickname, setEditPlayerNickname] = useState('');
  const [editPlayerRole, setEditPlayerRole] = useState<PlayerRole>('Batsman');
  const [editPlayerBatStyle, setEditPlayerBatStyle] = useState<BattingStyle>('Right-Hand Bat');
  const [editPlayerBowlStyle, setEditPlayerBowlStyle] = useState<BowlingStyle>('Right-Arm Medium');
  const [editPlayerBio, setEditPlayerBio] = useState('');

  // Stats edit states (Admin Only)
  const [editStatRuns, setEditStatRuns] = useState<number>(0);
  const [editStatBalls, setEditStatBalls] = useState<number>(0);
  const [editStatFours, setEditStatFours] = useState<number>(0);
  const [editStatSixPenalties, setEditStatSixPenalties] = useState<number>(0);
  const [editStatHighScore, setEditStatHighScore] = useState<number>(0);
  const [editStatWickets, setEditStatWickets] = useState<number>(0);
  const [editStatOvers, setEditStatOvers] = useState<number>(0);
  const [editStatMaidens, setEditStatMaidens] = useState<number>(0);
  const [editStatRunsConceded, setEditStatRunsConceded] = useState<number>(0);
  const [editStatMatches, setEditStatMatches] = useState<number>(0);

  // Add new player modal
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newRole, setNewRole] = useState<PlayerRole>('Batsman');
  const [newBatStyle, setNewBatStyle] = useState<BattingStyle>('Right-Hand Bat');
  const [newBowlStyle, setNewBowlStyle] = useState<BowlingStyle>('Right-Arm Medium');
  const [newJersey, setNewJersey] = useState<number>(10);
  const [newTeamId, setNewTeamId] = useState<string>('');
  const [newBio, setNewBio] = useState('');

  const players = StorageService.getPlayers();
  const teams = StorageService.getTeams();

  const getTeam = (teamId?: string): Team | undefined =>
    teams.find((t) => t.id === teamId);

  const selectedTourneyObj =
    selectedTournamentId === 'all'
      ? null
      : tournaments.find((t) => t.id === selectedTournamentId) || activeTournament;

  // Filter players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesTeam =
      teamFilter === 'all' ||
      (teamFilter === 'none' ? !p.currentTeamId : p.currentTeamId === teamFilter);
    return matchesSearch && matchesRole && matchesTeam;
  });

  const selectedPlayer = selectedPlayerId
    ? StorageService.getPlayerById(selectedPlayerId)
    : null;

  // Compute stats for modal
  const modalTourneyStats = selectedPlayer
    ? StorageService.calculatePlayerStats(
        selectedPlayer.id,
        selectedTournamentId === 'all' ? activeTournament.id : selectedTournamentId
      )
    : null;

  const modalCareerStats = selectedPlayer
    ? StorageService.calculatePlayerStats(selectedPlayer.id) // all time
    : null;

  // Leaderboard statistics calculation
  const allPlayerStats = players.map((p) => ({
    player: p,
    team: getTeam(p.currentTeamId),
    tourneyStats: StorageService.calculatePlayerStats(
      p.id,
      selectedTournamentId === 'all' ? undefined : selectedTournamentId
    )
  }));

  const topRunScorers = [...allPlayerStats]
    .filter((item) => item.tourneyStats.runs > 0)
    .sort((a, b) => b.tourneyStats.runs - a.tourneyStats.runs)
    .slice(0, 5);

  const topWicketTakers = [...allPlayerStats]
    .filter((item) => item.tourneyStats.wickets > 0)
    .sort((a, b) => b.tourneyStats.wickets - a.tourneyStats.wickets)
    .slice(0, 5);

  const topFours = [...allPlayerStats]
    .filter((item) => item.tourneyStats.fours > 0)
    .sort((a, b) => b.tourneyStats.fours - a.tourneyStats.fours)
    .slice(0, 5);

  const topSixPenalties = [...allPlayerStats]
    .filter((item) => item.tourneyStats.sixPenalties > 0)
    .sort((a, b) => b.tourneyStats.sixPenalties - a.tourneyStats.sixPenalties)
    .slice(0, 5);

  // Handle Player Transfer / Switch Team
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('switch player team');
      return;
    }
    if (!transferPlayer) return;

    const res = StorageService.switchPlayerTeam(
      transferPlayer.id,
      targetTeamId || undefined
    );
    alert(res.message);
    if (res.success) {
      setTransferPlayer(null);
      onRefreshData();
    }
  };

  // Handle Permanent Delete Player
  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('delete player from registry');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${playerName}"? This will remove them from all team squads and the app registry.`
      )
    ) {
      const res = StorageService.deletePlayer(playerId);
      alert(res.message);
      if (selectedPlayerId === playerId) setSelectedPlayerId(null);
      onRefreshData();
    }
  };

  // Handle Add New Player Profile
  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('create player profile');
      return;
    }
    if (!newName.trim()) return;

    // Check if team is full (max 6 players)
    if (newTeamId) {
      const targetTeam = teams.find((t) => t.id === newTeamId);
      if (targetTeam && targetTeam.playerIds.length >= 6) {
        alert(`${targetTeam.name} already has 6 players (squad maximum). Choose another team or Free Agent.`);
        return;
      }
    }

    const playerId = `player_${Date.now()}`;
    const newPlayer: Player = {
      id: playerId,
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
      role: newRole,
      battingStyle: newBatStyle,
      bowlingStyle: newBowlStyle,
      jerseyNumber: Number(newJersey) || 99,
      currentTeamId: newTeamId || undefined,
      bio: newBio.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    StorageService.savePlayer(newPlayer);

    // If assigned to a team, append to team roster
    if (newTeamId) {
      const targetTeam = teams.find((t) => t.id === newTeamId);
      if (targetTeam) {
        targetTeam.playerIds.push(playerId);
        StorageService.saveTeam(targetTeam);
      }
    }

    alert(`Player Profile for "${newPlayer.name}" created successfully!`);
    setIsAddPlayerModalOpen(false);
    // Reset form
    setNewName('');
    setNewNickname('');
    setNewBio('');
    onRefreshData();
  };

  // Handle Edit Player Profile & Stats (Admin Only)
  const handleOpenEditPlayer = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) {
      onRequireAdmin?.('edit player profile and stats');
      return;
    }
    setEditingPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerJersey(player.jerseyNumber || 10);
    setEditPlayerNickname(player.nickname || '');
    setEditPlayerRole(player.role);
    setEditPlayerBatStyle(player.battingStyle);
    setEditPlayerBowlStyle(player.bowlingStyle);
    setEditPlayerBio(player.bio || '');

    // Load current stats for editing
    const stats = StorageService.calculatePlayerStats(player.id);
    setEditStatRuns(stats.runs);
    setEditStatBalls(stats.ballsFaced);
    setEditStatFours(stats.fours);
    setEditStatSixPenalties(stats.sixPenalties);
    setEditStatHighScore(stats.highScore);
    setEditStatWickets(stats.wickets);
    setEditStatOvers(stats.oversBowled);
    setEditStatMaidens(stats.maidens);
    setEditStatRunsConceded(stats.runsConceded);
    setEditStatMatches(stats.matchesPlayed);
    setEditActiveTab('profile');
  };

  const handleSavePlayerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('save player profile and stats');
      return;
    }
    if (!editingPlayer) return;
    if (!editPlayerName.trim()) {
      alert('Please enter a player name.');
      return;
    }

    const updated: Player = {
      ...editingPlayer,
      name: editPlayerName.trim(),
      jerseyNumber: Number(editPlayerJersey) || 10,
      nickname: editPlayerNickname.trim() || undefined,
      role: editPlayerRole,
      battingStyle: editPlayerBatStyle,
      bowlingStyle: editPlayerBowlStyle,
      bio: editPlayerBio.trim() || undefined,
      statsOverrides: {
        runs: Number(editStatRuns) || 0,
        ballsFaced: Number(editStatBalls) || 0,
        fours: Number(editStatFours) || 0,
        sixPenalties: Number(editStatSixPenalties) || 0,
        highScore: Number(editStatHighScore) || 0,
        wickets: Number(editStatWickets) || 0,
        oversBowled: Number(editStatOvers) || 0,
        maidens: Number(editStatMaidens) || 0,
        runsConceded: Number(editStatRunsConceded) || 0,
        matchesPlayed: Number(editStatMatches) || 0
      }
    };

    StorageService.savePlayer(updated);
    alert(`Player profile & stats for "${updated.name}" updated successfully!`);
    setEditingPlayer(null);
    onRefreshData();
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Admin Status & Quick Logout/Login Banner */}
      <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-emerald-400' : 'bg-red-500'}`} />
          <div>
            <span className="font-bold text-white block sm:inline">
              {isAdmin ? 'Admin Scorer Mode Active' : 'Cricbuzz Spectator Mode (Read-Only)'}
            </span>
            <span className="text-slate-400 text-[11px] block sm:inline sm:ml-1.5">
              • {isAdmin ? 'You have full privileges to edit player profiles and override player stats.' : 'Only official admin can edit player profiles and stats.'}
            </span>
          </div>
        </div>
        {isAdmin ? (
          <button
            onClick={() => {
              if (window.confirm('Log out of Admin Scorer mode and switch to spectator mode?')) {
                if (onAdminLogout) onAdminLogout();
                else {
                  StorageService.logoutAdmin();
                  onRefreshData();
                }
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
            title="Log out of Admin Scorer mode"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Log Out</span>
          </button>
        ) : (
          <button
            onClick={() => onRequireAdmin?.('edit player profile and stats')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Login</span>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2">
            <UserCheck className="w-7 h-7 text-emerald-400" />
            <span>Player Profiles & Statistics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Separate Tournament Statistics & Lifetime Career Profiles • Squad Draft & Transfers
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode('profiles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'profiles'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Profiles
            </button>
            <button
              onClick={() => setViewMode('leaderboards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'leaderboards'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Leaderboards
            </button>
          </div>

          <button
            onClick={() => {
              if (!isAdmin) {
                onRequireAdmin?.('register new player profile');
                return;
              }
              setIsAddPlayerModalOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Player</span>
          </button>
        </div>
      </div>

      {/* Top Tournament Filter Bar (Separates Tournament Stats from Career Stats) */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2 text-xs">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-slate-200">Show Stats For:</span>
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="all">🌐 All Tournaments Combined (Lifetime Career Stats)</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                🏆 {t.name} ({t.edition}) {t.id === activeTournament.id ? '★ Active' : ''}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {selectedTournamentId === 'all'
            ? 'Displaying all-time statistics across all rooftop tournament editions'
            : `Displaying stats exclusively for: ${selectedTourneyObj?.name} - ${selectedTourneyObj?.edition}`}
        </span>
      </div>

      {/* MAIN VIEW: PROFILES */}
      {viewMode === 'profiles' && (
        <>
          {/* Search and Role/Team Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by player name or nickname..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket-Keeper">Wicket-Keeper</option>
            </select>

            {/* Team filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.logoEmoji} {t.name}
                </option>
              ))}
              <option value="none">Free Agents / Unassigned</option>
            </select>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredPlayers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                No players match the current search filters.
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const team = getTeam(player.currentTeamId);
                const stats = StorageService.calculatePlayerStats(
                  player.id,
                  selectedTournamentId === 'all' ? undefined : selectedTournamentId
                );

                return (
                  <div
                    key={player.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Top: Team Badge & Jersey */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1.5">
                          {team ? <TeamLogo team={team} size="xs" /> : <span>👤</span>}
                          <span className="truncate max-w-[130px]">{team ? team.name : 'Free Agent'}</span>
                        </span>

                        <span className="text-xs font-black text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                          #{player.jerseyNumber || '?'}
                        </span>
                      </div>

                      {/* Player Name & Role */}
                      <div className="mb-3">
                        <h3 className="text-base font-black text-white hover:text-emerald-300 transition-colors">
                          {player.name}
                        </h3>
                        {player.nickname && (
                          <p className="text-xs text-emerald-400 font-medium">"{player.nickname}"</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {player.role} • {player.battingStyle}
                        </p>
                      </div>

                      {/* Stat Scope Indicator */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-amber-300/90 truncate">
                          {selectedTournamentId === 'all' ? 'Career Lifetime' : selectedTourneyObj?.edition}
                        </span>
                        <span>{stats.matchesPlayed} Matches</span>
                      </div>

                      {/* Quick Stat Pill Bar */}
                      <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 mb-4 text-center">
                        <div>
                          <div className="text-[10px] text-slate-500">Runs</div>
                          <div className="text-xs font-bold text-emerald-400">{stats.runs}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">4s</div>
                          <div className="text-xs font-bold text-emerald-300">{stats.fours}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Wickets</div>
                          <div className="text-xs font-bold text-purple-400">{stats.wickets}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">6s Pen (-4)</div>
                          <div className="text-xs font-bold text-rose-400">{stats.sixPenalties}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions: View Details, Edit Player, Switch Team & Delete */}
                    <div className="flex items-center space-x-1.5 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => setSelectedPlayerId(player.id)}
                        className="flex-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                      >
                        Stats
                      </button>

                      <button
                        onClick={(e) => handleOpenEditPlayer(player, e)}
                        title={isAdmin ? "Edit Player Profile & Stats" : "Admin Only - Login to edit profile & stats"}
                        className="py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        {isAdmin ? <Edit2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            onRequireAdmin?.('switch player team');
                            return;
                          }
                          setTransferPlayer(player);
                          setTargetTeamId(player.currentTeamId || '');
                        }}
                        title="Switch Team for Future Tournaments"
                        className="py-2 px-2 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Switch</span>
                      </button>

                      <button
                        onClick={() => handleDeletePlayer(player.id, player.name)}
                        title="Permanently Delete Player from Registry"
                        className="p-2 rounded-xl bg-slate-950 hover:bg-red-950/50 border border-slate-800 hover:border-red-800 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* MAIN VIEW: TOURNAMENT LEADERBOARDS */}
      {viewMode === 'leaderboards' && (
        <div className="space-y-6 mb-8">
          <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Official Leaderboards for:{' '}
              <strong className="text-white">
                {selectedTournamentId === 'all' ? 'All Seasons Combined' : selectedTourneyObj?.name + ' - ' + selectedTourneyObj?.edition}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Runs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-black text-emerald-400 mb-3 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Top Run Scorers</span>
              </h3>
              {topRunScorers.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center italic">
                  No runs scored in this tournament yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {topRunScorers.map((item, idx) => (
                    <div
                      key={item.player.id}
                      onClick={() => setSelectedPlayerId(item.player.id)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            idx === 0
                              ? 'bg-amber-500 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-400 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {item.player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            {item.team?.shortName || 'FA'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">
                          {item.tourneyStats.runs} runs
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.tourneyStats.fours} fours • HS: {item.tourneyStats.highScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Wickets */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-black text-purple-400 mb-3 flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Leading Wicket Takers</span>
              </h3>
              {topWicketTakers.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center italic">
                  No wickets taken in this tournament yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {topWicketTakers.map((item, idx) => (
                    <div
                      key={item.player.id}
                      onClick={() => setSelectedPlayerId(item.player.id)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            idx === 0
                              ? 'bg-amber-500 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-400 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-purple-300 transition-colors">
                            {item.player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            {item.team?.shortName || 'FA'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-purple-400">
                          {item.tourneyStats.wickets} wickets
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Best: {item.tourneyStats.bestBowlingWickets > 0 ? `${item.tourneyStats.bestBowlingWickets}/${item.tourneyStats.bestBowlingRuns}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most 4s */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-black text-teal-400 mb-3 flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Most Boundary 4s (Allowed Shots)</span>
              </h3>
              {topFours.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center italic">
                  No boundaries hit yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {topFours.map((item, idx) => (
                    <div
                      key={item.player.id}
                      onClick={() => setSelectedPlayerId(item.player.id)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-teal-300 transition-colors">
                            {item.player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            {item.team?.shortName || 'FA'}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-teal-400">
                        {item.tourneyStats.fours} Fours
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Six Penalties */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-black text-rose-400 mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Six Penalties Taken (-4 Runs Each)</span>
              </h3>
              {topSixPenalties.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center italic">
                  No six penalties recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {topSixPenalties.map((item, idx) => (
                    <div
                      key={item.player.id}
                      onClick={() => setSelectedPlayerId(item.player.id)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-rose-300 transition-colors">
                            {item.player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            {item.team?.shortName || 'FA'}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-rose-400">
                        {item.tourneyStats.sixPenalties} Sixes (-{item.tourneyStats.sixPenalties * 4}r)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED PLAYER PROFILE MODAL (Displays Tournament Stats and Career Stats Separately!) */}
      {selectedPlayer && modalTourneyStats && modalCareerStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedPlayerId(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Player Badge */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-3xl font-black text-slate-950 shadow-lg shadow-emerald-500/20">
                #{selectedPlayer.jerseyNumber || '?'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-black text-white">{selectedPlayer.name}</h2>
                  {selectedPlayer.nickname && (
                    <span className="text-sm text-emerald-400 font-bold">
                      "{selectedPlayer.nickname}"
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedPlayer.role} • {selectedPlayer.battingStyle} • {selectedPlayer.bowlingStyle}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Team: {getTeam(selectedPlayer.currentTeamId)?.name || 'Free Agent'}
                  </span>
                  <button
                    onClick={() => handleOpenEditPlayer(selectedPlayer)}
                    className="text-xs text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {isAdmin ? <Edit2 className="w-3 h-3" /> : <Lock className="w-3 h-3 text-amber-400" />}
                    <span>{isAdmin ? 'Edit Profile & Stats' : 'Edit Profile & Stats (Admin Only)'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isAdmin) {
                        onRequireAdmin?.('switch player team');
                        return;
                      }
                      setTransferPlayer(selectedPlayer);
                      setTargetTeamId(selectedPlayer.currentTeamId || '');
                    }}
                    className="text-xs text-emerald-400 hover:underline flex items-center space-x-1 ml-2"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Switch Team</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(selectedPlayer.id, selectedPlayer.name)}
                    className="text-xs text-red-400 hover:underline flex items-center space-x-1 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {selectedPlayer.bio && (
              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-6 italic">
                "{selectedPlayer.bio}"
              </p>
            )}

            {/* STATS SEPARATION SWITCHER: TOURNAMENT STATS VS CAREER STATS */}
            <div className="flex items-center space-x-2 mb-6 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setModalStatMode('tournament')}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all ${
                  modalStatMode === 'tournament'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  Current Tournament Stats ({selectedTourneyObj?.edition || activeTournament.edition})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalStatMode('career')}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all ${
                  modalStatMode === 'career'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>All-Time Career Lifetime Stats</span>
              </button>
            </div>

            {/* Active Displayed Stats Object */}
            {(() => {
              const displayStats = modalStatMode === 'tournament' ? modalTourneyStats : modalCareerStats;
              const isTourney = modalStatMode === 'tournament';

              return (
                <div className="space-y-6">
                  {/* Scope header */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-extrabold text-slate-300">
                      {isTourney
                        ? `🏆 Showing: ${selectedTourneyObj?.name} (${selectedTourneyObj?.edition})`
                        : '🌐 Showing: All-Time Career Totals'}
                    </span>
                    <span className="text-slate-400 font-semibold">
                      Matches: <strong className="text-white">{displayStats.matchesPlayed}</strong>
                    </span>
                  </div>

                  {/* Batting Section */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-3 flex items-center space-x-1.5">
                      <Zap className="w-4 h-4" />
                      <span>Batting Record (Solo 1-Batsman Format)</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Runs</div>
                        <div className="text-xl font-black text-white">{displayStats.runs}</div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">High Score</div>
                        <div className="text-xl font-black text-amber-400">
                          {displayStats.highScore}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Strike Rate</div>
                        <div className="text-xl font-black text-emerald-400">
                          {displayStats.ballsFaced > 0
                            ? ((displayStats.runs / displayStats.ballsFaced) * 100).toFixed(1)
                            : '0.0'}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Balls Faced</div>
                        <div className="text-xl font-black text-slate-300">
                          {displayStats.ballsFaced}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">4s (Allowed Shots)</div>
                        <div className="text-xl font-black text-emerald-300">
                          {displayStats.fours}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-rose-400 uppercase">6s Penalties (-4)</div>
                        <div className="text-xl font-black text-rose-400">
                          {displayStats.sixPenalties} (-{displayStats.sixPenalties * 4}r)
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Auto-Retirements</div>
                        <div className="text-xl font-black text-blue-400">
                          {displayStats.retiredCount}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Innings Batted</div>
                        <div className="text-xl font-black text-slate-300">
                          {displayStats.inningsBatted}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bowling Section */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-3 flex items-center space-x-1.5">
                      <Activity className="w-4 h-4" />
                      <span>Bowling Record (Highest {selectedTourneyObj?.maxOversPerBowler || 2} Overs Quota)</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Wickets</div>
                        <div className="text-xl font-black text-purple-300">
                          {displayStats.wickets}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Economy Rate</div>
                        <div className="text-xl font-black text-slate-200">
                          {displayStats.legalBallsBowled > 0
                            ? ((displayStats.runsConceded / displayStats.legalBallsBowled) * 6).toFixed(2)
                            : '0.00'}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Best Bowling</div>
                        <div className="text-xl font-black text-amber-400">
                          {displayStats.bestBowlingWickets > 0
                            ? `${displayStats.bestBowlingWickets}/${displayStats.bestBowlingRuns}`
                            : '-'}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Overs Bowled</div>
                        <div className="text-xl font-black text-slate-300">
                          {displayStats.oversBowled.toFixed(1)}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Wides Conceded</div>
                        <div className="text-xl font-black text-blue-400">
                          {displayStats.widesConceded}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">No-Balls Conceded</div>
                        <div className="text-xl font-black text-amber-400">
                          {displayStats.noBallsConceded}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Dead Balls Bowled</div>
                        <div className="text-xl font-black text-slate-300">
                          {displayStats.deadBallsConceded}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-rose-400 uppercase">Dead Ball Pen (+1)</div>
                        <div className="text-xl font-black text-rose-400">
                          {displayStats.deadBallPenaltiesConceded}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TRANSFER / SWITCH TEAM MODAL */}
      {transferPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              <span>Switch Team for Future Tournaments</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Transfer <strong>{transferPlayer.name}</strong> to another squad or release to Free Agent pool.
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Destination Team
                </label>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">👤 Free Agent Pool (Unassigned)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logoEmoji} {t.name} ({t.playerIds.length}/6 players)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferPlayer(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/30"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PLAYER MODAL */}
      {isAddPlayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white mb-1 flex items-center space-x-2">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              <span>Register New Player in App</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Player registers first in the app registry, and can then be picked into a team squad.
            </p>

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Player Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakib Al Hasan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flash, Turbo"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as PlayerRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Jersey Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={newJersey}
                    onChange={(e) => setNewJersey(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Batting Style
                  </label>
                  <select
                    value={newBatStyle}
                    onChange={(e) => setNewBatStyle(e.target.value as BattingStyle)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Right-Hand Bat">Right-Hand Bat</option>
                    <option value="Left-Hand Bat">Left-Hand Bat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Bowling Style
                  </label>
                  <select
                    value={newBowlStyle}
                    onChange={(e) => setNewBowlStyle(e.target.value as BowlingStyle)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Right-Arm Fast">Right-Arm Fast</option>
                    <option value="Right-Arm Medium">Right-Arm Medium</option>
                    <option value="Right-Arm Spin">Right-Arm Spin</option>
                    <option value="Left-Arm Fast">Left-Arm Fast</option>
                    <option value="Left-Arm Spin">Left-Arm Spin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Assign to Team (or Free Agent)
                </label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">👤 Free Agent Pool (Can be picked by any team later)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logoEmoji} {t.name} ({t.playerIds.length}/6 players)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Player Bio / Signature Shot (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master of straight drives and late cuts along rooftop boundary"
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddPlayerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/30"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Player Modal (Profile Attributes & Stats - Admin Only) */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-1.5">
                    <span>Edit Profile & Stats</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      Admin Only
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Editing player: <strong className="text-white">{editingPlayer.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs: Profile vs Stats */}
            <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setEditActiveTab('profile')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  editActiveTab === 'profile'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Profile Info
              </button>
              <button
                type="button"
                onClick={() => setEditActiveTab('stats')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  editActiveTab === 'stats'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Player Stats</span>
              </button>
            </div>

            <form onSubmit={handleSavePlayerEdit} className="space-y-4">
              {/* TAB 1: PROFILE INFO */}
              {editActiveTab === 'profile' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Player Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editPlayerName}
                      onChange={(e) => setEditPlayerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Jersey Number *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        required
                        value={editPlayerJersey}
                        onChange={(e) => setEditPlayerJersey(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={editPlayerNickname}
                        onChange={(e) => setEditPlayerNickname(e.target.value)}
                        placeholder="e.g. Blade, Wall"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Player Role
                    </label>
                    <select
                      value={editPlayerRole}
                      onChange={(e) => setEditPlayerRole(e.target.value as PlayerRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-Rounder">All-Rounder</option>
                      <option value="Wicket-Keeper">Wicket-Keeper</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Batting Style
                      </label>
                      <select
                        value={editPlayerBatStyle}
                        onChange={(e) => setEditPlayerBatStyle(e.target.value as BattingStyle)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Right-Hand Bat">Right-Hand Bat</option>
                        <option value="Left-Hand Bat">Left-Hand Bat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Bowling Style
                      </label>
                      <select
                        value={editPlayerBowlStyle}
                        onChange={(e) => setEditPlayerBowlStyle(e.target.value as BowlingStyle)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Right-Arm Fast">Right-Arm Fast</option>
                        <option value="Right-Arm Medium">Right-Arm Medium</option>
                        <option value="Right-Arm Spin">Right-Arm Spin</option>
                        <option value="Left-Arm Fast">Left-Arm Fast</option>
                        <option value="Left-Arm Spin">Left-Arm Spin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Bio / Notes
                    </label>
                    <input
                      type="text"
                      value={editPlayerBio}
                      onChange={(e) => setEditPlayerBio(e.target.value)}
                      placeholder="Player bio notes"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: STATS EDITOR (ADMIN ONLY) */}
              {editActiveTab === 'stats' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                    <p className="font-bold flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Admin Stats Override Panel</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Adjust or override lifetime and tournament performance numbers for this player.
                    </p>
                  </div>

                  {/* Batting Stats */}
                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      🏏 Batting Statistics
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Total Runs
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatRuns}
                          onChange={(e) => setEditStatRuns(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Balls Faced
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatBalls}
                          onChange={(e) => setEditStatBalls(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Fours (4s)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatFours}
                          onChange={(e) => setEditStatFours(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-rose-400 mb-1">
                          6s Pen (-4 Runs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatSixPenalties}
                          onChange={(e) => setEditStatSixPenalties(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          High Score
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatHighScore}
                          onChange={(e) => setEditStatHighScore(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Matches Played
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatMatches}
                          onChange={(e) => setEditStatMatches(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bowling Stats */}
                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                      🎯 Bowling Statistics
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Wickets Taken
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatWickets}
                          onChange={(e) => setEditStatWickets(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Overs Bowled
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editStatOvers}
                          onChange={(e) => setEditStatOvers(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Maidens
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatMaidens}
                          onChange={(e) => setEditStatMaidens(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Runs Conceded
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editStatRunsConceded}
                          onChange={(e) => setEditStatRunsConceded(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-colors shadow-lg shadow-amber-500/20"
                >
                  Save Profile & Stats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlayerProfilesView;
