import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, MessageCircle, ChevronRight, BookOpen,
  Calendar, CreditCard, Users, Globe, LifeBuoy,
  AlertCircle, Ticket, BarChart2,
} from 'lucide-react';

/* ─── Documentation content ────────────────────── */
const DOCS = {
  en: [
    {
      id: 'getting-started',
      icon: LifeBuoy,
      color: '#8B5CF6',
      title: 'Getting Started',
      steps: [
        {
          title: '1. Create your account',
          body: 'Click "Get Started" on the homepage. Enter your email and password — no credit card needed. Your 14-day free trial starts immediately.',
        },
        {
          title: '2. Fill in your salon info',
          body: 'Go to Salon Setup → Salon Info. Add your salon name, phone number, location, working hours, and Instagram handle. This info appears on your public booking page and in all client communications.',
        },
        {
          title: '3. Add your services',
          body: 'Go to Salon Setup → Services. Add each service with its name, price (SAR), and duration. Services are displayed on your public page so clients know exactly what you offer.',
        },
        {
          title: '4. Build your public page',
          body: 'Go to Salon Setup → Salon Page. Choose your color theme, appearance mode (dark / light / mix), upload your logo and cover image, and add your social media handles. Your page is live instantly at a unique link you can share.',
        },
        {
          title: '5. Add your clients',
          body: 'Go to Customers. Add clients manually with their name, phone, and preferred channel (walk-in, WhatsApp, Instagram, Telegram, phone). You can also import a list via Excel.',
        },
        {
          title: '6. Start logging bookings',
          body: 'Go to Bookings. Add appointments manually, assign a client, service, date, and time. Track status: pending, confirmed, completed, or cancelled — all in one place.',
        },
      ],
    },
    {
      id: 'customers',
      icon: Users,
      color: '#10B981',
      title: 'Customer Management (CRM)',
      steps: [
        {
          title: 'Adding clients',
          body: 'Go to Customers → Add. Enter the client\'s name, phone number, notes, and how they contact you (WhatsApp, Instagram, Telegram, walk-in, phone). Every client has a dedicated profile.',
        },
        {
          title: 'Importing from Excel',
          body: 'Download the template from the Customers page, fill in your client list, then click "Import Excel". All clients are imported instantly. Column headers must match the template (Name, Phone, Notes, Channel).',
        },
        {
          title: 'Exporting your list',
          body: 'Click "Export" on the Customers page to download your full client list as an Excel file. Useful for backup or sharing with your team.',
        },
        {
          title: 'Channel tracking',
          body: 'Each client is tagged with the channel they use to reach you — WhatsApp, Instagram, Telegram, phone, or walk-in. This helps you understand where your clients come from.',
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
          title: 'Adding a booking',
          body: 'Go to Bookings → Add. Choose a client from your CRM (or enter their name), select the service, set the date and time, and save. The booking appears in your list immediately.',
        },
        {
          title: 'Booking statuses',
          body: 'Each booking has a status: Pending (awaiting confirmation), Confirmed (appointment set), Completed (service done), or Cancelled. Update statuses as appointments progress.',
        },
        {
          title: 'Filtering bookings',
          body: 'Use the filter bar at the top of the Bookings page to filter by status, date, or search by client name or service. Helps you quickly find any appointment.',
        },
        {
          title: 'Viewing history',
          body: 'All past bookings are kept in your history. You can always look back to see when a client last visited, what service they had, and how much they paid.',
        },
      ],
    },
    {
      id: 'public-page',
      icon: Globe,
      color: '#F59E0B',
      title: 'Your Public Salon Page',
      steps: [
        {
          title: 'What is the public page?',
          body: 'Every salon gets a unique public page at digitalsalon.app/s/[your-id]. Clients can view your services, prices, contact info, and social media — and book directly via WhatsApp or your booking link.',
        },
        {
          title: 'Customizing the page',
          body: 'Go to Salon Setup → Salon Page. You can choose a color theme, appearance (dark / light / mix), upload a logo and cover image, add a tagline and description, and set a booking link.',
        },
        {
          title: 'Adding social media',
          body: 'In the Salon Page settings, scroll to "Social Media". Add your Instagram, Snapchat, TikTok, Twitter/X, WhatsApp, or Facebook handles. They appear as icons on your public page and in the floating header.',
        },
        {
          title: 'Sharing your page',
          body: 'Copy your public page URL from the Salon Page settings and share it on Instagram bio, WhatsApp status, or business card. Clients visit and can contact or book you directly.',
        },
        {
          title: 'Chat widget on public page',
          body: 'On Operations plan and above, a smart chat assistant appears on your public page — trained on your salon info, services, and pricing. It answers client questions and directs them to book via WhatsApp. On the Digital Presence plan, clients are directed to WhatsApp directly.',
        },
      ],
    },
    {
      id: 'tickets',
      icon: Ticket,
      color: '#3B82F6',
      title: 'Support Tickets',
      steps: [
        {
          title: 'What are tickets?',
          body: 'Support tickets are client requests or issues that need your attention. You can create them manually when a client has a complaint, a special request, or a question you need to follow up on.',
        },
        {
          title: 'Creating a ticket',
          body: 'Go to Help Tickets → New Ticket. Enter a title, description, and the client it\'s related to. The ticket is logged and tracked until resolved.',
        },
        {
          title: 'Ticket statuses',
          body: 'Tickets move through: Open → In Progress → Resolved. Update the status as you work on each case so nothing falls through the cracks.',
        },
      ],
    },
    {
      id: 'billing',
      icon: CreditCard,
      color: '#D946EF',
      title: 'Plans & Billing',
      steps: [
        {
          title: 'Digital Presence — $39/month',
          body: 'Your salon profile + manual CRM + booking log + support tickets + basic reports + public booking page. Perfect for getting organized and establishing a digital presence.',
        },
        {
          title: 'Operations — $119/month',
          body: 'Everything in Digital Presence, plus: channel connections (WhatsApp, Instagram, Telegram), smart booking from channels, advanced reports, and the AI chat assistant on your public page.',
        },
        {
          title: 'Marketing & Content — $199/month',
          body: 'Everything in Operations, plus: marketing tools, client outreach campaigns, and growth features to attract new clients and keep existing ones coming back.',
        },
        {
          title: '14-day free trial',
          body: 'All plans start with a 14-day free trial — no credit card required. You can explore all features before committing. Cancel anytime before the trial ends and you won\'t be charged.',
        },
        {
          title: 'Cancellation',
          body: 'Cancel anytime from Billing → Manage Subscription. No lock-in contracts. Your data stays in your account — you just lose access to paid features after the billing cycle ends.',
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
          title: 'Forgot password',
          body: 'On the login page, click "Forgot password?" below the password field. Enter your email address — you\'ll receive a reset link within a few minutes. Check your spam folder if it doesn\'t arrive.',
        },
        {
          title: 'Public page not showing my services',
          body: 'Go to Salon Setup → Services and make sure services are added and saved. Then go to Salon Setup → Salon Page and confirm "Show services list" is toggled on. Hit Save Page.',
        },
        {
          title: 'Logo or image not uploading',
          body: 'Images are stored securely — if the upload seems slow, try a smaller file (under 1MB for logo, under 3MB for cover). JPG and PNG formats are supported. If it still fails, try a different browser.',
        },
        {
          title: 'Excel import not working',
          body: 'Use the template downloaded from the Customers page. Do not rename the column headers. Save the file as .xlsx before importing. Each row = one client.',
        },
      ],
    },
  ],

  ar: [
    {
      id: 'getting-started',
      icon: LifeBuoy,
      color: '#8B5CF6',
      title: 'البدء مع المنصة',
      steps: [
        {
          title: '١. إنشاء حسابك',
          body: 'اضغط "ابدأ الآن" في الصفحة الرئيسية. أدخل بريدك الإلكتروني وكلمة المرور — لا تحتاج بطاقة ائتمان. تبدأ التجربة المجانية لـ14 يوماً فوراً.',
        },
        {
          title: '٢. بيانات الصالون',
          body: 'اذهب إلى إعدادات الصالون ← معلومات الصالون. أدخل اسم الصالون، رقم الهاتف، الموقع، أوقات العمل، وحساب إنستغرام. هذه المعلومات تظهر في صفحتك العامة وفي كل التواصل مع العملاء.',
        },
        {
          title: '٣. إضافة الخدمات',
          body: 'اذهب إلى إعدادات الصالون ← الخدمات. أضف كل خدمة باسمها وسعرها بالريال ومدتها بالدقائق. الخدمات تظهر في صفحتك العامة حتى يعرف العملاء ما تقدمينه.',
        },
        {
          title: '٤. بناء صفحتك العامة',
          body: 'اذهب إلى إعدادات الصالون ← صفحة الصالون. اختاري لون الهوية والمظهر (داكن / فاتح / مزيج)، ارفعي الشعار وصورة الغلاف، وأضيفي حسابات التواصل. صفحتك تكون جاهزة فوراً برابط خاص.',
        },
        {
          title: '٥. إضافة عملائك',
          body: 'اذهب إلى العملاء. أضيفي عملاءك يدوياً باسمهم ورقم هاتفهم وقناة تواصلهم (واتساب، إنستغرام، تيليجرام، زيارة مباشرة، هاتف). يمكنك أيضاً استيراد قائمة من إكسيل.',
        },
        {
          title: '٦. تسجيل الحجوزات',
          body: 'اذهب إلى الحجوزات. أضيفي المواعيد يدوياً بتحديد العميل والخدمة والتاريخ والوقت. تابعي الحالة: معلق، مؤكد، مكتمل، أو ملغى — كل شيء في مكان واحد.',
        },
      ],
    },
    {
      id: 'customers',
      icon: Users,
      color: '#10B981',
      title: 'إدارة العملاء (CRM)',
      steps: [
        {
          title: 'إضافة عميلة',
          body: 'اذهب إلى العملاء ← إضافة. أدخلي اسم العميلة، رقم هاتفها، ملاحظات، وقناة التواصل (واتساب، إنستغرام، تيليجرام، هاتف، زيارة مباشرة). لكل عميلة ملف خاص.',
        },
        {
          title: 'استيراد من إكسيل',
          body: 'حمّلي القالب من صفحة العملاء، أدخلي قائمة عملائك، ثم اضغطي "استيراد إكسيل". يُضاف العملاء فوراً. عناوين الأعمدة يجب أن تطابق القالب (الاسم، الهاتف، الملاحظات، القناة).',
        },
        {
          title: 'تصدير القائمة',
          body: 'اضغطي "تصدير" في صفحة العملاء لتحميل قائمة عملائك الكاملة كملف إكسيل. مفيد للنسخ الاحتياطي أو مشاركة الفريق.',
        },
        {
          title: 'تتبع القنوات',
          body: 'كل عميلة مرتبطة بالقناة التي تتواصل عبرها — واتساب، إنستغرام، تيليجرام، هاتف، أو زيارة مباشرة. يساعدك في فهم من أين يأتي عملاؤك.',
        },
      ],
    },
    {
      id: 'bookings',
      icon: Calendar,
      color: '#EC4899',
      title: 'الحجوزات',
      steps: [
        {
          title: 'إضافة حجز',
          body: 'اذهب إلى الحجوزات ← إضافة. اختاري عميلة من قاعدة البيانات، حددي الخدمة والتاريخ والوقت، واحفظي. الحجز يظهر في قائمتك فوراً.',
        },
        {
          title: 'حالات الحجز',
          body: 'لكل حجز حالة: معلق (ينتظر التأكيد)، مؤكد، مكتمل، أو ملغى. حدّثي الحالة مع تقدم كل موعد.',
        },
        {
          title: 'فلترة الحجوزات',
          body: 'استخدمي شريط الفلتر في أعلى صفحة الحجوزات للتصفية بالحالة أو التاريخ أو البحث باسم العميلة أو الخدمة.',
        },
        {
          title: 'سجل الحجوزات',
          body: 'جميع المواعيد السابقة محفوظة. يمكنك دائماً معرفة آخر زيارة للعميلة، الخدمة التي أخذتها، والمبلغ المدفوع.',
        },
      ],
    },
    {
      id: 'public-page',
      icon: Globe,
      color: '#F59E0B',
      title: 'صفحة الصالون العامة',
      steps: [
        {
          title: 'ما هي الصفحة العامة؟',
          body: 'كل صالون يحصل على صفحة عامة برابط خاص. العملاء يرون خدماتك وأسعارك ومعلومات التواصل والسوشيال ميديا — ويحجزون مباشرة عبر واتساب أو رابط الحجز.',
        },
        {
          title: 'تخصيص الصفحة',
          body: 'اذهب إلى إعدادات الصالون ← صفحة الصالون. اختاري لون الهوية والمظهر (داكن / فاتح / مزيج)، ارفعي الشعار وصورة الغلاف، وأضيفي شعاراً ووصفاً ورابط حجز.',
        },
        {
          title: 'إضافة السوشيال ميديا',
          body: 'في إعدادات صفحة الصالون، انتقلي لقسم "حسابات التواصل الاجتماعي". أضيفي إنستغرام، سناب شات، تيك توك، تويتر/X، واتساب، أو فيسبوك. تظهر كأيقونات في صفحتك.',
        },
        {
          title: 'مشاركة الصفحة',
          body: 'انسخي رابط صفحتك من إعدادات صفحة الصالون وشاركيه في بيو إنستغرام، حالة واتساب، أو بطاقة الأعمال. العملاء يزورون ويتواصلون أو يحجزون مباشرة.',
        },
        {
          title: 'ويدجت الدردشة',
          body: 'في باقة العمليات وما فوق، يظهر مساعد ذكي في صفحتك مدرّب على معلومات صالونك وخدماتك وأسعارك. يجيب على أسئلة العملاء ويوجههم للحجز عبر واتساب. في باقة الحضور الرقمي، يُحوَّل العميل مباشرة لواتساب.',
        },
      ],
    },
    {
      id: 'tickets',
      icon: Ticket,
      color: '#3B82F6',
      title: 'تذاكر الدعم',
      steps: [
        {
          title: 'ما هي التذاكر؟',
          body: 'تذاكر الدعم هي طلبات أو مشكلات من العملاء تحتاج متابعتك. أنشئيها يدوياً عند وجود شكوى أو طلب خاص أو سؤال يحتاج متابعة.',
        },
        {
          title: 'إنشاء تذكرة',
          body: 'اذهب إلى تذاكر المساعدة ← تذكرة جديدة. أدخلي عنواناً ووصفاً والعميلة المعنية. التذكرة تُسجّل وتُتابع حتى يتم حلها.',
        },
        {
          title: 'حالات التذاكر',
          body: 'التذاكر تمر بـ: مفتوحة ← قيد المعالجة ← محلولة. حدّثي الحالة مع عملك على كل حالة حتى لا يفوتك شيء.',
        },
      ],
    },
    {
      id: 'billing',
      icon: CreditCard,
      color: '#D946EF',
      title: 'الباقات والفواتير',
      steps: [
        {
          title: 'الحضور الرقمي — $39/شهر',
          body: 'ملف الصالون + إدارة العملاء يدوياً + تسجيل الحجوزات + تذاكر الدعم + تقارير أساسية + صفحة الحجز العامة. مثالية للتنظيم وبناء الحضور الرقمي.',
        },
        {
          title: 'إدارة العمليات — $119/شهر',
          body: 'كل مميزات الحضور الرقمي + ربط القنوات (واتساب، إنستغرام، تيليجرام) + حجوزات ذكية من القنوات + تقارير متقدمة + مساعد الدردشة الذكي في صفحتك.',
        },
        {
          title: 'التسويق والمحتوى — $199/شهر',
          body: 'كل مميزات إدارة العمليات + أدوات تسويق + حملات تواصل مع العملاء + أدوات نمو لاستقطاب عملاء جدد والاحتفاظ بالحاليين.',
        },
        {
          title: 'التجربة المجانية 14 يوماً',
          body: 'كل الباقات تبدأ بتجربة مجانية 14 يوماً — بدون بطاقة ائتمان. استكشفي كل الميزات قبل الالتزام. ألغي في أي وقت قبل انتهاء التجربة ولن تتحملي أي تكلفة.',
        },
        {
          title: 'الإلغاء',
          body: 'ألغي في أي وقت من الفواتير ← إدارة الاشتراك. لا عقود ملزمة. بياناتك تبقى في حسابك — فقط تفقدين الوصول للميزات المدفوعة بعد نهاية دورة الفوترة.',
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
          title: 'نسيان كلمة المرور',
          body: 'في صفحة تسجيل الدخول، اضغطي "نسيت كلمة المرور؟" تحت حقل الباسورد. أدخلي إيميلك وسيصلك رابط الاستعادة خلال دقائق. تحققي من البريد المزعج إذا لم يصل.',
        },
        {
          title: 'الخدمات لا تظهر في الصفحة العامة',
          body: 'اذهب إلى إعدادات الصالون ← الخدمات وتأكد من إضافتها وحفظها. ثم اذهب إلى صفحة الصالون وتأكد أن خيار "عرض قائمة الخدمات" مفعّل. اضغط حفظ الصفحة.',
        },
        {
          title: 'الشعار أو الصورة لا يُرفع',
          body: 'جرّبي ملفاً أصغر (أقل من 1MB للشعار، أقل من 3MB للغلاف). تُدعم صيغ JPG وPNG. إذا استمرت المشكلة، جرّبي متصفحاً مختلفاً.',
        },
        {
          title: 'استيراد الإكسيل لا يعمل',
          body: 'استخدمي القالب المحمّل من صفحة العملاء. لا تغيّري عناوين الأعمدة. احفظي الملف بصيغة .xlsx قبل الاستيراد. كل صف = عميلة واحدة.',
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
          [isAr ? 'right' : 'left']: 16, color: 'var(--text-muted)',
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
        {/* Sidebar */}
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
                  background: isActive ? `${section.color}18` : 'transparent',
                  color: isActive ? section.color : 'var(--text-muted)',
                  fontSize: 13, fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
                  marginBottom: 2, transition: 'all 0.15s',
                }}
              >
                <Icon size={15} />
                {section.title}
                {isActive && <ChevronRight size={13} style={{ marginInlineStart: 'auto', opacity: .6 }} />}
              </button>
            );
          })}

          {/* Support CTA */}
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
              <Search size={40} style={{ opacity: .2, marginBottom: 12 }} />
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
                  background: `${activeDoc.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeDoc.color,
                }}>
                  <activeDoc.icon size={22} />
                </div>
                <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>{activeDoc.title}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeDoc.steps.map((step, i) => <StepCard key={i} step={step} color={activeDoc.color} />)}
              </div>

              {/* Bottom CTA */}
              <div style={{
                marginTop: 36, padding: '24px 28px', borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(217,70,239,0.07), rgba(147,51,234,0.03))',
                border: '1px solid rgba(217,70,239,0.14)',
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
    }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: 'var(--text)' }}>
        {step.title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>
        {step.body}
      </div>
    </div>
  );
}
