import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

/* ─── Palette ──────────────────────────────────── */
const ACCENTS = {
  fuchsia: { primary: '#D946EF', secondary: '#9333EA', rgb: '217,70,239' },
  rose:    { primary: '#E11D48', secondary: '#BE123C', rgb: '225,29,72'  },
  violet:  { primary: '#7C3AED', secondary: '#5B21B6', rgb: '124,58,237' },
  emerald: { primary: '#059669', secondary: '#065F46', rgb: '5,150,105'  },
  amber:   { primary: '#D97706', secondary: '#92400E', rgb: '217,119,6'  },
  sky:     { primary: '#0284C7', secondary: '#0C4A6E', rgb: '2,132,199'  },
};

function getTokens(mode, accent) {
  const a = ACCENTS[accent] || ACCENTS.fuchsia;
  if (mode === 'light') return {
    bg: '#F0EBF8', surface: '#FFFFFF', surface2: '#E8DEFA',
    border: `rgba(${a.rgb},0.2)`, borderStrong: `rgba(${a.rgb},0.45)`,
    text: '#1A0F2E', muted: 'rgba(26,15,46,0.52)',
    cardBg: 'rgba(255,255,255,0.85)', navBg: 'rgba(240,235,248,0.82)',
    chatBg: '#F0EBF8', chatSurface: '#FFFFFF',
    ...a,
  };
  return {
    bg: '#0C0818', surface: '#150E28', surface2: '#1F1438',
    border: `rgba(${a.rgb},0.16)`, borderStrong: `rgba(${a.rgb},0.48)`,
    text: '#F5F0FF', muted: 'rgba(245,240,255,0.48)',
    cardBg: 'rgba(255,255,255,0.04)', navBg: 'rgba(12,8,24,0.8)',
    chatBg: '#0C0818', chatSurface: '#150E28',
    ...a,
  };
}

/* ─── Social link builder ──────────────────────── */
const SOCIALS_META = {
  instagram: { label: 'Instagram', icon: InstagramIcon, buildUrl: v => `https://instagram.com/${v.replace('@','')}` },
  snapchat:  { label: 'Snapchat',  icon: SnapchatIcon,  buildUrl: v => `https://snapchat.com/add/${v.replace('@','')}` },
  tiktok:    { label: 'TikTok',    icon: TikTokIcon,    buildUrl: v => `https://tiktok.com/@${v.replace('@','')}` },
  twitter:   { label: 'X',         icon: TwitterIcon,   buildUrl: v => `https://x.com/${v.replace('@','')}` },
  whatsapp:  { label: 'WhatsApp',  icon: WhatsAppIcon,  buildUrl: v => `https://wa.me/${v.replace(/\D/g,'')}` },
  facebook:  { label: 'Facebook',  icon: FacebookIcon,  buildUrl: v => v.startsWith('http') ? v : `https://facebook.com/${v}` },
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/* ═══════════════════════════════════════════════ */
export default function SalonPublicPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [chatOpen, setChatOpen]           = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [lang, setLang]                   = useState(() => navigator.language?.startsWith('ar') ? 'ar' : 'en');
  const isAr = lang === 'ar';

  useEffect(() => {
    supabase.from('businesses').select('*').eq('id', businessId).maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setBusiness(data);
        setLoading(false);
      });
  }, [businessId]);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 60);
      const sections = ['contact', 'services', 'hero'];
      for (const id of sections) {
        const el = document.getElementById(`sec-${id}`);
        if (el && el.getBoundingClientRect().top <= 120) { setActiveSection(id); break; }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  if (loading)  return <LoadingScreen />;
  if (notFound) return <NotFoundScreen />;

  const page     = business?.metadata?.page || {};
  const mode     = page.template || 'dark';
  const accent   = page.theme    || 'fuchsia';
  const t        = getTokens(mode, accent);
  const isLight  = mode === 'light';
  const rgb      = (ACCENTS[accent] || ACCENTS.fuchsia).rgb;
  const services = business?.services || [];
  const socials  = page.socials || {};
  const bookHref = page.booking_link
    || (business?.phone ? `https://wa.me/${business.phone.replace(/\D/g,'')}` : null);

  const activeSocials = Object.entries(socials).filter(([, v]) => v?.trim());

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Tajawal', sans-serif; background: ${t.bg}; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.primary}; border-radius: 4px; }

    @keyframes up    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
    @keyframes glow  { 0%,100%{opacity:.55;transform:scale(1);} 50%{opacity:1;transform:scale(1.08);} }
    @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
    @keyframes shimmer { 0%{background-position:200% center;} 100%{background-position:-200% center;} }
    @keyframes popIn { from{opacity:0;transform:scale(.85) translateY(20px);} to{opacity:1;transform:scale(1) translateY(0);} }
    @keyframes spin  { to { transform:rotate(360deg); } }
    @keyframes msgIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }

    .pa  { animation: up .6s cubic-bezier(.16,1,.3,1) both; }
    .d1{animation-delay:.05s;} .d2{animation-delay:.18s;} .d3{animation-delay:.32s;} .d4{animation-delay:.46s;} .d5{animation-delay:.60s;}
    .float { animation: float 4s ease-in-out infinite; }
    .grad-text {
      background: linear-gradient(135deg,${t.primary},${t.secondary},${t.primary});
      background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      background-clip:text; animation: shimmer 4s linear infinite;
    }

    .book-btn {
      display:inline-flex; align-items:center; gap:10px;
      padding:17px 44px; border-radius:50px; text-decoration:none; border:none; cursor:pointer;
      background:linear-gradient(135deg,${t.primary},${t.secondary});
      color:#fff; font-weight:900; font-size:17px; font-family:'Tajawal',sans-serif;
      box-shadow:0 10px 36px rgba(${rgb},.5); transition:transform .22s,box-shadow .22s; letter-spacing:.3px;
    }
    .book-btn:hover { transform:translateY(-4px) scale(1.03); box-shadow:0 20px 50px rgba(${rgb},.65); }

    .book-btn-sm {
      display:inline-flex; align-items:center; gap:7px; padding:10px 24px; border-radius:50px;
      text-decoration:none; border:none; cursor:pointer;
      background:linear-gradient(135deg,${t.primary},${t.secondary});
      color:#fff; font-weight:800; font-size:14px; font-family:'Tajawal',sans-serif;
      transition:transform .2s,box-shadow .2s; box-shadow:0 4px 16px rgba(${rgb},.4);
    }
    .book-btn-sm:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(${rgb},.55); }

    .svc-card {
      display:flex; justify-content:space-between; align-items:center;
      padding:20px 24px; border-radius:16px;
      background:${t.cardBg}; border:1px solid ${t.border};
      backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
      transition:border-color .22s,transform .22s,box-shadow .22s;
    }
    .svc-card:hover { border-color:${t.borderStrong}; transform:translateY(-2px); box-shadow:0 8px 28px rgba(${rgb},.14); }

    .contact-link {
      display:flex; align-items:center; gap:16px; padding:18px 22px; border-radius:18px;
      text-decoration:none; background:${t.cardBg}; border:1px solid ${t.border};
      backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); color:${t.text};
      transition:border-color .22s,transform .22s,box-shadow .22s;
    }
    .contact-link:hover { border-color:${t.borderStrong}; transform:translateY(-2px); box-shadow:0 8px 24px rgba(${rgb},.14); }

    .social-btn {
      width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center;
      text-decoration:none; background:${t.cardBg}; border:1px solid ${t.border};
      backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
      transition:border-color .2s,transform .2s,box-shadow .2s;
    }
    .social-btn:hover { border-color:${t.borderStrong}; transform:translateY(-3px); box-shadow:0 6px 20px rgba(${rgb},.25); }

    .sec-pill {
      display:inline-flex; align-items:center; gap:6px;
      padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700;
      text-transform:uppercase; letter-spacing:1.2px;
      color:${t.primary}; background:rgba(${rgb},.1); border:1px solid rgba(${rgb},.22); margin-bottom:16px;
    }
    .divider { height:1px; background:linear-gradient(to right,transparent,rgba(${rgb},.35),transparent); margin:64px 0; }

    /* Chat */
    .chat-panel {
      position:fixed; bottom:88px; right:24px; z-index:200;
      width:340px; max-height:520px;
      border-radius:24px; overflow:hidden; display:flex; flex-direction:column;
      background:${t.chatBg}; border:1px solid ${t.borderStrong};
      box-shadow:0 24px 60px rgba(0,0,0,.35), 0 0 0 1px rgba(${rgb},.08);
      animation: popIn .3s cubic-bezier(.16,1,.3,1) both;
    }
    .chat-msg { animation: msgIn .25s ease both; }
    .chat-input {
      width:100%; border:none; outline:none; resize:none;
      background:transparent; font-family:'Tajawal',sans-serif;
      font-size:14px; color:${t.text}; line-height:1.5;
    }
    .chat-input::placeholder { color:${t.muted}; }
    .nav-tab {
      display:inline-flex; align-items:center; gap:6px;
      padding:7px 16px; border-radius:20px; cursor:pointer; border:none;
      font-family:'Tajawal',sans-serif; font-size:13px; font-weight:700;
      background:transparent; color:${t.muted};
      transition:color .2s,background .2s;
      text-decoration:none;
    }
    .nav-tab:hover { color:${t.text}; background:rgba(${rgb},.1); }
    .nav-tab.active { color:${t.primary}; background:rgba(${rgb},.12); }
    @media (max-width:600px) {
      .nav-tab span.nav-label { display:none; }
      .nav-tab { padding:7px 10px; }
    }
    @media (max-width:480px) {
      .chat-panel { right:12px; left:12px; width:auto; bottom:80px; }
    }
  `;

  const L = {
    bookNow:      isAr ? 'احجزي موعدك الآن'          : 'Book Now',
    bookNowNav:   isAr ? 'احجزي الآن'                : 'Book Now',
    services:     isAr ? 'الخدمات'                   : 'Services',
    contact:      isAr ? 'تواصلي'                    : 'Contact',
    discoverSvc:  isAr ? 'اكتشفي خدماتنا'            : 'Explore our services',
    ourServices:  isAr ? '✂️ خدماتنا · Services'    : '✂️ Services · خدماتنا',
    chooseExp:    isAr ? 'اختاري'                    : 'Choose',
    yourExp:      isAr ? 'تجربتك'                    : 'your experience',
    minutes:      isAr ? 'دقيقة'                     : 'min',
    sar:          isAr ? 'ر.س'                       : 'SAR',
    bookSection:  isAr ? 'احجزي موعدك الآن'          : 'Book Your Appointment',
    bookSub:      isAr ? 'اختاري الوقت المناسب لك واستمتعي بتجربة لا تُنسى' : 'Choose a time that works for you and enjoy an unforgettable experience',
    bookCta:      isAr ? 'احجزي الآن · Book Now'    : 'Book Now · احجزي الآن',
    followUs:     isAr ? '🔗 تابعينا · Follow Us'   : '🔗 Follow Us · تابعينا',
    poweredBy:    isAr ? 'مدعوم من'                  : 'Powered by',
    salon:        isAr ? 'صالون'                     : 'Salon',
    moreServices: (n) => isAr ? `+${n} خدمات أخرى` : `+${n} more`,
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight:'100vh', background:t.bg, fontFamily:"'Tajawal',sans-serif", color:t.text, overflowX:'hidden' }}>
      <style>{CSS}</style>

      {/* ── Floating Nav ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between',
        background: scrolled ? t.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${t.border}` : '1px solid transparent',
        transition:'all .3s ease',
      }}>
        {/* Brand */}
        <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0 }}>
          {page.logo_url
            ? <img src={page.logo_url} alt="logo" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:`2px solid rgba(${rgb},.5)` }} />
            : <span style={{ fontSize:24, filter:`drop-shadow(0 0 10px rgba(${rgb},.6))` }}>💅</span>}
          <span style={{ fontWeight:900, fontSize:15, color:t.text }}>{business?.name || L.salon}</span>
        </button>

        {/* Center tabs */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {services.length > 0 && (
            <a href="#sec-services" onClick={e=>{e.preventDefault();document.getElementById('sec-services')?.scrollIntoView({behavior:'smooth'})}}
              className={`nav-tab${activeSection==='services'?' active':''}`}>
              <span>✂️</span><span className="nav-label">{L.services}</span>
            </a>
          )}
          <a href="#sec-contact" onClick={e=>{e.preventDefault();document.getElementById('sec-contact')?.scrollIntoView({behavior:'smooth'})}}
            className={`nav-tab${activeSection==='contact'?' active':''}`}>
            <span>📞</span><span className="nav-label">{L.contact}</span>
          </a>
          {activeSocials.length > 0 && activeSocials.slice(0,2).map(([key, val]) => {
            const m = SOCIALS_META[key]; if (!m) return null;
            const Icon = m.icon;
            return (
              <a key={key} href={m.buildUrl(val)} target="_blank" rel="noreferrer"
                style={{ width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`rgba(${rgb},.1)`, border:`1px solid rgba(${rgb},.18)`, textDecoration:'none', transition:'transform .2s,background .2s', marginInlineStart:4 }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.background=`rgba(${rgb},.2)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.background=`rgba(${rgb},.1)`;}}>
                <Icon size={15} color={t.primary} />
              </a>
            );
          })}
        </div>

        {/* Lang toggle + Book CTA */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            style={{
              padding:'6px 12px', borderRadius:20, border:`1px solid ${t.border}`,
              background:'transparent', color:t.muted, fontSize:12, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.borderStrong;e.currentTarget.style.color=t.text;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.muted;}}
          >
            {isAr ? 'EN' : 'ع'}
          </button>
          {bookHref && (
            <a href={bookHref} target="_blank" rel="noreferrer" className="book-btn-sm">{L.bookNowNav}</a>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {page.hero_url ? (
          <>
            <div style={{ position:'absolute', inset:0, backgroundImage:`url(${page.hero_url})`, backgroundSize:'cover', backgroundPosition:'center' }} />
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top,${t.bg} 0%,rgba(12,8,24,.7) 50%,rgba(12,8,24,.3) 100%)` }} />
          </>
        ) : (
          <>
            <div style={{ position:'absolute', inset:0, background: isLight
              ? `radial-gradient(ellipse at 50% -20%,rgba(${rgb},.18) 0%,transparent 65%),${t.bg}`
              : `radial-gradient(ellipse at 50% -10%,rgba(${rgb},.4) 0%,transparent 60%),${t.bg}` }} />
            {!isLight && <>
              <div style={{ position:'absolute', top:'-100px', left:'50%', transform:'translateX(-50%)', width:700, height:700, borderRadius:'50%', background:`radial-gradient(circle,rgba(${rgb},.28),transparent 68%)`, filter:'blur(70px)', animation:'glow 6s ease-in-out infinite' }} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:500, borderRadius:'50%', border:`1px solid rgba(${rgb},.1)`, pointerEvents:'none' }} />
            </>}
            <div style={{ position:'absolute', top:'20%', right:'-80px', width:320, height:320, borderRadius:'50%', background:`radial-gradient(circle,rgba(${rgb},.2),transparent 70%)`, filter:'blur(55px)', animation:'glow 7s ease-in-out infinite 1s' }} />
            <div style={{ position:'absolute', bottom:'10%', left:'-60px', width:260, height:260, borderRadius:'50%', background:`radial-gradient(circle,rgba(${rgb},.15),transparent 70%)`, filter:'blur(44px)', animation:'glow 5s ease-in-out infinite 2s' }} />
          </>
        )}

        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'120px 28px 80px', maxWidth:680, width:'100%' }}>
          {page.logo_url
            ? <div className="pa d1 float" style={{ width:120, height:120, borderRadius:'50%', margin:'0 auto 32px', border:`3px solid rgba(${rgb},.5)`, overflow:'hidden', boxShadow:`0 0 0 8px rgba(${rgb},.08),0 0 60px rgba(${rgb},.4)` }}>
                <img src={page.logo_url} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            : <div className="pa d1 float" style={{ marginBottom:28, display:'flex', justifyContent:'center' }}>
                <img src="/assets/logo_white.png" alt="Digital Salon" style={{ height:100, width:'auto', objectFit:'contain', filter:`drop-shadow(0 0 32px rgba(${rgb},.75))` }} />
              </div>}

          <h1 className="pa d2" style={{ fontWeight:900, fontSize:'clamp(36px,8vw,68px)', lineHeight:1.05, marginBottom:18, color: page.hero_url ? '#fff' : (isLight ? t.text : '#F5F0FF'), textShadow: page.hero_url ? '0 4px 20px rgba(0,0,0,.5)' : `0 0 60px rgba(${rgb},.35)`, letterSpacing:'-1px' }}>
            {business?.name || L.salon}
          </h1>

          {page.tagline && (
            <p className="pa d3" style={{ fontSize:'clamp(15px,3vw,20px)', fontWeight:400, color: page.hero_url ? 'rgba(255,255,255,.82)' : t.muted, marginBottom:40, lineHeight:1.7, maxWidth:480, margin:'0 auto 40px' }}>
              {page.tagline}
            </p>
          )}

          {page.show_booking_btn !== false && bookHref && (
            <div className="pa d4" style={{ marginTop: page.tagline ? 0 : 32 }}>
              <a href={bookHref} target="_blank" rel="noreferrer" className="book-btn">
                <span>📅</span><span>{L.bookNow}</span>
              </a>
            </div>
          )}

          {/* Social Icons in Hero */}
          {activeSocials.length > 0 && (
            <div className="pa d5" style={{ display:'flex', justifyContent:'center', gap:12, marginTop:36 }}>
              {activeSocials.map(([key, val]) => {
                const m = SOCIALS_META[key]; if (!m) return null;
                const Icon = m.icon;
                return (
                  <a key={key} href={m.buildUrl(val)} target="_blank" rel="noreferrer" className="social-btn"
                    title={m.label} style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)' }}>
                    <Icon size={20} color="#fff" />
                  </a>
                );
              })}
            </div>
          )}

          {services.length > 0 && (
            <div className="pa d5" style={{ marginTop:activeSocials.length ? 40 : 56, color:t.muted, fontSize:13, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <div style={{ width:1, height:40, background:`linear-gradient(to bottom,rgba(${rgb},.5),transparent)` }} />
              <span>{L.discoverSvc}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 24px 120px' }}>

        {page.description && (
          <div className="pa" style={{ padding:'32px 36px', borderRadius:24, background:t.cardBg, border:`1px solid ${t.border}`, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', fontSize:17, lineHeight:2, color:t.muted, textAlign:'center', marginBottom:16, boxShadow:`0 4px 40px rgba(${rgb},.06)` }}>
            {page.description}
          </div>
        )}

        {/* Services */}
        {page.show_services !== false && services.length > 0 && (
          <div id="sec-services" style={{ marginTop:72 }}>
            <div style={{ textAlign:'center', marginBottom:40 }}>
              <div className="sec-pill">{L.ourServices}</div>
              <h2 style={{ fontWeight:900, fontSize:'clamp(26px,5vw,38px)', color:t.text, lineHeight:1.2 }}>
                {L.chooseExp} <span className="grad-text">{L.yourExp}</span>
              </h2>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {services.map((s, i) => (
                <div key={i} className="svc-card">
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ width:46, height:46, borderRadius:14, flexShrink:0, background:`rgba(${rgb},.12)`, border:`1px solid rgba(${rgb},.22)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>✨</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:16, color:t.text }}>{s.name}</div>
                      {s.duration > 0 && <div style={{ fontSize:12, color:t.muted, marginTop:3 }}>⏱ {s.duration} {L.minutes}</div>}
                    </div>
                  </div>
                  {s.price > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 20px', borderRadius:14, background:`rgba(${rgb},.1)`, border:`1px solid rgba(${rgb},.22)`, minWidth:80 }}>
                      <span style={{ fontWeight:900, fontSize:18, color:t.primary }}>{s.price}</span>
                      <span style={{ fontSize:11, color:t.muted, fontWeight:600 }}>{L.sar}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="divider" />

        {/* CTA */}
        {page.show_booking_btn !== false && bookHref && (
          <div style={{ borderRadius:28, overflow:'hidden', position:'relative', padding:'56px 36px', textAlign:'center', background: isLight ? `linear-gradient(135deg,rgba(${rgb},.07),rgba(${rgb},.03))` : `linear-gradient(135deg,rgba(${rgb},.16) 0%,rgba(${rgb},.06) 100%)`, border:`1px solid ${t.borderStrong}`, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)' }}>
            {!isLight && <div style={{ position:'absolute', top:'-50px', left:'50%', transform:'translateX(-50%)', width:300, height:200, borderRadius:'50%', background:`radial-gradient(circle,rgba(${rgb},.25),transparent 70%)`, filter:'blur(40px)', pointerEvents:'none' }} />}
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ fontSize:52, marginBottom:20, filter:`drop-shadow(0 0 20px rgba(${rgb},.6))` }}>📅</div>
              <h3 style={{ fontWeight:900, fontSize:'clamp(24px,5vw,36px)', color:t.text, marginBottom:12 }}>{L.bookSection}</h3>
              <p style={{ color:t.muted, marginBottom:32, fontSize:15, lineHeight:1.7 }}>{L.bookSub}</p>
              <a href={bookHref} target="_blank" rel="noreferrer" className="book-btn">
                <span>{L.bookCta}</span>
              </a>
            </div>
          </div>
        )}

        {/* Contact */}
        {page.show_contact !== false && <div id="sec-contact"><ContactBlock business={business} t={t} rgb={rgb} isAr={isAr} /></div>}

        {/* Social Media Section */}
        {activeSocials.length > 0 && (
          <div style={{ marginTop:56, textAlign:'center' }}>
            <div className="sec-pill">{L.followUs}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:14, flexWrap:'wrap', marginTop:24 }}>
              {activeSocials.map(([key, val]) => {
                const m = SOCIALS_META[key]; if (!m) return null;
                const Icon = m.icon;
                return (
                  <a key={key} href={m.buildUrl(val)} target="_blank" rel="noreferrer"
                    className="social-btn" title={m.label}
                    style={{ width:56, height:56, borderRadius:16 }}>
                    <Icon size={24} color={t.primary} />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${t.border}`, padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontSize:13, color:t.muted }}>
          {L.poweredBy}{' '}
          <a href="/" style={{ color:t.primary, textDecoration:'none', fontWeight:800 }}>Digital Salon</a>
        </div>
      </div>

      {/* ── Chat Widget ── */}
      {chatOpen && (
        <ChatWidget
          businessId={businessId}
          t={t}
          rgb={rgb}
          isLight={isLight}
          isAr={isAr}
          onClose={() => setChatOpen(false)}
          businessName={business?.name}
          businessPhone={business?.phone}
        />
      )}

      {/* Chat FAB */}
      <button
        onClick={() => setChatOpen(p => !p)}
        style={{
          position:'fixed', bottom:24, right:24, zIndex:300,
          width:58, height:58, borderRadius:'50%', border:'none', cursor:'pointer',
          background:`linear-gradient(135deg,${t.primary},${t.secondary})`,
          boxShadow:`0 8px 28px rgba(${rgb},.55)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:26, transition:'transform .22s,box-shadow .22s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow=`0 12px 36px rgba(${rgb},.7)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow=`0 8px 28px rgba(${rgb},.55)`; }}
        aria-label="Chat"
      >
        {chatOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Chat Widget                                    */
/* ═══════════════════════════════════════════════ */
function ChatWidget({ businessId, t, rgb, isLight, isAr, onClose, businessName, businessPhone }) {
  const greeting = isAr
    ? `مرحباً بكِ في ${businessName || 'الصالون'} 💅\nكيف يمكنني مساعدتك اليوم؟`
    : `Welcome to ${businessName || 'our salon'} 💅\nHow can I help you today?`;
  const [msgs, setMsgs]     = useState([{ role:'bot', text: greeting }]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [redirect, setRedirect] = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    setMsgs(p => [...p, { role:'user', text }]);
    setTyping(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/salon-chat`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          businessId,
          message: text,
          history: msgs.slice(-10),
        }),
      });
      const data = await res.json();
      if (data.redirect) setRedirect(data.redirect);
      setMsgs(p => [...p, { role:'bot', text: data.reply || 'عذراً، حدث خطأ.' }]);
    } catch {
      setMsgs(p => [...p, { role:'bot', text:'عذراً، حدث خطأ مؤقت. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, msgs, businessId]);

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const cardBg  = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.04)';
  const headerBg = `linear-gradient(135deg,${t.primary},${t.secondary})`;

  return (
    <div className="chat-panel">
      {/* Header */}
      <div style={{ background:headerBg, padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:4 }}>
              <img src="/assets/logo_white.png" alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:'#fff' }}>{businessName}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }} />
              {isAr ? 'متاح الآن' : 'Online now'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:28, height:28, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
        {msgs.map((m, i) => (
          <div key={i} className="chat-msg" style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-start' : 'flex-end' }}>
            <div style={{
              maxWidth:'80%', padding:'10px 14px', borderRadius: m.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role==='user' ? cardBg : `linear-gradient(135deg,${t.primary},${t.secondary})`,
              border: m.role==='user' ? `1px solid ${t.border}` : 'none',
              color: m.role==='user' ? t.text : '#fff',
              fontSize:13, lineHeight:1.6, fontWeight:500,
              whiteSpace:'pre-wrap', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ padding:'12px 16px', borderRadius:'18px 18px 18px 4px', background:`linear-gradient(135deg,${t.primary},${t.secondary})`, display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,.7)', animation:`glow 1.2s ease-in-out infinite ${i*0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {redirect && (
          <div style={{ textAlign:'center', marginTop:4 }}>
            <a href={redirect} target="_blank" rel="noreferrer" style={{
              display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:20,
              background:`rgba(${rgb},.12)`, border:`1px solid rgba(${rgb},.3)`,
              color:t.primary, textDecoration:'none', fontSize:13, fontWeight:700,
            }}>
              💬 التواصل عبر واتساب
            </a>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 14px', borderTop:`1px solid ${t.border}`, background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          dir={isAr ? 'rtl' : 'ltr'}
          placeholder={isAr ? 'اكتبي رسالتك...' : 'Type your message...'}
          style={{ flex:1, maxHeight:80 }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          style={{
            width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:0,
            background: input.trim() && !typing ? `linear-gradient(135deg,${t.primary},${t.secondary})` : t.border,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
            transition:'background .2s', color:'#fff',
          }}>
          ↑
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Contact Block                                  */
/* ═══════════════════════════════════════════════ */
function ContactBlock({ business, t, rgb, isAr }) {
  const items = [
    business?.phone     && { icon:'📞', label:business.phone,     href:`tel:${business.phone}`,      title: isAr ? 'اتصلي بنا' : 'Call Us' },
    business?.instagram && { icon:'📷', label:`@${business.instagram.replace('@','')}`, href:`https://instagram.com/${business.instagram.replace('@','')}`, title:'Instagram' },
    business?.location  && { icon:'📍', label:business.location,  href:null, title: isAr ? 'الموقع' : 'Location' },
    business?.hours     && { icon:'🕐', label:business.hours,     href:null, title: isAr ? 'أوقات العمل' : 'Hours' },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div style={{ marginTop:72 }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.2px', color:t.primary, background:`rgba(${rgb},.1)`, border:`1px solid rgba(${rgb},.22)`, marginBottom:14 }}>
          {isAr ? '💬 تواصلي معنا · Contact' : '💬 Contact Us · تواصلي'}
        </div>
        <h2 style={{ fontWeight:900, fontSize:'clamp(22px,4vw,32px)', color:t.text }}>
          {isAr ? 'نحن هنا لكِ' : 'We are here for you'}
        </h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:14 }}>
        {items.map(({ icon, label, href, title }, i) => {
          const inner = (
            <div className="contact-link" key={i}>
              <div style={{ width:52, height:52, borderRadius:16, flexShrink:0, background:`rgba(${rgb},.12)`, border:`1px solid rgba(${rgb},.24)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
              <div>
                <div style={{ fontSize:11, color:t.muted, fontWeight:600, marginBottom:3 }}>{title}</div>
                <div style={{ fontSize:14, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{label}</div>
              </div>
            </div>
          );
          return href
            ? <a key={i} href={href} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>{inner}</a>
            : <div key={i}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  SVG Social Icons                               */
/* ═══════════════════════════════════════════════ */
function InstagramIcon({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/>
    </svg>
  );
}
function SnapchatIcon({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C8.5 2 6 4.5 6 8v.5c-.5.1-1.5.4-1.5 1s1 .9 1.5 1c-.2.7-.8 2-2 2.5.3.4 1.5.7 2 .8.1.5.3 1 .5 1.3C7 15.7 8 16 9 16c.8 0 1.5-.2 2-.4.2-.1.5-.1.8 0 .5.2 1.2.4 2.2.4 1 0 2-.3 2.5-.9.2-.3.4-.8.5-1.3.5-.1 1.7-.4 2-.8-1.2-.5-1.8-1.8-2-2.5.5-.1 1.5-.4 1.5-1s-1-.9-1.5-1V8c0-3.5-2.5-6-6-6z"/>
    </svg>
  );
}
function TikTokIcon({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.18 8.18 0 004.79 1.53V7.15a4.85 4.85 0 01-1.02-.46z"/>
    </svg>
  );
}
function TwitterIcon({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function WhatsAppIcon({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
function FacebookIcon({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

/* ─── Loading / 404 ──────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0C0818', gap:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@900&display=swap');`}</style>
      <div style={{ fontSize:56, filter:'drop-shadow(0 0 28px rgba(217,70,239,.8))' }}>💅</div>
      <div style={{ width:40, height:40, border:'3px solid rgba(217,70,239,.15)', borderTopColor:'#D946EF', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
    </div>
  );
}
function NotFoundScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0C0818', color:'#F5F0FF', gap:16, textAlign:'center', padding:28, fontFamily:'Tajawal,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;900&display=swap');`}</style>
      <div style={{ fontSize:64, filter:'drop-shadow(0 0 28px rgba(217,70,239,.8))' }}>💅</div>
      <h2 style={{ fontWeight:900, fontSize:30, margin:0 }}>الصفحة غير موجودة</h2>
      <p style={{ color:'rgba(245,240,255,.4)', margin:0, fontSize:15 }}>Page not found</p>
      <a href="/" style={{ marginTop:12, color:'#D946EF', textDecoration:'none', fontWeight:800, fontSize:15 }}>← Digital Salon</a>
    </div>
  );
}
