import type { Tables } from '@/lib/supabase/types';

export type MapViewMode = 'map' | 'list';

export interface SpotCardProps {
  spot: Tables<'spots'>;
  isVisited: boolean;
  onClick: () => void;
}
