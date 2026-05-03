import React from 'react';
import { Check, Zap, Star, Crown, Building2, Loader2 } from 'lucide-react';

const PLAN_ICONS = {
  free:      Zap,
  presence:  Star,
  operations: Crown,
  marketing: Building2,
  starter:   Star,
  pro:       Crown,
  business:  Building2,
};

const PLAN_COLORS = {
  free:       { primary: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
  presence:   { primary: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
  operations: { primary: '#D946EF', gradient: 'linear-gradient(135deg, #D946EF, #A855F7)' },
  marketing:  { primary: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #EAB308)' },
  starter:    { primary: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
  pro:        { primary: '#D946EF', gradient: 'linear-gradient(135deg, #D946EF, #A855F7)' },
  business:   { primary: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #EAB308)' },
};

export default function PricingCard({
  plan, isAr, isCurrentPlan, isPopular, onSelect, disabled, comingSoon, loading
}) {
  const Icon = PLAN_ICONS[plan.id] || Zap;
  const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.starter;
  const features = isAr ? (plan.features_ar || []) : (plan.features || []);
  const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;

  return (
    <div style={{
      position: 'relative',
      borderRadius: 24,
      border: isPopular ? `2px solid ${colors.primary}` : '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '28px 24px',
      display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s ease',
      boxShadow: isPopular ? `0 8px 32px ${colors.primary}20` : '0 2px 8px rgba(0,0,0,0.05)',
      transform: isPopular ? 'scale(1.03)' : 'scale(1)',
      overflow: 'hidden'
    }}>
      {/* Popular Badge */}
      {isPopular && (
        <div style={{
          position: 'absolute', top: 16, right: isAr ? 'auto' : 16, left: isAr ? 16 : 'auto',
          background: colors.gradient, color: 'white',
          padding: '4px 12px', borderRadius: 20,
          fontSize: 10, fontWeight: 900, letterSpacing: 0.5,
          textTransform: 'uppercase'
        }}>
          {isAr ? '⭐ الأكثر شعبية' : '⭐ Most Popular'}
        </div>
      )}

      {/* Coming Soon Badge */}
      {comingSoon && (
        <div style={{
          position: 'absolute', top: 16, right: isAr ? 'auto' : 16, left: isAr ? 16 : 'auto',
          background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
          padding: '4px 12px', borderRadius: 20,
          fontSize: 10, fontWeight: 900, border: '1px solid rgba(245,158,11,0.3)'
        }}>
          {isAr ? '🔜 قريباً' : '🔜 Coming Soon'}
        </div>
      )}

      {/* Plan Icon & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: isPopular || comingSoon ? 12 : 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `${colors.primary}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colors.primary
        }}>
          <Icon size={22} />
        </div>
        <div>
          <h3 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>
            {isAr ? plan.name_ar : plan.name}
          </h3>
          {plan.trial_days > 0 && (
            <span style={{ fontSize: 11, color: colors.primary, fontWeight: 600 }}>
              {isAr ? `${plan.trial_days} يوم مجاناً` : `${plan.trial_days} days free`}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 20 }}>
        {plan.price_usd > 0 ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)' }}>${plan.price_usd}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
              /{isAr ? 'شهر' : 'mo'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: colors.primary }}>
              {isAr ? 'مجاني' : 'Free'}
            </span>
          </div>
        )}
        
        {plan.monthly_tokens > 0 && false && (
          <div style={{ marginTop: 8 }} />
        )}
      </div>

      {/* Features List */}
      <div style={{ flex: 1, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {parsedFeatures.map((feature, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Check size={15} style={{ 
                color: colors.primary, flexShrink: 0, marginTop: 2,
              }} />
              <span style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--text)' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Fee Info */}
      {plan.booking_payment_enabled && (
        <div style={{ 
          marginBottom: 16, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          fontSize: 11, color: '#F59E0B', textAlign: 'center', fontWeight: 600
        }}>
          💳 {isAr ? 'رسوم الحجز:' : 'Booking fee:'} ${plan.booking_fee_usd}/{isAr ? 'حجز' : 'booking'}
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={() => !disabled && !comingSoon && !loading && !isCurrentPlan && onSelect?.(plan)}
        disabled={disabled || isCurrentPlan || comingSoon || loading || plan.price_usd === 0}
        style={{
          width: '100%', padding: '12px 20px', borderRadius: 14,
          border: 'none', fontFamily: 'inherit',
          background: isCurrentPlan
            ? 'var(--surface2)'
            : (comingSoon ? 'var(--surface2)' : colors.gradient),
          color: isCurrentPlan ? 'var(--text-muted)' : (comingSoon ? 'var(--text-muted)' : 'white'),
          fontSize: 14, fontWeight: 800,
          cursor: isCurrentPlan || comingSoon || loading ? 'default' : 'pointer',
          transition: 'all 0.2s',
          opacity: disabled || loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading
          ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          : isCurrentPlan
            ? (isAr ? '✓ باقتك الحالية' : '✓ Current Plan')
            : comingSoon
              ? (isAr ? '🔜 قريباً' : '🔜 Coming Soon')
              : plan.price_usd === 0
                ? (isAr ? '🎁 مجاني دائماً' : '🎁 Always Free')
                : plan.trial_days > 0
                  ? (isAr ? 'ابدأ التجربة المجانية' : 'Start Free Trial')
                  : (isAr ? 'اشترك الآن' : 'Subscribe Now')
        }
      </button>
    </div>
  );
}
