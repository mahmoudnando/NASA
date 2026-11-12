import React, { useState } from 'react';
import {
  BookOpen,
  SlidersHorizontal,
  Heart,
  Wind,
  Droplets,
  Thermometer,
  Sparkles,
  Activity,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { VitalCode } from '../../types/telemetry';

interface MetricGuideData {
  code: VitalCode;
  nameAr: string;
  nameEn: string;
  unit: string;
  normalRange: string;
  emergencyRange: string;
  whatIsItAr: string;
  whatIsItEn: string;
  whyItMattersAr: string;
  whyItMattersEn: string;
  howToMeasureAr: string;
  howToMeasureEn: string;
  interpretationAr: string;
  interpretationEn: string;
  actionAr: string;
  actionEn: string;
  icon: React.ReactNode;
}

const guidesCatalog: MetricGuideData[] = [
  {
    code: 'HR',
    nameAr: 'نبض القلب',
    nameEn: 'Heart Rate',
    unit: 'bpm',
    normalRange: '60 - 100 bpm',
    emergencyRange: '< 40 | > 140 bpm',
    whatIsItAr: 'يقيس عدد انقباضات عضلة القلب في الدقيقة الواحدة.',
    whatIsItEn: 'Heart rate measures how many times your heart beats in one minute.',
    whyItMattersAr: 'يرتبط بتكيف الجهاز القلبي الوعائي مع انعدام الجاذبية والتعافي بعد المجهود البدني.',
    whyItMattersEn: 'Associated with cardiovascular adaptation to microgravity and recovery from physical work.',
    howToMeasureAr: 'ارتدِ السترة الحيوية بإحكام أو استخدم مستشعر النبض أثناء الجلوس والراحة بهدوء.',
    howToMeasureEn: 'Wear the biometric sensor snugly against your skin or use the pulse oximeter while resting quietly.',
    interpretationAr: 'المعدل الطبيعي أثناء الراحة هو 60 إلى 100 نبضة/دقيقة، وقد يرتفع طبيعياً بعد التمارين.',
    interpretationEn: 'Resting rate between 60 and 100 bpm is the standard reference. Higher rates may occur after exercise.',
    actionAr: 'إذا كان مرتفعاً أثناء الراحة، استرح بهدوء واشرب الماء حسب خطة السوائل وأعد القياس.',
    actionEn: 'If elevated at rest, rest quietly, drink water per your fluid plan, and re-measure.',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
  },
  {
    code: 'BP',
    nameAr: 'ضغط الدم',
    nameEn: 'Blood Pressure',
    unit: 'mmHg',
    normalRange: '90-120 / 60-80 mmHg',
    emergencyRange: '< 70/45 | > 160/100',
    whatIsItAr: 'يقيس ضغط الدم في الشرايين أثناء انقباض القلب وانبساطه.',
    whatIsItEn: 'Measures pressure in your blood vessels during and between heart beats (systolic and diastolic).',
    whyItMattersAr: 'يتأثر بتحرك السوائل نحو الجزء العلوي من الجسم في بيئة انعدام الجاذبية.',
    whyItMattersEn: 'Associated with fluid shifts toward the head and circulatory regulation in space.',
    howToMeasureAr: 'ثبت السوار الآلي على أعلى الذراع بمستوى القلب والتزم الهدوء التام أثناء القياس.',
    howToMeasureEn: 'Fit the automated cuff on your upper arm at heart level and remain still and quiet.',
    interpretationAr: 'النطاق الطبيعي هو 90-120 للانقباضي و60-80 للانبساطي، وانخفاضه قد يسبب الدوار.',
    interpretationEn: 'Standard reference is 90-120 systolic over 60-80 diastolic. Low readings can cause lightheadedness.',
    actionAr: 'عند الخروج عن النطاق، استرح وأعد القياس مع تسجيل وضعية الجسم وإبلاغ طبيب الرحلة.',
    actionEn: 'Rest quietly and re-measure, recording your body position, and report persistent changes.',
    icon: <Droplets className="w-4 h-4 text-blue-400" />,
  },
  {
    code: 'SPO2',
    nameAr: 'مستوى الأكسجين',
    nameEn: 'Oxygen Saturation (SpO2)',
    unit: '%',
    normalRange: '95 - 100%',
    emergencyRange: '< 90%',
    whatIsItAr: 'يقيس نسبة الهيموجلوبين المشبع بالأكسجين في الدم.',
    whatIsItEn: 'Measures the percentage of oxygen carried in your blood.',
    whyItMattersAr: 'يتحقق من كفاية الأكسجين الواصل للجسم من هواء المقصورة أو بدلة الفضاء.',
    whyItMattersEn: 'Helps verify adequate oxygen delivery from cabin air or life support equipment.',
    howToMeasureAr: 'ضع المستشعر على طرف إصبع دافئ ونظيف وثبت يدك حتى تستقر القراءة.',
    howToMeasureEn: 'Place the sensor on a clean, warm fingertip and keep your hand still until stable.',
    interpretationAr: 'النطاق الطبيعي بين 95% و100%، وأي قراءة أقل من 95% تستدعي الانتباه.',
    interpretationEn: 'Standard reference is 95% to 100%. Readings below 95% require immediate attention.',
    actionAr: 'أعد تثبيت المستشعر، وإذا استمر أقل من 95% افحص مستوى أكسجين المقصورة وأبلغ الطبيب فوراً.',
    actionEn: 'Reposition the sensor. If below 95%, check cabin oxygen levels and notify your monitor immediately.',
    icon: <Wind className="w-4 h-4 text-cyan-400" />,
  },
  {
    code: 'TEMP',
    nameAr: 'درجة الحرارة',
    nameEn: 'Core Body Temperature',
    unit: '°C',
    normalRange: '36.5 - 37.3°C',
    emergencyRange: '< 35.0 | > 38.5°C',
    whatIsItAr: 'يقيس درجة الحرارة الداخلية للجسم.',
    whatIsItEn: 'Measures internal thermal energy and core body temperature.',
    whyItMattersAr: 'يساعد في رصد الالتهابات أو الإجهاد الحراري أثناء التمارين والأنشطة الفضائية.',
    whyItMattersEn: 'Associated with infection, inflammation, heavy physical exertion, or heat stress.',
    howToMeasureAr: 'استخدم مقياس الحرارة المعتمد للأذن بالأشعة تحت الحمراء بعد فترة راحة.',
    howToMeasureEn: 'Use the approved tympanic ear thermometer or forehead sensor according to instructions.',
    interpretationAr: 'النطاق الطبيعي بين 36.5 و37.3 درجة مئوية، وقد ترتفع مؤقتاً بعد التمارين.',
    interpretationEn: 'Standard reference is 36.5°C to 37.3°C. Temperature can rise immediately after exercise.',
    actionAr: 'سجل ما إذا كنت في حالة راحة أو بعد تمرين، واشرب السوائل وأعد القياس.',
    actionEn: 'Note whether you were resting or exercising, hydrate, re-measure, and report persistent fever.',
    icon: <Thermometer className="w-4 h-4 text-amber-400" />,
  },
  {
    code: 'GLUCOSE',
    nameAr: 'سكر الدم',
    nameEn: 'Blood Glucose',
    unit: 'mg/dL',
    normalRange: '70 - 99 mg/dL',
    emergencyRange: '< 50 | > 200 mg/dL',
    whatIsItAr: 'يقيس تركيز الجلوكوز (السكر) في الدم.',
    whatIsItEn: 'Measures the concentration of glucose sugar in your blood.',
    whyItMattersAr: 'يرتبط بتوازن الطاقة والتمثيل الغذائي أثناء المهام الفضائية الطويلة.',
    whyItMattersEn: 'Associated with energy availability and metabolic changes in spaceflight.',
    howToMeasureAr: 'استخدم المستشعر الحيوي أو شريط القياس مع تحديد حالة الوجبة (صائم أو بعد الطعام).',
    howToMeasureEn: 'Use the continuous biosensor or glucometer, always noting meal context.',
    interpretationAr: 'النطاق الطبيعي للصائم حتى 99 mg/dL، ويرتفع طبيعياً بعد تناول الوجبات.',
    interpretationEn: 'Fasting reference is 70 to 99 mg/dL. Values naturally rise after meals.',
    actionAr: 'تحقق من توقيت آخر وجبة والتزم بالخطة الغذائية المقررة من طبيب الرحلة.',
    actionEn: 'Check your meal timing, re-measure, and follow your nutrition management plan.',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
  },
  {
    code: 'RESP',
    nameAr: 'معدل التنفس',
    nameEn: 'Respiratory Rate',
    unit: 'breaths/min',
    normalRange: '12 - 18 /min',
    emergencyRange: '< 8 | > 30 /min',
    whatIsItAr: 'يقيس عدد دورات التنفس الكاملة في الدقيقة الواحدة.',
    whatIsItEn: 'Measures the number of breathing cycles completed in one minute.',
    whyItMattersAr: 'يعكس كفاءة التنفس وجودة الهواء ومستوى ثاني أكسيد الكربون في المقصورة.',
    whyItMattersEn: 'Associated with physical exertion, cabin air quality, and carbon dioxide levels.',
    howToMeasureAr: 'استرح بهدوء لمدة 60 ثانية ودع مستشعر الصدر الحيوي يسجل معدل التنفس.',
    howToMeasureEn: 'Rest quietly over 60 seconds while the thoracic biometric sensor logs your rate.',
    interpretationAr: 'المعدل الطبيعي أثناء الراحة هو 12 إلى 18 نفساً في الدقيقة.',
    interpretationEn: 'Standard resting reference is 12 to 18 breaths per minute.',
    actionAr: 'إذا شعرت بتسارع التنفس أثناء الراحة، افحص قراءات هواء المقصورة وتواصل مع طبيب الرحلة.',
    actionEn: 'If breathing feels fast at rest, check cabin air readings and contact your monitor.',
    icon: <Activity className="w-4 h-4 text-indigo-400" />,
  },
];

export const VitalGuidesRangesPage: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [selectedCode, setSelectedCode] = useState<VitalCode>('HR');

  const activeGuide = guidesCatalog.find((g) => g.code === selectedCode) || guidesCatalog[0];

  const fiveQuestions = [
    {
      titleAr: '1. ما هو هذا المؤشر؟',
      titleEn: '1. What Is It?',
      body: isAr ? activeGuide.whatIsItAr : activeGuide.whatIsItEn,
    },
    {
      titleAr: '2. لماذا يهم في الفضاء؟',
      titleEn: '2. Why It Matters in Space',
      body: isAr ? activeGuide.whyItMattersAr : activeGuide.whyItMattersEn,
    },
    {
      titleAr: '3. كيف يتم قياسه بدقة؟',
      titleEn: '3. How to Measure Accurately',
      body: isAr ? activeGuide.howToMeasureAr : activeGuide.howToMeasureEn,
    },
    {
      titleAr: '4. كيف تفسر القراءة؟',
      titleEn: '4. How to Interpret Readings',
      body: isAr ? activeGuide.interpretationAr : activeGuide.interpretationEn,
    },
    {
      titleAr: '5. الإجراء الموصى به عند التغير',
      titleEn: '5. Recommended Action Guidance',
      body: isAr ? activeGuide.actionAr : activeGuide.actionEn,
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 animate-fade-in">
      {/* Metric Selector Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {guidesCatalog.map((item) => {
          const active = item.code === selectedCode;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setSelectedCode(item.code)}
              className={`glass-panel rounded-2xl p-3 text-start border transition-all ${
                active
                  ? 'border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[11px] font-bold text-cyan-300">{item.code}</span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {isAr ? item.nameAr : item.nameEn}
              </p>
              <p className="text-[10px] text-emerald-300 mt-0.5" dir="ltr">
                {item.normalRange}
              </p>
            </button>
          );
        })}
      </div>

      {/* 5 Core Questions Guide Panel (HealthMetricGuides) */}
      <div className="glass-panel rounded-[22px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr
                  ? `الدليل الإرشادي للمؤشر: ${activeGuide.nameAr}`
                  : `Clinical Metric Guide: ${activeGuide.nameEn}`}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'القواعد الخمس لفهم وقياس وتفسير المؤشر الحيوي أثناء المهمة'
                  : 'Five essential principles for measuring and interpreting this vital sign'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs" dir="ltr">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
              Normal: {activeGuide.normalRange}
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 font-bold">
              Critical: {activeGuide.emergencyRange}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fiveQuestions.map((q, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-slate-900/55 border border-white/10 flex flex-col gap-2 ${
                idx === 4 ? 'md:col-span-2 lg:col-span-2 border-cyan-400/30 bg-cyan-950/20' : ''
              }`}
            >
              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? q.titleAr : q.titleEn}</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">{q.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Reference Ranges Table (ReferenceRanges) */}
      <div className="glass-panel rounded-[22px] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr
                ? 'جدول النطاقات المرجعية وحدود الطوارئ المعتمدة'
                : 'Approved Clinical Reference Ranges & Emergency Thresholds'}
            </h3>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'المعايير المرجعية المستخدمة لتقييم القراءات الحيوية الستة تلقائياً'
                : 'Reference standards used to evaluate all 6 vital sign metrics'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {guidesCatalog.map((g) => (
            <div
              key={g.code}
              className="p-3.5 rounded-xl bg-slate-900/55 border border-white/10 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  {g.icon}
                  {isAr ? g.nameAr : g.nameEn}
                </span>
                <span className="text-xs font-bold text-slate-400" dir="ltr">
                  {g.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span className="text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isAr ? 'النطاق الطبيعي:' : 'Normal:'}
                </span>
                <span className="font-bold text-emerald-300" dir="ltr">
                  {g.normalRange}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  {isAr ? 'حدود الطوارئ:' : 'Emergency:'}
                </span>
                <span className="font-bold text-rose-300" dir="ltr">
                  {g.emergencyRange}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

