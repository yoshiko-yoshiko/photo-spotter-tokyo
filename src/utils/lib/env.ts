export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
} as const;
