'use client';

import { Drawer } from './Drawer';
import { useDrawer } from '@/contexts/DrawerContext';
import styles from './MealTypeDrawer.module.css';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
] as const;

export function MealTypeDrawer() {
  const { drawerType, drawerData, closeDrawer, openDrawer } = useDrawer();

  const handleSelectMealType = (mealType: string) => {
    const targetDate = drawerData?.targetDate || new Date().toISOString().split('T')[0];
    openDrawer('food-search', { mealType, targetDate });
  };

  return (
    <Drawer
      isOpen={drawerType === 'meal-type'}
      onClose={closeDrawer}
      title="Select Meal Type"
    >
      <div className={styles.grid}>
        {MEAL_TYPES.map((meal) => (
          <button
            key={meal.value}
            className={styles.mealButton}
            onClick={() => handleSelectMealType(meal.value)}
          >
            <span className={styles.icon}>{meal.icon}</span>
            <span className={styles.label}>{meal.label}</span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}
