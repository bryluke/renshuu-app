'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MealWithFoods, DailySummary, UserGoal } from '@/types/meals';

interface TodayData {
  meals: MealWithFoods[];
  summary: DailySummary | null;
  goal: UserGoal | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTodayData(): TodayData {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealWithFoods[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const [mealsResult, summaryResult, goalResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*, meal_foods(*)')
          .eq('user_id', user.id)
          .eq('meal_date', today)
          .order('created_at', { ascending: true }),

        supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('summary_date', today)
          .maybeSingle(),

        supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle(),
      ]);

      if (mealsResult.error) throw mealsResult.error;
      if (summaryResult.error) throw summaryResult.error;
      if (goalResult.error) throw goalResult.error;

      setMeals(mealsResult.data || []);
      setSummary(summaryResult.data);
      setGoal(goalResult.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, today]);

  return {
    meals,
    summary,
    goal,
    loading,
    error,
    refetch: fetchData,
  };
}
