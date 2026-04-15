import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  LogOut, 
  ShieldCheck, 
  HelpCircle,
  Users
} from 'lucide-react';
import { signOut } from '../../services/supabase';
import { SECTOR } from '../../config/sector';

const clientNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/bookings', icon: CalendarCheck, label: 'الحجوزات' },
  { to: '/tickets', icon: MessageSquare, label: 'تذاكر الدعم' },
  { to: '/setup', icon: Settings, label: 'إعدادات الصالون' },
  { to: '/billing', icon: CreditCard, label: 'الرصيد' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'نظرة عامة' },
  { to: '/admin/clients', icon: Users, label: 'العملاء' },
  { to: '/admin/settings', icon: Settings, label: 'الإعدادات' },
];

export default function Sidebar({ profile, isAdmin }) {
  const navigate = useNavigate();
  const nav = isAdmin ? adminNav : clientNav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="nav-logo">
        {SECTOR.agent.avatar} {SECTOR.name_ar}
      </div>

      {isAdmin && (
        <div className="badge badge-warning" style={{ marginBottom: 16, width: '100%', justifyContent: 'center' }}>
          <ShieldCheck size={14} /> لوحة الأدمن
        </div>
      )}

      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, paddingRight: 16 }}>الرئيسية</div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {!isAdmin && (
          <>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, paddingRight: 16 }}>المساعدة</div>
            <NavLink 
              to="/help" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <HelpCircle size={18} />
              مركز المساعدة
            </NavLink>
          </>
        )}
      </nav>

      {profile?.role === 'admin' && (
        <>
          <div className="divider" />
          <button
            className="nav-item btn-secondary"
            style={{ width: '100%', marginBottom: 8 }}
            onClick={() => navigate(isAdmin ? '/dashboard' : '/admin')}
          >
            <ShieldCheck size={16} />
            {isAdmin ? 'لوحة العميل' : 'لوحة الأدمن'}
          </button>
        </>
      )}

      <div className="divider" />

      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{profile?.full_name || 'مستخدم'}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {profile?.email}
        </div>
      </div>

      <button className="nav-item" onClick={handleSignOut} style={{ width: '100%', color: 'var(--error)' }}>
        <LogOut size={16} />
        تسجيل الخروج
      </button>
    </aside>
  );
}
