import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const MESSAGES_AR = [
  { from: 'user', text: 'مرحبا، هل عندكم موعد بكرة؟' },
  { from: 'bot',  text: 'أهلاً! نعم لدينا مواعيد 😊\nأي خدمة تودين؟\n• قص شعر\n• صبغة\n• كيراتين' },
  { from: 'user', text: 'صبغة' },
  { from: 'bot',  text: 'المواعيد المتاحة غداً:\n🕙 10:00 ص\n🕓 4:00 م\nأيهم يناسبك؟' },
  { from: 'user', text: '4 العصر' },
  { from: 'bot',  text: '✅ تم الحجز!\nغداً 4:00 عصراً\nصبغة شعر 💇‍♀️\nسنذكرك قبل ساعة 🌸' },
];

const MESSAGES_EN = [
  { from: 'user', text: 'Hi! Any appointments available tomorrow?' },
  { from: 'bot',  text: 'Hello! Yes, we have slots 😊\nWhich service would you like?\n• Haircut\n• Hair Color\n• Keratin' },
  { from: 'user', text: 'Hair Color' },
  { from: 'bot',  text: "Available slots tomorrow:\n🕙 10:00 AM\n🕓 4:00 PM\nWhich works for you?" },
  { from: 'user', text: '4:00 PM please' },
  { from: 'bot',  text: "✅ Booked!\nTomorrow at 4:00 PM\nHair Color 💇‍♀️\nWe'll remind you 1 hour before 🌸" },
];

export default function AnimatedChat({ minHeight = 300 }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const messages = isAr ? MESSAGES_AR : MESSAGES_EN;

  const [visible, setVisible] = useState([]);
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;

    async function run() {
      while (!cancelRef.current) {
        setVisible([]);
        setTyping(false);
        await sleep(600);

        for (let i = 0; i < messages.length; i++) {
          if (cancelRef.current) return;

          if (messages[i].from === 'bot') {
            setTyping(true);
            await sleep(1300);
            if (cancelRef.current) return;
            setTyping(false);
          }

          setVisible(v => [...v, i]);

          // Auto-scroll chat body
          if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
          }

          await sleep(messages[i].from === 'bot' ? 900 : 700);
        }

        await sleep(4000);
      }
    }

    run();
    return () => { cancelRef.current = true; };
  }, [isAr]);

  return (
    <div className="ln-chat-wrap">
      <div className="ln-chat-header">
        <div className="ln-chat-avatar">💅</div>
        <div>
          <div className="ln-chat-name">{isAr ? 'لين 🤖' : 'Lina 🤖'}</div>
          <div className="ln-chat-status">{isAr ? 'متصلة الآن' : 'Online now'}</div>
        </div>
      </div>

      <div className="ln-chat-body" ref={bodyRef} style={{ minHeight }}>
        {messages.map((msg, i) =>
          visible.includes(i) ? (
            <div key={i} className={`ln-chat-msg ${msg.from}`}>{msg.text}</div>
          ) : null
        )}
        {typing && (
          <div className="ln-typing-indicator">
            <div className="ln-typing-dot" />
            <div className="ln-typing-dot" />
            <div className="ln-typing-dot" />
          </div>
        )}
      </div>
    </div>
  );
}
