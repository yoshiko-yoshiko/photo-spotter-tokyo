import type { Tables } from '@/lib/supabase/types';

export interface NewReward {
  id: string;
  name: string;
  type: string;
  badge_image_url: string | null;
  description: string | null;
}

export interface RewardUnlockOverlayProps {
  rewards: NewReward[];
  open: boolean;
  onClose: () => void;
}

export interface RewardDetailModalProps {
  open: boolean;
  onClose: () => void;
  reward: Tables<'rewards'> | null;
  isUnlocked: boolean;
  stampCount: number;
  usedAt?: string | null;
}

export interface ConfettiCanvasProps {
  active: boolean;
  duration?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}
