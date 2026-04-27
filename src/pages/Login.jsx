import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signUp, signIn } from '../services/supabase';
import { SECTOR } from '../config/sector';
import FloatingSettings from '../components/ui/FloatingSettings';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  return (
    <div className="auth-page">
      <FloatingSettings />

      <div className="auth-card card-glass">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{SECTOR.agent.avatar}</div>
          <h1 className="auth-title">
            {i18n.language === 'ar' ? SECTOR.name_ar : SECTOR.name}
          </h1>
          <p className="auth-subtitle">
            {i18n.language === 'ar' ? SECTOR.tagline : SECTOR.tagline_en}
          </p>
        </div>

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
            <label className="form-label">{t('auth.password')}</label>
            <input name="password" type="password" className="form-input"
              placeholder="••••••••" value={form.password} onChange={handle} required />
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
      </div>
    </div>
  );
}
