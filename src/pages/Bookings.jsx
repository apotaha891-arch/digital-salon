import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { Calendar } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import BookingRow from '../components/bookings/BookingRow';

export default function Bookings() {
  const { t } = useTranslation();
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
          <h1 className="page-title">{t('bookings.title')}</h1>
          <p className="page-subtitle">{t('bookings.subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-input" 
            style={{ width: 140 }}
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">{t('bookings.status.all')}</option>
            <option value="pending">{t('bookings.status.pending')}</option>
            <option value="confirmed">{t('bookings.status.confirmed')}</option>
            <option value="cancelled">{t('bookings.status.cancelled')}</option>
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
            title={t('bookings.empty.title')}
            description={t('bookings.empty.description')}
          />
        )}
      </div>
    </div>
  );
}
