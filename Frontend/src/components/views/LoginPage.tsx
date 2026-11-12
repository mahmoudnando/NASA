import React, { useState } from 'react';
import {
  KeyRound,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { api } from '../../services/api';
import { ActivePage } from '../../types/telemetry';

interface LoginPageProps {
  onSuccessNavigate?: (page: ActivePage) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessNavigate }) => {
  const { language } = useLanguage();
  const { activeAccount, switchAccount, currentRole, currentUserName } = useTelemetry();
  const isAr = language === 'ar';

  const [username, setUsername] = useState('astro.vance');
  const [password, setPassword] = useState('Nasa@2026!');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const seededAccounts = [
    {
      username: 'astro.vance',
      fullNameAr: 'مورغان فانس',
      fullNameEn: 'Morgan Vance',
      code: 'AST-001',
      role: 'Astronaut' as const,
      roleLabelAr: 'رائد فضاء — قائد المهمة',
      roleLabelEn: 'Astronaut — Mission Commander',
      email: 'morgan.vance@mission.space',
      targetPage: 'dashboard' as ActivePage,
    },
    {
      username: 'astro.lee',
      fullNameAr: 'جوردان لي',
      fullNameEn: 'Jordan Lee',
      code: 'AST-002',
      role: 'Astronaut' as const,
      roleLabelAr: 'رائد فضاء — مهندس طيران',
      roleLabelEn: 'Astronaut — Flight Engineer',
      email: 'jordan.lee@mission.space',
      targetPage: 'dashboard' as ActivePage,
    },
    {
      username: 'astro.quinn',
      fullNameAr: 'تايلور كوين',
      fullNameEn: 'Taylor Quinn',
      code: 'AST-003',
      role: 'Astronaut' as const,
      roleLabelAr: 'رائد فضاء — أخصائي حمولة',
      roleLabelEn: 'Astronaut — Payload Specialist',
      email: 'taylor.quinn@mission.space',
      targetPage: 'dashboard' as ActivePage,
    },
    {
      username: 'monitor.rivera',
      fullNameAr: 'د. كيسي ريفيرا',
      fullNameEn: 'Dr. Casey Rivera',
      code: 'MED-CONTROL',
      role: 'Monitor' as const,
      roleLabelAr: 'طبيب الرحلة — المراقب الطبي الأرضي',
      roleLabelEn: 'Flight Surgeon — Ground Medical Monitor',
      email: 'casey.rivera@missioncontrol.space',
      targetPage: 'monitor-dashboard' as ActivePage,
    },
  ];

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      const matchedSeed = seededAccounts.find(
        (a) =>
          a.username.toLowerCase() === username.trim().toLowerCase() ||
          a.email.toLowerCase() === username.trim().toLowerCase()
      );

      if (matchedSeed) {
        await switchAccount(
          matchedSeed.username as
            | 'astro.vance'
            | 'astro.lee'
            | 'astro.quinn'
            | 'monitor.rivera'
        );
        setStatusMsg({
          type: 'success',
          text: isAr
            ? `تم تسجيل الدخول بنجاح بحساب: ${matchedSeed.fullNameAr}`
            : `Signed in successfully as ${matchedSeed.fullNameEn}`,
        });
        setLoading(false);
        if (onSuccessNavigate) {
          setTimeout(() => onSuccessNavigate(matchedSeed.targetPage), 600);
        }
        return;
      }

      const res = await api.login(username.trim(), password);
      if (res?.token) {
        setStatusMsg({
          type: 'success',
          text: isAr
            ? `تم تسجيل الدخول بنجاح (${res.fullName || username})`
            : `Authenticated as ${res.fullName || username}`,
        });
        if (onSuccessNavigate) {
          setTimeout(
            () =>
              onSuccessNavigate(res.role === 'Monitor' ? 'monitor-dashboard' : 'dashboard'),
            600
          );
        }
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: isAr
          ? 'بيانات الدخول غير صحيحة. يرجى اختيار أحد الحسابات المعتمدة أو التأكد من كلمة المرور.'
          : 'Invalid credentials. Please select one of the authorized accounts or verify password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (acc: (typeof seededAccounts)[number]) => {
    setUsername(acc.username);
    setPassword('Nasa@2026!');
    setLoading(true);
    await switchAccount(acc.username);
    setLoading(false);
    setStatusMsg({
      type: 'success',
      text: isAr
        ? `تم التبديل إلى حساب: ${acc.fullNameAr} (${acc.roleLabelAr})`
        : `Switched active session to ${acc.fullNameEn} (${acc.roleLabelEn})`,
    });
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network error on logout
    }
    setStatusMsg({
      type: 'success',
      text: isAr
        ? 'تم إنهاء الجلسة الحالية، يمكنك اختيار حساب جديد للدخول'
        : 'Session logged out. Select an account below to sign in.',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-fade-in">
      {/* Left Column: Direct Credentials Sign-In Form (/api/auth/login & /api/auth/logout) */}
      <div className="lg:col-span-5 glass-panel rounded-[22px] p-5 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'بوابة تسجيل الدخول الموحدة' : 'Mission Authentication Portal'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isAr
                    ? 'دخول رواد الفضاء وفريق الرقابة الطبية الأرضية'
                    : 'Sign in as Astronaut Crew or Ground Flight Surgeon'}
                </p>
              </div>
            </div>
          </div>

          {/* Current Active Session Banner (/api/auth/me) */}
          <div className="mb-4 p-3.5 rounded-xl bg-slate-900/65 border border-cyan-400/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'الجلسة النشطة حالياً' : 'Active Session'}
                </p>
                <p className="text-xs font-bold text-white">
                  {currentUserName} •{' '}
                  <span className="text-cyan-300">
                    {currentRole === 'Monitor'
                      ? isAr
                        ? 'طبيب الرحلة (Monitor)'
                        : 'Flight Surgeon (Monitor)'
                      : isAr
                      ? 'رائد فضاء (Astronaut)'
                      : 'Astronaut'}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px] font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAr ? 'خروج' : 'Logout'}</span>
            </button>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="astro.vance | monitor.rivera"
                className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {loading
                  ? isAr
                    ? 'جاري التحقق من الهوية...'
                    : 'Authenticating...'
                  : isAr
                  ? 'تسجيل الدخول إلى النظام'
                  : 'Sign In to Console'}
              </span>
            </button>
          </form>
        </div>

        {onSuccessNavigate && (
          <button
            type="button"
            onClick={() =>
              onSuccessNavigate(currentRole === 'Monitor' ? 'monitor-dashboard' : 'dashboard')
            }
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5"
          >
            <span>
              {currentRole === 'Monitor'
                ? isAr
                  ? 'الانتقال إلى لوحة تحكم طبيب الرحلة'
                  : 'Open Flight Surgeon Dashboard'
                : isAr
                ? 'الانتقال إلى لوحة تحكم رائد الفضاء'
                : 'Open Astronaut Dashboard'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Column: The 4 Official Seeded Accounts (3 Astronauts + 1 Ground Medical Monitor) */}
      <div className="lg:col-span-7 glass-panel rounded-[22px] p-5 flex flex-col justify-between gap-4">
        <div>
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">
              {isAr
                ? 'الحسابات المعتمدة في النظام (رواد الفضاء + المراقب الطبي)'
                : 'Authorized System Accounts (3 Astronauts + 1 Flight Surgeon)'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? 'انقر على أي حساب للتبديل الفوري وتجربة صلاحيات رائد الفضاء (Astronaut) أو طبيب الرحلة (Monitor)'
                : 'Click any account card to switch sessions and experience Astronaut vs. Ground Monitor dashboards'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {seededAccounts.map((acc) => {
              const isSelected = activeAccount === acc.username;
              const isMonitor = acc.role === 'Monitor';
              return (
                <div
                  key={acc.username}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? isMonitor
                        ? 'bg-cyan-500/20 border-cyan-400/60 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                        : 'bg-blue-500/20 border-blue-400/60 shadow-[0_0_24px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-900/55 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                            isMonitor
                              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                              : 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                          }`}
                        >
                          {isMonitor ? (
                            <Stethoscope className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {isAr ? acc.fullNameAr : acc.fullNameEn}
                          </h4>
                          <p className="text-[11px] text-slate-400" dir="ltr">
                            @{acc.username}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isMonitor
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                            : 'bg-blue-500/20 text-blue-200 border-blue-400/40'
                        }`}
                      >
                        {acc.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-semibold">
                      {isAr ? acc.roleLabelAr : acc.roleLabelEn}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5" dir="ltr">
                      {acc.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleQuickSelect(acc)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      {isSelected
                        ? isAr
                          ? 'الحساب النشط حالياً ✓'
                          : 'Active Account ✓'
                        : isAr
                        ? 'دخول بهذا الحساب'
                        : 'Sign In as User'}
                    </button>

                    {onSuccessNavigate && (
                      <button
                        type="button"
                        onClick={async () => {
                          await handleQuickSelect(acc);
                          onSuccessNavigate(acc.targetPage);
                        }}
                        className="py-1.5 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold"
                        title={isAr ? 'فتح لوحة التحكم الخاصة به' : 'Open Role Dashboard'}
                      >
                        {isAr ? 'لوحته ←' : 'Dashboard →'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

