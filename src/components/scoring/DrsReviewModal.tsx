import React, { useState } from 'react';
import { Innings, Team } from '../../types/cricket';
import { Shield, CheckCircle, XCircle, Info, History, AlertTriangle } from 'lucide-react';

export interface DrsReviewSubmission {
  teamId: string;
  isBattingTeam: boolean;
  targetType: 'wicket' | 'boundary' | 'six_penalty' | 'extra' | 'other';
  isSuccessful: boolean;
  reason: string;
  overturnAction?: 'cancel_wicket' | 'cancel_six_penalty' | 'add_four';
}

interface DrsReviewModalProps {
  isOpen: boolean;
  innings: Innings;
  battingTeam: Team;
  bowlingTeam: Team;
  onApplyReview: (review: DrsReviewSubmission) => void;
  onClose: () => void;
}

export const DrsReviewModal: React.FC<DrsReviewModalProps> = ({
  isOpen,
  innings,
  battingTeam,
  bowlingTeam,
  onApplyReview,
  onClose
}) => {
  const [reviewingTeamId, setReviewingTeamId] = useState<string>(battingTeam.id);
  const [targetType, setTargetType] = useState<'wicket' | 'boundary' | 'six_penalty' | 'extra' | 'other'>('wicket');
  const [reviewReason, setReviewReason] = useState<string>('Out / Dismissal Appeal');
  const [overturnAction, setOverturnAction] = useState<'cancel_wicket' | 'cancel_six_penalty' | 'add_four' | undefined>('cancel_wicket');
  const [customNotes, setCustomNotes] = useState<string>('');

  if (!isOpen) return null;

  const isBattingTeam = reviewingTeamId === battingTeam.id;
  const currentReviewsRemaining = isBattingTeam
    ? (innings.battingTeamReviewsRemaining ?? 2)
    : (innings.bowlingTeamReviewsRemaining ?? 2);

  const canCallReview = currentReviewsRemaining > 0;

  const handleDecision = (isSuccessful: boolean) => {
    if (!canCallReview) {
      alert(`No reviews remaining for ${isBattingTeam ? battingTeam.name : bowlingTeam.name} in this innings!`);
      return;
    }

    const fullReason = `${reviewReason}${customNotes ? ` (${customNotes.trim()})` : ''}`;

    onApplyReview({
      teamId: reviewingTeamId,
      isBattingTeam,
      targetType,
      isSuccessful,
      reason: fullReason,
      overturnAction: isSuccessful ? overturnAction : undefined
    });
  };

  const handleTargetTypeChange = (type: 'wicket' | 'boundary' | 'six_penalty' | 'extra' | 'other') => {
    setTargetType(type);
    if (type === 'wicket') {
      setReviewReason('Wicket / Dismissal Check');
      setOverturnAction('cancel_wicket');
    } else if (type === 'six_penalty') {
      setReviewReason('Six Penalty Challenge (-4 runs dispute)');
      setOverturnAction('cancel_six_penalty');
    } else if (type === 'boundary') {
      setReviewReason('Boundary 4 Line Check');
      setOverturnAction('add_four');
    } else if (type === 'extra') {
      setReviewReason('Extra Check (No-ball / Wide / Dead-ball)');
      setOverturnAction(undefined);
    } else {
      setReviewReason('General Umpire Consultation');
      setOverturnAction(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">DRS Third Umpire Review</h2>
              <p className="text-xs text-slate-400">
                Official Rooftop Cricket Review System (2 reviews per innings)
              </p>
            </div>
          </div>
        </div>

        {/* Both Teams Reviews Summary Pill */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            onClick={() => setReviewingTeamId(battingTeam.id)}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              isBattingTeam
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center space-x-1.5 truncate">
                <span>{battingTeam.logoEmoji}</span>
                <span className="truncate">{battingTeam.name}</span>
              </span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Batting
              </span>
            </div>
            <div className="flex items-baseline space-x-1 text-sm font-black">
              <span className={innings.battingTeamReviewsRemaining > 0 ? 'text-cyan-400' : 'text-red-400'}>
                {innings.battingTeamReviewsRemaining ?? 2} / 2
              </span>
              <span className="text-[10px] font-normal text-slate-400">Reviews Available</span>
            </div>
          </div>

          <div
            onClick={() => setReviewingTeamId(bowlingTeam.id)}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              !isBattingTeam
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center space-x-1.5 truncate">
                <span>{bowlingTeam.logoEmoji}</span>
                <span className="truncate">{bowlingTeam.name}</span>
              </span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Bowling
              </span>
            </div>
            <div className="flex items-baseline space-x-1 text-sm font-black">
              <span className={innings.bowlingTeamReviewsRemaining > 0 ? 'text-cyan-400' : 'text-red-400'}>
                {innings.bowlingTeamReviewsRemaining ?? 2} / 2
              </span>
              <span className="text-[10px] font-normal text-slate-400">Reviews Available</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Rule Reminder */}
          <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded-2xl text-xs text-cyan-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>DRS Retention Rule:</strong>
              <div className="text-cyan-300/90 mt-0.5 leading-relaxed">
                • <strong>Successful (Upheld):</strong> Decision overturned & <strong>Review is RETAINED</strong> (no reviews lost).
                <br />• <strong>Unsuccessful (Lost):</strong> Original decision confirmed & <strong>1 Review is DEDUCTED</strong>.
              </div>
            </div>
          </div>

          {/* Warning if no reviews left */}
          {!canCallReview && (
            <div className="bg-red-950/40 border border-red-800 p-3 rounded-2xl text-xs text-red-300 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>
                <strong>No Reviews Remaining:</strong>{' '}
                {isBattingTeam ? battingTeam.name : bowlingTeam.name} has exhausted all 2 reviews for this innings!
              </span>
            </div>
          )}

          {/* Select Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Challenge Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'wicket', label: 'Wicket / Out', emoji: '☝️' },
                { type: 'six_penalty', label: 'Six Penalty (-4r)', emoji: '⚠️' },
                { type: 'boundary', label: 'Boundary 4', emoji: '🏏' },
                { type: 'extra', label: 'Extras / NB / Wide', emoji: '↔️' },
                { type: 'other', label: 'Other Appeal', emoji: '🔍' }
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTargetTypeChange(item.type as any)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    targetType === item.type
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Overturn Action Selector if review is successful */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Desired Ruling if Overturned
            </label>
            <select
              value={overturnAction || ''}
              onChange={(e) => setOverturnAction(e.target.value as any || undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="cancel_wicket">
                Reverse Wicket ➔ Declared NOT OUT (Restore Batsman to Crease)
              </option>
              <option value="cancel_six_penalty">
                Cancel Six Penalty ➔ Restore +4 Runs to Team Score
              </option>
              <option value="add_four">Award Boundary ➔ Add 4 Runs to Score</option>
              <option value="">No Automatic State Change (Decision Overturned Only)</option>
            </select>
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Umpire / Camera Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UltraEdge shows flat line / Ball hit roof netting legally"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Past DRS History in this Innings */}
          {innings.drsHistory && innings.drsHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Innings DRS Audit Trail ({innings.drsHistory.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {innings.drsHistory.map((drs, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">
                        Over {drs.over}.{drs.ball} • {drs.isBattingTeam ? 'Batting' : 'Bowling'} Team:
                      </span>{' '}
                      <span className="text-slate-400">{drs.reason}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        drs.isSuccessful
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {drs.isSuccessful ? 'UPHELD (RETAINED)' : 'LOST (-1 REV)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Decision Buttons */}
        <div className="mt-5 pt-3 border-t border-slate-800 space-y-2.5">
          <button
            type="button"
            disabled={!canCallReview}
            onClick={() => handleDecision(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>REVIEW UPHELD — Decision Overturned (Review RETAINED)</span>
          </button>

          <button
            type="button"
            disabled={!canCallReview}
            onClick={() => handleDecision(false)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-700/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4 text-red-200" />
            <span>REVIEW LOST — Original Call Stands (1 Review DEDUCTED)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel / Close without Ruling
          </button>
        </div>
      </div>
    </div>
  );
};
