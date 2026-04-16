import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Clock } from 'lucide-react';

export default function ServicesTab({ services, onUpdate }) {
  const { t } = useTranslation();

  const addService = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    onUpdate([...services, { id: newId, name: '', price: '', duration: '' }]);
  };

  const removeService = (id) => {
    onUpdate(services.filter(s => s.id !== id));
  };

  const updateServiceValue = (id, field, value) => {
    onUpdate(services.map((s, idx) => {
      const match = s.id ? s.id === id : `temp-${idx}` === id;
      return match ? { ...s, [field]: value } : s;
    }));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h3 style={{ fontWeight: 900 }}>{t('services.title')}</h3>
        <button className="btn btn-primary btn-sm" onClick={addService}>
          <Plus size={16} /> {t('services.add_service')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {services.map((s, index) => (
          <div key={s.id || `temp-${index}`} className="glass-card" style={{ 
            padding: '20px 24px', 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 1fr 60px', 
            gap: 16, 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.02)' 
          }}>
            <input 
              className="form-input neon-input" 
              value={s.name || ''} 
              onChange={e => updateServiceValue(s.id || `temp-${index}`, 'name', e.target.value)} 
              placeholder={t('services.placeholder_name')} 
            />
            <input 
              className="form-input neon-input" 
              value={s.price || ''} 
              onChange={e => updateServiceValue(s.id || `temp-${index}`, 'price', e.target.value)} 
              placeholder={t('services.placeholder_price')} 
            />
            <div style={{ position: 'relative' }}>
              <Clock size={16} style={{ 
                position: 'absolute', 
                right: 12, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                opacity: 0.5 
              }} />
              <input 
                className="form-input neon-input" 
                style={{ paddingRight: 40 }} 
                value={s.duration || ''} 
                onChange={e => updateServiceValue(s.id || `temp-${index}`, 'duration', e.target.value)} 
                placeholder={t('services.placeholder_duration')} 
              />
            </div>
            <button 
              className="btn-icon" 
              onClick={() => removeService(s.id)} 
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {services.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {t('services.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
