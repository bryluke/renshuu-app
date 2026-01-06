-- ============================================================================
-- SEED DATA: Singapore Food Database
-- ============================================================================
-- Sources:
-- - HPB HealthHub Singapore
-- - HealthXchange.sg (SingHealth)
-- - McDonald's Singapore Nutrition Calculator
-- - MyFitnessPal Singapore entries
-- ============================================================================

-- NOTE: Manual creation via Supabase UI for test users
-- This is a one-time setup to create test users with different roles.
-- 1. admin@test.com (password: password123) → Update role to 'admin'
-- 2. trainer@test.com (password: password123) → Update role to 'trainer'
-- 3. client@test.com (password: password123) → Keep as 'client'

-- Clear existing food data (for clean re-seeding)
-- CAUTION: Only run this on fresh database or when you want to reset all food data
DELETE FROM public.food_addons;
DELETE FROM public.food_portions;
DELETE FROM public.foods;

-- ============================================================================
-- HAWKER FOODS
-- ============================================================================

INSERT INTO public.foods (display_name, category, is_approved, created_at) VALUES
  -- Rice dishes
  ('Hainanese Chicken Rice', 'hawker', TRUE, NOW()),
  ('Nasi Lemak', 'hawker', TRUE, NOW()),
  ('Nasi Biryani Chicken', 'hawker', TRUE, NOW()),
  ('Nasi Goreng', 'hawker', TRUE, NOW()),
  ('Claypot Rice', 'hawker', TRUE, NOW()),
  ('Duck Rice', 'hawker', TRUE, NOW()),

  -- Noodle dishes
  ('Char Kway Teow', 'hawker', TRUE, NOW()),
  ('Laksa', 'hawker', TRUE, NOW()),
  ('Bak Chor Mee', 'hawker', TRUE, NOW()),
  ('Wonton Mee', 'hawker', TRUE, NOW()),
  ('Fish Soup Bee Hoon', 'hawker', TRUE, NOW()),
  ('Ban Mian', 'hawker', TRUE, NOW()),
  ('Mee Goreng', 'hawker', TRUE, NOW()),
  ('Hokkien Mee', 'hawker', TRUE, NOW()),
  ('Prawn Noodles', 'hawker', TRUE, NOW()),

  -- Indian breads
  ('Roti Prata', 'hawker', TRUE, NOW()),
  ('Murtabak', 'hawker', TRUE, NOW()),
  ('Naan', 'hawker', TRUE, NOW()),
  ('Chapati', 'hawker', TRUE, NOW()),
  ('Roti John', 'hawker', TRUE, NOW()),
  ('Thosai', 'hawker', TRUE, NOW()),

  -- Dim sum / small bites
  ('Har Gao', 'hawker', TRUE, NOW()),
  ('Siew Mai', 'hawker', TRUE, NOW()),
  ('Spring Roll (Fried)', 'hawker', TRUE, NOW()),
  ('Bak Chang', 'hawker', TRUE, NOW()),
  ('Chwee Kueh', 'hawker', TRUE, NOW()),
  ('Carrot Cake (Fried)', 'hawker', TRUE, NOW()),

  -- Curries / sides
  ('Beef Rendang', 'hawker', TRUE, NOW()),
  ('Ayam Goreng', 'hawker', TRUE, NOW()),
  ('Curry Chicken', 'hawker', TRUE, NOW()),
  ('Satay', 'hawker', TRUE, NOW()),

  -- Soups
  ('Bak Kut Teh', 'hawker', TRUE, NOW()),
  ('Mee Soto', 'hawker', TRUE, NOW()),
  ('Yong Tau Foo', 'hawker', TRUE, NOW());

-- ============================================================================
-- DRINKS
-- ============================================================================

INSERT INTO public.foods (display_name, category, is_approved, created_at) VALUES
  -- Kopi variations
  ('Kopi', 'drinks', TRUE, NOW()),
  ('Kopi O', 'drinks', TRUE, NOW()),
  ('Kopi C', 'drinks', TRUE, NOW()),
  ('Kopi O Kosong', 'drinks', TRUE, NOW()),

  -- Teh variations
  ('Teh', 'drinks', TRUE, NOW()),
  ('Teh O', 'drinks', TRUE, NOW()),
  ('Teh C', 'drinks', TRUE, NOW()),
  ('Teh O Kosong', 'drinks', TRUE, NOW()),

  -- Other local drinks
  ('Milo', 'drinks', TRUE, NOW()),
  ('Milo Dinosaur', 'drinks', TRUE, NOW()),
  ('Teh Tarik', 'drinks', TRUE, NOW()),
  ('Bandung', 'drinks', TRUE, NOW()),
  ('Barley Water', 'drinks', TRUE, NOW()),
  ('Sugar Cane Juice', 'drinks', TRUE, NOW()),

  -- Bubble tea
  ('Bubble Tea (Milk Tea)', 'drinks', TRUE, NOW()),
  ('Bubble Tea (Fruit Tea)', 'drinks', TRUE, NOW());

-- ============================================================================
-- FAST FOOD
-- ============================================================================

INSERT INTO public.foods (display_name, category, is_approved, created_at) VALUES
  -- McDonald's
  ('McSpicy', 'fast_food', TRUE, NOW()),
  ('Big Mac', 'fast_food', TRUE, NOW()),
  ('Fillet-O-Fish', 'fast_food', TRUE, NOW()),
  ('McChicken', 'fast_food', TRUE, NOW()),
  ('Chicken McNuggets', 'fast_food', TRUE, NOW()),
  ('McWings', 'fast_food', TRUE, NOW()),
  ('French Fries (McDonald''s)', 'fast_food', TRUE, NOW()),

  -- KFC
  ('KFC Original Recipe Chicken', 'fast_food', TRUE, NOW()),
  ('KFC Crispy Chicken', 'fast_food', TRUE, NOW()),
  ('KFC Zinger', 'fast_food', TRUE, NOW());

-- ============================================================================
-- BASICS (staples, proteins, sides)
-- ============================================================================

INSERT INTO public.foods (display_name, category, is_approved, created_at) VALUES
  -- Rice/carbs
  ('Plain White Rice', 'basics', TRUE, NOW()),
  ('Brown Rice', 'basics', TRUE, NOW()),
  ('Bee Hoon (Plain)', 'basics', TRUE, NOW()),
  ('Mee Pok (Plain)', 'basics', TRUE, NOW()),

  -- Proteins
  ('Boiled Egg', 'basics', TRUE, NOW()),
  ('Fried Egg', 'basics', TRUE, NOW()),
  ('Scrambled Eggs', 'basics', TRUE, NOW()),
  ('Grilled Chicken Breast', 'basics', TRUE, NOW()),
  ('Steamed Fish', 'basics', TRUE, NOW()),
  ('Tofu (Steamed)', 'basics', TRUE, NOW());


-- ============================================================================
-- FOOD PORTIONS
-- ============================================================================

DO $$
DECLARE
  -- Rice dishes
  chicken_rice_id UUID;
  nasi_lemak_id UUID;
  nasi_biryani_id UUID;
  nasi_goreng_id UUID;
  claypot_rice_id UUID;
  duck_rice_id UUID;

  -- Noodle dishes
  char_kway_teow_id UUID;
  laksa_id UUID;
  bak_chor_mee_id UUID;
  wonton_mee_id UUID;
  fish_soup_id UUID;
  ban_mian_id UUID;
  mee_goreng_id UUID;
  hokkien_mee_id UUID;
  prawn_noodles_id UUID;

  -- Indian breads
  prata_id UUID;
  murtabak_id UUID;
  naan_id UUID;
  chapati_id UUID;
  roti_john_id UUID;
  thosai_id UUID;

  -- Dim sum
  har_gao_id UUID;
  siew_mai_id UUID;
  spring_roll_id UUID;
  bak_chang_id UUID;
  chwee_kueh_id UUID;
  carrot_cake_id UUID;

  -- Curries/sides
  rendang_id UUID;
  ayam_goreng_id UUID;
  curry_chicken_id UUID;
  satay_id UUID;

  -- Soups
  bak_kut_teh_id UUID;
  mee_soto_id UUID;
  ytf_id UUID;

  -- Drinks
  kopi_id UUID;
  kopi_o_id UUID;
  kopi_c_id UUID;
  kopi_o_kosong_id UUID;
  teh_id UUID;
  teh_o_id UUID;
  teh_c_id UUID;
  teh_o_kosong_id UUID;
  milo_id UUID;
  milo_dino_id UUID;
  teh_tarik_id UUID;
  bandung_id UUID;
  barley_id UUID;
  sugarcane_id UUID;
  bbt_milk_id UUID;
  bbt_fruit_id UUID;

  -- Fast food
  mcspicy_id UUID;
  big_mac_id UUID;
  fillet_o_fish_id UUID;
  mcchicken_id UUID;
  mcnuggets_id UUID;
  mcwings_id UUID;
  fries_id UUID;
  kfc_original_id UUID;
  kfc_crispy_id UUID;
  kfc_zinger_id UUID;

  -- Basics
  white_rice_id UUID;
  brown_rice_id UUID;
  bee_hoon_id UUID;
  mee_pok_id UUID;
  boiled_egg_id UUID;
  fried_egg_id UUID;
  scrambled_egg_id UUID;
  grilled_chicken_id UUID;
  steamed_fish_id UUID;
  tofu_id UUID;

BEGIN
  -- Get all food IDs
  SELECT id INTO chicken_rice_id FROM public.foods WHERE display_name = 'Hainanese Chicken Rice';
  SELECT id INTO nasi_lemak_id FROM public.foods WHERE display_name = 'Nasi Lemak';
  SELECT id INTO nasi_biryani_id FROM public.foods WHERE display_name = 'Nasi Biryani Chicken';
  SELECT id INTO nasi_goreng_id FROM public.foods WHERE display_name = 'Nasi Goreng';
  SELECT id INTO claypot_rice_id FROM public.foods WHERE display_name = 'Claypot Rice';
  SELECT id INTO duck_rice_id FROM public.foods WHERE display_name = 'Duck Rice';

  SELECT id INTO char_kway_teow_id FROM public.foods WHERE display_name = 'Char Kway Teow';
  SELECT id INTO laksa_id FROM public.foods WHERE display_name = 'Laksa';
  SELECT id INTO bak_chor_mee_id FROM public.foods WHERE display_name = 'Bak Chor Mee';
  SELECT id INTO wonton_mee_id FROM public.foods WHERE display_name = 'Wonton Mee';
  SELECT id INTO fish_soup_id FROM public.foods WHERE display_name = 'Fish Soup Bee Hoon';
  SELECT id INTO ban_mian_id FROM public.foods WHERE display_name = 'Ban Mian';
  SELECT id INTO mee_goreng_id FROM public.foods WHERE display_name = 'Mee Goreng';
  SELECT id INTO hokkien_mee_id FROM public.foods WHERE display_name = 'Hokkien Mee';
  SELECT id INTO prawn_noodles_id FROM public.foods WHERE display_name = 'Prawn Noodles';

  SELECT id INTO prata_id FROM public.foods WHERE display_name = 'Roti Prata';
  SELECT id INTO murtabak_id FROM public.foods WHERE display_name = 'Murtabak';
  SELECT id INTO naan_id FROM public.foods WHERE display_name = 'Naan';
  SELECT id INTO chapati_id FROM public.foods WHERE display_name = 'Chapati';
  SELECT id INTO roti_john_id FROM public.foods WHERE display_name = 'Roti John';
  SELECT id INTO thosai_id FROM public.foods WHERE display_name = 'Thosai';

  SELECT id INTO har_gao_id FROM public.foods WHERE display_name = 'Har Gao';
  SELECT id INTO siew_mai_id FROM public.foods WHERE display_name = 'Siew Mai';
  SELECT id INTO spring_roll_id FROM public.foods WHERE display_name = 'Spring Roll (Fried)';
  SELECT id INTO bak_chang_id FROM public.foods WHERE display_name = 'Bak Chang';
  SELECT id INTO chwee_kueh_id FROM public.foods WHERE display_name = 'Chwee Kueh';
  SELECT id INTO carrot_cake_id FROM public.foods WHERE display_name = 'Carrot Cake (Fried)';

  SELECT id INTO rendang_id FROM public.foods WHERE display_name = 'Beef Rendang';
  SELECT id INTO ayam_goreng_id FROM public.foods WHERE display_name = 'Ayam Goreng';
  SELECT id INTO curry_chicken_id FROM public.foods WHERE display_name = 'Curry Chicken';
  SELECT id INTO satay_id FROM public.foods WHERE display_name = 'Satay';

  SELECT id INTO bak_kut_teh_id FROM public.foods WHERE display_name = 'Bak Kut Teh';
  SELECT id INTO mee_soto_id FROM public.foods WHERE display_name = 'Mee Soto';
  SELECT id INTO ytf_id FROM public.foods WHERE display_name = 'Yong Tau Foo';

  -- Drinks
  SELECT id INTO kopi_id FROM public.foods WHERE display_name = 'Kopi';
  SELECT id INTO kopi_o_id FROM public.foods WHERE display_name = 'Kopi O';
  SELECT id INTO kopi_c_id FROM public.foods WHERE display_name = 'Kopi C';
  SELECT id INTO kopi_o_kosong_id FROM public.foods WHERE display_name = 'Kopi O Kosong';
  SELECT id INTO teh_id FROM public.foods WHERE display_name = 'Teh';
  SELECT id INTO teh_o_id FROM public.foods WHERE display_name = 'Teh O';
  SELECT id INTO teh_c_id FROM public.foods WHERE display_name = 'Teh C';
  SELECT id INTO teh_o_kosong_id FROM public.foods WHERE display_name = 'Teh O Kosong';
  SELECT id INTO milo_id FROM public.foods WHERE display_name = 'Milo';
  SELECT id INTO milo_dino_id FROM public.foods WHERE display_name = 'Milo Dinosaur';
  SELECT id INTO teh_tarik_id FROM public.foods WHERE display_name = 'Teh Tarik';
  SELECT id INTO bandung_id FROM public.foods WHERE display_name = 'Bandung';
  SELECT id INTO barley_id FROM public.foods WHERE display_name = 'Barley Water';
  SELECT id INTO sugarcane_id FROM public.foods WHERE display_name = 'Sugar Cane Juice';
  SELECT id INTO bbt_milk_id FROM public.foods WHERE display_name = 'Bubble Tea (Milk Tea)';
  SELECT id INTO bbt_fruit_id FROM public.foods WHERE display_name = 'Bubble Tea (Fruit Tea)';

  -- Fast food
  SELECT id INTO mcspicy_id FROM public.foods WHERE display_name = 'McSpicy';
  SELECT id INTO big_mac_id FROM public.foods WHERE display_name = 'Big Mac';
  SELECT id INTO fillet_o_fish_id FROM public.foods WHERE display_name = 'Fillet-O-Fish';
  SELECT id INTO mcchicken_id FROM public.foods WHERE display_name = 'McChicken';
  SELECT id INTO mcnuggets_id FROM public.foods WHERE display_name = 'Chicken McNuggets';
  SELECT id INTO mcwings_id FROM public.foods WHERE display_name = 'McWings';
  SELECT id INTO fries_id FROM public.foods WHERE display_name = 'French Fries (McDonald''s)';
  SELECT id INTO kfc_original_id FROM public.foods WHERE display_name = 'KFC Original Recipe Chicken';
  SELECT id INTO kfc_crispy_id FROM public.foods WHERE display_name = 'KFC Crispy Chicken';
  SELECT id INTO kfc_zinger_id FROM public.foods WHERE display_name = 'KFC Zinger';

  -- Basics
  SELECT id INTO white_rice_id FROM public.foods WHERE display_name = 'Plain White Rice';
  SELECT id INTO brown_rice_id FROM public.foods WHERE display_name = 'Brown Rice';
  SELECT id INTO bee_hoon_id FROM public.foods WHERE display_name = 'Bee Hoon (Plain)';
  SELECT id INTO mee_pok_id FROM public.foods WHERE display_name = 'Mee Pok (Plain)';
  SELECT id INTO boiled_egg_id FROM public.foods WHERE display_name = 'Boiled Egg';
  SELECT id INTO fried_egg_id FROM public.foods WHERE display_name = 'Fried Egg';
  SELECT id INTO scrambled_egg_id FROM public.foods WHERE display_name = 'Scrambled Eggs';
  SELECT id INTO grilled_chicken_id FROM public.foods WHERE display_name = 'Grilled Chicken Breast';
  SELECT id INTO steamed_fish_id FROM public.foods WHERE display_name = 'Steamed Fish';
  SELECT id INTO tofu_id FROM public.foods WHERE display_name = 'Tofu (Steamed)';

  -- ========================================================================
  -- INSERT PORTIONS
  -- ========================================================================

  -- Hainanese Chicken Rice (Source: HPB, HealthXchange)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (chicken_rice_id, 'Small Plate', 450, 28, 52, 14),
    (chicken_rice_id, 'Regular Plate', 600, 35, 70, 20),
    (chicken_rice_id, 'Large Plate', 750, 45, 85, 25);

  -- Nasi Lemak (Source: HPB)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (nasi_lemak_id, 'Regular (with egg & ikan bilis)', 400, 12, 55, 16),
    (nasi_lemak_id, 'With Fried Chicken Wing', 550, 22, 55, 28),
    (nasi_lemak_id, 'With Fried Chicken Drumstick', 650, 28, 55, 34);

  -- Nasi Biryani (Source: HealthXchange - 877kcal for chicken)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (nasi_biryani_id, 'Regular Plate', 877, 39, 102, 35);

  -- Nasi Goreng (Source: HealthXchange - 742kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (nasi_goreng_id, 'Regular Plate', 742, 21, 103, 27);

  -- Claypot Rice (Source: HPB ~896kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (claypot_rice_id, 'Regular Serving', 896, 35, 110, 32);

  -- Duck Rice (Source: HealthXchange - 530kcal without skin)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (duck_rice_id, 'Regular (skin removed)', 530, 24, 84, 11),
    (duck_rice_id, 'Regular (with skin)', 680, 28, 84, 22);

  -- Char Kway Teow (Source: HealthXchange - 744kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (char_kway_teow_id, 'Regular Plate', 744, 23, 76, 38);

  -- Laksa (Source: HPB ~600-700kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (laksa_id, 'Regular Bowl', 600, 20, 60, 30),
    (laksa_id, 'Large Bowl', 750, 25, 75, 38);

  -- Bak Chor Mee (Source: HealthXchange)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bak_chor_mee_id, 'Dry', 525, 28, 54, 23),
    (bak_chor_mee_id, 'Soup', 450, 25, 50, 18);

  -- Wonton Mee (Source: HealthXchange - 411kcal dry, 290kcal soup)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (wonton_mee_id, 'Dry', 411, 19, 55, 12),
    (wonton_mee_id, 'Soup', 290, 19, 41, 5);

  -- Fish Soup Bee Hoon (Source: HPB ~350kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (fish_soup_id, 'Regular Bowl', 350, 25, 40, 10),
    (fish_soup_id, 'With Milk', 450, 28, 45, 18);

  -- Ban Mian (Source: HealthXchange - 475kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (ban_mian_id, 'Soup', 475, 22, 48, 22),
    (ban_mian_id, 'Dry', 520, 22, 55, 25);

  -- Mee Goreng (Source: HealthXchange - 500kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mee_goreng_id, 'Regular Plate', 500, 18, 61, 20);

  -- Hokkien Mee (~700kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (hokkien_mee_id, 'Regular Plate', 700, 30, 70, 32);

  -- Prawn Noodles (~550kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (prawn_noodles_id, 'Soup', 450, 22, 55, 15),
    (prawn_noodles_id, 'Dry', 550, 25, 60, 22);

  -- Roti Prata (Source: HealthXchange - 209kcal plain)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (prata_id, 'Plain (1 piece)', 209, 5, 32, 7),
    (prata_id, 'Egg (1 piece)', 290, 10, 32, 14),
    (prata_id, 'Cheese (1 piece)', 350, 12, 35, 18);

  -- Murtabak (Source: HealthXchange)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (murtabak_id, 'Chicken (half)', 500, 20, 45, 25),
    (murtabak_id, 'Mutton (half)', 550, 22, 45, 30);

  -- Naan (Source: HealthXchange - 357kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (naan_id, '1 piece', 357, 11, 57, 9);

  -- Chapati (Source: HealthXchange - 187kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (chapati_id, '1 piece', 187, 4, 28, 7);

  -- Roti John (Source: HealthXchange - 721kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (roti_john_id, '1 serving', 721, 25, 77, 35);

  -- Thosai (~150kcal plain)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (thosai_id, 'Plain (1 piece)', 150, 4, 28, 3),
    (thosai_id, 'Masala', 280, 8, 40, 10);

  -- Dim Sum (Source: HealthXchange - per piece)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (har_gao_id, '1 piece', 27, 1, 4, 1),
    (har_gao_id, '3 pieces', 81, 3, 12, 3);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (siew_mai_id, '1 piece', 29, 1, 3, 1),
    (siew_mai_id, '3 pieces', 87, 3, 9, 3);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (spring_roll_id, '1 piece', 70, 1, 7, 4);

  -- Bak Chang (Source: HealthXchange - 276kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bak_chang_id, '1 piece', 276, 8, 39, 10);

  -- Chwee Kueh (Source: HPB ~57kcal per piece)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (chwee_kueh_id, '1 piece', 57, 1, 11, 1),
    (chwee_kueh_id, '5 pieces', 285, 5, 55, 5);

  -- Carrot Cake (~300-400kcal per plate)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (carrot_cake_id, 'White (Regular)', 350, 8, 45, 15),
    (carrot_cake_id, 'Black (Regular)', 400, 10, 50, 18);

  -- Beef Rendang (Source: HealthXchange - 208kcal per 93g)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (rendang_id, '1 serving', 208, 24, 1, 12);

  -- Ayam Goreng (Source: HealthXchange - 141kcal per 80g)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (ayam_goreng_id, '1 piece (thigh)', 200, 18, 5, 12),
    (ayam_goreng_id, '1 piece (drumstick)', 141, 16, 0, 9);

  -- Curry Chicken (~250kcal per serving with gravy)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (curry_chicken_id, '1 serving (with gravy)', 280, 22, 8, 18);

  -- Satay (Source: HealthXchange - ~31kcal per stick)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (satay_id, 'Chicken (1 stick)', 31, 3, 2, 1),
    (satay_id, 'Chicken (5 sticks)', 155, 15, 10, 5),
    (satay_id, 'Mutton (1 stick)', 35, 3, 2, 2),
    (satay_id, 'Beef (1 stick)', 33, 3, 2, 1);

  -- Bak Kut Teh (~350kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bak_kut_teh_id, '1 bowl (soup only)', 200, 15, 5, 14),
    (bak_kut_teh_id, '1 bowl (with rice)', 400, 18, 50, 16);

  -- Mee Soto (~300kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mee_soto_id, 'Regular Bowl', 300, 18, 35, 10);

  -- Yong Tau Foo (Source: HPB ~200-300kcal depending on items)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (ytf_id, '5 items (soup)', 200, 12, 25, 6),
    (ytf_id, '8 items (soup)', 320, 20, 40, 10),
    (ytf_id, '5 items (dry)', 280, 12, 30, 12);

  -- ========================================================================
  -- DRINKS PORTIONS
  -- ========================================================================

  -- Kopi (Source: HPB, Mothership ~100-145kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kopi_id, 'Regular', 135, 2, 18, 6),
    (kopi_id, 'Siu Dai (less sweet)', 100, 2, 12, 5);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kopi_o_id, 'Regular', 85, 0, 20, 0),
    (kopi_o_id, 'Siu Dai', 45, 0, 10, 0);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kopi_c_id, 'Regular', 113, 2, 16, 4),
    (kopi_c_id, 'Siu Dai', 68, 2, 8, 3);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kopi_o_kosong_id, 'Regular', 5, 0, 0, 0);

  -- Teh (Source: HPB ~153kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (teh_id, 'Regular', 142, 3, 21, 5),
    (teh_id, 'Siu Dai', 100, 2, 14, 4);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (teh_o_id, 'Regular', 80, 0, 20, 0),
    (teh_o_id, 'Siu Dai', 40, 0, 10, 0);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (teh_c_id, 'Regular', 110, 2, 16, 4),
    (teh_c_id, 'Siu Dai', 68, 2, 8, 3);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (teh_o_kosong_id, 'Regular', 5, 0, 0, 0);

  -- Milo (Source: HPB ~180-250kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (milo_id, 'Regular', 180, 5, 28, 5),
    (milo_id, 'Siu Dai', 140, 5, 20, 5);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (milo_dino_id, 'Regular', 280, 6, 42, 10);

  -- Teh Tarik (~150kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (teh_tarik_id, 'Regular', 150, 3, 22, 5);

  -- Bandung (~150kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bandung_id, 'Regular', 150, 2, 28, 4);

  -- Barley (~120kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (barley_id, 'Regular', 120, 1, 28, 0),
    (barley_id, 'Less Sugar', 80, 1, 18, 0);

  -- Sugar Cane (~140kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (sugarcane_id, 'Regular Glass', 140, 0, 35, 0);

  -- Bubble Tea (Source: HPB ~335-469kcal)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bbt_milk_id, 'Medium (with pearls)', 335, 3, 55, 12),
    (bbt_milk_id, 'Large (with pearls)', 469, 4, 77, 16),
    (bbt_milk_id, 'Medium (30% sugar)', 250, 3, 40, 10),
    (bbt_milk_id, 'Medium (no pearls)', 220, 3, 35, 10);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bbt_fruit_id, 'Medium (with pearls)', 280, 1, 60, 3),
    (bbt_fruit_id, 'Large (with pearls)', 380, 1, 82, 4),
    (bbt_fruit_id, 'Medium (30% sugar)', 180, 1, 38, 2);

  -- ========================================================================
  -- FAST FOOD PORTIONS (Source: McDonald's SG, KFC SG nutrition calculators)
  -- ========================================================================

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mcspicy_id, '1 burger', 541, 23, 45, 30);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (big_mac_id, '1 burger', 558, 28, 48, 28);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (fillet_o_fish_id, '1 burger', 332, 15, 38, 13);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mcchicken_id, '1 burger', 400, 15, 40, 20);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mcnuggets_id, '6 pieces', 270, 14, 16, 16),
    (mcnuggets_id, '9 pieces', 405, 21, 24, 24);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mcwings_id, '2 pieces', 180, 12, 10, 10),
    (mcwings_id, '4 pieces', 360, 24, 20, 20);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (fries_id, 'Small', 220, 3, 28, 11),
    (fries_id, 'Medium', 320, 4, 41, 16),
    (fries_id, 'Large', 430, 5, 54, 21);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kfc_original_id, '1 piece (thigh)', 290, 18, 10, 20),
    (kfc_original_id, '1 piece (drumstick)', 160, 12, 5, 10);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kfc_crispy_id, '1 piece (thigh)', 320, 18, 14, 22),
    (kfc_crispy_id, '1 piece (drumstick)', 180, 12, 8, 11);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (kfc_zinger_id, '1 burger', 450, 22, 38, 24);

  -- ========================================================================
  -- BASICS PORTIONS
  -- ========================================================================

  -- Plain Rice (Source: USDA)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (white_rice_id, 'Small Bowl (100g)', 130, 3, 28, 0),
    (white_rice_id, 'Regular Bowl (150g)', 195, 4, 42, 1),
    (white_rice_id, 'Large Bowl (200g)', 260, 5, 56, 1);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (brown_rice_id, 'Small Bowl (100g)', 112, 3, 24, 1),
    (brown_rice_id, 'Regular Bowl (150g)', 168, 4, 36, 1),
    (brown_rice_id, 'Large Bowl (200g)', 224, 5, 48, 2);

  -- Noodles (plain, cooked)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bee_hoon_id, 'Regular (150g)', 160, 3, 35, 0);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (mee_pok_id, 'Regular (150g)', 200, 6, 40, 1);

  -- Eggs (Source: USDA)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (boiled_egg_id, '1 egg', 78, 6, 1, 5),
    (boiled_egg_id, '2 eggs', 156, 12, 2, 10);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (fried_egg_id, '1 egg', 90, 6, 0, 7),
    (fried_egg_id, '2 eggs', 180, 12, 0, 14);

  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (scrambled_egg_id, '2 eggs', 180, 12, 2, 14);

  -- Chicken (Source: USDA)
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (grilled_chicken_id, '100g', 165, 31, 0, 4),
    (grilled_chicken_id, '150g', 248, 47, 0, 6);

  -- Fish
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (steamed_fish_id, '100g', 105, 22, 0, 2),
    (steamed_fish_id, '150g', 158, 33, 0, 3);

  -- Tofu
  INSERT INTO public.food_portions (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (tofu_id, '100g', 76, 8, 2, 4),
    (tofu_id, '150g', 114, 12, 3, 6);

  -- ========================================================================
  -- FOOD ADDONS
  -- ========================================================================

  -- Chicken Rice addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (chicken_rice_id, 'Extra Chicken', 150, 28, 0, 5),
    (chicken_rice_id, 'Extra Rice', 100, 2, 22, 0),
    (chicken_rice_id, 'Chili Sauce', 15, 0, 2, 1),
    (chicken_rice_id, 'Ginger Sauce', 20, 0, 1, 2);

  -- Nasi Lemak addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (nasi_lemak_id, 'Fried Egg', 90, 6, 0, 7),
    (nasi_lemak_id, 'Extra Sambal', 30, 0, 3, 2),
    (nasi_lemak_id, 'Otah', 80, 8, 2, 5);

  -- Char Kway Teow addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (char_kway_teow_id, 'Extra Prawns', 50, 10, 0, 1),
    (char_kway_teow_id, 'Extra Cockles', 30, 5, 1, 1);

  -- Laksa addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (laksa_id, 'Extra Cockles', 30, 5, 1, 1),
    (laksa_id, 'Extra Fishcake', 60, 6, 4, 3),
    (laksa_id, 'Extra Tau Pok', 80, 4, 2, 6);

  -- Prata addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (prata_id, 'Fish Curry (3 tbsp)', 60, 4, 3, 4),
    (prata_id, 'Chicken Curry (3 tbsp)', 70, 5, 3, 5),
    (prata_id, 'Dhal (3 tbsp)', 50, 3, 7, 1);

  -- Satay addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (satay_id, 'Peanut Sauce (2 tbsp)', 90, 3, 6, 6),
    (satay_id, 'Ketupat (1 piece)', 80, 2, 18, 0),
    (satay_id, 'Cucumber & Onion', 10, 0, 2, 0);

  -- Bubble tea addons
  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bbt_milk_id, 'Extra Pearls', 100, 0, 25, 0),
    (bbt_milk_id, 'Coconut Jelly', 50, 0, 12, 1),
    (bbt_milk_id, 'Aloe Vera', 30, 0, 7, 0),
    (bbt_milk_id, 'Pudding', 80, 2, 14, 2);

  INSERT INTO public.food_addons (food_id, display_name, calories, protein_g, carbs_g, fats_g) VALUES
    (bbt_fruit_id, 'Extra Pearls', 100, 0, 25, 0),
    (bbt_fruit_id, 'Coconut Jelly', 50, 0, 12, 1),
    (bbt_fruit_id, 'Aloe Vera', 30, 0, 7, 0);

END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total foods: ~70+ items across categories
-- Categories: hawker, drinks, fast_food, basics
-- All items include at least one portion with full macros (cal, protein, carbs, fats)
-- Common items include multiple portion sizes and/or addons
-- Data sources: HPB, HealthXchange, McDonald's SG, USDA
-- ============================================================================
