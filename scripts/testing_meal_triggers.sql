-- =============================================================================
  -- Test Script: Daily Summaries Trigger
  -- =============================================================================

  -- 1. Get test data IDs
  SELECT id FROM profiles LIMIT 1; -- user_id
  SELECT f.id, fp.id FROM foods f JOIN food_portions fp ON fp.food_id = f.id LIMIT 1;

  -- 2. Create a user goal first (so we have targets)
  INSERT INTO user_goals (
    user_id,
    daily_calorie,
    daily_protein_g,
    daily_carbs_g,
    daily_fats_g,
    daily_fiber_g,
    set_by,
    start_date,
    is_active
  )
  VALUES (
    'user-id-here',
    2000, 150.00, 200.00, 65.00, 25.00,
    'self',
    '2025-01-01',
    TRUE
  )
  RETURNING *;

  -- 3. Create first meal (trigger should create daily_summary)
  INSERT INTO meals (user_id, meal_type, meal_date)
  VALUES ('user-id-here', 'breakfast', '2025-10-13')
  RETURNING *;
  -- Save meal_id

  -- 4. Add meal_food (meal totals auto-update, then daily_summary auto-updates)
  INSERT INTO meal_foods (meal_id, food_id, portion_id)
  VALUES ('meal-id-here', 'food-id-here', 'portion-id-here')
  RETURNING *;

  -- 5. Check daily_summaries - should exist with meal totals and goal targets!
  SELECT * FROM daily_summaries
  WHERE user_id = 'user-id-here' AND summary_date = '2025-10-13';
  -- Expected: total_calories from meal, target_calories = 2000, meals_logged = 1

  -- 6. Add second meal for same date
  INSERT INTO meals (user_id, meal_type, meal_date)
  VALUES ('user-id-here', 'lunch', '2025-10-13')
  RETURNING *;

  INSERT INTO meal_foods (meal_id, food_id, portion_id)
  VALUES ('meal-id-2', 'food-id-here', 'portion-id-here');

  -- 7. Check daily_summaries again - totals should be sum of both meals
  SELECT * FROM daily_summaries
  WHERE user_id = 'user-id-here' AND summary_date = '2025-10-13';
  -- Expected: meals_logged = 2, totals = sum of both meals

  -- 8. Update a meal to different date (should recalculate both dates)
  UPDATE meals
  SET meal_date = '2025-10-14'
  WHERE id = 'meal-id-2';

  -- Check both dates
  SELECT * FROM daily_summaries
  WHERE user_id = 'user-id-here'
    AND summary_date IN ('2025-10-13', '2025-10-14')
  ORDER BY summary_date;
  -- Expected: Oct 13 has 1 meal, Oct 14 has 1 meal

  -- 9. Delete a meal (should recalculate that date)
  DELETE FROM meals WHERE id = 'meal-id-2';

  SELECT * FROM daily_summaries
  WHERE user_id = 'user-id-here' AND summary_date = '2025-10-14';
  -- Expected: meals_logged = 0, all totals = 0