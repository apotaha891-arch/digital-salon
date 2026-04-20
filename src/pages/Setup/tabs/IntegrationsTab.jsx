import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, X, Check, Copy, Send, MessageCircle, Globe 
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function IntegrationsTab({ activeTools, agentId, agentName, onToolSave }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(null);
  const [copied, setCopied] = useState(false);
  const [localConfigs, setLocalConfigs] = useState(activeTools || {});
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  console.log('[DEBUG] IntegrationsTab User:', user?.id);

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
        { name: 'url', label: t('integrations.whatsapp.url_label'), placeholder: 'https://....railway.app' },
        { name: 'token', label: t('integrations.whatsapp.token_label'), placeholder: 'Secret Key' },
        { name: 'session', label: 'Session Name', placeholder: 'default' }
      ],
      guide: [
        t('integrations.whatsapp.guide_1'),
        t('integrations.whatsapp.guide_2'),
        t('integrations.whatsapp.guide_3')
      ],
      checkLink: (conf) => !!conf.token && !!conf.url
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
    },
    {
      id: 'manychat',
      name: 'ManyChat & Social CRM',
      icon: Check,
      color: '#0084FF',
      fields: [
        { name: 'apiKey', label: 'ManyChat API Key', placeholder: 'MC-...' },
      ],
      guide: [
        'Connect Instagram/Messenger via ManyChat',
        'Sync leads directly to your Salon CRM',
        'Enable AI automation for social media'
      ],
      checkLink: (conf) => !!conf.apiKey
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
                onClick={async () => {
                  try {
                    await onToolSave(tool.id, config);
                    alert('✅ ' + t('common.success_saved') || 'Settings saved successfully!');
                  } catch (e) {
                    alert('❌ Save failed: ' + e.message);
                  }
                }} 
                className="btn btn-primary btn-sm btn-full" 
                style={{ fontSize: 11, marginBottom: 8 }}
              >
                <Check size={14} style={{ marginRight: 4 }} /> {t('integrations.save_settings')}
              </button>
              <button 
                onClick={() => setShowGuide(tool.id)} 
                className="btn btn-secondary btn-sm btn-full" 
                style={{ fontSize: 11, opacity: 0.7, marginBottom: tool.id === 'whatsapp' ? 8 : 0 }}
              >
                <HelpCircle size={14} style={{ marginRight: 4 }} /> {t('integrations.how_to_link')}
              </button>

              {tool.id === 'whatsapp' && (
                <button 
                  onClick={async () => {
                    if (!user?.id) {
                      alert('Session missing. Please logout and login again.');
                      return;
                    }
                    setQrLoading(true);
                    setQrCode(null);
                    try {
                      const config = localConfigs.whatsapp || {};
                      const sessionName = config.session || 'default';

                      // AUTO-SAVE first to ensure DB has the latest keys
                      await onToolSave('whatsapp', config);
                      
                      const { data, error } = await supabase.functions.invoke(
                        `whatsapp-manager?action=start-session&userId=${user.id}&session=${sessionName}`, 
                        { method: 'POST' }
                      );

                      if (error) throw error;

                      if (data.error) {
                        alert(`${data.error}${data.details ? `\n\nDiagnostic: ${data.details}` : ''}`);
                        return;
                      }

                      if (data.qrcode) {
                        setQrCode(data.qrcode);
                        setShowGuide('whatsapp');
                      } else if (data.status === 'CONNECTED') {
                        alert(t('integrations.whatsapp.connected'));
                      } else if (data.status === 'QRCODE' && data.qrcode) {
                        setQrCode(data.qrcode);
                        setShowGuide('whatsapp');
                      } else {
                        console.log('[DEBUG] Full Response Data:', data);
                        alert(`Session Status: ${data.status || 'Success'}\n\nNo QR code found in payload. Raw Data:\n${JSON.stringify(data, null, 2)}`);
                      }
                    } catch (e) {
                      console.error('Final Proxy Error:', e);
                      let msg = e.message;
                      // Try to extract JSON if it was a FunctionsHttpError
                      if (e.context) {
                        try {
                          const errJson = await e.context.json();
                          msg = errJson.error || msg;
                          if (errJson.details) msg += `\n\nDetails: ${errJson.details}`;
                        } catch (inner) {}
                      }
                      alert(`Connection failed: ${msg}`);
                    } finally {
                      setQrLoading(false);
                    }
                  }} 
                  className="btn btn-accent btn-sm btn-full" 
                  style={{ fontSize: 11 }}
                  disabled={qrLoading || !isLinked}
                >
                  {qrLoading ? '...' : (qrCode ? 'Refetch QR' : t('integrations.whatsapp.get_qr'))}
                </button>
              )}
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

               {currentTool.id === 'whatsapp' && qrCode && (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                   <div className="qr-container glass-card" style={{ padding: 16 }}>
                     <img src={qrCode} alt="WhatsApp QR" style={{ width: 256, height: 256, display: 'block' }} />
                   </div>
                   <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
                     {t('integrations.whatsapp.scan_instruction')}
                   </p>
                 </div>
               )}

               {currentTool.id === 'manychat' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   <div style={{ background: 'rgba(0,132,255,0.05)', padding: 20, borderRadius: 16, border: '1px border rgba(0,132,255,0.1)' }}>
                     <h4 style={{ color: '#0084FF', marginBottom: 12 }}>ManyChat Connection Details</h4>
                     <p style={{ fontSize: 13, marginBottom: 16 }}>Use these details in your ManyChat "External Request" block:</p>
                     
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       <div className="code-box" style={{ padding: '12px 16px', position: 'relative' }}>
                         <span style={{ fontSize: 10, opacity: 0.5, display: 'block' }}>SUPABASE URL</span>
                         <code style={{ fontSize: 12 }}>{import.meta.env.VITE_SUPABASE_URL}</code>
                       </div>
                       <div className="code-box" style={{ padding: '12px 16px', position: 'relative' }}>
                         <span style={{ fontSize: 10, opacity: 0.5, display: 'block' }}>API KEY (Service Role/Anon)</span>
                         <code style={{ fontSize: 10 }}>{import.meta.env.VITE_SUPABASE_ANON_KEY}</code>
                       </div>
                       <div className="code-box" style={{ padding: '12px 16px', position: 'relative' }}>
                         <span style={{ fontSize: 10, opacity: 0.5, display: 'block' }}>YOUR OWNER ID (user_id)</span>
                         <code style={{ fontSize: 12 }}>{user?.id}</code>
                       </div>
                     </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     <p style={{ fontWeight: 600, fontSize: 14 }}>🚀 Implementation Steps:</p>
                     <ul style={{ fontSize: 13, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                       <li>1. Open ManyChat Flow Builder.</li>
                       <li>2. Add an "External Request" block.</li>
                       <li>3. Method: <b>POST</b></li>
                       <li>4. URL: <code>{import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers</code></li>
                       <li>5. Add Headers: <code>apikey</code> and <code>Authorization: Bearer [KEY]</code></li>
                       <li>6. Body (JSON): Map <code>user_id</code>, <code>full_name</code>, and <code>platform</code>.</li>
                     </ul>
                   </div>
                 </div>
               )}
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
