import { useState, useEffect, useCallback } from 'react';
import { getBusiness, upsertBusiness } from '../services/businesses';

export function useBusiness(userId) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBusiness = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getBusiness(userId);
      setBusiness(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadBusiness(); }, [loadBusiness]);

  const updateBusiness = async (data) => {
    setSaving(true);
    try {
      const updated = await upsertBusiness(userId, data);
      setBusiness(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    business,
    loading,
    error,
    saving,
    updateBusiness,
    refreshBusiness: loadBusiness
  };
}
