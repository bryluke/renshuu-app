# Backend Setup & Database - Oct 2024

## Overview
Supabase backend with PostgreSQL database, Row Level Security (RLS), and automatic triggers for data consistency. All schema and migrations are version-controlled.

## Database Schema
**Primary Reference**: See `docs/DB_SCHEMA.md` for complete schema documentation.

### Core Tables
- **`profiles`** - User profiles extending Supabase auth
- **`foods`, `food_portions`, `food_addons`** - Modular food system
- **`meals`, `meal_foods`** - Nutrition logging
- **`user_goals`** - Nutritional targets
- **`daily_summaries`** - Aggregated daily stats
- **`weight_logs`** - Weight tracking over time
- **`food_requests`** - Crowdsourced food additions

## Migration Flow

### Location
All migrations are in `supabase/migrations/` with timestamp-based naming:
```
supabase/migrations/
├── 20251002110022_create_profiles_table.sql
├── 20251003000108_add_rls_policies_profiles.sql
├── 20251003011509_create_foods_system.sql
├── 20251012085500_add_rls_policies_foods.sql
├── 20251012094958_create_meal_logging.sql
├── 20251012100617_create_goals_and_tracking.sql
├── 20251012102833_create_food_requests.sql
├── 20251012104522_add_rls_policies_nutrition.sql
├── 20251013095640_create_trigger_tally_meal_totals.sql
├── 20251013111733_create_trigger_tabulate_daily_summaries.sql
└── 20251030083524_create_weight_logs.sql
```

### Migration Pattern
Each migration follows this structure:
1. **Create tables** with constraints and indexes
2. **Enable RLS** on all tables
3. **Add RLS policies** for access control
4. **Create triggers/functions** for auto-calculations

### How It Works
1. Create new migration file with timestamp
2. Write SQL for schema changes + RLS policies
3. Apply locally: `supabase db reset` or `supabase migration up`
4. Regenerate types: `supabase gen types typescript --local > src/types/database.types.ts`
5. Commit migration file and updated types

## Row Level Security (RLS)

### Philosophy
Secure by default - all permissions enforced at database layer.

### Access Patterns
- **Clients**: See only their own data
- **Trainers**: See assigned clients' data (read-only for meals)
- **Admins**: Full access to everything

### Policy Examples
See individual migration files for specific policies. General pattern:
```sql
-- Users can view their own data
CREATE POLICY "policy_name" ON table_name
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

## Database Triggers

### Auto-Calculation Triggers
**Purpose**: Keep denormalized totals in sync

1. **`trg_calculate_meal_food_nutrition`**
   - Calculates nutrition from portion + addons
   - Auto-fills display names for history

2. **`trg_update_meal_totals`**
   - Updates `meals.total_*` when `meal_foods` change
   - Triggered on INSERT/UPDATE/DELETE

3. **`trg_update_daily_summary`**
   - Updates `daily_summaries` when meals change
   - Pulls active goals for target comparison

4. **`trg_sync_profile_weight`**
   - Syncs latest weight to `profiles.weight_kg`
   - Updates only if newest entry

### Naming Convention Triggers
- **`generate_name_slug()`** - Auto-generates URL-safe slugs from display names
- Applied to `foods`, `food_portions`, `food_addons`

## Type Generation

### Database Types
TypeScript types are auto-generated from the database schema.

**File**: `src/types/database.types.ts`

### Usage in Code
```typescript
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type MealInsert = Database['public']['Tables']['meals']['Insert'];
```

### When to Regenerate
After any migration that changes:
- Table structure
- Column types
- New tables

**Command**:
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

## Seed Data

**File**: `supabase/seed.sql`

Contains sample data for development:
- Test foods (Hainanese Chicken Rice, Char Kway Teow)
- Food portions and addons
- Ready-to-use for testing food logging

Applied automatically on `supabase db reset`.

## Local Development Flow

1. **Make database changes** → Create migration file
2. **Apply migration** → `supabase db reset` or `supabase migration up`
3. **Regenerate types** → Run type generation command
4. **Test locally** → Verify changes work
5. **Commit** → Migration file + updated types

## Access Points

### Supabase Studio (Local)
- URL: `http://localhost:54323`
- Visual database editor
- Run SQL queries
- View table data

### Supabase Client (Code)
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('meals')
  .select('*')
  .eq('user_id', userId);
```

## Related Documentation
- **Schema Details**: `docs/DB_SCHEMA.md`
- **Supabase Workflow**: `docs/SUPABASE_WORKFLOW.md`
- **Supabase Client**: See changelog `05-supabase-client.md`
