import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import PricingCard from './PricingCard';
import { createCheckoutSession } from '../../services/wallet';

const FALLBACK_PLANS = [
  { id: 'starter', name: 'Starter', name_ar: 'المبتدئ', price_usd: 29, monthly_tokens: 200, trial_days: 14, topup_price_per_token: 0.20, features: '["14-day free trial","200 AI tokens/mo","Rollover tokens","All channels","Bookings","CRM","Email support"]', features_ar: '["تجربة مجانية 14 يوم","200 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات","إدارة عملاء","دعم بالإيميل"]' },
  { id: 'pro', name: 'Pro', name_ar: 'الاحترافي', price_usd: 49, monthly_tokens: 400, trial_days: 14, topup_price_per_token: 0.15, features: '["14-day free trial","400 AI tokens/mo","Rollover tokens","All channels","Advanced bookings","CRM","Priority support","Analytics"]', features_ar: '["تجربة مجانية 14 يوم","400 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات متقدمة","إدارة عملاء","دعم أولوية","تحليلات"]' },
  { id: 'business', name: 'Business', name_ar: 'الأعمال', price_usd: 100, monthly_tokens: 400, trial_days: 14, topup_price_per_token: 0.10, features: '["14-day free trial","400 AI tokens/mo","All channels","Online payments","Stripe payouts","Priority support","Analytics","Custom AI"]', features_ar: '["تجربة مجانية 14 يوم","400 رسالة/شهر","جميع القنوات","دفع إلكتروني","تحويلات Stripe","دعم أولوية","تحليلات","AI مخصص"]' },
];

export default function PlansModal({ isOpen, onClose, userId, isAr, plans = [] }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const displayPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  const handleSelect = async (plan) => {
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
        width: '100%', maxWidth: 900,
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
                {isAr ? '🎉 إعدادك جاهز! فعّل موظفتك الآن' : '🎉 Setup complete! Activate your agent'}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              {isAr
                ? 'اختر باقتك وابدأ تجربتك المجانية 14 يوماً — لا تحتاج بطاقة ائتمان الآن'
                : 'Choose your plan and start your 14-day free trial — no credit card needed now'}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
          {displayPlans.map(plan => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAr={isAr}
              isCurrentPlan={false}
              isPopular={plan.id === 'pro'}
              comingSoon={plan.id === 'business'}
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
            {isAr ? 'الاستمرار بالتجربة المجانية (100 رسالة)' : 'Continue with free trial (100 tokens)'}
          </button>
        </div>
      </div>
    </div>
  );
}
