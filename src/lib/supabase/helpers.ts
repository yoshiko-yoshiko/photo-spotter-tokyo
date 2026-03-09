/**
 * Supabase shared helpers
 *
 * Table name constants and common query utilities used across hooks.
 */

/** Canonical table names — use these instead of string literals. */
export const Tables = {
  PHOTOS: 'photos',
  SPOTS: 'spots',
  NOTIFICATIONS: 'notifications',
  USERS: 'users',
  STAMPS: 'stamps',
  REWARDS: 'rewards',
  BLOCKED_USERS: 'blocked_users',
  PHOTO_LIKES: 'photo_likes',
  PHOTO_COMMENTS: 'photo_comments',
} as const;

/**
 * Unwrap a Supabase query result, throwing on error or null data.
 *
 * @example
 * const photos = await queryOrThrow(
 *   supabase.from(Tables.PHOTOS).select('*').eq('user_id', uid)
 * );
 */
export async function queryOrThrow<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  if (data === null) throw new Error('No data returned');
  return data;
}

/**
 * Common filter pattern: active (non-deleted), public rows.
 *
 * Supabase's query builder uses method chaining with per-call type narrowing,
 * so a generic wrapper cannot preserve the builder type without coupling to
 * internal generics. Apply these filters directly in each hook instead:
 *
 *   .eq('is_public', true)
 *   .is('deleted_at', null)
 */
