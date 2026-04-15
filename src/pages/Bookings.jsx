import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBookings, updateBookingStatus } from '../services/supabase';
import { Calendar, User, Phone, Tag, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const data = await getBookings(user.id);
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      await loadBookings();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">الحجوزات المجدولة 📅</h1>
        <p className="page-subtitle">قائمة المواعيد التي قامت موظفتك بتنسيقها</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗓️</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>لا توجد حجوزات بعد</h3>
          <p style={{ color: 'var(--text-muted)' }}>ستظهر العميلات هنا بمجرد أن تبدأ موظفتك في العمل وتلقي الطلبات.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>العميلة</th>
                <th>الخدمة</th>
                <th>الموعد</th>
                <th>القناة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={14} className="text-muted" /> {b.customer_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={12} /> {b.customer_phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={14} style={{ color: 'var(--primary)' }} /> {b.service_requested}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={14} className="text-muted" /> {new Date(b.booking_time).toLocaleDateString('ar-SA')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={12} /> {new Date(b.booking_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.channel === 'whatsapp' ? '💬 واتساب' : b.channel === 'telegram' ? '✈️ تيليجرام' : '🌐 الموقع'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      b.status === 'confirmed' ? 'badge-active' :
                      b.status === 'cancelled' ? 'badge-inactive' : 'badge-warning'
                    }`}>
                      {b.status === 'confirmed' ? 'مؤكد' : b.status === 'cancelled' ? 'ملغي' : 'في الانتظار'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {b.status === 'pending' && (
                        <>
                          <button className="btn btn-sm"
                            style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}
                            onClick={() => handleStatus(b.id, 'confirmed')}>
                            <CheckCircle size={14} /> تأكيد
                          </button>
                          <button className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}
                            onClick={() => handleStatus(b.id, 'cancelled')}>
                            <XCircle size={14} /> إلغاء
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
