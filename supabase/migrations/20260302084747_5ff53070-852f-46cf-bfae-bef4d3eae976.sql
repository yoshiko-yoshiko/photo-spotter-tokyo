
DROP POLICY "stamps_select_all" ON public.stamps;

CREATE POLICY "stamps_select_own"
ON public.stamps FOR SELECT
USING (auth.uid() = user_id);
