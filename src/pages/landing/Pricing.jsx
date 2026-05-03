import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { Check } from 'lucide-react';

const PLANS = (isAr) => [
  {
    id: 'free',
    name: isAr ? 'مجاني' : 'Free',
    tagline: isAr ? 'ابدأ مجاناً بدون بطاقة ائتمان' : 'Get started for free, no credit card',
    priceM: '0',
    priceY: '0',
    popular: false,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    emoji: '🎁',
    features: isAr ? [
      'قالب صفحة هبوط مخصص للصالون',
      'رابط صالون جاهز (digitalsalon.website/اسمك)',
      'ربط حسابات السوشيال ميديا',
      'ردود تلقائية على الأسئلة الشائعة',
      'إدارة الحجوزات يدوياً',
      'إدارة العملاء يدوياً',
      'تذاكر الدعم',
    ] : [
      'Customized landing page template',
      'Salon link (digitalsalon.website/your-name)',
      'Social media accounts linking',
      'Auto replies for common questions',
      'Manual bookings management',
      'Manual customer management',
      'Support tickets',
    ],
  },
  {
    id: 'presence',
    name: isAr ? 'الحضور الرقمي' : 'Digital Presence',
    tagline: isAr ? 'موقعك الخاص أو تصميم مخصص' : 'Your website or a custom design',
    priceM: '39',
    priceY: '32',
    popular: false,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    emoji: '🌐',
    features: isAr ? [
      'كل مميزات الباقة المجانية +',
      'استخدم موقعك الإلكتروني الخاص',
      'أو اطلب تصميماً خاصاً احترافياً',
      'ربط حجوزات فريشا (Fresha)',
      'إدارة الحجوزات يدوياً',
      'إدارة العملاء يدوياً',
      'تذاكر دعم يدوية',
      '14 يوم مجاناً',
    ] : [
      'Everything in Free +',
      'Use your own website',
      'Or request a special custom design',
      'Fresha booking link integration',
      'Manual bookings management',
      'Manual customer management',
      'Manual support tickets',
      '14-day free trial',
    ],
  },
  {
    id: 'operations',
    name: isAr ? 'إدارة العمليات' : 'Operations',
    tagline: isAr ? 'حجوزات وخدمة عملاء ذكية' : 'Smart bookings & customer service',
    priceM: '119',
    priceY: '99',
    popular: true,
    color: '#D946EF',
    gradient: 'linear-gradient(135deg, #D946EF, #A855F7)',
    emoji: '⚡',
    features: isAr ? [
      'كل مميزات الحضور الرقمي +',
      'حجوزات تلقائية من جميع القنوات',
      'خدمة عملاء على مدار 24/7',
      'تذاكر دعم تلقائية',
      'قاعدة بيانات العملاء الكاملة',
      'تاريخ العميل وتفضيلاته',
      'إشعارات وتذكيرات للمواعيد',
      'تقارير الحجوزات والعملاء',
      '14 يوم مجاناً',
    ] : [
      'Everything in Digital Presence +',
      'Auto bookings from all channels',
      '24/7 customer service',
      'Automatic support tickets',
      'Full customer database',
      'Customer history & preferences',
      'Appointment notifications & reminders',
      'Bookings & customers reports',
      '14-day free trial',
    ],
  },
  {
    id: 'marketing',
    name: isAr ? 'التسويق والمحتوى' : 'Marketing & Content',
    tagline: isAr ? 'نشر ومحتوى وحملات تسويقية' : 'Publishing, content & campaigns',
    priceM: '199',
    priceY: '165',
    popular: false,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #EAB308)',
    emoji: '🚀',
    features: isAr ? [
      'كل مميزات إدارة العمليات +',
      'إنتاج محتوى (صور وكابشن)',
      'جدولة ونشر على السوشيال ميديا',
      'حملات تسويقية موجهة',
      'تقارير أداء المحتوى',
      'استراتيجية محتوى شهرية',
      'تحليل المنافسين',
      'دعم أولوية مخصص',
      '14 يوم مجاناً',
    ] : [
      'Everything in Operations +',
      'Content creation (images & captions)',
      'Schedule & publish on social media',
      'Targeted marketing campaigns',
      'Content performance reports',
      'Monthly content strategy',
      'Competitor analysis',
      'Dedicated priority support',
      '14-day free trial',
    ],
  },
];

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [ref, inView] = useInView();
  const isAr = i18n.language === 'ar';

  const plans = PLANS(isAr);

  return (
    <section id="pricing" className="ln-section ln-pricing-bg">
      <div className="ln-container">
        <p className="ln-section-label">💰 {isAr ? 'الأسعار' : 'Pricing'}</p>
        <h2 className="ln-section-title">
          {isAr ? 'اختر الباقة المناسبة لصالونك' : 'Choose the right plan for your salon'}
        </h2>
        <p className="ln-section-sub">
          {isAr ? 'ابدأ مجاناً — الباقات المدفوعة تشمل 14 يوم تجربة بدون بطاقة ائتمان' : 'Start for free — paid plans include a 14-day trial, no credit card required'}
        </p>

        {/* Billing toggle */}
        <div className="ln-billing-toggle">
          <div className="ln-toggle-pill">
            <button className={`ln-toggle-opt ${!annual ? 'active' : ''}`} onClick={() => setAnnual(false)}>
              {isAr ? 'شهري' : 'Monthly'}
            </button>
            <button className={`ln-toggle-opt ${annual ? 'active' : ''}`} onClick={() => setAnnual(true)}>
              {isAr ? 'سنوي' : 'Annual'}
            </button>
          </div>
          {annual && (
            <span className="ln-save-badge">
              {isAr ? '🎉 وفّر 20%' : '🎉 Save 20%'}
            </span>
          )}
        </div>

        <div ref={ref} className="ln-plans-grid ln-plans-grid--4col">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={`ln-plan-card ln-fade-up ${plan.popular ? 'popular' : ''} ${inView ? 'ln-visible' : ''}`}
              style={{
                transitionDelay: `${i * 0.15}s`,
                border: plan.popular ? `2px solid ${plan.color}` : undefined,
                boxShadow: plan.popular ? `0 8px 40px ${plan.color}25` : undefined,
                transform: plan.popular ? 'scale(1.03)' : undefined,
              }}
            >
              {plan.popular && (
                <div className="ln-popular-tag" style={{ background: plan.gradient }}>
                  {isAr ? '⭐ الأكثر طلباً' : '⭐ Most Popular'}
                </div>
              )}

              {/* Header */}
              <div style={{ marginBottom: 20, marginTop: plan.popular ? 12 : 0 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{plan.emoji}</div>
                <div className="ln-plan-name" style={{ color: plan.color }}>{plan.name}</div>
                <div className="ln-plan-tagline">{plan.tagline}</div>
              </div>

              {/* Price */}
              <div className="ln-plan-price" style={{ marginBottom: 24 }}>
                <span className="ln-price-dollar">$</span>
                <span className="ln-price-amount" style={{ color: plan.color }}>
                  {annual ? plan.priceY : plan.priceM}
                </span>
                <span className="ln-price-period">/{isAr ? 'شهر' : 'mo'}</span>
              </div>

              {/* Features */}
              <ul className="ln-plan-features" style={{ flex: 1 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <Check size={15} style={{ color: plan.color, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className="ln-btn-primary"
                style={{ width: '100%', background: plan.gradient, border: 'none', marginTop: 20 }}
                onClick={() => navigate('/login')}
              >
                {plan.id === 'free'
                  ? (isAr ? 'ابدأ مجاناً' : 'Get Started Free')
                  : (isAr ? 'ابدأ التجربة المجانية' : 'Start Free Trial')}
              </button>
            </div>
          ))}
        </div>

        <p className="ln-pricing-note">
          {isAr
            ? '✦ جميع الباقات تراكمية — الباقة الأعلى تشمل كل مميزات الباقة الأدنى'
            : '✦ All plans are cumulative — higher plans include all features of lower ones'}
        </p>
      </div>
    </section>
  );
}
