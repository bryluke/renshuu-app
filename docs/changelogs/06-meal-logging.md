# Meal Logging System - October 2024

## Overview

Complete implementation of the meal logging MVP for the dashboard. Users can search for foods, select portions and add-ons, log meals throughout the day, and view their daily nutrition summary grouped by meal type. The feature includes full CRUD operations (create, read, update, delete) with real-time nutrition calculations handled by database triggers.

This changelog also documents the refactoring patterns established during optimization that should be followed for all future features.

## What Changed

**Core Features:**
- Meal type selection (breakfast, lunch, dinner, snack)
- Server-side food search with debouncing
- Portion and add-on selection with live nutrition preview
- Today's meals view grouped by meal type
- Edit and delete functionality for individual food items
- Auto-calculated meal totals and daily summaries via database triggers

**Code Quality Improvements:**
- Domain-specific type definitions
- Extracted reusable components and utility functions
- Custom hooks for common patterns
- Improved type safety (eliminated all `any` types)
- Cleaner component architecture

## Implementation Details

### Database Flow

The meal logging system leverages PostgreSQL triggers for automatic calculations:

```sql
-- Trigger 1: Auto-calculate meal_food nutrition from portion + addons
CREATE TRIGGER trg_calculate_meal_food_nutrition
  BEFORE INSERT OR UPDATE ON meal_foods
  FOR EACH ROW EXECUTE FUNCTION calculate_meal_food_nutrition();

-- Trigger 2: Update meal totals when meal_foods change
CREATE TRIGGER trg_update_meal_totals
  AFTER INSERT OR UPDATE OR DELETE ON meal_foods
  FOR EACH ROW EXECUTE FUNCTION update_meal_totals();

-- Trigger 3: Update daily summaries when meals change
CREATE TRIGGER trg_update_daily_summary
  AFTER INSERT OR UPDATE OR DELETE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_daily_summary();
```

**Key Decision**: Triggers handle empty meal cleanup - when the last food is deleted from a meal, the trigger automatically deletes the meal row, which cascades to update the daily summary's `meals_logged` count.

### Drawer System Flow

The meal logging flow uses a multi-drawer pattern:

1. **Action Menu Drawer** → Select "Log Meal"
2. **Meal Type Drawer** → Select breakfast/lunch/dinner/snack
3. **Food Search Drawer** → Server-side search with debouncing
4. **Food Form Drawer** → Select portion and add-ons, see live nutrition total

Each drawer passes data forward using `drawerData`:

```typescript
// Meal Type → Food Search
openDrawer('food-search', {
  mealType: 'breakfast',
  mealId: existingMealId // or null for new meal
});

// Food Search → Food Form
openDrawer('food-form', {
  ...drawerData, // Preserves mealType and mealId
  foodId: selectedFood.id,
  foodName: selectedFood.display_name
});

// Edit Mode
openDrawer('food-form', {
  isEdit: true,
  mealFoodId: food.id,
  foodId: food.food_id,
  foodName: food.food_name,
  portionId: food.portion_id,
  selectedAddons: food.selected_addons || []
});
```

### Domain Types Pattern

**Pattern**: Create domain-specific type files instead of inline definitions.

```typescript
// src/types/meals.ts
import { Database } from './database.types';

export type Meal = Database['public']['Tables']['meals']['Row'];
export type MealFood = Database['public']['Tables']['meal_foods']['Row'];
export type DailySummary = Database['public']['Tables']['daily_summaries']['Row'];
export type UserGoal = Database['public']['Tables']['user_goals']['Row'];

export interface MealWithFoods extends Meal {
  meal_foods: MealFood[];
}

export interface GroupedMeals {
  [mealType: string]: MealWithFoods[];
}

export interface MealTypeTotals {
  mealType: string;
  meals: MealWithFoods[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}
```

**Why**:
- Single source of truth for domain models
- Easy to find and update types
- Prevents duplication across components
- Better IDE autocomplete and type inference

### Server-Side Search with Debouncing

**Pattern**: Always use server-side filtering with debouncing for search features.

```typescript
// src/hooks/useDebounce.ts - Reusable hook
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in FoodSearchDrawer
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebounce(searchQuery, 300);

useEffect(() => {
  if (isOpen && debouncedSearchQuery.length >= 2) {
    searchFoods(debouncedSearchQuery);
  }
}, [isOpen, debouncedSearchQuery]);

const searchFoods = async (query: string) => {
  const { data, error } = await supabase
    .from('foods')
    .select('id, display_name, category, subcategory, description')
    .eq('is_approved', true)
    .ilike('display_name', `%${query}%`)
    .order('display_name')
    .limit(50);

  setFoods(data || []);
};
```

**Why**:
- Scales to thousands of records (doesn't load all data upfront)
- Reduces unnecessary API calls
- Better user experience (no lag while typing)
- Lower bandwidth usage

### Utility Functions Pattern

**Pattern**: Extract complex calculations into pure, testable utility functions.

```typescript
// src/lib/meals/grouping.ts
export function groupMealsByType(meals: MealWithFoods[]): GroupedMeals {
  const mealsWithFoods = meals.filter(m => m.meal_foods && m.meal_foods.length > 0);

  return mealsWithFoods.reduce((acc, meal) => {
    if (!acc[meal.meal_type]) {
      acc[meal.meal_type] = [];
    }
    acc[meal.meal_type].push(meal);
    return acc;
  }, {} as GroupedMeals);
}

export function calculateMealTypeTotals(
  mealType: string,
  meals: MealWithFoods[]
): MealTypeTotals {
  const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs_g || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (m.total_fats_g || 0), 0);

  return { mealType, meals, totalCalories, totalProtein, totalCarbs, totalFats };
}

export function sortMealsByType(groupedMeals: GroupedMeals): MealTypeTotals[] {
  const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
  return MEAL_ORDER
    .filter(type => groupedMeals[type])
    .map(type => calculateMealTypeTotals(type, groupedMeals[type]));
}
```

**Why**:
- Pure functions are easy to test
- Logic can be reused across components
- Easier to understand and maintain
- Can be unit tested in isolation

### Component Extraction Pattern

**Pattern**: Extract complex rendering logic into dedicated components when JSX exceeds ~50 lines.

```typescript
// Before: Complex inline JSX in dashboard (150+ lines)
<div className={styles.mealsList}>
  {(() => {
    const grouped = meals.reduce(...); // Complex grouping logic
    return mealOrder.map(type => (
      <div key={type}>
        {/* 80+ lines of nested JSX */}
      </div>
    ));
  })()}
</div>

// After: Clean, declarative components
<div className={styles.mealsList}>
  {sortMealsByType(groupMealsByType(meals)).map((mealTypeTotals) => (
    <MealCard
      key={mealTypeTotals.mealType}
      mealTypeTotals={mealTypeTotals}
      onEditFood={handleEditFood}
      onDeleteFood={handleDeleteFood}
    />
  ))}
</div>

// src/components/meals/MealCard.tsx - Dedicated component
export function MealCard({ mealTypeTotals, onEditFood, onDeleteFood }: MealCardProps) {
  const { mealType, totalCalories, meals } = mealTypeTotals;
  const allFoods = meals.flatMap(meal => meal.meal_foods);

  return (
    <div className={styles.mealCard}>
      {/* Clean, focused rendering logic */}
    </div>
  );
}
```

**Why**:
- Improved readability
- Component can be reused (e.g., in meal history page)
- Easier to test and maintain
- Clearer separation of concerns

### Named Boolean Flags Pattern

**Pattern**: Extract complex boolean checks into named variables.

```typescript
// Before: Inline checks scattered throughout
useEffect(() => {
  if (drawerType === 'food-form' && drawerData?.isEdit) {
    // ...
  }
}, [drawerType, drawerData?.isEdit]);

return (
  <Drawer isOpen={drawerType === 'food-form'}>
    {drawerData?.isEdit ? 'Update' : 'Add to Meal'}
  </Drawer>
);

// After: Named boolean flags
const isOpen = drawerType === 'food-form';
const isEditMode = drawerData?.isEdit;

useEffect(() => {
  if (isOpen && isEditMode) {
    // ...
  }
}, [isOpen, isEditMode]);

return (
  <Drawer isOpen={isOpen}>
    {isEditMode ? 'Update' : 'Add to Meal'}
  </Drawer>
);
```

**Why**:
- Self-documenting code
- Easier to read and understand intent
- Reduces repetition
- Better for debugging

## Usage

### Logging a Meal

```typescript
// 1. User clicks "Log Meal" button
openDrawer('meal-type');

// 2. MealTypeDrawer: User selects meal type
const handleSelectMealType = async (mealType: string) => {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  // Check if meal already exists for today
  const { data: existingMeal } = await supabase
    .from('meals')
    .select('id')
    .eq('user_id', user.id)
    .eq('meal_type', mealType)
    .eq('meal_date', today)
    .maybeSingle();

  openDrawer('food-search', {
    mealType,
    mealId: existingMeal?.id || null
  });
};

// 3. FoodSearchDrawer: User searches and selects food
const handleSelectFood = (food: FoodSearchResult) => {
  openDrawer('food-form', {
    ...drawerData, // Includes mealType and mealId
    foodId: food.id,
    foodName: food.display_name
  });
};

// 4. FoodFormDrawer: User selects portion and add-ons
const handleSave = async () => {
  // Create meal if doesn't exist
  if (!drawerData.mealId) {
    const { data: meal } = await supabase
      .from('meals')
      .insert({ user_id, meal_type, meal_date })
      .select()
      .single();
    mealId = meal.id;
  }

  // Insert meal_food (triggers handle nutrition calculation)
  await supabase
    .from('meal_foods')
    .insert({
      meal_id: mealId,
      food_id: drawerData.foodId,
      portion_id: selectedPortion,
      selected_addons: selectedAddons
    });

  // Refetch dashboard data
  await refetch();
  closeDrawer();
};
```

### Editing a Meal Food

```typescript
// Dashboard: User clicks edit button
const handleEditFood = (food: MealFood) => {
  openDrawer('food-form', {
    isEdit: true,
    mealFoodId: food.id,
    foodId: food.food_id,
    foodName: food.food_name,
    portionId: food.portion_id,
    selectedAddons: food.selected_addons || []
  });
};

// FoodFormDrawer: Pre-populates selections, updates on save
useEffect(() => {
  if (!isOpen || portions.length === 0) return;

  if (isEditMode) {
    setSelectedPortion(drawerData.portionId || null);
    setSelectedAddons(drawerData.selectedAddons || []);
  } else {
    setSelectedPortion(portions[0].id);
    setSelectedAddons([]);
  }
}, [isOpen, isEditMode, portions]);

const handleSave = async () => {
  if (isEditMode) {
    await supabase
      .from('meal_foods')
      .update({
        portion_id: selectedPortion,
        selected_addons: selectedAddons
      })
      .eq('id', drawerData.mealFoodId);
  } else {
    // Insert logic...
  }
};
```

### Deleting a Meal Food

```typescript
const handleDeleteFood = async (mealFoodId: string) => {
  if (!confirm('Delete this food item?')) return;

  await supabase
    .from('meal_foods')
    .delete()
    .eq('id', mealFoodId);

  // Triggers automatically:
  // 1. Update meal totals
  // 2. Delete meal if no foods left
  // 3. Update daily summary

  await refetch();
};
```

## Files Changed

**New Files - Types:**
- `src/types/meals.ts` - Domain types for meal logging
- `src/types/foods.ts` - Domain types for food entities

**New Files - Hooks:**
- `src/hooks/useDebounce.ts` - Reusable debouncing hook
- `src/hooks/useTodayData.ts` - Custom hook for fetching today's meals/summary/goal

**New Files - Components:**
- `src/components/meals/MealCard.tsx` - Displays meal type with all foods
- `src/components/meals/MealCard.module.css` - Meal card styles

**New Files - Utilities:**
- `src/lib/meals/grouping.ts` - Meal grouping and calculation utilities

**Modified Files - Drawers:**
- `src/components/drawers/MealTypeDrawer.tsx` - Meal type selection
- `src/components/drawers/FoodSearchDrawer.tsx` - Server-side search with debouncing
- `src/components/drawers/FoodFormDrawer.tsx` - Portion/addon selection, edit mode support

**Modified Files - Dashboard:**
- `src/app/(protected)/dashboard/page.tsx` - Today's meals view, edit/delete handlers
- `src/app/(protected)/dashboard/page.module.css` - Dashboard styles

**Database:**
- `supabase/migrations/20251013095640_create_trigger_tally_meal_totals.sql` - Auto-delete empty meals

## Testing

### Manual Testing Checklist

**Create Flow:**
1. Click "Log Meal" → Select meal type
2. Search for food (test with < 2 characters, verify no search)
3. Select food → Choose portion and add-ons
4. Verify live nutrition updates as selections change
5. Click "Add to Meal"
6. Verify food appears in dashboard under correct meal type
7. Verify daily summary totals update

**Edit Flow:**
1. Click edit button (✎) on any food item
2. Verify current portion and add-ons are pre-selected
3. Change portion or add-ons
4. Verify live nutrition updates
5. Click "Update"
6. Verify changes reflected in dashboard
7. Verify totals recalculate correctly

**Delete Flow:**
1. Click delete button (×) on any food item
2. Confirm deletion
3. Verify food removed from dashboard
4. Add multiple foods to same meal type
5. Delete all foods one by one
6. Verify meal type card disappears when last food deleted
7. Verify `meals_logged` count decrements correctly

**Grouping:**
1. Log multiple foods to breakfast
2. Log foods to lunch
3. Verify foods grouped by meal type (not separate cards)
4. Verify totals calculated correctly per meal type

**Edge Cases:**
1. Log meal with no add-ons
2. Log meal with multiple add-ons
3. Edit meal to remove all add-ons
4. Search for non-existent food
5. Rapidly type in search (verify debouncing works)

## Future Considerations

**Performance:**
- Current refetch pattern uses `window.__refetchTodayData` - consider replacing with proper event emitter or React Query
- MealCard could be memoized if performance issues arise with large meal lists

**Features to Add:**
- **Meal History Page**: View/edit meals from different dates with calendar selector (already planned)
- **Bulk Actions**: Delete entire meal type at once
- **Duplicate Meal**: Copy food item to another meal or day
- **Recent Foods**: Show frequently logged foods at top of search
- **Favorites**: Mark foods as favorites for quick access
- **Meal Templates**: Save common meal combinations (e.g., "My Usual Breakfast")

**Code Improvements:**
- Create `useMealOperations` hook to encapsulate create/update/delete logic
- Extract nutrition calculation logic into utility function
- Add optimistic updates for better perceived performance
- Consider adding Zod schemas for runtime validation of drawer data

**Database Optimizations:**
- Add indexes on `meals.user_id + meal_date` for faster queries
- Add indexes on `foods.display_name` for faster search
- Consider materialized view for frequently accessed meal summaries

**Testing:**
- Add unit tests for utility functions (`grouping.ts`)
- Add integration tests for drawer flow
- Add E2E tests for complete meal logging journey

## Related Documentation

- `docs/DB_SCHEMA.md` - Database schema including meals, meal_foods, and triggers
- `docs/changelogs/03-drawer-system.md` - Drawer architecture and patterns
- `docs/changelogs/02-contexts.md` - DrawerContext usage
- `CLAUDE.md` - Project overview and current status

## Key Takeaways

This feature establishes several important patterns for the codebase:

1. **Domain Types First**: Always create type definitions before implementing features
2. **Server-Side Operations**: Filter, search, and paginate on the server, not client
3. **Debouncing**: Use custom hooks for reusable behavior like debouncing
4. **Utility Functions**: Extract business logic into pure functions
5. **Component Extraction**: Break down complex components into smaller, focused ones
6. **Type Safety**: No `any` types - use proper domain types throughout
7. **Named Booleans**: Make code self-documenting with descriptive variable names

These patterns should be followed for all future features to maintain code quality and consistency.
