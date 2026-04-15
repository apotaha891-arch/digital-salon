import React from 'react';
import { Calendar, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function BookingRow({ booking, onUpdateStatus }) {
  const statusColors = {
    pending: 'warning',
    confirmed: 'active',
    cancelled: 'error',
    completed: 'success'
  };

  const statusLabels = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    completed: 'مكتمل'
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 12, 
            background: 'var(--surface2)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: 20 
          }}>
            🗓️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{booking.client_name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Phone size={12} /> {booking.client_phone || 'لا يوجد رقم'}
              <span className="dot" />
              <Calendar size={12} /> {booking.appointment_date}
              <span className="dot" />
              <Clock size={12} /> {booking.appointment_time}
            </div>
            <div style={{ marginTop: 8, fontWeight: 500, color: 'var(--primary)', fontSize: 13 }}>
              الخدمة: {booking.service_name}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge variant={statusColors[booking.status]}>
            {statusLabels[booking.status]}
          </Badge>

          {booking.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn-icon" 
                style={{ color: 'var(--success)' }} 
                onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                title="تأكيد"
              >
                <CheckCircle size={20} />
              </button>
              <button 
                className="btn-icon" 
                style={{ color: 'var(--error)' }} 
                onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                title="إلغاء"
              >
                <XCircle size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
