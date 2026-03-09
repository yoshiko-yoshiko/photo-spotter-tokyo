import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StampsGrid } from '../stamps-grid';
import type { Spot } from '@/lib/microcms/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/map/lib/map-utils', () => ({
  CATEGORY_COLORS: { shrine: '#E53E3E', park: '#38A169' } as Record<string, string>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

function makeSpot(overrides: Partial<Spot> = {}): Spot {
  return {
    id: 's1',
    name: 'テストスポット',
    slug: 'test-spot',
    category: 'shrine',
    image_url: 'https://example.com/img.jpg',
    description: 'テスト',
    latitude: 35.6,
    longitude: 139.7,
    address: '東京都',
    ...overrides,
  } as Spot;
}

describe('StampsGrid', () => {
  it('shows loading skeletons when isLoading is true', () => {
    render(
      <StampsGrid
        spots={[]}
        stampedSpotIds={new Set()}
        idMap={undefined}
        isLoading={true}
      />
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders spot names', () => {
    const spots = [
      makeSpot({ id: 's1', name: '浅草寺', slug: 'sensoji' }),
      makeSpot({ id: 's2', name: '上野公園', slug: 'ueno-park', category: 'park' }),
    ];

    render(
      <StampsGrid
        spots={spots}
        stampedSpotIds={new Set()}
        idMap={{ byMicrocmsId: {} }}
        isLoading={false}
      />
    );

    expect(screen.getByText('浅草寺')).toBeInTheDocument();
    expect(screen.getByText('上野公園')).toBeInTheDocument();
  });

  it('shows collected state for stamped spots', () => {
    const spots = [makeSpot({ id: 'cms1', name: 'テスト神社' })];
    const idMap = { byMicrocmsId: { cms1: 'supabase-uuid-1' } };

    const { container } = render(
      <StampsGrid
        spots={spots}
        stampedSpotIds={new Set(['supabase-uuid-1'])}
        idMap={idMap}
        isLoading={false}
      />
    );

    // Collected spots should not have grayscale
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-primary');
    expect(button?.className).not.toContain('grayscale');
  });

  it('shows uncollected state for non-stamped spots', () => {
    const spots = [makeSpot({ id: 'cms1', name: '未訪問スポット' })];

    const { container } = render(
      <StampsGrid
        spots={spots}
        stampedSpotIds={new Set()}
        idMap={{ byMicrocmsId: {} }}
        isLoading={false}
      />
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('grayscale');
  });

  it('renders nothing when spots array is empty and not loading', () => {
    const { container } = render(
      <StampsGrid
        spots={[]}
        stampedSpotIds={new Set()}
        idMap={undefined}
        isLoading={false}
      />
    );

    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  // --- QA追加テスト ---

  it('navigates to spot detail page when spot is clicked', () => {
    const spots = [makeSpot({ id: 's1', name: '浅草寺', slug: 'sensoji' })];

    render(
      <StampsGrid
        spots={spots}
        stampedSpotIds={new Set()}
        idMap={{ byMicrocmsId: {} }}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByText('浅草寺'));
    expect(mockNavigate).toHaveBeenCalledWith('/spots/sensoji');
  });

  it('navigates to correct slug for each spot', () => {
    const spots = [
      makeSpot({ id: 's1', name: '浅草寺', slug: 'sensoji' }),
      makeSpot({ id: 's2', name: '上野公園', slug: 'ueno-park' }),
    ];

    render(
      <StampsGrid
        spots={spots}
        stampedSpotIds={new Set()}
        idMap={{ byMicrocmsId: {} }}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByText('上野公園'));
    expect(mockNavigate).toHaveBeenCalledWith('/spots/ueno-park');
  });
});
