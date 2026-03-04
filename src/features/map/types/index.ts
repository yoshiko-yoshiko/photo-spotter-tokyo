import type { Spot } from '@/lib/microcms/types';

export type MapViewMode = 'map' | 'list';

export interface SpotCardProps {
  spot: Spot;
  isVisited: boolean;
  onClick: () => void;
}
