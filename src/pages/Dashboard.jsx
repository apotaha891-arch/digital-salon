import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../hooks/useAgent';
import { useBusiness } from '../hooks/useBusiness';
import { useWallet } from '../hooks/useWallet';
import { useIntegrations } from '../hooks/useIntegrations';
import { Plug, CreditCard, Settings, MessageSquare, Wifi, WifiOff } from 'lucide-react';

import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { agent, loading: aLoading, toggleAgent, saving: tSaving } = useAgent(user?.id);
  const { business, loading: bLoading } = useBusiness(user?.id);
  const { wallet, loading: wLoading } = useWallet(user?.id);
  const { integrations, loading: iLoading, activeToolsMap } = useIntegrations(user?.id);

  const loading = aLoading || bLoading || wLoading || iLoading;

  useEffect(() => {
    if (!loading && !agent && !business) navigate('/setup');
  }, [loading, agent, business, navigate]);

  if (loading) return <Spinner centered />;

  const activeIntegrationsCount = integrations.filter(i => {
    if (i.provider === 'telegram') return !!i.config?.token;
    if (i.provider === 'whatsapp') return !!i.config?.token && !!i.config?.phone_id;
    if (i.provider === 'widget') return !!i.config?.domain;
    return false;
  }).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 26, fontWeight: 900 }}>
          {business?.name || (i18n.language === 'ar' ? 'صالونك الرقمي' : 'Your Digital Salon')}
        </h1>
        <p className="page-subtitle" style={{ fontSize: 16 }}>{t('common.dashboard')}</p>
      </div>

      {/* Agent Status Card */}
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {tSaving ? '...' : agent?.is_active ? t('common.off') : t('common.on')}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard label={t('dashboard.stats.messages')} value={agent?.messages_today || 0} />
        <StatCard label={t('dashboard.stats.bookings')} value={agent?.bookings_today || 0} />
        <StatCard label={t('dashboard.stats.tools')} value={activeIntegrationsCount} />
        <StatCard label={t('dashboard.stats.tokens')} value={wallet?.balance ?? 0} color="var(--success)" />
      </div>

      {/* Quick Actions */}
      <div className="page-header">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t('dashboard.quick_actions.title')}</h2>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: 16, 
        marginBottom: 28 
      }}>
        {[
          { icon: Plug, label: t('dashboard.quick_actions.connect'), sub: t('dashboard.quick_actions.connect_sub'), to: '/integrations', color: 'var(--primary)' },
          { icon: CreditCard, label: t('dashboard.quick_actions.recharge'), sub: t('dashboard.quick_actions.recharge_sub'), to: '/billing', color: 'var(--success)' },
          { icon: Settings, label: t('dashboard.quick_actions.settings'), sub: t('dashboard.quick_actions.settings_sub'), to: '/setup', color: 'var(--warning)' },
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

      {/* Support Section */}
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
            onClick={() => window.open('https://wa.me/966XXXXXXXXX')}
          >
            {t('dashboard.support.btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
