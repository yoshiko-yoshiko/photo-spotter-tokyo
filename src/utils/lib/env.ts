const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const env = {
  SUPABASE_URL: SUPABASE_URL || 'https://oedshepzrgalxrauebrp.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZHNoZXB6cmdhbHhyYXVlYnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzMyNDYsImV4cCI6MjA4ODAwOTI0Nn0.6RHQiY1Kv1X5Uv_DQMq5yipubTkQZGms-Fo5KufB5ZE',
  MAPBOX_TOKEN: (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? '',
} as const;
