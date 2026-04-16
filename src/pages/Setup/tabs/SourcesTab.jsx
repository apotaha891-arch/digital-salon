import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, FileUp, Zap } from 'lucide-react';

export default function SourcesTab() {
  const { t } = useTranslation();

  return (
    <div className="fade-in">
      <div style={{ 
        background: 'rgba(217,70,239,0.05)', 
        padding: 24, 
        borderRadius: 20, 
        marginBottom: 32, 
        border: '1px solid rgba(217,70,239,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Sparkles style={{ color: 'var(--primary)' }} size={24} />
          <h3 style={{ fontWeight: 900 }}>{t('setup.tabs.sources_title')}</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {t('setup.tabs.sources_sub')}
        </p>
      </div>

      <div style={{ 
        border: '2px dashed rgba(217,70,239,0.2)', 
        borderRadius: 24, 
        padding: 60, 
        textAlign: 'center', 
        background: 'rgba(255,255,255,0.01)' 
      }}>
        <FileUp size={28} style={{ color: 'var(--primary)', marginBottom: 20 }} />
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{t('setup.tabs.sources_drop')}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, Word, Excel</div>
      </div>

      <button className="btn btn-primary btn-full" style={{ 
        marginTop: 32, 
        padding: 18, 
        fontWeight: 900, 
        background: 'linear-gradient(to right, var(--primary), var(--accent))' 
      }}>
        <Zap size={20} /> {t('setup.tabs.sources_btn')}
      </button>
    </div>
  );
}
