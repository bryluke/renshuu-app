-- Function to auto-calculate meal_food nutrition from portion + addons
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
  SELECT
    calories, protein_g, carbs_g, fats_g, fiber_g, display_name
  INTO NEW.calories, NEW.protein_g, NEW.carbs_g, NEW.fats_g, NEW.fiber_g, NEW.portion_display
  FROM food_portions
  WHERE id = NEW.portion_id;

  -- If portion not found, foreign key constraint should have caught it
  -- But just in case, raise a clear error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'portion_id % not found in food_portions table', NEW.portion_id;
  END IF;

  -- Auto-fill food_name if not provided
  IF NEW.food_name IS NULL THEN
    SELECT display_name INTO NEW.food_name
    FROM foods
    WHERE id = NEW.food_id;
  END IF;

  -- Add nutrition from each addon
  IF NEW.selected_addons IS NOT NULL AND array_length(NEW.selected_addons, 1) > 0 THEN
    FOREACH addon_id IN ARRAY NEW.selected_addons
    LOOP
      SELECT calories, protein_g, carbs_g, fats_g, fiber_g
      INTO addon_nutrition
      FROM food_addons
      WHERE id = addon_id;

      IF FOUND THEN
        NEW.calories := NEW.calories + addon_nutrition.calories;
        NEW.protein_g := NEW.protein_g + addon_nutrition.protein_g;
        NEW.carbs_g := NEW.carbs_g + addon_nutrition.carbs_g;
        NEW.fats_g := NEW.fats_g + addon_nutrition.fats_g;
        NEW.fiber_g := NEW.fiber_g + addon_nutrition.fiber_g;
      END IF;
      -- Note: If addon not found, we silently skip it (could be deleted)
    END LOOP;

    -- Auto-fill addons_display if not provided
    IF NEW.addons_display IS NULL THEN
      SELECT array_agg(display_name ORDER BY array_position(NEW.selected_addons, id))
      INTO NEW.addons_display
      FROM food_addons
      WHERE id = ANY(NEW.selected_addons);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_meal_food_nutrition
  BEFORE INSERT OR UPDATE ON meal_foods
  FOR EACH ROW EXECUTE FUNCTION calculate_meal_food_nutrition();

-- Function to recalculate meal totals when meal_foods change
CREATE OR REPLACE FUNCTION update_meal_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_meal_id UUID;
  remaining_foods_count INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_meal_id := OLD.meal_id;
  ELSE
    target_meal_id := NEW.meal_id;
  END IF;

  -- Check if there are any foods left in this meal
  SELECT COUNT(*) INTO remaining_foods_count
  FROM meal_foods
  WHERE meal_id = target_meal_id;

  -- If no foods left, delete the meal entirely
  -- This will trigger the daily_summary update via the meals trigger
  IF remaining_foods_count = 0 THEN
    DELETE FROM meals WHERE id = target_meal_id;
    RETURN NULL;
  END IF;

  -- Otherwise, update the meal totals
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