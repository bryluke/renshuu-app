CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'trainer', 'admin')),

  -- Profile Info --
  height_cm INT CHECK (height_cm > 0),
  weight_kg DECIMAL(5, 2) CHECK (weight_kg > 0),
  age INT CHECK (age > 0),
  activity_level VARCHAR CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_restrictions TEXT[], -- trainer notes: ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'nut_allergy', 'halal', etc.]

  -- Relationships --
  assigned_trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID, -- for future multi-business support

  -- Metadata --
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_trainer ON public.profiles(assigned_trainer_id);