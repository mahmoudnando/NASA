import React from 'react';
import { Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';

export const StatusBanner: React.FC = () => {
  const { t } = useLanguage();
  const { overallStatus } = useTelemetry();

  const isAttention = overallStatus === 'MedicalAttention';
  const isEmergency = overallStatus === 'Emergency';

  const glowClass = isEmergency
    ? 'glass-glow-danger'
    : isAttention
    ? 'glass-glow-amber'
    : 'glass-glow-emerald';

  const badgeBg = isEmergency
    ? 'bg-red-500/20 text-red-400 border-red-400/50 shadow-[0_0_24px_rgba(239,68,68,0.35)]'
    : isAttention
    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_24px_rgba(245,158,11,0.35)]'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.35)]';

  const statusText = isEmergency
    ? t.statusBanner.emergency
    : isAttention
    ? t.statusBanner.attention
    : t.statusBanner.stable;

  const statusSubtext = isEmergency
    ? t.statusBanner.emergencySubtext
    : isAttention
    ? t.statusBanner.attentionSubtext
    : t.statusBanner.stableSubtext;

  const textColor = isEmergency
    ? 'text-red-400 drop-shadow-[0_0_14px_rgba(239,68,68,0.5)]'
    : isAttention
    ? 'text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.5)]'
    : 'text-emerald-400 drop-shadow-[0_0_14px_rgba(16,185,129,0.5)]';

  const ecgStroke = isEmergency ? '#ef4444' : isAttention ? '#f59e0b' : '#10b981';

  return (
    <div
      className={`w-full rounded-3xl px-6 py-5 md:px-8 md:py-5 flex flex-col md:flex-row items-center justify-between gap-5 transition-all duration-500 ${glowClass} relative overflow-hidden`}
    >
      {/* Status Info Group */}
      <div className="flex items-center gap-5 z-10 w-full md:w-auto">
        {/* Circular Glowing Status Checkmark Badge */}
        <div
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform duration-300 ${badgeBg}`}
        >
          {isEmergency ? (
            <AlertCircle className="w-8 h-8 stroke-[2.4] animate-pulse" />
          ) : isAttention ? (
            <AlertTriangle className="w-8 h-8 stroke-[2.4]" />
          ) : (
            <Check className="w-8 h-8 stroke-[2.8]" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex flex-col">
          <span className="text-xs md:text-sm font-bold text-slate-200">
            {t.statusBanner.statusLabel}
          </span>
          <div className={`text-2xl md:text-3xl font-extrabold leading-tight mt-0.5 ${textColor}`}>
            {statusText}
          </div>
          <p className="text-xs md:text-sm text-slate-300 font-medium mt-1">
            {statusSubtext}
          </p>
        </div>
      </div>

      {/* Animated ECG Waveform */}
      <div className="w-full md:w-72 h-14 flex items-center justify-center md:justify-end z-10">
        <svg
          viewBox="0 0 300 70"
          className="w-full max-w-[270px] h-full overflow-visible drop-shadow-[0_0_10px_rgba(16,185,129,0.45)]"
        >
          <path
            d="M0 35 L55 35 L68 35 L78 10 L88 60 L98 18 L108 46 L118 35 L165 35 L178 35 L188 10 L198 60 L208 18 L218 46 L228 35 L300 35"
            fill="none"
            stroke={ecgStroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg"
          />
        </svg>
      </div>
    </div>
  );
};
