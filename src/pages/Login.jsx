import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { signUp, signIn, resetPasswordForEmail } from '../services/supabase';
import { SECTOR } from '../config/sector';
import FloatingSettings from '../components/ui/FloatingSettings';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isSignup) {
        await signUp(form.email, form.password, form.fullName);
        navigate('/setup');
      } else {
        await signIn(form.email, form.password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? t('auth.error_invalid')
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await resetPasswordForEmail(form.email);
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <FloatingSettings />

      <div className="auth-card card-glass">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{SECTOR.agent.avatar}</div>
          <h1 className="auth-title">
            {isAr ? SECTOR.name_ar : SECTOR.name}
          </h1>
          <p className="auth-subtitle">
            {isAr ? SECTOR.tagline : SECTOR.tagline_en}
          </p>
        </div>

        {/* ── Forgot Password View ── */}
        {isForgot ? (
          forgotSent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                {isAr ? 'تم إرسال الرابط!' : 'Link sent!'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                {isAr
                  ? `تحقق من بريدك الإلكتروني ${form.email} واضغط على رابط إعادة تعيين كلمة المرور`
                  : `Check your inbox at ${form.email} and click the password reset link`}
              </div>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => { setIsForgot(false); setForgotSent(false); setError(''); }}
              >
                {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {isAr
                    ? 'أدخلي بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                    : 'Enter your email and we\'ll send you a reset link'}
                </div>
              </div>
              <form onSubmit={submitForgot}>
                <div className="form-group">
                  <label className="form-label">{t('auth.email')}</label>
                  <input name="email" type="email" className="form-input"
                    placeholder="example@email.com" value={form.email} onChange={handle} required />
                </div>
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10, padding: '12px 16px', color: '#EF4444', fontSize: 14, marginBottom: 20 }}>
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : null}
                  {isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
                </button>
              </form>
              <button
                onClick={() => { setIsForgot(false); setError(''); }}
                style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 16,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit' }}
              >
                {isAr ? '← العودة لتسجيل الدخول' : '← Back to Login'}
              </button>
            </>
          )
        ) : (
          <>
            {/* Toggle */}
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
              {[t('auth.login'), t('auth.signup')].map((label, i) => (
                <button
                  key={i}
                  onClick={() => { setIsSignup(i === 1); setError(''); }}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: 8,
                    background: (isSignup ? i === 1 : i === 0) ? 'var(--primary)' : 'transparent',
                    color: (isSignup ? i === 1 : i === 0) ? 'white' : 'var(--text-muted)',
                    fontFamily: 'Tajawal, sans-serif', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >{label}</button>
              ))}
            </div>

            <form onSubmit={submit}>
              {isSignup && (
                <div className="form-group">
                  <label className="form-label">{t('auth.fullName')}</label>
                  <input name="fullName" type="text" className="form-input"
                    placeholder={t('auth.fullName_placeholder')} value={form.fullName} onChange={handle} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{t('auth.email')}</label>
                <input name="email" type="email" className="form-input"
                  placeholder="example@email.com" value={form.email} onChange={handle} required />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>{t('auth.password')}</label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => { setIsForgot(true); setError(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--primary)', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}
                    >
                      {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} className="form-input"
                    placeholder="••••••••" value={form.password} onChange={handle} required
                    style={{ paddingInlineEnd: 44 }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, padding: '12px 16px', color: '#EF4444', fontSize: 14, marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : null}
                {isSignup ? t('auth.create_account') : t('auth.enter')}
              </button>
            </form>

            {isSignup && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>
                {t('auth.signup_bonus')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
