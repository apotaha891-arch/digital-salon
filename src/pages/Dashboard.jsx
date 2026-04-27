import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../hooks/useAgent';
import { useBusiness } from '../hooks/useBusiness';
import { useWallet } from '../hooks/useWallet';
import { useIntegrations } from '../hooks/useIntegrations';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Plug, CreditCard, Settings, MessageSquare, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const { agent, loading: aLoading, toggleAgent, saving: tSaving } = useAgent(user?.id);
  const { business, loading: bLoading } = useBusiness(user?.id);
  const { wallet, loading: wLoading } = useWallet(user?.id);
  const { integrations, loading: iLoading } = useIntegrations(user?.id);
  const { stats, loading: sLoading } = useDashboardStats(user?.id);

  const loading = aLoading || bLoading || wLoading || iLoading || sLoading;

  useEffect(() => {
    if (!loading && !agent && !business) navigate('/setup');
  }, [loading, agent, business, navigate]);

  if (loading) return <Spinner centered />;

  const activeIntegrationsCount = integrations.filter(i => {
    if (!i.is_active) return false;
    if (i.provider === 'facebook' || i.provider === 'instagram')
      return !!i.config?.page_id && !!i.config?.access_token;
    if (i.provider === 'telegram') return !!i.config?.token;
    if (i.provider === 'whatsapp') return !!i.config?.token && !!i.config?.phone_id;
    if (i.provider === 'widget')   return !!i.config?.domain;
    return true;
  }).length;

  const tokenBalance = wallet?.balance ?? 0;
  const lowBalance = tokenBalance < 50;

  // Setup progress
  const setupSteps = [
    { label: isAr ? 'بيانات الصالون' : 'Salon Info',   done: !!(business?.name && business?.phone) },
    { label: isAr ? 'الخدمات'        : 'Services',      done: (business?.services?.length || 0) > 0 },
    { label: isAr ? 'شخصية الموظفة'  : 'Agent',         done: !!agent?.name },
    { label: isAr ? 'ربط قناة'        : 'Channel',       done: activeIntegrationsCount > 0 },
    { label: isAr ? 'شحن الرصيد'     : 'Balance',       done: tokenBalance > 0 },
  ];
  const completedSteps = setupSteps.filter(s => s.done).length;
  const progressPercent = Math.round((completedSteps / setupSteps.length) * 100);
  const isFullySetup = completedSteps === setupSteps.length;

  const ownerName = profile?.full_name || business?.name || (isAr ? 'عزيزتي' : 'there');

  return (
    <div>
      {/* Welcome Header */}
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

      {/* ── Low Token Warning ── */}
      {lowBalance && (
        <div className="card" style={{
          borderLeft: '4px solid var(--error)',
          background: 'linear-gradient(to right, rgba(239,68,68,0.06), transparent)',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--error)' }}>
              {isAr ? `رصيدك منخفض — ${tokenBalance} توكن فقط` : `Low balance — ${tokenBalance} tokens left`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {isAr ? 'ستتوقف الموظفة عن الرد عند نفاد الرصيد' : 'Agent will stop responding when balance reaches zero'}
            </div>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: 13, flexShrink: 0 }} onClick={() => navigate('/billing')}>
            {isAr ? 'شحن الآن' : 'Recharge'}
          </button>
        </div>
      )}

      {/* ── Setup Progress Bar ── */}
      {!isFullySetup && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {isAr
                ? `أكملتِ ${completedSteps} من ${setupSteps.length} خطوات الإعداد`
                : `${completedSteps} of ${setupSteps.length} setup steps complete`}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{progressPercent}%</span>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', borderRadius: 8,
              width: `${progressPercent}%`,
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

      {/* ── Agent Status Card ── */}
      <div className="agent-card glow" style={{ marginBottom: 28 }}>
        <div className="agent-avatar">{agent?.avatar || '💅'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>{agent?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>{t('common.agent_role')}</div>
          <Badge variant={agent?.is_active ? 'active' : 'inactive'} icon={agent?.is_active ? Wifi : WifiOff}>
            {agent?.is_active ? t('common.active') : t('common.inactive')}
          </Badge>
        </div>
        <div style={{ textAlign: 'center' }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={agent?.is_active || false}
              onChange={toggleAgent}
              disabled={tSaving}
            />
            <span className="toggle-slider" />
          </label>
          <div style={{ fontSize: 11, color: agent?.is_active ? 'var(--success)' : 'var(--text-muted)', marginTop: 6 }}>
            {tSaving ? '...' : (agent?.is_active ? t('common.active') : t('common.inactive'))}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid" style={{ marginBottom: activeIntegrationsCount === 0 ? 16 : 28 }}>
        <StatCard label={t('dashboard.stats.messages')} value={stats.messagesToday} />
        <StatCard label={t('dashboard.stats.bookings')} value={stats.bookingsToday} />
        <StatCard label={t('dashboard.stats.tools')} value={activeIntegrationsCount} />
        <StatCard label={t('dashboard.stats.tokens')} value={tokenBalance} color={lowBalance ? 'var(--error)' : 'var(--success)'} />
      </div>

      {/* ── No Channels CTA ── */}
      {activeIntegrationsCount === 0 && (
        <div className="card" style={{
          borderLeft: '4px solid var(--warning)',
          background: 'linear-gradient(to right, rgba(245,158,11,0.05), transparent)',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28
        }}>
          <Plug size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {isAr ? 'لم تربطي أي قناة بعد' : 'No channels connected yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {isAr
                ? 'اربطي واتساب أو تيليجرام لتبدأ الموظفة بالعمل'
                : 'Connect WhatsApp or Telegram to activate your agent'}
            </div>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 13, flexShrink: 0 }} onClick={() => navigate('/integrations')}>
            {isAr ? 'ربط الآن ←' : 'Connect Now →'}
          </button>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="page-header">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t('dashboard.quick_actions.title')}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: Plug,        label: t('dashboard.quick_actions.connect'),  sub: t('dashboard.quick_actions.connect_sub'),  to: '/integrations', color: 'var(--primary)' },
          { icon: CreditCard,  label: t('dashboard.quick_actions.recharge'), sub: t('dashboard.quick_actions.recharge_sub'), to: '/billing',      color: 'var(--success)' },
          { icon: Settings,    label: t('dashboard.quick_actions.settings'), sub: t('dashboard.quick_actions.settings_sub'), to: '/setup',        color: 'var(--warning)' },
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

      {/* ── Support ── */}
      <div className="card" style={{
        borderLeft: '4px solid var(--primary)',
        background: 'linear-gradient(to right, rgba(217,70,239,0.05), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'var(--primary)', padding: 10, borderRadius: 12, color: 'white' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{t('dashboard.support.title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('dashboard.support.sub')}</div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginRight: 'auto' }}
            onClick={() => window.dispatchEvent(new CustomEvent('openConcierge'))}
          >
            {t('dashboard.support.btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
