import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIntegrations, upsertIntegration, getAgent } from '../services/supabase';
import { 
  MessageCircle, 
  Send, 
  Globe, 
  CheckCircle2, 
  HelpCircle, 
  X,
  AlertCircle,
  ExternalLink,
  Palette,
  Copy,
  Check,
  Loader2
} from 'lucide-react';

const TOOLS = [
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
    ]
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
    ]
  },
  {
    id: 'widget',
    name: 'ويدجت الموقع',
    icon: Globe,
    color: '#D946EF',
    fields: [
      { name: 'domain', label: 'رابط الموقع المستضيف (Domain)', placeholder: 'example.com' },
      { name: 'welcome_message', label: 'رسالة الترحيب (Welcome Message)', placeholder: 'مرحباً! كيف يمكنني مساعدتك؟' },
      { name: 'theme_color', label: 'لون الهوية (Theme Color)', type: 'color', defaultValue: '#D946EF' }
    ],
    guide: [
      'أدخل رابط موقعك الإلكتروني لضمان أن الويدجت سيعمل فقط على نطاقك المعتمد.',
      'اختر لون الهوية (Theme Color) ورسالة الترحيب التي تعبر عن صالونك.',
      'اضغط على "إرسال الطلب" لتوليد الكود البرمجي الخاص بك.'
    ]
  }
];

export default function Integrations() {
  const { user } = useAuth();
  const [activeTools, setActiveTools] = useState({});
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [iData, aData] = await Promise.all([
        getIntegrations(user.id),
        getAgent(user.id)
      ]);
      const active = {};
      iData.forEach(item => { active[item.provider] = item.config; });
      setActiveTools(active);
      setAgent(aData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (toolId, config) => {
    setSaving(true);
    try {
      await upsertIntegration(user.id, toolId, config);
      await loadData();
      // Keep loading for 1 second to match user's screenshot "Sending Request..."
      setTimeout(() => setSaving(false), 1200);
    } catch (e) {
      alert(e.message);
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const currentTool = TOOLS.find(t => t.id === showGuide);
  const widgetConfig = activeTools.widget || {};
  
  const embedCode = `<script 
  src="https://24shift.solutions/widget.js"
  data-agent-id="${agent?.id || 'f380470a-acdc-4032-bd3b-370bdb89111c'}"
  data-name="${agent?.name || 'Digital Salon'}"
  data-welcome="${widgetConfig.welcome_message || 'Hello!'}"
  data-color="${widgetConfig.theme_color || '#D946EF'}"
></script>`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">أدوات التواصل 🔌</h1>
        <p className="page-subtitle">اربطي موظفتك الرقمية بقنوات التواصل لتستقبل الطلبات</p>
      </div>

      <div className="integration-grid">
        {TOOLS.map((tool) => {
          const config = activeTools[tool.id] || {};
          const isLinked = !!config.token || !!config.domain || !!config.phone_id;

          return (
            <div key={tool.id} className="integration-item card" style={{ padding: 0 }}>
              <div style={{ padding: 24, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ 
                    width: 54, height: 54, borderRadius: 14, 
                    background: `${tool.color}15`, color: tool.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <tool.icon size={28} />
                  </div>
                  {isLinked ? (
                    <div className="badge badge-active" style={{ fontSize: 11 }}>مربوطة بنجاح</div>
                  ) : (
                    <div className="badge badge-inactive" style={{ fontSize: 11 }}>غير مربوطة</div>
                  )}
                </div>

                <h3 style={{ fontWeight: 900, fontSize: 19, marginBottom: 8 }}>{tool.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                   فعّلي الموظفة الذكية على حساب {tool.name} الخاص بصالونك.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  {tool.fields.map(field => (
                    <div key={field.name}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {field.label}
                      </label>
                      {field.type === 'color' ? (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                           <input 
                            type="color" 
                            style={{ 
                              width: '100%', height: 44, border: '1px solid var(--border)', 
                              borderRadius: 10, cursor: 'pointer', background: 'var(--surface2)',
                              padding: '2px'
                            }}
                            defaultValue={config[field.name] || field.defaultValue}
                            onBlur={(e) => handleSave(tool.id, { ...config, [field.name]: e.target.value })}
                          />
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          className="input" 
                          defaultValue={config[field.name]}
                          placeholder={field.placeholder}
                          onBlur={(e) => {
                            if (e.target.value !== config[field.name] && tool.id !== 'widget') {
                              handleSave(tool.id, { ...config, [field.name]: e.target.value });
                            }
                          }}
                          onChange={(e) => {
                            if (tool.id === 'widget') config[field.name] = e.target.value;
                          }}
                        />
                      )}
                    </div>
                  ))}
                  
                  {tool.id === 'widget' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ height: 52, background: 'var(--accent)', marginTop: 8 }}
                      disabled={saving}
                      onClick={() => handleSave('widget', config)}
                    >
                      {saving ? <><Loader2 className="spinner" size={18} /> Sending Request...</> : 'Save & Generate Code'}
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => setShowGuide(tool.id)}
                  style={{
                    width: '100%', padding: '12px', background: 'var(--surface2)', 
                    border: '1px solid var(--border)', borderRadius: 10,
                    color: 'var(--text)', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={15} style={{ color: tool.color }} /> كيف يتم الربط؟
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guidance Modal */}
      {showGuide && currentTool && (
        <div className="modal-backdrop" onClick={() => setShowGuide(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ 
                  width: 42, height: 42, borderRadius: 10, 
                  background: `${currentTool.color}15`, color: currentTool.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <currentTool.icon size={22} />
                </div>
                <h3 style={{ fontWeight: 900 }}>إعدادات {currentTool.name}</h3>
              </div>
              <button onClick={() => setShowGuide(null)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 32 }}>
              {/* If Widget, show the Pro UI from screenshot */}
              {currentTool.id === 'widget' && isLinked(activeTools.widget) ? (
                <div className="fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: 'var(--success)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor' }} />
                    <span style={{ fontWeight: 700 }}>Ready to Embed</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                     انسخي الكود أدناه والصقيه قبل وسم <code style={{ color: 'var(--accent)' }}>{'</body>'}</code> في موقعك لتظهر الموظفة لعميلاتك.
                  </p>
                  
                  <div className="code-box">
                    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={() => copyToClipboard(embedCode)}>
                      {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                    </button>
                    <pre style={{ margin: 0 }}>
                      <span className="code-tag">{'<script'}</span>{'\n'}
                      {'  '}<span className="code-attr">src</span>=<span className="code-val">"https://24shift.solutions/widget.js"</span>{'\n'}
                      {'  '}<span className="code-attr">data-agent-id</span>=<span className="code-val">"{agent?.id || '...'}"</span>{'\n'}
                      {'  '}<span className="code-attr">data-name</span>=<span className="code-val">"{agent?.name || 'Salon'}"</span>{'\n'}
                      {'  '}<span className="code-attr">data-welcome</span>=<span className="code-val">"{widgetConfig.welcome_message || 'Hello!'}"</span>{'\n'}
                      {'  '}<span className="code-attr">data-color</span>=<span className="code-val">"{widgetConfig.theme_color || '#D946EF'}"</span>{'\n'}
                      <span className="code-tag">{'>'}{'</script>'}</span>
                    </pre>
                  </div>
                </div>
              ) : (
                /* Regular Guides */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {currentTool.guide.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 20, textAlign: 'right', direction: 'rtl' }}>
                      <div style={{ 
                        width: 28, height: 28, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 900, flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', margin: 0 }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ 
                marginTop: 32, padding: 20, background: 'rgba(217,70,239,0.05)', 
                borderRadius: 12, border: '1px solid rgba(217,70,239,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertCircle size={20} style={{ color: 'var(--primary)' }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>تحتاجين لمساعدة إضافية؟</div>
                </div>
                <button className="btn btn-secondary btn-sm">
                  دليل الفيديو <ExternalLink size={14} style={{ marginRight: 8 }} />
                </button>
              </div>
            </div>

            <div style={{ padding: 24, background: 'var(--surface2)', textAlign: 'center' }}>
              <button className="btn btn-primary" style={{ minWidth: 200 }} onClick={() => setShowGuide(null)}>
                تم .. إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isLinked(config) {
  if (!config) return false;
  return !!config.token || !!config.domain || !!config.phone_id;
}
