import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, MessageCircle, Zap, ChevronRight, LifeBuoy,
  BookOpen, Calendar, CreditCard, Wifi, Settings,
  CheckCircle, AlertCircle, Info, Hash
} from 'lucide-react';

const DOCS = {
  en: [
    {
      id: 'getting-started',
      icon: Zap,
      color: '#8B5CF6',
      title: 'Getting Started',
      steps: [
        {
          title: '1. Create your account',
          body: 'Click "Start Now" on the homepage. Enter your email and password — no credit card needed. You\'ll instantly get 100 free tokens to try the platform.',
        },
        {
          title: '2. Add your salon info',
          body: 'Go to Salon Setup → Salon Info. Fill in your salon name, phone number, location, and working hours. Your AI agent uses this to answer customer questions.',
        },
        {
          title: '3. Add your services',
          body: 'Go to Salon Setup → Services. Add each service with its name, price, and duration in minutes. The agent will book appointments and quote prices automatically.',
        },
        {
          title: '4. Customize your agent',
          body: 'Go to Salon Setup → Persona. Choose your agent\'s name, emoji, and personality. Add special instructions like "never give discounts" or "always greet in Arabic".',
        },
        {
          title: '5. Connect a channel',
          body: 'Go to Connect Channel. Choose WhatsApp, Telegram, Instagram, or Facebook. Each has a simple setup guide inside the app. WhatsApp requires Meta Business API (1–3 days to approve).',
        },
        {
          title: '6. Activate your plan',
          body: 'Go to Billing → Plans. Start your 14-day free trial on any plan — no credit card required. Your agent will begin responding to customers instantly.',
        },
      ],
    },
    {
      id: 'channels',
      icon: Wifi,
      color: '#10B981',
      title: 'Connecting Channels',
      steps: [
        {
          title: 'WhatsApp Business API',
          body: 'Requires an approved Meta Business account. Apply at business.facebook.com — approval takes 1–3 days. Once approved, you\'ll get an Access Token and Phone ID to paste in the app. Does NOT work with regular WhatsApp or personal WhatsApp Business.',
        },
        {
          title: 'Telegram Bot',
          body: 'Open Telegram and message @BotFather. Send /newbot, follow the steps, and copy the Token. Paste it in Connect Channel → Telegram. Your bot is live immediately.',
        },
        {
          title: 'Instagram / Facebook',
          body: 'Connect your Facebook Business Page. The agent will reply to Instagram DMs and Facebook Messenger automatically. Requires a Facebook Page (not a personal profile).',
        },
        {
          title: 'Website Widget',
          body: 'Copy the HTML snippet from Connect Channel → Widget. Paste it before the </body> tag of your website. A chat bubble will appear for your website visitors.',
        },
      ],
    },
    {
      id: 'tokens',
      icon: Zap,
      color: '#F59E0B',
      title: 'Understanding Tokens',
      steps: [
        {
          title: 'What is a token?',
          body: 'Each message sent by your AI agent costs 1 token. Receiving messages from customers is free. A token is consumed only when the AI generates a reply.',
        },
        {
          title: 'Free trial',
          body: 'Every new account gets 100 free tokens. This is enough for ~100 customer conversations to test the platform.',
        },
        {
          title: 'Rollover tokens',
          body: 'Unused tokens never expire. They roll over to the next month automatically. If you cancel, your balance is frozen (not deleted) and restored when you resubscribe.',
        },
        {
          title: 'When tokens run out',
          body: 'Your agent pauses automatically. No messages are lost — the agent resumes as soon as you top up. Go to Billing → Top-up to add more tokens.',
        },
      ],
    },
    {
      id: 'billing',
      icon: CreditCard,
      color: '#3B82F6',
      title: 'Plans & Billing',
      steps: [
        {
          title: 'Starter — $29/month',
          body: '200 tokens/month. All channels (WhatsApp, Telegram, Instagram, Facebook). Booking system. Customer CRM. Email support. 14-day free trial.',
        },
        {
          title: 'Pro — $49/month',
          body: '400 tokens/month. Everything in Starter, plus: advanced bookings, analytics dashboard, priority support. 14-day free trial.',
        },
        {
          title: 'Top-up packages',
          body: 'Need more tokens mid-month? Buy 50 tokens for $10, 100 for $20, or 200 for $40. Top-ups never expire and stack with your monthly tokens.',
        },
        {
          title: 'Free trial',
          body: 'Every plan starts with a 14-day free trial. No credit card needed to start. You only pay after the trial ends — or cancel anytime before.',
        },
      ],
    },
    {
      id: 'bookings',
      icon: Calendar,
      color: '#EC4899',
      title: 'Bookings',
      steps: [
        {
          title: 'How bookings work',
          body: 'Your agent receives booking requests from customers via any connected channel. It checks availability and books the slot automatically, then sends a confirmation to the customer.',
        },
        {
          title: 'Viewing your bookings',
          body: 'Go to the Bookings page in the sidebar to see all upcoming and past appointments. You can filter by date, status, or customer name.',
        },
        {
          title: 'Automatic reminders',
          body: 'The agent sends automatic reminders to customers before their appointment — reducing no-shows.',
        },
      ],
    },
    {
      id: 'troubleshooting',
      icon: AlertCircle,
      color: '#EF4444',
      title: 'Troubleshooting',
      steps: [
        {
          title: 'Agent not responding',
          body: 'Check: (1) Agent is set to Active on the Dashboard toggle. (2) Token balance is above 0. (3) Channel is connected — go to Connect Channel and verify the token/access details are saved.',
        },
        {
          title: 'Forgot password',
          body: 'On the login page, click "Forgot password?" under the password field. Enter your email — you\'ll receive a reset link within a few minutes. Check spam if it doesn\'t arrive.',
        },
        {
          title: 'WhatsApp not connecting',
          body: 'Ensure you\'re using Meta Business API credentials (not regular WhatsApp). The Phone ID and Access Token must match the phone number registered in Meta. Tokens expire — regenerate in Meta Business if needed.',
        },
        {
          title: 'Wrong replies from agent',
          body: 'Go to Salon Setup → Persona and update the agent\'s instructions. Be specific: "Always quote prices in SAR", "Do not accept bookings on Fridays", etc. The more detail you add, the better the replies.',
        },
      ],
    },
  ],
  ar: [
    {
      id: 'getting-started',
      icon: Zap,
      color: '#8B5CF6',
      title: 'البدء مع المنصة',
      steps: [
        {
          title: '١. إنشاء حسابك',
          body: 'اضغط "ابدأ الآن" في الصفحة الرئيسية. أدخل بريدك الإلكتروني وكلمة المرور — لا تحتاج بطاقة ائتمان. ستحصل فوراً على 100 توكن مجاني للتجربة.',
        },
        {
          title: '٢. بيانات الصالون',
          body: 'اذهب إلى Salon Setup ← Salon Info. أدخل اسم الصالون، رقم الهاتف، الموقع، وأوقات العمل. الموظفة ستستخدم هذه المعلومات في ردودها على العملاء.',
        },
        {
          title: '٣. إضافة الخدمات',
          body: 'اذهب إلى Salon Setup ← Services. أضف كل خدمة باسمها وسعرها ومدتها بالدقائق. الموظفة ستحجز المواعيد وتعطي الأسعار تلقائياً.',
        },
        {
          title: '٤. تخصيص الموظفة',
          body: 'اذهب إلى Salon Setup ← Persona. اختري اسم موظفتك وشخصيتها. أضيفي تعليمات خاصة مثل "لا تعطي خصومات" أو "رحّبي دائماً بالاسم".',
        },
        {
          title: '٥. ربط القناة',
          body: 'اذهب إلى Connect Channel. اختاري واتساب أو تيليجرام أو إنستغرام أو فيسبوك. كل قناة فيها دليل تفصيلي داخل التطبيق.',
        },
        {
          title: '٦. تفعيل الباقة',
          body: 'اذهب إلى Billing ← Plans. ابدأ التجربة المجانية 14 يوماً على أي باقة — بدون بطاقة. الموظفة ستبدأ بالرد على العملاء فوراً.',
        },
      ],
    },
    {
      id: 'channels',
      icon: Wifi,
      color: '#10B981',
      title: 'ربط القنوات',
      steps: [
        {
          title: 'واتساب Business API',
          body: 'يحتاج حساب Meta Business معتمد. قدّم على business.facebook.com — الموافقة تأخذ 1-3 أيام. بعد الموافقة ستحصل على Access Token وPhone ID تُدخلهما في التطبيق. لا يعمل مع واتساب العادي أو واتساب Business الشخصي.',
        },
        {
          title: 'بوت تيليجرام',
          body: 'افتح تيليجرام وراسل @BotFather. أرسل /newbot واتبع الخطوات، وانسخ الـ Token. الصقه في Connect Channel ← Telegram. البوت يعمل فوراً.',
        },
        {
          title: 'إنستغرام / فيسبوك',
          body: 'اربطي صفحتك على فيسبوك Business. الموظفة ستردّ على رسائل إنستغرام Direct وفيسبوك Messenger تلقائياً. يتطلب صفحة فيسبوك رسمية (ليس حساباً شخصياً).',
        },
        {
          title: 'ويدجت الموقع',
          body: 'انسخي كود HTML من Connect Channel ← Widget. ضعيه قبل </body> في موقعك. ستظهر فقاعة محادثة لزوار موقعك.',
        },
      ],
    },
    {
      id: 'tokens',
      icon: Zap,
      color: '#F59E0B',
      title: 'نظام التوكن',
      steps: [
        {
          title: 'ما هو التوكن؟',
          body: 'كل رسالة يرسلها الذكاء الاصطناعي تستهلك توكن واحد. استقبال رسائل العملاء مجاني. التوكن يُستهلك فقط عندما يُنشئ الذكاء الاصطناعي رداً.',
        },
        {
          title: 'التجربة المجانية',
          body: 'كل حساب جديد يحصل على 100 توكن مجاني. يكفي لـ ~100 محادثة مع العملاء لتجربة المنصة.',
        },
        {
          title: 'ترحيل الرصيد',
          body: 'التوكنات لا تنتهي ولا تُحذف. تُرحَّل للشهر القادم تلقائياً. إذا ألغيتِ الاشتراك، رصيدك مجمّد (محفوظ) ويعود عند إعادة الاشتراك.',
        },
        {
          title: 'عند نفاد الرصيد',
          body: 'الموظفة تتوقف تلقائياً. لا تُفقد رسائل — تعود للعمل فور الشحن. اذهبي إلى Billing ← Top-up لإضافة توكنات.',
        },
      ],
    },
    {
      id: 'billing',
      icon: CreditCard,
      color: '#3B82F6',
      title: 'الباقات والفواتير',
      steps: [
        {
          title: 'Starter — $29/شهر',
          body: '200 توكن شهرياً. جميع القنوات (واتساب، تيليجرام، إنستغرام، فيسبوك). نظام حجوزات. إدارة عملاء. دعم بالإيميل. تجربة مجانية 14 يوم.',
        },
        {
          title: 'Pro — $49/شهر',
          body: '400 توكن شهرياً. كل مميزات Starter + حجوزات متقدمة + تحليلات + دعم أولوية. تجربة مجانية 14 يوم.',
        },
        {
          title: 'الشحن الإضافي',
          body: 'تحتاجين توكنات إضافية؟ اشحني 50 توكن بـ$10، أو 100 بـ$20، أو 200 بـ$40. لا تنتهي وتُضاف للرصيد الحالي.',
        },
        {
          title: 'التجربة المجانية',
          body: 'كل باقة تبدأ بـ14 يوم مجاني. لا تحتاجين بطاقة ائتمان للبدء. تدفعين فقط بعد انتهاء التجربة — أو تلغين في أي وقت قبلها.',
        },
      ],
    },
    {
      id: 'bookings',
      icon: Calendar,
      color: '#EC4899',
      title: 'نظام الحجوزات',
      steps: [
        {
          title: 'كيف تعمل الحجوزات',
          body: 'الموظفة تستقبل طلبات الحجز عبر أي قناة مربوطة. تتحقق من المواعيد المتاحة وتحجز تلقائياً، ثم ترسل تأكيداً للعميل فوراً.',
        },
        {
          title: 'عرض الحجوزات',
          body: 'اذهبي إلى صفحة Bookings في القائمة الجانبية لتري كل المواعيد القادمة والسابقة. يمكنك الفلترة بالتاريخ أو الحالة أو اسم العميل.',
        },
        {
          title: 'تذكير تلقائي',
          body: 'الموظفة ترسل تذكيراً تلقائياً للعميل قبل موعده — يقلّل حالات عدم الحضور.',
        },
      ],
    },
    {
      id: 'troubleshooting',
      icon: AlertCircle,
      color: '#EF4444',
      title: 'حل المشكلات',
      steps: [
        {
          title: 'الموظفة لا تردّ',
          body: 'تحققي من: (١) الموظفة في وضع Active على لوحة التحكم. (٢) رصيد التوكن أعلى من صفر. (٣) القناة مربوطة — اذهبي إلى Connect Channel وتأكدي من حفظ بيانات الاتصال.',
        },
        {
          title: 'نسيان كلمة المرور',
          body: 'في صفحة تسجيل الدخول، اضغطي "نسيت كلمة المرور؟" تحت حقل الباسورد. أدخلي إيميلك وسيصلك رابط الاستعادة خلال دقائق. تحققي من البريد المزعج إذا لم يصل.',
        },
        {
          title: 'واتساب لا يتصل',
          body: 'تأكدي من استخدام بيانات Meta Business API (ليس واتساب العادي). الـ Phone ID والـ Access Token يجب أن يطابقا الرقم المسجل في Meta. الـ Tokens تنتهي — أعيدي توليدها من Meta Business إذا لزم.',
        },
        {
          title: 'ردود الموظفة غير دقيقة',
          body: 'اذهبي إلى Salon Setup ← Persona وحدّثي تعليمات الموظفة. كوني محددة: "أعطي الأسعار بالريال السعودي"، "لا تقبلي حجوزات الجمعة". كلما كانت التعليمات أوضح، كانت الردود أدق.',
        },
      ],
    },
  ],
};

export default function HelpCenter() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');

  const docs = isAr ? DOCS.ar : DOCS.en;

  const filtered = search.trim()
    ? docs.map(section => ({
        ...section,
        steps: section.steps.filter(s =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.body.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.steps.length > 0)
    : docs;

  const activeDoc = filtered.find(d => d.id === activeSection) || filtered[0];

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={28} style={{ color: 'var(--primary)' }} />
          {isAr ? 'مركز المساعدة' : 'Help Center'}
        </h1>
        <p className="page-subtitle">
          {isAr ? 'دليل شامل للإعداد والاستخدام' : 'Complete setup and usage guide'}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 32, maxWidth: 500 }}>
        <Search size={18} style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          [isAr ? 'right' : 'left']: 16, color: 'var(--text-muted)'
        }} />
        <input
          type="text"
          placeholder={isAr ? 'ابحث في التوثيق...' : 'Search documentation...'}
          className="form-input"
          style={{ paddingInlineStart: 44, borderRadius: 12 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>
        {/* Sidebar nav */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 12, position: 'sticky', top: 24,
        }}>
          {(search ? filtered : docs).map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setSearch(''); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: isActive ? `${section.color}15` : 'transparent',
                  color: isActive ? section.color : 'var(--text-muted)',
                  fontSize: 13, fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
                  marginBottom: 2, transition: 'all 0.15s',
                }}
              >
                <Icon size={15} />
                {section.title}
              </button>
            );
          })}

          {/* Contact support */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openConcierge'))}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                background: 'rgba(217,70,239,0.08)', color: 'var(--primary)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'start',
              }}
            >
              <MessageCircle size={15} />
              {isAr ? 'تواصل مع الدعم' : 'Contact Support'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {search && filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
              <Search size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)' }}>
                {isAr ? 'لا نتائج — جرّب كلمة أخرى' : 'No results — try a different term'}
              </p>
            </div>
          ) : search ? (
            filtered.map(section => (
              <div key={section.id} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <section.icon size={18} style={{ color: section.color }} />
                  <h2 style={{ fontWeight: 900, fontSize: 16, margin: 0, color: section.color }}>{section.title}</h2>
                </div>
                {section.steps.map((step, i) => <StepCard key={i} step={step} color={section.color} />)}
              </div>
            ))
          ) : activeDoc ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${activeDoc.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeDoc.color,
                }}>
                  <activeDoc.icon size={22} />
                </div>
                <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>{activeDoc.title}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeDoc.steps.map((step, i) => <StepCard key={i} step={step} color={activeDoc.color} />)}
              </div>

              {/* Bottom CTA */}
              <div style={{
                marginTop: 36, padding: '24px 28px', borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(217,70,239,0.08), rgba(147,51,234,0.04))',
                border: '1px solid rgba(217,70,239,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                    {isAr ? 'لم تجد ما تبحث عنه؟' : 'Still have questions?'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {isAr ? 'فريقنا جاهز للمساعدة فوراً' : 'Our team is ready to help right away'}
                  </div>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openConcierge'))}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                >
                  <MessageCircle size={16} />
                  {isAr ? 'ابدأ محادثة' : 'Start a Chat'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, color }) {
  return (
    <div style={{
      padding: '20px 24px', borderRadius: 14,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderInlineStart: `3px solid ${color}`,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: 'var(--text)' }}>
        {step.title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        {step.body}
      </div>
    </div>
  );
}
