import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function HowItWorks() {
  const { t } = useTranslation();
  const [ref, inView] = useInView();

  const steps = [
    { num: '①', icon: '🏪', title: t('landing.how.step1_title'), desc: t('landing.how.step1_desc'), soon: false },
    { num: '②', icon: '👥', title: t('landing.how.step2_title'), desc: t('landing.how.step2_desc'), soon: false },
    { num: '③', icon: '📈', title: t('landing.how.step3_title'), desc: t('landing.how.step3_desc'), soon: false },
  ];

  return (
    <section className="ln-section" style={{ background: 'var(--surface)' }}>
      <div className="ln-container">
        <p className="ln-section-label">🚀 {t('landing.nav.features')}</p>
        <h2 className="ln-section-title">{t('landing.how.title')}</h2>

        <div ref={ref} className="ln-steps-grid">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`ln-step-card ln-fade-up ${inView ? 'ln-visible' : ''}`}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="ln-step-num">{i + 1}</div>
              <div className="ln-step-icon">{step.icon}</div>
              <h3 className="ln-step-title">{step.title}</h3>
              <p className="ln-step-desc">{step.desc}</p>
              {step.soon && (
                <span className="ln-step-soon">{t('landing.how.wa_soon')}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
