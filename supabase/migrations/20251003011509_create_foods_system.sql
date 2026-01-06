CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE,
  display_name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL, -- "chinese", "japanese", "italian", "mexican", "indian", "american", etc.
  subcategory VARCHAR, -- "rice", "noodles", "breakfast", "snack", "dairy", "fruit", "vegetable", "meat", "seafood", etc.

  is_approved BOOLEAN DEFAULT FALSE,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.food_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,

  name VARCHAR,
  display_name VARCHAR NOT NULL,

  -- Overall nutritional information for this portion size
  calories INT NOT NULL,
  protein_g DECIMAL(5, 2) NOT NULL,
  carbs_g DECIMAL(5, 2) NOT NULL,
  fats_g DECIMAL(5, 2) NOT NULL,
  fiber_g DECIMAL(5, 2) DEFAULT 0,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: same portion name allowed for different foods
  CONSTRAINT unique_portion_per_food UNIQUE (food_id, name)
);

CREATE TABLE IF NOT EXISTS public.food_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
  name VARCHAR,
  display_name VARCHAR NOT NULL,

  calories INT NOT NULL,
  protein_g DECIMAL(5, 2) NOT NULL,
  carbs_g DECIMAL(5, 2) NOT NULL,
  fats_g DECIMAL(5, 2) NOT NULL,
  fiber_g DECIMAL(5, 2) DEFAULT 0,

  category VARCHAR, -- "sauce", "topping", "side", etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: same addon name allowed for different foods
  CONSTRAINT unique_addon_per_food UNIQUE (food_id, name)
);

CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_approved ON public.foods(is_approved);

-- Trigger function to auto-generate slug
CREATE OR REPLACE FUNCTION generate_food_name_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate name from display_name if not provided
  IF NEW.name IS NULL OR NEW.name = '' THEN
    -- Check if display_name exists
    IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
      -- Fallback: use check_here + timestamp
      NEW.name := 'check_here_' || extract(epoch from now())::text;
    ELSE
      -- Generate slug from display_name
      NEW.name := lower(
        regexp_replace(
          regexp_replace(NEW.display_name, '[^a-zA-Z0-9\s]', '', 'g'),  -- Remove special chars
          '\s+', '_', 'g'  -- Replace spaces with underscores
        )
      );
      -- If slug is empty after processing, use fallback
      IF NEW.name = '' THEN
        NEW.name := 'check_here_' || extract(epoch from now())::text;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_food_name_slug
  BEFORE INSERT OR UPDATE ON public.foods
  FOR EACH ROW
  EXECUTE FUNCTION generate_food_name_slug();

CREATE TRIGGER set_food_portion_name_slug
  BEFORE INSERT OR UPDATE ON public.food_portions
  FOR EACH ROW
  EXECUTE FUNCTION generate_food_name_slug();

CREATE TRIGGER set_food_addon_name_slug
  BEFORE INSERT OR UPDATE ON public.food_addons
  FOR EACH ROW
  EXECUTE FUNCTION generate_food_name_slug();