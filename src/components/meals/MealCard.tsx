import { MealTypeTotals } from '@/types/meals';
import { MealFood } from '@/types/meals';
import styles from './MealCard.module.css';

interface MealCardProps {
  mealTypeTotals: MealTypeTotals;
  onEditFood: (food: MealFood) => void;
  onDeleteFood: (foodId: string) => void;
}

export function MealCard({ mealTypeTotals, onEditFood, onDeleteFood }: MealCardProps) {
  const { mealType, totalCalories, totalProtein, totalCarbs, totalFats, meals } = mealTypeTotals;

  const allFoods = meals.flatMap(meal => meal.meal_foods);

  return (
    <div className={styles.mealCard}>
      <div className={styles.mealHeader}>
        <span className={styles.mealType}>{mealType}</span>
        <span className={styles.mealCalories}>{totalCalories.toFixed(0)} kcal</span>
      </div>

      <div className={styles.mealFoods}>
        {allFoods.map((food) => (
          <div key={food.id} className={styles.foodItem}>
            <div className={styles.foodContent}>
              <div className={styles.foodInfo}>
                <span className={styles.foodName}>{food.food_name}</span>
                <span className={styles.foodPortion}>
                  {food.portion_display}
                  {food.addons_display && food.addons_display.length > 0 &&
                    ` + ${food.addons_display.join(', ')}`
                  }
                </span>
              </div>
              <div className={styles.foodNutrition}>
                <span>{food.calories} kcal</span>
                <span className={styles.foodMacros}>
                  P: {food.protein_g.toFixed(0)}g · C: {food.carbs_g.toFixed(0)}g · F: {food.fats_g.toFixed(0)}g
                </span>
              </div>
            </div>
            <div className={styles.foodActions}>
              <button
                onClick={() => onEditFood(food)}
                className={styles.editButton}
                title="Edit food"
              >
                ✎
              </button>
              <button
                onClick={() => onDeleteFood(food.id)}
                className={styles.deleteButton}
                title="Delete food"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mealMacros}>
        <span>P: {totalProtein.toFixed(0)}g</span>
        <span>C: {totalCarbs.toFixed(0)}g</span>
        <span>F: {totalFats.toFixed(0)}g</span>
      </div>
    </div>
  );
}
