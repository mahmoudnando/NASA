import React, { useState } from 'react';
import {
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  Heart,
  Wind,
  Droplets,
  Thermometer,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { VitalCode, BodyPosition, ActivityContext, MealContext } from '../../types/telemetry';

export const VitalsRecordingPage: React.FC = () => {
  const { language } = useLanguage();
  const { vitals, vitalsLog, recordVital } = useTelemetry();
  const isAr = language === 'ar';

  const [selectedCode, setSelectedCode] = useState<VitalCode>('HR');
  const [filterCode, setFilterCode] = useState<'ALL' | VitalCode>('ALL');
  const [value, setValue] = useState<string>('74');
  const [secondaryValue, setSecondaryValue] = useState<string>('78');
  const [bodyPosition, setBodyPosition] = useState<BodyPosition>('MicrogravityFloating');
  const [activityContext, setActivityContext] = useState<ActivityContext>('Resting');
  const [mealContext, setMealContext] = useState<MealContext>('Fasting');
  const [notes, setNotes] = useState<string>('');
  const [savedToast, setSavedToast] = useState(false);

  const vitalTypes: {
    code: VitalCode;
    labelAr: string;
    labelEn: string;
    unit: string;
    defaultVal: string;
    guideAr: string;
    guideEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      code: 'HR',
      labelAr: 'نبض القلب',
      labelEn: 'Heart Rate',
      unit: isAr ? 'نبضة / دقيقة' : 'bpm',
      defaultVal: '72',
      guideAr: 'يقاس أثناء الاسترخاء التام لمدة 60 ثانية لضمان دقة القراءة.',
      guideEn: 'Measure while fully relaxed for 60 seconds for an accurate reading.',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
    },
    {
      code: 'SPO2',
      labelAr: 'مستوى الأكسجين',
      labelEn: 'Oxygen Saturation',
      unit: '%',
      defaultVal: '98',
      guideAr: 'تأكد من ثبات مستشعر الإصبع وعدم الحركة أثناء القياس.',
      guideEn: 'Keep the finger sensor steady and remain still during measurement.',
      icon: <Wind className="w-4 h-4 text-cyan-400" />,
    },
    {
      code: 'BP',
      labelAr: 'ضغط الدم',
      labelEn: 'Blood Pressure',
      unit: 'mmHg',
      defaultVal: '118',
      guideAr: 'يثبت السوار على الذراع الأيسر بمستوى القلب مع تجنب التحدث.',
      guideEn: 'Place the cuff on the left arm at heart level and remain quiet.',
      icon: <Droplets className="w-4 h-4 text-blue-400" />,
    },
    {
      code: 'TEMP',
      labelAr: 'درجة الحرارة',
      labelEn: 'Body Temperature',
      unit: '°C',
      defaultVal: '36.6',
      guideAr: 'يقاس عبر مستشعر الأذن بالأشعة تحت الحمراء بعد الراحة.',
      guideEn: 'Measure using the tympanic infrared sensor after resting.',
      icon: <Thermometer className="w-4 h-4 text-amber-400" />,
    },
    {
      code: 'GLUCOSE',
      labelAr: 'سكر الدم',
      labelEn: 'Blood Glucose',
      unit: 'mg/dL',
      defaultVal: '88',
      guideAr: 'حدد حالة الوجبة (صائم أو بعد الطعام) لتقييم القراءة بدقة.',
      guideEn: 'Select meal context (Fasting or Postprandial) for accurate evaluation.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    },
    {
      code: 'RESP',
      labelAr: 'معدل التنفس',
      labelEn: 'Respiratory Rate',
      unit: isAr ? 'نفس / دقيقة' : 'breaths/min',
      defaultVal: '15',
      guideAr: 'يقاس عبر حزام الصدر أو عد مرات الشهيق لمدة دقيقة كاملة أثناء الراحة.',
      guideEn: 'Measure via thoracic sensor strap or count chest rises for 60 seconds at rest.',
      icon: <Activity className="w-4 h-4 text-violet-400" />,
    },
  ];

  const handleSelectVital = (code: VitalCode, defaultVal: string) => {
    setSelectedCode(code);
    setValue(defaultVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return;

    await recordVital({
      vitalSignTypeCode: selectedCode,
      value: numVal,
      secondaryValue: selectedCode === 'BP' ? parseFloat(secondaryValue) || 76 : undefined,
      bodyPosition,
      activityContext,
      mealContext: selectedCode === 'GLUCOSE' ? mealContext : undefined,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Emergency') {
      return {
        label: isAr ? 'حرج' : 'Critical',
        cls: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
      };
    }
    if (status === 'MedicalAttention') {
      return {
        label: isAr ? 'ملاحظة' : 'Attention',
        cls: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
      };
    }
    return {
      label: isAr ? 'طبيعي' : 'Normal',
      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    };
  };

  const selectedMeta = vitalTypes.find((v) => v.code === selectedCode) || vitalTypes[0];
  const filteredLog =
    filterCode === 'ALL'
      ? vitalsLog
      : vitalsLog.filter((item) => item.vitalSignTypeCode === filterCode);

  return (
    <div className="flex flex-col gap-3.5 animate-fade-in">
      {/* Top 6 Live Vital Summary Cards (HR, SPO2, BP, TEMP, GLUCOSE, RESP) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {vitalTypes.map((vt) => {
          const card = vitals[vt.code];
          const active = selectedCode === vt.code;
          const badge = getStatusBadge(card.status);
          return (
            <button
              key={vt.code}
              type="button"
              onClick={() => handleSelectVital(vt.code, vt.defaultVal)}
              className={`glass-panel rounded-[20px] p-3 text-start transition-all duration-200 border ${
                active
                  ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {vt.icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mb-0.5 truncate">
                {isAr ? vt.labelAr : vt.labelEn}
              </p>
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-lg font-extrabold text-white">
                  {card.secondaryValue ? `${card.value}/${card.secondaryValue}` : card.value}
                </span>
                {card.unitEn && <span className="text-[10px] text-slate-400">{card.unitEn}</span>}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate" dir="ltr">
                {card.rangeText}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Content: Record Reading Form + Recent Readings Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Record New Reading Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 glass-panel rounded-[22px] p-5 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'تسجيل قراءة حيوية جديدة' : 'Record New Vital Reading'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isAr ? selectedMeta.labelAr : selectedMeta.labelEn}
                  </p>
                </div>
              </div>
              {savedToast && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAr ? 'تم الحفظ' : 'Saved'}
                </span>
              )}
            </div>

            {/* Brief Measurement Guideline Box */}
            <div className="mb-4 p-3 rounded-xl bg-slate-900/55 border border-white/10 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-200 leading-relaxed">
                {isAr ? selectedMeta.guideAr : selectedMeta.guideEn}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {selectedCode === 'BP'
                    ? isAr
                      ? 'الضغط الانقباضي'
                      : 'Systolic (mmHg)'
                    : `${isAr ? 'القيمة' : 'Value'} (${selectedMeta.unit})`}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {selectedCode === 'BP' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? 'الضغط الانبساطي' : 'Diastolic (mmHg)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={secondaryValue}
                    onChange={(e) => setSecondaryValue(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? 'وضعية الجسم' : 'Body Position'}
                </label>
                <select
                  value={bodyPosition}
                  onChange={(e) => setBodyPosition(e.target.value as BodyPosition)}
                  className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="MicrogravityFloating">
                    {isAr ? 'انعدام الجاذبية' : 'Microgravity Floating'}
                  </option>
                  <option value="Sitting">{isAr ? 'جالس' : 'Sitting'}</option>
                  <option value="Supine">{isAr ? 'مستلقٍ' : 'Supine'}</option>
                  <option value="Standing">{isAr ? 'واقف' : 'Standing'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? 'حالة النشاط' : 'Activity Context'}
                </label>
                <select
                  value={activityContext}
                  onChange={(e) => setActivityContext(e.target.value as ActivityContext)}
                  className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Resting">{isAr ? 'أثناء الراحة' : 'Resting'}</option>
                  <option value="DuringExercise">{isAr ? 'أثناء التمارين' : 'During Exercise'}</option>
                  <option value="PostExercise">{isAr ? 'بعد التمارين' : 'Post Exercise'}</option>
                  <option value="ExtravehicularActivity">{isAr ? 'نشاط خارج المركبة' : 'EVA'}</option>
                  <option value="PreSleep">{isAr ? 'قبل النوم' : 'Pre-Sleep'}</option>
                  <option value="PostSleep">{isAr ? 'بعد الاستيقاظ' : 'Post-Sleep'}</option>
                </select>
              </div>

              {selectedCode === 'GLUCOSE' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isAr ? 'توقيت الوجبة' : 'Meal Context'}
                  </label>
                  <select
                    value={mealContext}
                    onChange={(e) => setMealContext(e.target.value as MealContext)}
                    className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Fasting">{isAr ? 'صائم' : 'Fasting'}</option>
                    <option value="PostMeal">{isAr ? 'بعد الوجبة' : 'Post-Meal'}</option>
                    <option value="Random">{isAr ? 'عشوائي' : 'Random'}</option>
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? 'ملاحظات إضافية (اختياري)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isAr ? 'أضف ملاحظة مختصرة حول القراءة...' : 'Add a brief observation...'
                  }
                  className="w-full rounded-xl bg-slate-900/75 border border-white/15 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حفظ القراءة الآن' : 'Save Reading'}</span>
          </button>
        </form>

        {/* Recent Readings Log with Type Filter */}
        <div className="lg:col-span-7 glass-panel rounded-[22px] p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'سجل القراءات الحيوية' : 'Vital Readings History'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isAr
                      ? `إجمالي القراءات المعروضة: ${filteredLog.length}`
                      : `Showing ${filteredLog.length} readings`}
                  </p>
                </div>
              </div>

              {/* Filter Tabs by Vital Sign Type */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFilterCode('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filterCode === 'ALL'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                {vitalTypes.map((vt) => (
                  <button
                    key={vt.code}
                    type="button"
                    onClick={() => setFilterCode(vt.code)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      filterCode === vt.code
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {vt.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[340px] pr-1 space-y-2.5">
              {filteredLog.map((item) => {
                const meta =
                  vitalTypes.find((v) => v.code === item.vitalSignTypeCode) || vitalTypes[0];
                const badge = getStatusBadge(item.status);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {isAr ? meta.labelAr : meta.labelEn}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate mt-0.5">
                          {item.notes ||
                            (isAr ? 'قراءة مسجلة ضمن المتابعة الدورية' : 'Scheduled routine reading')}
                        </p>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className="text-base font-extrabold text-white" dir="ltr">
                        {item.secondaryValue ? `${item.value}/${item.secondaryValue}` : item.value}{' '}
                        <span className="text-xs font-normal text-slate-300">{item.unit}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(item.recordedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
