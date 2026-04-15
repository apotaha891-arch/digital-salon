import { useState, useEffect } from 'react';
import { adminGetAllClients, adminAddCredits, adminToggleClient } from '../../services/supabase';
import { Search, Plus, Ban, CheckCircle } from 'lucide-react';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addCreditsModal, setAddCreditsModal] = useState(null);
  const [creditAmount, setCreditAmount] = useState(500);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setClients(await adminGetAllClients()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    (c.full_name || '').includes(search) || (c.email || '').includes(search)
  );

  const handleAddCredits = async () => {
    if (!addCreditsModal) return;
    setSaving(true);
    try {
      await adminAddCredits(addCreditsModal.id, creditAmount);
      await load();
      setAddCreditsModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (client) => {
    try {
      await adminToggleClient(client.id, !client.is_active);
      await load();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">إدارة العملاء 👥</h1>
          <p className="page-subtitle">{clients.length} عميل مسجل في المنصة</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={16} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-input" style={{ paddingRight: 44 }}
          placeholder="ابحث باسم العميل أو البريد..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>العميل</th>
              <th>الموظفة</th>
              <th>الرصيد</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                </td>
                <td>
                  <div>{c.agent_name || '—'}</div>
                  {c.agent_active !== null && (
                    <span className={`badge ${c.agent_active ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: 11 }}>
                      {c.agent_active ? 'نشطة' : 'متوقفة'}
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 16 }}>
                    {c.wallet_balance ?? 0}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> توكن</span>
                </td>
                <td>
                  <span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {c.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}
                      onClick={() => { setAddCreditsModal(c); setCreditAmount(500); }}>
                      <Plus size={13} /> رصيد
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: c.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: c.is_active ? 'var(--error)' : 'var(--success)',
                        border: `1px solid ${c.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}
                      onClick={() => handleToggle(c)}>
                      {c.is_active ? <Ban size={13} /> : <CheckCircle size={13} />}
                      {c.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Credits Modal */}
      {addCreditsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>إضافة رصيد</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              للعميل: {addCreditsModal.full_name || addCreditsModal.email}
            </p>
            <div className="form-group">
              <label className="form-label">عدد التوكنات</label>
              <input type="number" className="form-input" value={creditAmount}
                onChange={e => setCreditAmount(Number(e.target.value))} min={1} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setAddCreditsModal(null)}>إلغاء</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddCredits} disabled={saving}>
                {saving ? 'جاري الإضافة...' : `إضافة ${creditAmount} توكن`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
