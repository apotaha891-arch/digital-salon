import React from 'react';

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = 'var(--primary)',
  loading = false 
}) {
  if (loading) {
    return (
      <div className="stat-card loading-shimmer">
        <div style={{ height: 32, width: '60%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 16, width: '40%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div className="stat-number" style={{ color }}>{value}</div>
        {Icon && <Icon size={20} style={{ color, opacity: 0.7 }} />}
      </div>
      <div className="stat-label">{label}</div>
      {trend && (
        <div style={{ fontSize: 11, marginTop: 8, color: trend.startsWith('+') ? 'var(--success)' : 'var(--error)' }}>
          {trend} مقارنة بالشهر الماضي
        </div>
      )}
    </div>
  );
}
