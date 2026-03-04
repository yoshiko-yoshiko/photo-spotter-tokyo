import type { Tables } from '@/lib/supabase/types';

export interface TimelinePostUser {
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface TimelinePost extends Tables<'photos'> {
  users: TimelinePostUser | null;
}

export interface TimelinePageData {
  posts: TimelinePost[];
  nextCursor: number | null;
}
