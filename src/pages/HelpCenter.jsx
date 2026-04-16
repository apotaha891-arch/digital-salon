import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function HelpCenter() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const FAQS = [
    {
      category: t('help.faq.start.cat'),
      icon: Zap,
      q: t('help.faq.start.q'),
      a: t('help.faq.start.a')
    },
    {
      category: t('help.faq.billing.cat'),
      icon: CreditCard,
      q: t('help.faq.billing.q'),
      a: t('help.faq.billing.a')
    },
    {
      category: t('help.faq.custom.cat'),
      icon: BookOpen,
      q: t('help.faq.custom.q'),
      a: t('help.faq.custom.a')
    },
    {
      category: t('help.faq.limit.cat'),
      icon: Smartphone,
      q: t('help.faq.limit.q'),
      a: t('help.faq.limit.a')
    },
    {
      category: t('help.faq.bookings.cat'),
      icon: Calendar,
      q: t('help.faq.bookings.q'),
      a: t('help.faq.bookings.a')
    }
  ];

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
          {t('help.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>{t('help.subtitle')}</p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 60, maxWidth: 650, margin: '0 auto 60px auto' }}>
        <div style={{ position: 'absolute', right: i18n.dir() === 'rtl' ? 20 : 'auto', left: i18n.dir() === 'ltr' ? 20 : 'auto', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
          <Search size={22} />
        </div>
        <input 
          type="text" 
          placeholder={t('help.search_placeholder')} 
          className="neon-input"
          style={{ 
            width: '100%', 
            padding: i18n.dir() === 'rtl' ? '18px 56px 18px 24px' : '18px 24px 18px 56px', 
            borderRadius: 16, 
            fontSize: 16, 
            fontWeight: 500
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 40 }}>
        {/* FAQs Section */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <HelpCircle size={24} style={{ color: 'var(--primary)' }} /> {t('help.faqs_title')}
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
                      transform: openFaq === idx ? 'rotate(90deg)' : (i18n.dir() === 'rtl' ? 'rotate(180deg)' : 'none'), 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: openFaq === idx ? 'var(--primary)' : 'var(--text-muted)'
                    }} 
                  />
                </div>
                {openFaq === idx && (
                  <div style={{ 
                    padding: i18n.dir() === 'rtl' ? '0 72px 24px 24px' : '0 24px 24px 72px', 
                    color: 'var(--text-muted)', 
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
                <p style={{ color: 'var(--text-muted)' }}>{t('help.faq_empty')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Links Card */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} style={{ color: 'var(--primary)' }} /> {t('help.links_title')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { to: '/integrations', label: t('help.links.guides') },
                { to: '/billing', label: t('help.links.billing') },
                { to: '#', label: t('help.links.privacy') },
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

          {/* Contact Card */}
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
            <h3 style={{ fontWeight: 900, fontSize: 20, marginBottom: 12 }}>{t('help.contact.title')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              {t('help.contact.sub')}
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
              <MessageCircle size={20} /> {t('help.contact.btn')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
