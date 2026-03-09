import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { geocodeAddress, isCoordsMissing } from '@/features/map/lib/geocode';
import type { Spot } from '@/lib/microcms/types';

interface SpotMeta {
  category: string;
  name: string;
}

interface SpotIdMapData {
  byMicrocmsId: Record<string, string>;
  bySlug: Record<string, string>;
  metaByMicrocmsId: Record<string, SpotMeta>;
}

const SPOT_METADATA_FIELDS = [
  'name', 'category', 'area', 'description',
  'photo_tip', 'best_time', 'image_url',
] as const;

type SpotMetadataPayload = Pick<Spot, (typeof SPOT_METADATA_FIELDS)[number]>;

function buildMetadataPayload(spot: Spot): SpotMetadataPayload {
  return Object.fromEntries(
    SPOT_METADATA_FIELDS.map(k => [k, spot[k]])
  ) as SpotMetadataPayload;
}

function logSyncError(context: string, slug: string, error: unknown) {
  if (!import.meta.env.DEV) return;
  const msg = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: string }).message)
    : String(error);
  console.error(`[spot-sync] ${context}:`, slug, msg);
}

/**
 * microCMS id → Supabase UUID のマッピング + メタデータ差分検知用データ
 */
export function useSpotIdMap() {
  return useQuery<SpotIdMapData>({
    queryKey: ['spot-id-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('id, microcms_id, slug, category, name');
      if (error) throw error;

      const byMicrocmsId: Record<string, string> = {};
      const bySlug: Record<string, string> = {};
      const metaByMicrocmsId: Record<string, SpotMeta> = {};

      for (const row of data ?? []) {
        if (row.microcms_id) {
          byMicrocmsId[row.microcms_id] = row.id;
          metaByMicrocmsId[row.microcms_id] = {
            category: row.category,
            name: row.name,
          };
        }
        if (row.slug) bySlug[row.slug] = row.id;
      }

      return { byMicrocmsId, bySlug, metaByMicrocmsId };
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * microCMS → Supabase 自動同期
 * 1. 新規スポット → insert（座標がなければGeocoding）
 * 2. 既存スポットの座標欠損 → Geocoding補完
 * 3. 既存スポットのメタデータ乖離 → 差分update
 */
export function useSpotIdSync(spots: Spot[]) {
  const queryClient = useQueryClient();
  const { data: idMap } = useSpotIdMap();
  const { isAuthenticated } = useAuth();
  const geocodedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !idMap || spots.length === 0) return;

    const refetch = (...keys: string[]) =>
      Promise.all(keys.map(k => queryClient.refetchQueries({ queryKey: [k] })));

    const insertMissing = async () => {
      const missing = spots.filter(s => !idMap.byMicrocmsId[s.id]);
      if (missing.length === 0) return;

      let changed = false;
      for (const spot of missing) {
        let { latitude, longitude } = spot;
        if (isCoordsMissing(latitude, longitude) && spot.address) {
          const coords = await geocodeAddress(spot.address);
          if (coords) ({ latitude, longitude } = coords);
        }

        const { error } = await supabase.from('spots').insert({
          microcms_id: spot.id,
          slug: spot.slug,
          ...buildMetadataPayload(spot),
          latitude,
          longitude,
          address: spot.address,
          radius_m: spot.radius_m || 100,
          is_active: true,
        });

        if (error) {
          const msg = typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: string }).message) : String(error);
          if (!msg.includes('duplicate')) logSyncError('insert', spot.slug, error);
        } else {
          changed = true;
        }
      }

      if (changed) await refetch('spot-id-map', 'spots');
    };

    const geocodeMissingCoords = async () => {
      let updated = false;
      for (const spot of spots) {
        const supabaseId = idMap.byMicrocmsId[spot.id];
        if (!supabaseId || geocodedRef.current.has(spot.id)) continue;
        if (!isCoordsMissing(spot.latitude, spot.longitude) || !spot.address) continue;

        geocodedRef.current.add(spot.id);
        const coords = await geocodeAddress(spot.address);
        if (!coords) continue;

        const { error } = await supabase
          .from('spots')
          .update({ latitude: coords.latitude, longitude: coords.longitude })
          .eq('id', supabaseId);

        if (error) logSyncError('geocode', spot.slug, error);
        else updated = true;
      }

      if (updated) await refetch('spots');
    };

    const syncStaleMetadata = async () => {
      const { metaByMicrocmsId: meta, byMicrocmsId } = idMap;

      const stale = spots.filter(spot => {
        const dbMeta = meta[spot.id];
        if (!dbMeta || !byMicrocmsId[spot.id]) return false;
        return dbMeta.category !== spot.category || dbMeta.name !== spot.name;
      });
      if (stale.length === 0) return;

      let updated = false;
      for (const spot of stale) {
        const { error } = await supabase
          .from('spots')
          .update(buildMetadataPayload(spot))
          .eq('id', byMicrocmsId[spot.id]);

        if (error) logSyncError('metadata', spot.slug, error);
        else updated = true;
      }

      if (updated) await refetch('spot-id-map');
    };

    insertMissing();
    geocodeMissingCoords();
    syncStaleMetadata();
  }, [isAuthenticated, idMap, spots, queryClient]);
}
