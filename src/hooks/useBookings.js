import { useState, useEffect, useCallback } from 'react';
import { getBookings, updateBookingStatus, createBooking } from '../services/bookings';

export function useBookings(userId, initialFilters = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const loadBookings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getBookings(userId, filters);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const updateStatus = async (id, status) => {
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addBooking = async (details) => {
    try {
      const newBookingId = await createBooking(userId, details);
      loadBookings(); // Refresh list
      return newBookingId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    bookings,
    loading,
    error,
    filters,
    setFilters,
    updateStatus,
    addBooking,
    refreshBookings: loadBookings
  };
}
