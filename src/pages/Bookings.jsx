import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { Calendar } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import BookingRow from '../components/bookings/BookingRow';

export default function Bookings() {
  const { user } = useAuth();
  const { 
    bookings, 
    loading, 
    updateStatus, 
    filters, 
    setFilters 
  } = useBookings(user?.id);

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">إدارة الحجوزات</h1>
          <p className="page-subtitle">تابعي مواعيد عميلاتك وأكدي الحجوزات الجديدة</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-input" 
            style={{ width: 140 }}
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكدة</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 160 }}
            value={filters.date || ''}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {bookings.length > 0 ? (
          bookings.map(booking => (
            <BookingRow 
              key={booking.id} 
              booking={booking} 
              onUpdateStatus={updateStatus} 
            />
          ))
        ) : (
          <EmptyState 
            icon={Calendar}
            title="لا توجد حجوزات حالياً"
            description="عندما تقوم الموظفة الرقمية بتسجيل حجوزات جديدة ستظهر لك هنا فوراً."
          />
        )}
      </div>
    </div>
  );
}
