import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Check,
  Sparkles,
  XCircle,
  Clock,
  Calendar,
  Bell,
  Trash2,
  Stethoscope,
  Dumbbell,
  Moon,
  Heart,
  Wind,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  RecommendationStatus,
  RecommendationCategory,
  RecommendationPriority,
  ScheduleType,
} from '../../types/telemetry';

export const RecommendationsPage: React.FC = () => {
  const { language } = useLanguage();
  const {
    recommendations,
    updateRecommendationStatus,
    createRecommendation,
    deleteRecommendation,
    triggerRecommendationAlert,
    crewMembers,
    currentRole,
    activeScenario,
    currentAstronautId,
  } = useTelemetry();
  const isAr = language === 'ar';

  const [statusFilter, setStatusFilter] = useState<'ALL' | RecommendationStatus | 'DailyRecurring'>('ALL');
  const [showAddRec, setShowAddRec] = useState(false);

  // Doctor Form Fields
  const [targetAstroId, setTargetAstroId] = useState<number>(0); // 0 = All crew
  const [recTitle, setRecTitle] = useState('');
  const [recContent, setRecContent] = useState('');
  const [recReason, setRecReason] = useState('');
  const [recCategory, setRecCategory] = useState<RecommendationCategory>('Medical');
  const [recPriority, setRecPriority] = useState<RecommendationPriority>('High');
  const [recScheduleType, setRecScheduleType] = useState<ScheduleType>('DailyRecurring');
  const [recScheduledTime, setRecScheduledTime] = useState('08:00');
  const [recDoctorName, setRecDoctorName] = useState('د. سارة أوكونور (طبيب الرحلة الرئيسي)');
  const [simulatedAlertSuccessId, setSimulatedAlertSuccessId] = useState<number | null>(null);

  const handleCreateRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;

    const selectedCrew = crewMembers.find((c) => c.id === targetAstroId);
    const targetName = targetAstroId === 0
      ? (isAr ? 'كافة أفراد الطاقم' : 'All Crew Members')
      : selectedCrew?.fullName || 'Morgan Vance';

    createRecommendation({
      astronautId: targetAstroId,
      astronautFullName: targetName,
      title: recTitle.trim(),
      titleAr: recTitle.trim(),
      content: recContent.trim() || recTitle.trim(),
      contentAr: recContent.trim() || recTitle.trim(),
      reason: recReason.trim() || (isAr ? 'بروتوكول وقائي للحفاظ على التوازن الفسيولوجي المداري' : 'Preventive countermeasure protocol'),
      reasonAr: recReason.trim() || 'بروتوكول وقائي للحفاظ على التوازن الفسيولوجي المداري',
      category: recCategory,
      priority: recPriority,
      scheduleType: recScheduleType,
      scheduledTime: recScheduleType === 'DailyRecurring' ? recScheduledTime : undefined,
      prescribedBy: recDoctorName.trim() || (isAr ? 'د. سارة أوكونور (طبيب الرحلة)' : 'Dr. Sarah O\'Connor (Flight Surgeon)'),
    });

    setRecTitle('');
    setRecContent('');
    setRecReason('');
    setShowAddRec(false);
  };

  const handleSimulateAlert = (recId: number) => {
    triggerRecommendationAlert(recId);
    setSimulatedAlertSuccessId(recId);
    setTimeout(() => {
      setSimulatedAlertSuccessId(null);
    }, 4000);
  };

  // Color mapping by Priority Level
  const getPriorityTheme = (p: RecommendationPriority) => {
    switch (p) {
      case 'Urgent':
        return {
          label: isAr ? 'حرجة / طارئة' : 'Urgent',
          border: 'border-rose-500/50',
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          indicator: 'bg-rose-500',
        };
      case 'High':
        return {
          label: isAr ? 'أولوية عالية' : 'High Priority',
          border: 'border-amber-400/40',
          glow: 'shadow-[0_0_18px_rgba(245,158,11,0.2)]',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          indicator: 'bg-amber-400',
        };
      case 'Medium':
        return {
          label: isAr ? 'أولوية متوسطة' : 'Medium Priority',
          border: 'border-cyan-400/40',
          glow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
          indicator: 'bg-cyan-400',
        };
      case 'Low':
      default:
        return {
          label: isAr ? 'أولوية اعتيادية' : 'Routine',
          border: 'border-emerald-400/30',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.12)]',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
          indicator: 'bg-emerald-400',
        };
    }
  };

  const getCategoryIcon = (c: RecommendationCategory) => {
    switch (c) {
      case 'Physical':
        return <Dumbbell className="w-4 h-4 text-cyan-400" />;
      case 'Sleep':
        return <Moon className="w-4 h-4 text-blue-300" />;
      case 'Medical':
        return <Stethoscope className="w-4 h-4 text-emerald-400" />;
      case 'Psychological':
        return <Heart className="w-4 h-4 text-rose-300" />;
      case 'Environmental':
        return <Wind className="w-4 h-4 text-amber-300" />;
    }
  };

  const getStatusBadge = (st: RecommendationStatus) => {
    switch (st) {
      case 'Completed':
        return {
          label: isAr ? 'مكتملة بنجاح' : 'Completed',
          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        };
      case 'Acknowledged':
        return {
          label: isAr ? 'قيد التنفيذ' : 'In Progress',
          cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
        };
      case 'Dismissed':
        return {
          label: isAr ? 'مؤجلة' : 'Dismissed',
          cls: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
        };
      case 'Pending':
      default:
        return {
          label: isAr ? 'في الانتظار' : 'Pending',
          cls: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        };
    }
  };

  // Filter recommendations: Astronaut sees only their own or all-crew recs
  const userFilteredRecs = recommendations.filter((r) => {
    if (currentRole === 'Astronaut') {
      return r.astronautId === 0 || r.astronautId === (currentAstronautId || 1);
    }
    return true;
  });

  const displayRecs = userFilteredRecs.filter((r) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'DailyRecurring') return r.scheduleType === 'DailyRecurring';
    return r.status === statusFilter;
  });

  // KPI calculations
  const totalCount = userFilteredRecs.length;
  const recurringCount = userFilteredRecs.filter((r) => r.scheduleType === 'DailyRecurring').length;
  const activeCount = userFilteredRecs.filter((r) => r.status === 'Pending' || r.status === 'Acknowledged').length;
  const completedCount = userFilteredRecs.filter((r) => r.status === 'Completed').length;

  return (
    <div className="glass-panel rounded-[24px] p-5 md:p-6 flex flex-col gap-5 animate-fade-in border border-cyan-400/20">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
            <ClipboardCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-extrabold text-white">
                {isAr ? 'نظام التوصيات والبروتوكولات الطبية المدارية' : 'Orbital Medical Countermeasures & Directives'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-400/30">
                {currentRole === 'Monitor' ? (isAr ? 'لوحة طبيب الرحلة' : 'Flight Surgeon Mode') : (isAr ? 'لوحة الرائد' : 'Crew Mode')}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAr
                ? 'إدارة التوصيات الطبية اليومية المتكررة والمفردة مع جدولة إشعارات آلية فور حلول موعد الجرعة أو التمرين'
                : 'Direct medical prescriptions with daily recurring automated reminders & countermeasure tracking'}
            </p>
          </div>
        </div>

        {/* Doctor Action Button */}
        {currentRole === 'Monitor' && (
          <button
            type="button"
            onClick={() => setShowAddRec(!showAddRec)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? (showAddRec ? 'إغلاق نافذة التوصية' : 'إصدار توصية طبية جديدة') : (showAddRec ? 'Close Prescription' : 'New Directive')}</span>
          </button>
        )}
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">{isAr ? 'إجمالي التوصيات' : 'Total Directives'}</p>
            <p className="text-xl font-black text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">{isAr ? 'تكرار يومي مجدول' : 'Daily Recurring'}</p>
            <p className="text-xl font-black text-amber-300 mt-0.5">{recurringCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">{isAr ? 'قيد المتابعة والتنفيذ' : 'Active / In Progress'}</p>
            <p className="text-xl font-black text-cyan-300 mt-0.5">{activeCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">{isAr ? 'مكتملة بنجاح' : 'Completed'}</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{completedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Doctor Prescription Desk (Monitor Only) ── */}
      {currentRole === 'Monitor' && showAddRec && (
        <form
          onSubmit={handleCreateRec}
          className="p-5 rounded-3xl bg-slate-900/90 border-2 border-cyan-400/40 shadow-2xl flex flex-col gap-4 animate-fade-in relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white">
                {isAr ? 'محرر الوصفات والتوجيهات السريرية (Flight Surgeon Prescription Desk)' : 'Clinical Prescription Authoring Desk'}
              </h3>
            </div>
            <span className="text-[11px] text-cyan-300 font-mono">
              {isAr ? 'متصل بقاعدة البيانات وتنبيهات الطاقم' : 'Connected to Crew Telemetry'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Target Astronaut */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'الرائد المستهدف:' : 'Target Astronaut:'}
              </label>
              <select
                value={targetAstroId}
                onChange={(e) => setTargetAstroId(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value={0}>{isAr ? '👥 كافة أفراد طاقم الرحلة (All Crew)' : '👥 All Crew Members'}</option>
                {crewMembers.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {isAr ? c.fullNameAr : c.fullName} ({c.astronautCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'التصنيف الطبي:' : 'Category:'}
              </label>
              <select
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value as RecommendationCategory)}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Medical">{isAr ? '🩺 طبي ودوائي (Medical)' : '🩺 Medical'}</option>
                <option value="Physical">{isAr ? '🏋️ تمارين ومقاومة ضمور (Physical)' : '🏋️ Physical / Countermeasure'}</option>
                <option value="Sleep">{isAr ? '🌙 نوم ودورة سيركادية (Sleep)' : '🌙 Sleep & Circadian'}</option>
                <option value="Psychological">{isAr ? '❤️ صحة نفسية ومعنوية (Psychological)' : '❤️ Psychological'}</option>
                <option value="Environmental">{isAr ? '💨 بيئي ومقصورة (Environmental)' : '💨 Environmental'}</option>
              </select>
            </div>

            {/* Priority Level */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'مستوى الأولوية والتوهج:' : 'Priority Level:'}
              </label>
              <select
                value={recPriority}
                onChange={(e) => setRecPriority(e.target.value as RecommendationPriority)}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Low">🟢 {isAr ? 'عادية (Low) - هادئة' : 'Low'}</option>
                <option value="Medium">🔵 {isAr ? 'متوسطة (Medium) - سماوية' : 'Medium'}</option>
                <option value="High">🟠 {isAr ? 'عالية (High) - كهرمانية ملفتة' : 'High'}</option>
                <option value="Urgent">🔴 {isAr ? 'حرجة / طارئة (Urgent) - توهج أحمر نابض' : 'Urgent'}</option>
              </select>
            </div>
          </div>

          {/* Schedule Frequency Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isAr ? 'نوع التكرار والجدولة الزمنية:' : 'Schedule Frequency:'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'حدد ما إذا كانت التوصية لمرة واحدة أم تتكرر يومياً في مواعيد محددة' : 'Specify one-time vs daily recurring alert'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRecScheduleType('Once')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recScheduleType === 'Once'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'مرة واحدة (Once)' : 'Once'}
              </button>
              <button
                type="button"
                onClick={() => setRecScheduleType('DailyRecurring')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  recScheduleType === 'DailyRecurring'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                ⏰ {isAr ? 'تكرار يومي في موعد محدد (Daily Recurring)' : 'Daily Recurring'}
              </button>
            </div>

            {recScheduleType === 'DailyRecurring' && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={recScheduledTime}
                  onChange={(e) => setRecScheduledTime(e.target.value)}
                  className="rounded-xl bg-slate-900 border border-amber-400/40 text-amber-300 font-mono font-bold px-3 py-1.5 text-xs focus:outline-none"
                />
                <div className="hidden lg:flex items-center gap-1 text-[10px]">
                  {['07:30', '13:00', '18:30', '21:30'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setRecScheduledTime(time)}
                      className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-white/10 font-mono"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title & Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'عنوان التوصية الطبية:' : 'Directive Title:'}
              </label>
              <input
                type="text"
                required
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
                placeholder={isAr ? 'مثال: جلسة مقاومة عضلية ARED لمدة 45 دقيقة' : 'e.g., ARED Countermeasure Protocol'}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'اسم الطبيب / الأخصائي المشرف:' : 'Prescribing Medical Officer:'}
              </label>
              <input
                type="text"
                value={recDoctorName}
                onChange={(e) => setRecDoctorName(e.target.value)}
                placeholder={isAr ? 'د. سارة أوكونور (طبيب الرحلة الرئيسي)' : 'Dr. Sarah O\'Connor'}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Details & Rationale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'تفاصيل الإجراء المطلوب من الرائد بدقة:' : 'Detailed Action Protocol:'}
              </label>
              <textarea
                rows={2}
                value={recContent}
                onChange={(e) => setRecContent(e.target.value)}
                placeholder={isAr ? 'اشرح بالتفصيل الخطوات، الجرعة، أو نمط التمرين...' : 'Detailed action instructions...'}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isAr ? 'المبرر الفسيولوجي والسند الطبي (Physiological Rationale):' : 'Physiological Rationale:'}
              </label>
              <textarea
                rows={2}
                value={recReason}
                onChange={(e) => setRecReason(e.target.value)}
                placeholder={isAr ? 'وضح للرائد سبب هذا التوجيه (مثلاً: للحد من انزياح السوائل أو فقدان الكالسيوم)...' : 'Medical physiological justification...'}
                className="w-full rounded-xl bg-slate-950/90 border border-white/15 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddRec(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isAr ? 'اعتماد ونشر التوصية للرائد فوراً' : 'Issue Directive'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Active Clinical Scenario Banner ── */}
      {activeScenario.id !== 'nominal' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border border-cyan-400/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,211,238,0.15)] animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-300 block">
                {isAr ? 'بروتوكول استجابة فوري متزامن مع السيناريو السريري النشط:' : 'Synchronized Protocol for Active Scenario:'}{' '}
                <span className="text-white font-extrabold">{isAr ? activeScenario.titleAr : activeScenario.titleEn}</span>
              </span>
              <p className="text-xs text-slate-200 mt-0.5">
                {isAr ? activeScenario.flightSurgeonDirectiveAr : activeScenario.flightSurgeonDirectiveEn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
              {isAr ? 'مُتصل بالتيليمتري 100%' : '100% Telemetry Linked'}
            </span>
          </div>
        </div>
      )}

      {/* ── Filter Tabs Bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'ALL', ar: 'كافة التوصيات', en: 'All' },
              { key: 'DailyRecurring', ar: '⏰ تكرار يومي', en: 'Daily' },
              { key: 'Pending', ar: 'في الانتظار', en: 'Pending' },
              { key: 'Acknowledged', ar: 'قيد التنفيذ', en: 'Active' },
              { key: 'Completed', ar: 'مكتملة', en: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {isAr ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {displayRecs.length} {isAr ? 'توصية معروضة' : 'items'}
        </span>
      </div>

      {/* ── Recommendations Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayRecs.map((rec) => {
          const priorityTheme = getPriorityTheme(rec.priority);
          const statusBadge = getStatusBadge(rec.status);
          const isRecurring = rec.scheduleType === 'DailyRecurring';
          const isSimulatedSuccess = simulatedAlertSuccessId === rec.id;

          return (
            <div
              key={rec.id}
              className={`p-4 md:p-5 rounded-2xl bg-slate-950/70 border ${priorityTheme.border} ${priorityTheme.glow} flex flex-col justify-between gap-3.5 transition-all duration-300 relative overflow-hidden`}
            >
              {/* Top Accent Strip by Priority */}
              <div className={`absolute top-0 inset-x-0 h-1 ${priorityTheme.indicator}`} />

              <div>
                {/* Meta Top: Priority Badge + Schedule Badge + Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${priorityTheme.badge}`}>
                      {priorityTheme.label}
                    </span>

                    {/* Schedule Badge */}
                    {isRecurring ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                        <Clock className="w-3 h-3" />
                        <span>{isAr ? `تكرار يومي [${rec.scheduledTime || '08:00'}]` : `Daily [${rec.scheduledTime || '08:00'}]`}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                        <Calendar className="w-3 h-3" />
                        <span>{isAr ? 'تُنفذ مرة واحدة' : 'Once'}</span>
                      </span>
                    )}

                    {/* Category */}
                    <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-400/30">
                      {getCategoryIcon(rec.category)}
                      <span>{rec.category}</span>
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm md:text-base font-extrabold text-white leading-snug mb-1.5 flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{isAr ? rec.titleAr || rec.title : rec.title}</span>
                </h4>

                {/* Content / Directive Instructions */}
                <p className="text-xs text-slate-200 leading-relaxed mb-2 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                  {isAr ? rec.contentAr || rec.content : rec.content}
                </p>

                {/* Physiological Rationale Box */}
                {(rec.reasonAr || rec.reason) && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-400/20 text-xs">
                    <span className="text-cyan-300 font-bold block text-[11px] mb-0.5">
                      {isAr ? '🩺 السند والمبرر الفسيولوجي المداري:' : 'Physiological Rationale:'}
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {isAr ? rec.reasonAr || rec.reason : rec.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Meta & Action Controls */}
              <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Prescribed By + Target */}
                <div className="text-[11px] text-slate-400 flex flex-col">
                  <span>
                    {isAr ? 'المشرف: ' : 'Surgeon: '}
                    <strong className="text-slate-200">{rec.prescribedBy || (isAr ? 'د. سارة أوكونور' : 'Dr. Sarah O\'Connor')}</strong>
                  </span>
                  <span>
                    {isAr ? 'الموجه له: ' : 'Target: '}
                    <strong className="text-cyan-300">{rec.astronautFullName}</strong>
                  </span>
                </div>

                {/* Astronaut / Doctor Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                  {/* Simulate Scheduled Alert Button (Works for any recurring recommendation) */}
                  {isRecurring && rec.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleSimulateAlert(rec.id)}
                      title={isAr ? 'تجربة إطلاق إشعار التوصية التلقائي الآن فوراً' : 'Simulate auto notification trigger now'}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isSimulatedSuccess
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-200'
                      }`}
                    >
                      <Bell className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>{isAr ? (isSimulatedSuccess ? 'تم إرسال الإشعار ✓' : 'اختبار الإشعار التلقائي') : (isSimulatedSuccess ? 'Alert Fired ✓' : 'Test Alert')}</span>
                    </button>
                  )}

                  {/* Move to In Progress */}
                  {rec.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => updateRecommendationStatus(rec.id, 'Acknowledged')}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {isAr ? 'بدء التنفيذ' : 'Start'}
                    </button>
                  )}

                  {/* Complete */}
                  {rec.status !== 'Completed' && rec.status !== 'Dismissed' && (
                    <button
                      type="button"
                      onClick={() => updateRecommendationStatus(rec.id, 'Completed')}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>{isAr ? 'تم الإنجاز' : 'Complete'}</span>
                    </button>
                  )}

                  {/* Reset back to Pending if Completed */}
                  {rec.status === 'Completed' && (
                    <button
                      type="button"
                      onClick={() => updateRecommendationStatus(rec.id, 'Pending')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      {isAr ? 'إعادة التفعيل' : 'Reactivate'}
                    </button>
                  )}

                  {/* Doctor Can Delete/Revoke Recommendation */}
                  {currentRole === 'Monitor' && (
                    <button
                      type="button"
                      onClick={() => deleteRecommendation(rec.id)}
                      title={isAr ? 'حذف أو إلغاء هذه التوصية' : 'Delete directive'}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
