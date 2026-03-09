function requireEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  SUPABASE_URL: requireEnv('VITE_SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEY: requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  MAPBOX_TOKEN: requireEnv('VITE_MAPBOX_TOKEN'),
  MICROCMS_SERVICE_DOMAIN: 'photo-spotter-tokyo',
  MICROCMS_API_KEY: (import.meta.env.VITE_MICROCMS_API_KEY as string) ?? '',
} as const;
