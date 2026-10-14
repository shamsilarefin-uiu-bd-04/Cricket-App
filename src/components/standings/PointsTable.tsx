import React, { useState } from 'react';
import { StorageService } from '../../utils/storage';
import { TeamLogo } from '../common/TeamLogo';
import { ManualRulesModal } from '../tournament/ManualRulesModal';
import {
  Trophy,
  TrendingUp,
  HelpCircle,
  Calendar,
  Shield,
  Settings,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';

interface PointsTableProps {
  onRefreshData?: () => void;
  isAdmin?: boolean;
  onRequireAdmin?: (actionDesc?: string) => void;
  dataVersion?: number;
}

export const PointsTable: React.FC<PointsTableProps> = ({
  onRefreshData,
  isAdmin = false,
  onRequireAdmin,
  dataVersion
}) => {
  const tournaments = StorageService.getTournaments();
  const activeTournament = StorageService.getActiveTournament();
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(activeTournament.id);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const tournament =
    StorageService.getTournamentById(selectedTourneyId) || activeTournament;
  const standings = StorageService.calculateStandings(tournament.id);
  const teams = StorageService.getTeams();

  const getTeam = (teamId: string) => teams.find((t) => t.id === teamId);

  const rules = tournament.qualifyRules;
  const winPts = rules?.pointsPerWin ?? 2;
  const tiePts = rules?.pointsPerTie ?? 1;
  const lossPts = rules?.pointsPerLoss ?? 0;
  const playoffFormat = rules?.playoffFormat || 'semifinals_top4';
  const topTeamsCount =
    rules?.topTeamsCount || (playoffFormat === 'direct_final_top2' ? 2 : playoffFormat === 'rank1_direct_final' ? 3 : 4);
  const roundRobinType = rules?.roundRobinType || 'single';
  const isManualActive = rules?.manualOverrides?.enabled || false;
  const manualQualified = rules?.manualOverrides?.customQualifiedTeamIds || [];

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>Tournament Standings</span>
            </h1>
            {isManualActive && (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/40 flex items-center space-x-1">
                <Shield className="w-3 h-3 text-purple-400" />
                <span>Manual Qualification Active</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {tournament.name} • {roundRobinType === 'double' ? 'Double' : 'Single'} Round Robin •{' '}
            {playoffFormat === 'direct_final_top2'
              ? 'Top 2 Advance to Grand Final'
              : playoffFormat === 'rank1_direct_final'
              ? 'Top 3 Advance: Rank 1 Direct Final + Rank 2 vs 3 Semi-Final'
              : playoffFormat === 'ipl_playoffs'
              ? 'Top 4 Advance to IPL Playoff Bracket'
              : 'Top 4 Advance to Semifinals & Grand Final'}
          </p>
        </div>

        {/* Tournament Switcher & Rules Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-slate-400">Tournament:</span>
            <select
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.edition}) {t.id === activeTournament.id ? '★ Active' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Configure round robin points, tiebreaker priority, and manual qualification matchups"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Round Robin & Qualify Rules</span>
          </button>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3.5 px-4 text-center">Pos</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-3 text-center">P</th>
                <th className="py-3.5 px-3 text-center">W</th>
                <th className="py-3.5 px-3 text-center">L</th>
                <th className="py-3.5 px-3 text-center">T</th>
                <th className="py-3.5 px-4 text-right">NRR</th>
                <th className="py-3.5 px-4 text-center font-black text-white">PTS</th>
                <th className="py-3.5 px-4 text-center">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs italic">
                    No teams registered in this tournament yet.
                  </td>
                </tr>
              ) : (
                standings.map((row, idx) => {
                  const team = getTeam(row.teamId);

                  // Qualification badge logic
                  const isManuallyQualified =
                    isManualActive && manualQualified.includes(row.teamId);

                  let badgeLabel = 'Eliminated';
                  let badgeStyle = 'bg-slate-800 text-slate-500 border-slate-700';
                  let rowHighlight = '';

                  if (isManuallyQualified) {
                    badgeLabel = '⭐ Qualified (Manual)';
                    badgeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                    rowHighlight = 'bg-purple-950/15';
                  } else if (playoffFormat === 'direct_final_top2') {
                    if (idx < 2) {
                      badgeLabel = 'Finalist (Top 2)';
                      badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      rowHighlight = 'bg-amber-950/15';
                    }
                  } else if (playoffFormat === 'rank1_direct_final') {
                    if (idx === 0) {
                      badgeLabel = 'Direct Finalist (Rank 1)';
                      badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black';
                      rowHighlight = 'bg-amber-950/20';
                    } else if (idx < 3) {
                      badgeLabel = 'Semi-Finalist (2v3)';
                      badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
                      rowHighlight = 'bg-emerald-950/15';
                    }
                  } else if (playoffFormat === 'ipl_playoffs') {
                    if (idx < 2) {
                      badgeLabel = 'Qualifier 1';
                      badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      rowHighlight = 'bg-amber-950/15';
                    } else if (idx < 4) {
                      badgeLabel = 'Eliminator';
                      badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                      rowHighlight = 'bg-emerald-950/15';
                    }
                  } else {
                    // Standard top 4 semifinals
                    if (idx < 2) {
                      badgeLabel = 'SF Top Seed';
                      badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      rowHighlight = 'bg-amber-950/15';
                    } else if (idx < topTeamsCount) {
                      badgeLabel = 'Playoff Qualifier';
                      badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                      rowHighlight = 'bg-emerald-950/15';
                    }
                  }

                  return (
                    <tr
                      key={row.teamId}
                      className={`hover:bg-slate-800/40 transition-colors ${rowHighlight}`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                              : idx === 1
                              ? 'bg-amber-600/20 text-amber-200 border border-amber-600/40 font-bold'
                              : idx < topTeamsCount
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-3">
                        <TeamLogo team={team} size="sm" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="hover:text-emerald-300 transition-colors">
                              {team?.name || row.teamId}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeStyle}`}
                            >
                              {badgeLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            {team?.shortName}
                          </span>
                        </div>
                      </td>

                      {/* Played */}
                      <td className="py-3.5 px-3 text-center text-slate-300 font-semibold">
                        {row.played}
                      </td>

                      {/* Won */}
                      <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">
                        {row.won}
                      </td>

                      {/* Lost */}
                      <td className="py-3.5 px-3 text-center text-red-400 font-semibold">
                        {row.lost}
                      </td>

                      {/* Tied */}
                      <td className="py-3.5 px-3 text-center text-slate-400">
                        {row.tied}
                      </td>

                      {/* Net Run Rate */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        <span
                          className={
                            row.netRunRate > 0
                              ? 'text-emerald-400'
                              : row.netRunRate < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }
                        >
                          {row.netRunRate > 0 ? `+${row.netRunRate}` : row.netRunRate}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-4 text-center font-black text-white text-base">
                        <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                          {row.points}
                        </span>
                      </td>

                      {/* Form */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {row.form.length === 0 ? (
                            <span className="text-slate-600 text-xs">-</span>
                          ) : (
                            row.form.map((res, fIdx) => (
                              <span
                                key={fIdx}
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                                  res === 'W'
                                    ? 'bg-emerald-600 text-white'
                                    : res === 'L'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {res}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules & NRR Explainer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-xs text-slate-400 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Active Round Robin & Qualification Rules ({tournament.name}):
            </span>
          </div>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="text-[11px] text-amber-300 hover:text-amber-200 font-bold underline flex items-center space-x-1"
          >
            <span>Edit Rules (Admin)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">League Format</span>
            <span className="text-sm font-extrabold text-white mt-0.5 block">
              {roundRobinType === 'double' ? 'Double Round Robin (Home & Away)' : 'Single Round Robin'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Points System</span>
            <span className="text-sm font-extrabold text-white mt-0.5 block">
              Win: <strong className="text-emerald-400">{winPts} pts</strong> | Tie:{' '}
              <strong className="text-slate-300">{tiePts} pt</strong> | Loss:{' '}
              <strong className="text-red-400">{lossPts} pts</strong>
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Playoff System</span>
            <span className="text-sm font-extrabold text-amber-300 mt-0.5 block">
              {playoffFormat === 'direct_final_top2'
                ? 'Top 2 Direct Final'
                : playoffFormat === 'rank1_direct_final'
                ? 'Top 3 (Rank 1 Direct Final + Rank 2 vs 3 SF)'
                : playoffFormat === 'ipl_playoffs'
                ? 'IPL Page Playoff System'
                : 'Top 4 (SF1, SF2, Grand Final)'}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed pt-1">
          • <strong>Net Run Rate (NRR):</strong> Calculated as <em>(Runs Scored ÷ Allotted Overs Faced) − (Runs Conceded ÷ Allotted Overs Bowled)</em> across all completed matches. Teams all-out are credited with their full allotted overs.
          {isManualActive && (
            <span className="text-purple-300 block font-semibold mt-1">
              • <strong>Manual Override Note:</strong> The tournament administrator has enabled manual qualification controls. Custom team selections take precedence over automated table positions.
            </span>
          )}
        </div>
      </div>

      {/* Manual Rules Modal */}
      {isRulesModalOpen && (
        <ManualRulesModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          onRefreshData={() => {
            onRefreshData?.();
          }}
          defaultTournamentId={selectedTourneyId}
          isAdmin={isAdmin}
          onRequireAdmin={onRequireAdmin}
        />
      )}
    </div>
  );
};
export default PointsTable;
