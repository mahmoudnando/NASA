import React from 'react';
import {
  Activity,
  Radio,
  Play,
  Pause,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  Wind,
  Droplets,
  Flame,
  Moon,
  Dumbbell,
  Compass,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { ActivePage, ScenarioId } from '../../types/telemetry';

interface ClinicalScenariosConsoleProps {
  onNavigate?: (page: ActivePage) => void;
}

export const ClinicalScenariosConsole: React.FC<ClinicalScenariosConsoleProps> = ({
  onNavigate,
}) => {
  const { language } = useLanguage();
  const {
    activeScenario,
    allScenarios,
    activateScenario,
    isLivePulsing,
    toggleLivePulsing,
    lastTelemetryBeatAt,
    currentUserName,
    currentUserCode,
    overallStatus,
  } = useTelemetry();
  const isAr = language === 'ar';

  const getScenarioIcon = (id: ScenarioId) => {
    switch (id) {
      case 'nominal':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'eva_sortie':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'hypoxia':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'sas_sickness':
        return <Compass className="w-4 h-4 text-purple-400" />;
      case 'countermeasure_exercise':
        return <Dumbbell className="w-4 h-4 text-cyan-400" />;
      case 'deep_sleep':
        return <Moon className="w-4 h-4 text-blue-300" />;
    }
  };

  const getSeverityBadge = (sev: 'Routine' | 'MedicalAttention' | 'Emergency') => {
    if (sev === 'Emergency') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>{isAr ? 'طوارئ حرجة' : 'Critical Emergency'}</span>
        </span>
      );
    }
    if (sev === 'MedicalAttention') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>{isAr ? 'تنبيه طبي' : 'Medical Attention'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>{isAr ? 'مستقر وطبيعي' : 'Nominal'}</span>
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden animate-fade-in border border-cyan-400/20">
      {/* ── Console Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white">
                {isAr
                  ? 'وحدة محاكاة السيناريوهات الحية والترابط السريري'
                  : 'Live Scenarios & Telemetry Simulation Console'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-400/30">
                {isAr ? 'مُتصل من الجذور' : 'Root Interconnected'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'محاكاة ديناميكية حية تعكس الأعراض، التشخيص، التوصيات، والإنذارات في كامل المنظومة فوراً'
                : 'Dynamic aerospace physiological simulation linked directly across symptoms, diagnoses & alerts'}
            </p>
          </div>
        </div>

        {/* Live Ticker & Stream Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={toggleLivePulsing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLivePulsing
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {isLivePulsing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Pause className="w-3.5 h-3.5" />
                <span>{isAr ? 'النبض الحي نشط (1 Hz)' : 'Live Telemetry Active'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'استئناف النبض الحي' : 'Resume Live Stream'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Scenarios Carousel / Selector ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'اختر سيناريو الرحلة الفضائية لتجربته حياً:' : 'Select Mission Physiological Scenario:'}</span>
          </span>
          <span className="text-[11px] text-cyan-300/80 font-mono">
            {isAr ? '6 سيناريوهات سريرية معتمدة' : '6 Certified Aerospace Scenarios'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {allScenarios.map((sc) => {
            const isSelected = sc.id === activeScenario.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => activateScenario(sc.id)}
                className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-500/25 to-blue-600/30 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400 scale-[1.02]'
                    : 'bg-slate-900/60 border-white/10 hover:border-cyan-400/40 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getScenarioIcon(sc.id)}
                  </div>
                  {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sc.targetVitals.hr} bpm
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-extrabold text-white truncate leading-snug">
                    {isAr ? sc.titleAr : sc.titleEn}
                  </p>
                  <p className="text-[10px] text-cyan-300/90 font-mono mt-0.5 truncate">
                    SpO2 {sc.targetVitals.spo2}% | {sc.targetVitals.bpSystolic}/{sc.targetVitals.bpDiastolic}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Scenario Deep Root-Level Interconnection Panel ── */}
      <div className="p-4 rounded-2xl bg-slate-900/85 border border-cyan-400/30 shadow-inner flex flex-col gap-3.5">
        {/* Scenario Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-cyan-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              {isAr ? activeScenario.titleAr : activeScenario.titleEn}
            </span>
            <span className="text-xs text-slate-300">
              — {isAr ? activeScenario.subtitleAr : activeScenario.subtitleEn}
            </span>
          </div>
          <div>{getSeverityBadge(activeScenario.severity)}</div>
        </div>

        {/* 1. Clinical Diagnosis & Flight Surgeon Directive */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/30 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-cyan-200">
                {isAr ? 'التشخيص الطبي المعتمد:' : 'Certified Clinical Diagnosis:'}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-black/40 px-2 py-0.5 rounded">
                ICD-10 Aerospace
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              {isAr ? activeScenario.diagnosisAr : activeScenario.diagnosisEn}
            </p>
            <p className="text-xs text-cyan-100/90 mt-1 italic">
              «{isAr ? activeScenario.flightSurgeonDirectiveAr : activeScenario.flightSurgeonDirectiveEn}»
            </p>
          </div>
        </div>

        {/* 2. Associated Symptoms & Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Associated Symptoms */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'الأعراض الفورية المرتبطة بالسيناريو:' : 'Associated Symptoms:'}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeScenario.symptomsAr.length} {isAr ? 'أعراض رُصدت' : 'logged'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(isAr ? activeScenario.symptomsAr : activeScenario.symptomsEn).map((sym, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-200 font-semibold"
                  >
                    • {sym}
                  </span>
                ))}
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('symptoms')}
                className="self-start text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-all mt-1 cursor-pointer"
              >
                <span>{isAr ? 'متابعة فرز الأعراض في صفحة الأعراض' : 'Open Symptom Triage Desk'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Clinical Countermeasures & Protocols */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'البروتوكولات والتوصيات السريرية العاجلة:' : 'Clinical Countermeasures:'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Telemetry Sync</span>
              </div>
              <div className="space-y-1">
                {(isAr ? activeScenario.clinicalActionsAr : activeScenario.clinicalActionsEn)
                  .slice(0, 2)
                  .map((act, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-200 flex items-start gap-1.5 leading-relaxed"
                    >
                      <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{act}</span>
                    </div>
                  ))}
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('recommendations')}
                className="self-start text-[11px] font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 transition-all mt-1 cursor-pointer"
              >
                <span>{isAr ? 'عرض كافة التوصيات الطبية المحدثة' : 'View Full Clinical Recommendations'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Bottom Root Interconnection Links Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[11px] text-slate-400">{isAr ? 'الترابط المباشر:' : 'Direct Links:'}</span>
            <span className="text-cyan-300 font-mono font-bold">
              {isAr ? 'الرائد' : 'Astronaut'}: {currentUserName} ({currentUserCode})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('alerts')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>{isAr ? 'الإنذارات الحية' : 'Live Alerts'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('chat')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 text-cyan-400" />
                  <span>{isAr ? 'مراسلة طبيب الرحلة' : 'Page Flight Surgeon'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
