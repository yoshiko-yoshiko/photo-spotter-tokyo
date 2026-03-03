const required = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
} as const;

const optional = {
  VITE_MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN as string | undefined,
} as const;

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
    'Copy .env.example to .env and fill in the values.',
  );
}

export const env = {
  SUPABASE_URL: required.VITE_SUPABASE_URL!,
  SUPABASE_PUBLISHABLE_KEY: required.VITE_SUPABASE_PUBLISHABLE_KEY!,
  MAPBOX_TOKEN: optional.VITE_MAPBOX_TOKEN ?? '',
} as const;
