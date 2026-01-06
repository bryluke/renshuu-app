import { MealWithFoods, GroupedMeals, MealTypeTotals } from '@/types/meals';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export function groupMealsByType(meals: MealWithFoods[]): GroupedMeals {
  const mealsWithFoods = meals.filter(m => m.meal_foods && m.meal_foods.length > 0);

  return mealsWithFoods.reduce((acc, meal) => {
    if (!acc[meal.meal_type]) {
      acc[meal.meal_type] = [];
    }
    acc[meal.meal_type].push(meal);
    return acc;
  }, {} as GroupedMeals);
}

export function calculateMealTypeTotals(
  mealType: string,
  meals: MealWithFoods[]
): MealTypeTotals {
  const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs_g || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (m.total_fats_g || 0), 0);

  return {
    mealType,
    meals,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats,
  };
}

export function sortMealsByType(groupedMeals: GroupedMeals): MealTypeTotals[] {
  return MEAL_ORDER
    .filter(type => groupedMeals[type])
    .map(type => calculateMealTypeTotals(type, groupedMeals[type]));
}
