import { useState, useEffect, useCallback } from 'react';
import { getStaff, createStaffMember, updateStaffMember, deleteStaffMember } from '../services/staff';

export function useStaff(userId) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getStaff(userId);
      setStaff(data);
    } catch (err) {
      // Table may not exist yet — fail silently
      setStaff([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addMember = async (data) => {
    const created = await createStaffMember(userId, data);
    setStaff(prev => [...prev, created]);
    return created;
  };

  const editMember = async (id, data) => {
    const updated = await updateStaffMember(id, data);
    setStaff(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const removeMember = async (id) => {
    await deleteStaffMember(id);
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  return { staff, loading, error, addMember, editMember, removeMember, refresh: load };
}
