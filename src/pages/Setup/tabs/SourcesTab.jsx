import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, FileUp, Zap, Link, X, CheckCircle, AlertCircle, File, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabase';
import { upsertBusiness } from '../../../services/businesses';

const EXTRACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-business-data`;
const ACCEPTED = '.pdf,.doc,.docx,.txt,.csv';

export default function SourcesTab() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();

  const [mode, setMode]         = useState('file'); // 'file' | 'url'
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [url, setUrl]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null); // extracted data
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  const inputRef = useRef(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? '';
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setSaved(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const extract = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    try {
      const token = await getToken();
      let res;

      if (mode === 'file') {
        if (!file) throw new Error(isAr ? 'اختر ملفاً أولاً' : 'Please select a file first');
        const form = new FormData();
        form.append('file', file);
        res = await fetch(EXTRACT_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      } else {
        if (!url.trim()) throw new Error(isAr ? 'أدخل رابط الموقع' : 'Please enter a URL');
        const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
        res = await fetch(EXTRACT_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlWithProtocol }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    if (!result) return;
    setLoading(true);
    try {
      await upsertBusiness(user.id, {
        name:     result.name     || undefined,
        phone:    result.phone    || undefined,
        location: result.location || undefined,
        hours:    result.hours    || undefined,
        instagram:result.instagram|| undefined,
        services: result.services?.length ? result.services : undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{
        background: 'rgba(217,70,239,0.05)', padding: 24, borderRadius: 20,
        marginBottom: 28, border: '1px solid rgba(217,70,239,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Sparkles style={{ color: 'var(--primary)' }} size={22} />
          <h3 style={{ fontWeight: 900, margin: 0 }}>
            {isAr ? 'استيراد بيانات الصالون تلقائياً' : 'Auto-Import Salon Data'}
          </h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          {isAr
            ? 'ارفع ملف صالونك أو أدخل رابط موقعك وسيتم استخراج بيانات العمل تلقائياً'
            : 'Upload your salon document or enter your website URL and your business data will be extracted automatically'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--surface2)', borderRadius: 12, padding: 4,
        width: 'fit-content', border: '1px solid var(--border)'
      }}>
        {[
          { id: 'file', icon: FileUp, label: isAr ? 'رفع ملف' : 'Upload File' },
          { id: 'url',  icon: Link,   label: isAr ? 'رابط موقع' : 'Website URL' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => { setMode(id); setError(''); setResult(null); setSaved(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 9, border: 'none',
            background: mode === id ? 'var(--primary)' : 'transparent',
            color: mode === id ? 'white' : 'var(--text-muted)',
            fontSize: 13, fontWeight: mode === id ? 800 : 500,
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* File Upload */}
      {mode === 'file' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : file ? 'rgba(16,185,129,0.4)' : 'rgba(217,70,239,0.25)'}`,
            borderRadius: 20, padding: '48px 32px', textAlign: 'center',
            background: dragging ? 'rgba(217,70,239,0.04)' : file ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
          {file ? (
            <>
              <File size={32} style={{ color: '#10B981', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); setSaved(false); }} style={{
                background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8,
                color: '#EF4444', padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'inherit'
              }}>
                <X size={12} /> {isAr ? 'إزالة' : 'Remove'}
              </button>
            </>
          ) : (
            <>
              <FileUp size={32} style={{ color: 'var(--primary)', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                {isAr ? 'اسحب الملف هنا أو اضغط للاختيار' : 'Drag & drop or click to select'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, Word, Excel, TXT</div>
            </>
          )}
        </div>
      )}

      {/* URL Input */}
      {mode === 'url' && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 20, padding: 28,
          background: 'var(--surface2)'
        }}>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 10 }}>
            {isAr ? 'رابط موقع الصالون' : 'Salon Website URL'}
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '0 14px'
            }}>
              <Link size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && extract()}
                placeholder={isAr ? 'https://mysalon.com' : 'https://mysalon.com'}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 14, color: 'var(--text)', padding: '12px 0',
                  direction: 'ltr', fontFamily: 'inherit'
                }}
              />
              {url && (
                <button onClick={() => { setUrl(''); setResult(null); setSaved(false); }} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 4, display: 'flex'
                }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, margin: '8px 0 0' }}>
            {isAr
              ? 'سيتم زيارة موقعك وقراءة بيانات الصالون منه تلقائياً'
              : 'Your website will be visited and salon data will be read automatically'}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Extracted Results */}
      {result && (
        <div style={{
          marginTop: 24, padding: 24, borderRadius: 20,
          background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CheckCircle size={18} style={{ color: '#10B981' }} />
            <span style={{ fontWeight: 800, color: '#10B981' }}>
              {isAr ? 'تم استخراج البيانات بنجاح' : 'Data extracted successfully'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: isAr ? 'اسم الصالون' : 'Salon Name', value: result.name },
              { label: isAr ? 'الهاتف' : 'Phone', value: result.phone },
              { label: isAr ? 'الموقع' : 'Location', value: result.location },
              { label: isAr ? 'ساعات العمل' : 'Hours', value: result.hours },
              { label: 'Instagram', value: result.instagram ? `@${result.instagram}` : null },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {result.services?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                {isAr ? `الخدمات (${result.services.length})` : `Services (${result.services.length})`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.services.map((s, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(217,70,239,0.08)',
                    border: '1px solid rgba(217,70,239,0.15)',
                    fontSize: 11, color: 'var(--primary)', fontWeight: 600
                  }}>
                    {s.name} {s.price > 0 ? `· ${s.price}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {saved ? (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 12,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#10B981', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle size={16} />
              {isAr ? 'تم حفظ البيانات في ملف الصالون ✓' : 'Saved to your salon profile ✓'}
            </div>
          ) : (
            <button
              onClick={saveToProfile}
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: 16, padding: '12px 28px', fontWeight: 800 }}
            >
              {loading
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <><CheckCircle size={16} /> {isAr ? 'حفظ في ملف الصالون' : 'Save to Salon Profile'}</>
              }
            </button>
          )}
        </div>
      )}

      {/* Extract Button */}
      {!result && (
        <button
          onClick={extract}
          disabled={loading || (mode === 'file' ? !file : !url.trim())}
          className="btn btn-primary btn-full"
          style={{
            marginTop: 24, padding: 16, fontWeight: 900,
            background: 'linear-gradient(to right, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: loading || (mode === 'file' ? !file : !url.trim()) ? 0.6 : 1
          }}
        >
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {isAr ? 'جاري الاستخراج...' : 'Extracting...'}</>
            : <><Zap size={18} /> {isAr ? 'استخراج البيانات تلقائياً' : 'Extract Data Automatically'}</>
          }
        </button>
      )}
    </div>
  );
}
