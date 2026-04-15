import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, X, Check, Copy, Send, MessageCircle, Globe 
} from 'lucide-react';

const INTEGRATION_TOOLS = [
  {
    id: 'telegram',
    name: 'تيليجرام',
    icon: Send,
    color: '#0088cc',
    fields: [{ name: 'token', label: 'Bot Token (التوكين)', placeholder: '123456:ABC-DEF...' }],
    guide: [
      'ابحث عن المعرف الرسمي @BotFather داخل تطبيق تيليجرام.',
      'أرسل الأمر /newbot ثم اختر اسماً ومُعرفاً (Username) لموظفتك.',
      'انسخ الـ API Token الذي سيظهر لك وقم بلصقه في الخانة المخصصة هنا.',
      'اذهب إلى Bot Settings ثم Group Privacy وقم بتعطيله (Disabled) لتتمكن الموظفة من قراءة الرسائل.'
    ],
    checkLink: (conf) => !!conf.token
  },
  {
    id: 'whatsapp',
    name: 'واتساب',
    icon: MessageCircle,
    color: '#25D366',
    fields: [
      { name: 'phone_id', label: 'Phone Number ID (معرف الهاتف)', placeholder: '00000000000' },
      { name: 'token', label: 'Access Token (مفتاح الوصول)', placeholder: 'EAAB...' }
    ],
    guide: [
      'قم بإنشاء حساب مطورين في Meta for Developers.',
      'أنشئ تطبيقاً من نوع Business واضف Whatsapp كمنتج أساسي.',
      'احصل على مفتاح الوصول الدائم (Permanent Access Token) ومعرف الهاتف من لوحة التحكم.'
    ],
    checkLink: (conf) => !!conf.token && !!conf.phone_id
  },
  {
    id: 'widget',
    name: 'ويدجت الموقع',
    icon: Globe,
    color: '#D946EF',
    fields: [
      { name: 'domain', label: 'رابط الموقع (Domain)', placeholder: 'example.com' },
      { name: 'welcome_message', label: 'رسالة الترحيب', placeholder: 'مرحباً! كيف يمكنني مساعدتك؟' },
      { name: 'theme_color', label: 'لون الهوية', type: 'color', defaultValue: '#D946EF' }
    ],
    guide: [
      'أدخل رابط موقعك الإلكتروني لضمان أن الويدجت سيعمل فقط على نطاقك المعتمد.',
      'اختر لون الهوية (Theme Color) ورسالة الترحيب التي تعبر عن صالونك.',
      'اضغط على "حفظ وتوليد الكود" للحصول على كود الربط.'
    ],
    checkLink: (conf) => !!conf.domain
  }
];

export default function IntegrationsTab({ activeTools, agentId, agentName, onToolSave }) {
  const [showGuide, setShowGuide] = useState(null);
  const [copied, setCopied] = useState(false);
  const [localConfigs, setLocalConfigs] = useState(activeTools || {});

  // Sync local configs with activeTools from props
  useEffect(() => {
    setLocalConfigs(activeTools);
  }, [activeTools]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFieldChange = (toolId, field, value) => {
    const newConfig = { ...localConfigs[toolId], [field]: value };
    setLocalConfigs(prev => ({ ...prev, [toolId]: newConfig }));
    onToolSave(toolId, newConfig);
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
            <div key={tool.id} className="glass-card" style={{ padding: 24, textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, 
                  background: `${tool.color}15`, color: tool.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <tool.icon size={24} />
                </div>
                <div className={`badge ${isLinked ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: 10 }}>
                  {isLinked ? 'مربوطة' : 'غير مربوطة'}
                </div>
              </div>
              <h4 style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{tool.name}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {tool.fields.map(field => (
                  <div key={`${tool.id}-${field.name}`}>
                    <input 
                      type={field.type || 'text'} 
                      className="form-input neon-input" 
                      value={config[field.name] || ''} 
                      placeholder={field.label} 
                      style={{ fontSize: 12, height: 40 }} 
                      onChange={(e) => {
                        // Change local state but only trigger onBlur for DB
                        const val = e.target.value;
                        setLocalConfigs(prev => ({
                          ...prev,
                          [tool.id]: { ...prev[tool.id], [field.name]: val }
                        }));
                      }}
                      onBlur={(e) => onToolSave(tool.id, { ...config, [field.name]: e.target.value })} 
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => setShowGuide(tool.id)} className="btn btn-secondary btn-sm btn-full" style={{ fontSize: 11 }}>
                <HelpCircle size={14} style={{ marginRight: 1 }} /> كيف يتم الربط؟
              </button>
            </div>
          );
        })}
      </div>

      {/* Guidance Modal */}
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
                <h3 style={{ fontWeight: 900 }}>إرشادات {currentTool.name}</h3>
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
