# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Context

**Renshuu** is a fitness application with a B2B2C model:
- **Base tier**: Reference libraries (foods, exercises, body knowledge)
- **Client tier**: Personal tracking (nutrition, workouts, body metrics)
- **Trainer tier**: Client management and program assignment

**MVP Focus**: Nutrition tracking first, localized for Singapore context.

## Documentation Structure

This project maintains comprehensive documentation to help you understand the codebase quickly:

### Core Documentation (in `/docs`)
- **`DB_SCHEMA.md`** - Complete database schema, tables, triggers, and RLS policies
- **`FRONTEND.md`** - Frontend architecture, component structure, data flow
- **`SUPABASE_WORKFLOW.md`** - Supabase development workflow and best practices

### Feature Changelogs (in `/docs/changelogs`)
Detailed documentation for each implemented feature:
- **`00-basic-configs.md`** - Project setup, tech stack, environment
- **`01-backend-setup.md`** - Database flow, migrations, type generation
- **`02-contexts.md`** - ThemeContext, AuthContext, DrawerContext usage
- **`03-drawer-system.md`** - Drawer architecture and implementation
- **`04-route-groups.md`** - Public/protected layouts, auth flow
- **`05-supabase-client.md`** - Singleton pattern, webpack fixes
- **`06-meal-logging.md`** - Meal logging MVP, patterns, and refactoring
- **`07-meals-management-page.md`** - Meals page with date navigation and 7-day preload
- **`08-weight-logging-and-profile.md`** - Weight logging, profile page, goals setting
- **`09-refresh-context.md`** - Cross-component data refresh (pub/sub pattern)
- **`10-custom-foods.md`** - User-created foods, MFP-style flow, RLS visibility

### When Starting a New Session
1. **Quick context**: Read this CLAUDE.md file first
2. **Architecture**: Check relevant docs in `/docs` for system overview
3. **Implementation details**: Reference specific changelogs in `/docs/changelogs`
4. **Current state**: Check git log and recent commits

### When Implementing Features
1. **Check existing patterns**: Look at changelogs for similar features
2. **Follow established patterns**: Maintain consistency with documented approaches
3. **Update documentation**: Add new changelog when adding significant features

## Working Principles

**Code Ownership**: The developer owns every line of code. Claude's role is to:
- Help think through architecture decisions
- Review and refactor code written by the developer
- Provide quick assistance on specific tasks
- **NOT** write entire features without developer understanding

When helping:
1. Explain concepts first before writing code
2. Let the developer write initial implementations
3. Offer refinements and best practices after
4. Never blindly generate large blocks of unfamiliar code

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with RLS (Row Level Security)
- **Styling**: CSS Modules + vanilla CSS (no frameworks)
- **State**: Zustand for client state
- **Deployment**: Vercel

## Architecture Decisions

### Authentication & Authorization

- Supabase Auth handles user authentication (`auth.users` table)
- `profiles` table extends auth with app-specific data
- **RLS enabled from day 1** - permissions enforced at database layer
- Role hierarchy: `client` < `trainer` < `owner_admin`
- Admin access granted via manual database updates

### Database Schema

See `docs/DB_SCHEMA.md` for full schema documentation.
See `docs/changelogs/01-backend-setup.md` for migration flow and patterns.

**Key tables**:
- `profiles` - User profiles (extends `auth.users`)
- `foods`, `food_portions`, `food_addons` - Modular food system
- `meals`, `meal_foods` - Nutrition logging
- `user_goals` - Nutritional targets
- `daily_summaries` - Aggregated daily stats
- `weight_logs` - Weight tracking over time
- `food_requests` - Crowdsourced food additions

**Design patterns**:
- Snapshot pattern for historical data (`food_name`, `portion_display` stored in logs)
- Denormalized totals for performance (`meals.total_calories`, `daily_summaries.*`)
- Arrays for simple lists (`dietary_restrictions`, `selected_addons`)
- Triggers for auto-calculations (meal totals, daily summaries)

### RLS Policies

**Philosophy**: Secure by default, explicit grants only.

**Access patterns**:
- Clients see only their own data
- Trainers see their assigned clients' data
- Admins see everything
- Base library data (foods, exercises) is read-only for non-admins

**Implementation**: All RLS policies are in migration files. See `docs/changelogs/01-backend-setup.md` for patterns.

### Singapore Localization

- Food database includes hawker foods, local dishes, and common add-ons
- Portion sizes reflect local serving standards
- No internationalization (English only)
- Focus on foods that don't require weighing (plate-based portions)

## Development Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

## Current Project Status

**Phase**: Core Tracking Features Complete

**What's Done** ✅:
- Database schema with RLS policies and triggers
- Authentication flow (magic link + Google OAuth)
- Route groups (public/protected) with auth protection
- Contexts (Theme, Auth, Drawer)
- Drawer system for meal/weight logging
- Mobile-first layout with persistent footer (2-1-2 layout)
- Supabase client singleton pattern
- **Meal Logging (Today's Dashboard)**:
  - Meal type selection (breakfast/lunch/dinner/snack)
  - Food search and selection with debounced input
  - Portion and add-on selection with live nutrition preview
  - Today's meals view grouped by meal type
  - Individual food item edit and delete functionality
  - Auto-calculated meal totals and daily summaries
  - Nutrition breakdown per food and per meal type
- **Meals Management Page**:
  - Date navigation (arrows + native date picker)
  - Smart date labels (Today, Yesterday, Tomorrow)
  - 7-day preload strategy for instant recent history
  - View/edit/delete meals for any date
  - Daily nutrition summary per date
  - Context-aware + button (respects selected date)
  - Full cross-page data consistency
- **Weight Logging**:
  - Weight form with decimal input validation
  - Date picker (defaults to today, max = today)
  - Optional notes field
  - Edit and delete existing entries
  - Auto-sync to profiles.weight_kg via trigger
- **Profile Page (`/me`)**:
  - Body Stats section (height, weight, age, activity level)
  - Daily Goals section (calorie/macro targets)
  - Weight History with change indicator
  - ProfileFormDrawer for editing body stats
  - GoalsFormDrawer for setting nutrition targets
- **Data Visualizations**:
  - CalorieRing - circular progress showing calories consumed vs goal
  - MacroDonut - protein/carbs/fats breakdown
  - Pure CSS/SVG implementation (no dependencies)
- **Seed Data - Food Database** (69 foods):
  - Hawker foods (33): Chicken rice, laksa, bak chor mee, prata, dim sum, satay, etc.
  - Drinks (16): Kopi/teh variations, milo, bubble tea, barley, sugarcane
  - Fast food (10): McDonald's, KFC basics
  - Basics (10): Rice, eggs, grilled chicken, tofu
  - Full macros (cal, protein, carbs, fats) with multiple portions and addons
  - Sources: HPB HealthHub, HealthXchange, McDonald's SG
- **Custom Food System** (MFP-style):
  - Users can create their own foods with nutritional data
  - Custom foods only visible to creator (RLS-enforced)
  - Admins can approve to make public
  - Recent foods shown in search for quick access
  - Search input with X clear button

**What's Next** 🚧:
- **Meal Templates**: Save and reuse common meal combinations
- **Analytics**: Weekly summaries, streak tracking, pattern insights
- **Admin Dashboard**: Review and approve user-created foods

**See**: `docs/changelogs/` for detailed implementation of completed features

## Guidelines for Claude

### Before Starting Work
- **Check Reusable Patterns table first**: See if existing patterns apply to the task
- **Check documentation**: Review relevant files in `/docs` and `/docs/changelogs`
- **Follow existing patterns**: Look at similar implementations in the codebase
- **Ask clarifying questions**: Before implementing, ensure you understand requirements
- **Document new patterns immediately**: If you create something reusable, add it to the Reusable Patterns table right away

### During Development
- **Prefer smaller, focused changes** over large rewrites
- **Point out potential issues** or better patterns
- **Respect the "developer writes first" principle** - explain concepts before writing code
- **Keep code simple and readable** over clever
- **Use established patterns**: Contexts, drawers, layouts, etc. (see changelogs)
- **NEVER run dev servers** - All testing and verification is done by the developer
- **NEVER run npm run dev, npm start, or similar commands** - Only the developer runs servers

### Database & Backend
- **When writing migrations**: Include RLS policies and triggers
- **Test RLS policies**: Simulate different user roles (client, trainer, admin)
- **Follow migration pattern**: See `docs/changelogs/01-backend-setup.md`
- **Regenerate types**: After schema changes, update `database.types.ts`

### Frontend & Components
- **Mobile-first**: Design for 320px-768px viewport first
- **Use existing contexts**: Auth, Theme, Drawer (see `docs/changelogs/02-contexts.md`)
- **Follow drawer patterns**: See `docs/changelogs/03-drawer-system.md`
- **Maintain route structure**: Public vs protected (see `docs/changelogs/04-route-groups.md`)

### Documentation
- **Update changelogs**: Add new changelog for significant features
- **Use TEMPLATE.md**: Follow the established format
- **Reference related docs**: Link to relevant documentation

## Code Style

**Functions:**
- Use ES6 arrow functions for all components and functions
- Exception: Only use `function` keyword when hoisting is explicitly needed

```typescript
// ❌ Bad
function MyComponent() { ... }
function handleClick() { ... }

// ✅ Good
const MyComponent = () => { ... };
const handleClick = () => { ... };
```

**Comments:**
- Code should be self-explanatory
- Use descriptive variable/function names instead of comments
- Use line breaks to show logical separation between code blocks
- Only add comments for genuinely complex logic that needs explanation
- Avoid obvious comments like `// Close drawer` or `// Render component`

```typescript
// ❌ Bad - Unnecessary comments
// Set loading state
setLoading(true);
// Fetch data from API
const data = await fetchData();
// Close modal
setIsOpen(false);

// ✅ Good - Self-explanatory code with logical breaks
setLoading(true);
const data = await fetchData();

setIsOpen(false);
```

## Reusable Patterns

**IMPORTANT:** Before building something new, check this table for existing patterns to reuse. If you create a new reusable pattern, document it here immediately.

| Pattern | Reference | Use When |
|---------|-----------|----------|
| Form Drawer | `WeightFormDrawer`, `GoalsFormDrawer` | Any form that opens in a drawer (create/edit modes) |
| Data Hook with Cache | `useMealsData` | Page needs cached data fetching with preload strategy |
| Simple Data Hook | `useTodayData` | Page needs single-day data fetching |
| CRUD List Page | `/meals/page.tsx`, `/me/page.tsx` | List view with edit/delete actions |
| Date Navigation | `/meals/page.tsx` | Any page that needs date picker with prev/next |
| Selectable List | `ProfileFormDrawer` (activity levels) | Single-select from list of options |
| Multi-select List | `FoodFormDrawer` (addons) | Multi-select from list of options |
| Refresh Context | `useRefreshSubscription`, `useRefresh` | Cross-component data refresh (pub/sub pattern) |
| Smart Date Labels | `/me/page.tsx` `formatDate()` | Display "Today", "Yesterday", or formatted date |
| Number Input Validation | `WeightFormDrawer`, `GoalsFormDrawer` | Decimal or integer-only inputs |
| SVG Ring Chart | `CalorieRing` | Circular progress toward a goal |
| SVG Donut Chart | `MacroDonut` | Multi-segment breakdown (e.g., macros) |
| Search with Recent Items | `FoodSearchDrawer` | Search input with recent history and clear button |
| User-Created Content + Admin Approval | `CustomFoodFormDrawer`, RLS policies | Content visible only to creator until approved |

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` - Application URL (defaults to localhost:3000)

## Quick Reference

### Common Commands
```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production

# Database
supabase db reset              # Reset local DB and apply all migrations
supabase migration up          # Apply new migrations only
supabase gen types typescript --local > src/types/database.types.ts

# Git
git log --oneline -10          # View recent commits
git status                     # Check current changes
```

### Key File Locations
```
src/
├── app/
│   ├── (public)/             # Public routes (/, /auth)
│   └── (protected)/          # Protected routes
│       ├── dashboard/        # Today's meals dashboard
│       ├── meals/            # Meals management page
│       └── me/               # Profile page
├── components/
│   ├── charts/               # Data visualizations
│   │   ├── CalorieRing       # Circular calorie progress
│   │   └── MacroDonut        # Macro breakdown donut
│   ├── drawers/              # All drawer components
│   │   ├── FoodSearchDrawer  # Food search with recent items
│   │   ├── CustomFoodFormDrawer # User-created foods
│   │   ├── WeightFormDrawer  # Weight logging
│   │   ├── ProfileFormDrawer # Body stats editor
│   │   ├── GoalsFormDrawer   # Nutrition goals editor
│   │   └── ...               # Other meal-related drawers
│   ├── meals/                # MealCard, meal display
│   └── layout/               # Footer, etc.
├── contexts/                 # Theme, Auth, Drawer, Refresh contexts
├── hooks/                    # useTodayData, useMealsData, useDebounce
├── lib/
│   ├── supabase/client.ts   # Singleton Supabase client
│   └── meals/               # Meal grouping utilities
└── types/
    └── database.types.ts    # Generated from Supabase

docs/
├── DB_SCHEMA.md             # Full database schema
├── FRONTEND.md              # Frontend architecture
└── changelogs/              # Feature-specific docs (00-10)
```

### Feature Development Checklist
When building a new feature:
- [ ] Check existing patterns in relevant changelog
- [ ] Create migration if database changes needed
- [ ] Regenerate types if schema changed
- [ ] Follow mobile-first design (max-width: 768px)
- [ ] Use existing contexts (Auth, Drawer, Theme)
- [ ] Test on actual mobile device if possible
- [ ] Update or create changelog for significant features
- [ ] Clean up unnecessary comments before committing
