import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PersonaTab({ agent, onUpdate }) {
  const { t } = useTranslation();
  const handleChange = (field, value) => {
    onUpdate({ ...agent, [field]: value });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="glass-card" style={{ 
            width: 140, 
            height: 140, 
            borderRadius: 40, 
            background: 'rgba(255,255,255,0.02)', 
            fontSize: 72, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px auto', 
            border: '1px solid var(--border)' 
          }}>
            {agent.avatar || '💅'}
          </div>
          <input 
            className="form-input" 
            value={agent.avatar || ''} 
            onChange={e => handleChange('avatar', e.target.value)} 
            placeholder={t('setup.tabs.agent_avatar')} 
            style={{ textAlign: 'center' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Mastermind Choice Section */}
          <div style={{ 
            background: 'rgba(217,70,239,0.05)', 
            padding: 20, 
            borderRadius: 16, 
            border: '1px solid rgba(217,70,239,0.1)' 
          }}>
            <label className="form-label" style={{ marginBottom: 16 }}>{t('setup.tabs.model_choice')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button 
                onClick={() => handleChange('model_provider', 'openai')}
                style={{
                  padding: '16px', 
                  borderRadius: 12, 
                  border: `2px solid ${agent.model_provider === 'openai' ? 'var(--primary)' : 'var(--border)'}`,
                  background: agent.model_provider === 'openai' ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  textAlign: 'center'
                }}>
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{t('setup.tabs.openai_name')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('setup.tabs.openai_sub')}</div>
              </button>
              <button 
                onClick={() => handleChange('model_provider', 'gemini')}
                style={{
                  padding: '16px', 
                  borderRadius: 12, 
                  border: `2px solid ${agent.model_provider === 'gemini' ? 'var(--primary)' : 'var(--border)'}`,
                  background: agent.model_provider === 'gemini' ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  textAlign: 'center'
                }}>
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{t('setup.tabs.gemini_name')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('setup.tabs.gemini_sub')}</div>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('setup.tabs.agent_name')}</label>
            <input 
              className="form-input neon-input" 
              value={agent.name || ''} 
              onChange={e => handleChange('name', e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('setup.tabs.ai_instructions')}</label>
            <textarea 
              className="form-input neon-input" 
              rows={8} 
              style={{ height: 'auto', paddingTop: 12, lineHeight: 1.6 }} 
              placeholder={t('setup.tabs.ai_instructions_placeholder')} 
              value={agent.instructions || ''} 
              onChange={e => handleChange('instructions', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
