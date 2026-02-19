'use client';

import { useState } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';
import { useRefreshSubscription } from '@/contexts/RefreshContext';
import { useMealsData } from '@/hooks/useMealsData';
import { groupMealsByType, sortMealsByType } from '@/lib/meals/grouping';
import { MealFood } from '@/types/meals';
import { MealCard } from '@/components/meals/MealCard';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function MealsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const { openDrawer } = useDrawer();
  const { meals, summary, loading, error, refetch } = useMealsData(selectedDate);

  useRefreshSubscription('meals', () => refetch(selectedDate));

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const getDateInfo = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);

    const formattedDate = date.toLocaleDateString('en-SG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    let subtext = null;

    if (selectedDateObj.getTime() === today.getTime()) {
      subtext = 'Today';
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (selectedDateObj.getTime() === yesterday.getTime()) {
        subtext = 'Yesterday';
      } else {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedDateObj.getTime() === tomorrow.getTime()) {
          subtext = 'Tomorrow';
        }
      }
    }

    return { formattedDate, subtext };
  };

  const handleEditFood = (food: MealFood) => {
    openDrawer('food-form', {
      isEdit: true,
      mealFoodId: food.id,
      foodId: food.food_id,
      foodName: food.food_name,
      portionId: food.portion_id,
      selectedAddons: food.selected_addons || [],
    });
  };

  const handleDeleteFood = async (mealFoodId: string) => {
    if (!confirm('Delete this food item?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('meal_foods')
        .delete()
        .eq('id', mealFoodId);

      if (error) throw error;

      await refetch(selectedDate);
    } catch (err) {
      console.error('Error deleting food:', err);
      alert('Failed to delete food item');
    }
  };

  const mealsWithFoods = meals.filter(m => m.meal_foods && m.meal_foods.length > 0);

  if (typeof window !== 'undefined') {
    (window as any).__selectedMealsDate = selectedDate;
  }

  return (
    <div className={styles.container}>
      <div className={styles.dateNavigation}>
        <button
          onClick={handlePreviousDay}
          className={styles.navButton}
          aria-label="Previous day"
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <label className={styles.datePickerWrapper}>
          <div className={styles.dateDisplay}>
            <span className={styles.dateText}>{getDateInfo(selectedDate).formattedDate}</span>
            {getDateInfo(selectedDate).subtext && (
              <span className={styles.dateSubtext}>{getDateInfo(selectedDate).subtext}</span>
            )}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className={styles.datePicker}
          />
        </label>

        <button
          onClick={handleNextDay}
          className={styles.navButton}
          aria-label="Next day"
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className={styles.content}>
        {loading && <p className={styles.loadingText}>Loading meals...</p>}
        {error && <p className={styles.error}>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            {summary && (
              <section className={styles.summaryCard}>
                <div className={styles.summaryStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.total_calories?.toFixed(0) || 0}</span>
                    <span className={styles.statLabel}>kcal</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.total_protein_g?.toFixed(0) || 0}g</span>
                    <span className={styles.statLabel}>protein</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.total_carbs_g?.toFixed(0) || 0}g</span>
                    <span className={styles.statLabel}>carbs</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{summary.total_fats_g?.toFixed(0) || 0}g</span>
                    <span className={styles.statLabel}>fats</span>
                  </div>
                </div>
              </section>
            )}

            <section className={styles.mealsSection}>
              {mealsWithFoods.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No meals logged yet</p>
                  <p className={styles.emptyHint}>Tap the + button below to get started</p>
                </div>
              ) : (
                <div className={styles.mealsList}>
                  {sortMealsByType(groupMealsByType(meals)).map((mealTypeTotals) => (
                    <MealCard
                      key={mealTypeTotals.mealType}
                      mealTypeTotals={mealTypeTotals}
                      onEditFood={handleEditFood}
                      onDeleteFood={handleDeleteFood}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
