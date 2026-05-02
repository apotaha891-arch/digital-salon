import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  ShieldCheck,
  HelpCircle,
  Users,
  Sun,
  Moon,
  Languages,
  Plug,
  Store,
  MessagesSquare
} from 'lucide-react';
import { signOut } from '../../services/supabase';
import { SECTOR } from '../../config/sector';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ profile, isAdmin, businessName }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const clientNav = [
    { to: '/dashboard',  icon: LayoutDashboard, label: t('common.dashboard') },
    { to: '/bookings',   icon: CalendarCheck,   label: t('common.bookings') },
    { to: '/customers',  icon: Users,           label: t('common.customers') },
    { to: '/setup',      icon: Settings,        label: t('common.setup') },
    { to: '/billing',    icon: CreditCard,      label: t('common.billing') },
  ];

  const adminNav = [
    { to: '/admin',          icon: LayoutDashboard, label: t('admin.dashboard.title') },
    { to: '/admin/clients',  icon: Users,            label: t('admin.clients.title') },
    { to: '/admin/leads',    icon: MessagesSquare,   label: t('admin.leads.title') },
    { to: '/admin/settings', icon: Settings,         label: t('common.setup') },
  ];

  const nav = isAdmin ? adminNav : clientNav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
  };

  return (
    <aside className="sidebar">
      <div className="nav-logo">
        {SECTOR.agent.avatar} {i18n.language === 'ar' ? SECTOR.name_ar : SECTOR.name}
      </div>

      {isAdmin && (
        <div className="badge badge-warning" style={{ marginBottom: 16, width: '100%', justifyContent: 'center' }}>
          <ShieldCheck size={14} /> {t('common.admin')}
        </div>
      )}

      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, padding: '0 16px' }}>
          {t('sidebar.main')}
        </div>

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
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, padding: '0 16px' }}>
              {t('sidebar.support')}
            </div>
            <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <MessageSquare size={18} />
              {t('common.tickets')}
            </NavLink>
            <NavLink to="/help" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <HelpCircle size={18} />
              {t('common.help')}
            </NavLink>
          </>
        )}

        <div className="divider" style={{ margin: '16px 0' }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: '0 8px' }}>
          <button
            className="nav-item"
            onClick={toggleTheme}
            style={{ flex: 1, justifyContent: 'center', marginBottom: 0, background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="nav-item"
            onClick={toggleLanguage}
            style={{ flex: 1, justifyContent: 'center', marginBottom: 0, background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <Languages size={18} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{i18n.language}</span>
          </button>
        </div>
      </nav>

      {profile?.role === 'admin' && (
        <button
          className="nav-item btn-secondary"
          style={{ width: '100%', marginBottom: 8 }}
          onClick={() => navigate(isAdmin ? '/dashboard' : '/admin')}
        >
          <ShieldCheck size={16} />
          {isAdmin ? t('sidebar.client_panel') : t('sidebar.admin_panel')}
        </button>
      )}

      <div className="divider" />

      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        {businessName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <Store size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 800 }}>{businessName}</div>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {profile?.full_name || t('common.user')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile?.email}
        </div>
      </div>

      <button className="nav-item" onClick={handleSignOut} style={{ width: '100%', color: 'var(--error)' }}>
        <LogOut size={16} />
        {t('common.logout')}
      </button>
    </aside>
  );
}
