import { useMemo } from 'react';
import type { Spot } from '@/lib/microcms/types';

interface UseSpotFilterOptions {
  spots: Spot[] | undefined;
  searchQuery: string;
  selectedCategory: string;
  selectedArea: string;
}

function matchSearch(spot: Spot, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    spot.name.toLowerCase().includes(q) ||
    (spot.area || '').toLowerCase().includes(q) ||
    (spot.description || '').toLowerCase().includes(q) ||
    (spot.photo_tip || '').toLowerCase().includes(q)
  );
}

function matchCategory(spot: Spot, category: string): boolean {
  return category === '全て' || spot.category === category;
}

function matchArea(spot: Spot, area: string): boolean {
  return area === '全エリア' || spot.area === area;
}

export function useSpotFilter({
  spots,
  searchQuery,
  selectedCategory,
  selectedArea,
}: UseSpotFilterOptions): Spot[] {
  return useMemo(() => {
    if (!spots) return [];
    return spots.filter(
      (spot) =>
        matchSearch(spot, searchQuery) &&
        matchCategory(spot, selectedCategory) &&
        matchArea(spot, selectedArea)
    );
  }, [spots, searchQuery, selectedCategory, selectedArea]);
}
