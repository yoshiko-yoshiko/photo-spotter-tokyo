
-- 1. photo_likes: SELECT を認証ユーザーの自分のいいね + 公開写真のいいねに制限
DROP POLICY IF EXISTS "photo_likes_select_auth" ON public.photo_likes;

CREATE POLICY "photo_likes_select_auth"
  ON public.photo_likes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.photos 
      WHERE photos.id = photo_likes.photo_id 
      AND photos.is_public = true 
      AND photos.deleted_at IS NULL
    )
  );

-- 2. photo_reports: 管理者用ポリシー追加
CREATE POLICY "photo_reports_select_admin"
  ON public.photo_reports FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "photo_reports_update_admin"
  ON public.photo_reports FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. photos: 管理者用ポリシー追加
CREATE POLICY "photos_select_admin"
  ON public.photos FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "photos_update_admin"
  ON public.photos FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "photos_delete_admin"
  ON public.photos FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. user_roles: 管理者用 INSERT/UPDATE/DELETE
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. stamps: 管理者用 SELECT
CREATE POLICY "stamps_select_admin"
  ON public.stamps FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. user_rewards: 管理者用ポリシー
CREATE POLICY "user_rewards_select_admin"
  ON public.user_rewards FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_rewards_update_admin"
  ON public.user_rewards FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_rewards_delete_admin"
  ON public.user_rewards FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. user_blocks: 管理者用 SELECT
CREATE POLICY "user_blocks_select_admin"
  ON public.user_blocks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
