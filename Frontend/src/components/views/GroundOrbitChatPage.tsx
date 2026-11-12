import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Check,
  Stethoscope,
  Users,
  Radio,
  User,
  Shield,
  Clock,
  Sparkles,
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
    currentUserName,
    currentUserCode,
    selectedChatAstronautId,
    setSelectedChatAstronautId,
    crewMembers,
    isOnline,
  } = useTelemetry();
  const isAr = language === 'ar';

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find currently selected astronaut for doctor view
  const activeAstronaut =
    crewMembers.find((c) => c.id === selectedChatAstronautId) ||
    crewMembers[0] || {
      id: 1,
      astronautCode: 'AST-001',
      fullName: 'Morgan Vance',
      fullNameAr: 'مورغان فانس',
      missionName: 'Ares III Expedition',
    };

  // Mark messages as read whenever thread changes or new messages arrive
  useEffect(() => {
    markAllChatRead();
  }, [selectedChatAstronautId, chatMessages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;
    const text = messageText.trim();
    setMessageText('');
    setSending(true);
    try {
      await sendChatMessage(text, currentRole, selectedChatAstronautId);
    } finally {
      setSending(false);
    }
  };

  const quickReplies =
    currentRole === 'Monitor'
      ? isAr
        ? [
            'تم استلام المؤشرات الحيوية الصباحية وجميعها ضمن النطاق الآمن.',
            'يرجى شرب 500 مل من محلول الإماهة وإعادة قياس ضغط الدم.',
            'تم تحديث بروتوكول التمارين والنوم في صفحة التوصيات الطبية.',
            'هل تشعر بأي دوار حركة أو أعراض تكيف مع الجاذبية الصغرى؟',
          ]
        : [
            'Morning vitals confirmed — all biometrics within safe operational limits.',
            'Please hydrate with 500ml electrolyte solution and re-test BP.',
            'Updated countermeasure protocol published in Medical Recommendations.',
            'Are you experiencing any motion sickness or microgravity adaptation?',
          ]
      : isAr
      ? [
          'تم تسجيل المؤشرات الحيوية الصباحية بنجاح، أشعر باستقرار تام.',
          'أنهيت حصة التمارين الرياضية على السير المتحرك ومعدل النبض طبيعي.',
          'أشعر ببعض الإرهاق والصداع الخفيف بعد جولة العمل خارج المركبة.',
          'يرجى مراجعة بيانات النوم الأخيرة وإرشادات جدول المهام.',
        ]
      : [
          'Morning vitals logged successfully, feeling fully stable.',
          'Completed treadmill countermeasure session, pulse is nominal.',
          'Experiencing mild fatigue and light headache post-EVA sortie.',
          'Please review latest sleep architecture and shift directives.',
        ];

  return (
    <div className="glass-panel rounded-[22px] p-5 flex flex-col gap-4 animate-fade-in">
      {/* Top Consultation Channel Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Channel Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'الاستشارة الطبية المباشرة' : 'Ground-Orbit Telemedicine'}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isOnline ? (isAr ? 'ناقل المحطة مباشر' : 'SignalR Live') : (isAr ? 'وضع غير متصل' : 'Offline')}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'قناة اتصال مشفرة بين طاقم المركبة والمركز الطبي الأرضي'
                  : 'Encrypted bidirectional telemetry & clinical chat channel'}
              </p>
            </div>
          </div>

          {/* Active Participants Identification Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {currentRole === 'Monitor' ? (
              // Doctor view: Dropdown to select which Astronaut to chat with
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-cyan-400/40 shadow-sm">
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-300 font-semibold">
                  {isAr ? 'محادثة الرائد:' : 'Active Thread:'}
                </span>
                <select
                  value={selectedChatAstronautId}
                  onChange={(e) => setSelectedChatAstronautId(Number(e.target.value))}
                  className="bg-slate-950 text-xs font-bold text-cyan-200 border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {crewMembers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {isAr ? c.fullNameAr : c.fullName} ({c.astronautCode})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Astronaut view: Clearly indicates connection with the Flight Surgeon
              <div className="flex items-center gap-2.5 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-blue-400/40 text-xs font-bold text-cyan-200 shadow-sm">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {isAr ? 'المستقبل الطبي المعتمد' : 'Flight Surgeon Support'}
                  </span>
                  <span>
                    {isAr
                      ? 'د. كيسي ريفيرا (طبيب الرحلة الأرضي)'
                      : 'Dr. Casey Rivera (Flight Surgeon)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sender & Target Summary Banner */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{isAr ? 'أنت المُرسِل:' : 'You are:'}</span>
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {currentUserName}
              <span className="text-[11px] font-mono text-cyan-300">
                ({currentUserCode || (currentRole === 'Monitor' ? 'MED-SURGEON' : 'AST-001')})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">{isAr ? 'القناة المفتوحة مع:' : 'Direct Channel With:'}</span>
            <span className="font-extrabold text-cyan-200">
              {currentRole === 'Monitor'
                ? `${isAr ? activeAstronaut.fullNameAr : activeAstronaut.fullName} (${activeAstronaut.astronautCode})`
                : isAr
                ? 'د. كيسي ريفيرا (طبيب الرحلة)'
                : 'Dr. Casey Rivera (Flight Surgeon)'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
              {chatMessages.length} {isAr ? 'رسالة' : 'msgs'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex flex-col gap-3 min-h-[280px] max-h-[360px] overflow-y-auto px-2 py-2">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 text-cyan-400/40 mb-2 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-200">
              {isAr ? 'لا توجد رسائل سابقة في هذه القناة' : 'No previous messages in this channel'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {isAr
                ? `هذه القناة مخصصة للمحادثة الطبية المعزولة مع ${
                    currentRole === 'Monitor'
                      ? isAr
                        ? activeAstronaut.fullNameAr
                        : activeAstronaut.fullName
                      : isAr
                      ? 'طبيب الرحلة د. كيسي ريفيرا'
                      : 'Flight Surgeon Dr. Casey Rivera'
                  }. اكتب رسالتك بالأسفل لبدء المحادثة.`
                : 'Send your first clinical message below to start direct medical consultation.'}
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMine = msg.senderRole === currentRole;
            const isRead = msg.isRead || msg.readAt != null;

            return (
              <div
                key={msg.id || msg.clientGeneratedId}
                className={`flex flex-col max-w-[85%] sm:max-w-[72%] ${
                  isMine ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                {/* Sender Name & Timestamp */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    {isMine
                      ? isAr
                        ? `أنت (${currentUserName})`
                        : `You (${currentUserName})`
                      : msg.senderName ||
                        (msg.senderRole === 'Monitor'
                          ? isAr
                            ? 'د. كيسي ريفيرا'
                            : 'Dr. Casey Rivera'
                          : isAr
                          ? activeAstronaut.fullNameAr
                          : activeAstronaut.fullName)}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    {new Date(msg.sentAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                    isMine
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-ee-sm'
                      : 'bg-slate-900/85 border border-white/15 text-slate-100 rounded-es-sm shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Delivery / Read Status for sent messages */}
                {isMine && (
                  <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-cyan-300">
                    {msg.deliveryState === 'sending' ? (
                      <span className="text-slate-400">{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                    ) : msg.deliveryState === 'failed' ? (
                      <span className="text-rose-400">{isAr ? 'تعذر الإرسال' : 'Failed'}</span>
                    ) : isRead ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">{isAr ? 'تمت القراءة' : 'Read'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 text-cyan-400" />
                        <span>{isAr ? 'تم التسليم' : 'Delivered'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Clinical Replies */}
      <div className="space-y-1.5 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{isAr ? 'ردود وإجراءات سريعة مقترحة:' : 'Quick Suggested Transmissions:'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMessageText(qr)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-cyan-400/40 text-slate-200 transition-all cursor-pointer text-start"
            >
              {qr}
            </button>
          ))}
        </div>
      </div>

      {/* Compose & Transmit Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2.5 pt-1">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={
            currentRole === 'Monitor'
              ? isAr
                ? `اكتب تعليماتك الطبية للرائد ${activeAstronaut.fullNameAr}...`
                : `Send clinical directive to ${activeAstronaut.fullName}...`
              : isAr
              ? 'اكتب رسالتك أو استفسارك لطبيب الرحلة...'
              : 'Transmit medical report / query to Flight Surgeon...'
          }
          className="flex-1 rounded-xl bg-slate-900/80 border border-white/15 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isAr ? 'إرسال' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
};
