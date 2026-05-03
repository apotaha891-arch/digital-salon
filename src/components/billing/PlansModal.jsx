import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import PricingCard from './PricingCard';
import { createCheckoutSession } from '../../services/wallet';

const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free', name_ar: 'مجاني',
    price_usd: 0, trial_days: 0,
    features: '["Customized landing page template","Salon link (digitalsalon.website/your-name)","Social media accounts linking","Auto replies for common questions","Manual bookings management","Manual customer management","Support tickets"]',
    features_ar: '["قالب صفحة هبوط مخصص للصالون","رابط صالون جاهز (digitalsalon.website/اسمك)","ربط حسابات السوشيال ميديا","ردود تلقائية على الأسئلة الشائعة","إدارة الحجوزات يدوياً","إدارة العملاء يدوياً","تذاكر الدعم"]',
  },
  {
    id: 'presence',
    name: 'Digital Presence', name_ar: 'الحضور الرقمي',
    price_usd: 39, trial_days: 14,
    features: '["Everything in Free +","Use your own website","Or request a special custom design","Fresha booking link integration","Manual bookings management","Manual customer management","Manual support tickets"]',
    features_ar: '["كل مميزات الباقة المجانية +","استخدم موقعك الإلكتروني الخاص","أو اطلب تصميماً خاصاً احترافياً","ربط حجوزات فريشا (Fresha)","إدارة الحجوزات يدوياً","إدارة العملاء يدوياً","تذاكر دعم يدوية"]',
  },
  {
    id: 'operations',
    name: 'Operations', name_ar: 'إدارة العمليات',
    price_usd: 119, trial_days: 14,
    features: '["Everything in Digital Presence","Auto bookings from all channels","24/7 customer service","Automatic support tickets","Full customer database","Customer history & preferences","Appointment notifications","Bookings & customers reports"]',
    features_ar: '["كل مميزات الحضور الرقمي","حجوزات تلقائية من جميع القنوات","خدمة عملاء 24/7","تذاكر دعم تلقائية","قاعدة بيانات العملاء الكاملة","تاريخ العميل وتفضيلاته","إشعارات وتذكيرات للمواعيد","تقارير الحجوزات والعملاء"]',
  },
  {
    id: 'marketing',
    name: 'Marketing & Content', name_ar: 'التسويق والمحتوى',
    price_usd: 199, trial_days: 14,
    features: '["Everything in Operations","Content creation (images & captions)","Schedule & publish on social media","Targeted marketing campaigns","Content performance reports","Monthly content strategy","Competitor analysis","Dedicated priority support"]',
    features_ar: '["كل مميزات إدارة العمليات","إنتاج محتوى (صور وكابشن)","جدولة ونشر على السوشيال ميديا","حملات تسويقية موجهة","تقارير أداء المحتوى","استراتيجية محتوى شهرية","تحليل المنافسين","دعم أولوية مخصص"]',
  },
];

export default function PlansModal({ isOpen, onClose, userId, isAr, plans = [] }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const displayPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  const handleSelect = async (plan) => {
    if (plan.price_usd === 0) { onClose(); return; }
    setError('');
    try {
      setCheckoutLoading(plan.id);
      const result = await createCheckoutSession('subscription', {
        plan_id: plan.id,
        user_id: userId,
        return_url: window.location.origin + '/billing',
      });
      if (result.url) window.location.href = result.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fadeIn 0.2s ease',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 24,
        border: '1px solid var(--border)',
        width: '100%', maxWidth: 1200,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '36px 32px',
        animation: 'slideUp 0.3s ease',
        scrollbarWidth: 'none',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={20} color="white" />
              </div>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>
                {isAr ? '🎉 اختر الباقة المناسبة لصالونك' : '🎉 Choose the right plan for your salon'}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              {isAr
                ? 'الباقات المدفوعة تشمل 14 يوم تجربة مجانية — لا تحتاج بطاقة ائتمان'
                : 'Paid plans include a 14-day free trial — no credit card required'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '10px 16px', color: '#EF4444',
            fontSize: 13, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {displayPlans.map(plan => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAr={isAr}
              isCurrentPlan={false}
              isPopular={plan.id === 'operations'}
              comingSoon={false}
              onSelect={handleSelect}
              loading={checkoutLoading === plan.id}
            />
          ))}
        </div>

        {/* Skip link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13,
              fontFamily: 'inherit', textDecoration: 'underline',
            }}
          >
            {isAr ? 'الاستمرار بالباقة المجانية' : 'Continue with Free Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
