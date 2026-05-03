// ============================================================
// SECTOR CONFIGURATION - The White Label Control File
// To customize for a different sector, edit ONLY this file.
// ============================================================

export const SECTOR = {
  id: 'beauty',
  name: 'Digital Salon',
  name_ar: 'الصالون الرقمي',
  tagline: 'منصة إدارة العملاء للصالونات ومراكز السبا',
  tagline_en: 'Customer Management Platform for Salons & Spas',

  // Concierge identity on the landing page
  agent: {
    defaultName: 'لين',
    defaultName_en: 'Lina',
    role_ar: 'مساعدة خدمة العملاء',
    role_en: 'Customer Service Assistant',
    avatar: '💅',
    personality: 'warm, professional, elegant',
  },

  // Business info fields shown in setup
  businessFields: [
    { key: 'name',    label_ar: 'اسم الصالون (عربي)', label_en: 'Salon Name (Arabic)',  type: 'text', required: true,  placeholder_ar: 'مثال: صالون رضوى',    placeholder_en: 'e.g. صالون رضوى' },
    { key: 'name_en', label_ar: 'اسم الصالون (إنجليزي) — للرابط', label_en: 'Salon Name (English) — for your link', type: 'text', required: true, placeholder_ar: 'Radwa Salon', placeholder_en: 'Radwa Salon', hint_ar: 'سيصبح رابطك: digitalsalon.website/radwa-salon', hint_en: 'Your link will be: digitalsalon.website/radwa-salon' },
    { key: 'phone',   label_ar: 'رقم الهاتف',          label_en: 'Phone Number',          type: 'tel',  required: true },
    { key: 'location',label_ar: 'الموقع / العنوان',    label_en: 'Location',              type: 'text', required: true },
    { key: 'hours',   label_ar: 'ساعات العمل',          label_en: 'Working Hours',         type: 'text', placeholder: 'مثال: 9 ص - 9 م' },
    { key: 'instagram',label_ar: 'حساب انستقرام',       label_en: 'Instagram',             type: 'text', placeholder: '@your_salon' },
  ],

  // Default services offered (editable by client)
  defaultServices: [
    'قص الشعر', 'صباغة الشعر', 'مكياج', 'عناية بالبشرة',
    'مناكير وباديكير', 'رموش', 'تصفيف الشعر', 'سبا وتدليك'
  ],

  // Branding
  colors: {
    primary: '#D946EF',
    secondary: '#9333EA',
    accent: '#F0ABFC',
    background: '#0F0A1E',
    surface: '#1A0F2E',
    text: '#FFFFFF',
  },
};
