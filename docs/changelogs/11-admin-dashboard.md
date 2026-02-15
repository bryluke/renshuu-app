# Admin Dashboard — Food Management - February 2026

## Overview

Implementation of an admin dashboard for managing the food database (CRUD on foods, portions, and addons). Built as a separate `(admin)` route group with a desktop-optimized, full-width layout — distinct from the mobile-first `(protected)` layout. No new migrations needed; admin RLS policies already exist.

## What Changed

- **Admin Route Group**: New `(admin)` layout with auth + role guard, desktop container (max 1400px), no footer
- **Food List View**: Searchable, filterable table of all foods with inline approve/delete actions
- **Food Editor**: Create/edit form with 2-column grid layout
- **Portions Table**: Inline CRUD sub-table for food portions (appears after food is saved)
- **Addons Table**: Inline CRUD sub-table for food addons with category field (sauce/topping/side)

---

## Implementation Details

### Route Group Architecture

The `(admin)` route group is separate from `(protected)` because:
- **No max-width constraint**: Admin needs full-width tables (max 1400px vs 768px)
- **No Footer**: Desktop-only, no mobile navigation needed
- **No DrawerContainer**: Admin uses inline editing, not drawer-based forms
- **Different role guard**: Checks for `admin` role instead of just authenticated

```
src/app/
├── (public)/           # Landing, auth
├── (protected)/        # Client app (mobile, max-width: 768px, Footer)
└── (admin)/            # Admin dashboard (desktop, max-width: 1400px, no Footer)
    ├── layout.tsx      # Auth + admin guard
    └── admin/
        └── page.tsx    # Tab bar + view routing
```

### View Routing Pattern

The admin page uses a simple state-based view toggle instead of nested routes:

```typescript
const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
// null → FoodTable (list view)
// 'new' → FoodEditor (create mode)
// uuid → FoodEditor (edit mode)
```

This keeps the URL simple (`/admin`) while allowing seamless list ↔ editor transitions.

### Inline CRUD Pattern (PortionsTable / AddonsTable)

Both sub-tables share the same inline editing pattern:

1. **Add**: "+ Add" button renders an input row at the top of the table
2. **Edit**: Clicking "Edit" transforms that row's cells into inputs
3. **Save**: Immediate DB write, then refetch the list
4. **Cancel**: Reverts to read-only view

```typescript
const [adding, setAdding] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [form, setForm] = useState<PortionForm>(emptyForm);

// Only one mode active at a time
const handleAdd = () => {
  setAdding(true);
  setEditingId(null);
  setForm(emptyForm);
};

const handleEdit = (portion: FoodPortion) => {
  setEditingId(portion.id);
  setAdding(false);
  setForm(toForm(portion));
};
```

### New Food Flow

Portions and addons require a `food_id` foreign key, so they can't be created until the food itself is saved:

```
Create Food form → Save → food_id returned
         ↓
PortionsTable + AddonsTable sections appear
         ↓
Add portions/addons inline
```

Before the food is saved, a hint text is shown: "Save the food first, then you can add portions and addons."

### FoodTable Filters

Three filter controls work together via `useEffect` dependency:

```typescript
const debouncedSearch = useDebounce(search, 300);

const fetchFoods = useCallback(async () => {
  let query = supabase.from('foods').select('*').order('created_at', { ascending: false });

  if (debouncedSearch) query = query.ilike('display_name', `%${debouncedSearch}%`);
  if (category !== 'all') query = query.eq('category', category);
  if (status === 'approved') query = query.eq('is_approved', true);
  else if (status === 'pending') query = query.or('is_approved.eq.false,is_approved.is.null');

  const { data } = await query;
  setFoods(data || []);
}, [debouncedSearch, category, status]);
```

---

## Files Changed

**New Files (12):**

| File | Purpose |
|------|---------|
| `src/app/(admin)/layout.tsx` | Auth + admin role guard, desktop layout |
| `src/app/(admin)/layout.module.css` | Full-width layout styles |
| `src/app/(admin)/admin/page.tsx` | Tab bar + list/editor view routing |
| `src/app/(admin)/admin/page.module.css` | Tab bar styles |
| `src/components/admin/FoodTable.tsx` | Food list with search, filters, actions |
| `src/components/admin/FoodTable.module.css` | Table, toolbar, badge styles |
| `src/components/admin/FoodEditor.tsx` | Food form + portions/addons sections |
| `src/components/admin/FoodEditor.module.css` | 2-column form grid styles |
| `src/components/admin/PortionsTable.tsx` | Inline CRUD for food_portions |
| `src/components/admin/PortionsTable.module.css` | Inline edit row styles |
| `src/components/admin/AddonsTable.tsx` | Inline CRUD for food_addons |
| `src/components/admin/AddonsTable.module.css` | Inline edit row styles |

**No migrations needed** — admin RLS policies already exist on `foods`, `food_portions`, `food_addons`.

---

## Testing

### Manual Testing Checklist

**Access Control:**
1. Navigate to `/admin` while logged out → redirected to `/auth`
2. Navigate to `/admin` as a non-admin user → redirected to `/dashboard`
3. Navigate to `/admin` as admin → see dashboard with Foods tab

**Food List:**
1. Verify all foods load in the table
2. Search for a food by name → table filters in real-time (debounced)
3. Filter by category dropdown → only matching foods shown
4. Filter by status → approved/pending foods shown
5. Click "Approve" on a pending food → status changes to Approved
6. Click "Delete" on a food → confirmation dialog → food removed

**Food Editor:**
1. Click "+ New Food" → editor form appears
2. Fill in details, click "Create Food" → food saved, portions/addons sections appear
3. Click "Edit" on existing food → editor loads with current values
4. Modify and save → changes persisted
5. Click "Back to Foods" → returns to list view

**Portions (inline CRUD):**
1. Click "+ Add Portion" → input row appears at top
2. Fill in values, click "Save" → portion saved to DB, row becomes read-only
3. Click "Edit" on a portion → row transforms to inputs
4. Click "Delete" → confirmation → portion removed

**Addons (same as portions + category):**
1. Same CRUD flow as portions
2. Verify category dropdown (sauce/topping/side) works

---

## Future Considerations

- **More admin tabs**: Food Requests review, User management, Analytics
- **Bulk actions**: Select multiple foods for approve/delete
- **Pagination**: Currently loads all foods; will need pagination at scale
- **Audit log**: Track who approved/modified foods and when
- **Keyboard shortcuts**: Enter to save inline rows, Escape to cancel

---

## Related Documentation

- `docs/changelogs/10-custom-foods.md` - Custom food creation (user-side) and RLS policies
- `docs/changelogs/04-route-groups.md` - Route group pattern (public/protected)
- `docs/DB_SCHEMA.md` - foods, food_portions, food_addons table schemas
- `CLAUDE.md` - Reusable Patterns table
