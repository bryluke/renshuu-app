import { Database } from './database.types';

export type Food = Database['public']['Tables']['foods']['Row'];
export type FoodPortion = Database['public']['Tables']['food_portions']['Row'];
export type FoodAddon = Database['public']['Tables']['food_addons']['Row'];

export interface FoodSearchResult {
  id: string;
  display_name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
}

export interface PortionWithNutrition {
  id: string;
  display_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number | null;
}

export interface AddonWithNutrition {
  id: string;
  display_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number | null;
}

export interface TotalNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
