import { useState, useEffect, useCallback } from 'react';
import { adminGetAllClients, adminAddCredits, adminToggleClient } from '../services/admin';

export function useAdmin() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetAllClients();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const addCredits = async (userId, amount, reason) => {
    try {
      await adminAddCredits(userId, amount, reason);
      loadClients(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleClientStatus = async (userId, isActive) => {
    try {
      await adminToggleClient(userId, isActive);
      setClients(prev => prev.map(c => c.id === userId ? { ...c, is_active: isActive } : c));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    addCredits,
    toggleClientStatus,
    refreshClients: loadClients
  };
}
