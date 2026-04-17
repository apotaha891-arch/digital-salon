import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCustomers } from '../hooks/useCustomers';
import { Users, Trash2, Send, MessageCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

export default function Customers() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { customers, loading, removeCustomer } = useCustomers(user?.id);

  if (loading) return <Spinner centered />;

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
            <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
              {t('customers.empty.description')}
            </p>
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
                    <Badge variant={customer.platform === 'telegram' ? 'primary' : 'success'} size="sm">
                      {customer.platform === 'telegram' ? (
                        <><Send size={12} style={{ marginInlineEnd: 4 }} /> Telegram</>
                      ) : (
                        <><MessageCircle size={12} style={{ marginInlineEnd: 4 }} /> WhatsApp</>
                      )}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 13 }}>
                      {new Date(customer.updated_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button 
                      className="btn-icon" 
                      style={{ color: 'var(--error)' }}
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
