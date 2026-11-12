import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTelemetry } from '../../context/TelemetryContext';

export const GroundOrbitChatPage: React.FC = () => {
  const { language } = useLanguage();
  const {
    chatMessages,
    sendChatMessage,
    markAllChatRead,
    currentRole,
    selectedChatAstronautId,
    setSelectedChatAstronautId,
    crewMembers,
  } = useTelemetry();
  const isAr = language === 'ar';

  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    markAllChatRead();
  }, [selectedChatAstronautId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendChatMessage(messageText.trim(), currentRole, selectedChatAstronautId);
    setMessageText('');
  };

  const quickReplies =
    currentRole === 'Monitor'
      ? isAr
        ? [
            'تم استلام المؤشرات الحيوية الصباحية، وجميعها ضمن النطاق الآمن.',
            'يرجى شرب 500 مل من محلول الإماهة وإعادة قياس ضغط الدم.',
            'تم تحديث بروتوكول التمارين والنوم في صفحة التوصيات الطبية.',
          ]
        : [
            'Morning telemetry received — all vitals are within nominal limits.',
            'Please hydrate with 500ml electrolyte solution and re-check BP.',
            'Updated countermeasure protocol posted in Medical Recommendations.',
          ]
      : isAr
      ? [
          'تم تسجيل المؤشرات الحيوية الصباحية بنجاح.',
          'أشعر باستقرار تام بعد انتهاء التمارين.',
          'يرجى مراجعة تقرير النوم الأخير.',
        ]
      : [
          'Morning vital signs have been logged.',
          'Feeling fully stable after completing exercise.',
          'Please review the latest sleep report.',
        ];

  return (
    <div className="glass-panel rounded-[22px] p-5 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'المحادثة الطبية المباشرة' : 'Direct Medical Consultation'}
            </h3>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'تواصل مباشر بين رائد الفضاء وطبيب الرحلة'
                : 'Direct communication channel between Astronaut and Flight Surgeon'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Astronaut Thread Selector (Shown only to Flight Surgeon / Monitor) */}
          {currentRole === 'Monitor' ? (
            <div className="flex items-center gap-2 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-cyan-400/30">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-semibold">
                {isAr ? 'مراسلة الرائد:' : 'Crew Thread:'}
              </span>
              <select
                value={selectedChatAstronautId}
                onChange={(e) => setSelectedChatAstronautId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none"
              >
                {crewMembers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {isAr ? c.fullNameAr : c.fullName} ({c.astronautCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/70 px-3 py-1.5 rounded-xl border border-blue-400/30 text-xs font-bold text-cyan-200">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr
                  ? 'متصل مع: د. كيسي ريفيرا (طبيب الرحلة)'
                  : 'Connected to: Dr. Casey Rivera (Flight Surgeon)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto px-1 py-2">
        {chatMessages.map((msg) => {
          const isMine = msg.senderRole === currentRole;
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${
                isMine ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-300">{msg.senderName}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.sentAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isMine
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-ee-sm'
                    : 'bg-slate-900/75 border border-white/15 text-slate-100 rounded-es-sm'
                }`}
              >
                {msg.content}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-cyan-300">
                <CheckCheck className="w-3 h-3" />
                <span>{isAr ? 'تم التسليم' : 'Delivered'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Replies */}
      <div className="flex flex-wrap gap-2">
        {quickReplies.map((qr, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setMessageText(qr)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-200 transition-all"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Compose Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2.5 pt-1">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={
            isAr ? 'اكتب رسالتك الطبية هنا...' : 'Type your medical message here...'
          }
          className="flex-1 rounded-xl bg-slate-900/80 border border-white/15 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
        >
          <Send className="w-4 h-4" />
          <span>{isAr ? 'إرسال' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
};
