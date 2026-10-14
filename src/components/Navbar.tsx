import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  Activity,
  RotateCcw,
  Download,
  Upload,
  Menu,
  X,
  ChevronDown,
  Plus,
  Smartphone,
  Monitor,
  Info,
  Lock,
  Unlock,
  Eye,
  LogOut,
  QrCode,
  Globe
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import { TournamentModal } from './tournament/TournamentModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasLiveMatch: boolean;
  onRefreshData: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onOpenDeviceSizeModal: () => void;
  isAdmin?: boolean;
  onOpenAdminAuth: () => void;
  onAdminLogout?: () => void;
  onOpenMobileServer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasLiveMatch,
  onRefreshData,
  isMobilePreview,
  onToggleMobilePreview,
  onOpenDeviceSizeModal,
  isAdmin = false,
  onOpenAdminAuth,
  onAdminLogout,
  onOpenMobileServer
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [tournamentModalTab, setTournamentModalTab] = useState<'list' | 'create'>('list');

  const handleAdminLogout = () => {
    if (window.confirm('Log out of Admin Scorer mode and switch to Cricbuzz spectator view?')) {
      if (onAdminLogout) {
        onAdminLogout();
      } else {
        StorageService.logoutAdmin();
        onRefreshData();
      }
    }
  };

  const activeTournament = StorageService.getActiveTournament();

  const navItems = [
    { id: 'scorer', label: 'Live Scorer', icon: Activity, badge: hasLiveMatch ? 'LIVE' : undefined },
    { id: 'fixtures', label: 'Fixtures & Results', icon: Calendar },
    { id: 'standings', label: 'Points Table', icon: Trophy },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'players', label: 'Player Profiles', icon: UserCheck },
    { id: 'rules', label: 'Rules Guide', icon: BookOpen }
  ];

  const handleOpenTournamentsList = () => {
    setTournamentModalTab('list');
    setIsTournamentModalOpen(true);
  };

  const handleOpenCreateTournament = () => {
    if (!isAdmin) {
      onOpenAdminAuth();
      return;
    }
    setTournamentModalTab('create');
    setIsTournamentModalOpen(true);
  };

  const handleReset = () => {
    if (!isAdmin) {
      onOpenAdminAuth();
      return;
    }
    if (window.confirm('Reset all tournament, team, and match data to official Rooftop Cricket Tournament demo defaults?')) {
      StorageService.resetAll();
      onRefreshData();
      alert('Database successfully reset to official defaults.');
    }
  };

  const handleExport = () => {
    const data = StorageService.exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rooftop_cricket_tournament_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      onOpenAdminAuth();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (StorageService.importBackup(content)) {
        onRefreshData();
        alert('Tournament data restored successfully!');
      } else {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div
              onClick={() => setActiveTab('scorer')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">🏏</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    ROOFTOP CRICKET
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeTournament.oversPerInnings || 10} OVERS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden xl:block">
                  Single-Player Batting • Tournament Manager
                </p>
              </div>
            </div>

            {/* Active Tournament Selector Pill */}
            <div className="hidden sm:flex items-center space-x-1 ml-2">
              <button
                onClick={handleOpenTournamentsList}
                title="Switch Tournament"
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="max-w-[130px] truncate">{activeTournament.edition}</span>
                <ChevronDown className="w-3 h-3 text-amber-400" />
              </button>

              <button
                onClick={handleOpenCreateTournament}
                title="Create New Tournament"
                className="p-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="hidden sm:flex items-center space-x-2">
            {/* Admin / Spectator Status Badge & Auth Trigger */}
            {isAdmin ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={onOpenAdminAuth}
                  title="Admin Scorer Active - Click to view privileges"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Scorer</span>
                </button>
                <button
                  onClick={handleAdminLogout}
                  title="Log out of Admin Scorer mode"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <span className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cricbuzz Live</span>
                </span>
                <button
                  onClick={onOpenAdminAuth}
                  title="Login with Admin Password to score matches"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}

            {/* Mobile / Cloud Server Spectator Share Button */}
            {onOpenMobileServer && (
              <button
                onClick={onOpenMobileServer}
                title="Cloud & Mobile Server: Live Match Online Link & QR Code for Everyone"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Cloud & Mobile</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>
            )}

            {/* Toggle Mobile Phone Preview (for testing/presentation on PC) */}
            <button
              onClick={onToggleMobilePreview}
              title={isMobilePreview ? "Switch to Full Desktop View" : "Preview Mobile Phone App Frame (390px)"}
              className={`p-2 rounded-lg border text-xs flex items-center space-x-1.5 transition-all shadow-sm ${
                isMobilePreview
                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 font-bold'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isMobilePreview ? (
                <Monitor className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden xl:inline">{isMobilePreview ? 'Desktop View' : 'Mobile View'}</span>
            </button>

            {/* App Size & Specs Info */}
            <button
              onClick={onOpenDeviceSizeModal}
              title="Desktop & Mobile App Sizes & PWA Info"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">App Size</span>
            </button>

            <button
              onClick={handleExport}
              title="Backup Tournament Data"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Backup</span>
            </button>
            <label
              title="Restore Data"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Restore</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleReset}
              title="Reset to Demo Data"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-red-950/40 hover:border-red-800 text-slate-400 hover:text-red-300 text-xs flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            {isAdmin ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onOpenAdminAuth}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center space-x-1"
                  title="Admin Scorer Active"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-[10px] font-bold flex items-center space-x-1"
                  title="Log out of Admin Scorer mode"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminAuth}
                className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center space-x-1"
                title="Admin Login"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Login</span>
              </button>
            )}

            <button
              onClick={handleOpenTournamentsList}
              className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-1"
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="truncate max-w-[70px]">{activeTournament.edition}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {/* Mobile Tournament Actions */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Active Tournament</span>
              <span className="text-xs font-black text-amber-300">{activeTournament.name} - {activeTournament.edition}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenTournamentsList();
                }}
                className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
              >
                Switch
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenCreateTournament();
                }}
                className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {/* Mobile Admin / Spectator Status Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <div>
                <span className="text-xs font-black text-white block">
                  {isAdmin ? 'Admin Scorer Mode' : 'Cricbuzz Spectator Mode'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isAdmin ? 'Full score edit permissions' : 'Read-only live scores'}
                </span>
              </div>
            </div>
            {isAdmin ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminAuth();
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                  title="Admin info & settings"
                >
                  Info
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleAdminLogout();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-red-600/30 hover:bg-red-600/50 text-red-200 border-red-500/50 flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminAuth();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center space-x-1 transition-all"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          {/* Mobile Server / QR Code button */}
          {onOpenMobileServer && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMobileServer();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white"
            >
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Cloud & Mobile Server (QR Code)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                Live Broadcast
              </span>
            </button>
          )}

          {/* App Size & Specs info button */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenDeviceSizeModal();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <div className="flex items-center space-x-2.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Desktop & Mobile App Size Info</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
              132 KB Gzip
            </span>
          </button>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-around">
            <button
              onClick={handleExport}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>
            <label className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleReset}
              className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      </header>
      {/* Tournaments Manager Modal */}
      <TournamentModal
        isOpen={isTournamentModalOpen}
        onClose={() => setIsTournamentModalOpen(false)}
        onRefreshData={onRefreshData}
        initialTab={tournamentModalTab}
        isAdmin={isAdmin}
        onRequireAdmin={onOpenAdminAuth}
      />
    </>
  );
};
export default Navbar;
