import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { 
  CreditCard, TrendingUp, TrendingDown, Clock, Zap, ChevronLeft, ChevronRight, 
  MessageCircle, Send, Globe, Filter, Crown, Star, Shield, ArrowRight,
  Calendar, Package, AlertTriangle, CheckCircle
} from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import PricingCard from '../components/billing/PricingCard';
import { supabase } from '../services/supabase';
import { createCheckoutSession } from '../services/wallet';

// ─── Constants ───
const PLATFORM_ICONS = {
  whatsapp: { icon: MessageCircle, color: '#25D366', label: 'WhatsApp' },
  instagram: { icon: Send, color: '#E1306C', label: 'Instagram' },
  facebook: { icon: Send, color: '#0084FF', label: 'Messenger' },
  telegram: { icon: Send, color: '#0088cc', label: 'Telegram' },
  widget: { icon: Globe, color: '#D946EF', label: 'Widget' },
};

const PAGE_SIZE = 12;

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

// ─── Tabs ───
const TABS = {
  plans: { icon: Crown, label_en: 'Plans', label_ar: 'الباقات' },
  topup: { icon: Package, label_en: 'Top-up', label_ar: 'شحن رصيد' },
  history: { icon: Clock, label_en: 'History', label_ar: 'السجل' },
};

export default function Billing() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const { wallet, ledger, loading } = useWallet(user?.id);
  
  const [activeTab, setActiveTab] = useState('plans');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [topups, setTopups] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // Load plans and subscription from DB
  useEffect(() => {
    async function loadData() {
      setPlansLoading(true);
      try {
        const [plansRes, subRes, topRes] = await Promise.all([
          supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('subscriptions').select('*').eq('user_id', user?.id).maybeSingle(),
          supabase.from('topup_packages').select('*').eq('is_active', true).order('sort_order'),
        ]);
        setPlans(plansRes.data || []);
        setSubscription(subRes.data);
        setTopups(topRes.data || []);
      } catch (e) {
        console.error('Failed to load plans:', e);
      } finally {
        setPlansLoading(false);
      }
    }
    if (user?.id) loadData();
  }, [user?.id]);

  const displayPlans = plans.length > 0 ? plans : [
    { id: 'starter', name: 'Starter', name_ar: 'المبتدئ', price_usd: 29, monthly_tokens: 200, trial_days: 14, topup_price_per_token: 0.20, booking_payment_enabled: false, booking_fee_usd: 0, features: '["14-day free trial","200 AI tokens/mo","Rollover tokens","All channels","Bookings","CRM","Email support"]', features_ar: '["تجربة مجانية 14 يوم","200 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات","إدارة عملاء","دعم بالإيميل"]' },
    { id: 'pro', name: 'Pro', name_ar: 'الاحترافي', price_usd: 49, monthly_tokens: 400, trial_days: 14, topup_price_per_token: 0.15, booking_payment_enabled: false, booking_fee_usd: 0, features: '["14-day free trial","400 AI tokens/mo","Rollover tokens","All channels","Advanced bookings","CRM","Priority support","Analytics"]', features_ar: '["تجربة مجانية 14 يوم","400 رسالة/شهر","ترحيل الرسائل","جميع القنوات","حجوزات متقدمة","إدارة عملاء","دعم أولوية","تحليلات"]' },
    { id: 'business', name: 'Business', name_ar: 'الأعمال', price_usd: 100, monthly_tokens: 400, trial_days: 14, topup_price_per_token: 0.10, booking_payment_enabled: true, booking_fee_usd: 3, features: '["14-day free trial","400 AI tokens/mo","Rollover tokens","All channels","Online payments","$3/booking fee","Stripe payouts","Priority support","Analytics","Custom AI"]', features_ar: '["تجربة مجانية 14 يوم","400 رسالة/شهر","ترحيل الرسائل","جميع القنوات","دفع إلكتروني","3$ لكل حجز","تحويلات Stripe","دعم أولوية","تحليلات","AI مخصص"]' },
  ];

  const currentPlanId = subscription?.plan_id || null;
  const currentPlan = displayPlans.find(p => p.id === currentPlanId);

  // Ledger calculations
  const totalUsage = useMemo(() => ledger.reduce((sum, item) => item.amount < 0 ? sum + Math.abs(item.amount) : sum, 0), [ledger]);
  const filtered = useMemo(() => {
    if (filter === 'all') return ledger;
    return ledger.filter(item => getPlatformFromReason(item.reason) === filter);
  }, [ledger, filter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (d) => new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const platformCounts = useMemo(() => {
    const c = { all: ledger.length };
    ledger.forEach(item => { const p = getPlatformFromReason(item.reason); if (p) c[p] = (c[p] || 0) + 1; });
    return c;
  }, [ledger]);

  // Current plan top-ups
  const currentTopups = topups.filter(tp => tp.plan_id === currentPlanId);

  const handleSelectPlan = async (plan) => {
    try {
      setCheckoutLoading(plan.id);
      const result = await createCheckoutSession('subscription', {
        plan_id: plan.id,
        user_id: user.id,
        return_url: window.location.origin,
      });
      if (result.url) window.location.href = result.url;
    } catch (err) {
      showToast('❌ ' + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleTopUp = async (pkg) => {
    if (!pkg.id) return showToast(isAr ? '⚠️ هذه الحزمة غير متاحة بعد' : '⚠️ This package is not available yet');
    try {
      setCheckoutLoading(pkg.id);
      const result = await createCheckoutSession('topup', {
        topup_id: pkg.id,
        user_id: user.id,
        return_url: window.location.origin,
      });
      if (result.url) window.location.href = result.url;
    } catch (err) {
      showToast('❌ ' + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>{toast}</div>
      )}
      {/* ═══ HEADER + CURRENT PLAN OVERVIEW ═══ */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={26} style={{ color: 'var(--primary)' }} />
          {isAr ? 'الباقات والفواتير' : 'Plans & Billing'}
        </h1>
        <p className="page-subtitle">{isAr ? 'إدارة اشتراكك ورصيدك' : 'Manage your subscription and balance'}</p>
      </div>

      {/* Current Plan Summary Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        marginBottom: 28
      }}>
        {/* Balance */}
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#10B981'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {isAr ? 'الرصيد' : 'Balance'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981' }}>
              {wallet?.balance ?? 0}
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(217,70,239,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Crown size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {isAr ? 'الخطة' : 'Plan'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>
              {currentPlan ? (isAr ? currentPlan.name_ar : currentPlan.name) : (isAr ? 'لا يوجد' : 'None')}
            </div>
          </div>
        </div>

        {/* Usage */}
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#EF4444'
          }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {isAr ? 'الاستخدام' : 'Usage'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#EF4444' }}>
              {totalUsage}
            </div>
          </div>
        </div>

        {/* Frozen (if any) */}
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: wallet?.frozen_balance > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: wallet?.frozen_balance > 0 ? '#F59E0B' : '#8B5CF6'
          }}>
            {wallet?.frozen_balance > 0 ? <AlertTriangle size={22} /> : <Shield size={22} />}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              {wallet?.frozen_balance > 0 
                ? (isAr ? 'مجمّدة' : 'Frozen') 
                : (isAr ? 'آخر شحن' : 'Last Recharge')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: wallet?.frozen_balance > 0 ? '#F59E0B' : '#8B5CF6' }}>
              {wallet?.frozen_balance > 0 
                ? wallet.frozen_balance 
                : (ledger.find(l => l.amount > 0)?.amount ? `+${ledger.find(l => l.amount > 0).amount}` : '0')}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div style={{ 
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--surface)', borderRadius: 14, padding: 4,
        border: '1px solid var(--border)', width: 'fit-content'
      }}>
        {Object.entries(TABS).map(([key, tab]) => {
          const Icon = tab.icon;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontSize: 13, fontWeight: isActive ? 800 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              <Icon size={16} />
              {isAr ? tab.label_ar : tab.label_en}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: PLANS ═══ */}
      {activeTab === 'plans' && (
        <div>
          {plansLoading ? <Spinner centered /> : (
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
              alignItems: 'stretch'
            }}>
              {displayPlans.map(plan => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isAr={isAr}
                  isCurrentPlan={currentPlanId === plan.id}
                  isPopular={plan.id === 'pro'}
                  comingSoon={plan.id === 'business'}
                  onSelect={handleSelectPlan}
                  loading={checkoutLoading === plan.id}
                />
              ))}
            </div>
          )}

          {/* Token Rollover Info */}
          <div style={{
            marginTop: 24, padding: '16px 24px', borderRadius: 16,
            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
            display: 'flex', gap: 12, alignItems: 'center'
          }}>
            <CheckCircle size={20} style={{ color: '#10B981', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#10B981' }}>
                {isAr ? 'ترحيل الرسائل' : 'Token Rollover'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {isAr 
                  ? 'الرسائل غير المستخدمة تُرحّل للشهر التالي ولا تنتهي. إذا ألغيت الاشتراك، يتم تجميد رصيدك (لا يُحذف) ويعود عند إعادة التفعيل.'
                  : 'Unused tokens roll over to the next month — they never expire. If you cancel, your balance is frozen (not deleted) and restored when you resubscribe.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: TOP-UP ═══ */}
      {activeTab === 'topup' && (
        <div>
          {!currentPlanId ? (
            <div style={{ 
              padding: 60, textAlign: 'center', 
              background: 'var(--surface)', borderRadius: 20,
              border: '1px solid var(--border)'
            }}>
              <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <h3 style={{ fontWeight: 900, marginBottom: 8 }}>
                {isAr ? 'اشترك أولاً' : 'Subscribe First'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {isAr ? 'تحتاج اشتراك نشط لشراء رسائل إضافية' : 'You need an active subscription to purchase top-ups'}
              </p>
              <button 
                onClick={() => setActiveTab('plans')}
                className="btn btn-primary"
                style={{ marginTop: 16 }}
              >
                {isAr ? 'عرض الباقات' : 'View Plans'}
              </button>
            </div>
          ) : (
            <>
              {/* Top-up Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(currentTopups.length > 0 ? currentTopups : [
                  { tokens: 50,  price_usd: 10, is_popular: false },
                  { tokens: 100, price_usd: 20, is_popular: true },
                  { tokens: 200, price_usd: 40, is_popular: false },
                ]).map((pkg, idx) => (
                  <div key={idx} style={{
                    padding: 24, borderRadius: 20,
                    background: 'var(--surface)',
                    border: pkg.is_popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                    textAlign: 'center', position: 'relative',
                    transition: 'all 0.2s'
                  }}>
                    {pkg.is_popular && (
                      <div style={{
                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--primary)', color: 'white',
                        padding: '2px 12px', borderRadius: 10,
                        fontSize: 10, fontWeight: 900
                      }}>
                        {isAr ? 'الأفضل قيمة' : 'Best Value'}
                      </div>
                    )}
                    <div style={{ 
                      width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
                      background: 'rgba(217,70,239,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Zap size={28} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 22 }}>{pkg.tokens}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                      {isAr ? 'رسالة' : 'tokens'}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--primary)', marginBottom: 16 }}>
                      ${pkg.price_usd}
                    </div>
                    <button
                      onClick={() => handleTopUp(pkg)}
                      className="btn btn-primary btn-sm btn-full"
                      style={{ borderRadius: 12 }}
                    >
                      {isAr ? 'شراء' : 'Buy Now'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TAB: HISTORY ═══ */}
      {activeTab === 'history' && (
        <div style={{ 
          background: 'var(--surface)', borderRadius: 20, 
          border: '1px solid var(--border)', overflow: 'hidden' 
        }}>
          {/* Filter Tabs */}
          <div style={{ 
            display: 'flex', gap: 6, padding: '16px 20px', 
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto' 
          }}>
            {[
              { id: 'all', label: isAr ? 'الكل' : 'All', count: platformCounts.all },
              ...Object.entries(platformCounts)
                .filter(([k]) => k !== 'all')
                .map(([k, count]) => ({
                  id: k,
                  label: PLATFORM_ICONS[k]?.label || k,
                  color: PLATFORM_ICONS[k]?.color,
                  count,
                })),
            ].map(tab => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setFilter(tab.id); setPage(0); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, 
                    border: `1px solid ${isActive ? (tab.color || 'var(--primary)') : 'var(--border)'}`,
                    background: isActive ? `${tab.color || 'var(--primary)'}15` : 'transparent',
                    color: isActive ? (tab.color || 'var(--primary)') : 'var(--text-muted)',
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    fontFamily: 'inherit'
                  }}
                >
                  {tab.label}
                  <span style={{ 
                    background: isActive ? (tab.color || 'var(--primary)') : 'var(--surface2)', 
                    color: isActive ? 'white' : 'var(--text-muted)',
                    padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 900 
                  }}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length > 0 ? (
            <>
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
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
                          padding: '6px 20px', background: 'var(--surface2)', 
                          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                          position: 'sticky', top: 0, zIndex: 1
                        }}>
                          📅 {currDate}
                        </div>
                      )}
                      <div style={{ 
                        padding: '10px 20px', display: 'flex', 
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
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatTime(item.created_at)}</div>
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
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '10px 20px', borderTop: '1px solid var(--border)',
                  background: 'var(--surface2)'
                }}>
                  <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronRight size={14} />
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page + 1} / {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronLeft size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{isAr ? 'لا توجد عمليات بعد' : 'No transactions yet'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
