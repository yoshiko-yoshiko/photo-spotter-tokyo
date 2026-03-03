const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const env = {
  SUPABASE_URL: SUPABASE_URL || 'https://yfjeeuwzyhzvnnxfanwz.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmamVldXd6eWh6dm5ueGZhbnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDAxNDYsImV4cCI6MjA4ODA3NjE0Nn0.P4ZjeUoYkTvPBCdRlElx_robcgYuuTkEH5IxuKz-tNA',
  MAPBOX_TOKEN: (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? '',
} as const;
