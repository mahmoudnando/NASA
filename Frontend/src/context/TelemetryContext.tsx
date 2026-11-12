import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  VitalSignCardData,
  VitalSignStatus,
  VitalSignReading,
  VitalCode,
  HeartRateTimePoint,
  HealthAlert,
  SleepRecord,
  MoodEntry,
  Recommendation,
  RecommendationStatus,
  ChatMessage,
  CrewMemberStatus,
  MissionInfo,
  OfflineSyncItem,
  CreateVitalReadingPayload,
  ClinicalScenario,
  ScenarioId,
} from '../types/telemetry';
import { signalRService } from '../services/signalrService';
import { api } from '../services/api';

export interface AstronautProfileData {
  id: number;
  astronautCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  heightCm: number;
  weightKg: number;
  emergencyContactInfo?: string;
  missionId?: number;
  missionName?: string;
}

interface TelemetryContextType {
  vitals: Record<VitalCode, VitalSignCardData>;
  vitalsLog: VitalSignReading[];
  overallStatus: VitalSignStatus;
  heartRateHistory: HeartRateTimePoint[];
  alerts: HealthAlert[];
  unreadAlertsCount: number;
  sleepRecords: SleepRecord[];
  moodEntries: MoodEntry[];
  recommendations: Recommendation[];
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  selectedChatAstronautId: number;
  setSelectedChatAstronautId: (id: number) => void;
  crewMembers: CrewMemberStatus[];
  missions: MissionInfo[];
  offlineQueue: OfflineSyncItem[];
  isOnline: boolean;
  isAuthenticated: boolean;
  currentRole: 'Astronaut' | 'Monitor';
  activeAccount: string;
  currentUserCode: string;
  currentUserName: string;
  currentAstronautId: number | null;
  astronautProfile: AstronautProfileData;
  setCurrentRole: (role: 'Astronaut' | 'Monitor') => void;
  switchAccount: (username: string) => Promise<boolean>;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  recordVital: (payload: CreateVitalReadingPayload) => Promise<void>;
  recordSleep: (
    payload: Omit<
      SleepRecord,
      'id' | 'clientGeneratedId' | 'astronautId' | 'astronautFullName' | 'recordedAt'
    >
  ) => Promise<void>;
  recordMood: (payload: {
    moodScore: number;
    stressLevel: number;
    dominantEmotion: string;
    notes?: string;
  }) => Promise<void>;
  updateRecommendationStatus: (id: number, newStatus: RecommendationStatus) => void;
  createRecommendation: (
    payload: Omit<Recommendation, 'id' | 'generatedAt' | 'status'>
  ) => void;
  triggerManualAlert: (
    title: string,
    message: string,
    severity: 'MedicalAttention' | 'Emergency'
  ) => void;
  acknowledgeAlert: (id: number) => void;
  resolveAlert: (id: number, notes: string) => void;
  dismissAlert: (id: number) => void;
  sendChatMessage: (
    content: string,
    senderRole?: 'Astronaut' | 'Monitor',
    targetAstronautId?: number,
    recipientName?: string,
    recipientRole?: string
  ) => void;
  markAllChatRead: () => void;
  provisionAstronaut: (
    fullName: string,
    fullNameAr: string,
    code: string,
    email: string,
    bloodType: string
  ) => void;
  updateAstronautProfile: (
    id: number,
    payload: {
      firstName: string;
      lastName: string;
      bloodType: string;
      heightCm: number;
      weightKg: number;
      emergencyContactInfo?: string;
      missionId?: number;
    }
  ) => Promise<void>;
  toggleAstronautActive: (id: number) => void;
  createMission: (
    code: string,
    name: string,
    nameAr: string,
    destination: string,
    destinationAr: string
  ) => void;
  updateMissionStatus: (
    id: number,
    status: 'Scheduled' | 'Active' | 'Completed' | 'Aborted'
  ) => Promise<void>;
  deleteMissionById: (id: number) => Promise<void>;
  assignCrewToMission: (missionId: number, astronautId: number) => Promise<void>;
  unassignCrewFromMission: (missionId: number, astronautId: number) => Promise<void>;
  executeOfflineSyncBatch: () => Promise<{ synced: number; duplicates: number }>;
  toggleOnlineStatus: () => void;
  activeScenario: ClinicalScenario;
  allScenarios: ClinicalScenario[];
  activateScenario: (scenarioId: ScenarioId) => void;
  isLivePulsing: boolean;
  toggleLivePulsing: () => void;
  lastTelemetryBeatAt: string;
}

const initialVitals: Record<VitalCode, VitalSignCardData> = {
  HR: {
    code: 'HR',
    titleAr: 'نبض القلب',
    titleEn: 'Heart Rate',
    value: '72',
    unitAr: 'نبضة / دقيقة',
    unitEn: 'bpm',
    rangeText: '60 - 100',
    status: 'Routine',
    iconType: 'heart',
    progressPercent: 62,
  },
  SPO2: {
    code: 'SPO2',
    titleAr: 'مستوى الأكسجين',
    titleEn: 'Oxygen Level',
    value: '98%',
    unitAr: '',
    unitEn: '',
    rangeText: '95 - 100%',
    status: 'Routine',
    iconType: 'lungs',
    progressPercent: 92,
  },
  BP: {
    code: 'BP',
    titleAr: 'ضغط الدم',
    titleEn: 'Blood Pressure',
    value: '118',
    secondaryValue: '76',
    unitAr: 'mmHg',
    unitEn: 'mmHg',
    rangeText: '90 - 120 / 60 - 80',
    status: 'Routine',
    iconType: 'blood',
    progressPercent: 70,
  },
  TEMP: {
    code: 'TEMP',
    titleAr: 'درجة الحرارة',
    titleEn: 'Temperature',
    value: '36.6°C',
    unitAr: '',
    unitEn: '',
    rangeText: '36.1 - 37.2°C',
    status: 'Routine',
    iconType: 'thermometer',
    progressPercent: 55,
  },
  GLUCOSE: {
    code: 'GLUCOSE',
    titleAr: 'سكر الدم',
    titleEn: 'Blood Glucose',
    value: '88',
    unitAr: 'mg/dL',
    unitEn: 'mg/dL',
    rangeText: '70 - 99',
    status: 'Routine',
    iconType: 'glucose',
    progressPercent: 64,
  },
  RESP: {
    code: 'RESP',
    titleAr: 'معدل التنفس',
    titleEn: 'Respiratory Rate',
    value: '15',
    unitAr: 'نفس / دقيقة',
    unitEn: 'breaths/min',
    rangeText: '12 - 18',
    status: 'Routine',
    iconType: 'resp',
    progressPercent: 58,
  },
};

const initialHistory: HeartRateTimePoint[] = [
  { timeLabelAr: '12 ص', timeLabelEn: '12 AM', value: 73, recordedAt: '2026-11-11T00:00:00Z' },
  { timeLabelAr: '4 ص', timeLabelEn: '4 AM', value: 75, recordedAt: '2026-11-11T04:00:00Z' },
  { timeLabelAr: '8 ص', timeLabelEn: '8 AM', value: 74, recordedAt: '2026-11-11T08:00:00Z' },
  { timeLabelAr: '12 م', timeLabelEn: '12 PM', value: 72, recordedAt: '2026-11-11T12:00:00Z' },
  { timeLabelAr: '4 م', timeLabelEn: '4 PM', value: 78, recordedAt: '2026-11-11T16:00:00Z' },
  { timeLabelAr: '8 م', timeLabelEn: '8 PM', value: 76, recordedAt: '2026-11-11T20:00:00Z' },
];

const initialVitalsLog: VitalSignReading[] = [
  {
    id: 1,
    clientGeneratedId: '6e08aeaf-b6fc-4b40-ad52-d2f95573bd86',
    astronautId: 1,
    vitalSignTypeId: 1,
    vitalSignTypeCode: 'HR',
    vitalSignTypeName: 'Heart Rate',
    value: 72,
    status: 'Routine',
    unit: 'bpm',
    bodyPosition: 'MicrogravityFloating',
    activityContext: 'Resting',
    sensorLocation: 'Thoracic Biometric Vest',
    measurementMethod: 'Optical PPG + ECG',
    recordedAt: '2026-11-11T16:30:00Z',
    notes: 'استقرار النبض أثناء الراحة',
  },
  {
    id: 2,
    clientGeneratedId: '869620f3-9a9a-4d76-99a9-18694b96744f',
    astronautId: 1,
    vitalSignTypeId: 2,
    vitalSignTypeCode: 'BP',
    vitalSignTypeName: 'Blood Pressure',
    value: 118,
    secondaryValue: 76,
    status: 'Routine',
    unit: 'mmHg',
    bodyPosition: 'MicrogravityFloating',
    activityContext: 'Resting',
    sensorLocation: 'Left Brachial Artery',
    measurementMethod: 'Oscillometric Cuff',
    recordedAt: '2026-11-11T16:31:00Z',
    notes: 'توازن ضغط الدم الشرياني',
  },
  {
    id: 3,
    clientGeneratedId: 'ee413430-c50b-4074-a1b3-9dbde4cce249',
    astronautId: 1,
    vitalSignTypeId: 3,
    vitalSignTypeCode: 'SPO2',
    vitalSignTypeName: 'Blood Oxygen Saturation',
    value: 98,
    status: 'Routine',
    unit: '%',
    bodyPosition: 'MicrogravityFloating',
    activityContext: 'Resting',
    sensorLocation: 'Distal Phalanx',
    measurementMethod: 'Pulse Oximetry',
    recordedAt: '2026-11-11T16:32:00Z',
    notes: 'تشبع الأكسجين مثالي',
  },
  {
    id: 4,
    clientGeneratedId: 'd1c3c7b2-e957-458d-8984-47acdd73b2b9',
    astronautId: 1,
    vitalSignTypeId: 4,
    vitalSignTypeCode: 'TEMP',
    vitalSignTypeName: 'Core Body Temperature',
    value: 36.6,
    status: 'Routine',
    unit: '°C',
    bodyPosition: 'MicrogravityFloating',
    activityContext: 'Resting',
    sensorLocation: 'Tympanic Sensor',
    measurementMethod: 'Infrared Sensor',
    recordedAt: '2026-11-11T16:33:00Z',
    notes: 'حرارة الجسم ضمن المعدل الطبيعي',
  },
  {
    id: 5,
    clientGeneratedId: '6188865d-d679-45d4-b6a0-71fb2acf8df9',
    astronautId: 1,
    vitalSignTypeId: 5,
    vitalSignTypeCode: 'GLUCOSE',
    vitalSignTypeName: 'Blood Glucose',
    value: 88,
    status: 'Routine',
    unit: 'mg/dL',
    bodyPosition: 'MicrogravityFloating',
    activityContext: 'Resting',
    mealContext: 'Fasting',
    sensorLocation: 'Subcutaneous Patch',
    measurementMethod: 'Continuous Biosensor',
    recordedAt: '2026-11-11T16:35:00Z',
    notes: 'مستوى السكر صائم طبيعي',
  },
];

const initialSleepRecords: SleepRecord[] = [
  {
    id: 1,
    clientGeneratedId: '17724818-5e9c-4cee-8e91-ec4683023b47',
    astronautId: 1,
    astronautFullName: 'Morgan Vance',
    recordedAt: '2026-11-11T06:30:00Z',
    startTime: '2026-11-10T22:30:00Z',
    endTime: '2026-11-11T06:15:00Z',
    durationHours: 7.75,
    quality: 'Excellent',
    deepSleepMinutes: 115,
    remSleepMinutes: 105,
    lightSleepMinutes: 225,
    awakeMinutes: 20,
    sleepEfficiencyPercentage: 95.7,
    notes: 'نوم عميق ومريح في كبسولة النوم المعزولة صوتياً',
  },
];

const initialMoodEntries: MoodEntry[] = [
  {
    id: 1,
    clientGeneratedId: 'd7de2507-f92a-4658-9bdc-f223df991d55',
    astronautId: 1,
    astronautFullName: 'Morgan Vance',
    recordedAt: '2026-11-11T09:00:00Z',
    moodScore: 9,
    stressLevel: 2,
    dominantEmotion: 'Focused & Optimistic',
    notes: 'تركيز ذهني عالٍ واستقرار نفسي ممتاز',
  },
];

const initialRecommendations: Recommendation[] = [
  {
    id: 1,
    astronautId: 1,
    astronautFullName: 'Morgan Vance',
    generatedAt: '2026-11-11T08:00:00Z',
    title: 'ARED High-Resistance Countermeasure Protocol (45 min)',
    titleAr: 'جلسة تمارين المقاومة للحفاظ على الكتلة العضلية (45 دقيقة)',
    content: 'Complete 4 sets of squats and deadlifts on ARED with isotonic hydration.',
    contentAr: 'إتمام 4 مجموعات من تمارين المقاومة مع تعويض السوائل.',
    reason: 'Mitigate bone mineral density loss and cephalad fluid shift in microgravity.',
    reasonAr: 'للحد من فقدان كثافة العظام وتوزيع السوائل في انعدام الجاذبية.',
    category: 'Physical',
    priority: 'High',
    status: 'Pending',
  },
  {
    id: 2,
    astronautId: 1,
    astronautFullName: 'Morgan Vance',
    generatedAt: '2026-11-10T20:00:00Z',
    title: 'Blue-Enriched LED Circadian Shift',
    titleAr: 'تهدئة الإضاءة قبل موعد النوم بـ 90 دقيقة',
    content: 'Switch habitat lighting to warm spectrum 90 minutes prior to sleep window.',
    contentAr: 'تحويل إضاءة المقصورة إلى الطيف الدافئ قبل النوم لتحسين جودة النوم.',
    reason: 'Preserve endogenous melatonin secretion against 16 orbital sunrises/day.',
    reasonAr: 'للحفاظ على انتظام الساعة البيولوجية وإفراز الميلاتونين.',
    category: 'Sleep',
    priority: 'Medium',
    status: 'Acknowledged',
  },
];

const initialChatMessages: ChatMessage[] = [];

const initialCrewMembers: CrewMemberStatus[] = [
  {
    id: 1,
    astronautCode: 'AST-001',
    fullName: 'Morgan Vance',
    fullNameAr: 'مورغان فانس',
    email: 'morgan.vance@mission.space',
    missionId: 1,
    missionName: 'Ares III Expedition',
    bloodType: 'O+',
    isActive: true,
    overallStatus: 'Routine',
    activeAlertsCount: 0,
    hr: 72,
    spo2: 98,
    bp: '118/76',
    temp: 36.6,
    lastSyncAt: '2026-11-11T16:35:00Z',
  },
  {
    id: 2,
    astronautCode: 'AST-002',
    fullName: 'Jordan Lee',
    fullNameAr: 'جوردان لي',
    email: 'jordan.lee@mission.space',
    missionId: 1,
    missionName: 'Ares III Expedition',
    bloodType: 'A+',
    isActive: true,
    overallStatus: 'Routine',
    activeAlertsCount: 0,
    hr: 68,
    spo2: 99,
    bp: '115/74',
    temp: 36.7,
    lastSyncAt: '2026-11-11T16:30:00Z',
  },
  {
    id: 3,
    astronautCode: 'AST-003',
    fullName: 'Taylor Quinn',
    fullNameAr: 'تايلور كوين',
    email: 'taylor.quinn@mission.space',
    missionId: 1,
    missionName: 'Ares III Expedition',
    bloodType: 'B+',
    isActive: true,
    overallStatus: 'MedicalAttention',
    activeAlertsCount: 1,
    hr: 104,
    spo2: 96,
    bp: '128/84',
    temp: 37.2,
    lastSyncAt: '2026-11-11T16:28:00Z',
  },
];

const initialMissions: MissionInfo[] = [
  {
    id: 1,
    code: 'ARES-III',
    name: 'Ares III Expedition',
    nameAr: 'مهمة أريس 3 الاستكشافية',
    destination: 'Mars - Acidalia Planitia',
    destinationAr: 'المريخ - سهل أسيداليا',
    startDate: '2026-01-15',
    endDate: '2026-12-15',
    status: 'Active',
    crewIds: [1, 2, 3],
  },
];

const initialOfflineQueue: OfflineSyncItem[] = [
  {
    clientGeneratedId: 'f9a8b7c6-9001-4000-8000-111122223331',
    itemType: 'VitalSign',
    summary: 'HR: 72 bpm, SpO2: 98%',
    recordedAt: '2026-11-11T16:30:00Z',
    syncStatus: 'Pending',
  },
  {
    clientGeneratedId: 'f9a8b7c6-9002-4000-8000-111122223332',
    itemType: 'SleepRecord',
    summary: '7.75h (95.7%)',
    recordedAt: '2026-11-11T06:30:00Z',
    syncStatus: 'Pending',
  },
];

const initialAstronautProfile: AstronautProfileData = {
  id: 1,
  astronautCode: 'AST-001',
  firstName: 'Morgan',
  lastName: 'Vance',
  fullName: 'Morgan Vance',
  dateOfBirth: '1988-05-12',
  gender: 'Non-binary',
  bloodType: 'O+',
  heightCm: 175,
  weightKg: 70,
  emergencyContactInfo: 'Houston Flight Crew Medical Desk (+1-281-483-0123)',
  missionId: 1,
  missionName: 'Ares III Expedition',
};

const accountCredentials: Record<
  string,
  { password: string; role: 'Astronaut' | 'Monitor'; code: string; astronautId: number }
> = {
  'astro.vance': {
    password: 'Astro#2026!Vance',
    role: 'Astronaut',
    code: 'AST-001',
    astronautId: 1,
  },
  'astro.lee': {
    password: 'Astro#2026!Vance',
    role: 'Astronaut',
    code: 'AST-002',
    astronautId: 2,
  },
  'astro.quinn': {
    password: 'Astro#2026!Vance',
    role: 'Astronaut',
    code: 'AST-003',
    astronautId: 3,
  },
  'monitor.rivera': {
    password: 'Monitor#2026!Rivera',
    role: 'Monitor',
    code: 'MONITOR',
    astronautId: 1,
  },
};

export const CLINICAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: 'nominal',
    titleAr: 'الحالة المستقرة النموذجية',
    titleEn: 'Nominal Baseline State',
    subtitleAr: 'مؤشرات فسيولوجية مثالية مستقرة داخل المقصورة',
    subtitleEn: 'Optimal resting biometrics within pressurized habitat',
    descriptionAr:
      'جميع العلامات الحيوية ضمن النطاقات الخضراء لرواد الفضاء، استقرار تام في التوازن الأكسجيني والدورة الدموية.',
    descriptionEn:
      'All vitals within green nominal aerospace ranges, full hemodynamic and metabolic stability.',
    category: 'Routine',
    severity: 'Routine',
    targetVitals: {
      hr: 72,
      spo2: 98,
      bpSystolic: 118,
      bpDiastolic: 76,
      temp: 36.6,
      resp: 15,
      glucose: 88,
    },
    symptomsAr: ['لا توجد أعراض مرضية', 'حالة يقظة وتركيز ذهني ممتازة', 'استقرار حركي وتكيف حسي متكامل'],
    symptomsEn: ['No pathological symptoms', 'Sharp cognitive readiness', 'Full vestibular adaptation'],
    diagnosisAr: 'استقرار فسيولوجي نموذجي — جاهزية تامة لتنفيذ المهام المدارية (Flight Ready Nominal)',
    diagnosisEn: 'Nominal Physiological Equilibrium — Full Mission Task Readiness',
    clinicalActionsAr: [
      'مواصلة الجدول الروتيني للمهمة',
      'تسجيل القياسات الدورية كالمعتاد',
      'الحفاظ على الإماهة الطبيعية 2.5 لتر/يوم',
    ],
    clinicalActionsEn: [
      'Continue nominal timeline',
      'Periodic routine telemetry logging',
      'Standard 2.5L daily hydration',
    ],
    flightSurgeonDirectiveAr: 'طبيب الرحلة: المؤشرات في أفضل مستوياتها، استمر في جدول العمل اليومي المعتمد.',
    flightSurgeonDirectiveEn: 'Flight Surgeon: Biometrics optimal. Cleared for all scheduled operations.',
  },
  {
    id: 'eva_sortie',
    titleAr: 'نشاط خارج المركبة (EVA Spacewalk)',
    titleEn: 'Extravehicular Activity (EVA Sortie)',
    subtitleAr: 'جهد بدني واستقلابي فائق داخل بذلة الفضاء EMU',
    subtitleEn: 'Intense metabolic workload inside Extravehicular Mobility Unit',
    descriptionAr:
      'ارتفاع كبير في معدل الأيض واستهلاك الأكسجين نتيجة مقاومة ضغط البذلة وانعدام الوزن أثناء العمل الخارجي.',
    descriptionEn:
      'Significant metabolic surge and oxygen consumption countering EMU suit pressure resistance during spacewalk.',
    category: 'Exertion',
    severity: 'MedicalAttention',
    targetVitals: {
      hr: 128,
      spo2: 95,
      bpSystolic: 136,
      bpDiastolic: 88,
      temp: 37.4,
      resp: 22,
      glucose: 94,
    },
    symptomsAr: [
      'إجهاد عضلي في الساعدين والكتفين',
      'ضيق تنفس جهدي متوسط',
      'فرط تعرق واحترار داخل خوذة البذلة',
      'جفاف الفم والحاجة للسوائل',
    ],
    symptomsEn: [
      'Forearm & shoulder muscular strain',
      'Moderate exertional dyspnea',
      'Heavy perspiration & thermal load',
      'Mild xerostomia (dry mouth)',
    ],
    diagnosisAr: 'إجهاد بدني واستقلابي ناتج عن نشاط السير الفضائي (High Metabolic EVA Exertion Strain)',
    diagnosisEn: 'High Metabolic EVA Exertion Strain & Elevated Thermal Storage',
    clinicalActionsAr: [
      'رفع معدل تدفق سائل التبريد في البذلة (LCVG Coolant Flow Max)',
      'التوقف عن الحركة لمدة 5 دقائق لخفض الحمل القلبي دون 100 bpm',
      'تناول 400 مل من كيس الشرب المدمج داخل البذلة (In-suit Drink Bag)',
      'فحص مستويات ثاني أكسيد الكربون (CO2 Scrubber Sensor)',
    ],
    clinicalActionsEn: [
      'Maximize Liquid Cooling & Ventilation Garment (LCVG) flow',
      '5-minute work halt to restore heart rate below 100 bpm',
      'Hydrate via In-suit Drink Bag (400ml)',
      'Verify CO2 scrubber canister levels',
    ],
    flightSurgeonDirectiveAr:
      'طبيب الرحلة: نلاحظ ارتفاع معدل النبض إلى 128؛ خذ فترة راحة في مكانك لمدة 5 دقائق وارفع تبريد البذلة.',
    flightSurgeonDirectiveEn:
      'Flight Surgeon: Exertion index elevated at 128 bpm; pause translation and increase LCVG cooling.',
  },
  {
    id: 'hypoxia',
    titleAr: 'نقص الأكسجين وانخفاض ضغط الكابينة',
    titleEn: 'Acute Hypoxia & Depressurization Hazard',
    subtitleAr: 'هبوط حرج في الضغط الجزئي للأكسجين مع تسرع قلبي تعويضي',
    subtitleEn: 'Critical drop in oxygen saturation with compensatory tachycardia',
    descriptionAr:
      'حالة طارئة خطيرة ناتجة عن تسريب ضغط هوائي أو خلل في أنظمة دعم الحياة ECLSS تؤدي لنقص أكسجة حرج.',
    descriptionEn:
      'Critical emergency caused by cabin depressurization or ECLSS failure, triggering severe hypoxemia.',
    category: 'CriticalEmergency',
    severity: 'Emergency',
    targetVitals: {
      hr: 116,
      spo2: 87,
      bpSystolic: 104,
      bpDiastolic: 64,
      temp: 36.4,
      resp: 26,
      glucose: 82,
    },
    symptomsAr: [
      'دوار حاد وعدم اتزان',
      'رؤية نفقية وتشوش بصري',
      'بطء التفكير وصعوبة التركيز',
      'زرقة طفيفة في أطراف الأصابع',
    ],
    symptomsEn: [
      'Acute dizziness & vertigo',
      'Tunnel vision & visual blur',
      'Cognitive slowdown & impairment',
      'Peripheral cyanosis on nail beds',
    ],
    diagnosisAr:
      'نقص تأكسج دم حاد حرج ناتج عن نقص الأكسجين الجزئي (Acute Hypoxemia - Emergent Cabin Decompression)',
    diagnosisEn:
      'Acute Hypoxemia & Compensatory Tachycardia secondary to Cabin Depressurization',
    clinicalActionsAr: [
      'ارتداء قناع الأكسجين الطارئ فوراً بنسبة تدفق 100% O2',
      'إحكام إغلاق خوذة ومفاصل بذلة الضغط والتحقق من صمام الأمان',
      'إعلان حالة إنذار طوارئ حمراء لمركز التحكم وتفعيل بروتوكول العزل',
      'الجلوس في مقعد التثبيت لمنع السقوط أو فقدان الوعي الفجائي',
    ],
    clinicalActionsEn: [
      'Don emergency oxygen mask immediately with 100% O2 flow',
      'Seal pressure suit helmet & lock visors',
      'Broadcast Red Emergency Alert to Mission Control',
      'Secure in crew couch to prevent impact from sudden syncope',
    ],
    flightSurgeonDirectiveAr:
      'طبيب الرحلة — إنذار أحمر طارئ: تشبع الأكسجين 87%! ارتدِ قناع الأكسجين فوراً وتوقف عن أي نشاط!',
    flightSurgeonDirectiveEn:
      'Flight Surgeon — RED EMERGENCY ALERT: SpO2 at 87%! Don emergency O2 mask immediately!',
  },
  {
    id: 'sas_sickness',
    titleAr: 'متلازمة دوار الفضاء والتكيف الحسي (SAS)',
    titleEn: 'Space Adaptation Syndrome (SAS)',
    subtitleAr: 'اضطراب الدهليز العصبي وصعود سوائل الجسم للرأس',
    subtitleEn: 'Neuro-vestibular conflict with cephalic fluid redistribution',
    descriptionAr:
      'رد فعل شائع خلال الأيام الأولى من دخول المدار ناجم عن تعارض إشارات الأذن الداخلية مع حاسة البصر.',
    descriptionEn:
      'Neuro-vestibular conflict where otolith organs fail to sense gravitational vectors, paired with fluid shifts.',
    category: 'Adaptation',
    severity: 'MedicalAttention',
    targetVitals: {
      hr: 84,
      spo2: 98,
      bpSystolic: 132,
      bpDiastolic: 86,
      temp: 36.8,
      resp: 17,
      glucose: 86,
    },
    symptomsAr: [
      'غثيان متكرر وفقدان الشهية',
      'صداع احتقاني وضغط في الجيوب الأنفية',
      'دوار فوري عند تدوير الرأس بسرعة',
      'خمول وحساسية للضوء',
    ],
    symptomsEn: [
      'Recurrent nausea & anorexia',
      'Congestive headache from cephalic fluid shift',
      'Motion illusion on head roll/pitch',
      'Lethargy & photophobia',
    ],
    diagnosisAr:
      'متلازمة التكيف مع الجاذبية الصغرى الدرجة 2 (Space Adaptation Syndrome - Grade 2 Vestibular Malaise)',
    diagnosisEn:
      'Space Adaptation Syndrome (SAS) - Grade 2 Vestibular Malaise & Cephalic Fluid Shift',
    clinicalActionsAr: [
      'تثبيت الرأس وتجنب الحركات الزاوية السريعة (Pitch/Yaw avoidance)',
      'تناول جرعة مضاد دوار (بروميثازين 25 ملغ حسب التوجيه الطبي)',
      'ارتداء حزام الضغط البطني للحد من احتقان الرأس',
      'شرب رشفات صغيرة متكررة من الماء مع أملاح الكهارل',
    ],
    clinicalActionsEn: [
      'Stabilize head, minimize rapid pitch/yaw head movements',
      'Administer Promethazine 25mg antiemetic countermeasure as directed',
      'Adjust cabin foot restraints to anchor body position',
      'Small sips of electrolyte fluid to prevent hypovolemic dehydration',
    ],
    flightSurgeonDirectiveAr:
      'طبيب الرحلة: أعراض تكيف دهليزي معتادة في هذه المرحلة؛ ثبت رأسك وتناول جرعة التهدئة الدوائية المقررة.',
    flightSurgeonDirectiveEn:
      'Flight Surgeon: Classic neuro-vestibular adaptation. Restrict head rotations and take scheduled antiemetic.',
  },
  {
    id: 'countermeasure_exercise',
    titleAr: 'حصة تمارين وقائية مكثفة (T2 Treadmill)',
    titleEn: 'Intense Countermeasure Exercise (T2/ARED)',
    subtitleAr: 'بروتوكول حماية العضلات وكثافة العظام في الجاذبية الصغرى',
    subtitleEn: 'Musculoskeletal & cardiovascular conditioning under bungee load',
    descriptionAr:
      'جلسة تدريب عالية الشدة باستخدام جهاز السير وأشرطة السحب لإنتاج جاذبية اصطناعية ومنع ضمور العظام.',
    descriptionEn:
      'High-intensity conditioning under bungee-harness tethering to preserve bone mineral density.',
    category: 'Exertion',
    severity: 'Routine',
    targetVitals: {
      hr: 148,
      spo2: 97,
      bpSystolic: 144,
      bpDiastolic: 84,
      temp: 37.3,
      resp: 25,
      glucose: 90,
    },
    symptomsAr: [
      'تسارع نبض فسيولوجي صحي',
      'تعرق غزير وإجهاد بدني نشط',
      'احمرار الوجه مع تدفق الدم للعضلات',
    ],
    symptomsEn: [
      'Healthy physiological tachycardia',
      'Profuse perspiration & muscular exertion',
      'Facial flushing with muscle perfusion',
    ],
    diagnosisAr:
      'استجابة قلبية وعائية مثالية للتمارين الفضائية الوقائية (Nominal Peak Aerobic Countermeasure Response)',
    diagnosisEn:
      'Nominal Peak Aerobic Countermeasure Response — Cardiovascular Conditioning Target Reached',
    clinicalActionsAr: [
      'الحفاظ على وتيرة الجري لـ 30 دقيقة ضمن النطاق التدريبي المستهدف',
      'مراقبة نبض القلب لضمان عدم تجاوزه الحد الأقصى الآمن (165 bpm)',
      'التهدئة التدريجية (Cool-down) لمدة 5 دقائق قبل فك الأحزمة',
      'شرب 750 مل من السوائل المعززة بالشوارد بعد انتهاء الجلسة',
    ],
    clinicalActionsEn: [
      'Maintain running pace for 30 minutes in target aerobic zone',
      'Monitor telemetry to ensure HR remains below 165 bpm ceiling',
      '5-minute gradual cool-down prior to harness release',
      'Consume 750ml electrolyte fluid post-session',
    ],
    flightSurgeonDirectiveAr:
      'طبيب الرحلة: أداء ممتاز، معدل النبض 148 ضمن النطاق المستهدف لبناء القدرة القلبية. ابدأ التهدئة بعد 5 دقائق.',
    flightSurgeonDirectiveEn:
      'Flight Surgeon: Outstanding aerobic output; pulse at 148 is right in target zone. Begin cool-down in 5 mins.',
  },
  {
    id: 'deep_sleep',
    titleAr: 'الراحة العميقة والنوم الساكن (Deep Sleep)',
    titleEn: 'Deep Slow-Wave Sleep & Circadian Recovery',
    subtitleAr: 'هدوء باراسمبثاوي واستشفاء بيولوجي في كيس النوم المداري',
    subtitleEn: 'Parasympathetic tone & circadian cellular restoration in sleep pod',
    descriptionAr:
      'مرحلة النوم العميق داخل كيس النوم المثبت، حيث تنخفض معدلات الأيض والنبض لإعادة بناء الأنسجة.',
    descriptionEn:
      'Deep slow-wave restorative sleep inside sleep cabin; basal metabolic rate with minimal workload.',
    category: 'Recovery',
    severity: 'Routine',
    targetVitals: {
      hr: 54,
      spo2: 99,
      bpSystolic: 106,
      bpDiastolic: 68,
      temp: 36.3,
      resp: 11,
      glucose: 78,
    },
    symptomsAr: [
      'لا توجد أعراض — استرخاء عضلي وعصبي تام',
      'تنفس بطيء ومنتظم',
      'استجابة بيولوجية ترميمية ممتازة',
    ],
    symptomsEn: [
      'No symptoms — full neuromusculoskeletal relaxation',
      'Slow, rhythmic diaphragmatic breathing',
      'Peak circadian cellular repair',
    ],
    diagnosisAr:
      'استشفاء بيولوجي ونوم عميق نموذجي (Optimal Slow-Wave Parasympathetic Sleep)',
    diagnosisEn:
      'Optimal Restorative Slow-Wave Sleep & Parasympathetic Dominance',
    clinicalActionsAr: [
      'الحفاظ على تدفق هواء المقصورة الهادئ لمنع تجمع ثاني أكسيد الكربون حول الرأس',
      'إبقاء سدادات الأذن وأقنعة العين لحجب الضوء وضوضاء مراوح المحطة',
      'عدم مقاطعة دورة النوم إلا في حالات الإنذارات الحرجة للمحطة',
    ],
    clinicalActionsEn: [
      'Ensure continuous cabin ventilation fan to prevent CO2 pocket formation',
      'Maintain earplugs and sleep mask to mitigate ISS acoustic levels',
      'Maintain silent telemetry monitoring without waking crew member',
    ],
    flightSurgeonDirectiveAr:
      'طبيب الرحلة: مؤشرات الراحة مثالية ومعدل النبض 54 يدل على نوم عميق ومريح. مستمرون في المراقبة الصامتة.',
    flightSurgeonDirectiveEn:
      'Flight Surgeon: Biometrics nominal; 54 bpm indicates restorative deep sleep. Quiet monitoring active.',
  },
];

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vitals, setVitals] = useState(initialVitals);
  const [vitalsLog, setVitalsLog] = useState<VitalSignReading[]>(initialVitalsLog);
  const [heartRateHistory, setHeartRateHistory] = useState<HeartRateTimePoint[]>(initialHistory);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(initialSleepRecords);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(initialMoodEntries);
  const [recommendations, setRecommendations] =
    useState<Recommendation[]>(initialRecommendations);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [selectedChatAstronautId, setSelectedChatAstronautId] = useState<number>(1);
  const [crewMembers, setCrewMembers] = useState<CrewMemberStatus[]>(initialCrewMembers);
  const [missions, setMissions] = useState<MissionInfo[]>(initialMissions);
  const [offlineQueue, setOfflineQueue] = useState<OfflineSyncItem[]>(initialOfflineQueue);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentRole, setCurrentRoleState] = useState<'Astronaut' | 'Monitor'>('Astronaut');
  const [activeAccount, setActiveAccount] = useState<string>('astro.vance');
  const [currentUserName, setCurrentUserName] = useState<string>('Morgan Vance');
  const [currentAstronautId, setCurrentAstronautId] = useState<number | null>(1);
  const [astronautProfile, setAstronautProfile] =
    useState<AstronautProfileData>(initialAstronautProfile);
  const [activeScenario, setActiveScenario] = useState<ClinicalScenario>(CLINICAL_SCENARIOS[0]);
  const [isLivePulsing, setIsLivePulsing] = useState<boolean>(true);
  const [lastTelemetryBeatAt, setLastTelemetryBeatAt] = useState<string>(new Date().toISOString());

  const toggleLivePulsing = () => {
    setIsLivePulsing((prev) => !prev);
  };

  const activateScenario = (scenarioId: ScenarioId) => {
    const sc = CLINICAL_SCENARIOS.find((s) => s.id === scenarioId) || CLINICAL_SCENARIOS[0];
    setActiveScenario(sc);

    // 1. Update Vitals state with targeted scenario physiological values
    setVitals((prev) => ({
      ...prev,
      HR: {
        ...prev.HR,
        value: sc.targetVitals.hr.toString(),
        status:
          sc.targetVitals.hr > 120
            ? 'MedicalAttention'
            : sc.targetVitals.hr < 50
            ? 'MedicalAttention'
            : 'Routine',
        progressPercent: Math.min(100, Math.round((sc.targetVitals.hr / 160) * 100)),
      },
      SPO2: {
        ...prev.SPO2,
        value: `${sc.targetVitals.spo2}%`,
        status:
          sc.targetVitals.spo2 < 90
            ? 'Emergency'
            : sc.targetVitals.spo2 < 95
            ? 'MedicalAttention'
            : 'Routine',
        progressPercent: sc.targetVitals.spo2,
      },
      BP: {
        ...prev.BP,
        value: `${sc.targetVitals.bpSystolic}/${sc.targetVitals.bpDiastolic}`,
        status:
          sc.targetVitals.bpSystolic > 140 || sc.targetVitals.bpSystolic < 105
            ? 'MedicalAttention'
            : 'Routine',
      },
      TEMP: {
        ...prev.TEMP,
        value: `${sc.targetVitals.temp}°C`,
        status: sc.targetVitals.temp > 37.5 ? 'MedicalAttention' : 'Routine',
      },
      RESP: {
        ...prev.RESP,
        value: sc.targetVitals.resp.toString(),
        status:
          sc.targetVitals.resp > 24
            ? 'Emergency'
            : sc.targetVitals.resp > 20
            ? 'MedicalAttention'
            : 'Routine',
      },
      GLUCOSE: {
        ...prev.GLUCOSE,
        value: sc.targetVitals.glucose.toString(),
        status: 'Routine',
      },
    }));

    // 2. Append point to Heart Rate History for live chart visualization
    setHeartRateHistory((prev) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newPoint: HeartRateTimePoint = {
        timeLabelAr: timeStr,
        timeLabelEn: timeStr,
        value: sc.targetVitals.hr,
        recordedAt: now.toISOString(),
      };
      const updated = [...prev, newPoint];
      return updated.slice(-10);
    });

    // 3. System Alert Integration (ترابط الجذور في كامل المنظومة)
    if (sc.severity === 'Emergency') {
      const emergencyAlert: HealthAlert = {
        id: Date.now(),
        astronautId: currentAstronautId || 1,
        astronautName: currentUserName || 'Morgan Vance',
        title: sc.titleAr,
        message: `${sc.subtitleAr}. تشبع الأكسجين: ${sc.targetVitals.spo2}%، النبض: ${sc.targetVitals.hr} bpm. ${sc.flightSurgeonDirectiveAr}`,
        severity: 'Emergency',
        status: 'Active',
        vitalSignTypeCode: 'SPO2',
        triggeredAt: new Date().toISOString(),
      };
      setAlerts((prev) => [emergencyAlert, ...prev.filter((a) => a.title !== sc.titleAr)]);
    } else if (sc.severity === 'MedicalAttention') {
      const warnAlert: HealthAlert = {
        id: Date.now(),
        astronautId: currentAstronautId || 1,
        astronautName: currentUserName || 'Morgan Vance',
        title: sc.titleAr,
        message: `${sc.subtitleAr}. النبض: ${sc.targetVitals.hr} bpm، الضغط: ${sc.targetVitals.bpSystolic}/${sc.targetVitals.bpDiastolic}.`,
        severity: 'MedicalAttention',
        status: 'Active',
        vitalSignTypeCode: 'HR',
        triggeredAt: new Date().toISOString(),
      };
      setAlerts((prev) => [warnAlert, ...prev.filter((a) => a.title !== sc.titleAr)]);
    } else {
      // Nominal or sleep resolves active emergency alarms
      setAlerts((prev) =>
        prev.map((a) =>
          a.status === 'Active'
            ? {
                ...a,
                status: 'Resolved',
                resolvedAt: new Date().toISOString(),
                resolutionNotes: 'عادت المؤشرات الحيوية للاستقرار الطبيعي بعد تفعيل السيناريو المستقر',
              }
            : a
        )
      );
    }

    // 4. Recommendation Integration (ترابط التوصيات السريرية)
    const customRec: Recommendation = {
      id: Date.now(),
      astronautId: currentAstronautId || 1,
      astronautFullName: currentUserName || 'Morgan Vance',
      category:
        sc.category === 'CriticalEmergency'
          ? 'Medical'
          : sc.category === 'Recovery'
          ? 'Sleep'
          : 'Physical',
      title: sc.titleEn,
      titleAr: `بروتوكول سريري: ${sc.titleAr}`,
      content: sc.clinicalActionsEn[0] || sc.flightSurgeonDirectiveEn,
      contentAr: `${sc.flightSurgeonDirectiveAr} الإجراء الميداني الفوري: ${sc.clinicalActionsAr
        .slice(0, 2)
        .join(' | ')}`,
      reason: sc.diagnosisEn,
      reasonAr: sc.diagnosisAr,
      priority:
        sc.severity === 'Emergency'
          ? 'High'
          : sc.severity === 'MedicalAttention'
          ? 'Medium'
          : 'Low',
      generatedAt: new Date().toISOString(),
      status: 'Pending',
    };
    setRecommendations((prev) => [customRec, ...prev.filter((r) => r.titleAr !== customRec.titleAr)]);

    // 5. Update crew members for doctor / ground monitoring console
    setCrewMembers((prev) =>
      prev.map((c) =>
        c.id === (currentAstronautId || 1)
          ? {
              ...c,
              hr: sc.targetVitals.hr,
              spo2: sc.targetVitals.spo2,
              bp: `${sc.targetVitals.bpSystolic}/${sc.targetVitals.bpDiastolic}`,
              temp: sc.targetVitals.temp,
              overallStatus: sc.severity,
              lastSyncAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  // Live continuous telemetry oscillation loop (حيوية ونبض التيليمتري الحقيقي)
  useEffect(() => {
    if (!isLivePulsing) return;

    const timer = setInterval(() => {
      setLastTelemetryBeatAt(new Date().toISOString());

      // Realistic micro-fluctuation around target vitals
      setVitals((prev) => {
        const baseHr = activeScenario.targetVitals.hr;
        const jitterHr = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        const liveHr = Math.max(45, Math.min(180, baseHr + jitterHr));

        const baseResp = activeScenario.targetVitals.resp;
        const jitterResp = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const liveResp = Math.max(8, Math.min(35, baseResp + jitterResp));

        return {
          ...prev,
          HR: {
            ...prev.HR,
            value: liveHr.toString(),
          },
          RESP: {
            ...prev.RESP,
            value: liveResp.toString(),
          },
        };
      });
    }, 2400);

    return () => clearInterval(timer);
  }, [isLivePulsing, activeScenario]);

  const setCurrentRole = (role: 'Astronaut' | 'Monitor') => {
    setCurrentRoleState(role);
    setActiveAccount(role === 'Monitor' ? 'monitor.rivera' : 'astro.vance');
    if (role === 'Astronaut') {
      setCurrentAstronautId(1);
      setSelectedChatAstronautId(1);
    } else {
      setCurrentAstronautId(null);
      setSelectedChatAstronautId(1);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network error on logout
    }
    await signalRService.disconnect();
    api.clearTokens();
    setIsAuthenticated(false);
    setActiveAccount('');
    setCurrentUserName('');
    setCurrentRoleState('Astronaut');
    setCurrentAstronautId(null);
    setChatMessages([]);
  };

  const login = async (
    username: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const meta = accountCredentials[username];
      const primaryPwd = password || meta?.password || 'Astro#2026!Vance';

      let res: any;
      try {
        res = await api.login(username, primaryPwd);
      } catch (firstErr: any) {
        // Fallback retry with alternative known seed passwords
        const fallbacks = [
          'Astro#2026!Vance',
          'Monitor#2026!Rivera',
          'Astro123!Vance',
          'Astro123!Lee',
          'Astro123!Quinn',
          'Monitor123!Rivera',
        ].filter((p) => p !== primaryPwd);

        let recovered = false;
        for (const fb of fallbacks) {
          try {
            res = await api.login(username, fb);
            recovered = true;
            break;
          } catch {
            // keep trying
          }
        }
        if (!recovered) {
          throw firstErr;
        }
      }

      const resolvedRole = (res?.role as 'Astronaut' | 'Monitor') || meta?.role || 'Astronaut';
      const resolvedName = res?.fullName || meta?.code || username;
      const resolvedAstroId =
        res?.astronautId != null
          ? res.astronautId
          : resolvedRole === 'Astronaut'
          ? meta?.astronautId || 1
          : null;

      setIsAuthenticated(true);
      setActiveAccount(username);
      setCurrentRoleState(resolvedRole);
      setCurrentUserName(resolvedName);
      setCurrentAstronautId(resolvedAstroId);
      if (resolvedAstroId) {
        setSelectedChatAstronautId(resolvedAstroId);
      }

      await signalRService.connect();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login failed' };
    }
  };

  const switchAccount = async (username: string): Promise<boolean> => {
    await logout();
    const res = await login(username);
    return res.success;
  };

  const formatCardValue = (code: VitalCode, val: number): string => {
    if (code === 'SPO2') return `${val}%`;
    if (code === 'TEMP') return `${val}°C`;
    return val.toString();
  };

  // Authenticate with Backend JWT, hydrate live database records & connect SignalR
  useEffect(() => {
    let mounted = true;
    const bootstrapBackendSession = async () => {
      try {
        const meta = accountCredentials[activeAccount] || accountCredentials['astro.vance'];
        const authRes = await api.login(activeAccount, meta.password);
        if (!mounted) return;

        if (authRes?.fullName) {
          setCurrentUserName(authRes.fullName);
        }

        await signalRService.initConnection();

        if (meta.role === 'Astronaut') {
          const [dash, meProfile, sleepHist, moodHist, allRecs] = await Promise.all([
            api.getDashboardMe().catch(() => null),
            api.getAstronautMe().catch(() => null),
            api.getSleepHistory(1, 20).catch(() => null),
            api.getMoodHistory(1, 20).catch(() => null),
            api.getRecommendations(undefined, false).catch(() => null),
          ]);

          if (meProfile && mounted) {
            setAstronautProfile({
              id: meProfile.id,
              astronautCode: meProfile.astronautCode,
              firstName: meProfile.firstName,
              lastName: meProfile.lastName,
              fullName: meProfile.fullName,
              dateOfBirth: meProfile.dateOfBirth?.slice(0, 10) || '1988-05-12',
              gender: meProfile.gender,
              bloodType: meProfile.bloodType,
              heightCm: meProfile.heightCm,
              weightKg: meProfile.weightKg,
              emergencyContactInfo: meProfile.emergencyContactInfo,
              missionId: meProfile.missionId,
              missionName: meProfile.missionName || 'Ares III Expedition',
            });
          }

          if (dash && mounted) {
            if (Array.isArray(dash.recentVitals) && dash.recentVitals.length > 0) {
              setVitalsLog(dash.recentVitals);
              setVitals((prev) => {
                const next = { ...prev };
                dash.recentVitals.forEach((reading: VitalSignReading) => {
                  const code = reading.vitalSignTypeCode as VitalCode;
                  if (next[code]) {
                    next[code] = {
                      ...next[code],
                      value: formatCardValue(code, reading.value),
                      secondaryValue:
                        reading.secondaryValue != null
                          ? reading.secondaryValue.toString()
                          : next[code].secondaryValue,
                      status: reading.status,
                    };
                  }
                });
                return next;
              });
            }
            if (Array.isArray(dash.activeAlerts)) {
              setAlerts(dash.activeAlerts);
            }
          }

          const sleepItems = Array.isArray(sleepHist?.items) ? sleepHist.items : null;
          if (sleepItems && sleepItems.length > 0 && mounted) {
            setSleepRecords(sleepItems);
          }

          const moodItems = Array.isArray(moodHist?.items) ? moodHist.items : null;
          if (moodItems && moodItems.length > 0 && mounted) {
            setMoodEntries(moodItems);
          }

          if (Array.isArray(allRecs) && allRecs.length > 0 && mounted) {
            setRecommendations(
              allRecs.map((r: any) => ({
                ...r,
                titleAr: r.titleAr || r.title,
                contentAr: r.contentAr || r.content,
                reasonAr: r.reasonAr || r.reason,
              }))
            );
          }
        } else {
          const [monDash, apiMissions, apiAlerts, allRecs] = await Promise.all([
            api.getMonitorDashboard().catch(() => null),
            api.getMissions().catch(() => null),
            api.getAlerts().catch(() => null),
            api.getRecommendations(undefined, false).catch(() => null),
          ]);

          if (monDash && mounted && Array.isArray(monDash.crewSummaries)) {
            setCrewMembers((prev) =>
              monDash.crewSummaries.map((c: any, idx: number) => {
                const hrV = c.latestVitals?.find((v: any) => v.vitalSignTypeCode === 'HR');
                const spo2V = c.latestVitals?.find((v: any) => v.vitalSignTypeCode === 'SPO2');
                const bpV = c.latestVitals?.find((v: any) => v.vitalSignTypeCode === 'BP');
                const tempV = c.latestVitals?.find((v: any) => v.vitalSignTypeCode === 'TEMP');
                const fallback = prev[idx] || prev[0];
                return {
                  id: c.astronautId,
                  astronautCode: c.astronautCode,
                  fullName: c.fullName,
                  fullNameAr: fallback?.fullNameAr || c.fullName,
                  email: fallback?.email || `${c.astronautCode.toLowerCase()}@mission.space`,
                  missionId: 1,
                  missionName: c.missionName || 'Ares III Expedition',
                  bloodType: fallback?.bloodType || 'O+',
                  isActive: c.isActive,
                  overallStatus: c.overallStatus || 'Routine',
                  activeAlertsCount: c.activeAlertsCount || 0,
                  hr: hrV ? hrV.value : fallback?.hr || 72,
                  spo2: spo2V ? spo2V.value : fallback?.spo2 || 98,
                  bp: bpV ? `${bpV.value}/${bpV.secondaryValue || 76}` : fallback?.bp || '118/76',
                  temp: tempV ? tempV.value : fallback?.temp || 36.6,
                  lastSyncAt: c.lastReadingRecordedAt || new Date().toISOString(),
                };
              })
            );
          }

          if (Array.isArray(apiMissions) && apiMissions.length > 0 && mounted) {
            setMissions(
              apiMissions.map((m: any) => ({
                id: m.id,
                code: m.code,
                name: m.name,
                nameAr: m.code === 'ARES-III' ? 'مهمة أريس 3 الاستكشافية' : m.name,
                destination: m.destination,
                destinationAr: m.code === 'ARES-III' ? 'المريخ - سهل أسيداليا' : m.destination,
                startDate: m.startDate?.slice(0, 10) || '2026-01-15',
                endDate: m.endDate?.slice(0, 10),
                status: m.status || 'Active',
                crewIds: [1, 2, 3],
              }))
            );
          }

          const alertItems = Array.isArray(apiAlerts?.items) ? apiAlerts.items : apiAlerts;
          if (Array.isArray(alertItems) && mounted) {
            setAlerts(alertItems);
          }

          if (Array.isArray(allRecs) && allRecs.length > 0 && mounted) {
            setRecommendations(
              allRecs.map((r: any) => ({
                ...r,
                titleAr: r.titleAr || r.title,
                contentAr: r.contentAr || r.content,
                reasonAr: r.reasonAr || r.reason,
              }))
            );
          }
        }
      } catch {
        if (mounted) {
          signalRService.initConnection();
        }
      }
    };
    bootstrapBackendSession();

    const unsubAlert = signalRService.onAlertReceived((incomingAlert) => {
      setAlerts((prev) => {
        const idx = prev.findIndex((a) => a.id === incomingAlert.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = incomingAlert;
          return copy;
        }
        return [incomingAlert, ...prev];
      });
    });

    const unsubChat = signalRService.onChatReceived((incomingMsg) => {
      const activeThread =
        currentRole === 'Monitor'
          ? selectedChatAstronautId
          : currentAstronautId || accountCredentials[activeAccount]?.astronautId || 1;

      // STRICT ISOLATION: Only add message if it belongs to the active astronaut conversation thread!
      if (incomingMsg.astronautId === activeThread) {
        setChatMessages((prev) => {
          // If matching optimistic clientGeneratedId exists, update it to server state
          if (incomingMsg.clientGeneratedId) {
            const clientIdx = prev.findIndex(
              (m) => m.clientGeneratedId === incomingMsg.clientGeneratedId
            );
            if (clientIdx >= 0) {
              const copy = [...prev];
              copy[clientIdx] = {
                ...copy[clientIdx],
                id: incomingMsg.id,
                sentAt: incomingMsg.sentAt,
                deliveryState: 'sent',
              };
              return copy;
            }
          }
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;

          const senderName =
            incomingMsg.senderFullName ||
            (incomingMsg.senderRole === 'Monitor'
              ? 'د. كيسي ريفيرا'
              : incomingMsg.astronautFullName || 'رائد فضاء');

          return [
            ...prev,
            {
              id: incomingMsg.id,
              clientGeneratedId: incomingMsg.clientGeneratedId || crypto.randomUUID(),
              astronautId: incomingMsg.astronautId,
              astronautFullName: incomingMsg.astronautFullName,
              senderUserId: incomingMsg.senderUserId,
              senderName,
              senderRole: incomingMsg.senderRole,
              content: incomingMsg.content,
              sentAt: incomingMsg.sentAt,
              isRead: incomingMsg.readAt != null,
              readAt: incomingMsg.readAt,
              deliveryState: 'sent',
            },
          ];
        });
      }
    });

    const unsubChatRead = signalRService.onChatRead((readMsg) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === readMsg.id ||
          (readMsg.clientGeneratedId && m.clientGeneratedId === readMsg.clientGeneratedId)
            ? { ...m, isRead: true, readAt: readMsg.readAt || new Date().toISOString() }
            : m
        )
      );
    });

    return () => {
      mounted = false;
      unsubAlert();
      unsubChat();
      unsubChatRead();
    };
  }, [activeAccount, isAuthenticated, currentRole, selectedChatAstronautId, currentAstronautId]);

  // Load chat messages when selectedChatAstronautId changes
  useEffect(() => {
    if (!isAuthenticated || !activeAccount) {
      setChatMessages([]);
      return;
    }
    let mounted = true;
    const targetId =
      currentRole === 'Monitor'
        ? selectedChatAstronautId
        : currentAstronautId || accountCredentials[activeAccount]?.astronautId || 1;

    api
      .getChatMessages(targetId)
      .then((chatRes) => {
        const chatItems = Array.isArray(chatRes) ? chatRes : chatRes?.items;
        if (Array.isArray(chatItems) && mounted) {
          setChatMessages(
            chatItems.map((m: any) => ({
              id: m.id,
              clientGeneratedId: m.clientGeneratedId || crypto.randomUUID(),
              astronautId: m.astronautId,
              astronautFullName: m.astronautFullName,
              senderUserId: m.senderUserId,
              senderName:
                m.senderFullName ||
                (m.senderRole === 'Monitor'
                  ? 'د. كيسي ريفيرا'
                  : m.astronautFullName || 'رائد فضاء'),
              senderRole: m.senderRole,
              content: m.content,
              sentAt: m.sentAt,
              isRead: m.readAt != null,
              readAt: m.readAt,
              deliveryState: 'sent',
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [selectedChatAstronautId, activeAccount, currentRole, isAuthenticated, currentAstronautId]);

  const overallStatus: VitalSignStatus = (() => {
    const list = Object.values(vitals);
    if (
      list.some((v) => v.status === 'Emergency') ||
      alerts.some((a) => a.severity === 'Emergency' && a.status !== 'Resolved')
    ) {
      return 'Emergency';
    }
    if (
      list.some((v) => v.status === 'MedicalAttention') ||
      alerts.some((a) => a.severity === 'MedicalAttention' && a.status !== 'Resolved')
    ) {
      return 'MedicalAttention';
    }
    return 'Routine';
  })();

  const evaluateReading = (
    code: VitalCode,
    val: number,
    secVal?: number
  ): VitalSignStatus => {
    switch (code) {
      case 'HR':
        if (val < 40 || val > 140) return 'Emergency';
        if (val < 60 || val > 100) return 'MedicalAttention';
        return 'Routine';
      case 'SPO2':
        if (val < 90) return 'Emergency';
        if (val < 95) return 'MedicalAttention';
        return 'Routine';
      case 'BP': {
        const sys = val;
        const dia = secVal ?? 80;
        if (sys > 160 || sys < 70 || dia > 100 || dia < 45) return 'Emergency';
        if (sys < 90 || sys > 120 || dia < 60 || dia > 80) return 'MedicalAttention';
        return 'Routine';
      }
      case 'TEMP':
        if (val < 35.0 || val > 38.5) return 'Emergency';
        if (val < 36.1 || val > 37.2) return 'MedicalAttention';
        return 'Routine';
      case 'GLUCOSE':
        if (val < 50 || val > 200) return 'Emergency';
        if (val < 70 || val > 99) return 'MedicalAttention';
        return 'Routine';
      case 'RESP':
        if (val < 8 || val > 30) return 'Emergency';
        if (val < 12 || val > 18) return 'MedicalAttention';
        return 'Routine';
      default:
        return 'Routine';
    }
  };

  const recordVital = async (payload: CreateVitalReadingPayload) => {
    const status = evaluateReading(
      payload.vitalSignTypeCode,
      payload.value,
      payload.secondaryValue
    );
    const clientGeneratedId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    setVitals((prev) => ({
      ...prev,
      [payload.vitalSignTypeCode]: {
        ...prev[payload.vitalSignTypeCode],
        value: formatCardValue(payload.vitalSignTypeCode, payload.value),
        secondaryValue:
          payload.secondaryValue !== undefined
            ? payload.secondaryValue.toString()
            : prev[payload.vitalSignTypeCode].secondaryValue,
        status,
      },
    }));

    const typeMeta: Record<VitalCode, { id: number; name: string; unit: string }> = {
      HR: { id: 1, name: 'Heart Rate', unit: 'bpm' },
      BP: { id: 2, name: 'Blood Pressure', unit: 'mmHg' },
      SPO2: { id: 3, name: 'Blood Oxygen Saturation', unit: '%' },
      TEMP: { id: 4, name: 'Core Body Temperature', unit: '°C' },
      GLUCOSE: { id: 5, name: 'Blood Glucose', unit: 'mg/dL' },
      RESP: { id: 6, name: 'Respiratory Rate', unit: 'breaths/min' },
    };

    const meta = typeMeta[payload.vitalSignTypeCode];
    const newReading: VitalSignReading = {
      id: Date.now(),
      clientGeneratedId,
      astronautId: astronautProfile.id || 1,
      vitalSignTypeId: meta.id,
      vitalSignTypeCode: payload.vitalSignTypeCode,
      vitalSignTypeName: meta.name,
      value: payload.value,
      secondaryValue: payload.secondaryValue,
      status,
      unit: meta.unit,
      bodyPosition: payload.bodyPosition || 'MicrogravityFloating',
      activityContext: payload.activityContext || 'Resting',
      mealContext: payload.mealContext,
      sensorLocation: payload.sensorLocation || 'Thoracic Biometric Vest',
      measurementMethod: 'Automated Sensor',
      recordedAt: nowIso,
      notes: payload.notes,
    };

    setVitalsLog((prev) => [newReading, ...prev]);

    if (payload.vitalSignTypeCode === 'HR') {
      const now = new Date();
      const hours = now.getHours();
      const ampmAr = hours >= 12 ? 'م' : 'ص';
      const ampmEn = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = hours % 12 || 12;

      setHeartRateHistory((prev) => [
        ...prev.slice(1),
        {
          timeLabelAr: `${formattedHour} ${ampmAr}`,
          timeLabelEn: `${formattedHour} ${ampmEn}`,
          value: payload.value,
          recordedAt: nowIso,
        },
      ]);
    }

    if (status !== 'Routine') {
      const newAlert: HealthAlert = {
        id: Date.now(),
        astronautId: astronautProfile.id || 1,
        astronautName: currentUserName || 'Morgan Vance',
        vitalSignTypeCode: payload.vitalSignTypeCode,
        title:
          status === 'Emergency'
            ? `تنبيه حرج: ${payload.vitalSignTypeCode}`
            : `مؤشر يحتاج متابعة: ${payload.vitalSignTypeCode}`,
        message: `القراءة المسجلة (${payload.value}${
          payload.secondaryValue ? '/' + payload.secondaryValue : ''
        }) خارج النطاق الطبيعي.`,
        severity: status,
        status: 'Active',
        triggeredAt: nowIso,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    if (!isOnline) {
      setOfflineQueue((prev) => [
        {
          clientGeneratedId,
          itemType: 'VitalSign',
          summary: `${payload.vitalSignTypeCode}: ${payload.value}`,
          recordedAt: nowIso,
          syncStatus: 'Pending',
        },
        ...prev,
      ]);
      return;
    }

    try {
      const saved = await api.recordVital(payload);
      if (saved?.id) {
        setVitalsLog((prev) =>
          prev.map((item) =>
            item.clientGeneratedId === clientGeneratedId ? { ...newReading, ...saved } : item
          )
        );
      }
    } catch {
      // Retain local optimistic update
    }
  };

  const recordSleep = async (
    payload: Omit<
      SleepRecord,
      'id' | 'clientGeneratedId' | 'astronautId' | 'astronautFullName' | 'recordedAt'
    >
  ) => {
    const clientGeneratedId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const newRecord: SleepRecord = {
      ...payload,
      id: Date.now(),
      clientGeneratedId,
      astronautId: astronautProfile.id || 1,
      astronautFullName: currentUserName || 'Morgan Vance',
      recordedAt: nowIso,
    };
    setSleepRecords((prev) => [newRecord, ...prev]);

    try {
      await api.recordSleep(newRecord);
    } catch {
      // Retain local update
    }
  };

  const recordMood = async (payload: {
    moodScore: number;
    stressLevel: number;
    dominantEmotion: string;
    notes?: string;
  }) => {
    const clientGeneratedId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const newEntry: MoodEntry = {
      ...payload,
      id: Date.now(),
      clientGeneratedId,
      astronautId: astronautProfile.id || 1,
      astronautFullName: currentUserName || 'Morgan Vance',
      recordedAt: nowIso,
    };
    setMoodEntries((prev) => [newEntry, ...prev]);

    try {
      await api.recordMood(newEntry);
    } catch {
      // Retain local update
    }
  };

  const updateRecommendationStatus = (id: number, newStatus: RecommendationStatus) => {
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: newStatus } : rec))
    );
    api.updateRecommendationStatus(id, newStatus).catch(() => {});
  };

  const createRecommendation = (
    payload: Omit<Recommendation, 'id' | 'generatedAt' | 'status'>
  ) => {
    const newRec: Recommendation = {
      ...payload,
      id: Date.now(),
      generatedAt: new Date().toISOString(),
      status: 'Pending',
    };
    setRecommendations((prev) => [newRec, ...prev]);
    api
      .createRecommendation({
        astronautId: payload.astronautId || 1,
        title: payload.title,
        content: payload.content,
        reason: payload.reason,
        category: payload.category,
        priority: payload.priority,
      })
      .catch(() => {});
  };

  const triggerManualAlert = (
    title: string,
    message: string,
    severity: 'MedicalAttention' | 'Emergency'
  ) => {
    const newAlert: HealthAlert = {
      id: Date.now(),
      astronautId: astronautProfile.id || 1,
      astronautName: currentUserName || 'Morgan Vance',
      title,
      message,
      severity,
      status: 'Active',
      triggeredAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    api
      .triggerManualAlert(title, message, severity, astronautProfile.id || 1)
      .catch(() => {});
  };

  const acknowledgeAlert = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Acknowledged',
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: 'Casey Rivera',
            }
          : a
      )
    );
    api.acknowledgeAlert(id).catch(() => {});
  };

  const resolveAlert = (id: number, notes: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Resolved',
              resolvedAt: new Date().toISOString(),
              resolutionNotes: notes,
            }
          : a
      )
    );
    api.resolveAlert(id, notes).catch(() => {});
  };

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const sendChatMessage = async (
    content: string,
    senderRole?: 'Astronaut' | 'Monitor',
    targetAstronautId?: number,
    recipientName?: string,
    recipientRole?: string
  ) => {
    const role = senderRole || currentRole;
    const astroId =
      targetAstronautId ||
      (role === 'Monitor'
        ? selectedChatAstronautId
        : currentAstronautId || accountCredentials[activeAccount]?.astronautId || 1);

    const clientGenId = crypto.randomUUID();
    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      clientGeneratedId: clientGenId,
      astronautId: astroId,
      senderUserId: activeAccount,
      senderName:
        role === 'Monitor'
          ? 'د. كيسي ريفيرا'
          : currentUserName || 'رائد فضاء',
      senderRole: role,
      recipientName,
      recipientRole,
      content,
      sentAt: new Date().toISOString(),
      isRead: false,
      deliveryState: 'sending',
    };

    const activeThreadId =
      role === 'Monitor'
        ? selectedChatAstronautId
        : currentAstronautId || accountCredentials[activeAccount]?.astronautId || 1;

    if (astroId === activeThreadId) {
      setChatMessages((prev) => [...prev, optimisticMsg]);
    }

    try {
      const savedMsg = await api.sendChatMessage(content, astroId, clientGenId);
      if (savedMsg && savedMsg.id) {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.clientGeneratedId === clientGenId
              ? {
                  ...m,
                  id: savedMsg.id,
                  sentAt: savedMsg.sentAt || m.sentAt,
                  senderUserId: savedMsg.senderUserId || m.senderUserId,
                  deliveryState: 'sent',
                }
              : m
          )
        );
      }
    } catch {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.clientGeneratedId === clientGenId ? { ...m, deliveryState: 'failed' } : m
        )
      );
    }
  };

  const markAllChatRead = () => {
    const nowIso = new Date().toISOString();
    setChatMessages((prev) =>
      prev.map((m) => {
        if (!m.isRead && m.senderRole !== currentRole && m.id < 1000000000) {
          api.markChatMessageRead(m.id).catch(() => {});
          return { ...m, isRead: true, readAt: nowIso };
        }
        return m;
      })
    );
  };

  const provisionAstronaut = (
    fullName: string,
    fullNameAr: string,
    code: string,
    email: string,
    bloodType: string
  ) => {
    const newCrew: CrewMemberStatus = {
      id: Date.now(),
      astronautCode: code,
      fullName,
      fullNameAr: fullNameAr || fullName,
      email,
      missionId: 1,
      missionName: 'Ares III Expedition',
      bloodType,
      isActive: true,
      overallStatus: 'Routine',
      activeAlertsCount: 0,
      hr: 70,
      spo2: 99,
      bp: '116/75',
      temp: 36.6,
      lastSyncAt: new Date().toISOString(),
    };
    setCrewMembers((prev) => [...prev, newCrew]);

    const parts = fullName.trim().split(' ');
    api
      .createAstronaut({
        username: email.split('@')[0] || code.toLowerCase(),
        email,
        initialPassword: 'Astro#2026!Crew',
        astronautCode: code,
        firstName: parts[0] || fullName,
        lastName: parts.slice(1).join(' ') || 'Crew',
        dateOfBirth: '1990-01-01T00:00:00Z',
        gender: 'Unspecified',
        bloodType,
        heightCm: 175,
        weightKg: 72,
        missionId: 1,
      })
      .catch(() => {});
  };

  const updateAstronautProfile = async (
    id: number,
    payload: {
      firstName: string;
      lastName: string;
      bloodType: string;
      heightCm: number;
      weightKg: number;
      emergencyContactInfo?: string;
      missionId?: number;
    }
  ) => {
    const fullName = `${payload.firstName} ${payload.lastName}`.trim();
    setCrewMembers((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              fullName,
              bloodType: payload.bloodType,
              missionId: payload.missionId ?? c.missionId,
            }
          : c
      )
    );
    if (astronautProfile.id === id) {
      setAstronautProfile((prev) => ({
        ...prev,
        ...payload,
        fullName,
      }));
    }
    try {
      await api.updateAstronaut(id, {
        ...payload,
        dateOfBirth: '1988-05-12T00:00:00Z',
        gender: 'Unspecified',
      });
    } catch {
      // Optimistic update retained
    }
  };

  const toggleAstronautActive = (id: number) => {
    setCrewMembers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
    api.deactivateAstronaut(id).catch(() => {});
  };

  const createMission = (
    code: string,
    name: string,
    nameAr: string,
    destination: string,
    destinationAr: string
  ) => {
    const newMission: MissionInfo = {
      id: Date.now(),
      code,
      name,
      nameAr: nameAr || name,
      destination,
      destinationAr: destinationAr || destination,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '2027-06-30',
      status: 'Active',
      crewIds: [1],
    };
    setMissions((prev) => [...prev, newMission]);
    api
      .createMission({
        code,
        name,
        destination,
        startDate: new Date().toISOString(),
        endDate: '2027-06-30T00:00:00Z',
      })
      .catch(() => {});
  };

  const updateMissionStatus = async (
    id: number,
    status: 'Scheduled' | 'Active' | 'Completed' | 'Aborted'
  ) => {
    const target = missions.find((m) => m.id === id);
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (target) {
      try {
        await api.updateMission(id, {
          name: target.name,
          destination: target.destination,
          startDate: new Date(target.startDate).toISOString(),
          endDate: target.endDate ? new Date(target.endDate).toISOString() : null,
          status,
        });
      } catch {
        // Optimistic update retained
      }
    }
  };

  const deleteMissionById = async (id: number) => {
    setMissions((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.deleteMission(id);
    } catch {
      // Optimistic update retained
    }
  };

  const assignCrewToMission = async (missionId: number, astronautId: number) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId && !m.crewIds.includes(astronautId)
          ? { ...m, crewIds: [...m.crewIds, astronautId] }
          : m
      )
    );
    try {
      await api.assignAstronautToMission(missionId, astronautId);
    } catch {
      // Optimistic update retained
    }
  };

  const unassignCrewFromMission = async (missionId: number, astronautId: number) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? { ...m, crewIds: m.crewIds.filter((id) => id !== astronautId) }
          : m
      )
    );
    try {
      await api.unassignAstronautFromMission(missionId, astronautId);
    } catch {
      // Optimistic update retained
    }
  };

  const executeOfflineSyncBatch = async () => {
    const nowIso = new Date().toISOString();
    let syncedCount = 0;
    let dupCount = 0;

    try {
      const batchPayload = {
        deviceSyncTime: nowIso,
        vitalSignReadings: [
          {
            clientGeneratedId: crypto.randomUUID(),
            vitalSignTypeId: 1,
            value: Number(vitals.HR.value) || 72,
            measurementMethod: 'Automated Sensor',
            sensorLocation: 'Thoracic Biometric Vest',
            bodyPosition: 'MicrogravityFloating',
            activityContext: 'Resting',
            dataQuality: 'Valid',
            recordedAt: nowIso,
          },
        ],
        sleepRecords: [],
        moodEntries: [],
        chatMessages: [],
      };
      const res = await api.syncOfflineBatch(batchPayload);
      if (res) {
        syncedCount =
          (res.vitalSignReadingsProcessed || 0) +
          (res.sleepRecordsProcessed || 0) +
          (res.moodEntriesProcessed || 0) +
          (res.chatMessagesProcessed || 0);
        dupCount = res.duplicatesIgnoredCount || 0;
      }
    } catch {
      // Offline /Monitor fallback
    }

    setOfflineQueue((prev) =>
      prev.map((item) => {
        if (item.syncStatus === 'Pending') {
          syncedCount++;
          return { ...item, syncStatus: 'Accepted' };
        } else {
          dupCount++;
          return { ...item, syncStatus: 'Duplicate' };
        }
      })
    );
    return { synced: syncedCount || 1, duplicates: dupCount };
  };

  const toggleOnlineStatus = () => setIsOnline((prev) => !prev);

  const unreadAlertsCount = alerts.filter((a) => a.status === 'Active').length;
  const unreadChatCount = chatMessages.filter(
    (m) => !m.isRead && m.senderRole !== currentRole
  ).length;

  return (
    <TelemetryContext.Provider
      value={{
        vitals,
        vitalsLog,
        overallStatus,
        heartRateHistory,
        alerts,
        unreadAlertsCount,
        sleepRecords,
        moodEntries,
        recommendations,
        chatMessages,
        unreadChatCount,
        selectedChatAstronautId,
        setSelectedChatAstronautId,
        crewMembers,
        missions,
        offlineQueue,
        isOnline,
        isAuthenticated,
        currentRole,
        activeAccount,
        currentUserCode:
          accountCredentials[activeAccount]?.code ||
          (currentRole === 'Monitor' ? 'MONITOR' : 'AST-001'),
        currentUserName,
        currentAstronautId,
        astronautProfile,
        setCurrentRole,
        switchAccount,
        login,
        logout,
        recordVital,
        recordSleep,
        recordMood,
        updateRecommendationStatus,
        createRecommendation,
        triggerManualAlert,
        acknowledgeAlert,
        resolveAlert,
        dismissAlert,
        sendChatMessage,
        markAllChatRead,
        provisionAstronaut,
        updateAstronautProfile,
        toggleAstronautActive,
        createMission,
        updateMissionStatus,
        deleteMissionById,
        assignCrewToMission,
        unassignCrewFromMission,
        executeOfflineSyncBatch,
        toggleOnlineStatus,
        activeScenario,
        allScenarios: CLINICAL_SCENARIOS,
        activateScenario,
        isLivePulsing,
        toggleLivePulsing,
        lastTelemetryBeatAt,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
