
-- 1. users: 公開SELECTを認証済みユーザーのみに制限
DROP POLICY IF EXISTS "users_select_public_profile" ON public.users;

CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  USING (
    deleted_at IS NULL
    AND ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  );

-- 2. stamps: 不正なstamps_select_allポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "stamps_select_all" ON public.stamps;
