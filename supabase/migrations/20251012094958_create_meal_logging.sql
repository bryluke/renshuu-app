CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  meal_type VARCHAR NOT NULL, -- e.g., breakfast, lunch, dinner, snack
  meal_date DATE NOT NULL,

  -- Calculated totals (sum of meal_foods)
  total_calories INT DEFAULT 0,
  total_protein_g DECIMAL(5, 2) DEFAULT 0,
  total_carbs_g DECIMAL(5, 2) DEFAULT 0,
  total_fats_g DECIMAL(5, 2) DEFAULT 0,
  total_fiber_g DECIMAL(5, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  portion_id UUID REFERENCES public.food_portions(id) ON DELETE SET NULL,

  selected_addons UUID[], -- array of food_addons.id

  -- Nutritional information for this entry (calculated as portion * quantity)
  calories INT NOT NULL,
  protein_g DECIMAL(5, 2) NOT NULL,
  carbs_g DECIMAL(5, 2) NOT NULL,
  fats_g DECIMAL(5, 2) NOT NULL,
  fiber_g DECIMAL(5, 2) DEFAULT 0,

  -- Display info for history
  food_name VARCHAR NOT NULL, -- snapshot for consistency
  portion_display VARCHAR NOT NULL,
  addons_display TEXT[], -- array of addon display names ["Extra Chicken", "Chili Sauce"]

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_foods_meal ON meal_foods(meal_id);