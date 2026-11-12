import React, { useState } from 'react';
import {
  FileText,
  Printer,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  User,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { VitalCode } from '../../types/telemetry';

export const MedicalDossierSyncPage: React.FC = () => {
  const { language } = useLanguage();
  const {
    vitals,
    sleepRecords,
    moodEntries,
    offlineQueue,
    isOnline,
    toggleOnlineStatus,
    executeOfflineSyncBatch,
    activeAccount,
    switchAccount,
    currentUserName,
    astronautProfile,
  } = useTelemetry();
  const isAr = language === 'ar';

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const vitalOrder: VitalCode[] = ['HR', 'SPO2', 'BP', 'TEMP', 'GLUCOSE', 'RESP'];
  const latestSleep = sleepRecords[0];
  const latestMood = moodEntries[0];

  const handleSync = async () => {
    setSyncing(true);
    const res = await executeOfflineSyncBatch();
    setSyncing(false);
    setSyncMsg(
      isAr
        ? `تمت مزامنة ${res.synced} قراءة بنجاح`
        : `Successfully synced ${res.synced} records`
    );
    setTimeout(() => setSyncMsg(''), 3500);
  };

  const accountsList = [
    {
      username: 'astro.vance',
      nameAr: 'مورغان فانس (AST-001)',
      nameEn: 'Morgan Vance (AST-001)',
      isMonitor: false,
    },
    {
      username: 'astro.lee',
      nameAr: 'جوردان لي (AST-002)',
      nameEn: 'Jordan Lee (AST-002)',
      isMonitor: false,
    },
    {
      username: 'astro.quinn',
      nameAr: 'تايلور كوين (AST-003)',
      nameEn: 'Taylor Quinn (AST-003)',
      isMonitor: false,
    },
    {
      username: 'monitor.rivera',
      nameAr: 'د. كيسي ريفيرا (طبيب الرحلة)',
      nameEn: 'Dr. Casey Rivera (Flight Surgeon)',
      isMonitor: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-fade-in">
      {/* Comprehensive Medical Report & Biometric Dossier */}
      <div className="lg:col-span-7 glass-panel rounded-[22px] p-5 flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'التقرير الطبي والملف الشخصي' : 'Comprehensive Medical Dossier'}
                </h3>
                <p className="text-xs text-slate-300">
                  {currentUserName || astronautProfile.fullName} •{' '}
                  {astronautProfile.missionName || (isAr ? 'مهمة أريس 3' : 'Ares III Expedition')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>
          </div>

          {/* Personal Biometric Profile Strip (/api/astronauts/me) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <div className="p-2.5 rounded-xl bg-slate-900/55 border border-white/10 flex items-center gap-2.5">
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400">{isAr ? 'الرمز' : 'Code'}</p>
                <p className="text-xs font-bold text-white">{astronautProfile.astronautCode}</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/55 border border-white/10">
              <p className="text-[11px] text-slate-400">{isAr ? 'فصيلة الدم' : 'Blood Type'}</p>
              <p className="text-xs font-bold text-rose-300" dir="ltr">
                {astronautProfile.bloodType}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/55 border border-white/10">
              <p className="text-[11px] text-slate-400">{isAr ? 'الطول والوزن' : 'Height / Weight'}</p>
              <p className="text-xs font-bold text-white" dir="ltr">
                {astronautProfile.heightCm} cm / {astronautProfile.weightKg} kg
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/55 border border-white/10">
              <p className="text-[11px] text-slate-400">{isAr ? 'تاريخ الميلاد' : 'Birth Date'}</p>
              <p className="text-xs font-bold text-white" dir="ltr">
                {astronautProfile.dateOfBirth}
              </p>
            </div>
          </div>

          {/* 6 Vital Signs Summary Grid */}
          <h4 className="text-xs font-bold text-slate-300 mb-2.5">
            {isAr ? 'ملخص المؤشرات الحيوية الستة' : '6 Vital Signs Summary'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
            {vitalOrder.map((code) => {
              const v = vitals[code];
              return (
                <div
                  key={code}
                  className="p-3 rounded-xl bg-slate-900/55 border border-white/10"
                >
                  <p className="text-xs text-slate-300 font-semibold mb-1">
                    {isAr ? v.titleAr : v.titleEn}
                  </p>
                  <p className="text-lg font-extrabold text-white" dir="ltr">
                    {v.secondaryValue ? `${v.value}/${v.secondaryValue}` : v.value}{' '}
                    <span className="text-xs font-normal text-slate-400">{v.unitEn}</span>
                  </p>
                  <p className="text-[11px] text-emerald-300 mt-0.5" dir="ltr">
                    {v.rangeText}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Sleep & Mood Summary */}
          <h4 className="text-xs font-bold text-slate-300 mb-2.5">
            {isAr ? 'ملخص النوم والحالة النفسية' : 'Sleep & Mental Wellness Summary'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl bg-slate-900/55 border border-white/10">
              <p className="text-xs text-slate-300 font-semibold mb-1">
                {isAr ? 'آخر سجل للنوم' : 'Latest Sleep Record'}
              </p>
              <p className="text-base font-extrabold text-white">
                {latestSleep ? `${latestSleep.durationHours} ${isAr ? 'ساعات' : 'hrs'}` : '7.75h'} •{' '}
                <span className="text-cyan-300">
                  {latestSleep ? `${latestSleep.sleepEfficiencyPercentage}%` : '95%'}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {latestSleep?.notes || (isAr ? 'نوم عميق ومنتظم' : 'Restful sleep cycle')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/55 border border-white/10">
              <p className="text-xs text-slate-300 font-semibold mb-1">
                {isAr ? 'الحالة النفسية والتركيز' : 'Mood & Focus'}
              </p>
              <p className="text-base font-extrabold text-emerald-300">
                {latestMood ? `${latestMood.moodScore} / 10` : '9 / 10'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {latestMood?.notes || (isAr ? 'استقرار نفسي وتركيز عالٍ' : 'High focus and calm')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Sync & Account Switcher */}
      <div className="lg:col-span-5 glass-panel rounded-[22px] p-5 flex flex-col justify-between gap-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                {isOnline ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-300" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isAr ? 'إدارة الحساب والمزامنة' : 'Account & Data Sync'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isOnline
                    ? isAr
                      ? 'متصل بمركز المتابعة الطبية'
                      : 'Connected to Medical Control Center'
                    : isAr
                    ? 'وضع الحفظ المؤقت بدون اتصال'
                    : 'Offline local storage mode'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleOnlineStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isOnline
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                  : 'bg-amber-500/15 border-amber-400/30 text-amber-200'
              }`}
            >
              {isOnline ? (isAr ? 'متصل الآن' : 'Online') : isAr ? 'غير متصل' : 'Offline'}
            </button>
          </div>

          {/* 4 Real Seeded Backend Accounts Switcher (/api/auth/login) */}
          <div className="p-3.5 rounded-xl bg-slate-900/55 border border-white/10">
            <p className="text-xs font-bold text-slate-300 mb-2">
              {isAr ? 'تبديل الحساب النشط' : 'Switch Active Account'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accountsList.map((acc) => {
                const isSelected = activeAccount === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => switchAccount(acc.username)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all text-start ${
                      isSelected
                        ? acc.isMonitor
                          ? 'bg-cyan-600/30 border-cyan-400/50 text-white'
                          : 'bg-blue-600/30 border-blue-400/50 text-white'
                        : 'bg-slate-950/50 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {acc.isMonitor ? (
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    )}
                    <span className="truncate">{isAr ? acc.nameAr : acc.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sync Queue List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300">
                {isAr ? 'سجل مزامنة القراءات' : 'Readings Sync Log'}
              </h4>
              {syncMsg && (
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {syncMsg}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[145px] overflow-y-auto pr-1">
              {offlineQueue.map((item) => (
                <div
                  key={item.clientGeneratedId}
                  className="p-2.5 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{item.summary}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(item.recordedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      item.syncStatus === 'Pending'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                    }`}
                  >
                    {item.syncStatus === 'Pending'
                      ? isAr
                        ? 'في الانتظار'
                        : 'Pending'
                      : isAr
                      ? 'تمت المزامنة'
                      : 'Synced'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>
            {syncing
              ? isAr
                ? 'جاري مزامنة البيانات...'
                : 'Syncing Data...'
              : isAr
              ? 'مزامنة القراءات الآن'
              : 'Sync Readings Now'}
          </span>
        </button>
      </div>
    </div>
  );
};
