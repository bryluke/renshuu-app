# Custom Foods System - December 2025

## Overview

Implementation of a MyFitnessPal-style custom food system. Users can create their own foods with nutritional data that only they can see. Admins can approve foods to make them publicly available. Also includes seed data for 69 Singapore foods and improved food search UX.

## What Changed

- **Seed Data**: 69 foods with full nutritional data (hawker, drinks, fast food, basics)
- **Custom Food Creation**: Users can create their own foods when search yields no results
- **RLS Visibility**: Custom foods only visible to creator until admin approves
- **Recent Foods**: Food search shows last 8 logged foods for quick access
- **Search UX**: Added X button to clear search, auto-clears on drawer close

---

## Implementation Details

### Seed Data Structure

The `supabase/seed.sql` file contains 69 foods organized by category:

| Category | Count | Examples |
|----------|-------|----------|
| Hawker | 33 | Chicken rice, laksa, bak chor mee, prata, dim sum |
| Drinks | 16 | Kopi/teh variations, milo, bubble tea |
| Fast Food | 10 | McDonald's, KFC |
| Basics | 10 | Rice, eggs, grilled chicken, tofu |

Each food includes:
- Multiple portions with full macros (calories, protein, carbs, fats)
- Common addons where applicable (extra chicken, sauces, toppings)

Sources: HPB HealthHub, HealthXchange.sg, McDonald's SG Nutrition Calculator

### RLS Policies for Custom Foods

The key insight: use `requested_by` field (already exists) as the "creator" field.

```sql
-- Users can see approved foods OR their own unapproved foods
CREATE POLICY "Foods Read Access" ON public.foods
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_approved = TRUE
      OR requested_by = auth.uid()
    )
  );

-- Users can create their own foods (must be unapproved)
CREATE POLICY "Users Create Custom Foods" ON public.foods
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND is_approved = FALSE
    AND requested_by = auth.uid()
  );

-- Users can only update/delete their own unapproved foods
CREATE POLICY "Users Update Own Foods" ON public.foods
  FOR UPDATE
  USING (requested_by = auth.uid() AND is_approved = FALSE)
  WITH CHECK (requested_by = auth.uid() AND is_approved = FALSE);
```

Same pattern applied to `food_portions` and `food_addons` (tied to food ownership).

### Custom Food Form (Simple MVP)

The `CustomFoodFormDrawer` collects minimal info:
- Food name (required)
- Single portion with: name, calories, protein, carbs, fats
- Category defaults to "custom"

```typescript
// Create food and portion in one flow
const { data: food } = await supabase
  .from('foods')
  .insert({
    display_name: foodName.trim(),
    category: 'custom',
    is_approved: false,
    requested_by: user.id,
  })
  .select()
  .single();

await supabase
  .from('food_portions')
  .insert({
    food_id: food.id,
    display_name: portionName,
    calories: caloriesNum,
    protein_g: proteinNum,
    carbs_g: carbsNum,
    fats_g: fatsNum,
  });

// Redirect to FoodFormDrawer with new food
openDrawer('food-form', {
  ...drawerData,
  foodId: food.id,
  foodName: food.display_name,
});
```

### Recent Foods Query

Fetches last 8 unique foods the user has logged, joining through `meals` table:

```typescript
const { data } = await supabase
  .from('meal_foods')
  .select(`
    food_id,
    food_name,
    created_at,
    meals!inner(user_id)
  `)
  .eq('meals.user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50);

// Deduplicate and take first 8
const uniqueFoods = data
  .filter(item => item.food_id !== null)
  .reduce((acc, item) => {
    if (!acc.some(f => f.food_id === item.food_id)) {
      acc.push({ food_id: item.food_id, food_name: item.food_name });
    }
    return acc;
  }, [])
  .slice(0, 8);
```

---

## Usage

### Creating a Custom Food

```typescript
// Opens when user clicks "Create custom food" in search
openDrawer('custom-food-form', {
  ...drawerData,
  suggestedName: searchQuery, // Pre-fill with search query
});
```

### User Flow

```
User searches "Nasi Padang"
       ↓
No results found
       ↓
"+ Create Nasi Padang" button
       ↓
CustomFoodFormDrawer opens (name pre-filled)
       ↓
User enters portion + macros
       ↓
Saves → redirects to FoodFormDrawer
       ↓
User logs the meal
       ↓
Food available in future searches
```

---

## Files Changed

**New Files:**
- `supabase/migrations/20251220170000_user_custom_foods_rls.sql` - RLS policies
- `src/components/drawers/CustomFoodFormDrawer.tsx` - Custom food form
- `src/components/drawers/CustomFoodFormDrawer.module.css` - Styles

**Modified Files:**
- `supabase/seed.sql` - 69 foods with portions and addons
- `src/components/drawers/FoodSearchDrawer.tsx` - Recent foods, X button, create option
- `src/components/drawers/FoodSearchDrawer.module.css` - New styles
- `src/contexts/DrawerContext.tsx` - Added `custom-food-form` drawer type
- `src/components/drawers/DrawerContainer.tsx` - Registered new drawer
- `src/types/database.types.ts` - Regenerated

---

## Testing

### Manual Testing Checklist

**Seed Data:**
1. Run `supabase db reset` to apply seed data
2. Open food search → verify foods appear (chicken rice, laksa, etc.)
3. Verify portions have correct macros

**Custom Food Creation:**
1. Search for a food that doesn't exist
2. Click "Create [food name]" button
3. Fill in portion details and save
4. Verify redirects to FoodFormDrawer
5. Complete meal logging
6. Search again → custom food should appear

**RLS Visibility:**
1. Create custom food as User A
2. Log in as User B → custom food should NOT appear in search
3. Log in as Admin → should see all foods including unapproved

**Recent Foods:**
1. Log a few meals with different foods
2. Open food search with empty query
3. Verify "Recent" section shows last logged foods

---

## Future Considerations

**Enhancements:**
- Edit existing custom foods (add more portions, addons)
- Admin dashboard to review and approve foods
- Bulk approve frequently-used custom foods
- Show "custom" badge on user-created foods

**Known Limitations:**
- Only one portion per custom food (MVP simplification)
- No addons support for custom foods yet
- Admin approval via Supabase dashboard only (no UI)

---

## Related Documentation

- `docs/changelogs/06-meal-logging.md` - Food search and selection flow
- `docs/changelogs/03-drawer-system.md` - Drawer patterns
- `docs/DB_SCHEMA.md` - foods, food_portions, food_addons tables
- `CLAUDE.md` - Reusable Patterns table (User-Created Content + Admin Approval)
