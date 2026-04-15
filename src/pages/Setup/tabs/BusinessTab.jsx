import React from 'react';
import { SECTOR } from '../../../config/sector';

export default function BusinessTab({ business, onUpdate }) {
  const handleChange = (key, value) => {
    onUpdate({ ...business, [key]: value });
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 8, fontWeight: 900 }}>بيانات الصالون الأساسية 🏠</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>تأكدي من صحة هذه البيانات لضمان دقة رد الموظفة</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {SECTOR.businessFields.map(f => (
          <div className="form-group" key={f.key}>
            <label className="form-label">{f.label_ar}</label>
            <input 
              className="form-input neon-input" 
              value={business[f.key] || ''} 
              onChange={e => handleChange(f.key, e.target.value)} 
              placeholder={f.placeholder} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
