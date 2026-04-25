import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/stats';

export function useDashboardStats(userId) {
  const [stats, setStats]   = useState({ messagesToday: 0, bookingsToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getDashboardStats(userId)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return { stats, loading };
}
