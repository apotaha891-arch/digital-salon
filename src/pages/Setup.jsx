import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  upsertAgent, 
  upsertBusiness, 
  getAgent, 
  getBusiness, 
  getIntegrations,
  upsertIntegration,
  toggleAgent
} from '../services/supabase';
import { SECTOR } from '../config/sector';
import { 
  User, Home, Briefcase, Plug, CheckCircle, Loader2, Plus, Trash2, 
  MessageSquare, Settings, Save, FileUp, Link, Zap, Sparkles, Wifi, 
  WifiOff, CloudLightning, Clock, HelpCircle, X, ExternalLink, 
  Check, Copy, AlertCircle, Send, MessageCircle, Globe, ArrowUpRight
} from 'lucide-react';

const TABS = [
  { id: 'sources', label: 'مصادر المعرفة', icon: CloudLightning },
  { id: 'business', label: 'معلومات الصالون', icon: Home },
  { id: 'services', label: 'الخدمات والمواعيد', icon: Briefcase },
  { id: 'persona', label: 'شخصية الموظفة', icon: User },
  { id: 'integrations', label: 'الربط التقني', icon: Plug },
];

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
      { name: 'domain', label: 'رابط الموقع (Domain)', placeholder: 'example.com' },
      { name: 'welcome_message', label: 'رسالة الترحيب', placeholder: 'مرحباً! كيف يمكنني مساعدتك؟' },
      { name: 'theme_color', label: 'لون الهوية', type: 'color', defaultValue: '#D946EF' }
    ],
    guide: [
      'أدخل رابط موقعك الإلكتروني لضمان أن الويدجت سيعمل فقط على نطاقك المعتمد.',
      'اختر لون الهوية (Theme Color) ورسالة الترحيب التي تعبر عن صالونك.',
      'اضغط على "حفظ وتوليد الكود" للحصول على كود الربط.'
    ]
  }
];

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sources');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // States for Data & Integrations
  const [agent, setAgent] = useState({ name: '', avatar: '', instructions: '', is_active: false });
  const [business, setBusiness] = useState({ name: '', phone: '', location: '', hours: '', services: [] });
  const [activeTools, setActiveTools] = useState({});
  const [showGuide, setShowGuide] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    try {
      const [a, b, i] = await Promise.all([
        getAgent(user.id),
        getBusiness(user.id),
        getIntegrations(user.id)
      ]);
      if (a) setAgent(a);
      if (b) setBusiness({ ...b, services: Array.isArray(b.services) ? b.services : [] });
      if (i) {
        const active = {};
        i.forEach(item => { active[item.provider] = item.config; });
        setActiveTools(active);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'persona') await upsertAgent(user.id, agent);
      else if (activeTab === 'business' || activeTab === 'services') await upsertBusiness(user.id, business);
      setSuccess('تم حفظ التعديلات بنجاح ✨');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleToolSave = async (toolId, config) => {
    setSaving(true);
    try {
      await upsertIntegration(user.id, toolId, config);
      setActiveTools(prev => ({ ...prev, [toolId]: config }));
      setSuccess(`تم تحديث إعدادات ${toolId} ✅`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to add/remove services
  const addService = () => setBusiness(p => ({ ...p, services: [...p.services, { id: Date.now(), name: '', price: '', duration: '' }] }));
  const removeService = (id) => setBusiness(p => ({ ...p, services: p.services.filter(s => s.id !== id) }));
  const updateService = (id, field, value) => setBusiness(p => ({ ...p, services: p.services.map(s => s.id === id ? { ...s, [field]: value } : s) }));

  if (loading) return <div className="loading-center"><Loader2 className="spinner" /></div>;

  const currentTool = INTEGRATION_TOOLS.find(t => t.id === showGuide);
  const widgetConfig = activeTools.widget || {};
  const embedCode = `<script \n  src="https://24shift.solutions/widget.js"\n  data-agent-id="${agent?.id || '...'}"\n  data-name="${agent?.name || 'Salon'}"\n  data-welcome="${widgetConfig.welcome_message || 'Hello!'}"\n  data-color="${widgetConfig.theme_color || '#D946EF'}"\n></script>`;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Header with Title & Improved Tabs */}
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Settings size={28} style={{ color: 'var(--primary)' }} /> إعدادات الصالون الشاملة
            </h1>
            <p className="page-subtitle">تحكم في كل شاردة وواردة في صالونك وموظفتك الرقمية من مكان واحد</p>
          </div>
        </div>

        <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', border: 'none',
                background: activeTab === tab.id ? 'rgba(217,70,239,0.08)' : 'none', 
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 900 : 500, fontSize: 13, cursor: 'pointer',
                borderBottom: `3px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
                borderTopLeftRadius: 12, borderTopRightRadius: 12, transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}>
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 40 }}>
          {/* AI Sources Tab */}
          {activeTab === 'sources' && (
            <div className="fade-in">
              <div style={{ background: 'rgba(217,70,239,0.05)', padding: 24, borderRadius: 20, marginBottom: 32, border: '1px solid rgba(217,70,239,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Sparkles style={{ color: 'var(--primary)' }} size={24} />
                  <h3 style={{ fontWeight: 900 }}>الرفع الذكي بوحدة الذكاء (AI Powered)</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ارفعي ملفات صالونك أو ضعي رابط موقعك، وسنقوم بتغذية الموظفة بكافة التفاصيل تلقائياً.</p>
              </div>

              <div style={{ border: '2px dashed rgba(217,70,239,0.2)', borderRadius: 24, padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <FileUp size={28} style={{ color: 'var(--primary)', marginBottom: 20 }} />
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>قومي بسحب وإفلات الملفات هنا</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, Word, Excel</div>
              </div>

              <button className="btn btn-primary btn-full" style={{ marginTop: 32, padding: 18, fontWeight: 900, background: 'linear-gradient(to right, var(--primary), var(--accent))' }}>
                <Zap size={20} /> بدء استخراج البيانات
              </button>
            </div>
          )}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="fade-in">
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ marginBottom: 8, fontWeight: 900 }}>بيانات الصالون الأساسية 🏠</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>تأكدي من صحة هذه البيانات لضمان دقة رد الموظفة</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {SECTOR.businessFields.map(f => (
                  <div className="form-group" key={f.key}>
                    <label className="form-label">{f.label_ar}</label>
                    <input className="form-input neon-input" value={business[f.key] || ''} onChange={e => setBusiness({...business, [f.key]: e.target.value})} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ fontWeight: 900 }}>قائمة الخدمات والأسعار ✂️</h3>
                <button className="btn btn-primary btn-sm" onClick={addService}><Plus size={16} /> إضافة خدمة</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {business.services.map((s) => (
                  <div key={s.id} className="glass-card" style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <input className="form-input neon-input" value={s.name} onChange={e => updateService(s.id, 'name', e.target.value)} placeholder="اسم الخدمة..." />
                    <input className="form-input neon-input" value={s.price} onChange={e => updateService(s.id, 'price', e.target.value)} placeholder="السعر (ر.س)" />
                    <div style={{ position: 'relative' }}>
                        <Clock size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input className="form-input neon-input" style={{ paddingRight: 40 }} value={s.duration} onChange={e => updateService(s.id, 'duration', e.target.value)} placeholder="المدة..." />
                    </div>
                    <button className="btn-icon" onClick={() => removeService(s.id)} style={{ color: 'var(--error)' }}><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persona Tab */}
          {activeTab === 'persona' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40 }}>
                <div style={{ textAlign: 'center' }}>
                   <div className="glass-card" style={{ width: 140, height: 140, borderRadius: 40, background: 'rgba(255,255,255,0.02)', fontSize: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid var(--border)' }}>
                    {agent.avatar || '💅'}
                   </div>
                   <input className="form-input" value={agent.avatar || ''} onChange={e => setAgent({...agent, avatar: e.target.value})} placeholder="أيقونة" style={{ textAlign: 'center' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   {/* Mastermind Choice Section */}
                   <div style={{ background: 'rgba(217,70,239,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(217,70,239,0.1)' }}>
                      <label className="form-label" style={{ marginBottom: 16 }}>اختيار العقل المدبر للموقع 🧠</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                         <button 
                           onClick={() => setAgent({...agent, model_provider: 'openai'})}
                           style={{
                              padding: '16px', borderRadius: 12, border: `2px solid ${agent.model_provider === 'openai' ? 'var(--primary)' : 'var(--border)'}`,
                              background: agent.model_provider === 'openai' ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                           }}>
                           <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>OpenAI GPT-4o</div>
                           <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ذكي، دقيق ومستقر</div>
                         </button>
                         <button 
                           onClick={() => setAgent({...agent, model_provider: 'gemini'})}
                           style={{
                              padding: '16px', borderRadius: 12, border: `2px solid ${agent.model_provider === 'gemini' ? 'var(--primary)' : 'var(--border)'}`,
                              background: agent.model_provider === 'gemini' ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                           }}>
                           <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>Google Gemini</div>
                           <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>سريع، مبدع وعربي أصيل</div>
                         </button>
                      </div>
                   </div>

                   <div className="form-group">
                      <label className="form-label">اسم الموظفة الرقمية *</label>
                      <input className="form-input neon-input" value={agent.name || ''} onChange={e => setAgent({...agent, name: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="form-label">تعليمات الذكاء الاصطناعي (Prompts) 🧠</label>
                      <textarea className="form-input neon-input" rows={8} style={{ height: 'auto', paddingTop: 12, lineHeight: 1.6 }} placeholder="هنا تكتبين 'سر الصنعة'.." value={agent.instructions || ''} onChange={e => setAgent({...agent, instructions: e.target.value})} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab - CONSOLIDATED IN TABS */}
          {activeTab === 'integrations' && (
            <div className="fade-in">
              <div className="integration-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {INTEGRATION_TOOLS.map((tool) => {
                  const config = activeTools[tool.id] || {};
                  const isLinked = !!config.token || !!config.domain || !!config.phone_id;
                  return (
                    <div key={tool.id} className="glass-card" style={{ padding: 24, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${tool.color}15`, color: tool.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <tool.icon size={24} />
                        </div>
                        <div className={`badge ${isLinked ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: 10 }}>{isLinked ? 'مربوطة' : 'غير مربوطة'}</div>
                      </div>
                      <h4 style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{tool.name}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                        {tool.fields.map(field => (
                          <div key={field.name}>
                            <input type={field.type || 'text'} className="form-input neon-input" defaultValue={config[field.name]} placeholder={field.label} style={{ fontSize: 12, height: 40 }} onBlur={(e) => handleToolSave(tool.id, { ...config, [field.name]: e.target.value })} />
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowGuide(tool.id)} className="btn btn-secondary btn-sm btn-full" style={{ fontSize: 11 }}>
                        <HelpCircle size={14} style={{ marginRight: 6 }} /> كيف يتم الربط؟
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global Save Button */}
          {['persona', 'business', 'services'].includes(activeTab) && (
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'center' }}>
               {success && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>{success}</span>}
               <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '14px 40px', fontWeight: 900 }}>
                 {saving ? <Loader2 className="spinner" size={18} /> : <><Save size={18} /> حفظ التعديلات</>}
               </button>
            </div>
          )}
      </div>

      {/* Guidance Modal (Same as before but linked to local currentTool) */}
      {showGuide && currentTool && (
        <div className="modal-backdrop" onClick={() => setShowGuide(null)}>
          <div className="modal-content glass-card" style={{ background: 'var(--surface)', maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${currentTool.color}15`, color: currentTool.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <currentTool.icon size={22} />
                </div>
                <h3 style={{ fontWeight: 900 }}>إرشادات {currentTool.name}</h3>
              </div>
              <button onClick={() => setShowGuide(null)} className="btn-icon"><X size={20} /></button>
            </div>
            <div style={{ padding: 32 }}>
               {/* Embed Code Section for Widget */}
               {currentTool.id === 'widget' && !!widgetConfig.domain ? (
                 <div className="code-box" style={{ marginBottom: 24 }}>
                    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={() => copyToClipboard(embedCode)}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre style={{ fontSize: 11 }}>{embedCode}</pre>
                 </div>
               ) : null}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {currentTool.guide.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{idx + 1}</div>
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
