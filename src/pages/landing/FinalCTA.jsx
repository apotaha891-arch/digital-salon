import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function FinalCTA() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ref, inView] = useInView();

  return (
    <section className="ln-final-cta">
      <div
        ref={ref}
        className={`ln-container ln-fade-up ${inView ? 'ln-visible' : ''}`}
      >
        <h2 className="ln-final-title">{t('landing.final_cta.title')}</h2>
        <p className="ln-final-sub">{t('landing.final_cta.subtitle')}</p>
        <div className="ln-final-ctas">
          <button
            className="ln-btn-primary"
            style={{ fontSize: 16, padding: '14px 32px' }}
            onClick={() => navigate('/login')}
          >
            {t('landing.final_cta.cta1')}
          </button>
          <button
            className="ln-btn-outline"
            style={{ fontSize: 16, padding: '14px 32px' }}
            onClick={() => window.dispatchEvent(new CustomEvent('openConcierge'))}
          >
            {t('landing.final_cta.cta2')}
          </button>
        </div>
      </div>
    </section>
  );
}
