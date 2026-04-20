import { useState, useCallback } from 'react';
import { getCustomerMessages } from '../services/customers';

export function useCustomerChat(userId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadChat = useCallback(async (externalId, platform) => {
    if (!userId || !externalId || !platform) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerMessages(userId, externalId, platform);
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    messages,
    loading,
    error,
    loadChat,
    clearChat: () => setMessages([])
  };
}
