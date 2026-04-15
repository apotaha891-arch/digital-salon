import { useState, useEffect } from 'react';
import { adminGetAllClients } from '../../services/supabase';
import { Users, Zap, CreditCard, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetAllClients().then(data => { setClients(data); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const activeAgents = clients.filter(c => c.agent_active).length;
  const totalBalance = clients.reduce((sum, c) => sum + (c.wallet_balance || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">لوحة الأدمن 🛡️</h1>
        <p className="page-subtitle">نظرة عامة على جميع عملاء المنصة</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {[
          { icon: Users, label: 'إجمالي العملاء', value: clients.length, color: 'var(--primary)' },
          { icon: Zap, label: 'موظفات نشطة', value: activeAgents, color: 'var(--success)' },
          { icon: CreditCard, label: 'إجمالي التوكنات', value: totalBalance.toLocaleString(), color: 'var(--warning)' },
          { icon: TrendingUp, label: 'نسبة التفعيل', value: clients.length ? `${Math.round(activeAgents / clients.length * 100)}%` : '0%', color: 'var(--accent)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <Icon size={24} style={{ color, marginBottom: 12 }} />
            <div className="stat-number" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent clients */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>آخر العملاء المنضمين</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>العميل</th>
              <th>الموظفة</th>
              <th>الرصيد</th>
              <th>الحالة</th>
              <th>تاريخ الانضمام</th>
            </tr>
          </thead>
          <tbody>
            {clients.slice(0, 5).map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                </td>
                <td>{c.agent_name || '—'}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{c.wallet_balance ?? 0}</td>
                <td>
                  <span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {c.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {new Date(c.created_at).toLocaleDateString('ar-SA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
