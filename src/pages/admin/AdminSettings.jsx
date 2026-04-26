import React, { useState, useEffect } from 'react';
import {
  Settings, Users, Zap, CreditCard, TrendingUp, Edit3, Save, X,
  ToggleLeft, ToggleRight, Package, MessageCircle, Send, Globe,
  CheckCircle, AlertCircle, Loader2, RefreshCw, Crown, Star, Building2
} from 'lucide-react';
import { adminGetPlans, adminUpdatePlan, adminTogglePlan, adminGetAllClients } from '../../services/admin';
import { supabase } from '../../services/supabase';
import Spinner from '../../components/ui/Spinner';

const PLATFORM_COSTS = [
  { id: 'telegram',  label: 'Telegram',  icon: Send,          color: '#0088cc', cost: 1 },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: MessageCircle, color: '#25D366', cost: 3 },
  { id: 'instagram', label: 'Instagram', icon: Send,          color: '#E1306C', cost: 2 },
  { id: 'facebook',  label: 'Facebook',  icon: Send,          color: '#0084FF', cost: 2 },
  { id: 'widget',    label: 'Widget',    icon: Globe,         color: '#D946EF', cost: 2 },
];

const PLAN_ICONS = { starter: Star, pro: Crown, business: Building2 };

export default function AdminSettings() {
  const [plans, setPlans]       = useState([]);
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editingPlan, setEditingPlan] = useState(null); // plan id being edited
  const [draftPlan, setDraftPlan]     = useState({});
  const [saving, setSaving]     = useState(null);
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([adminGetPlans(), adminGetAllClients()]);
      setPlans(p);
      setClients(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (plan) => {
    setEditingPlan(plan.id);
    setDraftPlan({ ...plan });
  };

  const cancelEdit = () => { setEditingPlan(null); setDraftPlan({}); };

  const savePlan = async () => {
    setSaving(editingPlan);
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
      cancelEdit();
      showToast('✅ Plan saved successfully');
    } catch (e) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSaving(null);
    }
  };

  const togglePlan = async (plan) => {
    setSaving(plan.id);
    try {
      await adminTogglePlan(plan.id, !plan.is_active);
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
      showToast(`${!plan.is_active ? '✅ Plan activated' : '⏸ Plan deactivated'}`);
    } catch (e) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Spinner centered />;

  // ── Stats ──
  const activeClients   = clients.filter(c => c.is_active).length;
  const activeAgents    = clients.filter(c => c.agent_active).length;
  const totalTokens     = clients.reduce((s, c) => s + (c.wallet_balance || 0), 0);
  const activePlans     = plans.filter(p => p.is_active).length;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={26} style={{ color: 'var(--primary)' }} /> إعدادات المنصة
          </h1>
          <p className="page-subtitle">تحكم كامل في خطط الاشتراك والإعدادات</p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          <RefreshCw size={14} /> تحديث
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: Users,       label: 'إجمالي العملاء',  value: clients.length,  color: '#8B5CF6' },
          { icon: CheckCircle, label: 'العملاء النشطين', value: activeClients,   color: '#10B981' },
          { icon: Zap,         label: 'إجمالي التوكنات', value: totalTokens.toLocaleString(), color: '#F59E0B' },
          { icon: Package,     label: 'الخطط النشطة',    value: activePlans,     color: '#D946EF' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            padding: '20px 24px', borderRadius: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${color}15`, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
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
        borderRadius: 20, overflow: 'hidden', marginBottom: 28
      }}>
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} style={{ color: 'var(--primary)' }} /> إدارة خطط الاشتراك
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{plans.length} خطة</span>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {plans.map(plan => {
            const isEditing = editingPlan === plan.id;
            const draft = isEditing ? draftPlan : plan;
            const Icon = PLAN_ICONS[plan.id] || Package;

            return (
              <div key={plan.id} style={{
                borderRadius: 16, border: `1px solid ${isEditing ? 'var(--primary)' : 'var(--border)'}`,
                overflow: 'hidden', transition: 'border-color 0.2s',
                background: isEditing ? 'rgba(217,70,239,0.02)' : 'transparent'
              }}>
                {/* Plan Header */}
                <div style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  borderBottom: '1px solid var(--border)', background: 'var(--surface2)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(217,70,239,0.1)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                      disabled={saving === plan.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 12px', borderRadius: 8, border: 'none',
                        background: plan.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: plan.is_active ? '#10B981' : '#EF4444',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      {saving === plan.id && !isEditing
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : plan.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />
                      }
                      {plan.is_active ? 'نشطة' : 'موقوفة'}
                    </button>
                    {/* Edit / Save / Cancel */}
                    {isEditing ? (
                      <>
                        <button onClick={cancelEdit} style={{
                          padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-muted)',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <X size={12} /> إلغاء
                        </button>
                        <button onClick={savePlan} disabled={saving === plan.id} style={{
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          background: 'var(--primary)', color: 'white',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          {saving === plan.id
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <><Save size={12} /> حفظ</>
                          }
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(plan)} style={{
                        padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--text)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <Edit3 size={12} /> تعديل
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Fields */}
                <div style={{
                  padding: '16px 20px',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12
                }}>
                  {[
                    { key: 'price_usd',             label: 'السعر ($)',              type: 'number' },
                    { key: 'monthly_tokens',         label: 'التوكنات / شهر',        type: 'number' },
                    { key: 'trial_days',             label: 'أيام التجربة',          type: 'number' },
                    { key: 'topup_price_per_token',  label: 'سعر التوكن الإضافي ($)',type: 'number', step: '0.01' },
                    { key: 'stripe_price_id',        label: 'Stripe Price ID',       type: 'text'   },
                    { key: 'name_ar',                label: 'الاسم بالعربي',         type: 'text'   },
                  ].map(({ key, label, type, step }) => (
                    <div key={key}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>{label}</div>
                      {isEditing ? (
                        <input
                          type={type}
                          step={step}
                          value={draft[key] ?? ''}
                          onChange={e => setDraftPlan(prev => ({ ...prev, [key]: e.target.value }))}
                          style={{
                            width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13,
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                            boxSizing: 'border-box'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '7px 10px', borderRadius: 8, fontSize: 13,
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          fontWeight: 600, color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {draft[key] ?? '—'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Token Pricing (read-only reference) ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 28
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} style={{ color: 'var(--primary)' }} /> تكلفة التوكنات لكل منصة
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            مُحدَّد في كود messenger — لتغييره عدّل messenger/index.ts
          </p>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {PLATFORM_COSTS.map(({ label, icon: Icon, color, cost }) => (
            <div key={label} style={{
              padding: '16px 14px', borderRadius: 14, textAlign: 'center',
              background: `${color}08`, border: `1px solid ${color}25`
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, margin: '0 auto 10px',
                background: `${color}15`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color, marginTop: 4 }}>{cost}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>توكن / رسالة</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Clients by Plan ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> توزيع العملاء
          </h2>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'نشط', color: '#10B981', count: activeClients },
            { label: 'الوكلاء النشطين', color: '#8B5CF6', count: activeAgents },
            { label: 'غير نشط', color: '#EF4444', count: clients.length - activeClients },
          ].map(({ label, color, count }) => (
            <div key={label} style={{
              padding: '20px 24px', borderRadius: 14, textAlign: 'center',
              background: `${color}08`, border: `1px solid ${color}20`
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
