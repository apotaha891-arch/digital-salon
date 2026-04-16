import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function FloatingSettings() {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
  };

  return (
    <div className="floating-settings">
      <button className="btn btn-secondary" onClick={toggleTheme} style={{ padding: '8px 12px', borderRadius: '12px' }}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="btn btn-secondary" onClick={toggleLanguage} style={{ padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Languages size={18} />
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>{i18n.language}</span>
      </button>
    </div>
  );
}
