import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle, X, CheckCircle2, LogOut } from 'lucide-react';
import { StorageService } from '../../utils/storage';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthStateChanged: (isAdmin: boolean) => void;
  actionDescription?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthStateChanged,
  actionDescription
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = StorageService.isAdmin();

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter the admin password.');
      return;
    }

    const success = StorageService.loginAsAdmin(password.trim());
    if (success) {
      setErrorMsg(null);
      setSuccessMsg('Admin access granted! Scorer controls are now unlocked.');
      onAuthStateChanged(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg('Incorrect admin password. Please try again.');
    }
  };

  const handleLogout = () => {
    StorageService.logoutAdmin();
    onAuthStateChanged(false);
    setSuccessMsg('Logged out. Switched to Cricbuzz spectator mode.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative my-auto animate-fade-in"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isAdmin ? (
          /* Already Admin View */
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Admin Scorer Mode</h2>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                ● You are currently authenticated as Official Scorer
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Full Editing Privileges Active:</span>
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px] pl-1">
                <li>Record runs, wickets, extras, penalties, & dead balls</li>
                <li>Conduct official toss and choose match teams</li>
                <li>Select batsmen, bowlers, DRS reviews & substitutions</li>
                <li>Manage tournaments, fixtures, teams, and player profiles</li>
              </ul>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Keep Admin Active
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-red-600/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Admin</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white">Admin Scorer Access</h2>
              <p className="text-xs text-slate-400 mt-1">
                {actionDescription || 'Only official scorers can update runs, balls, and match scores.'}
              </p>
            </div>

            {/* Spectator Mode Notice (Cricbuzz Style) */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2.5">
              <span className="text-base">📺</span>
              <div>
                <span className="font-bold text-slate-300 block">Cricbuzz-Style Live Spectator Mode:</span>
                Spectators can watch live ball-by-ball scores, over feeds, and match commentary in real time. Admin password is required to score deliveries.
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Passcode
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Scorer Controls</span>
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                Continue Watching in Live Spectator Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
