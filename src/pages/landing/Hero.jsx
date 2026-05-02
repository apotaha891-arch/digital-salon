import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
export default function Hero() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const ctaTarget = user ? '/dashboard' : '/login';

  return (
    <section className="ln-hero">
      <div className="ln-hero-bg" />

      <div className="ln-hero-inner">
        {/* ── Text column ── */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(217,70,239,0.08)', border: '1px solid rgba(217,70,239,0.25)',
            borderRadius: 50, padding: '6px 16px', fontSize: 13, fontWeight: 700,
            color: 'var(--primary)', marginBottom: 24
          }}>
            ✨ {isAr ? 'منصة إدارة الصالونات الشاملة' : 'All-in-One Salon Management Platform'}
          </div>

          <h1 className="ln-hero-title">{t('landing.hero.title')}</h1>
          <p className="ln-hero-subtitle">{t('landing.hero.subtitle')}</p>

          <div className="ln-hero-ctas">
            <button className="ln-btn-primary" onClick={() => navigate(ctaTarget)}>
              {t('landing.hero.cta1')}
            </button>
            <button className="ln-btn-outline" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('landing.hero.cta2')}
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{ display: 'flex', gap: 24, marginTop: 36, flexWrap: 'wrap' }}>
            {[
              { icon: '✅', text: isAr ? 'بدون بطاقة ائتمان' : 'No credit card' },
              { icon: '🔒', text: isAr ? 'بياناتك آمنة' : 'Secure data' },
              { icon: '⚡', text: isAr ? 'إعداد في دقيقتين' : '2-min setup' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Phone mockup ── */}
        <div className="ln-phone-wrap">
          <div className="ln-phone-glow" />

          {/* Floating badges */}
          <div className="ln-badge-float" style={{ color: 'var(--success)' }}>
            ✅ {t('landing.hero.badge_booking')}
          </div>
          <div className="ln-badge-float" style={{ color: 'var(--primary)' }}>
            ⚡ {t('landing.hero.badge_instant')}
          </div>
          <div className="ln-badge-float">
            🌙 {t('landing.hero.badge_247')}
          </div>

          <img
            src="/assets/logo_version.png"
            alt="Digital Salon"
            style={{
              width: 280,
              height: 'auto',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 0 40px rgba(217,70,239,0.7)) drop-shadow(0 0 80px rgba(147,51,234,0.4))',
              animation: 'sc-slide-up 0.6s ease',
            }}
          />
        </div>
      </div>
    </section>
  );
}
