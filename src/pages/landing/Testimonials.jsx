import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const AVATARS = ['👩‍💼', '👩‍🎨', '💃'];

export default function Testimonials() {
  const { t } = useTranslation();
  const [ref, inView] = useInView();

  const testimonials = [
    { textKey: 'landing.testimonials.t1_text', nameKey: 'landing.testimonials.t1_name', salonKey: 'landing.testimonials.t1_salon', avatar: AVATARS[0] },
    { textKey: 'landing.testimonials.t2_text', nameKey: 'landing.testimonials.t2_name', salonKey: 'landing.testimonials.t2_salon', avatar: AVATARS[1] },
    { textKey: 'landing.testimonials.t3_text', nameKey: 'landing.testimonials.t3_name', salonKey: 'landing.testimonials.t3_salon', avatar: AVATARS[2] },
  ];

  return (
    <section className="ln-section">
      <div className="ln-container">
        <p className="ln-section-label">❤️ Reviews</p>
        <h2 className="ln-section-title">{t('landing.testimonials.title')}</h2>

        <div ref={ref} className="ln-testimonials-grid">
          {testimonials.map((t2, i) => (
            <div
              key={i}
              className={`ln-testimonial-card ln-fade-up ${inView ? 'ln-visible' : ''}`}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <div className="ln-quote-mark">"</div>
              <p className="ln-testimonial-text">{t(t2.textKey)}</p>
              <div className="ln-stars">★★★★★</div>
              <div className="ln-testimonial-author">
                <div className="ln-author-avatar">{t2.avatar}</div>
                <div>
                  <div className="ln-author-name">{t(t2.nameKey)}</div>
                  <div className="ln-author-salon">{t(t2.salonKey)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
