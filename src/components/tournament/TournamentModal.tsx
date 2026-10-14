import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tournament, Team, RoundRobinType, PlayoffFormat } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import {
  Trophy,
  Plus,
  CheckCircle2,
  Calendar,
  Users,
  Shield,
  Trash2,
  Sparkles,
  AlertTriangle,
  X,
  Layers,
  Zap,
  Settings
} from 'lucide-react';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  initialTab?: 'list' | 'create';
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  initialTab = 'list',
  isAdmin = false,
  onRequireAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(initialTab);

  const tournaments = StorageService.getTournaments();
  const activeTournamentId = StorageService.getActiveTournamentId();
  const allTeams = StorageService.getTeams();
  const allMatches = StorageService.getMatches();

  // Create form states
  const [name, setName] = useState('Rooftop Cricket Tournament');
  const [edition, setEdition] = useState(`Season ${tournaments.length + 1} (${new Date().getFullYear()})`);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(5);
  const [oversPerInnings, setOversPerInnings] = useState<number>(10);
  const [maxOversPerBatsman, setMaxOversPerBatsman] = useState<number>(4);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number>(2);

  // Edit existing tournament overs state
  const [editingTourneyId, setEditingTourneyId] = useState<string | null>(null);
  const [editOvers, setEditOvers] = useState<number>(10);

  // Edit existing tournament teams state
  const [editingTeamsTourneyId, setEditingTeamsTourneyId] = useState<string | null>(null);
  const [editSelectedTeamIds, setEditSelectedTeamIds] = useState<string[]>([]);

  // Edit existing tournament squad size state
  const [editingSquadTourneyId, setEditingSquadTourneyId] = useState<string | null>(null);
  const [editSquadSize, setEditSquadSize] = useState<number>(6);

  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  // Default select first 4-5 teams
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    allTeams.slice(0, Math.min(5, allTeams.length)).map((t) => t.id)
  );
  const [autoGenerateFixtures, setAutoGenerateFixtures] = useState(true);
  const [createRoundRobinType, setCreateRoundRobinType] = useState<RoundRobinType>('single');
  const [createPlayoffFormat, setCreatePlayoffFormat] = useState<PlayoffFormat>('semifinals_top4');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter((id) => id !== teamId));
    } else {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  const handleToggleEditTeam = (teamId: string) => {
    if (editSelectedTeamIds.includes(teamId)) {
      if (editSelectedTeamIds.length <= 2) {
        alert('A tournament must have at least 2 teams.');
        return;
      }
      setEditSelectedTeamIds(editSelectedTeamIds.filter((id) => id !== teamId));
    } else {
      setEditSelectedTeamIds([...editSelectedTeamIds, teamId]);
    }
  };

  const handleSaveEditTeams = (tourneyId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('modify tournament teams');
      return;
    }
    if (editSelectedTeamIds.length < 2) {
      alert('Please select at least 2 teams.');
      return;
    }
    StorageService.updateTournament(tourneyId, {
      teamIds: editSelectedTeamIds
    });
    setEditingTeamsTourneyId(null);
    onRefreshData();
    alert(`✅ Teams updated! Tournament now includes ${editSelectedTeamIds.length} teams.`);
  };

  const handleSelectTournament = (tourneyId: string) => {
    StorageService.setActiveTournamentId(tourneyId);
    onRefreshData();
    onClose();
  };

  const handleDeleteTournament = (tourneyId: string, tourneyName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      onRequireAdmin?.('delete tournament');
      return;
    }
    if (tournaments.length <= 1) {
      alert('Cannot delete the only tournament. At least one tournament must remain.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${tourneyName}"?`)) {
      const res = StorageService.deleteTournament(tourneyId);
      alert(res.message);
      onRefreshData();
    }
  };

  const handleOversChange = (ov: number) => {
    const valid = Math.max(2, Math.min(50, ov));
    setOversPerInnings(valid);
    const bowler = Math.max(1, Math.ceil(valid / 5));
    const batsman = valid <= 6 ? Math.max(2, Math.floor(valid * 0.5)) : Math.min(valid, 4);
    setMaxOversPerBowler(bowler);
    setMaxOversPerBatsman(batsman);
  };

  const handleSaveEditOvers = (tourneyId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('edit tournament overs');
      return;
    }
    const valid = Math.max(2, Math.min(50, editOvers));
    const bowler = Math.max(1, Math.ceil(valid / 5));
    const batsman = valid <= 6 ? Math.max(2, Math.floor(valid * 0.5)) : Math.min(valid, 4);
    StorageService.updateTournament(tourneyId, {
      oversPerInnings: valid,
      maxOversPerBowler: bowler,
      maxOversPerBatsman: batsman
    });
    setEditingTourneyId(null);
    onRefreshData();
    alert(`⚡ Tournament updated! Matches in this tournament will now be played with ${valid} overs per innings.`);
  };

  const handleSaveEditSquadSize = (tourneyId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('edit tournament squad size');
      return;
    }
    const valid = Math.max(2, Math.min(30, editSquadSize));
    StorageService.updateTournament(tourneyId, {
      playersPerTeam: valid
    });
    setEditingSquadTourneyId(null);
    onRefreshData();
    alert(`👥 Tournament updated! Squad size target is now ${valid} players per team.`);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('create new tournament');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a tournament name.');
      return;
    }
    if (!edition.trim()) {
      alert('Please enter a season or edition.');
      return;
    }
    if (selectedTeamIds.length < 2) {
      alert(`Tournament requires at least 2 teams. You currently have ${selectedTeamIds.length} teams selected.`);
      return;
    }

    const { tournament: created, createdMatchesCount } = StorageService.createTournament({
      name: name.trim(),
      edition: edition.trim(),
      startDate,
      endDate,
      teamIds: selectedTeamIds,
      playersPerTeam,
      oversPerInnings,
      maxOversPerBatsman,
      maxOversPerBowler,
      minOversPerBowler: 1,
      reviewsPerInnings: 2,
      substitutionsPerInnings: 1,
      autoGenerateFixtures,
      qualifyRules: {
        roundRobinType: createRoundRobinType,
        playoffFormat: createPlayoffFormat,
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        topTeamsCount:
          createPlayoffFormat === 'direct_final_top2'
            ? 2
            : createPlayoffFormat === 'rank1_direct_final'
            ? 3
            : 4,
        tieBreaker: 'nrr',
        manualOverrides: { enabled: false }
      }
    });

    onRefreshData();
    alert(
      `🎉 Tournament "${created.name} - ${created.edition}" (${created.oversPerInnings} Overs) created and set as active!` +
        (createdMatchesCount > 0 ? `\nGenerated ${createdMatchesCount} league match fixtures automatically.` : '')
    );
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-4 sm:p-6 md:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Tournaments Manager</h2>
              <p className="text-xs text-slate-400">
                Switch between seasons or create a custom tournament with manual squad size
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-2 mb-5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'list'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Tournaments ({tournaments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'create'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Tournament</span>
          </button>
        </div>

        {/* Tab 1: Tournament List */}
        {activeTab === 'list' && (
          <div className="overflow-y-auto space-y-3 pr-1 flex-1">
            {tournaments.map((tourney) => {
              const isActive = tourney.id === activeTournamentId;
              const tourneyMatches = allMatches.filter((m) => m.tournamentId === tourney.id);
              const validTourneyTeamIds =
                Array.isArray(tourney.teamIds) && tourney.teamIds.length > 0
                  ? tourney.teamIds
                  : allTeams.slice(0, 5).map((t) => t.id);
              const tourneyTeams = allTeams.filter((t) => validTourneyTeamIds.includes(t.id));

              return (
                <div
                  key={tourney.id}
                  onClick={() => handleSelectTournament(tourney.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                          {tourney.name}
                        </h3>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {tourney.edition}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {tourney.startDate} to {tourney.endDate}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{tourney.oversPerInnings || 10} Overs</span>
                        <span>•</span>
                        <span>{tourney.playersPerTeam || 5} Players / Team</span>
                        <span>•</span>
                        <span>{tourneyMatches.length} Matches</span>
                        <span>•</span>
                        <span className="text-amber-300 font-semibold">
                          {tourney.qualifyRules?.roundRobinType === 'double' ? 'Double RR' : 'Single RR'}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-300 font-semibold">
                          {tourney.qualifyRules?.playoffFormat === 'direct_final_top2'
                            ? 'Top 2 Final'
                            : tourney.qualifyRules?.playoffFormat === 'rank1_direct_final'
                            ? 'Top 3 (Rank 1 to Final)'
                            : tourney.qualifyRules?.playoffFormat === 'ipl_playoffs'
                            ? 'IPL Playoffs'
                            : 'Top 4 SF'}
                        </span>
                        {tourney.qualifyRules?.manualOverrides?.enabled && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                            Manual Overrides
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingTeamsTourneyId === tourney.id) {
                            setEditingTeamsTourneyId(null);
                          } else {
                            setEditingTeamsTourneyId(tourney.id);
                            setEditingSquadTourneyId(null);
                            setEditingTourneyId(null);
                            setEditSelectedTeamIds(validTourneyTeamIds);
                          }
                        }}
                        title="Choose Participating Teams"
                        className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{tourneyTeams.length} Teams</span>
                        <Settings className="w-3 h-3 text-emerald-400/80 ml-0.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingSquadTourneyId === tourney.id) {
                            setEditingSquadTourneyId(null);
                          } else {
                            setEditingSquadTourneyId(tourney.id);
                            setEditingTeamsTourneyId(null);
                            setEditingTourneyId(null);
                            setEditSquadSize(tourney.playersPerTeam || 6);
                          }
                        }}
                        title="Edit Squad Size (Players per team)"
                        className="py-1.5 px-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{tourney.playersPerTeam || 6} P/Team</span>
                        <Settings className="w-3 h-3 text-teal-400/80 ml-0.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingTourneyId === tourney.id) {
                            setEditingTourneyId(null);
                          } else {
                            setEditingTourneyId(tourney.id);
                            setEditingTeamsTourneyId(null);
                            setEditingSquadTourneyId(null);
                            setEditOvers(tourney.oversPerInnings || 10);
                          }
                        }}
                        title="Edit Tournament Overs"
                        className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{tourney.oversPerInnings || 10} Overs</span>
                        <Settings className="w-3 h-3 text-amber-400/80 ml-0.5" />
                      </button>

                      {tournaments.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteTournament(tourney.id, `${tourney.name} (${tourney.edition})`, e)}
                          title="Delete Tournament"
                          className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/50 text-slate-500 hover:text-red-400 border border-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Tournament Teams Chooser */}
                  {editingTeamsTourneyId === tourney.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 p-3 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Choose Participating Teams ({editSelectedTeamIds.length} Selected):</span>
                        </span>
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEditSelectedTeamIds(allTeams.map((t) => t.id))}
                            className="text-emerald-400 hover:text-emerald-300 font-bold px-1 py-0.5"
                          >
                            Select All
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => setEditSelectedTeamIds([])}
                            className="text-slate-400 hover:text-slate-300 font-bold px-1 py-0.5"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                        {allTeams.map((team) => {
                          const isSelected = editSelectedTeamIds.includes(team.id);
                          return (
                            <div
                              key={team.id}
                              onClick={() => handleToggleEditTeam(team.id)}
                              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <TeamLogo team={team} size="xs" />
                                <span className="text-xs font-bold truncate">{team.name}</span>
                              </div>
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                  isSelected
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                    : 'border-slate-700'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {editSelectedTeamIds.length} Teams Selected (Min 2 Teams)
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingTeamsTourneyId(null)}
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditTeams(tourney.id)}
                            disabled={editSelectedTeamIds.length < 2}
                            className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-sm disabled:opacity-40"
                          >
                            Save {editSelectedTeamIds.length} Teams
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Tournament Overs Editor */}
                  {editingTourneyId === tourney.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 p-3 bg-slate-900 border border-amber-500/40 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Change Overs Played in Tournament:</span>
                        </span>
                        <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          {editOvers} Overs
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {[5, 6, 8, 10, 12, 15, 20].map((ov) => (
                          <button
                            key={ov}
                            type="button"
                            onClick={() => setEditOvers(ov)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all ${
                              editOvers === ov
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {ov} Ov
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Custom:</span>
                          <input
                            type="number"
                            min={2}
                            max={50}
                            value={editOvers}
                            onChange={(e) => setEditOvers(Math.max(2, Math.min(50, Number(e.target.value) || 10)))}
                            className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-300 text-xs"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingTourneyId(null)}
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditOvers(tourney.id)}
                            className="py-1 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm"
                          >
                            Save {editOvers} Overs
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Tournament Squad Size Editor */}
                  {editingSquadTourneyId === tourney.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 p-3 bg-slate-900 border border-teal-500/40 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          <span>Squad Size (Players per Team):</span>
                        </span>
                        <span className="text-xs font-black text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded-full">
                          {editSquadSize} Players / Team
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                        {[2, 3, 4, 5, 6, 7, 8, 11].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setEditSquadSize(sz)}
                            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all ${
                              editSquadSize === sz
                                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {sz}P
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Custom Size:</span>
                          <input
                            type="number"
                            min={2}
                            max={30}
                            value={editSquadSize}
                            onChange={(e) => setEditSquadSize(Math.max(2, Math.min(30, Number(e.target.value) || 6)))}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-teal-300 text-xs"
                          />
                          <span className="text-slate-500 text-[10px]">(2 - 30)</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingSquadTourneyId(null)}
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditSquadSize(tourney.id)}
                            className="py-1 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black shadow-sm"
                          >
                            Save {editSquadSize} Players/Team
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Participating Teams Chips */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeamsTourneyId(tourney.id);
                        setEditSelectedTeamIds(validTourneyTeamIds);
                      }}
                      title="Click to Choose / Edit Teams"
                      className="flex items-center space-x-1.5 flex-wrap cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <span className="text-[11px] text-emerald-400 font-bold mr-1 flex items-center space-x-1">
                        <span>Teams ({tourneyTeams.length}):</span>
                      </span>
                      {tourneyTeams.map((t) => (
                        <span
                          key={t.id}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-1.5"
                        >
                          <TeamLogo team={t} size="xs" />
                          <span>{t.shortName}</span>
                        </span>
                      ))}
                      <span className="text-[10px] text-emerald-400/80 underline ml-1">Edit Teams</span>
                    </div>

                    {!isActive && (
                      <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                        Select →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Create Tournament Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateTournament} className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Tournament Name & Edition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tournament Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rooftop Cricket Tournament"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Edition / Season
                </label>
                <input
                  type="text"
                  required
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g. Season 2 (2026) or Summer Trophy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Tournament Overs Selection (Select how many overs played in tournament) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Tournament Match Length (Overs per Innings)</span>
                </label>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {oversPerInnings} Overs / Match
                </span>
              </div>

              {/* Quick Format Selector Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2">
                {[5, 6, 8, 10, 12, 15, 20].map((ov) => (
                  <button
                    key={ov}
                    type="button"
                    onClick={() => handleOversChange(ov)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${
                      oversPerInnings === ov
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{ov} Ov</span>
                  </button>
                ))}
              </div>

              {/* Custom overs input and rules breakdown */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-bold">Custom Overs:</span>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={oversPerInnings}
                    onChange={(e) => handleOversChange(Number(e.target.value) || 10)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-black text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-slate-500 text-[11px]">(2 - 50)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-lg">
                    Bowler Quota: <strong>Max {maxOversPerBowler} ov</strong>
                  </span>
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-lg">
                    Batsman Retire: <strong>{maxOversPerBatsman} ov ({maxOversPerBatsman * 6}b)</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Tournament Squad / Team Size (Players per team - Manual) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Manual Team Size (Players per Team)</span>
                </label>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {playersPerTeam} Players / Team
                </span>
              </div>

              {/* Quick Team Size Selector Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2">
                {[2, 3, 4, 5, 6, 7, 8, 11].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPlayersPerTeam(size)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                      playersPerTeam === size
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{size} Players</span>
                  </button>
                ))}
              </div>

              {/* Custom squad size input */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-bold">Custom Team Size:</span>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(Math.max(2, Math.min(30, Number(e.target.value) || 6)))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-black text-emerald-300 text-xs focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-slate-500 text-[11px]">(2 - 30 players)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Target squad size for all registered tournament teams.
                </p>
              </div>
            </div>

            {/* Round Robin & Playoff Format Configuration */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Round Robin & Playoff Qualification Format</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">League Schedule:</span>
                  <select
                    value={createRoundRobinType}
                    onChange={(e) => setCreateRoundRobinType(e.target.value as RoundRobinType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                  >
                    <option value="single">Single Round Robin (1 Match vs Each)</option>
                    <option value="double">Double Round Robin (Home & Away / 2 Matches)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Playoff Format:</span>
                  <select
                    value={createPlayoffFormat}
                    onChange={(e) => setCreatePlayoffFormat(e.target.value as PlayoffFormat)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none"
                  >
                    <option value="semifinals_top4">Top 4 Semifinals (1v4, 2v3) & Final</option>
                    <option value="rank1_direct_final">Top 3: Rank 1 Direct Final + SF (Rank 2 vs 3)</option>
                    <option value="direct_final_top2">Top 2 Direct Final (No Semifinals)</option>
                    <option value="ipl_playoffs">IPL Playoff Format (Q1, Eliminator, Q2, Final)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Participating Teams Selection (Manual team count) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>How Many Teams Play in Tournament?</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Quick select team count or manually check/uncheck teams below:
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamIds(allTeams.map((t) => t.id))}
                      className="text-emerald-400 hover:text-emerald-300 font-bold px-1"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamIds([])}
                      className="text-slate-400 hover:text-slate-300 font-bold px-1"
                    >
                      Clear
                    </button>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      selectedTeamIds.length >= 2
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedTeamIds.length} Teams Selected (Min 2)
                  </span>
                </div>
              </div>

              {/* Quick team count selector buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2.5">
                {[2, 3, 4, 5, 6, 8, 10, 12].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      const picked = allTeams.slice(0, count).map((t) => t.id);
                      setSelectedTeamIds(picked);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                      selectedTeamIds.length === count
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{count} Teams</span>
                  </button>
                ))}
              </div>

              {allTeams.length < 2 ? (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Please create at least 2 teams in the Teams tab before launching a tournament.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  {allTeams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    const squadCount = team.playerIds.length;
                    const isSquadReady = squadCount >= playersPerTeam;

                    return (
                      <div
                        key={team.id}
                        onClick={() => handleToggleTeam(team.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <TeamLogo team={team} size="sm" />
                          <div className="truncate">
                            <span className="font-bold text-xs block truncate leading-tight">
                              {team.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              [{team.shortName}] • {squadCount} Players{' '}
                              {isSquadReady ? '(Ready)' : `(Needs ${Math.max(0, playersPerTeam - squadCount)} more)`}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Official Rooftop Rules Specs (Dynamic per selected overs) */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Enforced Tournament Rules ({oversPerInnings} Overs Config):
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1">
                <div>• Match Length: <strong>{oversPerInnings} Overs ({oversPerInnings * 6} Balls)</strong></div>
                <div>• Solo Batsman: <strong>Max {maxOversPerBatsman} Overs ({maxOversPerBatsman * 6} Balls)</strong></div>
                <div>• Bowler Limit: <strong>Highest {maxOversPerBowler} Overs (Min {Math.max(1, Math.ceil(oversPerInnings / maxOversPerBowler))} Bowlers Bowl)</strong></div>
                <div>• Format: <strong>Round Robin → Semifinals → Final</strong></div>
                <div>• DRS: <strong>2 Reviews Per Innings (Retained)</strong></div>
                <div>• Substitution: <strong>1 Per Innings</strong></div>
                <div>• Scoring: <strong>4s allowed, 6 is -4 penalty</strong></div>
              </div>
            </div>

            {/* Auto Generate Fixtures Checkbox */}
            <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <input
                type="checkbox"
                checked={autoGenerateFixtures}
                onChange={(e) => setAutoGenerateFixtures(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Auto-generate Round-Robin League Fixtures:</strong> Create all match pairings automatically for selected teams.
                </span>
              </div>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={selectedTeamIds.length < 2}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Create & Activate Tournament</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
