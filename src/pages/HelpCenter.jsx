import { useState } from 'react';
import { 
  Search, 
  HelpCircle, 
  MessageCircle, 
  Zap, 
  ChevronRight, 
  ExternalLink,
  LifeBuoy,
  BookOpen,
  Calendar,
  CreditCard,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

const FAQS = [
  {
    category: 'البداية',
    icon: Zap,
    q: 'كيف تعمل الموظفة الرقمية؟',
    a: 'الموظفة الرقمية هي ذكاء اصطناعي مُدرب على معلومات صالونك. تقوم بالرد على العميلات، حجز المواعيد، والإجابة على الاستفسارات عبر واتساب وتيليجرام وموقعك الإلكتروني.'
  },
  {
    category: 'الرصيد',
    icon: CreditCard,
    q: 'كيف يتم خصم الرصيد (التوكنات)؟',
    a: 'يتم خصم التوكنات بناءً على طول المحادثة. كل رسالة يتم الرد عليها تستهلك عدداً بسيطاً من التوكنات. يمكنك متابعة استهلاكك لحظة بلحظة من لوحة التحكم.'
  },
  {
    category: 'التخصيص',
    icon: BookOpen,
    q: 'هل يمكنني تغيير اسم الموظفة أو شخصيتها؟',
    a: 'نعم، من صفحة الإعدادات، يمكنك تخصيص اسم الموظفة، نبرة صوتها، والمعلومات التي تقدمها للعميلات لتعبر عن هوية صالونك.'
  },
  {
    category: 'الرصيد',
    icon: Smartphone,
    q: 'ماذا يحدث إذا نفد رصيدي؟',
    a: 'في حال نفاد الرصيد، ستتوقف الموظفة عن الرد مؤقتاً. يمكنك شحن رصيد إضافي فوراً من صفحة "الرصيد" لتعود الموظفة للعمل مباشرة.'
  },
  {
    category: 'الحجوزات',
    icon: Calendar,
    q: 'كيف أحصل على تقارير الحجوزات؟',
    a: 'جميع الحجوزات مسجلة في صفحة "الحجوزات" في لوحة تحكمك، حيث يمكنك عرضها، تأكيدها، أو إلغاؤها بكل سهولة.'
  }
];

export default function HelpCenter() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = FAQS.filter(f => 
    f.q.toLowerCase().includes(search.toLowerCase()) || 
    f.a.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 60, marginTop: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, background: 'linear-gradient(to right, white, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          مركز الدعم الذكي 🛠️
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>نحن هنا للتأكد من نجاح صالونك الرقمي في كل خطوة</p>
      </div>

      {/* Modern Search bar */}
      <div style={{ position: 'relative', marginBottom: 60, maxWidth: 650, margin: '0 auto 60px auto' }}>
        <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
          <Search size={22} />
        </div>
        <input 
          type="text" 
          placeholder="ابحثي عن سؤال، ميزة، أو حل لمشكلة..." 
          className="neon-input"
          style={{ 
            width: '100%', padding: '18px 56px 18px 24px', borderRadius: 16, 
            fontSize: 16, fontWeight: 500
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 40 }}>
        {/* FAQs Section */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <HelpCircle size={24} style={{ color: 'var(--primary)' }} /> الأسئلة الشائعة
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredFaqs.map((f, idx) => (
              <div 
                key={idx} 
                className="glass-card faq-box" 
                style={{ 
                  padding: 0, overflow: 'hidden', cursor: 'pointer',
                  border: openFaq === idx ? '1px solid rgba(217,70,239,0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: 8, borderRadius: 10, background: 'rgba(217,70,239,0.1)', color: 'var(--primary)' }}>
                      <f.icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{f.category}</div>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{f.q}</span>
                    </div>
                  </div>
                  <ChevronRight 
                    size={20} 
                    style={{ 
                      transform: openFaq === idx ? 'rotate(90deg)' : 'none', 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: openFaq === idx ? 'var(--primary)' : 'var(--text-muted)'
                    }} 
                  />
                </div>
                {openFaq === idx && (
                  <div style={{ 
                    padding: '0 24px 24px 72px', color: 'var(--text-muted)', 
                    fontSize: 15, lineHeight: 1.8, animation: 'fadeIn 0.4s ease'
                  }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24 }}>
                <Search size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
                <p style={{ color: 'var(--text-muted)' }}>لم نجد نتائج تطابق بحثك.. جربي كلمات أخرى.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Links Card */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} style={{ color: 'var(--primary)' }} /> روابط هامة
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { to: '/integrations', label: 'دليل ربط القنوات' },
                { to: '/billing', label: 'إدارة الرصيد والاشتراك' },
                { to: '#', label: 'شروط الخصوصية' },
              ].map((link, i) => (
                <a key={i} href={link.to} style={{ 
                  color: 'var(--text)', textDecoration: 'none', fontSize: 14, 
                  padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                  {link.label} <ExternalLink size={14} style={{ opacity: 0.5 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Premium Contact Card */}
          <div className="glass-card" style={{ 
            padding: 32, 
            background: 'linear-gradient(135deg, rgba(217,70,239,0.15) 0%, rgba(147,51,234,0.05) 100%)',
            border: '1px solid rgba(217,70,239,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto', boxShadow: '0 8px 16px rgba(217,70,239,0.3)'
            }}>
              <LifeBuoy size={30} />
            </div>
            <h3 style={{ fontWeight: 900, fontSize: 20, marginBottom: 12 }}>ما زلتي تحاولين؟</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              فريق الخبراء لدينا جاهز لمساعدتك في عملية الربط أو أي استفسار تقني آخر.
            </p>
            <a 
              href="https://wa.me/YOUR_SUPPORT_NUMBER" 
              target="_blank" 
              rel="noreferrer"
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                gap: 10, background: 'white', color: 'var(--primary)', 
                padding: '14px', borderRadius: 14, fontWeight: 900, fontSize: 15,
                textDecoration: 'none', transition: 'transform 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <MessageCircle size={20} /> تواصل الآن عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
