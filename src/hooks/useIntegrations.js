import { useState, useEffect, useCallback } from 'react';
import { getIntegrations, upsertIntegration } from '../services/integrations';

export function useIntegrations(userId) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIntegrations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getIntegrations(userId);
      setIntegrations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadIntegrations(); }, [loadIntegrations]);

  const updateIntegration = async (provider, config) => {
    try {
      const updated = await upsertIntegration(userId, provider, config);
      setIntegrations(prev => {
        const index = prev.findIndex(i => i.provider === provider);
        if (index > -1) {
          const newIntegrations = [...prev];
          newIntegrations[index] = updated;
          return newIntegrations;
        }
        return [...prev, updated];
      });
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const activeToolsMap = {};
  integrations.forEach(i => { activeToolsMap[i.provider] = i.config; });

  return {
    integrations,
    activeToolsMap,
    loading,
    error,
    updateIntegration,
    refreshIntegrations: loadIntegrations
  };
}
