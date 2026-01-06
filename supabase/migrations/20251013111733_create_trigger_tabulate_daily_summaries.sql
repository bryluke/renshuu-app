-- =============================================================================
-- Function: recalculate_daily_summary
-- Purpose: Recalculates a single daily_summary row for a specific user + date
-- Called by: Trigger function when meals change
-- =============================================================================
CREATE OR REPLACE FUNCTION recalculate_daily_summary(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_totals RECORD;
  v_goals RECORD;
BEGIN
  -- Step 1: Sum all meals for this user on this specific date
  -- COALESCE ensures we get 0 instead of NULL if no meals exist
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

  -- Step 2: Find the active goal for this user on this date
  -- Goals have start_date and optional end_date, so we need to find the one that covers this date
  -- If multiple goals match (shouldn't happen), we take the most recent one (ORDER BY start_date DESC)
  SELECT
    daily_calorie,
    daily_protein_g,
    daily_carbs_g,
    daily_fats_g,
    daily_fiber_g
  INTO v_goals
  FROM user_goals
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND start_date <= p_date
    AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  -- Step 3: Upsert into daily_summaries
  -- If a row already exists for this user+date, UPDATE it
  -- If not, INSERT a new row
  -- This is PostgreSQL's UPSERT pattern using ON CONFLICT
  INSERT INTO daily_summaries (
    user_id,
    summary_date,
    total_calories,
    total_protein_g,
    total_carbs_g,
    total_fats_g,
    total_fiber_g,
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fats_g,
    target_fiber_g,
    meals_logged,
    updated_at
  )
  VALUES (
    p_user_id,
    p_date,
    v_totals.calories,
    v_totals.protein_g,
    v_totals.carbs_g,
    v_totals.fats_g,
    v_totals.fiber_g,
    v_goals.daily_calorie,
    v_goals.daily_protein_g,
    v_goals.daily_carbs_g,
    v_goals.daily_fats_g,
    v_goals.daily_fiber_g,
    v_totals.meal_count,
    NOW()
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

  -- Note: days_since_last_log is intentionally skipped
  -- This will be calculated in the API layer on-demand
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: update_daily_summary
-- Purpose: Trigger function that determines which dates need recalculation
-- Handles: INSERT, UPDATE, DELETE on meals table
-- =============================================================================
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: UPDATE where the meal_date changed
  -- Example: User moves breakfast from Monday to Tuesday
  -- We need to recalculate BOTH Monday (remove it) and Tuesday (add it)
  IF TG_OP = 'UPDATE' AND OLD.meal_date != NEW.meal_date THEN
    PERFORM recalculate_daily_summary(OLD.user_id, OLD.meal_date);
    PERFORM recalculate_daily_summary(NEW.user_id, NEW.meal_date);
    RETURN NEW;
  END IF;

  -- Case 2: DELETE
  -- Example: User deletes a meal
  -- We need to recalculate the summary for that date
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_daily_summary(OLD.user_id, OLD.meal_date);
    RETURN OLD;
  END IF;

  -- Case 3: INSERT or UPDATE (where date didn't change)
  -- Example: User adds a new meal, or updates meal totals
  -- We need to recalculate the summary for that date
  PERFORM recalculate_daily_summary(NEW.user_id, NEW.meal_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Trigger: trg_update_daily_summary
-- Fires: AFTER any change to meals table
-- Purpose: Keep daily_summaries in sync with meals table
-- =============================================================================
CREATE TRIGGER trg_update_daily_summary
  AFTER INSERT OR UPDATE OR DELETE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();
