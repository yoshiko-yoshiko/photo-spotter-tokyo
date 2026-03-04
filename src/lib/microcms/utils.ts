import type { CMSSpot, Spot } from './types';

/** microCMS のレスポンスを既存コードが期待するSnakeCase形式に変換 */
export function cmsSpotToSpot(cms: CMSSpot): Spot {
  return {
    id: cms.id,
    slug: cms.slug,
    name: cms.name,
    description: cms.description || null,
    category: cms.category?.[0] || '',
    area: cms.area,
    latitude: cms.latitude,
    longitude: cms.longitude,
    address: cms.address || null,
    photo_tip: cms.photoTip || null,
    best_time: cms.bestTime || null,
    radius_m: cms.radiusM,
    image_url: cms.image?.url || null,
    is_active: true,
  };
}
