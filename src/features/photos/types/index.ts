import type { Tables } from '@/lib/supabase/types';

export type PhotoWithUser = Tables<'photos'> & {
  users: { nickname: string; avatar_url: string | null } | null;
};

export interface PhotoCardProps {
  photo: PhotoWithUser;
  onClick?: () => void;
}

export interface PhotoGalleryProps {
  spotId: string;
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
