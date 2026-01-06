# Basic Project Configuration - Oct 2024

## Overview
Initial project setup with Next.js 15, React 19, TypeScript, and Supabase. Configured for mobile-first development with Singapore localization.

## Tech Stack
- **Framework**: Next.js 15.4.5 (App Router)
- **React**: 19.1.0
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Modules + vanilla CSS
- **Deployment**: Vercel
- **Node Version**: 22 (specified in `.nvmrc`)

## Key Configuration Files

### Package Management
```json
// package.json
{
  "name": "renshuu",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Next.js Configuration
- Webpack customizations for Supabase compatibility
- Node.js polyfill fixes for client-side bundle
- Package transpilation for `@supabase/supabase-js`

**File**: `next.config.ts`

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` maps to `src/*`
- React JSX automatic runtime

**File**: `tsconfig.json`

### Node Version
Fixed at Node.js 22 to avoid webpack issues with Node.js 23.

**File**: `.nvmrc`
```
22
```

## Environment Variables

### Required Variables
Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Files
- `.env.local` - Local development (gitignored)
- `.env.development` - Development defaults
- `.env.production` - Production config
- `.env.staging` - Staging config
- `.env.local.example` - Template for setup

## Project Structure
```
renshuu/
├── docs/               # Documentation
│   └── changelogs/    # Feature changelogs
├── src/
│   ├── app/           # Next.js app router
│   │   ├── (public)/  # Public routes
│   │   └── (protected)/ # Auth-protected routes
│   ├── components/    # React components
│   ├── contexts/      # React contexts
│   ├── lib/           # Utilities and configs
│   ├── styles/        # Global styles and tokens
│   └── types/         # TypeScript types
├── supabase/
│   ├── migrations/    # Database migrations
│   └── seed.sql      # Seed data
├── CLAUDE.md         # AI assistant guidelines
└── README.md         # Project readme
```

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Format code
npm run format
```

## Design Tokens
Centralized design system in `src/styles/design-tokens.css`:
- Color palette (light/dark mode)
- Typography scale
- Spacing system (8px base)
- Border radius values
- Shadows
- Z-index layers
- Transitions

## Code Style Guidelines
See `CLAUDE.md` for detailed guidelines:
- Minimal comments (code should be self-explanatory)
- Use line breaks for logical separation
- Descriptive variable/function names
- TypeScript strict mode

## Related Documentation
- See `docs/FRONTEND.md` for architecture details
- See `docs/DB_SCHEMA.md` for database structure
- See `docs/SUPABASE_WORKFLOW.md` for backend workflow
