// Keyword → reply map (case-insensitive, Arabic + English)
const RULES = [
  {
    keywords: ['price', 'prices', 'cost', 'سعر', 'أسعار', 'كم', 'بكام'],
    reply: 'أهلاً! لمعرفة أسعارنا يرجى التواصل معنا على الرقم المباشر أو زيارة صفحتنا. 😊',
  },
  {
    keywords: ['book', 'appointment', 'reserve', 'حجز', 'موعد', 'احجز'],
    reply: 'رائع! 🌟 يسعدنا حجز موعدك\nلدينا هذه الخدمات:\n💇‍♀️ قص شعر\n🎨 صبغة\n✨ كيراتين\nأيهم تودين؟',
  },
  {
    keywords: ['hi', 'hello', 'hey', 'مرحبا', 'هلا', 'السلام', 'اهلا', 'أهلاً'],
    reply: 'أهلاً وسهلاً! 😊 يسعدنا خدمتك\nقبل كل شيء، ما اسمك الكريم؟ 🌸',
  },
  {
    keywords: ['service', 'services', 'خدمة', 'خدمات', 'ايش عندكم', 'ايش عندكم'],
    reply: 'نقدم خدمات متنوعة شاملة العناية بالبشرة، الشعر، والمكياج. تواصلي معنا لمزيد من التفاصيل!',
  },
  {
    keywords: ['time', 'hours', 'open', 'close', 'وقت', 'دوام', 'ساعات'],
    reply: 'دوامنا من 10 صباحاً حتى 9 مساءً طوال أيام الأسبوع. 🕙',
  },
  {
    keywords: ['location', 'address', 'where', 'عنوان', 'موقع', 'فين'],
    reply: 'موقعنا: [أضف العنوان هنا]. يمكنك إيجادنا على خرائط جوجل على الرابط: [أضف رابط الخريطة].',
  },
  {
    keywords: ['cancel', 'cancellation', 'إلغاء', 'الغاء'],
    reply: 'لإلغاء موعدك يرجى التواصل معنا على الأقل قبل 3 ساعات من الموعد المحدد.',
  },
  {
    keywords: ['thank', 'thanks', 'شكرا', 'شكراً', 'مشكورة'],
    reply: 'العفو! سعداء دائماً بخدمتك. 💕',
  },
]

const DEFAULT_REPLY = 'شكراً لتواصلك معنا! سيرد عليكِ أحد فريقنا في أقرب وقت ممكن. 🌸'

/**
 * Returns an auto-reply based on keyword matching.
 * @param {string} channel  - 'facebook' | 'instagram' | 'whatsapp'
 * @param {string} message  - Incoming message text
 * @returns {string}
 */
export function getAutoReply(channel, message) {
  const lower = message.toLowerCase().trim()

  for (const rule of RULES) {
    const matched = rule.keywords.some(kw => lower.includes(kw.toLowerCase()))
    if (matched) {
      console.log(`[AUTO-REPLY][${channel.toUpperCase()}] Rule matched for: "${message}"`)
      return rule.reply
    }
  }

  console.log(`[AUTO-REPLY][${channel.toUpperCase()}] No rule matched, using default.`)
  return DEFAULT_REPLY
}
