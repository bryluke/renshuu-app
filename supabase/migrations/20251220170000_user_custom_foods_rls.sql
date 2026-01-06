-- ============================================================================
-- Migration: Allow users to create and manage their own custom foods
-- ============================================================================
-- This enables the MyFitnessPal-style flow where users can create custom foods
-- that only they can see. Admins can later approve them to make them public.
-- ============================================================================

-- ============================================================================
-- FOODS TABLE - Updated Policies
-- ============================================================================

-- Drop the old public access policy
DROP POLICY IF EXISTS "Public Approved Foods Access" ON public.foods;

-- SELECT: Users can see approved foods OR their own unapproved foods
CREATE POLICY "Foods Read Access" ON public.foods
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_approved = TRUE
      OR requested_by = auth.uid()
    )
  );

-- INSERT: Users can create their own foods (must be unapproved, must set requested_by)
CREATE POLICY "Users Create Custom Foods" ON public.foods
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_approved = FALSE
    AND requested_by = auth.uid()
  );

-- UPDATE: Users can only update their own unapproved foods
CREATE POLICY "Users Update Own Foods" ON public.foods
  FOR UPDATE
  USING (
    requested_by = auth.uid()
    AND is_approved = FALSE
  )
  WITH CHECK (
    requested_by = auth.uid()
    AND is_approved = FALSE
  );

-- DELETE: Users can only delete their own unapproved foods
CREATE POLICY "Users Delete Own Foods" ON public.foods
  FOR DELETE
  USING (
    requested_by = auth.uid()
    AND is_approved = FALSE
  );

-- ============================================================================
-- FOOD_PORTIONS TABLE - Updated Policies
-- ============================================================================

-- Drop the old public access policy
DROP POLICY IF EXISTS "Public Approved Food Portions Access" ON public.food_portions;

-- SELECT: Users can see portions for approved foods OR their own custom foods
CREATE POLICY "Food Portions Read Access" ON public.food_portions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND food_id IN (
      SELECT id FROM public.foods
      WHERE is_approved = TRUE OR requested_by = auth.uid()
    )
  );

-- INSERT: Users can add portions to their own custom foods only
CREATE POLICY "Users Create Custom Food Portions" ON public.food_portions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  );

-- UPDATE: Users can update portions of their own custom foods only
CREATE POLICY "Users Update Own Food Portions" ON public.food_portions
  FOR UPDATE
  USING (
    food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  )
  WITH CHECK (
    food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  );

-- DELETE: Users can delete portions of their own custom foods only
CREATE POLICY "Users Delete Own Food Portions" ON public.food_portions
  FOR DELETE
  USING (
    food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  );

-- ============================================================================
-- FOOD_ADDONS TABLE - Updated Policies
-- ============================================================================

-- Drop the old public access policy
DROP POLICY IF EXISTS "Public Approved Food Addons Access" ON public.food_addons;

-- SELECT: Users can see addons for approved foods OR their own custom foods
CREATE POLICY "Food Addons Read Access" ON public.food_addons
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND food_id IN (
      SELECT id FROM public.foods
      WHERE is_approved = TRUE OR requested_by = auth.uid()
    )
  );

-- INSERT: Users can add addons to their own custom foods only
CREATE POLICY "Users Create Custom Food Addons" ON public.food_addons
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  );

-- UPDATE: Users can update addons of their own custom foods only
CREATE POLICY "Users Update Own Food Addons" ON public.food_addons
  FOR UPDATE
  USING (
    food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  )
  WITH CHECK (
    food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  );

-- DELETE: Users can delete addons of their own custom foods only
CREATE POLICY "Users Delete Own Food Addons" ON public.food_addons
  FOR DELETE
  USING (
    food_id IN (
      SELECT id FROM public.foods
      WHERE requested_by = auth.uid() AND is_approved = FALSE
    )
  );

-- ============================================================================
-- NOTE: Admin policies remain unchanged from previous migration
-- Admins still have full access to all foods, portions, and addons
-- ============================================================================
