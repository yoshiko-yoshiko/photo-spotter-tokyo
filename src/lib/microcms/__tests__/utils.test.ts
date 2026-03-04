import { describe, it, expect } from 'vitest';
import { cmsSpotToSpot } from '../utils';
import type { CMSSpot } from '../types';

function makeCMSSpot(overrides: Partial<CMSSpot> = {}): CMSSpot {
  return {
    id: 'spot-1',
    slug: 'test-spot',
    name: 'Test Spot',
    description: 'A test description',
    category: ['ランドマーク'],
    area: '渋谷',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    publishedAt: '2025-01-01T00:00:00.000Z',
    revisedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('cmsSpotToSpot', () => {
  it('converts a valid CMSSpot to Spot', () => {
    const cms = makeCMSSpot();
    const spot = cmsSpotToSpot(cms);

    expect(spot.id).toBe('spot-1');
    expect(spot.slug).toBe('test-spot');
    expect(spot.name).toBe('Test Spot');
    expect(spot.description).toBe('A test description');
    expect(spot.category).toBe('ランドマーク');
    expect(spot.area).toBe('渋谷');
    expect(spot.radius_m).toBe(100);
  });

  it('extracts the first element when category is an array', () => {
    const cms = makeCMSSpot({ category: ['寺社・歴史', '自然・公園'] });
    const spot = cmsSpotToSpot(cms);
    expect(spot.category).toBe('寺社・歴史');
  });

  it('returns empty string when category is an empty array', () => {
    const cms = makeCMSSpot({ category: [] });
    const spot = cmsSpotToSpot(cms);
    expect(spot.category).toBe('');
  });

  it('sets image_url to null when image is undefined', () => {
    const cms = makeCMSSpot({ image: undefined, imageUrl: undefined });
    const spot = cmsSpotToSpot(cms);
    expect(spot.image_url).toBeNull();
  });

  it('sets image_url from image.url when image is present', () => {
    const cms = makeCMSSpot({
      image: { url: 'https://example.com/photo.jpg', width: 800, height: 600 },
      imageUrl: undefined,
    });
    const spot = cmsSpotToSpot(cms);
    expect(spot.image_url).toBe('https://example.com/photo.jpg');
  });

  it('prefers imageUrl over image.url', () => {
    const cms = makeCMSSpot({
      imageUrl: 'https://cdn.example.com/img.jpg',
      image: { url: 'https://example.com/photo.jpg', width: 800, height: 600 },
    });
    const spot = cmsSpotToSpot(cms);
    expect(spot.image_url).toBe('https://cdn.example.com/img.jpg');
  });

  it('converts undefined optional fields to null', () => {
    const cms = makeCMSSpot({
      photoTip: undefined,
      bestTime: undefined,
      address: undefined,
    });
    const spot = cmsSpotToSpot(cms);
    expect(spot.photo_tip).toBeNull();
    expect(spot.best_time).toBeNull();
    expect(spot.address).toBeNull();
  });

  it('always sets is_active to true', () => {
    const spot = cmsSpotToSpot(makeCMSSpot());
    expect(spot.is_active).toBe(true);
  });
});
