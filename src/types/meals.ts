import { Database } from './database.types';

export type Meal = Database['public']['Tables']['meals']['Row'];
export type MealFood = Database['public']['Tables']['meal_foods']['Row'];
export type DailySummary = Database['public']['Tables']['daily_summaries']['Row'];
export type UserGoal = Database['public']['Tables']['user_goals']['Row'];

export interface MealWithFoods extends Meal {
  meal_foods: MealFood[];
}

export interface GroupedMeals {
  [mealType: string]: MealWithFoods[];
}

export interface MealTypeTotals {
  mealType: string;
  meals: MealWithFoods[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}
