import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Send, ArrowLeft, CheckCircle, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import FloatingSettings from '../components/ui/FloatingSettings';
import { SECTOR } from '../config/sector';

const SUPPORT_EMAIL = 'salon@24shift.solutions';

export default function Contact() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { error: dbErr } = await supabase
        .from('contact_submissions')
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        });
      if (dbErr) throw dbErr;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 60px' }}>
      <FloatingSettings />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={16} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
          {isAr ? 'العودة للرئيسية' : 'Back to home'}
        </button>
        <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--primary)' }}>
          💅 {isAr ? SECTOR.name_ar : SECTOR.name}
        </span>
        <div style={{ width: 100 }} />
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px 0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 460, margin: '0 auto' }}>
            {isAr
              ? 'فريقنا جاهز للإجابة على أسئلتك خلال 24 ساعة'
              : 'Our team is ready to answer your questions within 24 hours'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

          {/* Form */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 36,
          }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={56} style={{ color: 'var(--success)', marginBottom: 20 }} />
                <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>
                  {isAr ? 'تم الإرسال بنجاح! 🎉' : 'Message sent! 🎉'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
                  {isAr
                    ? `شكراً ${form.name}! تلقينا رسالتك وسيتواصل معك فريقنا على ${form.email} خلال 24 ساعة.`
                    : `Thanks ${form.name}! We received your message and will reach out to ${form.email} within 24 hours.`}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                    {isAr ? 'إرسال رسالة أخرى' : 'Send another'}
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate('/')}>
                    {isAr ? 'العودة للرئيسية' : 'Back to home'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{isAr ? 'الاسم *' : 'Name *'}</label>
                    <input name="name" type="text" className="form-input"
                      placeholder={isAr ? 'اسمك الكريم' : 'Your name'}
                      value={form.name} onChange={handle} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{isAr ? 'البريد الإلكتروني *' : 'Email *'}</label>
                    <input name="email" type="email" className="form-input"
                      placeholder="name@example.com"
                      value={form.email} onChange={handle} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                    <input name="phone" type="tel" className="form-input"
                      placeholder={isAr ? 'اختياري' : 'Optional'}
                      value={form.phone} onChange={handle} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{isAr ? 'الموضوع' : 'Subject'}</label>
                    <select name="subject" className="form-input" value={form.subject} onChange={handle}>
                      <option value="">{isAr ? 'اختر الموضوع' : 'Select subject'}</option>
                      <option value="general">{isAr ? 'استفسار عام' : 'General inquiry'}</option>
                      <option value="pricing">{isAr ? 'الأسعار والباقات' : 'Pricing & plans'}</option>
                      <option value="technical">{isAr ? 'مشكلة تقنية' : 'Technical issue'}</option>
                      <option value="demo">{isAr ? 'طلب عرض تجريبي' : 'Request a demo'}</option>
                      <option value="partnership">{isAr ? 'شراكة' : 'Partnership'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{isAr ? 'رسالتك *' : 'Message *'}</label>
                  <textarea name="message" className="form-input"
                    rows={5}
                    placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    value={form.message} onChange={handle} required
                    style={{ resize: 'vertical', minHeight: 120 }} />
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 10, padding: '10px 16px', color: '#EF4444',
                    fontSize: 13, marginBottom: 16,
                  }}>{error}</div>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}
                  style={{ padding: '14px', fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading
                    ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={18} />}
                  {isAr ? 'إرسال الرسالة' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(217,70,239,0.1)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mail size={20} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {isAr ? 'البريد الإلكتروني' : 'Email Support'}
                </div>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                style={{
                  display: 'block', color: 'var(--primary)', fontWeight: 700,
                  fontSize: 14, textDecoration: 'none', wordBreak: 'break-all',
                  marginBottom: 8,
                }}
              >
                {SUPPORT_EMAIL}
              </a>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isAr ? 'نرد خلال 24 ساعة في أيام العمل' : 'We reply within 24h on business days'}
              </div>
            </div>

            {/* Live chat card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(217,70,239,0.1), rgba(147,51,234,0.05))',
              border: '1px solid rgba(217,70,239,0.2)',
              borderRadius: 16, padding: 24, textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={22} color="white" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
                {isAr ? 'دردشة فورية' : 'Live Chat'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                {isAr ? 'تحدّث مع مساعدتنا الآن' : 'Chat with our assistant now'}
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openConcierge'))}
                className="btn btn-primary btn-full"
                style={{ fontSize: 13 }}
              >
                {isAr ? 'ابدأ المحادثة' : 'Start Chat'}
              </button>
            </div>

            {/* Response time */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>
                {isAr ? 'أوقات الدعم' : 'Support Hours'}
              </div>
              {[
                { day: isAr ? 'الأحد — الخميس' : 'Sun — Thu', time: '9:00 AM – 6:00 PM' },
                { day: isAr ? 'الجمعة — السبت' : 'Fri — Sat', time: isAr ? 'مغلق' : 'Closed' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, padding: '6px 0',
                  borderBottom: i === 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.day}</span>
                  <span style={{ fontWeight: 700 }}>{row.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
