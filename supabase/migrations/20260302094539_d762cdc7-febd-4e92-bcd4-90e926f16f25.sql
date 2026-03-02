-- Fix 1: users table - restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_select_active" ON public.users;
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Fix 2: stamps table - drop any overly permissive select policy
DROP POLICY IF EXISTS "stamps_select_all" ON public.stamps;