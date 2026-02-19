'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useRefreshSubscription } from '@/contexts/RefreshContext';
import { useTodayData } from '@/hooks/useTodayData';
import { createClient } from '@/lib/supabase/client';
import { groupMealsByType, sortMealsByType } from '@/lib/meals/grouping';
import { MealFood } from '@/types/meals';
import { MealCard } from '@/components/meals/MealCard';
import { CalorieRing, MacroDonut } from '@/components/charts';
import styles from './page.module.css';

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const { openDrawer } = useDrawer();
  const { meals, summary, goal, loading, error, refetch } = useTodayData();

  useRefreshSubscription('today', refetch);

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

      await refetch();
    } catch (err) {
      console.error('Error deleting food:', err);
      alert('Failed to delete food item');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.greeting}>Welcome back, {profile?.full_name || 'User'}!</p>
        <button onClick={signOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </header>

      <div className={styles.content}>
        {loading && <p>Loading...</p>}
        {error && <p className={styles.error}>Error: {error.message}</p>}

        {!loading && !error && (
          <>
            <section className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h2>Today</h2>
                <span className={styles.date}>{new Date().toLocaleDateString('en-SG', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>

              <div className={styles.chartsRow}>
                <div className={styles.chartContainer}>
                  <CalorieRing
                    consumed={summary?.total_calories || 0}
                    target={goal?.daily_calorie || 0}
                  />
                  {goal?.daily_calorie && (
                    <span className={styles.chartTarget}>of {goal.daily_calorie}</span>
                  )}
                </div>

                <div className={styles.chartContainer}>
                  <MacroDonut
                    protein={summary?.total_protein_g || 0}
                    carbs={summary?.total_carbs_g || 0}
                    fats={summary?.total_fats_g || 0}
                  />
                </div>
              </div>

              <div className={styles.macroLegend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.protein}`} />
                  <span className={styles.legendLabel}>Protein</span>
                  <span className={styles.legendValue}>{(summary?.total_protein_g || 0).toFixed(0)}g</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.carbs}`} />
                  <span className={styles.legendLabel}>Carbs</span>
                  <span className={styles.legendValue}>{(summary?.total_carbs_g || 0).toFixed(0)}g</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.fats}`} />
                  <span className={styles.legendLabel}>Fats</span>
                  <span className={styles.legendValue}>{(summary?.total_fats_g || 0).toFixed(0)}g</span>
                </div>
              </div>
            </section>


            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.actionGrid}>
                <button
                  className={styles.actionCard}
                  onClick={() => openDrawer('meal-type')}
                >
                  <span className={styles.actionIcon}>🍽️</span>
                  <span className={styles.actionLabel}>Log Meal</span>
                </button>
                <button
                  className={styles.actionCard}
                  onClick={() => openDrawer('weight-form')}
                >
                  <span className={styles.actionIcon}>⚖️</span>
                  <span className={styles.actionLabel}>Log Weight</span>
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Today&apos;s Meals</h2>
              {meals.filter(m => m.meal_foods && m.meal_foods.length > 0).length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No meals logged yet</p>
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
