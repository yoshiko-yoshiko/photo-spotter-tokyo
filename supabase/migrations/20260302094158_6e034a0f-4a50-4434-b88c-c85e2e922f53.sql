
-- 1. users: RESTRICTIVEポリシーを修正して認証必須にする
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- 認証済みユーザーのみプロフィール閲覧可能
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- 自分のデータのみINSERT/UPDATE/DELETE可能（認証済みのみ）
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own"
  ON public.users FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 2. photos: 公開写真のSELECTを認証済みユーザーのみに制限
DROP POLICY IF EXISTS "photos_select_public" ON public.photos;
DROP POLICY IF EXISTS "photos_select_own" ON public.photos;
DROP POLICY IF EXISTS "photos_insert_auth" ON public.photos;
DROP POLICY IF EXISTS "photos_update_own" ON public.photos;
DROP POLICY IF EXISTS "photos_delete_own" ON public.photos;

-- 公開写真は認証済みユーザーのみ閲覧可能
CREATE POLICY "photos_select_public"
  ON public.photos FOR SELECT
  TO authenticated
  USING (is_public = true AND deleted_at IS NULL);

-- 自分の写真（非公開含む）は自分のみ閲覧可能
CREATE POLICY "photos_select_own"
  ON public.photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "photos_insert_auth"
  ON public.photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photos_update_own"
  ON public.photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "photos_delete_own"
  ON public.photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. photo_likes: 認証済みユーザーのみに制限
DROP POLICY IF EXISTS "photo_likes_select_auth" ON public.photo_likes;
DROP POLICY IF EXISTS "photo_likes_insert_auth" ON public.photo_likes;
DROP POLICY IF EXISTS "photo_likes_delete_own" ON public.photo_likes;

CREATE POLICY "photo_likes_select_auth"
  ON public.photo_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "photo_likes_insert_auth"
  ON public.photo_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photo_likes_delete_own"
  ON public.photo_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. photo_reports: 認証済みユーザーのみに制限
DROP POLICY IF EXISTS "photo_reports_select_own" ON public.photo_reports;
DROP POLICY IF EXISTS "photo_reports_insert_auth" ON public.photo_reports;
DROP POLICY IF EXISTS "photo_reports_delete_own_pending" ON public.photo_reports;

CREATE POLICY "photo_reports_select_own"
  ON public.photo_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "photo_reports_insert_auth"
  ON public.photo_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "photo_reports_delete_own_pending"
  ON public.photo_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = reporter_id AND status = 'pending');
