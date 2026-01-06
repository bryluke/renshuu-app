CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  daily_calorie INT NOT NULL,
  daily_protein_g DECIMAL(5,2) NOT NULL,
  daily_carbs_g DECIMAL(5,2) NOT NULL,
  daily_fats_g DECIMAL(5,2) NOT NULL,
  daily_fiber_g DECIMAL(5,2) NOT NULL,

  set_by VARCHAR NOT NULL CHECK(set_by IN ('self', 'trainer')),
  set_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,

  start_date DATE NOT NULL,
  end_date DATE, -- NULL means ongoing
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,

  total_calories INT NOT NULL DEFAULT 0,
  total_protein_g DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_carbs_g DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_fats_g DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_fiber_g DECIMAL(5,2) NOT NULL DEFAULT 0,

  target_calories INTEGER,
  target_protein_g DECIMAL(5,2),
  target_carbs_g DECIMAL(5,2),
  target_fats_g DECIMAL(5,2),
  target_fiber_g DECIMAL(5,2),

  meals_logged INTEGER DEFAULT 0,
  days_since_last_log INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active, start_date);
  CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date);