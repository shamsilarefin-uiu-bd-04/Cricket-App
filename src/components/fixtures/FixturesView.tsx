import React, { useState } from 'react';
import { Match, Team } from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { FixturesGenerator } from '../../utils/fixturesGenerator';
import { TeamLogo } from '../common/TeamLogo';
import { ManualRulesModal } from '../tournament/ManualRulesModal';
import {
  Calendar,
  Plus,
  Play,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Sparkles,
  MapPin,
  Clock,
  Trophy,
  Zap,
  Settings,
  RotateCcw,
  LogOut,
  Lock,
  Unlock
} from 'lucide-react';

interface FixturesViewProps {
  onStartScoring: (matchId: string) => void;
  onOpenScorecard: (matchId: string) => void;
  onRefreshData: () => void;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
  onAdminLogout?: () => void;
  dataVersion?: number;
}

export const FixturesView: React.FC<FixturesViewProps> = ({
  onStartScoring,
  onOpenScorecard,
  onRefreshData,
  isAdmin = false,
  onRequireAdmin,
  onAdminLogout,
  dataVersion
}) => {
  const [filter, setFilter] = useState<
    'all' | 'League' | 'Semi-Final' | 'Final' | 'scheduled' | 'live' | 'completed'
  >('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const tournaments = StorageService.getTournaments();
  const activeTournament = StorageService.getActiveTournament();
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(activeTournament.id);

  const matches = StorageService.getMatches();
  const teams = StorageService.getTeams();
  const tournament =
    StorageService.getTournamentById(selectedTourneyId) || activeTournament;

  // Form states
  const [team1Id, setTeam1Id] = useState(teams[0]?.id || '');
  const [team2Id, setTeam2Id] = useState(teams[1]?.id || '');
  const [scheduledTime, setScheduledTime] = useState(
    new Date().toISOString().replace('T', ' ').slice(0, 16)
  );
  const [venue, setVenue] = useState('Sky Arena Roof Court A');
  const [stage, setStage] = useState<'League' | 'Semi-Final' | 'Final' | 'Friendly'>('League');

  const filteredMatches = matches.filter((m) => {
    if (selectedTourneyId !== 'all' && m.tournamentId !== selectedTourneyId) return false;
    if (filter === 'all') return true;
    if (filter === 'League') return m.stage === 'League';
    if (filter === 'Semi-Final') return m.stage === 'Semi-Final';
    if (filter === 'Final') return m.stage === 'Final';
    if (filter === 'scheduled') return m.status === 'scheduled';
    if (filter === 'live')
      return (
        m.status === 'innings1' ||
        m.status === 'innings_break' ||
        m.status === 'innings2' ||
        m.status === 'toss'
      );
    if (filter === 'completed') return m.status === 'completed';
    return true;
  });

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      onRequireAdmin?.('schedule new fixture');
      return;
    }
    setEditingMatch(null);
    setTeam1Id(teams[0]?.id || '');
    setTeam2Id(teams[1]?.id || '');
    setScheduledTime(new Date().toISOString().replace('T', ' ').slice(0, 16));
    setVenue('Sky Arena Roof Court A');
    setStage('League');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (match: Match) => {
    if (!isAdmin) {
      onRequireAdmin?.('edit match fixture');
      return;
    }
    setEditingMatch(match);
    setTeam1Id(match.team1Id);
    setTeam2Id(match.team2Id);
    setScheduledTime(match.scheduledTime);
    setVenue(match.venue);
    setStage(match.stage);
    setIsModalOpen(true);
  };

  const handleSaveFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onRequireAdmin?.('save match fixture');
      return;
    }
    if (team1Id === team2Id) {
      alert('Team 1 and Team 2 must be different.');
      return;
    }

    if (editingMatch) {
      const updated: Match = {
        ...editingMatch,
        team1Id,
        team2Id,
        scheduledTime,
        venue,
        stage
      };
      StorageService.saveMatch(updated);
    } else {
      const newMatch: Match = {
        id: `match_${Date.now()}`,
        tournamentId: tournament.id,
        matchNumber: matches.length + 1,
        stage,
        team1Id,
        team2Id,
        venue,
        scheduledTime,
        status: 'scheduled',
        overs: tournament.oversPerInnings || 10,
        notes: `${stage} Match`
      };
      StorageService.saveMatch(newMatch);
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleDeleteMatch = (matchId: string) => {
    if (!isAdmin) {
      onRequireAdmin?.('delete match fixture');
      return;
    }
    if (window.confirm('Are you sure you want to delete this fixture?')) {
      const updated = matches.filter((m) => m.id !== matchId);
      StorageService.saveMatches(updated);
      onRefreshData();
    }
  };

  const handleGenerateRoundRobin = () => {
    if (!isAdmin) {
      onRequireAdmin?.('auto-generate round robin fixtures');
      return;
    }
    const participatingTeams = teams.filter((t) => tournament.teamIds.includes(t.id));
    if (participatingTeams.length < 2) {
      alert(`This tournament has fewer than 2 teams assigned. Please add teams in Teams tab.`);
      return;
    }
    if (
      window.confirm(
        `Auto-generate round-robin fixtures for ${participatingTeams.length} participating teams in "${tournament.name} (${tournament.edition})"? This will append new schedule fixtures.`
      )
    ) {
      const newMatches = FixturesGenerator.generateRoundRobin(
        tournament.id,
        participatingTeams,
        tournament.startDate || new Date().toISOString(),
        matches.length + 1,
        tournament.oversPerInnings || 10
      );
      StorageService.saveMatches([...matches, ...newMatches]);
      onRefreshData();
      alert(`Generated ${newMatches.length} round-robin fixtures!`);
    }
  };

  const handleGeneratePlayoffs = () => {
    if (!isAdmin) {
      onRequireAdmin?.('generate playoff fixtures');
      return;
    }
    const res = StorageService.generatePlayoffs(tournament.id);
    alert(res.message);
    if (res.matches.length > 0) {
      onRefreshData();
    }
  };

  const handleGenerateFullTournament = () => {
    if (!isAdmin) {
      onRequireAdmin?.('generate full tournament');
      return;
    }
    const participatingTeams = teams.filter((t) => tournament.teamIds.includes(t.id));
    if (participatingTeams.length < 4) {
      alert(`Full tournament requires at least 4 participating teams. Current count: ${participatingTeams.length}`);
      return;
    }
    if (
      window.confirm(
        `Auto-generate full tournament for "${tournament.name} (${tournament.edition})"?\nFormat: Round Robin League + Semi-Final 1 + Semi-Final 2 + Grand Final.`
      )
    ) {
      const fullMatches = FixturesGenerator.generateFullTournament(
        tournament.id,
        participatingTeams,
        tournament.startDate || new Date().toISOString(),
        tournament.oversPerInnings || 10
      );
      StorageService.saveMatches([...matches, ...fullMatches]);
      onRefreshData();
      alert(`Generated full tournament with ${fullMatches.length} total fixtures (Round Robin + Semi-Finals + Grand Final)!`);
    }
  };

  const handleRestartFixture = (matchId: string, matchNum: number) => {
    if (!isAdmin) {
      onRequireAdmin?.('restart match fixture');
      return;
    }
    if (
      window.confirm(
        `Restart Match #${matchNum} fixture? All scores, toss, and deliveries will be reset back to scheduled.`
      )
    ) {
      const res = StorageService.restartMatch(matchId);
      alert(res.message);
      onRefreshData();
    }
  };

  const handleRestartAllFixtures = () => {
    if (!isAdmin) {
      onRequireAdmin?.('restart all tournament fixtures');
      return;
    }
    if (
      window.confirm(
        `Restart ALL match fixtures for "${tournament.name} (${tournament.edition})"? All match scores, toss, and innings records will be reset back to scheduled.`
      )
    ) {
      const res = StorageService.restartTournamentFixtures(tournament.id);
      alert(res.message);
      onRefreshData();
    }
  };

  const getTeam = (id: string): Team | undefined => teams.find((t) => t.id === id);

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
              • {isAdmin ? 'You can schedule fixtures, restart matches, edit rules & conduct toss.' : 'Official admin login required to restart or modify fixtures.'}
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
            onClick={() => onRequireAdmin?.('manage tournament fixtures')}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Login</span>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2">
            <Calendar className="w-7 h-7 text-emerald-400" />
            <span>Fixtures & Results</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {tournament.name} • 10 Overs per side • Bowler max 2 ov • Round Robin → Semifinals → Final
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tournament selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <span className="font-bold text-slate-400">Tournament:</span>
            <select
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.edition}) {t.id === activeTournament.id ? '★ Active' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            title="Configure Round Robin and Qualify Rules Manually"
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Qualify & RR Rules</span>
          </button>

          <button
            onClick={handleGenerateRoundRobin}
            title="Auto-generate League stage round-robin matches"
            className="py-2.5 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/60 text-purple-300 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Round Robin</span>
          </button>

          <button
            onClick={handleGeneratePlayoffs}
            title="Generate Top 4 Knockouts: SF1 (1 vs 4), SF2 (2 vs 3) and Grand Final"
            className="py-2.5 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/60 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Knockouts (SF + Final)</span>
          </button>

          <button
            onClick={handleGenerateFullTournament}
            title="Generate full tournament in one click: Round Robin + SF1 + SF2 + Final"
            className="py-2.5 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-600/60 text-blue-300 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-blue-400" />
            <span>🏆 Full Tournament</span>
          </button>

          <button
            onClick={handleRestartAllFixtures}
            title={isAdmin ? "Restart all fixtures for this tournament back to scheduled" : "Admin login required to restart fixtures"}
            className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Restart All</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fixture</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto scrollbar-none">
        {[
          {
            id: 'all',
            label: `All (${matches.filter((m) => selectedTourneyId === 'all' || m.tournamentId === selectedTourneyId).length})`
          },
          { id: 'League', label: 'Round Robin' },
          { id: 'Semi-Final', label: 'Semi-Finals ⚡' },
          { id: 'Final', label: 'Grand Final 🏆' },
          { id: 'live', label: 'Live' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Match Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
            No fixtures found in this category.
          </div>
        ) : (
          filteredMatches.map((m) => {
            const t1 = getTeam(m.team1Id);
            const t2 = getTeam(m.team2Id);
            const isLive =
              m.status === 'innings1' ||
              m.status === 'innings2' ||
              m.status === 'innings_break' ||
              m.status === 'toss';
            const isCompleted = m.status === 'completed';
            const isFinal = m.stage === 'Final';
            const isSemi = m.stage === 'Semi-Final';

            return (
              <div
                key={m.id}
                className={`rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg flex flex-col justify-between transition-all border ${
                  isFinal
                    ? 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/50 shadow-amber-500/10'
                    : isSemi
                    ? 'bg-gradient-to-b from-purple-950/20 via-slate-900 to-slate-900 border-purple-500/40 shadow-purple-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top info badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>Match #{m.matchNumber}</span>
                      <span>•</span>
                      {isFinal ? (
                        <span className="text-amber-300 font-black bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center space-x-1">
                          <Trophy className="w-3 h-3 text-amber-300" />
                          <span>GRAND FINAL</span>
                        </span>
                      ) : isSemi ? (
                        <span className="text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/40 flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-purple-300" />
                          <span>SEMI-FINAL</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">{m.stage || 'Round Robin'}</span>
                      )}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isLive
                            ? 'bg-red-600 text-white shadow-sm'
                            : isCompleted
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        title="Edit Fixture"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        title="Delete Fixture"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Teams and Scores Display */}
                  <div className="space-y-3 mb-4">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TeamLogo team={t1} size="sm" />
                        <span className="font-bold text-white text-sm sm:text-base">
                          {t1?.name || 'Team 1'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-white text-base">
                          {m.innings1
                            ? `${m.innings1.totalRuns}/${m.innings1.wickets}`
                            : '-'}
                        </span>
                        {m.innings1 && (
                          <span className="text-[11px] text-slate-400 ml-1">
                            ({m.innings1.oversCompleted}.{m.innings1.ballsInCurrentOver} ov)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TeamLogo team={t2} size="sm" />
                        <span className="font-bold text-white text-sm sm:text-base">
                          {t2?.name || 'Team 2'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-white text-base">
                          {m.innings2
                            ? `${m.innings2.totalRuns}/${m.innings2.wickets}`
                            : '-'}
                        </span>
                        {m.innings2 && (
                          <span className="text-[11px] text-slate-400 ml-1">
                            ({m.innings2.oversCompleted}.{m.innings2.ballsInCurrentOver} ov)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match Note / Result margin */}
                  {m.winMargin && (
                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-xl text-xs font-semibold text-emerald-300 text-center mb-3">
                      {m.winMargin}
                    </div>
                  )}

                  {/* Date, Time & Venue */}
                  <div className="flex items-center space-x-4 text-xs text-slate-400 mb-4 pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{m.scheduledTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{m.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onStartScoring(m.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'View Full Match' : (isAdmin ? 'Score Match' : 'Watch Live (Cricbuzz)')}</span>
                  </button>

                  <button
                    onClick={() => onOpenScorecard(m.id)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-1 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Scorecard</span>
                  </button>

                  <button
                    onClick={() => handleRestartFixture(m.id, m.matchNumber)}
                    title={isAdmin ? "Restart Fixture (Reset back to scheduled)" : "Admin password required to restart fixture"}
                    className="py-2.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-semibold text-xs flex items-center space-x-1 transition-colors border border-amber-500/30 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Restart</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Fixture Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingMatch ? 'Edit Match Fixture' : 'Schedule New Fixture'}
            </h3>

            <form onSubmit={handleSaveFixture} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Team 1 (Home)
                </label>
                <select
                  value={team1Id}
                  onChange={(e) => setTeam1Id(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logoEmoji} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Team 2 (Away)
                </label>
                <select
                  value={team2Id}
                  onChange={(e) => setTeam2Id(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logoEmoji} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="League">League Round</option>
                  <option value="Semi-Final">Semi-Final</option>
                  <option value="Final">Grand Final</option>
                  <option value="Friendly">Friendly Match</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Venue / Rooftop Court
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Scheduled Time
                </label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Save Fixture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Round Robin & Qualify Rules Modal */}
      {isRulesModalOpen && (
        <ManualRulesModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          onRefreshData={onRefreshData}
          defaultTournamentId={tournament.id}
          isAdmin={isAdmin}
          onRequireAdmin={onRequireAdmin}
        />
      )}
    </div>
  );
};
