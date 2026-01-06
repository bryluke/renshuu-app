Renshuu Database Schema v.1.0 - Nutrition MVP Complete
Core Tables
1. Profiles (extends Supabase auth.users)
sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'trainer', 'admin')),

  -- Profile info
  height_cm INT CHECK (height_cm > 0),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
  age INT CHECK (age > 0),
  activity_level VARCHAR CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_restrictions TEXT[], -- trainer notes: ['vegan', 'vegetarian', 'gluten_free', 'halal', etc.]

  -- Relationships
  assigned_trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID, -- for future multi-business expansion

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
2. Food Database (Modular System)
Base Foods
sql
foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE, -- auto-generated slug from display_name
  display_name VARCHAR NOT NULL, -- "Hainanese Chicken Rice"
  description TEXT,
  category VARCHAR NOT NULL, -- "chinese", "japanese", "italian", etc.
  subcategory VARCHAR, -- "rice", "noodles", "breakfast", etc.

  -- Status
  is_approved BOOLEAN DEFAULT FALSE,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
Portion Sizes
sql
food_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,

  name VARCHAR, -- auto-generated slug from display_name
  display_name VARCHAR NOT NULL, -- "Small Plate", "Regular Plate", "Large Plate"

  -- Nutritional information
  calories INT NOT NULL,
  protein_g DECIMAL(5,2) NOT NULL,
  carbs_g DECIMAL(5,2) NOT NULL,
  fats_g DECIMAL(5,2) NOT NULL,
  fiber_g DECIMAL(5,2) DEFAULT 0,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: same portion name allowed for different foods
  CONSTRAINT unique_portion_per_food UNIQUE (food_id, name)
);
Add-ons
sql
food_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,

  name VARCHAR, -- auto-generated slug from display_name
  display_name VARCHAR NOT NULL, -- "Extra Chicken", "Extra Rice", "Chili Sauce"

  -- Nutritional impact
  calories INT NOT NULL,
  protein_g DECIMAL(5,2) NOT NULL,
  carbs_g DECIMAL(5,2) NOT NULL,
  fats_g DECIMAL(5,2) NOT NULL,
  fiber_g DECIMAL(5,2) DEFAULT 0,

  category VARCHAR, -- "sauce", "topping", "side", etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: same addon name allowed for different foods
  CONSTRAINT unique_addon_per_food UNIQUE (food_id, name)
);
3. Food Logging System
Meals
sql
meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  meal_type VARCHAR NOT NULL, -- "breakfast", "lunch", "dinner", "snack"
  meal_date DATE NOT NULL,

  -- Calculated totals (auto-updated by trigger)
  total_calories INT DEFAULT 0,
  total_protein_g DECIMAL(5,2) DEFAULT 0,
  total_carbs_g DECIMAL(5,2) DEFAULT 0,
  total_fats_g DECIMAL(5,2) DEFAULT 0,  -- Note: fats_g not fat_g
  total_fiber_g DECIMAL(5,2) DEFAULT 0,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
Individual Food Items in Meals
sql
meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  portion_id UUID REFERENCES public.food_portions(id) ON DELETE SET NULL,

  selected_addons UUID[], -- array of food_addons.id

  -- Calculated nutrition (auto-calculated by trigger from portion + addons)
  calories INT NOT NULL,
  protein_g DECIMAL(5,2) NOT NULL,
  carbs_g DECIMAL(5,2) NOT NULL,
  fats_g DECIMAL(5,2) NOT NULL,
  fiber_g DECIMAL(5,2) DEFAULT 0,

  -- Display info for history (auto-filled by trigger, snapshot pattern)
  food_name VARCHAR NOT NULL,
  portion_display VARCHAR NOT NULL,
  addons_display TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);
4. Goals & Targets
User Goals
sql
user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Daily targets
  daily_calorie INT NOT NULL,
  daily_protein_g DECIMAL(5,2) NOT NULL,
  daily_carbs_g DECIMAL(5,2) NOT NULL,
  daily_fats_g DECIMAL(5,2) NOT NULL,
  daily_fiber_g DECIMAL(5,2) NOT NULL,

  -- Goal metadata
  set_by VARCHAR NOT NULL CHECK (set_by IN ('self', 'trainer')),
  set_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,

  -- Validity period
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means ongoing
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
5. Progress Tracking
Daily Summaries (auto-updated by trigger)
sql
daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,

  -- Actual intake
  total_calories INT NOT NULL DEFAULT 0,
  total_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_carbs_g DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_fats_g DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_fiber_g DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Targets (snapshot from user_goals)
  target_calories INTEGER,  -- Note: singular 'calories', from user_goals.daily_calorie
  target_protein_g DECIMAL(5,2),
  target_carbs_g DECIMAL(5,2),
  target_fats_g DECIMAL(5,2),
  target_fiber_g DECIMAL(5,2),

  -- Metrics
  meals_logged INTEGER DEFAULT 0,
  days_since_last_log INTEGER DEFAULT 0, -- calculated in API layer, not by trigger

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, summary_date)
);

Weight Logs
```sql
weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
  log_date DATE NOT NULL,
  notes TEXT, -- Optional notes (e.g., "morning weight", "after workout")

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One weight entry per user per day
  CONSTRAINT unique_weight_per_day UNIQUE (user_id, log_date)
);
```

**Sync Trigger**: Updates `profiles.weight_kg` with latest weight entry

6. Food Requests (Crowdsourcing)
sql
food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Request details
  food_name VARCHAR NOT NULL,
  description TEXT,
  where_found TEXT, -- "ABC Hawker Centre", "Ya Kun", etc.

  -- Status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_food_id UUID REFERENCES foods(id) ON DELETE SET NULL, -- if approved
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
7. Notifications (Future)
sql
notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  type VARCHAR NOT NULL, -- "daily_reminder", "goal_achievement", "client_milestone"
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  
  -- Notification data
  related_entity_type VARCHAR, -- "meal", "user", "goal"
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
Key Relationships
User Hierarchy
profiles.assigned_trainer_id → trainer-client relationship
Role-based access: client < trainer < owner_admin
Auth handled by Supabase auth.users, extended by profiles table
Modular Food System
foods (base food) → food_portions (size options) → food_addons (customizations)
meal_foods combines: base food + chosen portion + selected addons
Food Logging Flow
meals (daily meal slots) → meal_foods (individual food combinations)
Nutrition calculated from portion + addons, stored for performance
Goal Tracking
user_goals (targets) + daily_summaries (actual intake) = progress analytics
History preserved when goals change
Indexes for Performance
sql
-- User relationships
CREATE INDEX IF NOT EXISTS idx_profiles_trainer ON public.profiles(assigned_trainer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Food searches
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_approved ON public.foods(is_approved);

-- Food logging queries
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_foods_meal ON public.meal_foods(meal_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);

-- Goal tracking
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON public.user_goals(user_id, is_active, start_date);

-- Food requests
CREATE INDEX IF NOT EXISTS idx_food_requests_status ON public.food_requests(status, created_at);

Triggers & Functions
sql
-- Auto-generate slug from display_name for foods, portions, and addons
CREATE OR REPLACE FUNCTION generate_name_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NULL OR NEW.name = '' THEN
    IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
      NEW.name := 'check_here_' || extract(epoch from now())::text;
    ELSE
      NEW.name := lower(
        regexp_replace(
          regexp_replace(NEW.display_name, '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '_', 'g'
        )
      );
      IF NEW.name = '' THEN
        NEW.name := 'check_here_' || extract(epoch from now())::text;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to foods, food_portions, food_addons
CREATE TRIGGER set_food_name_slug
  BEFORE INSERT OR UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION generate_name_slug();

CREATE TRIGGER set_food_portion_name_slug
  BEFORE INSERT OR UPDATE ON public.food_portions
  FOR EACH ROW EXECUTE FUNCTION generate_name_slug();

CREATE TRIGGER set_food_addon_name_slug
  BEFORE INSERT OR UPDATE ON public.food_addons
  FOR EACH ROW EXECUTE FUNCTION generate_name_slug();

-- Auto-calculate meal_food nutrition from portion + addons, and auto-fill display names
CREATE OR REPLACE FUNCTION calculate_meal_food_nutrition()
RETURNS TRIGGER AS $$
DECLARE
  addon_id UUID;
  addon_nutrition RECORD;
BEGIN
  -- Validate portion_id exists
  IF NEW.portion_id IS NULL THEN
    RAISE EXCEPTION 'portion_id cannot be NULL when creating or updating a meal_food';
  END IF;

  -- Start with portion nutrition and display name
  SELECT calories, protein_g, carbs_g, fats_g, fiber_g, display_name
  INTO NEW.calories, NEW.protein_g, NEW.carbs_g, NEW.fats_g, NEW.fiber_g, NEW.portion_display
  FROM food_portions WHERE id = NEW.portion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'portion_id % not found in food_portions table', NEW.portion_id;
  END IF;

  -- Auto-fill food_name if not provided
  IF NEW.food_name IS NULL THEN
    SELECT display_name INTO NEW.food_name FROM foods WHERE id = NEW.food_id;
  END IF;

  -- Add nutrition from each addon
  IF NEW.selected_addons IS NOT NULL AND array_length(NEW.selected_addons, 1) > 0 THEN
    FOREACH addon_id IN ARRAY NEW.selected_addons
    LOOP
      SELECT calories, protein_g, carbs_g, fats_g, fiber_g
      INTO addon_nutrition
      FROM food_addons WHERE id = addon_id;

      IF FOUND THEN
        NEW.calories := NEW.calories + addon_nutrition.calories;
        NEW.protein_g := NEW.protein_g + addon_nutrition.protein_g;
        NEW.carbs_g := NEW.carbs_g + addon_nutrition.carbs_g;
        NEW.fats_g := NEW.fats_g + addon_nutrition.fats_g;
        NEW.fiber_g := NEW.fiber_g + addon_nutrition.fiber_g;
      END IF;
    END LOOP;

    -- Auto-fill addons_display if not provided
    IF NEW.addons_display IS NULL THEN
      SELECT array_agg(display_name ORDER BY array_position(NEW.selected_addons, id))
      INTO NEW.addons_display
      FROM food_addons WHERE id = ANY(NEW.selected_addons);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_meal_food_nutrition
  BEFORE INSERT OR UPDATE ON meal_foods
  FOR EACH ROW EXECUTE FUNCTION calculate_meal_food_nutrition();

-- Auto-update meal totals when meal_foods change
CREATE OR REPLACE FUNCTION update_meal_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_meal_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_meal_id := OLD.meal_id;
  ELSE
    target_meal_id := NEW.meal_id;
  END IF;

  UPDATE meals
  SET
    total_calories = COALESCE((SELECT SUM(calories) FROM meal_foods WHERE meal_id = target_meal_id), 0),
    total_protein_g = COALESCE((SELECT SUM(protein_g) FROM meal_foods WHERE meal_id = target_meal_id), 0),
    total_carbs_g = COALESCE((SELECT SUM(carbs_g) FROM meal_foods WHERE meal_id = target_meal_id), 0),
    total_fats_g = COALESCE((SELECT SUM(fats_g) FROM meal_foods WHERE meal_id = target_meal_id), 0),
    total_fiber_g = COALESCE((SELECT SUM(fiber_g) FROM meal_foods WHERE meal_id = target_meal_id), 0),
    updated_at = NOW()
  WHERE id = target_meal_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_meal_totals
  AFTER INSERT OR UPDATE OR DELETE ON meal_foods
  FOR EACH ROW EXECUTE FUNCTION update_meal_totals();

-- Auto-update daily_summaries when meals change
CREATE OR REPLACE FUNCTION recalculate_daily_summary(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_totals RECORD;
  v_goals RECORD;
BEGIN
  -- Sum all meals for this user on this date
  SELECT
    COALESCE(SUM(total_calories), 0) as calories,
    COALESCE(SUM(total_protein_g), 0) as protein_g,
    COALESCE(SUM(total_carbs_g), 0) as carbs_g,
    COALESCE(SUM(total_fats_g), 0) as fats_g,
    COALESCE(SUM(total_fiber_g), 0) as fiber_g,
    COUNT(*) as meal_count
  INTO v_totals
  FROM meals
  WHERE user_id = p_user_id AND meal_date = p_date;

  -- Find active goal for this date
  SELECT daily_calorie, daily_protein_g, daily_carbs_g, daily_fats_g, daily_fiber_g
  INTO v_goals
  FROM user_goals
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND start_date <= p_date
    AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  -- Upsert into daily_summaries
  INSERT INTO daily_summaries (
    user_id, summary_date,
    total_calories, total_protein_g, total_carbs_g, total_fats_g, total_fiber_g,
    target_calories, target_protein_g, target_carbs_g, target_fats_g, target_fiber_g,
    meals_logged, updated_at
  )
  VALUES (
    p_user_id, p_date,
    v_totals.calories, v_totals.protein_g, v_totals.carbs_g, v_totals.fats_g, v_totals.fiber_g,
    v_goals.daily_calorie, v_goals.daily_protein_g, v_goals.daily_carbs_g, v_goals.daily_fats_g, v_goals.daily_fiber_g,
    v_totals.meal_count, NOW()
  )
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein_g = EXCLUDED.total_protein_g,
    total_carbs_g = EXCLUDED.total_carbs_g,
    total_fats_g = EXCLUDED.total_fats_g,
    total_fiber_g = EXCLUDED.total_fiber_g,
    target_calories = EXCLUDED.target_calories,
    target_protein_g = EXCLUDED.target_protein_g,
    target_carbs_g = EXCLUDED.target_carbs_g,
    target_fats_g = EXCLUDED.target_fats_g,
    target_fiber_g = EXCLUDED.target_fiber_g,
    meals_logged = EXCLUDED.meals_logged,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- UPDATE with date change: recalculate both dates
  IF TG_OP = 'UPDATE' AND OLD.meal_date != NEW.meal_date THEN
    PERFORM recalculate_daily_summary(OLD.user_id, OLD.meal_date);
    PERFORM recalculate_daily_summary(NEW.user_id, NEW.meal_date);
    RETURN NEW;
  END IF;

  -- DELETE: recalculate the old date
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_daily_summary(OLD.user_id, OLD.meal_date);
    RETURN OLD;
  END IF;

  -- INSERT or UPDATE (same date): recalculate the date
  PERFORM recalculate_daily_summary(NEW.user_id, NEW.meal_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_daily_summary
  AFTER INSERT OR UPDATE OR DELETE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_daily_summary();
Sample Data Structure
Example Food Entry: "Hainanese Chicken Rice"
foods: {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Hainanese Chicken Rice",
  category: "hawker",
  subcategory: "rice_dishes"
}

food_portions: [
  { size_name: "small_plate", calories: 420, protein_g: 25, ... },
  { size_name: "regular_plate", calories: 520, protein_g: 32, ... },
  { size_name: "large_plate", calories: 650, protein_g: 40, ... }
]

food_addons: [
  { name: "extra_chicken", calories: 150, protein_g: 28, ... },
  { name: "extra_rice", calories: 100, carbs_g: 22, ... },
  { name: "chili_sauce", calories: 15, fats_g: 1, ... }
]
Example Meal Log: "Regular Chicken Rice + Extra Chicken"
meal_foods: {
  food_id: "123e4567...",
  portion_id: "regular_plate_id",
  selected_addons: ["extra_chicken_id"],
  calories: 670, // 520 + 150
  protein_g: 60,  // 32 + 28
  food_name: "Hainanese Chicken Rice",
  portion_display: "Regular Plate",
  addons_display: ["Extra Chicken"]
}
This schema supports your modular food system while keeping it flexible for future expansion!

