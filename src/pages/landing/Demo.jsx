import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import AnimatedChat from './AnimatedChat';

export default function Demo() {
  const { t } = useTranslation();
  const [ref, inView] = useInView();

  return (
    <section id="demo" className="ln-section" style={{ background: 'var(--surface)' }}>
      <div className="ln-container">
        <p className="ln-section-label">▶️ Demo</p>
        <h2 className="ln-section-title">{t('landing.demo.title')}</h2>
        <p className="ln-section-sub">{t('landing.demo.subtitle')}</p>

        <div
          ref={ref}
          className={`ln-fade-up ${inView ? 'ln-visible' : ''}`}
          style={{ maxWidth: 500, margin: '0 auto' }}
        >
          <AnimatedChat minHeight={360} />

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            🔒 {t('landing.demo.subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
}
