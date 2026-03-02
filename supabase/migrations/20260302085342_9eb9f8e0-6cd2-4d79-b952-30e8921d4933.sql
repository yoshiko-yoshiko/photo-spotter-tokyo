
-- 1. Create enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS on user_roles
CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 5. spots: admin-only write
CREATE POLICY "spots_insert_admin" ON public.spots FOR INSERT
TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "spots_update_admin" ON public.spots FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "spots_delete_admin" ON public.spots FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. rewards: admin-only write
CREATE POLICY "rewards_insert_admin" ON public.rewards FOR INSERT
TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "rewards_update_admin" ON public.rewards FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "rewards_delete_admin" ON public.rewards FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. stamps: users can delete own
CREATE POLICY "stamps_delete_own" ON public.stamps FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- 8. photo_reports: users can delete own pending
CREATE POLICY "photo_reports_delete_own_pending" ON public.photo_reports FOR DELETE
TO authenticated USING (auth.uid() = reporter_id AND status = 'pending');

-- 9. users: users can delete own account
CREATE POLICY "users_delete_own" ON public.users FOR DELETE
TO authenticated USING (auth.uid() = id);
