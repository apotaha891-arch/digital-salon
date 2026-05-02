import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import TicketRow from '../components/tickets/TicketRow';

const EMPTY_FORM = { clientName: '', clientPhone: '', subject: '', message: '' };

export default function Tickets() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { tickets, loading, updateStatus, addTicket } = useTickets(user?.id);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const isAr = i18n.language === 'ar';

  const handleAdd = async () => {
    if (!form.clientName || !form.subject) {
      setFormError(isAr ? 'اسم العميل والموضوع مطلوبان' : 'Customer name and subject are required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await addTicket(form);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">

      {/* Add Ticket Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)',
            padding: 32, width: '100%', maxWidth: 480, animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>
                {isAr ? '+ إضافة تذكرة دعم' : '+ Add Support Ticket'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'clientName',  label: isAr ? 'اسم العميل *' : 'Customer Name *', type: 'text', placeholder: isAr ? 'سارة محمد' : 'Sarah Mohammed' },
                { key: 'clientPhone', label: isAr ? 'رقم الهاتف'   : 'Phone Number',    type: 'tel',  placeholder: '05xxxxxxxx' },
                { key: 'subject',     label: isAr ? 'الموضوع *'    : 'Subject *',       type: 'text', placeholder: isAr ? 'مشكلة في الحجز...' : 'Issue with booking...' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  {isAr ? 'تفاصيل الشكوى' : 'Details'}
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  placeholder={isAr ? 'اكتب تفاصيل الشكوى أو الطلب هنا...' : 'Describe the issue or request...'}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
            </div>

            {formError && (
              <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleAdd} disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (isAr ? 'إضافة التذكرة' : 'Add Ticket')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{t('tickets.title')}</h1>
          <p className="page-subtitle">{t('tickets.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <Plus size={16} />
          {isAr ? 'إضافة تذكرة' : 'Add Ticket'}
        </button>
      </div>

      <div>
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onUpdateStatus={updateStatus}
            />
          ))
        ) : (
          <EmptyState
            icon={MessageSquare}
            title={t('tickets.empty.title')}
            description={t('tickets.empty.description')}
          />
        )}
      </div>
    </div>
  );
}
