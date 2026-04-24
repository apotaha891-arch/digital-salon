import React from 'react';
import { useTranslation } from 'react-i18next';

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="ln-footer">
      <div className="ln-footer-inner">
        <div className="ln-footer-left">
          <span className="ln-footer-logo">💅 Digital Salon</span>
          <span className="ln-footer-copy">{t('landing.footer.tagline')}</span>
        </div>

        <div className="ln-footer-links">
          {['features','pricing','demo','faq'].map(id => (
            <button key={id} className="ln-footer-link" onClick={() => scrollTo(id)}>
              {t(`landing.nav.${id}`)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '24px auto 0', paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <span className="ln-footer-copy">{t('landing.footer.copyright')}</span>
      </div>
    </footer>
  );
}
