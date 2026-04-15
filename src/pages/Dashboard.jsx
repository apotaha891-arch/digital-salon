import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAgent, toggleAgent, getBusiness, getWallet, getIntegrations } from '../services/supabase';
import { Plug, CreditCard, Settings, TrendingUp, MessageSquare, Calendar, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [business, setBusiness] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [a, b, w, i] = await Promise.all([
        getAgent(user.id), getBusiness(user.id), 
        getWallet(user.id), getIntegrations(user.id)
      ]);
      setAgent(a); setBusiness(b); setWallet(w); setIntegrations(i);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!agent) return;
    setToggling(true);
    try {
      const updated = await toggleAgent(agent.id, !agent.is_active);
      setAgent(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  // If no setup done, redirect 
  useEffect(() => {
    if (!loading && !agent && !business) navigate('/setup');
  }, [loading, agent, business]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const connectedTools = integrations.filter(i => i.is_active);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">لوحة التحكم</h1>
        <p className="page-subtitle">مرحباً بك في {business?.name || 'صالونك الرقمي'}</p>
      </div>

      {/* Agent Status Card */}
      <div className="agent-card glow" style={{ marginBottom: 28 }}>
        <div className="agent-avatar">{agent?.avatar || '💅'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>{agent?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>مساعدة الحجز والاستقبال</div>
          <div className={`badge ${agent?.is_active ? 'badge-active' : 'badge-inactive'}`}>
            {agent?.is_active ? <><Wifi size={12} /> نشطة</> : <><WifiOff size={12} /> متوقفة</>}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <label className="toggle">
            <input type="checkbox" checked={agent?.is_active || false} 
              onChange={handleToggle} disabled={toggling} />
            <span className="toggle-slider" />
          </label>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {toggling ? '...' : agent?.is_active ? 'إيقاف' : 'تشغيل'}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-number">{agent?.messages_today || 0}</div>
          <div className="stat-label">رسائل اليوم</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{agent?.bookings_today || 0}</div>
          <div className="stat-label">حجوزات اليوم</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{connectedTools.length}</div>
          <div className="stat-label">أدوات مربوطة</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--success)' }}>
            {wallet?.balance ?? 0}
          </div>
          <div className="stat-label">رصيد التوكن</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="page-header">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>إجراءات سريعة</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: Plug, label: 'ربط أداة تواصل', sub: 'واتساب، تيليجرام، ويدجت', to: '/integrations', color: 'var(--primary)' },
          { icon: CreditCard, label: 'شحن الرصيد', sub: 'إضافة توكن لتشغيل الموظفة', to: '/billing', color: 'var(--success)' },
          { icon: Settings, label: 'إعدادات الصالون', sub: 'تعديل بيانات المنشأة', to: '/setup', color: 'var(--warning)' },
        ].map(({ icon: Icon, label, sub, to, color }) => (
          <div key={to} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }} 
            onClick={() => navigate(to)}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <Icon size={28} style={{ color, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Support Section */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(to right, rgba(217,70,239,0.05), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'var(--primary)', padding: 10, borderRadius: 12, color: 'white' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>تحتاج مساعدة تقنية؟</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>تواصل مع فريق الدعم الفني مباشرة عبر واتساب</div>
          </div>
          <button className="btn btn-secondary" style={{ marginRight: 'auto' }} onClick={() => window.open('https://wa.me/YOUR_SUPPORT_NUMBER')}>
            فتح المحادثة
          </button>
        </div>
      </div>
    </div>
  );
}
