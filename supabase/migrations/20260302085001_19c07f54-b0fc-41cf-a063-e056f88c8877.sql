
-- user_blocks: restrict all policies to non-anonymous users
DROP POLICY "user_blocks_select_own" ON public.user_blocks;
DROP POLICY "user_blocks_insert_own" ON public.user_blocks;
DROP POLICY "user_blocks_delete_own" ON public.user_blocks;

CREATE POLICY "user_blocks_select_own" ON public.user_blocks FOR SELECT
USING (auth.uid() = blocker_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "user_blocks_insert_own" ON public.user_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "user_blocks_delete_own" ON public.user_blocks FOR DELETE
USING (auth.uid() = blocker_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- photo_reports: restrict to non-anonymous users
DROP POLICY "photo_reports_select_own" ON public.photo_reports;
DROP POLICY "photo_reports_insert_auth" ON public.photo_reports;

CREATE POLICY "photo_reports_select_own" ON public.photo_reports FOR SELECT
USING (auth.uid() = reporter_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "photo_reports_insert_auth" ON public.photo_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

-- user_rewards: restrict to non-anonymous users
DROP POLICY "user_rewards_select_own" ON public.user_rewards;
DROP POLICY "user_rewards_update_own" ON public.user_rewards;
DROP POLICY "user_rewards_insert_trigger" ON public.user_rewards;

CREATE POLICY "user_rewards_select_own" ON public.user_rewards FOR SELECT
USING (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "user_rewards_update_own" ON public.user_rewards FOR UPDATE
USING (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "user_rewards_insert_trigger" ON public.user_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
