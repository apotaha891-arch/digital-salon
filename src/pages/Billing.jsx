import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWallet } from '../services/supabase';
import { 
  CreditCard, 
  Zap, 
  Star, 
  Crown, 
  History, 
  CheckCircle2, 
  Info,
  Calendar,
  Gem,
  ArrowUpRight
} from 'lucide-react';

const SUBSCRIPTIONS = [
  { 
    id: 'starter_sub', 
    icon: Zap, 
    name: 'باقة الانطلاق', 
    tokens: 1000, 
    price: 99, 
    popular: false, 
    features: ['1,000 توكن شهرياً', 'دعم فني عبر التذاكر', 'ربط قناتين تواصل', 'تحديثات مجانية']
  },
  { 
    id: 'pro_sub', 
    icon: Star, 
    name: 'باقة النمو', 
    tokens: 3000, 
    price: 199, 
    popular: true, 
    features: ['3,000 توكن شهرياً', 'دعم فني سريع (واتساب)', 'ربط 5 قنوات تواصل', 'أولوية في معالجة الرسائل']
  },
  { 
    id: 'elite_sub', 
    icon: Crown, 
    name: 'باقة النخبة', 
    tokens: 8000, 
    price: 449, 
    popular: false, 
    features: ['8,000 توكن شهرياً', 'مدير حساب مخصص', 'ربط عدد غير محدود', 'صلاحيات تجريبية للميزات الجديدة']
  },
];

const ONE_TIME_TOPUPS = [
  { id: 'topup_500', tokens: 500, price: 15, label: 'شحن بسيط' },
  { id: 'topup_1500', tokens: 1500, price: 39, label: 'شحن متوسط' },
  { id: 'topup_5000', tokens: 5000, price: 99, label: 'شحن احترافي' },
];

export default function Billing() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (user) getWallet(user.id).then(setWallet);
  }, [user]);

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <h1 className="page-title">الرصيد والاشتراك 💰</h1>
        <p className="page-subtitle">إدارة باقتك الشهرية وشحن رصيدك الإضافي من التوكنات</p>
      </div>

      {/* Unified Wallet Capsule */}
      <div className="glass-card" style={{ 
        marginBottom: 48, 
        background: 'linear-gradient(135deg, rgba(217,70,239,0.1) 0%, rgba(147,51,234,0.05) 100%)',
        border: '1px solid rgba(217,70,239,0.2)',
        padding: '32px 40px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1.5fr', gap: 60, alignItems: 'center' }}>
          
          {/* Left Side: Balance Information */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: 12, borderRadius: 20, background: 'rgba(217,70,239,0.1)', color: 'var(--primary)', marginBottom: 16 }}>
              <Gem size={32} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>إجمالي الرصيد الحالي</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
              {wallet?.balance?.toLocaleString() ?? 0}
              <span style={{ fontSize: 16, color: 'var(--primary)', marginLeft: 8, fontWeight: 700 }}>TOCO</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 80, background: 'rgba(255,255,255,0.05)' }} />

          {/* Right Side: Usage & Renewal Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                <Calendar size={14} /> حالة التجديد
              </div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>باقة النمو <span style={{ color: 'var(--success)', fontSize: 12 }}>(نشطة)</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>التجديد القادم: 15 مايو 2026</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                <Info size={14} /> ملاحظة هامة
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                يتم استهلاك رصيد الباقة الشهرية أولاً قبل رصيد الشحن السريع.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Subscriptions Section */}
      <div style={{ marginBottom: 64 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>الباقات الشهرية</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>اشتراكات ذكية تتجدد تلقائياً لضمان استمرارية الرد</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {SUBSCRIPTIONS.map((pkg) => (
            <div key={pkg.id} className="glass-card" style={{
              border: pkg.popular ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
              padding: '40px 32px',
              position: 'relative',
              textAlign: 'center',
              transform: pkg.popular ? 'scale(1.05)' : 'none',
              boxShadow: pkg.popular ? '0 20px 40px rgba(0,0,0,0.3)' : 'none',
              zIndex: pkg.popular ? 2 : 1
            }}>
              {pkg.popular && (
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 900,
                  padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase'
                }}>الأكثر طلباً</div>
              )}
              <div style={{ display: 'inline-flex', padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.03)', color: pkg.popular ? 'var(--primary)' : 'white', marginBottom: 20 }}>
                <pkg.icon size={24} />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>{pkg.name}</h3>
              
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 36, fontWeight: 900 }}>
                   {pkg.price} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>ر.س/شهر</span>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                  {pkg.tokens.toLocaleString()} توكن
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pkg.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> {feat}
                  </div>
                ))}
              </div>

              <button className={`btn btn-full ${pkg.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ height: 48, fontWeight: 900 }}>
                {pkg.popular ? 'ترقية الآن' : 'بدء الاشتراك'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: One-time Topups Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>شحن رصيد سريع ⚡</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>توكنات إضافية لا تنتهي صلاحيتها أبداً (للمرة واحدة)</p>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ padding: '8px 20px' }}>
            سجل المدفوعات <History size={14} style={{ marginRight: 8, opacity: 0.5 }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {ONE_TIME_TOPUPS.map((pkg) => (
            <div key={pkg.id} className="glass-card" style={{ 
              padding: '24px 32px', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{pkg.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 2 }}>
                  +{pkg.tokens.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>توكن</span>
                </div>
                <div style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>{pkg.price} ر.س</div>
              </div>
              <button className="btn-icon" style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
                <ArrowUpRight size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 60, padding: 32, background: 'rgba(255,255,255,0.02)', borderRadius: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          هل منشأتك كبيرة؟ نحن نوفر باقات مخصصة (Enterprise) تليق بحجم عملك.
          <a href="#" style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: 8, textDecoration: 'none' }}>تحدي مع خبير المبيعات</a>
        </p>
      </div>
    </div>
  );
}
