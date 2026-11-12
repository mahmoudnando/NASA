import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBanner } from './components/dashboard/StatusBanner';
import { ClinicalScenariosConsole } from './components/dashboard/ClinicalScenariosConsole';
import { VitalsGrid } from './components/dashboard/VitalsGrid';
import { HeartRateChart } from './components/dashboard/HeartRateChart';
import { QuickActions } from './components/dashboard/QuickActions';
import { MonitorDashboardPage } from './components/views/MonitorDashboardPage';
import { VitalsRecordingPage } from './components/views/VitalsRecordingPage';
import { VitalGuidesRangesPage } from './components/views/VitalGuidesRangesPage';
import { SleepTrackingPage } from './components/views/SleepTrackingPage';
import { MoodWellnessPage } from './components/views/MoodWellnessPage';
import { RecommendationsPage } from './components/views/RecommendationsPage';
import { SymptomGuidancePage } from './components/views/SymptomGuidancePage';
import { AlertsEmergencyPage } from './components/views/AlertsEmergencyPage';
import { GroundOrbitChatPage } from './components/views/GroundOrbitChatPage';
import { CrewMonitorPage } from './components/views/CrewMonitorPage';
import { SpaceMissionsPage } from './components/views/SpaceMissionsPage';
import { MedicalDossierSyncPage } from './components/views/MedicalDossierSyncPage';
import { LoginPage } from './components/views/LoginPage';
import { useLanguage } from './context/LanguageContext';
import { useTelemetry } from './context/TelemetryContext';
import { ActivePage } from './types/telemetry';

const ASTRONAUT_ONLY_PAGES: ActivePage[] = [
  'dashboard',
  'vitals',
  'sleep',
  'mood',
  'reports-sync',
];

const MONITOR_ONLY_PAGES: ActivePage[] = ['monitor-dashboard', 'crew', 'missions'];

export const App: React.FC = () => {
  const { isRtl } = useLanguage();
  const { currentRole } = useTelemetry();
  const [activePage, setActivePage] = useState<ActivePage>(
    currentRole === 'Monitor' ? 'monitor-dashboard' : 'dashboard'
  );

  // Enforce Role-Based Access Control (RBAC) routing when user role changes
  useEffect(() => {
    if (currentRole === 'Monitor' && ASTRONAUT_ONLY_PAGES.includes(activePage)) {
      setActivePage('monitor-dashboard');
    } else if (currentRole === 'Astronaut' && MONITOR_ONLY_PAGES.includes(activePage)) {
      setActivePage('dashboard');
    }
  }, [currentRole, activePage]);

  return (
    <div
      className="relative min-h-screen w-full bg-[#020611] text-slate-100 flex items-start p-3 md:p-5 lg:p-6 gap-4 md:gap-5 selection:bg-cyan-500/30 selection:text-cyan-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Fixed Cosmic Background with Astronaut Gazing Over Earth
          - English (LTR): Default orientation (scaleX(1)) -> Astronaut on the LEFT, cards shifted RIGHT
          - Arabic (RTL): Flipped horizontally (scaleX(-1)) -> Astronaut on the RIGHT, cards shifted LEFT */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-left-top md:bg-center bg-no-repeat transition-transform duration-700 pointer-events-none"
        style={{
          backgroundImage: `url('/images/astronaut-bg.png')`,
          filter: 'brightness(0.96) contrast(1.08)',
          transform: isRtl ? 'scaleX(-1)' : 'scaleX(1)',
        }}
      />

      {/* Subtle Ambient Vignette */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#03091c]/30 via-transparent to-[#020611]/65 pointer-events-none" />

      {/* Directional Feathered Blur Layer:
          Keeps the Astronaut side 100% sharp & untouched while applying a soft, eye-soothing
          crystalline blur + subtle deep-space tint behind the cards and typography zone */}
      <div
        className="fixed inset-0 z-0 backdrop-blur-[6px] bg-[#030a1c]/35 pointer-events-none transition-all duration-700"
        style={{
          WebkitMaskImage: isRtl
            ? 'linear-gradient(to left, transparent 0%, transparent 18%, rgba(0,0,0,0.45) 29%, rgba(0,0,0,0.95) 42%, black 100%)'
            : 'linear-gradient(to right, transparent 0%, transparent 18%, rgba(0,0,0,0.45) 29%, rgba(0,0,0,0.95) 42%, black 100%)',
          maskImage: isRtl
            ? 'linear-gradient(to left, transparent 0%, transparent 18%, rgba(0,0,0,0.45) 29%, rgba(0,0,0,0.95) 42%, black 100%)'
            : 'linear-gradient(to right, transparent 0%, transparent 18%, rgba(0,0,0,0.45) 29%, rgba(0,0,0,0.95) 42%, black 100%)',
        }}
      />

      {/* Fixed Full-Viewport Role-Filtered Vertical Navigation Dock */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Console Viewport */}
      <main className="flex-1 min-w-0 flex flex-col gap-5 max-w-[1460px] mx-auto w-full relative z-10">
        {/* Top Header */}
        <Header activePage={activePage} setActivePage={setActivePage} />

        {/* Unified Aligned Content Container
            - English (!isRtl): Pushed RIGHT (lg:ml-auto lg:mr-0) so Astronaut on LEFT is visible
            - Arabic (isRtl): Pushed LEFT (lg:mr-auto lg:ml-0) so Flipped Astronaut on RIGHT is visible */}
        <div
          className={`w-full lg:w-[75%] xl:w-[73%] flex flex-col gap-4 md:gap-5 transition-all duration-500 ${
            isRtl ? 'lg:mr-auto lg:ml-0' : 'lg:ml-auto lg:mr-0'
          }`}
        >
          {/* Astronaut-Only Pages */}
          {currentRole === 'Astronaut' && activePage === 'dashboard' && (
            <div className="w-full flex flex-col gap-4 md:gap-5 animate-in fade-in duration-300">
              <StatusBanner />
              <ClinicalScenariosConsole onNavigate={setActivePage} />
              <VitalsGrid onNavigateToVitals={() => setActivePage('vitals')} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
                <div className="lg:col-span-8 flex flex-col">
                  <HeartRateChart />
                </div>
                <div className="lg:col-span-4 flex flex-col">
                  <QuickActions
                    onNavigateRecord={() => setActivePage('vitals')}
                    onNavigateReport={() => setActivePage('reports-sync')}
                  />
                </div>
              </div>
            </div>
          )}

          {currentRole === 'Astronaut' && activePage === 'vitals' && <VitalsRecordingPage />}

          {currentRole === 'Astronaut' && activePage === 'sleep' && <SleepTrackingPage />}

          {currentRole === 'Astronaut' && activePage === 'mood' && <MoodWellnessPage />}

          {currentRole === 'Astronaut' && activePage === 'reports-sync' && (
            <MedicalDossierSyncPage />
          )}

          {/* Flight Surgeon (Monitor-Only) Pages */}
          {currentRole === 'Monitor' && activePage === 'monitor-dashboard' && (
            <MonitorDashboardPage onNavigate={setActivePage} />
          )}

          {currentRole === 'Monitor' && activePage === 'crew' && <CrewMonitorPage />}

          {currentRole === 'Monitor' && activePage === 'missions' && <SpaceMissionsPage />}

          {/* Shared Authenticated Pages (Adapted to Current Role) */}
          {activePage === 'vital-guides' && <VitalGuidesRangesPage />}

          {activePage === 'recommendations' && <RecommendationsPage />}

          {activePage === 'symptoms' && <SymptomGuidancePage />}

          {activePage === 'alerts' && <AlertsEmergencyPage />}

          {activePage === 'chat' && <GroundOrbitChatPage />}

          {activePage === 'login' && <LoginPage onSuccessNavigate={setActivePage} />}
        </div>
      </main>
    </div>
  );
};
