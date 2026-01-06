# RefreshContext - Cross-Component Data Refresh

**Date:** December 2025

## Overview

Refactored the cross-component data refresh pattern from global window functions to a type-safe React Context with pub/sub pattern. This provides cleaner code, better type safety, and proper React lifecycle management.

---

## Background: The Problem

When a drawer saves data (e.g., `FoodFormDrawer` saves a meal), the page that opened it needs to refresh its data to show the changes.

**The architectural challenge:**

```
Layout (root)
├── DrawerContainer (renders all drawers)
│   └── FoodFormDrawer (saves meal data)
│
└── Page slot
    └── /dashboard (needs to refresh after save)
```

The drawer and the page have no parent-child relationship. React's normal data flow (props down, callbacks up) doesn't work across this boundary.

---

## Previous Approach: Global Window Functions

### How It Worked

Pages registered refetch functions on the global `window` object:

```typescript
// In dashboard/page.tsx
if (typeof window !== 'undefined') {
  (window as any).__refetchTodayData = refetch;
}
```

Drawers called these functions after saving:

```typescript
// In FoodFormDrawer.tsx
if (typeof window !== 'undefined') {
  if ((window as any).__refetchTodayData) {
    await (window as any).__refetchTodayData();
  }
  if ((window as any).__refetchMealsData) {
    await (window as any).__refetchMealsData();
  }
}
```

### Why It Was Used

- Quickest path to "working" during MVP development
- No dependencies, no complex setup
- Simple mental model: "page says how to refresh itself, drawer calls it"
- Valid for rapid prototyping—get it working first, clean up later

### Problems

| Issue | Description |
|-------|-------------|
| Type-unsafe | `as any` everywhere, no autocomplete, typos fail silently |
| No existence guarantee | If page hasn't mounted yet, function doesn't exist |
| Single subscriber | Only one page can register `__refetchMealsData` at a time |
| Global namespace pollution | Attaching arbitrary properties to window |
| Memory leaks | Pages don't always clean up their registered functions |
| Not testable | Relies on global state |
| Coupling via strings | `"__refetchTodayData"` is a magic string with no type checking |

---

## Current Approach: RefreshContext with Pub/Sub

### Architecture

```typescript
// Types (src/contexts/RefreshContext.tsx)
type RefreshEvent = 'today' | 'meals' | 'weight' | 'goals' | 'profile';
type RefreshCallback = () => void | Promise<void>;
```

**Provider** maintains a `Map<RefreshEvent, Set<RefreshCallback>>` to track subscriptions.

**Two hooks:**
- `useRefreshSubscription(event, callback)` — For pages to subscribe
- `useRefresh()` — For drawers to get `emit` function

### Usage

**Pages subscribe to events:**

```typescript
// In dashboard/page.tsx
import { useRefreshSubscription } from '@/contexts/RefreshContext';

const { refetch } = useTodayData();
useRefreshSubscription('today', refetch);
```

**Drawers emit events after save:**

```typescript
// In FoodFormDrawer.tsx
import { useRefresh } from '@/contexts/RefreshContext';

const { emit } = useRefresh();

const handleSave = async () => {
  // ... save logic ...
  await emit('today');
  await emit('meals');
  closeDrawer();
};
```

### Benefits

| Benefit | Description |
|---------|-------------|
| Type-safe | `RefreshEvent` union type prevents typos, enables autocomplete |
| Proper lifecycle | Subscribe on mount, auto-unsubscribe on unmount via useEffect |
| Multiple subscribers | Multiple pages/components can listen to same event |
| React-idiomatic | Uses Context, follows React patterns |
| No global pollution | No window properties |
| Testable | Can mock context in tests |
| Stable callbacks | `callbackRef` pattern ensures latest callback is called without re-subscribing |

---

## Implementation Details

### RefreshContext.tsx

Key design decisions:

1. **`useRef` for subscribers** — Avoids re-renders when subscriptions change. The subscriber map is internal state that doesn't affect UI.

2. **`Set<RefreshCallback>`** — Allows multiple subscribers to the same event, O(1) add/remove.

3. **`callbackRef` pattern in `useRefreshSubscription`** — Keeps subscription stable while always calling the latest callback. Without this, the effect would re-run every time the callback identity changed.

4. **`Promise.all` in emit** — Handles both sync and async callbacks, waits for all to complete.

### Event Names

| Event | Emitted By | Subscribed By |
|-------|------------|---------------|
| `today` | `FoodFormDrawer` | `/dashboard` |
| `meals` | `FoodFormDrawer` | `/meals` |
| `weight` | `WeightFormDrawer` | `/me` |
| `goals` | `GoalsFormDrawer` | `/me` |
| `profile` | `ProfileFormDrawer` | `/me` |

---

## Files Changed

**New:**
- `src/contexts/RefreshContext.tsx` — The context, provider, and hooks

**Modified:**
- `src/app/layout.tsx` — Added `RefreshProvider`
- `src/app/(protected)/dashboard/page.tsx` — Use `useRefreshSubscription`
- `src/app/(protected)/meals/page.tsx` — Use `useRefreshSubscription`
- `src/app/(protected)/me/page.tsx` — Use `useRefreshSubscription` (3 events)
- `src/components/drawers/FoodFormDrawer.tsx` — Use `emit`
- `src/components/drawers/WeightFormDrawer.tsx` — Use `emit`
- `src/components/drawers/ProfileFormDrawer.tsx` — Use `emit`
- `src/components/drawers/GoalsFormDrawer.tsx` — Use `emit`
- `CLAUDE.md` — Updated reusable patterns table

---

## Current Limitations

1. **No payload support** — Events are just notifications, no data passed. If a drawer needs to tell the page *what* changed, it can't. For now, pages just refetch everything.

2. **No priority/ordering** — All subscribers called in parallel via `Promise.all`. If order matters, this doesn't support it.

3. **Still manual** — Developers must remember to emit events after mutations. No automatic cache invalidation.

4. **No deduplication** — If `emit('meals')` is called twice quickly, subscribers run twice.

5. **Remaining `window.__selectedMealsDate`** — The date-passing pattern for meals page wasn't refactored (it's data sharing, not refresh). This is a separate concern.

---

## When to Upgrade

Consider upgrading to **React Query / TanStack Query** when:

1. **Cache becomes important** — You need to cache API responses and avoid refetching data that hasn't changed.

2. **Optimistic updates** — You want UI to update immediately before server confirms.

3. **Loading/error states** — You need consistent loading/error handling across many components.

4. **Pagination/infinite scroll** — You're building complex data fetching patterns.

5. **Stale-while-revalidate** — You want to show cached data while fetching fresh data.

6. **Multiple components sharing data** — More than 2-3 components need the same server data.

**Signs you've outgrown RefreshContext:**
- Adding more than 10-15 event types
- Needing to pass data with events
- Wanting automatic refetch on window focus
- Complex dependencies between data (e.g., "when meals change, also refresh summary")

At that point, React Query's query invalidation and cache management will save significant complexity.

---

## Related Documentation

- `docs/changelogs/02-contexts.md` — Other context patterns (Auth, Theme, Drawer)
- `docs/changelogs/03-drawer-system.md` — Drawer architecture
- `docs/changelogs/06-meal-logging.md` — Original implementation with window pattern
