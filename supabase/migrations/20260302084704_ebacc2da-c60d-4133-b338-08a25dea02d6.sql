
DROP POLICY "users_select_active" ON public.users;

CREATE POLICY "users_select_active"
ON public.users FOR SELECT
USING (deleted_at IS NULL AND auth.uid() = id);
