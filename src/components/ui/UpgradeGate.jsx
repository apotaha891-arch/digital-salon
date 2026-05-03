import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import PlansModal from '../billing/PlansModal';

const PLAN_NAMES = {
  en: { free: 'Free', presence: 'Digital Presence', operations: 'Operations', marketing: 'Marketing & Content' },
  ar: { free: 'مجاني', presence: 'الحضور الرقمي', operations: 'إدارة العمليات', marketing: 'التسويق والمحتوى' },
};

/**
 * Wraps children with an upgrade overlay when the user's plan level
 * is below the required minimum.
 *
 * Props:
 *  minPlan   – 'presence' | 'operations' | 'marketing'
 *  isAr      – boolean
 *  children  – content to show when access is allowed
 */
export default function UpgradeGate({ minPlan = 'presence', isAr = false, children }) {
  const { user } = useAuth();
  const { canAccess, plans, planId } = useSubscription(user?.id);
  const [showPlans, setShowPlans] = useState(false);
  const navigate = useNavigate();

  if (canAccess(minPlan)) return <>{children}</>;

  const requiredName = isAr ? PLAN_NAMES.ar[minPlan] : PLAN_NAMES.en[minPlan];
  const currentName  = isAr ? PLAN_NAMES.ar[planId]  : PLAN_NAMES.en[planId];

  return (
    <>
      <PlansModal isOpen={showPlans} onClose={() => setShowPlans(false)} userId={user?.id} isAr={isAr} plans={plans} />

      <div style={{ position: 'relative', minHeight: 420, overflow: 'hidden', borderRadius: 20 }}>
        {/* Blurred ghost of the real content */}
        <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.45 }}>
          {children}
        </div>

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(12,8,24,0.72)',
          backdropFilter: 'blur(2px)',
          borderRadius: 20,
          zIndex: 10,
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(217,70,239,0.2), rgba(147,51,234,0.15))',
            border: '1px solid rgba(217,70,239,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={28} style={{ color: 'var(--primary)' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.3)',
            borderRadius: 20, padding: '4px 14px', marginBottom: 16,
            fontSize: 12, fontWeight: 800, color: 'var(--primary)',
          }}>
            ⚡ {isAr ? 'يتطلب ترقية' : 'Upgrade Required'}
          </div>

          <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 10, color: 'var(--text)' }}>
            {isAr
              ? `هذه الميزة غير متاحة في الباقة ${currentName}`
              : `Not available on the ${currentName} plan`}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, maxWidth: 360, lineHeight: 1.7 }}>
            {isAr
              ? `قومي بالترقية إلى باقة ${requiredName} أو أعلى للوصول إلى هذه الميزة`
              : `Upgrade to the ${requiredName} plan or higher to unlock this feature`}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setShowPlans(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '12px 28px', fontSize: 14, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(217,70,239,0.35)',
              }}
            >
              <Zap size={16} />
              {isAr ? 'عرض الباقات' : 'View Plans'}
            </button>
            <button
              onClick={() => navigate('/billing')}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 12,
                padding: '12px 24px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {isAr ? 'الباقات والفواتير' : 'Plans & Billing'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
