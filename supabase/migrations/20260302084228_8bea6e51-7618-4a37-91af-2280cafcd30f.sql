
-- Add unique constraint on stamps to prevent duplicate check-ins per spot per user
ALTER TABLE public.stamps
ADD CONSTRAINT stamps_user_spot_unique UNIQUE (user_id, spot_id);

-- Storage RLS policies for photos bucket
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view all photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'photos');

CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'photos');

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add insert policy for user_rewards (needed by trigger)
CREATE POLICY "user_rewards_insert_trigger"
ON public.user_rewards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
