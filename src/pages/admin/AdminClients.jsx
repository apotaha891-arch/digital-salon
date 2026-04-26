import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/useAdmin';
import { 
  User, CreditCard, Power, Plus, CheckCircle, AlertCircle, Settings,
  Send, MessageCircle, Camera, Globe, X, Check, Copy, ExternalLink,
  Search, Shield
} from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminGetClientIntegrations, adminUpsertIntegration } from '../../services/admin';

const PLATFORMS = [
  { 
    id: 'telegram', name: 'Telegram', icon: Send, color: '#0088cc',
    fields: [
      { name: 'token', label: 'Bot Token', placeholder: '123456:ABC-DEF...' }
    ]
  },
  { 
    id: 'meta_whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366',
    fields: [
      { name: 'phone_id', label: 'Phone Number ID', placeholder: '1121987954327518' },
      { name: 'token', label: 'Permanent Access Token', placeholder: 'EAASLM...' }
    ]
  },
  { 
    id: 'meta_social', name: 'Instagram & Facebook', icon: Camera, color: '#E1306C',
    fields: [
      { name: 'page_id', label: 'Facebook Page ID', placeholder: '1028472993...' },
      { name: 'ig_id', label: 'Instagram Account ID', placeholder: '17841425...' },
      { name: 'page_token', label: 'Page Access Token', placeholder: 'EAASLM...' },
      { name: 'token', label: 'System User Token', placeholder: 'EAASLM...' },
    ]
  },
  { 
    id: 'widget', name: 'Website Widget', icon: Globe, color: '#D946EF',
    fields: [
      { name: 'domain', label: 'Website Domain', placeholder: 'www.salon.com' },
      { name: 'welcome_message', label: 'Welcome Message', placeholder: 'مرحباً!' },
      { name: 'theme_color', label: 'Color', type: 'color' }
    ]
  }
];

export default function AdminClients() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { clients, loading, addCredits, toggleClientStatus } = useAdmin();
  
  // Credit Modal
  const [selectedClient, setSelectedClient] = useState(null);
  const [creditAmount, setCreditAmount] = useState(100);
  const [saving, setSaving] = useState(false);
  
  // Integration Panel
  const [intClient, setIntClient] = useState(null);
  const [intLoading, setIntLoading] = useState(false);
  const [intConfigs, setIntConfigs] = useState({});
  const [intSaving, setIntSaving] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Toast
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleAddCredits = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await addCredits(selectedClient.id, creditAmount, t('admin.clients.modal.ledger_reason'));
      setSelectedClient(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openIntegrations = async (client) => {
    setIntClient(client);
    setIntLoading(true);
    try {
      const integrations = await adminGetClientIntegrations(client.id);
      const configMap = {};
      integrations.forEach(i => { configMap[i.provider] = i.config || {}; });
      setIntConfigs(configMap);
    } catch (e) {
      console.error(e);
    } finally {
      setIntLoading(false);
    }
  };

  const saveIntegration = async (platformId) => {
    if (!intClient) return;
    setIntSaving(platformId);
    try {
      await adminUpsertIntegration(intClient.id, platformId, intConfigs[platformId] || {});
      showToast(`✅ ${isAr ? 'تم حفظ إعدادات' : 'Saved'} ${platformId}`);
    } catch (e) {
      showToast(`❌ ${e.message}`);
    } finally {
      setIntSaving(null);
    }
  };

  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.full_name || '').toLowerCase().includes(q) || 
           (c.email || '').toLowerCase().includes(q);
  });

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>{toast}</div>
      )}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{t('admin.clients.title')}</h1>
          <p className="page-subtitle">{t('admin.clients.subtitle')}</p>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface2)', borderRadius: 12, padding: '8px 14px',
          border: '1px solid var(--border)', width: 260
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Search clients...'}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 24, borderRadius: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('admin.dashboard.table.client')}</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>{isAr ? 'الحالة' : 'Status'}</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('admin.dashboard.table.balance')}</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>{isAr ? 'القنوات' : 'Channels'}</th>
              <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>{t('admin.clients.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,70,239,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 900, fontSize: 14
                    }}>
                      {client.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{client.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    background: client.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: client.is_active ? '#10B981' : '#EF4444',
                    border: `1px solid ${client.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}>
                    {client.is_active ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                    {client.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Inactive')}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--success)', fontSize: 15 }}>
                    {client.wallet_balance ?? 0}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isAr ? 'رسالة' : 'tokens'}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {client.agent_name ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                        border: '1px solid rgba(139,92,246,0.2)'
                      }}>
                        <Shield size={9} /> {client.agent_name}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.5 }}>
                        {isAr ? 'لم يُنشأ بعد' : 'Not created'}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Manage Integrations */}
                    <button 
                      onClick={() => openIntegrations(client)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: 'rgba(217,70,239,0.1)', color: 'var(--primary)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s', fontFamily: 'inherit'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,70,239,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(217,70,239,0.1)'}
                    >
                      <Settings size={13} /> {isAr ? 'الربط' : 'Setup'}
                    </button>
                    {/* Recharge */}
                    <button 
                      onClick={() => setSelectedClient(client)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: 'rgba(16,185,129,0.1)', color: '#10B981',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s', fontFamily: 'inherit'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                    >
                      <Plus size={13} /> {isAr ? 'شحن' : 'Recharge'}
                    </button>
                    {/* Toggle Active */}
                    <button 
                      onClick={() => toggleClientStatus(client.id, !client.is_active)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: client.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        color: client.is_active ? '#EF4444' : '#10B981',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title={client.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                    >
                      <Power size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ CREDIT MODAL ═══ */}
      <Modal 
        isOpen={!!selectedClient} 
        onClose={() => setSelectedClient(null)} 
        title={t('admin.clients.modal.recharge_title', { name: selectedClient?.full_name })}
        maxWidth={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">{t('admin.clients.modal.amount_label')}</label>
            <input 
              type="number" 
              className="form-input neon-input" 
              value={creditAmount} 
              onChange={e => setCreditAmount(parseInt(e.target.value))} 
            />
          </div>
          <button 
            className="btn btn-primary btn-full" 
            onClick={handleAddCredits}
            disabled={saving}
          >
            {saving ? <Spinner size={16} /> : t('admin.clients.modal.confirm_btn')}
          </button>
        </div>
      </Modal>

      {/* ═══ INTEGRATION MANAGEMENT MODAL ═══ */}
      {intClient && (
        <div className="modal-backdrop" onClick={() => setIntClient(null)}>
          <div 
            className="modal-content" 
            style={{ 
              background: 'var(--surface)', maxWidth: 720, maxHeight: '88vh',
              display: 'flex', flexDirection: 'column', borderRadius: 24
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px 28px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 900, fontSize: 16
                }}>
                  {intClient.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 style={{ fontWeight: 900, margin: 0, fontSize: 16 }}>
                    {isAr ? `إعدادات الربط — ${intClient.full_name}` : `Integration Setup — ${intClient.full_name}`}
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{intClient.email}</span>
                </div>
              </div>
              <button onClick={() => setIntClient(null)} className="btn-icon"><X size={20} /></button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {intLoading ? (
                <Spinner centered />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {PLATFORMS.map(platform => {
                    const config = intConfigs[platform.id] || {};
                    const PIcon = platform.icon;
                    const hasConfig = platform.fields.some(f => !!config[f.name]);

                    return (
                      <div key={platform.id} style={{
                        borderRadius: 16, border: '1px solid var(--border)',
                        overflow: 'hidden', transition: 'all 0.2s'
                      }}>
                        {/* Platform Header */}
                        <div style={{
                          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
                          background: hasConfig ? `${platform.color}08` : 'transparent',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: `${platform.color}15`, color: platform.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <PIcon size={18} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{platform.name}</div>
                          </div>
                          <span style={{
                            padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                            background: hasConfig ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                            color: hasConfig ? '#10B981' : 'var(--text-muted)',
                            border: `1px solid ${hasConfig ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`
                          }}>
                            {hasConfig ? (isAr ? 'مُعَد' : 'Configured') : (isAr ? 'غير مُعَد' : 'Not set')}
                          </span>
                        </div>

                        {/* Fields */}
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: platform.fields.length > 2 ? '1fr 1fr' : '1fr',
                            gap: 10
                          }}>
                            {platform.fields.map(field => (
                              <div key={field.name}>
                                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                  {field.label}
                                </label>
                                <input
                                  type={field.type || 'text'}
                                  className="form-input"
                                  value={config[field.name] || ''}
                                  placeholder={field.placeholder}
                                  style={{ fontSize: 11, height: 36, borderRadius: 8 }}
                                  onChange={e => {
                                    const val = e.target.value.trim();
                                    setIntConfigs(prev => ({
                                      ...prev,
                                      [platform.id]: { ...prev[platform.id], [field.name]: val }
                                    }));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => saveIntegration(platform.id)}
                            disabled={intSaving === platform.id}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '8px 16px', borderRadius: 10, border: 'none',
                              background: platform.color, color: 'white',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.2s', fontFamily: 'inherit',
                              opacity: intSaving === platform.id ? 0.6 : 1,
                              alignSelf: i18n.dir() === 'rtl' ? 'flex-start' : 'flex-end'
                            }}
                          >
                            {intSaving === platform.id ? (
                              <Spinner size={14} />
                            ) : (
                              <>
                                <Check size={14} />
                                {isAr ? 'حفظ' : 'Save'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
