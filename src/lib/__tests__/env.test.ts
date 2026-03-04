import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('env', () => {
  it('reflects VITE_SUPABASE_URL when set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    const { env } = await import('@/lib/env');
    expect(env.SUPABASE_URL).toBe('https://test.supabase.co');
  });

  it('uses fallback when VITE_SUPABASE_URL is not set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const { env } = await import('@/lib/env');
    expect(env.SUPABASE_URL).toBe('');
  });

  it('reflects VITE_MICROCMS_API_KEY when set', async () => {
    vi.stubEnv('VITE_MICROCMS_API_KEY', 'test-api-key-123');
    const { env } = await import('@/lib/env');
    expect(env.MICROCMS_API_KEY).toBe('test-api-key-123');
  });

  it('uses fallback when VITE_MICROCMS_API_KEY is not set', async () => {
    vi.stubEnv('VITE_MICROCMS_API_KEY', '');
    const { env } = await import('@/lib/env');
    expect(env.MICROCMS_API_KEY).toBe('');
  });
});
