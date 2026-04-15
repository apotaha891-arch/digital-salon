import { useState, useEffect, useCallback } from 'react';
import { getAgent, upsertAgent, toggleAgent } from '../services/agents';

export function useAgent(userId) {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAgent = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getAgent(userId);
      setAgent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  const updateAgent = async (data) => {
    setSaving(true);
    try {
      const updated = await upsertAgent(userId, data);
      setAgent(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAgent = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const updated = await toggleAgent(agent.id, !agent.is_active);
      setAgent(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    agent,
    loading,
    error,
    saving,
    updateAgent,
    toggleAgent: handleToggleAgent,
    refreshAgent: loadAgent
  };
}
