#!/bin/bash

# Script to regenerate Supabase types
# Usage: ./scripts/generate-types.sh

echo "🔄 Generating Supabase database types..."

# Get project reference from .env.local
PROJECT_REF=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'/' -f3 | cut -d'.' -f1)

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Could not find Supabase project reference in .env.local"
    exit 1
fi

echo "📍 Using project reference: $PROJECT_REF"

# Generate types
supabase gen types typescript --project-id $PROJECT_REF > src/types/database.ts

if [ $? -eq 0 ]; then
    echo "✅ Database types successfully generated at src/types/database.ts"
    echo "🔧 Remember to update your auth store Profile interface if needed!"
else
    echo "❌ Failed to generate types"
    exit 1
fi