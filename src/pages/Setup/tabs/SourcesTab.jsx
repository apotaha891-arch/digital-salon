import React from 'react';
import { Sparkles, FileUp, Zap } from 'lucide-react';

export default function SourcesTab() {
  return (
    <div className="fade-in">
      <div style={{ 
        background: 'rgba(217,70,239,0.05)', 
        padding: 24, 
        borderRadius: 20, 
        marginBottom: 32, 
        border: '1px solid rgba(217,70,239,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Sparkles style={{ color: 'var(--primary)' }} size={24} />
          <h3 style={{ fontWeight: 900 }}>الرفع الذكي بوحدة الذكاء (AI Powered)</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          ارفعي ملفات صالونك أو ضعي رابط موقعك، وسنقوم بتغذية الموظفة بكافة التفاصيل تلقائياً.
        </p>
      </div>

      <div style={{ 
        border: '2px dashed rgba(217,70,239,0.2)', 
        borderRadius: 24, 
        padding: 60, 
        textAlign: 'center', 
        background: 'rgba(255,255,255,0.01)' 
      }}>
        <FileUp size={28} style={{ color: 'var(--primary)', marginBottom: 20 }} />
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>قومي بسحب وإفلات الملفات هنا</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, Word, Excel</div>
      </div>

      <button className="btn btn-primary btn-full" style={{ 
        marginTop: 32, 
        padding: 18, 
        fontWeight: 900, 
        background: 'linear-gradient(to right, var(--primary), var(--accent))' 
      }}>
        <Zap size={20} /> بدء استخراج البيانات
      </button>
    </div>
  );
}
