import { useState, useEffect, useCallback } from 'react';
import { getWallet, getLedger } from '../services/wallet';

export function useWallet(userId) {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWalletData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [w, l] = await Promise.all([getWallet(userId), getLedger(userId)]);
      setWallet(w);
      setLedger(l);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadWalletData(); }, [loadWalletData]);

  return {
    wallet,
    ledger,
    loading,
    error,
    refreshWallet: loadWalletData
  };
}
