import React from 'react';

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '',
  icon: Icon
}) {
  const variants = {
    default: 'badge-default',
    active: 'badge-active',
    inactive: 'badge-inactive',
    warning: 'badge-warning',
    error: 'badge-error',
    success: 'badge-success',
    primary: 'badge-primary'
  };

  const sizes = {
    sm: { fontSize: 10, padding: '2px 8px' },
    md: { fontSize: 12, padding: '4px 12px' },
    lg: { fontSize: 14, padding: '6px 16px' }
  };

  return (
    <div 
      className={`badge ${variants[variant]} ${className}`} 
      style={sizes[size]}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} style={{ marginLeft: 6 }} />}
      {children}
    </div>
  );
}
