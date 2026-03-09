import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('env validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws when VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'token');

    await expect(() => import('./env')).rejects.toThrow('Missing required env var: VITE_SUPABASE_URL');
  });

  it('throws when VITE_SUPABASE_PUBLISHABLE_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'token');

    await expect(() => import('./env')).rejects.toThrow('Missing required env var: VITE_SUPABASE_PUBLISHABLE_KEY');
  });

  it('throws when VITE_MAPBOX_TOKEN is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', '');

    await expect(() => import('./env')).rejects.toThrow('Missing required env var: VITE_MAPBOX_TOKEN');
  });

  it('exports env object when all required vars are set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'my-key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'my-token');
    vi.stubEnv('VITE_MICROCMS_API_KEY', '');

    const { env } = await import('./env');
    expect(env.SUPABASE_URL).toBe('https://example.supabase.co');
    expect(env.SUPABASE_PUBLISHABLE_KEY).toBe('my-key');
    expect(env.MAPBOX_TOKEN).toBe('my-token');
    expect(env.MICROCMS_SERVICE_DOMAIN).toBe('photo-spotter-tokyo');
    expect(env.MICROCMS_API_KEY).toBe('');
  });

  it('allows MICROCMS_API_KEY to be empty (optional)', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'token');
    vi.stubEnv('VITE_MICROCMS_API_KEY', '');

    const { env } = await import('./env');
    expect(env.MICROCMS_API_KEY).toBe('');
  });

  it('passes through MICROCMS_API_KEY when set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'token');
    vi.stubEnv('VITE_MICROCMS_API_KEY', 'cms-key');

    const { env } = await import('./env');
    expect(env.MICROCMS_API_KEY).toBe('cms-key');
  });

  // --- QA追加: エラーメッセージ・固定値 ---
  it('error message includes the missing key name', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_MAPBOX_TOKEN', '');

    // Should throw for the first missing key
    await expect(() => import('./env')).rejects.toThrow(/Missing required env var: VITE_/);
  });

  it('MICROCMS_SERVICE_DOMAIN is always hardcoded to photo-spotter-tokyo', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'token');

    const { env } = await import('./env');
    // Hardcoded, not from env var
    expect(env.MICROCMS_SERVICE_DOMAIN).toBe('photo-spotter-tokyo');
  });

  it('preserves whitespace in env values (no trimming)', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', ' https://example.supabase.co ');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'key');
    vi.stubEnv('VITE_MAPBOX_TOKEN', 'token');

    const { env } = await import('./env');
    // requireEnv does not trim — potential issue if env has leading/trailing spaces
    expect(env.SUPABASE_URL).toBe(' https://example.supabase.co ');
  });
});
