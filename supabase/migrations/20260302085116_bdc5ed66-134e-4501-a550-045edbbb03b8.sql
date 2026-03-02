
DROP POLICY "photo_likes_select_all" ON public.photo_likes;

CREATE POLICY "photo_likes_select_auth" ON public.photo_likes FOR SELECT
USING ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
