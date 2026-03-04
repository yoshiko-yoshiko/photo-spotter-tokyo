-- photo_comments テーブル
CREATE TABLE public.photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments(photo_id);
CREATE INDEX idx_photo_comments_user_id ON public.photo_comments(user_id);

ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON public.photo_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert comments"
  ON public.photo_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete own comments"
  ON public.photo_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- photos テーブルに comments_count 追加
ALTER TABLE public.photos ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0;
