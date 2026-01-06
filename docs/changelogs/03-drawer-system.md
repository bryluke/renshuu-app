# Drawer System - Oct 2024

## Overview
Mobile-first bottom sheet drawer system for logging meals and weight. Built with React Context for global state management and smooth animations.

## Architecture

### Components Structure
```
src/components/drawers/
├── Drawer.tsx                 # Base drawer component
├── Drawer.module.css          # Drawer styles
├── DrawerContainer.tsx        # Renders all drawers
├── ActionMenuDrawer.tsx       # Main action selection
├── MealTypeDrawer.tsx         # Meal type selection
├── FoodSearchDrawer.tsx       # Food search (placeholder)
├── FoodFormDrawer.tsx         # Portion/addons (placeholder)
└── WeightFormDrawer.tsx       # Weight logging (placeholder)
```

### State Management
**Context**: `src/contexts/DrawerContext.tsx`

See `02-contexts.md` for detailed documentation.

---

## Base Drawer Component

**File**: `src/components/drawers/Drawer.tsx`

### Features
- Mobile-first bottom sheet design
- Smooth slide-up animation
- Backdrop overlay with click-to-close
- ESC key to close
- Auto-prevents body scroll when open
- Optional footer for action buttons

### Props
```typescript
interface DrawerProps {
  isOpen: boolean;        // Controlled by DrawerContext
  onClose: () => void;    // Close handler
  title: string;          // Drawer header title
  children: ReactNode;    // Drawer content
  footer?: ReactNode;     // Optional footer (buttons, etc.)
}
```

### Usage
```typescript
<Drawer
  isOpen={drawerType === 'meal-type'}
  onClose={closeDrawer}
  title="Select Meal Type"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  <div>Drawer content here</div>
</Drawer>
```

### Styling
- Fixed position at bottom of viewport
- Max height: 90vh
- Border radius on top corners
- Z-index: `var(--z-drawer)` (1300)

---

## Implemented Drawers

### 1. ActionMenuDrawer
**File**: `src/components/drawers/ActionMenuDrawer.tsx`

Main entry point for all logging actions.

**Triggered By**: Center + button in footer

**Options**:
- 🍽️ **Log Meal** → Opens MealTypeDrawer
- ⚖️ **Log Weight** → Opens WeightFormDrawer

**Flow**:
```
User clicks + button
  ↓
ActionMenuDrawer opens
  ↓
User selects action
  ↓
Opens corresponding drawer
```

---

### 2. MealTypeDrawer
**File**: `src/components/drawers/MealTypeDrawer.tsx`

Select meal type for logging.

**Triggered By**: "Log Meal" in ActionMenuDrawer

**Options**:
- 🌅 Breakfast
- ☀️ Lunch
- 🌙 Dinner
- 🍎 Snack

**Flow**:
```typescript
const handleSelectMealType = (mealType: string) => {
  openDrawer('food-search', { mealType });
};
```

**Data Passed**:
```typescript
{ mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' }
```

---

### 3. FoodSearchDrawer
**File**: `src/components/drawers/FoodSearchDrawer.tsx`

**Status**: Placeholder (not yet implemented)

**Purpose**: Search and select food from database

**Receives Data**:
```typescript
drawerData.mealType // From MealTypeDrawer
```

**Next Step**: Opens FoodFormDrawer with selected food

---

### 4. FoodFormDrawer
**File**: `src/components/drawers/FoodFormDrawer.tsx`

**Status**: Placeholder (not yet implemented)

**Purpose**: Select portion size and add-ons

**Receives Data**:
```typescript
{
  mealType: string,
  foodId: string,
  foodName: string
}
```

**Next Step**: Save to database and close all drawers

---

### 5. WeightFormDrawer
**File**: `src/components/drawers/WeightFormDrawer.tsx`

**Status**: Placeholder (not yet implemented)

**Purpose**: Log daily weight

**Flow**: Simple form → Save to `weight_logs` table

---

## DrawerContainer

**File**: `src/components/drawers/DrawerContainer.tsx`

Central orchestrator for all drawers.

**Renders All Drawers**:
```typescript
export function DrawerContainer() {
  return (
    <>
      <ActionMenuDrawer />
      <MealTypeDrawer />
      <FoodSearchDrawer />
      <FoodFormDrawer />
      <WeightFormDrawer />
    </>
  );
}
```

**Mounted In**: Protected layout (`src/app/(protected)/layout.tsx`)

**Why Render All?**
- Each drawer controls its own visibility via context
- Allows seamless transitions between drawers
- Simpler state management than dynamic rendering

---

## User Flow Examples

### Meal Logging Flow
```
1. User clicks + button in footer
   ↓
2. ActionMenuDrawer opens
   ↓
3. User taps "Log Meal"
   ↓
4. MealTypeDrawer opens
   ↓
5. User selects "Breakfast"
   ↓
6. FoodSearchDrawer opens (with mealType: 'breakfast')
   ↓
7. User searches and selects food
   ↓
8. FoodFormDrawer opens (with food data)
   ↓
9. User selects portion and addons
   ↓
10. Save to database
    ↓
11. All drawers close
    ↓
12. Dashboard refreshes with new meal
```

### Weight Logging Flow
```
1. User clicks + button in footer
   ↓
2. ActionMenuDrawer opens
   ↓
3. User taps "Log Weight"
   ↓
4. WeightFormDrawer opens
   ↓
5. User enters weight
   ↓
6. Save to database
   ↓
7. Drawer closes
   ↓
8. Dashboard refreshes with new weight
```

---

## Implementation Details

### Animations
**CSS**: `src/components/drawers/Drawer.module.css`

```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drawer {
  animation: slideUp var(--transition-base);
}
```

### Body Scroll Lock
Prevents background scrolling when drawer is open:

```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

### Keyboard Accessibility
ESC key closes drawer:

```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

---

## Styling System

### Design Tokens
Uses global CSS variables from `src/styles/design-tokens.css`:

```css
.drawer {
  z-index: var(--z-drawer);          /* 1300 */
  border-radius: var(--radius-lg);    /* 12px */
  padding: var(--space-3);            /* 24px */
  transition: var(--transition-base); /* 250ms */
}
```

### Mobile-First
- Optimized for touch interactions
- Large tap targets (min 44px)
- Swipe-friendly handle (visual only for now)

---

## Future Enhancements

### Planned Features
- [ ] Swipe down to dismiss gesture
- [ ] Drawer stacking (multiple drawers open)
- [ ] Smooth drawer-to-drawer transitions
- [ ] Desktop modal variant (centered, not bottom sheet)

### Performance Optimizations
- [ ] Lazy load drawer content
- [ ] Virtualize long lists (food search results)
- [ ] Debounce search inputs

### Accessibility
- [ ] Focus trap within drawer
- [ ] ARIA labels and roles
- [ ] Screen reader announcements

---

## Testing

### Manual Testing
1. Click + button → ActionMenu should open
2. Select "Log Meal" → MealType should open
3. Select meal type → FoodSearch should open
4. Press ESC → Drawer should close
5. Click backdrop → Drawer should close
6. Open drawer → Body scroll should be locked

### Integration Points
- Footer component (`src/components/layout/Footer.tsx`)
- Protected layout (`src/app/(protected)/layout.tsx`)
- DrawerContext (`src/contexts/DrawerContext.tsx`)

---

## Files Summary

### New Files
- `src/components/drawers/Drawer.tsx` - Base component
- `src/components/drawers/Drawer.module.css` - Styles
- `src/components/drawers/DrawerContainer.tsx` - Orchestrator
- `src/components/drawers/ActionMenuDrawer.tsx` - Main menu
- `src/components/drawers/ActionMenuDrawer.module.css` - Styles
- `src/components/drawers/MealTypeDrawer.tsx` - Meal type selection
- `src/components/drawers/MealTypeDrawer.module.css` - Styles
- `src/components/drawers/FoodSearchDrawer.tsx` - Placeholder
- `src/components/drawers/FoodFormDrawer.tsx` - Placeholder
- `src/components/drawers/WeightFormDrawer.tsx` - Placeholder
- `src/contexts/DrawerContext.tsx` - State management

### Modified Files
- `src/components/layout/Footer.tsx` - Added + button handler
- `src/app/(protected)/layout.tsx` - Added DrawerContainer
- `src/app/layout.tsx` - Added DrawerProvider

---

## Related Documentation
- **Contexts**: See `02-contexts.md`
- **Route Groups**: See `04-route-groups.md`
- **Mobile Design**: See `docs/FRONTEND.md`
