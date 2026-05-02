import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const FEATURES = [
  { icon: '👥', titleKey: 'landing.features.crm_title',      descKey: 'landing.features.crm_desc' },
  { icon: '📅', titleKey: 'landing.features.booking_title',  descKey: 'landing.features.booking_desc' },
  { icon: '💬', titleKey: 'landing.features.multi_title',    descKey: 'landing.features.multi_desc' },
  { icon: '🎫', titleKey: 'landing.features.ticket_title',   descKey: 'landing.features.ticket_desc' },
  { icon: '📊', titleKey: 'landing.features.reports_title',  descKey: 'landing.features.reports_desc' },
  { icon: '🌐', titleKey: 'landing.features.presence_title', descKey: 'landing.features.presence_desc' },
];

export default function Features() {
  const { t } = useTranslation();
  const [ref, inView] = useInView();

  return (
    <section id="features" className="ln-section">
      <div className="ln-container">
        <p className="ln-section-label">✨ Features</p>
        <h2 className="ln-section-title">{t('landing.features.title')}</h2>

        <div ref={ref} className="ln-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`ln-feature-card ln-fade-up ${inView ? 'ln-visible' : ''}`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="ln-feature-icon">{f.icon}</div>
              <h3 className="ln-feature-title">{t(f.titleKey)}</h3>
              <p className="ln-feature-desc">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
