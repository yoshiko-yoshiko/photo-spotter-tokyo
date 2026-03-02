-- 管理者判定関数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      ''
    ) = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. users
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    VARCHAR(50) NOT NULL,
  avatar_url  VARCHAR(500),
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'google',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- 2. spots
CREATE TABLE public.spots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(30) NOT NULL CHECK (category IN (
                'ランドマーク', '寺社・歴史', '自然・公園', '都市・カルチャー'
              )),
  image_url   VARCHAR(500),
  latitude    DECIMAL(9,6) NOT NULL,
  longitude   DECIMAL(9,6) NOT NULL,
  address     VARCHAR(200),
  area        VARCHAR(30) NOT NULL CHECK (area IN (
                '港区', '台東区', '渋谷区', '墨田区', '千代田区', '新宿区'
              )),
  photo_tip   TEXT,
  best_time   VARCHAR(100),
  qr_code     VARCHAR(200),
  radius_m    INTEGER NOT NULL DEFAULT 100,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. photos
CREATE TABLE public.photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  spot_id       UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  storage_path  VARCHAR(500) NOT NULL,
  image_url     VARCHAR(500) NOT NULL,
  caption       TEXT,
  likes_count   INTEGER NOT NULL DEFAULT 0,
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- 4. stamps
CREATE TABLE public.stamps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  spot_id     UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  photo_id    UUID REFERENCES public.photos(id) ON DELETE SET NULL,
  method      VARCHAR(20) NOT NULL DEFAULT 'photo' CHECK (method IN ('photo', 'gps', 'qr', 'manual')),
  stamped_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, spot_id)
);

-- 5. rewards
CREATE TABLE public.rewards (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  type              VARCHAR(20) NOT NULL CHECK (type IN ('badge', 'coupon', 'certificate')),
  required_count    INTEGER NOT NULL,
  coupon_image_url  VARCHAR(500),
  badge_image_url   VARCHAR(500),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. user_rewards
CREATE TABLE public.user_rewards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id   UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at     TIMESTAMPTZ,
  UNIQUE (user_id, reward_id)
);

-- 7. photo_likes
CREATE TABLE public.photo_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_id    UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, photo_id)
);

-- 8. photo_reports
CREATE TABLE public.photo_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_id    UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  reason      VARCHAR(20) NOT NULL CHECK (reason IN (
                'spam', 'inappropriate', 'copyright', 'other'
              )),
  detail      TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                'pending', 'reviewed', 'actioned', 'dismissed'
              )),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (reporter_id, photo_id)
);

-- 9. user_blocks
CREATE TABLE public.user_blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- インデックス
CREATE INDEX idx_spots_location ON public.spots (latitude, longitude);
CREATE INDEX idx_spots_category ON public.spots (category);
CREATE INDEX idx_spots_area ON public.spots (area);
CREATE INDEX idx_spots_active ON public.spots (is_active) WHERE is_active = true;
CREATE INDEX idx_photos_user_created ON public.photos (user_id, created_at DESC);
CREATE INDEX idx_photos_spot_created ON public.photos (spot_id, created_at DESC);
CREATE INDEX idx_photos_public ON public.photos (is_public, deleted_at) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX idx_photos_public_active ON public.photos (spot_id, created_at DESC) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX idx_stamps_user ON public.stamps (user_id);
CREATE INDEX idx_photo_likes_photo ON public.photo_likes (photo_id);
CREATE INDEX idx_user_rewards_user ON public.user_rewards (user_id);
CREATE INDEX idx_photo_reports_status ON public.photo_reports (status);
CREATE INDEX idx_photo_reports_photo ON public.photo_reports (photo_id);
CREATE INDEX idx_user_blocks_blocker ON public.user_blocks (blocker_id);
CREATE INDEX idx_user_blocks_blocked ON public.user_blocks (blocked_id);

-- RLS: users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_active" ON public.users FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS: spots
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spots_select_active" ON public.spots FOR SELECT USING (is_active = true);

-- RLS: photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_select_public" ON public.photos FOR SELECT USING (is_public = true AND deleted_at IS NULL);
CREATE POLICY "photos_select_own" ON public.photos FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "photos_insert_auth" ON public.photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photos_update_own" ON public.photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "photos_delete_own" ON public.photos FOR DELETE USING (auth.uid() = user_id);

-- RLS: stamps
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stamps_select_all" ON public.stamps FOR SELECT USING (true);
CREATE POLICY "stamps_insert_auth" ON public.stamps FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_select_active" ON public.rewards FOR SELECT USING (is_active = true);

-- RLS: user_rewards
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_rewards_select_own" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_rewards_update_own" ON public.user_rewards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: photo_likes
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photo_likes_select_all" ON public.photo_likes FOR SELECT USING (true);
CREATE POLICY "photo_likes_insert_auth" ON public.photo_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photo_likes_delete_own" ON public.photo_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS: photo_reports
ALTER TABLE public.photo_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photo_reports_select_own" ON public.photo_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "photo_reports_insert_auth" ON public.photo_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- RLS: user_blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_blocks_select_own" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "user_blocks_insert_own" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "user_blocks_delete_own" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Triggers: updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_spots_updated_at BEFORE UPDATE ON public.spots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_photos_updated_at BEFORE UPDATE ON public.photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- auth.users → public.users 自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nickname, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'ユーザー'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'provider', 'google')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- likes_count カウンタ
CREATE OR REPLACE FUNCTION public.update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.photos SET likes_count = likes_count + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.photos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_photo_like_change
  AFTER INSERT OR DELETE ON public.photo_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_photo_likes_count();

-- スタンプ追加時の報酬自動解放
CREATE OR REPLACE FUNCTION public.check_and_unlock_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_stamp_count INTEGER;
  v_reward RECORD;
BEGIN
  SELECT COUNT(*) INTO v_stamp_count FROM public.stamps WHERE user_id = NEW.user_id;
  FOR v_reward IN
    SELECT r.id FROM public.rewards r
    WHERE r.is_active = true AND r.required_count <= v_stamp_count
      AND NOT EXISTS (SELECT 1 FROM public.user_rewards ur WHERE ur.user_id = NEW.user_id AND ur.reward_id = r.id)
  LOOP
    INSERT INTO public.user_rewards (user_id, reward_id) VALUES (NEW.user_id, v_reward.id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_stamp_created
  AFTER INSERT ON public.stamps
  FOR EACH ROW EXECUTE FUNCTION public.check_and_unlock_rewards();

-- Storage バケット
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png']);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('assets', 'assets', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml']);

-- Storage RLS
CREATE POLICY "photos_storage_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "photos_storage_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "photos_storage_delete_own" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "assets_storage_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'assets');