import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { CreditCard, TrendingUp, TrendingDown, Clock, Zap, ChevronLeft, ChevronRight, MessageCircle, Send, Globe, Filter } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const PLATFORM_ICONS = {
  whatsapp: { icon: MessageCircle, color: '#25D366', label: 'WhatsApp' },
  instagram: { icon: Send, color: '#E1306C', label: 'Instagram' },
  facebook: { icon: Send, color: '#0084FF', label: 'Messenger' },
  telegram: { icon: Send, color: '#0088cc', label: 'Telegram' },
  widget: { icon: Globe, color: '#D946EF', label: 'Widget' },
};

const PAGE_SIZE = 15;

function getPlatformFromReason(reason) {
  if (!reason) return null;
  const lower = reason.toLowerCase();
  if (lower.includes('whatsapp')) return 'whatsapp';
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('facebook') || lower.includes('messenger')) return 'facebook';
  if (lower.includes('telegram')) return 'telegram';
  if (lower.includes('widget')) return 'widget';
  return null;
}

export default function Billing() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { wallet, ledger, loading } = useWallet(user?.id);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);

  const totalUsage = useMemo(() => {
    return ledger.reduce((sum, item) => item.amount < 0 ? sum + Math.abs(item.amount) : sum, 0);
  }, [ledger]);

  const filtered = useMemo(() => {
    if (filter === 'all') return ledger;
    return ledger.filter(item => getPlatformFromReason(item.reason) === filter);
  }, [ledger, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Group by date for subtle separators  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Platform filter counts
  const platformCounts = useMemo(() => {
    const counts = { all: ledger.length };
    ledger.forEach(item => {
      const p = getPlatformFromReason(item.reason);
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [ledger]);

  const filterTabs = [
    { id: 'all', label: i18n.language === 'ar' ? 'الكل' : 'All', icon: Filter },
    ...Object.entries(platformCounts)
      .filter(([k]) => k !== 'all')
      .map(([k, count]) => ({
        id: k,
        label: `${PLATFORM_ICONS[k]?.label || k}`,
        icon: PLATFORM_ICONS[k]?.icon || Filter,
        color: PLATFORM_ICONS[k]?.color,
        count,
      })),
  ];

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('billing.title')}</h1>
        <p className="page-subtitle">{t('billing.subtitle')}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard 
          label={t('billing.balance_label')} 
          value={wallet?.balance ?? 0} 
          icon={Zap} 
          color="var(--success)" 
        />
        <StatCard 
          label={t('billing.total_usage')} 
          value={totalUsage} 
          icon={TrendingDown} 
          color="var(--error)" 
        />
        <StatCard 
          label={t('billing.last_recharge')} 
          value={ledger.find(l => l.amount > 0)?.amount ? `+${ledger.find(l => l.amount > 0).amount}` : 0} 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid-2" style={{ gap: 28 }}>
        {/* Recharge Card */}
        <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>{t('billing.recharge_title')}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {t('billing.recharge_sub')}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { amount: 500, price: 50, popular: false },
              { amount: 1500, price: 120, popular: true },
              { amount: 5000, price: 350, popular: false },
            ].map(plan => (
              <div key={plan.amount} className="glass-card" style={{ 
                padding: 16, border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                position: 'relative'
              }}>
                {plan.popular && (
                  <div style={{ 
                    position: 'absolute', left: 16, top: -10, background: 'var(--primary)', 
                    color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 900 
                  }}>{t('billing.plans.popular')}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{plan.amount} {t('billing.plans.tokens')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('billing.plans.unlimited')}</div>
                  </div>
                  <div style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--primary)' }}>{plan.price} {t('common.sar_short') || 'SAR'}</div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>{t('billing.plans.buy_now')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ledger Card — Compact & Paginated */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>{t('billing.ledger_title')}</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {filtered.length} {i18n.language === 'ar' ? 'عملية' : 'entries'}
            </span>
          </div>

          {/* Platform Filter Tabs */}
          <div style={{ 
            display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', 
            paddingBottom: 4, flexWrap: 'nowrap' 
          }}>
            {filterTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setFilter(tab.id); setPage(0); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 20, border: 'none',
                    background: isActive 
                      ? (tab.color ? `${tab.color}20` : 'rgba(217,70,239,0.15)') 
                      : 'var(--surface2)',
                    color: isActive ? (tab.color || 'var(--primary)') : 'var(--text-muted)',
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: isActive ? (tab.color || 'var(--primary)') : 'var(--border)',
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                  {tab.count != null && (
                    <span style={{ 
                      background: isActive ? (tab.color || 'var(--primary)') : 'var(--border)', 
                      color: isActive ? 'white' : 'var(--text-muted)',
                      padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 900 
                    }}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length > 0 ? (
            <>
              {/* Compact Ledger Table */}
              <div style={{ 
                maxHeight: 420, overflowY: 'auto', 
                borderRadius: 12, border: '1px solid var(--border)' 
              }}>
                {pageItems.map((item, idx) => {
                  const platform = getPlatformFromReason(item.reason);
                  const PIcon = platform ? PLATFORM_ICONS[platform]?.icon : null;
                  const pColor = platform ? PLATFORM_ICONS[platform]?.color : 'var(--text-muted)';
                  const prevDate = idx > 0 ? formatDate(pageItems[idx - 1].created_at) : null;
                  const currDate = formatDate(item.created_at);
                  const showDateHeader = currDate !== prevDate;

                  return (
                    <React.Fragment key={item.id}>
                      {showDateHeader && (
                        <div style={{ 
                          padding: '6px 16px', background: 'var(--surface2)', 
                          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                          position: 'sticky', top: 0, zIndex: 1
                        }}>
                          📅 {currDate}
                        </div>
                      )}
                      <div style={{ 
                        padding: '10px 16px', display: 'flex', 
                        justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,70,239,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: item.amount > 0 ? 'rgba(34,197,94,0.1)' : `${pColor}15`,
                            color: item.amount > 0 ? 'var(--success)' : pColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {item.amount > 0 
                              ? <TrendingUp size={14} /> 
                              : (PIcon ? <PIcon size={14} /> : <TrendingDown size={14} />)
                            }
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.reason}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {formatTime(item.created_at)}
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          fontWeight: 900, fontSize: 14, flexShrink: 0,
                          color: item.amount > 0 ? 'var(--success)' : 'var(--error)' 
                        }}>
                          {item.amount > 0 ? `+${item.amount}` : item.amount}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  marginTop: 12, padding: '8px 0' 
                }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    style={{ padding: '6px 12px' }}
                  >
                    <ChevronRight size={14} />
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    style={{ padding: '6px 12px' }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState 
              icon={CreditCard}
              title={t('billing.ledger_empty_title')}
              description={t('billing.ledger_empty_sub')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
