import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { User, CreditCard, Power, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function AdminClients() {
  const { clients, loading, addCredits, toggleClientStatus } = useAdmin();
  const [selectedClient, setSelectedClient] = useState(null);
  const [creditAmount, setCreditAmount] = useState(100);
  const [saving, setSaving] = useState(false);

  const handleAddCredits = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await addCredits(selectedClient.id, creditAmount, 'شحن رصيد من الإدارة');
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
        <h1 className="page-title">إدارة العملاء</h1>
        <p className="page-subtitle">قائمة بجميع الصالونات المسجلة في المنصة</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px' }}>العميل</th>
              <th style={{ padding: '16px 24px' }}>التفاصيل</th>
              <th style={{ padding: '16px 24px' }}>الرصيد</th>
              <th style={{ padding: '16px 24px' }}>الموظفة</th>
              <th style={{ padding: '16px 24px' }}>الإجراءات</th>
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
                    {client.is_active ? 'نشط' : 'معطل'}
                  </Badge>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--success)' }}>{client.wallet_balance} توكن</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontSize: 13 }}>{client.agent_name || 'لم تنشأ'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {client.agent_active ? 'متصلة' : 'منقطعة'}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setSelectedClient(client)}
                    >
                      <Plus size={14} style={{ marginLeft: 4 }} /> شحن
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
        title={`إضافة رصيد لـ ${selectedClient?.full_name}`}
        maxWidth={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">المبلغ (توكن)</label>
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
            {saving ? <Spinner size={16} /> : 'تأكيد الإضافة'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
