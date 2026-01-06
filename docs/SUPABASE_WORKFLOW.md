# Supabase Local Development Workflow

This document covers the local-first Supabase development workflow for Renshuu.

## Prerequisites

- [x] Supabase CLI installed (`brew install supabase/tap/supabase`)
- [x] Docker Desktop installed and running
- [ ] Supabase account (supabase.com)

## Initial Setup

### 1. Initialize Supabase in Project

```bash
# From project root
supabase init

# Creates:
# - supabase/config.toml
# - supabase/seed.sql
# - .gitignore entries
```

### 2. Login to Supabase

```bash
supabase login

# Opens browser for authentication
# Stores credentials locally
```

### 3. Link to Remote Project

**Option A: Link to existing project**
```bash
supabase link --project-ref your-project-ref

# Find project-ref in Supabase dashboard URL:
# https://supabase.com/dashboard/project/YOUR-PROJECT-REF
```

**Option B: Create new project**
```bash
# Create project via CLI
supabase projects create renshuu --org-id your-org-id

# Or create via dashboard and link after
```

### 4. Start Local Supabase

```bash
supabase start

# First run downloads Docker images (~5 min)
# Subsequent starts are much faster
```

**You'll get local credentials:**
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGci...
service_role key: eyJhbGci...
```

### 5. Configure Environment Variables

Create `.env.local` in project root:

```env
# Local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... # from supabase start output
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.production` for remote:

```env
# Production (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Day-to-Day Workflow

### Starting Work

```bash
# 1. Make sure Docker is running
# 2. Start local Supabase
supabase start

# 3. Start Next.js dev server (in another terminal)
npm run dev

# 4. Open Supabase Studio (optional)
open http://localhost:54323
```

### Creating Database Changes

#### Step 1: Create Migration File

```bash
# Create a new migration
supabase migration new descriptive_name

# Examples:
supabase migration new create_profiles_table
supabase migration new add_rls_policies_meals
supabase migration new add_food_portions_table

# Creates: supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

#### Step 2: Write SQL Migration

Edit the generated file in `supabase/migrations/`:

```sql
-- supabase/migrations/20250102120000_create_profiles_table.sql

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'trainer', 'owner_admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger for auto-create on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

#### Step 3: Apply Migration Locally

```bash
# Reset DB and apply all migrations (clean slate)
supabase db reset

# Or just apply new migrations
supabase migration up

# Check migration status
supabase migration list
```

#### Step 4: Test in Local Studio

```bash
# Open Studio
open http://localhost:54323

# Test:
# 1. Browse tables
# 2. Insert test data
# 3. Test RLS policies (simulate different users)
# 4. Check triggers work
```

#### Step 5: Test in Your App

```bash
# Run your Next.js app against local Supabase
npm run dev

# Test authentication, data fetching, etc.
```

#### Step 6: Push to Remote (when ready)

```bash
# Push migrations to remote Supabase
supabase db push

# This applies all new migrations to production
# BE CAREFUL - this affects live database!
```

### Working with Seed Data

Edit `supabase/seed.sql` for test data:

```sql
-- supabase/seed.sql

-- Insert test users (requires manual creation via auth first)
-- Then insert profile data

-- Insert test foods
INSERT INTO foods (name, category, subcategory) VALUES
  ('Hainanese Chicken Rice', 'hawker', 'rice_dishes'),
  ('Laksa', 'hawker', 'noodles'),
  ('Kaya Toast', 'breakfast', 'toast');

-- Insert portions
INSERT INTO food_portions (food_id, size_name, display_name, calories, protein_g, carbs_g, fat_g)
VALUES
  ((SELECT id FROM foods WHERE name = 'Hainanese Chicken Rice' LIMIT 1),
   'regular_plate', 'Regular Plate', 520, 32, 60, 15);
```

Apply seed data:

```bash
# Reset DB and run seeds
supabase db reset

# Seeds run automatically after migrations
```

## Common Commands

### Local Development

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Restart (preserves data)
supabase stop && supabase start

# Reset database (deletes all data, reapplies migrations + seeds)
supabase db reset

# View local services status
supabase status

# Open Studio
open http://localhost:54323

# View logs
supabase logs
```

### Migrations

```bash
# Create new migration
supabase migration new name

# List migrations
supabase migration list

# Apply new migrations
supabase migration up

# Revert last migration (local only)
supabase migration down

# Generate migration from remote changes (if you made manual changes)
supabase db diff --schema public

# Push to remote
supabase db push

# Pull from remote (overwrites local)
supabase db pull
```

### Database Operations

```bash
# Connect to local DB via psql
supabase db psql

# Dump local database
supabase db dump -f dump.sql

# Execute SQL file
psql postgresql://postgres:postgres@localhost:54322/postgres -f your_file.sql
```

### Type Generation

```bash
# Generate TypeScript types from database schema
supabase gen types typescript --local > src/types/database.ts

# For remote database
supabase gen types typescript --project-ref your-ref > src/types/database.ts
```

## Testing RLS Policies

### Method 1: Studio UI

1. Open http://localhost:54323
2. Go to Table Editor
3. Click "RLS Policies" tab
4. Use "View as" dropdown to simulate different users

### Method 2: SQL Editor

```sql
-- In Supabase Studio SQL Editor

-- Set role to simulate authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';

-- Test queries
SELECT * FROM meals; -- Should only see that user's meals

-- Reset
RESET ROLE;
```

### Method 3: Your App

Create test users with different roles and test actual app behavior.

## Syncing with Remote

### Pulling Changes from Remote

```bash
# If someone else made changes to production
# (or you made manual changes via dashboard)

# Pull remote schema
supabase db pull

# This creates a new migration with the diff
# Review it before committing!
```

### Pushing Changes to Remote

```bash
# Push local migrations to remote
supabase db push

# Verify in remote Studio
# Check Supabase dashboard > Database > Migrations
```

## Troubleshooting

### Docker Issues

```bash
# If services won't start
supabase stop
docker system prune -a
supabase start

# Check Docker Desktop is running
# Make sure ports 54321-54324 aren't in use
```

### Migration Issues

```bash
# If migration fails locally
supabase db reset  # Start fresh

# If migration fails on remote
# Fix the migration file
# Create a new migration to fix it
# Never edit already-pushed migrations
```

### RLS Lockout

```bash
# If you lock yourself out with RLS policies

# Local: just reset
supabase db reset

# Remote: use Supabase dashboard
# Go to SQL Editor, run as service_role:
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Fix your policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Port Conflicts

```bash
# If ports are already in use
# Edit supabase/config.toml

[api]
port = 54321  # Change these if needed

[db]
port = 54322

[studio]
port = 54323
```

## Best Practices

### Migration Files

✅ **DO:**
- Write idempotent migrations (use `IF NOT EXISTS`)
- Include both UP and DOWN logic (via separate migrations if needed)
- Keep migrations focused (one concern per file)
- Include RLS policies with table creation
- Test locally before pushing

❌ **DON'T:**
- Edit already-pushed migrations
- Make manual changes in production dashboard
- Push untested migrations to production
- Forget to enable RLS on new tables

### Workflow Tips

1. **Always test locally first**
   ```bash
   supabase db reset  # Fresh start
   npm run dev        # Test in app
   ```

2. **Commit migrations to git**
   ```bash
   git add supabase/migrations/*
   git commit -m "feat: add profiles table with RLS"
   ```

3. **Generate types after schema changes**
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   ```

4. **Use seed.sql for test data**
   - Don't rely on manual data entry
   - Reset often to test from clean state

5. **Document RLS policies**
   - Add comments explaining policy logic
   - Reference in CLAUDE.md or DB_SCHEMA.md

## Environment-Specific Workflows

### Local Development

```bash
# Use .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key

# Always run against local DB
supabase start
npm run dev
```

### Production Deployment

```bash
# Push migrations first
supabase db push

# Then deploy app to Vercel
# Vercel will use production env vars automatically
git push origin main
```

## Quick Reference

| Task | Command |
|------|---------|
| Start local DB | `supabase start` |
| Stop local DB | `supabase stop` |
| Reset local DB | `supabase db reset` |
| New migration | `supabase migration new name` |
| Apply migrations | `supabase migration up` |
| Push to remote | `supabase db push` |
| Pull from remote | `supabase db pull` |
| Generate types | `supabase gen types typescript --local` |
| Open Studio | `open http://localhost:54323` |
| View status | `supabase status` |

## Next Steps

Now that you have local Supabase set up:

1. Run `supabase init` if you haven't
2. Create your first migration from DB_SCHEMA.md
3. Test RLS policies locally
4. Push to remote when confident
5. Integrate with your Next.js app

Remember: **Local first, remote second. Test everything locally before pushing!**
