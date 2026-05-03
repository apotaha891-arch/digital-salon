import React from 'react';
import { useTranslation } from 'react-i18next';
import { SECTOR } from '../../../config/sector';

export default function BusinessTab({ business, onUpdate }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // name_en lives in metadata (no separate DB column)
  const getValue = (key) => {
    if (key === 'name_en') return business.metadata?.name_en || '';
    return business[key] || '';
  };

  const handleChange = (key, value) => {
    if (key === 'name_en') {
      onUpdate({ ...business, metadata: { ...(business.metadata || {}), name_en: value } });
    } else {
      onUpdate({ ...business, [key]: value });
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 8, fontWeight: 900 }}>{t('setup.tabs.business_title')}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('setup.tabs.business_sub')}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {SECTOR.businessFields.map(f => (
          <div className="form-group" key={f.key}>
            <label className="form-label">{isAr ? f.label_ar : f.label_en}</label>
            <input
              className="form-input neon-input"
              value={getValue(f.key)}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder={isAr ? (f.placeholder_ar || f.placeholder || '') : (f.placeholder_en || f.placeholder || '')}
              dir={f.key === 'name_en' ? 'ltr' : undefined}
            />
            {(f.hint_ar || f.hint_en) && (
              <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 5, opacity: 0.8 }}>
                🔗 {isAr ? f.hint_ar : f.hint_en}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
