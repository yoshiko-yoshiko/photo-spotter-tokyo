import type { LucideIcon } from 'lucide-react';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  photo_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
  spot_id: string | null;
  spot_slug: string | null;
}

export interface NotificationIconConfig {
  icon: LucideIcon;
  bg: string;
  color: string;
}
