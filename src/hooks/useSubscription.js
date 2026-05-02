import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function useSubscription(userId) {
  const [subscription, setSubscription] = useState(undefined); // undefined = loading
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const NEW_PLAN_IDS = ['presence', 'operations', 'marketing'];
    Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([subRes, plansRes]) => {
      setSubscription(subRes.data ?? null);
      const allPlans = plansRes.data ?? [];
      const newPlans = allPlans.filter(p => NEW_PLAN_IDS.includes(p.id));
      setPlans(newPlans);
    });
  }, [userId]);

  return { subscription, plans, loading: subscription === undefined };
}
