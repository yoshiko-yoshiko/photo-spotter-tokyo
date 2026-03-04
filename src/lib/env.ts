export const env = {
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string) ?? '',
  SUPABASE_PUBLISHABLE_KEY: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ?? '',
  MAPBOX_TOKEN: (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? '',
  MICROCMS_SERVICE_DOMAIN: 'photo-spotter-tokyo',
  MICROCMS_API_KEY: (import.meta.env.VITE_MICROCMS_API_KEY as string) ?? '',
} as const;
