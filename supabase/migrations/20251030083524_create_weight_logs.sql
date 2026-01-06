-- Create weight_logs table for tracking body weight over time
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
  log_date DATE NOT NULL,
  notes TEXT, -- Optional notes (e.g., "morning weight", "after workout")

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One weight entry per user per day
  CONSTRAINT unique_weight_per_day UNIQUE (user_id, log_date)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, log_date DESC);

-- Enable RLS
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: Users see their own logs, trainers see clients' logs, admins see all
CREATE POLICY "Users can view their own weight logs" ON public.weight_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Trainers can view their clients' weight logs" ON public.weight_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = weight_logs.user_id
        AND assigned_trainer_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('trainer', 'admin')
        )
    )
  );

CREATE POLICY "Admins can view all weight logs" ON public.weight_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT/UPDATE/DELETE: Users manage their own logs, trainers can manage clients' logs, admins manage all
CREATE POLICY "Users can manage their own weight logs" ON public.weight_logs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trainers can manage their clients' weight logs" ON public.weight_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = weight_logs.user_id
        AND assigned_trainer_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('trainer', 'admin')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = weight_logs.user_id
        AND assigned_trainer_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('trainer', 'admin')
        )
    )
  );

CREATE POLICY "Admins can manage all weight logs" ON public.weight_logs
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

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weight_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_weight_logs_updated_at
  BEFORE UPDATE ON public.weight_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_weight_logs_updated_at();

-- Optional: Update profiles.weight_kg with latest weight
-- This keeps the profile table in sync with the most recent weight entry
CREATE OR REPLACE FUNCTION sync_profile_weight()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile with the latest weight only if this is the most recent entry
  UPDATE public.profiles
  SET
    weight_kg = NEW.weight_kg,
    updated_at = NOW()
  WHERE id = NEW.user_id
    AND (
      -- No existing weight_kg OR this is a newer entry
      weight_kg IS NULL
      OR NEW.log_date >= (
        SELECT COALESCE(MAX(log_date), '1900-01-01'::DATE)
        FROM public.weight_logs
        WHERE user_id = NEW.user_id
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_profile_weight
  AFTER INSERT OR UPDATE ON public.weight_logs
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_weight();
