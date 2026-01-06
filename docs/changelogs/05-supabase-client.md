# Supabase Client Setup - Oct 2024

## Overview
Singleton pattern for Supabase client to prevent multiple GoTrueClient instances. Solves webpack compatibility issues with Next.js 15.

## The Problem

### Multiple Client Instances
Initially, every component calling `createClient()` created a new Supabase instance:

```typescript
// ❌ Bad - Creates multiple instances
// AuthContext.tsx
const supabase = createClient(); // Instance #1

// dashboard/page.tsx
const supabase = createClient(); // Instance #2

// health/route.ts
const supabase = createClient(); // Instance #3
```

**Issues**:
- Multiple GoTrueClient instances warning
- Conflicting auth state
- One component logs out, others don't know
- Performance overhead

### Webpack Compatibility
Using `@supabase/ssr` caused webpack build errors with Next.js 15:
```
Unexpected end of JSON input
```

**Root Cause**: Node.js 23 + webpack + `@supabase/ssr` incompatibility

---

## The Solution

### 1. Singleton Pattern
**File**: `src/lib/supabase/client.ts`

```typescript
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseInstance;
}
```

**How It Works**:
1. First call → Creates instance, stores in `supabaseInstance`
2. Subsequent calls → Returns existing instance
3. Single auth state across entire app

### 2. Downgrade Supabase
Changed from `@supabase/supabase-js@2.56.1` to `@supabase/supabase-js@2.45.4`

**Why?**
- Version 2.45.4 is stable with Next.js 15
- Avoids webpack JSON parsing errors
- Still has all needed features for MVP

### 3. Remove @supabase/ssr
Switched from SSR-specific package to standard client:

```typescript
// ❌ Before
import { createBrowserClient } from '@supabase/ssr';

// ✅ After
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
```

**Trade-off**: Lose some SSR optimizations, but gain stability.

### 4. Webpack Configuration
**File**: `next.config.ts`

```typescript
webpack: (config, { isServer, webpack }) => {
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource: any) => {
      resource.request = resource.request.replace(/^node:/, "");
    })
  );

  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
  }

  return config;
},
transpilePackages: ['@supabase/supabase-js'],
```

**What This Does**:
- Replaces `node:` imports with standard imports
- Adds fallbacks for Node.js modules not available in browser
- Transpiles Supabase package for compatibility

---

## Usage

### Creating Client
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

### In Components
```typescript
'use client';

import { createClient } from '@/lib/supabase/client';

export default function Component() {
  const supabase = createClient();

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*');
  };
}
```

### In API Routes
```typescript
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('count');

  return Response.json({ data });
}
```

### Type Safety
Client is typed with generated database types:

```typescript
import { Database } from '@/types/database.types';

const supabase = createClient();
// supabase is typed as SupabaseClient<Database>

// Auto-complete for tables
supabase.from('meals')    // ✅ Valid
supabase.from('invalid')  // ❌ Type error

// Auto-complete for columns
const { data } = await supabase
  .from('profiles')
  .select('full_name, role'); // ✅ Valid columns
```

---

## Auth Integration

### AuthContext Usage
**File**: `src/contexts/AuthContext.tsx`

```typescript
const supabase = createClient();

// Get session
supabase.auth.getSession();

// Listen for changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth changes
});

// Sign out
supabase.auth.signOut();
```

**Key Benefit**: Single auth listener across entire app.

---

## Middleware Approach

### Simplified Middleware
**File**: `src/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}
```

**Why Simple?**
- Auth handled at layout level (client-side)
- Avoids SSR complications with Supabase
- Cleaner, more maintainable

**Trade-off**: No server-side auth checks in middleware.

**Why It's Okay for MVP**:
- RLS policies enforce security at database level
- Protected layout handles auth redirects
- Simpler debugging

---

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: `NEXT_PUBLIC_` prefix makes these available in browser.

**Security**: Anon key is safe to expose - RLS policies protect data.

---

## Common Patterns

### Query with RLS
```typescript
const supabase = createClient();

// RLS automatically filters to user's data
const { data: meals } = await supabase
  .from('meals')
  .select('*')
  .eq('user_id', user.id);
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('meals')
  .insert({
    user_id: user.id,
    meal_type: 'breakfast',
    meal_date: '2024-10-30',
  })
  .select()
  .single();
```

### Join Tables
```typescript
const { data } = await supabase
  .from('meals')
  .select(`
    *,
    meal_foods (
      *,
      foods (name)
    )
  `)
  .eq('meal_date', today);
```

### Real-time Subscriptions
```typescript
const channel = supabase
  .channel('meals-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'meals',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## Node Version Requirement

### .nvmrc File
```
22
```

**Why Node 22?**
- Node 23 has webpack compatibility issues
- Node 22 is LTS and stable
- Use `nvm use` to switch versions

### Checking Node Version
```bash
node --version
# Should output: v22.x.x
```

---

## Troubleshooting

### "Unexpected end of JSON input"
**Cause**: Using newer Supabase version or Node 23

**Fix**:
1. Check Node version: `node --version`
2. Switch to Node 22: `nvm use 22`
3. Downgrade Supabase if needed: `npm install @supabase/supabase-js@2.45.4`
4. Clear cache: `rm -rf .next node_modules/.cache`
5. Rebuild: `npm run build`

### Multiple GoTrueClient Instances Warning
**Cause**: Not using singleton pattern

**Fix**: Always import from `@/lib/supabase/client`, never create clients directly

### Auth Not Persisting
**Cause**: Multiple client instances

**Fix**: Ensure all code uses `createClient()` from centralized file

---

## Performance Considerations

### Single Instance Benefits
- ✅ Reduced memory usage
- ✅ Consistent auth state
- ✅ Single connection pool
- ✅ Fewer network requests

### When to Recreate Client
Generally never - singleton persists for app lifetime.

**Exception**: Server-side code where each request needs isolated client (not applicable with current setup).

---

## Future Enhancements

### Potential Improvements
- [ ] Add @supabase/ssr when Next.js 16 stabilizes
- [ ] Server-side auth checks in middleware
- [ ] Optimize for server components
- [ ] Add connection pooling for API routes

### Migration Path to SSR
When ready to add proper SSR:
1. Upgrade to stable `@supabase/ssr` version
2. Create separate server client utility
3. Update middleware for server-side auth
4. Test thoroughly

---

## Files Summary

### Core Files
- `src/lib/supabase/client.ts` - Singleton client
- `src/lib/env.ts` - Environment variable validation
- `next.config.ts` - Webpack configuration
- `src/middleware.ts` - Simplified middleware
- `.nvmrc` - Node version lock

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.45.4"
}
```

---

## Related Documentation
- **Database Schema**: See `docs/DB_SCHEMA.md`
- **Backend Setup**: See `01-backend-setup.md`
- **Contexts**: See `02-contexts.md`
- **Type Generation**: See `01-backend-setup.md`
