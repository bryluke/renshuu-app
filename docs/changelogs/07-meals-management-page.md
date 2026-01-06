# Meals Management Page - January 2025

## Overview

Complete implementation of the Meals management page, allowing users to view, add, edit, and delete meals for any date. This page extends the meal logging MVP by providing historical meal management with intelligent date navigation, 7-day data preloading for performance, and context-aware UI components.

The feature is designed with future extensibility in mind (meal templates, favorites, bulk operations) while maintaining a clean, focused MVP.

## What Changed

**Core Features:**
- Date navigation with arrow controls and native date picker
- Smart date labels (Today, Yesterday, Tomorrow)
- 7-day preload strategy for instant navigation
- On-demand loading for dates outside the 7-day window
- Daily nutrition summary breakdown (calories, protein, carbs, fats)
- Full CRUD operations for any date's meals
- Context-aware + button (respects selected date on /meals page)
- Empty state directing users to footer action button

**Footer Improvements:**
- Added "Meals" navigation item
- Implemented 2-1-2 layout (2 nav items, + button, 2 nav items)
- Fixed-width center button with proportional side navigation

## Implementation Details

### Date Navigation Component

The date navigation provides three ways to change dates:
1. Arrow buttons for previous/next day
2. Clickable date display that opens native date picker
3. Direct date selection from picker

```typescript
// Date info helper with smart labels
const getDateInfo = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateObj = new Date(date);
  selectedDateObj.setHours(0, 0, 0, 0);

  const formattedDate = date.toLocaleDateString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  let subtext = null;
  if (selectedDateObj.getTime() === today.getTime()) {
    subtext = 'Today';
  } else if (selectedDateObj.getTime() === yesterday.getTime()) {
    subtext = 'Yesterday';
  } else if (selectedDateObj.getTime() === tomorrow.getTime()) {
    subtext = 'Tomorrow';
  }

  return { formattedDate, subtext };
};
```

**Design Decision:** Date shown as primary text with contextual label (Today/Yesterday/Tomorrow) as colored subtext underneath for clarity.

### 7-Day Preload Strategy

Custom hook `useMealsData` implements intelligent caching:

```typescript
// src/hooks/useMealsData.ts
export function useMealsData(selectedDate: string): MealsData {
  const [cache, setCache] = useState<MealsCache>({});

  useEffect(() => {
    // On mount: Preload last 7 days (today - 6 days to today)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    fetchDateRange(startDate, endDate);
  }, [user?.id]);

  useEffect(() => {
    // On date change: Fetch if not in cache
    if (!cache[selectedDate]) {
      fetchSingleDate(selectedDate);
    }
  }, [selectedDate, user?.id]);
}
```

**Performance Benefits:**
- Recent dates (last 7 days) load instantly
- Single batch query on page load
- Progressive loading for older dates
- Cache persists during session

### Context-Aware Action Button

The footer + button adapts behavior based on current page:

```typescript
// src/components/drawers/ActionMenuDrawer.tsx
const handleSelectAction = (actionType: string) => {
  if (actionType === 'meal-type' && pathname === '/meals') {
    const selectedDate = (window as any).__selectedMealsDate;
    openDrawer(actionType as any, { targetDate: selectedDate });
  } else {
    openDrawer(actionType as any);
  }
};
```

**Flow:**
1. User clicks + button on /meals page with yesterday selected
2. ActionMenuDrawer checks pathname and passes `targetDate: yesterday`
3. MealTypeDrawer forwards `targetDate` to FoodSearchDrawer
4. FoodFormDrawer uses `targetDate` when creating meal
5. Both `__refetchTodayData` and `__refetchMealsData` called on save

### Footer Layout (2-1-2)

Fixed-width center button with flex side groups:

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navGroup {
  flex: 1; /* Equal space for left and right groups */
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}

.actionButton {
  flex: 0 0 56px; /* Fixed width, won't grow or shrink */
}

.navItem {
  flex: 1; /* Items within groups share space equally */
  max-width: 80px;
}
```

**Layout:** Home | Meals | + | [hidden placeholder] | Profile

### Data Flow & Refetching

Cross-page data consistency via global refetch functions:

```typescript
// Meals page exposes selected date
if (typeof window !== 'undefined') {
  (window as any).__selectedMealsDate = selectedDate;
  (window as any).__refetchMealsData = () => refetch(selectedDate);
}

// FoodFormDrawer refetches both pages
if (typeof window !== 'undefined') {
  if ((window as any).__refetchTodayData) {
    await (window as any).__refetchTodayData();
  }
  if ((window as any).__refetchMealsData) {
    await (window as any).__refetchMealsData();
  }
}
```

**Why:** Ensures meals added on /meals appear on /dashboard and vice versa.

## Usage

### Viewing Meals for a Date

```typescript
// Navigate to meals page
// Default: shows today's meals

// Use arrows to navigate days
handlePreviousDay(); // Goes to yesterday
handleNextDay(); // Goes to tomorrow

// Or click date to open picker
// Select any date from calendar
```

### Adding Meals for Any Date

```typescript
// On /meals page:
// 1. Select target date (e.g., yesterday)
// 2. Click + button in footer
// 3. Select "Log Meal"
// 4. MealTypeDrawer receives targetDate: yesterday
// 5. Complete flow → meal saved to yesterday
// 6. Both pages refetch automatically
```

### Edit/Delete Operations

```typescript
// Same as dashboard - reuses existing components
const handleEditFood = (food: MealFood) => {
  openDrawer('food-form', {
    isEdit: true,
    mealFoodId: food.id,
    foodId: food.food_id,
    foodName: food.food_name,
    portionId: food.portion_id,
    selectedAddons: food.selected_addons || [],
  });
};

const handleDeleteFood = async (mealFoodId: string) => {
  await supabase.from('meal_foods').delete().eq('id', mealFoodId);
  await refetch(selectedDate);
};
```

## Files Changed

**New Files - Hooks:**
- `src/hooks/useMealsData.ts` - Custom hook with 7-day preload and caching

**New Files - Pages:**
- `src/app/(protected)/meals/page.tsx` - Meals management page
- `src/app/(protected)/meals/page.module.css` - Page styles

**Modified Files - Layout:**
- `src/components/layout/Footer.tsx` - Added Meals nav item, 2-1-2 layout
- `src/components/layout/Footer.module.css` - Updated flex layout styles

**Modified Files - Drawers:**
- `src/components/drawers/ActionMenuDrawer.tsx` - Context-aware targetDate passing
- `src/components/drawers/MealTypeDrawer.tsx` - Forwards targetDate to food search
- `src/components/drawers/FoodFormDrawer.tsx` - Uses targetDate for meal creation, dual refetch

**Reused Components:**
- `src/components/meals/MealCard.tsx` - Used for displaying meal lists
- `src/lib/meals/grouping.ts` - Reused grouping and calculation utilities

## Testing

### Manual Testing Checklist

**Date Navigation:**
1. Default loads today's date with "Today" label
2. Previous day arrow shows "Yesterday" label
3. Next day arrow shows "Tomorrow" label
4. Dates beyond ±1 day show formatted date (e.g., "Mon, Jan 1")
5. Click date text opens native date picker
6. Selecting date from picker updates view

**7-Day Preload:**
1. Navigate to yesterday/2 days ago/etc. (within 7 days) → instant load
2. Navigate to 10 days ago → brief loading state, then data appears
3. Navigate back to recent date → instant (still cached)

**Context-Aware Actions:**
1. On /meals page, select yesterday
2. Click + button → select "Log Meal"
3. Complete flow → meal appears under yesterday
4. Navigate to /dashboard → yesterday's meal NOT shown
5. Add meal on /dashboard → appears in today
6. Back to /meals (today) → dashboard meal appears

**Empty States:**
1. Select date with no meals → "No meals logged yet" message
2. Shows hint: "Tap the + button below to get started"
3. No separate "+ Add Meal" button (cleaner UI)

**Summary Display:**
1. Date with meals shows summary card
2. Displays calories, protein, carbs, fats
3. Updates when meals edited/deleted
4. Hides when all meals deleted

**Cross-Page Consistency:**
1. Add meal on /meals (today) → appears on /dashboard
2. Delete meal on /dashboard → disappears from /meals
3. Edit meal on /meals → changes reflect on /dashboard

## Future Considerations

**Performance:**
- Consider replacing global window functions with proper event emitter or React Query
- Could extend preload window (e.g., 14 days) for power users
- Add optimistic updates for perceived instant feedback

**Features to Add:**
- **Meal Templates:** Save common meal combinations for quick logging
- **Copy Meals:** Duplicate yesterday's breakfast to today
- **Bulk Operations:** Delete all meals for a day, copy entire week
- **Meal Patterns:** "You usually log breakfast by 9am"
- **Calendar View:** Monthly view showing days with/without meals logged
- **Quick Stats:** "3-day streak", "Average daily calories this week"

**Code Improvements:**
- Extract date navigation into reusable component (could use for weight logs too)
- Create `useDateNavigation` hook to encapsulate date state and helpers
- Consider Zod schemas for drawer data validation
- Add unit tests for `useMealsData` caching logic
- Add E2E tests for cross-page consistency

**UX Enhancements:**
- Swipe gestures for prev/next day navigation
- Keyboard shortcuts (arrow keys for date navigation)
- "Jump to today" button when viewing old dates
- Visual indicator for days with meals (dots on calendar)

## Related Documentation

- `docs/changelogs/06-meal-logging.md` - Meal logging MVP and patterns
- `docs/changelogs/03-drawer-system.md` - Drawer architecture
- `docs/DB_SCHEMA.md` - Database schema for meals and summaries
- `CLAUDE.md` - Project status and architecture overview

## Key Takeaways

This feature demonstrates several important patterns:

1. **Smart Caching:** 7-day preload balances performance with memory usage
2. **Context Awareness:** UI components adapt behavior based on user location
3. **Component Reuse:** MealCard, grouping utilities work across dashboard and meals page
4. **Consistent Empty States:** Direct users to existing actions rather than duplicate buttons
5. **Cross-Page Data Flow:** Global refetch functions maintain consistency (temporary solution)
6. **Progressive Enhancement:** Load what's needed now, fetch more on demand
7. **Future-Proof Design:** Built with extensibility in mind (templates, favorites, etc.)

These patterns establish a foundation for other management pages (weight logs, workout history) and demonstrate how to build features that feel fast, intuitive, and maintainable.
