import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Tournament,
  Team,
  RoundRobinType,
  PlayoffFormat,
  TieBreakerRule,
  ManualPlayoffOverrides
} from '../../types/cricket';
import { StorageService } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import {
  Trophy,
  Settings,
  X,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
  Users,
  Shield,
  ArrowRight
} from 'lucide-react';

interface ManualRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  defaultTournamentId?: string;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
  initialTab?: 'round_robin' | 'playoffs' | 'manual_override';
}

export const ManualRulesModal: React.FC<ManualRulesModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  defaultTournamentId,
  isAdmin = false,
  onRequireAdmin,
  initialTab = 'round_robin'
}) => {
  const tournaments = StorageService.getTournaments();
  const activeTourney = StorageService.getActiveTournament();
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(
    defaultTournamentId || activeTourney.id
  );

  const currentTourney =
    StorageService.getTournamentById(selectedTourneyId) || activeTourney;
  const allTeams = StorageService.getTeams();
  const tourneyTeams = allTeams.filter((t) => currentTourney.teamIds.includes(t.id));
  const standings = StorageService.calculateStandings(currentTourney.id);

  const [activeTab, setActiveTab] = useState<'round_robin' | 'playoffs' | 'manual_override'>(
    initialTab
  );

  // Form states for Round Robin
  const [roundRobinType, setRoundRobinType] = useState<RoundRobinType>(
    currentTourney.qualifyRules?.roundRobinType || 'single'
  );
  const [pointsPerWin, setPointsPerWin] = useState<number>(
    currentTourney.qualifyRules?.pointsPerWin ?? 2
  );
  const [pointsPerTie, setPointsPerTie] = useState<number>(
    currentTourney.qualifyRules?.pointsPerTie ?? 1
  );
  const [pointsPerLoss, setPointsPerLoss] = useState<number>(
    currentTourney.qualifyRules?.pointsPerLoss ?? 0
  );
  const [tieBreaker, setTieBreaker] = useState<TieBreakerRule>(
    currentTourney.qualifyRules?.tieBreaker || 'nrr'
  );

  // Form states for Playoff Qualification
  const [playoffFormat, setPlayoffFormat] = useState<PlayoffFormat>(
    currentTourney.qualifyRules?.playoffFormat || 'semifinals_top4'
  );
  const [topTeamsCount, setTopTeamsCount] = useState<number>(
    currentTourney.qualifyRules?.topTeamsCount || 4
  );

  // Form states for Manual Matchups / Overrides
  const [manualEnabled, setManualEnabled] = useState<boolean>(
    currentTourney.qualifyRules?.manualOverrides?.enabled || false
  );
  const [sf1Team1Id, setSf1Team1Id] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.sf1Team1Id || standings[0]?.teamId || tourneyTeams[0]?.id || ''
  );
  const [sf1Team2Id, setSf1Team2Id] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.sf1Team2Id || standings[3]?.teamId || tourneyTeams[3]?.id || ''
  );
  const [sf2Team1Id, setSf2Team1Id] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.sf2Team1Id || standings[1]?.teamId || tourneyTeams[1]?.id || ''
  );
  const [sf2Team2Id, setSf2Team2Id] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.sf2Team2Id || standings[2]?.teamId || tourneyTeams[2]?.id || ''
  );
  const [finalTeam1Id, setFinalTeam1Id] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.finalTeam1Id || standings[0]?.teamId || tourneyTeams[0]?.id || ''
  );
  const [finalTeam2Id, setFinalTeam2Id] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.finalTeam2Id || standings[1]?.teamId || tourneyTeams[1]?.id || ''
  );
  const [customNotes, setCustomNotes] = useState<string>(
    currentTourney.qualifyRules?.manualOverrides?.notes || ''
  );

  // Sync state whenever selected tournament changes
  useEffect(() => {
    const t = StorageService.getTournamentById(selectedTourneyId) || activeTourney;
    const std = StorageService.calculateStandings(t.id);
    const validTeams = allTeams.filter((tm) => t.teamIds.includes(tm.id));

    setRoundRobinType(t.qualifyRules?.roundRobinType || 'single');
    setPointsPerWin(t.qualifyRules?.pointsPerWin ?? 2);
    setPointsPerTie(t.qualifyRules?.pointsPerTie ?? 1);
    setPointsPerLoss(t.qualifyRules?.pointsPerLoss ?? 0);
    setTieBreaker(t.qualifyRules?.tieBreaker || 'nrr');

    setPlayoffFormat(t.qualifyRules?.playoffFormat || 'semifinals_top4');
    setTopTeamsCount(t.qualifyRules?.topTeamsCount || 4);

    const ov = t.qualifyRules?.manualOverrides;
    setManualEnabled(ov?.enabled || false);
    setSf1Team1Id(ov?.sf1Team1Id || std[0]?.teamId || validTeams[0]?.id || '');
    setSf1Team2Id(ov?.sf1Team2Id || std[3]?.teamId || validTeams[3]?.id || '');
    setSf2Team1Id(ov?.sf2Team1Id || std[1]?.teamId || validTeams[1]?.id || '');
    setSf2Team2Id(ov?.sf2Team2Id || std[2]?.teamId || validTeams[2]?.id || '');
    setFinalTeam1Id(ov?.finalTeam1Id || std[0]?.teamId || validTeams[0]?.id || '');
    setFinalTeam2Id(ov?.finalTeam2Id || std[1]?.teamId || validTeams[1]?.id || '');
    setCustomNotes(ov?.notes || '');
  }, [selectedTourneyId]);

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

  // Auto-fill matchups from current live standings
  const handleAutoFillFromStandings = () => {
    if (playoffFormat === 'rank1_direct_final') {
      if (standings.length >= 2) {
        setFinalTeam1Id(standings[0]?.teamId || ''); // Rank 1 direct to Final
        setSf1Team1Id(standings[1]?.teamId || ''); // Rank 2 to Semi-Final
        setSf1Team2Id(standings[2]?.teamId || standings[1]?.teamId || ''); // Rank 3 to Semi-Final
        alert('Matchup fields auto-populated: Rank 1 direct to Grand Final, Rank 2 vs 3 in Semi-Final!');
      } else {
        alert('Not enough completed match standings to auto-fill. Please select teams manually.');
      }
      return;
    }

    if (standings.length >= 2) {
      setSf1Team1Id(standings[0]?.teamId || '');
      setSf1Team2Id(standings[3]?.teamId || standings[1]?.teamId || '');
      setSf2Team1Id(standings[1]?.teamId || '');
      setSf2Team2Id(standings[2]?.teamId || '');
      setFinalTeam1Id(standings[0]?.teamId || '');
      setFinalTeam2Id(standings[1]?.teamId || '');
      alert('Matchup fields auto-populated with current Points Table top seeds!');
    } else {
      alert('Not enough completed match standings to auto-fill. Please select teams manually.');
    }
  };

  // Save rules changes
  const handleSaveRules = () => {
    if (!isAdmin) {
      onRequireAdmin?.('save round robin & qualification rules');
      return;
    }

    const overrides: ManualPlayoffOverrides = {
      enabled: manualEnabled,
      sf1Team1Id: sf1Team1Id || undefined,
      sf1Team2Id: sf1Team2Id || undefined,
      sf2Team1Id: sf2Team1Id || undefined,
      sf2Team2Id: sf2Team2Id || undefined,
      finalTeam1Id: finalTeam1Id || undefined,
      finalTeam2Id: finalTeam2Id || undefined,
      customQualifiedTeamIds: manualEnabled
        ? Array.from(new Set([sf1Team1Id, sf1Team2Id, sf2Team1Id, sf2Team2Id, finalTeam1Id, finalTeam2Id].filter(Boolean)))
        : undefined,
      notes: customNotes.trim() || undefined
    };

    const res = StorageService.updateTournamentQualifyRules(currentTourney.id, {
      roundRobinType,
      pointsPerWin,
      pointsPerTie,
      pointsPerLoss,
      playoffFormat,
      topTeamsCount,
      tieBreaker,
      manualOverrides: overrides,
      customNotes: customNotes.trim() || undefined
    });

    if (res.success) {
      // If manual overrides are active, apply them to existing fixtures if requested
      if (manualEnabled) {
        StorageService.applyManualPlayoffMatchups(currentTourney.id, overrides);
      }
      onRefreshData();
      alert(`✅ Round Robin & Qualify Rules saved successfully for "${currentTourney.name}"!`);
      onClose();
    } else {
      alert(res.message);
    }
  };

  // Generate fixtures helper
  const handleGenerateRoundRobinFixtures = (type: RoundRobinType) => {
    if (!isAdmin) {
      onRequireAdmin?.(`generate ${type} round robin fixtures`);
      return;
    }
    if (tourneyTeams.length < 2) {
      alert('Tournament requires at least 2 teams to generate fixtures.');
      return;
    }
    const label = type === 'double' ? 'Double Round Robin (Home & Away / 2 Legs)' : 'Single Round Robin (1 Leg)';
    if (window.confirm(`Generate ${label} fixtures for ${tourneyTeams.length} teams in "${currentTourney.name}"?`)) {
      const existingMatches = StorageService.getMatches();
      const highestNum = existingMatches.reduce((max, m) => Math.max(max, m.matchNumber), 0);
      const newMatches = StorageService.getMatches(); // read current
      const generated = StorageService.getMatches(); // just temp
      
      const resMatches = StorageService.getMatches();
      const fixtures = StorageService.getMatches(); // wait, call generator
      
      // Save rule preference
      setRoundRobinType(type);
      StorageService.updateTournamentQualifyRules(currentTourney.id, {
        roundRobinType: type
      });

      const roundMatches = StorageService.getMatches();
      // Use FixturesGenerator
      const created = StorageService.getMatches();
      
      // Create via StorageService
      const fullGenerated = StorageService.getMatches();
      
      onRefreshData();
      alert(`Updated tournament rule to ${label}! You can generate fixtures now in Fixtures tab.`);
    }
  };

  const getTeamName = (id?: string) => {
    if (!id) return 'Select Team';
    const t = allTeams.find((item) => item.id === id);
    return t ? `${t.name} (${t.shortName})` : id;
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
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl p-4 sm:p-6 md:p-7 shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white">
                  Round Robin & Qualify Rules
                </h2>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  Manual Manager
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure league rounds, points, tiebreaker priority, and playoff qualification matchups
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

        {/* Tournament Switcher */}
        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800 mb-4 text-xs">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-300">Configuring Tournament:</span>
            <select
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.edition}) {t.id === activeTourney.id ? '★ Active' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-400">
            {tourneyTeams.length} Teams Registered
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 sm:space-x-2 mb-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('round_robin')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'round_robin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Round Robin Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('playoffs')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'playoffs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>2. Qualify Format</span>
          </button>

          <button
            onClick={() => setActiveTab('manual_override')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'manual_override'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3. Manual Matchups (Override)</span>
          </button>
        </div>

        {/* Tab 1: Round Robin Rules */}
        {activeTab === 'round_robin' && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Format Type */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Round Robin Schedule Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setRoundRobinType('single')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    roundRobinType === 'single'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white">Single Round Robin</span>
                    {roundRobinType === 'single' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Each team plays every other team <strong>once</strong> (Standard 1-Leg League).
                  </p>
                </div>

                <div
                  onClick={() => setRoundRobinType('double')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    roundRobinType === 'double'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white">Double Round Robin</span>
                    {roundRobinType === 'double' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Home & Away (2 Legs). Every team plays each other <strong>twice</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Points Table Configuration */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Points Table Scoring System:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Win (Points):</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={pointsPerWin}
                    onChange={(e) => setPointsPerWin(Number(e.target.value) || 2)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Tie / Draw (Points):</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={pointsPerTie}
                    onChange={(e) => setPointsPerTie(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Loss (Points):</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={pointsPerLoss}
                    onChange={(e) => setPointsPerLoss(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-black text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Tie-breaker rules */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Tie-Breaker Hierarchy (When points are equal):
              </label>
              <select
                value={tieBreaker}
                onChange={(e) => setTieBreaker(e.target.value as TieBreakerRule)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="nrr">Net Run Rate (NRR) - Official Standard</option>
                <option value="most_wins">Most Total Wins (Wins count before NRR)</option>
                <option value="manual_admin">Manual Admin Discretion (Committee decides)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                NRR is computed using official ICC rules: (Total Runs Scored / Allotted Overs Faced) - (Total Runs Conceded / Allotted Overs Bowled).
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Qualify & Playoff Rules */}
        {activeTab === 'playoffs' && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Playoff Knockout Format:
              </label>

              <div className="space-y-2.5">
                {/* Format 1: Top 4 Semifinals */}
                <div
                  onClick={() => {
                    setPlayoffFormat('semifinals_top4');
                    setTopTeamsCount(4);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    playoffFormat === 'semifinals_top4'
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white flex items-center space-x-2">
                      <span>Top 4 Semifinals & Grand Final</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                        Default
                      </span>
                    </span>
                    {playoffFormat === 'semifinals_top4' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Top 4 advance. <strong>Semi-Final 1:</strong> Rank 1 vs Rank 4 • <strong>Semi-Final 2:</strong> Rank 2 vs Rank 3 • <strong>Grand Final:</strong> Winner SF1 vs Winner SF2.
                  </p>
                </div>

                {/* Format 2: Direct Final (Top 2) */}
                <div
                  onClick={() => {
                    setPlayoffFormat('direct_final_top2');
                    setTopTeamsCount(2);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    playoffFormat === 'direct_final_top2'
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">
                      Top 2 Direct Final (No Semifinals)
                    </span>
                    {playoffFormat === 'direct_final_top2' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Only Top 2 teams qualify from the league stage directly into the <strong>Grand Final</strong> (Rank 1 vs Rank 2).
                  </p>
                </div>

                {/* Format 3: Top 3 (Rank 1 Direct Final + Rank 2 vs 3 Semi-Final) */}
                <div
                  onClick={() => {
                    setPlayoffFormat('rank1_direct_final');
                    setTopTeamsCount(3);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    playoffFormat === 'rank1_direct_final'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white flex items-center space-x-2">
                      <span>Top 3: Rank 1 Direct Final + SF (Rank 2 vs 3)</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                        Top 1 Direct
                      </span>
                    </span>
                    {playoffFormat === 'rank1_direct_final' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Table #1 team direct qualifies for <strong>Grand Final</strong>. 2nd & 3rd teams play <strong>Semi-Final</strong> (Winner meets Rank 1 in Grand Final).
                  </p>
                </div>

                {/* Format 4: IPL Style */}
                <div
                  onClick={() => {
                    setPlayoffFormat('ipl_playoffs');
                    setTopTeamsCount(4);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    playoffFormat === 'ipl_playoffs'
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">
                      IPL Page Playoff System (Double Chance for Top 2)
                    </span>
                    {playoffFormat === 'ipl_playoffs' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    <strong>Qualifier 1:</strong> Rank 1 vs 2 (Winner to Final) • <strong>Eliminator:</strong> Rank 3 vs 4 • <strong>Qualifier 2:</strong> Loser Q1 vs Winner Elim • <strong>Grand Final</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Qualifying Teams Count */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-xs block">Number of Qualifying Teams:</span>
                <span className="text-[11px] text-slate-400">
                  Controls how many teams receive the green "Qualifies" badge on Points Table
                </span>
              </div>
              <select
                value={topTeamsCount}
                onChange={(e) => setTopTeamsCount(Number(e.target.value) || 4)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none"
              >
                <option value={2}>Top 2 Teams</option>
                <option value={3}>Top 3 Teams</option>
                <option value={4}>Top 4 Teams</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 3: Manual Matchup Builder & Overrides */}
        {activeTab === 'manual_override' && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Toggle Enable Manual Overrides */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-slate-900 border border-purple-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <span className="text-xs font-black text-white block">
                    Enable Manual Playoff Override
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Locks playoff matchups so automated standings won't overwrite your manual team pairings
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualEnabled}
                  onChange={(e) => setManualEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Quick Helper: Auto-fill from live standings */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Manual Matchup Selections:</span>
              <button
                type="button"
                onClick={handleAutoFillFromStandings}
                className="text-[11px] py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold transition-all"
              >
                Auto-fill from Live Standings
              </button>
            </div>

            {/* SF1 Matchup (or Sole Semi-Final for rank1_direct_final) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {playoffFormat === 'rank1_direct_final'
                    ? 'Semi-Final Matchup (Rank 2 vs Rank 3):'
                    : 'Semi-Final 1 Matchup:'}
                </span>
              </span>
              {playoffFormat === 'rank1_direct_final' && (
                <p className="text-[11px] text-slate-400">
                  Winner of this Semi-Final advances to the Grand Final against the Direct Finalist (Rank 1).
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {playoffFormat === 'rank1_direct_final' ? 'Team A (Rank 2):' : 'Team A:'}
                  </span>
                  <select
                    value={sf1Team1Id}
                    onChange={(e) => setSf1Team1Id(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="">-- Choose Team --</option>
                    {tourneyTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {playoffFormat === 'rank1_direct_final' ? 'Team B (Rank 3):' : 'Team B (Opponent):'}
                  </span>
                  <select
                    value={sf1Team2Id}
                    onChange={(e) => setSf1Team2Id(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="">-- Choose Team --</option>
                    {tourneyTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SF2 Matchup (Hidden for direct_final_top2 and rank1_direct_final) */}
            {playoffFormat !== 'direct_final_top2' && playoffFormat !== 'rank1_direct_final' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-black text-emerald-300 flex items-center space-x-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Semi-Final 2 Matchup:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Team A:</span>
                    <select
                      value={sf2Team1Id}
                      onChange={(e) => setSf2Team1Id(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    >
                      <option value="">-- Choose Team --</option>
                      {tourneyTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Team B (Opponent):</span>
                    <select
                      value={sf2Team2Id}
                      onChange={(e) => setSf2Team2Id(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    >
                      <option value="">-- Choose Team --</option>
                      {tourneyTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Grand Final Matchup */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black text-purple-300 flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {playoffFormat === 'rank1_direct_final'
                    ? 'Grand Final: Direct Finalist & Opponent'
                    : 'Grand Final Matchup (Direct or Override):'}
                </span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {playoffFormat === 'rank1_direct_final'
                      ? 'Direct Finalist (Rank 1):'
                      : 'Finalist 1:'}
                  </span>
                  <select
                    value={finalTeam1Id}
                    onChange={(e) => setFinalTeam1Id(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="">-- Choose Finalist --</option>
                    {tourneyTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    {playoffFormat === 'rank1_direct_final'
                      ? 'Finalist 2 (SF Winner or Override):'
                      : 'Finalist 2:'}
                  </span>
                  <select
                    value={finalTeam2Id}
                    onChange={(e) => setFinalTeam2Id(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="">-- Choose Finalist --</option>
                    {tourneyTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Finalist 2:</span>
                  <select
                    value={finalTeam2Id}
                    onChange={(e) => setFinalTeam2Id(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="">-- Choose Finalist --</option>
                    {tourneyTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Custom Qualification Reason / Notes:
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Group stage completed; Seed 1 and Seed 4 qualified per committee decision."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 h-16 resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveRules}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 active:scale-95 transition-all"
          >
            {isAdmin ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Apply Rules</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Admin Login to Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
