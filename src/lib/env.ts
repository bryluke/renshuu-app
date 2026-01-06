export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  get IS_SUPABASE_CONFIGURED() {
    return !!(this.SUPABASE_URL && this.SUPABASE_ANON_KEY)
  }
} as const
