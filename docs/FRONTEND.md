# Frontend Architecture

**Version:** 1.0 - Nutrition MVP
**Last Updated:** 2025-10-14

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript (strict mode)
- **Styling:** CSS Modules + vanilla CSS
- **State Management:** React Context (auth + profile) + component state
- **Database Client:** Supabase client-side
- **Auth:** Supabase Auth (magic link + Google OAuth)

## State Management Strategy

**Auth & Profile:** React Context
- `AuthContext` - current user session, login/logout methods
- `ProfileContext` - user profile data (fetched once on login)
- Supabase's `onAuthStateChange` listener wrapped in Context

**Server State:** Direct fetches with RLS
- Meal data, food data, goals - fetch fresh from DB
- RLS policies handle authorization at database level
- No need for complex client-side caching for MVP

**UI State:** Local component state
- Form inputs, drawer open/closed, loading states
- Keep it simple with `useState`

**Future consideration:** Add Zustand if we need complex client state

## Design Approach

**Mobile-first:** 320px - 768px
**Desktop (Phase 2):** Centered container with max-width (reusing mobile layout)

## Routes

### Public Routes (no footer)
```
/ → Landing page with auth CTA
/auth → Authentication (magic link or Google sign-in)
```

### Protected Routes (with persistent footer)
```
/dashboard → Main tracking view (donut chart + weight graph + quick stats)
/daily → Detailed daily breakdown (macros + weight + meals management)
/meals → Meal history (list of daily summaries, expandable to show meals)
/me → Profile page (weight history, profile updates, settings)
```

## Layout Structure

### Public Layout
```
┌─────────────────┐
│     Header      │ (optional, minimal)
├─────────────────┤
│                 │
│   Page Content  │
│                 │
└─────────────────┘
```

### Protected Layout
```
┌─────────────────┐
│   Page Content  │
│                 │
│                 │
├─────────────────┤
│     Footer      │ (persistent navigation)
└─────────────────┘
```

### Footer (Persistent Navigation)
```
┌─────────────────────────────┐
│  🏠     ● ACTION     👤      │
│ Home              Profile   │
└─────────────────────────────┘
```
- Left: Dashboard shortcut
- Center: Action button (main CTA)
- Right: Profile shortcut

## Action Button Flow

### Main Action Menu
```
Press Action Button →
┌─────────────────┐
│   [Log Meal]    │
│  [Log Weight]   │
└─────────────────┘
```

### Log Meal Flow
```
Select Meal Type →
┌─────────────────┐
│  [Breakfast]    │
│    [Lunch]      │
│   [Dinner]      │
│    [Snack]      │
└─────────────────┘

Shows TODAY's meal for selected type →
┌─────────────────────────┐
│ Hainanese Chicken Rice  │ ← Click to edit
│ 520 cal | 32g protein   │
├─────────────────────────┤
│    [+ Add Food]         │ ← Click to add new
└─────────────────────────┘
```

**Add/Edit Food Form:**
- Nearly identical forms
- Add: Empty fields
- Edit: Pre-filled with existing data
- Fields: Food search/select, portion, addons

### Log Weight Flow
```
Opens form →
- If weight entry exists for TODAY: Pre-filled (edit mode)
- If no entry: Empty (insert mode)
- Single input: weight_kg
- Save creates/updates today's weight log
```

## Meal History Interaction

From `/meals` page:
```
┌─────────────────────────┐
│  Oct 14, 2025           │ ← Click day card
│  1,850 cal | 3 meals    │
├─────────────────────────┤
│  Oct 13, 2025           │
│  2,100 cal | 4 meals    │
└─────────────────────────┘

Opens drawer with that day's meals →
┌─────────────────────────┐
│ Breakfast               │
│ • Chicken Rice (520cal) │ ← Click to edit
├─────────────────────────┤
│ Lunch                   │
│ • CKT (680cal)          │
└─────────────────────────┘
```

## Drawer Pattern

**Mobile:** Bottom sheet drawer (slides up from bottom)
- Overlay backdrop (tap to close)
- Swipe down to dismiss
- Max height: 80-90vh

**Desktop (Phase 2):** TBD - will differ from mobile for better UX

## Component Structure

### Core Components
```
components/
├── layout/
│   ├── PublicLayout.tsx
│   ├── ProtectedLayout.tsx
│   └── Footer.tsx
├── drawers/
│   ├── ActionMenuDrawer.tsx
│   ├── MealTypeDrawer.tsx
│   ├── MealDetailDrawer.tsx
│   ├── FoodFormDrawer.tsx
│   └── WeightFormDrawer.tsx
├── dashboard/
│   ├── DonutChart.tsx
│   ├── WeightGraph.tsx
│   └── QuickStats.tsx
├── daily/
│   ├── MacroBreakdown.tsx
│   ├── MealList.tsx
│   └── WeightDisplay.tsx
├── meals/
│   ├── DailySummaryCard.tsx
│   └── MealHistoryList.tsx
└── common/
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    └── LoadingSpinner.tsx
```

### Context Providers
```
contexts/
├── AuthContext.tsx    → Session, login, logout, user
├── ProfileContext.tsx → User profile data
└── DrawerContext.tsx  → Drawer state management (optional)
```

## Data Flow

### Authentication
1. User signs in via `/auth`
2. Supabase handles auth (magic link or Google)
3. `AuthContext` captures session via `onAuthStateChange`
4. Redirect to `/dashboard`
5. `ProfileContext` fetches user profile
6. All protected routes check auth state

### Meal Logging
1. User opens action button → selects "Log Meal" → selects meal type
2. Fetch today's meal for that type: `SELECT * FROM meals WHERE user_id = X AND meal_date = TODAY AND meal_type = Y`
3. Display meal_foods in cards
4. Add/Edit food → drawer opens with form
5. On save: `INSERT` or `UPDATE` meal_foods table
6. Triggers auto-calculate nutrition → meal totals → daily summary
7. Refetch and update UI

### Weight Logging
1. User opens action button → selects "Log Weight"
2. Check if weight exists for today (from profile updates or separate weight_logs table - TBD)
3. Pre-fill if exists, otherwise empty form
4. On save: Update profile or insert weight log
5. Refetch weight history for graphs

## Database Interaction

**All queries use Supabase client with RLS:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Example: Fetch today's meals
const { data, error } = await supabase
  .from('meals')
  .select('*, meal_foods(*)')
  .eq('user_id', user.id)
  .eq('meal_date', today)
```

RLS policies handle authorization - no manual permission checks needed in frontend.

## Error Handling

**Strategy:**
- Toast notifications for user-facing errors
- Console errors for debugging
- Graceful fallbacks (empty states, retry buttons)

**Common scenarios:**
- Network failures → Show retry button
- Auth expired → Redirect to login
- RLS violation → "Access denied" message
- Validation errors → Inline form errors

## Future Enhancements (Post-MVP)

- [ ] React Query for server state caching
- [ ] Optimistic updates for better UX
- [ ] Offline support (PWA)
- [ ] Desktop-specific layouts
- [ ] Admin portal (food management)
- [ ] Trainer dashboard
- [ ] Advanced analytics
- [ ] Export data functionality

---

## Notes

- Keep components small and focused
- Co-locate styles with components (CSS Modules)
- Use TypeScript strictly - leverage generated database types
- Mobile-first, always test on actual devices
- Prioritize performance (lazy load drawers, minimize re-renders)
