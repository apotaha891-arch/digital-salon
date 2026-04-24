import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [ref, inView] = useInView();
  const isAr = i18n.language === 'ar';

  const plans = [
    {
      name: 'Starter',
      tagline: isAr ? 'مثالية للصالون الصغير' : 'Perfect for small salons',
      priceM: '29', priceY: '23',
      popular: false,
      features: [
        isAr ? '200 توكن/شهر' : '200 tokens/mo',
        'Instagram',
        'Messenger',
        'Telegram',
        isAr ? 'حجز تلقائي' : 'Auto Booking',
        isAr ? 'CRM العملاء' : 'Customer CRM',
        isAr ? 'توكن يُرحَّل' : 'Tokens roll over',
        { text: isAr ? 'WhatsApp 🔜 قريباً' : 'WhatsApp 🔜 Soon', soon: true },
      ],
    },
    {
      name: 'Pro',
      tagline: isAr ? 'للصالون الذي يريد التميز' : 'For salons that want to excel',
      priceM: '49', priceY: '39',
      popular: true,
      features: [
        isAr ? '400 توكن/شهر' : '400 tokens/mo',
        'Instagram',
        'Messenger',
        'Telegram',
        isAr ? 'حجز تلقائي' : 'Auto Booking',
        isAr ? 'CRM العملاء' : 'Customer CRM',
        isAr ? 'توكن يُرحَّل' : 'Tokens roll over',
        isAr ? 'أولوية الدعم' : 'Priority Support',
        { text: isAr ? 'WhatsApp 🔜 قريباً' : 'WhatsApp 🔜 Soon', soon: true },
      ],
    },
  ];

  return (
    <section id="pricing" className="ln-section ln-pricing-bg">
      <div className="ln-container">
        <p className="ln-section-label">💰 Pricing</p>
        <h2 className="ln-section-title">{t('landing.pricing.title')}</h2>
        <p className="ln-section-sub">{t('landing.pricing.trial')}</p>

        {/* Billing toggle */}
        <div className="ln-billing-toggle">
          <div className="ln-toggle-pill">
            <button className={`ln-toggle-opt ${!annual ? 'active' : ''}`} onClick={() => setAnnual(false)}>
              {t('landing.pricing.monthly')}
            </button>
            <button className={`ln-toggle-opt ${annual ? 'active' : ''}`} onClick={() => setAnnual(true)}>
              {t('landing.pricing.annual')}
            </button>
          </div>
          {annual && <span className="ln-save-badge">{t('landing.pricing.save')}</span>}
        </div>

        <div ref={ref} className="ln-plans-grid">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`ln-plan-card ln-fade-up ${plan.popular ? 'popular' : ''} ${inView ? 'ln-visible' : ''}`}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              {plan.popular && (
                <div className="ln-popular-tag">
                  {isAr ? '⭐ الأكثر طلباً' : '⭐ Most Popular'}
                </div>
              )}

              <div className="ln-plan-name">{plan.name}</div>
              <div className="ln-plan-tagline">{plan.tagline}</div>

              <div className="ln-plan-price">
                <span className="ln-price-dollar">$</span>
                <span className="ln-price-amount">{annual ? plan.priceY : plan.priceM}</span>
                <span className="ln-price-period">{t('landing.pricing.per_month')}</span>
              </div>

              <ul className="ln-plan-features">
                {plan.features.map((f, j) => {
                  const isSoon = typeof f === 'object';
                  const text = isSoon ? f.text : f;
                  return (
                    <li key={j}>
                      <span className={isSoon ? 'ln-soon-text' : 'ln-check'}>{isSoon ? '🔜' : '✓'}</span>
                      <span style={isSoon ? { color: 'var(--text-muted)' } : {}}>{text}</span>
                    </li>
                  );
                })}
              </ul>

              <button className="ln-btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                {t('landing.pricing.cta')}
              </button>
            </div>
          ))}
        </div>

        <p className="ln-pricing-note">{t('landing.pricing.note')}</p>
      </div>
    </section>
  );
}
