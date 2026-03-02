
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'like',
  title VARCHAR NOT NULL,
  body TEXT,
  photo_id UUID REFERENCES public.photos(id),
  actor_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow trigger inserts (SECURITY DEFINER function handles insert)
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Trigger function: create notification on photo like
CREATE OR REPLACE FUNCTION public.notify_on_photo_like()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_photo RECORD;
  v_actor_name TEXT;
BEGIN
  -- Get photo owner
  SELECT user_id, caption INTO v_photo FROM public.photos WHERE id = NEW.photo_id;
  
  -- Don't notify if liking own photo
  IF v_photo.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get liker's name
  SELECT nickname INTO v_actor_name FROM public.users WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, photo_id, actor_id)
  VALUES (
    v_photo.user_id,
    'like',
    v_actor_name || 'さんがいいねしました',
    COALESCE(v_photo.caption, '写真'),
    NEW.photo_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_photo_like_notify
  AFTER INSERT ON public.photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_photo_like();
