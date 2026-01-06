ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_portions ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view approved foods, portions, and addons
CREATE POLICY "Public Approved Foods Access" ON public.foods
  FOR SELECT
  USING (
    is_approved = TRUE
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Public Approved Food Addons Access" ON public.food_addons
  FOR SELECT
  USING (
    food_id IN (SELECT id FROM public.foods WHERE is_approved = TRUE)
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Public Approved Food Portions Access" ON public.food_portions
  FOR SELECT
  USING (
    food_id IN (SELECT id FROM public.foods WHERE is_approved = TRUE)
    AND auth.uid() IS NOT NULL
  );

-- ADMIN ALL: Admins can view, insert, update, and delete all foods, portions, and addons
CREATE POLICY "Admin Foods Full Access" ON public.foods
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

CREATE POLICY "Admin Food Addons Full Access" ON public.food_addons
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

CREATE POLICY "Admin Food Portions Full Access" ON public.food_portions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));