import React from 'react';
import {
  BookOpen,
  AlertTriangle,
  Zap,
  Shield,
  RefreshCw,
  Target,
  User,
  Coins,
  CheckCircle2,
  AlertOctagon,
  Trophy
} from 'lucide-react';
import { StorageService } from '../../utils/storage';

export const RulesGuideView: React.FC = () => {
  const activeTournament = StorageService.getActiveTournament();
  const overs = activeTournament?.oversPerInnings || 10;
  const maxBatsmanOvers =
    activeTournament?.maxOversPerBatsman ||
    (overs <= 6 ? Math.max(2, Math.floor(overs * 0.5)) : Math.min(overs, 4));
  const maxBowlerOvers =
    activeTournament?.maxOversPerBowler || Math.max(1, Math.ceil(overs / 5));
  const minBowlers = Math.max(1, Math.ceil(overs / maxBowlerOvers));

  const qRules = activeTournament?.qualifyRules;
  const rrTypeLabel = qRules?.roundRobinType === 'double' ? 'Double Round Robin (Home & Away)' : 'Single Round Robin';
  const winPts = qRules?.pointsPerWin ?? 2;
  const tiePts = qRules?.pointsPerTie ?? 1;
  const lossPts = qRules?.pointsPerLoss ?? 0;
  const playoffLabel =
    qRules?.playoffFormat === 'direct_final_top2'
      ? 'Top 2 Direct Grand Final'
      : qRules?.playoffFormat === 'rank1_direct_final'
      ? 'Top 3 (Rank 1 Direct Final + Rank 2 vs 3 Semi-Final)'
      : qRules?.playoffFormat === 'ipl_playoffs'
      ? 'IPL Page Playoff System (Q1, Eliminator, Q2, Grand Final)'
      : 'Top 4 Semifinals (1v4, 2v3) & Grand Final';

  const rules = [
    {
      title: 'Tournament & Team Structure',
      icon: User,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      description:
        'The tournament features 4 to 6 teams competing on rooftop concrete courts. Each team roster consists of 5 to 6 registered players. Players have persistent career profiles and can switch teams for future tournaments.',
      points: [
        '4 to 6 teams in tournament, 5 to 6 players per squad',
        'Registration 1st: Players register in the app pool first, then get picked into teams',
        'Full Management: Teams can edit players (Name & Jersey #), remove players, and delete teams',
        'Players maintain lifetime statistics and can switch teams between tournaments'
      ]
    },
    {
      title: `Tournament Format: ${rrTypeLabel} → ${playoffLabel}`,
      icon: Trophy,
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      description:
        `Teams compete in ${rrTypeLabel} league stage with ${winPts} pts per win, ${tiePts} pt per tie, and ${lossPts} pts per loss. Tiebreakers are resolved via Net Run Rate (NRR). Playoff qualification follows ${playoffLabel}, with full manual admin override authority.`,
      points: [
        `League Stage: ${rrTypeLabel} schedule across all participating teams`,
        `Points System: Win = ${winPts} pts | Tie = ${tiePts} pt | Loss = ${lossPts} pts`,
        'Tiebreaker Hierarchy: Points → Net Run Rate (NRR) → Most Total Wins',
        `Playoffs Qualification: ${playoffLabel}`,
        'Manual Controls: Tournament administrator can manually override seeds, pairings, or qualify specific teams'
      ]
    },
    {
      title: 'Single-Player Batting Format',
      icon: Zap,
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
      description:
        'Unlike conventional 2-batsman cricket, Rooftop Cricket is played with Single-Player Batting. Only one batsman occupies the pitch at any time, facing the bowler directly without a non-striker partner.',
      points: [
        'Solo batsman on the pitch at a time',
        'All deliveries faced and runs scored directly credit the active batsman',
        'When dismissed or retired, next batsman comes to crease'
      ]
    },
    {
      title: `${overs}-Over Match & Innings Duration`,
      icon: Target,
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      description:
        `Each team bats for ${overs} overs (${overs * 6} legal deliveries) per innings in "${activeTournament?.name || 'Tournament'}". A digital coin toss decides which team bats or bowls first.`,
      points: [
        `${overs} overs (${overs * 6} legal balls) per team innings`,
        'Coin toss determines bat or bowl choice',
        '2nd innings chases target (Innings 1 Total + 1)'
      ]
    },
    {
      title: `Dismissal, ${maxBatsmanOvers}-Over Limit & Unrestricted Re-entry`,
      icon: AlertTriangle,
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      description:
        `A batsman who is OUT cannot play twice in the innings. A batsman can bat for up to ${maxBatsmanOvers} overs (${maxBatsmanOvers * 6} legal balls) before auto-retiring. However, a retired batsman can return to bat if all other batsmen are out OR all other batsmen have faced at least 1 ball. Once re-entered, they have NO restriction!`,
      points: [
        'Out batsman CANNOT play twice in the innings',
        `Maximum ${maxBatsmanOvers} overs (${maxBatsmanOvers * 6} legal balls) before mandatory retirement`,
        'Re-entry Condition 1: All other teammates on the squad are OUT',
        'Re-entry Condition 2: All other teammates have faced at least 1 ball',
        `No Restriction on Return: Re-entered batsman bats freely with NO ${maxBatsmanOvers}-over limit`
      ]
    },
    {
      title: 'Six Penalty (-4 Runs) & Only 4-Run Shots',
      icon: AlertOctagon,
      color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      description:
        'Because rooftop cricket is played in high-rise areas with safety netting, hitting the ball over the roof is strictly penalized. Only 4-run shots are allowed as boundaries.',
      points: [
        'Only 4-run shots are allowed for boundary scoring',
        'Hitting a 6 results in a severe penalty: -4 runs deducted from team score!',
        'The delivery is counted as a legal ball faced, and penalty is recorded'
      ]
    },
    {
      title: 'Extras: Wides & No-Balls (+4 Combo)',
      icon: Zap,
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      description:
        'Wides and no-balls award +1 extra run and must be re-bowled. Furthermore, hitting a 4 on a no-ball activates a special bonus rule.',
      points: [
        'Wide ball: +1 run extra, delivery is re-bowled',
        'No-ball: +1 run extra, delivery is re-bowled',
        'No-Ball + 4: The ball is not counted in the over, but 4 runs are added to the bat (1 NB + 4 Bat = 5 runs total)!'
      ]
    },
    {
      title: 'Dead Ball Over Escalation Rule',
      icon: AlertTriangle,
      color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
      description:
        'To prevent time-wasting or excessive resets, dead balls within an over are tracked strictly.',
      points: [
        '1st & 2nd Dead Ball in an over: Re-bowl with 0 runs added',
        '3rd and subsequent Dead Balls in that over: Awards an extra +1 penalty run to the batting team!',
        'Counter resets to 0 at the start of each new over'
      ]
    },
    {
      title: `Bowler Quota: Highest ${maxBowlerOvers} Overs (Min ${minBowlers} Bowlers Bowl)`,
      icon: Target,
      color: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
      description:
        `In a ${overs}-over innings, each bowler can bowl a maximum of ${maxBowlerOvers} overs (highest ${maxBowlerOvers} overs). At least ${minBowlers} different bowlers must bowl during the ${overs} overs.`,
      points: [
        `Maximum ${maxBowlerOvers} overs allowed per bowler (Highest ${maxBowlerOvers} overs limit)`,
        `Minimum ${minBowlers} different bowlers must bowl in a ${overs}-over innings`,
        'No bowler may bowl two consecutive overs'
      ]
    },
    {
      title: 'DRS Reviews: 2 Retained on Win',
      icon: Shield,
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
      description:
        'Each team has 2 umpire reviews per innings for contested dismissals, boundaries, or calls.',
      points: [
        '2 reviews per innings for each team',
        'Review Retained: If review is successful (upheld), the review count is not deducted!',
        'Review Lost: If review is unsuccessful (stands), 1 review is lost'
      ]
    },
    {
      title: 'Tactical Substitution: 1 Per Innings',
      icon: RefreshCw,
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      description:
        'Teams are allowed 1 tactical substitution per innings to bring on an impact batter or specialist bowler from the bench.',
      points: [
        '1 substitution allowed per innings',
        'Can replace active batter, bowler, or fielder',
        'Recorded in official match log'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Official Rooftop Cricket Rules
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Comprehensive rulebook for {activeTournament?.name || 'Rooftop Cricket Tournament'} ({overs}-over format, Bowler Highest {maxBowlerOvers} Overs, Round Robin → Semifinals → Final)
        </p>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {rules.map((rule, idx) => {
          const Icon = rule.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${rule.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-white">{rule.title}</h2>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {rule.description}
                </p>

                <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                  {rule.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
