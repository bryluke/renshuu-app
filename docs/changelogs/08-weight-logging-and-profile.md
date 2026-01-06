# Weight Logging & Profile Management - December 2025

## Overview

Implementation of weight logging functionality and the profile management page. Users can now log their weight over time, set body stats (height, age, activity level), and configure daily nutrition goals. All editing is done through drawers from the profile page, following the established pattern.

## What Changed

**Weight Logging:**
- Full weight logging form with decimal input validation
- Date picker (defaults to today, max = today)
- Optional notes field (e.g., "morning weight", "after workout")
- Edit and delete existing weight entries
- Upsert handling for one-entry-per-day constraint
- Auto-sync to `profiles.weight_kg` via database trigger

**Profile Page (`/me`):**
- Body Stats section showing height, weight, age, activity level
- Daily Goals section showing calorie/macro targets
- Weight History section with last 10 entries
- Weight change indicator (up = red, down = green)
- Smart date labels (Today, Yesterday, weekday, or date)

**Profile Editing:**
- ProfileFormDrawer for body stats (height, age, activity level)
- GoalsFormDrawer for daily nutrition targets

**AuthContext Enhancement:**
- Added `refreshProfile()` function for post-edit data refresh

## Implementation Details

### Weight Form Drawer

The weight form handles both create and edit modes with upsert for the unique constraint:

```typescript
// Create mode: upsert handles one-entry-per-day
const { error } = await supabase
  .from('weight_logs')
  .upsert({
    user_id: user.id,
    weight_kg: weightNum,
    log_date: date,
    notes: notes.trim() || null,
  }, {
    onConflict: 'user_id,log_date',
  });

// Edit mode: direct update by ID
const { error } = await supabase
  .from('weight_logs')
  .update({
    weight_kg: weightNum,
    log_date: date,
    notes: notes.trim() || null,
  })
  .eq('id', existingLogId);
```

**Input Validation:** Decimal input limited to 2 decimal places via regex:

```typescript
const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
    setWeight(value);
  }
};
```

### Profile Page Data Flow

The profile page fetches weight logs and current goal on mount, and exposes global refetch functions:

```typescript
const fetchData = useCallback(async () => {
  const [weightResult, goalResult] = await Promise.all([
    supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', profile.id)
      .order('log_date', { ascending: false })
      .limit(10),
    supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('start_date', { ascending: false })
      .limit(1)
      .single(),
  ]);
}, [profile?.id]);

// Expose refetch functions for drawers
useEffect(() => {
  if (typeof window !== 'undefined') {
    (window as any).__refetchWeightData = fetchData;
    (window as any).__refetchGoalsData = fetchData;
    (window as any).__refetchProfileData = async () => {
      await refreshProfile();
      await fetchData();
    };
  }
}, [fetchData, refreshProfile]);
```

### Goals Form with Create/Update Logic

Goals form handles both creating new goals and updating existing ones:

```typescript
if (currentGoal) {
  // Update existing goal
  await supabase
    .from('user_goals')
    .update({
      daily_calorie: parseInt(calories),
      daily_protein_g: parseFloat(protein),
      daily_carbs_g: parseFloat(carbs),
      daily_fats_g: parseFloat(fats),
      daily_fiber_g: parseFloat(fiber) || 0,
    })
    .eq('id', currentGoal.id);
} else {
  // Create new goal
  await supabase
    .from('user_goals')
    .insert({
      user_id: user.id,
      daily_calorie: parseInt(calories),
      daily_protein_g: parseFloat(protein),
      daily_carbs_g: parseFloat(carbs),
      daily_fats_g: parseFloat(fats),
      daily_fiber_g: parseFloat(fiber) || 0,
      set_by: 'self',
      set_by_user_id: user.id,
      start_date: today,
      is_active: true,
    });
}
```

### Activity Level Selection

Profile form uses a selectable list for activity level:

```typescript
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
  { value: 'active', label: 'Active', description: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Intense daily exercise' },
];
```

### Weight Change Indicator

Shows weight change between latest and previous entry:

```typescript
const latestWeight = weightLogs[0]?.weight_kg;
const previousWeight = weightLogs[1]?.weight_kg;
const weightChange = latestWeight && previousWeight
  ? (latestWeight - previousWeight).toFixed(1)
  : null;

// Display with color coding
<span className={`${styles.weightChange} ${parseFloat(weightChange) > 0 ? styles.up : styles.down}`}>
  {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
</span>
```

## Files Changed

**New Files - Drawers:**
- `src/components/drawers/WeightFormDrawer.tsx` - Weight logging form
- `src/components/drawers/WeightFormDrawer.module.css` - Weight form styles
- `src/components/drawers/ProfileFormDrawer.tsx` - Body stats editor
- `src/components/drawers/ProfileFormDrawer.module.css` - Profile form styles
- `src/components/drawers/GoalsFormDrawer.tsx` - Nutrition goals editor
- `src/components/drawers/GoalsFormDrawer.module.css` - Goals form styles

**New Files - Pages:**
- `src/app/(protected)/me/page.tsx` - Profile management page
- `src/app/(protected)/me/page.module.css` - Profile page styles

**Modified Files:**
- `src/contexts/DrawerContext.tsx` - Added `profile-form` and `goals-form` drawer types
- `src/contexts/AuthContext.tsx` - Added `refreshProfile()` function
- `src/components/drawers/DrawerContainer.tsx` - Registered new drawers

## Usage

### Logging Weight

```typescript
// From ActionMenuDrawer or directly
openDrawer('weight-form');

// Edit existing entry
openDrawer('weight-form', {
  weightLogId: log.id,
  weight: log.weight_kg,
  date: log.log_date,
  notes: log.notes,
});
```

### Editing Profile

```typescript
// Open body stats editor
openDrawer('profile-form');

// Open goals editor (with current goal for edit mode)
openDrawer('goals-form', { currentGoal });
```

### Refetching Data After Changes

```typescript
// After weight log changes
if ((window as any).__refetchWeightData) {
  await (window as any).__refetchWeightData();
}

// After profile changes
if ((window as any).__refetchProfileData) {
  await (window as any).__refetchProfileData();
}

// After goals changes
if ((window as any).__refetchGoalsData) {
  await (window as any).__refetchGoalsData();
}
```

## Testing

### Manual Testing Checklist

**Weight Logging:**
1. Tap + button → "Log Weight" → form opens with today's date
2. Enter decimal weight (e.g., 70.5) → validates correctly
3. Change date to yesterday → saves to that date
4. Add notes → notes saved and displayed
5. Log weight for same date twice → upserts (updates existing)
6. Edit existing weight entry → pre-fills form, saves changes
7. Delete weight entry → removed from list

**Profile Page:**
1. Navigate to /me via footer → page loads
2. Body Stats shows current profile data (or "—" if not set)
3. Daily Goals shows current goals (or empty state)
4. Weight History shows last 10 entries with change indicator

**Body Stats Editing:**
1. Tap "Edit" on Body Stats → ProfileFormDrawer opens
2. Pre-fills current values
3. Select activity level → highlights with checkmark
4. Save → profile updates, drawer closes

**Goals Setting:**
1. Tap "Set Goals" (or "Edit") → GoalsFormDrawer opens
2. Required fields: calories, protein, carbs, fats
3. Fiber is optional
4. Save → goal created/updated, drawer closes
5. Dashboard now shows goals in summary card

**Cross-Feature:**
1. Log weight → profiles.weight_kg auto-updates (trigger)
2. Set goals → dashboard shows "X / Y kcal" format
3. Weight change shows red (up) or green (down) indicator

## Future Considerations

**Features to Add:**
- Weight graph visualization (line chart over time)
- Goal history (view past goals, when they changed)
- BMI calculation from height/weight
- Goal suggestions based on profile data
- Export weight data to CSV
- Reminders to log weight

**Code Improvements:**
- Extract weight history into reusable component
- Create `useWeightData` hook similar to `useMealsData`
- Add optimistic updates for better perceived performance
- Replace global window functions with event emitter
- Add form validation library (e.g., Zod + react-hook-form)

**UX Enhancements:**
- Swipe to delete weight entries
- Quick weight increment/decrement buttons (+/- 0.1 kg)
- Weight trend indicator (7-day moving average)
- Celebration animation when hitting goal weight

## Related Documentation

- `docs/changelogs/06-meal-logging.md` - Meal logging patterns
- `docs/changelogs/07-meals-management-page.md` - Similar page structure
- `docs/changelogs/03-drawer-system.md` - Drawer architecture
- `docs/DB_SCHEMA.md` - weight_logs and user_goals tables
- `CLAUDE.md` - Project status and architecture overview
