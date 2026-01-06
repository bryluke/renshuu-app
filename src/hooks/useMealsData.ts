'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MealWithFoods, DailySummary } from '@/types/meals';

interface MealsCache {
  [date: string]: {
    meals: MealWithFoods[];
    summary: DailySummary | null;
  };
}

interface MealsData {
  meals: MealWithFoods[];
  summary: DailySummary | null;
  loading: boolean;
  error: Error | null;
  refetch: (date: string) => Promise<void>;
}

export function useMealsData(selectedDate: string): MealsData {
  const { user } = useAuth();
  const [cache, setCache] = useState<MealsCache>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDateRange = async (startDate: string, endDate: string) => {
    if (!user) return;

    try {
      const supabase = createClient();

      const [mealsResult, summariesResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*, meal_foods(*)')
          .eq('user_id', user.id)
          .gte('meal_date', startDate)
          .lte('meal_date', endDate)
          .order('meal_date', { ascending: false })
          .order('created_at', { ascending: true }),

        supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', user.id)
          .gte('summary_date', startDate)
          .lte('summary_date', endDate),
      ]);

      if (mealsResult.error) throw mealsResult.error;
      if (summariesResult.error) throw summariesResult.error;

      const newCache: MealsCache = {};
      const meals = mealsResult.data || [];
      const summaries = summariesResult.data || [];

      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        newCache[dateStr] = {
          meals: meals.filter(m => m.meal_date === dateStr),
          summary: summaries.find(s => s.summary_date === dateStr) || null,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setCache(prev => ({ ...prev, ...newCache }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch meals'));
    }
  };

  const fetchSingleDate = async (date: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const [mealsResult, summaryResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*, meal_foods(*)')
          .eq('user_id', user.id)
          .eq('meal_date', date)
          .order('created_at', { ascending: true }),

        supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('summary_date', date)
          .maybeSingle(),
      ]);

      if (mealsResult.error) throw mealsResult.error;
      if (summaryResult.error) throw summaryResult.error;

      setCache(prev => ({
        ...prev,
        [date]: {
          meals: mealsResult.data || [],
          summary: summaryResult.data,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch meals'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    setLoading(true);
    fetchDateRange(startDate, endDate).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user || loading) return;

    if (!cache[selectedDate]) {
      fetchSingleDate(selectedDate);
    }
  }, [selectedDate, user?.id]);

  const currentData = cache[selectedDate] || { meals: [], summary: null };

  return {
    meals: currentData.meals,
    summary: currentData.summary,
    loading,
    error,
    refetch: fetchSingleDate,
  };
}
