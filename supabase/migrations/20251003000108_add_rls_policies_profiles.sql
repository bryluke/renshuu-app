-- Enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SELECT: Users see own profile + trainers see their clients + admins see all
CREATE POLICY "User Profile Access" ON public.profiles
  FOR SELECT
  USING (
    -- Own profile
    auth.uid() = id
    OR
    -- Trainers see their assigned clients
    (
      assigned_trainer_id = auth.uid()
      AND public.get_user_role(auth.uid()) IN ('trainer', 'admin')
    )
    OR
    -- Admins see all
    public.get_user_role(auth.uid()) = 'admin'
  );

-- INSERT: Users can create their own profile only (handled by trigger)
CREATE POLICY "User Profile Insert" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
-- Note: The trigger function ensures users can only insert their own profile.

-- UPDATE: Users update own profile + trainers update clients' profiles + admins update all
CREATE POLICY "User Profile Update" ON public.profiles
  FOR UPDATE
  USING (
    -- Own profile
    auth.uid() = id
    OR
    -- Trainers update their assigned clients
    (
      assigned_trainer_id = auth.uid()
      AND public.get_user_role(auth.uid()) IN ('trainer', 'admin')
    )
    OR
    -- Admins update all
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    -- Prevent role escalations
    -- Users can't change their own roles
    (
      auth.uid() = id
      AND role = public.get_user_role(auth.uid())
    )
    OR
    -- Trainers can't change client roles or assign new trainers
    (
      assigned_trainer_id = auth.uid()
      AND role = 'client'
      AND public.get_user_role(auth.uid()) IN ('trainer', 'admin')
    )
    OR
    -- Admins can change everything
    public.get_user_role(auth.uid()) = 'admin'
  );