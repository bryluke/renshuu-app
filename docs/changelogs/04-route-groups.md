# Route Groups & Layout Architecture - Oct 2024

## Overview
Next.js 15 route groups for separating public and protected routes with distinct layouts. Auth protection at layout level instead of per-page.

## Route Group Structure

```
src/app/
├── layout.tsx              # Root layout (providers)
├── (public)/               # Public routes group
│   ├── layout.tsx         # Public layout (no footer)
│   ├── page.tsx           # Landing page (/)
│   └── auth/
│       └── page.tsx       # Auth page (/auth)
└── (protected)/           # Protected routes group
    ├── layout.tsx         # Protected layout (with footer + auth)
    ├── dashboard/
    │   └── page.tsx       # Dashboard (/dashboard)
    └── design-system/
        └── page.tsx       # Design system (/design-system)
```

**Key Concept**: Parentheses `(public)` and `(protected)` don't appear in URLs. They're purely for organization and applying different layouts.

---

## Root Layout

**File**: `src/app/layout.tsx`

### Purpose
- Provides global HTML structure
- Initializes context providers
- Loads fonts and global styles

### Context Provider Hierarchy
```typescript
<html lang="en">
  <body>
    <ThemeProvider>
      <AuthProvider>
        <DrawerProvider>
          {children}
        </DrawerProvider>
      </AuthProvider>
    </ThemeProvider>
  </body>
</html>
```

### Why This Order?
1. **ThemeProvider** - No dependencies
2. **AuthProvider** - Needs Supabase client
3. **DrawerProvider** - May need auth state

---

## Public Layout

**File**: `src/app/(public)/layout.tsx`

### Purpose
Minimal layout for unauthenticated users.

### Features
- No footer navigation
- No auth checks
- Clean passthrough

### Implementation
```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

### Routes
- `/` - Landing page
- `/auth` - Authentication (magic link + Google OAuth)

---

## Protected Layout

**File**: `src/app/(protected)/layout.tsx`

### Purpose
Layout for authenticated users with persistent footer navigation.

### Features
- Auth protection (redirects to `/auth` if not logged in)
- Persistent footer navigation
- Loading state while checking auth
- DrawerContainer for meal/weight logging

### Structure
```typescript
<div className={styles.container}>
  <main className={styles.main}>
    {children}
  </main>
  <Footer />
  <DrawerContainer />
</div>
```

### Auth Protection Logic
```typescript
const { user, loading } = useAuth();

useEffect(() => {
  if (!loading && !user) {
    router.push('/auth');
  }
}, [user, loading, router]);

if (loading) return <LoadingSpinner />;
if (!user) return null;
```

**Flow**:
1. Check if user is authenticated
2. Show loading state while checking
3. Redirect to `/auth` if not authenticated
4. Don't render protected content if no user

### Why at Layout Level?
- Centralized auth logic (no duplication per page)
- Automatic protection for all child routes
- Consistent loading/redirect behavior
- Footer and drawers always available

### Routes
- `/dashboard` - Main dashboard
- `/daily` - Daily detailed view (future)
- `/meals` - Meal history (future)
- `/me` - Profile page (future)

---

## Footer Navigation

**File**: `src/components/layout/Footer.tsx`

### Design
Mobile-first persistent bottom navigation.

### Structure
```
┌─────────────────────────────┐
│  🏠      ● +       👤       │
│ Home              Profile   │
└─────────────────────────────┘
```

### Navigation Items
- **Home** (`/dashboard`) - Dashboard link
- **+ Button** - Opens ActionMenuDrawer
- **Profile** (`/me`) - Profile link

### Features
- Fixed position (z-index: 1100)
- Active state highlighting
- 80px height
- Max-width: 768px (mobile-first)

### Why Persistent?
- Always accessible for quick actions
- No navigation chrome needed in pages
- More screen space for content

---

## Mobile-First Constraints

### Container Max-Width
Both layouts use max-width constraints:

```css
.main {
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
}
```

**Why 768px?**
- Optimal for mobile/tablet portrait
- Readable content width
- Desktop: centered with margins

### Padding for Footer
Protected layout adds bottom padding:

```css
.container {
  min-height: 100vh;
  padding-bottom: 80px; /* Footer height */
}
```

Prevents content from being hidden behind fixed footer.

---

## Layout Comparison

| Feature | Public Layout | Protected Layout |
|---------|---------------|------------------|
| Footer | ❌ No | ✅ Yes |
| Auth Check | ❌ No | ✅ Yes |
| Drawers | ❌ No | ✅ Yes |
| Max Width | None | 768px |
| Loading State | ❌ No | ✅ Yes |

---

## Auth Flow Diagram

```
User navigates to /dashboard
  ↓
Protected Layout mounts
  ↓
Check auth via AuthContext
  ↓
┌─────────────┐
│ Is loading? │ → Yes → Show loading spinner
└─────────────┘
  ↓ No
┌─────────────┐
│ Is user?    │ → No → Redirect to /auth
└─────────────┘
  ↓ Yes
Render page + footer + drawers
```

---

## Adding New Routes

### Public Route
1. Create `src/app/(public)/route-name/page.tsx`
2. No auth checks needed
3. No footer automatically

### Protected Route
1. Create `src/app/(protected)/route-name/page.tsx`
2. Auth protection automatic
3. Footer + drawers automatic
4. Access `useAuth()` for user data

### Example: New Protected Route
```typescript
// src/app/(protected)/meals/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MealsPage() {
  const { profile } = useAuth();

  return (
    <div>
      <h1>Meal History for {profile?.full_name}</h1>
      {/* Content */}
    </div>
  );
}
```

No auth checks needed - layout handles it!

---

## Benefits of This Architecture

### Developer Experience
- ✅ No repeated auth logic per page
- ✅ Clear separation of public/protected
- ✅ Automatic footer on protected routes
- ✅ Consistent loading/error states

### User Experience
- ✅ Persistent navigation
- ✅ Fast auth checks
- ✅ Smooth redirects
- ✅ No layout shift

### Maintainability
- ✅ Single source of truth for auth
- ✅ Easy to add new routes
- ✅ Centralized layout logic
- ✅ Type-safe with TypeScript

---

## Common Patterns

### Access User in Protected Page
```typescript
const { user, profile } = useAuth();
// Always available, no null checks needed
```

### Open Drawer from Any Protected Page
```typescript
const { openDrawer } = useDrawer();
openDrawer('meal-type');
```

### Navigate Between Routes
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
```

---

## Files Summary

### New Files
- `src/app/(public)/layout.tsx` - Public layout
- `src/app/(protected)/layout.tsx` - Protected layout
- `src/app/(protected)/layout.module.css` - Protected layout styles
- `src/components/layout/Footer.tsx` - Footer navigation
- `src/components/layout/Footer.module.css` - Footer styles

### Moved Files
- `src/app/page.tsx` → `src/app/(public)/page.tsx`
- `src/app/auth/page.tsx` → `src/app/(public)/auth/page.tsx`
- `src/app/dashboard/page.tsx` → `src/app/(protected)/dashboard/page.tsx`

### Modified Files
- `src/app/layout.tsx` - Added DrawerProvider

---

## Related Documentation
- **Contexts**: See `02-contexts.md`
- **Drawer System**: See `03-drawer-system.md`
- **Frontend Architecture**: See `docs/FRONTEND.md`
