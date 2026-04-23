import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../hooks/useCustomers';
import { Users, Trash2, Send, MessageCircle, Camera, MessageSquare, Search } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { useCustomerChat } from '../hooks/useCustomerChat';

const PLATFORM_META = {
  whatsapp:  { icon: MessageCircle, color: '#25D366', gradient: 'linear-gradient(135deg, #25D366, #128C7E)', label: 'WhatsApp' },
  instagram: { icon: Camera,        color: '#E1306C', gradient: 'linear-gradient(135deg, #E1306C, #F77737)', label: 'Instagram' },
  facebook:  { icon: MessageCircle, color: '#0084FF', gradient: 'linear-gradient(135deg, #0084FF, #00C6FF)', label: 'Messenger' },
  messenger: { icon: MessageCircle, color: '#0084FF', gradient: 'linear-gradient(135deg, #0084FF, #00C6FF)', label: 'Messenger' },
  telegram:  { icon: Send,          color: '#0088cc', gradient: 'linear-gradient(135deg, #0088cc, #00b4d8)', label: 'Telegram' },
};

export default function Customers() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { customers, loading, removeCustomer } = useCustomers(user?.id);
  
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { messages, loading: chatLoading, loadChat, clearChat } = useCustomerChat(user?.id);
  const chatEndRef = React.useRef(null);

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) return <Spinner centered />;

  const handleViewChat = (customer) => {
    setSelectedCustomer(customer);
    loadChat(customer.external_id, customer.platform);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذه العميلة؟' : 'Delete this customer?')) {
      try {
        await removeCustomer(id);
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
          clearChat();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (c.full_name || '').toLowerCase().includes(q) || 
           (c.external_id || '').toLowerCase().includes(q) ||
           (c.phone || '').includes(q);
  });

  const getPlatform = (p) => PLATFORM_META[p] || PLATFORM_META.telegram;

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 className="page-title">{t('customers.title')}</h1>
        <p className="page-subtitle">{t('customers.subtitle')}</p>
      </div>

      {customers.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', flex: 1 }}>
          <div style={{ 
            background: 'var(--surface2)', width: 80, height: 80, borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px auto', color: 'var(--text-muted)'
          }}>
            <Users size={40} />
          </div>
          <h3 style={{ fontWeight: 900, marginBottom: 8 }}>{t('customers.empty.title')}</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
            {t('customers.empty.description')}
          </p>
        </div>
      ) : (
        /* ═══ SPLIT VIEW: Customer List + Phone Chat ═══ */
        <div style={{ 
          display: 'flex', gap: 20, flex: 1, minHeight: 0,
          flexDirection: i18n.dir() === 'rtl' ? 'row-reverse' : 'row'
        }}>

          {/* ──── LEFT: Customer List ──── */}
          <div style={{ 
            width: selectedCustomer ? 340 : '100%',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex', flexDirection: 'column',
            background: 'var(--surface)', borderRadius: 20,
            border: '1px solid var(--border)', overflow: 'hidden',
            flexShrink: 0
          }}>
            {/* Search Bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface2)', borderRadius: 12, padding: '8px 12px',
                border: '1px solid var(--border)'
              }}>
                <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={i18n.language === 'ar' ? 'بحث عن عميلة...' : 'Search customers...'}
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    color: 'var(--text)', fontSize: 13, width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, padding: '0 4px' }}>
                {filteredCustomers.length} {i18n.language === 'ar' ? 'عميلة' : 'customers'}
              </div>
            </div>

            {/* Customer List — Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredCustomers.map(customer => {
                const pm = getPlatform(customer.platform);
                const PIcon = pm.icon;
                const isSelected = selectedCustomer?.id === customer.id;

                return (
                  <div
                    key={customer.id}
                    onClick={() => handleViewChat(customer)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? 'rgba(217,70,239,0.08)' : 'transparent',
                      borderInlineStart: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: pm.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 900, fontSize: 15,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                      {customer.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 700, fontSize: 14, 
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: isSelected ? 'var(--primary)' : 'var(--text)'
                      }}>
                        {customer.full_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PIcon size={10} style={{ color: pm.color }} />
                        {pm.label}
                        <span style={{ margin: '0 2px' }}>•</span>
                        {new Date(customer.updated_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(customer.id, e)}
                      style={{ 
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 4, opacity: 0.4, transition: 'opacity 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                      title={i18n.language === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──── RIGHT: Phone Chat Panel (Inline) ──── */}
          {selectedCustomer && (
            <div style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 0, animation: 'fadeIn 0.25s ease-out'
            }}>
              <div style={{
                width: '100%', maxWidth: 400, height: '100%', maxHeight: 720,
                borderRadius: 40, background: '#1a1a2e',
                border: '3px solid #333',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', position: 'relative'
              }}>
                {/* Dynamic Island */}
                <div style={{ 
                  position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                  width: 120, height: 28, borderRadius: 20,
                  background: '#000', zIndex: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1a2e', border: '1.5px solid #333' }} />
                </div>

                {/* Status Bar */}
                <div style={{ 
                  padding: '12px 28px 0', display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                  height: 44, alignItems: 'center', flexShrink: 0
                }}>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 9 }}>●●●●</span>
                    <span style={{ fontSize: 9 }}>📶</span>
                    <span style={{ fontSize: 10 }}>🔋</span>
                  </span>
                </div>

                {/* Chat Header */}
                <div style={{ 
                  padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', flexShrink: 0
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: getPlatform(selectedCustomer.platform).gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: 14,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCustomer.full_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {(() => { const P = getPlatform(selectedCustomer.platform).icon; return <P size={9} />; })()}
                      {getPlatform(selectedCustomer.platform).label}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ 
                  flex: 1, overflowY: 'auto', padding: '14px 14px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  background: 'linear-gradient(180deg, #0f0a1e 0%, #1a0f2e 100%)'
                }}>
                  {chatLoading ? (
                    <Spinner centered />
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 60, opacity: 0.4, color: 'white' }}>
                      <MessageSquare size={36} style={{ margin: '0 auto 12px auto', display: 'block' }} />
                      <p style={{ fontSize: 12 }}>{t('customers.no_messages') || 'No messages yet.'}</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isAI = m.role === 'assistant';
                      const showTime = idx === 0 || 
                        new Date(m.created_at).getHours() !== new Date(messages[idx - 1].created_at).getHours();
                      
                      return (
                        <React.Fragment key={m.id || idx}>
                          {showTime && (
                            <div style={{ 
                              textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.25)',
                              margin: '6px 0 2px', fontWeight: 600
                            }}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          <div style={{ 
                            alignSelf: isAI ? 'flex-start' : 'flex-end',
                            maxWidth: '82%'
                          }}>
                            <div style={{ 
                              background: isAI 
                                ? 'rgba(255,255,255,0.07)' 
                                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              color: 'white',
                              padding: '9px 13px',
                              borderRadius: isAI ? '4px 16px 16px 16px' : '16px 16px 4px 16px',
                              fontSize: 13, lineHeight: 1.55,
                              boxShadow: isAI ? 'none' : '0 2px 10px rgba(217,70,239,0.2)',
                              wordBreak: 'break-word'
                            }}>
                              {m.content}
                            </div>
                            {!showTime && (
                              <div style={{ 
                                fontSize: 8, color: 'rgba(255,255,255,0.18)',
                                marginTop: 1, textAlign: isAI ? 'left' : 'right' 
                              }}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Bar */}
                <div style={{ 
                  padding: '10px 18px 16px', 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)', flexShrink: 0
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 20,
                    padding: '8px 14px', textAlign: 'center'
                  }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                      🔒 {i18n.language === 'ar' ? 'وضع القراءة فقط' : 'Read-only mode'}
                    </span>
                  </div>
                  <div style={{ 
                    width: 120, height: 4, borderRadius: 2, 
                    background: 'rgba(255,255,255,0.15)', 
                    margin: '10px auto 0' 
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Empty State when no customer is selected */}
          {!selectedCustomer && customers.length > 0 && (
            <div style={{ 
              flex: 1, display: 'none'
            }} />
          )}
        </div>
      )}
    </div>
  );
}
