import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const PLATFORM_COLORS = {
  manual:    '#8B5CF6',
  whatsapp:  '#25D366',
  instagram: '#E1306C',
  telegram:  '#0088cc',
  phone:     '#10B981',
};

const PLATFORM_LABELS_AR = {
  manual:    '🏪 زيارة',
  whatsapp:  '💬 واتساب',
  instagram: '📷 انستقرام',
  telegram:  '✈️ تيليقرام',
  phone:     '📞 هاتف',
};

const PLATFORM_LABELS_EN = {
  manual:    '🏪 Walk-in',
  whatsapp:  '💬 WhatsApp',
  instagram: '📷 Instagram',
  telegram:  '✈️ Telegram',
  phone:     '📞 Phone',
};

const CUSTOMERS_AR = [
  { name: 'نورة الشمري',  platform: 'manual',    service: 'قص شعر',    time: 'اليوم 10:00' },
  { name: 'سارة العتيبي', platform: 'whatsapp',  service: 'صبغة شعر',  time: 'اليوم 2:00'  },
  { name: 'ليلى القحطاني', platform: 'instagram', service: 'كيراتين',   time: 'غداً 11:00'  },
  { name: 'منى الدوسري',  platform: 'telegram',  service: 'مانيكير',   time: 'غداً 3:00'   },
];

const CUSTOMERS_EN = [
  { name: 'Noura Al-Shammari',  platform: 'manual',    service: 'Haircut',   time: 'Today 10:00' },
  { name: 'Sarah Al-Otaibi',    platform: 'whatsapp',  service: 'Hair Color', time: 'Today 2:00'  },
  { name: 'Layla Al-Qahtani',   platform: 'instagram', service: 'Keratin',   time: 'Tmrw 11:00'  },
  { name: 'Mona Al-Dosari',     platform: 'telegram',  service: 'Manicure',  time: 'Tmrw 3:00'   },
];

const SCREENS = ['customers', 'booking', 'stats'];

export default function AnimatedCRM() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const customers = isAr ? CUSTOMERS_AR : CUSTOMERS_EN;
  const platformLabels = isAr ? PLATFORM_LABELS_AR : PLATFORM_LABELS_EN;

  const [screen, setScreen] = useState(0);           // which screen (0=customers, 1=booking, 2=stats)
  const [visibleRows, setVisibleRows] = useState([]); // customer rows visible
  const [bookingStep, setBookingStep] = useState(0);  // booking form fill steps
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      while (!cancelled) {
        // --- Screen 0: Customers ---
        setScreen(0);
        setVisibleRows([]);
        setBookingStep(0);
        setStatsVisible(false);
        await sleep(400);
        for (let i = 0; i < customers.length; i++) {
          if (cancelled) return;
          setVisibleRows(v => [...v, i]);
          await sleep(500);
        }
        await sleep(2500);
        if (cancelled) return;

        // --- Screen 1: Booking ---
        setScreen(1);
        setBookingStep(0);
        await sleep(500);
        for (let step = 1; step <= 4; step++) {
          if (cancelled) return;
          await sleep(700);
          setBookingStep(step);
        }
        await sleep(2500);
        if (cancelled) return;

        // --- Screen 2: Stats ---
        setScreen(2);
        setStatsVisible(false);
        await sleep(400);
        setStatsVisible(true);
        await sleep(3500);
        if (cancelled) return;
      }
    }

    run();
    return () => { cancelled = true; };
  }, [isAr]);

  const TAB_LABELS = isAr
    ? ['العملاء', 'حجز جديد', 'الإحصائيات']
    : ['Customers', 'New Booking', 'Stats'];

  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: 'inherit',
      direction: isAr ? 'rtl' : 'ltr',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginInlineStart: 8, fontWeight: 600 }}>
          Digital Salon — {isAr ? 'لوحة التحكم' : 'Dashboard'}
        </span>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {SCREENS.map((s, i) => (
          <div key={s} style={{
            flex: 1,
            padding: '11px 8px',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: screen === i ? 800 : 500,
            color: screen === i ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: `2px solid ${screen === i ? 'var(--primary)' : 'transparent'}`,
            transition: 'all 0.3s',
            cursor: 'default',
          }}>
            {TAB_LABELS[i]}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, minHeight: 340 }}>

        {/* Screen 0: Customers */}
        {screen === 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              {isAr ? 'قائمة العملاء' : 'Customer List'}
            </div>
            {customers.map((c, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                marginBottom: 8,
                opacity: visibleRows.includes(i) ? 1 : 0,
                transform: visibleRows.includes(i) ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.35s ease',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: `${PLATFORM_COLORS[c.platform]}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                  border: `1.5px solid ${PLATFORM_COLORS[c.platform]}44`,
                }}>
                  {c.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.service}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 20, background: `${PLATFORM_COLORS[c.platform]}18`,
                    color: PLATFORM_COLORS[c.platform],
                    border: `1px solid ${PLATFORM_COLORS[c.platform]}30`,
                    whiteSpace: 'nowrap',
                  }}>
                    {platformLabels[c.platform]}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Screen 1: New Booking */}
        {screen === 1 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              {isAr ? 'إضافة حجز جديد' : 'Add New Booking'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: isAr ? 'العميل' : 'Customer',  value: isAr ? 'سارة العتيبي' : 'Sarah Al-Otaibi', step: 1 },
                { label: isAr ? 'الخدمة' : 'Service',   value: isAr ? 'صبغة شعر' : 'Hair Color',          step: 2 },
                { label: isAr ? 'التاريخ' : 'Date',     value: isAr ? 'غداً — 2:00 م' : 'Tomorrow — 2:00 PM', step: 3 },
                { label: isAr ? 'الحالة' : 'Status',    value: isAr ? '✅ مؤكد' : '✅ Confirmed',           step: 4 },
              ].map(({ label, value, step }) => (
                <div key={step} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  opacity: bookingStep >= step ? 1 : 0.15,
                  transition: 'opacity 0.4s ease',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, width: isAr ? 60 : 72, flexShrink: 0 }}>
                    {label}
                  </div>
                  <div style={{
                    flex: 1, padding: '9px 14px', borderRadius: 10,
                    background: bookingStep >= step ? 'var(--surface)' : 'var(--surface2)',
                    border: `1px solid ${bookingStep >= step ? 'var(--border)' : 'transparent'}`,
                    fontSize: 13, fontWeight: 600,
                    transition: 'all 0.4s ease',
                    color: step === 4 && bookingStep >= 4 ? '#10B981' : 'var(--text)',
                  }}>
                    {bookingStep >= step ? value : ''}
                  </div>
                </div>
              ))}
            </div>
            {bookingStep >= 4 && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 12,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                color: '#10B981', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'fadeIn 0.4s ease',
              }}>
                ✅ {isAr ? 'تم إضافة الحجز بنجاح!' : 'Booking added successfully!'}
              </div>
            )}
          </div>
        )}

        {/* Screen 2: Stats */}
        {screen === 2 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              {isAr ? 'إحصائيات اليوم' : "Today's Overview"}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: isAr ? 'إجمالي العملاء' : 'Total Customers', value: '48',  icon: '👥', color: '#8B5CF6' },
                { label: isAr ? 'حجوزات اليوم'  : "Today's Bookings", value: '7',   icon: '📅', color: '#D946EF' },
                { label: isAr ? 'تذاكر مفتوحة'  : 'Open Tickets',     value: '2',   icon: '🎫', color: '#F59E0B' },
                { label: isAr ? 'إيراد الأسبوع'  : 'Week Revenue',     value: '1,240 ر.س', icon: '💰', color: '#10B981' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  opacity: statsVisible ? 1 : 0,
                  transform: statsVisible ? 'scale(1)' : 'scale(0.92)',
                  transition: 'all 0.45s ease',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(217,70,239,0.06)', border: '1px solid rgba(217,70,239,0.15)',
              fontSize: 12, color: 'var(--text-muted)',
              opacity: statsVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.3s',
            }}>
              📈 {isAr ? 'الحجوزات أعلى بـ 12% مقارنة بالأسبوع الماضي' : 'Bookings up 12% vs last week'}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
