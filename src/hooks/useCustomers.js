import { useState, useEffect, useCallback } from 'react';
import { getCustomers, deleteCustomer } from '../services/customers';

export function useCustomers(userId) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomers = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getCustomers(userId);
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const removeCustomer = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    customers,
    loading,
    error,
    refreshCustomers: loadCustomers,
    removeCustomer
  };
}
