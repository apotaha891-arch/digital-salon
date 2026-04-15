import React from 'react';

export default function Spinner({ size = 24, color = 'var(--primary)', centered = false }) {
  const content = (
    <div 
      className="spinner" 
      style={{ 
        width: size, 
        height: size, 
        borderWidth: size / 8,
        borderTopColor: color 
      }} 
    />
  );

  if (centered) {
    return <div className="loading-center">{content}</div>;
  }

  return content;
}
