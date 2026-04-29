import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');

  const links = [
    { id: 'features', label: t('landing.nav.features') },
    { id: 'pricing',  label: t('landing.nav.pricing') },
    { id: 'demo',     label: t('landing.nav.demo') },
    { id: 'faq',      label: t('landing.nav.faq') },
  ];

  return (
    <nav className="ln-nav">
      <div className="ln-nav-inner">
        <span className="ln-logo">💅 Digital Salon</span>

        <div className="ln-nav-links">
          {links.map(l => (
            <button key={l.id} className="ln-nav-link" onClick={() => scrollTo(l.id)}>
              {l.label}
            </button>
          ))}
          <button className="ln-nav-link" onClick={() => navigate('/contact')}>
            {i18n.language === 'ar' ? 'تواصل معنا' : 'Contact'}
          </button>
        </div>

        <div className="ln-nav-controls">
          <button className="ln-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button className="ln-icon-btn" onClick={toggleLang} style={{ width: 'auto', padding: '0 10px', gap: 4 }}>
            {i18n.language === 'ar' ? 'EN' : 'AR'}
          </button>

          {user ? (
            <button className="ln-btn-primary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => navigate('/dashboard')}>
              {i18n.language === 'ar' ? 'لوحة التحكم ←' : 'Dashboard →'}
            </button>
          ) : (
            <button className="ln-btn-primary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => navigate('/login')}>
              {t('landing.nav.cta')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
