import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../hooks/useAgent';
import { useBusiness } from '../hooks/useBusiness';
import { useWallet } from '../hooks/useWallet';
import { useIntegrations } from '../hooks/useIntegrations';
import { Plug, CreditCard, Settings, MessageSquare, Wifi, WifiOff } from 'lucide-react';

import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { agent, loading: aLoading, toggleAgent, saving: tSaving } = useAgent(user?.id);
  const { business, loading: bLoading } = useBusiness(user?.id);
  const { wallet, loading: wLoading } = useWallet(user?.id);
  const { integrations, loading: iLoading, activeToolsMap } = useIntegrations(user?.id);

  const loading = aLoading || bLoading || wLoading || iLoading;

  // If no setup done, redirect 
  useEffect(() => {
    if (!loading && !agent && !business) navigate('/setup');
  }, [loading, agent, business, navigate]);

  if (loading) return <Spinner centered />;

  const activeIntegrationsCount = integrations.filter(i => i.is_active).length;

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
          <Badge variant={agent?.is_active ? 'active' : 'inactive'} icon={agent?.is_active ? Wifi : WifiOff}>
            {agent?.is_active ? 'نشطة' : 'متوقفة'}
          </Badge>
        </div>
        <div style={{ textAlign: 'center' }}>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={agent?.is_active || false} 
              onChange={toggleAgent} 
              disabled={tSaving} 
            />
            <span className="toggle-slider" />
          </label>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {tSaving ? '...' : agent?.is_active ? 'إيقاف' : 'تشغيل'}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard label="رسائل اليوم" value={agent?.messages_today || 0} />
        <StatCard label="حجوزات اليوم" value={agent?.bookings_today || 0} />
        <StatCard label="أدوات مربوطة" value={activeIntegrationsCount} />
        <StatCard label="رصيد التوكن" value={wallet?.balance ?? 0} color="var(--success)" />
      </div>

      {/* Quick Actions */}
      <div className="page-header">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>إجراءات سريعة</h2>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: 16, 
        marginBottom: 28 
      }}>
        {[
          { icon: Plug, label: 'ربط أداة تواصل', sub: 'واتساب، تيليجرام، ويدجت', to: '/integrations', color: 'var(--primary)' },
          { icon: CreditCard, label: 'شحن الرصيد', sub: 'إضافة توكن لتشغيل الموظفة', to: '/billing', color: 'var(--success)' },
          { icon: Settings, label: 'إعدادات الصالون', sub: 'تعديل بيانات المنشأة', to: '/setup', color: 'var(--warning)' },
        ].map(({ icon: Icon, label, sub, to, color }) => (
          <div 
            key={to} 
            className="card" 
            style={{ cursor: 'pointer', transition: 'all 0.2s' }} 
            onClick={() => navigate(to)}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Icon size={28} style={{ color, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Support Section */}
      <div className="card" style={{ 
        borderLeft: '4px solid var(--primary)', 
        background: 'linear-gradient(to right, rgba(217,70,239,0.05), transparent)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: 'var(--primary)', padding: 10, borderRadius: 12, color: 'white' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>تحتاج مساعدة تقنية؟</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>تواصل مع فريق الدعم الفني مباشرة عبر واتساب</div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ marginRight: 'auto' }} 
            onClick={() => window.open('https://wa.me/966XXXXXXXXX')} // Updated from dummy text
          >
            فتح المحادثة
          </button>
        </div>
      </div>
    </div>
  );
}
