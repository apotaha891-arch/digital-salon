import React from 'react';
import { useTranslation } from 'react-i18next';

const platforms = [
  { icon: '💬', name: 'Instagram' },
  { icon: '📘', name: 'Messenger' },
  { icon: '✈️', name: 'Telegram' },
  { icon: '🟢', name: 'WhatsApp 🔜' },
];

export default function SocialProof() {
  const { t } = useTranslation();

  return (
    <div className="ln-proof-bar">
      <div className="ln-proof-inner">
        <span className="ln-proof-text">{t('landing.proof.text')}</span>

        <div className="ln-proof-platforms">
          {platforms.map(p => (
            <div key={p.name} className="ln-platform-chip">
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
