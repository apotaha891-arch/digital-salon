import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/useAdmin';
import { User, CreditCard, Power, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function AdminClients() {
  const { t, i18n } = useTranslation();
  const { clients, loading, addCredits, toggleClientStatus } = useAdmin();
  const [selectedClient, setSelectedClient] = useState(null);
  const [creditAmount, setCreditAmount] = useState(100);
  const [saving, setSaving] = useState(false);

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

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('admin.clients.title')}</h1>
        <p className="page-subtitle">{t('admin.clients.subtitle')}</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.client')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.clients.table.details')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.balance')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.dashboard.table.agent')}</th>
              <th style={{ padding: '16px 24px' }}>{t('admin.clients.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 700 }}>{client.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <Badge variant={client.is_active ? 'success' : 'inactive'} size="sm">
                    {client.is_active ? t('admin.clients.status.active') : t('admin.clients.status.inactive')}
                  </Badge>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--success)' }}>
                    {client.wallet_balance} {t('billing.plans.tokens')}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontSize: 13 }}>{client.agent_name || t('admin.clients.status.not_created')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {client.agent_active ? t('admin.clients.status.connected') : t('admin.clients.status.disconnected')}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setSelectedClient(client)}
                    >
                      <Plus size={14} style={{ marginInlineEnd: 4 }} /> {t('admin.clients.actions.recharge')}
                    </button>
                    <button 
                      className={`btn-icon ${client.is_active ? 'text-error' : 'text-success'}`}
                      style={{ color: client.is_active ? 'var(--error)' : 'var(--success)' }}
                      onClick={() => toggleClientStatus(client.id, !client.is_active)}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Credit Modal */}
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
    </div>
  );
}
