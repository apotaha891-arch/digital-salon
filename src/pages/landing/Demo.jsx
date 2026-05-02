import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import AnimatedCRM from './AnimatedCRM';

export default function Demo() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [ref, inView] = useInView();

  return (
    <section id="demo" className="ln-section" style={{ background: 'var(--surface)' }}>
      <div className="ln-container">
        <p className="ln-section-label">▶️ Demo</p>
        <h2 className="ln-section-title">{t('landing.demo.title')}</h2>
        <p className="ln-section-sub" style={{ marginBottom: 40 }}>
          {isAr
            ? 'شاهدي كيف تبدو لوحة تحكم صالونك — إدارة العملاء والحجوزات والإحصائيات في مكان واحد'
            : 'See how your salon dashboard looks — customers, bookings, and stats all in one place'}
        </p>

        <div
          ref={ref}
          className={`ln-fade-up ${inView ? 'ln-visible' : ''}`}
          style={{ maxWidth: 520, margin: '0 auto' }}
        >
          <AnimatedCRM />

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            🔒 {isAr ? 'بياناتك آمنة ومشفرة بالكامل' : 'Your data is fully encrypted and secure'}
          </p>
        </div>
      </div>
    </section>
  );
}
