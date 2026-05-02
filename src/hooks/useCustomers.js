import { useState, useEffect, useCallback } from 'react';
import { getCustomers, deleteCustomer, createCustomer, bulkCreateCustomers } from '../services/customers';

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

  const addCustomer = async (details) => {
    try {
      const customer = await createCustomer(userId, details);
      setCustomers(prev => [customer, ...prev]);
      return customer;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const importCustomers = async (rows) => {
    const created = await bulkCreateCustomers(userId, rows);
    setCustomers(prev => [...created, ...prev]);
    return created;
  };

  return {
    customers,
    loading,
    error,
    refreshCustomers: loadCustomers,
    removeCustomer,
    addCustomer,
    importCustomers,
  };
}
