import { useEffect, useRef, useState } from 'react';

const WIDGET_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/concierge`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const QUICK_AR = [
  'كيف يعمل الحجز التلقائي؟',
  'ما القنوات المدعومة؟',
  'كم تكلف الخطة الشهرية؟',
  'هل يوجد نسخة تجريبية مجانية؟',
  'كيف أربط واتساب بالبوت؟',
  'ماذا يحدث عند نفاد الرصيد؟',
];

const QUICK_EN = [
  'How does auto-booking work?',
  'Which channels are supported?',
  'How much is the monthly plan?',
  'Is there a free trial?',
  'How do I connect WhatsApp?',
  'What happens when balance runs out?',
];

function genSessionId() {
  return 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export default function SalonConcierge({ lang = 'ar' }) {
  const isAr = lang === 'ar' || lang?.startsWith('ar');

  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', contact: '' });

  const sessionIdRef = useRef(genSessionId());
  const visitorRef   = useRef({ name: '', email: '', phone: '' });
  const bodyRef      = useRef(null);
  const inputRef     = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 8000);
    return () => clearTimeout(t);
  }, []);

  // Any component can dispatch window.dispatchEvent(new CustomEvent('openConcierge'))
  useEffect(() => {
    const handler = () => { setOpen(true); setShowTooltip(false); };
    window.addEventListener('openConcierge', handler);
    return () => window.removeEventListener('openConcierge', handler);
  }, []);

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading, showContactForm]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // Show contact form after 4 user messages
  useEffect(() => {
    const userCount = messages.filter(m => m.role === 'user').length;
    if (userCount >= 4 && !contactSent && !showContactForm) {
      setShowContactForm(true);
    }
  }, [messages]);

  const sendMessage = async (text, extraPayload = {}) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(WIDGET_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          session_id: sessionIdRef.current,
          language: isAr ? 'ar' : 'en',
          visitor_name:  visitorRef.current.name  || undefined,
          visitor_email: visitorRef.current.email || undefined,
          visitor_phone: visitorRef.current.phone || undefined,
          ...extraPayload,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data  = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: 'bot',
        text: data.reply?.trim() || (isAr ? 'عذراً، لم أفهم. حاولي مرة أخرى.' : 'Sorry, I did not understand. Please try again.'),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: isAr
          ? 'عذراً، لا أستطيع الرد الآن. تواصلي مع فريق الدعم مباشرةً. 🌸'
          : 'Sorry, I cannot respond right now. Please contact our support team. 🌸',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const submitContact = async () => {
    const { name, contact } = contactForm;
    if (!name.trim() && !contact.trim()) return;

    const isEmail = contact.includes('@');
    visitorRef.current = {
      name: name.trim(),
      email: isEmail ? contact.trim() : '',
      phone: !isEmail ? contact.trim() : '',
    };

    setShowContactForm(false);
    setContactSent(true);

    const confirmMsg = isAr
      ? `شكراً ${name || ''}! 🌸 تم حفظ معلوماتك وسيتواصل معك فريقنا قريباً.`
      : `Thank you ${name || ''}! 🌸 Your info has been saved and our team will reach out soon.`;

    setMessages(prev => [...prev, { role: 'bot', text: confirmMsg }]);

    // Send a silent "contact captured" message to persist visitor info
    await fetch(WIDGET_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: `[CONTACT] name=${name} contact=${contact}`,
        history: messages,
        session_id: sessionIdRef.current,
        language: isAr ? 'ar' : 'en',
        visitor_name:  name.trim() || undefined,
        visitor_email: isEmail ? contact.trim() : undefined,
        visitor_phone: !isEmail ? contact.trim() : undefined,
      }),
    }).catch(() => {});
  };

  const side = isAr ? 'left' : 'right';

  return (
    <>
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, [side]: 24,
          width: 340, maxHeight: 540,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden',
          direction: isAr ? 'rtl' : 'ltr',
          animation: 'sc-slide-up 0.25s ease',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #D946EF, #9333EA)',
            padding: '13px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>💅</div>
            <div style={{ flex: 1, color: 'white', minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {isAr ? 'لين — مساعدة Digital Salon' : 'Lina — Digital Salon Assistant'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {isAr ? '🟢 متصلة الآن' : '🟢 Online now'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 22, lineHeight: 1, opacity: 0.8, padding: 4, flexShrink: 0 }}
              aria-label="Close"
            >×</button>
          </div>

          {/* Messages */}
          <div ref={bodyRef} style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            scrollbarWidth: 'none',
          }}>
            <Bubble isBot>
              {isAr
                ? 'أهلاً! 👋 أنا لين، مساعدتك الذكية في Digital Salon\nكيف يمكنني مساعدتك اليوم؟'
                : "Hello! 👋 I'm Lina, your Digital Salon AI assistant\nHow can I help you today?"}
            </Bubble>

            {messages.map((msg, i) => (
              <Bubble key={i} isBot={msg.role === 'bot'}>{msg.text}</Bubble>
            ))}

            {loading && <TypingDots />}

            {/* Contact capture form — shown after 4 messages */}
            {showContactForm && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(217,70,239,0.08), rgba(147,51,234,0.08))',
                border: '1px solid var(--border)',
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                  {isAr ? '💬 هل تريد أن يتواصل معك فريقنا؟' : '💬 Want our team to reach out?'}
                </div>
                <input
                  placeholder={isAr ? 'اسمك...' : 'Your name...'}
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '7px 12px', fontSize: 13,
                    color: 'var(--text)', outline: 'none', direction: 'auto',
                  }}
                />
                <input
                  placeholder={isAr ? 'بريدك أو رقم واتساب...' : 'Email or WhatsApp number...'}
                  value={contactForm.contact}
                  onChange={e => setContactForm(f => ({ ...f, contact: e.target.value }))}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '7px 12px', fontSize: 13,
                    color: 'var(--text)', outline: 'none', direction: 'auto',
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={submitContact}
                    style={{
                      flex: 1, padding: '7px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #D946EF, #9333EA)',
                      color: 'white', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {isAr ? 'إرسال ✓' : 'Send ✓'}
                  </button>
                  <button
                    onClick={() => setShowContactForm(false)}
                    style={{
                      padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)',
                      background: 'var(--surface2)', color: 'var(--text-muted)',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'لاحقاً' : 'Later'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 0 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
              {(isAr ? QUICK_AR : QUICK_EN).map((q, i) => (
                <QuickBtn key={i} onClick={() => sendMessage(q)}>{q}</QuickBtn>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, flexShrink: 0,
            background: 'var(--surface)',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={isAr ? 'اكتبي سؤالك...' : 'Ask a question...'}
              disabled={loading}
              style={{
                flex: 1, background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 20, padding: '8px 14px',
                fontSize: 13, color: 'var(--text)', outline: 'none',
                direction: 'auto', unicodeBidi: 'plaintext',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: input.trim() && !loading ? 'linear-gradient(135deg, #D946EF, #9333EA)' : 'var(--surface2)',
                border: '1px solid var(--border)',
                color: input.trim() && !loading ? 'white' : 'var(--text-muted)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              aria-label="Send"
            >
              {isAr ? '←' : '→'}
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && !open && (
        <div
          onClick={() => { setOpen(true); setShowTooltip(false); }}
          style={{
            position: 'fixed', bottom: 90, [side]: 24,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '8px 14px',
            fontSize: 13, color: 'var(--text)',
            zIndex: 9998, whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            direction: isAr ? 'rtl' : 'ltr',
            animation: 'sc-fade-in 0.3s ease', cursor: 'pointer',
          }}
        >
          {isAr ? '👋 هل تحتاجين مساعدة؟' : '👋 Need help?'}
          <span style={{
            position: 'absolute', bottom: -7, [side]: 20,
            width: 13, height: 13, background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            [isAr ? 'borderLeft' : 'borderRight']: '1px solid var(--border)',
            transform: 'rotate(-45deg)', display: 'block',
          }} />
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setOpen(o => !o); setShowTooltip(false); }}
        style={{
          position: 'fixed', bottom: 24, [side]: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #D946EF, #9333EA)',
          border: 'none', color: 'white',
          cursor: 'pointer', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(217,70,239,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: open ? 26 : 22,
          transition: 'transform 0.2s, box-shadow 0.2s, font-size 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(217,70,239,0.65)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(217,70,239,0.5)'; }}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '×' : '💬'}
      </button>

      <style>{`
        @keyframes sc-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes sc-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes sc-dot {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
          40%            { transform: scale(1);    opacity: 1;    }
        }
      `}</style>
    </>
  );
}

function Bubble({ isBot, children }) {
  return (
    <div style={{
      maxWidth: '85%', padding: '10px 13px', borderRadius: 14,
      fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap',
      direction: 'auto', unicodeBidi: 'plaintext',
      alignSelf: isBot ? 'flex-start' : 'flex-end',
      background: isBot ? 'var(--surface2)' : 'linear-gradient(135deg, #D946EF, #9333EA)',
      color: isBot ? 'var(--text)' : 'white',
      border: isBot ? '1px solid var(--border)' : 'none',
      borderBottomLeftRadius: isBot ? 4 : 14,
      borderBottomRightRadius: isBot ? 14 : 4,
    }}>
      {children}
    </div>
  );
}

function QuickBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '5px 10px', fontSize: 11,
        color: 'var(--text)', cursor: 'pointer', lineHeight: 1.45,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {children}
    </button>
  );
}

function TypingDots() {
  return (
    <div style={{
      alignSelf: 'flex-start', background: 'var(--surface2)',
      border: '1px solid var(--border)', borderRadius: 14,
      borderBottomLeftRadius: 4, padding: '10px 16px',
      display: 'flex', gap: 5, alignItems: 'center',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)',
          animation: `sc-dot 1.2s ${i * 0.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}
