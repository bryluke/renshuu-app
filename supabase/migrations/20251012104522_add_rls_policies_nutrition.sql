ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;

-- Policies for meals
-- clients/trainers/admin (meaning all auth): view/manage own meals
-- trainers: view clients' meals (read-only)
-- admins: full access
CREATE POLICY "Users can view and manage their own meals" ON public.meals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trainers can view their clients' meals" ON public.meals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = meals.user_id AND assigned_trainer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('trainer', 'admin')
      )
    )
  );

CREATE POLICY "Admins have full access to meals" ON public.meals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for meal_foods
-- if you can access the meal, you can access its foods
-- same pattern as meals
CREATE POLICY "Users can view and manage their own meal foods" ON public.meal_foods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE meals.id = meal_foods.meal_id AND meals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals
      WHERE meals.id = meal_foods.meal_id AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can view their clients' meal foods" ON public.meal_foods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meals
      JOIN public.profiles ON profiles.id = meals.user_id
      WHERE meals.id = meal_foods.meal_id AND profiles.assigned_trainer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('trainer', 'admin')
      )
    )
  );

CREATE POLICY "Admins have full access to meal foods" ON public.meal_foods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for user_goals
-- SELECT: own goals + trainer view clients' goals + admin
CREATE POLICY "Users can view their own goals" ON public.user_goals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Trainers can view their clients' goals" ON public.user_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_goals.user_id AND assigned_trainer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('trainer', 'admin')
      )
    )
  );

CREATE POLICY "Admins can view all user goals" ON public.user_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT/UPDATE/DELETE: own goals + trainer can manage clients' goals + admin
CREATE POLICY "Users can manage their own goals" ON public.user_goals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trainers can manage their clients' goals" ON public.user_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_goals.user_id AND assigned_trainer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('trainer', 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_goals.user_id AND assigned_trainer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('trainer', 'admin')
      )
    )
  );

CREATE POLICY "Admins can manage all user goals" ON public.user_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for daily_summaries
-- SELECT: own summaries + trainer view clients' summaries + admin
CREATE POLICY "Users can view their own daily summaries" ON public.daily_summaries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Trainers can view their clients' daily summaries" ON public.daily_summaries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = daily_summaries.user_id AND assigned_trainer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('trainer', 'admin')
      )
    )
  );

-- INSERT/UPDATE/DELETE: Users can manage their own (needed for triggers)
CREATE POLICY "Users can manage their own daily summaries" ON public.daily_summaries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins have full access to all summaries
CREATE POLICY "Admins can manage all daily summaries" ON public.daily_summaries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for food_requests
-- SELECT: own requests
CREATE POLICY "Users can view their own food requests" ON public.food_requests
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

-- UPDATE/DELETE: own requests only if status is 'pending' or 'needs_info'
CREATE POLICY "Users can update or delete own pending/needs_info food requests" ON public.food_requests
  FOR ALL
  TO authenticated
  USING (requested_by = auth.uid() AND status IN ('pending', 'needs_info'))
  WITH CHECK (requested_by = auth.uid() AND status IN ('pending', 'needs_info'));

-- ADMIN: view all, update status/notes
CREATE POLICY "Admins can view all food requests" ON public.food_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );