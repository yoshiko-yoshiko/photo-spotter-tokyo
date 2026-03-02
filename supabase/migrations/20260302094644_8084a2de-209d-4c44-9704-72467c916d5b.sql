-- Fix users SELECT: make it PERMISSIVE + TO authenticated
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Also fix users INSERT/UPDATE/DELETE to TO authenticated
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_delete_own" ON public.users;
CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE TO authenticated
  USING (auth.uid() = id);