import type { Tables } from '@/lib/supabase/types';

export interface PhotoCardProps {
  photo: Tables<'photos'>;
}

export interface PhotoGalleryProps {
  spotId: string;
  slug?: string;
}

export interface ToggleLikeParams {
  photoId: string;
  isLiked: boolean;
}

export interface ReportPhotoParams {
  photoId: string;
  reporterId: string;
  reason: string;
  detail?: string;
}
