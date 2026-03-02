
-- 1. users: 既存の自分のみSELECTポリシーを削除し、公開プロフィール用と自分用に分離
DROP POLICY IF EXISTS "users_select_active" ON public.users;

-- 公開プロフィール（nickname, avatar_url のみ必要だがRLSは行レベル。削除されていないユーザーは誰でも見える）
CREATE POLICY "users_select_public_profile"
  ON public.users FOR SELECT
  USING (deleted_at IS NULL);

-- 2. stamps: 匿名ユーザーチェックを追加
DROP POLICY IF EXISTS "stamps_select_own" ON public.stamps;
DROP POLICY IF EXISTS "stamps_insert_auth" ON public.stamps;
DROP POLICY IF EXISTS "stamps_delete_own" ON public.stamps;

CREATE POLICY "stamps_select_own"
  ON public.stamps FOR SELECT
  USING (
    auth.uid() = user_id
    AND ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  );

CREATE POLICY "stamps_insert_auth"
  ON public.stamps FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  );

CREATE POLICY "stamps_delete_own"
  ON public.stamps FOR DELETE
  USING (
    auth.uid() = user_id
    AND ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  );
