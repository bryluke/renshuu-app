# React Contexts - Oct 2024

## Overview
Global state management using React Context API for theme, authentication, and drawer functionality.

## Implemented Contexts

### 1. ThemeContext
**File**: `src/contexts/ThemeContext.tsx`

Manages light/dark mode theme switching.

**Usage**:
```typescript
import { useTheme } from '@/contexts/ThemeContext';

function Component() {
  const { theme, toggleTheme } = useTheme();
  // theme: 'light' | 'dark'
}
```

**Provider Location**: Root layout (`src/app/layout.tsx`)

---

### 2. AuthContext
**File**: `src/contexts/AuthContext.tsx`

Manages user authentication state and profile data.

**Features**:
- Listens to Supabase auth state changes
- Auto-fetches user profile on login
- Provides sign-out functionality
- Loading states for auth checks

**Usage**:
```typescript
import { useAuth } from '@/contexts/AuthContext';

function Component() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>Hello {profile?.full_name}</div>;
}
```

**Type Safety**:
```typescript
type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;           // Supabase auth user
  profile: Profile | null;     // App-specific profile
  loading: boolean;
  signOut: () => Promise<void>;
}
```

**Provider Location**: Root layout (`src/app/layout.tsx`)

**Auth Flow**:
1. Component mounts → `useAuth()` called
2. Context checks session via `supabase.auth.getSession()`
3. If session exists → fetch profile from `profiles` table
4. Listen for auth changes via `onAuthStateChange`
5. On sign out → clear user and profile state

---

### 3. DrawerContext
**File**: `src/contexts/DrawerContext.tsx`

Global state for managing drawer visibility and data across the app.

**Features**:
- Single source of truth for drawer state
- Pass data between drawers
- Works across page navigation

**Drawer Types**:
```typescript
type DrawerType =
  | 'action-menu'   // Main action selection
  | 'meal-type'     // Breakfast/lunch/dinner/snack
  | 'food-search'   // Food search and selection
  | 'food-form'     // Portion and addon selection
  | 'weight-form'   // Weight logging
  | null;           // No drawer open
```

**Usage**:
```typescript
import { useDrawer } from '@/contexts/DrawerContext';

function Component() {
  const { drawerType, drawerData, openDrawer, closeDrawer } = useDrawer();

  // Open a drawer
  const handleClick = () => {
    openDrawer('meal-type');
  };

  // Open drawer with data
  const handleWithData = () => {
    openDrawer('food-search', { mealType: 'breakfast' });
  };

  // Close drawer
  const handleClose = () => {
    closeDrawer();
  };
}
```

**Data Flow Example**:
```typescript
// Step 1: Open meal type drawer
openDrawer('action-menu');

// Step 2: User selects "Log Meal" → open meal type drawer
openDrawer('meal-type');

// Step 3: User selects "Breakfast" → open food search with data
openDrawer('food-search', { mealType: 'breakfast' });

// Step 4: Access data in FoodSearchDrawer
const { drawerData } = useDrawer();
console.log(drawerData.mealType); // 'breakfast'
```

**Provider Location**: Root layout (`src/app/layout.tsx`)

**Why Global Context?**
- Drawers need to persist across page navigation
- Multiple components can trigger the same drawer
- Data needs to flow between different drawer types

---

## Context Provider Hierarchy

**File**: `src/app/layout.tsx`

```typescript
<ThemeProvider>
  <AuthProvider>
    <DrawerProvider>
      {children}
    </DrawerProvider>
  </AuthProvider>
</ThemeProvider>
```

**Order Matters**:
1. **ThemeProvider** - Outermost (no dependencies)
2. **AuthProvider** - Depends on Supabase client
3. **DrawerProvider** - May need auth state for protected actions

---

## Implementation Patterns

### Error Handling
All contexts throw error if used outside their provider:

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### State Management
- Contexts use `useState` for simple state
- No external state management library needed for MVP
- Future: Consider Zustand if complexity grows

### Performance
- Contexts split by concern to minimize re-renders
- Only components using a context re-render on state change
- DrawerContext changes don't affect AuthContext consumers

---

## Future Considerations

### Potential New Contexts
- **NotificationContext** - Toast/banner notifications
- **FilterContext** - Global filter state (date range, meal types)
- **OfflineContext** - Offline mode and sync state

### Performance Optimizations
If re-render issues arise:
- Split contexts further (e.g., AuthUserContext + AuthProfileContext)
- Use `useMemo` for context values
- Consider React Query for server state

---

## Related Documentation
- **Drawer System**: See `03-drawer-system.md`
- **Route Protection**: See `04-route-groups.md`
- **Supabase Client**: See `05-supabase-client.md`
