CREATE TABLE IF NOT EXISTS food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  food_name VARCHAR NOT NULL,
  description TEXT,
  where_found VARCHAR, -- e.g., restaurant name or brand

  status VARCHAR DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'needs_info')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL, -- if approved, link to created food

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookup of pending requests
CREATE INDEX IF NOT EXISTS idx_food_requests_status ON food_requests(status, created_at);