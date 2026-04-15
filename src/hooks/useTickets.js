import { useState, useEffect, useCallback } from 'react';
import { getTickets, updateTicketStatus } from '../services/tickets';

export function useTickets(userId) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTickets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getTickets(userId);
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const updateStatus = async (id, status) => {
    try {
      const updated = await updateTicketStatus(id, status);
      setTickets(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    updateStatus,
    refreshTickets: loadTickets
  };
}
