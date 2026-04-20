import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../hooks/useCustomers';
import { Users, Trash2, Send, MessageCircle, Camera, MessageSquare, X } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { useCustomerChat } from '../hooks/useCustomerChat';

export default function Customers() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { customers, loading, removeCustomer } = useCustomers(user?.id);
  
  // Chat Sidebar State
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const { messages, loading: chatLoading, loadChat, clearChat } = useCustomerChat(user?.id);

  if (loading) return <Spinner centered />;

  const handleViewChat = (customer) => {
    setSelectedCustomer(customer);
    loadChat(customer.external_id, customer.platform);
  };

  const closeChat = () => {
    setSelectedCustomer(null);
    clearChat();
  };

  const handleDelete = async (id) => {
    if (window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذه العميلة؟' : 'Are you sure you want to delete this customer?')) {
      try {
        await removeCustomer(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('customers.title')}</h1>
        <p className="page-subtitle">{t('customers.subtitle')}</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
        {customers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--surface2)', 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px auto',
              color: 'var(--text-muted)'
            }}>
              <Users size={40} />
            </div>
            <h3 style={{ fontWeight: 900, marginBottom: 8 }}>{t('customers.empty.title')}</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px auto' }}>
              {t('customers.empty.description')}
            </p>
            <div style={{ 
              background: 'var(--surface2)', 
              padding: '12px 20px', 
              borderRadius: 12, 
              fontSize: 12, 
              display: 'inline-block',
              border: '1px dashed var(--border)'
            }}>
              <span style={{ opacity: 0.6 }}>Your CRM Connect ID:</span>
              <code style={{ marginLeft: 8, fontWeight: 700, color: 'var(--primary)' }}>{user?.id}</code>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px' }}>{t('customers.table.name')}</th>
                <th style={{ padding: '16px 24px' }}>{t('customers.table.platform')}</th>
                <th style={{ padding: '16px 24px' }}>{t('customers.table.last_visit')}</th>
                <th style={{ padding: '16px 24px' }}>{t('customers.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{customer.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {customer.phone ? (
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{customer.phone}</span>
                      ) : (
                        `ID: ${customer.external_id}`
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {customer.platform === 'telegram' && (
                      <Badge variant="primary" size="sm">
                        <Send size={12} style={{ marginInlineEnd: 4 }} /> Telegram
                      </Badge>
                    )}
                    {customer.platform === 'whatsapp' && (
                      <Badge variant="success" size="sm">
                        <MessageCircle size={12} style={{ marginInlineEnd: 4 }} /> WhatsApp
                      </Badge>
                    )}
                    {customer.platform === 'instagram' && (
                      <Badge variant="custom" size="sm" style={{ backgroundColor: '#E1306C', color: 'white' }}>
                        <Camera size={12} style={{ marginInlineEnd: 4 }} /> Instagram
                      </Badge>
                    )}
                    {customer.platform === 'messenger' && (
                      <Badge variant="custom" size="sm" style={{ backgroundColor: '#0084FF', color: 'white' }}>
                        <MessageCircle size={12} style={{ marginInlineEnd: 4 }} /> Messenger
                      </Badge>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 13 }}>
                      {new Date(customer.updated_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn-icon" 
                        style={{ color: 'var(--primary)' }}
                        onClick={() => handleViewChat(customer)}
                        title={t('customers.view_chat') || 'View Conversation'}
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ color: 'var(--error)' }}
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CHAT SIDE OVER PANEL */}
      {selectedCustomer && (
        <div 
          className="modal-backdrop" 
          onClick={closeChat}
          style={{ justifyContent: i18n.dir() === 'rtl' ? 'flex-start' : 'flex-end', padding: 0 }}
        >
          <div 
            className="glass-card slide-in-right" 
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: 450, 
              height: '100%', 
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '24px 32px', 
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface2)'
            }}>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 18 }}>{selectedCustomer.full_name}</h3>
                <div style={{ fontSize: 12, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedCustomer.platform} • {selectedCustomer.external_id}
                </div>
              </div>
              <button onClick={closeChat} className="btn-icon"><X size={20} /></button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chatLoading ? (
                <Spinner centered />
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 100, opacity: 0.5 }}>
                   <MessageSquare size={48} style={{ margin: '0 auto 16px auto' }} />
                   <p>{t('customers.no_messages') || 'No messages found for this lead.'}</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isAI = m.role === 'assistant';
                  return (
                    <div 
                      key={m.id || idx} 
                      style={{ 
                        alignSelf: isAI ? 'flex-start' : 'flex-end',
                        maxWidth: '85%'
                      }}
                    >
                      <div style={{ 
                        background: isAI ? 'var(--surface2)' : 'var(--primary)',
                        color: isAI ? 'var(--text)' : 'white',
                        padding: '12px 16px',
                        borderRadius: isAI ? '0 16px 16px 16px' : '16px 16px 0 16px',
                        fontSize: 14,
                        lineHeight: 1.5,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        {m.content}
                      </div>
                      <div style={{ 
                        fontSize: 10, 
                        opacity: 0.5, 
                        marginTop: 4, 
                        textAlign: isAI ? 'left' : 'right' 
                      }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer / Notes */}
            <div style={{ padding: 24, borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
               <p style={{ fontSize: 11, opacity: 0.6, textAlign: 'center' }}>
                  {t('customers.review_only') || 'Review only mode. Replies must be sent directly through ManyChat.'}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
