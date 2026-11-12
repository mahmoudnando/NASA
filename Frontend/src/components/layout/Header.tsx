import React from 'react';
import { Bell, Globe, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { ActivePage } from '../../types/telemetry';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { unreadAlertsCount, isOnline, currentRole, currentUserName } = useTelemetry();
  const isAr = language === 'ar';

  return (
    <header className="w-full flex items-center justify-between py-1 px-1 relative z-20">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {t.header.title}
        </h1>
        <p className="text-xs md:text-sm text-slate-300/90 font-medium mt-1">
          {t.header.subtitle}
        </p>
      </div>

      {/* Controls & Profile */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="h-10 px-3.5 rounded-2xl glass-panel-subtle hover:border-cyan-400/50 text-xs font-bold text-cyan-200 hover:text-white flex items-center gap-1.5 transition-all duration-300"
        >
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>{t.header.switchLang}</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setActivePage('alerts')}
          title={t.nav.alerts}
          className={`relative w-10 h-10 md:w-11 md:h-11 rounded-full glass-panel flex items-center justify-center transition-all duration-300 ${
            activePage === 'alerts'
              ? 'border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,210,255,0.4)]'
              : 'text-slate-100 hover:text-white'
          }`}
        >
          <Bell className="w-5 h-5 stroke-[2.1]" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-950 animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-white/15 hidden sm:block" />

        {/* Active User Profile Badge (Click to Switch Account or Logout) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActivePage('login')}
            title={isAr ? 'إدارة الحساب أو تبديل المستخدم' : 'Account & Session Settings'}
            className="flex items-center gap-3 py-1 px-1.5 rounded-2xl hover:bg-white/5 transition-all text-start"
          >
            <div className="hidden sm:block text-end">
              <div className="text-sm font-bold text-white leading-tight">
                {t.header.welcome} {currentUserName || (isAr ? 'مورغان فانس' : 'Morgan Vance')}
              </div>
              <div className="text-xs text-cyan-300/90 font-semibold mt-0.5">
                {currentRole === 'Monitor' ? t.header.monitorRole : t.header.role}
              </div>
            </div>

            <div className="relative">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border-2 border-cyan-300/60 shadow-[0_0_16px_rgba(56,189,248,0.3)] bg-slate-900 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full object-cover"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="50" cy="50" r="48" fill="#091532" />
                  <circle
                    cx="50"
                    cy="46"
                    r="30"
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="27"
                    y="31"
                    width="46"
                    height="27"
                    rx="13.5"
                    fill="#0f2942"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <ellipse cx="44" cy="40" rx="13" ry="7" fill="#38bdf8" opacity="0.45" />
                  <path
                    d="M20 86 C20 67 80 67 80 86"
                    fill="#e2e8f0"
                    stroke="#64748b"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <span
                title={isOnline ? t.header.onlineStatus : t.header.offlineStatus}
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
                }`}
              />
            </div>
          </button>

          {/* Subtle Logout / Switch Account Icon Button */}
          <button
            onClick={() => setActivePage('login')}
            title={isAr ? 'تبديل الحساب / تسجيل الخروج' : 'Switch Account / Sign Out'}
            className="w-9 h-9 rounded-xl glass-panel-subtle hover:border-rose-400/40 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
