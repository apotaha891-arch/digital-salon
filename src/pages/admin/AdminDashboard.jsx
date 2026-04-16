import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/useAdmin';
import { Users, Zap, CreditCard, TrendingUp } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import StatCard from '../../components/ui/StatCard';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { clients, loading } = useAdmin();

  if (loading) return <Spinner centered />;

  const activeAgents = clients.filter(c => c.agent_active).length;
  const totalBalance = clients.reduce((sum, c) => sum + (c.wallet_balance || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('admin.dashboard.title')}</h1>
        <p className="page-subtitle">{t('admin.dashboard.subtitle')}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard 
          icon={Users} 
          label={t('admin.dashboard.stats.total_clients')} 
          value={clients.length} 
          color="var(--primary)" 
        />
        <StatCard 
          icon={Zap} 
          label={t('admin.dashboard.stats.active_agents')} 
          value={activeAgents} 
          color="var(--success)" 
        />
        <StatCard 
          icon={CreditCard} 
          label={t('admin.dashboard.stats.total_tokens')} 
          value={totalBalance.toLocaleString()} 
          color="var(--warning)" 
        />
        <StatCard 
          icon={TrendingUp} 
          label={t('admin.dashboard.stats.activation_rate')} 
          value={clients.length ? `${Math.round(activeAgents / clients.length * 100)}%` : '0%'} 
          color="var(--accent)" 
        />
      </div>

      {/* Recent clients */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('admin.dashboard.recent_clients')}</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.client')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.agent')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.balance')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.status')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.join_date')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.slice(0, 5).map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 600 }}>{c.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>{c.agent_name || '—'}</td>
                <td style={{ padding: '16px 24px', color: 'var(--primary)', fontWeight: 700 }}>{c.wallet_balance ?? 0}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {c.is_active ? t('admin.clients.status.active') : t('admin.clients.status.inactive')}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
                  {new Date(c.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
