import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { useBusiness } from '../../../hooks/useBusiness';
import { supabase } from '../../../services/supabase';
import { Globe, Palette, Image, Type, Eye, Save, Loader2, Copy, Check, Upload, X } from 'lucide-react';

const COLOR_THEMES = [
  { id: 'fuchsia', primary: '#D946EF', secondary: '#9333EA', rgb: '217,70,239',  name_ar: 'فوشيا',   name_en: 'Fuchsia' },
  { id: 'rose',    primary: '#E11D48', secondary: '#BE123C', rgb: '225,29,72',   name_ar: 'وردي',    name_en: 'Rose'    },
  { id: 'violet',  primary: '#7C3AED', secondary: '#5B21B6', rgb: '124,58,237',  name_ar: 'بنفسجي',  name_en: 'Violet'  },
  { id: 'emerald', primary: '#059669', secondary: '#065F46', rgb: '5,150,105',   name_ar: 'زمردي',   name_en: 'Emerald' },
  { id: 'amber',   primary: '#D97706', secondary: '#92400E', rgb: '217,119,6',   name_ar: 'ذهبي',    name_en: 'Amber'   },
  { id: 'sky',     primary: '#0284C7', secondary: '#0C4A6E', rgb: '2,132,199',   name_ar: 'سماوي',   name_en: 'Sky'     },
];

const MODES = [
  {
    id: 'dark',
    name_ar: 'داكن',    name_en: 'Dark',
    desc_ar: 'الوضع الداكن — نفس هوية Digital Salon',
    desc_en: 'Dark mode — Digital Salon identity',
    preview: '🖤',
    bg: '#0F0A1E',
  },
  {
    id: 'light',
    name_ar: 'فاتح',    name_en: 'Light',
    desc_ar: 'وضع النهار — خلفية فاتحة وألوان ناعمة',
    desc_en: 'Day mode — light background, soft tones',
    preview: '🤍',
    bg: '#F0EBF8',
  },
  {
    id: 'mix',
    name_ar: 'مزيج',    name_en: 'Mix',
    desc_ar: 'خلفية داكنة مع تدرجات لونية حيّة',
    desc_en: 'Dark background with vibrant color gradients',
    preview: '🌈',
    bg: 'linear-gradient(135deg,#0F0A1E,#241540)',
  },
];

const DEFAULT_PAGE = {
  template: 'dark',
  theme: 'fuchsia',
  tagline: '',
  description: '',
  logo_url: '',
  hero_url: '',
  show_services: true,
  show_booking_btn: true,
  show_contact: true,
  booking_link: '',
  slug: '',
  socials: { instagram: '', snapchat: '', tiktok: '', twitter: '', whatsapp: '', facebook: '' },
};

const PUBLIC_DOMAIN = 'https://digitalsalon.website';

function toSlug(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')   // ASCII only — no Arabic
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const SOCIAL_FIELDS = [
  { key: 'instagram', icon: '📷', label_ar: 'إنستغرام',  label_en: 'Instagram',  placeholder: '@handle' },
  { key: 'snapchat',  icon: '👻', label_ar: 'سناب شات',  label_en: 'Snapchat',   placeholder: '@handle' },
  { key: 'tiktok',    icon: '🎵', label_ar: 'تيك توك',   label_en: 'TikTok',     placeholder: '@handle' },
  { key: 'twitter',   icon: '🐦', label_ar: 'تويتر / X', label_en: 'Twitter / X',placeholder: '@handle' },
  { key: 'whatsapp',  icon: '💬', label_ar: 'واتساب',    label_en: 'WhatsApp',   placeholder: '966xxxxxxxxx' },
  { key: 'facebook',  icon: '📘', label_ar: 'فيسبوك',    label_en: 'Facebook',   placeholder: 'page-name' },
];

export default function SalonPageTab() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const { business, loading, updateBusiness, saving } = useBusiness(user?.id);

  const [page, setPage] = useState(DEFAULT_PAGE);
  const [copied, setCopied] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [success, setSuccess] = useState('');
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

  useEffect(() => {
    if (business?.metadata?.page) {
      setPage({ ...DEFAULT_PAGE, ...business.metadata.page });
    }
  }, [business]);

  const autoSlug = toSlug(business?.metadata?.name_en || business?.name_en || business?.name || '');
  const slug = page.slug || autoSlug;
  const publicUrl = slug ? `${PUBLIC_DOMAIN}/${slug}` : '';

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadImage = async (file, type) => {
    const setter = type === 'logo' ? setUploadingLogo : setUploadingHero;
    const maxMB = type === 'logo' ? 1 : 3;
    if (file.size > maxMB * 1024 * 1024) {
      alert(isAr ? `حجم الملف كبير جداً (الحد ${maxMB}MB)` : `File too large (max ${maxMB}MB)`);
      return;
    }
    setter(true);
    try {
      // Try Supabase Storage first
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${type}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('salon-assets')
        .upload(path, file, { upsert: true });

      if (!error) {
        const { data: { publicUrl: url } } = supabase.storage.from('salon-assets').getPublicUrl(path);
        setPage(p => ({ ...p, [`${type}_url`]: url }));
        return;
      }

      // Fallback: convert to base64 and store inline
      const reader = new FileReader();
      reader.onload = (e) => {
        setPage(p => ({ ...p, [`${type}_url`]: e.target.result }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setter(false);
    }
  };

  const handleSave = async () => {
    try {
      const autoSlug = page.slug || toSlug(business?.metadata?.name_en || business?.name_en || business?.name || '');
      const pageWithSlug = { ...page, slug: autoSlug };
      await updateBusiness({
        ...business,
        metadata: { ...(business?.metadata || {}), slug: autoSlug, page: pageWithSlug },
      });
      setPage(pageWithSlug);
      setSuccess(isAr ? 'تم حفظ صفحة الصالون ✨' : 'Salon page saved ✨');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedTheme = COLOR_THEMES.find(c => c.id === page.theme) || COLOR_THEMES[2];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>...</div>;

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>

      {/* ── Left: Settings ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Public URL */}
        <div style={{ padding: 20, borderRadius: 16, background: 'rgba(217,70,239,0.05)', border: '1px solid rgba(217,70,239,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Globe size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>{isAr ? 'رابط صفحتك العامة' : 'Your Public Page URL'}</span>
          </div>

          {/* Slug customizer */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
              {isAr ? 'اسم الرابط (إنجليزي فقط)' : 'URL name (English only)'}
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: 'var(--surface2)', borderRadius: 10,
              border: `1px solid ${!slug ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
              overflow: 'hidden'
            }}>
              <span style={{ padding: '9px 10px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border)', direction: 'ltr' }}>
                digitalsalon.website/
              </span>
              <input
                type="text"
                value={page.slug || autoSlug}
                onChange={e => setPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-') }))}
                placeholder={autoSlug || (isAr ? 'my-salon' : 'my-salon')}
                dir="ltr"
                style={{ flex: 1, border: 'none', background: 'transparent', padding: '9px 12px', fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            {!slug && (
              <p style={{ fontSize: 11, color: '#EF4444', marginTop: 5 }}>
                {isAr
                  ? '⚠️ أدخل اسم الصالون بالإنجليزي في تبويب "بيانات الصالون" لتفعيل الرابط'
                  : '⚠️ Enter your salon\'s English name in the "Business Info" tab to activate your link'}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, padding: '9px 14px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              fontSize: 12, color: 'var(--primary)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', fontWeight: 600,
            }}>
              {publicUrl || (isAr ? '⚠️ أدخل الاسم الإنجليزي أولاً' : '⚠️ Enter English name first')}
            </div>
            <button onClick={handleCopy} className="btn btn-secondary" style={{ flexShrink: 0, padding: '9px 14px', fontSize: 12, gap: 6 }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
            </button>
            <a href={slug ? `/s/${slug}` : `/s/${business?.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flexShrink: 0, padding: '9px 14px', fontSize: 12, textDecoration: 'none' }}>
              <Eye size={14} />
              {isAr ? 'معاينة' : 'Preview'}
            </a>
          </div>
        </div>

        {/* Appearance Mode */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Eye size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>{isAr ? 'مظهر الصفحة' : 'Appearance'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {MODES.map(m => {
              const active = page.template === m.id;
              return (
                <button key={m.id} onClick={() => setPage(p => ({ ...p, template: m.id }))} style={{
                  padding: '14px 10px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  background: active ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                  transition: 'all 0.2s', fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
                }}>
                  {/* mini bg swatch */}
                  <div style={{
                    width: '100%', height: 36, borderRadius: 8, marginBottom: 10,
                    background: m.bg, border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {m.preview}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: active ? 'var(--primary)' : 'var(--text)', marginBottom: 3 }}>
                    {isAr ? m.name_ar : m.name_en}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {isAr ? m.desc_ar : m.desc_en}
                  </div>
                  {active && <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Theme */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Palette size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>{isAr ? 'لون الهوية' : 'Brand Color'}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLOR_THEMES.map(theme => {
              const active = page.theme === theme.id;
              return (
                <button key={theme.id} onClick={() => setPage(p => ({ ...p, theme: theme.id }))} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                  border: `2px solid ${active ? theme.primary : 'var(--border)'}`,
                  background: active ? `${theme.primary}18` : 'var(--surface2)',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? theme.primary : 'var(--text-muted)' }}>
                    {isAr ? theme.name_ar : theme.name_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Images */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Image size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>{isAr ? 'الصور' : 'Images'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Logo */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {isAr ? 'شعار الصالون (Logo)' : 'Salon Logo'}
              </label>
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')} />
              <div onClick={() => logoInputRef.current?.click()} style={{
                height: 100, borderRadius: 12, border: '2px dashed var(--border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'var(--surface2)', overflow: 'hidden',
                position: 'relative', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {page.logo_url ? (
                  <>
                    <img src={page.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                    <button onClick={e => { e.stopPropagation(); setPage(p => ({ ...p, logo_url: '' })); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}><X size={10} /></button>
                  </>
                ) : uploadingLogo ? (
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                ) : (
                  <>
                    <Upload size={18} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isAr ? 'رفع الشعار' : 'Upload Logo'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Hero */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                {isAr ? 'صورة الغلاف (Hero)' : 'Hero / Cover Image'}
              </label>
              <input ref={heroInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'hero')} />
              <div onClick={() => heroInputRef.current?.click()} style={{
                height: 100, borderRadius: 12, border: '2px dashed var(--border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'var(--surface2)', overflow: 'hidden',
                position: 'relative', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {page.hero_url ? (
                  <>
                    <img src={page.hero_url} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={e => { e.stopPropagation(); setPage(p => ({ ...p, hero_url: '' })); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}><X size={10} /></button>
                  </>
                ) : uploadingHero ? (
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                ) : (
                  <>
                    <Upload size={18} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isAr ? 'رفع صورة الغلاف' : 'Upload Cover Image'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Type size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>{isAr ? 'النصوص' : 'Content'}</span>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              {isAr ? 'الشعار / الـ Tagline' : 'Tagline'}
            </label>
            <input type="text" value={page.tagline} onChange={e => setPage(p => ({ ...p, tagline: e.target.value }))}
              placeholder={isAr ? 'جمالك، أولويتنا 💅' : 'Your beauty, our priority 💅'}
              className="form-input" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              {isAr ? 'وصف الصالون' : 'Salon Description'}
            </label>
            <textarea rows={3} value={page.description} onChange={e => setPage(p => ({ ...p, description: e.target.value }))}
              placeholder={isAr ? 'نبذة عن صالونك ورؤيتك...' : 'Tell clients about your salon and vision...'}
              className="form-input" style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              {isAr ? 'رابط الحجز' : 'Booking Link'}
            </label>
            <input type="url" value={page.booking_link} onChange={e => setPage(p => ({ ...p, booking_link: e.target.value }))}
              placeholder="https://fresha.com/book/your-salon  or  https://wa.me/966xxxxxxxx"
              className="form-input" style={{ width: '100%', boxSizing: 'border-box', direction: 'ltr' }} />
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 10,
              background: 'rgba(0,184,169,0.07)', border: '1px solid rgba(0,184,169,0.25)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🟢</span>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                {isAr
                  ? 'الصق رابط صفحة الحجز من فريشا (fresha.com) وسيتحول زر "احجزي موعدك" مباشرة إلى صفحتك على فريشا.'
                  : 'Paste your Fresha booking page URL (fresha.com) and the "Book Now" button will link directly to your Fresha page.'}
              </p>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>{isAr ? 'أقسام الصفحة' : 'Page Sections'}</span>
          {[
            { key: 'show_services',    label_ar: 'عرض قائمة الخدمات',    label_en: 'Show services list' },
            { key: 'show_booking_btn', label_ar: 'عرض زر الحجز',          label_en: 'Show booking button' },
            { key: 'show_contact',     label_ar: 'عرض معلومات التواصل',   label_en: 'Show contact info' },
          ].map(({ key, label_ar, label_en }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => setPage(p => ({ ...p, [key]: !p[key] }))} style={{
                width: 40, height: 22, borderRadius: 11, position: 'relative',
                background: page[key] ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: page[key] ? 20 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{isAr ? label_ar : label_en}</span>
            </label>
          ))}
        </div>

        {/* Social Media */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🔗</span>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{isAr ? 'حسابات التواصل الاجتماعي' : 'Social Media'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {SOCIAL_FIELDS.map(({ key, icon, label_ar, label_en, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <span>{icon}</span> {isAr ? label_ar : label_en}
                </label>
                <input
                  type="text"
                  value={page.socials?.[key] || ''}
                  onChange={e => setPage(p => ({ ...p, socials: { ...(p.socials || {}), [key]: e.target.value } }))}
                  placeholder={placeholder}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', direction: 'ltr', fontSize: 13 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {success && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>{success}</span>}
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '12px 32px', fontWeight: 900 }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={16} /> {isAr ? 'حفظ الصفحة' : 'Save Page'}</>}
          </button>
        </div>
      </div>

      {/* ── Right: Live Preview ── */}
      <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={13} /> {isAr ? 'معاينة مباشرة' : 'Live Preview'}
        </div>
        <SalonPagePreview page={page} business={business} isAr={isAr} />
      </div>
    </div>
  );
}

/* ── Live preview matching the actual public page ── */
const PREVIEW_ACCENTS = {
  fuchsia: { primary: '#D946EF', secondary: '#9333EA', rgb: '217,70,239' },
  rose:    { primary: '#E11D48', secondary: '#BE123C', rgb: '225,29,72'  },
  violet:  { primary: '#7C3AED', secondary: '#5B21B6', rgb: '124,58,237' },
  emerald: { primary: '#059669', secondary: '#065F46', rgb: '5,150,105'  },
  amber:   { primary: '#D97706', secondary: '#92400E', rgb: '217,119,6'  },
  sky:     { primary: '#0284C7', secondary: '#0C4A6E', rgb: '2,132,199'  },
};

function SalonPagePreview({ page, business, isAr }) {
  const mode   = page.template || 'dark';
  const accent = page.theme    || 'fuchsia';
  const a      = PREVIEW_ACCENTS[accent] || PREVIEW_ACCENTS.fuchsia;
  const isLight = mode === 'light';

  const bg       = isLight ? '#F0EBF8' : '#0F0A1E';
  const surface  = isLight ? '#FFFFFF'  : '#1A0F2E';
  const border   = `rgba(${a.rgb},${isLight ? '0.22' : '0.2'})`;
  const txt      = isLight ? '#1A0F2E'  : '#FFFFFF';
  const muted    = isLight ? 'rgba(26,15,46,0.5)' : 'rgba(255,255,255,0.45)';
  const cardBg   = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const services = business?.services || [];

  const heroBg = page.hero_url
    ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.3)),url(${page.hero_url}) center/cover`
    : mode === 'mix'
      ? `radial-gradient(ellipse at 30% 50%,rgba(${a.rgb},0.35) 0%,transparent 60%),linear-gradient(135deg,#0F0A1E,#241540)`
      : `linear-gradient(135deg,${a.primary},${a.secondary})`;

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${border}`,
      boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.08)' : `0 8px 32px rgba(${a.rgb},0.15)`,
      fontFamily: "'Tajawal', sans-serif",
      background: bg,
      minHeight: 500,
      position: 'relative',
    }}>
      {/* glow orbs for dark/mix */}
      {!isLight && (
        <>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle,rgba(${a.rgb},0.18),transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 20, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle,rgba(${a.rgb},0.12),transparent 70%)`, pointerEvents: 'none' }} />
        </>
      )}

      {/* Hero */}
      <div style={{
        minHeight: 140, background: heroBg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', textAlign: 'center', position: 'relative',
      }}>
        {page.logo_url && (
          <img src={page.logo_url} alt="logo" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 10, border: `2px solid rgba(${a.rgb},0.6)`, boxShadow: `0 0 16px rgba(${a.rgb},0.4)` }} />
        )}
        <div style={{ fontWeight: 900, fontSize: 18, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          {business?.name || (isAr ? 'اسم الصالون' : 'Salon Name')}
        </div>
        {page.tagline && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontWeight: 500 }}>{page.tagline}</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        {page.description && (
          <p style={{ fontSize: 11, color: muted, lineHeight: 1.6, margin: 0 }}>{page.description}</p>
        )}

        {/* Services */}
        {page.show_services && services.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: a.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {isAr ? 'خدماتنا' : 'Services'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {services.slice(0, 4).map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 10px', borderRadius: 10,
                  background: cardBg, border: `1px solid ${border}`,
                  backdropFilter: 'blur(6px)',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: txt }}>{s.name}</span>
                  {s.price > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: a.primary }}>{s.price} ر.س</span>}
                </div>
              ))}
              {services.length > 4 && (
                <div style={{ fontSize: 10, color: muted, textAlign: 'center' }}>+{services.length - 4} {isAr ? 'خدمات أخرى' : 'more'}</div>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        {page.show_contact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {business?.phone    && <div style={{ fontSize: 11, color: muted }}>📞 {business.phone}</div>}
            {business?.location && <div style={{ fontSize: 11, color: muted }}>📍 {business.location}</div>}
            {business?.hours    && <div style={{ fontSize: 11, color: muted }}>🕐 {business.hours}</div>}
          </div>
        )}

        {/* Booking Button */}
        {page.show_booking_btn && (
          <div style={{
            padding: '10px', borderRadius: 12, textAlign: 'center',
            background: `linear-gradient(135deg,${a.primary},${a.secondary})`,
            color: 'white', fontWeight: 800, fontSize: 12,
            boxShadow: `0 4px 14px rgba(${a.rgb},0.4)`,
          }}>
            {isAr ? '📅 احجزي موعدك الآن' : '📅 Book Your Appointment'}
          </div>
        )}

        <div style={{ fontSize: 10, color: muted, textAlign: 'center', paddingTop: 4 }}>
          Powered by Digital Salon
        </div>
      </div>
    </div>
  );
}
