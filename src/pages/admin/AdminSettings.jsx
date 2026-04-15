import { SECTOR } from '../../config/sector';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">إعدادات المنصة ⚙️</h1>
        <p className="page-subtitle">إدارة إعدادات النظام والتسعير</p>
      </div>

      {/* Sector info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>إعدادات القطاع الحالي</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'اسم المنصة', value: SECTOR.name_ar },
            { label: 'القطاع', value: 'صالونات التجميل والسبا' },
            { label: 'دور الموظفة', value: SECTOR.agent.role_ar },
            { label: 'الأيقونة الافتراضية', value: SECTOR.agent.avatar },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Token pricing */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>تسعير التوكنات</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { platform: '✈️ تيليجرام', rate: '1 توكن / رسالة' },
            { platform: '💬 واتساب', rate: '3 توكنات / رسالة' },
            { platform: '🌐 ويدجت الموقع', rate: '2 توكنات / رسالة' },
          ].map(({ platform, rate }) => (
            <div key={platform} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', background: 'var(--surface2)', borderRadius: 10
            }}>
              <span style={{ fontWeight: 500 }}>{platform}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{rate}</span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
          * لتعديل التسعير، يرجى التواصل مع الفريق التقني لتحديث قاعدة البيانات
        </p>
      </div>

      {/* White label note */}
      <div className="card" style={{ background: 'rgba(217,70,239,0.05)', border: '1px solid rgba(217,70,239,0.2)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🏷️ تخصيص White Label</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8 }}>
          لتحويل هذا النظام لقطاع مختلف (مطاعم، عقارات، عيادات...)، قم بتعديل ملف:
          <br />
          <code style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6, color: 'var(--accent)', fontSize: 13 }}>
            src/config/sector.js
          </code>
          <br /><br />
          هذا الملف يتحكم في كل عناصر الهوية البصرية والمحتوى حسب القطاع.
        </p>
      </div>
    </div>
  );
}
