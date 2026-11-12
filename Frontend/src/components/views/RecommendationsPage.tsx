import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Check,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  RecommendationStatus,
  RecommendationCategory,
  RecommendationPriority,
} from '../../types/telemetry';

export const RecommendationsPage: React.FC = () => {
  const { language } = useLanguage();
  const {
    recommendations,
    updateRecommendationStatus,
    createRecommendation,
    crewMembers,
    currentRole,
    activeScenario,
  } = useTelemetry();
  const isAr = language === 'ar';

  const [statusFilter, setStatusFilter] = useState<'ALL' | RecommendationStatus>('ALL');
  const [showAddRec, setShowAddRec] = useState(false);
  const [targetAstroId, setTargetAstroId] = useState(1);
  const [recTitle, setRecTitle] = useState('');
  const [recContent, setRecContent] = useState('');
  const [recReason, setRecReason] = useState('');
  const [recCategory, setRecCategory] = useState<RecommendationCategory>('Physical');
  const [recPriority, setRecPriority] = useState<RecommendationPriority>('High');

  const handleCreateRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;
    const astro = crewMembers.find((c) => c.id === targetAstroId);
    createRecommendation({
      astronautId: targetAstroId,
      astronautFullName: astro?.fullName || 'Morgan Vance',
      title: recTitle.trim(),
      titleAr: recTitle.trim(),
      content: recContent.trim() || recTitle.trim(),
      contentAr: recContent.trim() || recTitle.trim(),
      reason:
        recReason.trim() ||
        (isAr ? 'توجيه طبي للحفاظ على الجاهزية البدنية' : 'Medical guidance for crew readiness'),
      reasonAr:
        recReason.trim() || 'توجيه طبي للحفاظ على الجاهزية البدنية',
      category: recCategory,
      priority: recPriority,
    });
    setRecTitle('');
    setRecContent('');
    setRecReason('');
    setShowAddRec(false);
  };

  const recStatusBadge = (st: RecommendationStatus) => {
    if (st === 'Completed') {
      return {
        label: isAr ? 'مكتملة' : 'Completed',
        cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      };
    }
    if (st === 'Dismissed') {
      return {
        label: isAr ? 'مؤجلة' : 'Dismissed',
        cls: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
      };
    }
    if (st === 'Acknowledged') {
      return {
        label: isAr ? 'قيد التنفيذ' : 'Acknowledged',
        cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
      };
    }
    return {
      label: isAr ? 'جديدة' : 'Pending',
      cls: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    };
  };

  const filteredRecs =
    statusFilter === 'ALL'
      ? recommendations
      : recommendations.filter((r) => r.status === statusFilter);

  return (
    <div className="glass-panel rounded-[22px] p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'التوصيات والبروتوكولات الطبية اليومية' : 'Daily Medical & Fitness Recommendations'}
            </h3>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'توجيهات طبيب الرحلة للحفاظ على الكتلة العضلية وجودة النوم والتوازن الحيوي'
                : 'Flight Surgeon protocols for physical countermeasures, sleep, and wellness'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-white/10">
            {(
              [
                { key: 'ALL', ar: 'الكل', en: 'All' },
                { key: 'Pending', ar: 'جديدة', en: 'Pending' },
                { key: 'Acknowledged', ar: 'قيد التنفيذ', en: 'Active' },
                { key: 'Completed', ar: 'مكتملة', en: 'Completed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          {currentRole === 'Monitor' && (
            <button
              type="button"
              onClick={() => setShowAddRec(!showAddRec)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إصدار توصية جديدة' : 'New Recommendation'}</span>
            </button>
          )}
        </div>
      </div>

      {currentRole === 'Monitor' && showAddRec && (
        <form
          onSubmit={handleCreateRec}
          className="p-4 rounded-2xl bg-slate-900/75 border border-cyan-400/30 grid grid-cols-1 sm:grid-cols-6 gap-2.5"
        >
          <select
            value={targetAstroId}
            onChange={(e) => setTargetAstroId(Number(e.target.value))}
            className="rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2 text-xs font-semibold text-white"
          >
            {crewMembers.map((c) => (
              <option key={c.id} value={c.id}>
                {isAr ? c.fullNameAr : c.fullName}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={recTitle}
            onChange={(e) => setRecTitle(e.target.value)}
            placeholder={isAr ? 'عنوان التوصية...' : 'Recommendation title...'}
            className="sm:col-span-2 rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            value={recContent}
            onChange={(e) => setRecContent(e.target.value)}
            placeholder={isAr ? 'تفاصيل الإجراء المطلوب...' : 'Action details...'}
            className="sm:col-span-2 rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2 text-xs text-white"
          />
          <div className="flex gap-1.5">
            <select
              value={recCategory}
              onChange={(e) => setRecCategory(e.target.value as RecommendationCategory)}
              className="flex-1 rounded-xl bg-slate-950/80 border border-white/15 px-2 py-2 text-xs text-white"
            >
              <option value="Physical">{isAr ? 'بدني' : 'Physical'}</option>
              <option value="Sleep">{isAr ? 'نوم' : 'Sleep'}</option>
              <option value="Psychological">{isAr ? 'نفسي' : 'Psychological'}</option>
              <option value="Medical">{isAr ? 'طبي' : 'Medical'}</option>
              <option value="Environmental">{isAr ? 'بيئي' : 'Environmental'}</option>
            </select>
            <button
              type="submit"
              className="px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Live Scenario Countermeasure Direct Link */}
      {activeScenario.id !== 'nominal' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 border border-cyan-400/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,211,238,0.15)] animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-300 block">
                {isAr ? 'بروتوكول موجه مخصص للسيناريو الحالي:' : 'Live Scenario Countermeasure Protocol:'}{' '}
                <span className="text-white font-extrabold">{isAr ? activeScenario.titleAr : activeScenario.titleEn}</span>
              </span>
              <p className="text-xs text-slate-200 mt-0.5">
                {isAr ? activeScenario.flightSurgeonDirectiveAr : activeScenario.flightSurgeonDirectiveEn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
              {isAr ? 'مُفعّل بالتيليمتري' : 'Telemetry Linked'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRecs.map((rec) => {
          const badge = recStatusBadge(rec.status);
          return (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-slate-900/55 border border-white/10 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{isAr ? rec.titleAr || rec.title : rec.title}</span>
                  </h4>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed mb-1.5">
                  {isAr ? rec.contentAr || rec.content : rec.content}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'السبب الطبي: ' : 'Clinical Reason: '}
                  {isAr ? rec.reasonAr || rec.reason : rec.reason}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                <span className="text-[11px] font-bold text-cyan-300">
                  {rec.category} • {rec.priority}
                </span>
                <div className="flex items-center gap-2">
                  {rec.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => updateRecommendationStatus(rec.id, 'Acknowledged')}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-semibold transition-all"
                    >
                      {isAr ? 'تأكيد الاستلام' : 'Acknowledge'}
                    </button>
                  )}
                  {rec.status !== 'Completed' && rec.status !== 'Dismissed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateRecommendationStatus(rec.id, 'Completed')}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إتمام' : 'Complete'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRecommendationStatus(rec.id, 'Dismissed')}
                        className="px-2.5 py-1 rounded-lg bg-slate-700/40 hover:bg-slate-700/70 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تأجيل' : 'Dismiss'}</span>
                      </button>
                    </>
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

