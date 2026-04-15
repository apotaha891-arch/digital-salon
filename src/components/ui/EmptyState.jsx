import React from 'react';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="card" style={{ 
      textAlign: 'center', 
      padding: '60px 20px', 
      border: '2px dashed var(--border)',
      background: 'transparent'
    }}>
      {Icon && <Icon size={48} style={{ color: 'var(--text-muted)', marginBottom: 20, opacity: 0.5 }} />}
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 24px auto' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
