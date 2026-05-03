import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const PLAN_LEVELS = { free: 0, presence: 1, operations: 2, marketing: 3 };

const PLAN_IDS = ['free', 'presence', 'operations', 'marketing'];

export function useSubscription(userId) {
  const [subscription, setSubscription] = useState(undefined); // undefined = loading
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([subRes, plansRes]) => {
      setSubscription(subRes.data ?? null);
      const allPlans = plansRes.data ?? [];
      setPlans(allPlans.filter(p => PLAN_IDS.includes(p.id)));
    });
  }, [userId]);

  const planId = subscription?.plan_id || 'free';
  const planLevel = PLAN_LEVELS[planId] ?? 0;
  const canAccess = (minPlan) => planLevel >= (PLAN_LEVELS[minPlan] ?? 0);

  return { subscription, plans, loading: subscription === undefined, planId, planLevel, canAccess };
}
