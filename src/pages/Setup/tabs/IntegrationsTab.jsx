import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, X, Check, Copy, Send, MessageCircle, Globe 
} from 'lucide-react';

export default function IntegrationsTab({ activeTools, agentId, agentName, onToolSave }) {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(null);
  const [copied, setCopied] = useState(false);
  const [localConfigs, setLocalConfigs] = useState(activeTools || {});

  const INTEGRATION_TOOLS = [
    {
      id: 'telegram',
      name: t('integrations.telegram.name'),
      icon: Send,
      color: '#0088cc',
      fields: [{ name: 'token', label: t('integrations.telegram.token_label'), placeholder: '123456:ABC-DEF...' }],
      guide: [
        t('integrations.telegram.guide_1'),
        t('integrations.telegram.guide_2'),
        t('integrations.telegram.guide_3'),
        t('integrations.telegram.guide_4')
      ],
      checkLink: (conf) => !!conf.token
    },
    {
      id: 'whatsapp',
      name: t('integrations.whatsapp.name'),
      icon: MessageCircle,
      color: '#25D366',
      fields: [
        { name: 'phone_id', label: t('integrations.whatsapp.phone_id_label'), placeholder: '00000000000' },
        { name: 'token', label: t('integrations.whatsapp.token_label'), placeholder: 'EAAB...' }
      ],
      guide: [
        t('integrations.whatsapp.guide_1'),
        t('integrations.whatsapp.guide_2'),
        t('integrations.whatsapp.guide_3')
      ],
      checkLink: (conf) => !!conf.token && !!conf.phone_id
    },
    {
      id: 'widget',
      name: t('integrations.widget.name'),
      icon: Globe,
      color: '#D946EF',
      fields: [
        { name: 'domain', label: t('integrations.widget.domain_label'), placeholder: 'example.com' },
        { name: 'welcome_message', label: t('integrations.widget.welcome_label'), placeholder: 'Hello!' },
        { name: 'theme_color', label: t('integrations.widget.color_label'), type: 'color', defaultValue: '#D946EF' }
      ],
      guide: [
        t('integrations.widget.guide_1'),
        t('integrations.widget.guide_2'),
        t('integrations.widget.guide_3')
      ],
      checkLink: (conf) => !!conf.domain
    }
  ];

  useEffect(() => {
    setLocalConfigs(activeTools);
  }, [activeTools]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTool = INTEGRATION_TOOLS.find(t => t.id === showGuide);
  const widgetConfig = localConfigs.widget || {};
  const isWidgetLinked = !!widgetConfig.domain;

  const embedCode = `<script \n  src="https://24shift.solutions/widget.js"\n  data-agent-id="${agentId || '...'}"\n  data-name="${agentName || 'Salon'}"\n  data-welcome="${widgetConfig.welcome_message || 'Hello!'}"\n  data-color="${widgetConfig.theme_color || '#D946EF'}"\n></script>`;

  return (
    <div className="fade-in">
      <div className="integration-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {INTEGRATION_TOOLS.map((tool) => {
          const config = localConfigs[tool.id] || {};
          const isLinked = tool.checkLink(config);
          
          return (
            <div key={tool.id} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, 
                  background: `${tool.color}15`, color: tool.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <tool.icon size={24} />
                </div>
                <div className={`badge ${isLinked ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: 10 }}>
                  {isLinked ? t('integrations.status.linked') : t('integrations.status.not_linked')}
                </div>
              </div>
              <h4 style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{tool.name}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {tool.fields.map(field => (
                  <div key={`${tool.id}-${field.name}`}>
                    <label style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, display: 'block' }}>{field.label}</label>
                    <input 
                      type={field.type || 'text'} 
                      className="form-input neon-input" 
                      value={config[field.name] || ''} 
                      placeholder={field.placeholder} 
                      style={{ fontSize: 12, height: 40 }} 
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setLocalConfigs(prev => ({
                          ...prev,
                          [tool.id]: { ...prev[tool.id], [field.name]: val }
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => onToolSave(tool.id, config)} 
                className="btn btn-primary btn-sm btn-full" 
                style={{ fontSize: 11, marginBottom: 8 }}
              >
                <Check size={14} style={{ marginRight: 4 }} /> {t('integrations.save_settings')}
              </button>
              <button 
                onClick={() => setShowGuide(tool.id)} 
                className="btn btn-secondary btn-sm btn-full" 
                style={{ fontSize: 11, opacity: 0.7 }}
              >
                <HelpCircle size={14} style={{ marginRight: 4 }} /> {t('integrations.how_to_link')}
              </button>
            </div>
          );
        })}
      </div>

      {showGuide && currentTool && (
        <div className="modal-backdrop" onClick={() => setShowGuide(null)}>
          <div className="modal-content glass-card" style={{ background: 'var(--surface)', maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ 
                  width: 42, height: 42, borderRadius: 10, 
                  background: `${currentTool.color}15`, color: currentTool.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <currentTool.icon size={22} />
                </div>
                <h3 style={{ fontWeight: 900 }}>{t('integrations.guide_title', { name: currentTool.name })}</h3>
              </div>
              <button onClick={() => setShowGuide(null)} className="btn-icon"><X size={20} /></button>
            </div>
            <div style={{ padding: 32 }}>
               {currentTool.id === 'widget' && isWidgetLinked ? (
                 <div className="code-box" style={{ marginBottom: 24, position: 'relative' }}>
                    <button 
                      className={`copy-btn ${copied ? 'copied' : ''}`} 
                      onClick={() => copyToClipboard(embedCode)}
                      style={{ position: 'absolute', left: 12, top: 12 }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre style={{ fontSize: 11, overflow: 'auto', padding: 12 }}>{embedCode}</pre>
                 </div>
               ) : null}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {currentTool.guide.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: 'var(--primary)', color: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 12, fontWeight: 900, flexShrink: 0 
                    }}>{idx + 1}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{step}</p>
                  </div>
                ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
