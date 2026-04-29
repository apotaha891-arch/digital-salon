import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings, Users, Zap, CreditCard, TrendingUp, Edit3, Save, X,
  ToggleLeft, ToggleRight, Package, MessageCircle, Send, Globe,
  CheckCircle, Loader2, RefreshCw, Crown, Star, Building2, Plus, Trash2
} from 'lucide-react';
import {
  adminGetPlans, adminUpdatePlan, adminTogglePlan, adminGetAllClients,
  adminGetPlatformSettings, adminUpdatePlatformSetting,
  adminGetTopups, adminSaveTopup, adminDeleteTopup,
} from '../../services/admin';
import Spinner from '../../components/ui/Spinner';

const PLATFORM_META = {
  whatsapp:  { label: 'WhatsApp',  icon: MessageCircle, color: '#25D366' },
  instagram: { label: 'Instagram', icon: Send,          color: '#E1306C' },
  facebook:  { label: 'Facebook',  icon: Send,          color: '#0084FF' },
  telegram:  { label: 'Telegram',  icon: Send,          color: '#0088cc' },
  widget:    { label: 'Widget',    icon: Globe,         color: '#D946EF' },
  concierge: { label: 'Concierge', icon: Globe,         color: '#8B5CF6' },
};

const PLAN_ICONS = { starter: Star, pro: Crown, business: Building2 };

const Field = ({ label, value, editing, onChange, type = 'text', step }) => (
  <div>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>{label}</div>
    {editing ? (
      <input
        type={type} step={step} value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13,
          background: 'var(--surface)', border: '1px solid var(--primary)',
          color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    ) : (
      <div style={{
        padding: '7px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value ?? '—'}
      </div>
    )}
  </div>
);

export default function AdminSettings() {
  const { i18n } = useTranslation();
  const ar = i18n.language === 'ar';

  const [plans, setPlans]               = useState([]);
  const [clients, setClients]           = useState([]);
  const [platformSettings, setPlatform] = useState([]);
  const [loading, setLoading]           = useState(true);

  // Plans editing
  const [editingPlan, setEditingPlan] = useState(null);
  const [draftPlan, setDraftPlan]     = useState({});
  const [savingPlan, setSavingPlan]   = useState(null);

  const [topups, setTopups]           = useState([]);
  const [savingTopup, setSavingTopup] = useState(null);
  const [newTopup, setNewTopup]       = useState({ tokens: '', price_usd: '', is_popular: false });

  // Platform cost editing
  const [editingCosts, setEditingCosts] = useState(false);
  const [draftCosts, setDraftCosts]     = useState({});
  const [savingCosts, setSavingCosts]   = useState(false);

  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, ps, tp] = await Promise.all([
        adminGetPlans(),
        adminGetAllClients(),
        adminGetPlatformSettings(),
        adminGetTopups(),
      ]);
      setPlans(p);
      setClients(c);
      setPlatform(ps);
      setTopups(tp);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Plan helpers ──
  const startEditPlan = (plan) => { setEditingPlan(plan.id); setDraftPlan({ ...plan }); };
  const cancelEditPlan = () => { setEditingPlan(null); setDraftPlan({}); };

  const savePlan = async () => {
    setSavingPlan(editingPlan);
    try {
      const updated = await adminUpdatePlan(editingPlan, {
        name:                  draftPlan.name,
        name_ar:               draftPlan.name_ar,
        price_usd:             Number(draftPlan.price_usd),
        monthly_tokens:        Number(draftPlan.monthly_tokens),
        trial_days:            Number(draftPlan.trial_days),
        topup_price_per_token: Number(draftPlan.topup_price_per_token),
        stripe_price_id:       draftPlan.stripe_price_id,
        is_active:             draftPlan.is_active,
      });
      setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      cancelEditPlan();
      showToast(ar ? '✅ تم حفظ الخطة' : '✅ Plan saved');
    } catch (e) { showToast(`❌ ${e.message}`); }
    finally { setSavingPlan(null); }
  };

  const togglePlan = async (plan) => {
    setSavingPlan(plan.id);
    try {
      await adminTogglePlan(plan.id, !plan.is_active);
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
      showToast(!plan.is_active
        ? (ar ? '✅ الخطة نشطة' : '✅ Plan activated')
        : (ar ? '⏸ الخطة موقوفة' : '⏸ Plan deactivated'));
    } catch (e) { showToast(`❌ ${e.message}`); }
    finally { setSavingPlan(null); }
  };

  // ── Platform cost helpers ──
  const startEditCosts = () => {
    const map = {};
    platformSettings.forEach(ps => { map[ps.platform] = ps.token_cost; });
    setDraftCosts(map);
    setEditingCosts(true);
  };
  const cancelEditCosts = () => { setEditingCosts(false); setDraftCosts({}); };

  const saveCosts = async () => {
    setSavingCosts(true);
    try {
      await Promise.all(
        Object.entries(draftCosts).map(([platform, cost]) =>
          adminUpdatePlatformSetting(platform, Number(cost))
        )
      );
      const updated = platformSettings.map(ps => ({
        ...ps,
        token_cost: Number(draftCosts[ps.platform] ?? ps.token_cost),
      }));
      setPlatform(updated);
      setEditingCosts(false);
      showToast(ar ? '✅ تم حفظ تكاليف المنصات' : '✅ Platform costs saved');
    } catch (e) { showToast(`❌ ${e.message}`); }
    finally { setSavingCosts(false); }
  };

  // ── Top-up helpers ──
  const saveTopupPkg = async (pkg) => {
    setSavingTopup(pkg.id || 'new');
    try {
      const saved = await adminSaveTopup({
        ...pkg,
        tokens: Number(pkg.tokens),
        price_usd: Number(pkg.price_usd),
        sort_order: pkg.sort_order ?? topups.length + 1,
      });
      if (pkg.id) {
        setTopups(prev => prev.map(t => t.id === saved.id ? saved : t));
      } else {
        setTopups(prev => [...prev, saved]);
        setNewTopup({ tokens: '', price_usd: '', is_popular: false });
      }
      showToast(ar ? '✅ تم الحفظ' : '✅ Saved');
    } catch (e) { showToast(`❌ ${e.message}`); }
    finally { setSavingTopup(null); }
  };

  const deleteTopupPkg = async (id) => {
    setSavingTopup(id);
    try {
      await adminDeleteTopup(id);
      setTopups(prev => prev.filter(t => t.id !== id));
      showToast(ar ? '🗑 تم الحذف' : '🗑 Deleted');
    } catch (e) { showToast(`❌ ${e.message}`); }
    finally { setSavingTopup(null); }
  };

  if (loading) return <Spinner centered />;

  const activeClients = clients.filter(c => c.is_active).length;
  const activeAgents  = clients.filter(c => c.agent_active).length;
  const totalTokens   = clients.reduce((s, c) => s + (c.wallet_balance || 0), 0);
  const activePlans   = plans.filter(p => p.is_active).length;

  const t = (en, arText) => ar ? arText : en;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={26} style={{ color: 'var(--primary)' }} />
            {t('Platform Settings', 'إعدادات المنصة')}
          </h1>
          <p className="page-subtitle">
            {t('Full control over subscription plans and platform configuration', 'تحكم كامل في خطط الاشتراك والإعدادات')}
          </p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <RefreshCw size={14} /> {t('Refresh', 'تحديث')}
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: Users,        label: t('Total Clients', 'إجمالي العملاء'),   value: clients.length,                  color: '#8B5CF6' },
          { icon: CheckCircle,  label: t('Active Clients', 'العملاء النشطين'), value: activeClients,                   color: '#10B981' },
          { icon: Zap,          label: t('Total Tokens', 'إجمالي التوكنات'),   value: totalTokens.toLocaleString(),    color: '#F59E0B' },
          { icon: Package,      label: t('Active Plans', 'الخطط النشطة'),      value: activePlans,                     color: '#D946EF' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            padding: '20px 24px', borderRadius: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${color}15`, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Subscription Plans ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 28,
      }}>
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} style={{ color: 'var(--primary)' }} />
            {t('Subscription Plans', 'إدارة خطط الاشتراك')}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {plans.length} {t('plans', 'خطة')}
          </span>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {plans.map(plan => {
            const isEditing = editingPlan === plan.id;
            const draft = isEditing ? draftPlan : plan;
            const Icon = PLAN_ICONS[plan.id] || Package;

            return (
              <div key={plan.id} style={{
                borderRadius: 16,
                border: `1px solid ${isEditing ? 'var(--primary)' : 'var(--border)'}`,
                overflow: 'hidden', transition: 'border-color 0.2s',
                background: isEditing ? 'rgba(217,70,239,0.02)' : 'transparent',
              }}>
                {/* Plan Header */}
                <div style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(217,70,239,0.1)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{plan.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginInlineStart: 8 }}>{plan.name_ar}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Active toggle */}
                    <button
                      onClick={() => !isEditing && togglePlan(plan)}
                      disabled={savingPlan === plan.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 12px', borderRadius: 8, border: 'none',
                        background: plan.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: plan.is_active ? '#10B981' : '#EF4444',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {savingPlan === plan.id && !isEditing
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : plan.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />
                      }
                      {plan.is_active ? t('Active', 'نشطة') : t('Inactive', 'موقوفة')}
                    </button>
                    {/* Edit / Save / Cancel */}
                    {isEditing ? (
                      <>
                        <button onClick={cancelEditPlan} style={{
                          padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-muted)',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <X size={12} /> {t('Cancel', 'إلغاء')}
                        </button>
                        <button onClick={savePlan} disabled={savingPlan === plan.id} style={{
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          background: 'var(--primary)', color: 'white',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {savingPlan === plan.id
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <><Save size={12} /> {t('Save', 'حفظ')}</>
                          }
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEditPlan(plan)} style={{
                        padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Edit3 size={12} /> {t('Edit', 'تعديل')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Fields */}
                <div style={{
                  padding: '16px 20px',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                }}>
                  {[
                    { key: 'price_usd',            label: t('Price (USD)', 'السعر ($)'),                       type: 'number' },
                    { key: 'monthly_tokens',        label: t('Tokens / Month', 'التوكنات / شهر'),               type: 'number' },
                    { key: 'trial_days',            label: t('Trial Days', 'أيام التجربة'),                     type: 'number' },
                    { key: 'topup_price_per_token', label: t('Top-up Price / Token ($)', 'سعر التوكن الإضافي ($)'), type: 'number', step: '0.001' },
                    { key: 'stripe_price_id',       label: 'Stripe Price ID',                                   type: 'text' },
                    { key: 'name_ar',               label: t('Arabic Name', 'الاسم بالعربي'),                   type: 'text' },
                  ].map(({ key, label, type, step }) => (
                    <Field
                      key={key}
                      label={label}
                      value={draft[key]}
                      editing={isEditing}
                      type={type}
                      step={step}
                      onChange={val => setDraftPlan(prev => ({ ...prev, [key]: val }))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Platform Token Costs ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 28,
      }}>
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: 'var(--primary)' }} />
              {t('Token Cost per Platform', 'تكلفة التوكنات لكل منصة')}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {t('Tokens deducted per AI message on each channel', 'عدد التوكنات المخصومة لكل رسالة ذكاء اصطناعي')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editingCosts ? (
              <>
                <button onClick={cancelEditCosts} style={{
                  padding: '7px 16px', borderRadius: 9, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <X size={13} /> {t('Cancel', 'إلغاء')}
                </button>
                <button onClick={saveCosts} disabled={savingCosts} style={{
                  padding: '7px 16px', borderRadius: 9, border: 'none',
                  background: 'var(--primary)', color: 'white',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {savingCosts
                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    : <><Save size={13} /> {t('Save All', 'حفظ الكل')}</>
                  }
                </button>
              </>
            ) : (
              <button onClick={startEditCosts} style={{
                padding: '7px 16px', borderRadius: 9, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Edit3 size={13} /> {t('Edit Costs', 'تعديل التكاليف')}
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {platformSettings.map(ps => {
            const meta = PLATFORM_META[ps.platform] || { label: ps.platform, icon: Globe, color: '#888' };
            const Icon = meta.icon;
            const cost = editingCosts ? (draftCosts[ps.platform] ?? ps.token_cost) : ps.token_cost;

            return (
              <div key={ps.platform} style={{
                padding: '18px 16px', borderRadius: 14, textAlign: 'center',
                background: `${meta.color}08`, border: `1px solid ${meta.color}25`,
                transition: 'border-color 0.2s',
                ...(editingCosts ? { borderColor: `${meta.color}50` } : {}),
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, margin: '0 auto 10px',
                  background: `${meta.color}15`, color: meta.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{meta.label}</div>
                {editingCosts ? (
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={e => setDraftCosts(prev => ({ ...prev, [ps.platform]: e.target.value }))}
                    style={{
                      width: 70, padding: '6px 8px', borderRadius: 8, fontSize: 18,
                      fontWeight: 900, textAlign: 'center',
                      background: 'var(--surface)', border: `2px solid ${meta.color}`,
                      color: meta.color, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 26, fontWeight: 900, color: meta.color }}>
                    {ps.token_cost === 0 ? t('Free', 'مجاني') : ps.token_cost}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {ps.token_cost === 0 && !editingCosts ? '' : t('tokens / msg', 'توكن / رسالة')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top-up Packages ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} style={{ color: 'var(--primary)' }} />
            {ar ? 'حزم الشحن' : 'Top-up Packages'}
          </h2>
        </div>
        <div style={{ padding: 24 }}>
          {/* Existing packages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {topups.map(pkg => (
              <div key={pkg.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--surface2)', border: '1px solid var(--border)',
              }}>
                <Zap size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <input type="number" value={pkg.tokens}
                  onChange={e => setTopups(prev => prev.map(t => t.id === pkg.id ? { ...t, tokens: e.target.value } : t))}
                  style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ar ? 'توكن' : 'tokens'}</span>
                <span style={{ marginInline: 4, color: 'var(--text-muted)' }}>@</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" value={pkg.price_usd}
                  onChange={e => setTopups(prev => prev.map(t => t.id === pkg.id ? { ...t, price_usd: e.target.value } : t))}
                  style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginInlineStart: 8 }}>
                  <input type="checkbox" checked={pkg.is_popular}
                    onChange={e => setTopups(prev => prev.map(t => t.id === pkg.id ? { ...t, is_popular: e.target.checked } : t))} />
                  {ar ? 'الأفضل' : 'Popular'}
                </label>
                <div style={{ flex: 1 }} />
                <button onClick={() => saveTopupPkg(pkg)} disabled={savingTopup === pkg.id}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {savingTopup === pkg.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
                  {ar ? 'حفظ' : 'Save'}
                </button>
                <button onClick={() => deleteTopupPkg(pkg.id)} disabled={savingTopup === pkg.id}
                  style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new package */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12,
            border: '2px dashed var(--border)',
          }}>
            <Plus size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input type="number" placeholder={ar ? 'التوكنات' : 'Tokens'} value={newTopup.tokens}
              onChange={e => setNewTopup(p => ({ ...p, tokens: e.target.value }))}
              style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ar ? 'توكن' : 'tokens'}</span>
            <span style={{ marginInline: 4, color: 'var(--text-muted)' }}>@</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>$</span>
            <input type="number" step="0.01" placeholder="0.00" value={newTopup.price_usd}
              onChange={e => setNewTopup(p => ({ ...p, price_usd: e.target.value }))}
              style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginInlineStart: 8 }}>
              <input type="checkbox" checked={newTopup.is_popular}
                onChange={e => setNewTopup(p => ({ ...p, is_popular: e.target.checked }))} />
              {ar ? 'الأفضل' : 'Popular'}
            </label>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => newTopup.tokens && newTopup.price_usd && saveTopupPkg(newTopup)}
              disabled={!newTopup.tokens || !newTopup.price_usd || savingTopup === 'new'}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              {savingTopup === 'new' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />}
              {ar ? 'إضافة' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Client Distribution ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            {t('Client Distribution', 'توزيع العملاء')}
          </h2>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: t('Active', 'نشط'),                          color: '#10B981', count: activeClients },
            { label: t('Active Agents', 'الوكلاء النشطين'),       color: '#8B5CF6', count: activeAgents },
            { label: t('Inactive', 'غير نشط'),                    color: '#EF4444', count: clients.length - activeClients },
          ].map(({ label, color, count }) => (
            <div key={label} style={{
              padding: '20px 24px', borderRadius: 14, textAlign: 'center',
              background: `${color}08`, border: `1px solid ${color}20`,
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color }}>{count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
