import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, User, Clock, CheckCircle } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function TicketRow({ ticket, onUpdateStatus }) {
  const { t, i18n } = useTranslation();
  
  const statusColors = {
    open: 'warning',
    in_progress: 'active',
    resolved: 'success'
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: 10, 
            background: 'var(--surface2)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            color: 'var(--primary)' 
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{ticket.subject}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={12} /> {ticket.customer_name}
              <span className="dot" />
              <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5, color: 'var(--text-main)', opacity: 0.9 }}>
              {ticket.message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <Badge variant={statusColors[ticket.status]}>
            {t(`tickets.status.${ticket.status}`)}
          </Badge>

          {ticket.status !== 'resolved' && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onUpdateStatus(ticket.id, 'resolved')}
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              <CheckCircle size={14} style={{ marginLeft: 6, marginRight: 6 }} /> {t('tickets.mark_resolved')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
