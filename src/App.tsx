import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveScorer } from './components/scoring/LiveScorer';
import { FixturesView } from './components/fixtures/FixturesView';
import { PointsTable } from './components/standings/PointsTable';
import { TeamsView } from './components/teams/TeamsView';
import { PlayerProfilesView } from './components/players/PlayerProfilesView';
import { RulesGuideView } from './components/rules/RulesGuideView';
import { FullScorecard } from './components/scorecard/FullScorecard';
import { DeviceSizeModal } from './components/common/DeviceSizeModal';
import { AdminAuthModal } from './components/common/AdminAuthModal';
import { MobileServerModal } from './components/common/MobileServerModal';
import { StorageService } from './utils/storage';
import { SyncService } from './utils/syncService';
import { Activity, Calendar, Trophy, Users, UserCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('scorer');
  const [scorecardMatchId, setScorecardMatchId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(StorageService.isAdmin());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminActionDesc, setAdminActionDesc] = useState<string>('');

  // Mobile Server & Spectator Wi-Fi QR Code Modal
  const [isMobileServerOpen, setIsMobileServerOpen] = useState<boolean>(false);

  // Device view modes
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);

  // Initialize background live sync for spectators on mobile devices
  useEffect(() => {
    SyncService.init();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setDataVersion((v) => v + 1);
      }, 50);
    };

    window.addEventListener('cricket-sync', handleSync);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('cricket-sync', handleSync);
    };
  }, []);

  const handleRefreshData = () => {
    setIsAdmin(StorageService.isAdmin());
    setDataVersion((v) => v + 1);
  };

  const handleRequireAdmin = (actionDesc?: string) => {
    if (StorageService.isAdmin()) {
      setIsAdmin(true);
      return true;
    }
    setAdminActionDesc(actionDesc || 'perform scorer operations');
    setIsAdminModalOpen(true);
    return false;
  };

  const handleAuthStateChanged = (adminStatus: boolean) => {
    setIsAdmin(adminStatus);
    handleRefreshData();
  };

  const handleAdminLogout = () => {
    StorageService.logoutAdmin();
    setIsAdmin(false);
    handleRefreshData();
  };

  // Check if there is an active live match
  const matches = StorageService.getMatches();
  const hasLiveMatch = matches.some(
    (m) =>
      m.status === 'innings1' ||
      m.status === 'innings2' ||
      m.status === 'innings_break' ||
      m.status === 'toss'
  );

  const handleOpenScorecard = (matchId: string) => {
    setScorecardMatchId(matchId);
    setActiveTab('scorecard');
  };

  const handleStartScoring = (matchId: string) => {
    StorageService.setActiveMatchId(matchId);
    setActiveTab('scorer');
    handleRefreshData();
  };

  const handleOpenPlayerProfile = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab('players');
  };

  const renderMainContent = () => (
    <>
      {activeTab === 'scorer' && (
        <LiveScorer
          dataVersion={dataVersion}
          onOpenScorecard={handleOpenScorecard}
          onRefreshData={handleRefreshData}
          isAdmin={isAdmin}
          onRequireAdmin={handleRequireAdmin}
          onAdminLogout={handleAdminLogout}
          onOpenMobileServer={() => setIsMobileServerOpen(true)}
        />
      )}

      {activeTab === 'fixtures' && (
        <FixturesView
          dataVersion={dataVersion}
          onStartScoring={handleStartScoring}
          onOpenScorecard={handleOpenScorecard}
          onRefreshData={handleRefreshData}
          isAdmin={isAdmin}
          onRequireAdmin={handleRequireAdmin}
          onAdminLogout={handleAdminLogout}
        />
      )}

      {activeTab === 'standings' && (
        <PointsTable
          dataVersion={dataVersion}
          onRefreshData={handleRefreshData}
          isAdmin={isAdmin}
          onRequireAdmin={handleRequireAdmin}
        />
      )}

      {activeTab === 'teams' && (
        <TeamsView
          dataVersion={dataVersion}
          onOpenPlayerProfile={handleOpenPlayerProfile}
          onRefreshData={handleRefreshData}
          isAdmin={isAdmin}
          onRequireAdmin={handleRequireAdmin}
        />
      )}

      {activeTab === 'players' && (
        <PlayerProfilesView
          dataVersion={dataVersion}
          initialSelectedPlayerId={selectedPlayerId}
          onRefreshData={handleRefreshData}
          isAdmin={isAdmin}
          onRequireAdmin={handleRequireAdmin}
          onAdminLogout={handleAdminLogout}
        />
      )}

      {activeTab === 'rules' && <RulesGuideView />}

      {activeTab === 'scorecard' && scorecardMatchId && (
        <FullScorecard
          key={`scorecard_${scorecardMatchId}`}
          matchId={scorecardMatchId}
          dataVersion={dataVersion}
          onBack={() => setActiveTab('scorer')}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-20 lg:pb-6 overflow-x-hidden w-full">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'scorecard') setScorecardMatchId(null);
          setActiveTab(tab);
        }}
        hasLiveMatch={hasLiveMatch}
        onRefreshData={handleRefreshData}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        onOpenDeviceSizeModal={() => setIsDeviceModalOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => handleRequireAdmin('manage scorer access')}
        onAdminLogout={handleAdminLogout}
        onOpenMobileServer={() => setIsMobileServerOpen(true)}
      />

      {/* Main Content: Full Responsive View or Mobile Simulator Frame */}
      {isMobilePreview ? (
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 w-full">
          {/* Header banner explaining mobile preview */}
          <div className="mb-3 flex items-center justify-between w-full max-w-[420px] px-2 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5 text-purple-300 font-bold">
              <span>📱</span>
              <span>Mobile Phone Simulator (390px × 844px)</span>
            </span>
            <button
              onClick={() => setIsMobilePreview(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Exit to Desktop
            </button>
          </div>

          {/* Smartphone Frame Simulator */}
          <div className="w-full max-w-[410px] h-[calc(100vh-140px)] max-h-[820px] min-h-[580px] bg-slate-950 border-[10px] border-slate-800 rounded-[50px] shadow-2xl shadow-emerald-950/40 relative flex flex-col overflow-hidden ring-1 ring-slate-700">
            {/* Phone Top Notch / Dynamic Island */}
            <div className="h-6 bg-slate-900 w-full flex items-center justify-between px-6 shrink-0 text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <span>9:41</span>
              <div className="w-20 h-3 bg-black rounded-full mx-auto" />
              <span>5G 🔋</span>
            </div>

            {/* Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto pb-16 pt-2">
              {renderMainContent()}
            </div>

            {/* Pinned Mobile Navigation inside the frame */}
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
              {[
                { id: 'scorer', label: 'Scorer', icon: Activity },
                { id: 'fixtures', label: 'Fixtures', icon: Calendar },
                { id: 'standings', label: 'Points', icon: Trophy },
                { id: 'teams', label: 'Teams', icon: Users },
                { id: 'players', label: 'Players', icon: UserCheck }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id !== 'scorecard') setScorecardMatchId(null);
                      setActiveTab(item.id);
                    }}
                    className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                      isActive
                        ? 'text-emerald-400 font-bold scale-105'
                        : 'text-slate-400 hover:text-slate-200 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Home indicator bar */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      ) : (
        <>
          <main className="flex-1 w-full max-w-full overflow-x-hidden">{renderMainContent()}</main>

          {/* Mobile Bottom Navigation Bar (PWA / Real Smartphone) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
            {[
              { id: 'scorer', label: 'Scorer', icon: Activity },
              { id: 'fixtures', label: 'Fixtures', icon: Calendar },
              { id: 'standings', label: 'Points', icon: Trophy },
              { id: 'teams', label: 'Teams', icon: Users },
              { id: 'players', label: 'Players', icon: UserCheck }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id !== 'scorecard') setScorecardMatchId(null);
                    setActiveTab(item.id);
                  }}
                  className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-emerald-400 font-bold scale-105'
                      : 'text-slate-400 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Device & App Size Specifications Modal */}
      <DeviceSizeModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
      />

      {/* Admin Authentication & Cricbuzz Spectator Mode Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAuthStateChanged={handleAuthStateChanged}
        actionDescription={adminActionDesc}
      />

      {/* Mobile Server & Wi-Fi Live Sync Modal */}
      <MobileServerModal
        isOpen={isMobileServerOpen}
        onClose={() => setIsMobileServerOpen(false)}
      />
    </div>
  );
}

export default App;
