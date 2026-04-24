import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const ITEMS = ['q1','q2','q3','q4','q5','q6','q7','q8'];

export default function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [ref, inView] = useInView();

  return (
    <section id="faq" className="ln-section">
      <div className="ln-container">
        <p className="ln-section-label">❓ FAQ</p>
        <h2 className="ln-section-title">{t('landing.faq.title')}</h2>

        <div
          ref={ref}
          className={`ln-faq-list ln-fade-up ${inView ? 'ln-visible' : ''}`}
        >
          {ITEMS.map((key, i) => (
            <div key={key} className={`ln-faq-item ${open === i ? 'open' : ''}`}>
              <button className="ln-faq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{t(`landing.faq.${key}`)}</span>
                <span className="ln-faq-chevron">▼</span>
              </button>
              {open === i && (
                <div className="ln-faq-a">{t(`landing.faq.a${i + 1}`)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
