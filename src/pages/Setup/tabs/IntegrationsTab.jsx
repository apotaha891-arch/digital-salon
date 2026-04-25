import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, X, Check, Copy, Send, MessageCircle, Globe,
  ExternalLink, AlertTriangle, Info, ChevronDown
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

// ─── Rich Guide Content (Bilingual) ───
const RICH_GUIDES = {
  telegram: {
    title_ar: 'ربط بوت تيليجرام',
    title_en: 'Connect Telegram Bot',
    estimated_time: '3 min',
    sections: [
      {
        title_ar: 'إنشاء بوت جديد',
        title_en: 'Create a New Bot',
        steps: [
          { ar: 'افتح تطبيق تيليجرام وابحث عن @BotFather', en: 'Open Telegram and search for @BotFather', link: 'https://t.me/BotFather' },
          { ar: 'أرسل الأمر /newbot واتبع التعليمات', en: 'Send /newbot command and follow instructions' },
          { ar: 'اختر اسماً للبوت (مثال: Radwa Salon Bot)', en: 'Choose a name (e.g. Radwa Salon Bot)' },
          { ar: 'اختر معرّف البوت (مثال: radwa_salon_bot) — يجب أن ينتهي بـ bot', en: 'Choose a username ending in "bot" (e.g. radwa_salon_bot)' },
        ]
      },
      {
        title_ar: 'نسخ التوكن',
        title_en: 'Copy the Token',
        steps: [
          { ar: 'بعد الإنشاء سيعطيك BotFather رسالة تحتوي على التوكن', en: 'BotFather will reply with your bot token' },
          { ar: 'التوكن يكون بهذا الشكل: 123456789:ABCdefGhIjKlmNoPQRstuVWXyz', en: 'Token looks like: 123456789:ABCdefGhIjKlmNoPQRstuVWXyz' },
          { ar: 'انسخ التوكن كاملاً والصقه في حقل "Bot Token" أعلاه', en: 'Copy the full token and paste it in the "Bot Token" field above' },
        ],
        tip: { ar: '⚠️ لا تشارك التوكن مع أي شخص! إذا تسرّب، أرسل /revoke لـ BotFather لإنشاء توكن جديد.', en: '⚠️ Never share the token! If leaked, send /revoke to BotFather to regenerate.' }
      },
      {
        title_ar: 'تفعيل الربط',
        title_en: 'Activate Connection',
        steps: [
          { ar: 'اضغط "حفظ الإعدادات" وسيتم ربط البوت تلقائياً', en: 'Press "Save Settings" — the bot will be connected automatically' },
          { ar: 'أرسل رسالة للبوت على تيليجرام للتأكد من أنه يرد', en: 'Send a message to your bot on Telegram to verify it responds' },
        ]
      }
    ]
  },
  meta_whatsapp: {
    title_ar: 'ربط واتساب كلاود API',
    title_en: 'Connect WhatsApp Cloud API',
    estimated_time: '10 min',
    sections: [
      {
        title_ar: 'الدخول إلى مدير الأعمال',
        title_en: 'Access Business Manager',
        steps: [
          { ar: 'ادخل إلى Meta Business Suite', en: 'Go to Meta Business Suite', link: 'https://business.facebook.com' },
          { ar: 'من القائمة الجانبية اختر: Settings → Business Settings', en: 'From sidebar: Settings → Business Settings' },
          { ar: 'تأكد أن حساب واتساب للأعمال مرتبط بمدير الأعمال', en: 'Ensure your WhatsApp Business Account is linked' },
        ]
      },
      {
        title_ar: 'الحصول على Phone Number ID',
        title_en: 'Get Phone Number ID',
        steps: [
          { ar: 'اذهب إلى لوحة تحكم Meta Developers', en: 'Go to Meta Developers Dashboard', link: 'https://developers.facebook.com/apps' },
          { ar: 'اختر تطبيقك → WhatsApp → API Setup', en: 'Select your app → WhatsApp → API Setup' },
          { ar: 'ستجد "Phone Number ID" تحت قسم الرقم المربوط (رقم طويل مثل: 1121987954327518)', en: 'Find "Phone Number ID" under your linked number (long number like: 1121987954327518)' },
          { ar: 'انسخه والصقه في حقل "WhatsApp Phone Number ID" أعلاه', en: 'Copy and paste it in the "WhatsApp Phone Number ID" field above' },
        ]
      },
      {
        title_ar: 'إنشاء توكن دائم',
        title_en: 'Generate Permanent Token',
        steps: [
          { ar: 'من Business Settings اختر: Users → System Users', en: 'From Business Settings: Users → System Users', link: 'https://business.facebook.com/settings/system-users' },
          { ar: 'أنشئ System User جديد (اكتب أي اسم مثل: "24shift_bot")', en: 'Create a new System User (any name like "24shift_bot")' },
          { ar: 'اضغط "Generate New Token"', en: 'Click "Generate New Token"' },
          { ar: 'اختر تطبيقك، ثم فعّل الصلاحية: whatsapp_business_messaging', en: 'Select your app, then enable: whatsapp_business_messaging' },
          { ar: 'اضغط Generate → انسخ التوكن فوراً (لن يظهر مرة ثانية!)', en: 'Click Generate → Copy the token immediately (shown only once!)' },
          { ar: 'الصق التوكن في حقل "Permanent Full Access Token" أعلاه', en: 'Paste in "Permanent Full Access Token" field above' },
        ],
        tip: { ar: '⚠️ هام: انسخ التوكن فور ظهوره! إذا أغلقت النافذة بدون نسخه ستحتاج لإنشاء توكن جديد.', en: '⚠️ Important: Copy the token immediately when shown! If you close the window, you must generate a new one.' }
      }
    ]
  },
  meta_social: {
    title_ar: 'ربط فيسبوك وانستقرام',
    title_en: 'Connect Facebook & Instagram',
    estimated_time: '15 min',
    sections: [
      {
        title_ar: 'الحصول على Facebook Page ID',
        title_en: 'Get Facebook Page ID',
        steps: [
          { ar: 'افتح صفحة الفيسبوك الخاصة بصالونك', en: 'Open your salon\'s Facebook Page' },
          { ar: 'اذهب إلى: إعدادات الصفحة (Page Settings)', en: 'Go to: Page Settings' },
          { ar: 'في أسفل صفحة "About" ستجد "Page ID" — رقم طويل مثل: 1028472993686178', en: 'At the bottom of "About" you\'ll find "Page ID" — a long number like: 1028472993686178' },
          { ar: 'انسخه والصقه في حقل "Facebook Page ID" أعلاه', en: 'Copy and paste in "Facebook Page ID" field above' },
        ],
        tip: { ar: '💡 طريقة أسرع: افتح صفحتك على فيسبوك → انظر في عنوان URL، الرقم الأخير هو الـ Page ID.', en: '💡 Faster way: Open your page on Facebook → the number in the URL is your Page ID.' }
      },
      {
        title_ar: 'الحصول على Instagram Account ID',
        title_en: 'Get Instagram Account ID',
        steps: [
          { ar: 'افتح Graph API Explorer', en: 'Open Graph API Explorer', link: 'https://developers.facebook.com/tools/explorer' },
          { ar: 'اختر تطبيقك من القائمة المنسدلة', en: 'Select your app from the dropdown' },
          { ar: 'في حقل الطلب اكتب: me/accounts', en: 'In the query field type: me/accounts' },
          { ar: 'اضغط Submit — ستظهر صفحاتك. انسخ الـ id للصفحة المطلوبة', en: 'Click Submit — your pages appear. Copy the page id' },
          { ar: 'الآن اكتب في الحقل: {page_id}?fields=instagram_business_account', en: 'Now type: {page_id}?fields=instagram_business_account' },
          { ar: 'ستظهر لك instagram_business_account → id — هذا هو معرّف انستقرام الخاص بك', en: 'You\'ll see instagram_business_account → id — that\'s your Instagram Account ID' },
          { ar: 'الصقه في حقل "Instagram Account ID" أعلاه', en: 'Paste in "Instagram Account ID" field above' },
        ]
      },
      {
        title_ar: 'إنشاء Page Access Token (للإرسال)',
        title_en: 'Create Page Access Token (for sending)',
        steps: [
          { ar: 'من Graph API Explorer، اختر صلاحية pages_messaging ثم اضغط Generate Access Token', en: 'In Graph API Explorer, select pages_messaging permission then Generate Access Token', link: 'https://developers.facebook.com/tools/explorer' },
          { ar: 'أو: من Business Settings → System Users → اضغط على المستخدم → Generate Token', en: 'Or: Business Settings → System Users → click user → Generate Token' },
          { ar: 'فعّل الصلاحيات: pages_messaging + instagram_manage_messages', en: 'Enable permissions: pages_messaging + instagram_manage_messages' },
          { ar: 'انسخ التوكن والصقه في حقل "Page Access Token (for sending)" أعلاه', en: 'Copy and paste in "Page Access Token (for sending)" field above' },
        ],
        tip: { ar: '⚠️ هذا التوكن يُستخدم لإرسال الرسائل من حساب صفحتك. يختلف عن System User Token!', en: '⚠️ This token is used to send messages from your page. It\'s different from the System User Token!' }
      },
      {
        title_ar: 'إنشاء System User Token (للـ Webhooks)',
        title_en: 'Create System User Token (for Webhooks)',
        steps: [
          { ar: 'من Business Settings → System Users', en: 'From Business Settings → System Users', link: 'https://business.facebook.com/settings/system-users' },
          { ar: 'أنشئ System User جديد أو استخدم الموجود', en: 'Create new System User or use existing' },
          { ar: 'اضغط Generate New Token → اختر التطبيق', en: 'Click Generate New Token → select app' },
          { ar: 'فعّل: pages_messaging + instagram_manage_messages + pages_manage_metadata', en: 'Enable: pages_messaging + instagram_manage_messages + pages_manage_metadata' },
          { ar: 'انسخ التوكن والصقه في حقل "System User Token (for webhooks)" أعلاه', en: 'Copy and paste in "System User Token (for webhooks)" field above' },
        ]
      }
    ]
  },
  widget: {
    title_ar: 'إعداد ويدجت الموقع',
    title_en: 'Setup Website Widget',
    estimated_time: '2 min',
    sections: [
      {
        title_ar: 'تهيئة الويدجت',
        title_en: 'Configure Widget',
        steps: [
          { ar: 'أدخل رابط موقعك الإلكتروني (مثال: www.radwa-salon.com)', en: 'Enter your website URL (e.g. www.radwa-salon.com)' },
          { ar: 'اكتب رسالة الترحيب التي ستظهر للزائر', en: 'Write a welcome message for visitors' },
          { ar: 'اختر لون الويدجت ليتوافق مع تصميم موقعك', en: 'Choose widget color to match your site design' },
          { ar: 'اضغط "حفظ الإعدادات"', en: 'Click "Save Settings"' },
        ]
      },
      {
        title_ar: 'تثبيت الكود في موقعك',
        title_en: 'Install Code on Your Site',
        steps: [
          { ar: 'بعد الحفظ، اضغط "كيف يتم الربط؟" مرة أخرى وستظهر لك شيفرة الويدجت', en: 'After saving, click "How to link?" again to see the widget code' },
          { ar: 'انسخ كود الويدجت (الزر الأخضر)', en: 'Copy the widget code (green button)' },
          { ar: 'الصقه قبل وسم </body> في صفحات موقعك', en: 'Paste it before the </body> tag in your website pages' },
          { ar: 'حدّث الموقع — ستظهر فقاعة الدردشة في الزاوية', en: 'Refresh your site — the chat bubble will appear in the corner' },
        ],
        tip: { ar: '💡 إذا كنت تستخدم WordPress: أضف الكود في Appearance → Theme Editor → footer.php أو استخدم إضافة "Insert Headers & Footers"', en: '💡 WordPress users: Add code in Appearance → Theme Editor → footer.php or use "Insert Headers & Footers" plugin' }
      }
    ]
  }
};

export default function IntegrationsTab({ activeTools, agentId, agentName, onToolSave }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [showGuide, setShowGuide] = useState(null);
  const [copied, setCopied] = useState(false);
  const [localConfigs, setLocalConfigs] = useState(activeTools || {});
  const [expandedSection, setExpandedSection] = useState(0);
  const isAr = i18n.language === 'ar';

  const INTEGRATION_TOOLS = [
    {
      id: 'telegram',
      name: t('integrations.telegram.name'),
      icon: Send,
      color: '#0088cc',
      fields: [{ name: 'token', label: t('integrations.telegram.token_label'), placeholder: '123456:ABC-DEF...' }],
      checkLink: (conf) => !!conf.token
    },
    {
      id: 'meta_whatsapp',
      name: 'WhatsApp Cloud API',
      icon: MessageCircle,
      color: '#25D366',
      comingSoon: true,
      fields: [
        { name: 'phone_id', label: 'WhatsApp Phone Number ID', placeholder: '1121987954327518...' },
        { name: 'token', label: 'Permanent Full Access Token', placeholder: 'EAASLM...' }
      ],
      checkLink: (conf) => !!conf.token && !!conf.phone_id
    },
    {
      id: 'meta_social',
      name: 'Facebook & Instagram',
      icon: Check,
      color: '#0084FF',
      fields: [
        { name: 'page_id', label: 'Facebook Page ID', placeholder: '1028472993686178...' },
        { name: 'ig_id', label: 'Instagram Account ID', placeholder: '17841425526402608...' },
        { name: 'page_token', label: 'Page Access Token (for sending)', placeholder: 'EAASLM...' },
        { name: 'token', label: 'System User Token (for webhooks)', placeholder: 'EAASLM...' },
      ],
      checkLink: (conf) => !!conf.token && !!conf.page_id
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
  const currentGuide = showGuide ? RICH_GUIDES[showGuide] : null;
  const widgetConfig = localConfigs.widget || {};
  const isWidgetLinked = !!widgetConfig.domain;

  const embedCode = `<script \n  src="https://24shift.solutions/widget.js"\n  data-agent-id="${agentId || '...'}"\n  data-name="${agentName || 'Salon'}"\n  data-welcome="${widgetConfig.welcome_message || 'Hello!'}"\n  data-color="${widgetConfig.theme_color || '#D946EF'}"\n></script>`;

  return (
    <div className="fade-in">
      <div className="integration-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}>
        {INTEGRATION_TOOLS.map((tool) => {
          const config = localConfigs[tool.id] || {};
          const isLinked = tool.checkLink(config);
          
          return (
            <div key={tool.id} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, 
                  background: `${tool.color}15`, color: tool.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <tool.icon size={24} />
                </div>
                <div className={`badge ${tool.comingSoon ? '' : (isLinked ? 'badge-active' : 'badge-inactive')}`} style={{ 
                  fontSize: 10,
                  ...(tool.comingSoon ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' } : {})
                }}>
                  {tool.comingSoon ? (isAr ? '🔜 قريباً' : '🔜 Coming Soon') : (isLinked ? t('integrations.status.linked') : t('integrations.status.not_linked'))}
                </div>
              </div>
              <h4 style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{tool.name}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, marginBottom: 16 }}>
                {tool.fields.map(field => (
                  <div key={`${tool.id}-${field.name}`}>
                    <label style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, display: 'block' }}>{field.label}</label>
                    <input 
                      type={field.type || 'text'} 
                      className="form-input neon-input" 
                      value={config[field.name] || ''} 
                      placeholder={field.placeholder} 
                      disabled={tool.comingSoon}
                      style={{ fontSize: 12, height: 40, opacity: tool.comingSoon ? 0.4 : 1 }} 
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
                disabled={tool.comingSoon}
                onClick={async () => {
                  try {
                    await onToolSave(tool.id, config);
                    alert('✅ ' + t('common.success_saved') || 'Settings saved successfully!');
                  } catch (e) {
                    alert('❌ Save failed: ' + e.message);
                  }
                }} 
                className="btn btn-primary btn-sm btn-full" 
                style={{ fontSize: 11, marginBottom: 8, opacity: tool.comingSoon ? 0.4 : 1 }}
              >
                <Check size={14} style={{ marginRight: 4 }} /> {t('integrations.save_settings')}
              </button>
              <button 
                onClick={() => { setShowGuide(tool.id); setExpandedSection(0); }} 
                className="btn btn-secondary btn-sm btn-full" 
                style={{ fontSize: 11, opacity: 0.7 }}
              >
                <HelpCircle size={14} style={{ marginRight: 4 }} /> {t('integrations.how_to_link')}
              </button>
            </div>
          );
        })}
      </div>

      {/* ═══ RICH GUIDE MODAL ═══ */}
      {showGuide && currentTool && currentGuide && (
        <div className="modal-backdrop" onClick={() => setShowGuide(null)}>
          <div 
            className="modal-content" 
            style={{ background: 'var(--surface)', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ 
                  width: 42, height: 42, borderRadius: 10, 
                  background: `${currentTool.color}15`, color: currentTool.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <currentTool.icon size={22} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 900, margin: 0 }}>
                    {isAr ? currentGuide.title_ar : currentGuide.title_en}
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ⏱ {isAr ? 'الوقت المقدّر:' : 'Estimated time:'} {currentGuide.estimated_time}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowGuide(null)} className="btn-icon"><X size={20} /></button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

              {/* Widget Embed Code */}
              {currentTool.id === 'widget' && isWidgetLinked && (
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
              )}

              {/* Accordion Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentGuide.sections.map((section, sIdx) => {
                  const isOpen = expandedSection === sIdx;
                  return (
                    <div key={sIdx} style={{ 
                      borderRadius: 16, border: '1px solid var(--border)',
                      overflow: 'hidden', transition: 'all 0.2s',
                      background: isOpen ? 'rgba(217,70,239,0.03)' : 'transparent'
                    }}>
                      {/* Section Header */}
                      <button
                        onClick={() => setExpandedSection(isOpen ? -1 : sIdx)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '16px 20px', background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit',
                          textAlign: 'start'
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: isOpen ? currentTool.color : 'var(--surface2)',
                          color: isOpen ? 'white' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 900, transition: 'all 0.2s'
                        }}>
                          {sIdx + 1}
                        </div>
                        <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>
                          {isAr ? section.title_ar : section.title_en}
                        </span>
                        <ChevronDown 
                          size={18} 
                          style={{ 
                            color: 'var(--text-muted)', transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' 
                          }} 
                        />
                      </button>

                      {/* Section Content */}
                      {isOpen && (
                        <div style={{ padding: '0 20px 20px', animation: 'fadeIn 0.2s ease-out' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                            {section.steps.map((step, stepIdx) => (
                              <div key={stepIdx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                  background: `${currentTool.color}20`, color: currentTool.color,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 900
                                }}>
                                  {stepIdx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>
                                    {isAr ? step.ar : step.en}
                                  </p>
                                  {step.link && (
                                    <a 
                                      href={step.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        fontSize: 11, color: currentTool.color, marginTop: 4,
                                        textDecoration: 'none', fontWeight: 600
                                      }}
                                    >
                                      <ExternalLink size={11} />
                                      {isAr ? 'افتح الرابط' : 'Open link'}
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Tip Box */}
                          {section.tip && (
                            <div style={{
                              marginTop: 16, padding: '12px 16px', borderRadius: 12,
                              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                              display: 'flex', gap: 10, alignItems: 'flex-start'
                            }}>
                              <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                              <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>
                                {isAr ? section.tip.ar : section.tip.en}
                              </p>
                            </div>
                          )}

                          {/* Auto-expand next section */}
                          {sIdx < currentGuide.sections.length - 1 && (
                            <button
                              onClick={() => setExpandedSection(sIdx + 1)}
                              style={{
                                marginTop: 16, padding: '8px 16px', borderRadius: 10,
                                background: `${currentTool.color}15`, border: `1px solid ${currentTool.color}30`,
                                color: currentTool.color, fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 6
                              }}
                            >
                              {isAr ? 'الخطوة التالية ←' : 'Next Step →'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Help Note */}
              <div style={{
                marginTop: 24, padding: '14px 18px', borderRadius: 12,
                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                display: 'flex', gap: 10, alignItems: 'flex-start'
              }}>
                <Info size={16} style={{ color: '#8B5CF6', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: 'var(--text-muted)' }}>
                  {isAr 
                    ? 'هل تواجه صعوبة؟ تواصل معنا عبر مركز المساعدة وسنقوم بإعداد الربط نيابة عنك مجاناً!'
                    : 'Need help? Contact us through the Help Center and we\'ll set up the connection for you — free of charge!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
