import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../hooks/useBusiness';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { CreditCard, Settings, MessageSquare, CalendarCheck, Users, Zap, X } from 'lucide-react';

import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import PlansModal from '../components/billing/PlansModal';
import { useSubscription } from '../hooks/useSubscription';

export default function Dashboard() {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const { business, loading: bLoading } = useBusiness(user?.id);
  const { stats, loading: sLoading } = useDashboardStats(user?.id);
  const { subscription, plans, planId } = useSubscription(user?.id);
  const [showPlans, setShowPlans] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  const loading = bLoading || sLoading;

  if (loading) return <Spinner centered />;

  // Setup progress
  const setupSteps = [
    { label: isAr ? 'بيانات الصالون' : 'Salon Info',  done: !!(business?.name && business?.phone) },
    { label: isAr ? 'الخدمات'        : 'Services',     done: (business?.services?.length || 0) > 0 },
    { label: isAr ? 'صفحة الصالون'   : 'Salon Page',   done: !!(business?.metadata?.page?.tagline || business?.metadata?.page?.logo_url) },
  ];
  const completedSteps = setupSteps.filter(s => s.done).length;
  const progressPercent = Math.round((completedSteps / setupSteps.length) * 100);
  const isFullySetup = completedSteps === setupSteps.length;

  const ownerName = profile?.full_name || business?.name || (isAr ? 'عزيزتي' : 'there');

  return (
    <div>
      <PlansModal
        isOpen={showPlans}
        onClose={() => setShowPlans(false)}
        userId={user?.id}
        isAr={isAr}
        plans={plans}
      />

      {/* Free Plan Banner */}
      {planId === 'free' && !hideBanner && (
        <div style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(217,70,239,0.12), rgba(147,51,234,0.08))',
          border: '1px solid rgba(217,70,239,0.3)',
          borderRadius: 16, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={20} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              {isAr ? '🎁 أنت على الباقة المجانية' : '🎁 You\'re on the Free plan'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {isAr ? 'قومي بالترقية للوصول إلى الحجوزات والعملاء والتكاملات' : 'Upgrade to unlock bookings, customers & integrations'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setShowPlans(true)}
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '9px 20px', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {isAr ? '⚡ فعّل باقتك' : '⚡ Activate Plan'}
            </button>
            <button
              onClick={() => setHideBanner(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 26, fontWeight: 900 }}>
            {isAr ? `مرحباً، ${ownerName} 👋` : `Welcome back, ${ownerName} 👋`}
          </h1>
          <p className="page-subtitle" style={{ fontSize: 16 }}>
            {business?.name || (isAr ? 'صالونك الرقمي' : 'Your Digital Salon')}
          </p>
        </div>
      </div>

      {/* Setup Progress */}
      {!isFullySetup && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {isAr
                ? `أكملت ${completedSteps} من ${setupSteps.length} خطوات الإعداد`
                : `${completedSteps} of ${setupSteps.length} setup steps complete`}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{progressPercent}%</span>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', borderRadius: 8, width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--primary), #e879f9)',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {setupSteps.map((step, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 20,
                background: step.done ? 'rgba(34,197,94,0.1)' : 'var(--surface2)',
                color: step.done ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${step.done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
              }}>
                {step.done ? '✓' : '○'} {step.label}
              </span>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate('/setup')}>
            {isAr ? 'إكمال الإعداد ←' : 'Complete Setup →'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard label={isAr ? 'حجوزات اليوم'    : "Today's Bookings"} value={stats.bookingsToday}  icon={CalendarCheck} />
        <StatCard label={isAr ? 'إجمالي الحجوزات' : 'Total Bookings'}   value={stats.messagesToday}  icon={CalendarCheck} />
        <StatCard label={isAr ? 'العملاء'          : 'Customers'}        value={stats.customersTotal ?? 0} icon={Users} />
        <StatCard label={isAr ? 'التذاكر المفتوحة' : 'Open Tickets'}     value={stats.openTickets   ?? 0} icon={MessageSquare} />
      </div>

      {/* Quick Actions */}
      <div className="page-header">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: CalendarCheck, label: isAr ? 'الحجوزات'     : 'Bookings',       sub: isAr ? 'إدارة وإضافة الحجوزات'    : 'Manage & add bookings',    to: '/bookings',  color: 'var(--primary)' },
          { icon: Users,         label: isAr ? 'العملاء'        : 'Customers',      sub: isAr ? 'قاعدة بيانات العملاء'     : 'Your client database',     to: '/customers', color: '#10B981' },
          { icon: MessageSquare, label: isAr ? 'تذاكر الدعم'   : 'Support Tickets', sub: isAr ? 'متابعة الشكاوي والطلبات'  : 'Follow up on requests',    to: '/tickets',   color: '#8B5CF6' },
          { icon: Settings,      label: isAr ? 'إعدادات الصالون': 'Salon Setup',    sub: isAr ? 'بيانات الصالون والخدمات'   : 'Info, services & page',    to: '/setup',     color: 'var(--warning)' },
          { icon: CreditCard,    label: isAr ? 'الاشتراك'       : 'Billing',         sub: isAr ? 'إدارة باقتك واشتراكك'     : 'Manage your subscription', to: '/billing',   color: '#EF4444' },
        ].map(({ icon: Icon, label, sub, to, color }) => (
          <div
            key={to}
            className="card"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => navigate(to)}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Icon size={28} style={{ color, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="card" style={{
        borderLeft: '4px solid var(--primary)',
        background: 'linear-gradient(to right, rgba(217,70,239,0.05), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'var(--primary)', padding: 10, borderRadius: 12, color: 'white' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{isAr ? 'هل تحتاج مساعدة؟' : 'Need help?'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {isAr ? 'فريق الدعم جاهز للمساعدة' : 'Our support team is ready to help'}
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginInlineStart: 'auto' }}
            onClick={() => window.dispatchEvent(new CustomEvent('openConcierge'))}
          >
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </button>
        </div>
      </div>
    </div>
  );
}
