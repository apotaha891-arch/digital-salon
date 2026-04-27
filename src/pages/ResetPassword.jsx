import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, updatePassword } from '../services/supabase';
import { SECTOR } from '../config/sector';
import FloatingSettings from '../components/ui/FloatingSettings';

export default function ResetPassword() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the recovery token as a hash fragment — detect the session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setError(''); setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2500);
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{SECTOR.agent.avatar}</div>
          <h1 className="auth-title">
            {isAr ? SECTOR.name_ar : SECTOR.name}
          </h1>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              {isAr ? 'تم تغيير كلمة المرور!' : 'Password updated!'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {isAr ? 'جارٍ تحويلك للوحة التحكم...' : 'Redirecting to your dashboard...'}
            </div>
          </div>
        ) : !sessionReady ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              {isAr ? 'رابط غير صالح أو منتهي الصلاحية' : 'Invalid or expired link'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              {isAr
                ? 'يرجى طلب رابط استعادة جديد من صفحة تسجيل الدخول'
                : 'Please request a new reset link from the login page'}
            </div>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => navigate('/login')}
            >
              {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                {isAr ? 'إعادة تعيين كلمة المرور' : 'Set New Password'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {isAr ? 'اختاري كلمة مرور جديدة لحسابك' : 'Choose a new password for your account'}
              </div>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <input
                  type="password" className="form-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <input
                  type="password" className="form-input" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                />
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, padding: '12px 16px', color: '#EF4444', fontSize: 14, marginBottom: 20 }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : null}
                {isAr ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
